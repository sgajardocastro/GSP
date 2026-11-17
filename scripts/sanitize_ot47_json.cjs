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
BEGIN;

-- 1. Ver estado actual de json_field antes del cambio
SELECT 
  json_field->'crm_v1'->'lineas_servicio'->0->'equipo_asignado_id' as eq_linea0,
  json_field->'crm_v1'->'lineas_servicio'->0->'operador_asignado_id' as op_linea0,
  json_field->'crm_v1'->'lineas_servicio'->0->'rigger_asignado_id' as rig_linea0,
  json_field->'ejecucion_v1'->'equipo_id' as eq_ejecucion
FROM sch_leangsp_prod.tpry_proyecto 
WHERE id_proyecto = 97;

-- 2. Actualizar json_field en crm_v1.lineas_servicio y ejecucion_v1
UPDATE sch_leangsp_prod.tpry_proyecto
SET json_field = jsonb_set(
  jsonb_set(
    jsonb_set(
      json_field,
      '{crm_v1,lineas_servicio,0,equipo_asignado_id}',
      '53'::jsonb
    ),
    '{crm_v1,lineas_servicio,0,operador_asignado_id}',
    '87'::jsonb
  ),
  '{ejecucion_v1,equipo_id}',
  '53'::jsonb
)
WHERE id_proyecto = 97;

-- 3. Si existe crm_v1.servicios, actualizar primario.equipo_asignado_id y operador_asignado_id
DO $$
DECLARE
  v_json jsonb;
BEGIN
  SELECT json_field INTO v_json FROM sch_leangsp_prod.tpry_proyecto WHERE id_proyecto = 97;
  IF v_json->'crm_v1' ? 'servicios' AND jsonb_array_length(v_json->'crm_v1'->'servicios') > 0 THEN
    UPDATE sch_leangsp_prod.tpry_proyecto
    SET json_field = jsonb_set(
      jsonb_set(
        json_field,
        '{crm_v1,servicios,0,equipo_asignado_id}',
        '53'::jsonb
      ),
      '{crm_v1,servicios,0,primario,equipo_asignado_id}',
      '53'::jsonb
    )
    WHERE id_proyecto = 97;
  END IF;
END $$;

-- 4. Actualizar tripulacion_asignada en ejecucion_v1 para que Jorge Saavedra tenga equipo 53
DO $$
DECLARE
  v_json jsonb;
  v_trip jsonb;
  v_elem jsonb;
  v_new_trip jsonb := '[]'::jsonb;
BEGIN
  SELECT json_field INTO v_json FROM sch_leangsp_prod.tpry_proyecto WHERE id_proyecto = 97;
  v_trip := v_json->'ejecucion_v1'->'tripulacion_asignada';
  IF v_trip IS NOT NULL AND jsonb_typeof(v_trip) = 'array' THEN
    FOR v_elem IN SELECT * FROM jsonb_array_elements(v_trip) LOOP
      IF (v_elem->>'id_user')::int = 87 OR (v_elem->>'cargo') ILIKE '%operador%' THEN
        v_elem := jsonb_set(v_elem, '{equipo_asignado_id}', '53'::jsonb);
      END IF;
      v_new_trip := v_new_trip || jsonb_build_array(v_elem);
    END LOOP;
    UPDATE sch_leangsp_prod.tpry_proyecto
    SET json_field = jsonb_set(json_field, '{ejecucion_v1,tripulacion_asignada}', v_new_trip)
    WHERE id_proyecto = 97;
  END IF;
END $$;

-- 5. Auditar estado final
SELECT 
  json_field->'crm_v1'->'lineas_servicio'->0->'equipo_asignado_id' as eq_linea0_nuevo,
  json_field->'crm_v1'->'lineas_servicio'->0->'operador_asignado_id' as op_linea0_nuevo,
  json_field->'crm_v1'->'lineas_servicio'->0->'rigger_asignado_id' as rig_linea0_nuevo,
  json_field->'ejecucion_v1'->'equipo_id' as eq_ejec_nuevo,
  json_field->'ejecucion_v1'->'tripulacion_asignada' as tripulacion_nueva
FROM sch_leangsp_prod.tpry_proyecto 
WHERE id_proyecto = 97;

COMMIT;
`;

  await ssh.execCommand("cat << 'EOF' > /tmp/sanitize_ot47_web.sql\n" + sql + "\nEOF");
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/sanitize_ot47_web.sql"');
  console.log('=== SALIDA SANEAMIENTO SQL ===\n', res.stdout);
  if (res.stderr) console.error('=== STDERR ===\n', res.stderr);

  ssh.dispose();
}

run().catch(console.error);
