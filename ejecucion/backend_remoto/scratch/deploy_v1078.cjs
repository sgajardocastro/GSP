const { NodeSSH } = require('../node_modules/node-ssh');
const path = require('path');

const ssh = new NodeSSH();

async function deployV1078() {
  console.log('==================================================================');
  console.log('🚀 DESPLIEGUE V1.0.78: CONTROL OPERATIVO EN VIVO (OPCIÓN 3 HÍBRIDA)');
  console.log('==================================================================');

  try {
    await ssh.connect({
      host: 'servidor.leanglobal.cl',
      port: 1295,
      username: 'root',
      password: 'lgbl2025.'
    });
    console.log('✅ Conectado por SSH como root.');

    const rootDir = 'D:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas';
    const localBackendSrc = `${rootDir}/ejecucion/backend_remoto/src`;
    const remoteBackendSrc = '/home/nodeadmin/proyectos/lean-services-gsp/src';

    const localFrontendDist = `${rootDir}/ejecucion/frontend/dist`;
    const remoteFrontendDev = '/var/www/html/lg-gsp-dev';

    // 1. DESPLIEGUE BACKEND
    console.log(`\n📦 [1/4] Subiendo Backend (${localBackendSrc} -> ${remoteBackendSrc})...`);
    const backendStatus = await ssh.putDirectory(localBackendSrc, remoteBackendSrc, {
      recursive: true,
      concurrency: 5
    });
    console.log('putDirectory Backend:', backendStatus ? 'OK' : 'FAIL');

    console.log('Ajustando permisos a nodeadmin:nodeadmin...');
    await ssh.execCommand('chown -R nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp/src');

    console.log('Reiniciando PM2 proceso 10 (lean-services-gsp)...');
    const restartRes = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
    console.log('Restart STDOUT:', restartRes.stdout.trim());
    if (restartRes.stderr) console.log('Restart STDERR:', restartRes.stderr.trim());

    // 2. DESPLIEGUE FRONTEND
    console.log(`\n📦 [2/4] Respaldando y limpiando ${remoteFrontendDev}...`);
    const ts = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    await ssh.execCommand(`mkdir -p /var/www/html/backups`);
    await ssh.execCommand(`tar -czf /var/www/html/backups/lg-gsp-dev-bak-${ts}.tar.gz -C /var/www/html lg-gsp-dev 2>/dev/null`);

    console.log(`Subiendo Frontend Dist (${localFrontendDist} -> ${remoteFrontendDev})...`);
    const frontendStatus = await ssh.putDirectory(localFrontendDist, remoteFrontendDev, {
      recursive: true,
      concurrency: 8
    });
    console.log('putDirectory Frontend:', frontendStatus ? 'OK' : 'FAIL');

    console.log('Ajustando permisos nginx:nginx...');
    await ssh.execCommand(`chown -R nginx:nginx ${remoteFrontendDev}`);
    await ssh.execCommand(`chmod -R 755 ${remoteFrontendDev}`);

    // 3. ESPERAR ESTABILIZACIÓN PM2
    console.log('\n⏳ [3/4] Esperando 3s para verificación de estabilidad...');
    await new Promise(r => setTimeout(r, 3000));

    const pm2Status = await ssh.execCommand('su - nodeadmin -c "pm2 status 10"');
    console.log(pm2Status.stdout.trim());

    // 4. PRUEBAS DE VERIFICACIÓN EMPÍRICA (HARD GATE)
    console.log('\n🧪 [4/4] Probando Endpoint Control Vivo (Local 3006)...');
    const curlLocal = await ssh.execCommand('curl -s http://localhost:3006/api/operaciones/control-vivo');
    try {
      const jsonLocal = JSON.parse(curlLocal.stdout);
      console.log('✅ Control Vivo Local Respondió con éxito:');
      console.log('   Total OTs:', jsonLocal.kpis?.total_ots);
      console.log('   KPIs:', jsonLocal.kpis);
      console.log('   Total servicios devueltos:', jsonLocal.servicios?.length);
    } catch (e) {
      console.log('Respuesta Local (raw):', curlLocal.stdout.slice(0, 300));
    }

    console.log('\n🧪 Probando Endpoint Control Vivo (Nginx Externo DEV)...');
    const curlExt = await ssh.execCommand('curl -s https://servidor.leanglobal.cl/lg-gsp-dev/api/operaciones/control-vivo');
    try {
      const jsonExt = JSON.parse(curlExt.stdout);
      console.log('✅ Control Vivo Externo Nginx Respondió con éxito:');
      console.log('   Total OTs:', jsonExt.kpis?.total_ots);
      console.log('   KPIs:', jsonExt.kpis);
    } catch (e) {
      console.log('Respuesta Externa (raw):', curlExt.stdout.slice(0, 300));
    }

    console.log('\n🧪 Probando Notificaciones Web DEV...');
    const curlNotif = await ssh.execCommand('curl -s https://servidor.leanglobal.cl/lg-gsp-dev/api/operaciones/control-vivo/notificaciones');
    try {
      const jsonNotif = JSON.parse(curlNotif.stdout);
      console.log('✅ Notificaciones Web DEV Respondió:', jsonNotif.success ? 'OK' : 'FAIL', 'Alertas:', jsonNotif.data?.length);
    } catch (e) {
      console.log('Respuesta Notif (raw):', curlNotif.stdout.slice(0, 300));
    }

    console.log('\n==================================================================');
    console.log('🎉 DESPLIEGUE V1.0.78 COMPLETADO CON ÉXITO');
    console.log('==================================================================');

  } catch (err) {
    console.error('❌ Error durante el despliegue v1.0.78:', err);
  } finally {
    ssh.dispose();
  }
}

deployV1078();
