const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  console.log('=== AUDITORÍA FORENSE BD OT 32 Y OT 30 ===\n');

  const script = `
    const { Pool } = require('pg');
    const pool = new Pool({
      user: 'usr_leangsp_prod',
      password: 'usr_gsp_prod_2026!',
      host: 'localhost',
      database: 'postgres',
      port: 5432
    });

    async function run() {
      // 1. tequ_log_desplazamiento para id_proyecto IN (30, 32) o chofer 40
      console.log('--- 1. tequ_log_desplazamiento ---');
      const logs = await pool.query(\`
        SELECT ld.id_log_desplazamiento, ld.id_proyecto, ld.id_equipo, ld.patente, ld.tipo_trayecto, 
               ld.fecha_salida_patio, ld.fecha_llegada_faena, ld.fecha_salida_faena, ld.fecha_llegada_patio, 
               ld.id_user_chofer, e.modelo, e.tipo_equipo
        FROM sch_leangsp_prod.tequ_log_desplazamiento ld
        LEFT JOIN sch_leangsp_prod.tequ_equipo e ON e.id_equipo = ld.id_equipo
        WHERE ld.id_proyecto IN (30, 32) OR ld.id_user_chofer = 40
        ORDER BY ld.id_proyecto, ld.id_log_desplazamiento;
      \`);
      console.log(logs.rows);

      // 2. tedp_reporte_avance para id_proyecto IN (30, 32)
      console.log('\\n--- 2. tedp_reporte_avance ---');
      const reps = await pool.query(\`
        SELECT ra.id_reporte_avance, ra.id_proyecto, ra.id_equipo, ra.fecha_reporte, ra.horas_operadas, ra.horas_facturables,
               ra.id_user_operador, ra.id_user_rigger, e.patente, e.modelo, e.tipo_equipo
        FROM sch_leangsp_prod.tedp_reporte_avance ra
        LEFT JOIN sch_leangsp_prod.tequ_equipo e ON e.id_equipo = ra.id_equipo
        WHERE ra.id_proyecto IN (30, 32)
        ORDER BY ra.id_proyecto, ra.id_reporte_avance;
      \`);
      console.log(reps.rows);

      // 3. tpry_rel_equipo para id_proyecto IN (30, 32)
      console.log('\\n--- 3. tpry_rel_equipo ---');
      const relEq = await pool.query(\`
        SELECT re.id_proyecto, re.id_equipo, re.rol_equipo, e.patente, e.modelo, e.tipo_equipo
        FROM sch_leangsp_prod.tpry_rel_equipo re
        LEFT JOIN sch_leangsp_prod.tequ_equipo e ON e.id_equipo = re.id_equipo
        WHERE re.id_proyecto IN (30, 32);
      \`);
      console.log(relEq.rows);

      // 4. Tracto camiones en tequ_equipo
      console.log('\\n--- 4. Tracto Camiones en flota (tequ_equipo) ---');
      const tractos = await pool.query(\`
        SELECT id_equipo, patente, marca, modelo, tipo_equipo, id_subcategoria
        FROM sch_leangsp_prod.tequ_equipo
        WHERE tipo_equipo ILIKE '%tracto%' OR tipo_equipo ILIKE '%camion%' OR modelo ILIKE '%C7H%' OR patente IN ('RWJL.23-K', 'JC.2796-2', 'PJYY.20-1')
        ORDER BY id_equipo;
      \`);
      console.log(tractos.rows);

      // 5. json_field ejecucion_v1 y operaciones_v1 de OT 32 y 30
      console.log('\\n--- 5. json_field de OT 32 y 30 ---');
      const prys = await pool.query(\`
        SELECT id_proyecto, codi_proyecto, json_field
        FROM sch_leangsp_prod.tpry_proyecto
        WHERE id_proyecto IN (30, 32);
      \`);
      for (const p of prys.rows) {
        const jf = typeof p.json_field === 'string' ? JSON.parse(p.json_field) : p.json_field;
        console.log(\`OT \${p.id_proyecto} (\${p.codi_proyecto}):\`);
        console.log('  operaciones_v1:', jf ? jf.operaciones_v1 : null);
        console.log('  ejecucion_v1.tripulacion_asignada:', jf && jf.ejecucion_v1 ? jf.ejecucion_v1.tripulacion_asignada : null);
        console.log('  ejecucion_v1.equipos_asignados:', jf && jf.ejecucion_v1 ? jf.ejecucion_v1.equipos_asignados : null);
        console.log('  ejecucion_v1.aparejos:', jf && jf.ejecucion_v1 ? jf.ejecucion_v1.aparejos : null);
      }

      // 6. tits_jornada_detalle y tits_costo_operacional de OT 32 y 30
      console.log('\\n--- 6. tits_jornada_detalle y tits_costo_operacional ---');
      const jor32 = await pool.query(\`
        SELECT j.id_jornada, j.id_its, i.id_proyecto, j.fecha, j.patente, j.tipo_servicio, j.hora_salida, j.hora_llegada, j.hora_termino, j.hora_retorno, j.numero_report
        FROM sch_leangsp_prod.tits_jornada_detalle j
        JOIN sch_leangsp_prod.tits_informe_termino i ON i.id_its = j.id_its
        WHERE i.id_proyecto IN (30, 32);
      \`);
      console.log('Jornadas guardadas:', jor32.rows);

      const cos32 = await pool.query(\`
        SELECT c.id_costo, c.id_its, i.id_proyecto, c.categoria, c.fecha, c.concepto_detalle, c.cantidad_unidades, c.precio_unitario, c.monto_total, c.auditoria_metadata
        FROM sch_leangsp_prod.tits_costo_operacional c
        JOIN sch_leangsp_prod.tits_informe_termino i ON i.id_its = c.id_its
        WHERE i.id_proyecto IN (30, 32);
      \`);
      console.log('Costos guardados:', cos32.rows);

      await pool.end();
    }
    run().catch(console.error);
  `;

  await ssh.execCommand(`cat << 'EOF' > /home/nodeadmin/proyectos/lean-services-gsp-prod/audit_fleet_and_costs.js\n${script}\nEOF`);
  const res = await ssh.execCommand('cd /home/nodeadmin/proyectos/lean-services-gsp-prod && node audit_fleet_and_costs.js');
  console.log(res.stdout);
  if (res.stderr) console.error(res.stderr);

  ssh.dispose();
}

main().catch(console.error);
