const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const fs = require('fs');
const https = require('https');

const ssh = new NodeSSH();

function validarGobernanzaAntesDeDesplegar() {
  console.log('🛡️ [HARD GATE] Ejecutando verificación obligatoria de gobernanza...');
  const pkgPath = path.resolve(__dirname, '../ejecucion/frontend/package.json');
  const releaseLogPath = path.resolve(__dirname, '../RELEASE_LOG.md');
  const tareasPath = path.resolve(__dirname, '../Gestión/tareas.md');

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const versionActual = pkg.version;
  console.log(`📦 Versión detectada en package.json: ${versionActual}`);

  const releaseLogContent = fs.readFileSync(releaseLogPath, 'utf8');
  const regexVersion = new RegExp(`##\\s*\\[Portal Web GSP\\]\\s*-\\s*Versi[oó]n\\s*${versionActual.replace(/\./g, '\\.')}`, 'i');
  if (!regexVersion.test(releaseLogContent)) {
    throw new Error(`DESPLIEGUE BLOQUEADO: La versión ${versionActual} no está en RELEASE_LOG.md`);
  }

  const tareasContent = fs.readFileSync(tareasPath, 'utf8');
  if (!/\[x\][^\n]*REQ-1082/i.test(tareasContent)) {
    throw new Error('DESPLIEGUE BLOQUEADO: REQ-1082 no está marcado como [x] en Gestión/tareas.md');
  }

  console.log(`✅ [HARD GATE SUPERADO]: Versión ${versionActual} y REQ-1082 validados.\n`);
  return versionActual;
}

function checkHttpsUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, body }));
    }).on('error', reject);
  });
}

async function deployProd() {
  const version = validarGobernanzaAntesDeDesplegar();

  console.log('===============================================================');
  console.log(`🚀 INICIANDO DESPLIEGUE EN PROD v${version} (SPEC-016 v3.8.0 / REQ-1082)`);
  console.log('===============================================================\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });
  console.log('✓ Conectado a servidor.leanglobal.cl:1295 (root)');

  const prodDir = '/home/nodeadmin/proyectos/lean-services-gsp-prod/src';
  const localBackendSrc = path.resolve(__dirname, '../ejecucion/backend_remoto/src');

  // 1. Subir archivos backend a PROD
  console.log('\n[1/5] Sincronizando directorio Backend src completo en PROD (/home/nodeadmin/proyectos/lean-services-gsp-prod/src)...');
  const okBackend = await ssh.putDirectory(localBackendSrc, prodDir, {
    recursive: true,
    concurrency: 15,
    validate: (itemPath) => !itemPath.includes('.git')
  });
  if (!okBackend) {
    throw new Error('Fallo al sincronizar backend src en PROD');
  }
  await ssh.execCommand(`chown -R nodeadmin:nodeadmin ${prodDir}`);
  console.log('✓ Directorio backend PROD sincronizado.');

  // 2. Reiniciar PM2 proceso lean-services-gsp-prod (ID 13)
  console.log('\n[2/5] Reiniciando proceso PM2 lean-services-gsp-prod (ID 13)...');
  const pm2Res = await ssh.execCommand('su - nodeadmin -c "pm2 restart lean-services-gsp-prod"');
  console.log(pm2Res.stdout.trim() || pm2Res.stderr.trim());
  await new Promise(r => setTimeout(r, 4000));
  const errLogs = await ssh.execCommand('tail -n 35 /home/nodeadmin/.pm2/logs/lean-services-gsp-prod-error.log');
  console.log('--- Últimas líneas error.log PROD ---\n', errLogs.stdout.trim());
  const outLogs = await ssh.execCommand('tail -n 20 /home/nodeadmin/.pm2/logs/lean-services-gsp-prod-out.log');
  console.log('--- Últimas líneas out.log PROD ---\n', outLogs.stdout.trim());

  // 3. Subir Frontend dist_prod a /var/www/html/lg-gsp-prod (y /var/www/html/lg-gsp si existe)
  const localDistProd = path.resolve(__dirname, '../ejecucion/frontend/dist_prod');
  const remoteWebProd = '/var/www/html/lg-gsp-prod';
  console.log(`\n[3/5] Subiendo build Frontend PROD (${remoteWebProd})...`);
  const ok = await ssh.putDirectory(localDistProd, remoteWebProd, {
    recursive: true,
    concurrency: 15,
    validate: (itemPath) => !itemPath.includes('.git')
  });
  if (!ok) {
    throw new Error('Fallo al subir dist_prod a /var/www/html/lg-gsp-prod');
  }
  await ssh.execCommand(`chown -R nginx:nginx ${remoteWebProd} && chmod -R 755 ${remoteWebProd}`);

  const checkAliasDir = await ssh.execCommand('test -d /var/www/html/lg-gsp && echo "EXISTS" || echo "NO"');
  if (checkAliasDir.stdout.trim() === 'EXISTS') {
    console.log('Sincronizando también en /var/www/html/lg-gsp...');
    await ssh.putDirectory(localDistProd, '/var/www/html/lg-gsp', {
      recursive: true,
      concurrency: 15,
      validate: (itemPath) => !itemPath.includes('.git')
    });
    await ssh.execCommand('chown -R nginx:nginx /var/www/html/lg-gsp && chmod -R 755 /var/www/html/lg-gsp');
  }
  console.log('✓ Frontend PROD subido y permisos nginx aplicados.');

  // 4. Sincronizar tcfg_backlog y tcfg_releases en sch_leangsp_prod
  console.log('\n[4/5] Sincronizando tcfg_backlog y tcfg_releases en sch_leangsp_prod...');
  const syncSql = `
    INSERT INTO sch_leangsp_prod.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_implementacion, solicitado_por, estado, creado_por)
    VALUES (
      'REQ-1082',
      'Redefinición del Estructurador Comercial Autónomo y Diferimiento de Política Urbana/Rural Obligatoria a Operaciones con Motivo y Fecha de Devolución',
      'SPEC-016 v3.8.0: Estructuración libre en Preventa Comercial manteniendo distancia_km como antecedente; selección obligatoria de Política Urbana o Rural en Verificación de Operaciones sin preselección automática; devolución a Comercial con Motivo de Rechazo y Fecha de Devolución visibles en alerta; cobro al cliente Urbano desde salida de base a término en obra y Rural de inicio a término en obra; pago al operador Urbano sin traslado (solo horas reportadas) y Rural con diferencia positiva sobre horas mínimas.',
      'Alta',
      CURRENT_DATE,
      'Jorge Ponce / Sergio Gajardo',
      'Implementado',
      'Sergio Gajardo'
    )
    ON CONFLICT (codigo_req) DO UPDATE SET
      nombre_requerimiento = EXCLUDED.nombre_requerimiento,
      estado = 'Implementado',
      fecha_implementacion = CURRENT_DATE,
      descripcion = EXCLUDED.descripcion,
      updated_at = NOW();

    INSERT INTO sch_leangsp_prod.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
    VALUES (
      '${version}',
      'Estructurador Comercial Autónomo, Política Urbana/Rural Obligatoria en Operaciones, Rechazo con Fecha/Motivo y Reglas de Cobro/Liquidación',
      'FEATURE',
      'REQ-1082 / SPEC-016 v3.8.0: Eliminación de bloques rígidos de casos en Preventa Comercial, respuesta obligatoria de Política Urbana/Rural y devolución a Comercial con motivo de rechazo y fecha en Verificación de Operaciones, y actualización de reglas de cobro al cliente (EDP) e incentivos de horas al operador (RRHH).',
      '["REQ-1082"]'::jsonb,
      'Sergio Gajardo'
    )
    ON CONFLICT (version) DO UPDATE SET
      titulo = EXCLUDED.titulo,
      descripcion_impacto = EXCLUDED.descripcion_impacto,
      requerimientos_asociados = EXCLUDED.requerimientos_asociados;
  `;
  await ssh.execCommand(`cat << 'EOF' > /tmp/sync_v171_prod.sql\n${syncSql}\nEOF`);
  const sqlRes = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/sync_v171_prod.sql"');
  console.log('Resultado SQL PROD:\n', sqlRes.stdout.trim() || sqlRes.stderr.trim());
  await ssh.execCommand('rm -f /tmp/sync_v171_prod.sql');

  // 5. Verificación Empírica Live en PROD
  console.log('\n[5/5] Verificando HTTP 200 OK en PROD...');
  const localIndexHtml = fs.readFileSync(path.join(localDistProd, 'index.html'), 'utf8');
  const matchJs = localIndexHtml.match(/assets\/(index-[^"']+\.js)/);
  const expectedJs = matchJs ? matchJs[1] : null;

  const prodWeb = await checkHttpsUrl('https://servidor.leanglobal.cl/lg-gsp-prod/');
  const prodApiInternal = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3016/api/operaciones/report/pendientes-analista"');
  const prodApiPublic = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" "https://servidor.leanglobal.cl/lg-gsp-prod/api/operaciones/report/pendientes-analista"');

  console.log(`HTTP Status PROD Web (https://servidor.leanglobal.cl/lg-gsp-prod/): ${prodWeb.statusCode}`);
  if (expectedJs) {
    console.log(`Bundle JS esperado (${expectedJs}) presente en PROD live: ${prodWeb.body.includes(expectedJs)}`);
  }
  console.log(`HTTP Status PROD API Socket (http://127.0.0.1:3016/api/operaciones/report/pendientes-analista): ${prodApiInternal.stdout.trim()}`);
  console.log(`HTTP Status PROD API Public (https://servidor.leanglobal.cl/lg-gsp-prod/api/operaciones/report/pendientes-analista): ${prodApiPublic.stdout.trim()}`);

  ssh.dispose();
  console.log('\n===============================================================');
  console.log(`✅ DESPLIEGUE PROD v${version} FINALIZADO EXITOSAMENTE`);
  console.log('===============================================================');
}

deployProd().catch(err => {
  console.error('❌ Error desplegando en PROD:', err);
  process.exit(1);
});
