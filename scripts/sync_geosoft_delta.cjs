const https = require('https');
const fs = require('fs');
const path = require('path');

const agent = new https.Agent({ rejectUnauthorized: false });

function request(url, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const headers = {
      'Origin': 'https://sanpablosoft.cl',
      'Referer': 'https://sanpablosoft.cl/',
      'Accept': 'application/json, text/plain, */*'
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let data = null;
    if (body) {
      data = JSON.stringify(body);
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(data);
    }

    const req = https.request(u, { method, agent, headers }, (res) => {
      let resData = '';
      res.on('data', chunk => resData += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(resData) });
        } catch (e) {
          resolve({ status: res.statusCode, body: resData.slice(0, 500) });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

const FAMILIA_PREFIXES = {
  'Filtros': 'FILT',
  'Aceites y Lubricantes': 'LUBR',
  'Repuestos Taller Mecánico': 'MEC',
  'Repuestos Eléctricos': 'ELEC',
  'Material de Desgaste': 'DESG',
  'Neumaticos': 'NEUM',
  'Herramientas': 'HERR',
  'Insumos Taller de Soldadura': 'SOLD',
  'Insumos Taller de Pinturas': 'PINT',
  'EPP': 'EPP',
  'Materiales Varios': 'VARI',
  'Útiles de Oficina': 'OFIC',
  'Equipos Computacionales': 'COMP',
  'Mobiliario': 'MOBL',
  'Articulos de Aseo': 'ASEO',
  'Repuestos': 'MEC'
};

async function buildDeltaSync() {
  console.log('1. Autenticando en GeoSoft...');
  const loginRes = await request('https://app.backend.arriendosanpablo.cl/api/login', 'POST', {
    username: 'jorge',
    password: 'jorge2027'
  });
  const token = loginRes.body.authorisation.token;
  console.log('✓ Token obtenido.');

  console.log('2. Descargando catálogo y saldos de GeoSoft...');
  const [resProd, resInve] = await Promise.all([
    request('https://app.backend.arriendosanpablo.cl/api/productos', 'GET', null, token),
    request('https://app.backend.arriendosanpablo.cl/api/productos/inve', 'GET', null, token)
  ]);

  const geoProductos = resProd.body || [];
  const geoInve = resInve.body || [];
  console.log(`✓ GeoSoft: ${geoProductos.length} productos, ${geoInve.length} en balance inventario.`);

  // Mapa de saldo de inventario por código en GeoSoft
  const inveMapByCodigo = new Map();
  geoInve.forEach(inv => {
    if (inv.codigo) {
      inveMapByCodigo.set(String(inv.codigo).trim(), {
        stock: Number(inv.stock) || 0,
        precio: Number(inv.precio) || 0,
        ubicacionBodega: inv.ubicacionBodega,
        grupoNombre: inv.grupoNombre
      });
    }
  });

  // Leer productos actuales de GSP (desde el archivo de actualización previo)
  const projectRoot = 'd:\\SGajardo\\Google Drive\\Antigravity\\Grúas San Pablo\\Propuesta Gestión Operación Grúas';
  const updateSqlPath = path.resolve(projectRoot, 'ejecucion/bd/update_skus_familia.sql');
  const updateSqlContent = fs.readFileSync(updateSqlPath, 'utf-8');

  // Encontrar el último correlativo por familia existente en GSP
  const familyCounters = {};
  const currentSkus = updateSqlContent.matchAll(/'([^']+)',\s*'([A-Z]{3,4})-(\d{5})'/g);
  const existingLegados = new Set();

  for (const m of currentSkus) {
    const legado = m[1].trim();
    const prefix = m[2];
    const num = parseInt(m[3], 10);
    existingLegados.add(legado);
    familyCounters[prefix] = Math.max(familyCounters[prefix] || 0, num);
  }

  console.log('Últimos correlativos existentes en GSP:', familyCounters);
  console.log(`Total códigos legados existentes en GSP: ${existingLegados.size}`);

const GEO_GRUPO_ID_TO_NAME = {
  1: 'Repuestos Taller Mecánico',
  2: 'Repuestos Eléctricos',
  3: 'Herramientas',
  4: 'Aceites y Lubricantes',
  5: 'Filtros',
  6: 'EPP',
  7: 'Materiales Varios',
  8: 'Insumos Taller de Pinturas',
  9: 'Articulos de Aseo',
  10: 'Útiles de Oficina',
  11: 'Equipos Computacionales',
  12: 'Insumos Taller de Soldadura',
  13: 'Material de Desgaste',
  14: 'Materiales Varios',
  15: 'Mobiliario',
  16: 'Neumaticos',
  17: 'Repuestos Taller Mecánico',
  18: 'Útiles de Oficina'
};

  // Filtrar los productos que están en GeoSoft y no en el snapshot inicial
  const nuevosProductos = [];
  const updateDeltaLines = [];

  geoProductos.forEach(p => {
    const codigo = String(p.codigo || '').trim();
    if (!codigo || existingLegados.has(codigo) || codigo === 'PA?OL001' || codigo === 'PA?OL002') return;

    // Obtener grupo / familia mapeando el ID numérico
    const grupoId = Number(p.grupo);
    const grupo = GEO_GRUPO_ID_TO_NAME[grupoId] || p.grupoNombre || 'Materiales Varios';
    const prefix = FAMILIA_PREFIXES[grupo] || 'VARI';
    familyCounters[prefix] = (familyCounters[prefix] || 0) + 1;
    const nuevoSku = `${prefix}-${String(familyCounters[prefix]).padStart(5, '0')}`;

    const nombre = String(p.nombre || '').replace(/'/g, "''").trim();
    const precio = Number(p.precio) || 0;
    const uom = String(p.medida || 'UN').trim().toUpperCase().startsWith('UN') ? 'UN' : 'UN';

    // Saldo de stock
    const invInfo = inveMapByCodigo.get(codigo) || { stock: 0, ubicacionBodega: 'BODEGA' };
    const stock = invInfo.stock;

    nuevosProductos.push({
      codigo_legado: codigo,
      sku: nuevoSku,
      nombre,
      familia: grupo,
      precio,
      stock,
      ubicacion: invInfo.ubicacionBodega || 'SIN-UBICAR'
    });

    updateDeltaLines.push(`  ('${codigo.replace(/'/g, "''")}', '${nuevoSku}', '${grupo.replace(/'/g, "''")}', ${precio})`);
  });

  console.log(`\n✓ Nuevos productos procesados: ${nuevosProductos.length}`);

  // Generar script de calibración de stock deduplicando códigos
  const stockUpdateLines = [];
  const seenCodigosInve = new Set();
  let itemsCalibrados = 0;

  geoInve.forEach(inv => {
    const codigo = String(inv.codigo || '').trim();
    if (!codigo || seenCodigosInve.has(codigo)) return;
    seenCodigosInve.add(codigo);

    const stockGeo = Number(inv.stock) || 0;
    const precioGeo = Number(inv.precio) || 0;

    stockUpdateLines.push(`  ('${codigo.replace(/'/g, "''")}', ${stockGeo}, ${precioGeo})`);
    itemsCalibrados++;
  });

  const fullSql = `
-- =========================================================================
-- SINCRONIZACIÓN DELTA: GEOSOFT PRODUCCIÓN -> GSP WMS-LITE
-- Generado el: ${new Date().toISOString()}
-- Nuevos Productos a Actualizar (SKU/Familia): ${nuevosProductos.length}
-- Productos a Calibrar Saldo: ${itemsCalibrados}
-- =========================================================================
BEGIN;

-- 1. Eliminar duplicados accidentales de códigos preexistentes (PA?OL001 / PA?OL002 con IDs 8459 y 8460)
DELETE FROM sch_leangsp.tinv_stock WHERE id_producto IN (8459, 8460);
DELETE FROM sch_leangsp.tinv_producto WHERE id_producto IN (8459, 8460);

-- 2. Actualizar SKU y Familia formal de los 49 productos nuevos
UPDATE sch_leangsp.tinv_producto AS p
SET sku = v.nuevo_sku, familia = v.nueva_familia, costo_pmp_vigente = CASE WHEN v.nuevo_precio > 0 THEN v.nuevo_precio ELSE p.costo_pmp_vigente END
FROM (VALUES
${updateDeltaLines.join(',\n')}
) AS v(codigo_legado, nuevo_sku, nueva_familia, nuevo_precio)
WHERE p.id_empresa = 9 AND p.codigo_legado = v.codigo_legado;

-- 3. Limpiar duplicidad en SIN-UBICAR para items que ya tienen ubicación física real
DELETE FROM sch_leangsp.tinv_stock s
WHERE s.id_empresa = 9 
  AND s.id_ubicacion = (SELECT id_ubicacion FROM sch_leangsp.tinv_ubicacion WHERE codigo = 'SIN-UBICAR' LIMIT 1)
  AND EXISTS (
    SELECT 1 FROM sch_leangsp.tinv_stock s_real 
    WHERE s_real.id_empresa = s.id_empresa 
      AND s_real.id_producto = s.id_producto 
      AND s_real.id_ubicacion <> s.id_ubicacion
  );

-- 4. Actualizar PMP en tinv_producto para todos los productos con precio reportado
UPDATE sch_leangsp.tinv_producto AS p
SET costo_pmp_vigente = CASE WHEN v.nuevo_precio > 0 THEN v.nuevo_precio ELSE p.costo_pmp_vigente END
FROM (VALUES
${stockUpdateLines.join(',\n')}
) AS v(codigo_legado, nuevo_stock, nuevo_precio)
WHERE p.id_empresa = 9 AND p.codigo_legado = v.codigo_legado;

-- 5. Calibrar stock exacto por producto preservando su ubicación física preferente
UPDATE sch_leangsp.tinv_stock AS s
SET cantidad_fisica = v.nuevo_stock
FROM (
  SELECT p.id_producto, MAX(v.nuevo_stock) AS nuevo_stock
  FROM (VALUES
${stockUpdateLines.join(',\n')}
  ) AS v(codigo_legado, nuevo_stock, nuevo_precio)
  JOIN sch_leangsp.tinv_producto p ON p.codigo_legado = v.codigo_legado AND p.id_empresa = 9
  GROUP BY p.id_producto
) AS v
WHERE s.id_empresa = 9 AND s.id_producto = v.id_producto;

-- 6. Insertar en SIN-UBICAR cualquier producto que aún no tenga fila en tinv_stock (los 49 nuevos)
INSERT INTO sch_leangsp.tinv_stock (id_empresa, id_producto, id_ubicacion, estado_stock, cantidad_fisica, cantidad_reservada)
SELECT 
  9,
  v.id_producto,
  (SELECT id_ubicacion FROM sch_leangsp.tinv_ubicacion WHERE codigo = 'SIN-UBICAR' LIMIT 1),
  'LIBRE',
  v.nuevo_stock,
  0
FROM (
  SELECT p.id_producto, MAX(v.nuevo_stock) AS nuevo_stock
  FROM (VALUES
${stockUpdateLines.join(',\n')}
  ) AS v(codigo_legado, nuevo_stock, nuevo_precio)
  JOIN sch_leangsp.tinv_producto p ON p.codigo_legado = v.codigo_legado AND p.id_empresa = 9
  GROUP BY p.id_producto
) AS v
WHERE NOT EXISTS (
  SELECT 1 FROM sch_leangsp.tinv_stock s WHERE s.id_empresa = 9 AND s.id_producto = v.id_producto
);

COMMIT;

-- Verificación final
SELECT 
  count(*) AS total_productos,
  (SELECT count(*) FROM sch_leangsp.tinv_stock WHERE cantidad_fisica > 0) AS items_con_stock,
  (SELECT COALESCE(SUM(cantidad_fisica), 0) FROM sch_leangsp.tinv_stock) AS total_unidades
FROM sch_leangsp.tinv_producto
WHERE id_empresa = 9;
`;

  const outputPath = path.resolve(projectRoot, 'ejecucion/bd/sync_geosoft_delta.sql');
  fs.writeFileSync(outputPath, fullSql, 'utf-8');
  console.log(`\n✅ Script de sincronización delta guardado en: ${outputPath}`);
  console.log(`   - Nuevos repuestos a insertar: ${nuevosProductos.length}`);
  console.log(`   - Ítems existentes a calibrar saldo: ${itemsCalibrados}`);
}

buildDeltaSync().catch(console.error);
