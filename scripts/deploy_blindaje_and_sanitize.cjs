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

  // 1. Upload the updated proyectoModel.js
  const localModel = path.resolve(__dirname, '../ejecucion/backend_remoto/src/models/proyectoModel.js');
  const remoteModel = '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/models/proyectoModel.js';
  console.log('1. Subiendo proyectoModel.js con blindaje relacional...');
  await ssh.putFile(localModel, remoteModel);
  console.log('   OK subido.');

  // 2. Restart PM2
  console.log('2. Reiniciando PM2 app 13 (lean-services-gsp-prod)...');
  const resPm2 = await ssh.execCommand('su - nodeadmin -c "pm2 restart 13"');
  console.log('   PM2:', resPm2.stdout.trim().split('\n')[0]);

  // 3. Apply SQL sanitize on tpry_proyecto for project 97
  console.log('3. Saneando tpry_proyecto en PostgreSQL...');
  const sql = `
BEGIN;

-- Forzar 53 en lineas_servicio, lineas_operativas_vigentes y ejecucion_v1
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

-- Reemplazar cualquier residuo 52 en tripulacion_asignada
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
      IF (v_elem->>'equipo_asignado_id')::text = '52' OR (v_elem->>'cargo') ILIKE '%operador%' OR (v_elem->>'cargo') ILIKE '%rigger%' THEN
        v_elem := jsonb_set(v_elem, '{equipo_asignado_id}', '53'::jsonb);
      END IF;
      v_new_trip := v_new_trip || jsonb_build_array(v_elem);
    END LOOP;
    UPDATE sch_leangsp_prod.tpry_proyecto
    SET json_field = jsonb_set(json_field, '{ejecucion_v1,tripulacion_asignada}', v_new_trip)
    WHERE id_proyecto = 97;
  END IF;
END $$;

-- Reemplazar residuo 52 en lineas_operativas_vigentes
DO $$
DECLARE
  v_json jsonb;
  v_vig jsonb;
  v_elem jsonb;
  v_new_vig jsonb := '[]'::jsonb;
BEGIN
  SELECT json_field INTO v_json FROM sch_leangsp_prod.tpry_proyecto WHERE id_proyecto = 97;
  v_vig := v_json->'crm_v1'->'lineas_operativas_vigentes';
  IF v_vig IS NOT NULL AND jsonb_typeof(v_vig) = 'array' THEN
    FOR v_elem IN SELECT * FROM jsonb_array_elements(v_vig) LOOP
      IF (v_elem->>'equipo_asignado_id')::text = '52' THEN
        v_elem := jsonb_set(v_elem, '{equipo_asignado_id}', '53'::jsonb);
      END IF;
      v_new_vig := v_new_vig || jsonb_build_array(v_elem);
    END LOOP;
    UPDATE sch_leangsp_prod.tpry_proyecto
    SET json_field = jsonb_set(json_field, '{crm_v1,lineas_operativas_vigentes}', v_new_vig)
    WHERE id_proyecto = 97;
  END IF;
END $$;

COMMIT;
`;

  await ssh.execCommand("cat << 'EOF' > /tmp/deploy_blindaje_sql.sql\n" + sql + "\nEOF");
  const resSql = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/deploy_blindaje_sql.sql"');
  console.log('   SQL:', resSql.stdout.replace(/\n+/g, ' '));

  ssh.dispose();
  console.log('Despliegue y saneamiento completado.');
}

run().catch(console.error);
