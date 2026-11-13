import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function run() {
  try {
    console.log('Conectando a servidor.leanglobal.cl:1295...');
    await ssh.connect({
      host: 'servidor.leanglobal.cl',
      port: 1295,
      username: 'root',
      password: 'lgbl2025.'
    });
    console.log('Conexión SSH exitosa.');

    console.log('\n--- 1. VERIFICAR DOCKER ---');
    const dockerVer = await ssh.execCommand('docker --version');
    console.log('Docker Version:', dockerVer.stdout || dockerVer.stderr || 'No instalado');

    const dockerComposeVer = await ssh.execCommand('docker compose version || docker-compose --version');
    console.log('Compose Version:', dockerComposeVer.stdout || dockerComposeVer.stderr || 'No instalado');

    const dockerPs = await ssh.execCommand('docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"');
    console.log('Contenedores Docker:\n', dockerPs.stdout || 'Ninguno');

    console.log('\n--- 2. VERIFICAR PM2 & NODE ---');
    const pm2List = await ssh.execCommand('pm2 list');
    console.log('PM2 Process List:\n', pm2List.stdout || pm2List.stderr);

    console.log('\n--- 3. MEMORIA Y RECURSOS ---');
    const mem = await ssh.execCommand('free -m');
    console.log(mem.stdout);

  } catch (e) {
    console.error('Error SSH:', e);
  } finally {
    ssh.dispose();
  }
}

run();
