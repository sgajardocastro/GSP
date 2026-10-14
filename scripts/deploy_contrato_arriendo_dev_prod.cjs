const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const https = require('https');
const ssh = new NodeSSH();

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({ status: res.statusCode });
    }).on('error', (e) => {
      resolve({ error: e.message });
    });
  });
}

async function deployContratoDevProd() {
  console.log('=== DESPLIEGUE A DEV Y PROD v1.0.131 (REQ-1037 / TSK-COT-04) ===\n');
  console.log('Conectando a servidor SSH...');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });
  console.log('✅ Conexión SSH establecida exitosamente.');

  // 1. DESPLIEGUE BACKEND (Model, Controller, Routes)
  console.log('\n--- 1. DESPLIEGUE BACKEND A DEV Y PROD ---');
  const filesBackend = [
    {
      local: path.resolve(__dirname, '../ejecucion/backend_remoto/src/models/proyectoModel.js'),
      dev: '/home/nodeadmin/proyectos/lean-services-gsp/src/models/proyectoModel.js',
      prod: '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/models/proyectoModel.js'
    },
    {
      local: path.resolve(__dirname, '../ejecucion/backend_remoto/src/controllers/proyectosController.js'),
      dev: '/home/nodeadmin/proyectos/lean-services-gsp/src/controllers/proyectosController.js',
      prod: '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/proyectosController.js'
    },
    {
      local: path.resolve(__dirname, '../ejecucion/backend_remoto/src/routes/proyectoRoutes.js'),
      dev: '/home/nodeadmin/proyectos/lean-services-gsp/src/routes/proyectoRoutes.js',
      prod: '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/routes/proyectoRoutes.js'
    }
  ];

  console.log('1.1 Subiendo archivos backend a DEV...');
  for (const f of filesBackend) {
    await ssh.putFile(f.local, f.dev);
  }
  await ssh.execCommand('chown -R nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp/src/models/proyectoModel.js /home/nodeadmin/proyectos/lean-services-gsp/src/controllers/proyectosController.js /home/nodeadmin/proyectos/lean-services-gsp/src/routes/proyectoRoutes.js');

  console.log('1.2 Subiendo archivos backend a PROD...');
  for (const f of filesBackend) {
    await ssh.putFile(f.local, f.prod);
  }
  await ssh.execCommand('chown -R nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp-prod/src/models/proyectoModel.js /home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/proyectosController.js /home/nodeadmin/proyectos/lean-services-gsp-prod/src/routes/proyectoRoutes.js');

  console.log('1.3 Reiniciando PM2 DEV (10) y PROD (13)...');
  const restartDev = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
  console.log('PM2 10 (DEV):', restartDev.stdout.split('\n')[0] || restartDev.stderr);
  const restartProd = await ssh.execCommand('su - nodeadmin -c "pm2 restart 13"');
  console.log('PM2 13 (PROD):', restartProd.stdout.split('\n')[0] || restartProd.stderr);

  await new Promise(r => setTimeout(r, 2000));

  // 2. DESPLIEGUE FRONTEND (dist_dev y dist_prod)
  console.log('\n--- 2. DESPLIEGUE FRONTEND DIST A DEV Y PROD ---');
  const localDistDev = path.resolve(__dirname, '../ejecucion/frontend/dist_dev');
  const localDistProd = path.resolve(__dirname, '../ejecucion/frontend/dist_prod');
  const remoteDevDist = '/var/www/html/lg-gsp-dev';
  const remoteProdDist = '/var/www/html/lg-gsp-prod';

  console.log(`2.1 Subiendo a DEV (${remoteDevDist}) desde dist_dev...`);
  const statusDev = await ssh.putDirectory(localDistDev, remoteDevDist, {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.git')
  });
  if (!statusDev) throw new Error('Fallo al transferir dist_dev a DEV');

  console.log(`2.2 Subiendo a PROD (${remoteProdDist}) desde dist_prod...`);
  const statusProd = await ssh.putDirectory(localDistProd, remoteProdDist, {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.git')
  });
  if (!statusProd) throw new Error('Fallo al transferir dist_prod a PROD');

  console.log('2.3 Ajustando permisos nginx:nginx y 755...');
  await ssh.execCommand(`chown -R nginx:nginx ${remoteDevDist} && chmod -R 755 ${remoteDevDist}`);
  await ssh.execCommand(`chown -R nginx:nginx ${remoteProdDist} && chmod -R 755 ${remoteProdDist}`);

  // 3. GOBERNANZA: SINCRONIZACIÓN EN TCFG_BACKLOG Y TCFG_RELEASES
  console.log('\n--- 3. GOBERNANZA: REGISTRO EN TCFG_BACKLOG Y TCFG_RELEASES ---');
  const schemas = ['sch_leangsp', 'sch_leangsp_prod'];
  for (const s of schemas) {
    const sqlBacklog = `
      INSERT INTO ${s}.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_implementacion, solicitado_por, estado)
      VALUES (
        'REQ-1037',
        'Módulo de Contrato de Arrendamiento y Formalización FES en Preventa Comercial',
        'Sustitución de Bitácora & Alertas por Contrato de Arriendo de 4 Páginas con motor wkhtmltopdf y firma móvil táctil FES mediante Magic Link con token de 72h.',
        'Alta',
        CURRENT_DATE,
        'Sergio Gajardo',
        'Implementado'
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        fecha_implementacion = CURRENT_DATE,
        estado = 'Implementado';
    `;
    const resSql = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sqlBacklog.replace(/\n/g, ' ')}\\""`);
    console.log(`Backlog ${s}:`, resSql.stdout.trim() || resSql.stderr.trim());

    const sqlRelease = `
      INSERT INTO ${s}.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
      VALUES (
        '1.0.131',
        'Módulo de Contrato de Arrendamiento y Formalización FES en Preventa Comercial (REQ-1037)',
        'FEATURE',
        'Sustitución de Bitácora & Alertas por Contrato de Arriendo de Maquinaria de 4 páginas con wkhtmltopdf y firma móvil FES con token de un solo uso.',
        json_build_array('REQ-1037'),
        'Sergio Gajardo'
      )
      ON CONFLICT (version) DO UPDATE SET
        titulo = EXCLUDED.titulo,
        descripcion_impacto = EXCLUDED.descripcion_impacto,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados,
        fecha_release = CURRENT_TIMESTAMP;
    `;
    const resRel = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sqlRelease.replace(/\n/g, ' ')}\\""`);
    console.log(`Release ${s}:`, resRel.stdout.trim() || resRel.stderr.trim());
  }

  // 4. VERIFICACIÓN HTTP
  console.log('\n--- 4. CERTIFICACIÓN EMPÍRICA HTTP ---');
  const devHttp = await checkUrl('https://servidor.leanglobal.cl/lg-gsp-dev/');
  const prodHttp = await checkUrl('https://servidor.leanglobal.cl/lg-gsp-prod/');
  const devPublicHttp = await checkUrl('https://servidor.leanglobal.cl/lg-gsp-dev/firmar-contrato');
  const prodPublicHttp = await checkUrl('https://servidor.leanglobal.cl/lg-gsp-prod/firmar-contrato');

  console.log('Web DEV status:', devHttp.status);
  console.log('Web PROD status:', prodHttp.status);
  console.log('Firma Pública DEV status:', devPublicHttp.status);
  console.log('Firma Pública PROD status:', prodPublicHttp.status);

  if (devHttp.status === 200 && prodHttp.status === 200) {
    console.log('\n🎉 ¡DESPLIEGUE Y CERTIFICACIÓN A DEV Y PROD COMPLETADOS CON ÉXITO!');
  } else {
    console.warn('\n⚠️ Verificar posibles códigos no 200:', { devHttp, prodHttp });
  }

  ssh.dispose();
}

deployContratoDevProd().catch(err => {
  console.error('❌ Error en el despliegue:', err);
  ssh.dispose();
  process.exit(1);
});
