const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function test() {
  await ssh.connect({ host: '138.255.103.18', username: 'root', password: 'lgbl2025.', port: 1295 });
  
  const rProd = await ssh.execCommand('curl -s "http://127.0.0.1:3016/api/mantenimiento/kpis?_bypass_empresa=1"');
  console.log('PROD (3016) local:\n', rProd.stdout.substring(0, 150));

  const rProdExt = await ssh.execCommand('curl -s "https://servidor.leanglobal.cl/lg-gsp-prod/api/mantenimiento/kpis?_bypass_empresa=1"');
  console.log('PROD HTTPS EXT:\n', rProdExt.stdout.substring(0, 150));

  const rOts = await ssh.execCommand('curl -s "http://127.0.0.1:3016/api/mantenimiento/ots"');
  console.log('PROD OTs count/preview:\n', rOts.stdout.substring(0, 150));

  ssh.dispose();
}
test();
