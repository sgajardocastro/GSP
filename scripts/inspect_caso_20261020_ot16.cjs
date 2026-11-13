// SOLO LECTURA - Historia completa OT 16 + logs de acceso del 20-oct
const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();
const S = 'sch_leangsp_prod';

async function q(title, sql) {
  await ssh.execCommand(`cat << 'EOF' > /tmp/q_ot16.sql\n${sql}\nEOF`);
  const r = await ssh.execCommand(`su - postgres -c "psql -d postgres -P pager=off -f /tmp/q_ot16.sql"`);
  console.log(`\n===== ${title} =====\n${r.stdout || r.stderr}`);
}
async function sh(title, cmd) {
  const r = await ssh.execCommand(cmd);
  console.log(`\n===== ${title} =====\n${r.stdout || r.stderr}`);
}

(async () => {
  await ssh.connect({ host: '138.255.103.18', username: 'root', password: 'lgbl2025.', port: 1295 });

  await q('OT16 TODOS LOS REPORTES', `
    SELECT id_reporte_avance AS id, id_equipo AS eq, id_user_operador AS op, dia_correlativo AS dia, fecha_reporte,
           estado_reporte, estado_jornada, to_char(fecha_inicio_servicio,'MM-DD HH24:MI') ini, to_char(fecha_termino_servicio,'MM-DD HH24:MI') fin,
           horometro_inicio hi, horometro_termino ht, to_char(fecha_registro,'MM-DD HH24:MI:SS') registro,
           to_char(device_timestamp,'MM-DD HH24:MI:SS') device, to_char(fecha_transmision_termino,'MM-DD HH24:MI:SS') transm, left(token_report,8) tok
    FROM ${S}.tedp_reporte_avance WHERE id_proyecto = 16 ORDER BY id_reporte_avance;`);

  await q('OT16 EQUIPOS / VIAJES / PERSONAS', `
    SELECT 'REL_EQUIPO' f, id_rel_equipo id, id_equipo, rol_equipo det FROM ${S}.tpry_rel_equipo WHERE id_proyecto=16
    UNION ALL SELECT 'VIAJE', id_log_desplazamiento, id_equipo, tipo_trayecto||'/'||estado_trayecto||' chofer='||id_user_chofer||' tok='||token_viaje FROM ${S}.tequ_log_desplazamiento WHERE id_proyecto=16
    UNION ALL SELECT 'REL_PERSONA', id_rel_persona, id_user, rol_asignado FROM ${S}.tpry_rel_persona WHERE id_proyecto=16
    ORDER BY 1,2;`);

  await q('OT16 CRM / FECHAS / ESTADO', `
    SELECT id_proyecto, codi_proyecto, id_proyecto_estado, fecha_plan_ini, fecha_plan_fin,
           json_field->'crm_v1'->'lineas_servicio' AS lineas
    FROM ${S}.tpry_proyecto WHERE id_proyecto=16;`);

  await q('OTROS PROYECTOS ACTIVOS DE ROBERT (49) - lo que ve la consola', `
    SELECT DISTINCT p.id_proyecto, p.codi_proyecto, p.id_proyecto_estado, v.id_equipo, v.patente, v.estado_trayecto
    FROM ${S}.tpry_proyecto p
    LEFT JOIN ${S}.tequ_log_desplazamiento v ON p.id_proyecto = v.id_proyecto AND v.id_user_chofer = 49
    WHERE (v.id_user_chofer = 49
      OR (p.json_field->'ejecucion_v1'->>'operador_id') = '49'
      OR EXISTS (SELECT 1 FROM jsonb_array_elements(CASE WHEN jsonb_typeof(p.json_field->'crm_v1'->'lineas_servicio')='array' THEN p.json_field->'crm_v1'->'lineas_servicio' ELSE '[]'::jsonb END) l
                 WHERE l->>'operador_asignado_id'='49' OR l->>'rigger_asignado_id'='49' OR l->>'chofer_asignado_id'='49')
      OR EXISTS (SELECT 1 FROM ${S}.tedp_reporte_avance ra WHERE ra.id_proyecto=p.id_proyecto AND (ra.id_user_operador=49 OR ra.id_user_rigger=49)))
    AND p.id_proyecto_estado IN (4,5,6)
    ORDER BY p.id_proyecto DESC;`);

  await sh('NGINX ACCESS 20-OCT: report contexto / inicio / guardar / pendientes (prod)',
    `grep -h "20/Oct/2026" /var/log/nginx/access.log* 2>/dev/null | grep -E "lg-gsp-prod/api/(operaciones/report|reports/usuario/pendientes)" | awk '{print $4, $6, $7, $9}' | head -n 200`);

  await sh('PM2 13 LOG ERRORES REPORT (ultimas lineas)',
    `ls -1 /home/nodeadmin/.pm2/logs/ 2>/dev/null | head -n 40; grep -h -E "report|jornada" /home/nodeadmin/.pm2/logs/*13*.log 2>/dev/null | tail -n 40`);

  await sh('DB_SCHEMA EN .env PROD', `grep -h -E "^DB_SCHEMA|^PORT" /home/nodeadmin/proyectos/lean-services-gsp-prod/.env 2>/dev/null`);

  await ssh.execCommand('rm -f /tmp/q_ot16.sql');
  ssh.dispose();
})().catch(e => { console.error(e); process.exit(1); });
