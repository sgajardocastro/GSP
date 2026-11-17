const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const remoteScript = `
require('dotenv').config();
const pool = require('./src/config/postgresPool');

async function inspect96() {
  const { rows } = await pool.query('SELECT json_field FROM tpry_proyecto WHERE id_proyecto = $1', [96]);
  const jf = rows[0].json_field || {};
  console.log('CRM_V1 LINEAS:', JSON.stringify(jf.crm_v1?.lineas_servicio, null, 2));
  console.log('CRM_V1 SERVICIOS:', JSON.stringify(jf.crm_v1?.servicios, null, 2));
  console.log('EJECUCION_V1:', JSON.stringify(jf.ejecucion_v1, null, 2));
  
  const { rows: eqRows } = await pool.query('SELECT * FROM tpry_rel_equipo WHERE id_proyecto = $1', [96]);
  console.log('REL_EQUIPO:', eqRows);

  process.exit(0);
}
inspect96().catch(console.error);
`;

  await ssh.execCommand("cat << 'EOF' > /home/nodeadmin/proyectos/lean-services-gsp/inspect_96.js\n" + remoteScript + "\nEOF");
  await ssh.execCommand("chown nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp/inspect_96.js");
  const res = await ssh.execCommand('su - nodeadmin -c "cd /home/nodeadmin/proyectos/lean-services-gsp && node inspect_96.js"');
  console.log('REMOTE OUTPUT:\n', res.stdout || res.stderr);

  await ssh.execCommand("rm -f /home/nodeadmin/proyectos/lean-services-gsp/inspect_96.js");
  ssh.dispose();
}

run().catch(console.error);
