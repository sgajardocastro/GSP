const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function checkJson97() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const sql = `
\\x on
SELECT 
  json_field->'crm_v1'->'lineas_servicio' as lineas_servicio,
  json_field->'crm_v1'->'servicios' as servicios,
  json_field->'ejecucion_v1'->'tripulacion_asignada' as tripulacion,
  json_field->'ejecucion_v1'->'equipos_extra' as equipos_extra
FROM sch_leangsp_prod.tpry_proyecto WHERE id_proyecto = 97;
`;

  await ssh.execCommand("cat << 'EOF' > /tmp/check_json97.sql\n" + sql + "\nEOF");
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/check_json97.sql"');
  console.log(res.stdout);
  ssh.dispose();
}

checkJson97().catch(console.error);
