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

    console.log('--- 1. INSTALANDO NODE-CACHE EN REMOTO ---');
    const installRes = await ssh.execCommand('su - nodeadmin -c "source \\$HOME/.nvm/nvm.sh && nvm use 16 && cd /home/nodeadmin/proyectos/gsp-whatsapp-service && npm i node-cache"');
    console.log(installRes.stdout || installRes.stderr);

  } catch (e) {
    console.error(e);
  } finally {
    ssh.dispose();
  }
}

run();
