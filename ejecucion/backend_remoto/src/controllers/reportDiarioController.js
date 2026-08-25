const db = require('../config/dbConfig');
const crypto = require('crypto');

const reportDiarioController = {
  // 1. Obtener contexto y datos precargados para emitir Report Diario (PWA)
  async getReportContexto(req, res) {
    try {
      const { id_proyecto } = req.params;
      if (!id_proyecto) {
        return res.status(400).json({ error: 'id_proyecto es requerido' });
      }

      // 1.1 Consultar datos del proyecto / OT
      const proySql = `
        SELECT 
          p.id_proyecto,
          p.codi_proyecto,
          p.nombre_proyecto,
          p.id_proyecto_estado,
          p.json_field,
          COALESCE(p.json_field->>'cliente_nombre', p.json_field->'ejecucion_v1'->'cliente'->>'razon_social', 'Cliente GSP') AS cliente_nombre,
          COALESCE(p.json_field->>'cliente_rut', p.json_field->'ejecucion_v1'->'cliente'->>'rut', '') AS cliente_rut,
          COALESCE(p.json_field->>'obra_nombre', p.json_field->'ejecucion_v1'->'cliente'->>'obra', p.nombre_proyecto) AS obra_nombre,
          COALESCE(p.json_field->>'direccion_obra', p.json_field->'ejecucion_v1'->'cliente'->>'direccion_faena', 'Faena en Terreno') AS obra_direccion
        FROM sch_leangsp.tpry_proyecto p
        WHERE p.id_proyecto = $1;
      `;
      const proyRes = await db.query(proySql, [id_proyecto]);
      if (proyRes.rows.length === 0) {
        return res.status(404).json({ error: 'Proyecto no encontrado' });
      }
      const proyecto = proyRes.rows[0];

      // 1.2 Consultar equipos asignados
      const eqSql = `
        SELECT 
          re.id_rel_equipo,
          re.id_equipo,
          re.rol_equipo,
          e.patente,
          e.modelo,
          e.marca,
          COALESCE(e.tipo_equipo, 'GRUAS TELESCOPICAS') AS tipo_equipo,
          COALESCE((e.json_data->>'horometro')::numeric, 0) AS horometro_base
        FROM sch_leangsp.tpry_rel_equipo re
        JOIN sch_leangsp.tequ_equipo e ON re.id_equipo = e.id_equipo
        WHERE re.id_proyecto = $1;
      `;
      const eqRes = await db.query(eqSql, [id_proyecto]);

      // 1.3 Consultar personal / tripulación asignada
      const perSql = `
        SELECT 
          rp.id_rel_persona,
          rp.id_user,
          rp.rol_asignado,
          u.name_frst,
          u.apellido_pat,
          u.apellido_mat,
          u.email,
          u.rut
        FROM sch_leangsp.tpry_rel_persona rp
        JOIN sch_leangsp.tsec_users u ON rp.id_user = u.id_user
        WHERE rp.id_proyecto = $1;
      `;
      const perRes = await db.query(perSql, [id_proyecto]);

      // 1.4 Consultar reports ya emitidos para calcular día correlativo y último horómetro
      const repSql = `
        SELECT 
          id_reporte_avance,
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
        FROM sch_leangsp.tedp_reporte_avance
        WHERE id_proyecto = $1
        ORDER BY dia_correlativo ASC, fecha_reporte ASC;
      `;
      const repRes = await db.query(repSql, [id_proyecto]);
      const reports = repRes.rows;

      // Calcular día correlativo sugerido y horómetro de inicio sugerido
      let diaSugerido = 1;
      let horometroSugerido = null;

      if (reports.length > 0) {
        const maxDia = Math.max(...reports.map(r => Number(r.dia_correlativo) || 0));
        diaSugerido = maxDia + 1;
        const ultimoReport = reports[reports.length - 1];
        if (ultimoReport.horometro_termino) {
          horometroSugerido = Number(ultimoReport.horometro_termino);
        }
      }

      // Si no hay reports previos, consultar si el viaje de desplazamiento registró horómetro
      if (!horometroSugerido) {
        try {
          const vjSql = `
            SELECT horometro_final, horometro_inicial 
            FROM sch_leangsp.tequ_log_desplazamiento 
            WHERE id_proyecto = $1 
            ORDER BY id_log_desplazamiento DESC LIMIT 1;
          `;
          const vjRes = await db.query(vjSql, [id_proyecto]);
          if (vjRes.rows.length > 0) {
            const vj = vjRes.rows[0];
            horometroSugerido = Number(vj.horometro_final || vj.horometro_inicial) || null;
          }
        } catch (eVj) {
          console.warn('Error consultando viaje para horómetro:', eVj.message);
        }
      }

      if (!horometroSugerido && eqRes.rows.length > 0 && eqRes.rows[0].horometro_base) {
        horometroSugerido = Number(eqRes.rows[0].horometro_base);
      }

      // Horas mínimas configuradas en la propuesta / OT
      let horasMinimas = 4.0;
      try {
        const jsonField = proyecto.json_field || {};
        if (jsonField.ejecucion_v1?.servicio?.horas_minimas) {
          horasMinimas = Number(jsonField.ejecucion_v1.servicio.horas_minimas);
        } else if (jsonField.horas_minimas) {
          horasMinimas = Number(jsonField.horas_minimas);
        }
      } catch (e) {
        horasMinimas = 4.0;
      }

      res.json({
        success: true,
        data: {
          proyecto,
          equipos: eqRes.rows,
          personas: perRes.rows,
          reports,
          dia_sugerido: diaSugerido,
          horometro_sugerido: horometroSugerido,
          horas_minimas: horasMinimas
        }
      });
    } catch (err) {
      console.error('Error al obtener contexto de report diario:', err);
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
          r.accuracy_firma,
          r.horas_operadas,
          r.horas_standby,
          r.horas_colacion,
          r.horas_minimas,
          r.horas_facturables,
          r.horas_sobretiempo,
          r.horometro_inicio,
          r.horometro_termino,
          r.foto_horometro,
          r.monto_devengado_dia,
          r.observacion_trabajo,
          r.cliente_nombre,
          r.cliente_rut,
          r.cliente_cargo,
          r.cliente_firma_canvas_base64,
          r.token_report,
          r.estado_reporte,
          r.fecha_validacion,
          r.obs_validador,
          r.fecha_registro,
          p.nombre_proyecto,
          p.codi_proyecto,
          COALESCE(p.json_field->>'obra_nombre', p.json_field->'ejecucion_v1'->'cliente'->>'obra', p.nombre_proyecto) AS obra_nombre,
          COALESCE(e.patente, 'N/A') AS equipo_patente,
          COALESCE(e.modelo, 'Grúa') AS equipo_modelo,
          COALESCE(u_op.name_frst || ' ' || u_op.apellido_pat, 'Operador') AS operador_nombre,
          COALESCE(u_rig.name_frst || ' ' || u_rig.apellido_pat, 'Rigger') AS rigger_nombre,
          COALESCE(u_val.name_frst || ' ' || u_val.apellido_pat, 'Analista GSP') AS validador_nombre
        FROM sch_leangsp.tedp_reporte_avance r
        JOIN sch_leangsp.tpry_proyecto p ON r.id_proyecto = p.id_proyecto
        LEFT JOIN sch_leangsp.tequ_equipo e ON r.id_equipo = e.id_equipo
        LEFT JOIN sch_leangsp.tsec_users u_op ON r.id_user_operador = u_op.id_user
        LEFT JOIN sch_leangsp.tsec_users u_rig ON r.id_user_rigger = u_rig.id_user
        LEFT JOIN sch_leangsp.tsec_users u_val ON r.id_user_validador = u_val.id_user
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

  // 3. Guardar y Sellar Report Diario emitido desde PWA
  async guardarReportDiario(req, res) {
    try {
      const {
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
        foto_horometro,
        foto_horometro_base64,
        observacion_trabajo,
        cliente_nombre,
        cliente_rut,
        cliente_cargo,
        cliente_firma_canvas_base64,
        latitud_inicio_servicio,
        longitud_inicio_servicio,
        accuracy_firma
      } = req.body;

      if (!id_proyecto || !fecha_reporte || !id_user_operador) {
        return res.status(400).json({ error: 'id_proyecto, fecha_reporte y id_user_operador son obligatorios' });
      }

      if (!cliente_firma_canvas_base64) {
        return res.status(400).json({ error: 'La firma manual del mandante es obligatoria para emitir el report' });
      }

      const fotoHorometroFinal = foto_horometro || foto_horometro_base64 || null;

      // Generar token único para el report
      const token_report = crypto.randomBytes(24).toString('hex');

      // Formatear Timestamps de inicio y término
      const fechaBase = fecha_reporte.split('T')[0];
      const fecha_inicio_servicio = hora_inicio ? `${fechaBase} ${hora_inicio}:00` : null;
      const fecha_termino_servicio = hora_termino ? `${fechaBase} ${hora_termino}:00` : null;

      const insertSql = `
        INSERT INTO sch_leangsp.tedp_reporte_avance (
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
          foto_horometro,
          observacion_trabajo,
          cliente_nombre,
          cliente_rut,
          cliente_cargo,
          cliente_firma_canvas_base64,
          token_report,
          estado_reporte,
          fecha_registro
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, CURRENT_TIMESTAMP
        )
        RETURNING *;
      `;

      const values = [
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
        horas_minimas || 4.0,
        horas_facturables || 0,
        horas_sobretiempo || 0,
        horometro_inicio || null,
        horometro_termino || null,
        fotoHorometroFinal,
        observacion_trabajo || '',
        cliente_nombre || 'Supervisor Mandante',
        cliente_rut || '',
        cliente_cargo || 'Receptor en Obra',
        cliente_firma_canvas_base64,
        token_report,
        'PENDIENTE_VALIDACION'
      ];

      const insertRes = await db.query(insertSql, values);
      const reportGuardado = insertRes.rows[0];

      // Opcional: Actualizar el horómetro en json_data del equipo si se ingresó
      if (id_equipo && horometro_termino) {
        try {
          await db.query(
            `UPDATE sch_leangsp.tequ_equipo SET json_data = jsonb_set(COALESCE(json_data, '{}'::jsonb), '{horometro}', $1::text::jsonb) WHERE id_equipo = $2`,
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

  // 4. Validar Report Diario (Analista en Torre de Control)
  async validarReportDiario(req, res) {
    try {
      const { id } = req.params;
      const { id_user_validador, obs_validador } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'id_reporte_avance es requerido' });
      }

      const updateSql = `
        UPDATE sch_leangsp.tedp_reporte_avance
        SET 
          estado_reporte = 'VALIDADO_ANALISTA',
          id_user_validador = $1,
          fecha_validacion = CURRENT_TIMESTAMP,
          obs_validador = $2
        WHERE id_reporte_avance = $3
        RETURNING *;
      `;

      const result = await db.query(updateSql, [
        id_user_validador || null,
        obs_validador || 'Report diario validado conforme por el Analista de Operaciones',
        id
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Report no encontrado' });
      }

      res.json({
        success: true,
        message: 'Report diario validado exitosamente por el Analista',
        data: result.rows[0]
      });
    } catch (err) {
      console.error('Error al validar report diario:', err);
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = reportDiarioController;
