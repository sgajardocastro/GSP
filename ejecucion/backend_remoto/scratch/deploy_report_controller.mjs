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

    console.log('Subiendo reportDiarioController.js...');
    const localCtrl = 'D:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/ejecucion/backend_remoto/src/controllers/reportDiarioController.js';
    const remoteCtrl = '/home/nodeadmin/proyectos/lean-services-gsp/src/controllers/reportDiarioController.js';
    await ssh.putFile(localCtrl, remoteCtrl);
    console.log('✅ reportDiarioController.js subido exitosamente.');

    console.log('Subiendo reportDiarioPdfService.js...');
    const localPdf = 'D:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/ejecucion/backend_remoto/src/services/reportDiarioPdfService.js';
    const remotePdf = '/home/nodeadmin/proyectos/lean-services-gsp/src/services/reportDiarioPdfService.js';
    await ssh.putFile(localPdf, remotePdf);
    console.log('✅ reportDiarioPdfService.js subido exitosamente.');

    console.log('Reiniciando pm2 10...');
    let pm2Res = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
    console.log('nodeadmin pm2:', pm2Res.stdout || pm2Res.stderr);

    if (!pm2Res.stdout && !pm2Res.stderr) {
      pm2Res = await ssh.execCommand('pm2 restart 10');
      console.log('root pm2:', pm2Res.stdout || pm2Res.stderr);
    }

  } catch (e) {
    console.error('Error SSH:', e);
  } finally {
    ssh.dispose();
  }
}

run();
