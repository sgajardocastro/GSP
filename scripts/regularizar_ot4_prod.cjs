const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function regularizar() {
  console.log('Conectando a servidor SSH para regularizar OT 4...');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const sql = `
    BEGIN;
    UPDATE sch_leangsp_prod.tequ_log_desplazamiento 
    SET estado_trayecto = 'ARRIBADO', 
        fecha_llegada_faena = COALESCE(fecha_llegada_faena, '2026-10-06 08:00:00-03')
    WHERE id_log_desplazamiento = 3 AND id_proyecto = 4;

    UPDATE sch_leangsp_prod.tpry_rel_persona 
    SET rol_asignado = 'Operador Grúa' 
    WHERE id_proyecto = 4 AND id_user = 49;

    UPDATE sch_leangsp_prod.tedp_reporte_avance 
    SET id_user_operador = 49 
    WHERE id_reporte_avance = 9;
    COMMIT;
  `;

  console.log('Ejecutando SQL en sch_leangsp_prod...');
  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sql}\\""`);
  console.log('Salida SQL:', res.stdout);
  if (res.stderr) console.error('Stderr SQL:', res.stderr);

  console.log('\n--- VERIFICACIÓN POST-REGULARIZACIÓN ---');
  const verifViaje = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -A -c \\"SELECT id_log_desplazamiento, estado_trayecto, fecha_llegada_faena FROM sch_leangsp_prod.tequ_log_desplazamiento WHERE id_log_desplazamiento = 3;\\""`);
  console.log('Viaje 3:', verifViaje.stdout.trim());

  const verifPersona = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -A -c \\"SELECT id_rel_persona, id_proyecto, id_user, rol_asignado FROM sch_leangsp_prod.tpry_rel_persona WHERE id_proyecto = 4 AND id_user = 49;\\""`);
  console.log('Persona 49 en OT 4:', verifPersona.stdout.trim());

  const verifReport = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -A -c \\"SELECT id_reporte_avance, id_user_operador, dia_correlativo, estado_reporte FROM sch_leangsp_prod.tedp_reporte_avance WHERE id_reporte_avance = 9;\\""`);
  console.log('Reporte 9:', verifReport.stdout.trim());

  ssh.dispose();
}

regularizar().catch(err => {
  console.error('Error regularizando OT 4:', err);
  process.exit(1);
});
