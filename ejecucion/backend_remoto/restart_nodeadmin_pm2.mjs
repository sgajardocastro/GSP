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

    console.log('🔄 Reiniciando app 10 (lean-services-gsp) bajo nodeadmin...');
    const res = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
    console.log(res.stdout);

    console.log('📊 Verificando logs recientes de app 10...');
    const logs = await ssh.execCommand('su - nodeadmin -c "pm2 logs 10 --lines 15 --nostream"');
    console.log(logs.stdout);
  } catch (err) {
    console.error(err);
  } finally {
    ssh.dispose();
  }
}

run();
