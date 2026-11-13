const { NodeSSH } = require('node-ssh');
const path = require('path');

const ssh = new NodeSSH();

async function deployBackend() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: 'lgbl2025.'
  });

  console.log('⬆️ Subiendo itsController.js a prod...');
  const localFile = path.resolve(__dirname, '../src/controllers/itsController.js');
  const remoteFile = '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/itsController.js';
  await ssh.putFile(localFile, remoteFile);
  console.log('✅ itsController.js subido.');

  console.log('🔄 Reiniciando servicio backend prod...');
  const srv = await ssh.execCommand('systemctl list-units --type=service | grep -i gsp-prod || systemctl list-units --type=service | grep 3016');
  console.log('Servicios detectados:\n', srv.stdout);

  // Intentar reiniciar con systemctl o pkill si es nodeadmin
  await ssh.execCommand('systemctl restart gsp-prod-backend.service || systemctl restart lean-services-gsp-prod.service || pkill -f "3016" || true');

  // Esperar 2 segundos
  await new Promise(r => setTimeout(r, 2000));

  console.log('🔍 Probando endpoint /operaciones/its/flujo/1...');
  const res = await ssh.execCommand('curl -s http://127.0.0.1:3016/api/operaciones/its/flujo/1');
  console.log('Respuesta endpoint:\n', res.stdout);

  ssh.dispose();
}

deployBackend().catch(console.error);
