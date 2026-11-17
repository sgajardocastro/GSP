// Configuración de Caso Testigo Activo en DEV (Proyecto 191 / GSP-2611-00128)
// Simula que hoy (CURRENT_DATE) el operador Claudio Gallardo (id_user=62)
// debe emitir el Report Diario del Día 5, visualizando en PWA el relevo de Grúa A por Grúa B.

const { Client } = require('../../ejecucion/backend_remoto/node_modules/pg');
const c = new Client({ connectionString: 'postgres://usr_leangsp:usr_gsp_123@servidor.leanglobal.cl:5432/postgres' });

async function setup() {
  await c.connect();
  console.log('Conectado a PostgreSQL DEV');

  const codi = 'GSP-2611-00128';
  const prev = await c.query('SELECT id_proyecto FROM sch_leangsp.tpry_proyecto WHERE codi_proyecto = $1', [codi]);
  let idPry;
  if (prev.rows.length > 0) {
    idPry = prev.rows[0].id_proyecto;
    await c.query('DELETE FROM sch_leangsp.tedp_reporte_avance WHERE id_proyecto = $1', [idPry]);
    await c.query('DELETE FROM sch_leangsp.tpry_rel_equipo WHERE id_proyecto = $1', [idPry]);
    await c.query('DELETE FROM sch_leangsp.tpry_rel_persona WHERE id_proyecto = $1', [idPry]);
    await c.query('DELETE FROM sch_leangsp.tpry_linea_servicio WHERE id_proyecto = $1', [idPry]);
  } else {
    const ins = await c.query(`
      INSERT INTO sch_leangsp.tpry_proyecto (
        codi_proyecto, nombre_proyecto, id_proyecto_estado, id_empresa, id_empresa_cliente,
        id_usuario_creacion, fecha_creacion, json_field
      ) VALUES (
        $1, $2, 4, 9, 3058, 55, NOW(), $3
      ) RETURNING id_proyecto
    `, [
      codi,
      '[QA-REQ1120] Faena Activa con Relevo Grúa en Curso (Día 5)',
      JSON.stringify({
        crm_v1: {
          tipo_ot: 'OT-MANIOBRA',
          obra_nombre: 'Montaje Industrial Planta Besalco Lautaro',
          obra_direccion: 'Parque Industrial Lautaro',
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
              valorUnitario: 50000,
              subtotal: 4000000,
              equipo_asignado_id: 38,
              operador_asignado_id: 62
            }
          ]
        },
        ejecucion_v1: {
          equipo_id: 38,
          operador_id: 62
        }
      })
    ]);
    idPry = ins.rows[0].id_proyecto;
  }

  // 1. Línea de servicio
  const insLin = await c.query(`
    INSERT INTO sch_leangsp.tpry_linea_servicio (
      id_proyecto, linea_negocio, tipo_ot, rol_nodo, descripcion, subcategoria,
      unidad, cantidad, cantidad_dias, cantidad_horas, piso_minimo_horas,
      valor_unitario, subtotal, incluido_en_tarifa, es_apoyo_operativo, fecha_creacion
    ) VALUES (
      $1, 'IZAJE', 'OT-MANIOBRA', 'RAIZ', 'Servicio Continuo Grúa Telescópica 70 Toneladas (10 Días)',
      'Grua Telescopica 70 Ton', 'Horas Diarias Minimas', 10, 10, 8, 8.0,
      50000.00, 4000000.00, false, false, NOW()
    ) RETURNING id_linea_servicio
  `, [idPry]);
  const idLinea = insLin.rows[0].id_linea_servicio;

  // 2. Operador vigente hoy (2026-11-15)
  await c.query(`
    INSERT INTO sch_leangsp.tpry_rel_persona (
      id_proyecto, id_user, rol_asignado, fecha_plan_ini, fecha_plan_fin,
      turnos_plan, horas_plan, estado_real, id_linea_servicio, activo, fecha_creacion
    ) VALUES (
      $1, 62, 'OPERADOR', '2026-11-10 08:00:00-03', '2026-11-20 18:00:00-03',
      'DIURNO', 80.0, 'PROGRAMADO', $2, true, NOW()
    )
  `, [idPry, idLinea]);

  // 3. Grúa A (días 1 a 4: 2026-11-11 al 2026-11-14)
  await c.query(`
    INSERT INTO sch_leangsp.tpry_rel_equipo (
      id_proyecto, id_equipo, rol_equipo, fecha_plan_ini, fecha_plan_fin,
      turnos_plan, horas_plan, estado_real, id_linea_servicio, activo, json_field, fecha_creacion
    ) VALUES (
      $1, 38, 'PRINCIPAL', '2026-11-11 08:00:00-03', '2026-11-14 18:00:00-03',
      'DIURNO', 32.0, 'ASIGNADO', $2, true, $3, NOW()
    )
  `, [idPry, idLinea, JSON.stringify({ es_reemplazo: false })]);

  // 4. Grúa B Relevo (días 5 a 10: 2026-11-15 al 2026-11-20) -> VIGENTE HOY 2026-11-15
  await c.query(`
    INSERT INTO sch_leangsp.tpry_rel_equipo (
      id_proyecto, id_equipo, rol_equipo, fecha_plan_ini, fecha_plan_fin,
      turnos_plan, horas_plan, estado_real, id_linea_servicio, activo, json_field, fecha_creacion
    ) VALUES (
      $1, 36, 'PRINCIPAL', '2026-11-15 08:00:00-03', '2026-11-20 18:00:00-03',
      'DIURNO', 48.0, 'ASIGNADO', $2, true, $3, NOW()
    )
  `, [idPry, idLinea, JSON.stringify({
    es_reemplazo: true,
    id_equipo_reemplazado: 38,
    patente_reemplazada: 'STDD.68-4',
    motivo_reemplazo: 'Falla hidráulica en telescopaje y relevo preventivo por Liebherr LTM-1055'
  })]);

  // 5. Inserción de 4 reportes concluidos previos para Grúa A (Días 1 a 4)
  for (let d = 1; d <= 4; d++) {
    const fStr = `2026-11-${String(10 + d).padStart(2, '0')}`;
    await c.query(`
      INSERT INTO sch_leangsp.tedp_reporte_avance (
        id_proyecto, id_user_operador, id_equipo, id_linea_servicio, dia_correlativo, fecha_reporte,
        unidad_cobro, horas_operadas, horas_facturables, horas_minimas,
        horometro_inicio, horometro_termino, monto_devengado_dia,
        observacion_trabajo, cliente_nombre, cliente_cargo,
        estado_reporte, estado_jornada, fecha_registro
      ) VALUES (
        $1, 62, 38, $2, $3, $4,
        'HORA', 8.0, 8.0, 8.0,
        $5, $6, 400000.00,
        $7, 'ALFONSO PORPERRELLO', 'Jefe de Proyecto Besalco',
        'VALIDADO_ANALISTA', 'FINALIZADA', NOW()
      )
    `, [
      idPry, idLinea, d, fStr,
      1250.0 + (d - 1) * 8, 1250.0 + d * 8,
      `Operación Día ${d} con Grúa STDD.68-4`
    ]);
  }

  console.log(`Proyecto activo ${codi} configurado (id_proyecto = ${idPry}). Día 5 pendiente HOY.`);
  await c.end();

  // Test endpoint pendientes
  const res = await fetch('https://servidor.leanglobal.cl/lg-gsp-dev/api/operaciones/reports/usuario/pendientes?id_user=62');
  const d = await res.json();
  console.log('Bandeja de Pendientes para Claudio Gallardo:', JSON.stringify(d.pendientes, null, 2));
}

setup().catch(console.error);
