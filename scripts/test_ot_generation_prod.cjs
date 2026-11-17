const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function testOTQuery() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const sql = `
  -- Probar la consulta exacta de generarOTVersion para proyecto 86 (0039)
  SELECT 
    re.id_rel_equipo,
    re.id_equipo,
    re.rol_equipo,
    re.fecha_plan_ini,
    re.fecha_plan_fin,
    re.observaciones,
    re.id_linea_servicio,
    e.codigo_interno,
    e.patente,
    e.marca,
    e.modelo,
    e.tipo_equipo as tipo,
    e.capacidad_maxima as capacidad_ton
  FROM sch_leangsp_prod.tpry_rel_equipo re
  INNER JOIN sch_leangsp_prod.tequ_equipo e ON re.id_equipo = e.id_equipo
  WHERE re.id_proyecto = 86 
    AND COALESCE(re.estado_real, 'PROGRAMADO') NOT IN ('CANCELADO', 'REEMPLAZADO')
  ORDER BY re.fecha_plan_ini ASC, re.id_rel_equipo ASC;

  SELECT 
    rp.id_rel_persona,
    rp.id_user,
    rp.rol_asignado,
    rp.fecha_plan_ini,
    rp.fecha_plan_fin,
    rp.observaciones,
    rp.id_linea_servicio,
    u.name_frst,
    u.apellido_pat,
    u.apellido_mat,
    u.rut as rut_user,
    u.email
  FROM sch_leangsp_prod.tpry_rel_persona rp
  INNER JOIN sch_leangsp_prod.tsec_users u ON rp.id_user = u.id_user
  WHERE rp.id_proyecto = 86 
    AND COALESCE(rp.estado_real, 'PROGRAMADO') NOT IN ('CANCELADO', 'REEMPLAZADO')
  ORDER BY rp.fecha_plan_ini ASC, rp.id_rel_persona ASC;
  `;

  await ssh.execCommand("cat << 'EOF' > /tmp/test_ot_query.sql\n" + sql + "\nEOF");
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/test_ot_query.sql"');
  console.log(res.stdout);
  if (res.stderr) console.error(res.stderr);

  ssh.dispose();
}

testOTQuery().catch(console.error);
