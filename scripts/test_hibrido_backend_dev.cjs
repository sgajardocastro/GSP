const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function runTest() {
  console.log('================================================================');
  console.log(' TEST INTEGRAL SPEC-089: INTEGRACIÓN HÍBRIDA MANTENIMIENTO - WMS');
  console.log('================================================================\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const schema = 'sch_leangsp';

  // Helper para consultas psql limpias en JSON
  async function queryJson(sql) {
    const jsonSql = `SELECT json_agg(t) FROM (${sql}) t;`;
    const tmp = '/tmp/test_q.sql';
    await ssh.execCommand(`cat << 'EOF' > ${tmp}\n${jsonSql}\nEOF`);
    const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -A -f ${tmp}"`);
    await ssh.execCommand(`rm -f ${tmp}`);
    const out = res.stdout.trim();
    if (!out || out === 'null') return [];
    return JSON.parse(out);
  }

  // 1. Obtener producto con stock real en DEV
  console.log('1. Buscando producto con stock físico disponible en Bodega WMS...');
  const prodRows = await queryJson(`
    SELECT s.id_stock, s.id_producto, p.sku, p.nombre, s.id_ubicacion, u.codigo AS codigo_ubicacion, s.cantidad_fisica, p.costo_pmp_vigente
    FROM ${schema}.tinv_stock s
    JOIN ${schema}.tinv_producto p ON p.id_producto = s.id_producto
    JOIN ${schema}.tinv_ubicacion u ON u.id_ubicacion = s.id_ubicacion
    WHERE s.cantidad_fisica >= 2 AND s.id_empresa = 9
    ORDER BY s.id_stock ASC
    LIMIT 1
  `);

  if (!prodRows || prodRows.length === 0) {
    throw new Error('No se encontró producto con stock >= 2 en DEV');
  }

  const pData = prodRows[0];
  const id_stock = pData.id_stock;
  const id_producto = pData.id_producto;
  const sku = pData.sku;
  const nombre = pData.nombre;
  const id_ubicacion = pData.id_ubicacion;
  const codigo_ubicacion = pData.codigo_ubicacion;
  const stockInicial = parseFloat(pData.cantidad_fisica);
  const pmp = parseFloat(pData.costo_pmp_vigente);

  console.log(`   Producto seleccionado: [${sku}] ${nombre}`);
  console.log(`   ID Stock: ${id_stock} | Ubicación: [${id_ubicacion}] ${codigo_ubicacion} | Stock Físico Inicial: ${stockInicial} | PMP: $${pmp}\n`);

  // 2. Obtener una OT activa
  console.log('2. Obteniendo OT de prueba en DEV...');
  const otRows = await queryJson(`
    SELECT id_ot, COALESCE(numero_ot, 'OT-' || id_ot) AS folio
    FROM ${schema}.tmnt_ot
    WHERE estado IN ('ABIERTA', 'EN_PROCESO', 'PENDIENTE')
    ORDER BY id_ot DESC
    LIMIT 1
  `);

  if (!otRows || otRows.length === 0) {
    throw new Error('No se encontró OT abierta en DEV');
  }
  const idOt = otRows[0].id_ot;
  const folioOt = otRows[0].folio;
  console.log(`   OT destino: ID ${idOt} (Folio: ${folioOt})\n`);

  // 3. Test: Intentar agregar con stock insuficiente (> cantidad_fisica)
  console.log('3. Validando error 400 STOCK_INSUFICIENTE ante exceso de cantidad...');
  const payloadExceso = JSON.stringify({
    origen_insumo: 'BODEGA_WMS',
    id_producto: parseInt(id_producto, 10),
    id_ubicacion: parseInt(id_ubicacion, 10),
    cantidad: 99999
  });
  const curlExceso = await ssh.execCommand(`curl -s -w "\\n%{http_code}" -X POST "http://127.0.0.1:3006/api/mantenimiento/ots/${idOt}/materiales" -H "Content-Type: application/json" -d '${payloadExceso}'`);
  const linesExceso = curlExceso.stdout.trim().split('\n');
  const codeExceso = linesExceso.pop();
  const bodyExceso = JSON.parse(linesExceso.join('\n'));
  console.log(`   HTTP Code: ${codeExceso}, Respuesta:`, bodyExceso);
  if (codeExceso !== '400' || !bodyExceso.error.includes('Stock insuficiente')) {
    throw new Error('Validación de stock insuficiente falló. Se esperaba HTTP 400.');
  }
  console.log('   -> OK: Error 400 controlado y mensaje amigable retornado exitosamente.\n');

  // 4. Test: Agregar Insumo desde BODEGA_WMS
  console.log('4. Ejecutando POST /api/mantenimiento/ots/:id/materiales [BODEGA_WMS]...');
  const payloadWms = JSON.stringify({
    origen_insumo: 'BODEGA_WMS',
    id_producto: parseInt(id_producto, 10),
    id_ubicacion: parseInt(id_ubicacion, 10),
    cantidad: 1
  });

  const curlWms = await ssh.execCommand(`curl -s -X POST "http://127.0.0.1:3006/api/mantenimiento/ots/${idOt}/materiales" -H "Content-Type: application/json" -d '${payloadWms}'`);
  console.log('   Respuesta API BODEGA_WMS:\n   ', curlWms.stdout);
  const respWms = JSON.parse(curlWms.stdout);
  if (!respWms.success || !respWms.data) {
    throw new Error('Fallo al agregar repuesto BODEGA_WMS: ' + curlWms.stdout);
  }

  const idRepuestoWms = respWms.data.id_ot_repuesto;
  const idMovKardex = respWms.data.id_movimiento_kardex;
  console.log(`   -> OK: Creado tmnt_ot_repuesto ID: ${idRepuestoWms}, Kardex Mov ID: ${idMovKardex}`);

  // 5. Validar decrecimiento en tinv_stock y movimiento en tinv_movimiento
  console.log('\n5. Verificando decrecimiento en tinv_stock y registro en tinv_movimiento...');
  const stockCheck = await queryJson(`SELECT cantidad_fisica FROM ${schema}.tinv_stock WHERE id_stock = ${id_stock}`);
  const stockPostSalida = parseFloat(stockCheck[0].cantidad_fisica);
  console.log(`   Stock Inicial: ${stockInicial} -> Stock Posterior Salida: ${stockPostSalida}`);
  if (stockPostSalida !== stockInicial - 1) {
    throw new Error(`Error en Kardex: se esperaba ${stockInicial - 1} pero se obtuvo ${stockPostSalida}`);
  }
  console.log('   -> OK: Stock decrementado exactamente en 1 unidad.');

  const movCheck = await queryJson(`
    SELECT id_movimiento, tipo_movimiento, cantidad, documento_tipo, documento_folio, costo_unitario_pmp 
    FROM ${schema}.tinv_movimiento 
    WHERE id_movimiento = ${idMovKardex}
  `);
  console.log('   Fila tinv_movimiento SALIDA_OT:', JSON.stringify(movCheck[0]));
  if (movCheck[0].tipo_movimiento !== 'SALIDA_OT' || movCheck[0].documento_tipo !== 'OT_MNT') {
    throw new Error('Asiento inmutable en Kardex no coincide con SALIDA_OT / OT_MNT');
  }
  console.log('   -> OK: Asiento SALIDA_OT inmutable verificado en tinv_movimiento.');

  // 6. Test: Agregar Insumo COMPRA_DIRECTA
  console.log('\n6. Ejecutando POST /api/mantenimiento/ots/:id/materiales [COMPRA_DIRECTA]...');
  const numFactura = 'FAC-DEV-' + Date.now().toString().slice(-5);
  const payloadCd = JSON.stringify({
    origen_insumo: 'COMPRA_DIRECTA',
    descripcion_material: 'Insumo QA Compra Directa Terreno',
    cantidad: 2,
    unidad_medida: 'UNIDAD',
    costo_unitario: 12500,
    proveedor_o_documento: 'Ferretería Industrial QA',
    numero_documento_compra: numFactura
  });

  const curlCd = await ssh.execCommand(`curl -s -X POST "http://127.0.0.1:3006/api/mantenimiento/ots/${idOt}/materiales" -H "Content-Type: application/json" -d '${payloadCd}'`);
  console.log('   Respuesta API COMPRA_DIRECTA:\n   ', curlCd.stdout);
  const respCd = JSON.parse(curlCd.stdout);
  if (!respCd.success || !respCd.data) {
    throw new Error('Fallo al agregar repuesto COMPRA_DIRECTA: ' + curlCd.stdout);
  }
  const idRepuestoCd = respCd.data.id_ot_repuesto;
  console.log(`   -> OK: Creado tmnt_ot_repuesto ID: ${idRepuestoCd}, Factura: ${respCd.data.numero_documento_compra}, Kardex: ${respCd.data.id_movimiento_kardex}`);

  // 7. Test: Consultar Detalle OT y validar campos enriquecidos
  console.log('\n7. Consultando GET /api/mantenimiento/ots/:id para validar estructura enriquecida...');
  const curlDetalle = await ssh.execCommand(`curl -s "http://127.0.0.1:3006/api/mantenimiento/ots/${idOt}"`);
  const respDetalle = JSON.parse(curlDetalle.stdout);
  const repuestosList = respDetalle.data?.repuestos_manuales || respDetalle.data?.repuestos;
  if (!respDetalle.success || !Array.isArray(repuestosList)) {
    throw new Error('Fallo al consultar detalle de OT: ' + curlDetalle.stdout);
  }

  const itemWms = repuestosList.find(r => r.id_ot_repuesto == idRepuestoWms);
  const itemCd = repuestosList.find(r => r.id_ot_repuesto == idRepuestoCd);

  console.log('   Item WMS en detalle OT:', JSON.stringify(itemWms));
  console.log('   Item CD en detalle OT:', JSON.stringify(itemCd));

  if (!itemWms || itemWms.origen_insumo !== 'BODEGA_WMS' || !itemWms.sku) {
    throw new Error('Detalle OT no incluye SKU u origen_insumo correcto para BODEGA_WMS');
  }
  if (!itemCd || itemCd.origen_insumo !== 'COMPRA_DIRECTA' || itemCd.numero_documento_compra !== numFactura) {
    throw new Error('Detalle OT no incluye número de documento para COMPRA_DIRECTA');
  }
  console.log('   -> OK: Detalle OT retorna correctamente ambos tipos con sus atributos enriquecidos.');

  // 8. Test: Reversión / Eliminación de Repuesto de Bodega WMS
  console.log('\n8. Ejecutando DELETE /api/mantenimiento/materiales/:idRepuesto (Reversión Bodega)...');
  const curlDelWms = await ssh.execCommand(`curl -s -X DELETE "http://127.0.0.1:3006/api/mantenimiento/materiales/${idRepuestoWms}"`);
  console.log('   Respuesta API DELETE WMS:\n   ', curlDelWms.stdout);
  const respDelWms = JSON.parse(curlDelWms.stdout);
  if (!respDelWms.success) {
    throw new Error('Fallo al eliminar repuesto de bodega: ' + curlDelWms.stdout);
  }

  // 9. Validar reintegración de stock y movimiento de DEVOLUCION_OT
  console.log('\n9. Validando reintegración de tinv_stock y contracuenta DEVOLUCION_OT...');
  const stockReintCheck = await queryJson(`SELECT cantidad_fisica FROM ${schema}.tinv_stock WHERE id_stock = ${id_stock}`);
  const stockReintegrado = parseFloat(stockReintCheck[0].cantidad_fisica);
  console.log(`   Stock Posterior Devolución: ${stockReintegrado} (Esperado: ${stockInicial})`);
  if (stockReintegrado !== stockInicial) {
    throw new Error(`Stock no fue reintegrado correctamente: actual ${stockReintegrado} vs esperado ${stockInicial}`);
  }
  console.log('   -> OK: Stock WMS recuperado exitosamente.');

  const devRows = await queryJson(`
    SELECT id_movimiento, tipo_movimiento, cantidad, documento_tipo, id_movimiento_reversado
    FROM ${schema}.tinv_movimiento
    WHERE id_movimiento_reversado = ${idMovKardex}
  `);
  console.log('   Fila tinv_movimiento DEVOLUCION_OT:', JSON.stringify(devRows[0]));
  if (!devRows || devRows.length === 0 || devRows[0].tipo_movimiento !== 'DEVOLUCION_OT' || devRows[0].id_movimiento_reversado != idMovKardex) {
    throw new Error('Movimiento DEVOLUCION_OT no encontrado o no enlaza id_movimiento_reversado');
  }
  console.log('   -> OK: Asiento DEVOLUCION_OT verificado en Kardex.');
  const idMovDev = devRows[0].id_movimiento;

  // 10. Limpieza de insumo compra directa
  console.log('\n10. Limpiando insumo COMPRA_DIRECTA de prueba...');
  const curlDelCd = await ssh.execCommand(`curl -s -X DELETE "http://127.0.0.1:3006/api/mantenimiento/materiales/${idRepuestoCd}"`);
  console.log('   Respuesta API DELETE CD:', curlDelCd.stdout.trim());

  // 11. Limpieza de los asientos de movimiento de prueba en DEV para dejar base prístina
  console.log('\n11. Purgando asientos transitorios de prueba del Kardex en DEV...');
  await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"DELETE FROM ${schema}.tinv_movimiento WHERE id_movimiento IN (${idMovKardex}, ${idMovDev});\\""`);
  console.log('   -> Asientos temporales de test removidos con éxito.');

  ssh.dispose();
  console.log('\n================================================================');
  console.log(' ¡TODAS LAS PRUEBAS DE LA INTEGRACIÓN HÍBRIDA PASARON CON ÉXITO! (100% OK)');
  console.log('================================================================\n');
}

runTest().catch(err => {
  console.error('\n❌ ERROR EN SUITE DE PRUEBA HÍBRIDA DEV:', err);
  process.exit(1);
});
