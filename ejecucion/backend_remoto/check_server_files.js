const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function run() {
  try {
    await ssh.connect({
      host: 'servidor.leanglobal.cl',
      port: 1295,
      username: 'root',
      password: 'lgbl2025.'
    });

    console.log("Listing /var/www/html/lg-gsp-dev:");
    const lsGsp = await ssh.execCommand('ls -la /var/www/html/lg-gsp-dev');
    console.log(lsGsp.stdout || lsGsp.stderr);

    console.log("Listing /var/www/html/lg-gsp-dev/assets:");
    const lsAssets = await ssh.execCommand('ls -la /var/www/html/lg-gsp-dev/assets');
    console.log(lsAssets.stdout || lsAssets.stderr);

  } catch (err) {
    console.error(err);
  } finally {
    ssh.dispose();
  }
}

run();
