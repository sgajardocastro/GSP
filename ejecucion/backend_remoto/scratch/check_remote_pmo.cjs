const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkRemoteWeb() {
  try {
    await ssh.connect({
      host: 'servidor.leanglobal.cl',
      port: 1295,
      username: 'root',
      password: 'lgbl2025.'
    });

    const file = '/var/www/html/lg-gsp-dev/assets/index-C5c1e9V-.js';
    const r1 = await ssh.execCommand(`grep -c "Reports por Validar" ${file}`);
    const r2 = await ssh.execCommand(`grep -c "1. Reports Diarios Inbox" ${file}`);
    const r3 = await ssh.execCommand(`grep -c "2. Informes de Término (ITS)" ${file}`);
    const r4 = await ssh.execCommand(`grep -c "3. Pipeline EDP & Facturación" ${file}`);
    const r5 = await ssh.execCommand(`grep -c "4. Matriz Hitos Global OT" ${file}`);

    console.log('=== CONFIRMACIÓN EN SERVIDOR REMOTO ===');
    console.log('Reports por Validar:', r1.stdout.trim());
    console.log('1. Reports Diarios Inbox:', r2.stdout.trim());
    console.log('2. Informes de Término (ITS):', r3.stdout.trim());
    console.log('3. Pipeline EDP & Facturación:', r4.stdout.trim());
    console.log('4. Matriz Hitos Global OT:', r5.stdout.trim());

  } catch (e) {
    console.error(e);
  } finally {
    ssh.dispose();
  }
}

checkRemoteWeb();
