const axios = require('../node_modules/axios');

async function testApi() {
  const res = await axios.get('https://servidor.leanglobal.cl/lg-gsp-dev/api/operaciones/control-vivo?fecha=2026-08-27');
  const ots = res.data.data?.servicios || [];
  console.log('Total OTs:', ots.length);
  const ot44 = ots.find(o => o.codi_ot === 'GSP-2608-4854-044' || o.id_proyecto === 76);
  if (ot44) {
    console.log('OT 44 encontrada:');
    console.log('cliente:', ot44.cliente);
    console.log('dia_actual:', ot44.dia_actual, 'dias_totales:', ot44.dias_totales);
    console.log('reports_consumidos:', ot44.reports_consumidos);
    console.log('actividades:', ot44.actividades);
    console.log('equipos:', ot44.equipos);
  } else {
    console.log('OT 44 NO encontrada en /operaciones/control-vivo');
    console.log('OTs disponibles:', ots.map(o => `${o.id_proyecto} - ${o.codi_ot}`));
  }
}

testApi().catch(console.error);
