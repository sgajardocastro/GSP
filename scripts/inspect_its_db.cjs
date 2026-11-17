const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function inspectItsDb() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const q = `
  SELECT * FROM sch_leangsp_prod.tits_informe_tecnico WHERE id_proyecto = 75;
  `;
  await ssh.execCommand(`cat << 'EOF' > /tmp/q_its_75.sql\n${q}\nEOF`);
  const r1 = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/q_its_75.sql"');
  console.log('=== tits_informe_tecnico ===\n', r1.stdout);

  const q2 = `
  SELECT * FROM sch_leangsp_prod.tits_jornadas WHERE id_its = 14;
  `;
  await ssh.execCommand(`cat << 'EOF' > /tmp/q_jornadas_75.sql\n${q2}\nEOF`);
  const r2 = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/q_jornadas_75.sql"');
  console.log('=== tits_jornadas ===\n', r2.stdout);

  ssh.dispose();
}
inspectItsDb().catch(console.error);
