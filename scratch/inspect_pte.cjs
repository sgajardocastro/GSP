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

  const sql1 = `
SELECT 
  json_field->'contrato_arriendo' AS contrato_top,
  json_field->'crm_v1'->'contrato' AS contrato_crm
FROM sch_leangsp_prod.tpry_proyecto
WHERE id_proyecto = 90;
`;
  await ssh.execCommand(`cat << 'EOF' > /tmp/query_eq129.sql\n${sql1}\nEOF`);
  const res1 = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/query_eq129.sql"');
  console.log('--- CONTRATO PROYECTO 90 ---');
  console.log(res1.stdout);
  console.log(res1.stderr);

  // Ver contrato 90 en tcrm_contrato o similar y en tpry_proyecto
  const sql2 = `
SELECT * FROM sch_leangsp_prod.tpry_proyecto WHERE id_proyecto = 90;
`;
  await ssh.execCommand(`cat << 'EOF' > /tmp/query_pte_all.sql\n${sql2}\nEOF`);
  const res2 = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/query_pte_all.sql"');
  console.log('--- PROYECTO 90 ---');
  console.log(res2.stdout);
  console.log(res2.stderr);

  ssh.dispose();
}

run().catch(console.error);
