const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -c \\"SELECT id_user_modificacion, fecha_modificacion, json_field->\'crm_v1\'->\'lineas_servicio\'->0->\'equipo_asignado_id\' as eq0 FROM sch_leangsp_prod.tpry_proyecto WHERE id_proyecto = 97;\\""');
  console.log(res.stdout);
  ssh.dispose();
}

run().catch(console.error);
