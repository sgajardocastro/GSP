const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function inspectOT16() {
  console.log('=== INSPECCIÓN CASO OT-016 / GRÚA DZXL.21-0 EN PROD (sch_leangsp_prod) ===\n');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  // 1. Proyecto
  console.log('--- 1. PROYECTO GSP-2610-233-016 ---');
  const rProy = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT id_proyecto, codi_proyecto, nombre_proyecto, id_proyecto_estado, fecha_plan_ini, fecha_plan_fin FROM sch_leangsp_prod.tpry_proyecto WHERE codi_proyecto LIKE '%016%' OR codi_proyecto LIKE '%233-016%' OR nombre_proyecto ILIKE '%ferrero%';\\""`);
  console.log(rProy.stdout.trim() || rProy.stderr);

  // 1.1 Proyecto 16 JSON
  console.log('\n--- 1.1 JSON FIELD PROYECTO 16 ---');
  const rJson = await ssh.execCommand('su - postgres -c "psql -d postgres -c \\"SELECT json_field FROM sch_leangsp_prod.tpry_proyecto WHERE id_proyecto = 16;\\""');
  console.log(rJson.stdout.trim() || rJson.stderr);

  // 3. Tripulación y Equipos Asignados a la OT
  console.log('\n--- 3. RELACIÓN EQUIPO Y PERSONA DE LA OT 16 ---');
  const rPer = await ssh.execCommand(`su - postgres -c "psql -d postgres -c 'SELECT * FROM sch_leangsp_prod.tpry_rel_persona WHERE id_proyecto = 16;'"`);
  console.log('Personas asignadas:\n', rPer.stdout.trim() || rPer.stderr);

  // 4. Reportes de Avance hoy y de OT 16
  console.log('\n--- 4. REPORTES EN TEDP_REPORTE_AVANCE (15, 16, 17) ---');
  const rRep = await ssh.execCommand('su - postgres -c "psql -d postgres -c \\"SELECT id_reporte_avance, id_proyecto, id_equipo, id_user_operador, dia_correlativo, fecha_reporte, estado_reporte, horometro_inicio, horometro_termino, fecha_inicio_servicio, fecha_termino_servicio, cliente_nombre, observacion_trabajo, device_timestamp FROM sch_leangsp_prod.tedp_reporte_avance WHERE id_reporte_avance IN (15, 16, 17);\\""');
  console.log(rRep.stdout.trim() || rRep.stderr);

  // 5. Desplazamientos
  console.log('\n--- 5. DESPLAZAMIENTOS TEQU_LOG_DESPLAZAMIENTO ---');
  const rViajes = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"
    SELECT id_log_desplazamiento, token_viaje, id_proyecto, id_equipo, patente, id_user_chofer, tipo_trayecto, estado_trayecto, fecha_salida_patio, fecha_llegada_faena
    FROM sch_leangsp_prod.tequ_log_desplazamiento
    WHERE id_proyecto IN (SELECT id_proyecto FROM sch_leangsp_prod.tpry_proyecto WHERE codi_proyecto LIKE '%016%')
       OR id_equipo IN (SELECT id_equipo FROM sch_leangsp_prod.tequ_equipo WHERE patente LIKE '%DZXL%')
    ORDER BY id_log_desplazamiento DESC LIMIT 5;
  \\""`);
  console.log(rViajes.stdout.trim() || rViajes.stderr);

  ssh.dispose();
}

inspectOT16().catch(console.error);
