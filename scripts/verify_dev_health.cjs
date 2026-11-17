const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function main() {
  await ssh.connect({ host: '138.255.103.18', username: 'root', password: 'lgbl2025.', port: 1295 });
  const c1 = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3006/api/proyectos');
  console.log('Local 3006 /api/proyectos:', c1.stdout);
  const c2 = await ssh.execCommand('curl -s -k -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-dev/api/proyectos');
  console.log('Public /lg-gsp-dev/api/proyectos:', c2.stdout);
  const c3 = await ssh.execCommand('curl -s -k -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-dev/');
  console.log('Frontend /lg-gsp-dev/:', c3.stdout);
  const c4 = await ssh.execCommand('grep -i "v1.0.228" /var/www/html/lg-gsp-dev/index.html || echo "Index checked"');
  console.log('Index.html check:', c4.stdout.substring(0, 100));
  ssh.dispose();
}
main().catch(console.error);
