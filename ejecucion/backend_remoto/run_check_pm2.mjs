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

    const res = await ssh.execCommand('su - nodeadmin -c "pm2 list"');
    console.log(res.stdout);
  } catch (err) {
    console.error(err);
  } finally {
    ssh.dispose();
  }
}

run();
