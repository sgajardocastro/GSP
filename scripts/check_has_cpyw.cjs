const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const sql = `
SELECT 
  id_proyecto,
  codi_proyecto,
  (json_field::text LIKE '%CPYW%') as has_cpyw,
  (json_field::text LIKE '%52%') as has_52,
  json_field->'crm_v1'->'lineas_servicio'->0->'equipo_asignado_id' as linea0_eq,
  json_field->'ejecucion_v1'->'equipo_id' as ejec_eq
FROM sch_leangsp_prod.tpry_proyecto 
WHERE id_proyecto = 97;
`;

  await ssh.execCommand("cat << 'EOF' > /tmp/check_cpyw.sql\n" + sql + "\nEOF");
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/check_cpyw.sql"');
  console.log(res.stdout);
  ssh.dispose();
}

run().catch(console.error);
