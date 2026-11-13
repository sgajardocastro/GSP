const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({ host: '138.255.103.18', username: 'root', password: 'lgbl2025.', port: 1295 });
  
  console.log('--- ESTADO PROYECTO 1 ---');
  const pry = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT id_proyecto, nombre_proyecto, estado_solicitud_visita, token_visita, json_field->'crm_v1' as crm, json_field->'operaciones_v1' as ops FROM sch_leangsp_prod.tpry_proyecto WHERE id_proyecto = 1;\\""`);
  console.log(pry.stdout);

  ssh.dispose();
}

run();
