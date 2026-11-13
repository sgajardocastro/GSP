const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  console.log('=== INVESTIGACIÓN BD OT 32 ===\n');

  // 1. Equipos asignados a OT 32
  const rEquipos = await ssh.execCommand(`su - postgres -c "psql -d postgres -c 'SELECT re.*, e.patente, e.marca, e.modelo, e.subcategoria FROM sch_leangsp_prod.tpry_rel_equipo re LEFT JOIN sch_leangsp_prod.tequ_equipo e ON e.id_equipo = re.id_equipo WHERE re.id_proyecto = 32;'"`);
  console.log('Equipos tpry_rel_equipo:\n', rEquipos.stdout);

  // 2. Personal asignado a OT 32
  const rPersonal = await ssh.execCommand(`su - postgres -c "psql -d postgres -c 'SELECT rp.*, u.name_frst, u.name_last, u.id_tipo_cargo, u.rut FROM sch_leangsp_prod.tpry_rel_persona rp LEFT JOIN sch_leangsp_prod.tsec_usuario u ON u.id_user = rp.id_user WHERE rp.id_proyecto = 32;'"`);
  console.log('Personal tpry_rel_persona:\n', rPersonal.stdout);

  // 3. tequ_log_desplazamiento para OT 32
  const rLogs = await ssh.execCommand(`su - postgres -c "psql -d postgres -c 'SELECT ld.*, e.patente, u.name_frst, u.name_last FROM sch_leangsp_prod.tequ_log_desplazamiento ld LEFT JOIN sch_leangsp_prod.tequ_equipo e ON e.id_equipo = ld.id_equipo LEFT JOIN sch_leangsp_prod.tsec_usuario u ON u.id_user = ld.id_user_chofer WHERE ld.id_proyecto = 32;'"`);
  console.log('Logs desplazamiento tequ_log_desplazamiento:\n', rLogs.stdout);

  // 4. Reportes de avance para OT 32
  const rRep = await ssh.execCommand(`su - postgres -c "psql -d postgres -c 'SELECT r.id_reporte_avance, r.fecha_reporte, r.id_equipo, r.id_user_operador, r.id_user_rigger, r.horas_operadas, r.horas_facturables FROM sch_leangsp_prod.tedp_reporte_avance r WHERE r.id_proyecto = 32;'"`);
  console.log('Reportes tedp_reporte_avance:\n', rRep.stdout);

  ssh.dispose();
}

main().catch(console.error);
