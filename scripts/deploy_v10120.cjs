const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const https = require('https');
const ssh = new NodeSSH();

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve(res.statusCode);
    }).on('error', (e) => {
      resolve(e.message);
    });
  });
}

async function deployV10120() {
  console.log('=== DESPLIEGUE INTEGRAL DEV & PROD v1.0.120 (REQ-1022 / BÓVEDA Y PIPELINE ITS) ===\n');

  const rootDir = path.resolve(__dirname, '..');
  const frontendDir = path.join(rootDir, 'ejecucion/frontend');
  const distDevDir = path.join(frontendDir, 'dist_dev');
  const distProdDir = path.join(frontendDir, 'dist_prod');

  // 1. COMPILAR FRONTEND DEV
  console.log('--- 1. COMPILANDO FRONTEND DEV (base=/lg-gsp-dev/) ---');
  if (fs.existsSync(distDevDir)) fs.rmSync(distDevDir, { recursive: true, force: true });
  execSync('npx vite build --base=/lg-gsp-dev/ --outDir dist_dev --mode development', {
    cwd: frontendDir,
    stdio: 'inherit'
  });

  // 2. COMPILAR FRONTEND PROD
  console.log('\n--- 2. COMPILANDO FRONTEND PROD (base=/lg-gsp-prod/) ---');
  if (fs.existsSync(distProdDir)) fs.rmSync(distProdDir, { recursive: true, force: true });
  execSync('npx vite build --base=/lg-gsp-prod/ --outDir dist_prod --mode production', {
    cwd: frontendDir,
    stdio: 'inherit'
  });

  // 3. CONECTAR SSH Y TRANSFERIR ARCHIVOS
  console.log('\n--- 3. CONECTANDO A SERVIDOR SSH ---');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  // DESPLIEGUE FRONTEND A DEV (/var/www/html/lg-gsp-dev)
  console.log('\n--- 4. DESPLIEGUE FRONTEND DIST_DEV A DEV (/var/www/html/lg-gsp-dev) ---');
  const remoteDistDev = '/var/www/html/lg-gsp-dev';
  console.log(`Subiendo archivos desde ${distDevDir} hacia ${remoteDistDev}...`);
  const statusPutDev = await ssh.putDirectory(distDevDir, remoteDistDev, {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.git')
  });

  if (!statusPutDev) {
    throw new Error('Fallo al transferir archivos dist_dev a DEV');
  }
  console.log('Fijando permisos nginx:nginx y 755 en lg-gsp-dev...');
  await ssh.execCommand(`chown -R nginx:nginx ${remoteDistDev} && chmod -R 755 ${remoteDistDev}`);

  // DESPLIEGUE FRONTEND A PROD (/var/www/html/lg-gsp-prod)
  console.log('\n--- 5. DESPLIEGUE FRONTEND DIST_PROD A PROD (/var/www/html/lg-gsp-prod) ---');
  const remoteDistProd = '/var/www/html/lg-gsp-prod';
  console.log(`Subiendo archivos desde ${distProdDir} hacia ${remoteDistProd}...`);
  const statusPutProd = await ssh.putDirectory(distProdDir, remoteDistProd, {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.git')
  });

  if (!statusPutProd) {
    throw new Error('Fallo al transferir archivos dist_prod a PROD');
  }
  console.log('Fijando permisos nginx:nginx y 755 en lg-gsp-prod...');
  await ssh.execCommand(`chown -R nginx:nginx ${remoteDistProd} && chmod -R 755 ${remoteDistProd}`);

  // 6. GOBERNANZA: SINCRONIZACIÓN EN TCFG_BACKLOG Y TCFG_RELEASES
  console.log('\n--- 6. GOBERNANZA: REGISTRO EN TCFG_BACKLOG Y TCFG_RELEASES ---');
  const schemas = ['sch_leangsp', 'sch_leangsp_prod'];
  for (const s of schemas) {
    const sql = `
      INSERT INTO ${s}.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_implementacion, solicitado_por, estado)
      VALUES ('REQ-1022', 'Bóveda de Planillas GeraldSoft, Ingesta Incremental Diaria y Matriz de Conciliación ITS', 'Bóveda central compartida en la nube con autor y fecha, ingesta incremental diaria con deduplicación por clave natural (upsert) sin pérdida de datos, y matriz interactiva de conciliación operativa con semáforo de estado de ITS (Pendiente, Trámite, Observado, Concluido).', 'Alta', CURRENT_DATE, 'Sergio Gajardo', 'Implementado')
      ON CONFLICT (codigo_req) DO UPDATE SET 
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        estado = 'Implementado',
        fecha_implementacion = CURRENT_DATE,
        updated_at = NOW();

      INSERT INTO ${s}.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
      VALUES ('v1.0.120', 'Portal Web GSP v1.0.120 - Bóveda Central GeraldSoft, Cargas Incrementales y Matriz de Conciliación ITS', 'Feature', 'Despliegue de la Bóveda Corporativa de Planillas centralizada, soporte de ingesta incremental diaria con upsert por clave natural y matriz interactiva de conciliación con pipeline y semáforos de ITS.', jsonb_build_array('REQ-1022'), 'Sergio Gajardo')
      ON CONFLICT (version) DO UPDATE SET
        titulo = EXCLUDED.titulo,
        descripcion_impacto = EXCLUDED.descripcion_impacto,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    `;
    const resSql = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sql.replace(/"/g, '\\"')}\\""`);
    if (resSql.code !== 0) {
      console.warn(`Aviso gobernanza en ${s}:`, resSql.stderr);
    } else {
      console.log(`Gobernanza en ${s}: OK`);
    }
  }

  // 7. VERIFICACIÓN EMPÍRICA HTTP
  console.log('\n--- 7. VERIFICACIÓN EMPÍRICA HTTP ---');
  const devStatus = await checkUrl('https://servidor.leanglobal.cl/lg-gsp-dev/');
  const prodStatus = await checkUrl('https://servidor.leanglobal.cl/lg-gsp-prod/');

  console.log(`HTTP DEV Status:  ${devStatus}`);
  console.log(`HTTP PROD Status: ${prodStatus}`);

  ssh.dispose();

  if (devStatus === 200 && prodStatus === 200) {
    console.log('\n=== DESPLIEGUE EXITOSO Y CERTIFICADO (DEV & PROD) ===');
  } else {
    throw new Error(`Verificación HTTP fallida: DEV=${devStatus}, PROD=${prodStatus}`);
  }
}

deployV10120().catch(err => {
  console.error('Error en despliegue v1.0.120:', err);
  process.exit(1);
});
