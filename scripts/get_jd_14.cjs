const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function getJornadas14() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const q = `
  SELECT id_jornada, id_its, fecha, patente, tipo_servicio, horas_report, tarifa_hora, subtotal 
  FROM sch_leangsp_prod.tits_jornada_detalle 
  WHERE id_its = 14
  ORDER BY id_jornada ASC;
  `;
  await ssh.execCommand(`cat << 'EOF' > /tmp/q_jd_14.sql\n${q}\nEOF`);
  const r = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/q_jd_14.sql"');
  console.log(r.stdout);
  ssh.dispose();
}
getJornadas14().catch(console.error);
