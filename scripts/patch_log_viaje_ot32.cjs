const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const script = `
    const { Pool } = require('pg');
    const pool = new Pool({
      user: 'usr_leangsp_prod',
      password: 'usr_gsp_prod_2026!',
      host: 'localhost',
      database: 'postgres',
      port: 5432
    });

    async function test() {
      // 1. Actualizar log 30 con tipo_trayecto = 'IDA_Y_RETORNO' y obs_termino
      await pool.query("UPDATE sch_leangsp_prod.tequ_log_desplazamiento SET tipo_trayecto = 'IDA_Y_RETORNO', obs_termino = 'Traslado y apoyo logístico en convoy a faena' WHERE id_log_desplazamiento = 30;");
      console.log('Log 30 actualizado con éxito.');

      // 2. Verificar en BD
      const res = await pool.query("SELECT id_log_desplazamiento, patente, tipo_trayecto, obs_termino FROM sch_leangsp_prod.tequ_log_desplazamiento WHERE id_log_desplazamiento = 30;");
      console.log('Log 30:', res.rows);

      await pool.end();
    }
    test().catch(console.error);
  `;

  const b64 = Buffer.from(script).toString('base64');
  const res = await ssh.execCommand(`NODE_PATH=/home/nodeadmin/proyectos/lean-services-gsp-prod/node_modules node -e "eval(Buffer.from('${b64}', 'base64').toString('utf8'))"`);
  console.log(res.stdout);
  if (res.stderr) console.error(res.stderr);
  ssh.dispose();
}

run().catch(console.error);
