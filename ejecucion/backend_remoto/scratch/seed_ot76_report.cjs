const pool = require('../src/config/dbConfig');

async function main() {
  for (const s of ['sch_leangsp', 'sch_leangsp_prod']) {
    console.log('Widening unidad_cobro in schema:', s);
    await pool.query(`ALTER TABLE ${s}.tedp_reporte_avance ALTER COLUMN unidad_cobro TYPE character varying(50);`).catch(e => console.warn(e.message));
  }

  const schema = process.env.DB_SCHEMA || 'sch_leangsp';

  // Check if report for 76 exists
  const exist = await pool.query(`SELECT id_reporte_avance FROM ${schema}.tedp_reporte_avance WHERE id_proyecto = 76`);
  if (exist.rows.length === 0) {
    const ins = await pool.query(`
      INSERT INTO ${schema}.tedp_reporte_avance (
        id_proyecto,
        id_equipo,
        id_user_operador,
        dia_correlativo,
        fecha_reporte,
        unidad_cobro,
        fecha_inicio_servicio,
        fecha_termino_servicio,
        horas_operadas,
        horas_facturables,
        horas_sobretiempo,
        horas_colacion,
        horas_minimas,
        horometro_inicio,
        horometro_termino,
        token_report,
        estado_reporte,
        estado_jornada,
        ajustes_analista,
        fecha_registro,
        cliente_nombre,
        cliente_cargo,
        observacion_trabajo
      ) VALUES (
        76,
        35,
        53,
        1,
        '2026-08-27',
        'HRS_DIA',
        '2026-08-27 08:00:00',
        '2026-08-27 18:00:00',
        9.0,
        9.0,
        1.0,
        1.0,
        8.0,
        1450.0,
        1459.0,
        'REG-76-D1-4854',
        'REGULARIZADO_MANUAL',
        'CONCLUIDO',
        $1,
        CURRENT_TIMESTAMP,
        'Celulosa Arauco',
        'Supervisor de Montaje',
        'Izaje de estructura metálica con pluma extendida y contrapesos'
      ) RETURNING *;
    `, [JSON.stringify({
      origen: 'TORRE_CONTROL',
      regularizado_manual: true,
      requiere_evidencia_fisica: true,
      motivo: 'Jornada regularizada desde Torre de Control',
      fecha_regularizacion: new Date().toISOString(),
      modificado_por: 'Sergio Gajardo (Control Gestión)'
    })]);

    console.log('✅ Successfully inserted regularized report for OT 76:', ins.rows[0]);
  } else {
    console.log('Report for OT 76 already exists:', exist.rows);
  }

  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
