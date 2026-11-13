const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkPwaEndpoints() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const res1 = await ssh.execCommand('curl -s "http://127.0.0.1:3016/api/reports/usuario/pendientes?id_user=49"');
  console.log('Reportes pendientes Robert (49):', res1.stdout);

  const res2 = await ssh.execCommand('curl -s "http://127.0.0.1:3016/api/viajes/activo/49"');
  console.log('Viaje activo Robert (49):', res2.stdout);

  ssh.dispose();
}

checkPwaEndpoints().catch(console.error);
