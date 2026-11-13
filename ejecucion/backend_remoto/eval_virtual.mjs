import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function run() {
  try {
    await ssh.connect({
      host: 'servidor.leanglobal.cl',
      port: 1295,
      username: 'root',
      password: 'lgbl2025.'
    });

    const script = `
      const { Pool } = require('pg');
      const pool = new Pool({
        connectionString: 'postgres://usr_leangsp_prod:usr_gsp_prod_2026!@localhost:5432/postgres'
      });

      async function run() {
        try {
          const sql = \`
            SELECT 
              p.id_proyecto,
              p.codi_proyecto,
              p.id_proyecto_estado AS estado_real_bd,
              CASE
                WHEN p.id_proyecto_estado = 5 AND (
                  its.id_its IS NOT NULL
                  OR COALESCE(v_ret.tiene_retorno, false)
                  OR (
                    COALESCE(rep.reports_cerrados, 0) >= GREATEST(
                      COALESCE(p.duracion_plan, 0),
                      COALESCE(cupo.duracion_plan, 0),
                      COALESCE(NULLIF(regexp_replace(COALESCE(p.json_field->>'duracion_estimada', ''), '[^0-9]', '', 'g'), '')::int, 1)
                    )
                    AND COALESCE(rep.reports_abiertos, 0) = 0
                    AND COALESCE(rep.reports_cerrados, 0) > 0
                  )
                ) THEN 6
                ELSE p.id_proyecto_estado
              END AS estado_virtual_calculado,
              its.id_its,
              COALESCE(v_ret.tiene_retorno, false) AS tiene_retorno,
              rep.reports_cerrados,
              rep.reports_abiertos,
              p.duracion_plan,
              cupo.duracion_plan AS cupo_duracion_plan,
              NULLIF(regexp_replace(COALESCE(p.json_field->>'duracion_estimada', ''), '[^0-9]', '', 'g'), '')::int AS duracion_estimada_jf,
              GREATEST(
                COALESCE(p.duracion_plan, 0),
                COALESCE(cupo.duracion_plan, 0),
                COALESCE(NULLIF(regexp_replace(COALESCE(p.json_field->>'duracion_estimada', ''), '[^0-9]', '', 'g'), '')::int, 1)
              ) AS duracion_plan_calculada
            FROM sch_leangsp_prod.tpry_proyecto p
            LEFT JOIN LATERAL (
              SELECT i.id_its, i.folio_its, i.estado_its
              FROM sch_leangsp_prod.tits_informe_termino i
              WHERE i.id_proyecto = p.id_proyecto
              ORDER BY i.id_its DESC
              LIMIT 1
            ) its ON true
            LEFT JOIN LATERAL (
              SELECT
                COUNT(*) FILTER (
                  WHERE r.estado_reporte != 'JORNADA_EN_CURSO'
                    AND COALESCE(r.estado_jornada, '') != 'JORNADA_EN_CURSO'
                    AND r.fecha_termino_servicio IS NOT NULL
                )::int AS reports_cerrados,
                COUNT(*) FILTER (
                  WHERE r.estado_reporte = 'JORNADA_EN_CURSO'
                     OR COALESCE(r.estado_jornada, '') = 'JORNADA_EN_CURSO'
                     OR r.fecha_termino_servicio IS NULL
                )::int AS reports_abiertos
              FROM sch_leangsp_prod.tedp_reporte_avance r
              WHERE r.id_proyecto = p.id_proyecto
            ) rep ON true
            LEFT JOIN LATERAL (
              SELECT EXISTS (
                SELECT 1
                FROM sch_leangsp_prod.tequ_log_desplazamiento ld
                WHERE ld.id_proyecto = p.id_proyecto
                  AND ld.tipo_trayecto = 'RETORNO'
                  AND ld.estado_trayecto IN ('ASIGNADO', 'EN_RUTA', 'ARRIBADO')
              ) AS tiene_retorno
            ) v_ret ON true
            LEFT JOIN LATERAL (
              SELECT GREATEST(
                COALESCE(MAX(GREATEST(
                  COALESCE(NULLIF(regexp_replace(COALESCE(elem->>'duracion_dias', ''), '[^0-9]', '', 'g'), '')::int, 0),
                  COALESCE(NULLIF(regexp_replace(COALESCE(elem->>'cantidad_dias', ''), '[^0-9]', '', 'g'), '')::int, 0),
                  COALESCE(NULLIF(regexp_replace(COALESCE(elem->>'cantidad_meses', ''), '[^0-9]', '', 'g'), '')::int, 0) * 30,
                  CASE
                    WHEN (elem->>'fecha_plan_ini') ~ '^\\\\d{4}-\\\\d{2}-\\\\d{2}' AND (elem->>'fecha_plan_fin') ~ '^\\\\d{4}-\\\\d{2}-\\\\d{2}'
                    THEN GREATEST(1, (LEFT(elem->>'fecha_plan_fin', 10)::date - LEFT(elem->>'fecha_plan_ini', 10)::date) + 1)
                    ELSE 0
                  END,
                  COALESCE(NULLIF(regexp_replace(COALESCE(elem->>'cantidad', ''), '[^0-9]', '', 'g'), '')::int, 0)
                )), 0),
                CASE
                  WHEN (p.json_field->'crm_v1'->>'fecha_hora_inicio') ~ '^\\\\d{4}-\\\\d{2}-\\\\d{2}'
                   AND (p.json_field->'crm_v1'->>'fecha_hora_termino') ~ '^\\\\d{4}-\\\\d{2}-\\\\d{2}'
                  THEN GREATEST(1, (LEFT(p.json_field->'crm_v1'->>'fecha_hora_termino', 10)::date - LEFT(p.json_field->'crm_v1'->>'fecha_hora_inicio', 10)::date) + 1)
                  ELSE 0
                END
              ) AS duracion_plan
              FROM jsonb_array_elements(
                CASE
                  WHEN jsonb_typeof(p.json_field->'crm_v1'->'lineas_servicio') = 'array'
                  THEN p.json_field->'crm_v1'->'lineas_servicio'
                  WHEN jsonb_typeof(p.json_field->'planificacion_operativa'->'cupos') = 'array'
                  THEN p.json_field->'planificacion_operativa'->'cupos'
                  ELSE '[]'::jsonb
                END
              ) elem
            ) cupo ON true
            WHERE p.id_proyecto IN (48, 49)
          \`;

          const res = await pool.query(sql);
          console.log('--- RESULTADO SQL ANALISIS ESTADO VIRTUAL ---');
          console.log(JSON.stringify(res.rows, null, 2));

        } catch(e) {
          console.error('Error:', e);
        } finally {
          await pool.end();
        }
      }
      run();
    `;

    const remoteDir = '/home/nodeadmin/proyectos/lean-services-gsp-prod';
    await ssh.execCommand(`cat << 'EOF' > ${remoteDir}/temp_eval_virtual.js\n${script}\nEOF`);
    const res = await ssh.execCommand('node temp_eval_virtual.js', { cwd: remoteDir });
    console.log(res.stdout);
    if (res.stderr) console.error('STDERR:', res.stderr);
    await ssh.execCommand(`rm -f ${remoteDir}/temp_eval_virtual.js`);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    ssh.dispose();
  }
}

run();
