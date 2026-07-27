const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function run() {
  try {
    await ssh.connect({
      host: 'servidor.leanglobal.cl',
      username: 'root',
      password: 'lgbl2025.',
      port: 1295
    });
    console.log("Connected!");

    const controllerResult = await ssh.execCommand('cat /u05/LeanDocs/lean-services-gsp/src/controllers/tequEquipoController.js');
    console.log("Remote Controller File has getCategorias:", controllerResult.stdout.includes('getCategorias'));

  } catch (err) {
    console.error(err);
  } finally {
    ssh.dispose();
  }
}

run();
