const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function inspectCrmKeys() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const cmd = `su - postgres -c "psql -d postgres -t -A -c \\"SELECT jsonb_object_keys(json_field->'crm_v1') FROM sch_leangsp_prod.tpry_proyecto WHERE id_proyecto = 4;\\""`;
  const res = await ssh.execCommand(cmd);
  console.log('Keys en crm_v1:', res.stdout);

  ssh.dispose();
}

inspectCrmKeys().catch(console.error);
