const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function testWsp() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  console.log('Enviando mensaje de prueba a +56936483259 vía http://127.0.0.1:3085/enviar...');
  const res = await ssh.execCommand(`curl -s -X POST http://127.0.0.1:3085/enviar -H "Content-Type: application/json" -d '{"numero": "56936483259", "mensaje": "🔔 *GSP Notificaciones* — Tu canal de WhatsApp ha sido reestablecido exitosamente."}'`);
  console.log('Respuesta microservicio WhatsApp:\n', res.stdout);

  ssh.dispose();
}

testWsp().catch(console.error);
