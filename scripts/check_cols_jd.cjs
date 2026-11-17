const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkCols() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const q = `
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_schema = 'sch_leangsp_prod' AND table_name = 'tits_jornada_detalle'
  ORDER BY ordinal_position;
  `;
  await ssh.execCommand(`cat << 'EOF' > /tmp/q_cols_jd.sql\n${q}\nEOF`);
  const r = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/q_cols_jd.sql"');
  console.log(r.stdout);
  ssh.dispose();
}
checkCols().catch(console.error);
