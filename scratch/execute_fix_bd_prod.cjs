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

  const workerScript = `
const { Pool } = require('./node_modules/pg');

async function corregirBD() {
  const pool = new Pool({
    connectionString: 'postgres://usr_leangsp_prod:usr_gsp_prod_2026!@localhost:5432/postgres'
  });
  const client = await pool.connect();

  try {
    console.log('--- 1. Actualizando tequ_equipo para id_equipo = 43 ---');
    const resEq = await client.query(\`
      UPDATE sch_leangsp_prod.tequ_equipo
      SET horometro_chasis_acumulado = 2520.00
      WHERE id_equipo = 43
      RETURNING id_equipo, patente, horometro_chasis_acumulado, odometro_acumulado
    \`);
    console.log('Equipo 43 actualizado:', resEq.rows);

    console.log('--- 2. Actualizando tequ_log_desplazamiento viaje 87 ---');
    const resVj = await client.query(\`
      UPDATE sch_leangsp_prod.tequ_log_desplazamiento
      SET horometro_inicial = 2520.00, horometro_final = 2520.00
      WHERE id_log_desplazamiento = 87
      RETURNING id_log_desplazamiento, id_equipo, horometro_inicial, horometro_final
    \`);
    console.log('Viaje 87 actualizado:', resVj.rows);

  } catch (err) {
    console.error('Error corrigiendo BD:', err);
  } finally {
    client.release();
    await pool.end();
  }
}
corregirBD();
`;

  await ssh.execCommand(`cat << 'EOF' > /home/nodeadmin/proyectos/lean-services-gsp-prod/fix_bd_horometro.js\n${workerScript}\nEOF`);

  const res = await ssh.execCommand('node fix_bd_horometro.js', {
    cwd: '/home/nodeadmin/proyectos/lean-services-gsp-prod'
  });

  console.log('STDOUT:\n', res.stdout);
  console.log('STDERR:\n', res.stderr);

  await ssh.execCommand('rm -f /home/nodeadmin/proyectos/lean-services-gsp-prod/fix_bd_horometro.js');

  ssh.dispose();
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
