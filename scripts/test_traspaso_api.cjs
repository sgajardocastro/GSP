const axios = require('../ejecucion/backend_remoto/node_modules/axios');

const BASE_URL = 'http://138.255.103.18/lg-gsp-dev/api';

async function testTraspaso() {
  console.log('=== TESTEANDO API DE TRASPASOS SPEC-094 EN DEV ===\n');

  // 1. Obtener bodegas
  const resBodegas = await axios.get(`${BASE_URL}/inventario/bodegas`);
  console.log('Bodegas:', resBodegas.data.data.map(b => `${b.id}: ${b.nombre}`));

  // 2. Obtener existencias reales con stock positivo
  const resExist = await axios.get(`${BASE_URL}/inventario/existencias`);
  const conStock = resExist.data.data.filter(e => Number(e.cantidad_fisica) >= 2 && Number(e.id_bodega) === 1);
  console.log('Total con stock >= 2 en Bodega 1:', conStock.length);
  const prodElegido = conStock[0];
  console.log('Producto seleccionado:', prodElegido);

  // 3. Crear traspaso
  const payloadTrp = {
    id_bodega_origen: 1, // Bodega Taller Central
    id_bodega_destino: 2, // Bodega Faena Antofagasta
    tipo_traspaso: 'INTERBODEGA',
    chofer_transporte: 'Marcelo Garrido',
    patente_transporte: 'LJ-9821',
    observaciones: 'Traslado de repuestos críticos para mantención preventiva en Faena Antofagasta',
    lineas: [
      {
        id_producto: prodElegido.id_producto,
        cantidad: 1,
        id_ubicacion_origen: prodElegido.id_ubicacion
      }
    ]
  };

  console.log('\nEnviando POST /inventario/traspasos...');
  const resCrear = await axios.post(`${BASE_URL}/inventario/traspasos`, payloadTrp);
  console.log('Resultado crear:', resCrear.data);

  // 4. Consultar listado de traspasos
  const resList = await axios.get(`${BASE_URL}/inventario/traspasos`);
  console.log('\nListado traspasos (count):', resList.data.count);
  console.log('Primer traspaso:', JSON.stringify(resList.data.data[0], null, 2));

  console.log('\n Test Traspaso completado con éxito.');
}

testTraspaso().catch(err => {
  console.error('Error en testTraspaso:', err.response?.data || err.message);
});
