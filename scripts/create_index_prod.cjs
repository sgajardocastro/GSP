const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function createIndexAndLock() {
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
  const client = await pool.connect();
  try {
    console.log('CREANDO INDICE UNICO UQ(id_proyecto, dia_correlativo, id_equipo)...');
    await client.query(\`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_tedp_proyecto_dia_equipo
      ON sch_leangsp_prod.tedp_reporte_avance (id_proyecto, dia_correlativo, id_equipo)
      WHERE estado_reporte != 'ANULADO'
    \`);
    console.log('INDICE CREADO EXITOSAMENTE EN sch_leangsp_prod.');

    // Verificar indices
    const res = await client.query(\`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE schemaname = 'sch_leangsp_prod' AND tablename = 'tedp_reporte_avance' AND indexname = 'uq_tedp_proyecto_dia_equipo'
    \`);
    console.log('INDICE CONFIRMADO:', res.rows[0]);
  } catch (e) {
    console.error('ERROR CREANDO INDICE:', e);
  } finally {
    client.release();
    process.exit(0);
  }
}
test().catch(function(e) { console.error(e); process.exit(1); });
`;

  await ssh.execCommand("cat << 'EOF' > /tmp/create_index_prod.js\n" + script + "\nEOF");
  const res = await ssh.execCommand('su - nodeadmin -c "node /tmp/create_index_prod.js"');
  console.log('RESULT:\n', res.stdout, res.stderr);

  ssh.dispose();
}

createIndexAndLock().catch(console.error);
