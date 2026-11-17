const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function checkRel() {
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
  const res = await pool.query(
    "SELECT re.id_rel_equipo, re.id_equipo, e.patente, re.rol_equipo, re.fecha_plan_ini, re.estado_real FROM sch_leangsp_prod.tpry_rel_equipo re JOIN sch_leangsp_prod.tequ_equipo e ON re.id_equipo = e.id_equipo WHERE re.id_proyecto = 97 ORDER BY re.fecha_plan_ini ASC, re.id_rel_equipo ASC"
  );
  console.log('ROWS IN TPRY_REL_EQUIPO:');
  console.log(JSON.stringify(res.rows, null, 2));

  const resPersona = await pool.query(
    "SELECT rp.id_rel_persona, rp.id_user, u.name_frst || ' ' || u.apellido_pat as nombre, rp.rol_asignado, rp.estado_real FROM sch_leangsp_prod.tpry_rel_persona rp JOIN sch_leangsp_prod.tusr_usuarios u ON rp.id_user = u.id_user WHERE rp.id_proyecto = 97"
  );
  console.log('ROWS IN TPRY_REL_PERSONA:');
  console.log(JSON.stringify(resPersona.rows, null, 2));

  process.exit(0);
}
test().catch(e => { console.error(e); process.exit(1); });
`;

  await ssh.execCommand("cat << 'EOF' > /tmp/check_rel2.js\n" + script + "\nEOF");
  const res = await ssh.execCommand('su - nodeadmin -c "node /tmp/check_rel2.js"');
  console.log('RESULT:\n', res.stdout, res.stderr);

  ssh.dispose();
}

checkRel().catch(console.error);
