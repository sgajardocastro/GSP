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

    const vRoutes = await ssh.execCommand('cat /home/nodeadmin/proyectos/lean-services-gsp/src/routes/viajeRoutes.js');
    console.log('viajeRoutes.js:\n', vRoutes.stdout);

    const rRoutes = await ssh.execCommand('cat /home/nodeadmin/proyectos/lean-services-gsp/src/routes/reportDiarioRoutes.js');
    console.log('reportDiarioRoutes.js:\n', rRoutes.stdout);

  } catch (e) {
    console.error('Error SSH:', e);
  } finally {
    ssh.dispose();
  }
}

run();
