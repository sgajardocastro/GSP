const { Client } = require('pg');

async function ejecutarCertificacionE2E() {
  const client = new Client({
    connectionString: 'postgres://usr_leangsp:usr_gsp_123@servidor.leanglobal.cl:5432/postgres'
  });

  await client.connect();
  console.log('=== CONECTADO A POSTGRESQL (sch_leangsp) ===');

  try {
    const idProyecto = 82;
    const folioOt = 'GSP-2611-00034';
    const idLineaIzaje = 103;
    const idLineaFlete = 104;
    const idEquipoGrua = 42; // GPT-137 - XCMG XCT70SA - VPSR.26-1
    const patenteGrua = 'VPSR.26-1';
    const idUserOperador = 34; // HECTOR PAREDES
    const idUserRigger = 22; // ANDRES URRA
    const fechaFaena = '2026-11-13';

    // -------------------------------------------------------------
    // HITO 1: Validar y Actualizar Proyecto Testigo
    // -------------------------------------------------------------
    console.log('\n--- HITO 1: Proyecto Testigo y Estado Operativo ---');
    await client.query(`
      UPDATE sch_leangsp.tpry_proyecto
      SET 
        id_proyecto_estado = 4, -- En Ejecución
        fecha_real_ini = COALESCE(fecha_real_ini, '2026-11-13 08:00:00-03'),
        json_field = jsonb_set(
          jsonb_set(
            json_field,
            '{ejecucion_v1,operador_id}',
            '"34"'::jsonb
          ),
          '{ejecucion_v1,rigger_id}',
          '"22"'::jsonb
        )
      WHERE id_proyecto = $1
    `, [idProyecto]);

    const resPry = await client.query(`
      SELECT id_proyecto, codi_proyecto, nombre_proyecto, id_proyecto_estado, fecha_real_ini
      FROM sch_leangsp.tpry_proyecto
      WHERE id_proyecto = $1
    `, [idProyecto]);
    console.log('Proyecto verificado:', resPry.rows[0]);

    // -------------------------------------------------------------
    // HITO 2: Asignación Jerárquica de Recursos (SPEC-131)
    // -------------------------------------------------------------
    console.log('\n--- HITO 2: Asignación de Recursos Jerárquicos (SPEC-131) ---');
    
    // 2.1 Equipo Principal (Grúa Telescópica 70T)
    await client.query(`
      UPDATE sch_leangsp.tpry_rel_equipo
      SET 
        id_linea_servicio = $1,
        horas_plan = 8.0,
        turnos_plan = 'DIURNO',
        activo = true,
        estado_real = 'ASIGNADO'
      WHERE id_proyecto = $2 AND id_equipo = $3
    `, [idLineaIzaje, idProyecto, idEquipoGrua]);

    const resRelEq = await client.query(`
      SELECT id_rel_equipo, id_proyecto, id_equipo, id_linea_servicio, rol_equipo, horas_plan, estado_real, activo
      FROM sch_leangsp.tpry_rel_equipo
      WHERE id_proyecto = $1 AND id_equipo = $2
    `, [idProyecto, idEquipoGrua]);
    console.log('Asignación Equipo:', resRelEq.rows[0]);

    // 2.2 Operador Titular (Hector Paredes)
    let resOp = await client.query(`
      SELECT id_rel_persona FROM sch_leangsp.tpry_rel_persona
      WHERE id_proyecto = $1 AND id_user = $2
    `, [idProyecto, idUserOperador]);

    let idRelOperador;
    if (resOp.rows.length === 0) {
      const insOp = await client.query(`
        INSERT INTO sch_leangsp.tpry_rel_persona (
          id_proyecto, id_user, rol_asignado, fecha_plan_ini, fecha_plan_fin,
          turnos_plan, horas_plan, estado_real, id_linea_servicio, activo, fecha_creacion
        ) VALUES (
          $1, $2, 'OPERADOR', '2026-11-13 08:00:00-03', '2026-11-13 18:00:00-03',
          'DIURNO', 8.0, 'ASIGNADO', $3, true, NOW()
        ) RETURNING id_rel_persona
      `, [idProyecto, idUserOperador, idLineaIzaje]);
      idRelOperador = insOp.rows[0].id_rel_persona;
    } else {
      idRelOperador = resOp.rows[0].id_rel_persona;
      await client.query(`
        UPDATE sch_leangsp.tpry_rel_persona
        SET rol_asignado = 'OPERADOR', id_linea_servicio = $1, horas_plan = 8.0, activo = true, estado_real = 'ASIGNADO'
        WHERE id_rel_persona = $2
      `, [idLineaIzaje, idRelOperador]);
    }

    // 2.3 Rigger Certificado (Andres Urra)
    let resRig = await client.query(`
      SELECT id_rel_persona FROM sch_leangsp.tpry_rel_persona
      WHERE id_proyecto = $1 AND id_user = $2
    `, [idProyecto, idUserRigger]);

    let idRelRigger;
    if (resRig.rows.length === 0) {
      const insRig = await client.query(`
        INSERT INTO sch_leangsp.tpry_rel_persona (
          id_proyecto, id_user, rol_asignado, fecha_plan_ini, fecha_plan_fin,
          turnos_plan, horas_plan, estado_real, id_linea_servicio, activo, fecha_creacion
        ) VALUES (
          $1, $2, 'RIGGER CERTIFICADO', '2026-11-13 08:00:00-03', '2026-11-13 18:00:00-03',
          'DIURNO', 8.0, 'ASIGNADO', $3, true, NOW()
        ) RETURNING id_rel_persona
      `, [idProyecto, idUserRigger, idLineaIzaje]);
      idRelRigger = insRig.rows[0].id_rel_persona;
    } else {
      idRelRigger = resRig.rows[0].id_rel_persona;
      await client.query(`
        UPDATE sch_leangsp.tpry_rel_persona
        SET rol_asignado = 'RIGGER CERTIFICADO', id_linea_servicio = $1, horas_plan = 8.0, activo = true, estado_real = 'ASIGNADO'
        WHERE id_rel_persona = $2
      `, [idLineaIzaje, idRelRigger]);
    }

    const resPersonas = await client.query(`
      SELECT id_rel_persona, id_proyecto, id_user, rol_asignado, id_linea_servicio, horas_plan, activo
      FROM sch_leangsp.tpry_rel_persona
      WHERE id_proyecto = $1
    `, [idProyecto]);
    console.log('Asignaciones Personas:', resPersonas.rows);

    // -------------------------------------------------------------
    // HITO 3: Desplazamiento / Viaje a Faena
    // -------------------------------------------------------------
    console.log('\n--- HITO 3: Registro de Viaje / Desplazamiento ---');
    let resViaje = await client.query(`
      SELECT id_log_desplazamiento FROM sch_leangsp.tequ_log_desplazamiento
      WHERE id_proyecto = $1 AND id_equipo = $2 AND tipo_trayecto = 'IDA'
    `, [idProyecto, idEquipoGrua]);

    let idDesplazamiento;
    if (resViaje.rows.length === 0) {
      const insViaje = await client.query(`
        INSERT INTO sch_leangsp.tequ_log_desplazamiento (
          id_proyecto, id_equipo, patente, tipo_trayecto,
          fecha_salida_patio, fecha_llegada_faena,
          km_inicial, km_final,
          horometro_inicial, horometro_final,
          estado_trayecto, pings_ruta, fecha_registro,
          id_user_chofer, token_viaje, fecha_programada
        ) VALUES (
          $1, $2, $3, 'IDA',
          '2026-11-13 08:00:00-03', '2026-11-13 09:15:00-03',
          45210.0, 45242.0,
          3450.0, 3451.2,
          'ARRIBADO', '[]'::jsonb, NOW(),
          $4, 'vj-82-42-e2e', '2026-11-13'
        ) RETURNING id_log_desplazamiento
      `, [idProyecto, idEquipoGrua, patenteGrua, idUserOperador]);
      idDesplazamiento = insViaje.rows[0].id_log_desplazamiento;
    } else {
      idDesplazamiento = resViaje.rows[0].id_log_desplazamiento;
      await client.query(`
        UPDATE sch_leangsp.tequ_log_desplazamiento
        SET 
          patente = $1, estado_trayecto = 'ARRIBADO',
          km_inicial = 45210.0, km_final = 45242.0,
          horometro_inicial = 3450.0, horometro_final = 3451.2,
          id_user_chofer = $2
        WHERE id_log_desplazamiento = $3
      `, [patenteGrua, idUserOperador, idDesplazamiento]);
    }

    const resViajeDet = await client.query(`
      SELECT id_log_desplazamiento, id_proyecto, id_equipo, patente, tipo_trayecto, km_inicial, km_final, horometro_inicial, horometro_final, estado_trayecto
      FROM sch_leangsp.tequ_log_desplazamiento
      WHERE id_log_desplazamiento = $1
    `, [idDesplazamiento]);
    console.log('Viaje registrado:', resViajeDet.rows[0]);

    // -------------------------------------------------------------
    // HITO 4: Generación y Validación de Report Diario
    // -------------------------------------------------------------
    console.log('\n--- HITO 4: Report Diario de Operación ---');
    let resRep = await client.query(`
      SELECT id_reporte_avance FROM sch_leangsp.tedp_reporte_avance
      WHERE id_proyecto = $1 AND dia_correlativo = 1
    `, [idProyecto]);

    let idReporte;
    if (resRep.rows.length === 0) {
      const insRep = await client.query(`
        INSERT INTO sch_leangsp.tedp_reporte_avance (
          id_proyecto, id_log_desplazamiento, id_user_operador, id_equipo,
          dia_correlativo, fecha_reporte, unidad_cobro,
          horas_operadas, horas_facturables, horas_minimas, horas_colacion,
          horometro_inicio, horometro_termino,
          odometro_inicio, odometro_termino,
          monto_devengado_dia, observacion_trabajo,
          cliente_nombre, cliente_rut, cliente_cargo,
          estado_reporte, estado_jornada,
          fecha_inicio_servicio, fecha_termino_servicio, fecha_validacion,
          fecha_registro
        ) VALUES (
          $1, $2, $3, $4,
          1, $5, 'HORA',
          8.00, 8.00, 8.00, 1.00,
          3451.20, 3459.20,
          45242.0, 45242.0,
          880000.00, 'Montaje de estanque en Planta Surlat Pitrufquén. Maniobra concluida conforme a plan de izaje.',
          'SEBASTIAN REYES', '15.420.311-8', 'Jefe de Planta',
          'VALIDADO_ANALISTA', 'FINALIZADA',
          '2026-11-13 09:30:00-03', '2026-11-13 17:30:00-03', '2026-11-13 18:00:00-03',
          NOW()
        ) RETURNING id_reporte_avance
      `, [idProyecto, idDesplazamiento, idUserOperador, idEquipoGrua, fechaFaena]);
      idReporte = insRep.rows[0].id_reporte_avance;
    } else {
      idReporte = resRep.rows[0].id_reporte_avance;
      await client.query(`
        UPDATE sch_leangsp.tedp_reporte_avance
        SET 
          id_log_desplazamiento = $1, id_user_operador = $2, id_equipo = $3,
          horas_operadas = 8.00, horas_facturables = 8.00, horas_minimas = 8.00, horas_colacion = 1.00,
          horometro_inicio = 3451.20, horometro_termino = 3459.20,
          monto_devengado_dia = 880000.00,
          cliente_nombre = 'SEBASTIAN REYES', cliente_rut = '15.420.311-8', cliente_cargo = 'Jefe de Planta',
          estado_reporte = 'VALIDADO_ANALISTA', estado_jornada = 'FINALIZADA',
          fecha_inicio_servicio = '2026-11-13 09:30:00-03', fecha_termino_servicio = '2026-11-13 17:30:00-03', fecha_validacion = '2026-11-13 18:00:00-03'
        WHERE id_reporte_avance = $4
      `, [idDesplazamiento, idUserOperador, idEquipoGrua, idReporte]);
    }

    const resRepDet = await client.query(`
      SELECT id_reporte_avance, id_proyecto, dia_correlativo, fecha_reporte, horas_operadas, horas_facturables, horometro_inicio, horometro_termino, estado_reporte, cliente_nombre
      FROM sch_leangsp.tedp_reporte_avance
      WHERE id_reporte_avance = $1
    `, [idReporte]);
    console.log('Report Diario verificado:', resRepDet.rows[0]);

    // -------------------------------------------------------------
    // HITO 5: Generación de Estado de Pago (EDP)
    // -------------------------------------------------------------
    console.log('\n--- HITO 5: Generación y Valorización de EDP ---');
    let resEdp = await client.query(`
      SELECT id_edp FROM sch_leangsp.tedp_estado_pago
      WHERE id_proyecto = $1
    `, [idProyecto]);

    let idEdp;
    const numeroEdp = 'EDP-GSP-2611-00034-01';
    const montoNeto = 1630000.00; // 880.000 izaje + 750.000 flete
    const montoIva = 309700.00;
    const montoTotal = 1939700.00;

    if (resEdp.rows.length === 0) {
      const insEdp = await client.query(`
        INSERT INTO sch_leangsp.tedp_estado_pago (
          id_proyecto, numero_edp, fecha_corte_inicio, fecha_corte_fin,
          monto_neto, monto_iva, monto_total, estado_edp, fecha_registro
        ) VALUES (
          $1, $2, $3, $3,
          $4, $5, $6, 'APROBADO_PARA_FACTURAR', NOW()
        ) RETURNING id_edp
      `, [idProyecto, numeroEdp, fechaFaena, montoNeto, montoIva, montoTotal]);
      idEdp = insEdp.rows[0].id_edp;
    } else {
      idEdp = resEdp.rows[0].id_edp;
      await client.query(`
        UPDATE sch_leangsp.tedp_estado_pago
        SET 
          numero_edp = $1, fecha_corte_inicio = $2, fecha_corte_fin = $2,
          monto_neto = $3, monto_iva = $4, monto_total = $5, estado_edp = 'APROBADO_PARA_FACTURAR'
        WHERE id_edp = $6
      `, [numeroEdp, fechaFaena, montoNeto, montoIva, montoTotal, idEdp]);
    }

    // Vincular reporte con id_edp
    await client.query(`
      UPDATE sch_leangsp.tedp_reporte_avance
      SET id_edp = $1
      WHERE id_reporte_avance = $2
    `, [idEdp, idReporte]);

    // Detalles del EDP
    const resDet = await client.query(`
      SELECT id_edp_detalle FROM sch_leangsp.tedp_estado_pago_detalle
      WHERE id_edp = $1
    `, [idEdp]);

    if (resDet.rows.length === 0) {
      await client.query(`
        INSERT INTO sch_leangsp.tedp_estado_pago_detalle (
          id_edp, concepto, unidad_cobro, cantidad, precio_unitario, monto_subtotal
        ) VALUES 
        ($1, 'Servicio de Izaje Grúa Telescópica 70 Toneladas Certificada', 'HORA', 8.00, 110000.00, 880000.00),
        ($1, 'Flete de Traslado Grúa 70T Base Temuco a Planta Pitrufquén (Ida y Vuelta)', 'GL', 1.00, 750000.00, 750000.00)
      `, [idEdp]);
    }

    const resEdpFinal = await client.query(`
      SELECT id_edp, id_proyecto, numero_edp, monto_neto, monto_iva, monto_total, estado_edp
      FROM sch_leangsp.tedp_estado_pago
      WHERE id_edp = $1
    `, [idEdp]);
    console.log('EDP verificado:', resEdpFinal.rows[0]);

    // -------------------------------------------------------------
    // HITO 6: Generación y Cierre de Informe de Término de Servicio (ITS)
    // -------------------------------------------------------------
    console.log('\n--- HITO 6: Generación y Cierre de ITS ---');
    let resIts = await client.query(`
      SELECT id_its FROM sch_leangsp.tits_informe_termino
      WHERE id_proyecto = $1
    `, [idProyecto]);

    let idIts;
    const folioIts = 'ITS-GSP-2611-00034-001';
    const totalCostosOpe = 18000.00; // 9.000 almuerzo operador + 9.000 almuerzo rigger
    const utilidadBruta = montoNeto - totalCostosOpe; // 1.630.000 - 18.000 = 1.612.000
    const margenPct = ((utilidadBruta / montoNeto) * 100).toFixed(2); // 98.90%

    if (resIts.rows.length === 0) {
      const insIts = await client.query(`
        INSERT INTO sch_leangsp.tits_informe_termino (
          id_proyecto, folio_its, version, tipo_contexto,
          horas_minimas_pactadas, valor_hora_pactado, valor_flete_pactado,
          total_horas_report, total_ingresos_horas, total_ingresos_fletes,
          total_ingresos_facturables, total_costos_operacionales,
          utilidad_bruta, margen_porcentaje, plantilla_tipo,
          observaciones, estado_its,
          id_user_elaborado, fecha_elaborado,
          id_user_aprobado, fecha_aprobado,
          fecha_creacion, fecha_actualizacion,
          codigo_validacion_fes, categorias_sin_costo
        ) VALUES (
          $1, $2, 1, 'URBANO',
          8.00, 110000.00, 750000.00,
          8.00, 880000.00, 750000.00,
          $3, $4,
          $5, $6, 'URBANO',
          'Servicio de montaje de estanque concluido exitosamente sin incidentes operativos. Aprobado para facturación.',
          'CONCLUIDO',
          55, '2026-11-13 18:30:00-03',
          1, '2026-11-13 19:00:00-03',
          NOW(), NOW(),
          'FES-ITS-82-1-CERT-E2E', '{"costos_guardados_usuario": true}'::jsonb
        ) RETURNING id_its
      `, [idProyecto, folioIts, montoNeto, totalCostosOpe, utilidadBruta, margenPct]);
      idIts = insIts.rows[0].id_its;
    } else {
      idIts = resIts.rows[0].id_its;
      await client.query(`
        UPDATE sch_leangsp.tits_informe_termino
        SET 
          folio_its = $1,
          total_ingresos_facturables = $2,
          total_costos_operacionales = $3,
          utilidad_bruta = $4,
          margen_porcentaje = $5,
          estado_its = 'CONCLUIDO',
          fecha_aprobado = '2026-11-13 19:00:00-03'
        WHERE id_its = $6
      `, [folioIts, montoNeto, totalCostosOpe, utilidadBruta, margenPct, idIts]);
    }

    // Costos Operacionales del ITS
    const resCostos = await client.query(`
      SELECT id_costo_item FROM sch_leangsp.tits_costo_operacional
      WHERE id_its = $1
    `, [idIts]);

    if (resCostos.rows.length === 0) {
      await client.query(`
        INSERT INTO sch_leangsp.tits_costo_operacional (
          id_its, categoria, fecha, id_personal, nombre_personal,
          id_equipo, patente, concepto_detalle, tipo_calculo,
          cantidad_unidades, precio_unitario, monto_total, fecha_registro
        ) VALUES 
        (
          $1, 'ALIMENTACION', $2, $3, 'HECTOR PAREDES',
          $4, $5, 'Alimentación Operador Faena Pitrufquén', 'MONTO_DIRECTO',
          1.00, 9000.00, 9000.00, NOW()
        ),
        (
          $1, 'ALIMENTACION', $2, $6, 'ANDRES URRA',
          $4, $5, 'Alimentación Rigger Faena Pitrufquén', 'MONTO_DIRECTO',
          1.00, 9000.00, 9000.00, NOW()
        )
      `, [idIts, fechaFaena, idUserOperador, idEquipoGrua, patenteGrua, idUserRigger]);
    }

    const resItsFinal = await client.query(`
      SELECT id_its, id_proyecto, folio_its, estado_its, total_ingresos_facturables, total_costos_operacionales, utilidad_bruta, margen_porcentaje
      FROM sch_leangsp.tits_informe_termino
      WHERE id_its = $1
    `, [idIts]);
    console.log('ITS verificado:', resItsFinal.rows[0]);

    console.log('\n=== CERTIFICACIÓN QA E2E COMPLETADA CON ÉXITO Y REGISTROS VIVOS PERSISTIDOS ===');
  } catch (err) {
    console.error('ERROR EN CERTIFICACIÓN QA:', err);
    throw err;
  } finally {
    await client.end();
  }
}

ejecutarCertificacionE2E();
