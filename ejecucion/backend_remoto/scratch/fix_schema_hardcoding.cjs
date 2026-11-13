const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '../src');

const filesToFix = [
  'controllers/archivoController.js',
  'controllers/authController.js',
  'controllers/estadoPagoController.js',
  'controllers/itsController.js',
  'controllers/patioController.js',
  'controllers/reportDiarioController.js',
  'controllers/viajeController.js',
  'controllers/visitaTerrenoController.js',
  'middleware/authMiddleware.js',
  'services/slaAuditorService.js'
];

console.log('=== REMOVIENDO sch_leangsp. HARDCODEADO EN EL BACKEND ===\n');

let totalReplacements = 0;

for (const relPath of filesToFix) {
  const fullPath = path.join(srcDir, relPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Archivo no encontrado: ${fullPath}`);
    continue;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  const matches = content.match(/sch_leangsp\./g);
  const count = matches ? matches.length : 0;

  if (count === 0) {
    console.log(`ℹ️ ${relPath}: 0 ocurrencias.`);
    continue;
  }

  // Backup
  fs.writeFileSync(`${fullPath}.bak_schema`, content, 'utf8');

  // Replace
  const updatedContent = content.replace(/sch_leangsp\./g, '');
  fs.writeFileSync(fullPath, updatedContent, 'utf8');

  console.log(`✅ ${relPath}: ${count} ocurrencias reemplazadas exitosamente.`);
  totalReplacements += count;

  // Syntax check
  try {
    require(fullPath);
    console.log(`   ✓ Sintaxis JS verificada para ${relPath}`);
  } catch (err) {
    // Some files might need express or other modules that fail if not mocked, but require should parse syntax
    if (err.name === 'SyntaxError') {
      console.error(`   ❌ SYNTAX ERROR en ${relPath}:`, err.message);
      process.exit(1);
    }
  }
}

console.log(`\nTotal de ocurrencias eliminadas: ${totalReplacements}`);
