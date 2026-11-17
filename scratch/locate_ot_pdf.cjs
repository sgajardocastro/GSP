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
    SELECT id_doc, nombre_archivo, path_relativo, created_at
    FROM sch_leangsp.tfmg_file
    WHERE id_doc = 2182;
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/check_file.sql
${sql}
EOF`);

  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -f /tmp/check_file.sql"`);
  console.log("Archivo en tfmg_file:\n", res.stdout);
  await ssh.execCommand(`rm -f /tmp/check_file.sql`);

  // Let's locate the file anywhere in filesystem
  const resLoc = await ssh.execCommand('find / -name "OT-GSP-2611-00139V15-274.pdf" 2>/dev/null');
  console.log("Ubicación en disco:\n", resLoc.stdout);

  if (resLoc.stdout.trim()) {
    const p = resLoc.stdout.trim().split('\n')[0];
    const resTxt = await ssh.execCommand(`pdftotext "${p}" -`);
    console.log("=== TEXTO EXTRAÍDO DEL PDF ===");
    console.log(resTxt.stdout);
  }

  ssh.dispose();
}

run().catch(console.error);
