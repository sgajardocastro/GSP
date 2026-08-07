import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();
async function run() {
  try {
    await ssh.connect({ host: 'servidor.leanglobal.cl', port: 1295, username: 'root', password: 'lgbl2025.' });
    const res = await ssh.execCommand('node -e "console.log(Object.keys(require(\'./src/controllers/exportarController\')));"', { cwd: '/home/nodeadmin/proyectos/lean-services-gsp' });
    console.log('STDOUT:', res.stdout);
    console.log('STDERR:', res.stderr);
  } catch(e) {
    console.log(e);
  } finally {
    ssh.dispose();
  }
}
run();
