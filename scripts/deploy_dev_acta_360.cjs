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

async function runDeploy() {
  console.log('========================================================================');
  console.log('🚀 DESPLIEGUE A DEV: ACTA 360° (PWA v1.0.47 & WEB v1.0.143) / REQ-1048');
  console.log('========================================================================\n');

  try {
    await ssh.connect({
      host: '138.255.103.18',
      username: 'root',
      password: process.env.SSH_PASSWORD || 'lgbl2025.',
      port: 1295,
      readyTimeout: 30000
    });
    console.log('✅ Conectado como root por SSH.\n');

    // 1. DESPLIEGUE PWA DEV
    console.log('--- 1. DESPLEGANDO PWA A DEV (/var/www/html/pwa-gsp-dev) ---');
    const localPwaDist = path.resolve(__dirname, '../ejecucion/pwa/dist');
    const remotePwaDev = '/var/www/html/pwa-gsp-dev';

    console.log(`Subiendo archivos desde ${localPwaDist} a ${remotePwaDev}...`);
    const statusPwa = await ssh.putDirectory(localPwaDist, remotePwaDev, {
      recursive: true,
      concurrency: 10,
      validate: (itemPath) => !itemPath.includes('.map')
    });
    if (!statusPwa) throw new Error('Fallo al transferir PWA a DEV');
    await ssh.execCommand(`chown -R nginx:nginx ${remotePwaDev} && chmod -R 755 ${remotePwaDev}`);
    console.log('✅ PWA v1.0.47 desplegado en DEV con permisos nginx.\n');

    // 2. DESPLIEGUE FRONTEND WEB DEV
    console.log('--- 2. DESPLEGANDO FRONTEND WEB A DEV (/var/www/html/lg-gsp-dev) ---');
    const localWebDist = path.resolve(__dirname, '../ejecucion/frontend/dist_dev');
    const remoteWebDev = '/var/www/html/lg-gsp-dev';

    console.log(`Subiendo archivos desde ${localWebDist} a ${remoteWebDev}...`);
    const statusWeb = await ssh.putDirectory(localWebDist, remoteWebDev, {
      recursive: true,
      concurrency: 10,
      validate: (itemPath) => !itemPath.includes('.map')
    });
    if (!statusWeb) throw new Error('Fallo al transferir Frontend Web a DEV');
    await ssh.execCommand(`chown -R nginx:nginx ${remoteWebDev} && chmod -R 755 ${remoteWebDev}`);
    console.log('✅ Frontend Web v1.0.143 desplegado en DEV con permisos nginx.\n');

    // 3. REINICIAR PM2 10 (DEV BACKEND)
    console.log('--- 3. REINICIO DE SERVICIOS PM2 DEV (ID 10) ---');
    const pm2Res = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
    console.log('PM2 restart 10:', pm2Res.stdout.trim() || pm2Res.stderr.trim());
    await new Promise(r => setTimeout(r, 2000));

    // 4. GOBERNANZA BD EN sch_leangsp
    console.log('\n--- 4. GOBERNANZA BD EN sch_leangsp ---');
    const sql = `
      -- 1. Registrar PWA v1.0.47 en tcfg_releases
      INSERT INTO sch_leangsp.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
      VALUES (
        'v1.0.47',
        'PWA GSP v1.0.47 - Acta Entrega/Recepción 360 Maquinaria y Plataformas BSM',
        'Feature',
        'Checklist 19 items visible sin scroll truncado, registro fotografico 360 grados (6 base + dinamicas ilimitadas), persistencia real en BD y generacion PDF Puppeteer oficial',
        '["REQ-1048"]'::jsonb,
        'Sergio Gajardo'
      )
      ON CONFLICT (version) DO UPDATE SET
        titulo = EXCLUDED.titulo,
        descripcion_impacto = EXCLUDED.descripcion_impacto,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;

      -- 2. Registrar Web v1.0.143 en tcfg_releases
      INSERT INTO sch_leangsp.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
      VALUES (
        'v1.0.143',
        'Portal Web GSP v1.0.143 - Visualizacion y Descarga Oficial de Actas 360 Plataformas',
        'Feature',
        'Integracion de tarjeta de visualizacion y descarga de Actas 360 en pestana Reports Diarios y Actas del Gestor de Oportunidades CRM',
        '["REQ-1048"]'::jsonb,
        'Sergio Gajardo'
      )
      ON CONFLICT (version) DO UPDATE SET
        titulo = EXCLUDED.titulo,
        descripcion_impacto = EXCLUDED.descripcion_impacto,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;

      -- 3. Registrar REQ-1048 en tcfg_backlog
      INSERT INTO sch_leangsp.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, estado, fecha_implementacion, solicitado_por, creado_por)
      VALUES (
        'REQ-1048',
        'Acta de Entrega y Recepcion de Maquinaria 360 (BSM / Royal Rental / GSP)',
        'Checklist 19 items, galeria 360 grados, generacion PDF oficial Puppeteer con logos parametrizados y visualizacion en PWA y CRM',
        'Alta',
        'Implementado',
        CURRENT_DATE,
        'Jorge / Operaciones Terreno',
        'Sergio Gajardo'
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        estado = 'Implementado',
        fecha_implementacion = CURRENT_DATE;
    `;

    await ssh.execCommand(`cat << 'EOF' > /tmp/sync_releases_acta360.sql\n${sql}\nEOF`);
    const resSql = await ssh.execCommand(`su - postgres -c "psql -d postgres -f /tmp/sync_releases_acta360.sql"`);
    console.log('SQL Execution Result:\n', resSql.stdout || resSql.stderr);
    await ssh.execCommand('rm -f /tmp/sync_releases_acta360.sql');

    // 5. VERIFICACIÓN DETERMINISTA
    console.log('\n--- 5. VERIFICACIÓN DETERMINISTA HTTP ---');
    const pwaDevStatus = await checkUrl('https://servidor.leanglobal.cl/pwa-gsp-dev/');
    console.log(`HTTP DEV PWA (https://servidor.leanglobal.cl/pwa-gsp-dev/): ${pwaDevStatus.status}`);

    const webDevStatus = await checkUrl('https://servidor.leanglobal.cl/lg-gsp-dev/');
    console.log(`HTTP DEV WEB (https://servidor.leanglobal.cl/lg-gsp-dev/): ${webDevStatus.status}`);

    const backendStatus = await ssh.execCommand('curl -s https://servidor.leanglobal.cl/lg-gsp-dev/api/operaciones/acta-plataforma/health');
    console.log('Health Endpoint Acta Plataforma:', backendStatus.stdout.trim() || backendStatus.stderr.trim());

    // Verificar hash de index.html DEV
    const pwaIndex = await ssh.execCommand('head -n 25 /var/www/html/pwa-gsp-dev/index.html');
    console.log('\nPWA DEV index.html head:\n', pwaIndex.stdout.trim());

    const webIndex = await ssh.execCommand('head -n 25 /var/www/html/lg-gsp-dev/index.html');
    console.log('\nWEB DEV index.html head:\n', webIndex.stdout.trim());

    console.log('\n🎉 ¡DESPLIEGUE A DESARROLLO (DEV) COMPLETADO AL 100%!');
  } catch (err) {
    console.error('❌ Error durante el despliegue:', err);
    process.exit(1);
  } finally {
    ssh.dispose();
  }
}

runDeploy();
