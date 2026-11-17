const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function auditTomorrow() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const sql = `
SELECT 
  p.id_proyecto,
  p.codi_proyecto,
  p.nombre_proyecto,
  cli.razon_social as cliente_nombre,
  p.fecha_plan_ini,
  p.json_field->'ejecucion_v1'->>'fecha_salida_plan' as fecha_salida_plan,
  p.json_field->'ejecucion_v1'->>'hora_salida_plan' as hora_salida_plan,
  p.json_field->'ejecucion_v1'->'tripulacion_asignada' as tripulacion_json
FROM sch_leangsp_prod.tpry_proyecto p
LEFT JOIN sch_leangsp_prod.tpar_empresas cli ON p.id_empresa_cliente = cli.id_empresa
WHERE p.codi_proyecto LIKE 'GSP-2611-%'
  AND (
    p.nombre_proyecto ILIKE '%BESALCO%' 
    OR cli.razon_social ILIKE '%BESALCO%'
    OR p.json_field->'ejecucion_v1'->>'fecha_salida_plan' = '2026-11-17'
    OR p.fecha_plan_ini::date = '2026-11-17'
  )
ORDER BY p.id_proyecto DESC;
`;

  await ssh.execCommand("cat << 'EOF' > /tmp/audit_tomorrow.sql\n" + sql + "\nEOF");
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/audit_tomorrow.sql"');
  console.log(res.stdout);

  ssh.dispose();
}

auditTomorrow().catch(console.error);
