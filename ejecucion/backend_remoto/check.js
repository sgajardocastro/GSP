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
    const result = await ssh.execCommand('cd /home/nodeadmin/proyectos/lean-services-gsp && git status');
    console.log("STDOUT:", result.stdout);
    console.log("STDERR:", result.stderr);
    ssh.dispose();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
