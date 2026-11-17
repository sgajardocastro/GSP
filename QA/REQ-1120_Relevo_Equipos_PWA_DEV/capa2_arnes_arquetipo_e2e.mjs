// Capa 2: Arnés API Transaccional DEV + Validación de Negocio
// Certifica la persistencia en PostgreSQL (sch_leangsp) y consumo HTTP real de la API DEV
// Valida el relevo de Grúa A (STDD.68-4, D1-D4) por Grúa B (CCCB.38-1, D5-D10) con $0 descuadre

import pg from '../../ejecucion/backend_remoto/node_modules/pg/lib/index.js';
const { Client } = pg;

const API_BASE = 'https://servidor.leanglobal.cl/lg-gsp-dev/api';
const DB_URL = 'postgres://usr_leangsp:usr_gsp_123@servidor.leanglobal.cl:5432/postgres';

async function ejecutarCapa2() {
  console.log('=== INICIANDO CAPA 2: ARNÉS API TRANSACCIONAL DEV ===\n');

  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  console.log('✅ Conexión establecida a PostgreSQL DEV (sch_leangsp)');

  try {
    const codiProyecto = 'GSP-2611-00127';
    const idEmpresaCliente = 3058; // BESALCO SA
    const idUserOperador = 62; // Claudio Gallardo
    const idGruaA = 38; // STDD.68-4 (LIEBHERR LTM-1070)
    const idGruaB = 36; // CCCB.38-1 (LIEBHERR LTM-1055, RELEVO)
    const tarifaHora = 50000;
    const horasMinimas = 8.0;

    // 1. Limpieza idempotente previa de proyecto QA anterior si existe
    const prevPry = await client.query('SELECT id_proyecto FROM sch_leangsp.tpry_proyecto WHERE codi_proyecto = $1', [codiProyecto]);
    let idPry;
    if (prevPry.rows.length > 0) {
      idPry = prevPry.rows[0].id_proyecto;
      console.log(`ℹ️ Proyecto previo encontrado (id_proyecto = ${idPry}). Limpiando reportes y asignaciones previas...`);
      await client.query('DELETE FROM sch_leangsp.tedp_estado_pago_detalle WHERE id_edp IN (SELECT id_edp FROM sch_leangsp.tedp_estado_pago WHERE id_proyecto = $1)', [idPry]);
      await client.query('DELETE FROM sch_leangsp.tedp_estado_pago WHERE id_proyecto = $1', [idPry]);
      await client.query('DELETE FROM sch_leangsp.tedp_reporte_avance WHERE id_proyecto = $1', [idPry]);
      await client.query('DELETE FROM sch_leangsp.tpry_rel_equipo WHERE id_proyecto = $1', [idPry]);
      await client.query('DELETE FROM sch_leangsp.tpry_rel_persona WHERE id_proyecto = $1', [idPry]);
      await client.query('DELETE FROM sch_leangsp.tpry_linea_servicio WHERE id_proyecto = $1', [idPry]);
    } else {
      console.log('ℹ️ Creando nuevo proyecto testigo desde cero en sch_leangsp.tpry_proyecto...');
      const insPry = await client.query(`
        INSERT INTO sch_leangsp.tpry_proyecto (
          codi_proyecto, nombre_proyecto, id_proyecto_estado, id_empresa, id_empresa_cliente,
          id_usuario_creacion, fecha_creacion, json_field
        ) VALUES (
          $1, $2, 4, 9, $3, 55, NOW(), $4
        ) RETURNING id_proyecto
      `, [
        codiProyecto,
        '[QA-REQ1120] Servicio Continuo 10 Días con Relevo Grúa en Faena',
        idEmpresaCliente,
        JSON.stringify({
          crm_v1: {
            tipo_ot: 'OT-MANIOBRA',
            obra_nombre: 'Montaje Estructural Planta Besalco Pitrufquén',
            obra_direccion: 'Ruta 5 Sur Km 680, Temuco',
            distancia_km: 15,
            linea_negocio: 'IZAJE',
            regimen_operacional: 'URBANO',
            contacto_nombre: 'Alfonso Porperrello',
            contacto_email: 'alfonso@leanglobal.cl',
            lineas_servicio: [
              {
                id_nodo: 'linea-01',
                tipo: 'GRUAS TELESCOPICAS',
                subcategoria: 'Grua Telescopica 70 Ton',
                descripcion: 'Servicio Continuo Grúa Telescópica 70 Toneladas (10 Días)',
                unidad: 'Horas Diarias Minimas',
                cantidad_dias: 10,
                pisoMinimo: 8.0,
                cantidad_horas: 8,
                valorUnitario: tarifaHora,
                subtotal: 4000000,
                equipo_asignado_id: idGruaA,
                operador_asignado_id: idUserOperador
              }
            ]
          },
          ejecucion_v1: {
            equipo_id: idGruaA,
            operador_id: idUserOperador
          }
        })
      ]);
      idPry = insPry.rows[0].id_proyecto;
    }
    console.log(`✅ Proyecto Testigo configurado (id_proyecto = ${idPry}, codi_proyecto = ${codiProyecto})`);

    // 1.1 Crear línea de servicio oficial en sch_leangsp.tpry_linea_servicio
    const insLinea = await client.query(`
      INSERT INTO sch_leangsp.tpry_linea_servicio (
        id_proyecto, linea_negocio, tipo_ot, rol_nodo, descripcion, subcategoria,
        unidad, cantidad, cantidad_dias, cantidad_horas, piso_minimo_horas,
        valor_unitario, subtotal, incluido_en_tarifa, es_apoyo_operativo, fecha_creacion
      ) VALUES (
        $1, 'IZAJE', 'OT-MANIOBRA', 'RAIZ', 'Servicio Continuo Grúa Telescópica 70 Toneladas (10 Días)',
        'Grua Telescopica 70 Ton', 'Horas Diarias Minimas', 10, 10, 8, 8.0,
        $2, 4000000.00, false, false, NOW()
      ) RETURNING id_linea_servicio
    `, [idPry, tarifaHora]);
    const idLineaServicio = insLinea.rows[0].id_linea_servicio;
    console.log(`✅ Línea de servicio relacional creada (id_linea_servicio = ${idLineaServicio})`);

    // 2. Asignar Operador en tpry_rel_persona
    await client.query(`
      INSERT INTO sch_leangsp.tpry_rel_persona (
        id_proyecto, id_user, rol_asignado, fecha_plan_ini, fecha_plan_fin,
        turnos_plan, horas_plan, estado_real, id_linea_servicio, activo, fecha_creacion
      ) VALUES (
        $1, $2, 'OPERADOR', '2026-11-01 08:00:00-03', '2026-11-10 18:00:00-03',
        'DIURNO', 80.0, 'ASIGNADO', $3, true, NOW()
      )
    `, [idPry, idUserOperador, idLineaServicio]);
    console.log('✅ Asignación de Operador Claudio Gallardo en tpry_rel_persona (10 días)');

    // 3. Asignación Temporal de Equipos (Relevo en Faena)
    // Grúa A: Días 1 a 4 (2026-11-01 al 2026-11-04)
    await client.query(`
      INSERT INTO sch_leangsp.tpry_rel_equipo (
        id_proyecto, id_equipo, rol_equipo, fecha_plan_ini, fecha_plan_fin,
        turnos_plan, horas_plan, estado_real, id_linea_servicio, activo, json_field, fecha_creacion
      ) VALUES (
        $1, $2, 'PRINCIPAL', '2026-11-01 08:00:00-03', '2026-11-04 18:00:00-03',
        'DIURNO', 32.0, 'ASIGNADO', $3, true, $4, NOW()
      )
    `, [idPry, idGruaA, idLineaServicio, JSON.stringify({ es_reemplazo: false })]);
    console.log('✅ Asignación Grúa A (STDD.68-4): Días 1 a 4 (32 hrs)');

    // Grúa B: Días 5 a 10 (2026-11-05 al 2026-11-10) -> SUSTITUCIÓN / RELEVO
    await client.query(`
      INSERT INTO sch_leangsp.tpry_rel_equipo (
        id_proyecto, id_equipo, rol_equipo, fecha_plan_ini, fecha_plan_fin,
        turnos_plan, horas_plan, estado_real, id_linea_servicio, activo, json_field, fecha_creacion
      ) VALUES (
        $1, $2, 'PRINCIPAL', '2026-11-05 08:00:00-03', '2026-11-10 18:00:00-03',
        'DIURNO', 48.0, 'ASIGNADO', $3, true, $4, NOW()
      )
    `, [idPry, idGruaB, idLineaServicio, JSON.stringify({
      es_reemplazo: true,
      id_equipo_reemplazado: idGruaA,
      patente_reemplazada: 'STDD.68-4',
      motivo_reemplazo: 'Falla hidráulica en telescopaje y relevo preventivo por Liebherr LTM-1055'
    })]);
    console.log('✅ Asignación Grúa B Relevo (CCCB.38-1): Días 5 a 10 (48 hrs)');

    // 4. Verificación de Resolución HTTP por Fecha de Faena
    console.log('\n--- VERIFICACIÓN HTTP DE RESOLUCIÓN TEMPORAL ---');
    // Consulta Día 2 (2026-11-02) -> Debe devolver Grúa A
    const resCtxD2 = await fetch(`${API_BASE}/operaciones/report/contexto/${idPry}?fecha_reporte=2026-11-02`);
    const dataCtxD2 = await resCtxD2.json();
    const ctxD2 = dataCtxD2.data || {};
    console.log('Contexto Día 2 (2026-11-02):', {
      id_equipo_seleccionado: ctxD2.id_equipo_seleccionado,
      patente: ctxD2.equipo?.patente,
      es_reemplazo: ctxD2.es_reemplazo
    });
    if (ctxD2.equipo?.patente !== 'STDD.68-4' || ctxD2.id_equipo_seleccionado !== idGruaA) {
      throw new Error(`Día 2 debía resolver STDD.68-4 pero devolvió ${ctxD2.equipo?.patente}`);
    }

    // Consulta Día 6 (2026-11-06) -> Debe devolver Grúa B con datos de relevo
    const resCtxD6 = await fetch(`${API_BASE}/operaciones/report/contexto/${idPry}?fecha_reporte=2026-11-06`);
    const dataCtxD6 = await resCtxD6.json();
    const ctxD6 = dataCtxD6.data || {};
    console.log('Contexto Día 6 (2026-11-06):', {
      id_equipo_seleccionado: ctxD6.id_equipo_seleccionado,
      patente: ctxD6.equipo?.patente,
      es_reemplazo: ctxD6.es_reemplazo,
      patente_reemplazada: ctxD6.patente_reemplazada,
      motivo_reemplazo: ctxD6.motivo_reemplazo
    });
    if (ctxD6.equipo?.patente !== 'CCCB.38-1' || ctxD6.id_equipo_seleccionado !== idGruaB || !ctxD6.es_reemplazo) {
      throw new Error(`Día 6 debía resolver CCCB.38-1 con es_reemplazo=true pero devolvió ${ctxD6.equipo?.patente}`);
    }
    console.log('✅ Endpoint /report/contexto/ resolvió deterministamente Grúa A y Grúa B según fecha');

    // 5. Inserción de 10 Reportes Diarios Consecutivos (Días 1 a 10)
    console.log('\n--- INSERCIÓN DE 10 REPORTES DIARIOS (D1-D4 Grúa A, D5-D10 Grúa B) ---');
    const reportesData = [
      // Grúa A
      { dia: 1, fecha: '2026-11-01', idEq: idGruaA, hIni: 1250.0, hFin: 1258.0 },
      { dia: 2, fecha: '2026-11-02', idEq: idGruaA, hIni: 1258.0, hFin: 1266.0 },
      { dia: 3, fecha: '2026-11-03', idEq: idGruaA, hIni: 1266.0, hFin: 1274.0 },
      { dia: 4, fecha: '2026-11-04', idEq: idGruaA, hIni: 1274.0, hFin: 1282.0 },
      // Grúa B (Relevo con horómetro independiente)
      { dia: 5, fecha: '2026-11-05', idEq: idGruaB, hIni: 4100.0, hFin: 4108.0 },
      { dia: 6, fecha: '2026-11-06', idEq: idGruaB, hIni: 4108.0, hFin: 4116.0 },
      { dia: 7, fecha: '2026-11-07', idEq: idGruaB, hIni: 4116.0, hFin: 4124.0 },
      { dia: 8, fecha: '2026-11-08', idEq: idGruaB, hIni: 4124.0, hFin: 4132.0 },
      { dia: 9, fecha: '2026-11-09', idEq: idGruaB, hIni: 4132.0, hFin: 4140.0 },
      { dia: 10, fecha: '2026-11-10', idEq: idGruaB, hIni: 4140.0, hFin: 4148.0 }
    ];

    const idsReportes = [];
    for (const r of reportesData) {
      const insRep = await client.query(`
        INSERT INTO sch_leangsp.tedp_reporte_avance (
          id_proyecto, id_user_operador, id_equipo, id_linea_servicio, dia_correlativo, fecha_reporte,
          unidad_cobro, horas_operadas, horas_facturables, horas_minimas,
          horometro_inicio, horometro_termino, monto_devengado_dia,
          observacion_trabajo, cliente_nombre, cliente_cargo,
          estado_reporte, estado_jornada, fecha_registro
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          'HORA', 8.0, 8.0, 8.0,
          $7, $8, 400000.00,
          $9, 'ALFONSO PORPERRELLO', 'Jefe de Proyecto Besalco',
          'VALIDADO_ANALISTA', 'FINALIZADA', NOW()
        ) RETURNING id_reporte_avance
      `, [
        idPry, idUserOperador, r.idEq, idLineaServicio, r.dia, r.fecha,
        r.hIni, r.hFin,
        r.dia <= 4 ? `Operación Día ${r.dia} con Grúa STDD.68-4` : `Operación Día ${r.dia} con Grúa Relevo CCCB.38-1`
      ]);
      idsReportes.push(insRep.rows[0].id_reporte_avance);
    }
    console.log(`✅ 10 reportes insertados y validados (IDs: ${idsReportes.join(', ')})`);

    // 6. Generación del Estado de Pago (EDP)
    console.log('\n--- GENERACIÓN DE ESTADO DE PAGO (EDP) ---');
    const numEdp = `EDP-${codiProyecto}-01`;
    const montoNeto = 4000000.00;
    const montoIva = 760000.00;
    const montoTotal = 4760000.00;

    const insEdp = await client.query(`
      INSERT INTO sch_leangsp.tedp_estado_pago (
        id_proyecto, numero_edp, fecha_corte_inicio, fecha_corte_fin,
        monto_neto, monto_iva, monto_total, estado_edp, fecha_registro
      ) VALUES (
        $1, $2, '2026-11-01', '2026-11-10',
        $3, $4, $5, 'APROBADO_PARA_FACTURAR', NOW()
      ) RETURNING id_edp
    `, [idPry, numEdp, montoNeto, montoIva, montoTotal]);
    const idEdp = insEdp.rows[0].id_edp;

    // Vincular todos los reportes al EDP
    await client.query('UPDATE sch_leangsp.tedp_reporte_avance SET id_edp = $1 WHERE id_proyecto = $2', [idEdp, idPry]);

    // Insertar líneas de detalle del EDP
    await client.query(`
      INSERT INTO sch_leangsp.tedp_estado_pago_detalle (
        id_edp, concepto, unidad_cobro, cantidad, precio_unitario, monto_subtotal
      ) VALUES 
      ($1, 'Servicio Grúa 70T Patente STDD.68-4 (Días 1 a 4)', 'HORA', 32.0, 50000.00, 1600000.00),
      ($1, 'Servicio Grúa Relevo 55T Patente CCCB.38-1 (Días 5 a 10)', 'HORA', 48.0, 50000.00, 2400000.00)
    `, [idEdp]);
    console.log(`✅ EDP ${numEdp} creado (id_edp = ${idEdp}) por $4.000.000 neto / $4.760.000 bruto`);

    // 7. Consumo del Endpoint Oficial de Resumen EDP
    console.log('\n--- AUDITORÍA DEL ENDPOINT OFICIAL DE RESUMEN EDP ---');
    const resEdpApi = await fetch(`${API_BASE}/operaciones/reports/edp/resumen/${idPry}`);
    const dataEdp = await resEdpApi.json();
    const edpPayload = dataEdp.data || {};
    const reportesValidados = edpPayload.reports_validados || [];
    const resumenFinanciero = edpPayload.resumen_financiero || {};

    console.log('Resultado Resumen EDP:', {
      success: dataEdp.success,
      total_reportes: reportesValidados.length,
      total_dias: resumenFinanciero.dias_totales,
      total_horas: resumenFinanciero.horas_facturables_totales,
      monto_neto: resumenFinanciero.total_neto,
      monto_iva: resumenFinanciero.iva_19,
      monto_bruto: resumenFinanciero.total_bruto
    });

    if (reportesValidados.length !== 10) {
      throw new Error(`Se esperaban 10 reportes en el EDP pero llegaron ${reportesValidados.length}`);
    }
    if (parseFloat(resumenFinanciero.horas_facturables_totales) !== 80.0) {
      throw new Error(`Se esperaban 80 hrs pero se calcularon ${resumenFinanciero.horas_facturables_totales}`);
    }
    if (Number(resumenFinanciero.total_neto) !== 4000000) {
      throw new Error(`Se esperaban $4.000.000 pero se calculó ${resumenFinanciero.total_neto}`);
    }
    if (Number(resumenFinanciero.total_bruto) !== 4760000) {
      throw new Error(`Se esperaban $4.760.000 pero se calculó ${resumenFinanciero.total_bruto}`);
    }

    // Verificar desglose de patentes en los 10 reportes del EDP
    const repsD1D4 = reportesValidados.slice(0, 4);
    const repsD5D10 = reportesValidados.slice(4, 10);

    const todasGruaA = repsD1D4.every(r => r.equipo_patente === 'STDD.68-4');
    const todasGruaB = repsD5D10.every(r => r.equipo_patente === 'CCCB.38-1');

    if (!todasGruaA) throw new Error('Los reportes D1-D4 deben tener patente STDD.68-4');
    if (!todasGruaB) throw new Error('Los reportes D5-D10 deben tener patente CCCB.38-1');
    console.log('✅ Desglose de patentes verificado: 4 reportes STDD.68-4 + 6 reportes CCCB.38-1');

    console.log('\n=== CAPA 2 COMPLETADA EXITOSAMENTE: 100% DETERMINISTA Y SIN DESCUADRE ===\n');
  } finally {
    await client.end();
  }
}

ejecutarCapa2().catch(e => {
  console.error('❌ ERROR EN CAPA 2:', e);
  process.exit(1);
});
