const db = require('../config/dbConfig');
const crypto = require('crypto');

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
        FROM sch_leangsp.tpry_proyecto p
        LEFT JOIN sch_leangsp.tpar_empresas clt ON p.id_empresa_cliente = clt.id_empresa
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
          COALESCE(v.estado_trayecto, 'ASIGNADO') AS estado_operativo,
          v.token_viaje,
          v.km_inicial,
          v.km_final,
          v.horometro_inicial AS horometro_viaje_salida,
          v.horometro_final AS horometro_viaje_llegada
        FROM sch_leangsp.tpry_rel_equipo re
        JOIN sch_leangsp.tequ_equipo e ON re.id_equipo = e.id_equipo
        LEFT JOIN LATERAL (
          SELECT estado_trayecto, token_viaje, km_inicial, km_final, horometro_inicial, horometro_final
          FROM sch_leangsp.tequ_log_desplazamiento
          WHERE id_proyecto = re.id_proyecto AND id_equipo = re.id_equipo
          ORDER BY id_log_desplazamiento DESC
          LIMIT 1
        ) v ON TRUE
        WHERE re.id_proyecto = $1
        ORDER BY re.id_equipo, re.id_rel_equipo DESC;
      `;
      const eqRes = await db.query(eqSql, [id_proyecto]);
      const equipos = eqRes.rows;

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
        FROM sch_leangsp.tpry_rel_persona rp
        JOIN sch_leangsp.tsec_users u ON rp.id_user = u.id_user
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
        FROM sch_leangsp.tedp_reporte_avance
        WHERE id_proyecto = $1
        ORDER BY dia_correlativo ASC, fecha_reporte ASC;
      `;
      const repRes = await db.query(repSql, [id_proyecto]);
      const reports = repRes.rows;

      // 1.5 Determinar equipo objetivo y calcular día correlativo y horómetro sugerido POR EQUIPO (Spec 35)
      const targetIdEquipo = id_equipo ? parseInt(id_equipo, 10) : (equipos.length > 0 ? equipos[0].id_equipo : null);
      const reportsDelEquipo = targetIdEquipo ? reports.filter(r => Number(r.id_equipo) === targetIdEquipo) : reports;

      let diaSugerido = 1;
      let horometroSugerido = null;

      if (reportsDelEquipo.length > 0) {
        const maxDia = Math.max(...reportsDelEquipo.map(r => Number(r.dia_correlativo) || 0));
        diaSugerido = maxDia + 1;
        const ultimoReport = reportsDelEquipo[reportsDelEquipo.length - 1];
        if (ultimoReport.horometro_termino) {
          horometroSugerido = Number(ultimoReport.horometro_termino);
        }
      } else if (targetIdEquipo) {
        // Primer reporte para este equipo específico
        const eqMatch = equipos.find(e => Number(e.id_equipo) === targetIdEquipo);
        if (eqMatch) {
          if (eqMatch.horometro_viaje_llegada || eqMatch.horometro_viaje_salida) {
            horometroSugerido = Number(eqMatch.horometro_viaje_llegada || eqMatch.horometro_viaje_salida);
          } else if (eqMatch.horometro_base) {
            horometroSugerido = Number(eqMatch.horometro_base);
          }
        }
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
          equipos,
          id_equipo_seleccionado: targetIdEquipo,
          personas: perRes.rows,
          reports,
          reports_equipo: reportsDelEquipo,
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
          COALESCE(clt.razon_social, clt.name_empresa, 'Cliente Mandante') AS cliente_razon_social,
          COALESCE(p.json_field->>'obra_nombre', p.json_field->'crm_v1'->>'obra_nombre', p.json_field->'ejecucion_v1'->'cliente'->>'obra', p.nombre_proyecto) AS obra_nombre,
          COALESCE(e.patente, 'N/A') AS equipo_patente,
          COALESCE(e.modelo, 'Grúa') AS equipo_modelo,
          COALESCE(u_op.name_frst || ' ' || u_op.apellido_pat, 'Operador') AS operador_nombre,
          COALESCE(u_rig.name_frst || ' ' || u_rig.apellido_pat, 'Rigger') AS rigger_nombre,
          COALESCE(u_val.name_frst || ' ' || u_val.apellido_pat, 'Analista GSP') AS validador_nombre
        FROM sch_leangsp.tedp_reporte_avance r
        JOIN sch_leangsp.tpry_proyecto p ON r.id_proyecto = p.id_proyecto
        LEFT JOIN sch_leangsp.tpar_empresas clt ON p.id_empresa_cliente = clt.id_empresa
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
        FROM sch_leangsp.tpry_proyecto p
        LEFT JOIN sch_leangsp.tpar_empresas clt ON p.id_empresa_cliente = clt.id_empresa
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
        FROM sch_leangsp.tedp_reporte_avance r
        LEFT JOIN sch_leangsp.tequ_equipo e ON r.id_equipo = e.id_equipo
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
        UPDATE sch_leangsp.tpry_proyecto
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
  }
};

module.exports = reportDiarioController;
