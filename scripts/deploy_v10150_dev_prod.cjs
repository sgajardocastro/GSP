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

async function deployDevProdV10150() {
  console.log('=== DESPLIEGUE A DEV Y PROD v1.0.150 (REQ-1058 / SPEC-066 Master) ===\n');
  console.log('Conectando a servidor SSH...');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  // 1. DESPLIEGUE FRONTEND
  console.log('\n--- 1. DESPLIEGUE FRONTEND DIST A DEV Y PROD ---');
  const localDistDev = path.resolve(__dirname, '../ejecucion/frontend/dist_dev');
  const localDistProd = path.resolve(__dirname, '../ejecucion/frontend/dist_prod');
  const remoteDevDist = '/var/www/html/lg-gsp-dev';
  const remoteProdDist = '/var/www/html/lg-gsp-prod';

  console.log(`1.1 Subiendo a DEV (${remoteDevDist}) desde ${localDistDev}...`);
  const statusDev = await ssh.putDirectory(localDistDev, remoteDevDist, {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.git')
  });
  if (!statusDev) throw new Error('Fallo al transferir dist_dev a DEV');

  console.log(`1.2 Subiendo a PROD (${remoteProdDist}) desde ${localDistProd}...`);
  const statusProd = await ssh.putDirectory(localDistProd, remoteProdDist, {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.git')
  });
  if (!statusProd) throw new Error('Fallo al transferir dist_prod a PROD');

  console.log('1.3 Ajustando permisos nginx:nginx y 755...');
  await ssh.execCommand(`chown -R nginx:nginx ${remoteDevDist} && chmod -R 755 ${remoteDevDist}`);
  await ssh.execCommand(`chown -R nginx:nginx ${remoteProdDist} && chmod -R 755 ${remoteProdDist}`);

  // 2. GOBERNANZA: SINCRONIZACIÓN EN TCFG_BACKLOG Y TCFG_RELEASES
  console.log('\n--- 2. GOBERNANZA: REGISTRO EN TCFG_BACKLOG Y TCFG_RELEASES ---');
  const schemas = ['sch_leangsp', 'sch_leangsp_prod'];
  for (const s of schemas) {
    const sql = `
      INSERT INTO ${s}.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_implementacion, solicitado_por, estado)
      VALUES (
        'REQ-1058',
        'Soporte Mono-Equipo y Pareo Resiliente de Patentes en Cálculo de Ingresos y Mano de Obra en ITS Transición',
        'SPEC-066 Master (Sección 4.3): Cálculo automático y resiliente de ingresos por horas y mano de obra para servicios con mono-equipo (sin requerir patente exacta en cada jornada) y pareo normalizado para multi-equipo con fallback a equipo principal.',
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
        '1.0.150',
        'Soporte Mono-Equipo y Pareo Resiliente de Patentes en ITS Transición (SPEC-066 Master)',
        'BUGFIX',
        'Corrige fallo donde servicios con un solo equipo (ej. Cotización 11308 de Tracto Camión) valorizaban ingresos por horas en $0 cuando la patente de las jornadas no coincidía de forma exacta. Ahora calcula determinísticamente las horas reportadas por la tarifa horaria del equipo.',
        'REQ-1058',
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

  // 3. VERIFICACIÓN HTTP
  console.log('\n--- 3. VERIFICACIÓN HTTP EN VIVO ---');
  const devCheck = await checkUrl('https://servidor.leanglobal.cl/lg-gsp-dev/its-transicion');
  const prodCheck = await checkUrl('https://servidor.leanglobal.cl/lg-gsp-prod/its-transicion');
  console.log('DEV (https://servidor.leanglobal.cl/lg-gsp-dev/its-transicion):', devCheck.status);
  console.log('PROD (https://servidor.leanglobal.cl/lg-gsp-prod/its-transicion):', prodCheck.status);

  // 4. VERIFICACIÓN DE INDEX.HTML EN PROD Y DEV
  const headDev = await ssh.execCommand('head -n 25 /var/www/html/lg-gsp-dev/index.html');
  console.log('\nDEV index.html script tag:');
  console.log(headDev.stdout.split('\n').filter(l => l.includes('script') || l.includes('link')).join('\n'));

  const headProd = await ssh.execCommand('head -n 25 /var/www/html/lg-gsp-prod/index.html');
  console.log('\nPROD index.html script tag:');
  console.log(headProd.stdout.split('\n').filter(l => l.includes('script') || l.includes('link')).join('\n'));

  ssh.dispose();
  console.log('\n✅ DESPLIEGUE A DEV Y PROD v1.0.150 FINALIZADO CON ÉXITO.');
}

deployDevProdV10150().catch(e => {
  console.error('Error durante el despliegue:', e);
  process.exit(1);
});
