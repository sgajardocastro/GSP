const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function checkCols() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const sql = `
  SELECT column_name FROM information_schema.columns 
  WHERE table_schema = 'sch_leangsp_prod' AND table_name = 'tedp_reporte_avance' AND column_name LIKE 'id_doc%';

  SELECT column_name FROM information_schema.columns 
  WHERE table_schema = 'sch_leangsp_prod' AND table_name = 'tequ_log_desplazamiento' AND column_name LIKE 'id_doc%';
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/chk_cols.sql\n${sql}\nEOF`);
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/chk_cols.sql"');
  console.log(res.stdout);

  ssh.dispose();
}

checkCols().catch(console.error);
