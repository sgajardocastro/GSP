import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();
async function run() {
  try {
    await ssh.connect({ host: 'servidor.leanglobal.cl', port: 1295, username: 'root', password: 'lgbl2025.' });
    const res = await ssh.execCommand('su - nodeadmin -c "pm2 env 10"');
    const envStr = res.stdout;
    // extract lines starting with DB_
    const lines = envStr.split('\n');
    lines.forEach(l => {
        if (l.trim().startsWith('DB_')) console.log(l);
    });
  } catch(e) {
    console.log(e);
  } finally {
    ssh.dispose();
  }
}
run();
