const fs = require('fs');
let content = fs.readFileSync('RELEASE_LOG.md', 'utf8');

const entry = `## [Portal Web GSP & Backend] - Versión 1.0.202
- **Ambiente:** \`dev\` & \`prod\`
- **Fecha de Despliegue:** 2026-11-07 18:15:00 (-03:00)
- **Ruta de Despliegue:** \`/var/www/html/lg-gsp-dev\`, \`/var/www/html/lg-gsp-prod\`, \`/home/nodeadmin/proyectos/lean-services-gsp-prod\` & \`/home/nodeadmin/proyectos/lean-services-gsp\`
- **Requerimientos Asociados:** \`REQ-1127\` (\`SPEC-116\`), \`REQ-1128\` (\`SPEC-117\`), \`REQ-1129\` (\`SPEC-118\`), \`REQ-1131\` (\`SPEC-119\`)
- **Especificación Técnica:** Estabilización Ejecutiva y Resolución de Fondo Cero Parches (ITS, Viáticos RER/Riggers, Colación, Backlog Multimedia y Combustible Convoy):
  1. **REQ-1127 (Modo de Revisión Ejecutiva en ITS):** En \`ModalITS.vue\`, para pasos de supervisión directiva (Paso 2 Operaciones y Paso 3 Contabilidad), se bloquea la edición de datos operativos y se despliega directamente el visor completo del PDF oficial firmado con PIN FES en Paso 1 (Yiara Mendoza), acompañado de barra ejecutiva con botones \`Aprobar ITS (PIN FES)\` y \`Devolver con Observaciones\`.
  2. **REQ-1128 & Erradicación de Fallbacks de Colación:**
     - En \`controlVivoController.js\` y \`reportDiarioController.js\`, erradicados fallbacks \`colacion || 1.0\` y \`diffMin - 60\`, preservando estrictamente \`0\` colación.
     - En \`reportDiarioController.js\` y \`itsController.js\`, implementado fallback dinámico desde \`ejecV1.tripulacion_asignada\` hacia \`tedp_reporte_avance.id_user_rigger\` y \`nombre_rigger\`, garantizando la liquidación obligatoria de viáticos para Riggers / RER según escala tabular ($7.000 base 8h, +$1.000/h extra, tope $18.000).
     - **Datafix Masivo en Producción:** Actualizados los reportes de OT 35 (Inarco) asignando a Alfonso Maldonado (\`id_user = 21\`) con $8.000 diarios, y barrido transversal ejecutado en toda la base de datos (OTs 30, 31, 32, 35, 44, 51, 62).
  3. **REQ-1129 (Soporte Multimedia en Backlog):** Agregada columna \`adjuntos JSONB DEFAULT '[]'::jsonb\` en \`tcfg_backlog\` (DEV y PROD). En \`BacklogView.vue\`, incorporada captura directa de capturas de pantalla pegadas con \`Ctrl+V\`, selector de archivos, miniaturas con borrado y visor modal Lightbox en alta resolución.
  4. **REQ-1131 (Combustible Multiequipo por OT y Hitos Excel):** En \`itsController.js\`, enlace multiequipo \`(cs.id_proyecto = $1 OR ld.id_proyecto = $1)\` para capturar combustible de ramplas y vehículos de apoyo (caso Besalco). En \`estadoPagoController.js\`, erradicada máscara estática \`18:00\` en Excel Combustible, formateando los hitos con la marca temporal real en huso \`America/Santiago\`.
  5. **Alineación de Secuencias PostgreSQL:** Secuencias de todas las tablas en \`sch_leangsp_prod\` y \`sch_leangsp\` sincronizadas con sus valores máximos de ID.

`;

const marker = '## [Portal Web GSP & Backend] - Versión 1.0.201';
const idx = content.indexOf(marker);
if (idx === -1) {
  console.error('Marker not found!');
  process.exit(1);
}

content = content.slice(0, idx) + entry + content.slice(idx);
fs.writeFileSync('RELEASE_LOG.md', content, 'utf8');
console.log('SUCCESS: RELEASE_LOG.md updated with 1.0.202!');
