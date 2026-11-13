import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();

async function run() {
  try {
    await ssh.connect({ host: 'servidor.leanglobal.cl', port: 1295, username: 'root', password: 'lgbl2025.' });
    const res = await ssh.execCommand('grep -n "fProg" /home/nodeadmin/proyectos/lean-services-gsp/src/controllers/viajeController.js');
    console.log('grep fProg en servidor:', res.stdout || 'NO ENCONTRADO');
    
    console.log('Reiniciando lean-services-gsp bajo usuario nodeadmin...');
    const restartRes = await ssh.execCommand('su - nodeadmin -c "pm2 restart lean-services-gsp"');
    console.log('Resultado restart:', restartRes.stdout);

    const pm2res = await ssh.execCommand('su - nodeadmin -c "pm2 list"');
    console.log('pm2 status (nodeadmin):\n', pm2res.stdout);
  } catch (err) {
    console.error('Error SSH:', err);
  } finally {
    ssh.dispose();
  }
}

run();
