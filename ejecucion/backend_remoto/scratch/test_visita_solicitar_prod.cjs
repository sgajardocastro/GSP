const axios = require('axios');

async function testSolicitarVisita() {
  console.log('Probando POST https://servidor.leanglobal.cl/lg-gsp-prod/api/visitas/solicitar/1?_id_empresa=9 ...');
  try {
    const res = await axios.post(
      'https://servidor.leanglobal.cl/lg-gsp-prod/api/visitas/solicitar/1?_id_empresa=9',
      {
        contacto_nombre: 'Contacto Prueba',
        contacto_telefono: '+56912345678',
        contacto_email: 'contacto@test.cl',
        obra_nombre: 'Obra Central',
        obra_direccion: 'Av Principal 123',
        obra_ciudad: 'Santiago',
        detalle_servicio: 'Izaje de prueba',
        fecha_visita_plan: '2026-10-06',
        hora_visita_plan: '10:00',
        email_coordinador: 'lguser@arriendosanpablo.cl'
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    console.log('STATUS:', res.status);
    console.log('DATA:', res.data);
  } catch (err) {
    console.error('ERROR STATUS:', err.response?.status);
    console.error('ERROR DATA:', err.response?.data);
  }
}

testSolicitarVisita();
