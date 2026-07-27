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

    console.log("--- REMOTE .ENV FILE ---");
    const r = await ssh.execCommand('cat /home/nodeadmin/proyectos/lean-services-gsp/.env');
    console.log(r.stdout);

    console.log("\n--- LISTING PORT 3006 PROCESS ---");
    const r2 = await ssh.execCommand('lsof -i :3006 || netstat -tulpn | grep 3006');
    console.log(r2.stdout);
  } catch (err) {
    console.error(err);
  } finally {
    ssh.dispose();
  }
}

run();
