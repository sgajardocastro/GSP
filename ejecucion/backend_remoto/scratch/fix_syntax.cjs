const fs = require('fs');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Reemplazar alerts multilínea por strings de una sola línea con escapes válidos
  content = content.replace(
    /alert\("✉️ Correo comercial formal enviado exitosamente[\s\S]*?de la oportunidad\."\);/,
    'alert("✉️ Correo comercial formal enviado exitosamente a rmorales@cenizas.cl con copia a Omar Ghiselini, Sergio Gajardo y Richard Jara.\\n\\nRegistro guardado en trazabilidad de envíos de la oportunidad.");'
  );
  content = content.replace(
    /alert\("🎉 Requerimiento transferido a Operaciones con éxito[\s\S]*?Torre de Control\."\);/,
    'alert("🎉 Requerimiento transferido a Operaciones con éxito.\\n\\nLa oportunidad avanza a Etapa 2: Validación & Diff en la Torre de Control.");'
  );

  fs.writeFileSync(filePath, content, 'utf8');

  // Verificar
  const scriptContent = content.match(/<script>([\s\S]*?)<\/script>/)[1];
  new Function(scriptContent);
  console.log('Validación sintaxis de', filePath, ': OK!');
}

const pubPath = 'D:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/ejecucion/frontend/public/navegacion_cotizacion_web.html';
const artPath = 'C:/Users/sgaja/.gemini/antigravity/brain/c39e7353-6ad9-4493-a2c5-4903d8b0ac1d/navegacion_cotizacion_web.html';

fixFile(pubPath);
fixFile(artPath);
