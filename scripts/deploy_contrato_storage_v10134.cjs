const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const https = require('https');
const ssh = new NodeSSH();

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({ status: res.statusCode, headers: res.headers });
    }).on('error', (e) => {
      resolve({ error: e.message });
    });
  });
}

async function deployContratoStorageV10134() {
  console.log('=== DESPLIEGUE A DEV Y PROD v1.0.134 (REQ-1041 / SPEC-076) ===\n');
  console.log('Conectando a servidor SSH 138.255.103.18:1295...');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });
  console.log('Conexión SSH establecida con éxito.');

  // 1. DESPLIEGUE BACKEND A DEV Y PROD
  console.log('\n--- 1. DESPLIEGUE ARCHIVOS BACKEND (DEV & PROD) ---');
  const backendFiles = [
    {
      local: path.resolve(__dirname, '../ejecucion/backend_remoto/src/config/storageConfig.js'),
      devRemote: '/home/nodeadmin/proyectos/lean-services-gsp/src/config/storageConfig.js',
      prodRemote: '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/config/storageConfig.js'
    },
    {
      local: path.resolve(__dirname, '../ejecucion/backend_remoto/src/controllers/archivoController.js'),
      devRemote: '/home/nodeadmin/proyectos/lean-services-gsp/src/controllers/archivoController.js',
      prodRemote: '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/archivoController.js'
    },
    {
      local: path.resolve(__dirname, '../ejecucion/backend_remoto/src/models/proyectoModel.js'),
      devRemote: '/home/nodeadmin/proyectos/lean-services-gsp/src/models/proyectoModel.js',
      prodRemote: '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/models/proyectoModel.js'
    }
  ];

  for (const f of backendFiles) {
    console.log(`Subiendo ${path.basename(f.local)} a DEV y PROD...`);
    await ssh.putFile(f.local, f.devRemote);
    await ssh.putFile(f.local, f.prodRemote);
    await ssh.execCommand(`chown nodeadmin:nodeadmin ${f.devRemote} ${f.prodRemote}`);
  }

  // 2. MIGRACIÓN FÍSICA Y BASE DE DATOS PARA DOCUMENTO 1467 (CTR-2026-0109.pdf)
  console.log('\n--- 2. MIGRACIÓN LG-STORAGE PARA DOCUMENTO 1467 ---');
  await ssh.execCommand('mkdir -p /u05/LeanDocs/GSP/dev/contratos/2026/10');
  await ssh.execCommand('mkdir -p /u05/LeanDocs/GSP/prod/contratos/2026/10');
  
  const copyRes = await ssh.execCommand('cp -p /home/nodeadmin/proyectos/lean-services-gsp/public/contratos/CTR-2026-0109.pdf /u05/LeanDocs/GSP/dev/contratos/2026/10/CTR-2026-0109.pdf');
  console.log('Copia física a /u05/LeanDocs:', copyRes.stdout || 'OK');
  await ssh.execCommand('chown -R nodeadmin:nodeadmin /u05/LeanDocs/GSP');

  console.log('Actualizando ruta en base de datos sch_leangsp.tfmg_file...');
  const sqlUpdate1467 = `UPDATE sch_leangsp.tfmg_file SET path_doc = 'GSP/dev/contratos/2026/10' WHERE id_doc = 1467;`;
  const resUpdate1467 = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sqlUpdate1467}\\""`);
  console.log('Resultado SQL 1467:', resUpdate1467.stdout.trim() || resUpdate1467.stderr);

  // 3. REINICIO DE PM2
  console.log('\n--- 3. REINICIO PROCESOS PM2 10 (DEV) Y 13 (PROD) ---');
  const pm2Restart = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10 && pm2 restart 13"');
  console.log('PM2 restart output:\n', pm2Restart.stdout.trim() || pm2Restart.stderr);

  // 4. TEST EMPÍRICO DEL ENDPOINT /api/archivo/ver/1467
  console.log('\n--- 4. PRUEBA EMPÍRICA ENDPOINT /api/archivo/ver/1467 ---');
  const curl1467 = await ssh.execCommand('curl -sI https://servidor.leanglobal.cl/lg-gsp-dev/api/archivo/ver/1467');
  console.log('Respuesta cabeceras HTTP 1467:\n', curl1467.stdout.trim());

  // 5. DESPLIEGUE FRONTEND DIST A DEV Y PROD
  console.log('\n--- 5. DESPLIEGUE FRONTEND DIST A DEV Y PROD ---');
  const localDistDev = path.resolve(__dirname, '../ejecucion/frontend/dist_dev');
  const localDistProd = path.resolve(__dirname, '../ejecucion/frontend/dist_prod');
  const remoteDevDist = '/var/www/html/lg-gsp-dev';
  const remoteProdDist = '/var/www/html/lg-gsp-prod';

  console.log('5.0 Limpiando directorios remotos...');
  await ssh.execCommand(`rm -rf ${remoteDevDist}/* ${remoteProdDist}/*`);

  console.log(`5.1 Subiendo a DEV (${remoteDevDist}) desde ${localDistDev}...`);
  const statusDev = await ssh.putDirectory(localDistDev, remoteDevDist, {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.git')
  });
  if (!statusDev) throw new Error('Fallo al transferir dist_dev a DEV');

  console.log(`5.2 Subiendo a PROD (${remoteProdDist}) desde ${localDistProd}...`);
  const statusProd = await ssh.putDirectory(localDistProd, remoteProdDist, {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.git')
  });
  if (!statusProd) throw new Error('Fallo al transferir dist_prod a PROD');

  console.log('5.3 Ajustando permisos nginx:nginx y 755...');
  await ssh.execCommand(`chown -R nginx:nginx ${remoteDevDist} && chmod -R 755 ${remoteDevDist}`);
  await ssh.execCommand(`chown -R nginx:nginx ${remoteProdDist} && chmod -R 755 ${remoteProdDist}`);

  // 6. GOBERNANZA: SINCRONIZACIÓN EN TCFG_BACKLOG Y TCFG_RELEASES
  console.log('\n--- 6. GOBERNANZA: REGISTRO EN TCFG_BACKLOG Y TCFG_RELEASES ---');
  const schemas = ['sch_leangsp', 'sch_leangsp_prod'];
  for (const s of schemas) {
    const sql = `
      INSERT INTO ${s}.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_implementacion, solicitado_por, estado)
      VALUES (
        'REQ-1041',
        'Almacenamiento Canónico LG-Storage, Previsualización Resiliente Anti-Popups y Despacho Dual de Contratos',
        'SPEC-076: Estandarización de contratos bajo /u05/LeanDocs/GSP/{env}/contratos/{YYYY}/{MM} con path_doc relativo POSIX en tfmg_file, fallback multi-directorio para resolución física inmediata, apertura resiliente de pestaña previa a compilación y botón WhatsApp Web directo en CRM.',
        'Alta',
        CURRENT_DATE,
        'Sergio Gajardo',
        'Implementado'
      )
      ON CONFLICT (codigo_req) DO UPDATE SET 
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        estado = 'Implementado',
        fecha_implementacion = CURRENT_DATE,
        updated_at = NOW();

      INSERT INTO ${s}.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
      VALUES (
        '1.0.134',
        'Almacenamiento Canónico LG-Storage, Previsualización Resiliente y Despacho Dual de Contratos (REQ-1041)',
        'FEATURE',
        'Almacenamiento canónico bajo /u05/LeanDocs, resolución determinista de documentos PDF en /api/archivo/ver, previsualización sin bloqueo de ventanas emergentes y habilitación de WhatsApp Web directo.',
        'REQ-1041',
        'Sergio Gajardo'
      )
      ON CONFLICT (version) DO UPDATE SET 
        titulo = EXCLUDED.titulo,
        descripcion_impacto = EXCLUDED.descripcion_impacto,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados,
        updated_at = NOW();
    `;
    const resSql = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sql.replace(/"/g, '\\"')}\\""`);
    console.log(`Base de Datos (${s}):`, resSql.stdout.trim() || resSql.stderr);
  }

  // 7. VERIFICACIÓN HTTP PORTALES
  console.log('\n--- 7. VERIFICACIÓN HTTP EN VIVO ---');
  const devCheck = await checkUrl('https://servidor.leanglobal.cl/lg-gsp-dev/');
  const prodCheck = await checkUrl('https://servidor.leanglobal.cl/lg-gsp-prod/');
  console.log('DEV (https://servidor.leanglobal.cl/lg-gsp-dev/):', devCheck.status);
  console.log('PROD (https://servidor.leanglobal.cl/lg-gsp-prod/):', prodCheck.status);

  ssh.dispose();
  console.log('\n✅ DESPLIEGUE A DEV Y PROD v1.0.134 FINALIZADO CON ÉXITO.');
}

deployContratoStorageV10134().catch(e => {
  console.error('Error durante el despliegue:', e);
  process.exit(1);
});
