const db = require('../config/dbConfig');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const notificacionService = require('../services/notificacionService');
const { generarPdfReportDiario } = require('../services/reportDiarioPdfService');
const { buildStoragePath, STORAGE_ROOT } = require('../config/storageConfig');
const archivoModel = require('../models/archivoModel');
const slaAuditorService = require('../services/slaAuditorService');

const reportDiarioController = {
  // 1. Obtener contexto y datos precargados para emitir Report Diario (PWA)
  async getReportContexto(req, res) {
    try {
      const { id_proyecto } = req.params;
      const { id_equipo } = req.query; // Soporte para contexto por equipo específico (Spec 35)

      if (!id_proyecto) {
        return res.status(400).json({ error: 'id_proyecto es requerido' });
      }

      // 1.1 Consultar datos del proyecto / OT con Razón Social real del cliente (tpar_empresas)
      const proySql = `
        SELECT 
          p.id_proyecto,
          p.codi_proyecto,
          p.nombre_proyecto,
          p.id_proyecto_estado,
          p.json_field,
          COALESCE(clt.razon_social, clt.name_empresa, p.json_field->>'cliente_nombre', p.json_field->'ejecucion_v1'->'cliente'->>'razon_social', 'Cliente Mandante') AS cliente_nombre,
          COALESCE(clt.rut_empresa, p.json_field->>'cliente_rut', p.json_field->'ejecucion_v1'->'cliente'->>'rut', '') AS cliente_rut,
          COALESCE(p.json_field->>'obra_nombre', p.json_field->'crm_v1'->>'obra_nombre', p.json_field->'ejecucion_v1'->'cliente'->>'obra', p.nombre_proyecto) AS obra_nombre,
          COALESCE(p.json_field->>'obra_direccion', p.json_field->'crm_v1'->>'obra_direccion', p.json_field->'ejecucion_v1'->'cliente'->>'direccion_faena', 'Faena en Terreno') AS obra_direccion
        FROM tpry_proyecto p
        LEFT JOIN tpar_empresas clt ON p.id_empresa_cliente = clt.id_empresa
        WHERE p.id_proyecto = $1;
      `;
      const proyRes = await db.query(proySql, [id_proyecto]);
      if (proyRes.rows.length === 0) {
        return res.status(404).json({ error: 'Proyecto no encontrado' });
      }
      const proyecto = proyRes.rows[0];

      // 1.2 Consultar equipos asignados (DEDUPLICADOS por id_equipo) con su micro-estado operacional (Spec 35)
      const eqSql = `
        SELECT DISTINCT ON (re.id_equipo)
          re.id_rel_equipo,
          re.id_equipo,
          re.rol_equipo,
          e.patente,
          e.modelo,
          e.marca,
          COALESCE(e.tipo_equipo, 'GRUAS TELESCOPICAS') AS tipo_equipo,
          COALESCE((e.json_data->>'horometro')::numeric, 0) AS horometro_base,
          COALESCE(v.estado_trayecto, 'ARRIBADO') AS estado_operativo,
          v.token_viaje,
          v.km_inicial,
          v.km_final,
          v.horometro_inicial AS horometro_viaje_salida,
          v.horometro_final AS horometro_viaje_llegada
        FROM tpry_rel_equipo re
        JOIN tequ_equipo e ON re.id_equipo = e.id_equipo
        LEFT JOIN LATERAL (
          SELECT estado_trayecto, token_viaje, km_inicial, km_final, horometro_inicial, horometro_final
          FROM tequ_log_desplazamiento
          WHERE id_proyecto = re.id_proyecto AND id_equipo = re.id_equipo
          ORDER BY id_log_desplazamiento DESC
          LIMIT 1
        ) v ON TRUE
        WHERE re.id_proyecto = $1
        ORDER BY re.id_equipo, re.id_rel_equipo DESC;
      `;
      const eqRes = await db.query(eqSql, [id_proyecto]);
      let equipos = eqRes.rows;

      // Fallback si no hay equipos en tpry_rel_equipo (Spec 39)
      if (equipos.length === 0 && proyecto.json_field?.ejecucion_v1?.equipos_asignados) {
        const jsonEqs = proyecto.json_field.ejecucion_v1.equipos_asignados;
        for (const eqItem of jsonEqs) {
          const idEq = eqItem.id_equipo || eqItem.id;
          if (idEq) {
            const fallbackEqRes = await db.query(
              `SELECT id_equipo, patente, modelo, marca, COALESCE(tipo_equipo, 'GRUAS TELESCOPICAS') AS tipo_equipo, COALESCE((json_data->>'horometro')::numeric, 0) AS horometro_base, 'ARRIBADO' AS estado_operativo FROM tequ_equipo WHERE id_equipo = $1`,
              [idEq]
            );
            if (fallbackEqRes.rows.length > 0) {
              equipos.push(fallbackEqRes.rows[0]);
            }
          }
        }
      }

      // Si aún sigue vacío, tomar la grúa principal de la flota para garantizar datos reales
      if (equipos.length === 0) {
        const anyEqRes = await db.query(
          `SELECT id_equipo, patente, modelo, marca, COALESCE(tipo_equipo, 'GRUAS TELESCOPICAS') AS tipo_equipo, COALESCE((json_data->>'horometro')::numeric, 0) AS horometro_base, 'ARRIBADO' AS estado_operativo FROM tequ_equipo ORDER BY id_equipo ASC LIMIT 1`
        );
        if (anyEqRes.rows.length > 0) {
          equipos.push(anyEqRes.rows[0]);
        }
      }

      // 1.3 Consultar personal / tripulación asignada (DEDUPLICADA por id_user)
      const perSql = `
        SELECT DISTINCT ON (rp.id_user)
          rp.id_rel_persona,
          rp.id_user,
          rp.rol_asignado,
          u.name_frst,
          u.apellido_pat,
          u.apellido_mat,
          u.email,
          u.rut
        FROM tpry_rel_persona rp
        JOIN tsec_users u ON rp.id_user = u.id_user
        WHERE rp.id_proyecto = $1
        ORDER BY rp.id_user, rp.id_rel_persona DESC;
      `;
      const perRes = await db.query(perSql, [id_proyecto]);

      // 1.4 Consultar reports ya emitidos para esta OT
      const repSql = `
        SELECT 
          id_reporte_avance,
          id_equipo,
          dia_correlativo,
          fecha_reporte,
          horometro_inicio,
          horometro_termino,
          horas_operadas,
          horas_facturables,
          horas_sobretiempo,
          estado_reporte,
          cliente_nombre,
          fecha_registro
        FROM tedp_reporte_avance
        WHERE id_proyecto = $1
        ORDER BY dia_correlativo ASC, fecha_reporte ASC;
      `;
      const repRes = await db.query(repSql, [id_proyecto]);
      const reports = repRes.rows;

      // 1.5 Buscar si hay una jornada activa (Momento 1 iniciado pero no finalizado)
      const targetIdEquipo = id_equipo ? parseInt(id_equipo, 10) : (equipos.length > 0 ? equipos[0].id_equipo : null);
      let jornadaActiva = null;

      if (targetIdEquipo) {
        const actSql = `
          SELECT *
          FROM tedp_reporte_avance
          WHERE id_proyecto = $1 AND id_equipo = $2 AND estado_reporte = 'JORNADA_EN_CURSO'
          ORDER BY id_reporte_avance DESC
          LIMIT 1;
        `;
        const actRes = await db.query(actSql, [id_proyecto, targetIdEquipo]);
        if (actRes.rows.length > 0) {
          jornadaActiva = actRes.rows[0];
        }
      }

      const reportsDelEquipo = targetIdEquipo ? reports.filter(r => Number(r.id_equipo) === targetIdEquipo && r.estado_reporte !== 'JORNADA_EN_CURSO') : reports.filter(r => r.estado_reporte !== 'JORNADA_EN_CURSO');

      let diaSugerido = 1;
      let horometroSugerido = null;
      let odometroSugerido = null;

      if (reportsDelEquipo.length > 0) {
        const maxDia = Math.max(...reportsDelEquipo.map(r => Number(r.dia_correlativo) || 0));
        diaSugerido = maxDia + 1;
        const ultimoReport = reportsDelEquipo[reportsDelEquipo.length - 1];
        if (ultimoReport.horometro_termino) {
          horometroSugerido = Number(ultimoReport.horometro_termino);
        }
        if (ultimoReport.odometro_termino) {
          odometroSugerido = Number(ultimoReport.odometro_termino);
        }
      } else if (targetIdEquipo) {
        const eqMatch = equipos.find(e => Number(e.id_equipo) === targetIdEquipo);
        if (eqMatch) {
          if (eqMatch.horometro_viaje_llegada || eqMatch.horometro_viaje_salida) {
            horometroSugerido = Number(eqMatch.horometro_viaje_llegada || eqMatch.horometro_viaje_salida);
          } else if (eqMatch.horometro_base) {
            horometroSugerido = Number(eqMatch.horometro_base);
          }
          if (eqMatch.km_final || eqMatch.km_inicial) {
            odometroSugerido = Number(eqMatch.km_final || eqMatch.km_inicial);
          }
        }
      }

      // Horas mínimas contractuales configuradas en la propuesta / OT (Estructurador Comercial)
      let horasMinimas = 8.0;
      try {
        const jsonField = proyecto.json_field || {};
        const lineasServicio = jsonField.crm_v1?.lineas_servicio || jsonField.lineas_servicio || [];
        
        // 1. Buscar primero coincidencia exacta por ID de equipo asignado
        let lineaEquipo = targetIdEquipo ? lineasServicio.find(l => 
          Number(l.equipo_asignado_id) === Number(targetIdEquipo) || Number(l.id_equipo) === Number(targetIdEquipo)
        ) : null;

        // 2. Si no encontró por ID exacto, buscar por línea principal de grúa
        if (!lineaEquipo) {
          lineaEquipo = lineasServicio.find(l => l.tipo && l.tipo.toUpperCase().includes('GRUA'));
        }

        if (lineaEquipo && lineaEquipo.pisoMinimo !== undefined && lineaEquipo.pisoMinimo !== null) {
          horasMinimas = Number(lineaEquipo.pisoMinimo);
        } else if (lineaEquipo && lineaEquipo.cantidad_horas) {
          horasMinimas = Number(lineaEquipo.cantidad_horas);
        } else if (jsonField.ejecucion_v1?.servicio?.horas_minimas) {
          horasMinimas = Number(jsonField.ejecucion_v1.servicio.horas_minimas);
        } else if (jsonField.horas_minimas) {
          horasMinimas = Number(jsonField.horas_minimas);
        }
      } catch (e) {
        console.error('Error calculando horas mínimas del estructurador:', e);
      }

      // Sincronizar jornada en curso si tenía un piso antiguo
      if (jornadaActiva && Number(jornadaActiva.horas_minimas) !== Number(horasMinimas)) {
        jornadaActiva.horas_minimas = horasMinimas;
        await db.query('UPDATE tedp_reporte_avance SET horas_minimas = $1 WHERE id_reporte_avance = $2', [horasMinimas, jornadaActiva.id_reporte_avance]);
      }

      // Calcular total de días autorizados de la OT (Spec 57)
      let totalDiasOT = 1;
      try {
        const jf = proyecto.json_field || {};
        const lines = jf.crm_v1?.lineas_servicio || jf.lineas_servicio || [];
        for (const l of lines) {
          const d = Number(l.cantidad_dias || l.dias || 0);
          if (d > totalDiasOT) totalDiasOT = d;
        }
      } catch (e) {
        console.warn('Error calculando totalDiasOT:', e.message);
      }

      const cantReportesTerminados = reportsDelEquipo.filter(r => r.estado_reporte !== 'JORNADA_EN_CURSO').length;
      const servicioConcluido = cantReportesTerminados >= totalDiasOT;

      res.json({
        success: true,
        data: {
          proyecto,
          equipos,
          id_equipo_seleccionado: targetIdEquipo,
          personas: perRes.rows,
          reports,
          reports_equipo: reportsDelEquipo,
          dia_sugerido: diaSugerido,
          horometro_sugerido: horometroSugerido,
          odometro_sugerido: odometroSugerido,
          horas_minimas: horasMinimas,
          jornada_activa: jornadaActiva,
          total_dias: totalDiasOT,
          dias_reportados: cantReportesTerminados,
          servicio_concluido: servicioConcluido,
          es_ultimo_dia: diaSugerido >= totalDiasOT
        }
      });
    } catch (err) {
      console.error('Error al obtener contexto de report diario:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // 1.B Registrar Inicio de Jornada (Momento 1: Control de Flota - Interno GSP)
  async guardarInicioJornada(req, res) {
    try {
      const {
        id_proyecto,
        id_equipo,
        id_user_operador,
        id_user_rigger,
        dia_correlativo,
        fecha_reporte,
        hora_inicio,
        horometro_inicio,
        odometro_inicio,
        foto_tablero_inicio
      } = req.body;

      if (!id_proyecto || !fecha_reporte || !id_user_operador) {
        return res.status(400).json({ error: 'id_proyecto, fecha_reporte y id_user_operador son requeridos' });
      }

      const fechaBase = fecha_reporte.split('T')[0];
      const fecha_inicio_servicio = hora_inicio ? `${fechaBase} ${hora_inicio}:00` : null;

      // Resolver pisoMinimo contractual del Estructurador Comercial de la OT
      let horasMinimasOT = 8.0;
      try {
        const pryRes = await db.query('SELECT json_field FROM tpry_proyecto WHERE id_proyecto = $1', [id_proyecto]);
        if (pryRes.rows.length > 0) {
          const jf = pryRes.rows[0].json_field || {};
          const lineas = jf.crm_v1?.lineas_servicio || jf.lineas_servicio || [];
          let match = id_equipo ? lineas.find(l => 
            Number(l.equipo_asignado_id) === Number(id_equipo) || Number(l.id_equipo) === Number(id_equipo)
          ) : null;
          if (!match) {
            match = lineas.find(l => l.tipo && l.tipo.toUpperCase().includes('GRUA'));
          }
          if (match && match.pisoMinimo !== undefined && match.pisoMinimo !== null) {
            horasMinimasOT = Number(match.pisoMinimo);
          } else if (match && match.cantidad_horas) {
            horasMinimasOT = Number(match.cantidad_horas);
          } else if (jf.ejecucion_v1?.servicio?.horas_minimas) {
            horasMinimasOT = Number(jf.ejecucion_v1.servicio.horas_minimas);
          }
        }
      } catch (e) {
        console.warn('Error resolviendo pisoMinimo en guardarInicioJornada:', e.message);
      }

      // Verificar si ya existe una jornada en curso para hoy y este equipo
      const existSql = `
        SELECT id_reporte_avance 
        FROM tedp_reporte_avance 
        WHERE id_proyecto = $1 AND id_equipo = $2 AND estado_reporte = 'JORNADA_EN_CURSO'
        ORDER BY id_reporte_avance DESC LIMIT 1;
      `;
      const existRes = await db.query(existSql, [id_proyecto, id_equipo]);

      let reportRow;
      if (existRes.rows.length > 0) {
        const updateSql = `
          UPDATE tedp_reporte_avance SET
            id_user_rigger = $1,
            dia_correlativo = $2,
            fecha_reporte = $3,
            fecha_inicio_servicio = $4,
            horometro_inicio = $5,
            odometro_inicio = $6,
            foto_tablero_inicio = $7,
            horas_minimas = $8,
            estado_jornada = 'JORNADA_EN_CURSO'
          WHERE id_reporte_avance = $9
          RETURNING *;
        `;
        const upRes = await db.query(updateSql, [
          id_user_rigger || null,
          dia_correlativo || 1,
          fecha_reporte,
          fecha_inicio_servicio,
          horometro_inicio || null,
          odometro_inicio || null,
          foto_tablero_inicio || null,
          horasMinimasOT,
          existRes.rows[0].id_reporte_avance
        ]);
        reportRow = upRes.rows[0];
      } else {
        const token_report = crypto.randomBytes(24).toString('hex');
        const insertSql = `
          INSERT INTO tedp_reporte_avance (
            id_proyecto,
            id_equipo,
            id_user_operador,
            id_user_rigger,
            dia_correlativo,
            fecha_reporte,
            unidad_cobro,
            fecha_inicio_servicio,
            horometro_inicio,
            odometro_inicio,
            foto_tablero_inicio,
            token_report,
            horas_minimas,
            estado_reporte,
            estado_jornada,
            fecha_registro
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'JORNADA_EN_CURSO', 'JORNADA_EN_CURSO', CURRENT_TIMESTAMP
          ) RETURNING *;
        `;
        const inRes = await db.query(insertSql, [
          id_proyecto,
          id_equipo || null,
          id_user_operador,
          id_user_rigger || null,
          dia_correlativo || 1,
          fecha_reporte,
          'HRS_DIA',
          fecha_inicio_servicio,
          horometro_inicio || null,
          odometro_inicio || null,
          foto_tablero_inicio || null,
          token_report,
          horasMinimasOT
        ]);
        reportRow = inRes.rows[0];
      }

      res.json({
        success: true,
        message: 'Inicio de Jornada registrado exitosamente en Control de Flota',
        data: reportRow
      });
    } catch (err) {
      console.error('Error al registrar inicio de jornada:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // 2. Obtener todos los reports de un proyecto (Torre de Control)
  async getReportsPorProyecto(req, res) {
    try {
      const { id_proyecto } = req.params;
      if (!id_proyecto) {
        return res.status(400).json({ error: 'id_proyecto es requerido' });
      }

      const sql = `
        SELECT 
          r.id_reporte_avance,
          r.id_proyecto,
          r.id_edp,
          r.id_equipo,
          r.id_user_operador,
          r.id_user_rigger,
          r.id_user_validador,
          r.dia_correlativo,
          r.fecha_reporte,
          r.unidad_cobro,
          r.incluye_flete_independiente,
          r.fecha_inicio_servicio,
          r.fecha_termino_servicio,
          r.latitud_inicio_servicio,
          r.longitud_inicio_servicio,
          r.latitud_termino_servicio,
          r.longitud_termino_servicio,
          r.horas_operadas,
          r.horas_standby,
          r.horas_colacion,
          r.horas_minimas,
          r.horas_facturables,
          r.horas_sobretiempo,
          r.horometro_inicio,
          r.horometro_termino,
          r.odometro_inicio,
          r.odometro_termino,
          r.foto_tablero_inicio,
          r.foto_tablero_termino,
          r.foto_horometro,
          r.notas_mecanicas_gsp,
          r.observacion_trabajo,
          r.cliente_nombre,
          r.cliente_rut,
          r.cliente_cargo,
          r.cliente_firma_canvas_base64,
          r.token_report,
          r.estado_reporte,
          r.estado_jornada,
          r.fecha_registro,
          r.fecha_validacion,
          r.fecha_firma_fes,
          r.codigo_validacion_fes,
          r.id_doc_pdf,
          r.obs_validador,
          e.patente AS equipo_patente,
          e.modelo AS equipo_modelo,
          COALESCE(u_op.name_frst || ' ' || u_op.apellido_pat, 'Operador') AS operador_nombre,
          CASE WHEN r.id_user_rigger IS NOT NULL THEN (u_rig.name_frst || ' ' || u_rig.apellido_pat) ELSE NULL END AS rigger_nombre,
          COALESCE(u_val.name_frst || ' ' || u_val.apellido_pat, 'Analista GSP') AS validador_nombre
        FROM tedp_reporte_avance r
        JOIN tpry_proyecto p ON r.id_proyecto = p.id_proyecto
        LEFT JOIN tpar_empresas clt ON p.id_empresa_cliente = clt.id_empresa
        LEFT JOIN tequ_equipo e ON r.id_equipo = e.id_equipo
        LEFT JOIN tsec_users u_op ON r.id_user_operador = u_op.id_user
        LEFT JOIN tsec_users u_rig ON r.id_user_rigger = u_rig.id_user
        LEFT JOIN tsec_users u_val ON r.id_user_validador = u_val.id_user
        WHERE r.id_proyecto = $1
        ORDER BY r.dia_correlativo ASC, r.fecha_reporte ASC;
      `;
      const result = await db.query(sql, [id_proyecto]);
      res.json({ success: true, data: result.rows });
    } catch (err) {
      console.error('Error al obtener reports de proyecto:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // 2.1 Obtener bandeja consolidada de pendientes para el Analista de Control de Gestión (PMO)
  async getPendientesAnalista(req, res) {
    try {
      // 1. Reports de terreno (pendientes primero, luego validados recientes)
      const repsQuery = `
        SELECT 
          ra.id_reporte_avance,
          ra.id_proyecto,
          ra.dia_correlativo,
          ra.fecha_reporte,
          ra.fecha_inicio_servicio,
          ra.fecha_termino_servicio,
          ra.horas_operadas,
          ra.horas_facturables,
          ra.horas_minimas,
          ra.horas_colacion,
          ra.horometro_inicio,
          ra.horometro_termino,
          ra.odometro_inicio,
          ra.odometro_termino,
          ra.foto_horometro,
          ra.foto_tablero_inicio,
          ra.foto_tablero_termino,
          ra.cliente_nombre,
          ra.cliente_rut,
          ra.cliente_cargo,
          ra.cliente_firma_canvas_base64,
          ra.latitud_inicio_servicio,
          ra.longitud_inicio_servicio,
          ra.accuracy_firma,
          ra.estado_reporte,
          ra.fecha_registro,
          ra.fecha_validacion,
          ra.fecha_firma_fes,
          ra.codigo_validacion_fes,
          ra.id_doc_pdf,
          ra.obs_validador,
          ra.observacion_trabajo,
          ra.notas_mecanicas_gsp,
          ra.ajustes_analista,
          p.codi_proyecto,
          COALESCE(p.nombre_proyecto, 'Servicio') AS nombre_proyecto,
          COALESCE(clt.razon_social, clt.name_empresa, p.json_field->'crm_v1'->>'cliente_nombre', 'Cliente') AS cliente_nombre,
          COALESCE(p.json_field->'crm_v1'->>'obra_nombre', p.json_field->>'obra_nombre', 'Faena') AS obra_nombre,
          COALESCE(e.patente, 'S/P') AS equipo_patente,
          COALESCE(e.modelo, '') AS equipo_modelo,
          COALESCE(u_op.name_frst || ' ' || u_op.apellido_pat, 'Operador') AS operador_nombre,
          CASE WHEN ra.id_user_rigger IS NOT NULL THEN (u_rig.name_frst || ' ' || u_rig.apellido_pat) ELSE NULL END AS rigger_nombre,
          COALESCE(u_val.name_frst || ' ' || u_val.apellido_pat, 'Analista GSP') AS validador_nombre
        FROM sch_leangsp.tedp_reporte_avance ra
        LEFT JOIN sch_leangsp.tpry_proyecto p ON ra.id_proyecto = p.id_proyecto
        LEFT JOIN sch_leangsp.tpar_empresas clt ON p.id_empresa_cliente = clt.id_empresa
        LEFT JOIN sch_leangsp.tequ_equipo e ON ra.id_equipo = e.id_equipo
        LEFT JOIN sch_leangsp.tsec_users u_op ON ra.id_user_operador = u_op.id_user
        LEFT JOIN sch_leangsp.tsec_users u_rig ON ra.id_user_rigger = u_rig.id_user
        LEFT JOIN sch_leangsp.tsec_users u_val ON ra.id_user_validador = u_val.id_user
        ORDER BY 
          CASE WHEN ra.estado_reporte = 'PENDIENTE_VALIDACION' THEN 0 ELSE 1 END,
          ra.fecha_reporte DESC,
          ra.id_reporte_avance DESC
        LIMIT 50;
      `;
      const repsRes = await db.query(repsQuery);

      // 2. OTs en ejecución o terminadas con su estado de ITS / Liquidación
      const otsQuery = `
        SELECT 
          p.id_proyecto,
          p.codi_proyecto,
          p.nombre_proyecto,
          p.id_proyecto_estado,
          COALESCE(clt.razon_social, clt.name_empresa, p.json_field->'crm_v1'->>'cliente_nombre', 'Cliente') AS cliente_nombre,
          COALESCE(p.json_field->'crm_v1'->>'obra_nombre', p.json_field->>'obra_nombre', 'Faena') AS obra_nombre,
          its.id_its,
          its.folio_its,
          its.estado_its,
          COALESCE(its.total_ingresos_facturables, 0) AS total_ingresos_facturables,
          COALESCE(its.total_costos_operacionales, 0) AS total_costos_operacionales,
          COALESCE(its.utilidad_bruta, 0) AS utilidad_bruta,
          COALESCE(its.margen_porcentaje, 0) AS margen_porcentaje,
          COUNT(ra.id_reporte_avance) FILTER (WHERE ra.estado_reporte = 'VALIDADO_ANALISTA') AS reports_validados,
          COUNT(ra.id_reporte_avance) FILTER (WHERE ra.estado_reporte = 'PENDIENTE_VALIDACION') AS reports_pendientes,
          COUNT(ra.id_reporte_avance) AS total_reports
        FROM sch_leangsp.tpry_proyecto p
        LEFT JOIN sch_leangsp.tpar_empresas clt ON p.id_empresa_cliente = clt.id_empresa
        LEFT JOIN sch_leangsp.tits_informe_termino its ON p.id_proyecto = its.id_proyecto
        LEFT JOIN sch_leangsp.tedp_reporte_avance ra ON p.id_proyecto = ra.id_proyecto
        WHERE p.id_proyecto_estado >= 4
        GROUP BY p.id_proyecto, p.codi_proyecto, p.nombre_proyecto, p.id_proyecto_estado, clt.razon_social, clt.name_empresa, p.json_field, its.id_its, its.folio_its, its.estado_its, its.total_ingresos_facturables, its.total_costos_operacionales, its.utilidad_bruta, its.margen_porcentaje
        ORDER BY p.id_proyecto DESC
        LIMIT 30;
      `;
      const otsRes = await db.query(otsQuery);

      // 3. Métricas y KPIs consolidados
      const pendientesVal = repsRes.rows.filter(r => r.estado_reporte === 'PENDIENTE_VALIDACION').length;
      const conAjustes = repsRes.rows.filter(r => r.ajustes_analista?.modificado).length;
      const otsSinIts = otsRes.rows.filter(o => !o.id_its || o.estado_its === 'BORRADOR').length;
      const itsEnAprobacion = otsRes.rows.filter(o => ['EN_REVISION_OPERACIONES', 'EN_REVISION_CONTABILIDAD'].includes(o.estado_its)).length;
      const edpListoFacturar = otsRes.rows.filter(o => o.estado_its === 'CONCLUIDO').length;

      res.json({
        success: true,
        data: {
          kpis: {
            reports_pendientes: pendientesVal,
            reports_con_ajustes: conAjustes,
            ots_sin_its: otsSinIts,
            its_en_aprobacion: itsEnAprobacion,
            edp_listos_facturar: edpListoFacturar
          },
          reports: repsRes.rows,
          ots_liquidacion: otsRes.rows
        }
      });
    } catch (err) {
      console.error('Error al obtener pendientes del analista:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // 2.2 Obtener reports pendientes y concluidos para el operador en PWA (Spec 57 / REQ-025)
  async getReportsPendientesUsuario(req, res) {
    try {
      const id_user = req.user?.id_user || req.query.id_user;
      if (!id_user) {
        return res.status(400).json({ error: 'id_user es requerido' });
      }

      const sql = `
        SELECT DISTINCT
          p.id_proyecto,
          p.codi_proyecto,
          p.nombre_proyecto,
          p.id_proyecto_estado,
          p.json_field,
          COALESCE(clt.razon_social, clt.name_empresa, p.json_field->>'cliente_nombre', 'Cliente Mandante') AS cliente_nombre,
          COALESCE(p.json_field->>'obra_nombre', p.json_field->'crm_v1'->>'obra_nombre', 'Faena') AS obra_nombre,
          COALESCE(p.json_field->>'obra_direccion', p.json_field->'crm_v1'->>'obra_direccion', 'Faena') AS obra_direccion,
          v.id_equipo,
          v.patente,
          v.estado_trayecto
        FROM sch_leangsp.tpry_proyecto p
        LEFT JOIN sch_leangsp.tpar_empresas clt ON p.id_empresa_cliente = clt.id_empresa
        LEFT JOIN sch_leangsp.tequ_log_desplazamiento v ON p.id_proyecto = v.id_proyecto AND v.id_user_chofer = $1
        WHERE (
          v.id_user_chofer = $1
          OR p.json_field::text LIKE '%' || $1::text || '%'
        )
        AND p.id_proyecto_estado IN (4, 5, 6)
        ORDER BY p.id_proyecto DESC;
      `;
      const resProy = await db.query(sql, [id_user]);

      const hoyStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });
      const pendientes = [];
      const concluidos = [];

      for (const r of resProy.rows) {
        const jf = r.json_field || {};
        const crm = jf.crm_v1 || {};
        const lines = crm.lineas_servicio || [];

        // Calcular total de días comprometidos
        let totalDias = 1;
        for (const l of lines) {
          const d = Number(l.cantidad_dias || l.dias || 0);
          if (d > totalDias) totalDias = d;
        }

        // Consultar reportes existentes para la OT
        const repRes = await db.query(
          `SELECT id_reporte_avance, dia_correlativo, fecha_reporte, estado_reporte, estado_jornada
           FROM sch_leangsp.tedp_reporte_avance
           WHERE id_proyecto = $1 AND estado_reporte != 'JORNADA_EN_CURSO'
           ORDER BY dia_correlativo ASC`,
          [r.id_proyecto]
        );
        const reportes = repRes.rows;
        const cantReportes = reportes.length;

        // Verificar si hoy ya fue reportado
        const reportadoHoy = reportes.some(x => {
          if (!x.fecha_reporte) return false;
          const f = new Date(x.fecha_reporte).toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });
          return f === hoyStr;
        });

        // Resolver equipo si no venía en el log de desplazamiento
        let idEquipo = r.id_equipo;
        let patente = r.patente;
        if (!idEquipo) {
          const firstCrane = lines.find(l => (l.tipo || '').toUpperCase().includes('GRUA') || l.equipo_asignado_id);
          if (firstCrane?.equipo_asignado_id) {
            idEquipo = firstCrane.equipo_asignado_id;
          }
        }
        if (idEquipo && !patente) {
          const eqRes = await db.query('SELECT patente FROM sch_leangsp.tequ_equipo WHERE id_equipo = $1', [idEquipo]);
          if (eqRes.rows.length > 0) patente = eqRes.rows[0].patente;
        }

        const item = {
          id_proyecto: r.id_proyecto,
          codi_proyecto: r.codi_proyecto,
          nombre_proyecto: r.nombre_proyecto,
          cliente_nombre: r.cliente_nombre,
          obra_nombre: r.obra_nombre,
          obra_direccion: r.obra_direccion,
          id_equipo: idEquipo,
          patente: patente || 'S/P',
          total_dias: totalDias,
          dias_reportados: cantReportes,
          dia_a_reportar: cantReportes + 1,
          reportado_hoy: reportadoHoy,
          estado_trayecto: r.estado_trayecto || 'ARRIBADO'
        };

        if (cantReportes >= totalDias) {
          item.puede_reportar = false;
          item.motivo = 'SERVICIO_CONCLUIDO';
          item.mensaje = `Faena concluida (${cantReportes} de ${totalDias} días reportados).`;
          concluidos.push(item);
        } else if (reportadoHoy) {
          item.puede_reportar = false;
          item.motivo = 'AL_DIA_HOY';
          item.mensaje = `Jornada de hoy reportada conforme. Siguiente reporte: Día ${cantReportes + 1} mañana.`;
          concluidos.push(item);
        } else {
          item.puede_reportar = true;
          item.motivo = 'PENDIENTE';
          item.mensaje = `Pendiente Reporte: Día ${cantReportes + 1} de ${totalDias}.`;
          pendientes.push(item);
        }
      }

      res.json({
        success: true,
        pendientes,
        concluidos,
        total_pendientes: pendientes.length,
        total_concluidos: concluidos.length
      });
    } catch (err) {
      console.error('Error al obtener reports pendientes del usuario:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // 3. Guardar y Sellar Report Diario emitido desde PWA (Momento 2 + Report Mandante)
  async guardarReportDiario(req, res) {
    try {
      let {
        id_reporte_avance,
        id_proyecto,
        id_equipo,
        id_user_operador,
        id_user_rigger,
        dia_correlativo,
        fecha_reporte,
        hora_inicio,
        hora_termino,
        horas_colacion,
        horas_operadas,
        horas_minimas,
        horas_facturables,
        horas_sobretiempo,
        horometro_inicio,
        horometro_termino,
        odometro_inicio,
        odometro_termino,
        foto_tablero_inicio,
        foto_tablero_termino,
        foto_horometro,
        notas_mecanicas_gsp,
        observacion_trabajo,
        cliente_nombre,
        cliente_rut,
        cliente_cargo,
        cliente_firma_canvas_base64,
        latitud_inicio_servicio,
        longitud_inicio_servicio,
        accuracy_firma
      } = req.body;

      // Normalización de campos alias desde Hoja de Ruta móvil
      dia_correlativo = dia_correlativo || req.body.dia || 1;
      fecha_reporte = fecha_reporte || req.body.fecha || new Date().toISOString().split('T')[0];
      horometro_termino = horometro_termino !== undefined ? horometro_termino : req.body.horometro_final;
      cliente_nombre = cliente_nombre || req.body.mandante_nombre || 'Supervisor Mandante';
      cliente_rut = cliente_rut || req.body.mandante_rut || '';
      cliente_cargo = cliente_cargo || req.body.mandante_cargo || 'ITO Mandante';
      cliente_firma_canvas_base64 = cliente_firma_canvas_base64 || req.body.firma_mandante;
      observacion_trabajo = observacion_trabajo || req.body.maniobra_detalle || '';
      horas_operadas = horas_operadas !== undefined ? horas_operadas : (req.body.horas_efectivas || 0);
      if (horas_colacion === undefined && req.body.colacion_minutos !== undefined) {
        horas_colacion = Number((Number(req.body.colacion_minutos) / 60).toFixed(2));
      }
      if (!latitud_inicio_servicio && req.body.gps_sellado?.latitud) {
        latitud_inicio_servicio = req.body.gps_sellado.latitud;
        longitud_inicio_servicio = req.body.gps_sellado.longitud;
      }

      // Si falta id_proyecto o id_user_operador, resolver por token_viaje
      const tokenViajeRef = req.body.token_viaje || req.params?.token;
      if ((!id_proyecto || !id_user_operador || !id_equipo) && tokenViajeRef) {
        try {
          const vRes = await db.query(
            'SELECT id_proyecto, id_equipo, id_user_chofer FROM tequ_log_desplazamiento WHERE token_viaje = $1 LIMIT 1',
            [tokenViajeRef]
          );
          if (vRes.rows.length > 0) {
            id_proyecto = id_proyecto || vRes.rows[0].id_proyecto;
            id_equipo = id_equipo || vRes.rows[0].id_equipo;
            id_user_operador = id_user_operador || vRes.rows[0].id_user_chofer;
          }
        } catch (tokErr) {
          console.warn('[Report] Error resolviendo contexto por token_viaje:', tokErr.message);
        }
      }
      id_user_operador = id_user_operador || 55; // Default operador Sergio Gajardo si no viene explícito

      if (!id_proyecto || !fecha_reporte || !id_user_operador) {
        return res.status(400).json({ error: 'id_proyecto, fecha_reporte y id_user_operador son obligatorios' });
      }

      // Validación estricta de cuota de días autorizados (Spec 57 / REQ-025)
      if (!id_reporte_avance && id_proyecto) {
        try {
          const proyDiasRes = await db.query(
            'SELECT json_field FROM sch_leangsp.tpry_proyecto WHERE id_proyecto = $1',
            [id_proyecto]
          );
          if (proyDiasRes.rows.length > 0) {
            const jf = proyDiasRes.rows[0].json_field || {};
            const lineas = jf.crm_v1?.lineas_servicio || jf.lineas_servicio || [];
            let totalDiasPermitidos = 1;
            for (const l of lineas) {
              const d = Number(l.cantidad_dias || l.dias || 0);
              if (d > totalDiasPermitidos) totalDiasPermitidos = d;
            }

            const repCountRes = await db.query(
              `SELECT COUNT(*) AS total FROM sch_leangsp.tedp_reporte_avance 
               WHERE id_proyecto = $1 AND estado_reporte != 'JORNADA_EN_CURSO'`,
              [id_proyecto]
            );
            const totalExistentes = parseInt(repCountRes.rows[0]?.total || '0', 10);
            if (totalExistentes >= totalDiasPermitidos) {
              return res.status(403).json({
                success: false,
                codigo: 'SERVICIO_CONCLUIDO',
                error: `Operación bloqueada por término de faena: Esta orden de trabajo ya completó sus ${totalDiasPermitidos} jornada(s) autorizadas (${totalExistentes} reportes finalizados). No es posible emitir nuevos reportes.`
              });
            }
          }
        } catch (checkErr) {
          console.warn('Advertencia comprobando cuota de días en guardarReportDiario:', checkErr.message);
        }
      }

      if (!cliente_firma_canvas_base64) {
        return res.status(400).json({ error: 'La firma manual del mandante es obligatoria para emitir el report' });
      }

      const fotoHorometroFinal = foto_tablero_termino || foto_tablero_inicio || foto_horometro || null;

      const fechaBase = fecha_reporte.split('T')[0];
      const fecha_inicio_servicio = hora_inicio ? `${fechaBase} ${hora_inicio}:00` : null;
      const fecha_termino_servicio = hora_termino ? `${fechaBase} ${hora_termino}:00` : null;

      // Garantizar coherencia contractual del piso mínimo (lineas_servicio de la OT según Estructurador)
      try {
        const pryRes = await db.query('SELECT json_field FROM tpry_proyecto WHERE id_proyecto = $1', [id_proyecto]);
        if (pryRes.rows.length > 0) {
          const lines = pryRes.rows[0].json_field?.crm_v1?.lineas_servicio || pryRes.rows[0].json_field?.lineas_servicio || [];
          let lEq = id_equipo ? lines.find(l => 
            Number(l.equipo_asignado_id) === Number(id_equipo) || Number(l.id_equipo) === Number(id_equipo)
          ) : null;
          if (!lEq) {
            lEq = lines.find(l => l.tipo && l.tipo.toUpperCase().includes('GRUA'));
          }
          if (lEq && lEq.pisoMinimo !== undefined && lEq.pisoMinimo !== null) {
            horas_minimas = Number(lEq.pisoMinimo);
          } else if (lEq && lEq.cantidad_horas) {
            horas_minimas = Number(lEq.cantidad_horas);
          } else if (pryRes.rows[0].json_field?.ejecucion_v1?.servicio?.horas_minimas) {
            horas_minimas = Number(pryRes.rows[0].json_field.ejecucion_v1.servicio.horas_minimas);
          }
        }
      } catch (e) {
        console.warn('Error resolviendo pisoMinimo en guardarReportDiario:', e.message);
      }
      horas_minimas = Number(horas_minimas || 8.0);

      // Recalcular sobretiempo y facturables con base contractual fidedigna
      if (horas_operadas !== undefined && Number(horas_operadas) > 0) {
        horas_sobretiempo = Number(Math.max(0, Number(horas_operadas) - horas_minimas).toFixed(1));
        horas_facturables = Number(Math.max(Number(horas_operadas), horas_minimas).toFixed(1));
      }

      let reportGuardado;

      if (id_reporte_avance) {
        // Actualizar el registro existente de Momento 1
        const updateSql = `
          UPDATE tedp_reporte_avance SET
            id_equipo = $1,
            id_user_operador = $2,
            id_user_rigger = $3,
            dia_correlativo = $4,
            fecha_reporte = $5,
            fecha_inicio_servicio = $6,
            fecha_termino_servicio = $7,
            latitud_inicio_servicio = $8,
            longitud_inicio_servicio = $9,
            accuracy_firma = $10,
            horas_operadas = $11,
            horas_colacion = $12,
            horas_minimas = $13,
            horas_facturables = $14,
            horas_sobretiempo = $15,
            horometro_inicio = $16,
            horometro_termino = $17,
            odometro_inicio = $18,
            odometro_termino = $19,
            foto_tablero_inicio = $20,
            foto_tablero_termino = $21,
            foto_horometro = $22,
            notas_mecanicas_gsp = $23,
            observacion_trabajo = $24,
            cliente_nombre = $25,
            cliente_rut = $26,
            cliente_cargo = $27,
            cliente_firma_canvas_base64 = $28,
            estado_reporte = 'PENDIENTE_VALIDACION',
            estado_jornada = 'FINALIZADA'
          WHERE id_reporte_avance = $29
          RETURNING *;
        `;
        const upRes = await db.query(updateSql, [
          id_equipo || null,
          id_user_operador,
          id_user_rigger || null,
          dia_correlativo || 1,
          fecha_reporte,
          fecha_inicio_servicio,
          fecha_termino_servicio,
          latitud_inicio_servicio || null,
          longitud_inicio_servicio || null,
          accuracy_firma || null,
          horas_operadas || 0,
          horas_colacion !== undefined && horas_colacion !== null ? horas_colacion : 1,
          horas_minimas || 8.0,
          horas_facturables || 0,
          horas_sobretiempo || 0,
          horometro_inicio || null,
          horometro_termino || null,
          odometro_inicio || null,
          odometro_termino || null,
          foto_tablero_inicio || null,
          foto_tablero_termino || null,
          fotoHorometroFinal,
          notas_mecanicas_gsp || '',
          observacion_trabajo || '',
          cliente_nombre || 'Supervisor Mandante',
          cliente_rut || '',
          cliente_cargo || 'Receptor en Obra',
          cliente_firma_canvas_base64,
          id_reporte_avance
        ]);
        reportGuardado = upRes.rows[0];
      } else {
        // Inserción directa en un solo paso
        const token_report = crypto.randomBytes(24).toString('hex');
        const insertSql = `
          INSERT INTO tedp_reporte_avance (
            id_proyecto,
            id_equipo,
            id_user_operador,
            id_user_rigger,
            dia_correlativo,
            fecha_reporte,
            unidad_cobro,
            fecha_inicio_servicio,
            fecha_termino_servicio,
            latitud_inicio_servicio,
            longitud_inicio_servicio,
            accuracy_firma,
            horas_operadas,
            horas_colacion,
            horas_minimas,
            horas_facturables,
            horas_sobretiempo,
            horometro_inicio,
            horometro_termino,
            odometro_inicio,
            odometro_termino,
            foto_tablero_inicio,
            foto_tablero_termino,
            foto_horometro,
            notas_mecanicas_gsp,
            observacion_trabajo,
            cliente_nombre,
            cliente_rut,
            cliente_cargo,
            cliente_firma_canvas_base64,
            token_report,
            estado_reporte,
            estado_jornada,
            fecha_registro
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, 'PENDIENTE_VALIDACION', 'FINALIZADA', CURRENT_TIMESTAMP
          )
          RETURNING *;
        `;

        const inRes = await db.query(insertSql, [
          id_proyecto,
          id_equipo || null,
          id_user_operador,
          id_user_rigger || null,
          dia_correlativo || 1,
          fecha_reporte,
          'HRS_DIA',
          fecha_inicio_servicio,
          fecha_termino_servicio,
          latitud_inicio_servicio || null,
          longitud_inicio_servicio || null,
          accuracy_firma || null,
          horas_operadas || 0,
          horas_colacion !== undefined && horas_colacion !== null ? horas_colacion : 1,
          horas_minimas || 8.0,
          horas_facturables || 0,
          horas_sobretiempo || 0,
          horometro_inicio || null,
          horometro_termino || null,
          odometro_inicio || null,
          odometro_termino || null,
          foto_tablero_inicio || null,
          foto_tablero_termino || null,
          fotoHorometroFinal,
          notas_mecanicas_gsp || '',
          observacion_trabajo || '',
          cliente_nombre || 'Supervisor Mandante',
          cliente_rut || '',
          cliente_cargo || 'Receptor en Obra',
          cliente_firma_canvas_base64,
          token_report
        ]);
        reportGuardado = inRes.rows[0];
      }

      // Opcional: Actualizar el horómetro en json_data del equipo si se ingresó
      if (id_equipo && horometro_termino) {
        try {
          await db.query(
            `UPDATE tequ_equipo SET json_data = jsonb_set(COALESCE(json_data, '{}'::jsonb), '{horometro}', $1::text::jsonb) WHERE id_equipo = $2`,
            [JSON.stringify(horometro_termino), id_equipo]
          );
        } catch (e) {
          console.warn('No se pudo actualizar horómetro del equipo:', e.message);
        }
      }

      res.status(201).json({
        success: true,
        message: 'Report Diario guardado y firmado exitosamente',
        data: reportGuardado
      });
    } catch (err) {
      console.error('Error al guardar report diario:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // 4. Validar Report Diario (Analista en Torre de Control) — Con PIN FES, PDF Oficial, Dossier y Correo
  async validarReportDiario(req, res) {
    try {
      const { id } = req.params;
      const { id_user_validador, obs_validador, ajustes } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'id_reporte_avance es requerido' });
      }

      // 4.1 Resolver un validador válido en tsec_users
      let validValidadorId = 55; // Default Sergio Gajardo
      if (id_user_validador) {
        const uCheck = await db.query('SELECT id_user FROM sch_leangsp.tsec_users WHERE id_user = $1', [id_user_validador]);
        if (uCheck.rows.length > 0) {
          validValidadorId = uCheck.rows[0].id_user;
        }
      }

      // 4.2 Validar PIN FES del Analista (Firma Electrónica Simple)
      const pinRaw = req.body.pin ? String(req.body.pin).trim() : '';
      const pinHash = (req.body.pin_hash || req.body.pass_hash_fes || '').trim();

      if (!pinHash && !pinRaw) {
        return res.status(400).json({ error: 'El PIN de 4 dígitos para Firma Electrónica Simple (FES) es obligatorio.' });
      }

      const validadorUserRes = await db.query(
        'SELECT id_user, name_frst, apellido_pat, rut, email, pass_hash_fes FROM sch_leangsp.tsec_users WHERE id_user = $1',
        [validValidadorId]
      );
      if (validadorUserRes.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario validador no encontrado en el sistema.' });
      }
      const validadorUser = validadorUserRes.rows[0];

      const computedHash = pinHash || crypto.createHash('sha256').update(pinRaw).digest('hex');

      if (!validadorUser.pass_hash_fes) {
        return res.status(400).json({ error: 'El usuario no tiene un PIN de firma FES enrolado en su cuenta.' });
      }

      if (computedHash.toLowerCase() !== validadorUser.pass_hash_fes.toLowerCase()) {
        return res.status(401).json({ error: 'PIN de Firma Electrónica Simple (FES) incorrecto.' });
      }

      // 4.3 Consultar report actual con detalles de proyecto, equipo, operador, rigger y mandante
      const repQuery = `
        SELECT 
          r.*,
          p.codi_proyecto,
          COALESCE(p.nombre_proyecto, 'Servicio de Izaje') as nombre_proyecto,
          COALESCE(clt.razon_social, clt.name_empresa, r.cliente_nombre, 'Cliente Mandante') as cliente_nombre_empresa,
          COALESCE(clt.rut_empresa, r.cliente_rut, '') as cliente_rut_empresa,
          COALESCE(p.json_field->'crm_v1'->>'obra_nombre', p.json_field->>'obra_nombre', 'Faena') as obra_nombre,
          COALESCE(p.json_field->'crm_v1'->>'obra_direccion', p.json_field->>'obra_direccion', 'Terreno en Faena') as obra_direccion,
          COALESCE(e.patente, 'S/P') as equipo_patente,
          COALESCE(e.modelo, '') as equipo_modelo,
          u_op.name_frst as op_nombre,
          u_op.apellido_pat as op_apellido,
          u_op.email as op_email,
          u_rig.name_frst as rig_nombre,
          u_rig.apellido_pat as rig_apellido,
          u_val.name_frst as val_nombre,
          u_val.apellido_pat as val_apellido,
          u_val.rut as val_rut,
          u_val.email as val_email
        FROM sch_leangsp.tedp_reporte_avance r
        LEFT JOIN sch_leangsp.tpry_proyecto p ON r.id_proyecto = p.id_proyecto
        LEFT JOIN sch_leangsp.tpar_empresas clt ON p.id_empresa_cliente = clt.id_empresa
        LEFT JOIN sch_leangsp.tequ_equipo e ON r.id_equipo = e.id_equipo
        LEFT JOIN sch_leangsp.tsec_users u_op ON r.id_user_operador = u_op.id_user
        LEFT JOIN sch_leangsp.tsec_users u_rig ON r.id_user_rigger = u_rig.id_user
        LEFT JOIN sch_leangsp.tsec_users u_val ON u_val.id_user = $1
        WHERE r.id_reporte_avance = $2
      `;
      const repRes = await db.query(repQuery, [validValidadorId, id]);

      if (repRes.rows.length === 0) {
        return res.status(404).json({ error: 'Report no encontrado' });
      }

      const rep = repRes.rows[0];

      // 4.4 Evaluar si el analista realizó ajustes numéricos
      let huboAjustes = false;
      let nuevoHorasOperadas = parseFloat(rep.horas_operadas || 0);
      let nuevoHorasFacturables = parseFloat(rep.horas_facturables || nuevoHorasOperadas);
      let nuevoHorasColacion = parseFloat(rep.horas_colacion !== undefined && rep.horas_colacion !== null ? rep.horas_colacion : 1.0);
      let nuevoHorometroInicio = parseFloat(rep.horometro_inicio || 0);
      let nuevoHorometroTermino = parseFloat(rep.horometro_termino || 0);
      let nuevoOdometroInicio = parseFloat(rep.odometro_inicio || 0);
      let nuevoOdometroTermino = parseFloat(rep.odometro_termino || 0);
      let nuevaFechaInicio = rep.fecha_inicio_servicio;
      let nuevaFechaTermino = rep.fecha_termino_servicio;
      let nuevoSobretiempo = parseFloat(rep.horas_sobretiempo || 0);
      let payloadAjustes = rep.ajustes_analista || null;

      if (ajustes && typeof ajustes === 'object') {
        const hInicio = ajustes.hora_inicio || null;
        const hTermino = ajustes.hora_termino || null;
        const hCol = ajustes.horas_colacion !== undefined && ajustes.horas_colacion !== null ? parseFloat(ajustes.horas_colacion) : null;
        const horoIni = ajustes.horometro_inicio !== undefined && ajustes.horometro_inicio !== null ? parseFloat(ajustes.horometro_inicio) : null;
        const horoFin = ajustes.horometro_termino !== undefined && ajustes.horometro_termino !== null ? parseFloat(ajustes.horometro_termino) : null;
        const odoIni = ajustes.odometro_inicio !== undefined && ajustes.odometro_inicio !== null ? parseFloat(ajustes.odometro_inicio) : null;
        const odoFin = ajustes.odometro_termino !== undefined && ajustes.odometro_termino !== null ? parseFloat(ajustes.odometro_termino) : null;
        const hFact = ajustes.horas_facturables !== undefined && ajustes.horas_facturables !== null ? parseFloat(ajustes.horas_facturables) : null;
        const hOper = ajustes.horas_operadas !== undefined && ajustes.horas_operadas !== null ? parseFloat(ajustes.horas_operadas) : null;

        const parseHHMM = (val, def) => {
          if (!val) return def;
          try {
            const s = String(val).trim();
            if (/^\d{2}:\d{2}$/.test(s)) return s;
            const d = new Date(val);
            if (!isNaN(d.getTime())) {
              return d.toLocaleTimeString('es-CL', {
                timeZone: 'America/Santiago',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              });
            }
          } catch (e) {}
          return def;
        };

        const origHInicio = parseHHMM(rep.fecha_inicio_servicio, '08:00');
        const origHTermino = parseHHMM(rep.fecha_termino_servicio, '18:00');

        const difHInicio = hInicio && hInicio !== origHInicio;
        const difHTermino = hTermino && hTermino !== origHTermino;
        const difCol = hCol !== null && Math.abs(hCol - nuevoHorasColacion) > 0.01;
        const difHoroIni = horoIni !== null && Math.abs(horoIni - nuevoHorometroInicio) > 0.01;
        const difHoroFin = horoFin !== null && Math.abs(horoFin - nuevoHorometroTermino) > 0.01;
        const difOdoIni = odoIni !== null && Math.abs(odoIni - nuevoOdometroInicio) > 0.1;
        const difOdoFin = odoFin !== null && Math.abs(odoFin - nuevoOdometroTermino) > 0.1;
        const difFact = hFact !== null && Math.abs(hFact - nuevoHorasFacturables) > 0.01;
        const difOper = hOper !== null && Math.abs(hOper - nuevoHorasOperadas) > 0.01;

        if (difHInicio || difHTermino || difCol || difHoroIni || difHoroFin || difOdoIni || difOdoFin || difFact || difOper) {
          huboAjustes = true;

          const fechaBase = rep.fecha_reporte ? (new Date(rep.fecha_reporte).toISOString().split('T')[0]) : (new Date().toISOString().split('T')[0]);
          if (hInicio) nuevaFechaInicio = `${fechaBase} ${hInicio}:00`;
          if (hTermino) nuevaFechaTermino = `${fechaBase} ${hTermino}:00`;

          payloadAjustes = {
            modificado: true,
            fecha_ajuste: new Date().toISOString(),
            id_user_analista: validValidadorId,
            nombre_analista: `${validadorUser.name_frst} ${validadorUser.apellido_pat || ''}`.trim(),
            valores_originales: {
              hora_inicio: origHInicio,
              hora_termino: origHTermino,
              horas_operadas: nuevoHorasOperadas,
              horas_facturables: nuevoHorasFacturables,
              horas_colacion: nuevoHorasColacion,
              horometro_inicio: nuevoHorometroInicio,
              horometro_termino: nuevoHorometroTermino,
              odometro_inicio: nuevoOdometroInicio,
              odometro_termino: nuevoOdometroTermino
            },
            valores_ajustados: {
              hora_inicio: hInicio || origHInicio,
              hora_termino: hTermino || origHTermino,
              horas_operadas: hOper !== null ? hOper : nuevoHorasOperadas,
              horas_facturables: hFact !== null ? hFact : nuevoHorasFacturables,
              horas_colacion: hCol !== null ? hCol : nuevoHorasColacion,
              horometro_inicio: horoIni !== null ? horoIni : nuevoHorometroInicio,
              horometro_termino: horoFin !== null ? horoFin : nuevoHorometroTermino,
              odometro_inicio: odoIni !== null ? odoIni : nuevoOdometroInicio,
              odometro_termino: odoFin !== null ? odoFin : nuevoOdometroTermino
            },
            observacion_ajuste: obs_validador || 'Ajustes validados por Control de Gestión'
          };

          if (hFact !== null) nuevoHorasFacturables = hFact;
          if (hOper !== null) nuevoHorasOperadas = hOper;
          if (hCol !== null) nuevoHorasColacion = hCol;
          if (horoIni !== null) nuevoHorometroInicio = horoIni;
          if (horoFin !== null) nuevoHorometroTermino = horoFin;
          if (odoIni !== null) nuevoOdometroInicio = odoIni;
          if (odoFin !== null) nuevoOdometroTermino = odoFin;

          const baseMin = parseFloat(rep.horas_minimas || 4.0);
          nuevoSobretiempo = Math.max(0, nuevoHorasFacturables - baseMin);
        }
      }

      // Código de certificación digital FES
      const codigoFes = `FES-REP-${id}-${Date.now().toString(36).toUpperCase()}`;

      // 4.5 Actualizar en BD el estado y firma FES
      const updateSql = `
        UPDATE sch_leangsp.tedp_reporte_avance
        SET 
          estado_reporte = 'VALIDADO_ANALISTA',
          id_user_validador = $1,
          fecha_validacion = CURRENT_TIMESTAMP,
          fecha_firma_fes = CURRENT_TIMESTAMP,
          codigo_validacion_fes = $2,
          obs_validador = $3,
          horas_operadas = $4,
          horas_facturables = $5,
          horas_colacion = $6,
          horometro_inicio = $7,
          horometro_termino = $8,
          odometro_inicio = $9,
          odometro_termino = $10,
          fecha_inicio_servicio = $11,
          fecha_termino_servicio = $12,
          horas_sobretiempo = $13,
          ajustes_analista = $14
        WHERE id_reporte_avance = $15
        RETURNING *;
      `;

      const result = await db.query(updateSql, [
        validValidadorId,
        codigoFes,
        obs_validador || (huboAjustes ? 'Report validado con ajustes por Analista de Operaciones' : 'Report diario validado conforme por Analista de Operaciones'),
        nuevoHorasOperadas,
        nuevoHorasFacturables,
        nuevoHorasColacion,
        nuevoHorometroInicio,
        nuevoHorometroTermino,
        nuevoOdometroInicio,
        nuevoOdometroTermino,
        nuevaFechaInicio,
        nuevaFechaTermino,
        nuevoSobretiempo,
        payloadAjustes ? JSON.stringify(payloadAjustes) : null,
        id
      ]);

      const reportActualizado = result.rows[0];

      // 4.6 Generar PDF Oficial del Report Diario con Doble Firma (Mandante GPS + FES Analista)
      let idDocPdf = null;
      let urlPdfView = '';
      let urlPdfDownload = '';

      try {
        const pdfBuffer = await generarPdfReportDiario({
          report: {
            ...rep,
            ...reportActualizado,
            equipo_patente: rep.equipo_patente,
            equipo_modelo: rep.equipo_modelo,
            op_nombre: rep.op_nombre,
            op_apellido: rep.op_apellido,
            rig_nombre: rep.rig_nombre,
            rig_apellido: rep.rig_apellido,
            val_nombre: validadorUser.name_frst,
            val_apellido: validadorUser.apellido_pat,
            val_rut: validadorUser.rut,
            ajustes_analista: payloadAjustes
          },
          proyecto: {
            codi_proyecto: rep.codi_proyecto,
            cliente_nombre: rep.cliente_nombre_empresa || rep.cliente_nombre,
            cliente_rut: rep.cliente_rut_empresa || rep.cliente_rut,
            obra_nombre: rep.obra_nombre,
            obra_direccion: rep.obra_direccion
          },
          validador: validadorUser,
          codigoFes,
          validacionUrl: `${process.env.APP_BASE_URL || 'https://servidor.leanglobal.cl'}/lg-gsp-dev/validador-doc`
        });

        // 4.7 Guardar archivo siguiendo leanglobal_file_storage_standard
        const path_relativo = buildStoragePath('GSP', 'reports');
        const targetDir = path.join(STORAGE_ROOT, path_relativo);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        const fileName = `Report_Diario_OT_${rep.codi_proyecto || rep.id_proyecto}_D${rep.dia_correlativo || 1}_${Date.now()}.pdf`;
        const filePath = path.join(targetDir, fileName);
        fs.writeFileSync(filePath, pdfBuffer);

        // Guardar metadatos en tfmg_file
        const archivoM = new archivoModel();
        const docFile = await archivoM.insertarTfmgFile(
          'REPORT_DIARIO',
          'application/pdf',
          `Report_Diario_OT_${rep.codi_proyecto || rep.id_proyecto}_D${rep.dia_correlativo || 1}.pdf`,
          fileName,
          path_relativo,
          validValidadorId,
          'A'
        );

        idDocPdf = docFile.id_doc;
        urlPdfView = `/api/v1/storage/view/${idDocPdf}`;
        urlPdfDownload = `/api/v1/storage/download/${idDocPdf}`;

        // Asociar id_doc_pdf a tedp_reporte_avance
        await db.query(
          'UPDATE sch_leangsp.tedp_reporte_avance SET id_doc_pdf = $1 WHERE id_reporte_avance = $2',
          [idDocPdf, id]
        );
        reportActualizado.id_doc_pdf = idDocPdf;
        reportActualizado.codigo_validacion_fes = codigoFes;

        // 4.8 Adjuntar documento al Dossier del Proyecto en tpry_proyecto (json_field.ejecucion_v1.dossier_documentos)
        try {
          const pryDocRes = await db.query('SELECT json_field FROM sch_leangsp.tpry_proyecto WHERE id_proyecto = $1', [rep.id_proyecto]);
          if (pryDocRes.rows.length > 0) {
            const jf = pryDocRes.rows[0].json_field || {};
            if (!jf.ejecucion_v1) jf.ejecucion_v1 = {};
            if (!Array.isArray(jf.ejecucion_v1.dossier_documentos)) jf.ejecucion_v1.dossier_documentos = [];

            const docDossierItem = {
              id_doc: idDocPdf,
              tipo_documento: 'REPORT_DIARIO',
              categoria: 'REPORTES_OPERACIONALES',
              nombre: `Report Diario Digital — Día ${rep.dia_correlativo || 1}`,
              folio: `REP-${rep.codi_proyecto || rep.id_proyecto}-D${rep.dia_correlativo || 1}`,
              fecha_emision: new Date().toISOString(),
              fecha_servicio: rep.fecha_reporte,
              id_reporte_avance: Number(id),
              dia_correlativo: rep.dia_correlativo || 1,
              codigo_fes: codigoFes,
              firmado_por: `${validadorUser.name_frst} ${validadorUser.apellido_pat || ''}`.trim(),
              url_view: urlPdfView,
              url_download: urlPdfDownload
            };

            jf.ejecucion_v1.dossier_documentos = jf.ejecucion_v1.dossier_documentos.filter(
              d => Number(d.id_reporte_avance) !== Number(id)
            );
            jf.ejecucion_v1.dossier_documentos.unshift(docDossierItem);

            await db.query('UPDATE sch_leangsp.tpry_proyecto SET json_field = $1 WHERE id_proyecto = $2', [jf, rep.id_proyecto]);
          }
        } catch (dosErr) {
          console.warn('[DOSSIER] Error adjuntando report a dossier de proyecto:', dosErr.message);
        }
      } catch (errPdf) {
        console.error('[PDF-REPORT] Error al compilar o almacenar PDF del report diario:', errPdf);
      }

      // 4.9 Notificación por CORREO con enlace de descarga del PDF y sello FES
      try {
        const nombreAnalista = `${validadorUser.name_frst} ${validadorUser.apellido_pat || ''}`.trim() || 'Control de Gestión';
        const rutAnalista = validadorUser.rut || '---';
        const nombreOperador = `${rep.op_nombre || ''} ${rep.op_apellido || ''}`.trim() || 'Operador en Terreno';
        const diaNum = rep.dia_correlativo || 1;
        const codiOT = rep.codi_proyecto || `OT-${rep.id_proyecto}`;
        const fechaFormat = rep.fecha_reporte ? new Date(rep.fecha_reporte).toLocaleDateString('es-CL', { timeZone: 'UTC' }) : 'Hoy';

        const asunto = huboAjustes
          ? `[GSP] ⚠️ Report Diario Validado CON AJUSTES — ${codiOT} (Día ${diaNum})`
          : `[GSP] ✅ Report Diario Validado Conforme — ${codiOT} (Día ${diaNum})`;

        let tablaHtml = '';
        if (huboAjustes && payloadAjustes?.valores_originales) {
          const orig = payloadAjustes.valores_originales;
          const ajus = payloadAjustes.valores_ajustados;
          tablaHtml = `
            <div style="margin: 18px 0; background: #0f172a; border-radius: 8px; border: 1px solid #334155; overflow: hidden;">
              <div style="background: #1e293b; padding: 10px 14px; font-weight: bold; color: #f59e0b; font-size: 13px; text-transform: uppercase;">
                🔍 Auditoría de Modificaciones de Terreno
              </div>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; color: #cbd5e1;">
                <thead>
                  <tr style="border-bottom: 1px solid #334155; background: #0b1120;">
                    <th style="padding: 8px 12px;">Concepto</th>
                    <th style="padding: 8px 12px; text-align: center;">Reportado en Terreno</th>
                    <th style="padding: 8px 12px; text-align: center;">Validado por Analista</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style="border-bottom: 1px solid #1e293b;">
                    <td style="padding: 8px 12px;">Horas Facturables</td>
                    <td style="padding: 8px 12px; text-align: center;"><span style="color: #ef4444; text-decoration: line-through; font-family: monospace;">${orig.horas_facturables} hrs</span></td>
                    <td style="padding: 8px 12px; text-align: center;"><strong style="color: #10b981; font-family: monospace; font-size: 14px;">${ajus.horas_facturables} hrs</strong></td>
                  </tr>
                  <tr style="border-bottom: 1px solid #1e293b;">
                    <td style="padding: 8px 12px;">Horas Efectivas Operadas</td>
                    <td style="padding: 8px 12px; text-align: center;"><span style="color: #ef4444; text-decoration: line-through; font-family: monospace;">${orig.horas_operadas} hrs</span></td>
                    <td style="padding: 8px 12px; text-align: center;"><strong style="color: #10b981; font-family: monospace; font-size: 14px;">${ajus.horas_operadas} hrs</strong></td>
                  </tr>
                  <tr style="border-bottom: 1px solid #1e293b;">
                    <td style="padding: 8px 12px;">Colación</td>
                    <td style="padding: 8px 12px; text-align: center;"><span style="color: #ef4444; text-decoration: line-through; font-family: monospace;">${orig.horas_colacion} hrs</span></td>
                    <td style="padding: 8px 12px; text-align: center;"><strong style="color: #10b981; font-family: monospace;">${ajus.horas_colacion} hrs</strong></td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 12px;">Horómetro Motor</td>
                    <td style="padding: 8px 12px; text-align: center;"><span style="color: #ef4444; text-decoration: line-through; font-family: monospace;">${orig.horometro_inicio} ➔ ${orig.horometro_termino}</span></td>
                    <td style="padding: 8px 12px; text-align: center;"><strong style="color: #10b981; font-family: monospace;">${ajus.horometro_inicio} ➔ ${ajus.horometro_termino}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          `;
        } else {
          tablaHtml = `
            <div style="margin: 16px 0; background: #064e3b15; border: 1px solid #05966940; border-radius: 8px; padding: 12px 16px; color: #a7f3d0; font-size: 13px;">
              ✅ <strong>Validación Conforme:</strong> Las horas reportadas (<strong>${nuevoHorasFacturables} hrs</strong>) y horómetros corresponden exactamente a lo registrado en terreno sin discrepancias.
            </div>
          `;
        }

        const baseUrlApp = process.env.APP_BASE_URL || 'https://servidor.leanglobal.cl';
        const linkPdfCompleto = urlPdfView ? `${baseUrlApp}${urlPdfView}` : '';

        const contenidoMail = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #334155;">
            <p style="font-size: 14px; margin-bottom: 12px;">
              El Analista de Control de Gestión <strong>${nombreAnalista}</strong> ha validado y firmado electrónicamente con su clave PIN el report diario de faena:
            </p>
            <ul style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 24px; font-size: 13px; list-style-type: none; margin: 0 0 16px 0;">
              <li style="margin-bottom: 4px;">📌 <strong>Orden de Trabajo:</strong> <span style="font-family: monospace; color: #0284c7; font-weight: bold;">${codiOT}</span></li>
              <li style="margin-bottom: 4px;">🏢 <strong>Faena / Obra:</strong> ${rep.obra_nombre}</li>
              <li style="margin-bottom: 4px;">🚚 <strong>Grúa / Patente:</strong> ${rep.equipo_patente} (${rep.equipo_modelo})</li>
              <li style="margin-bottom: 4px;">👷 <strong>Operador:</strong> ${nombreOperador}</li>
              <li style="margin-bottom: 4px;">📅 <strong>Fecha Faena:</strong> ${fechaFormat} (Día ${diaNum})</li>
              <li style="margin-bottom: 4px;">🔒 <strong>Código FES Analista:</strong> <span style="font-family: monospace; color: #166534; font-weight: bold;">${codigoFes}</span></li>
            </ul>

            ${tablaHtml}

            ${linkPdfCompleto ? `
              <div style="margin: 22px 0; text-align: center; background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px;">
                <div style="font-size: 11px; font-weight: bold; color: #166534; text-transform: uppercase; margin-bottom: 4px;">
                  📄 Documento Oficial Adjuntado al Dossier del Proyecto
                </div>
                <div style="font-size: 12px; color: #15803d; margin-bottom: 12px;">
                  El PDF oficial incluye la firma en pantalla y coordenadas GPS del cliente en terreno más la firma electrónica (FES) del analista.
                </div>
                <a href="${linkPdfCompleto}" target="_blank" style="background: #047857; color: #ffffff; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 13px; text-decoration: none; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                  DESCARGAR REPORT DIARIO DIGITAL OFICIAL (PDF)
                </a>
              </div>
            ` : ''}

            <div style="background: #fefce8; border-left: 4px solid #eab308; padding: 12px; margin: 16px 0; border-radius: 4px;">
              <strong style="color: #854d0e; font-size: 12px; text-transform: uppercase;">Observaciones del Analista:</strong>
              <p style="margin: 4px 0 0 0; color: #713f12; font-size: 13px;">
                "${obs_validador || (huboAjustes ? 'Ajustes aplicados conforme a auditoría de telemetría.' : 'Aprobado sin observaciones.')}"
              </p>
            </div>
          </div>
        `;

        // Destinatarios: Jefatura de Operaciones + Analista + Operador si tiene email
        const destinatariosSet = new Set(['logistica@arriendosanpablo.cl', 'j.poncenavarrete@gmail.com']);
        if (validadorUser.email) destinatariosSet.add(validadorUser.email);
        if (rep.op_email && rep.op_email.includes('@')) destinatariosSet.add(rep.op_email);

        for (const emailDest of destinatariosSet) {
          notificacionService.despacharEmailSmtp({
            para: emailDest,
            asunto: asunto,
            titulo: huboAjustes ? `Report Validado con Ajustes: ${codiOT}` : `Report Validado Conforme: ${codiOT}`,
            subtitulo: `Día ${diaNum} — Validado con PIN FES por ${nombreAnalista}`,
            contenido: contenidoMail,
            botonTexto: 'VER EN TORRE DE CONTROL',
            botonUrl: notificacionService.construirDeepLink({
              tipoApp: 'WEB',
              ruta: 'crm',
              params: { id_proyecto: rep.id_proyecto, subtab: 'reports' }
            })
          }).catch(e => console.warn(`[NOTIF-REPORT] Error enviando a ${emailDest}:`, e.message));
        }
      } catch (errNotif) {
        console.warn('[NOTIF-REPORT] Aviso: Fallo en envío de correo de validación:', errNotif.message);
      }

      res.json({
        success: true,
        message: huboAjustes 
          ? 'Report diario validado con firma electrónica FES y ajustes del Analista' 
          : 'Report diario validado y firmado electrónicamente con éxito',
        hubo_ajustes: huboAjustes,
        codigo_fes: codigoFes,
        id_doc_pdf: idDocPdf,
        url_pdf_view: urlPdfView,
        url_pdf_download: urlPdfDownload,
        data: reportActualizado
      });
    } catch (err) {
      console.error('Error al validar report diario:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // 5. Obtener Resumen y Conciliación Financiera para Estado de Pago (EDP) (Spec 38)
  async getResumenEDP(req, res) {
    try {
      const { id_proyecto } = req.params;
      if (!id_proyecto) {
        return res.status(400).json({ error: 'id_proyecto es requerido' });
      }

      // 5.1 Datos de la OT y Cliente Mandante
      const proySql = `
        SELECT 
          p.id_proyecto,
          p.codi_proyecto,
          p.nombre_proyecto,
          p.id_proyecto_estado,
          p.json_field,
          COALESCE(clt.razon_social, clt.name_empresa, 'Cliente Mandante') AS cliente_nombre,
          COALESCE(clt.rut_empresa, '') AS cliente_rut,
          COALESCE(p.json_field->>'obra_nombre', p.json_field->'crm_v1'->>'obra_nombre', p.nombre_proyecto) AS obra_nombre,
          COALESCE(p.json_field->>'obra_direccion', p.json_field->'crm_v1'->>'obra_direccion', 'Faena en Terreno') AS obra_direccion
        FROM tpry_proyecto p
        LEFT JOIN tpar_empresas clt ON p.id_empresa_cliente = clt.id_empresa
        WHERE p.id_proyecto = $1;
      `;
      const proyRes = await db.query(proySql, [id_proyecto]);
      if (proyRes.rows.length === 0) {
        return res.status(404).json({ error: 'Proyecto no encontrado' });
      }
      const proyecto = proyRes.rows[0];

      // 5.2 Obtener líneas cotizadas
      const crmV1 = proyecto.json_field?.crm_v1 || {};
      const lineasCotizadas = crmV1.lineas_servicio || crmV1.snapshot_comercial?.lines || [];

      // 5.3 Obtener todos los reports emitidos
      const repSql = `
        SELECT 
          r.id_reporte_avance,
          r.id_equipo,
          r.dia_correlativo,
          r.fecha_reporte,
          r.horas_operadas,
          r.horas_facturables,
          r.horas_sobretiempo,
          r.horometro_inicio,
          r.horometro_termino,
          r.cliente_nombre,
          r.cliente_cargo,
          r.cliente_firma_canvas_base64,
          r.estado_reporte,
          r.fecha_inicio_servicio,
          r.fecha_termino_servicio,
          COALESCE(e.patente, 'S/P') AS equipo_patente,
          COALESCE(e.modelo, 'Grúa') AS equipo_modelo
        FROM tedp_reporte_avance r
        LEFT JOIN tequ_equipo e ON r.id_equipo = e.id_equipo
        WHERE r.id_proyecto = $1
        ORDER BY r.dia_correlativo ASC, r.fecha_reporte ASC;
      `;
      const repRes = await db.query(repSql, [id_proyecto]);
      const reports = repRes.rows;

      // 5.4 Motor de Conciliación Financiera
      let totalHorasFacturables = 0;
      let totalHorasSobretiempo = 0;
      reports.forEach(r => {
        totalHorasFacturables += Number(r.horas_facturables) || 0;
        totalHorasSobretiempo += Number(r.horas_sobretiempo) || 0;
      });

      // Calcular montos por línea
      let montoNetoEquipos = 0;
      let montoNetoFlete = 0;
      let montoNetoOtros = 0;

      const lineasCalculadas = lineasCotizadas.map(l => {
        const valUnit = Number(l.valorUnitario) || 0;
        const cant = Number(l.cantidad) || 1;
        let subtotal = 0;
        let horasCalculo = 0;

        if (l.tipo === 'TRASLADOS' || l.subcategoria?.includes('ESCOLTA') || l.subcategoria?.includes('FLETE')) {
          subtotal = valUnit * cant;
          montoNetoFlete += subtotal;
        } else if (l.tipo === 'GRUAS TELESCOPICAS' || l.tipo === 'GRUA HORQUILLA' || l.tipo === 'MANIPULADOR TELESCOPICO' || l.tipo === 'CAMION PLUMA') {
          // Si la cotización tiene valor unitario, multiplicamos por las horas reales o tarifa diaria
          if (l.unidad === 'Diario') {
            const diasFaena = Math.max(1, reports.length);
            subtotal = valUnit * diasFaena * cant;
            horasCalculo = totalHorasFacturables;
          } else {
            // Por horas
            subtotal = valUnit * (totalHorasFacturables > 0 ? totalHorasFacturables : (cant * 8));
            horasCalculo = totalHorasFacturables;
          }
          montoNetoEquipos += subtotal;
        } else {
          subtotal = valUnit * cant;
          montoNetoOtros += subtotal;
        }

        return {
          ...l,
          subtotal_calculado: subtotal,
          horas_aplicadas: horasCalculo
        };
      });

      // Cálculo de sobretiempo (tarifa estimada sobretiempo = 1.5x o pactada)
      const tarifaSobretiempoPromedio = montoNetoEquipos > 0 && totalHorasFacturables > 0 
        ? (montoNetoEquipos / totalHorasFacturables) * 1.5 
        : 50000;
      const montoSobretiempoNeto = Math.round(totalHorasSobretiempo * tarifaSobretiempoPromedio);

      const totalNeto = montoNetoEquipos + montoNetoFlete + montoNetoOtros + montoSobretiempoNeto;
      const iva19 = Math.round(totalNeto * 0.19);
      const totalBruto = totalNeto + iva19;

      const liquidacionGuardada = proyecto.json_field?.liquidacion_v1 || null;

      res.json({
        success: true,
        data: {
          proyecto: {
            id_proyecto: proyecto.id_proyecto,
            codi_proyecto: proyecto.codi_proyecto,
            nombre_proyecto: proyecto.nombre_proyecto,
            id_proyecto_estado: proyecto.id_proyecto_estado,
            cliente_nombre: proyecto.cliente_nombre,
            cliente_rut: proyecto.cliente_rut,
            obra_nombre: proyecto.obra_nombre,
            obra_direccion: proyecto.obra_direccion
          },
          lineas_cotizadas: lineasCalculadas,
          reports_validados: reports,
          resumen_financiero: {
            dias_totales: reports.length,
            horas_facturables_totales: totalHorasFacturables.toFixed(1),
            horas_sobretiempo_totales: totalHorasSobretiempo.toFixed(1),
            monto_equipos_neto: montoNetoEquipos,
            monto_flete_neto: montoNetoFlete,
            monto_otros_neto: montoNetoOtros,
            monto_sobretiempo_neto: montoSobretiempoNeto,
            total_neto: totalNeto,
            iva_19: iva19,
            total_bruto: totalBruto
          },
          liquidacion_guardada: liquidacionGuardada
        }
      });
    } catch (err) {
      console.error('Error al obtener resumen de EDP:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // 6. Registrar Facturación y Cerrar Servicio OT (Spec 38)
  async cerrarFacturacion(req, res) {
    try {
      const { 
        id_proyecto, 
        hes_oc_numero, 
        factura_numero, 
        fecha_facturacion, 
        monto_facturado_neto,
        monto_facturado_bruto,
        observaciones_facturacion,
        id_user_cierre
      } = req.body;

      if (!id_proyecto) {
        return res.status(400).json({ error: 'id_proyecto es requerido' });
      }

      const liquidacionData = {
        hes_oc_numero: hes_oc_numero || '',
        factura_numero: factura_numero || '',
        fecha_facturacion: fecha_facturacion || new Date().toISOString().split('T')[0],
        monto_facturado_neto: Number(monto_facturado_neto) || 0,
        monto_facturado_bruto: Number(monto_facturado_bruto) || 0,
        observaciones_facturacion: observaciones_facturacion || '',
        id_user_cierre: id_user_cierre || null,
        fecha_cierre: new Date().toISOString(),
        estado_financiero: 'FACTURADO_CONFORME'
      };

      // Actualizar estado a 7 (Facturado / Cerrado) y guardar liquidacion_v1
      const updateSql = `
        UPDATE tpry_proyecto
        SET 
          id_proyecto_estado = 7,
          json_field = jsonb_set(
            COALESCE(json_field, '{}'::jsonb),
            '{liquidacion_v1}',
            $1::jsonb,
            true
          )
        WHERE id_proyecto = $2
        RETURNING id_proyecto, codi_proyecto, id_proyecto_estado, json_field;
      `;

      const result = await db.query(updateSql, [
        JSON.stringify(liquidacionData),
        id_proyecto
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Proyecto no encontrado' });
      }

      res.json({
        success: true,
        message: 'OT declarada Facturada y Concluida exitosamente',
        data: result.rows[0]
      });
    } catch (err) {
      console.error('Error al cerrar facturación de OT:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // 7. Auditar Incumplimientos de SLA de Validación PMO (Spec 57 / REQ-026)
  async auditarSLA(req, res) {
    try {
      const auditoria = await slaAuditorService.auditarIncumplimientosSLA();
      res.json({ success: true, data: auditoria });
    } catch (err) {
      console.error('[SLA] Error al auditar SLA:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 8. Ejecutar Alertas de SLA WhatsApp y Email (Yiara y Jorge) (Spec 57 / REQ-026)
  async ejecutarAlertasSLA(req, res) {
    try {
      const forzar = req.body?.forzar === true || req.query?.forzar === 'true';
      const resultado = await slaAuditorService.ejecutarAlertasSLA(forzar);
      res.json(resultado);
    } catch (err) {
      console.error('[SLA] Error al ejecutar alertas de SLA:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
};

module.exports = reportDiarioController;
