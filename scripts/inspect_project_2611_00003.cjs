const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function main() {
  await ssh.connect({ host: '138.255.103.18', username: 'root', password: 'lgbl2025.', port: 1295 });
  const rIts = await ssh.execCommand('curl -s https://servidor.leanglobal.cl/lg-gsp-prod/api/operaciones/its/32');
  console.log('ITS DATA (keys):');
  const d = JSON.parse(rIts.stdout);
  console.log('success:', d.success);
  console.log('proyecto:', JSON.stringify(d.data?.proyecto, null, 2));
  console.log('its:', JSON.stringify(d.data?.its, null, 2));
  console.log('jornadas:', JSON.stringify(d.data?.jornadas, null, 2));
  console.log('costos:', JSON.stringify(d.data?.costos, null, 2));

  ssh.dispose();
}

main().catch(console.error);
