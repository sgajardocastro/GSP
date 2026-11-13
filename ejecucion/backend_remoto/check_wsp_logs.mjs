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

    console.log('--- LOGS PM2 GSP-WHATSAPP ---');
    const logs = await ssh.execCommand('su - nodeadmin -c "pm2 logs gsp-whatsapp --lines 30 --nostream"');
    console.log(logs.stdout);
    if (logs.stderr) console.log('STDERR:', logs.stderr);
  } catch (e) {
    console.error(e);
  } finally {
    ssh.dispose();
  }
}

run();
