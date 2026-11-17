const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function find0029() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const q = `
  SELECT id_proyecto, codi_proyecto, nombre_proyecto, id_proyecto_estado, 
         (json_field->'crm_v1'->>'total_neto') as crm_neto,
         (json_field->'its_v1'->>'total_final') as its_final,
         (json_field->'its_v1'->>'total_neto') as its_neto
  FROM sch_leangsp_prod.tpry_proyecto 
  WHERE codi_proyecto ILIKE '%29%' OR id_proyecto = 29
  ORDER BY id_proyecto;
  `;
  await ssh.execCommand(`cat << 'EOF' > /tmp/q_29_prod.sql\n${q}\nEOF`);
  const resProd = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/q_29_prod.sql"');
  console.log('=== PROD ===\n', resProd.stdout);

  const qDev = `
  SELECT id_proyecto, codi_proyecto, nombre_proyecto, id_proyecto_estado, 
         (json_field->'crm_v1'->>'total_neto') as crm_neto,
         (json_field->'its_v1'->>'total_final') as its_final,
         (json_field->'its_v1'->>'total_neto') as its_neto
  FROM sch_leangsp.tpry_proyecto 
  WHERE codi_proyecto ILIKE '%29%' OR id_proyecto = 29
  ORDER BY id_proyecto;
  `;
  await ssh.execCommand(`cat << 'EOF' > /tmp/q_29_dev.sql\n${qDev}\nEOF`);
  const resDev = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/q_29_dev.sql"');
  console.log('=== DEV ===\n', resDev.stdout);

  ssh.dispose();
}
find0029().catch(console.error);
