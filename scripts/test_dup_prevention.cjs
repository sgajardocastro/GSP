const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function testDuplicationPrevention() {
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
  console.log('--- TEST 1: Intento de insertar duplicado directo en BD ---');
  try {
    // Intentar insertar un duplicado en OT 33 para Dia 12 con equipo 56
    await pool.query(\`
      INSERT INTO sch_leangsp_prod.tedp_reporte_avance (
        id_proyecto, id_equipo, dia_correlativo, fecha_reporte, estado_reporte
      ) VALUES (33, 56, 12, '2026-11-12', 'REGULARIZADO_MANUAL')
    \`);
    console.error('FALLO: El índice no bloqueó el duplicado!');
  } catch (err) {
    console.log('EXITO: La BD bloqueó el duplicado:', err.message);
  }

  process.exit(0);
}
test().catch(function(e) { console.error(e); process.exit(1); });
`;

  await ssh.execCommand("cat << 'EOF' > /tmp/test_dup_prevention.js\n" + script + "\nEOF");
  const res = await ssh.execCommand('su - nodeadmin -c "node /tmp/test_dup_prevention.js"');
  console.log('RESULT:\n', res.stdout, res.stderr);

  ssh.dispose();
}

testDuplicationPrevention().catch(console.error);
