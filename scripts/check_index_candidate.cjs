const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function checkIndexCandidate() {
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
  console.log('=== AUDITORIA DE DUPLICADOS EXACTOS (id_proyecto, dia_correlativo, id_equipo) ===');
  const dupesEq = await pool.query(\`
    SELECT id_proyecto, dia_correlativo, id_equipo, COUNT(*) as total, array_agg(id_reporte_avance) as ids
    FROM sch_leangsp_prod.tedp_reporte_avance
    WHERE estado_reporte != 'ANULADO'
    GROUP BY id_proyecto, dia_correlativo, id_equipo
    HAVING COUNT(*) > 1
  \`);
  console.log('Duplicados de mismo equipo en mismo dia:', dupesEq.rows);

  console.log('=== AUDITORIA DE DUPLICADOS (id_proyecto, dia_correlativo) SIN FILTRO DE EQUIPO ===');
  const dupesDia = await pool.query(\`
    SELECT id_proyecto, dia_correlativo, COUNT(*) as total, array_agg(id_reporte_avance) as ids, array_agg(id_equipo) as eqs
    FROM sch_leangsp_prod.tedp_reporte_avance
    WHERE estado_reporte != 'ANULADO'
    GROUP BY id_proyecto, dia_correlativo
    HAVING COUNT(*) > 1
  \`);
  console.log('Duplicados de mismo dia en el proyecto:', dupesDia.rows);

  process.exit(0);
}
test().catch(function(e) { console.error(e); process.exit(1); });
`;

  await ssh.execCommand("cat << 'EOF' > /tmp/check_index.js\n" + script + "\nEOF");
  const res = await ssh.execCommand('su - nodeadmin -c "node /tmp/check_index.js"');
  console.log('RESULT:\n', res.stdout, res.stderr);

  ssh.dispose();
}

checkIndexCandidate().catch(console.error);
