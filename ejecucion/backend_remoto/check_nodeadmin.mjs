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

    console.log('--- REVISANDO ENTORNO NODEADMIN ---');
    const res = await ssh.execCommand('su - nodeadmin -c "node -v; npm -v; which node; pm2 -v;"');
    console.log(res.stdout);
    console.log(res.stderr);

    const nvmRes = await ssh.execCommand('su - nodeadmin -c "[ -s \\$HOME/.nvm/nvm.sh ] && source \\$HOME/.nvm/nvm.sh && nvm ls || echo \'No NVM\'"');
    console.log('NVM en nodeadmin:\n', nvmRes.stdout);

  } catch (e) {
    console.error('Error SSH:', e);
  } finally {
    ssh.dispose();
  }
}

run();
