const pool = require('./src/config/postgresPool');
const fs = require('fs');
const path = require('path');
const { LEAN_DOCS_BASE_DIR } = require('./src/config/docsConfig');

async function checkFiles() {
  try {
    const { rows } = await pool.query('SELECT id_doc, name_doc_orig, name_doc_interno, path_doc, fecha_creacion FROM tfmg_file ORDER BY id_doc DESC LIMIT 100');
    console.log(`🔍 Analizando los últimos ${rows.length} archivos en BD...`);

    let relativeCount = 0;
    let missingCount = 0;
    let totalChecked = rows.length;

    console.log('\n--- DETALLE DE ARCHIVOS ANALIZADOS ---');
    rows.forEach(r => {
      const isRelative = !r.path_doc || !r.path_doc.startsWith('/');
      let targetDir = r.path_doc || '';
      if (isRelative) {
        relativeCount++;
        targetDir = path.join(LEAN_DOCS_BASE_DIR, targetDir);
      }
      
      let fullPath = path.join(targetDir, r.name_doc_interno);
      let existsInPrimary = fs.existsSync(fullPath);
      let existsInCwd = false;
      let cwdPath = '';

      if (!existsInPrimary) {
        cwdPath = path.join(process.cwd(), r.path_doc || '', r.name_doc_interno);
        existsInCwd = fs.existsSync(cwdPath);
      }

      const ok = existsInPrimary || existsInCwd;
      if (!ok) {
        missingCount++;
      }

      if (isRelative || !ok) {
        console.log(`[ID ${r.id_doc}] ${r.name_doc_orig} | RelativePath: ${isRelative ? 'SÍ (' + r.path_doc + ')' : 'NO'} | ExisteFísico: ${ok ? 'SÍ' + (existsInCwd ? ' (en CWD)' : '') : '❌ NO'}`);
      }
    });

    console.log('\n--- RESUMEN DIAGNÓSTICO ---');
    console.log(`Total revisados: ${totalChecked}`);
    console.log(`Archivos con ruta relativa en BD: ${relativeCount}`);
    console.log(`Archivos físicos no encontrados (Missing): ${missingCount}`);

  } catch (err) {
    console.error('Error al consultar BD:', err);
  } finally {
    pool.end();
  }
}

checkFiles();
