const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function main() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  console.log('--- REINICIAR PM2 COMO NODEADMIN ---');
  const res = await ssh.execCommand('su - nodeadmin -c "pm2 reload 10 && pm2 reload 13"');
  console.log(res.stdout);

  console.log('--- VERIFICAR LOGS PM2 13 (PROD) ---');
  const logs = await ssh.execCommand('su - nodeadmin -c "pm2 logs 13 --lines 15 --nostream"');
  console.log(logs.stdout);

  console.log('--- TEST CURL PUBLICO API BACKLOG ---');
  const curlRes = await ssh.execCommand('curl -s https://servidor.leanglobal.cl/lg-gsp-prod/api/backlog | head -c 250');
  console.log('PROD PUBLIC API:', curlRes.stdout);

  const curlDevRes = await ssh.execCommand('curl -s https://servidor.leanglobal.cl/lg-gsp-dev/api/backlog | head -c 250');
  console.log('DEV PUBLIC API:', curlDevRes.stdout);

  ssh.dispose();
}

main().catch(console.error);