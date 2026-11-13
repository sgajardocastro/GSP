import { NodeSSH } from 'node-ssh';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ssh = new NodeSSH();

async function test() {
  console.log('🔌 Conectando a servidor Centos por SSH...');
  await ssh.connect({
    host: 'servidor.leanglobal.cl',
    port: 1295,
    username: 'root',
    password: 'lgbl2025.'
  });

  const localFile = path.resolve(__dirname, 'run_test_live.js');
  const remoteFile = '/home/nodeadmin/proyectos/lean-services-gsp/run_test_live.js';

  console.log('📤 Subiendo run_test_live.js al servidor...');
  await ssh.putFile(localFile, remoteFile);
  await ssh.execCommand('chown nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp/run_test_live.js');

  console.log('📲 Ejecutando test de notificación en vivo...');
  const res = await ssh.execCommand('sudo -u nodeadmin node run_test_live.js', {
    cwd: '/home/nodeadmin/proyectos/lean-services-gsp'
  });

  console.log('STDOUT:\n', res.stdout);
  if (res.stderr) console.error('STDERR:\n', res.stderr);

  ssh.dispose();
}

test().catch(console.error);
