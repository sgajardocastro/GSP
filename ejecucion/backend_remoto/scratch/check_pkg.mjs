import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();
async function main() {
  try {
    await ssh.connect({
      host: 'servidor.leanglobal.cl',
      port: 1295,
      username: 'root',
      password: 'lgbl2025.'
    });
    const pkg = await ssh.execCommand('cat /home/nodeadmin/proyectos/gsp-whatsapp-service/package.json');
    console.log('PACKAGE.JSON:\n', pkg.stdout);
  } catch (err) {
    console.error(err);
  } finally {
    ssh.dispose();
  }
}
main();
