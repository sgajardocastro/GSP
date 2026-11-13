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

  console.log('=== DESPLEGANDO FORMATO RELOJ HH:MM EN ITS PDF SERVICE (DEV Y PROD) ===\n');

  const localFile = path.resolve(__dirname, '../ejecucion/backend_remoto/src/services/itsPdfService.js');
  const remoteDev = '/home/nodeadmin/proyectos/lean-services-gsp/src/services/itsPdfService.js';
  const remoteProd = '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/services/itsPdfService.js';

  // 1. Subida a DEV
  console.log('Subiendo a DEV:', remoteDev);
  await ssh.putFile(localFile, remoteDev);
  await ssh.execCommand(`chown nodeadmin:nodeadmin ${remoteDev}`);

  console.log('Reiniciando PM2 DEV (10)...');
  const rDev = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
  console.log(rDev.stdout.split('\n').slice(0, 10).join('\n'));

  // 2. Subida a PROD
  console.log('\nSubiendo a PROD:', remoteProd);
  await ssh.putFile(localFile, remoteProd);
  await ssh.execCommand(`chown nodeadmin:nodeadmin ${remoteProd}`);

  console.log('Reiniciando PM2 PROD (13)...');
  const rProd = await ssh.execCommand('su - nodeadmin -c "pm2 restart 13"');
  console.log(rProd.stdout.split('\n').slice(0, 10).join('\n'));

  console.log('\nEsperando 3s...');
  await new Promise(r => setTimeout(r, 3000));

  // 3. Verificación con pdftotext
  console.log('\n=== VERIFICACIÓN CON PDFTOTEXT (PROD OT 32) ===\n');
  const checkCmd = `
    curl -s http://127.0.0.1:3016/api/operaciones/its/preview-pdf/32 -o /tmp/test_ot32_hhmm.pdf
    pdftotext /tmp/test_ot32_hhmm.pdf /tmp/test_ot32_hhmm.txt
    echo "--- TOTALES JORNADAS ---"
    grep -A 8 "TOTALES JORNADAS:" /tmp/test_ot32_hhmm.txt
    echo "--- FILA JORNADA ---"
    grep -A 10 "GSP-2611-00003" /tmp/test_ot32_hhmm.txt | grep -A 8 "Valor Fijo"
    echo "--- COSTO OPERADOR ---"
    grep -A 8 "COSTO VALOR HORA OPERADOR" /tmp/test_ot32_hhmm.txt || true
  `;

  const resCheck = await ssh.execCommand(checkCmd);
  console.log(resCheck.stdout);
  if (resCheck.stderr) console.error('Error:', resCheck.stderr);

  ssh.dispose();
  console.log('\n=== FIN ===');
}

main().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
