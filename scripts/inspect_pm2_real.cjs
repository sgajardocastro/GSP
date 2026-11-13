const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const desc10 = await ssh.execCommand('su - nodeadmin -c "pm2 describe 10"');
  console.log('=== PM2 10 ===\n', desc10.stdout.split('\n').filter(l => l.includes('script path') || l.includes('exec cwd') || l.includes('name')).join('\n'));

  const desc13 = await ssh.execCommand('su - nodeadmin -c "pm2 describe 13"');
  console.log('=== PM2 13 ===\n', desc13.stdout.split('\n').filter(l => l.includes('script path') || l.includes('exec cwd') || l.includes('name')).join('\n'));

  ssh.dispose();
}

run();
