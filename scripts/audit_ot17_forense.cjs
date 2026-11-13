const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const nodeScript = `
const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  user: 'usr_leangsp_prod',
  password: 'usr_gsp_prod_2026!',
  database: 'postgres',
  port: 5432
});

async function main() {
  try {
    console.log('=== 1. LOGS DE DESPLAZAMIENTO NICOLAS CEBALLOS (id_user_chofer = 45) O OT 56 ===');
    const r1 = await pool.query(\`
      SELECT id_log_desplazamiento, id_proyecto, id_equipo, patente, tipo_trayecto, 
             fecha_salida_patio, fecha_llegada_faena, fecha_salida_faena, fecha_llegada_patio,
             km_inicial, km_final, estado_trayecto, fecha_registro, id_user_chofer,
             device_timestamp_salida, device_timestamp_llegada
      FROM sch_leangsp_prod.tequ_log_desplazamiento 
      WHERE id_user_chofer = 45 OR id_proyecto = 56
      ORDER BY id_log_desplazamiento DESC;
    \`);
    console.log('R1 Rows:', r1.rows.length);
    console.log(JSON.stringify(r1.rows, null, 2));

    console.log('=== 2. REPORTES DE AVANCE NICOLAS CEBALLOS (id_user_operador = 45) O OT 56 ===');
    const r2 = await pool.query(\`
      SELECT id_reporte_avance, id_proyecto, id_user_operador, fecha_reporte,
             fecha_inicio_servicio, fecha_termino_servicio, horas_operadas, horas_facturables,
             estado_reporte, fecha_registro, device_timestamp, id_log_desplazamiento
      FROM sch_leangsp_prod.tedp_reporte_avance 
      WHERE id_user_operador = 45 OR id_proyecto = 56
      ORDER BY id_reporte_avance DESC;
    \`);
    console.log('R2 Rows:', r2.rows.length);
    console.log(JSON.stringify(r2.rows, null, 2));

    console.log('=== 3. TODOS LOS LOGS DE DESPLAZAMIENTO DEL DIA 2026-11-09 (HOY) ===');
    const r3 = await pool.query(\`
      SELECT id_log_desplazamiento, id_proyecto, id_user_chofer, patente, tipo_trayecto,
             fecha_salida_patio, fecha_llegada_faena, estado_trayecto, fecha_registro,
             device_timestamp_salida, device_timestamp_llegada
      FROM sch_leangsp_prod.tequ_log_desplazamiento
      WHERE fecha_registro::date = '2026-11-09' 
         OR fecha_salida_patio::date = '2026-11-09'
         OR fecha_programada::date = '2026-11-09'
      ORDER BY id_log_desplazamiento DESC;
    \`);
    console.log('R3 Rows (Hoy):', r3.rows.length);
    console.log(JSON.stringify(r3.rows, null, 2));

    console.log('=== 4. REPORTES DE AVANCE REGISTRADOS HOY (2026-11-09) ===');
    const r4 = await pool.query(\`
      SELECT id_reporte_avance, id_proyecto, id_user_operador, fecha_reporte,
             fecha_inicio_servicio, fecha_termino_servicio, fecha_registro, device_timestamp
      FROM sch_leangsp_prod.tedp_reporte_avance
      WHERE fecha_registro::date = '2026-11-09' OR fecha_reporte = '2026-11-09'
      ORDER BY id_reporte_avance DESC;
    \`);
    console.log('R4 Rows (Hoy):', r4.rows.length);
    console.log(JSON.stringify(r4.rows, null, 2));

  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await pool.end();
  }
}

main();
`;

  await ssh.execCommand("cat << 'EOF' > /tmp/audit_runner.js\n" + nodeScript + "\nEOF");
  const res = await ssh.execCommand('NODE_PATH=/home/nodeadmin/proyectos/lean-services-gsp-prod/node_modules node /tmp/audit_runner.js');
  console.log(res.stdout || res.stderr);

  ssh.dispose();
}

run().catch(console.error);
