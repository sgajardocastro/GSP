import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();
try {
  await ssh.connect({ host: 'servidor.leanglobal.cl', port: 1295, username: 'root', password: 'lgbl2025.' });
  const payload = JSON.stringify({
    numero: '56936483259',
    mensaje: '🤖 Hola Sergio, prueba de entrega WhatsApp desde LeanGlobal GSP (diagnostico).'
  });
  const res = await ssh.execCommand(`curl -s -X POST http://127.0.0.1:3085/enviar -H "Content-Type: application/json" -d '${payload}'`);
  console.log('Respuesta enviar:', res.stdout);

  console.log('\n--- PM2 LOGS ---');
  const logs = await ssh.execCommand('su - nodeadmin -c "pm2 logs gsp-whatsapp --lines 15 --nostream"');
  console.log(logs.stdout);
} catch (e) {
  console.error('Error:', e);
} finally {
  ssh.dispose();
}
