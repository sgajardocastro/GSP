const { NodeSSH } = require('./ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function main() {
  await ssh.connect({ host: '138.255.103.18', username: 'root', password: 'lgbl2025.', port: 1295 });
  const rel = await ssh.execCommand('su - nodeadmin -c "pm2 reload 13"');
  console.log('--- PM2 RELOAD 13 ---');
  console.log(rel.stdout);
  ssh.dispose();
}

main().catch(console.error);
