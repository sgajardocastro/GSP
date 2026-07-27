const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function run() {
  try {
    await ssh.connect({
      host: 'servidor.leanglobal.cl',
      username: 'root',
      password: 'lgbl2025.',
      port: 1295
    });

    console.log("--- CONTENIDO DE /etc/nginx/sites-enabled/https_le.conf ALREDEDOR DE lg-gsp ---");
    const r = await ssh.execCommand('grep -A 25 -B 10 "/lg-gsp" /etc/nginx/sites-enabled/https_le.conf');
    console.log(r.stdout);
  } catch (err) {
    console.error(err);
  } finally {
    ssh.dispose();
  }
}

run();
