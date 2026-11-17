const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function testOT() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const testScript = `
require('dotenv').config();
const ProyectoModel = require('./src/models/proyectoModel');
const proyectoModel = new ProyectoModel();

async function run() {
  try {
    console.log('Llamando proyectoModel.generarOTVersion(96)...');
    const result = await proyectoModel.generarOTVersion(96);
    console.log('OT GENERADA EXITOSAMENTE:');
    console.log(JSON.stringify(result, null, 2));

    const pool = require('./src/config/postgresPool');
    const { rows: relP } = await pool.query('SELECT rp.*, u.name_frst, u.apellido_pat, u.rut FROM tpry_rel_persona rp JOIN tsec_users u ON rp.id_user = u.id_user WHERE rp.id_proyecto = 96');
    console.log('TPRY_REL_PERSONA ROWS DESPUES DE SYNC:', relP);

    const { rows: relE } = await pool.query('SELECT re.*, e.patente, e.tipo, e.modelo FROM tpry_rel_equipo re JOIN tequ_equipo e ON re.id_equipo = e.id_equipo WHERE re.id_proyecto = 96');
    console.log('TPRY_REL_EQUIPO ROWS:', relE);
  } catch (err) {
    console.error('ERROR EN GENERACION OT:', err);
  } finally {
    process.exit(0);
  }
}
run();
`;

  await ssh.execCommand("cat << 'EOF' > /home/nodeadmin/proyectos/lean-services-gsp/test_ot_exec.js\n" + testScript + "\nEOF");
  await ssh.execCommand("chown nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp/test_ot_exec.js");
  const resOT = await ssh.execCommand('su - nodeadmin -c "cd /home/nodeadmin/proyectos/lean-services-gsp && node test_ot_exec.js"');
  console.log('TEST OT OUTPUT:\n', resOT.stdout);
  console.log('TEST OT ERRORS:\n', resOT.stderr);
  await ssh.execCommand("rm -f /home/nodeadmin/proyectos/lean-services-gsp/test_ot_exec.js");
  ssh.dispose();
}

testOT().catch(console.error);
