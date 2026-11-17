const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const sql = `
SELECT id_log_desplazamiento, id_proyecto, id_equipo, id_user_chofer, patente, fecha_programada, fecha_salida_patio, fecha_llegada_faena, fecha_salida_faena, fecha_llegada_patio, obs_termino
FROM sch_leangsp_prod.tequ_log_desplazamiento
WHERE id_proyecto = 74;
`;
  await ssh.execCommand(`cat << 'EOF' > /tmp/query_tequ_log.sql\n${sql}\nEOF`);
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/query_tequ_log.sql"');
  console.log(res.stdout);

  ssh.dispose();
}

run().catch(console.error);
