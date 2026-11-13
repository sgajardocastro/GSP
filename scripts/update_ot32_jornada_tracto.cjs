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

    async function applyUpdate() {
      // 1. Actualizar jornada 44 de id_its = 9 a Tracto Camión RWJL.23-K (id_equipo 79)
      const qUp = \`
        UPDATE sch_leangsp_prod.tits_jornada_detalle
        SET id_equipo = 79,
            patente = 'RWJL.23-K',
            tipo_servicio = 'Registro de Viaje',
            numero_report = 'VIAJE-32-30',
            hora_salida = '13:00',
            hora_llegada = '13:42',
            hora_termino = '16:03',
            hora_retorno = '16:41'
        WHERE id_its = 9 AND id_jornada = 44
        RETURNING id_jornada, id_its, id_equipo, patente, tipo_servicio, numero_report;
      \`;
      const resUp = await pool.query(qUp);
      console.log('Jornada actualizada en PROD:', resUp.rows);

      // 2. Verificar estado final de jornadas de id_its = 9
      const resJ = await pool.query("SELECT id_jornada, id_its, id_equipo, patente, tipo_servicio, numero_report, hora_salida, hora_retorno FROM sch_leangsp_prod.tits_jornada_detalle WHERE id_its = 9 ORDER BY orden ASC, id_jornada ASC;");
      console.log('Jornadas id_its = 9 en PROD:', resJ.rows);

      await pool.end();
    }
    applyUpdate().catch(console.error);
  `;

  const b64 = Buffer.from(script).toString('base64');
  const res = await ssh.execCommand(`NODE_PATH=/home/nodeadmin/proyectos/lean-services-gsp-prod/node_modules node -e "eval(Buffer.from('${b64}', 'base64').toString('utf8'))"`);
  console.log(res.stdout);
  if (res.stderr) console.error(res.stderr);
  ssh.dispose();
}

run().catch(console.error);
