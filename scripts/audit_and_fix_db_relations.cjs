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

    async function checkSchema(schemaName, user, pass) {
      console.log('=== VERIFICANDO ESQUEMA ' + schemaName + ' ===');
      const pool = new Pool({
        user: user,
        password: pass,
        host: 'localhost',
        database: 'postgres',
        port: 5432
      });

      try {
        const cols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_schema = '" + schemaName + "' AND table_name = 'tedp_reporte_avance' ORDER BY ordinal_position;");
        console.log('Columns tedp_reporte_avance:', cols.rows.map(c => c.column_name));

        const rep32 = await pool.query("SELECT id_reporte_avance, id_proyecto, id_equipo, id_user_operador, id_user_rigger, token_report, fecha_reporte FROM " + schemaName + ".tedp_reporte_avance WHERE id_proyecto = 32;");
        console.log('Reportes OT 32:', rep32.rows);

        const log32 = await pool.query("SELECT id_log_desplazamiento, id_proyecto, id_equipo, patente, id_user_chofer, tipo_trayecto, obs_termino FROM " + schemaName + ".tequ_log_desplazamiento WHERE id_proyecto = 32;");
        console.log('Logs OT 32:', log32.rows);

        const rel32 = await pool.query("SELECT rp.id_rel_persona, rp.id_proyecto, rp.id_user, rp.rol_personal, u.name_frst, u.apellido_pat FROM " + schemaName + ".tpry_rel_persona rp JOIN " + schemaName + ".tsec_users u ON rp.id_user = u.id_user WHERE rp.id_proyecto = 32;");
        console.log('Rel personas OT 32:', rel32.rows);

        const pry32 = await pool.query("SELECT id_proyecto, json_field->'ejecucion_v1'->'tripulacion_asignada' as tripulacion, json_field->'ejecucion_v1'->'equipos_asignados' as equipos FROM " + schemaName + ".tpry_proyecto WHERE id_proyecto = 32;");
        console.log('Tripulacion json OT 32:', JSON.stringify(pry32.rows[0], null, 2));
      } catch (err) {
        console.error('Error in ' + schemaName + ':', err);
      } finally {
        await pool.end();
      }
    }

    async function main() {
      await checkSchema('sch_leangsp_prod', 'usr_leangsp_prod', 'usr_gsp_prod_2026!');
      await checkSchema('sch_leangsp', 'usr_leangsp', 'usr_gsp_123');
    }
    main().catch(console.error);
  `;

  const b64 = Buffer.from(script).toString('base64');
  const res = await ssh.execCommand(`NODE_PATH=/home/nodeadmin/proyectos/lean-services-gsp-prod/node_modules node -e "eval(Buffer.from('${b64}', 'base64').toString('utf8'))"`);
  console.log('STDOUT:\n', res.stdout);
  console.log('STDERR:\n', res.stderr);
  ssh.dispose();
}

run().catch(console.error);
