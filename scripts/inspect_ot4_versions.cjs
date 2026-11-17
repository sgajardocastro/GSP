const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function inspectOT4Versions() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const script = `
require('/home/nodeadmin/proyectos/lean-services-gsp-prod/node_modules/dotenv').config({ path: '/home/nodeadmin/proyectos/lean-services-gsp-prod/.env' });
const pool = require('/home/nodeadmin/proyectos/lean-services-gsp-prod/src/config/postgresPool');

async function test() {
  const pRes = await pool.query(
    "SELECT json_field FROM sch_leangsp_prod.tpry_proyecto WHERE id_proyecto = 33"
  );
  const jf = pRes.rows[0].json_field || {};
  console.log('HISTORIAL_OT:', JSON.stringify(jf.historial_ot || jf.versiones_ot, null, 2));

  const relEq = await pool.query(
    "SELECT * FROM sch_leangsp_prod.tpry_rel_equipo WHERE id_proyecto = 33 ORDER BY id_rel_equipo ASC"
  );
  console.log('TPRY_REL_EQUIPO FULL:');
  console.log(JSON.stringify(relEq.rows, null, 2));

  process.exit(0);
}
test().catch(function(e) { console.error(e); process.exit(1); });
`;

  await ssh.execCommand("cat << 'EOF' > /tmp/inspect_ot_versions.js\n" + script + "\nEOF");
  const res = await ssh.execCommand('su - nodeadmin -c "node /tmp/inspect_ot_versions.js"');
  console.log('RESULT:\n', res.stdout, res.stderr);

  ssh.dispose();
}

inspectOT4Versions().catch(console.error);
