const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function testQuery() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const sql = `
    SELECT 
      s.id_survey,
      s.estado_srv,
      f.id_flow,
      fs.id_flow_stp,
      fs.id_doc_in,
      fs.id_rol,
      fs.flag_equipo,
      fs.estado as estado_paso,
      fmg.name_doc_interno as name_doc_interno_in,
      fmg.name_doc_orig as name_doc_orig_in
    FROM sch_leangsp_prod.tsrv_survey s
    JOIN sch_leangsp_prod.tflw_flows f ON s.id_survey = f.id_survey
    JOIN sch_leangsp_prod.tflw_flow_steps fs ON f.id_flow = fs.id_flow
    LEFT JOIN sch_leangsp_prod.tfmg_file fmg ON fs.id_doc_in = fmg.id_doc
    WHERE s.id_user = 1 AND s.id_template = 500
    ORDER BY s.id_survey DESC
    LIMIT 1;
  `.replace(/\n/g, ' ');

  console.log('Testing query on sch_leangsp_prod:');
  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sql}\\""`);
  console.log(res.stdout || res.stderr);

  ssh.dispose();
}

testQuery().catch(console.error);
