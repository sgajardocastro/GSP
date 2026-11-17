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
  json_field->'crm_v1'->'servicios' as servicios,
  json_field->'crm_v1'->'cotizaciones_historicas' as cotizaciones_historicas,
  json_field->'crm_v1'->'snapshot_comercial' as snapshot_comercial
FROM sch_leangsp_prod.tpry_proyecto WHERE id_proyecto = 97;
`;

  await ssh.execCommand("cat << 'EOF' > /tmp/check_servicios.sql\n" + sql + "\nEOF");
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/check_servicios.sql"');
  console.log(res.stdout);
  ssh.dispose();
}

run().catch(console.error);
