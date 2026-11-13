import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();

async function run() {
  try {
    await ssh.connect({ host: 'servidor.leanglobal.cl', port: 1295, username: 'root', password: 'lgbl2025.' });
    console.log('Subiendo visitaTerrenoController.js...');
    await ssh.putFile(
      '../src/controllers/visitaTerrenoController.js',
      '/home/nodeadmin/proyectos/lean-services-gsp/src/controllers/visitaTerrenoController.js'
    );
    await ssh.execCommand('chown -R nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp');
    const restartRes = await ssh.execCommand('su - nodeadmin -c "pm2 restart lean-services-gsp"');
    console.log('Backend reiniciado:', restartRes.stdout);
  } catch (err) {
    console.error('Error SSH:', err);
  } finally {
    ssh.dispose();
  }
}

run();
