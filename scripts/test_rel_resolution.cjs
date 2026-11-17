const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function testRelationalResolution() {
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
  // Simular la resolucion de fecha para OT 00004 (id_proyecto = 33)
  // 1. Fecha 2026-11-02 (debe dar equipo 57: TRPS.20-8)
  const q1 = await pool.query(
    \`SELECT re.id_equipo, e.patente FROM sch_leangsp_prod.tpry_rel_equipo re JOIN sch_leangsp_prod.tequ_equipo e ON re.id_equipo = e.id_equipo
     WHERE re.id_proyecto = 33 AND re.estado_real = 'PROGRAMADO'
       AND ('2026-11-02'::date BETWEEN re.fecha_plan_ini::date AND re.fecha_plan_fin::date OR re.fecha_plan_ini IS NULL)
     ORDER BY re.fecha_plan_ini DESC LIMIT 1\`
  );
  console.log('Resolucion fecha 2026-11-02:', q1.rows[0]);

  // 2. Fecha 2026-11-12 (debe dar equipo 56: RSPL.82-3)
  const q2 = await pool.query(
    \`SELECT re.id_equipo, e.patente FROM sch_leangsp_prod.tpry_rel_equipo re JOIN sch_leangsp_prod.tequ_equipo e ON re.id_equipo = e.id_equipo
     WHERE re.id_proyecto = 33 AND re.estado_real = 'PROGRAMADO'
       AND ('2026-11-12'::date BETWEEN re.fecha_plan_ini::date AND re.fecha_plan_fin::date OR re.fecha_plan_ini IS NULL)
     ORDER BY re.fecha_plan_ini DESC LIMIT 1\`
  );
  console.log('Resolucion fecha 2026-11-12:', q2.rows[0]);

  process.exit(0);
}
test().catch(function(e) { console.error(e); process.exit(1); });
`;

  await ssh.execCommand("cat << 'EOF' > /tmp/test_rel_res.js\n" + script + "\nEOF");
  const res = await ssh.execCommand('su - nodeadmin -c "node /tmp/test_rel_res.js"');
  console.log('RESULT:\n', res.stdout, res.stderr);

  ssh.dispose();
}

testRelationalResolution().catch(console.error);
