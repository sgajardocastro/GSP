const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function inspect75() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const scriptNode = `
  const fs = require('fs');
  const envContent = fs.readFileSync('/home/nodeadmin/proyectos/lean-services-gsp-prod/.env', 'utf8');
  envContent.split('\\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        let v = trimmed.substring(idx + 1).trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
        process.env[trimmed.substring(0, idx).trim()] = v;
      }
    }
  });

  const db = require('/home/nodeadmin/proyectos/lean-services-gsp-prod/src/config/postgresPool');

  (async () => {
    try {
      const { rows } = await db.query('SELECT id_proyecto, codi_proyecto, nombre_proyecto, json_field FROM sch_leangsp_prod.tpry_proyecto WHERE id_proyecto = 75');
      const p = rows[0];
      const jf = p.json_field || {};
      const crm = jf.crm_v1 || {};
      const its = jf.its_v1 || {};

      console.log('=== CRM V1 ===');
      console.log('Total neto cotizado:', crm.total_neto, crm.total_cotizacion);
      console.log('Lineas CRM:');
      console.log(JSON.stringify(crm.lineas_servicio || [], null, 2));

      console.log('=== ITS V1 ===');
      console.log('Total neto ITS:', its.total_neto, 'total_final:', its.total_final);
      console.log('Jornadas en ITS:');
      console.log(JSON.stringify(its.jornadas || [], null, 2));
      console.log('Lineas adicionales ITS:');
      console.log(JSON.stringify(its.lineas_adicionales || [], null, 2));

      const repRes = await db.query('SELECT dia_correlativo, fecha_reporte, id_equipo, horas_operadas, horas_facturables, horas_minimas, estado_reporte FROM sch_leangsp_prod.tedp_reporte_avance WHERE id_proyecto = 75 ORDER BY dia_correlativo ASC');
      console.log('=== REPORTS EN DB ===');
      console.log(JSON.stringify(repRes.rows, null, 2));

      const eqRes = await db.query('SELECT re.*, e.patente, e.modelo FROM sch_leangsp_prod.tpry_rel_equipo re JOIN sch_leangsp_prod.tequ_equipo e ON re.id_equipo = e.id_equipo WHERE re.id_proyecto = 75');
      console.log('=== EQUIPOS RELACIONALES ===');
      console.log(JSON.stringify(eqRes.rows, null, 2));

    } catch (e) {
      console.error(e);
    }
    process.exit(0);
  })();
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/inspect_75.js\n${scriptNode}\nEOF`);
  const res = await ssh.execCommand('su - nodeadmin -c "cd /home/nodeadmin/proyectos/lean-services-gsp-prod && node /tmp/inspect_75.js"');
  console.log(res.stdout);
  if (res.stderr) console.error(res.stderr);

  ssh.dispose();
}
inspect75().catch(console.error);
