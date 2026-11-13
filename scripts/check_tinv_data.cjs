const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkData() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const query = `
    SELECT id_bodega, nombre, estado FROM sch_leangsp.tinv_bodega;
    SELECT id_producto, sku, nombre FROM sch_leangsp.tinv_producto;
  `;
  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${query.replace(/\n/g, ' ')}\\""`);
  console.log(res.stdout);

  ssh.dispose();
}

checkData().catch(console.error);
