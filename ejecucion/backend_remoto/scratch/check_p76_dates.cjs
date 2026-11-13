const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({ host: '138.255.103.18', port: 1295, username: 'root', password: 'lgbl2025.' });
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -c \\"SELECT id_proyecto, codi_proyecto, fecha_plan_ini, fecha_plan_fin, fecha_real_ini, fecha_real_fin, id_proyecto_estado FROM sch_leangsp.tpry_proyecto WHERE id_proyecto = 76;\\""');
  console.log(res.stdout);
  ssh.dispose();
}

run().catch(console.error);
