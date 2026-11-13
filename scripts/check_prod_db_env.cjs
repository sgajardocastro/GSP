const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const resEnv = await ssh.execCommand('grep -E "DB_|SCHEMA" /home/nodeadmin/proyectos/lean-services-gsp-prod/.env');
  console.log('PROD DB env:\n', resEnv.stdout);

  ssh.dispose();
}

main().catch(console.error);
