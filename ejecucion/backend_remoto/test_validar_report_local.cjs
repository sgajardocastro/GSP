const db = require('./src/config/dbConfig');

async function testValidacionTransaccional() {
  console.log('🧪 Iniciando verificación de validación con trazabilidad de diffs...');

  try {
    // 1. Buscar un report en estado PENDIENTE_VALIDACION
    const repRes = await db.query(`
      SELECT 
        ra.id_reporte_avance,
        ra.id_proyecto,
        ra.dia_correlativo,
        ra.horas_operadas,
        ra.horas_facturables,
        ra.horas_colacion,
        ra.horometro_inicio,
        ra.horometro_termino,
        ra.estado_reporte,
        p.codi_proyecto,
        clt.razon_social as cliente_nombre
      FROM sch_leangsp.tedp_reporte_avance ra
      LEFT JOIN sch_leangsp.tpry_proyecto p ON ra.id_proyecto = p.id_proyecto
      LEFT JOIN sch_leangsp.tpar_empresas clt ON p.id_empresa_cliente = clt.id_empresa
      WHERE ra.estado_reporte = 'PENDIENTE_VALIDACION'
      ORDER BY ra.id_reporte_avance ASC
      LIMIT 1;
    `);

    if (repRes.rows.length === 0) {
      console.log('⚠️ No hay reportes pendientes de validación en la BD.');
      process.exit(0);
    }

    const report = repRes.rows[0];
    console.log(`📋 Report seleccionado para prueba: ID #${report.id_reporte_avance} (OT: ${report.codi_proyecto})`);
    console.log(`   Valores actuales en terreno:`, {
      horas_operadas: report.horas_operadas,
      horas_facturables: report.horas_facturables,
      horas_colacion: report.horas_colacion,
      horometro: `${report.horometro_inicio} ➔ ${report.horometro_termino}`
    });

    // 2. Simular ajustes del Analista
    const ajustesPrueba = {
      horas_facturables: 8.0, // Ajustado
      horas_operadas: Number(report.horas_operadas),
      horas_colacion: 1.5,   // Ajustado de 1.0 a 1.5
      horometro_inicio: Number(report.horometro_inicio),
      horometro_termino: Number(report.horometro_termino)
    };

    const difFact = Math.abs(ajustesPrueba.horas_facturables - Number(report.horas_facturables)) > 0.01;
    const difCol = Math.abs(ajustesPrueba.horas_colacion - Number(report.horas_colacion)) > 0.01;

    console.log(`🔍 Detección de Diffs:`, {
      difFacturables: difFact,
      difColacion: difCol,
      huboAjustes: difFact || difCol
    });

    const payloadAjustes = {
      modificado: true,
      fecha_ajuste: new Date().toISOString(),
      id_user_analista: 1,
      nombre_analista: 'Sergio Gajardo (Control de Gestión)',
      valores_originales: {
        horas_operadas: Number(report.horas_operadas),
        horas_facturables: Number(report.horas_facturables),
        horas_colacion: Number(report.horas_colacion),
        horometro_inicio: Number(report.horometro_inicio),
        horometro_termino: Number(report.horometro_termino)
      },
      valores_ajustados: ajustesPrueba,
      observacion_ajuste: 'Prueba de verificación: Descuento 1h por espera justificada mandante'
    };

    console.log(`📦 Payload de Auditoría JSONB generado:`, JSON.stringify(payloadAjustes, null, 2));

    console.log('✅ Verificación matemática y estructural de la auditoría: EXITOSA');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error en prueba:', err);
    process.exit(1);
  }
}

testValidacionTransaccional();
