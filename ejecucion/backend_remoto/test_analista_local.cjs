const reportDiarioController = require('./src/controllers/reportDiarioController');

async function testLocalAnalista() {
  console.log('🧪 Iniciando verificación local del Cockpit de Control de Gestión...');
  
  const req = {};
  const res = {
    statusCode: 200,
    status(c) { this.statusCode = c; return this; },
    json(data) {
      console.log('✅ Status:', this.statusCode);
      console.log('📊 KPIs retornados:', JSON.stringify(data.data?.kpis, null, 2));
      console.log('📋 Cantidad de reports en bandeja:', data.data?.reports?.length);
      if (data.data?.reports?.length > 0) {
        const primero = data.data.reports[0];
        console.log('   Primer report:', {
          id_reporte: primero.id_reporte_avance,
          ot: primero.codi_proyecto,
          cliente: primero.cliente_nombre,
          fecha: primero.fecha_reporte,
          horas_facturables: primero.horas_facturables,
          estado: primero.estado_reporte,
          tiene_ajustes: !!primero.ajustes_analista
        });
      }
      console.log('📑 Cantidad de OTs en liquidación:', data.data?.ots_liquidacion?.length);
      if (data.data?.ots_liquidacion?.length > 0) {
        const primeraOT = data.data.ots_liquidacion[0];
        console.log('   Primera OT:', {
          id_proyecto: primeraOT.id_proyecto,
          ot: primeraOT.codi_proyecto,
          cliente: primeraOT.cliente_nombre,
          estado_its: primeraOT.estado_its,
          monto_facturable: primeraOT.total_ingresos_facturables,
          reports_validados: primeraOT.reports_validados,
          reports_pendientes: primeraOT.reports_pendientes
        });
      }
      process.exit(0);
    }
  };

  try {
    await reportDiarioController.getPendientesAnalista(req, res);
  } catch (err) {
    console.error('❌ Error ejecutando getPendientesAnalista:', err);
    process.exit(1);
  }
}

testLocalAnalista();
