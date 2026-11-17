const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function inspectReport88Origin() {
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
  const r88 = await pool.query(
    "SELECT * FROM sch_leangsp_prod.tedp_reporte_avance WHERE id_reporte_avance = 88"
  );
  console.log('REPORTE 88 FULL ROW:');
  console.log(JSON.stringify(r88.rows[0], null, 2));

  const r72 = await pool.query(
    "SELECT * FROM sch_leangsp_prod.tedp_reporte_avance WHERE id_reporte_avance = 72"
  );
  console.log('REPORTE 72 FULL ROW:');
  console.log(JSON.stringify(r72.rows[0], null, 2));

  process.exit(0);
}
test().catch(function(e) { console.error(e); process.exit(1); });
`;

  await ssh.execCommand("cat << 'EOF' > /tmp/inspect_r88.js\n" + script + "\nEOF");
  const res = await ssh.execCommand('su - nodeadmin -c "node /tmp/inspect_r88.js"');
  console.log('RESULT:\n', res.stdout, res.stderr);

  ssh.dispose();
}

inspectReport88Origin().catch(console.error);
