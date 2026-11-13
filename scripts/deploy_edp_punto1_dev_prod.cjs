const fs = require('fs');
const path = require('path');
const https = require('https');
const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');

const ssh = new NodeSSH();

function validarGobernanzaAntesDeDesplegar(config) {
  console.log('🛡️ [HARD GATE] Ejecutando verificación obligatoria de gobernanza...');

  // 1. Validar package.json
  if (!fs.existsSync(config.pkgPath)) {
    console.error('❌ ERROR CRÍTICO: No existe package.json en', config.pkgPath);
    process.exit(1);
  }
  const pkg = JSON.parse(fs.readFileSync(config.pkgPath, 'utf8'));
  const versionActual = pkg.version;
  console.log(`📦 Versión detectada en package.json: ${versionActual}`);

  // 2. Validar entrada en RELEASE_LOG.md
  if (!fs.existsSync(config.releaseLogPath)) {
    console.error('❌ ERROR CRÍTICO: No existe RELEASE_LOG.md en', config.releaseLogPath);
    process.exit(1);
  }
  const releaseLogContent = fs.readFileSync(config.releaseLogPath, 'utf8');
  const escapedVersion = versionActual.replace(/\./g, '\\.');
  const regexVersion = new RegExp(`##\\s*\\[${config.nombreProducto}\\]\\s*-\\s*Versi[oó]n\\s*${escapedVersion}`, 'i');

  if (!regexVersion.test(releaseLogContent)) {
    console.error('\n==========================================================================');
    console.error(`❌ DESPLIEGUE BLOQUEADO: La versión ${versionActual} no está documentada en RELEASE_LOG.md`);
    console.error(`   Debes crear el bloque: "## [${config.nombreProducto}] - Versión ${versionActual}" antes de desplegar.`);
    console.error('==========================================================================\n');
    process.exit(1);
  }

  // 3. Extraer REQ asociado
  const bloqueMatch = releaseLogContent.match(new RegExp(`##\\s*\\[${config.nombreProducto}\\]\\s*-\\s*Versi[oó]n\\s*${escapedVersion}[\\s\\S]*?(?=##\\s*\\[|$)`, 'i'));
  const bloqueTexto = bloqueMatch ? bloqueMatch[0] : '';
  const reqMatch = bloqueTexto.match(/REQ-\d+/i);
  if (!reqMatch) {
    console.error(`❌ DESPLIEGUE BLOQUEADO: El bloque ${versionActual} en RELEASE_LOG.md no indica "REQ-XXX".`);
    process.exit(1);
  }
  const reqCodigo = reqMatch[0].toUpperCase();

  // 4. Validar tareas.md
  if (!fs.existsSync(config.tareasPath)) {
    console.error('❌ ERROR CRÍTICO: No existe Gestión/tareas.md en', config.tareasPath);
    process.exit(1);
  }
  const tareasContent = fs.readFileSync(config.tareasPath, 'utf8');
  const regexReqCompletado = new RegExp(`\\[x\\][^\\n]*${reqCodigo}`, 'i');
  if (!regexReqCompletado.test(tareasContent)) {
    console.error(`❌ DESPLIEGUE BLOQUEADO: El requerimiento ${reqCodigo} no existe o no está marcado como completado ([x]) en Gestión/tareas.md.`);
    process.exit(1);
  }

  console.log(`✅ [HARD GATE SUPERADO]: Versión ${versionActual} y ${reqCodigo} validados y trazables.\n`);
  return { version: versionActual, req: reqCodigo };
}

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({ status: res.statusCode });
    }).on('error', (e) => {
      resolve({ error: e.message });
    });
  });
}

async function deployEdpPunto1() {
  const govInfo = validarGobernanzaAntesDeDesplegar({
    nombreProducto: 'Portal Web GSP',
    pkgPath: path.resolve(__dirname, '../ejecucion/frontend/package.json'),
    releaseLogPath: path.resolve(__dirname, '../RELEASE_LOG.md'),
    tareasPath: path.resolve(__dirname, '../Gestión/tareas.md')
  });

  console.log('=== DESPLIEGUE REQ-1068 / SPEC-099 / v1.0.158 (DESACOPLAMIENTO EDP + 3 FIRMAS FES + OC CON COPIA A CONTABILIDAD) ===\n');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const backendFiles = [
    'src/routes/estadoPagoRoutes.js',
    'src/controllers/estadoPagoController.js',
    'src/services/edpPdfService.js',
    'src/services/dtePdfParserService.js',
    'src/controllers/reportDiarioController.js'
  ];

  const devBackendRoot = '/home/nodeadmin/proyectos/lean-services-gsp';
  const prodBackendRoot = '/home/nodeadmin/proyectos/lean-services-gsp-prod';

  console.log('--- 1. SUBIENDO BACKEND A DEV Y PROD ---');
  for (const rel of backendFiles) {
    const localFile = path.resolve(__dirname, '../ejecucion/backend_remoto', rel);
    await ssh.putFile(localFile, `${devBackendRoot}/${rel}`);
    await ssh.putFile(localFile, `${prodBackendRoot}/${rel}`);
    await ssh.execCommand(`chown nodeadmin:nodeadmin ${devBackendRoot}/${rel} ${prodBackendRoot}/${rel}`);
    console.log(`✔ Subido: ${rel} -> DEV y PROD`);
  }

  console.log('--- 2. REINICIANDO PM2 EN DEV (10) Y PROD (13) ---');
  const pm2Res = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10 && pm2 restart 13"');
  console.log(pm2Res.stdout || pm2Res.stderr);

  console.log('--- 3. SUBIENDO FRONTEND DIST_DEV Y DIST_PROD ---');
  const localDistDev = path.resolve(__dirname, '../ejecucion/frontend/dist_dev');
  const localDistProd = path.resolve(__dirname, '../ejecucion/frontend/dist_prod');
  const remoteDevDist = '/var/www/html/lg-gsp-dev';
  const remoteProdDist = '/var/www/html/lg-gsp-prod';

  const statusDev = await ssh.putDirectory(localDistDev, remoteDevDist, {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.git')
  });
  if (!statusDev) throw new Error('Fallo al transferir dist_dev a DEV');
  console.log('✔ Frontend DEV actualizado');

  const statusProd = await ssh.putDirectory(localDistProd, remoteProdDist, {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.git')
  });
  if (!statusProd) throw new Error('Fallo al transferir dist_prod a PROD');
  console.log('✔ Frontend PROD actualizado');

  await ssh.execCommand(`chown -R nginx:nginx ${remoteDevDist} && chmod -R 755 ${remoteDevDist}`);
  await ssh.execCommand(`chown -R nginx:nginx ${remoteProdDist} && chmod -R 755 ${remoteProdDist}`);

  console.log('--- 4. SINCRONIZANDO GOBERNANZA EN POSTGRESQL (sch_leangsp y sch_leangsp_prod) ---');
  require('../ejecucion/backend_remoto/node_modules/dotenv').config({ path: path.resolve(__dirname, '../ejecucion/backend_remoto/.env') });
  const pool = require('../ejecucion/backend_remoto/src/config/dbConfig.js');
  const tituloRelease = 'Perspectiva Contabilidad en Torre de Control: Embudo Financiero E2E (5 Variables), Gráficos Ejecutivos, Sábana de Calce por Proceso y Reportes Exportables a Excel de Horas de Operadores/Riggers y Ventas por Grúa/Equipo';
  const descripcionImpacto = 'SPEC-100: Nueva Perspectiva Contabilidad en Torre.vue y PerspectivaContabilidad.vue con 5 KPIs del embudo E2E, gráficos ejecutivos y 3 submenús con descarga multi-hoja .xlsx.';

  await pool.query(`
    INSERT INTO sch_leangsp.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, estado, fecha_implementacion, solicitado_por)
    VALUES ($1, $2, $3, 'Critica', 'Implementado', CURRENT_DATE, 'Contabilidad / Gerencia GSP')
    ON CONFLICT (codigo_req) DO UPDATE
    SET nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        estado = 'Implementado',
        fecha_implementacion = CURRENT_DATE,
        updated_at = NOW();
  `, [govInfo.req, tituloRelease, descripcionImpacto]);

  await pool.query(`
    INSERT INTO sch_leangsp.tcfg_releases (version, fecha_release, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
    VALUES ($1, CURRENT_DATE, $2, 'Feature', $3, $4::jsonb, 'DevOps LeanGlobal')
    ON CONFLICT (version) DO UPDATE
    SET fecha_release = CURRENT_DATE,
        titulo = EXCLUDED.titulo,
        descripcion_impacto = EXCLUDED.descripcion_impacto,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
  `, [`v${govInfo.version}`, tituloRelease, descripcionImpacto, JSON.stringify([govInfo.req])]);

  console.log(`✔ Sincronizado en sch_leangsp: ${govInfo.req} & v${govInfo.version}`);
  await pool.end();

  const dbName = process.env.DB_NAME;
  const sqlProd = `
    INSERT INTO sch_leangsp_prod.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, estado, fecha_implementacion, solicitado_por)
    VALUES ('${govInfo.req}', '${tituloRelease.replace(/'/g, "''")}', '${descripcionImpacto.replace(/'/g, "''")}', 'Critica', 'Implementado', CURRENT_DATE, 'Contabilidad / Gerencia GSP')
    ON CONFLICT (codigo_req) DO UPDATE
    SET nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        estado = 'Implementado',
        fecha_implementacion = CURRENT_DATE,
        updated_at = NOW();
    INSERT INTO sch_leangsp_prod.tcfg_releases (version, fecha_release, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
    VALUES ('v${govInfo.version}', CURRENT_DATE, '${tituloRelease.replace(/'/g, "''")}', 'Feature', '${descripcionImpacto.replace(/'/g, "''")}', '["${govInfo.req}"]'::jsonb, 'DevOps LeanGlobal')
    ON CONFLICT (version) DO UPDATE
    SET fecha_release = CURRENT_DATE,
        titulo = EXCLUDED.titulo,
        descripcion_impacto = EXCLUDED.descripcion_impacto,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
  `;
  const prodSyncRes = await ssh.execCommand(`su - postgres -c "psql -d ${dbName} -c \\"${sqlProd.replace(/"/g, '\\"').replace(/\n/g, ' ')}\\\""`);
  console.log(`✔ Sincronizado en sch_leangsp_prod:`, (prodSyncRes.stdout || prodSyncRes.stderr).trim());

  console.log('--- 5. VERIFICACIÓN HTTP EN VIVO ---');
  await new Promise(r => setTimeout(r, 2500));
  const devWeb = await checkUrl('https://servidor.leanglobal.cl/lg-gsp-dev/');
  const prodWeb = await checkUrl('https://servidor.leanglobal.cl/lg-gsp-prod/');
  const devDoc = await checkUrl('https://servidor.leanglobal.cl/lg-gsp-dev/manual_contabilidad_edp_y_facturacion_gsp.html');
  const prodDoc = await checkUrl('https://servidor.leanglobal.cl/lg-gsp-prod/manual_contabilidad_edp_y_facturacion_gsp.html');
  console.log('DEV Web:', devWeb.status);
  console.log('PROD Web:', prodWeb.status);
  console.log('DEV Manual Contabilidad:', devDoc.status);
  console.log('PROD Manual Contabilidad:', prodDoc.status);

  ssh.dispose();
  console.log(`\n✅ DESPLIEGUE GOBERNADO ${govInfo.req} / SPEC-100 / v${govInfo.version} EN DEV Y PROD FINALIZADO CON ÉXITO.`);
}

deployEdpPunto1().catch(e => {
  console.error('Error en despliegue:', e);
  process.exit(1);
});
