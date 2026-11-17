const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const scriptNode = `
  const pool = require('/home/nodeadmin/proyectos/lean-services-gsp-prod/src/config/postgresPool');
  (async () => {
    try {
      const rep = await pool.query(\`
        SELECT ra.id_reporte_avance, TO_CHAR(ra.fecha_reporte, 'YYYY-MM-DD') as f, ra.horas_operadas, ra.horas_facturables, ra.id_equipo, e.patente, ra.token_report, ra.estado_reporte 
        FROM tedp_reporte_avance ra
        LEFT JOIN tequ_equipo e ON ra.id_equipo = e.id_equipo
        WHERE ra.id_proyecto = 75 
        ORDER BY ra.fecha_reporte ASC, ra.id_reporte_avance ASC
      \`);
      console.log('REPORTS:', JSON.stringify(rep.rows, null, 2));

      const jd = await pool.query(\`
        SELECT id_jornada, TO_CHAR(fecha, 'YYYY-MM-DD') as f, patente, tipo_servicio, horas_reales, horas_report, tarifa_hora, subtotal, id_reporte_avance, id_equipo 
        FROM tits_jornada_detalle 
        WHERE id_its = 14 
        ORDER BY id_jornada ASC
      \`);
      console.log('JORNADAS:', JSON.stringify(jd.rows, null, 2));
    } catch(e) {
      console.error('ERROR:', e);
    }
    process.exit(0);
  })();
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/inspect_75_details3.js\n${scriptNode}\nEOF`);
  const out = await ssh.execCommand('su - nodeadmin -c "cd /home/nodeadmin/proyectos/lean-services-gsp-prod && node /tmp/inspect_75_details3.js"');
  console.log(out.stdout);
  if (out.stderr) console.error(out.stderr);
  ssh.dispose();
}

run().catch(console.error);
