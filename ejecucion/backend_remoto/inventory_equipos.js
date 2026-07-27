const fs = require('fs');
const path = require('path');

const rootDir = "d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/Documentos ejemplo/Equipos";

function scanDir(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(scanDir(filePath));
    } else {
      results.push({
        relativePath: path.relative(rootDir, filePath).replace(/\\/g, '/'),
        filename: file,
        size: stat.size
      });
    }
  });
  return results;
}

try {
  const allFiles = scanDir(rootDir);
  console.log(`Total files found: ${allFiles.length}`);
  
  // Print first 50 files
  console.log("Sample of files found:");
  allFiles.slice(0, 50).forEach(f => {
    console.log(`- ${f.relativePath} (${(f.size/1024).toFixed(1)} KB)`);
  });
  
  if (allFiles.length > 50) {
    console.log(`... and ${allFiles.length - 50} more files.`);
  }

} catch (err) {
  console.error("Error scanning directory:", err);
}
