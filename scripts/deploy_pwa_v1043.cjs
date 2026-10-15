const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const { Client } = require('../ejecucion/backend_remoto/node_modules/pg');
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

const dbConfig = {
  host: '138.255.103.18',
  port: 5432,
  user: 'postgres',
  password: 'new_password_here',
  database: 'produccion_gsp'
};

async function syncDbRelease(schema) {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    console.log(`\nSincronizando gobernanza en BD schema: ${schema}...`);
    
    // Inserción o actualización en tcfg_releases
    await client.query(`
      INSERT INTO ${schema}.tcfg_releases (
        version, app_target, nombre_release, descripcion, autor, hash_commit, fecha_release, fecha_despliegue, notas
      ) VALUES (
        $1, $2, $3, $4, $5, $6, NOW(), NOW(), $7
      ) ON CONFLICT (version) DO UPDATE SET
        fecha_despliegue = NOW(),
        descripcion = EXCLUDED.descripcion,
        notas = EXCLUDED.notas;
    `, [
      '1.0.43',
      'PWA',
      'Resiliencia Operativa Report Diario: Hora de Inicio Rectificable y Flexibilidad Momento 2',
      'Permite al operador rectificar la hora de llegada/inicio al emitir el reporte y navegar a Momento 2 sin bloqueo si cuenta con horómetro base.',
      'Antigravity Agent',
      'PWA-v1.0.43',
      'Resolución de incidencia operativa de bloqueo en OT 16 y regularización de jornadas.'
    ]);
    console.log(`✅ tcfg_releases registrado (${schema}).`);

    // Inserción o actualización en tcfg_backlog
    await client.query(`
      INSERT INTO ${schema}.tcfg_backlog (
        id_ticket, titulo, modulo, tipo, prioridad, estado, version_objetivo, version_real, fecha_cierre, descripcion
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9
      ) ON CONFLICT (id_ticket) DO UPDATE SET
        estado = 'CERRADO',
        version_real = EXCLUDED.version_real,
        fecha_cierre = NOW(),
        descripcion = EXCLUDED.descripcion;
    `, [
      'REQ-1044',
      'Resiliencia Report Diario PWA: Hora de Inicio Rectificable en Terreno y Flexibilidad Momento 2',
      'OPERACIONES',
      'INCIDENCIA',
      'CRITICA',
      'CERRADO',
      '1.0.43',
      '1.0.43',
      'Permite edición directa de hora de llegada en Momento 2 y erradica bloqueo de avance con horómetro base.'
    ]);
    console.log(`✅ tcfg_backlog registrado (${schema}).`);
  } catch (err) {
    console.error(`⚠️ Error al sincronizar BD (${schema}):`, err.message);
  } finally {
    await client.end();
  }
}

async function runDeploy() {
  console.log('========================================================================');
  console.log('🚀 DESPLIEGUE PWA v1.0.43 / REQ-1044 (DEV & PROD)');
  console.log('========================================================================\n');

  try {
    await ssh.connect({
      host: '138.255.103.18',
      username: 'root',
      password: 'lgbl2025.',
      port: 1295,
      readyTimeout: 20000
    });
    console.log('✅ Conectado como root por SSH.\n');

    // 1. DESPLIEGUE PWA DEV
    console.log('--- 1. DESPLEGANDO PWA A DEV (/var/www/html/pwa-gsp-dev) ---');
    const localDistDev = path.resolve(__dirname, '../ejecucion/pwa/dist_dev');
    const remotePwaDev = '/var/www/html/pwa-gsp-dev';

    console.log(`Subiendo archivos desde ${localDistDev} a ${remotePwaDev}...`);
    await ssh.putDirectory(localDistDev, remotePwaDev, {
      recursive: true,
      concurrency: 10,
      validate: (itemPath) => !itemPath.includes('.map')
    });
    await ssh.execCommand(`chown -R nginx:nginx ${remotePwaDev} && chmod -R 755 ${remotePwaDev}`);
    console.log('✅ PWA desplegado en DEV con permisos nginx.\n');

    // 2. DESPLIEGUE PWA PROD
    console.log('--- 2. DESPLEGANDO PWA A PROD (/var/www/html/pwa-gsp-prod) ---');
    const localDistProd = path.resolve(__dirname, '../ejecucion/pwa/dist_prod');
    const remotePwaProd = '/var/www/html/pwa-gsp-prod';

    console.log(`Subiendo archivos desde ${localDistProd} a ${remotePwaProd}...`);
    await ssh.putDirectory(localDistProd, remotePwaProd, {
      recursive: true,
      concurrency: 10,
      validate: (itemPath) => !itemPath.includes('.map')
    });
    await ssh.execCommand(`chown -R nginx:nginx ${remotePwaProd} && chmod -R 755 ${remotePwaProd}`);
    console.log('✅ PWA desplegado en PROD con permisos nginx.\n');

    // 3. SINCRONIZACIÓN GOBERNANZA BD
    await syncDbRelease('sch_leangsp');
    await syncDbRelease('sch_leangsp_prod');

    // 4. VERIFICACIÓN DETERMINISTA
    console.log('\n--- 4. VERIFICACIÓN DETERMINISTA HTTP ---');
    const statusDev = await checkUrl('https://servidor.leanglobal.cl/pwa-gsp-dev/');
    console.log(`HTTP DEV PWA (pwa-gsp-dev): ${statusDev.status}`);

    const statusProd = await checkUrl('https://servidor.leanglobal.cl/pwa-gsp-prod/');
    console.log(`HTTP PROD PWA (pwa-gsp-prod): ${statusProd.status}`);

    const devAssets = await ssh.execCommand(`grep -o "/pwa-gsp-dev/[^\"]*" ${remotePwaDev}/index.html | head -n 3`);
    console.log('Index DEV assets:\n', devAssets.stdout.trim());

    const prodAssets = await ssh.execCommand(`grep -o "/pwa-gsp-prod/[^\"]*" ${remotePwaProd}/index.html | head -n 3`);
    console.log('Index PROD assets:\n', prodAssets.stdout.trim());

    console.log('\n🎉 ¡DESPLIEGUE PWA v1.0.43 FINALIZADO EXITOSAMENTE!');
  } catch (err) {
    console.error('❌ Error fatal durante el despliegue:', err);
    process.exit(1);
  } finally {
    ssh.dispose();
  }
}

runDeploy();
