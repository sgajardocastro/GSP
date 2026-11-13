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

async function deployDevProdV10138() {
  console.log('=== DESPLIEGUE A DEV Y PROD v1.0.138 (SPEC-079 / PARÁMETROS OPERACIONALES PREVENTIVOS) ===\n');
  console.log('Conectando a servidor SSH...');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  // 1. SEMILLAS Y MIGRACIÓN BD (tmnt_parametro, tcfg_backlog, tcfg_releases)
  console.log('\n--- 1. SEMILLAS Y MIGRACIÓN BD (tmnt_parametro) ---');
  const sqlSeeds = `
    -- DEV
    INSERT INTO sch_leangsp.tmnt_parametro (id_empresa, clave, valor, fecha_actualizacion)
    VALUES 
      (9, 'pm_intervalo_base_horas', '250', CURRENT_TIMESTAMP),
      (9, 'pm_ventana_alerta_horas', '25', CURRENT_TIMESTAMP),
      (9, 'pm_intervalo_odometro_km', '10000', CURRENT_TIMESTAMP),
      (9, 'tarifa_hh_default', '15000', CURRENT_TIMESTAMP),
      (9, 'umbral_costo_ot_clp', '2000000', CURRENT_TIMESTAMP),
      (9, 'cert_alerta_dias', '30', CURRENT_TIMESTAMP)
    ON CONFLICT (id_empresa, clave) DO UPDATE SET valor = EXCLUDED.valor;

    -- PROD
    INSERT INTO sch_leangsp_prod.tmnt_parametro (id_empresa, clave, valor, fecha_actualizacion)
    VALUES 
      (9, 'pm_intervalo_base_horas', '250', CURRENT_TIMESTAMP),
      (9, 'pm_ventana_alerta_horas', '25', CURRENT_TIMESTAMP),
      (9, 'pm_intervalo_odometro_km', '10000', CURRENT_TIMESTAMP),
      (9, 'tarifa_hh_default', '15000', CURRENT_TIMESTAMP),
      (9, 'umbral_costo_ot_clp', '2000000', CURRENT_TIMESTAMP),
      (9, 'cert_alerta_dias', '30', CURRENT_TIMESTAMP)
    ON CONFLICT (id_empresa, clave) DO UPDATE SET valor = EXCLUDED.valor;

    -- HARD GATE / RELEASES EN BD DEV Y PROD
    INSERT INTO sch_leangsp.tcfg_releases (version, artefacto, descripcion, autor, estado, ambiente, commit_hash, fecha_liberacion)
    VALUES ('v1.0.138', 'web', 'Gestión Dinámica de Parámetros Operacionales para Ciclos Preventivos (Horómetro / Odómetro / Radar)', 'Sergio Gajardo', 'APROBADO', 'DESARROLLO', 'HEAD', CURRENT_TIMESTAMP)
    ON CONFLICT (version, artefacto, ambiente) DO UPDATE SET descripcion = EXCLUDED.descripcion, fecha_liberacion = CURRENT_TIMESTAMP;

    INSERT INTO sch_leangsp_prod.tcfg_releases (version, artefacto, descripcion, autor, estado, ambiente, commit_hash, fecha_liberacion)
    VALUES ('v1.0.138', 'web', 'Gestión Dinámica de Parámetros Operacionales para Ciclos Preventivos (Horómetro / Odómetro / Radar)', 'Sergio Gajardo', 'APROBADO', 'PRODUCCION', 'HEAD', CURRENT_TIMESTAMP)
    ON CONFLICT (version, artefacto, ambiente) DO UPDATE SET descripcion = EXCLUDED.descripcion, fecha_liberacion = CURRENT_TIMESTAMP;

    -- BACKLOG TASK / REQ-1045
    INSERT INTO sch_leangsp.tcfg_backlog (codigo_req, titulo, modulo, estado, prioridad, ambiente, version_objetivo, fecha_cierre)
    VALUES ('REQ-1045', 'Gestión Dinámica de Parámetros Operacionales para Ciclos Preventivos (Horómetro / Odómetro / Radar)', 'MANTENIMIENTO', 'DONE', 'ALTA', 'DESARROLLO', 'v1.0.138', CURRENT_TIMESTAMP)
    ON CONFLICT (codigo_req) DO UPDATE SET estado = 'DONE', version_objetivo = 'v1.0.138', fecha_cierre = CURRENT_TIMESTAMP;

    INSERT INTO sch_leangsp_prod.tcfg_backlog (codigo_req, titulo, modulo, estado, prioridad, ambiente, version_objetivo, fecha_cierre)
    VALUES ('REQ-1045', 'Gestión Dinámica de Parámetros Operacionales para Ciclos Preventivos (Horómetro / Odómetro / Radar)', 'MANTENIMIENTO', 'DONE', 'ALTA', 'PRODUCCION', 'v1.0.138', CURRENT_TIMESTAMP)
    ON CONFLICT (codigo_req) DO UPDATE SET estado = 'DONE', version_objetivo = 'v1.0.138', fecha_cierre = CURRENT_TIMESTAMP;
  `;

  const dbRes = await ssh.execCommand(`sudo -u postgres psql -d leangsp_db -c "${sqlSeeds.replace(/"/g, '\\"')}"`);
  console.log('PostgreSQL Resultado:\n', dbRes.stdout || dbRes.stderr);

  // 2. DESPLIEGUE BACKEND (mantenimientoModel, mantenimientoController, mantenimientoAlertasService)
  console.log('\n--- 2. DESPLIEGUE BACKEND A DEV Y PROD ---');
  const filesToDeploy = [
    {
      local: path.resolve(__dirname, '../ejecucion/backend_remoto/src/models/mantenimientoModel.js'),
      dev: '/home/nodeadmin/proyectos/lean-services-gsp/src/models/mantenimientoModel.js',
      prod: '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/models/mantenimientoModel.js'
    },
    {
      local: path.resolve(__dirname, '../ejecucion/backend_remoto/src/controllers/mantenimientoController.js'),
      dev: '/home/nodeadmin/proyectos/lean-services-gsp/src/controllers/mantenimientoController.js',
      prod: '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/mantenimientoController.js'
    },
    {
      local: path.resolve(__dirname, '../ejecucion/backend_remoto/src/services/mantenimientoAlertasService.js'),
      dev: '/home/nodeadmin/proyectos/lean-services-gsp/src/services/mantenimientoAlertasService.js',
      prod: '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/services/mantenimientoAlertasService.js'
    }
  ];

  for (const f of filesToDeploy) {
    console.log(`Subiendo ${path.basename(f.local)} a DEV y PROD...`);
    await ssh.putFile(f.local, f.dev);
    await ssh.execCommand(`chown nodeadmin:nodeadmin ${f.dev}`);
    await ssh.putFile(f.local, f.prod);
    await ssh.execCommand(`chown nodeadmin:nodeadmin ${f.prod}`);
  }

  console.log('Reiniciando PM2 DEV (10) y PROD (13)...');
  const restartDev = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
  console.log('PM2 10 (DEV):', restartDev.stdout.split('\n')[0] || restartDev.stderr);
  const restartProd = await ssh.execCommand('su - nodeadmin -c "pm2 restart 13"');
  console.log('PM2 13 (PROD):', restartProd.stdout.split('\n')[0] || restartProd.stderr);

  await new Promise(r => setTimeout(r, 2000));

  // 3. DESPLIEGUE FRONTEND
  console.log('\n--- 3. DESPLIEGUE FRONTEND DIST A DEV Y PROD ---');
  const localDistDev = path.resolve(__dirname, '../ejecucion/frontend/dist_dev');
  const localDistProd = path.resolve(__dirname, '../ejecucion/frontend/dist_prod');
  const remoteDevDist = '/var/www/html/lg-gsp-dev';
  const remoteProdDist = '/var/www/html/lg-gsp-prod';

  console.log(`3.1 Subiendo a DEV (${remoteDevDist}) desde ${localDistDev}...`);
  await ssh.putDirectory(localDistDev, remoteDevDist, {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.git')
  });
  await ssh.execCommand(`chown -R apache:apache ${remoteDevDist} || chown -R www-data:www-data ${remoteDevDist} || true`);
  console.log('DEV frontend actualizado.');

  console.log(`3.2 Subiendo a PROD (${remoteProdDist}) desde ${localDistProd}...`);
  await ssh.putDirectory(localDistProd, remoteProdDist, {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.git')
  });
  await ssh.execCommand(`chown -R apache:apache ${remoteProdDist} || chown -R www-data:www-data ${remoteProdDist} || true`);
  console.log('PROD frontend actualizado.');

  // 4. VERIFICACIÓN HTTP
  console.log('\n--- 4. VERIFICACIÓN HTTP REMOTA ---');
  const devCheck = await checkUrl('https://servidor.leanglobal.cl/lg-gsp-dev/');
  console.log('Verificación DEV URL:', devCheck.status ? `HTTP ${devCheck.status} OK` : devCheck.error);

  const prodCheck = await checkUrl('https://servidor.leanglobal.cl/lg-gsp-prod/');
  console.log('Verificación PROD URL:', prodCheck.status ? `HTTP ${prodCheck.status} OK` : prodCheck.error);

  console.log('\n=== DESPLIEGUE v1.0.138 COMPLETADO CON ÉXITO ===');
  ssh.dispose();
}

deployDevProdV10138().catch(err => {
  console.error('Error durante el despliegue:', err);
  ssh.dispose();
  process.exit(1);
});
