const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function fixOT47() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const sql = `
BEGIN;

-- 1. Auditar estado previo de logs de desplazamiento para proyecto 97
SELECT id_log_desplazamiento, id_proyecto, id_equipo, id_user_chofer, patente, estado_trayecto, token_viaje 
FROM sch_leangsp_prod.tequ_log_desplazamiento 
WHERE id_proyecto = 97;

-- 2. Auditar estado previo de tpry_rel_equipo para proyecto 97
SELECT re.id_rel_equipo, re.id_proyecto, re.id_equipo, re.rol_equipo, re.estado_real, e.patente, e.modelo
FROM sch_leangsp_prod.tpry_rel_equipo re
JOIN sch_leangsp_prod.tequ_equipo e ON re.id_equipo = e.id_equipo
WHERE re.id_proyecto = 97;

-- 3. Marcar la grúa vieja CPYW.52-2 (id_equipo = 52) como REEMPLAZADO
UPDATE sch_leangsp_prod.tpry_rel_equipo
SET estado_real = 'REEMPLAZADO'
WHERE id_proyecto = 97 AND id_equipo = 52;

-- 4. Asegurar que la grúa correcta VYRK.90-2 (id_equipo = 53) quede como PRIMARIO / PROGRAMADO
UPDATE sch_leangsp_prod.tpry_rel_equipo
SET rol_equipo = 'GRUAS TELESCOPICAS', estado_real = 'PROGRAMADO'
WHERE id_proyecto = 97 AND id_equipo = 53;

-- 5. Asegurar que el camión de traslado RWJL.23-K (id_equipo = 79) quede como PROGRAMADO
UPDATE sch_leangsp_prod.tpry_rel_equipo
SET rol_equipo = 'Equipo Traslado', estado_real = 'PROGRAMADO'
WHERE id_proyecto = 97 AND id_equipo = 79;

-- 6. Actualizar cualquier log de desplazamiento de la grúa para que apunte a VYRK.90-2 (id_equipo = 53) y Jorge Saavedra (id_user = 87)
UPDATE sch_leangsp_prod.tequ_log_desplazamiento
SET id_equipo = 53, patente = 'VYRK.90-2', id_user_chofer = 87
WHERE id_proyecto = 97 AND id_equipo = 52;

-- Si ya existe log para 53, asegurar chofer = 87
UPDATE sch_leangsp_prod.tequ_log_desplazamiento
SET id_user_chofer = 87, patente = 'VYRK.90-2'
WHERE id_proyecto = 97 AND id_equipo = 53;

-- 7. Actualizar el json_field de la OT 47 para normalizar equipo_asignado_id: 53 para Jorge Saavedra
UPDATE sch_leangsp_prod.tpry_proyecto
SET json_field = jsonb_set(
  jsonb_set(
    json_field,
    '{crm_v1,lineas_servicio,0,equipo_asignado_id}',
    '53'::jsonb
  ),
  '{ejecucion_v1,tripulacion_asignada}',
  '[
    {"cargo": "Operador Grúa", "id_user": 87, "semaforo": "GREEN", "is_linea_base": true, "requerimiento": "HORAS MINIMAS DIARIAS GRUA 150 TONELADAS CERTIFICADA", "fecha_plan_fin": "2026-11-18", "fecha_plan_ini": "2026-11-17", "equipo_asignado_id": 53},
    {"cargo": "Rigger", "id_user": 102, "semaforo": "GREEN", "is_linea_base": true, "requerimiento": "Rigger - HORAS MINIMAS DIARIAS GRUA 150 TONELADAS CERTIFICADA", "fecha_plan_fin": "2026-11-18", "fecha_plan_ini": "2026-11-17", "equipo_asignado_id": 53},
    {"cargo": "Chofer Cama Baja", "id_user": 40, "semaforo": "GREEN", "is_linea_base": false, "requerimiento": "TRACTO CAMIÓN", "fecha_plan_fin": "2026-11-18", "fecha_plan_ini": "2026-11-17", "equipo_asignado_id": 79}
  ]'::jsonb
)
WHERE id_proyecto = 97;

-- 8. Auditar estado final de tpry_rel_equipo
SELECT re.id_rel_equipo, re.id_proyecto, re.id_equipo, re.rol_equipo, re.estado_real, e.patente, e.modelo
FROM sch_leangsp_prod.tpry_rel_equipo re
JOIN sch_leangsp_prod.tequ_equipo e ON re.id_equipo = e.id_equipo
WHERE re.id_proyecto = 97;

COMMIT;
`;

  await ssh.execCommand("cat << 'EOF' > /tmp/fix_ot47.sql\n" + sql + "\nEOF");
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/fix_ot47.sql"');
  console.log('=== SALIDA FIX SQL ===');
  console.log(res.stdout);
  if (res.stderr) console.error('=== STDERR ===', res.stderr);

  ssh.dispose();
}

fixOT47().catch(console.error);
