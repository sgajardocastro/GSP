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
      const sample = await pool.query("SELECT id_log_desplazamiento, id_equipo, patente, tipo_trayecto, obs_termino FROM sch_leangsp_prod.tequ_log_desplazamiento WHERE id_proyecto = 32;");
      console.log('Sample OT 32:', sample.rows);

      // Verificar Matías Barrales en costos de id_its = 9
      const mbCostos = await pool.query("SELECT * FROM sch_leangsp_prod.tits_costo_operacional WHERE id_its = 9 AND (id_personal = 13 OR UPPER(nombre_personal) LIKE '%BARRALES%');");
      console.log('Matías Barrales en tits_costo_operacional (id_its = 9):', mbCostos.rows);

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
