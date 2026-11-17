const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function inspectTotals() {
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
      // 1. Ver qué guardó el usuario en json_field->'its_v1'
      const { rows } = await db.query('SELECT json_field->\\'its_v1\\' as its, json_field->\\'crm_v1\\' as crm FROM sch_leangsp_prod.tpry_proyecto WHERE id_proyecto = 75');
      console.log('ITS_V1 JSON en tpry_proyecto:', JSON.stringify(rows[0].its, null, 2));

      // 2. Ver costos de personal guardados en tits_costo_operacional
      const cRes = await db.query('SELECT id_costo_item, categoria, id_personal, nombre_personal, cantidad_unidades, precio_unitario, monto_total FROM sch_leangsp_prod.tits_costo_operacional WHERE id_its = 14');
      console.log('COSTOS OPERACIONALES EN DB:', cRes.rows);

      // 3. Ver Estado de Pago
      const edpRes = await db.query('SELECT * FROM sch_leangsp_prod.tedp_estado_pago WHERE id_proyecto = 75');
      console.log('ESTADO DE PAGO EN DB:', edpRes.rows);
    } catch (e) {
      console.error(e);
    }
    process.exit(0);
  })();
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/inspect_75_totals.js\n${scriptNode}\nEOF`);
  const out = await ssh.execCommand('su - nodeadmin -c "cd /home/nodeadmin/proyectos/lean-services-gsp-prod && node /tmp/inspect_75_totals.js"');
  console.log(out.stdout);
  if (out.stderr) console.error(out.stderr);

  ssh.dispose();
}
inspectTotals().catch(console.error);
