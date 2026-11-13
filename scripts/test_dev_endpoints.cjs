const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  console.log('--- TEST DEV (puerto 3006) ---');
  const resJson = await ssh.execCommand('curl -s http://127.0.0.1:3006/api/operaciones/its/32');
  try {
    const data = JSON.parse(resJson.stdout);
    console.log('DEV es_valor_fijo:', data.data?.its?.es_valor_fijo);
    console.log('DEV jornadas:', data.data?.jornadas?.map(j => ({ fecha: j.fecha, tipo_servicio: j.tipo_servicio, subtotal: j.subtotal })));
  } catch(e) {
    console.error('DEV JSON error:', e.message, resJson.stdout.slice(0, 100));
  }

  const resPdf = await ssh.execCommand(`
    curl -s http://127.0.0.1:3006/api/operaciones/its/preview-pdf/32 -o /tmp/test_dev_ot32.pdf
    pdftotext /tmp/test_dev_ot32.pdf /tmp/test_dev_ot32.txt
    grep -A 2 "TIPO DE SERVICIO:" /tmp/test_dev_ot32.txt
  `);
  console.log('DEV PDF tipo de servicio:');
  console.log(resPdf.stdout);

  ssh.dispose();
}

main().catch(console.error);
