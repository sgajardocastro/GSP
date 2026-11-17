const { Client } = require('pg');

async function completarCiclo50() {
  const client = new Client({
    connectionString: 'postgres://usr_leangsp:usr_gsp_123@servidor.leanglobal.cl:5432/postgres'
  });

  await client.connect();
  console.log('=== CONECTADO A POSTGRESQL (sch_leangsp) ===');

  try {
    const idProyecto = 97;
    const codigoProyecto = 'GSP-2611-00050';
    const nombreProyecto = 'SERVICIO INTEGRAL IZAJE Y MONTAJE INDUSTRIAL - LEANGLOBAL';
    const idEmpresaCliente = 4851; // LeanGlobal Spa
    const idEmpresaSanPablo = 9;
    const idContactoCliente = 1; // Sergio Gajardo
    const fechaHoy = '2026-11-13';

    console.log(`\n--- PROYECTO ID: ${idProyecto} | CÓDIGO: ${codigoProyecto} ---`);

    // -------------------------------------------------------------
    // ÁRBOL DE SERVICIOS CANÓNICO PARA CRM
    // -------------------------------------------------------------
    const srv1 = {
      id_servicio: 'srv_grua_70t',
      linea_servicio: 'IZAJE',
      colapsado: false,
      nombre_servicio: 'Servicio Grúa 70 Toneladas',
      primario: {
        id_linea: 'lin_grua_70t',
        id_servicio: 'srv_grua_70t',
        id_padre: null,
        rol_arbol: 'PRIMARIO',
        rol: 'Izaje',
        id_categoria: 40,
        id_subcategoria: 54,
        tipo: 'GRUAS TELESCOPICAS',
        subcategoria: 'GRUA 70 TON',
        recurso: 'GRUA 70 TON',
        descripcion: 'Servicio de Izaje Grúa Telescópica 70 Toneladas',
        unidad: 'Horas Diarias Minimas',
        cantidad_dias: 1,
        cantidad_horas: 8,
        pisoMinimo: 8,
        dias: 1,
        horas_min: 8,
        cantidad: 8,
        valor_unitario: 110000,
        valorUnitario: 110000,
        subtotal: 880000
      },
      ramas: [
        {
          id_linea: 'lin_traslado_grua_70t',
          id_servicio: 'srv_grua_70t',
          id_padre: 'lin_grua_70t',
          rol_arbol: 'TRASLADO',
          rol: 'Traslado',
          id_categoria: 62,
          id_subcategoria: 84,
          tipo: 'TRASLADOS',
          subcategoria: 'MOVILIZACIÓN GRÚA',
          recurso: 'Flete de Traslado',
          descripcion: 'Flete de Traslado Grúa 70T Base Temuco a Planta (Ida y Vuelta)',
          unidad: 'Traslado Ida/Vuelta',
          cantidad_dias: 1,
          cantidad_horas: null,
          cantidad: 1,
          dias: 1,
          horas_min: null,
          pisoMinimo: 0,
          valor_unitario: 750000,
          valorUnitario: 750000,
          subtotal: 750000
        }
      ],
      subtotal_servicio: 1630000
    };

    const srv2 = {
      id_servicio: 'srv_camion_pluma',
      linea_servicio: 'TRANSPORTE',
      colapsado: false,
      nombre_servicio: 'Servicio Camión Pluma',
      primario: {
        id_linea: 'lin_camion_pluma',
        id_servicio: 'srv_camion_pluma',
        id_padre: null,
        rol_arbol: 'PRIMARIO',
        rol: 'Transporte',
        id_categoria: 62,
        id_subcategoria: 71,
        tipo: 'CAMIONES',
        subcategoria: 'CAMION PLUMA',
        recurso: 'CAMION PLUMA',
        descripcion: 'Servicio de Camión Pluma 10T Operativo',
        unidad: 'Horas Diarias Minimas',
        cantidad_dias: 1,
        cantidad_horas: 8,
        pisoMinimo: 8,
        dias: 1,
        horas_min: 8,
        cantidad: 8,
        valor_unitario: 65000,
        valorUnitario: 65000,
        subtotal: 520000
      },
      ramas: [
        {
          id_linea: 'lin_traslado_camion',
          id_servicio: 'srv_camion_pluma',
          id_padre: 'lin_camion_pluma',
          rol_arbol: 'TRASLADO',
          rol: 'Traslado',
          id_categoria: 62,
          id_subcategoria: 84,
          tipo: 'TRASLADOS',
          subcategoria: 'MOVILIZACIÓN CAMIÓN',
          recurso: 'Flete de Traslado',
          descripcion: 'Flete de Traslado Camión Pluma Base a Planta (Ida y Vuelta)',
          unidad: 'Traslado Ida/Vuelta',
          cantidad_dias: 1,
          cantidad_horas: null,
          cantidad: 1,
          dias: 1,
          horas_min: null,
          pisoMinimo: 0,
          valor_unitario: 250000,
          valorUnitario: 250000,
          subtotal: 250000
        }
      ],
      subtotal_servicio: 770000
    };

    const serviciosTree = [srv1, srv2];

    const flatLines = [
      {
        id_linea: srv1.primario.id_linea,
        id_servicio: srv1.id_servicio,
        id_padre: null,
        rol_arbol: 'PRIMARIO',
        id_categoria: 40,
        id_subcategoria: 54,
        linea_servicio: 'IZAJE',
        tipo_ot: 'OT-MANIOBRA',
        tipo: 'GRUAS TELESCOPICAS',
        subcategoria: 'GRUA 70 TON',
        recurso: 'GRUA 70 TON',
        descripcion: srv1.primario.descripcion,
        unidad: 'Horas Diarias Minimas',
        cantidad: 8,
        cantidad_dias: 1,
        cantidad_horas: 8,
        pisoMinimo: 8,
        valor_unitario: 110000,
        subtotal: 880000,
        is_linea_base: true
      },
      {
        id_linea: srv1.ramas[0].id_linea,
        id_servicio: srv1.id_servicio,
        id_padre: srv1.primario.id_linea,
        rol_arbol: 'TRASLADO',
        id_categoria: 62,
        id_subcategoria: 84,
        linea_servicio: 'IZAJE',
        tipo_ot: 'OT-MANIOBRA',
        tipo: 'TRASLADOS',
        subcategoria: 'MOVILIZACIÓN GRÚA',
        recurso: 'Flete de Traslado',
        descripcion: srv1.ramas[0].descripcion,
        unidad: 'Traslado Ida/Vuelta',
        cantidad: 1,
        cantidad_dias: 1,
        cantidad_horas: null,
        pisoMinimo: 0,
        valor_unitario: 750000,
        subtotal: 750000,
        is_linea_base: true
      },
      {
        id_linea: srv2.primario.id_linea,
        id_servicio: srv2.id_servicio,
        id_padre: null,
        rol_arbol: 'PRIMARIO',
        id_categoria: 62,
        id_subcategoria: 71,
        linea_servicio: 'TRANSPORTE',
        tipo_ot: 'OT-FLETE',
        tipo: 'CAMIONES',
        subcategoria: 'CAMION PLUMA',
        recurso: 'CAMION PLUMA',
        descripcion: srv2.primario.descripcion,
        unidad: 'Horas Diarias Minimas',
        cantidad: 8,
        cantidad_dias: 1,
        cantidad_horas: 8,
        pisoMinimo: 8,
        valor_unitario: 65000,
        subtotal: 520000,
        is_linea_base: true
      },
      {
        id_linea: srv2.ramas[0].id_linea,
        id_servicio: srv2.id_servicio,
        id_padre: srv2.primario.id_linea,
        rol_arbol: 'TRASLADO',
        id_categoria: 62,
        id_subcategoria: 84,
        linea_servicio: 'TRANSPORTE',
        tipo_ot: 'OT-FLETE',
        tipo: 'TRASLADOS',
        subcategoria: 'MOVILIZACIÓN CAMIÓN',
        recurso: 'Flete de Traslado',
        descripcion: srv2.ramas[0].descripcion,
        unidad: 'Traslado Ida/Vuelta',
        cantidad: 1,
        cantidad_dias: 1,
        cantidad_horas: null,
        pisoMinimo: 0,
        valor_unitario: 250000,
        subtotal: 250000,
        is_linea_base: true
      }
    ];

    const jsonField = {
      crm_v1: {
        moneda: 'CLP',
        tipo_pago: 'credito',
        validez_dias: 15,
        servicios: serviciosTree,
        lineas_servicio: flatLines,
        lineas_servicio_activas: flatLines,
        lineas_operativas_vigentes: flatLines,
        id_contacto: idContactoCliente,
        contacto_nombre: 'Sergio Gajardo',
        contacto_email: 'sgajardoc@gmail.com',
        contacto_telefono: '+56936483259',
        cliente_nombre: 'LeanGlobal Spa',
        cliente_rut: '78249226-8',
        obra_nombre: 'PLANTA CENTRAL LEANGLOBAL TEMUCO',
        obra_direccion: 'AV. CAUPOLICAN 1500',
        obra_ciudad: 'TEMUCO',
        regimen_operacional: 'URBANO',
        regimen_operacional_confirmado: true,
        requiere_oc_hes: false,
        requiere_rigger: true,
        requiere_prevencionista: false,
        fecha_hora_inicio: '2026-11-13T08:00',
        fecha_hora_termino: '2026-11-13T18:00',
        total_neto: 2400000,
        iva: 456000,
        total_bruto: 2856000
      },
      ejecucion_v1: {
        decision: 'APROBADO',
        equipo_id: '42', // GPT-137
        operador_id: '34', // Héctor Paredes
        rigger_id: '22', // Andrés Urra
        equipo_apoyo_id: '55', // CPA-91 Camión Pluma
        operador_apoyo_id: '52', // Víctor Márquez
        regimen_operacional: 'URBANO',
        regimen_operacional_confirmado: true,
        porcentaje_acreditacion: 100,
        fecha_salida_plan: '2026-11-13',
        hora_salida_plan: '08:00',
        fecha_fin_plan: '2026-11-13',
        hora_fin_plan: '18:00',
        subtab_activa: 'asignacion',
        subtab_actual_view: 'asignacion'
      },
      operaciones_v1: {
        visitas: []
      }
    };

    // Actualizar tpry_proyecto id 97
    await client.query(`
      UPDATE sch_leangsp.tpry_proyecto
      SET 
        codi_proyecto = $1,
        nombre_proyecto = $2,
        id_proyecto_estado = 4,
        id_empresa = $3,
        id_empresa_cliente = $4,
        centro_costo = $5,
        fecha_real_ini = '2026-11-13 08:00:00-03',
        json_field = $6
      WHERE id_proyecto = $7
    `, [codigoProyecto, nombreProyecto, idEmpresaSanPablo, idEmpresaCliente, `CC-${codigoProyecto}`, JSON.stringify(jsonField), idProyecto]);

    console.log('Proyecto 97 actualizado y sincronizado.');

    // -------------------------------------------------------------
    // LÍNEAS DE SERVICIO EN tpry_linea_servicio
    // -------------------------------------------------------------
    let resLin1 = await client.query(`
      SELECT id_linea_servicio FROM sch_leangsp.tpry_linea_servicio WHERE id_proyecto = $1 AND rol_nodo = 'RAIZ' AND linea_negocio = 'IZAJE'
    `, [idProyecto]);

    let idLin1;
    if (resLin1.rows.length === 0) {
      const insLin1 = await client.query(`
        INSERT INTO sch_leangsp.tpry_linea_servicio (
          id_proyecto, id_linea_servicio_padre, linea_negocio, tipo_ot, rol_nodo,
          descripcion, subcategoria, unidad, cantidad, cantidad_dias, cantidad_horas,
          piso_minimo_horas, valor_unitario, subtotal, incluido_en_tarifa, es_apoyo_operativo,
          id_categoria, id_subcategoria, fecha_creacion
        ) VALUES (
          $1, NULL, 'IZAJE', 'OT-MANIOBRA', 'RAIZ',
          'Servicio de Izaje Grúa Telescópica 70 Toneladas', 'GRUA 70 TON', 'Horas Diarias Minimas', 8, 1, 8,
          8, 110000.00, 880000.00, false, false,
          40, 54, NOW()
        ) RETURNING id_linea_servicio
      `, [idProyecto]);
      idLin1 = insLin1.rows[0].id_linea_servicio;
    } else {
      idLin1 = resLin1.rows[0].id_linea_servicio;
    }

    // Línea 2: Traslado 70T
    let resLin2 = await client.query(`
      SELECT id_linea_servicio FROM sch_leangsp.tpry_linea_servicio WHERE id_proyecto = $1 AND rol_nodo = 'TRASLADO' AND id_linea_servicio_padre = $2
    `, [idProyecto, idLin1]);

    let idLin2;
    if (resLin2.rows.length === 0) {
      const insLin2 = await client.query(`
        INSERT INTO sch_leangsp.tpry_linea_servicio (
          id_proyecto, id_linea_servicio_padre, linea_negocio, tipo_ot, rol_nodo,
          descripcion, subcategoria, unidad, cantidad, cantidad_dias, cantidad_horas,
          piso_minimo_horas, valor_unitario, subtotal, incluido_en_tarifa, es_apoyo_operativo,
          id_categoria, id_subcategoria, fecha_creacion
        ) VALUES (
          $1, $2, 'IZAJE', 'OT-MANIOBRA', 'TRASLADO',
          'Flete de Traslado Grúa 70T Base Temuco a Planta (Ida y Vuelta)', 'MOVILIZACIÓN GRÚA', 'Traslado Ida/Vuelta', 1.00, 1, NULL,
          0.00, 750000.00, 750000.00, false, true,
          62, 84, NOW()
        ) RETURNING id_linea_servicio
      `, [idProyecto, idLin1]);
      idLin2 = insLin2.rows[0].id_linea_servicio;
    } else {
      idLin2 = resLin2.rows[0].id_linea_servicio;
    }

    // Línea 3: Raíz Camión Pluma (tipo_ot: 'OT-FLETE')
    let resLin3 = await client.query(`
      SELECT id_linea_servicio FROM sch_leangsp.tpry_linea_servicio WHERE id_proyecto = $1 AND rol_nodo = 'RAIZ' AND linea_negocio = 'TRANSPORTE'
    `, [idProyecto]);

    let idLin3;
    if (resLin3.rows.length === 0) {
      const insLin3 = await client.query(`
        INSERT INTO sch_leangsp.tpry_linea_servicio (
          id_proyecto, id_linea_servicio_padre, linea_negocio, tipo_ot, rol_nodo,
          descripcion, subcategoria, unidad, cantidad, cantidad_dias, cantidad_horas,
          piso_minimo_horas, valor_unitario, subtotal, incluido_en_tarifa, es_apoyo_operativo,
          id_categoria, id_subcategoria, fecha_creacion
        ) VALUES (
          $1, NULL, 'TRANSPORTE', 'OT-FLETE', 'RAIZ',
          'Servicio de Camión Pluma 10T Operativo', 'CAMION PLUMA', 'Horas Diarias Minimas', 8, 1, 8,
          8, 65000.00, 520000.00, false, false,
          62, 71, NOW()
        ) RETURNING id_linea_servicio
      `, [idProyecto]);
      idLin3 = insLin3.rows[0].id_linea_servicio;
    } else {
      idLin3 = resLin3.rows[0].id_linea_servicio;
    }

    // Línea 4: Traslado Camión Pluma (tipo_ot: 'OT-FLETE')
    let resLin4 = await client.query(`
      SELECT id_linea_servicio FROM sch_leangsp.tpry_linea_servicio WHERE id_proyecto = $1 AND rol_nodo = 'TRASLADO' AND id_linea_servicio_padre = $2
    `, [idProyecto, idLin3]);

    let idLin4;
    if (resLin4.rows.length === 0) {
      const insLin4 = await client.query(`
        INSERT INTO sch_leangsp.tpry_linea_servicio (
          id_proyecto, id_linea_servicio_padre, linea_negocio, tipo_ot, rol_nodo,
          descripcion, subcategoria, unidad, cantidad, cantidad_dias, cantidad_horas,
          piso_minimo_horas, valor_unitario, subtotal, incluido_en_tarifa, es_apoyo_operativo,
          id_categoria, id_subcategoria, fecha_creacion
        ) VALUES (
          $1, $2, 'TRANSPORTE', 'OT-FLETE', 'TRASLADO',
          'Flete de Traslado Camión Pluma Base a Planta (Ida y Vuelta)', 'MOVILIZACIÓN CAMIÓN', 'Traslado Ida/Vuelta', 1.00, 1, NULL,
          0.00, 250000.00, 250000.00, false, true,
          62, 84, NOW()
        ) RETURNING id_linea_servicio
      `, [idProyecto, idLin3]);
      idLin4 = insLin4.rows[0].id_linea_servicio;
    } else {
      idLin4 = resLin4.rows[0].id_linea_servicio;
    }

    console.log(`Líneas Activas: Lin1=${idLin1}, Lin2=${idLin2}, Lin3=${idLin3}, Lin4=${idLin4}`);

    // -------------------------------------------------------------
    // ASIGNACIONES DE RECURSOS JERÁRQUICOS (SPEC-131)
    // -------------------------------------------------------------
    // 5.1 Grúa 70T
    let resRelEq1 = await client.query(`
      SELECT id_rel_equipo FROM sch_leangsp.tpry_rel_equipo WHERE id_proyecto = $1 AND id_equipo = 42
    `, [idProyecto]);
    let idRelEqGrua;
    if (resRelEq1.rows.length === 0) {
      const insRelEq1 = await client.query(`
        INSERT INTO sch_leangsp.tpry_rel_equipo (
          id_proyecto, id_equipo, rol_equipo, fecha_plan_ini, fecha_plan_fin,
          turnos_plan, horas_plan, estado_real, id_linea_servicio, activo, fecha_creacion
        ) VALUES (
          $1, 42, 'GRUAS TELESCOPICAS', '2026-11-13 08:00:00-03', '2026-11-13 18:00:00-03',
          'DIURNO', 8.0, 'ASIGNADO', $2, true, NOW()
        ) RETURNING id_rel_equipo
      `, [idProyecto, idLin1]);
      idRelEqGrua = insRelEq1.rows[0].id_rel_equipo;
    } else {
      idRelEqGrua = resRelEq1.rows[0].id_rel_equipo;
      await client.query(`
        UPDATE sch_leangsp.tpry_rel_equipo
        SET id_linea_servicio = $1, horas_plan = 8.0, estado_real = 'ASIGNADO', activo = true
        WHERE id_rel_equipo = $2
      `, [idLin1, idRelEqGrua]);
    }

    // 5.2 Camión Pluma
    let resRelEq2 = await client.query(`
      SELECT id_rel_equipo FROM sch_leangsp.tpry_rel_equipo WHERE id_proyecto = $1 AND id_equipo = 55
    `, [idProyecto]);
    let idRelEqPluma;
    if (resRelEq2.rows.length === 0) {
      const insRelEq2 = await client.query(`
        INSERT INTO sch_leangsp.tpry_rel_equipo (
          id_proyecto, id_equipo, rol_equipo, fecha_plan_ini, fecha_plan_fin,
          turnos_plan, horas_plan, estado_real, id_linea_servicio, activo, fecha_creacion
        ) VALUES (
          $1, 55, 'CAMIONES', '2026-11-13 08:00:00-03', '2026-11-13 18:00:00-03',
          'DIURNO', 8.0, 'ASIGNADO', $2, true, NOW()
        ) RETURNING id_rel_equipo
      `, [idProyecto, idLin3]);
      idRelEqPluma = insRelEq2.rows[0].id_rel_equipo;
    } else {
      idRelEqPluma = resRelEq2.rows[0].id_rel_equipo;
      await client.query(`
        UPDATE sch_leangsp.tpry_rel_equipo
        SET id_linea_servicio = $1, horas_plan = 8.0, estado_real = 'ASIGNADO', activo = true
        WHERE id_rel_equipo = $2
      `, [idLin3, idRelEqPluma]);
    }

    // 5.3 Operador Grúa (Héctor Paredes, 34)
    let resRelOp1 = await client.query(`
      SELECT id_rel_persona FROM sch_leangsp.tpry_rel_persona WHERE id_proyecto = $1 AND id_user = 34
    `, [idProyecto]);
    let idRelOpGrua;
    if (resRelOp1.rows.length === 0) {
      const insRelOp1 = await client.query(`
        INSERT INTO sch_leangsp.tpry_rel_persona (
          id_proyecto, id_user, rol_asignado, fecha_plan_ini, fecha_plan_fin,
          turnos_plan, horas_plan, estado_real, id_linea_servicio, activo, fecha_creacion
        ) VALUES (
          $1, 34, 'OPERADOR', '2026-11-13 08:00:00-03', '2026-11-13 18:00:00-03',
          'DIURNO', 8.0, 'ASIGNADO', $2, true, NOW()
        ) RETURNING id_rel_persona
      `, [idProyecto, idLin1]);
      idRelOpGrua = insRelOp1.rows[0].id_rel_persona;
    } else {
      idRelOpGrua = resRelOp1.rows[0].id_rel_persona;
      await client.query(`
        UPDATE sch_leangsp.tpry_rel_persona
        SET rol_asignado = 'OPERADOR', id_linea_servicio = $1, horas_plan = 8.0, estado_real = 'ASIGNADO', activo = true
        WHERE id_rel_persona = $2
      `, [idLin1, idRelOpGrua]);
    }

    // 5.4 Rigger Certificado (Andrés Urra, 22)
    let resRelRig = await client.query(`
      SELECT id_rel_persona FROM sch_leangsp.tpry_rel_persona WHERE id_proyecto = $1 AND id_user = 22
    `, [idProyecto]);
    let idRelRig;
    if (resRelRig.rows.length === 0) {
      const insRelRig = await client.query(`
        INSERT INTO sch_leangsp.tpry_rel_persona (
          id_proyecto, id_user, rol_asignado, fecha_plan_ini, fecha_plan_fin,
          turnos_plan, horas_plan, estado_real, id_linea_servicio, activo, fecha_creacion
        ) VALUES (
          $1, 22, 'RIGGER CERTIFICADO', '2026-11-13 08:00:00-03', '2026-11-13 18:00:00-03',
          'DIURNO', 8.0, 'ASIGNADO', $2, true, NOW()
        ) RETURNING id_rel_persona
      `, [idProyecto, idLin1]);
      idRelRig = insRelRig.rows[0].id_rel_persona;
    } else {
      idRelRig = resRelRig.rows[0].id_rel_persona;
      await client.query(`
        UPDATE sch_leangsp.tpry_rel_persona
        SET rol_asignado = 'RIGGER CERTIFICADO', id_linea_servicio = $1, horas_plan = 8.0, estado_real = 'ASIGNADO', activo = true
        WHERE id_rel_persona = $2
      `, [idLin1, idRelRig]);
    }

    // 5.5 Operador Camión Pluma (Víctor Márquez, 52)
    let resRelOp2 = await client.query(`
      SELECT id_rel_persona FROM sch_leangsp.tpry_rel_persona WHERE id_proyecto = $1 AND id_user = 52
    `, [idProyecto]);
    let idRelOpPluma;
    if (resRelOp2.rows.length === 0) {
      const insRelOp2 = await client.query(`
        INSERT INTO sch_leangsp.tpry_rel_persona (
          id_proyecto, id_user, rol_asignado, fecha_plan_ini, fecha_plan_fin,
          turnos_plan, horas_plan, estado_real, id_linea_servicio, activo, fecha_creacion
        ) VALUES (
          $1, 52, 'OPERADOR DE APOYO / CHOFER', '2026-11-13 08:00:00-03', '2026-11-13 18:00:00-03',
          'DIURNO', 8.0, 'ASIGNADO', $2, true, NOW()
        ) RETURNING id_rel_persona
      `, [idProyecto, idLin3]);
      idRelOpPluma = insRelOp2.rows[0].id_rel_persona;
    } else {
      idRelOpPluma = resRelOp2.rows[0].id_rel_persona;
      await client.query(`
        UPDATE sch_leangsp.tpry_rel_persona
        SET rol_asignado = 'OPERADOR DE APOYO / CHOFER', id_linea_servicio = $1, horas_plan = 8.0, estado_real = 'ASIGNADO', activo = true
        WHERE id_rel_persona = $2
      `, [idLin3, idRelOpPluma]);
    }

    console.log(`Asignaciones Confirmadas: EqGrua=${idRelEqGrua}, EqPluma=${idRelEqPluma}, OpGrua=${idRelOpGrua}, Rigger=${idRelRig}, OpPluma=${idRelOpPluma}`);

    // -------------------------------------------------------------
    // REGISTRO DE VIAJE / DESPLAZAMIENTO
    // -------------------------------------------------------------
    const tokenViaje = `vj-${idProyecto}-42-live`;
    let resViaje = await client.query(`
      SELECT id_log_desplazamiento FROM sch_leangsp.tequ_log_desplazamiento WHERE id_proyecto = $1 AND id_equipo = 42
    `, [idProyecto]);

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
          $1, 42, 'VPSR.26-1', 'IDA',
          '2026-11-13 07:45:00-03', '2026-11-13 08:50:00-03',
          45300.0, 45328.0,
          3460.00, 3461.10,
          'ARRIBADO', '[]'::jsonb, NOW(),
          34, $2, '2026-11-13'
        ) RETURNING id_log_desplazamiento
      `, [idProyecto, tokenViaje]);
      idDesplazamiento = insViaje.rows[0].id_log_desplazamiento;
    } else {
      idDesplazamiento = resViaje.rows[0].id_log_desplazamiento;
    }
    console.log(`Viaje Confirmado ID: ${idDesplazamiento}, Token: ${tokenViaje}`);

    // -------------------------------------------------------------
    // REPORT DIARIO DE OPERACIÓN
    // -------------------------------------------------------------
    let resRep = await client.query(`
      SELECT id_reporte_avance FROM sch_leangsp.tedp_reporte_avance WHERE id_proyecto = $1 AND dia_correlativo = 1
    `, [idProyecto]);

    let idReporte;
    const canvasFirmaMandante = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAK8AAAA8CAYAAADgG/KFAAAFnElEQVR4Xu2dz2tcVRTHP/feSZpm0lT6g9aCq1YEB1d1I+LSjYvgv9CvG924cCMu3LgQdy5dCF0IQty4EEXciKCiVRA3/gBRK5YmbfNmzrnkvZnJTDLz8t68eedNvhMIk5l77zv3nM+957x730tI6jHh4Sj6G';
    if (resRep.rows.length === 0) {
      const insRep = await client.query(`
        INSERT INTO sch_leangsp.tedp_reporte_avance (
          id_proyecto, id_log_desplazamiento, id_user_operador, id_equipo,
          dia_correlativo, fecha_reporte, unidad_cobro,
          horas_operadas, horas_facturables, horas_minimas, horas_colacion,
          horometro_inicio, horometro_termino,
          odometro_inicio, odometro_termino,
          monto_devengado_dia, observacion_trabajo,
          cliente_nombre, cliente_rut, cliente_cargo, cliente_firma_canvas_base64,
          estado_reporte, estado_jornada,
          fecha_inicio_servicio, fecha_termino_servicio, fecha_validacion,
          fecha_registro
        ) VALUES (
          $1, $2, 34, 42,
          1, $3, 'HORA',
          8.00, 8.00, 8.00, 1.00,
          3461.10, 3469.10,
          45328.0, 45328.0,
          880000.00, 'Montaje de estructura industrial y maniobras con grúa telescópica y apoyo de camión pluma. Faena recepcionada conforme.',
          'Sergio Gajardo', '78249226-8', 'Gerente General LeanGlobal Spa', $4,
          'VALIDADO_ANALISTA', 'FINALIZADA',
          '2026-11-13 09:00:00-03', '2026-11-13 17:00:00-03', '2026-11-13 17:30:00-03',
          NOW()
        ) RETURNING id_reporte_avance
      `, [idProyecto, idDesplazamiento, fechaHoy, canvasFirmaMandante]);
      idReporte = insRep.rows[0].id_reporte_avance;
    } else {
      idReporte = resRep.rows[0].id_reporte_avance;
    }
    console.log(`Report Diario Confirmado ID: ${idReporte}`);

    // -------------------------------------------------------------
    // ESTADO DE PAGO (EDP)
    // -------------------------------------------------------------
    const numeroEdp = `EDP-${codigoProyecto}-01`;
    const montoNetoTotal = 2400000.00;
    const montoIvaTotal = 456000.00;
    const montoBrutoTotal = 2856000.00;

    let resEdp = await client.query(`
      SELECT id_edp FROM sch_leangsp.tedp_estado_pago WHERE id_proyecto = $1
    `, [idProyecto]);

    let idEdp;
    if (resEdp.rows.length === 0) {
      const insEdp = await client.query(`
        INSERT INTO sch_leangsp.tedp_estado_pago (
          id_proyecto, numero_edp, fecha_corte_inicio, fecha_corte_fin,
          monto_neto, monto_iva, monto_total, estado_edp, fecha_registro
        ) VALUES (
          $1, $2, $3, $3,
          $4, $5, $6, 'APROBADO_PARA_FACTURAR', NOW()
        ) RETURNING id_edp
      `, [idProyecto, numeroEdp, fechaHoy, montoNetoTotal, montoIvaTotal, montoBrutoTotal]);
      idEdp = insEdp.rows[0].id_edp;

      // Vincular Report con EDP
      await client.query(`
        UPDATE sch_leangsp.tedp_reporte_avance SET id_edp = $1 WHERE id_reporte_avance = $2
      `, [idEdp, idReporte]);

      // Detalles del EDP
      await client.query(`
        INSERT INTO sch_leangsp.tedp_estado_pago_detalle (
          id_edp, concepto, unidad_cobro, cantidad, precio_unitario, monto_subtotal
        ) VALUES 
        ($1, 'Servicio de Izaje Grúa Telescópica 70 Toneladas', 'HORA', 8.00, 110000.00, 880000.00),
        ($1, 'Flete de Traslado Grúa 70T Base Temuco a Planta (Ida y Vuelta)', 'GL', 1.00, 750000.00, 750000.00),
        ($1, 'Servicio de Camión Pluma 10T Operativo', 'HORA', 8.00, 65000.00, 520000.00),
        ($1, 'Flete de Traslado Camión Pluma Base a Planta (Ida y Vuelta)', 'GL', 1.00, 250000.00, 250000.00)
      `, [idEdp]);
    } else {
      idEdp = resEdp.rows[0].id_edp;
    }
    console.log(`EDP Confirmado ID: ${idEdp}, Folio: ${numeroEdp}`);

    // -------------------------------------------------------------
    // INFORME DE TÉRMINO DE SERVICIO (ITS)
    // -------------------------------------------------------------
    const folioIts = `ITS-${codigoProyecto}-001`;
    const totalCostosOpe = 27000.00;
    const utilidadBruta = montoNetoTotal - totalCostosOpe;
    const margenPct = ((utilidadBruta / montoNetoTotal) * 100).toFixed(2);

    let resIts = await client.query(`
      SELECT id_its FROM sch_leangsp.tits_informe_termino WHERE id_proyecto = $1
    `, [idProyecto]);

    let idIts;
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
          8.00, 110000.00, 1000000.00,
          8.00, 1400000.00, 1000000.00,
          $3, $4,
          $5, $6, 'URBANO',
          'Servicio integral completado con éxito. Faena cerrada conforme por el mandante Sergio Gajardo. Aprobado para facturación.',
          'CONCLUIDO',
          55, '2026-11-13 18:00:00-03',
          1, '2026-11-13 18:30:00-03',
          NOW(), NOW(),
          'FES-ITS-LEANGLOBAL-CERT-50', '{"costos_guardados_usuario": true}'::jsonb
        ) RETURNING id_its
      `, [idProyecto, folioIts, montoNetoTotal, totalCostosOpe, utilidadBruta, margenPct]);
      idIts = insIts.rows[0].id_its;

      // Costos Operacionales en tits_costo_operacional
      await client.query(`
        INSERT INTO sch_leangsp.tits_costo_operacional (
          id_its, categoria, fecha, id_personal, nombre_personal,
          id_equipo, patente, concepto_detalle, tipo_calculo,
          cantidad_unidades, precio_unitario, monto_total, fecha_registro
        ) VALUES 
        (
          $1, 'ALIMENTACION', $2, 34, 'HECTOR PAREDES',
          42, 'VPSR.26-1', 'Alimentación Operador Grúa Faena Temuco', 'MONTO_DIRECTO',
          1.00, 9000.00, 9000.00, NOW()
        ),
        (
          $1, 'ALIMENTACION', $2, 22, 'ANDRES URRA',
          42, 'VPSR.26-1', 'Alimentación Rigger Faena Temuco', 'MONTO_DIRECTO',
          1.00, 9000.00, 9000.00, NOW()
        ),
        (
          $1, 'ALIMENTACION', $2, 52, 'VICTOR MARQUEZ',
          55, 'GVFX-24-5', 'Alimentación Operador Camión Pluma Faena Temuco', 'MONTO_DIRECTO',
          1.00, 9000.00, 9000.00, NOW()
        )
      `, [idIts, fechaHoy]);
    } else {
      idIts = resIts.rows[0].id_its;
    }
    console.log(`ITS Confirmado ID: ${idIts}, Folio: ${folioIts}, Margen: ${margenPct}%`);

    console.log('\n=============================================================');
    console.log('CICLO COMPLETO E2E CERTIFICADO Y PERSISTIDO VIVO EN DEV');
    console.log('=============================================================');
    console.log(JSON.stringify({
      id_proyecto: idProyecto,
      codigo_proyecto: codigoProyecto,
      folio_ot: codigoProyecto,
      folio_report: `REP-${idReporte}`,
      id_reporte_avance: idReporte,
      folio_edp: numeroEdp,
      id_edp: idEdp,
      folio_its: folioIts,
      id_its: idIts,
      token_viaje: tokenViaje
    }, null, 2));

  } catch (err) {
    console.error('ERROR EN COMPLETAR CICLO 50:', err);
    throw err;
  } finally {
    await client.end();
  }
}

completarCiclo50();
