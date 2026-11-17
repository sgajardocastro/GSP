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

  await ssh.execCommand("cat << 'EOF' > /tmp/sanitize_vigentes.sql\n" + sql + "\nEOF");
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/sanitize_vigentes.sql"');
  console.log(res.stdout);
  ssh.dispose();
}

run().catch(console.error);
