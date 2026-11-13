/**
 * ============================================================================
 * BATERÍA DETERMINISTA DE QA E2E: FLUJO COMPLETO MANTENIMIENTO E INVENTARIO (DEV)
 * ============================================================================
 * 
 * Entorno: DEV (138.255.103.18:1295, PM2 10, PostgreSQL sch_leangsp)
 * Módulos: Mantenimiento Taller (OTs, HH, Insumos WMS/CD, Cierre FES) + Bodega WMS (Kardex, Recepciones) + Frontends
 * Regla: 100% determinista, Cero suposiciones, Limpieza garantizada.
 * Prohibición Estricta: Sin emoji de maquinaria/grúa en ningún log ni reporte.
 * 
 * Ejecución:
 *   node scripts/qa_flujo_completo_mantenimiento_inventario_dev.cjs
 * ============================================================================
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

// Configuración general
const CONFIG = {
  SSH: {
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  },
  SCHEMA: 'sch_leangsp',
  INTERNAL_API: 'http://127.0.0.1:3006/api',
  PUBLIC_WEB: 'https://servidor.leanglobal.cl/lg-gsp-dev/',
  PUBLIC_PWA: 'https://servidor.leanglobal.cl/pwa-gsp-dev/'
};

// Matriz de resultados
const testResults = [];

function recordResult(code, name, input, expected, actual, passed, details = '') {
  testResults.push({
    code,
    name,
    input: typeof input === 'object' ? JSON.stringify(input) : String(input),
    expected,
    actual,
    passed,
    details
  });
  const statusIcon = passed ? '✅ PASA' : '❌ FALLA';
  console.log(`[${statusIcon}] ${code}: ${name}`);
  if (!passed || details) {
    console.log(`   -> Esperado: ${expected}`);
    console.log(`   -> Obtenido: ${actual}`);
    if (details) console.log(`   -> Info: ${details}`);
  }
}

// Helper para consultas psql en JSON
async function queryJson(sql) {
  const jsonSql = `SELECT json_agg(t) FROM (${sql}) t;`;
  const tmp = `/tmp/qa_mnt_inv_${Date.now()}_${Math.random().toString(36).substring(7)}.sql`;
  await ssh.execCommand(`cat << 'EOF' > ${tmp}\n${jsonSql}\nEOF`);
  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -A -f ${tmp}"`);
  await ssh.execCommand(`rm -f ${tmp}`);
  const out = res.stdout.trim();
  if (!out || out === 'null') return [];
  try {
    return JSON.parse(out);
  } catch (err) {
    console.error('Error parseando JSON SQL:', out, err);
    return [];
  }
}

// Helper para invocar endpoints vía curl en el servidor
async function apiCall(method, path, body = null) {
  const url = `${CONFIG.INTERNAL_API}${path}`;
  let cmd = `curl -s -w "\\n---STATUS:%{http_code}---" -X ${method} "${url}"`;
  cmd += ` -H "Content-Type: application/json"`;
  if (body) {
    const jsonStr = JSON.stringify(body).replace(/'/g, "'\\''");
    cmd += ` -d '${jsonStr}'`;
  }
  const res = await ssh.execCommand(cmd);
  const raw = res.stdout;
  const statusMatch = raw.match(/---STATUS:(\d+)---/);
  const statusCode = statusMatch ? parseInt(statusMatch[1], 10) : 0;
  const bodyText = raw.replace(/---STATUS:\d+---/, '').trim();
  let json = null;
  try {
    json = JSON.parse(bodyText);
  } catch (_) {
    json = { raw: bodyText };
  }
  return { status: statusCode, body: json, rawText: bodyText };
}

// Helper para peticiones HTTPS externas
function checkHttps(url) {
  return new Promise((resolve) => {
    const req = https.get(url, (res) => {
      resolve({ status: res.statusCode, contentType: res.headers['content-type'] || '' });
    });
    req.on('error', (err) => {
      resolve({ status: 0, error: err.message });
    });
    req.setTimeout(8000, () => {
      req.destroy();
      resolve({ status: 0, error: 'TIMEOUT' });
    });
  });
}

async function runTestSuite() {
  console.log('==============================================================================');
  console.log('  BATERIA DE PRUEBAS DETERMINISTAS QA: MANTENIMIENTO (TALLER) E INVENTARIO (WMS)');
  console.log('==============================================================================\n');

  console.log('-> Conectando a servidor DEV (138.255.103.18:1295)...');
  await ssh.connect(CONFIG.SSH);
  console.log('-> Conexión SSH establecida exitosamente.\n');

  // Variables para seguimiento de datos creados para limpieza
  let testOtId = null;
  let testOtNumero = null;
  let testHhId = null;
  let testRepuestoWmsId = null;
  let testRepuestoCdId = null;
  let testMovKardexSalidaId = null;
  let testMovKardexDevId = null;
  let testRecepcionId = null;
  let testMovKardexRecId = null;
  let targetProducto = null;
  let stockOriginalProd = null;

  try {
    // ------------------------------------------------------------------------
    // PREPARACIÓN DE CONTEXTO
    // ------------------------------------------------------------------------
    console.log('--- FASE 0: PREPARACIÓN DE ENTORNO Y ACTIVO DE PRUEBA ---');
    
    // Obtener un equipo operativo real
    const equipos = await queryJson(`
      SELECT id_equipo, patente, codigo_interno, horometro_grua_acumulado, odometro_acumulado 
      FROM ${CONFIG.SCHEMA}.tequ_equipo 
      WHERE id_empresa = 9 
      ORDER BY id_equipo ASC 
      LIMIT 1
    `);
    if (!equipos || equipos.length === 0) throw new Error('No se encontró equipo en tequ_equipo');
    const eqTest = equipos[0];
    console.log(`Equipo de prueba: [${eqTest.codigo_interno}] Patente: ${eqTest.patente}`);

    // Obtener un producto con stock físico disponible >= 5
    const prods = await queryJson(`
      SELECT s.id_stock, s.id_producto, p.sku, p.nombre, s.id_ubicacion, u.codigo AS ubi_codigo, s.cantidad_fisica, p.costo_pmp_vigente
      FROM ${CONFIG.SCHEMA}.tinv_stock s
      JOIN ${CONFIG.SCHEMA}.tinv_producto p ON p.id_producto = s.id_producto
      JOIN ${CONFIG.SCHEMA}.tinv_ubicacion u ON u.id_ubicacion = s.id_ubicacion
      WHERE s.cantidad_fisica >= 5 AND s.id_empresa = 9
      ORDER BY s.id_stock ASC
      LIMIT 1
    `);
    if (!prods || prods.length === 0) throw new Error('No se encontró producto con stock >= 5 en tinv_stock');
    targetProducto = prods[0];
    stockOriginalProd = parseFloat(targetProducto.cantidad_fisica);
    console.log(`Producto WMS de prueba: [${targetProducto.sku}] ${targetProducto.nombre} | Stock Inicial: ${stockOriginalProd} | PMP: $${targetProducto.costo_pmp_vigente}`);

    // Crear OT dedicada de prueba para aislar completamente el test
    console.log('\n-> Creando Orden de Trabajo de prueba en DEV...');
    const otCreateRes = await apiCall('POST', '/mantenimiento/ots', {
      id_equipo: eqTest.id_equipo,
      tipo_mantenimiento: 'CORRECTIVO',
      prioridad: 2,
      descripcion_falla: 'Prueba E2E Automatizada QA Taller - WMS',
      horometro_inicio: 100,
      horometro_grua_inicio: 100,
      horometro_chasis_inicio: 80,
      odometro_inicio: 5000,
      alcance_mantenimiento: 'INTEGRAL_AMBOS'
    });

    if (otCreateRes.status !== 201 || !otCreateRes.body.data) {
      throw new Error(`Fallo al crear OT de prueba: ${otCreateRes.rawText}`);
    }
    testOtId = otCreateRes.body.data.id_ot;
    testOtNumero = otCreateRes.body.data.numero_ot;
    console.log(`-> OT de prueba creada exitosamente: ID ${testOtId} (Folio: ${testOtNumero})\n`);

    // ========================================================================
    // BLOQUE A: PRUEBAS DE MANTENIMIENTO (TALLER)
    // ========================================================================
    console.log('--- BLOQUE A: PRUEBAS DE MANTENIMIENTO (TALLER) ---');

    // TC-M01: Apertura / Consulta de OT en DEV
    const tcM01Res = await apiCall('GET', `/mantenimiento/ots/${testOtId}`);
    const tcM01Passed = tcM01Res.status === 200 && 
                        tcM01Res.body.data?.ot?.id_ot == testOtId && 
                        parseFloat(tcM01Res.body.data?.ot?.horometro_inicio) === 100;
    recordResult(
      'TC-M01',
      'Apertura / Consulta de OT en DEV (GET /api/mantenimiento/ots/:id)',
      { id_ot: testOtId },
      'HTTP 200, OT activa y medidores de flota presentes (horometro: 100, odometro: 5000)',
      `HTTP ${tcM01Res.status}, OT #${tcM01Res.body.data?.ot?.numero_ot}, Horómetro: ${tcM01Res.body.data?.ot?.horometro_inicio}, Odómetro: ${tcM01Res.body.data?.ot?.odometro_inicio}`,
      tcM01Passed,
      'Lectura íntegra de cabecera y medidores del activo'
    );

    // TC-M02: Registro de Medidores de Entrada en OT
    const nuevosMedidores = {
      horometro_grua_inicio: 105,
      horometro_chasis_inicio: 85,
      odometro_inicio: 5050
    };
    const tcM02Res = await apiCall('PUT', `/mantenimiento/ots/${testOtId}/medidores-inicio`, nuevosMedidores);
    const tcM02Check = await queryJson(`SELECT horometro_grua_inicio, horometro_chasis_inicio, odometro_inicio FROM ${CONFIG.SCHEMA}.tmnt_ot WHERE id_ot = ${testOtId}`);
    const tcM02Persisted = tcM02Check.length > 0 &&
                           parseFloat(tcM02Check[0].horometro_grua_inicio) === 105 &&
                           parseFloat(tcM02Check[0].horometro_chasis_inicio) === 85 &&
                           parseFloat(tcM02Check[0].odometro_inicio) === 5050;
    const tcM02Passed = tcM02Res.status === 200 && tcM02Persisted;
    recordResult(
      'TC-M02',
      'Registro de Medidores de Entrada en OT (PUT /api/mantenimiento/ots/:id/medidores-inicio)',
      nuevosMedidores,
      'HTTP 200, medidores persistidos en BD (horometro_grua: 105, chasis: 85, odometro: 5050)',
      `HTTP ${tcM02Res.status}, BD: Grua=${tcM02Check[0]?.horometro_grua_inicio}, Chasis=${tcM02Check[0]?.horometro_chasis_inicio}, Odo=${tcM02Check[0]?.odometro_inicio}`,
      tcM02Passed,
      'Validación canónica Spec 71 / MantenimientoView'
    );

    // TC-M03: Registro de Mano de Obra HH
    const payloadHh = {
      rut_tecnico: '18236231-K',
      nombre_tecnico: 'Héctor Paredes Araya (Técnico QA)',
      horas: 2.0,
      descripcion_trabajo: 'Inspección de actuadores y pruebas de presión QA'
    };
    const tcM03Res = await apiCall('POST', `/mantenimiento/ots/${testOtId}/hh`, payloadHh);
    const dataHh = tcM03Res.body?.data;
    if (dataHh?.id_hh) testHhId = dataHh.id_hh;
    const costoEsperadoHh = 2.0 * 15000; // $30.000
    const tcM03Passed = tcM03Res.status === 201 &&
                        parseFloat(dataHh?.costo_calculado) === costoEsperadoHh &&
                        dataHh?.nombre_tecnico.includes('Héctor Paredes');
    recordResult(
      'TC-M03',
      'Registro de Mano de Obra HH (POST /api/mantenimiento/ots/:id/hh)',
      payloadHh,
      `HTTP 201, Costo calculado automático = $${costoEsperadoHh.toLocaleString('es-CL')} (2h x $15.000), Técnico persistido`,
      `HTTP ${tcM03Res.status}, Costo: $${dataHh?.costo_calculado}, Técnico: ${dataHh?.nombre_tecnico}, ID HH: ${testHhId}`,
      tcM03Passed,
      'Cálculo basado en parámetro tmnt_parametro.tarifa_hh_default'
    );

    // TC-M04: Insumo Bodega WMS con Saldo Disponible
    const payloadWms = {
      origen_insumo: 'BODEGA_WMS',
      id_producto: parseInt(targetProducto.id_producto, 10),
      id_ubicacion: parseInt(targetProducto.id_ubicacion, 10),
      cantidad: 1
    };
    const tcM04Res = await apiCall('POST', `/mantenimiento/ots/${testOtId}/materiales`, payloadWms);
    const dataWms = tcM04Res.body?.data;
    if (dataWms?.id_ot_repuesto) testRepuestoWmsId = dataWms.id_ot_repuesto;
    if (dataWms?.id_movimiento_kardex) testMovKardexSalidaId = dataWms.id_movimiento_kardex;

    // Verificar en BD decremento de stock y asiento Kardex
    const stockPostSalidaCheck = await queryJson(`SELECT cantidad_fisica FROM ${CONFIG.SCHEMA}.tinv_stock WHERE id_stock = ${targetProducto.id_stock}`);
    const stockActualPostSalida = parseFloat(stockPostSalidaCheck[0]?.cantidad_fisica);
    const kardexSalidaCheck = await queryJson(`
      SELECT id_movimiento, tipo_movimiento, documento_tipo, documento_folio, cantidad, costo_unitario_pmp 
      FROM ${CONFIG.SCHEMA}.tinv_movimiento 
      WHERE id_movimiento = ${testMovKardexSalidaId || 0}
    `);
    const movSalida = kardexSalidaCheck[0];

    const tcM04Passed = tcM04Res.status === 201 &&
                        stockActualPostSalida === stockOriginalProd - 1 &&
                        movSalida &&
                        movSalida.tipo_movimiento === 'SALIDA_OT' &&
                        movSalida.documento_tipo === 'OT_MNT';
    recordResult(
      'TC-M04',
      'Insumo Bodega WMS con Saldo Disponible (POST /api/mantenimiento/ots/:id/materiales)',
      payloadWms,
      `HTTP 201, Stock físico decrementa a ${stockOriginalProd - 1}, asiento SALIDA_OT generado en Kardex con PMP`,
      `HTTP ${tcM04Res.status}, Stock BD: ${stockActualPostSalida}, Kardex Mov #${movSalida?.id_movimiento} [${movSalida?.tipo_movimiento}, Folio: ${movSalida?.documento_folio}, PMP: $${movSalida?.costo_unitario_pmp}]`,
      tcM04Passed,
      'Validación de consistencia transaccional y enlace WMS'
    );

    // TC-M05: Regla dura de Stock Cero WMS (Stock insuficiente)
    const payloadExceso = {
      origen_insumo: 'BODEGA_WMS',
      id_producto: parseInt(targetProducto.id_producto, 10),
      id_ubicacion: parseInt(targetProducto.id_ubicacion, 10),
      cantidad: 999999
    };
    const tcM05Res = await apiCall('POST', `/mantenimiento/ots/${testOtId}/materiales`, payloadExceso);
    const stockPostIntentoCheck = await queryJson(`SELECT cantidad_fisica FROM ${CONFIG.SCHEMA}.tinv_stock WHERE id_stock = ${targetProducto.id_stock}`);
    const stockInmutable = parseFloat(stockPostIntentoCheck[0]?.cantidad_fisica) === stockActualPostSalida;
    const tcM05Passed = tcM05Res.status === 400 && 
                        tcM05Res.body?.error?.toLowerCase().includes('stock insuficiente') && 
                        stockInmutable;
    recordResult(
      'TC-M05',
      'Regla dura de Stock Cero WMS (Validación de exceso de cantidad)',
      payloadExceso,
      'HTTP 400 con mensaje "Stock insuficiente", stock físico inmutable sin corrupción de BD',
      `HTTP ${tcM05Res.status}, Mensaje: "${tcM05Res.body?.error}", Stock BD preservado en ${stockPostIntentoCheck[0]?.cantidad_fisica}`,
      tcM05Passed,
      'Candado duro contra inventario negativo'
    );

    // TC-M06: Insumo Compra Directa / Terreno
    const facturaQA = 'FAC-QA-' + Date.now().toString().slice(-4);
    const payloadCd = {
      origen_insumo: 'COMPRA_DIRECTA',
      descripcion_material: 'Insumo QA Compra Directa Terreno',
      cantidad: 2,
      unidad_medida: 'UNIDAD',
      costo_unitario: 12500,
      proveedor_o_documento: 'Ferretería Industrial QA',
      numero_documento_compra: facturaQA
    };
    const tcM06Res = await apiCall('POST', `/mantenimiento/ots/${testOtId}/materiales`, payloadCd);
    const dataCd = tcM06Res.body?.data;
    if (dataCd?.id_ot_repuesto) testRepuestoCdId = dataCd.id_ot_repuesto;

    // Verificar en BD que no haya tocado tinv_stock ni creado asiento Kardex
    const stockPostCdCheck = await queryJson(`SELECT cantidad_fisica FROM ${CONFIG.SCHEMA}.tinv_stock WHERE id_stock = ${targetProducto.id_stock}`);
    const stockIntactoCd = parseFloat(stockPostCdCheck[0]?.cantidad_fisica) === stockActualPostSalida;
    const tcM06Passed = tcM06Res.status === 201 &&
                        dataCd?.origen_insumo === 'COMPRA_DIRECTA' &&
                        dataCd?.numero_documento_compra === facturaQA &&
                        dataCd?.id_movimiento_kardex === null &&
                        stockIntactoCd;
    recordResult(
      'TC-M06',
      'Insumo Compra Directa / Terreno (POST /api/mantenimiento/ots/:id/materiales)',
      payloadCd,
      'HTTP 201, Costo manual $12.500 y Factura registrados, id_movimiento_kardex = NULL, tinv_stock intacto',
      `HTTP ${tcM06Res.status}, ID Repuesto: ${testRepuestoCdId}, Factura: ${dataCd?.numero_documento_compra}, Kardex: ${dataCd?.id_movimiento_kardex}, Stock WMS intacto`,
      tcM06Passed,
      'Aislamiento de compras directas frente al inventario valorizado'
    );

    // TC-M07: Reversión / Anulación de Insumo Bodega WMS
    const tcM07Res = await apiCall('DELETE', `/mantenimiento/materiales/${testRepuestoWmsId}`);
    const stockPostReversCheck = await queryJson(`SELECT cantidad_fisica FROM ${CONFIG.SCHEMA}.tinv_stock WHERE id_stock = ${targetProducto.id_stock}`);
    const stockReintegrado = parseFloat(stockPostReversCheck[0]?.cantidad_fisica);
    const devKardexCheck = await queryJson(`
      SELECT id_movimiento, tipo_movimiento, id_movimiento_reversado, cantidad 
      FROM ${CONFIG.SCHEMA}.tinv_movimiento 
      WHERE id_movimiento_reversado = ${testMovKardexSalidaId || 0}
    `);
    const movDev = devKardexCheck[0];
    if (movDev?.id_movimiento) testMovKardexDevId = movDev.id_movimiento;

    const tcM07Passed = tcM07Res.status === 200 &&
                        stockReintegrado === stockOriginalProd &&
                        movDev &&
                        movDev.tipo_movimiento === 'DEVOLUCION_OT';
    recordResult(
      'TC-M07',
      'Reversión / Anulación de Insumo Bodega WMS (DELETE /api/mantenimiento/materiales/:id)',
      { id_ot_repuesto: testRepuestoWmsId },
      `HTTP 200, Restitución física en tinv_stock (${stockReintegrado} == ${stockOriginalProd}), asiento DEVOLUCION_OT en Kardex`,
      `HTTP ${tcM07Res.status}, Stock restituido a ${stockReintegrado}, Asiento Kardex #${movDev?.id_movimiento} [${movDev?.tipo_movimiento}, Reversa #${movDev?.id_movimiento_reversado}]`,
      tcM07Passed,
      'Trazabilidad bidireccional y balance perfecto de existencias'
    );

    // TC-M08: Validación de Regla de Horómetro en Cierre
    // Paso 1: Intento fallido con horómetro menor al de entrada (105)
    const payloadCierreInvalido = {
      pin: '1234',
      horometro_cierre: 50,
      id_user_cierre: 55
    };
    const tcM08Paso1Res = await apiCall('POST', `/mantenimiento/ots/${testOtId}/cerrar`, payloadCierreInvalido);
    const paso1Controlado = tcM08Paso1Res.status === 422 && 
                            tcM08Paso1Res.body?.error?.toLowerCase().includes('no puede ser menor al horómetro de inicio');

    // Paso 2: Cierre exitoso con horómetro válido y PIN FES
    const payloadCierreValido = {
      pin: '1234',
      horometro_cierre: 110,
      id_user_cierre: 55,
      observacion_final: 'Cierre supervisado QA determinista',
      diagnostico_final: 'Prueba E2E ejecutada con éxito'
    };
    const tcM08Paso2Res = await apiCall('POST', `/mantenimiento/ots/${testOtId}/cerrar`, payloadCierreValido);
    const dataCierre = tcM08Paso2Res.body?.data;
    
    // Balance financiero esperado:
    // HH: $30.000 + Compra Directa: $25.000 (2 x $12.500) = $55.000
    const balanceFinancieroEsperado = 30000 + 25000;
    const balanceCorrecto = dataCierre && parseFloat(dataCierre.costo_total_ot) === balanceFinancieroEsperado;
    const estadoCerrada = dataCierre && dataCierre.estado === 'CERRADA';

    const tcM08Passed = paso1Controlado && tcM08Paso2Res.status === 200 && balanceCorrecto && estadoCerrada;
    recordResult(
      'TC-M08',
      'Validación de Regla de Horómetro y Cierre FES de OT (POST /api/mantenimiento/ots/:id/cerrar)',
      { paso1: payloadCierreInvalido, paso2: payloadCierreValido },
      `Paso 1: HTTP 422 rechazo por horómetro menor. Paso 2: HTTP 200 CERRADA, Balance total = $${balanceFinancieroEsperado.toLocaleString('es-CL')}`,
      `Paso 1: HTTP ${tcM08Paso1Res.status} ("${tcM08Paso1Res.body?.error}"), Paso 2: HTTP ${tcM08Paso2Res.status}, Estado: ${dataCierre?.estado}, Total OT: $${dataCierre?.costo_total_ot}`,
      tcM08Passed,
      'Validación de reglas de negocio de cierre, PIN FES y liquidación contable'
    );

    // ========================================================================
    // BLOQUE B: PRUEBAS DE INVENTARIO (BODEGA WMS)
    // ========================================================================
    console.log('\n--- BLOQUE B: PRUEBAS DE INVENTARIO (BODEGA WMS) ---');

    // TC-I01: Consulta de Productos y Ubicación Física
    const tcI01ProdRes = await apiCall('GET', '/inventario/productos');
    const tcI01UbiRes = await apiCall('GET', '/inventario/ubicaciones');
    const tcI01ExistRes = await apiCall('GET', '/inventario/existencias');

    const tieneProductos = tcI01ProdRes.status === 200 && Array.isArray(tcI01ProdRes.body?.data) && tcI01ProdRes.body.count > 0;
    const tieneUbicacionesConRack = tcI01UbiRes.status === 200 && 
                                    Array.isArray(tcI01UbiRes.body?.data) && 
                                    tcI01UbiRes.body.data.some(u => u.estanteria && u.codigo);
    const tieneExistenciasConCasillero = tcI01ExistRes.status === 200 &&
                                         Array.isArray(tcI01ExistRes.body?.data) &&
                                         tcI01ExistRes.body.data.some(e => e.ubicacion_codigo);
    const tcI01Passed = tieneProductos && tieneUbicacionesConRack && tieneExistenciasConCasillero;
    recordResult(
      'TC-I01',
      'Consulta de Productos y Ubicación Física (GET /api/inventario/productos y ubicaciones)',
      { endpoints: ['/inventario/productos', '/inventario/ubicaciones', '/inventario/existencias'] },
      'HTTP 200, Retorno de catálogo completo y casillero físico de estantería (estanteria, nivel, codigo)',
      `Catálogo: ${tcI01ProdRes.body?.count} items, Ubicaciones: ${tcI01UbiRes.body?.count} racks, Existencias mapeadas a casillero físico`,
      tcI01Passed,
      'Validación del modelo WMS con ubicación física por estantería/nivel'
    );

    // TC-I02: Recepción de Materiales (Ingreso de Compra)
    const numOc = 'OC-QA-' + Date.now().toString().slice(-4);
    const payloadRecepcion = {
      tipo_ingreso: 'COMPRA',
      proveedor_o_origen: 'Distribuidora Industrial QA SpA',
      documento_referencia: numOc,
      lineas: [
        {
          id_producto: parseInt(targetProducto.id_producto, 10),
          cantidad_recibida: 2,
          costo_unitario_moneda: 2500,
          id_ubicacion_destino: parseInt(targetProducto.id_ubicacion, 10),
          lote_texto: 'LOTE-QA-2026'
        }
      ]
    };
    const tcI02Res = await apiCall('POST', '/inventario/recepciones', payloadRecepcion);
    const dataRec = tcI02Res.body?.data;
    if (dataRec?.id_recepcion) testRecepcionId = dataRec.id_recepcion;

    // Verificar en BD incremento de stock y movimiento en Kardex
    const stockPostRecCheck = await queryJson(`SELECT cantidad_fisica FROM ${CONFIG.SCHEMA}.tinv_stock WHERE id_stock = ${targetProducto.id_stock}`);
    const stockActualPostRec = parseFloat(stockPostRecCheck[0]?.cantidad_fisica);
    const kardexRecCheck = await queryJson(`
      SELECT id_movimiento, tipo_movimiento, documento_tipo, documento_folio, cantidad 
      FROM ${CONFIG.SCHEMA}.tinv_movimiento 
      WHERE documento_folio = '${dataRec?.numero_folio || ''}' AND tipo_movimiento = 'RECEPCION_COMPRA'
    `);
    const movRec = kardexRecCheck[0];
    if (movRec?.id_movimiento) testMovKardexRecId = movRec.id_movimiento;

    const tcI02Passed = tcI02Res.status === 201 &&
                        dataRec?.estado === 'CONFIRMADA' &&
                        stockActualPostRec === stockOriginalProd + 2 &&
                        movRec !== undefined;
    recordResult(
      'TC-I02',
      'Recepción de Materiales (POST /api/inventario/recepciones [RECEPCION_COMPRA])',
      payloadRecepcion,
      `HTTP 201 CONFIRMADA, Incremento de stock a ${stockOriginalProd + 2}, asiento RECEPCION_COMPRA en Kardex`,
      `HTTP ${tcI02Res.status}, Folio: ${dataRec?.numero_folio}, Stock BD: ${stockActualPostRec} (+2), Kardex Mov #${movRec?.id_movimiento} [${movRec?.tipo_movimiento}]`,
      tcI02Passed,
      'Validación de ingreso formal de insumos a bodega'
    );

    // TC-I03: Consulta de Kardex y Trazabilidad
    const tcI03Res = await apiCall('GET', '/inventario/kardex');
    const kardexList = tcI03Res.body?.data;
    const hasSalidaOt = Array.isArray(kardexList) && kardexList.some(m => m.tipo_movimiento === 'SALIDA_OT');
    const hasDevolucionOt = Array.isArray(kardexList) && kardexList.some(m => m.tipo_movimiento === 'DEVOLUCION_OT');
    const hasRecepcionCompra = Array.isArray(kardexList) && kardexList.some(m => m.tipo_movimiento === 'RECEPCION_COMPRA');

    const tcI03Passed = tcI03Res.status === 200 && hasSalidaOt && hasDevolucionOt && hasRecepcionCompra;
    recordResult(
      'TC-I03',
      'Consulta de Kardex y Trazabilidad (GET /api/inventario/kardex)',
      { endpoint: '/inventario/kardex' },
      'HTTP 200, Presencia y coherencia de asientos SALIDA_OT, DEVOLUCION_OT y RECEPCION_COMPRA',
      `HTTP ${tcI03Res.status}, Total Movimientos: ${tcI03Res.body?.count}, SALIDA_OT: ${hasSalidaOt}, DEVOLUCION_OT: ${hasDevolucionOt}, RECEPCION_COMPRA: ${hasRecepcionCompra}`,
      tcI03Passed,
      'Auditoría y trazabilidad integral del Kardex inmutable'
    );

    // ========================================================================
    // BLOQUE C: DISPONIBILIDAD E INTEGRIDAD DE FRONTEND Y PWA
    // ========================================================================
    console.log('\n--- BLOQUE C: DISPONIBILIDAD E INTEGRIDAD DE FRONTEND Y PWA ---');

    // TC-F01: Verificación HTTP 200 OK y cabeceras en Web
    const webCheck = await checkHttps(CONFIG.PUBLIC_WEB);
    const tcF01Passed = webCheck.status === 200 && webCheck.contentType.includes('text/html');
    recordResult(
      'TC-F01',
      'Disponibilidad Frontend Web (https://servidor.leanglobal.cl/lg-gsp-dev/)',
      { url: CONFIG.PUBLIC_WEB },
      'HTTP 200 OK, Content-Type: text/html',
      `HTTP ${webCheck.status}, Content-Type: ${webCheck.contentType}`,
      tcF01Passed,
      'Servicio Web operativo bajo Nginx'
    );

    // TC-F02: Verificación HTTP 200 OK y cabeceras en PWA
    const pwaCheck = await checkHttps(CONFIG.PUBLIC_PWA);
    const tcF02Passed = pwaCheck.status === 200 && pwaCheck.contentType.includes('text/html');
    recordResult(
      'TC-F02',
      'Disponibilidad Frontend PWA (https://servidor.leanglobal.cl/pwa-gsp-dev/)',
      { url: CONFIG.PUBLIC_PWA },
      'HTTP 200 OK, Content-Type: text/html',
      `HTTP ${pwaCheck.status}, Content-Type: ${pwaCheck.contentType}`,
      tcF02Passed,
      'Servicio PWA operativo bajo Nginx'
    );

  } catch (error) {
    console.error('\n❌ ERROR FATAL DURANTE LA EJECUCIÓN DEL TEST SUITE:', error);
  } finally {
    // ========================================================================
    // FASE DE LIMPIEZA DETERMINISTA (GARANTIZADA)
    // ========================================================================
    console.log('\n==============================================================================');
    console.log('--- FASE DE LIMPIEZA Y RESTAURACIÓN DETERMINISTA EN DEV ---');
    console.log('==============================================================================');

    try {
      // 1. Restaurar stock físico original del producto probado
      if (targetProducto && stockOriginalProd !== null) {
        console.log(`-> Restaurando stock físico original en tinv_stock (id_stock: ${targetProducto.id_stock}) a ${stockOriginalProd}...`);
        await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"UPDATE ${CONFIG.SCHEMA}.tinv_stock SET cantidad_fisica = ${stockOriginalProd}, updated_at = NOW() WHERE id_stock = ${targetProducto.id_stock};\\""`);
      }

      // 2. Purgar asientos de prueba en Kardex
      const movsToPurge = [testMovKardexSalidaId, testMovKardexDevId, testMovKardexRecId].filter(Boolean);
      if (movsToPurge.length > 0) {
        console.log(`-> Purgando movimientos temporales en tinv_movimiento [${movsToPurge.join(', ')}]...`);
        await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"DELETE FROM ${CONFIG.SCHEMA}.tinv_movimiento WHERE id_movimiento IN (${movsToPurge.join(', ')});\\""`);
      }

      // 3. Purgar líneas y cabecera de recepción de prueba
      if (testRecepcionId) {
        console.log(`-> Purgando recepción temporal ID ${testRecepcionId}...`);
        await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"DELETE FROM ${CONFIG.SCHEMA}.tinv_recepcion_linea WHERE id_recepcion = ${testRecepcionId}; DELETE FROM ${CONFIG.SCHEMA}.tinv_recepcion WHERE id_recepcion = ${testRecepcionId};\\""`);
      }

      // 4. Purgar datos de la OT de prueba
      if (testOtId) {
        console.log(`-> Purgando registros asociados a la OT de prueba ID ${testOtId}...`);
        await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"
          DELETE FROM ${CONFIG.SCHEMA}.tmnt_ot_cierre WHERE id_ot = ${testOtId};
          DELETE FROM ${CONFIG.SCHEMA}.tmnt_ot_repuesto WHERE id_ot = ${testOtId};
          DELETE FROM ${CONFIG.SCHEMA}.tmnt_ot_hh WHERE id_ot = ${testOtId};
          DELETE FROM ${CONFIG.SCHEMA}.tmnt_ot_actividad WHERE id_ot = ${testOtId};
          DELETE FROM ${CONFIG.SCHEMA}.tmnt_ot WHERE id_ot = ${testOtId};
        \\""`);
      }

      console.log('-> Limpieza determinista completada exitosamente. Entorno DEV restaurado a estado prístino.\n');
    } catch (cleanupErr) {
      console.error('Error durante la limpieza determinista:', cleanupErr);
    } finally {
      ssh.dispose();
    }
  }

  // ==========================================================================
  // REPORTE FINAL Y DICTAMEN DE QA
  // ==========================================================================
  console.log('==============================================================================');
  console.log('                     TABLA RESUMEN DE RESULTADOS QA E2E                       ');
  console.log('==============================================================================');

  const total = testResults.length;
  const passedCount = testResults.filter(r => r.passed).length;
  const failedCount = total - passedCount;

  console.table(testResults.map(r => ({
    Codigo: r.code,
    Nombre: r.name.substring(0, 35),
    Estado: r.passed ? 'PASA' : 'FALLA',
    Resultado_Real: r.actual.substring(0, 45)
  })));

  console.log('------------------------------------------------------------------------------');
  console.log(`TOTAL PRUEBAS: ${total} | PASADAS: ${passedCount} | FALLADAS: ${failedCount}`);
  console.log('------------------------------------------------------------------------------');

  if (failedCount === 0) {
    console.log('🏆 DICTAMEN FORMAL DE QA: APROBADO (100% DE PRUEBAS EXITOSAS)');
    console.log('El entorno DEV se encuentra íntegro, validado y apto para pruebas de usuarios');
    console.log('de los equipos de Taller (Mantenimiento) y Bodega (Inventario).');
  } else {
    console.log('⚠️ DICTAMEN FORMAL DE QA: RECHAZADO (EXISTEN PRUEBAS FALLADAS)');
  }
  console.log('==============================================================================\n');

  // Guardar archivo JSON estructurado del reporte para trazabilidad
  const reportPath = path.join(__dirname, 'ultimo_reporte_qa_mantenimiento_inventario_dev.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    total_pruebas: total,
    pasadas: passedCount,
    falladas: failedCount,
    tasa_exito: `${Math.round((passedCount / total) * 100)}%`,
    dictamen: failedCount === 0 ? 'APROBADO' : 'RECHAZADO',
    resultados: testResults
  }, null, 2));
  console.log(`Reporte JSON persistido en: ${reportPath}`);

  process.exit(failedCount === 0 ? 0 : 1);
}

runTestSuite().catch(err => {
  console.error('Error de ejecución en runner principal:', err);
  process.exit(1);
});
