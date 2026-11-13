const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function main() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const sqlContent = `
-- 1. Actualizar ajustes_analista de OT 35
UPDATE sch_leangsp_prod.tedp_reporte_avance
SET ajustes_analista = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          ajustes_analista::jsonb,
          '{liquidacion_personal_dia,tiene_rigger}',
          'true'::jsonb
        ),
        '{liquidacion_personal_dia,id_user_rigger}',
        '21'::jsonb
      ),
      '{liquidacion_personal_dia,rigger_nombre}',
      '"ALFONSO MALDONADO"'::jsonb
    ),
    '{liquidacion_personal_dia,monto_viatico_rigger}',
    '8000'::jsonb
  ),
  '{liquidacion_personal_dia,horas_totales_rigger}',
  '9'::jsonb
)
WHERE id_proyecto = 35 AND ajustes_analista ? 'liquidacion_personal_dia';

-- 2. Sweep across all projects in sch_leangsp_prod
DO $sweep$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT 
      p.id_proyecto,
      (elem->>'id_user')::int as id_rigger_user,
      COALESCE(u.name_frst || ' ' || u.apellido_pat, 'RIGGER') as nom_rigger
    FROM sch_leangsp_prod.tpry_proyecto p
    CROSS JOIN LATERAL jsonb_array_elements(
      CASE 
        WHEN jsonb_typeof((p.json_field::jsonb)->'ejecucion_v1'->'tripulacion_asignada') = 'array' 
        THEN (p.json_field::jsonb)->'ejecucion_v1'->'tripulacion_asignada' 
        ELSE '[]'::jsonb 
      END
    ) elem
    JOIN sch_leangsp_prod.tsec_users u ON u.id_user::text = (elem->>'id_user')
    WHERE (elem->>'cargo' ILIKE '%rigger%' OR elem->>'cargo' ILIKE '%rer%')
      AND elem->>'id_user' ~ '^[0-9]+$'
  LOOP
    UPDATE sch_leangsp_prod.tedp_reporte_avance
    SET id_user_rigger = rec.id_rigger_user
    WHERE id_proyecto = rec.id_proyecto AND id_user_rigger IS NULL;
    
    RAISE NOTICE 'OT % saneada con rigger % (%)', rec.id_proyecto, rec.id_rigger_user, rec.nom_rigger;
  END LOOP;
END $sweep$;

-- 3. Alinear todas las secuencias en sch_leangsp_prod y sch_leangsp
DO $align$
DECLARE
  s RECORD;
  t TEXT;
  c TEXT;
  max_val BIGINT;
BEGIN
  FOR s IN 
    SELECT sequence_schema, sequence_name 
    FROM information_schema.sequences 
    WHERE sequence_schema IN ('sch_leangsp_prod', 'sch_leangsp')
  LOOP
    t := regexp_replace(s.sequence_name, '_id_.*_seq$', '');
    t := regexp_replace(t, '_seq$', '');
    BEGIN
      EXECUTE format('SELECT COALESCE(MAX(id), 1) FROM %I.%I', s.sequence_schema, t) INTO max_val;
      IF max_val IS NOT NULL THEN
        EXECUTE format('SELECT setval(''%I.%I'', %s)', s.sequence_schema, s.sequence_name, max_val);
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- ignore
    END;
  END LOOP;
END $align$;
  `;

  // Write remote SQL script
  await ssh.execCommand('cat << \'EOF\' > /tmp/datafix_saneamiento.sql\n' + sqlContent + '\nEOF');
  console.log('Uploaded /tmp/datafix_saneamiento.sql.');

  // Run via psql
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/datafix_saneamiento.sql"');
  console.log('STDOUT:\n', res.stdout);
  console.log('STDERR:\n', res.stderr);

  ssh.dispose();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
