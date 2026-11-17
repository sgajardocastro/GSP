const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function inspectItsRows() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const q = `
  SELECT * FROM sch_leangsp_prod.tits_informe_termino WHERE id_proyecto = 75;
  `;
  await ssh.execCommand(`cat << 'EOF' > /tmp/q_its_term.sql\n${q}\nEOF`);
  const r1 = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/q_its_term.sql"');
  console.log('=== tits_informe_termino ===\n', r1.stdout);

  const q2 = `
  SELECT id_jornada_detalle, id_its, fecha, tipo_servicio, horas_report, tarifa_unitaria, subtotal, observaciones, id_equipo, patente
  FROM sch_leangsp_prod.tits_jornada_detalle 
  WHERE id_its = 14;
  `;
  await ssh.execCommand(`cat << 'EOF' > /tmp/q_jornadas_det.sql\n${q2}\nEOF`);
  const r2 = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/q_jornadas_det.sql"');
  console.log('=== tits_jornada_detalle ===\n', r2.stdout);

  ssh.dispose();
}
inspectItsRows().catch(console.error);
