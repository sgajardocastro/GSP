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
    const logs = await ssh.execCommand('tail -n 80 /home/nodeadmin/.pm2/logs/gsp-whatsapp-out.log');
    console.log('=== STDOUT LOGS ===\n', logs.stdout);
    const errLogs = await ssh.execCommand('tail -n 80 /home/nodeadmin/.pm2/logs/gsp-whatsapp-error.log');
    console.log('=== STDERR LOGS ===\n', errLogs.stdout);
    const status = await ssh.execCommand('curl -s http://127.0.0.1:3085/status');
    console.log('=== STATUS ===\n', status.stdout);
  } catch (err) {
    console.error(err);
  } finally {
    ssh.dispose();
  }
}
main();
