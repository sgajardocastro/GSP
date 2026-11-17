const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function checkRows() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const script = `
require('/home/nodeadmin/proyectos/lean-services-gsp-prod/node_modules/dotenv').config({ path: '/home/nodeadmin/proyectos/lean-services-gsp-prod/.env' });
const pool = require('/home/nodeadmin/proyectos/lean-services-gsp-prod/src/config/database');

async function test() {
  const res = await pool.query(
    "SELECT re.id_rel_equipo, re.id_equipo, e.patente, re.rol_equipo, re.fecha_plan_ini, re.estado_real FROM tpry_rel_equipo re JOIN tequ_equipo e ON re.id_equipo = e.id_equipo WHERE re.id_proyecto = 97 ORDER BY re.fecha_plan_ini ASC"
  );
  console.log('ROWS IN TPRY_REL_EQUIPO FOR PROYECTO 97:');
  console.log(JSON.stringify(res.rows, null, 2));
  process.exit(0);
}
test().catch(e => { console.error(e); process.exit(1); });
`;

  await ssh.execCommand("cat << 'EOF' > /tmp/check_rel.js\n" + script + "\nEOF");
  const res = await ssh.execCommand('su - nodeadmin -c "node /tmp/check_rel.js"');
  console.log('RESULT:\n', res.stdout, res.stderr);

  ssh.dispose();
}

checkRows().catch(console.error);
