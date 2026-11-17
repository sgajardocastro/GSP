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
SELECT jsonb_pretty(json_field)
FROM sch_leangsp_prod.tpry_proyecto
WHERE id_proyecto = 74;
`;
  await ssh.execCommand(`cat << 'EOF' > /tmp/query_p74_jf.sql\n${sql}\nEOF`);
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -t -A -f /tmp/query_p74_jf.sql"');
  
  const text = res.stdout;
  console.log('Total characters in json_field:', text.length);

  // Buscar referencias a 39, 62, TLXF, Gallardo
  const lines = text.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('39') || line.includes('62') || line.toLowerCase().includes('tlxf') || line.toLowerCase().includes('gallardo')) {
      console.log(`L${idx}: ${line.trim()}`);
    }
  });

  ssh.dispose();
}

run().catch(console.error);
