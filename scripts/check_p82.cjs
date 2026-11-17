const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const cmd = `su - postgres -c "psql -d sch_leangsp -c 'SELECT id_proyecto, codi_proyecto, json_field->\\'crm_v1\\'->\\'servicios\\' as servicios, json_field->\\'crm_v1\\'->\\'lineas_servicio\\' as lineas FROM sch_leangsp.tpry_proyecto WHERE id_proyecto = 82;'"`;
  const res = await ssh.execCommand(cmd);
  console.log(res.stdout);

  const linesCmd = `su - postgres -c "psql -d sch_leangsp -c 'SELECT * FROM sch_leangsp.tpry_linea_servicio WHERE id_proyecto = 82;'"`;
  const res2 = await ssh.execCommand(linesCmd);
  console.log(res2.stdout);

  ssh.dispose();
}

run().catch(console.error);
