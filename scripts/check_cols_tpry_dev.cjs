const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkColsDev() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const sql = `
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_schema = 'sch_leangsp' AND table_name = 'tpry_linea_servicio'
  ORDER BY column_name;
  `;

  await ssh.execCommand("cat << 'EOF' > /tmp/check_cols_tpry_dev.sql\n" + sql + "\nEOF");
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/check_cols_tpry_dev.sql"');
  console.log(res.stdout);
  ssh.dispose();
}

checkColsDev().catch(console.error);
