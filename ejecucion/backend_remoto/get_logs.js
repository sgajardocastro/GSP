const { NodeSSH } = require('node-ssh');
const fs = require('fs');

const ssh = new NodeSSH();

async function getLogs() {
  try {
    await ssh.connect({
      host: '138.255.103.18',
      username: 'root',
      password: 'lgbl2025.',
      port: 1295
    });

    const result = await ssh.execCommand('su - nodeadmin -c "pm2 logs lean-services-gsp --lines 200 --nostream"');
    fs.writeFileSync('pm2_logs.txt', result.stdout + '\n' + result.stderr);
    console.log('Logs saved to pm2_logs.txt');
  } catch (err) {
    console.error('Failed:', err);
  } finally {
    ssh.dispose();
  }
}

getLogs();
