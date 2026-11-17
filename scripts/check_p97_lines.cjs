const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkProject97() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const sql = `
SELECT 
  json_field->'crm_v1'->'lineas_servicio' as lineas_crm,
  json_field->'ejecucion_v1'->'tripulacion_asignada' as tripulacion_ejec
FROM sch_leangsp_prod.tpry_proyecto WHERE codi_proyecto = 'GSP-2611-00047';
`;

  await ssh.execCommand(`cat << 'EOF' > /tmp/query_p97_lines.sql\n${sql}\nEOF`);
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/query_p97_lines.sql"');
  console.log(res.stdout);
  ssh.dispose();
}

checkProject97().catch(console.error);
