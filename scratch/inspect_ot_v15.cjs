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

  // Find the generated PDF file on disk
  const resFind = await ssh.execCommand('find /var/www/html/storage/GSP -name "OT-GSP-2611-00139V15-274.pdf"');
  const pdfPath = resFind.stdout.trim().split('\n')[0];
  console.log("PDF Path encontrado:", pdfPath);

  if (pdfPath) {
    const resText = await ssh.execCommand(`pdftotext "${pdfPath}" -`);
    console.log("=== CONTENIDO EXTRAÍDO DEL PDF DE LA OT V15 ===");
    console.log(resText.stdout);
  } else {
    // Try finding in public/ot
    const resFindPub = await ssh.execCommand('find /home/nodeadmin -name "OT-GSP-2611-00139V15-274.pdf"');
    console.log("En home/nodeadmin:", resFindPub.stdout);
  }

  ssh.dispose();
}

run().catch(console.error);
