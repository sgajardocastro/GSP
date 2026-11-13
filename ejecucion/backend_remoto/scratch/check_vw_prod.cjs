const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkVw() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  console.log('=== VW_PROCESOSSURVEY EN PROD ===');
  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT id_survey, id_template, id_proyecto, id_user, fecha_plan_ini, fecha_plan_fin, estado_srv FROM sch_leangsp_prod.vw_procesossurvey;\\""`);
  console.log(res.stdout);

  ssh.dispose();
}

checkVw().catch(console.error);
