const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkReport() {
  try {
    await ssh.connect({
      host: 'servidor.leanglobal.cl',
      port: 1295,
      username: 'root',
      password: 'lgbl2025.'
    });

    const runner = `
const db = require('./src/config/dbConfig');
(async () => {
  try {
    // 1. Probar consulta de getReportsProyecto
    const q1 = await db.query(\`
      SELECT 
        r.id_reporte_avance,
        r.id_user_operador,
        r.id_user_rigger,
        COALESCE(u_op.name_frst || ' ' || u_op.apellido_pat, 'Operador') AS operador_nombre,
        CASE WHEN r.id_user_rigger IS NOT NULL THEN (u_rig.name_frst || ' ' || u_rig.apellido_pat) ELSE NULL END AS rigger_nombre
      FROM sch_leangsp.tedp_reporte_avance r
      LEFT JOIN sch_leangsp.tsec_users u_op ON r.id_user_operador = u_op.id_user
      LEFT JOIN sch_leangsp.tsec_users u_rig ON r.id_user_rigger = u_rig.id_user
      WHERE r.id_proyecto = 105
    \`);
    console.log("Q1 getReportsProyecto (OT 105):", JSON.stringify(q1.rows, null, 2));

    // 2. Probar consulta de getPendientesAnalista
    const q2 = await db.query(\`
      SELECT 
        ra.id_reporte_avance,
        ra.id_proyecto,
        CASE WHEN ra.id_user_rigger IS NOT NULL THEN (u_rig.name_frst || ' ' || u_rig.apellido_pat) ELSE NULL END AS rigger_nombre
      FROM sch_leangsp.tedp_reporte_avance ra
      LEFT JOIN sch_leangsp.tsec_users u_rig ON ra.id_user_rigger = u_rig.id_user
      WHERE ra.id_proyecto = 105
    \`);
    console.log("Q2 getPendientesAnalista (OT 105):", JSON.stringify(q2.rows, null, 2));

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
    `;

    await ssh.execCommand(`cat << 'EOF' > /home/nodeadmin/proyectos/lean-services-gsp/scratch_check.js\n${runner}\nEOF`);
    const r = await ssh.execCommand('su - nodeadmin -c "cd /home/nodeadmin/proyectos/lean-services-gsp && node scratch_check.js"');
    console.log('RESULT:\n', r.stdout || r.stderr);

    // Limpiar archivo temporal
    await ssh.execCommand('rm -f /home/nodeadmin/proyectos/lean-services-gsp/scratch_check.js');

  } catch (e) {
    console.error(e);
  } finally {
    ssh.dispose();
  }
}

checkReport();
