const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  console.log('=== 1. DESPLEGANDO CONTROL DE FLOTA Y ASIGNACIONES A DEV Y PROD ===\n');

  const files = [
    {
      local: path.resolve(__dirname, '../ejecucion/backend_remoto/src/controllers/itsController.js'),
      subpath: 'src/controllers/itsController.js'
    },
    {
      local: path.resolve(__dirname, '../ejecucion/backend_remoto/src/services/itsPdfService.js'),
      subpath: 'src/services/itsPdfService.js'
    }
  ];

  // 1. DEV
  console.log('--- Subiendo a DEV ---');
  for (const f of files) {
    const dest = `/home/nodeadmin/proyectos/lean-services-gsp/${f.subpath}`;
    await ssh.putFile(f.local, dest);
    await ssh.execCommand(`chown nodeadmin:nodeadmin ${dest}`);
    console.log(`✓ ${f.subpath} -> DEV`);
  }
  console.log('Reiniciando PM2 DEV (10)...');
  await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');

  // 2. PROD
  console.log('\n--- Subiendo a PROD ---');
  for (const f of files) {
    const dest = `/home/nodeadmin/proyectos/lean-services-gsp-prod/${f.subpath}`;
    await ssh.putFile(f.local, dest);
    await ssh.execCommand(`chown nodeadmin:nodeadmin ${dest}`);
    console.log(`✓ ${f.subpath} -> PROD`);
  }
  console.log('Reiniciando PM2 PROD (13)...');
  await ssh.execCommand('su - nodeadmin -c "pm2 restart 13"');

  console.log('\nEsperando 3s...');
  await new Promise(r => setTimeout(r, 3000));

  // 3. Verificación de JSON API en PROD
  console.log('\n=== 2. VERIFICACIÓN JSON API PROD (/api/operaciones/its/32) ===\n');
  const resJson = await ssh.execCommand('curl -s http://127.0.0.1:3016/api/operaciones/its/32');
  try {
    const data = JSON.parse(resJson.stdout);
    console.log('Asignaciones Personal:', data.data?.asignaciones?.personal?.map(p => ({ id: p.id_user, nombre: `${p.name_frst} ${p.apellido_pat}`.trim(), rol: p.rol_personal })));
    console.log('\nAsignaciones Equipos:', data.data?.asignaciones?.equipos?.map(e => ({ patente: e.patente, modelo: e.modelo, trip: e.tripulacion_str })));
    console.log('\nJornadas:', data.data?.jornadas?.map(j => ({
      patente: j.patente,
      chofer: j.conductor_nombre || j.operador_nombre,
      tipo_servicio: j.tipo_servicio,
      sal: j.hora_salida,
      lle: j.hora_llegada,
      ter: j.hora_termino,
      ret: j.hora_retorno,
      hrs: j.horas_report,
      num: j.numero_report
    })));
  } catch (e) {
    console.error('Error parseando JSON:', e.message, resJson.stdout.slice(0, 200));
  }

  // 4. Verificación PDF con pdftotext
  console.log('\n=== 3. VERIFICACIÓN PDF CON PDFTOTEXT (/api/operaciones/its/preview-pdf/32) ===\n');
  const pdfCmd = `
    curl -s http://127.0.0.1:3016/api/operaciones/its/preview-pdf/32 -o /tmp/test_ot32_fleet.pdf
    pdftotext /tmp/test_ot32_fleet.pdf /tmp/test_ot32_fleet.txt
    echo "--- SECCIÓN 1: EQUIPOS Y PERSONAL ---"
    grep -A 10 "EQUIPO Y SUBCATEGORÍA" /tmp/test_ot32_fleet.txt
    echo -e "\n--- SECCIÓN 2: CONTROL DE FLOTA ---"
    grep -A 15 "2. CONTROL DE FLOTA" /tmp/test_ot32_fleet.txt || grep -A 15 "DETALLE DE JORNADAS" /tmp/test_ot32_fleet.txt
  `;
  const resPdf = await ssh.execCommand(pdfCmd);
  console.log(resPdf.stdout);

  ssh.dispose();
  console.log('\n=== FIN ===');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
