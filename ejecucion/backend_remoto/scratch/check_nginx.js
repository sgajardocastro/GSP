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

    console.log("--- NGINX PROXY PASS ENTRIES ---");
    const r = await ssh.execCommand('grep -rn "proxy_pass" /etc/nginx/');
    console.log(r.stdout);

    console.log("\n--- NGINX GSP CONFIG ---");
    const r2 = await ssh.execCommand('cat /etc/nginx/conf.d/gsp.conf || cat /etc/nginx/default.d/*.conf || cat /etc/nginx/nginx.conf');
    console.log(r2.stdout);
  } catch (err) {
    console.error(err);
  } finally {
    ssh.dispose();
  }
}

run();
