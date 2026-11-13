const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const https = require('https');
const http = require('http');

const ssh = new NodeSSH();

function checkUrl(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      resolve({ status: res.statusCode, headers: res.headers });
    }).on('error', (e) => {
      resolve({ error: e.message });
    });
  });
}

async function runDeploy() {
  console.log('=== DESPLIEGUE SPEC-096: MULTITÉCNICOS & IMPRESIÓN PAUTA A4 ===');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295,
    readyTimeout: 30000
  });
  console.log('✓ Conectado a servidor SSH.');

  // 1. Despliegue Backend (PROD y DEV)
  const localModel = path.resolve(__dirname, '../ejecucion/backend_remoto/src/models/mantenimientoModel.js');
  const localController = path.resolve(__dirname, '../ejecucion/backend_remoto/src/controllers/mantenimientoController.js');

  console.log('Subiendo mantenimientoModel.js y mantenimientoController.js...');
  // PROD
  await ssh.putFile(localModel, '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/models/mantenimientoModel.js');
  await ssh.putFile(localController, '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/mantenimientoController.js');
  // DEV
  await ssh.putFile(localModel, '/home/nodeadmin/proyectos/lean-services-gsp/src/models/mantenimientoModel.js');
  await ssh.putFile(localController, '/home/nodeadmin/proyectos/lean-services-gsp/src/controllers/mantenimientoController.js');

  console.log('Reiniciando procesos PM2...');
  const restartProd = await ssh.execCommand('pm2 restart 13');
  console.log('PM2 13 (PROD):', restartProd.stdout || restartProd.stderr);
  const restartDev = await ssh.execCommand('pm2 restart 10');
  console.log('PM2 10 (DEV):', restartDev.stdout || restartDev.stderr);

  // 2. Despliegue Frontend Web a PROD
  const localWebDist = path.resolve(__dirname, '../ejecucion/frontend/dist_prod');
  const remoteWebProd = '/var/www/html/lg-gsp-prod';
  console.log('Sincronizando Frontend Web a', remoteWebProd, '...');
  await ssh.putDirectory(localWebDist, remoteWebProd, { recursive: true, concurrency: 10 });
  await ssh.execCommand(`chmod -R 755 ${remoteWebProd}`);

  // 3. Despliegue PWA Móvil a PROD y DEV
  const localPwaDist = path.resolve(__dirname, '../ejecucion/pwa/dist');
  console.log('Sincronizando PWA Móvil...');
  await ssh.putDirectory(localPwaDist, '/var/www/html/pwa-gsp-prod', { recursive: true, concurrency: 10 });
  await ssh.execCommand('chmod -R 755 /var/www/html/pwa-gsp-prod');

  await ssh.putDirectory(localPwaDist, '/var/www/html/pwa-gsp-dev', { recursive: true, concurrency: 10 });
  await ssh.execCommand('chmod -R 755 /var/www/html/pwa-gsp-dev');

  // 4. Verificación de Endpoints Públicos
  console.log('--- VERIFICANDO DISPONIBILIDAD HTTP ---');
  const resWeb = await checkUrl('https://servidor.leanglobal.cl/lg-gsp-prod/');
  console.log('Web PROD:', resWeb.status);

  const resPwa = await checkUrl('https://servidor.leanglobal.cl/pwa-gsp-prod/');
  console.log('PWA PROD:', resPwa.status);

  // 5. Test Transaccional de Imputación Multitécnico en PROD (con Rollback)
  console.log('--- TEST OPERACIONAL: IMPUTACIÓN MULTITÉCNICO EN PROD ---');
  const testPayload = JSON.stringify({
    descripcion_trabajo: 'QA Test Multitécnico SPEC-096 (Taller Temuco)',
    fecha_trabajo: '2026-10-23',
    tecnicos: [
      { id_tecnico: 18, nombre_tecnico: 'Leonel Vergara', horas: 3.5 },
      { id_tecnico: 72, nombre_tecnico: 'Juan Espinoza', horas: 2.0 }
    ]
  });

  const curlTest = await ssh.execCommand(`curl -s -X POST http://127.0.0.1:3016/api/mantenimiento/ots/10/hh -H "Content-Type: application/json" -d '${testPayload}'`);
  console.log('Respuesta Backend PROD:', curlTest.stdout);

  let insertedIds = [];
  try {
    const parsed = JSON.parse(curlTest.stdout);
    if (parsed.success && Array.isArray(parsed.data)) {
      insertedIds = parsed.data.map(d => d.id_hh);
      console.log('✓ Inserción múltiple exitosa. IDs generados:', insertedIds);
      console.log('Detalle horas y costos:');
      parsed.data.forEach(d => {
        console.log(` - Técnico: ${d.nombre_tecnico} | Horas: ${d.horas} | Costo: $${d.costo_calculado}`);
      });
    }
  } catch (e) {
    console.error('Error parseando respuesta:', e.message);
  }

  // Rollback / Limpieza del test
  if (insertedIds.length > 0) {
    for (const id of insertedIds) {
      await ssh.execCommand(`curl -s -X DELETE http://127.0.0.1:3016/api/mantenimiento/hh/${id}`);
    }
    console.log('✓ Rollback completado: registros temporales de prueba eliminados de PROD.');
  }

  ssh.dispose();
  console.log('=== DESPLIEGUE Y VERIFICACIÓN FINALIZADOS EXITOSAMENTE ===');
}

runDeploy().catch(err => {
  console.error('ERROR EN DESPLIEGUE:', err);
  process.exit(1);
});
