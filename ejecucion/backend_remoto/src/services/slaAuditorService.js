const pool = require('../config/postgresPool');
const notificacionService = require('./notificacionService');
const { config } = require('../config/config');

const SCHEMA = config.dbSchema || 'sch_leangsp';

/**
 * slaAuditorService.js
 * Servicio Auditor de SLA de Validación PMO (Spec 57 / REQ-026)
 * 
 * Regla de Negocio:
 * El Analista tiene hasta el día hábil siguiente al término del servicio hasta las 13:00 hrs
 * para validar todos los reports de terreno y formular/cerrar el ITS.
 * Si a las 13:00 hrs el servicio no está validado/cerrado, se genera alerta por WhatsApp
 * y correo a Yiara Mendoza (Control de Flota) y Jorge Ponce (Coordinación Operaciones).
 */
const slaAuditorService = {
  /**
   * Obtiene la hora actual en Chile continental (America/Santiago)
   */
  getHoraChile() {
    const ahora = new Date();
    const strHora = ahora.toLocaleTimeString('en-GB', { timeZone: 'America/Santiago', hour12: false });
    const strFecha = ahora.toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });
    const [h, m] = strHora.split(':').map(Number);
    return { hora: h, minutos: m, fechaStr: strFecha, timeStr: strHora };
  },

  /**
   * Audita qué OTs han concluido su faena y tienen pendiente validación PMO o cierre de ITS
   * superando el umbral de las 13:00 hrs del día posterior.
   */
  async auditarIncumplimientosSLA() {
    const { hora, minutos, fechaStr } = this.getHoraChile();

    // Consultar reports de faena que terminaron antes de hoy (o ayer) y siguen sin validar
    const query = `
      SELECT 
        ra.id_reporte_avance,
        ra.id_proyecto,
        ra.dia_correlativo,
        ra.fecha_reporte,
        ra.estado_reporte,
        p.codi_proyecto,
        COALESCE(p.nombre_proyecto, 'Servicio de Izaje') AS nombre_proyecto,
        p.id_proyecto_estado,
        p.json_field,
        COALESCE(clt.razon_social, clt.name_empresa, p.json_field->'crm_v1'->>'cliente_nombre', 'Cliente') AS cliente_nombre,
        COALESCE(e.patente, 'S/P') AS equipo_patente,
        COALESCE(e.modelo, 'Grúa') AS equipo_modelo,
        its.id_its,
        its.folio_its,
        its.estado_its
      FROM ${SCHEMA}.tedp_reporte_avance ra
      JOIN ${SCHEMA}.tpry_proyecto p ON ra.id_proyecto = p.id_proyecto
      LEFT JOIN ${SCHEMA}.tpar_empresas clt ON p.id_empresa_cliente = clt.id_empresa
      LEFT JOIN ${SCHEMA}.tequ_equipo e ON ra.id_equipo = e.id_equipo
      LEFT JOIN ${SCHEMA}.tits_informe_termino its ON p.id_proyecto = its.id_proyecto
      WHERE p.id_proyecto_estado NOT IN (7, 8, 9) -- No cerrados ni cancelados
        AND ra.fecha_reporte < CURRENT_DATE -- Faena operada en días anteriores
        AND (
          ra.estado_reporte = 'PENDIENTE_VALIDACION'
          OR its.estado_its IS NULL
          OR its.estado_its IN ('BORRADOR', 'PENDIENTE_ELABORACION')
        )
      ORDER BY ra.fecha_reporte ASC, ra.id_reporte_avance ASC;
    `;

    const res = await pool.query(query);
    const gruposPorOT = {};

    for (const r of res.rows) {
      if (!gruposPorOT[r.id_proyecto]) {
        gruposPorOT[r.id_proyecto] = {
          id_proyecto: r.id_proyecto,
          codi_proyecto: r.codi_proyecto,
          nombre_proyecto: r.nombre_proyecto,
          cliente_nombre: r.cliente_nombre,
          equipo_patente: r.equipo_patente,
          equipo_modelo: r.equipo_modelo,
          id_its: r.id_its,
          folio_its: r.folio_its,
          estado_its: r.estado_its || 'NO_INICIADO',
          json_field: r.json_field || {},
          reports_pendientes: [],
          fechas_faena: []
        };
      }
      gruposPorOT[r.id_proyecto].reports_pendientes.push({
        id_reporte_avance: r.id_reporte_avance,
        dia_correlativo: r.dia_correlativo,
        fecha_reporte: r.fecha_reporte,
        estado_reporte: r.estado_reporte
      });
      const fStr = new Date(r.fecha_reporte).toLocaleDateString('es-CL');
      if (!gruposPorOT[r.id_proyecto].fechas_faena.includes(fStr)) {
        gruposPorOT[r.id_proyecto].fechas_faena.push(fStr);
      }
    }

    const otsIncumplidas = Object.values(gruposPorOT).map(ot => {
      // Determinar si ya se alertó hoy
      const alertaHoy = ot.json_field?.sla_alertas?.fecha_ultima_alerta === fechaStr;
      const motivo = ot.reports_pendientes.some(x => x.estado_reporte === 'PENDIENTE_VALIDACION')
        ? `Reports de faena sin validar (${ot.reports_pendientes.length} reporte(s) pendiente(s))`
        : `ITS pendiente de formulación y firma (${ot.folio_its || 'Sin ITS'})`;

      return {
        ...ot,
        motivo,
        alerta_enviada_hoy: alertaHoy,
        es_despues_de_13hrs: hora >= 13
      };
    });

    return {
      hora_actual_chile: `${hora.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`,
      es_horario_alerta: hora >= 13,
      fecha_evaluada: fechaStr,
      total_ots_incumplidas: otsIncumplidas.length,
      ots: otsIncumplidas
    };
  },

  /**
   * Ejecuta el despacho de alertas WhatsApp y correo a Yiara y Jorge
   * para todas las OTs que hayan incumplido y no hayan sido alertadas hoy.
   */
  async ejecutarAlertasSLA(forzar = false) {
    const isProd = process.env.APP_ENV === 'prod' || process.env.NODE_ENV === 'production' || SCHEMA === 'sch_leangsp_prod';
    if (!isProd && !forzar) {
      return {
        success: false,
        message: 'Despacho automático de alertas SLA desactivado en ambiente DEV para evitar envíos programados de prueba a usuarios reales.',
        total_alertadas: 0
      };
    }

    const auditoria = await this.auditarIncumplimientosSLA();
    const { es_horario_alerta, fecha_evaluada, ots } = auditoria;

    if (!es_horario_alerta && !forzar) {
      return {
        success: false,
        message: `Aún no son las 13:00 hrs en Chile (Hora actual: ${auditoria.hora_actual_chile}). Alerta programada para las 13:00 hrs.`,
        auditoria
      };
    }

    const otsParaAlertar = ots.filter(o => forzar || !o.alerta_enviada_hoy);
    if (otsParaAlertar.length === 0) {
      return {
        success: true,
        message: 'No existen OTs con incumplimiento de SLA pendientes de notificar hoy.',
        total_alertadas: 0,
        auditoria
      };
    }

    // Contactos oficiales canónicos para la alerta SLA
    const destinatarios = [
      {
        nombre: 'Yiara Mendoza',
        cargo: 'Control de Flota',
        telefono: '+56968320225',
        email: 'controlflota@arriendosanpablo.cl'
      },
      {
        nombre: 'Jorge Ponce',
        cargo: 'Coordinador de Operaciones',
        telefono: '+56977501322',
        email: 'j.poncenavarrete@gmail.com'
      }
    ];

    const resultadosDespacho = [];

    for (const ot of otsParaAlertar) {
      const fechasTexto = ot.fechas_faena.join(', ');
      const deepLinkUrl = notificacionService.construirDeepLink({
        tipoApp: 'WEB',
        ruta: 'torre',
        params: { id_proyecto: ot.id_proyecto }
      });

      const mensajeWsp = `🚨 *ALERTA SLA PMO (13:00 hrs) — Grúas San Pablo*\n\n` +
        `Estimados Yiara y Jorge,\n` +
        `Ha vencido el plazo de las 13:00 hrs sin validación completa del Analista para el siguiente servicio:\n\n` +
        `📋 *OT:* ${ot.codi_proyecto}\n` +
        `🏢 *Cliente:* ${ot.cliente_nombre}\n` +
        `🚚 *Equipo:* ${ot.equipo_patente} (${ot.equipo_modelo})\n` +
        `📅 *Fecha(s) Faena:* ${fechasTexto}\n` +
        `⚠️ *Incumplimiento:* ${ot.motivo}\n\n` +
        `📲 *Gestionar en Torre de Control PMO:* ${deepLinkUrl}`;

      // Despacho a cada destinatario
      for (const d of destinatarios) {
        try {
          await notificacionService.despacharNotificacion({
            evento: 'SLA_INCUMPLIMIENTO_PMO_13HRS',
            canales: ['EMAIL', 'WHATSAPP'],
            destinatario: {
              nombre: d.nombre,
              email: d.email,
              telefono: d.telefono
            },
            deepLink: {
              tipoApp: 'WEB',
              ruta: 'torre',
              params: { id_proyecto: ot.id_proyecto }
            },
            emailData: {
              asunto: `[ALERTA SLA 13:00 hrs] Validación Pendiente: OT ${ot.codi_proyecto} - ${ot.cliente_nombre}`,
              titulo: `Alerta de SLA Operacional: Plazo 13:00 hrs Vencido`,
              subtitulo: `OT ${ot.codi_proyecto} sin validación ni cierre de ITS oportuno`,
              contenido: `<p>Se informa que ha vencido el SLA diario fijado a las 13:00 hrs para la revisión del Analista PMO sobre el servicio indicado:</p>
                <ul>
                  <li><strong>OT:</strong> ${ot.codi_proyecto}</li>
                  <li><strong>Mandante:</strong> ${ot.cliente_nombre}</li>
                  <li><strong>Equipo:</strong> ${ot.equipo_patente} (${ot.equipo_modelo})</li>
                  <li><strong>Fechas de Operación:</strong> ${fechasTexto}</li>
                  <li><strong>Detalle:</strong> ${ot.motivo}</li>
                </ul>
                <p>Por favor coordinar inmediatamente con el Analista de Operaciones para regularizar la emisión del ITS.</p>`,
              botonTexto: 'IR A TORRE DE CONTROL PMO'
            },
            wspData: {
              mensaje: mensajeWsp
            }
          });
        } catch (notifErr) {
          console.warn(`[SLA] Error notificando a ${d.nombre}:`, notifErr.message);
        }
      }

      // Marcar alerta como enviada hoy en el JSON de la OT
      try {
        await pool.query(`
          UPDATE ${SCHEMA}.tpry_proyecto
          SET json_field = jsonb_set(
            COALESCE(json_field, '{}'::jsonb),
            '{sla_alertas}',
            $1::jsonb,
            true
          )
          WHERE id_proyecto = $2;
        `, [
          JSON.stringify({
            fecha_ultima_alerta: fecha_evaluada,
            timestamp_alerta: new Date().toISOString(),
            destinatarios: destinatarios.map(x => x.nombre),
            motivo: ot.motivo
          }),
          ot.id_proyecto
        ]);
      } catch (dbErr) {
        console.warn(`[SLA] Error registrando alerta en OT ${ot.id_proyecto}:`, dbErr.message);
      }

      resultadosDespacho.push({
        id_proyecto: ot.id_proyecto,
        codi_proyecto: ot.codi_proyecto,
        cliente: ot.cliente_nombre,
        notificados: destinatarios.map(x => x.nombre)
      });
    }

    return {
      success: true,
      message: `Se enviaron alertas SLA para ${resultadosDespacho.length} OT(s) a Yiara Mendoza y Jorge Ponce.`,
      fecha_evaluada,
      total_alertadas: resultadosDespacho.length,
      alertadas: resultadosDespacho
    };
  }
};

module.exports = slaAuditorService;
