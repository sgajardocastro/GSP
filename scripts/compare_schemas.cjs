const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const fs = require('fs');
const path = require('path');
const ssh = new NodeSSH();

async function compareSchemas() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  console.log('=== COMPARANDO ESQUEMAS sch_leangsp (DEV) vs sch_leangsp_prod (PROD) ===\n');

  // 1. TABLAS
  const scriptSql = `
    SELECT 
      COALESCE(d.table_name, p.table_name) AS table_name,
      CASE 
        WHEN d.table_name IS NOT NULL AND p.table_name IS NULL THEN 'SOLO_EN_DEV'
        WHEN d.table_name IS NULL AND p.table_name IS NOT NULL THEN 'SOLO_EN_PROD'
        ELSE 'EN_AMBOS'
      END AS status
    FROM (
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'sch_leangsp' AND table_type = 'BASE TABLE'
    ) d
    FULL OUTER JOIN (
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'sch_leangsp_prod' AND table_type = 'BASE TABLE'
    ) p ON d.table_name = p.table_name
    WHERE d.table_name IS NULL OR p.table_name IS NULL
    ORDER BY status, table_name;
  `;

  const resTables = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -A -F ',' -c \\"${scriptSql.replace(/\n/g, ' ')}\\""`);
  const tablesList = resTables.stdout.trim().split('\n').filter(Boolean).map(l => {
    const [name, status] = l.split(',');
    return { name, status };
  });

  // 2. COLUMNAS EN TABLAS COMUNES (excluyendo las tablas que solo existen en un lado)
  const soloDevTables = new Set(tablesList.filter(t => t.status === 'SOLO_EN_DEV').map(t => t.name));
  const soloProdTables = new Set(tablesList.filter(t => t.status === 'SOLO_EN_PROD').map(t => t.name));

  const scriptCols = `
    SELECT 
      COALESCE(d.table_name, p.table_name) AS table_name,
      COALESCE(d.column_name, p.column_name) AS column_name,
      CASE 
        WHEN d.column_name IS NOT NULL AND p.column_name IS NULL THEN 'COL_SOLO_EN_DEV'
        WHEN d.column_name IS NULL AND p.column_name IS NOT NULL THEN 'COL_SOLO_EN_PROD'
        ELSE 'DISTINTO_TIPO'
      END AS status,
      COALESCE(d.data_type, 'N/A') AS tipo_dev,
      COALESCE(p.data_type, 'N/A') AS tipo_prod
    FROM (
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'sch_leangsp'
    ) d
    FULL OUTER JOIN (
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'sch_leangsp_prod'
    ) p ON d.table_name = p.table_name AND d.column_name = p.column_name
    WHERE d.column_name IS NULL OR p.column_name IS NULL OR d.data_type <> p.data_type
    ORDER BY table_name, column_name;
  `;

  const resCols = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -A -F ',' -c \\"${scriptCols.replace(/\n/g, ' ')}\\""`);
  const colsList = resCols.stdout.trim().split('\n').filter(Boolean).map(l => {
    const [table_name, column_name, status, tipo_dev, tipo_prod] = l.split(',');
    return { table_name, column_name, status, tipo_dev, tipo_prod };
  });

  // Filtrar columnas que pertenecen a tablas que ya son "SOLO_EN_DEV" o "SOLO_EN_PROD"
  const colDiscrepanciesInCommonTables = colsList.filter(c => !soloDevTables.has(c.table_name) && !soloProdTables.has(c.table_name));

  ssh.dispose();

  console.log('--- 1. TABLAS DISCREPANTES ---');
  console.log('Total tablas que solo existen en DEV:', tablesList.filter(t => t.status === 'SOLO_EN_DEV').length);
  console.log(tablesList.filter(t => t.status === 'SOLO_EN_DEV').map(t => '  - ' + t.name).join('\n'));

  console.log('\nTotal tablas que solo existen en PROD:', tablesList.filter(t => t.status === 'SOLO_EN_PROD').length);
  console.log(tablesList.filter(t => t.status === 'SOLO_EN_PROD').map(t => '  - ' + t.name).join('\n') || '  (Ninguna)');

  console.log('\n--- 2. COLUMNAS DISCREPANTES EN TABLAS COMUNES ---');
  console.log('Total diferencias de columnas en tablas compartidas:', colDiscrepanciesInCommonTables.length);
  colDiscrepanciesInCommonTables.forEach(c => {
    console.log(`  - ${c.table_name}.${c.column_name} -> ${c.status} (DEV: ${c.tipo_dev} | PROD: ${c.tipo_prod})`);
  });

  fs.writeFileSync(
    path.join(__dirname, 'schema_comparison_full.json'),
    JSON.stringify({ tables: tablesList, columnsInCommonTables: colDiscrepanciesInCommonTables }, null, 2)
  );
  console.log('\nReporte completo guardado en scripts/schema_comparison_full.json');
}

compareSchemas().catch(console.error);
