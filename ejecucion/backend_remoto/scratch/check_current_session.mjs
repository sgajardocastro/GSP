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

    const sessions = await ssh.execCommand('ls -la /home/nodeadmin/proyectos/gsp-whatsapp-service/auth_info_baileys/session-168349900226752* /home/nodeadmin/proyectos/gsp-whatsapp-service/auth_info_baileys/session-56936483259* 2>/dev/null || echo "NO_SESSION"');
    console.log('Session files now:\n', sessions.stdout);

    const logs = await ssh.execCommand('tail -n 20 /home/nodeadmin/.pm2/logs/gsp-whatsapp-out.log');
    console.log('Recent out logs:\n', logs.stdout);

  } catch (err) {
    console.error(err);
  } finally {
    ssh.dispose();
  }
}
main();
