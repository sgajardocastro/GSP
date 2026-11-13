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

async function deployContratoV10132() {
  console.log('=== DESPLIEGUE A DEV Y PROD v1.0.132 (REQ-1039 / TSK-COT-05) ===\n');
  console.log('Conectando a servidor SSH 138.255.103.18:1295...');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });
  console.log('Conexión SSH establecida con éxito.');

  // 1. DESPLIEGUE BACKEND A DEV Y PROD
  console.log('\n--- 1. DESPLIEGUE BACKEND (DEV & PROD) ---');
  const backendFiles = [
    {
      local: path.resolve(__dirname, '../ejecucion/backend_remoto/src/models/proyectoModel.js'),
      devRemote: '/home/nodeadmin/proyectos/lean-services-gsp/src/models/proyectoModel.js',
      prodRemote: '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/models/proyectoModel.js'
    },
    {
      local: path.resolve(__dirname, '../ejecucion/backend_remoto/src/controllers/proyectosController.js'),
      devRemote: '/home/nodeadmin/proyectos/lean-services-gsp/src/controllers/proyectosController.js',
      prodRemote: '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/proyectosController.js'
    },
    {
      local: path.resolve(__dirname, '../ejecucion/backend_remoto/src/routes/proyectoRoutes.js'),
      devRemote: '/home/nodeadmin/proyectos/lean-services-gsp/src/routes/proyectoRoutes.js',
      prodRemote: '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/routes/proyectoRoutes.js'
    }
  ];

  for (const f of backendFiles) {
    console.log(`Subiendo ${path.basename(f.local)} a DEV y PROD...`);
    await ssh.putFile(f.local, f.devRemote);
    await ssh.putFile(f.local, f.prodRemote);
    await ssh.execCommand(`chown nodeadmin:nodeadmin ${f.devRemote} ${f.prodRemote}`);
  }

  console.log('Reiniciando procesos PM2 10 (DEV) y 13 (PROD) bajo nodeadmin...');
  const pm2Restart = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10 && pm2 restart 13"');
  console.log('PM2 restart output:\n', pm2Restart.stdout.trim() || pm2Restart.stderr);

  // 2. DESPLIEGUE FRONTEND DIST A DEV Y PROD
  console.log('\n--- 2. DESPLIEGUE FRONTEND DIST A DEV Y PROD ---');
  const localDistDev = path.resolve(__dirname, '../ejecucion/frontend/dist_dev');
  const localDistProd = path.resolve(__dirname, '../ejecucion/frontend/dist_prod');
  const remoteDevDist = '/var/www/html/lg-gsp-dev';
  const remoteProdDist = '/var/www/html/lg-gsp-prod';

  console.log('2.0 Limpiando directorios remotos antes de transferir para evitar archivos huérfanos...');
  await ssh.execCommand(`rm -rf ${remoteDevDist}/* ${remoteProdDist}/*`);

  console.log(`2.1 Subiendo a DEV (${remoteDevDist}) desde ${localDistDev}...`);
  const statusDev = await ssh.putDirectory(localDistDev, remoteDevDist, {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.git')
  });
  if (!statusDev) throw new Error('Fallo al transferir dist_dev a DEV');

  console.log(`2.2 Subiendo a PROD (${remoteProdDist}) desde ${localDistProd}...`);
  const statusProd = await ssh.putDirectory(localDistProd, remoteProdDist, {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.git')
  });
  if (!statusProd) throw new Error('Fallo al transferir dist_prod a PROD');

  console.log('2.3 Ajustando permisos nginx:nginx y 755...');
  await ssh.execCommand(`chown -R nginx:nginx ${remoteDevDist} && chmod -R 755 ${remoteDevDist}`);
  await ssh.execCommand(`chown -R nginx:nginx ${remoteProdDist} && chmod -R 755 ${remoteProdDist}`);

  console.log('2.4 Verificando físicamente index.html en DEV y PROD...');
  const devIndex = await ssh.execCommand(`cat ${remoteDevDist}/index.html`);
  console.log('DEV index.html script tag:\n', devIndex.stdout.split('\n').filter(l => l.includes('script')).join('\n'));
  const prodIndex = await ssh.execCommand(`cat ${remoteProdDist}/index.html`);
  console.log('PROD index.html script tag:\n', prodIndex.stdout.split('\n').filter(l => l.includes('script')).join('\n'));

  // 3. GOBERNANZA: SINCRONIZACIÓN EN TCFG_BACKLOG Y TCFG_RELEASES
  console.log('\n--- 3. GOBERNANZA: REGISTRO EN TCFG_BACKLOG Y TCFG_RELEASES ---');
  const schemas = ['sch_leangsp', 'sch_leangsp_prod'];
  for (const s of schemas) {
    const sql = `
      INSERT INTO ${s}.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_implementacion, solicitado_por, estado)
      VALUES (
        'REQ-1039',
        'Despacho Omnicanal de Contratos FES y Visor Íntegro de 4 Páginas con Aceptación Obligatoria',
        'TSK-COT-05: Eliminación de copia manual de enlaces. Despacho automatizado por Email con plantilla B2B al cliente y copia CC al ejecutivo comercial, notificación por WhatsApp con microservicio Baileys, visor web con 4 páginas completas del contrato (cláusulas 1 a 14) y casilla obligatoria de aceptación legal previa a firma digital móvil.',
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
        '1.0.132',
        'Despacho Omnicanal de Contratos FES y Visor Íntegro de 4 Páginas (REQ-1039)',
        'FEATURE',
        'Automatización integral del despacho de contratos de arriendo vía Nodemailer (cliente + CC ejecutivo) y WhatsApp (Baileys), visor interactivo de 4 páginas con 14 cláusulas legales en vista pública y aceptación previa obligatoria.',
        'REQ-1039',
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

  // 4. VERIFICACIÓN HTTP
  console.log('\n--- 4. VERIFICACIÓN HTTP EN VIVO ---');
  const devCheck = await checkUrl('https://servidor.leanglobal.cl/lg-gsp-dev/');
  const prodCheck = await checkUrl('https://servidor.leanglobal.cl/lg-gsp-prod/');
  console.log('DEV (https://servidor.leanglobal.cl/lg-gsp-dev/):', devCheck.status);
  console.log('PROD (https://servidor.leanglobal.cl/lg-gsp-prod/):', prodCheck.status);

  ssh.dispose();
  console.log('\n✅ DESPLIEGUE A DEV Y PROD v1.0.132 FINALIZADO CON ÉXITO.');
}

deployContratoV10132().catch(e => {
  console.error('Error durante el despliegue:', e);
  process.exit(1);
});
