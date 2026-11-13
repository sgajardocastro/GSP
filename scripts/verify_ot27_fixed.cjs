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
      // 1. tpry_rel_equipo
      const eq = await pool.query("SELECT r.*, e.patente, e.modelo, e.tipo_equipo FROM sch_leangsp_prod.tpry_rel_equipo r JOIN sch_leangsp_prod.tequ_equipo e ON r.id_equipo = e.id_equipo WHERE r.id_proyecto = 73;");
      console.log('--- VERIFICACIÓN REL_EQUIPO ---');
      console.log(JSON.stringify(eq.rows, null, 2));

      // 2. tequ_log_desplazamiento
      const desp = await pool.query("SELECT d.id_log_desplazamiento, d.id_proyecto, d.id_equipo, d.patente, d.estado_trayecto, d.fecha_salida_patio, d.fecha_llegada_faena FROM sch_leangsp_prod.tequ_log_desplazamiento d WHERE d.id_proyecto = 73;");
      console.log('--- VERIFICACIÓN LOG_DESPLAZAMIENTO ---');
      console.log(JSON.stringify(desp.rows, null, 2));

      // 3. tequ_equipo state
      const eq39 = await pool.query("SELECT id_equipo, patente, modelo, marca, estado FROM sch_leangsp_prod.tequ_equipo WHERE id_equipo IN (39, 40);");
      console.log('--- VERIFICACIÓN TEQU_EQUIPO ---');
      console.log(JSON.stringify(eq39.rows, null, 2));

      // 4. json_field summary
      const p = await pool.query("SELECT json_field FROM sch_leangsp_prod.tpry_proyecto WHERE id_proyecto = 73;");
      const j = p.rows[0].json_field || {};
      console.log('--- VERIFICACIÓN JSON_FIELD ---');
      console.log('crm lineas_servicio equipo_asignado_id:', j.crm_v1 && j.crm_v1.lineas_servicio && j.crm_v1.lineas_servicio[0] && j.crm_v1.lineas_servicio[0].equipo_asignado_id);
      console.log('ejecucion_v1 equipo_id:', j.ejecucion_v1 && j.ejecucion_v1.equipo_id);
      console.log('ejecucion_v1 tripulacion equipo_asignado_id:', j.ejecucion_v1 && j.ejecucion_v1.tripulacion_asignada && j.ejecucion_v1.tripulacion_asignada.map(t => t.equipo_asignado_id));

      await pool.end();
    }
    test().catch(console.error);
  `;

  const b64 = Buffer.from(script).toString('base64');
  const res = await ssh.execCommand(`cd /home/nodeadmin/proyectos/lean-services-gsp-prod && node -e "eval(Buffer.from('${b64}', 'base64').toString('utf8'))"`);
  console.log(res.stdout);
  if (res.stderr) console.error(res.stderr);

  ssh.dispose();
}

run().catch(console.error);
