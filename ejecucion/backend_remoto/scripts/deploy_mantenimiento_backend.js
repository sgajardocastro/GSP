const { NodeSSH } = require('node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function run() {
  try {
    console.log('Conectando por SSH a servidor.leanglobal.cl:1295...');
    await ssh.connect({
      host: 'servidor.leanglobal.cl',
      port: 1295,
      username: 'root',
      password: 'lgbl2025.'
    });
    console.log('Conexión SSH exitosa.');

    // 1. Ver lista de procesos PM2 de nodeadmin
    console.log('\n--- PM2 Processes (nodeadmin) ---');
    const pm2Res = await ssh.execCommand('su - nodeadmin -c "pm2 list"');
    console.log(pm2Res.stdout);

    // 2. Localizar directorios DEV y PROD
    console.log('\n--- PM2 Describe 10 (DEV) ---');
    const desc10 = await ssh.execCommand('su - nodeadmin -c "pm2 describe 10"');
    console.log(desc10.stdout.split('\n').filter(l => l.includes('exec cwd') || l.includes('script path') || l.includes('name')).join('\n'));

    console.log('\n--- PM2 Describe 13 (PROD) ---');
    const desc13 = await ssh.execCommand('su - nodeadmin -c "pm2 describe 13"');
    console.log(desc13.stdout.split('\n').filter(l => l.includes('exec cwd') || l.includes('script path') || l.includes('name')).join('\n'));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    ssh.dispose();
  }
}

run();
