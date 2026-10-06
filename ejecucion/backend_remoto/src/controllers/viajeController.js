const viajeModel = require('../models/viajeModel');
const estadoPagoModel = require('../models/estadoPagoModel');

const viajeController = {
  // 1. Obtener datos del viaje por token (Público / PWA)
  async getViajePorToken(req, res) {
    try {
      const { token } = req.params;
      const viaje = await viajeModel.getViajePorToken(token);
      if (!viaje) {
        return res.status(404).json({ error: 'Viaje no encontrado o token inválido' });
      }
      res.json(viaje);
    } catch (err) {
      console.error('Error al obtener viaje por token:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // 2. Registrar Salida de Patio (Paso 1)
  async registrarSalida(req, res) {
    try {
      const { token } = req.params;
      const { km_inicial, horometro_inicial, combustible_salida, foto_salida, pin_hash, latitud, longitud, id_proyecto, id_equipo, id_user_chofer, device_timestamp } = req.body;

      if (!km_inicial || !pin_hash) {
        return res.status(400).json({ error: 'Odómetro y PIN son requeridos para iniciar salida' });
      }

      const actualizado = await viajeModel.registrarSalida({
        token_viaje: token,
        id_proyecto,
        id_equipo,
        id_user_chofer,
        km_inicial,
        horometro_inicial,
        combustible_salida,
        foto_salida,
        pin_hash,
        latitud,
        longitud,
        device_timestamp
      });

      res.json({ success: true, message: 'Salida de patio registrada exitosamente', data: actualizado });
    } catch (err) {
      console.error('Error registrando salida:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // 3. Registrar Carga de Combustible (Copec)
  async registrarCombustible(req, res) {
    try {
      const { token } = req.params;
      const {
        tipo_estanque,
        litros,
        monto,
        foto_voucher,
        foto_tablero,
        id_autorizacion_copec,
        odometro,
        horometro,
        observacion
      } = req.body;

      const costoRegistrado = await viajeModel.registrarCombustible({
        token_viaje: token,
        tipo_estanque,
        litros,
        monto,
        foto_voucher,
        foto_tablero,
        id_autorizacion_copec,
        odometro,
        horometro,
        observacion
      });

      res.status(201).json({ success: true, message: 'Carga de combustible registrada exitosamente', data: costoRegistrado });
    } catch (err) {
      console.error('Error registrando combustible:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // 4. Registrar Llegada a Faena (Paso 3)
  async registrarLlegada(req, res) {
    try {
      const { token } = req.params;
      const { km_final, horometro_final, horometro_grua, horometro_grua_inicial, combustible_llegada, foto_llegada, pin_hash, latitud, longitud, obs_termino, device_timestamp } = req.body;

      if (!km_final || !pin_hash) {
        return res.status(400).json({ error: 'Odómetro de llegada y PIN son requeridos' });
      }

      const hGrua = horometro_grua || horometro_grua_inicial || null;

      const actualizado = await viajeModel.registrarLlegada({
        token_viaje: token,
        km_final,
        horometro_final,
        horometro_grua_inicial: hGrua,
        combustible_llegada,
        foto_llegada,
        pin_hash,
        latitud,
        longitud,
        obs_termino,
        device_timestamp
      });

      // Handoff Automático del Traslado (Requerimiento 3 / Spec 54 & Spec 49)
      if (actualizado && actualizado.id_proyecto) {
        try {
          await viajeController.procesarHandoffTraslado(actualizado, token);
        } catch (handoffErr) {
          console.warn('[Handoff Traslado] Error en handoff automático:', handoffErr.message);
        }
      }

      res.json({ success: true, message: 'Llegada a faena registrada exitosamente', data: actualizado });
    } catch (err) {
      console.error('Error registrando llegada:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // 5. Ping de Telemetría GPS
  async registrarPing(req, res) {
    try {
      const { token } = req.params;
      const { latitud, longitud, velocidad_kmh } = req.body;

      const data = await viajeModel.registrarPingViaje(token, {
        latitud,
        longitud,
        velocidad_kmh
      });

      res.json({ success: true, message: 'Ping registrado', data });
    } catch (err) {
      console.error('Error registrando ping de viaje:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // 6. Crear o Asignar Viaje desde el CRM
  async crearOAsignarViaje(req, res) {
    try {
      const {
        id_proyecto,
        id_equipo,
        id_user_chofer,
        patente,
        tipo_trayecto,
        token_viaje,
        fecha_programada,
        fecha_inspeccion_plan,
        hora_inspeccion_plan
      } = req.body;
      if (!id_proyecto || !id_equipo) {
        return res.status(400).json({ error: 'id_proyecto e id_equipo son requeridos' });
      }

      let fProg = fecha_programada || null;
      if (!fProg && fecha_inspeccion_plan) {
        const hora = (hora_inspeccion_plan && hora_inspeccion_plan.trim()) ? hora_inspeccion_plan.trim() : '08:00';
        fProg = `${fecha_inspeccion_plan}T${hora.length === 5 ? hora + ':00' : hora}`;
      }

      const viaje = await viajeModel.crearOObtenerViaje({
        id_proyecto,
        id_equipo,
        id_user_chofer,
        patente,
        tipo_trayecto,
        token_viaje,
        fecha_programada: fProg
      });

      res.status(201).json({ success: true, data: viaje });
    } catch (err) {
      console.error('Error al crear o asignar viaje:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // 7. Listar Viajes de un Proyecto (CRM)
  async getViajesPorProyecto(req, res) {
    try {
      const { id_proyecto } = req.params;
      const viajes = await viajeModel.getViajesPorProyecto(id_proyecto);
      res.json(viajes);
    } catch (err) {
      console.error('Error al listar viajes por proyecto:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // 8. Consultar viaje activo asignado a un usuario (PWA)
  async getViajeActivo(req, res) {
    try {
      const id_user = req.user?.id_user || req.query.id_user;
      if (!id_user) {
        return res.status(400).json({ error: 'id_user es requerido' });
      }

      const viaje = await viajeModel.getViajeActivoPorUsuario(id_user);
      res.json({ activo: !!viaje, data: viaje });
    } catch (err) {
      console.error('Error al consultar viaje activo:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // 9. Handoff Automático: Cumplimiento de TRASLADO en Estructurador e Inyección en Report Diario / ITS
  async procesarHandoffTraslado(actualizado, token) {
    const db = require('../config/dbConfig');
    const idPry = actualizado.id_proyecto;
    if (!idPry) return;

    // 9.1 Obtener proyecto y estructurador
    const pryRes = await db.query('SELECT id_proyecto, codi_proyecto, json_field FROM tpry_proyecto WHERE id_proyecto = $1', [idPry]);
    if (pryRes.rows.length === 0) return;

    const proyecto = pryRes.rows[0];
    const jf = proyecto.json_field || {};
    const lineas = jf.crm_v1?.lineas_servicio || [];

    let lineaModificada = false;
    for (const l of lineas) {
      const tipo = (l.tipo || '').toUpperCase();
      const desc = (l.descripcion || '').toUpperCase();
      if (tipo.includes('TRASLADO') || desc.includes('TRASLADO') || desc.includes('FLETE')) {
        l.cumplido = true;
        l.estado = 'CUMPLIDO';
        l.fecha_cumplido = actualizado.fecha_llegada_faena || new Date().toISOString();
        l.token_viaje = token;
        l.id_log_desplazamiento = actualizado.id_log_desplazamiento;
        lineaModificada = true;
      }
    }

    if (lineaModificada) {
      await db.query('UPDATE tpry_proyecto SET json_field = $1 WHERE id_proyecto = $2', [JSON.stringify(jf), idPry]);
      console.log(`[Handoff Traslado] Ítem TRASLADO marcado como CUMPLIDO en OT ${proyecto.codi_proyecto}`);
    }

    // 9.2 Inyectar automáticamente en Report Diario (tedp_reporte_avance)
    const tokenReport = `FLT-${token}`;
    const repCheck = await db.query(
      'SELECT id_reporte_avance FROM tedp_reporte_avance WHERE token_report = $1 OR id_log_desplazamiento = $2 LIMIT 1',
      [tokenReport, actualizado.id_log_desplazamiento]
    );

    let idReporteFlete = null;
    if (repCheck.rows.length === 0) {
      const fIni = actualizado.fecha_salida_patio || new Date().toISOString();
      const fFin = actualizado.fecha_llegada_faena || new Date().toISOString();
      const diffMs = new Date(fFin) - new Date(fIni);
      const horasCarretera = Math.max(0.1, Number((diffMs / 3600000).toFixed(1)));

      const insertRepSql = `
        INSERT INTO tedp_reporte_avance (
          id_proyecto, id_equipo, id_user_operador, id_log_desplazamiento,
          dia_correlativo, fecha_reporte, fecha_inicio_servicio, fecha_termino_servicio,
          horas_operadas, horas_minimas, horas_facturables,
          horometro_inicio, horometro_termino, odometro_inicio, odometro_termino,
          observacion_trabajo, cliente_nombre, cliente_cargo,
          estado_reporte, estado_jornada, token_report, incluye_flete_independiente
        ) VALUES (
          $1, $2, $3, $4,
          1, CURRENT_DATE, $5, $6,
          $7, 0, 0,
          $8, $9, $10, $11,
          'FLETE / TRASLADO CARRETERA (CUMPLIDO AUTOMÁTICO DESDE CONVOY)',
          'Control Conductor', 'Flete Carretero',
          'VALIDADO_ANALISTA', 'FINALIZADA', $12, true
        ) RETURNING id_reporte_avance;
      `;
      const repIns = await db.query(insertRepSql, [
        idPry,
        actualizado.id_equipo || null,
        actualizado.id_user_chofer || 55,
        actualizado.id_log_desplazamiento,
        fIni,
        fFin,
        horasCarretera,
        actualizado.horometro_inicial || null,
        actualizado.horometro_final || null,
        actualizado.km_inicial || null,
        actualizado.km_final || null,
        tokenReport
      ]);
      idReporteFlete = repIns.rows[0]?.id_reporte_avance;
      console.log(`[Handoff Traslado] Report Diario de Flete inyectado ID: ${idReporteFlete}`);
    } else {
      idReporteFlete = repCheck.rows[0].id_reporte_avance;
    }

    // 9.3 Sincronizar en Liquidación ITS (tits_jornada_detalle) si ya existe
    const itsRes = await db.query('SELECT id_its FROM tits_cabecera WHERE id_proyecto = $1 LIMIT 1', [idPry]);
    if (itsRes.rows.length > 0) {
      const idIts = itsRes.rows[0].id_its;
      const jorCheck = await db.query(
        'SELECT id_jornada FROM tits_jornada_detalle WHERE id_its = $1 AND (numero_report = $2 OR tipo_servicio ILIKE \'%Flete%\') LIMIT 1',
        [idIts, tokenReport]
      );
      if (jorCheck.rows.length === 0) {
        const horaSal = actualizado.fecha_salida_patio ? new Date(actualizado.fecha_salida_patio).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false }) : '06:40';
        const horaLleg = actualizado.fecha_llegada_faena ? new Date(actualizado.fecha_llegada_faena).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false }) : '08:30';
        const diffH = Math.max(0.1, Number(((new Date(actualizado.fecha_llegada_faena || Date.now()) - new Date(actualizado.fecha_salida_patio || Date.now())) / 3600000).toFixed(1)));

        await db.query(`
          INSERT INTO tits_jornada_detalle (
            id_its, id_reporte_avance, fecha, numero_ot, id_equipo, patente,
            tipo_servicio, hora_salida, hora_llegada, hora_termino, hora_retorno,
            colacion_minutos, horas_reales, horas_report, numero_report, es_oculta, vb_conciliado, orden
          ) VALUES (
            $1, $2, CURRENT_DATE, $3, $4, $5,
            'Flete Solo Ida', $6, $7, $7, $7,
            0, $8, 1, $9, false, true, 0
          );
        `, [
          idIts, idReporteFlete, proyecto.codi_proyecto || `OT-${idPry}`,
          actualizado.id_equipo || null, actualizado.patente || 'S/P',
          horaSal, horaLleg, diffH, tokenReport
        ]);
        console.log(`[Handoff Traslado] Flete Solo Ida inyectado en ITS ID: ${idIts}`);
      }
    }

    // 9.4 Pre-inicializar Horómetro Inicial de Grúa en Report Diario de Faena (Spec 49)
    if (actualizado.tipo_trayecto !== 'RETORNO' && actualizado.horometro_grua_inicial && actualizado.id_equipo) {
      try {
        const fechaHoy = new Date().toISOString().split('T')[0];
        const horaLleg = actualizado.fecha_llegada_faena 
          ? new Date(actualizado.fecha_llegada_faena).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false }) 
          : '08:30';
        
        await db.query(`
          UPDATE tedp_reporte_avance
          SET horometro_inicio = $1, hora_inicio_faena = COALESCE(hora_inicio_faena, $2)
          WHERE id_proyecto = $3 AND id_equipo = $4 AND fecha_reporte = $5 AND (token_report IS NULL OR token_report NOT LIKE 'FLT-%');
        `, [Number(actualizado.horometro_grua_inicial), horaLleg, idPry, actualizado.id_equipo, fechaHoy]);
        console.log(`[Handoff Traslado] Horómetro Inicial de Grúa pre-cargado: ${actualizado.horometro_grua_inicial} hrs en OT ${idPry}`);
      } catch (errRep) {
        console.warn('[Handoff Traslado] Advertencia pre-cargando horómetro de grúa:', errRep.message);
      }
    }
  }
};

module.exports = viajeController;
