const fs = require('fs');
const filePath = 'ejecucion/backend_remoto/src/controllers/estadoPagoController.js';
let content = fs.readFileSync(filePath, 'utf8');

const target = `          fecha_ingreso: rep.fecha_reporte_fmt ? \`\${rep.fecha_reporte_fmt} 18:00\` : '',`;
const replacement = `          // RESOLUCIÓN DE FONDO (REQ-1131 / SPEC-119): Formato horario real en zona horaria America/Santiago sin forzar 18:00
          fecha_ingreso: (() => {
            const tsRaw = rep.fecha_registro || rep.fecha_termino_servicio || rep.fecha_inicio_servicio;
            if (tsRaw) {
              try {
                const d = new Date(tsRaw);
                if (!isNaN(d.getTime())) {
                  const fechaPart = d.toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });
                  const horaPart = d.toLocaleTimeString('es-CL', { timeZone: 'America/Santiago', hour: '2-digit', minute: '2-digit', hour12: false });
                  return \`\${fechaPart} \${horaPart}\`;
                }
              } catch (_) {}
            }
            return rep.fecha_reporte_fmt ? \`\${rep.fecha_reporte_fmt} \${rep.hora_termino || '08:00'}\` : '';
          })(),`;

if (!content.includes(target)) {
  console.error('Target not found in estadoPagoController.js!');
  process.exit(1);
}

content = content.replace(target, replacement);
fs.writeFileSync(filePath, content, 'utf8');
console.log('SUCCESS: estadoPagoController.js updated cleanly!');
