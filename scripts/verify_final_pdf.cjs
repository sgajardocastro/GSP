const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const cmd = `
    curl -s http://127.0.0.1:3016/api/operaciones/its/preview-pdf/32 -o /tmp/test_ot32_final.pdf
    pdftotext /tmp/test_ot32_final.pdf /tmp/test_ot32_final.txt
    grep -A 3 -B 1 "TIPO DE SERVICIO:" /tmp/test_ot32_final.txt
    echo "--- FILA JORNADA ---"
    grep -A 10 "GSP-2611-00003" /tmp/test_ot32_final.txt | grep -A 4 -B 1 "Valor Fijo"
  `;

  const res = await ssh.execCommand(cmd);
  console.log(res.stdout);

  ssh.dispose();
}

main().catch(console.error);
