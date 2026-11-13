const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const fs = require('fs');
const path = require('path');
const ssh = new NodeSSH();

async function runStorageAudit() {
  console.log('========================================================================');
  console.log('🔍 AUDITORÍA DE STORAGE 100% SOLO LECTURA (CERO MUTACIONES)');
  console.log('========================================================================\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const sqlDev = `\\o /tmp/dev_rows.json\nSELECT json_agg(t) FROM (SELECT id_doc, tipo_doc, name_doc_orig, name_doc_interno, path_doc FROM sch_leangsp.tfmg_file ORDER BY id_doc ASC) t;\n\\o /tmp/prod_rows.json\nSELECT json_agg(t) FROM (SELECT id_doc, tipo_doc, name_doc_orig, name_doc_interno, path_doc FROM sch_leangsp_prod.tfmg_file ORDER BY id_doc ASC) t;\n`;

  await ssh.execCommand("cat << 'EOF' > /tmp/audit_queries.sql\n" + sqlDev + "\nEOF");
  console.log('1. Extrayendo metadatos de BD (solo lectura)...');
  await ssh.execCommand('su - postgres -c "psql -d postgres -t -A -f /tmp/audit_queries.sql"');
  await ssh.execCommand('rm -f /tmp/audit_queries.sql');

  const remoteScanScript = `
const fs = require('fs');
const path = require('path');

const STORAGE_ROOT = '/u05/LeanDocs';
const LEGACY_PATHS = [
  '/home/nodeadmin/proyectos/lean-services-gsp/public',
  '/home/nodeadmin/proyectos/lean-services-gsp-prod/public',
  '/home/nodeadmin/proyectos/lean-services-gsp/public/contratos',
  '/home/nodeadmin/proyectos/lean-services-gsp-prod/public/contratos',
  '/u05/LeanDocs/GSP/Equipos',
  '/u05/LeanDocs/GSP/equipos',
  '/u05/LeanDocs/GSP/personal',
  '/u05/LeanDocs/GSP/Personal',
  '/u05/LeanDocs/GSP/surveys',
  '/u05/LeanDocs/gsp/surveys',
  '/u05/LeanDocs/GSP/dev/contratos',
  '/u05/LeanDocs/GSP/prod/contratos',
  '/u05/LeanDocs/GSP/dev/actas',
  '/u05/LeanDocs/GSP/prod/actas',
  '/u05/LeanDocs/GSP/cotizaciones',
  '/u05/LeanDocs/GSP/dev/cotizaciones'
];

function analyzeRows(jsonPath, schemaName) {
  if (!fs.existsSync(jsonPath)) return { schema: schemaName, error: 'No data file' };
  const raw = fs.readFileSync(jsonPath, 'utf8').trim();
  if (!raw) return { schema: schemaName, total: 0 };
  const rows = JSON.parse(raw);

  const total = rows.length;
  let directMatches = 0;
  let caseMismatchMatches = 0;
  let legacyMatches = 0;
  let missingFiles = 0;

  const byTipoDoc = {};
  const caseMismatchList = [];
  const missingList = [];

  for (const row of rows) {
    const tipo = row.tipo_doc || 'SIN_TIPO';
    if (!byTipoDoc[tipo]) {
      byTipoDoc[tipo] = { total: 0, okDirect: 0, caseMismatch: 0, legacy: 0, missing: 0 };
    }
    byTipoDoc[tipo].total++;

    const filename = row.name_doc_interno || row.name_doc_orig;
    if (!filename) {
      missingFiles++;
      byTipoDoc[tipo].missing++;
      continue;
    }

    const normRel = String(row.path_doc || '').replace(/[\\\\/]+/g, '/');
    const directPath = path.join(STORAGE_ROOT, normRel, filename);

    // 1. Direct match (must be a file, not a directory)
    if (fs.existsSync(directPath) && fs.statSync(directPath).isFile()) {
      directMatches++;
      byTipoDoc[tipo].okDirect++;
      continue;
    }

    // 2. Case mismatch check in path
    let foundCase = null;
    const testCaseDirs = [
      normRel.replace(/equipos/i, 'Equipos'),
      normRel.replace(/equipos/i, 'equipos'),
      normRel.replace(/personal/i, 'Personal'),
      normRel.replace(/personal/i, 'personal'),
      normRel.replace(/^gsp\\//i, 'GSP/'),
      normRel.replace(/^GSP\\//i, 'gsp/')
    ];

    for (const testDir of testCaseDirs) {
      const p = path.join(STORAGE_ROOT, testDir, filename);
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        foundCase = p;
        break;
      }
    }

    if (foundCase) {
      caseMismatchMatches++;
      byTipoDoc[tipo].caseMismatch++;
      if (caseMismatchList.length < 50) {
        caseMismatchList.push({ id_doc: row.id_doc, tipo, path_bd: normRel, path_real: foundCase, filename });
      }
      continue;
    }

    // 3. Legacy / Alternate dirs
    let foundLegacy = null;
    for (const legDir of LEGACY_PATHS) {
      const p = path.join(legDir, filename);
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        foundLegacy = p;
        break;
      }
      if (row.name_doc_orig) {
        const pOrig = path.join(legDir, row.name_doc_orig);
        if (fs.existsSync(pOrig) && fs.statSync(pOrig).isFile()) {
          foundLegacy = pOrig;
          break;
        }
      }
    }

    if (foundLegacy) {
      legacyMatches++;
      byTipoDoc[tipo].legacy++;
      continue;
    }

    // 4. Missing
    missingFiles++;
    byTipoDoc[tipo].missing++;
    if (missingList.length < 50) {
      missingList.push({ id_doc: row.id_doc, tipo, filename, path_doc: normRel });
    }
  }

  return {
    schema: schemaName,
    total,
    directMatches,
    caseMismatchMatches,
    legacyMatches,
    missingFiles,
    byTipoDoc,
    caseMismatchSample: caseMismatchList.slice(0, 10),
    missingSample: missingList.slice(0, 10)
  };
}

const dev = analyzeRows('/tmp/dev_rows.json', 'sch_leangsp');
const prod = analyzeRows('/tmp/prod_rows.json', 'sch_leangsp_prod');
console.log('__JSON_START__' + JSON.stringify({ dev, prod }) + '__JSON_END__');
`;

  await ssh.execCommand("cat << 'EOF' > /tmp/run_scan.js\n" + remoteScanScript + "\nEOF");
  console.log('2. Comprobando existencia física de cada archivo en disco...');
  const res = await ssh.execCommand('node /tmp/run_scan.js');
  await ssh.execCommand('rm -f /tmp/run_scan.js /tmp/dev_rows.json /tmp/prod_rows.json');
  ssh.dispose();

  const match = res.stdout.match(/__JSON_START__(.*)__JSON_END__/);
  if (!match) {
    console.log('Salida cruda:\n', res.stdout);
    if (res.stderr) console.error('Stderr:\n', res.stderr);
    return;
  }

  const stats = JSON.parse(match[1]);
  fs.writeFileSync(path.join(__dirname, 'audit_storage_results.json'), JSON.stringify(stats, null, 2));

  console.log('\n========================================================================');
  console.log('📊 REPORTE CONSOLIDADO DE AUDITORÍA DE STORAGE (DEV & PROD)');
  console.log('========================================================================\n');

  console.log('=== AMBIENTE DESARROLLO (sch_leangsp) ===');
  console.log(`Total Documentos Registrados en BD: ${stats.dev.total}`);
  console.log(`✅ Coincidencia Directa Exacta:    ${stats.dev.directMatches} (${((stats.dev.directMatches/stats.dev.total)*100).toFixed(1)}%)`);
  console.log(`⚠️ Discrepancia Mayúsculas/Min:     ${stats.dev.caseMismatchMatches} (${((stats.dev.caseMismatchMatches/stats.dev.total)*100).toFixed(1)}%)`);
  console.log(`📁 Resueltos por Rutas Legacy:       ${stats.dev.legacyMatches} (${((stats.dev.legacyMatches/stats.dev.total)*100).toFixed(1)}%)`);
  console.log(`❌ Archivos No Encontrados en Disco: ${stats.dev.missingFiles} (${((stats.dev.missingFiles/stats.dev.total)*100).toFixed(1)}%)`);

  console.log('\nDesglose por Tipo de Documento en DEV:');
  console.table(stats.dev.byTipoDoc);

  console.log('\n=== AMBIENTE PRODUCCIÓN (sch_leangsp_prod) ===');
  console.log(`Total Documentos Registrados en BD: ${stats.prod.total}`);
  console.log(`✅ Coincidencia Directa Exacta:    ${stats.prod.directMatches} (${((stats.prod.directMatches/stats.prod.total)*100).toFixed(1)}%)`);
  console.log(`⚠️ Discrepancia Mayúsculas/Min:     ${stats.prod.caseMismatchMatches} (${((stats.prod.caseMismatchMatches/stats.prod.total)*100).toFixed(1)}%)`);
  console.log(`📁 Resueltos por Rutas Legacy:       ${stats.prod.legacyMatches} (${((stats.prod.legacyMatches/stats.prod.total)*100).toFixed(1)}%)`);
  console.log(`❌ Archivos No Encontrados en Disco: ${stats.prod.missingFiles} (${((stats.prod.missingFiles/stats.prod.total)*100).toFixed(1)}%)`);

  console.log('\nDesglose por Tipo de Documento en PRODUCCIÓN:');
  console.table(stats.prod.byTipoDoc);

  console.log('\nCasos de Discrepancia Mayúsculas/Minúsculas detectados (Muestra):');
  console.log(stats.dev.caseMismatchSample);
}

runStorageAudit().catch(console.error);
