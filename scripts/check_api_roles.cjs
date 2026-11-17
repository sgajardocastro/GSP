const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkUr() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const res = await ssh.execCommand('curl -s https://servidor.leanglobal.cl/lg-gsp-prod/api/servicio/leanglobal/obtenerUsuariosRoles | python3 -c "import sys, json; data = json.load(sys.stdin); print([x for x in data if x.get(\'id_user\') == 10])"');
  console.log('obtenerUsuariosRoles para id_user 10:', res.stdout);

  ssh.dispose();
}

checkUr().catch(console.error);
