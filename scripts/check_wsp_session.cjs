const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkWsp() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  console.log('Reiniciando servicio WhatsApp (PM2 17)...');
  const res = await ssh.execCommand('su - nodeadmin -c "pm2 restart 17"');
  console.log(res.stdout);

  await new Promise(r => setTimeout(r, 4000));

  console.log('Logs post-reinicio de WhatsApp:');
  const logs = await ssh.execCommand('su - nodeadmin -c "pm2 logs gsp-whatsapp --lines 25 --nostream"');
  console.log(logs.stdout || logs.stderr);

  ssh.dispose();
}

checkWsp().catch(console.error);
