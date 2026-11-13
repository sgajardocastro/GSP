import { NodeSSH } from 'node-ssh';
import path from 'path';

const ssh = new NodeSSH();

async function run() {
  try {
    await ssh.connect({
      host: 'servidor.leanglobal.cl',
      port: 1295,
      username: 'root',
      password: 'lgbl2025.'
    });

    console.log('Subiendo usuarioModel.js a backend remoto...');
    const localFile = 'd:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/ejecucion/backend_remoto/src/models/usuarioModel.js';
    const remoteFile = '/home/nodeadmin/proyectos/lean-services-gsp/src/models/usuarioModel.js';

    await ssh.putFile(localFile, remoteFile);
    console.log('✅ Archivo subido exitosamente.');

    console.log('Reiniciando pm2 10 (lean-services-gsp)...');
    const pm2Res = await ssh.execCommand('pm2 restart 10');
    console.log(pm2Res.stdout || pm2Res.stderr);

  } catch (e) {
    console.error('Error SSH:', e);
  } finally {
    ssh.dispose();
  }
}

run();
