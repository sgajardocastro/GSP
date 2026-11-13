const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkEnv() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const res = await ssh.execCommand('cat /home/nodeadmin/proyectos/lean-services-gsp-prod/.env');
  const lines = res.stdout.split('\n').filter(l => l.startsWith('DB_') || l.startsWith('PORT'));
  console.log('Variables de PROD backend:');
  console.log(lines.join('\n'));

  ssh.dispose();
}

checkEnv().catch(console.error);
