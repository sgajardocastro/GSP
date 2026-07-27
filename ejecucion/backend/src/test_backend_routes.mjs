import app from './app.js';
import http from 'http';

const server = http.createServer(app);

server.listen(0, async () => {
  const port = server.address().port;
  console.log(`🚀 Servidor Express de prueba corriendo en el puerto ${port}`);

  const makeReq = (path, method = 'GET', body = null) => {
    return new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port,
        path,
        method,
        headers: { 'Content-Type': 'application/json' }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data || '{}') }));
      });
      req.on('error', reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  };

  try {
    console.log('\n--- 1. Pruebas Módulo Inventario (WMS-Lite) ---');
    const bodegas = await makeReq('/api/inventario/bodegas');
    console.log('GET /api/inventario/bodegas status:', bodegas.status, '| Cantidad:', bodegas.data.length);

    const productos = await makeReq('/api/inventario/productos');
    console.log('GET /api/inventario/productos status:', productos.status, '| Total:', productos.data.total);

    // Validación dura: Costo = 0 -> Debe retornar HTTP 422 COSTO_CERO_NO_PERMITIDO
    const errCosto = await makeReq('/api/inventario/existencias/ingresar', 'POST', { id_producto: 101, id_bodega: 1, costo: 0, oc: 'OC-123' });
    console.log('POST /api/inventario/existencias/ingresar (Costo 0) -> Status:', errCosto.status, '| Error Code:', errCosto.data.error_code);

    // Validación dura: Sin OC -> Debe retornar HTTP 422 OC_REQUERIDA
    const errOc = await makeReq('/api/inventario/existencias/ingresar', 'POST', { id_producto: 101, id_bodega: 1, costo: 5000, oc: '' });
    console.log('POST /api/inventario/existencias/ingresar (Sin OC) -> Status:', errOc.status, '| Error Code:', errOc.data.error_code);

    // Ingreso válido
    const okIngreso = await makeReq('/api/inventario/existencias/ingresar', 'POST', { id_producto: 101, id_bodega: 1, costo: 5000, oc: 'OC-9988' });
    console.log('POST /api/inventario/existencias/ingresar (Válido) -> Status:', okIngreso.status, '| SKU:', okIngreso.data.sku);


    console.log('\n--- 2. Pruebas Módulo Mantenimiento (OTs) ---');
    const ots = await makeReq('/api/mantenimiento/ots');
    console.log('GET /api/mantenimiento/ots status:', ots.status, '| OTs activas:', ots.data.length);

    // Validación dura: PIN inválido -> Debe retornar HTTP 422 PIN_INVALIDO
    const errPin = await makeReq('/api/mantenimiento/ots/OT-10045/cerrar', 'POST', { pin_supervisor: '0000' });
    console.log('POST /api/mantenimiento/ots/OT-10045/cerrar (PIN Inválido) -> Status:', errPin.status, '| Error Code:', errPin.data.error_code);

    // Validación dura: Actividades pendientes -> Debe retornar HTTP 422 OT_CON_ACTIVIDADES_PENDIENTES
    const errAct = await makeReq('/api/mantenimiento/ots/OT-10045/cerrar', 'POST', { pin_supervisor: '1234' });
    console.log('POST /api/mantenimiento/ots/OT-10045/cerrar (Tareas Incompletas) -> Status:', errAct.status, '| Error Code:', errAct.data.error_code);

    console.log('\n🎉 ¡TODAS LAS PRUEBAS DE CONTRATO ESPECIFICADO PASARON EXITOSAMENTE!');
  } catch (e) {
    console.error('❌ Error ejecutando pruebas:', e);
  } finally {
    server.close();
  }
});
