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
  console.log('DESPLIEGUE A DEV: FRONTEND WEB v1.0.146 (REQ-1052 / SPEC-082)');
  console.log('========================================================================\n');

  try {
    await ssh.connect({
      host: '138.255.103.18',
      username: 'root',
      password: process.env.SSH_PASSWORD || 'lgbl2025.',
      port: 1295,
      readyTimeout: 30000
    });
    console.log('Conectado como root por SSH.\n');

    // 1. DESPLIEGUE FRONTEND WEB DEV
    console.log('--- SUBIENDO FRONTEND WEB A DEV (/var/www/html/lg-gsp-dev) ---');
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
    console.log('Frontend Web v1.0.146 desplegado en DEV con permisos nginx:nginx 755.\n');

    // 2. REGISTRO EN BASE DE DATOS (tcfg_backlog & tcfg_releases)
    console.log('--- SINCRONIZANDO BACKLOG Y RELEASES EN POSTGRESQL (sch_leangsp) ---');
    const sql = `
      -- REQ-1052 COMPLETADO
      INSERT INTO sch_leangsp.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_implementacion, solicitado_por, estado)
      VALUES (
        'REQ-1052',
        'Perspectiva Web de Plataformas: Contrato Legal en 3 Páginas a 10px, Visibilidad y Versiones Contractuales, Bloque de Actas 360° e Indexación en Biblioteca Documental',
        'Formalización SPEC-082; contrato legal en 3 páginas continuas a 10px en proyectoModel.js; badge interactivo en header y botón transversal [Contrato & Actas 360°] en subtahs bar de GestorOportunidades.vue; visualizador de versiones de contrato; Bloque B de Actas 360° en tab contrato; e indexación dimensional de contratos y actas en Documentos.vue.',
        'Alta',
        '2026-10-16',
        'Sergio Gajardo',
        'COMPLETADO'
      ) ON CONFLICT (codigo_req) DO UPDATE SET 
        estado = 'COMPLETADO', 
        fecha_implementacion = '2026-10-16',
        descripcion = EXCLUDED.descripcion;

      -- REQ-1053 PENDIENTE (BACKLOG OFFLINE-FIRST PWA)
      INSERT INTO sch_leangsp.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_implementacion, solicitado_por, estado)
      VALUES (
        'REQ-1053',
        'Migración Definitiva de Viajes de Desplazamiento desde el Portal Web hacia la PWA con Lógica Offline-First',
        'Migración de ViajeConductor.vue hacia la PWA del operador/chofer con persistencia local en IndexedDB (LocalForage) para operar sin cobertura y sincronizar al recuperar conexión, manteniendo fallback por enlace WhatsApp para externos.',
        'Media',
        NULL,
        'Sergio Gajardo',
        'PENDIENTE'
      ) ON CONFLICT (codigo_req) DO UPDATE SET 
        estado = 'PENDIENTE',
        descripcion = EXCLUDED.descripcion;

      -- RELEASE v1.0.146
      INSERT INTO sch_leangsp.tcfg_releases (modulo, version, ambiente, fecha_release, descripcion, autor)
      VALUES (
        'Portal Web GSP',
        'v1.0.146',
        'dev',
        CURRENT_TIMESTAMP,
        'SPEC-082: Perspectiva Web de Plataformas, Contrato en 3 Páginas a 10px, Visibilidad y Versiones Contractuales, Bloque de Actas 360° en CRM e Indexación en Biblioteca Documental (REQ-1052).',
        'Sergio Gajardo / Antigravity'
      ) ON CONFLICT (modulo, version, ambiente) DO UPDATE SET
        fecha_release = CURRENT_TIMESTAMP,
        descripcion = EXCLUDED.descripcion;
    `;

    const rSql = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sql.replace(/"/g, '\\"')}\\""`);
    console.log(rSql.stdout.trim() || rSql.stderr);

    ssh.dispose();

    // 3. Verificación HTTP
    console.log('\n--- VERIFICANDO ESTADO HTTP DEV ---');
    const webCheck = await checkUrl('https://servidor.leanglobal.cl/lg-gsp-dev/');
    console.log(`URL Web DEV: https://servidor.leanglobal.cl/lg-gsp-dev/ -> Status: ${webCheck.status}`);

    if (webCheck.status === 200) {
      console.log('\n========================================================================');
      console.log('DESPLIEGUE DEV COMPLETADO CON EXITO (HTTP 200 OK)');
      console.log('========================================================================');
    } else {
      console.warn('Advertencia: El endpoint no retorno 200 OK.');
    }
  } catch (err) {
    console.error('Error durante el despliegue:', err.message);
    process.exit(1);
  }
}

runDeploy();
