const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({ host: '138.255.103.18', username: 'root', password: 'lgbl2025.', port: 1295 });
  for (const s of ['sch_leangsp', 'sch_leangsp_prod']) {
    console.log(`=== ${s}.tmnt_parametro ===`);
    const r = await ssh.execCommand(`su - postgres -c "psql -d postgres -c 'SELECT clave, valor FROM ${s}.tmnt_parametro ORDER BY clave;'"`);
    console.log(r.stdout);
  }
  ssh.dispose();
}

run().catch(console.error);
