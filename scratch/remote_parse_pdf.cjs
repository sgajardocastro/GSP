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

  const remoteScript = `
const fs = require('fs');
const pdf = require('pdf-parse');

async function test() {
  // Buscar archivo 1842 en tdoc_documentos
  const pool = require('./src/config/postgresPool');
  const { rows } = await pool.query('SELECT filepath FROM tdoc_documentos WHERE id_documento = 1842');
  if (rows.length === 0) { console.log('Doc 1842 not found'); return; }
  const dataBuffer = fs.readFileSync(rows[0].filepath);
  const data = await pdf(dataBuffer);
  console.log('=== PAGES:', data.numpages);
  console.log('=== CONTENT:');
  console.log(data.text);
}
test().catch(console.error);
`;

  await ssh.execCommand("cat << 'EOF' > /home/nodeadmin/proyectos/lean-services-gsp/parse_pdf.js\n" + remoteScript + "\nEOF");
  await ssh.execCommand("chown nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp/parse_pdf.js");
  const res = await ssh.execCommand('su - nodeadmin -c "cd /home/nodeadmin/proyectos/lean-services-gsp && node parse_pdf.js"');
  console.log(res.stdout);
  await ssh.execCommand("rm -f /home/nodeadmin/proyectos/lean-services-gsp/parse_pdf.js");
  ssh.dispose();
}

run().catch(console.error);
