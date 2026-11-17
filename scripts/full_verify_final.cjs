const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function fullVerification() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const script = `
require('/home/nodeadmin/proyectos/lean-services-gsp-prod/node_modules/dotenv').config({ path: '/home/nodeadmin/proyectos/lean-services-gsp-prod/.env' });
const pool = require('/home/nodeadmin/proyectos/lean-services-gsp-prod/src/config/postgresPool');
const ProyectoModel = require('/home/nodeadmin/proyectos/lean-services-gsp-prod/src/models/proyectoModel');
const pm = new ProyectoModel();

async function run() {
  console.log('--- 1. GET PROYECTO 97 ---');
  const p = await pm.getProyectoById(97);
  console.log('lineas_servicio[0].equipo_asignado_id:', p.json_field.crm_v1.lineas_servicio[0].equipo_asignado_id);
  console.log('ejecucion_v1.equipo_id:', p.json_field.ejecucion_v1.equipo_id);
  console.log('tripulacion[0].equipo_asignado_id:', p.json_field.ejecucion_v1.tripulacion_asignada[0].equipo_asignado_id);

  console.log('--- 2. TPRY_REL_EQUIPO ---');
  const resRel = await pool.query(
    "SELECT id_rel_equipo, id_equipo, e.patente, rol_equipo, estado_real FROM sch_leangsp_prod.tpry_rel_equipo re JOIN sch_leangsp_prod.tequ_equipo e ON re.id_equipo = e.id_equipo WHERE re.id_proyecto = 97"
  );
  console.log(resRel.rows);

  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
`;

  await ssh.execCommand("cat << 'EOF' > /tmp/full_verify.js\n" + script + "\nEOF");
  const res = await ssh.execCommand('su - nodeadmin -c "node /tmp/full_verify.js"');
  console.log('VERIFY RESULT:\n', res.stdout, res.stderr);

  ssh.dispose();
}

fullVerification().catch(console.error);
