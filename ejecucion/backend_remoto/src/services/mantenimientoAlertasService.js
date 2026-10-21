const pool = require('../config/postgresPool');
const notificacionService = require('./notificacionService');
const { config } = require('../config/config');

const SCHEMA = config.dbSchema || 'sch_leangsp';

class MantenimientoAlertasService {
  constructor() {
    this.pool = pool;
    // Cache en memoria para evitar spam de alertas en menos de 24 horas: key -> timestamp
    this.alertasEnviadasCache = new Map();
  }

  _yaFueAlertado(clave, cooldownHoras = 24) {
    const ahora = Date.now();
    const ultimoEnvio = this.alertasEnviadasCache.get(clave);
    if (!ultimoEnvio) return false;
    return (ahora - ultimoEnvio) < (cooldownHoras * 3600 * 1000);
  }

  _marcarAlertado(clave) {
    this.alertasEnviadasCache.set(clave, Date.now());
  }

  /**
   * Ejecuta auditoría periódica de alertas de mantenimiento:
   * 1. Pautas preventivas próximas o vencidas por horómetro
   * 2. OTs envejecidas (Aging OTs)
   * 3. Certificaciones de grúas próximas a vencer
   */
  async ejecutarAlertasMantenimiento(empresaId = 9, forzar = false) {
    const resultados = {
      pautas_alertadas: 0,
      ots_envejecidas_alertadas: 0,
      certificaciones_alertadas: 0,
      errores: []
    };

    const isProd = process.env.APP_ENV === 'prod' || process.env.NODE_ENV === 'production' || SCHEMA === 'sch_leangsp_prod';
    if (!isProd && !forzar) {
      return resultados;
    }

    try {
      // 1. AUDITORÍA DE PAUTAS PREVENTIVAS POR HORÓMETRO
      const sqlPautas = `
        SELECT 
          e.id_equipo,
          e.patente,
          COALESCE(e.codigo_interno, e.patente) AS equipo_codigo,
          COALESCE(e.json_data->>'tipo_planilla', e.modelo, e.patente) AS equipo_nombre,
          COALESCE((
            SELECT rep.horometro_termino 
            FROM ${SCHEMA}.tedp_reporte_avance rep 
            WHERE rep.id_equipo = e.id_equipo AND rep.horometro_termino IS NOT NULL 
            ORDER BY rep.id_reporte_avance DESC LIMIT 1
          ), 0) AS horometro_actual,
          COALESCE((
            SELECT MAX(ot.horometro_cierre) 
            FROM ${SCHEMA}.tmnt_ot ot 
            WHERE ot.id_equipo = e.id_equipo AND ot.estado = 'CERRADA'
          ), 0) AS ultimo_service
        FROM ${SCHEMA}.tequ_equipo e
        WHERE e.id_empresa = $1;
      `;
      const { rows: equipos } = await this.pool.query(sqlPautas, [empresaId]);

      // Consultar intervalo preventivo base configurado
      const { rows: paramRows } = await this.pool.query(
        `SELECT valor FROM ${SCHEMA}.tmnt_parametro WHERE id_empresa = $1 AND clave = 'pm_intervalo_base_horas'`,
        [empresaId]
      );
      const intervaloBase = (paramRows.length > 0 && parseFloat(paramRows[0].valor)) ? parseFloat(paramRows[0].valor) : 250;

      for (const eq of equipos) {
        const delta = Number(eq.horometro_actual) - Number(eq.ultimo_service);
        if (delta >= intervaloBase) {
          const cacheKey = `PM_VENCIDO_${eq.id_equipo}`;
          if (!this._yaFueAlertado(cacheKey, 24)) {
            await notificacionService.despacharNotificacion({
              evento: 'MNT_PM_VENCIDO',
              usuarioDestino: { nombre: 'Supervisor Taller' },
              emailData: {
                asunto: `⚠️ ALERTA: Mantenimiento Preventivo VENCIDO en ${eq.equipo_codigo}`,
                titulo: `Pauta Preventiva Vencida: ${eq.equipo_codigo}`,
                cuerpoHtml: `<p>El equipo <strong>${eq.equipo_codigo}</strong> (${eq.equipo_nombre}) registra <strong>${delta} hrs</strong> desde su último service (Límite: ${intervaloBase} hrs).</p><p>Horómetro actual: <strong>${eq.horometro_actual} hrs</strong>.</p>`
              },
              mensajeWsp: `⚠️ *ALERTA TALLER GSP* ⚠️\nMantenimiento preventivo *VENCIDO* en grúa *${eq.equipo_codigo}*.\nHoras operadas desde último service: *${delta} hrs* (Máx ${intervaloBase} hrs).\nPor favor programar OT de inmediato.`,
              deepLinkData: { modulo: 'mantenimiento', accion: 'radar' }
            });
            this._marcarAlertado(cacheKey);
            resultados.pautas_alertadas++;
          }
        }
      }

      // 2. AUDITORÍA DE OTS ENVEJECIDAS (AGING OTS)
      const sqlAging = `
        SELECT 
          ot.id_ot,
          ot.numero_ot,
          ot.tipo_mantenimiento,
          ot.estado,
          ot.fecha_creacion,
          eq.patente,
          COALESCE(eq.codigo_interno, eq.patente) AS equipo_codigo,
          ROUND(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - ot.fecha_creacion)) / 86400) AS dias_abierta
        FROM ${SCHEMA}.tmnt_ot ot
        JOIN ${SCHEMA}.tequ_equipo eq ON ot.id_equipo = eq.id_equipo
        WHERE ot.id_empresa = $1 
          AND ot.estado IN ('ABIERTA', 'EN_PROCESO', 'ESPERA_REPUESTOS')
          AND (
            (ot.tipo_mantenimiento = 'CORRECTIVO' AND ot.fecha_creacion < CURRENT_DATE - INTERVAL '7 days')
            OR (ot.estado = 'ESPERA_REPUESTOS' AND ot.fecha_creacion < CURRENT_DATE - INTERVAL '3 days')
            OR (ot.fecha_creacion < CURRENT_DATE - INTERVAL '15 days')
          );
      `;
      const { rows: agingOts } = await this.pool.query(sqlAging, [empresaId]);

      for (const ot of agingOts) {
        const cacheKey = `AGING_OT_${ot.id_ot}`;
        if (!this._yaFueAlertado(cacheKey, 24)) {
          await notificacionService.despacharNotificacion({
            evento: 'MNT_OT_ENVEJECIDA',
            usuarioDestino: { nombre: 'Jefe de Taller' },
            emailData: {
              asunto: `⏳ ALERTA: OT ${ot.numero_ot} envejecida (${ot.dias_abierta} días en estado ${ot.estado})`,
              titulo: `OT Envejecida Sin Concluir: ${ot.numero_ot}`,
              cuerpoHtml: `<p>La orden <strong>${ot.numero_ot}</strong> para el equipo <strong>${ot.equipo_codigo}</strong> lleva <strong>${ot.dias_abierta} días</strong> en estado <strong>${ot.estado}</strong>.</p>`
            },
            mensajeWsp: `⏳ *CONTROL TALLER GSP*\nLa OT *${ot.numero_ot}* (${ot.equipo_codigo}) lleva *${ot.dias_abierta} días* en estado *${ot.estado}*.\nPor favor revisar y gestionar cierre.`,
            deepLinkData: { modulo: 'mantenimiento', accion: 'ver', id: ot.id_ot }
          });
          this._marcarAlertado(cacheKey);
          resultados.ots_envejecidas_alertadas++;
        }
      }

      // 3. AUDITORÍA DE CERTIFICACIONES DE GRÚA POR VENCER (30 DÍAS)
      const sqlCerts = `
        SELECT 
          doc.id_acreditacion,
          doc.id_equipo,
          doc.fecha_prox_calibracion,
          eq.patente,
          COALESCE(eq.codigo_interno, eq.patente) AS equipo_codigo,
          ROUND(EXTRACT(EPOCH FROM (doc.fecha_prox_calibracion::timestamp - CURRENT_TIMESTAMP)) / 86400) AS dias_para_vencer
        FROM ${SCHEMA}.tequ_documentacion_equipo doc
        JOIN ${SCHEMA}.tequ_equipo eq ON doc.id_equipo = eq.id_equipo
        WHERE eq.id_empresa = $1 
          AND doc.fecha_prox_calibracion IS NOT NULL
          AND doc.fecha_prox_calibracion BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days');
      `;
      const { rows: expiringCerts } = await this.pool.query(sqlCerts, [empresaId]);

      for (const cert of expiringCerts) {
        const cacheKey = `CERT_EXP_${cert.id_acreditacion}`;
        if (!this._yaFueAlertado(cacheKey, 48)) {
          await notificacionService.despacharNotificacion({
            evento: 'MNT_CERT_POR_VENCER',
            usuarioDestino: { nombre: 'Jefe de Operaciones / Prevención' },
            emailData: {
              asunto: `📋 AVISO: Certificación de Grúa ${cert.equipo_codigo} vence en ${cert.dias_para_vencer} días`,
              titulo: `Renovación Certificación Técnica: ${cert.equipo_codigo}`,
              cuerpoHtml: `<p>La certificación técnica del equipo <strong>${cert.equipo_codigo}</strong> vencerá el <strong>${cert.fecha_prox_calibracion}</strong> (en ${cert.dias_para_vencer} días).</p>`
            },
            mensajeWsp: `📋 *CERTIFICACIÓN FLOTA GSP*\nLa certificación del equipo *${cert.equipo_codigo}* vence en *${cert.dias_para_vencer} días* (${cert.fecha_prox_calibracion}).\nCoordinar inspección de renovación.`,
            deepLinkData: { modulo: 'mantenimiento', accion: 'radar' }
          });
          this._marcarAlertado(cacheKey);
          resultados.certificaciones_alertadas++;
        }
      }

    } catch (err) {
      console.error('Error en MantenimientoAlertasService.ejecutarAlertasMantenimiento:', err);
      resultados.errores.push(err.message);
    }

    return resultados;
  }
}

module.exports = new MantenimientoAlertasService();
