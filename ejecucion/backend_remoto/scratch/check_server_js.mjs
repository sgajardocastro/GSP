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
    const srv = await ssh.execCommand('cat /home/nodeadmin/proyectos/gsp-whatsapp-service/server.js');
    console.log('SERVER.JS LENGTH:', srv.stdout.length);
    console.log('HEAD OF SERVER.JS:\n', srv.stdout.substring(0, 1000));
  } catch (err) {
    console.error(err);
  } finally {
    ssh.dispose();
  }
}
main();
