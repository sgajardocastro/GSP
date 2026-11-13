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

    console.log('--- BUSCANDO VERSIONES DE NODE ---');
    const nvmCheck = await ssh.execCommand('source /root/.nvm/nvm.sh && nvm ls || true', { shell: '/bin/bash' });
    console.log('NVM root:\n', nvmCheck.stdout || nvmCheck.stderr);

    const nvmUserCheck = await ssh.execCommand('source /home/nodeadmin/.nvm/nvm.sh && nvm ls || true', { shell: '/bin/bash' });
    console.log('NVM nodeadmin:\n', nvmUserCheck.stdout || nvmUserCheck.stderr);

    const whichNodes = await ssh.execCommand('find / -name "node" -type f -perm -111 2>/dev/null | grep -E "bin/node$"');
    console.log('Rutas de node:\n', whichNodes.stdout);

  } catch (e) {
    console.error('Error SSH:', e);
  } finally {
    ssh.dispose();
  }
}

run();
