const axios = require('../ejecucion/backend_remoto/node_modules/axios');

async function testGenerate() {
  try {
    console.log('Invocando generación de PDF para proyecto 109...');
    // We can do it internally on DEV via SSH or directly if endpoint is open or authenticated
    const res = await axios.post('https://servidor.leanglobal.cl/lg-gsp-dev/api/proyectos/109/contrato/generar-pdf', {
      fecha_inicio: '2026-10-15',
      fecha_termino: '2026-10-30',
      id_empresa_arrendador: 11
    });
    console.log('Respuesta generación:', res.data);
  } catch (err) {
    if (err.response) {
      console.log('Respuesta HTTP:', err.response.status, err.response.data);
    } else {
      console.error('Error:', err.message);
    }
  }
}

testGenerate();
