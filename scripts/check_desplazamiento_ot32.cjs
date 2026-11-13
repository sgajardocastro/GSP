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
      const q = "SELECT ld.id_log_desplazamiento, ld.id_equipo, e.patente, e.modelo, e.tipo_equipo, ld.id_user_chofer, u.name_frst || ' ' || u.apellido_pat as chofer, ld.tipo_trayecto, ld.fecha_salida_patio, ld.fecha_llegada_faena, ld.fecha_salida_faena, ld.fecha_llegada_patio FROM sch_leangsp_prod.tequ_log_desplazamiento ld LEFT JOIN sch_leangsp_prod.tequ_equipo e ON ld.id_equipo = e.id_equipo LEFT JOIN sch_leangsp_prod.tsec_users u ON ld.id_user_chofer = u.id_user WHERE ld.id_proyecto = 32 ORDER BY ld.id_log_desplazamiento;";
      const res = await pool.query(q);
      console.log('PROD tequ_log_desplazamiento (OT 32):', JSON.stringify(res.rows, null, 2));

      const qJornadas = "SELECT id_jornada, id_its, fecha, id_equipo, patente, tipo_servicio, hora_salida, hora_llegada, hora_termino, hora_retorno, horas_report, numero_report FROM sch_leangsp_prod.tits_jornada_detalle WHERE id_its = 9 ORDER BY orden ASC, id_jornada ASC;";
      const resJ = await pool.query(qJornadas);
      console.log('PROD tits_jornada_detalle (id_its = 9):', JSON.stringify(resJ.rows, null, 2));

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
