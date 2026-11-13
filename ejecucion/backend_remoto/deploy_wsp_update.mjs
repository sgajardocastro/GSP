import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function run() {
  try {
    await ssh.connect({
      host: 'servidor.leanglobal.cl',
      port: 1295,
      username: 'root',
      password: 'lgbl2025.'
    });

    console.log('--- 1. SUBIENDO SERVER.JS CON NODE-CACHE ---');
    await ssh.putFile(
      'D:\\SGajardo\\Google Drive\\Antigravity\\Grúas San Pablo\\Propuesta Gestión Operación Grúas\\ejecucion\\backend_remoto\\whatsapp_server.js',
      '/home/nodeadmin/proyectos/gsp-whatsapp-service/server.js'
    );
    await ssh.execCommand('chown nodeadmin:nodeadmin /home/nodeadmin/proyectos/gsp-whatsapp-service/server.js');

    console.log('--- 2. REINICIANDO PM2 ---');
    const restartRes = await ssh.execCommand('su - nodeadmin -c "source \\$HOME/.nvm/nvm.sh && nvm use 16 && pm2 restart gsp-whatsapp"');
    console.log(restartRes.stdout);

    console.log('Esperando 4 segundos...');
    await new Promise(r => setTimeout(r, 4000));

    console.log('--- 3. STATUS DEL SERVICIO ---');
    const statusRes = await ssh.execCommand('curl -s http://127.0.0.1:3085/status');
    console.log('Status:', statusRes.stdout);

  } catch (e) {
    console.error(e);
  } finally {
    ssh.dispose();
  }
}

run();
