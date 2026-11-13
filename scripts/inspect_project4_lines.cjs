const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function inspectLineasServicio() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const cmd = `su - postgres -c "psql -d postgres -t -A -c \\"SELECT json_field->'crm_v1'->'lineas_servicio' FROM sch_leangsp_prod.tpry_proyecto WHERE id_proyecto = 4;\\""`;
  const res = await ssh.execCommand(cmd);
  console.log('=== LINEAS DE SERVICIO EN CRM PARA OT 4 ===');
  console.log(res.stdout);

  ssh.dispose();
}

inspectLineasServicio().catch(console.error);
