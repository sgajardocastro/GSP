const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function checkProject97() {
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
  const res = await pool.query("SELECT json_field FROM sch_leangsp_prod.tpry_proyecto WHERE id_proyecto = 97");
  const jf = res.rows[0].json_field;
  console.log('CRM lineas_servicio[0]:', jf.crm_v1.lineas_servicio[0].equipo_asignado_id);
  console.log('EJECUCION equipo_id:', jf.ejecucion_v1.equipo_id);
  console.log('EJECUCION tripulacion:', jf.ejecucion_v1.tripulacion_asignada);
  process.exit(0);
}
test().catch(e => { console.error(e); process.exit(1); });
`;

  await ssh.execCommand("cat << 'EOF' > /tmp/check_p97.js\n" + script + "\nEOF");
  const res = await ssh.execCommand('su - nodeadmin -c "node /tmp/check_p97.js"');
  console.log('RESULT:\n', res.stdout, res.stderr);

  ssh.dispose();
}

checkProject97().catch(console.error);
