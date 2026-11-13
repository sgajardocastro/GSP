const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({ host: '138.255.103.18', username: 'root', password: 'lgbl2025.', port: 1295 });
  
  console.log('--- PROYECTOS EN PROD ---');
  const prys = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT id_proyecto, nombre_proyecto, estado_solicitud_visita, token_visita, json_field->'crm_v1' as crm FROM sch_leangsp_prod.tpry_proyecto;\\""`);
  console.log(prys.stdout);

  console.log('--- SURVEYS EN PROD ---');
  const srvs = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT id_survey, id_template, id_user, id_proyecto, estado_srv, fecha_plan_ini FROM sch_leangsp_prod.tsrv_survey;\\""`);
  console.log(srvs.stdout);

  console.log('--- PM2 LOGS 13 (LAST 30) ---');
  const logs = await ssh.execCommand('su - nodeadmin -c "pm2 logs 13 --lines 30 --nostream"');
  console.log(logs.stdout);

  ssh.dispose();
}

run();
