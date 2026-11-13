const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function main() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const resWeb = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-dev/');
  const resPwa = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/pwa-gsp-dev/');
  const resApi = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" http://localhost:3006/api/mantenimiento/hallazgos');
  const resWsp = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" http://localhost:3085/');

  console.log('--- VERIFICACION EMPIRICA SERVICIOS DEV ---');
  console.log('WEB DEV (lg-gsp-dev):', resWeb.stdout.trim());
  console.log('PWA DEV (pwa-gsp-dev):', resPwa.stdout.trim());
  console.log('BACKEND HALLAZGOS (PM2 10):', resApi.stdout.trim());
  console.log('WHATSAPP GATEWAY (PM2 17):', resWsp.stdout.trim());

  ssh.dispose();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
