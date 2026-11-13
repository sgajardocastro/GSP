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

    async function patch() {
      // 1. PROD
      const poolProd = new Pool({
        user: 'usr_leangsp_prod',
        password: 'usr_gsp_prod_2026!',
        host: 'localhost',
        database: 'postgres',
        port: 5432
      });
      await poolProd.query("UPDATE sch_leangsp_prod.tequ_log_desplazamiento SET tipo_trayecto = 'IDA_Y_RETORNO', obs_termino = 'Traslado y apoyo logístico en convoy a faena' WHERE id_proyecto = 32 AND (id_equipo = 79 OR patente = 'RWJL.23-K');");
      const resProd = await poolProd.query("SELECT id_log_desplazamiento, patente, tipo_trayecto, obs_termino FROM sch_leangsp_prod.tequ_log_desplazamiento WHERE id_proyecto = 32;");
      console.log('Logs PROD OT 32:', resProd.rows);
      await poolProd.end();

      // 2. DEV
      const poolDev = new Pool({
        user: 'usr_leangsp',
        password: 'usr_gsp_dev_2026!',
        host: 'localhost',
        database: 'postgres',
        port: 5432
      });
      await poolDev.query("UPDATE sch_leangsp.tequ_log_desplazamiento SET tipo_trayecto = 'IDA_Y_RETORNO', obs_termino = 'Traslado y apoyo logístico en convoy a faena' WHERE id_proyecto = 32 AND (id_equipo = 79 OR patente = 'RWJL.23-K');");
      const resDev = await poolDev.query("SELECT id_log_desplazamiento, patente, tipo_trayecto, obs_termino FROM sch_leangsp.tequ_log_desplazamiento WHERE id_proyecto = 32;");
      console.log('Logs DEV OT 32:', resDev.rows);
      await poolDev.end();
    }
    patch().catch(console.error);
  `;

  const b64 = Buffer.from(script).toString('base64');
  const res = await ssh.execCommand(`NODE_PATH=/home/nodeadmin/proyectos/lean-services-gsp-prod/node_modules node -e "eval(Buffer.from('${b64}', 'base64').toString('utf8'))"`);
  console.log(res.stdout);
  ssh.dispose();
}

run().catch(console.error);
