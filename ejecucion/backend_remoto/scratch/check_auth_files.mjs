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
    const ls = await ssh.execCommand('ls -la /home/nodeadmin/proyectos/gsp-whatsapp-service/auth_info_baileys | grep session | head -n 30');
    console.log('=== SESSIONS ===\n', ls.stdout);
    const count = await ssh.execCommand('ls -1 /home/nodeadmin/proyectos/gsp-whatsapp-service/auth_info_baileys | wc -l');
    console.log('Total files in auth_info_baileys:', count.stdout);
  } catch (err) {
    console.error(err);
  } finally {
    ssh.dispose();
  }
}
main();
