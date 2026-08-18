const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function check() {
  try {
    await ssh.connect({
      host: 'servidor.leanglobal.cl',
      username: 'root',
      password: 'lgbl2025.',
      port: 1295,
      readyTimeout: 10000
    });
    const result = await ssh.execCommand('su - nodeadmin -c "pm2 logs 10 --lines 50 --nostream"');
    console.log(result.stdout);
    console.error(result.stderr);
    ssh.dispose();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
