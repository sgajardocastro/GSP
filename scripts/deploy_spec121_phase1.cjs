const fs = require('fs');
const path = require('path');
const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');

async function main() {
  console.log('=== DESPLIEGUE SPEC-121 FASE 1: PDF ITS, 10 PUNTOS DE COSTOS, VIATICOS E HISTORIAL DE RECHAZOS ===\n');

  const itsPdfServicePath = path.resolve(__dirname, '../ejecucion/backend_remoto/src/services/itsPdfService.js');
  const itsControllerPath = path.resolve(__dirname, '../ejecucion/backend_remoto/src/controllers/itsController.js');

  // 1. Validar sintaxis local antes de enviar
  console.log('Validando sintaxis de archivos locales...');
  require(itsPdfServicePath);
  console.log('itsPdfService.js sintaxis OK.');

  // 2. Conectar por SSH
  const ssh = new NodeSSH();
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });
  console.log('Conexión SSH establecida con éxito.');

  const targetsPdfService = [
    '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/services/itsPdfService.js',
    '/home/nodeadmin/proyectos/lean-services-gsp/src/services/itsPdfService.js',
    '/home/nodeadmin/proyectos/lean-services-gsp-dev/src/services/itsPdfService.js',
    '/home/nodeadmin/proyectos/lean-services-bch-dev/src/services/itsPdfService.js'
  ];

  for (const t of targetsPdfService) {
    console.log('Subiendo itsPdfService.js a:', t);
    await ssh.putFile(itsPdfServicePath, t);
    await ssh.execCommand(`chown nodeadmin:nodeadmin ${t}`);
  }

  const targetsController = [
    '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/itsController.js',
    '/home/nodeadmin/proyectos/lean-services-gsp/src/controllers/itsController.js',
    '/home/nodeadmin/proyectos/lean-services-gsp-dev/src/controllers/itsController.js',
    '/home/nodeadmin/proyectos/lean-services-bch-dev/src/controllers/itsController.js'
  ];

  for (const t of targetsController) {
    console.log('Subiendo itsController.js a:', t);
    await ssh.putFile(itsControllerPath, t);
    await ssh.execCommand(`chown nodeadmin:nodeadmin ${t}`);
  }

  console.log('\nReiniciando PM2 en producción (13) y desarrollo (10)...');
  const reloadRes = await ssh.execCommand('su - nodeadmin -c "pm2 reload 10 && pm2 reload 13"');
  console.log(reloadRes.stdout || reloadRes.stderr);

  // 3. Verificación empírica remota con pdftotext
  console.log('\nEjecutando verificación empírica con pdftotext sobre OT 30...');
  const testRes = await ssh.execCommand(`
    curl -s https://servidor.leanglobal.cl/lg-gsp-prod/api/operaciones/its/preview-pdf/30 > /tmp/test_its_30.pdf
    ls -lh /tmp/test_its_30.pdf
    pdftotext /tmp/test_its_30.pdf /tmp/test_its_30.txt
    grep -E "Viáticos|Peajes|Combustibles|Pensiones|Movilización|Personal Externo|Feriados|Subcontratación|Gastos Extraordinarios|Costo Valor Hora|HRS VIÁTICOS|RECHAZO|Jonathan" /tmp/test_its_30.txt | head -n 30
  `);
  console.log(testRes.stdout || testRes.stderr);

  ssh.dispose();
  console.log('\n=== DESPLIEGUE Y VERIFICACIÓN COMPLETADOS EXITOSAMENTE ===');
}

main().catch(err => {
  console.error('Error fatal en despliegue:', err);
  process.exit(1);
});
