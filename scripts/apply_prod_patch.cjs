const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function applyProductionPatch() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const patchScript = `
  const fs = require('fs');
  const { execSync } = require('child_process');

  const file = '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/itsController.js';
  const backup = file + '.bak_patch_00029_' + Date.now();

  let src = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(backup, src, 'utf8');
  console.log('BACKUP CREADO:', backup);

  // Normalizar CRLF a LF
  src = src.replace(/\\r\\n/g, '\\n');

  // 0. Agregar esJornadaTraslado al inicio
  const funcEsJornadaTraslado = \`
function esJornadaTraslado(j) {
  if (!j || typeof j !== 'object') return false;
  const ts = String(j.tipo_servicio || '').trim();
  if (ts === 'Registro de Viaje') return false;
  const tsLow = ts.toLowerCase();
  const nr = String(j.numero_report || '').trim().toUpperCase();
  return tsLow.includes('flete') || tsLow.includes('traslado') || nr === 'TRASLADO' || nr.startsWith('FLE-');
}
\`;
  if (!src.includes('function esJornadaTraslado')) {
    src = src.replace('function esLineaRiggerFantasma', funcEsJornadaTraslado + '\\nfunction esLineaRiggerFantasma');
  }

  // 1. Declarar valorAdicionalesFijosPactados
  if (!src.includes('let valorAdicionalesFijosPactados = 0;')) {
    src = src.replace('let valorFijoPactado = 0;', 'let valorFijoPactado = 0;\\n      let valorAdicionalesFijosPactados = 0;');
  }

  // 2. Blindaje en Rigger/Adicional
  const oldFijoCheck = "const esFijo = unid.includes('FIJO') || unid.includes('SUMA ALZADA') || tipo.includes('FIJO') || desc.includes('VALOR FIJO');\\n          if (esFijo) {\\n            esValorFijoComercial = true;\\n            valorFijoPactado += (sub > 0 ? sub : precio);\\n          }";
  const newFijoCheck = \`const esFijo = unid.includes('FIJO') || unid.includes('SUMA ALZADA') || tipo.includes('FIJO') || desc.includes('VALOR FIJO');
          if (esFijo) {
            const rolUpper = String(l.rol_nodo || '').toUpperCase();
            const esSecundaria = Boolean(
              l.id_linea_servicio_padre ||
              ['OTROS', 'ACCESORIO', 'HIJO_COMERCIAL', 'PERSONAL'].includes(rolUpper) ||
              tipo.includes('PERSONAL') ||
              desc.includes('RIGGER') ||
              subcat.includes('RIGGER')
            );
            if (esSecundaria) {
              valorAdicionalesFijosPactados += (precio > 0 ? precio : sub);
            } else {
              esValorFijoComercial = true;
              valorFijoPactado += (precio > 0 ? precio : sub);
            }
          }\`;
  src = src.replace(oldFijoCheck, newFijoCheck);

  // 3. Blindaje después del loop
  const oldLoopEnd = "const esSoloTraslado = tieneLineaTraslado && !tieneLineaPorHora && !esValorFijoComercial && valorFijoPactado === 0;";
  const newLoopEnd = \`
      if (tieneLineaPorHora) {
        esValorFijoComercial = false;
        if (valorFijoPactado > 0) {
          valorAdicionalesFijosPactados += valorFijoPactado;
          valorFijoPactado = 0;
        }
      } else if (esValorFijoComercial && valorAdicionalesFijosPactados > 0) {
        valorFijoPactado += valorAdicionalesFijosPactados;
        valorAdicionalesFijosPactados = 0;
      }

      const esSoloTraslado = tieneLineaTraslado && !tieneLineaPorHora && !esValorFijoComercial && valorFijoPactado === 0 && valorAdicionalesFijosPactados === 0;
  \`.trim();
  src = src.replace(oldLoopEnd, newLoopEnd);

  // 4. Blindaje en reconciliacion de jornadas
  const oldJorFijo = "if (esValorFijoComercial || its.es_valor_fijo || valorFijoPactado > 0) {";
  const newJorFijo = "if (tieneLineaPorHora) { its.es_valor_fijo = false; } else if (esValorFijoComercial || its.es_valor_fijo || valorFijoPactado > 0) {";
  src = src.replace(oldJorFijo, newJorFijo);

  // 5. Blindaje en sumatoria de totales reactivos
  const oldSumBloque = \`          const sumHrsGrua = jornadas
            .filter(j => !j.es_oculta && (!j.tipo_servicio || !j.tipo_servicio.toLowerCase().includes('flete')) && j.tipo_servicio !== 'Registro de Viaje')
            .reduce((acc, j) => acc + (parseFloat(j.horas_report) || 0), 0);

          const sumIngresosHoras = its.es_valor_fijo
            ? (parseFloat(its.valor_fijo_pactado || valorFijoPactado || 0))
            : jornadas
                .filter(j => !j.es_oculta && (!j.tipo_servicio || !j.tipo_servicio.toLowerCase().includes('flete')))
                .reduce((acc, j) => acc + (parseFloat(j.subtotal) || ((parseFloat(j.horas_report) || 0) * (parseFloat(j.tarifa_hora) || parseFloat(its.valor_hora_pactado) || 0))), 0);

          const sumIngresosFletes = jornadas
            .filter(j => !j.es_oculta && j.tipo_servicio && j.tipo_servicio.toLowerCase().includes('flete'))
            .reduce((acc, j) => acc + (parseFloat(j.subtotal) || parseFloat(j.tarifa_hora) || 0), 0);\`;

  const newSumBloque = \`          const sumHrsGrua = jornadas
            .filter(j => !j.es_oculta && !esJornadaTraslado(j) && j.tipo_servicio !== 'Registro de Viaje')
            .reduce((acc, j) => acc + (parseFloat(j.horas_report) || 0), 0);

          const sumIngresosHoras = its.es_valor_fijo
            ? (parseFloat(its.valor_fijo_pactado || valorFijoPactado || 0))
            : jornadas
                .filter(j => !j.es_oculta && !esJornadaTraslado(j) && j.tipo_servicio !== 'Registro de Viaje')
                .reduce((acc, j) => {
                  const s = (j.subtotal !== undefined && j.subtotal !== null && !isNaN(Number(j.subtotal)))
                    ? Number(j.subtotal)
                    : ((Number(j.horas_report) || 0) * (Number(j.tarifa_hora) || Number(its.valor_hora_pactado) || 0));
                  return acc + s;
                }, 0);

          const sumIngresosFletes = jornadas
            .filter(j => !j.es_oculta && esJornadaTraslado(j))
            .reduce((acc, j) => {
              const s = (j.subtotal !== undefined && j.subtotal !== null && !isNaN(Number(j.subtotal)))
                ? Number(j.subtotal)
                : (Number(j.tarifa_hora) || 0);
              return acc + s;
            }, 0);\`;

  src = src.replace(oldSumBloque, newSumBloque);

  // Escribir archivo parcheado
  fs.writeFileSync(file, src, 'utf8');
  execSync('node -c ' + file);
  console.log('PATCH APLICADO Y SINTAXIS VERIFICADA OK');
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/apply_patch.js\n${patchScript}\nEOF`);
  const out = await ssh.execCommand('su - nodeadmin -c "cd /home/nodeadmin/proyectos/lean-services-gsp-prod && node /tmp/apply_patch.js"');
  console.log(out.stdout);
  if (out.stderr) console.error(out.stderr);

  // Reiniciar PM2 ID 13
  console.log('Reiniciando PM2 ID 13...');
  const pm2Out = await ssh.execCommand('su - nodeadmin -c "pm2 restart 13"');
  console.log(pm2Out.stdout);

  ssh.dispose();
}

applyProductionPatch().catch(console.error);
