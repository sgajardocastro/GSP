const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkDevGrep() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const res = await ssh.execCommand('grep -n "id_file" /home/nodeadmin/proyectos/lean-services-gsp/src/services/enrolamientoService.js');
  console.log('DEV:', res.stdout || res.stderr);

  ssh.dispose();
}

checkDevGrep().catch(console.error);
