const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function main() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  console.log('Connected to remote server via SSH.');

  // 1. Column adjuntos in tcfg_backlog (DEV and PROD)
  const sqlBacklog = `
    ALTER TABLE sch_leangsp.tcfg_backlog ADD COLUMN IF NOT EXISTS adjuntos JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE sch_leangsp_prod.tcfg_backlog ADD COLUMN IF NOT EXISTS adjuntos JSONB DEFAULT '[]'::jsonb;
  `;
  console.log('1. Executing ALTER TABLE tcfg_backlog...');
  const res1 = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sqlBacklog.replace(/\n/g, ' ')}\\""`);
  console.log(res1.stdout);
  if (res1.stderr) console.error('ERR1:', res1.stderr);

  // 2. Datafix OT 35 (Inarco) - Alfonso Maldonado id_user = 21
  console.log('2. Updating OT 35 reports in sch_leangsp_prod.tedp_reporte_avance...');
  const sqlOt35 = `
    UPDATE sch_leangsp_prod.tedp_reporte_avance
    SET id_user_rigger = 21
    WHERE id_proyecto = 35 AND (id_user_rigger IS NULL OR id_user_rigger != 21);
  `;
  const res2 = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sqlOt35.replace(/\n/g, ' ')}\\""`);
  console.log(res2.stdout);
  if (res2.stderr) console.error('ERR2:', res2.stderr);

  // 2.b Recalcular liquidacion_personal_dia en ajustes_analista para OT 35
  const sqlAjustesOt35 = `
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
          '\\"ALFONSO MALDONADO\\"'::jsonb
        ),
        '{liquidacion_personal_dia,monto_viatico_rigger}',
        '8000'::jsonb
      ),
      '{liquidacion_personal_dia,horas_totales_rigger}',
      '9'::jsonb
    )
    WHERE id_proyecto = 35 AND ajustes_analista ? 'liquidacion_personal_dia';
  `;
  const res2b = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sqlAjustesOt35.replace(/\n/g, ' ')}\\""`);
  console.log('Ajustes OT 35:', res2b.stdout);
  if (res2b.stderr) console.error('ERR2b:', res2b.stderr);

  // 3. Barrido masivo transversal: detectar y actualizar reports de otras OTs donde id_user_rigger es NULL pero hay rigger en tripulacion_asignada
  console.log('3. Sweeping all OTs with assigned riggers...');
  const sqlSweep = `
    DO $$
    DECLARE
      rec RECORD;
      r_rig INT;
      r_nom TEXT;
    BEGIN
      FOR rec IN
        SELECT 
          p.id_proyecto,
          (elem->>'id_user')::int as id_rigger_user,
          COALESCE(u.name_frst || ' ' || u.apellido_pat, 'RIGGER ASIGNADO') as nom_rigger
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
        
        RAISE NOTICE 'OT % actualizada con rigger % (%)', rec.id_proyecto, rec.id_rigger_user, rec.nom_rigger;
      END LOOP;
    END $$;
  `;
  const res3 = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sqlSweep.replace(/\n/g, ' ')}\\""`);
  console.log(res3.stdout);
  if (res3.stderr) console.error('NOTICE/ERR3:', res3.stderr);

  // 4. Alinear secuencias de tablas en sch_leangsp_prod y sch_leangsp
  console.log('4. Aligning all PostgreSQL sequences...');
  const sqlSeq = `
    DO $$
    DECLARE
      seq RECORD;
      tbl TEXT;
      col TEXT;
      max_id BIGINT;
    BEGIN
      FOR seq IN
        SELECT sequence_schema, sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema IN ('sch_leangsp_prod', 'sch_leangsp')
      LOOP
        tbl := regexp_replace(seq.sequence_name, '_id_.*_seq$', '');
        tbl := regexp_replace(tbl, '_seq$', '');
        BEGIN
          EXECUTE format('SELECT COALESCE(MAX(id), MAX(id_%s), 1) FROM %I.%I', 
            regexp_replace(tbl, '^[a-z]+_', ''), seq.sequence_schema, tbl) INTO max_id;
          IF max_id IS NOT NULL THEN
            EXECUTE format('SELECT setval(''%I.%I'', %s)', seq.sequence_schema, seq.sequence_name, max_id);
          END IF;
        EXCEPTION WHEN OTHERS THEN
          -- Ignorar secuencias con nombres no convencionales
        END;
      END LOOP;
    END $$;
  `;
  const res4 = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sqlSeq.replace(/\n/g, ' ')}\\""`);
  console.log('Sequences aligned:', res4.stdout);

  ssh.dispose();
  console.log('ALL DATAFIXES COMPLETED!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
