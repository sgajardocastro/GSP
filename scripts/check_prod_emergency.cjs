const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkEmergency() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  console.log('=== 1. PM2 STATUS ===');
  const st = await ssh.execCommand('su - nodeadmin -c "pm2 status"');
  console.log(st.stdout);

  console.log('\n=== 2. PM2 13 LOGS (LAST 60 LINES) ===');
  const logs = await ssh.execCommand('su - nodeadmin -c "pm2 logs 13 --lines 60 --nostream"');
  console.log(logs.stdout || logs.stderr);

  console.log('\n=== 3. NGINX ERROR LOGS ===');
  const ngLogs = await ssh.execCommand('tail -n 30 /var/log/nginx/error.log');
  console.log(ngLogs.stdout);

  console.log('\n=== 4. TEST LOCALHOST:3007 ===');
  const curl1 = await ssh.execCommand('curl -s -i http://localhost:3007/api/proyectos | head -n 30');
  console.log('Localhost 3007:', curl1.stdout);

  console.log('\n=== 5. TEST PUBLIC PROD API ===');
  const curl2 = await ssh.execCommand('curl -s -i https://servidor.leanglobal.cl/lg-gsp-prod/api/proyectos | head -n 30');
  console.log('Public Prod API:', curl2.stdout);

  ssh.dispose();
}

checkEmergency().catch(console.error);
