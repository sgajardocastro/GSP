const fs = require('fs');
const path = require('path');
const xlsx = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/xlsx'));

const excelPath = path.resolve(__dirname, '../Documentos ejemplo/datos base para leanglobal/datos base para leanglobal/Inventario actualizado de bodega al 08-07-2026.xlsx');
const outputSqlPath = path.resolve(__dirname, '../ejecucion/bd/update_skus_familia.sql');

const wb = xlsx.readFile(excelPath, { cellDates: true });
const sheet = wb.Sheets[wb.SheetNames[0]];
const rawRows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
const dataRows = rawRows.slice(1);

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
const seenCodigos = new Map();
const updates = [];

dataRows.forEach((r, idx) => {
  const rowId = r[0];
  let rawCodigo = String(r[1] || '').trim();
  const rawGrupoNombre = String(r[6] || 'Otros').trim();

  let codigoLegado = rawCodigo;
  if (!codigoLegado) {
    codigoLegado = `LEG-${rowId}`;
  } else if (seenCodigos.has(codigoLegado)) {
    const count = seenCodigos.get(codigoLegado) + 1;
    seenCodigos.set(codigoLegado, count);
    codigoLegado = `${codigoLegado}-BIS${count > 2 ? count : ''}`;
  } else {
    seenCodigos.set(codigoLegado, 1);
  }

  const prefix = FAMILIA_PREFIXES[rawGrupoNombre] || 'VARI';
  familyCounters[prefix] = (familyCounters[prefix] || 0) + 1;
  const sku = `${prefix}-${String(familyCounters[prefix]).padStart(5, '0')}`;

  const cleanLegado = codigoLegado.replace(/'/g, "''");
  updates.push(`  ('${cleanLegado}', '${sku}')`);
});

const sql = `
-- ACTUALIZACIÓN CANÓNICA DE SKUS POR FAMILIA MRO (SPEC 48 V3.0)
BEGIN;

UPDATE sch_leangsp.tinv_producto AS p
SET sku = v.nuevo_sku
FROM (VALUES
${updates.join(',\n')}
) AS v(codigo_legado, nuevo_sku)
WHERE p.id_empresa = 9 AND p.codigo_legado = v.codigo_legado;

COMMIT;

SELECT count(*), substring(sku from 1 for 4) as prefijo 
FROM sch_leangsp.tinv_producto 
GROUP BY substring(sku from 1 for 4) 
ORDER BY count(*) DESC;
`;

fs.writeFileSync(outputSqlPath, sql, 'utf-8');
console.log(`✅ Script SQL de actualización generado en ${outputSqlPath} con ${updates.length} productos.`);
