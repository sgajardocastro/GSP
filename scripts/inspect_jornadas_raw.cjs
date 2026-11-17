const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function inspectJornadasRaw() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const q = `
  SELECT id_jornada, fecha, patente, tipo_servicio, horas_reales, horas_report, tarifa_hora, subtotal, id_reporte_avance, id_equipo
  FROM sch_leangsp_prod.tits_jornada_detalle 
  WHERE id_its = 14
  ORDER BY id_jornada;
  `;
  await ssh.execCommand(`cat << 'EOF' > /tmp/q_jd_raw.sql\n${q}\nEOF`);
  const r = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/q_jd_raw.sql"');
  console.log(r.stdout);

  ssh.dispose();
}
inspectJornadasRaw().catch(console.error);
