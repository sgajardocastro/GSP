const { NodeSSH } = require('../node_modules/node-ssh');
const path = require('path');

const ssh = new NodeSSH();

async function deployAndTest() {
  try {
    await ssh.connect({
      host: 'servidor.leanglobal.cl',
      port: 1295,
      username: 'root',
      password: 'lgbl2025.'
    });
    console.log('✅ Conectado por SSH como root.');

    const localSrc = 'D:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/ejecucion/backend_remoto/src';
    const remoteSrc = '/home/nodeadmin/proyectos/lean-services-gsp/src';

    console.log(`Subiendo directorio ${localSrc} a ${remoteSrc}...`);
    const status = await ssh.putDirectory(localSrc, remoteSrc, {
      recursive: true,
      concurrency: 5
    });

    console.log('putDirectory status:', status ? 'OK' : 'FAIL');

    console.log('Ajustando permisos a nodeadmin:nodeadmin...');
    await ssh.execCommand('chown -R nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp/src');

    console.log('Reiniciando PM2 proceso 10 (lean-services-gsp)...');
    const restartRes = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
    console.log('Restart STDOUT:', restartRes.stdout);
    if (restartRes.stderr) console.log('Restart STDERR:', restartRes.stderr);

    // Esperar 2.5s para que PM2 estabilice el proceso
    await new Promise(r => setTimeout(r, 2500));

    console.log('--- PM2 STATUS ---');
    const pm2Status = await ssh.execCommand('su - nodeadmin -c "pm2 status 10"');
    console.log(pm2Status.stdout);

    console.log('--- PM2 LOGS ---');
    const logs = await ssh.execCommand('su - nodeadmin -c "pm2 logs 10 --lines 25 --nostream"');
    console.log(logs.stdout);
    if (logs.stderr) console.log(logs.stderr);

    console.log('--- TEST DIRECTO INTERNO (PORT 3006) ---');
    const curlLocal = await ssh.execCommand('curl -s http://localhost:3006/api/reports/usuario/pendientes?id_user=55');
    console.log('Local response:', curlLocal.stdout);

    console.log('--- TEST EXTERNO NGINX DEV ---');
    const curlExternal = await ssh.execCommand('curl -s https://servidor.leanglobal.cl/lg-gsp-dev/api/reports/usuario/pendientes?id_user=55');
    console.log('External response:', curlExternal.stdout);

  } catch (err) {
    console.error('Error durante el despliegue:', err);
  } finally {
    ssh.dispose();
  }
}

deployAndTest();
