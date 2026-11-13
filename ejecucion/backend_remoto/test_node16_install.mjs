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

    console.log('--- PROBANDO NODE 16 Y NPM EN NODEADMIN ---');
    const res = await ssh.execCommand('su - nodeadmin -c "source \\$HOME/.nvm/nvm.sh && nvm use 16 && cd /home/nodeadmin/proyectos/gsp-whatsapp-service && npm install --save --legacy-peer-deps"');
    console.log('STDOUT:\n', res.stdout);
    console.log('STDERR:\n', res.stderr);

    const check = await ssh.execCommand('su - nodeadmin -c "source \\$HOME/.nvm/nvm.sh && nvm use 16 && cd /home/nodeadmin/proyectos/gsp-whatsapp-service && node -e \\"console.log(\'Node 16 OK\'); import(\'@whiskeysockets/baileys\').then(() => console.log(\'Baileys OK\')).catch(e => console.error(e.message));\\""');
    console.log('TEST BAILEYS:\n', check.stdout, check.stderr);

  } catch (e) {
    console.error('Error SSH:', e);
  } finally {
    ssh.dispose();
  }
}

run();
