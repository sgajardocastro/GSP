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

    async function check() {
      const pool = new Pool({
        user: 'usr_leangsp_prod',
        password: 'usr_gsp_prod_2026!',
        host: 'localhost',
        database: 'postgres',
        port: 5432
      });

      const cols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_schema = 'sch_leangsp_prod' AND table_name = 'tpry_rel_persona' ORDER BY ordinal_position;");
      console.log('Columns tpry_rel_persona:', cols.rows.map(c => c.column_name));

      const rel = await pool.query("SELECT * FROM sch_leangsp_prod.tpry_rel_persona WHERE id_proyecto = 32;");
      console.log('tpry_rel_persona OT 32:', rel.rows);

      const pry = await pool.query("SELECT id_proyecto, json_field->'ejecucion_v1'->'tripulacion_asignada' as tripulacion, json_field->'ejecucion_v1'->'equipos_asignados' as equipos FROM sch_leangsp_prod.tpry_proyecto WHERE id_proyecto = 32;");
      console.log('Tripulacion OT 32:', JSON.stringify(pry.rows[0], null, 2));

      // Buscar en tsec_users para usuarios 49, 13, 40
      const users = await pool.query("SELECT id_user, name_frst, apellido_pat, json_data, cargo FROM sch_leangsp_prod.tsec_users WHERE id_user IN (13, 40, 49, 21);");
      console.log('Usuarios:', users.rows);

      await pool.end();
    }
    check().catch(console.error);
  `;

  const b64 = Buffer.from(script).toString('base64');
  const res = await ssh.execCommand(`NODE_PATH=/home/nodeadmin/proyectos/lean-services-gsp-prod/node_modules node -e "eval(Buffer.from('${b64}', 'base64').toString('utf8'))"`);
  console.log('STDOUT:\n', res.stdout);
  console.log('STDERR:\n', res.stderr);
  ssh.dispose();
}

run().catch(console.error);
