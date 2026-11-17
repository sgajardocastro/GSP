const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function checkNicolas() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const sql = `
  -- 1. Buscar a Nicolás Ceballos
  SELECT id_user, name_frst, apellido_pat, email, movil, rut, flag_activo
  FROM sch_leangsp_prod.tsec_users
  WHERE name_frst ILIKE '%nicolas%' OR apellido_pat ILIKE '%ceballos%';

  -- 2. Ver asignaciones en tpry_rel_persona
  SELECT rp.id_rel_persona, rp.id_proyecto, p.codi_proyecto, p.nombre_proyecto, rp.id_user, rp.rol_asignado,
         rp.fecha_plan_ini, rp.fecha_plan_fin, rp.estado_real
  FROM sch_leangsp_prod.tpry_rel_persona rp
  JOIN sch_leangsp_prod.tpry_proyecto p ON rp.id_proyecto = p.id_proyecto
  WHERE rp.id_user IN (SELECT id_user FROM sch_leangsp_prod.tsec_users WHERE name_frst ILIKE '%nicolas%' OR apellido_pat ILIKE '%ceballos%')
  ORDER BY rp.id_rel_persona DESC LIMIT 5;

  -- 3. Ver equipos asignados a OT 51
  SELECT re.id_rel_equipo, re.id_proyecto, p.codi_proyecto, re.id_equipo, eq.patente, eq.modelo
  FROM sch_leangsp_prod.tpry_rel_equipo re
  JOIN sch_leangsp_prod.tpry_proyecto p ON re.id_proyecto = p.id_proyecto
  JOIN sch_leangsp_prod.tequ_equipo eq ON re.id_equipo = eq.id_equipo
  WHERE p.codi_proyecto = 'GSP-2611-00051';

  -- 4. Ver viajes activos o registrados para Nicolás Ceballos
  SELECT id_log, id_proyecto, id_equipo, id_user_chofer, tipo_trayecto, estado_viaje, fecha_programada, token_publico
  FROM sch_leangsp_prod.tequ_log_desplazamiento
  WHERE id_user_chofer IN (SELECT id_user FROM sch_leangsp_prod.tsec_users WHERE name_frst ILIKE '%nicolas%' OR apellido_pat ILIKE '%ceballos%')
  ORDER BY id_log DESC LIMIT 5;

  -- 5. Ver json_field de OT 51
  SELECT id_proyecto, codi_proyecto, json_field->'ejecucion_v1' as ejecucion_v1
  FROM sch_leangsp_prod.tpry_proyecto
  WHERE codi_proyecto = 'GSP-2611-00051';
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/chk_nic.sql\n${sql}\nEOF`);
  const res = await ssh.execCommand('sudo -u postgres psql -d postgres -f /tmp/chk_nic.sql');
  console.log(res.stdout);
  console.log('STDERR:', res.stderr);

  ssh.dispose();
}

checkNicolas().catch(console.error);
