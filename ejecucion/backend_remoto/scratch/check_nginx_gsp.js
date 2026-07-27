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

    console.log("--- BUSCANDO GSP EN NGINX ---");
    const r = await ssh.execCommand('grep -rn "gsp" /etc/nginx/');
    console.log(r.stdout);

    console.log("\n--- ARCHIVOS EN conf.d ---");
    const r2 = await ssh.execCommand('ls -la /etc/nginx/conf.d/');
    console.log(r2.stdout);

    console.log("\n--- CONTENIDO DE /etc/nginx/conf.d/default.conf o similar ---");
    const r3 = await ssh.execCommand('cat /etc/nginx/conf.d/default.conf | grep -A 20 -B 10 "gsp"');
    console.log(r3.stdout);
  } catch (err) {
    console.error(err);
  } finally {
    ssh.dispose();
  }
}

run();
