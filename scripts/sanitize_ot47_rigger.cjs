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
      IF (v_elem->>'equipo_asignado_id')::text = '52' THEN
        v_elem := jsonb_set(v_elem, '{equipo_asignado_id}', '53'::jsonb);
      END IF;
      v_new_trip := v_new_trip || jsonb_build_array(v_elem);
    END LOOP;
    UPDATE sch_leangsp_prod.tpry_proyecto
    SET json_field = jsonb_set(json_field, '{ejecucion_v1,tripulacion_asignada}', v_new_trip)
    WHERE id_proyecto = 97;
  END IF;
END $$;

SELECT json_field->'ejecucion_v1'->'tripulacion_asignada' as tripulacion_final
FROM sch_leangsp_prod.tpry_proyecto WHERE id_proyecto = 97;

COMMIT;
`;

  await ssh.execCommand("cat << 'EOF' > /tmp/sanitize_ot47_rigger.sql\n" + sql + "\nEOF");
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/sanitize_ot47_rigger.sql"');
  console.log(res.stdout);
  ssh.dispose();
}

run().catch(console.error);
