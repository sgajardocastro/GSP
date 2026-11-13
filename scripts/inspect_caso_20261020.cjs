// SOLO LECTURA - Diagnostico CASO-20261020 (jornada guardada no recuperable)
const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

const S = process.argv[2] || 'sch_leangsp_prod';

async function q(title, sql) {
  await ssh.execCommand(`cat << 'EOF' > /tmp/q_caso1020.sql\n${sql}\nEOF`);
  const r = await ssh.execCommand(`su - postgres -c "psql -d postgres -P pager=off -f /tmp/q_caso1020.sql"`);
  console.log(`\n===== ${title} =====\n${r.stdout || r.stderr}`);
}

(async () => {
  await ssh.connect({ host: '138.255.103.18', username: 'root', password: 'lgbl2025.', port: 1295 });
  console.log('SCHEMA:', S);

  await q('Q2 JORNADAS ABIERTAS (todas)', `
    SELECT id_reporte_avance, id_proyecto, id_equipo, id_user_operador, dia_correlativo, fecha_reporte,
           estado_reporte, estado_jornada, fecha_inicio_servicio, horometro_inicio, fecha_registro, device_timestamp
    FROM ${S}.tedp_reporte_avance
    WHERE estado_reporte = 'JORNADA_EN_CURSO' OR estado_jornada = 'JORNADA_EN_CURSO'
    ORDER BY fecha_registro;`);

  await q('Q1 ACTIVIDAD 19-21 OCT', `
    SELECT id_reporte_avance, id_proyecto, id_equipo, id_user_operador, dia_correlativo, fecha_reporte,
           estado_reporte, estado_jornada, fecha_inicio_servicio, fecha_termino_servicio, horometro_inicio,
           horometro_termino, device_timestamp, fecha_registro, cliente_nombre, token_report
    FROM ${S}.tedp_reporte_avance
    WHERE fecha_registro >= '2026-10-19 00:00:00' OR fecha_reporte BETWEEN '2026-10-19' AND '2026-10-21'
    ORDER BY id_proyecto, id_reporte_avance;`);

  await q('Q3 PROYECTOS CON JORNADA ABIERTA: equipos asignados vs viajes vs lineas CRM', `
    WITH ab AS (
      SELECT DISTINCT id_proyecto FROM ${S}.tedp_reporte_avance
      WHERE estado_reporte = 'JORNADA_EN_CURSO' OR estado_jornada = 'JORNADA_EN_CURSO'
         OR fecha_registro >= '2026-10-20 00:00:00'
    )
    SELECT 'REL_EQUIPO' AS fuente, re.id_proyecto, re.id_equipo, e.patente, re.rol_equipo AS detalle, NULL::int AS id_user
      FROM ${S}.tpry_rel_equipo re JOIN ${S}.tequ_equipo e ON e.id_equipo = re.id_equipo
      WHERE re.id_proyecto IN (SELECT id_proyecto FROM ab)
    UNION ALL
    SELECT 'VIAJE', d.id_proyecto, d.id_equipo, d.patente, d.tipo_trayecto || '/' || d.estado_trayecto, d.id_user_chofer
      FROM ${S}.tequ_log_desplazamiento d WHERE d.id_proyecto IN (SELECT id_proyecto FROM ab)
    UNION ALL
    SELECT 'CRM_LINEA', p.id_proyecto, NULLIF(l->>'equipo_asignado_id','')::int, NULL, l->>'tipo', NULLIF(l->>'operador_asignado_id','')::int
      FROM ${S}.tpry_proyecto p, jsonb_array_elements(COALESCE(p.json_field->'crm_v1'->'lineas_servicio','[]'::jsonb)) l
      WHERE p.id_proyecto IN (SELECT id_proyecto FROM ab)
    UNION ALL
    SELECT 'REL_PERSONA', rp.id_proyecto, NULL, NULL, rp.rol_asignado, rp.id_user
      FROM ${S}.tpry_rel_persona rp WHERE rp.id_proyecto IN (SELECT id_proyecto FROM ab)
    ORDER BY 2, 1, 3;`);

  await q('Q4 OPERADORES INVOLUCRADOS', `
    SELECT id_user, name_frst, apellido_pat, email FROM ${S}.tsec_users WHERE id_user IN (
      SELECT id_user_operador FROM ${S}.tedp_reporte_avance WHERE fecha_registro >= '2026-10-19 00:00:00'
      UNION SELECT id_user_chofer FROM ${S}.tequ_log_desplazamiento WHERE id_proyecto IN (
        SELECT id_proyecto FROM ${S}.tedp_reporte_avance WHERE fecha_registro >= '2026-10-19 00:00:00'));`);

  await q('Q8/Q9 TIPOS, TZ, CONSTRAINTS', `
    SELECT column_name, data_type FROM information_schema.columns
     WHERE table_schema='${S}' AND table_name='tedp_reporte_avance'
       AND column_name IN ('fecha_reporte','fecha_inicio_servicio','fecha_termino_servicio','device_timestamp','fecha_registro','estado_jornada');
    SHOW timezone;
    SELECT indexname, indexdef FROM pg_indexes WHERE schemaname='${S}' AND tablename='tedp_reporte_avance';`);

  await ssh.execCommand('rm -f /tmp/q_caso1020.sql');
  ssh.dispose();
})().catch(e => { console.error(e); process.exit(1); });
