const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkSurveys() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT id_survey, id_template, id_proyecto, id_user, estado_srv, fecha_plan_ini FROM sch_leangsp_prod.tsrv_survey;\\""`);
  console.log(res.stdout);

  ssh.dispose();
}

checkSurveys().catch(console.error);
