const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function getProjectToken() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT id_proyecto, nombre_proyecto, codi_proyecto, estado_solicitud_visita, token_visita, json_field->'crm_v1'->>'coordinador_visita' as coord FROM sch_leangsp_prod.tpry_proyecto WHERE id_proyecto = 1;\\""`);
  console.log(res.stdout);

  ssh.dispose();
}

getProjectToken().catch(console.error);
