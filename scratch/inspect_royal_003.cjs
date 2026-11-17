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
SELECT id_proyecto, codi_proyecto, nombre_proyecto, id_empresa, json_field->'contrato_arriendo'->>'numero_contrato' as num_contrato, json_field->'contrato_arriendo'->>'equipo_asignado' as equipo, json_field->'contrato_arriendo'->>'nro_serie' as serie
FROM sch_leangsp_prod.tpry_proyecto
WHERE json_field::text ILIKE '%CTR-2026-0090%' OR json_field::text ILIKE '%PUMAHUE%' OR json_field::text ILIKE '%XUG0147%';
`;
  await ssh.execCommand(`cat << 'EOF' > /tmp/query_royal2.sql\n${sql1}\nEOF`);
  const res1 = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/query_royal2.sql"');
  console.log('--- PROYECTO CTR-2026-0090 ---');
  console.log(res1.stdout);

  // Buscar equipo PTE-86 o PTE 86 o en tequ_equipo
  const sql2 = `
SELECT id_equipo, patente, modelo, marca, nro_serie, nro_motor, tipo_equipo, codigo_interno, id_empresa
FROM sch_leangsp_prod.tequ_equipo
WHERE patente ILIKE '%PTE%' OR modelo ILIKE '%PTE%' OR codigo_interno ILIKE '%PTE%' OR nro_serie ILIKE '%PTE%' OR patente ILIKE '%86%' OR codigo_interno ILIKE '%86%';
`;
  await ssh.execCommand(`cat << 'EOF' > /tmp/query_pte2.sql\n${sql2}\nEOF`);
  const res2 = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/query_pte2.sql"');
  console.log('--- EQUIPOS PTE / 86 ---');
  console.log(res2.stdout);

  ssh.dispose();
}

run().catch(console.error);
