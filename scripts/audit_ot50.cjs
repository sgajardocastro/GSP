const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function auditOT50() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const sql = `
\\x on
SELECT 
  id_proyecto, codi_proyecto, nombre_proyecto, fecha_plan_ini, 
  json_field->'ejecucion_v1'->>'fecha_salida_plan' as f_salida,
  json_field->'ejecucion_v1'->>'hora_salida_plan' as h_salida,
  json_field->'ejecucion_v1'->'tripulacion_asignada' as tripulacion_json,
  json_field->'ejecucion_v1'->'ot_versiones' as ot_versiones
FROM sch_leangsp_prod.tpry_proyecto 
WHERE id_proyecto = 102;

\\x off
SELECT u.id_user, u.name_frst || ' ' || u.apellido_pat as nombre, u.email, u.rut
FROM sch_leangsp_prod.tsec_users u
WHERE u.id_user = 44;

SELECT e.id_equipo, e.codigo_interno, e.patente, e.tipo_equipo, e.modelo, e.marca
FROM sch_leangsp_prod.tequ_equipo e
WHERE e.id_equipo = 58;

SELECT rp.id_rel_persona, rp.id_proyecto, rp.id_user, rp.rol_asignado, rp.estado_real,
       u.name_frst || ' ' || u.apellido_pat as nombre
FROM sch_leangsp_prod.tpry_rel_persona rp
JOIN sch_leangsp_prod.tsec_users u ON rp.id_user = u.id_user
WHERE rp.id_proyecto = 102;

SELECT re.id_rel_equipo, re.id_proyecto, re.id_equipo, re.rol_equipo, re.estado_real,
       e.patente, e.modelo
FROM sch_leangsp_prod.tpry_rel_equipo re
JOIN sch_leangsp_prod.tequ_equipo e ON re.id_equipo = e.id_equipo
WHERE re.id_proyecto = 102;

SELECT ld.id_log_desplazamiento, ld.id_proyecto, ld.id_equipo, ld.id_user_chofer, ld.patente,
       ld.estado_trayecto, ld.token_viaje, u.name_frst || ' ' || u.apellido_pat as chofer_nombre
FROM sch_leangsp_prod.tequ_log_desplazamiento ld
LEFT JOIN sch_leangsp_prod.tsec_users u ON ld.id_user_chofer = u.id_user
WHERE ld.id_proyecto = 102;
`;

  await ssh.execCommand("cat << 'EOF' > /tmp/audit_ot50.sql\n" + sql + "\nEOF");
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/audit_ot50.sql"');
  console.log(res.stdout);

  ssh.dispose();
}

auditOT50().catch(console.error);
