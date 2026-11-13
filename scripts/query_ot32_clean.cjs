const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
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

    async function run() {
      // 1. Ver tablas tsec
      const tbls = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'sch_leangsp_prod' AND table_name LIKE 'tsec%';");
      console.log('Tablas tsec:', tbls.rows.map(function(r) { return r.table_name; }));

      // 2. tequ_log_desplazamiento
      const logs = await pool.query("SELECT id_log_desplazamiento, id_proyecto, id_equipo, patente, tipo_trayecto, fecha_salida_patio, fecha_llegada_faena, fecha_salida_faena, fecha_llegada_patio, id_user_chofer, token_viaje FROM sch_leangsp_prod.tequ_log_desplazamiento WHERE id_proyecto = 32 OR id_equipo = 73;");
      console.log('Logs OT 32 o Eq 73:', logs.rows);

      // 3. json_field de OT 32
      const pry = await pool.query("SELECT id_proyecto, codi_proyecto, json_field FROM sch_leangsp_prod.tpry_proyecto WHERE id_proyecto = 32;");
      const jf = typeof pry.rows[0].json_field === 'string' ? JSON.parse(pry.rows[0].json_field) : pry.rows[0].json_field;
      console.log('jf ejecucion_v1:', JSON.stringify(jf ? jf.ejecucion_v1 : null, null, 2));

      await pool.end();
    }
    run().catch(console.error);
  `;

  await ssh.execCommand(`cat << 'EOF' > /home/nodeadmin/proyectos/lean-services-gsp-prod/query_ot32.js\n${script}\nEOF`);
  const res = await ssh.execCommand('cd /home/nodeadmin/proyectos/lean-services-gsp-prod && node query_ot32.js');
  console.log(res.stdout);
  if (res.stderr) console.error(res.stderr);

  ssh.dispose();
}

main().catch(console.error);
