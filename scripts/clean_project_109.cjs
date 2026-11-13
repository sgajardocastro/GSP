const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const cmd = `su - postgres -c "psql -d postgres -c \\"UPDATE sch_leangsp.tpry_proyecto SET json_field = jsonb_set(json_field, '{crm_v1}', (json_field->'crm_v1') - 'contrato') WHERE id_proyecto = 109 RETURNING id_proyecto, json_field->'crm_v1'->'contrato' as contrato_restante;\\""`;
  const res = await ssh.execCommand(cmd);
  console.log(res.stdout || res.stderr);

  ssh.dispose();
}

run();
