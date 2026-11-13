const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const resEnv = await ssh.execCommand('grep -i port /home/nodeadmin/proyectos/lean-services-gsp/.env');
  console.log('DEV .env:', resEnv.stdout);

  const resPm2 = await ssh.execCommand('su - nodeadmin -c "pm2 env 10"');
  console.log('DEV PM2 env port:', resPm2.stdout.split('\n').filter(l => l.includes('PORT')));

  ssh.dispose();
}

main().catch(console.error);
