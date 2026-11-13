const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function regularizarOT16() {
  console.log('=== REGULARIZACIÓN OT-016 / REPORTE HOY EN PROD (sch_leangsp_prod) ===\n');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  // 1. Eliminar reporte duplicado huérfano ID 15 (JORNADA_EN_CURSO que quedó abandonado)
  console.log('--- 1. PURGANDO REPORTE HUÉRFANO ID 15 ---');
  const delRes = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"DELETE FROM sch_leangsp_prod.tedp_reporte_avance WHERE id_reporte_avance = 15 AND estado_reporte = 'JORNADA_EN_CURSO';\\""`);
  console.log(delRes.stdout.trim() || delRes.stderr);

  // 2. Corregir reporte ID 17 a dia_correlativo = 2
  console.log('\n--- 2. ACTUALIZANDO REPORTE ID 17 A DÍA 2 ---');
  const upRes = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"UPDATE sch_leangsp_prod.tedp_reporte_avance SET dia_correlativo = 2 WHERE id_reporte_avance = 17;\\""`);
  console.log(upRes.stdout.trim() || upRes.stderr);

  // 3. Vincular equipo 33 y operador 49 a la OT 16
  console.log('\n--- 3. VINCULANDO EQUIPO 33 Y OPERADOR 49 A LA OT 16 ---');
  const relEqRes = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"
    INSERT INTO sch_leangsp_prod.tpry_rel_equipo (id_proyecto, id_equipo, rol_equipo, fecha_plan_ini, fecha_plan_fin)
    VALUES (16, 33, 'GRUA PRINCIPAL', '2026-10-13 08:00:00-03', '2026-10-16 18:00:00-03')
    ON CONFLICT DO NOTHING;

    INSERT INTO sch_leangsp_prod.tpry_rel_persona (id_proyecto, id_user, rol_asignado, fecha_plan_ini, fecha_plan_fin)
    VALUES (16, 49, 'OPERADOR GRUA', '2026-10-13 08:00:00-03', '2026-10-16 18:00:00-03')
    ON CONFLICT DO NOTHING;

    UPDATE sch_leangsp_prod.tedp_reporte_avance 
    SET id_user_operador = 49 
    WHERE id_proyecto = 16 AND id_user_operador = 1;
  \\""`);
  console.log(relEqRes.stdout.trim() || relEqRes.stderr);

  // 4. Verificar cómo quedaron los reportes de la OT 16
  console.log('\n--- 4. ESTADO FINAL REPORTES OT 16 ---');
  const finalReps = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"
    SELECT id_reporte_avance, id_proyecto, id_equipo, dia_correlativo, fecha_reporte, estado_reporte, horometro_inicio, horometro_termino, fecha_inicio_servicio, fecha_termino_servicio, cliente_nombre
    FROM sch_leangsp_prod.tedp_reporte_avance
    WHERE id_proyecto = 16
    ORDER BY dia_correlativo ASC, id_reporte_avance ASC;
  \\""`);
  console.log(finalReps.stdout.trim() || finalReps.stderr);

  ssh.dispose();
  console.log('\n✅ Regularización de base de datos finalizada.');
}

regularizarOT16().catch(console.error);
