const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function main() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const nodeScript = `
const { Pool } = require('/home/nodeadmin/proyectos/lean-services-gsp/node_modules/pg');
const pool = new Pool({
  user: 'usr_leangsp',
  password: 'usr_gsp_123',
  host: 'localhost',
  database: 'postgres',
  port: 5432
});

async function run() {
  try {
    const otSurvCols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_schema='sch_leangsp' AND table_name='tmnt_ot_survey'");
    console.log('COLS tmnt_ot_survey:', otSurvCols.rows.map(c=>c.column_name));
    const otSurvs = await pool.query("SELECT * FROM sch_leangsp.tmnt_ot_survey WHERE id_proyecto = 205 OR json_field::text LIKE '%205%'");
    console.log('tmnt_ot_survey para 205:', JSON.stringify(otSurvs.rows, null, 2));

    const srvCols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_schema='sch_leangsp' AND table_name='tsrv_survey'");
    console.log('COLS tsrv_survey:', srvCols.rows.map(c=>c.column_name));

    const srvRows = await pool.query("SELECT * FROM sch_leangsp.tsrv_survey WHERE json_field::text LIKE '%Pandaria%' OR json_field::text LIKE '%205%'");
    console.log('tsrv_survey para 205:', JSON.stringify(srvRows.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
run();
`;

  await ssh.execCommand("cat << 'EOF' > /tmp/inspect_visita.js\n" + nodeScript + "\nEOF");
  const res = await ssh.execCommand('/home/nodeadmin/.nvm/versions/node/v16.20.2/bin/node /tmp/inspect_visita.js');
  console.log(res.stdout);
  if (res.stderr) console.error(res.stderr);
  ssh.dispose();
}

main().catch(console.error);
