const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

// Rutas absolutas
const trabajadoresDir = path.resolve(__dirname, '../../Documentos ejemplo/trabajadores');
const outputFile = path.resolve(__dirname, 'maestro_trabajadores_plantilla.xlsx');

function parseNombre(fullName) {
  const parts = fullName.trim().split(/\s+/);
  let name_frst = '';
  let name_sec = '';
  let apellido_pat = '';
  let apellido_mat = '';

  if (parts.length === 2) {
    name_frst = parts[0];
    apellido_pat = parts[1];
  } else if (parts.length === 3) {
    name_frst = parts[0];
    apellido_pat = parts[1];
    apellido_mat = parts[2];
  } else if (parts.length >= 4) {
    name_frst = parts[0];
    name_sec = parts.slice(1, parts.length - 2).join(' ');
    apellido_pat = parts[parts.length - 2];
    apellido_mat = parts[parts.length - 1];
  } else if (parts.length === 1) {
    name_frst = parts[0];
  }

  return { name_frst, name_sec, apellido_pat, apellido_mat };
}

function run() {
  console.log(`🔍 Escaneando directorio: ${trabajadoresDir}`);
  if (!fs.existsSync(trabajadoresDir)) {
    console.error(`❌ No existe el directorio de trabajadores en: ${trabajadoresDir}`);
    process.exit(1);
  }

  const items = fs.readdirSync(trabajadoresDir);
  const rows = [];

  items.forEach(item => {
    const fullPath = path.join(trabajadoresDir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      const parsed = parseNombre(item);
      rows.push({
        'Carpeta Trabajador': item,
        'Primer Nombre': parsed.name_frst,
        'Segundo Nombre': parsed.name_sec,
        'Apellido Paterno': parsed.apellido_pat,
        'Apellido Materno': parsed.apellido_mat,
        'RUT (ej: 12.345.678-9)': '',
        'Email (Notificaciones FES)': '',
        'Móvil (ej: +56912345678)': '',
        'Rol (Operador / Rigger / Chofer / Prevencionista / Administrador)': ''
      });
    }
  });

  console.log(`📋 Total trabajadores detectados: ${rows.length}`);

  // Crear libro Excel
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet(rows);

  // Autoajustar columnas
  const wscols = Object.keys(rows[0] || {}).map(key => {
    return { wch: Math.max(key.length + 3, 20) };
  });
  ws['!cols'] = wscols;

  xlsx.utils.book_append_sheet(wb, ws, 'Trabajadores GSP');
  xlsx.writeFile(wb, outputFile);

  console.log(`\n🎉 Excel generado con éxito en:\n👉 ${outputFile}`);
  console.log(`\n⚠️ Instrucciones:\n1. Abre el archivo en Excel.\n2. Completa el RUT, Email, Móvil y Rol de cada persona.\n3. Guarda el archivo con el mismo nombre para que el script importador pueda leerlo.`);
}

run();
