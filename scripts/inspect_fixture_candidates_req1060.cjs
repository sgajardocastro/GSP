// SOLO LECTURA - Huerfano OT 23 (PROD) + candidatos de fixture en DEV
const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();
async function q(title, sql) {
  await ssh.execCommand(`cat << 'EOF' > /tmp/q_fx.sql\n${sql}\nEOF`);
  const r = await ssh.execCommand(`su - postgres -c "psql -d postgres -P pager=off -f /tmp/q_fx.sql"`);
  console.log(`\n===== ${title} =====\n${r.stdout || r.stderr}`);
}
(async () => {
  await ssh.connect({ host: '138.255.103.18', username: 'root', password: 'lgbl2025.', port: 1295 });
  await q('PROD OT 23 / OT 2 HISTORIA', `
    SELECT id_proyecto pr, id_reporte_avance id, id_equipo eq, id_user_operador op, dia_correlativo dia, fecha_reporte, estado_reporte, estado_jornada,
           to_char(fecha_registro,'MM-DD HH24:MI') reg, to_char(fecha_transmision_termino,'MM-DD HH24:MI') transm
    FROM sch_leangsp_prod.tedp_reporte_avance WHERE id_proyecto IN (2,23) ORDER BY 1,2;`);
  await q('DEV: proyectos 4-6 con rel_equipo y operador', `
    SELECT p.id_proyecto, p.codi_proyecto, p.id_proyecto_estado,
      (SELECT string_agg(id_equipo::text, ',') FROM sch_leangsp.tpry_rel_equipo re WHERE re.id_proyecto=p.id_proyecto) eqs,
      (SELECT string_agg(id_user||':'||rol_asignado, ',') FROM sch_leangsp.tpry_rel_persona rp WHERE rp.id_proyecto=p.id_proyecto) pers,
      (SELECT count(*) FROM sch_leangsp.tedp_reporte_avance ra WHERE ra.id_proyecto=p.id_proyecto) reps,
      (SELECT count(*) FROM sch_leangsp.tequ_log_desplazamiento d WHERE d.id_proyecto=p.id_proyecto) viajes,
      p.fecha_plan_ini, p.fecha_plan_fin
    FROM sch_leangsp.tpry_proyecto p WHERE p.id_proyecto_estado IN (4,5,6) ORDER BY p.id_proyecto DESC LIMIT 25;`);
  await q('DEV: columnas tpry_proyecto / tequ_log_desplazamiento (NOT NULL sin default)', `
    SELECT table_name, column_name, data_type FROM information_schema.columns
    WHERE table_schema='sch_leangsp' AND table_name IN ('tpry_proyecto','tequ_log_desplazamiento','tpry_rel_equipo','tpry_rel_persona')
      AND is_nullable='NO' AND column_default IS NULL ORDER BY 1,2;`);
  await ssh.execCommand('rm -f /tmp/q_fx.sql');
  ssh.dispose();
})().catch(e => { console.error(e); process.exit(1); });
