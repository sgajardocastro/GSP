const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function fixTripulacionEquipoId() {
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
  if (jf.ejecucion_v1 && Array.isArray(jf.ejecucion_v1.tripulacion_asignada)) {
    jf.ejecucion_v1.tripulacion_asignada.forEach(t => {
      if (t.equipo_asignado_id === 52) {
        t.equipo_asignado_id = 53;
      }
    });
  }
  await pool.query("UPDATE sch_leangsp_prod.tpry_proyecto SET json_field = $1 WHERE id_proyecto = 97", [JSON.stringify(jf)]);
  
  const verify = await pool.query("SELECT json_field FROM sch_leangsp_prod.tpry_proyecto WHERE id_proyecto = 97");
  console.log('UPDATED tripulacion:', verify.rows[0].json_field.ejecucion_v1.tripulacion_asignada);
  process.exit(0);
}
test().catch(e => { console.error(e); process.exit(1); });
`;

  await ssh.execCommand("cat << 'EOF' > /tmp/fix_trip.js\n" + script + "\nEOF");
  const res = await ssh.execCommand('su - nodeadmin -c "node /tmp/fix_trip.js"');
  console.log('RESULT:\n', res.stdout, res.stderr);

  ssh.dispose();
}

fixTripulacionEquipoId().catch(console.error);
