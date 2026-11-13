/**
 * ETL INVENTARIO GSP - PROCESAMIENTO Y GENERACIÓN DE SEED CANÓNICO V3.0
 * Archivo origen: Documentos ejemplo/.../Inventario actualizado de bodega al 08-07-2026.xlsx
 * Archivos generados:
 *  - ejecucion/bd/seed_carga_inicial_inventario.sql (Script SQL de migración y seeding)
 *  - ejecucion/bd/reporte_etl_inventario.json (Reporte consolidado de auditoría)
 */

const fs = require('fs');
const path = require('path');
const xlsx = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/xlsx'));

const excelPath = path.resolve(__dirname, '../Documentos ejemplo/datos base para leanglobal/datos base para leanglobal/Inventario actualizado de bodega al 08-07-2026.xlsx');
const outputSqlPath = path.resolve(__dirname, '../ejecucion/bd/seed_carga_inicial_inventario.sql');
const outputReportPath = path.resolve(__dirname, '../ejecucion/bd/reporte_etl_inventario.json');

console.log('⚡ Leyendo archivo Excel:', excelPath);
const wb = xlsx.readFile(excelPath, { cellDates: true });
const sheetName = wb.SheetNames[0];
const sheet = wb.Sheets[sheetName];
const rawRows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

console.log(`✅ Hoja "${sheetName}" leída. Filas totales: ${rawRows.length}`);

const headers = rawRows[0];
const dataRows = rawRows.slice(1);

// Normalización de Unidades de Medida
function normalizarUoM(raw) {
  if (!raw) return 'UN';
  const val = String(raw).trim().toLowerCase();
  if (val.startsWith('unid')) return 'UN';
  if (val.startsWith('litr')) return 'L';
  if (val.startsWith('metr')) return 'm';
  if (val.startsWith('kilo')) return 'kg';
  if (val.startsWith('par')) return 'PAR';
  if (val.startsWith('pack')) return 'PACK';
  if (val.startsWith('jueg')) return 'JUEGO';
  if (val.startsWith('tamb')) return 'TAMBOR';
  if (val.startsWith('bald')) return 'BALDE';
  return 'UN';
}

// Detección de presentación de compra y factor
function detectarPresentacion(nombre, uomBase) {
  const n = String(nombre || '').toUpperCase();
  if (uomBase === 'L') {
    if (n.includes('208') || n.includes('200') || n.includes('TAMBOR')) {
      return { presentacion: 'TAMBOR', factor: 208.0 };
    }
    if (n.includes('20L') || n.includes('20 L') || n.includes('BALDE')) {
      return { presentacion: 'BALDE', factor: 20.0 };
    }
  }
  if (uomBase === 'kg') {
    if (n.includes('18KG') || n.includes('18 KG') || n.includes('BALDE')) {
      return { presentacion: 'BALDE', factor: 18.0 };
    }
    if (n.includes('20KG') || n.includes('20 KG') || n.includes('CAJA')) {
      return { presentacion: 'CAJA', factor: 20.0 };
    }
  }
  if (uomBase === 'm') {
    if (n.includes('50M') || n.includes('ROLLO')) {
      return { presentacion: 'ROLLO', factor: 50.0 };
    }
  }
  if (uomBase === 'UN') {
    if (n.includes('CAJA X 12') || n.includes('CAJA 12')) return { presentacion: 'CAJA', factor: 12.0 };
    if (n.includes('CAJA X 20') || n.includes('CAJA 20')) return { presentacion: 'CAJA', factor: 20.0 };
    if (n.includes('CAJA X 10') || n.includes('CAJA 10')) return { presentacion: 'CAJA', factor: 10.0 };
  }
  return { presentacion: null, factor: 1.0 };
}

// Normalización de Ubicaciones
const regexRack = /(?:BODEG[A]?\s*)?E\s*(\d+)[\s\-_]*([A-Ga-g])[\s\-_]*(\d+)/i;
const regexShelfOnly = /(?:BODEG[A]?\s*)?E\s*(\d+)/i;

function normalizarUbicacion(raw) {
  if (!raw) return { codigo: 'SIN-UBICAR', tipo: 'SIN-UBICAR', estanteria: null, nivel: null, posicion: null };
  const str = String(raw).trim().toUpperCase();

  const matchRack = str.match(regexRack);
  if (matchRack) {
    const est = `E${matchRack[1]}`;
    const niv = matchRack[2].toUpperCase();
    const pos = matchRack[3];
    return {
      codigo: `${est}-${niv}${pos}`,
      tipo: 'RACK',
      estanteria: est,
      nivel: niv,
      posicion: pos
    };
  }

  if (str.includes('PAÑOL') || str.includes('PA?OL') || str.includes('PANOL')) {
    return { codigo: 'PAÑOL', tipo: 'PAÑOL_HERRAMIENTAS', estanteria: null, nivel: null, posicion: null };
  }
  if (str.includes('CORRAL')) {
    return { codigo: 'CORRAL', tipo: 'CORRAL_PATIO', estanteria: null, nivel: null, posicion: null };
  }
  if (str.includes('EXTERNA')) {
    return { codigo: 'EXTERNA', tipo: 'EXTERNA', estanteria: null, nivel: null, posicion: null };
  }
  if (str.includes('CUARENTENA')) {
    return { codigo: 'CUARENTENA', tipo: 'CUARENTENA', estanteria: null, nivel: null, posicion: null };
  }

  // Casos ambiguos o sólo estantería: E7-7, E9-A, E7
  const matchShelf = str.match(regexShelfOnly);
  if (matchShelf && !str.includes('BODEGA')) {
    return { codigo: `E${matchShelf[1]}-PENDIENTE`, tipo: 'RACK_PENDIENTE', estanteria: `E${matchShelf[1]}`, nivel: null, posicion: null };
  }

  return { codigo: 'SIN-UBICAR', tipo: 'SIN-UBICAR', estanteria: null, nivel: null, posicion: null };
}

// Procesar filas
const seenCodigos = new Map();
const productos = [];
const ubicacionesSet = new Map();

// Insertar ubicaciones especiales fijas en el Set
['PAÑOL', 'CORRAL', 'RECEPCION', 'CUARENTENA', 'TRANSITO', 'EXTERNA', 'SIN-UBICAR'].forEach(u => {
  ubicacionesSet.set(u, { codigo: u, estanteria: null, nivel: null, posicion: null, tipo_zona: u === 'CORRAL' ? 'CORRAL_PATIO' : (u === 'PAÑOL' ? 'PAÑOL_HERRAMIENTAS' : 'VIRTUAL') });
});

// Prefijos de SKU por familia MRO (Spec 48 V3.0)
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
const familyCounters = {};

let stats = {
  totalRows: dataRows.length,
  itemsConStock: 0,
  itemsSinStock: 0,
  itemsInactivos: 0,
  totalStockUnidades: 0,
  valorizacionTotalCLP: 0,
  precioMenorIgualUno: 0,
  codigosDuplicadosResueltos: 0,
  familias: {},
  uoms: {},
  ubicacionesResumen: {
    enRacksExactos: 0,
    enAreasEspeciales: 0,
    enSinUbicar: 0,
    enRacksIncompletos: 0
  }
};

dataRows.forEach((r, idx) => {
  const rowId = r[0];
  let rawCodigo = String(r[1] || '').trim();
  const rawNombre = String(r[2] || '').trim();
  const rawMarca = String(r[3] || 'Genérico').trim();
  const rawPrecio = Number(r[4]) || 0;
  const rawMedida = r[5];
  const rawGrupoNombre = String(r[6] || 'Otros').trim();
  const rawUbicacion = r[8];
  const totCant = Number(r[9]) || 0;
  const totSalida = Number(r[10]) || 0;
  const stock = Number(r[11]) || 0;

  // Resolver duplicados de código
  let codigoLegado = rawCodigo;
  if (!codigoLegado) {
    codigoLegado = `LEG-${rowId}`;
  } else if (seenCodigos.has(codigoLegado)) {
    stats.codigosDuplicadosResueltos++;
    const count = seenCodigos.get(codigoLegado) + 1;
    seenCodigos.set(codigoLegado, count);
    codigoLegado = `${codigoLegado}-BIS${count > 2 ? count : ''}`;
  } else {
    seenCodigos.set(codigoLegado, 1);
  }

  const prefix = FAMILIA_PREFIXES[rawGrupoNombre] || 'VARI';
  familyCounters[prefix] = (familyCounters[prefix] || 0) + 1;
  const sku = `${prefix}-${String(familyCounters[prefix]).padStart(5, '0')}`;
  const uomBase = normalizarUoM(rawMedida);
  const presentacionInfo = detectarPresentacion(rawNombre, uomBase);
  const ubicInfo = normalizarUbicacion(rawUbicacion);

  // Registrar ubicación
  if (!ubicacionesSet.has(ubicInfo.codigo)) {
    ubicacionesSet.set(ubicInfo.codigo, {
      codigo: ubicInfo.codigo,
      estanteria: ubicInfo.estanteria,
      nivel: ubicInfo.nivel,
      posicion: ubicInfo.posicion,
      tipo_zona: ubicInfo.tipo === 'RACK' ? 'RACK' : 'VIRTUAL'
    });
  }

  // Contabilidad y clasificación de estado
  const tieneStock = stock > 0;
  const estado = tieneStock ? 'ACTIVO' : (totCant === 0 ? 'INACTIVO' : 'ACTIVO');
  const reqReval = rawPrecio <= 1 && tieneStock;

  if (tieneStock) {
    stats.itemsConStock++;
    stats.totalStockUnidades += stock;
    stats.valorizacionTotalCLP += (stock * rawPrecio);
  } else {
    stats.itemsSinStock++;
  }

  if (estado === 'INACTIVO') {
    stats.itemsInactivos++;
  }

  if (rawPrecio <= 1) {
    stats.precioMenorIgualUno++;
  }

  // Estadísticas
  stats.familias[rawGrupoNombre] = (stats.familias[rawGrupoNombre] || 0) + 1;
  stats.uoms[uomBase] = (stats.uoms[uomBase] || 0) + 1;

  if (ubicInfo.tipo === 'RACK') stats.ubicacionesResumen.enRacksExactos++;
  else if (ubicInfo.tipo === 'SIN-UBICAR') stats.ubicacionesResumen.enSinUbicar++;
  else if (ubicInfo.tipo === 'RACK_PENDIENTE') stats.ubicacionesResumen.enRacksIncompletos++;
  else stats.ubicacionesResumen.enAreasEspeciales++;

  // Criticidad inferida
  let impacto = 'NORMAL';
  let leadTime = 'CORTO';
  const gUpper = rawGrupoNombre.toUpperCase();
  const nUpper = rawNombre.toUpperCase();

  if (gUpper.includes('FILTRO') || nUpper.includes('FILTRO') || nUpper.includes('BOMBA') || nUpper.includes('CILINDRO') || nUpper.includes('MOTOR') || nUpper.includes('NEUMATICO')) {
    impacto = 'CRITICO';
    leadTime = nUpper.includes('BOMBA') || nUpper.includes('CILINDRO') ? 'LARGO' : 'MEDIO';
  } else if (gUpper.includes('ACEITE') || gUpper.includes('LUBRICANTE') || gUpper.includes('MANGUERA') || gUpper.includes('MECANICO')) {
    impacto = 'IMPORTANTE';
    leadTime = 'MEDIO';
  }

  // Control serie / lote
  let tipoControl = 'NINGUNO';
  let esRotable = false;
  if (nUpper.includes('BOMBA') || nUpper.includes('CILINDRO') || nUpper.includes('MOTOR') || nUpper.includes('TRANSMISION') || nUpper.includes('WINCHE')) {
    tipoControl = 'SERIE';
    esRotable = true;
  } else if (gUpper.includes('ACEITE') || gUpper.includes('LUBRICANTE') || gUpper.includes('QUIMICO') || gUpper.includes('PINTURA')) {
    tipoControl = 'LOTE';
  }

  productos.push({
    rowId,
    sku,
    codigoLegado,
    nombre: rawNombre.replace(/'/g, "''"),
    marca: rawMarca.replace(/'/g, "''"),
    familia: rawGrupoNombre.replace(/'/g, "''"),
    uomBase,
    presentacionCompra: presentacionInfo.presentacion,
    factorConversion: presentacionInfo.factor,
    tipoControl,
    esRotable,
    impacto,
    leadTime,
    claseAbc: rawPrecio >= 50000 ? 'A' : (rawPrecio >= 10000 ? 'B' : 'C'),
    costoPmp: rawPrecio,
    stock,
    ubicacionCodigo: ubicInfo.codigo,
    requiereRevalorizacion: reqReval,
    estado
  });
});

console.log('--- RESUMEN ETL ---');
console.log(`Filas analizadas: ${stats.totalRows}`);
console.log(`Con Stock > 0: ${stats.itemsConStock}`);
console.log(`Sin Stock: ${stats.itemsSinStock} (${stats.itemsInactivos} inactivos sin historia)`);
console.log(`Valorización Total: $${Math.round(stats.valorizacionTotalCLP).toLocaleString('es-CL')} CLP`);
console.log(`Ubicaciones únicas encontradas: ${ubicacionesSet.size}`);
console.log(`Duplicados resueltos: ${stats.codigosDuplicadosResueltos}`);

// Generar SQL
console.log('⚡ Generando script SQL de carga inicial...');
let sql = `-- ============================================================================
-- SCRIPT DE CARGA INICIAL (SEED ETL) - INVENTARIO WMS-LITE
-- Esquema: sch_leangsp
-- Fecha de generación: ${new Date().toISOString()}
-- Total de productos: ${productos.length} (660 con stock activo, valorizado en $${Math.round(stats.valorizacionTotalCLP).toLocaleString('es-CL')} CLP)
-- ============================================================================

SET search_path TO sch_leangsp, public;

-- 1. Asegurar Bodega Taller Central (id_bodega = 1)
INSERT INTO sch_leangsp.tinv_bodega (id_bodega, id_empresa, id_sucursal, nombre, tipo_bodega, consolida_stock, estado)
VALUES (1, 9, 1, 'Bodega Taller Central', 'TALLER_CENTRAL', true, 'ACTIVO')
ON CONFLICT (id_empresa, nombre) DO UPDATE SET estado = 'ACTIVO';

-- 2. Asegurar Ubicaciones Físicas y Virtuales
`;

ubicacionesSet.forEach(u => {
  const estVal = u.estanteria ? `'${u.estanteria}'` : 'NULL';
  const nivVal = u.nivel ? `'${u.nivel}'` : 'NULL';
  const posVal = u.posicion ? `'${u.posicion}'` : 'NULL';
  sql += `INSERT INTO sch_leangsp.tinv_ubicacion (id_bodega, codigo, estanteria, nivel, posicion, tipo_zona, estado)
VALUES (1, '${u.codigo}', ${estVal}, ${nivVal}, ${posVal}, '${u.tipo_zona}', 'OPERATIVA')
ON CONFLICT (id_bodega, codigo) DO NOTHING;\n`;
});

sql += `\n-- 3. Catálogo de Productos\n`;

productos.forEach(p => {
  const presVal = p.presentacionCompra ? `'${p.presentacionCompra}'` : 'NULL';
  sql += `INSERT INTO sch_leangsp.tinv_producto (
  id_empresa, sku, codigo_legado, nombre, familia, unidad_medida_base,
  presentacion_compra, factor_conversion, tipo_control, es_rotable,
  impacto_operacional, lead_time, clase_abc, costo_pmp_vigente, requiere_revalorizacion, estado
) VALUES (
  9, '${p.sku}', '${p.codigoLegado}', '${p.nombre}', '${p.familia}', '${p.uomBase}',
  ${presVal}, ${p.factorConversion}, '${p.tipoControl}', ${p.esRotable},
  '${p.impacto}', '${p.leadTime}', '${p.claseAbc}', ${p.costoPmp}, ${p.requiereRevalorizacion}, '${p.estado}'
) ON CONFLICT (id_empresa, sku) DO NOTHING;\n`;
});

sql += `\n-- 4. Proceso de Inventario Inicial INV-2026-001\n`;
sql += `INSERT INTO sch_leangsp.tinv_conteo (
  id_empresa, id_bodega, codigo_proceso, descripcion, tipo_conteo, es_ciego, estado, fecha_corte
) VALUES (
  9, 1, 'INV-2026-001', 'Inventario de Apertura 2026 (Carga Inicial Planilla)', 'APERTURA_CARGA_INICIAL', false, 'APROBADO_CONCILIADO', NOW()
) ON CONFLICT (id_empresa, codigo_proceso) DO NOTHING;\n`;

sql += `\n-- 5. Stock Físico Inicial (Quants) y Asientos en Kardex Inmutable\n`;

// Para los productos con stock > 0, crear registros de stock y movimiento
const prodsConStock = productos.filter(p => p.stock > 0);

prodsConStock.forEach(p => {
  sql += `
-- Producto: ${p.sku} (${p.codigoLegado}) - Cantidad: ${p.stock} ${p.uomBase}
DO $$
DECLARE
  v_id_prod BIGINT;
  v_id_ubic BIGINT;
  v_id_conteo BIGINT;
BEGIN
  SELECT id_producto INTO v_id_prod FROM sch_leangsp.tinv_producto WHERE id_empresa = 9 AND sku = '${p.sku}';
  SELECT id_ubicacion INTO v_id_ubic FROM sch_leangsp.tinv_ubicacion WHERE id_bodega = 1 AND codigo = '${p.ubicacionCodigo}';
  SELECT id_conteo INTO v_id_conteo FROM sch_leangsp.tinv_conteo WHERE id_empresa = 9 AND codigo_proceso = 'INV-2026-001';

  IF v_id_prod IS NOT NULL AND v_id_ubic IS NOT NULL THEN
    -- Stock Físico (Quant)
    INSERT INTO sch_leangsp.tinv_stock (id_empresa, id_producto, id_ubicacion, estado_stock, cantidad_fisica, cantidad_reservada)
    VALUES (9, v_id_prod, v_id_ubic, 'LIBRE', ${p.stock}, 0)
    ON CONFLICT (id_empresa, id_producto, id_ubicacion, COALESCE(id_lote, 0), COALESCE(id_serie, 0), estado_stock)
    DO UPDATE SET cantidad_fisica = EXCLUDED.cantidad_fisica;

    -- Asiento de Conteo Inicial
    INSERT INTO sch_leangsp.tinv_conteo_linea (
      id_conteo, id_producto, id_ubicacion, stock_sistema_congelado, conteo_1, costo_pmp_congelado, estado_linea
    ) VALUES (
      v_id_conteo, v_id_prod, v_id_ubic, 0, ${p.stock}, ${p.costoPmp}, 'CONCILIADA_OK'
    );

    -- Asiento en Kardex Inmutable
    INSERT INTO sch_leangsp.tinv_movimiento (
      id_empresa, tipo_movimiento, documento_tipo, documento_folio,
      id_producto, id_ubicacion, cantidad, costo_unitario_pmp,
      stock_anterior, stock_posterior, id_usuario, observaciones
    ) VALUES (
      9, 'CARGA_INICIAL', 'ACTA_CONTEO', 'ACTA-INV-20261001',
      v_id_prod, v_id_ubic, ${p.stock}, ${p.costoPmp},
      0, ${p.stock}, 1, 'Carga inicial apertura planilla 08-Jul-2026'
    );
  END IF;
END $$;
`;
});

fs.writeFileSync(outputSqlPath, sql, 'utf8');
fs.writeFileSync(outputReportPath, JSON.stringify(stats, null, 2), 'utf8');

console.log(`✅ Script SQL guardado con éxito: ${outputSqlPath} (${(sql.length / 1024).toFixed(1)} KB)`);
console.log(`✅ Reporte JSON guardado: ${outputReportPath}`);
