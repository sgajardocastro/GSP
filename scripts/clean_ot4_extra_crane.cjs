const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function cleanOt4ExtraCrane() {
  console.log('Conectando a servidor SSH para limpiar fila fantasma de grúa en equipos_extra de OT 4...');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const sql = `
    BEGIN;

    -- 1. Depurar json_field en sch_leangsp_prod
    UPDATE sch_leangsp_prod.tpry_proyecto
    SET json_field = jsonb_set(
      json_field,
      '{ejecucion_v1,equipos_extra}',
      COALESCE(
        (
          SELECT jsonb_agg(elem)
          FROM jsonb_array_elements(json_field->'ejecucion_v1'->'equipos_extra') AS elem
          WHERE NOT (elem->>'subcategoria' ILIKE '%GRUA%' OR COALESCE((elem->>'id_equipo')::int, 0) = 45)
        ),
        '[]'::jsonb
      )
    )
    WHERE id_proyecto = 4;

    -- 2. Depurar también en sch_leangsp (dev) si existe
    UPDATE sch_leangsp.tpry_proyecto
    SET json_field = jsonb_set(
      json_field,
      '{ejecucion_v1,equipos_extra}',
      COALESCE(
        (
          SELECT jsonb_agg(elem)
          FROM jsonb_array_elements(json_field->'ejecucion_v1'->'equipos_extra') AS elem
          WHERE NOT (elem->>'subcategoria' ILIKE '%GRUA%' OR COALESCE((elem->>'id_equipo')::int, 0) = 45)
        ),
        '[]'::jsonb
      )
    )
    WHERE id_proyecto = 4;

    COMMIT;
  `;

  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sql}\\""`);
  console.log('Resultado SQL:', res.stdout);

  const verif = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -A -c \\"SELECT json_field->'ejecucion_v1'->'equipos_extra' FROM sch_leangsp_prod.tpry_proyecto WHERE id_proyecto = 4;\\""`);
  console.log('\n--- EQUIPOS_EXTRA EN OT 4 POST-LIMPIEZA ---');
  console.log(verif.stdout.trim());

  ssh.dispose();
}

cleanOt4ExtraCrane().catch(console.error);
