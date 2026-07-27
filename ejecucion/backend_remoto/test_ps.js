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
    console.log("Connected!");

    const psResult = await ssh.execCommand('ps aux | grep node');
    console.log("Node Processes:\n", psResult.stdout);

    const netResult = await ssh.execCommand('netstat -lntp');
    console.log("Ports Listening:\n", netResult.stdout);

  } catch (err) {
    console.error(err);
  } finally {
    ssh.dispose();
  }
}

run();
