const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function checkAllActiveOTs() {
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
  cli.razon_social as cliente,
  p.fecha_plan_ini,
  p.json_field->'ejecucion_v1'->>'fecha_salida_plan' as f_salida,
  p.json_field->'ejecucion_v1'->>'hora_salida_plan' as h_salida,
  jsonb_array_length(COALESCE(p.json_field->'ejecucion_v1'->'tripulacion_asignada', '[]'::jsonb)) as total_trip_json,
  (SELECT COUNT(*) FROM sch_leangsp_prod.tpry_rel_persona rp WHERE rp.id_proyecto = p.id_proyecto AND COALESCE(rp.estado_real, 'PROGRAMADO') NOT IN ('CANCELADO', 'REEMPLAZADO')) as total_trip_rel
FROM sch_leangsp_prod.tpry_proyecto p
LEFT JOIN sch_leangsp_prod.tpar_empresas cli ON p.id_empresa_cliente = cli.id_empresa
WHERE p.id_proyecto_estado = 5 AND p.codi_proyecto LIKE 'GSP-2611-%'
ORDER BY p.id_proyecto DESC;
`;

  await ssh.execCommand("cat << 'EOF' > /tmp/check_all_active.sql\n" + sql + "\nEOF");
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/check_all_active.sql"');
  console.log(res.stdout);

  ssh.dispose();
}

checkAllActiveOTs().catch(console.error);
