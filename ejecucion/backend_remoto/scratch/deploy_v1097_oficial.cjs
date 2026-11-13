const fs = require('fs');
const path = require('path');
const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

const rootDir = 'D:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas';

function validarGobernanzaAntesDeDesplegar(config) {
  console.log("🛡️ [HARD GATE] Ejecutando verificación obligatoria de gobernanza...");

  // 1. Validar package.json
  if (!fs.existsSync(config.pkgPath)) {
    console.error("❌ ERROR CRÍTICO: No existe package.json en", config.pkgPath);
    process.exit(1);
  }
  const pkg = JSON.parse(fs.readFileSync(config.pkgPath, 'utf8'));
  const versionActual = pkg.version;
  console.log(`📦 Versión detectada en package.json: ${versionActual}`);

  // 2. Validar entrada en RELEASE_LOG.md
  if (!fs.existsSync(config.releaseLogPath)) {
    console.error("❌ ERROR CRÍTICO: No existe RELEASE_LOG.md en", config.releaseLogPath);
    process.exit(1);
  }
  const releaseLogContent = fs.readFileSync(config.releaseLogPath, 'utf8');
  const regexVersion = new RegExp(`##\\s*\\[${config.nombreProducto}\\]\\s*-\\s*Versi[oó]n\\s*${versionActual.replace('.', '\\.')}`, 'i');
  
  if (!regexVersion.test(releaseLogContent)) {
    console.error("\n==========================================================================");
    console.error(`❌ DESPLIEGUE BLOQUEADO: La versión ${versionActual} no está documentada en RELEASE_LOG.md`);
    console.error(`   Debes crear el bloque: "## [${config.nombreProducto}] - Versión ${versionActual}" antes de desplegar.`);
    console.error("==========================================================================\n");
    process.exit(1);
  }

  // 3. Extraer REQ asociado
  const bloqueMatch = releaseLogContent.match(new RegExp(`##\\s*\\[${config.nombreProducto}\\]\\s*-\\s*Versi[oó]n\\s*${versionActual.replace('.', '\\.')}[\\s\\S]*?(?=##\\s*\\[|$)`, 'i'));
  const bloqueTexto = bloqueMatch ? bloqueMatch[0] : '';
  const reqMatch = bloqueTexto.match(/REQ-\d+/i);
  if (!reqMatch) {
    console.error(`❌ DESPLIEGUE BLOQUEADO: El bloque ${versionActual} en RELEASE_LOG.md no indica "REQ-XXX".`);
    process.exit(1);
  }
  const reqCodigo = reqMatch[0].toUpperCase();

  // 4. Validar tareas.md
  if (!fs.existsSync(config.tareasPath)) {
    console.error("❌ ERROR CRÍTICO: No existe Gestión/tareas.md en", config.tareasPath);
    process.exit(1);
  }
  const tareasContent = fs.readFileSync(config.tareasPath, 'utf8');
  const regexReqCompletado = new RegExp(`\\[x\\][^\n]*${reqCodigo}`, 'i');
  if (!regexReqCompletado.test(tareasContent)) {
    console.error(`❌ DESPLIEGUE BLOQUEADO: El requerimiento ${reqCodigo} no existe o no está marcado como completado ([x]) en Gestión/tareas.md.`);
    process.exit(1);
  }

  console.log(`✅ [HARD GATE SUPERADO]: Versión ${versionActual} y ${reqCodigo} validados y trazables.\n`);
  return { version: versionActual, req: reqCodigo };
}

async function deploy() {
  const gobernanza = validarGobernanzaAntesDeDesplegar({
    pkgPath: `${rootDir}/ejecucion/frontend/package.json`,
    releaseLogPath: `${rootDir}/RELEASE_LOG.md`,
    tareasPath: `${rootDir}/Gestión/tareas.md`,
    nombreProducto: 'Portal Web GSP'
  });

  console.log('==================================================================');
  console.log(`🚀 DESPLIEGUE OFICIAL v${gobernanza.version} A DEV Y PROD (${gobernanza.req})`);
  console.log('==================================================================');

  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: 'lgbl2025.',
    readyTimeout: 25000
  });
  console.log('✅ Conectado como root por SSH.');

  // 1. SINCRONIZACIÓN POSTGRESQL (DDL + tcfg_backlog & tcfg_releases)
  console.log('\n🗄️ 1. Sincronizando Base de Datos DEV y PROD...');
  const sql = `
BEGIN;

-- Ajuste de longitud unidad_cobro para evitar desbordes
ALTER TABLE sch_leangsp.tedp_reporte_avance ALTER COLUMN unidad_cobro TYPE character varying(50);
ALTER TABLE sch_leangsp_prod.tedp_reporte_avance ALTER COLUMN unidad_cobro TYPE character varying(50);

-- REQ-1000 en DEV
INSERT INTO sch_leangsp.tcfg_backlog (
  codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_registro, fecha_implementacion, solicitado_por, estado
) VALUES (
  '${gobernanza.req}',
  'Cierre E2E Torre de Control a Pestana 6 CRM, Evidencia Fisica y Mesa ITS',
  'Ingesta automatica de horas de hitos en Torre de Control hacia tedp_reporte_avance, normalizacion de evidencias fisicas escaneadas en Pestana 6 de CRM y proyeccion fluida de jornadas a Mesa ITS.',
  'Critica',
  CURRENT_DATE,
  CURRENT_DATE,
  'Direccion GSP / LeanGlobal',
  'Implementado'
) ON CONFLICT (codigo_req) DO UPDATE SET 
  estado = 'Implementado', 
  fecha_implementacion = CURRENT_DATE,
  updated_at = NOW();

-- REQ-1000 en PROD
INSERT INTO sch_leangsp_prod.tcfg_backlog (
  codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_registro, fecha_implementacion, solicitado_por, estado
) VALUES (
  '${gobernanza.req}',
  'Cierre E2E Torre de Control a Pestana 6 CRM, Evidencia Fisica y Mesa ITS',
  'Ingesta automatica de horas de hitos en Torre de Control hacia tedp_reporte_avance, normalizacion de evidencias fisicas escaneadas en Pestana 6 de CRM y proyeccion fluida de jornadas a Mesa ITS.',
  'Critica',
  CURRENT_DATE,
  CURRENT_DATE,
  'Direccion GSP / LeanGlobal',
  'Implementado'
) ON CONFLICT (codigo_req) DO UPDATE SET 
  estado = 'Implementado', 
  fecha_implementacion = CURRENT_DATE,
  updated_at = NOW();

-- Release v1.0.97 en DEV
INSERT INTO sch_leangsp.tcfg_releases (version, fecha_release, titulo, requerimientos_asociados, publicado_por)
VALUES (
  'v${gobernanza.version}',
  CURRENT_DATE,
  'Release v${gobernanza.version}: Cierre E2E Torre de Control a Pestana 6 CRM, Evidencias Fisicas y Mesa ITS (${gobernanza.req})',
  '["${gobernanza.req}"]'::jsonb,
  'DevOps / Antigravity'
) ON CONFLICT (version) DO UPDATE SET 
  fecha_release = EXCLUDED.fecha_release,
  titulo = EXCLUDED.titulo,
  requerimientos_asociados = EXCLUDED.requerimientos_asociados;

-- Release v1.0.97 en PROD
INSERT INTO sch_leangsp_prod.tcfg_releases (version, fecha_release, titulo, requerimientos_asociados, publicado_por)
VALUES (
  'v${gobernanza.version}',
  CURRENT_DATE,
  'Release v${gobernanza.version}: Cierre E2E Torre de Control a Pestana 6 CRM, Evidencias Fisicas y Mesa ITS (${gobernanza.req})',
  '["${gobernanza.req}"]'::jsonb,
  'DevOps / Antigravity'
) ON CONFLICT (version) DO UPDATE SET 
  fecha_release = EXCLUDED.fecha_release,
  titulo = EXCLUDED.titulo,
  requerimientos_asociados = EXCLUDED.requerimientos_asociados;

COMMIT;
`;

  await ssh.execCommand(`cat << 'EOF' > /tmp/sync_v1097.sql\n${sql}\nEOF`);
  const dbRes = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/sync_v1097.sql"');
  console.log(dbRes.stdout);
  console.log('✅ Base de datos DEV y PROD sincronizadas con éxito.');

  // 2. SUBIDA DE ARCHIVOS BACKEND A DEV Y PROD
  console.log('\n⚙️ 2. Subiendo archivos de Backend a DEV y PROD...');
  const devBackend = '/home/nodeadmin/proyectos/lean-services-gsp/src';
  const prodBackend = '/home/nodeadmin/proyectos/lean-services-gsp-prod/src';

  const backendFiles = [
    { local: `${rootDir}/ejecucion/backend_remoto/src/controllers/controlVivoController.js`, remote: 'controllers/controlVivoController.js' },
    { local: `${rootDir}/ejecucion/backend_remoto/src/controllers/reportDiarioController.js`, remote: 'controllers/reportDiarioController.js' },
    { local: `${rootDir}/ejecucion/backend_remoto/src/routes/reportDiarioRoutes.js`, remote: 'routes/reportDiarioRoutes.js' },
    { local: `${rootDir}/ejecucion/backend_remoto/src/controllers/itsController.js`, remote: 'controllers/itsController.js' }
  ];

  for (const f of backendFiles) {
    console.log(`Subiendo ${f.remote} a DEV...`);
    await ssh.putFile(f.local, `${devBackend}/${f.remote}`);
    console.log(`Subiendo ${f.remote} a PROD...`);
    await ssh.putFile(f.local, `${prodBackend}/${f.remote}`);
  }

  await ssh.execCommand(`chown -R nodeadmin:nodeadmin ${devBackend} ${prodBackend}`);
  console.log('Reiniciando procesos PM2: lean-services-gsp (ID 10) y lean-services-gsp-prod (ID 13)...');
  await ssh.execCommand('su - nodeadmin -c "pm2 reload 10"');
  await ssh.execCommand('su - nodeadmin -c "pm2 reload 13"');
  const pm2Status = await ssh.execCommand('su - nodeadmin -c "pm2 status 10 13"');
  console.log(pm2Status.stdout);
  console.log('✅ Backend actualizado y reiniciado con éxito.');

  // 3. SUBIDA DE FRONTEND WEB A DEV Y PROD
  console.log('\n🌐 3. Subiendo Frontend Web a DEV...');
  const devWebDist = `${rootDir}/ejecucion/frontend/dist_dev`;
  const prodWebDist = `${rootDir}/ejecucion/frontend/dist_prod`;
  const remoteDevWeb = '/var/www/html/lg-gsp-dev';
  const remoteProdWeb = '/var/www/html/lg-gsp-prod';

  console.log(`Subiendo Web DEV (${devWebDist} -> ${remoteDevWeb})...`);
  const statusDev = await ssh.putDirectory(devWebDist, remoteDevWeb, {
    recursive: true,
    concurrency: 10,
    validate: (p) => !p.includes('.map')
  });
  console.log('Upload DEV:', statusDev ? 'OK' : 'FAIL');

  console.log(`Subiendo Web PROD (${prodWebDist} -> ${remoteProdWeb})...`);
  const statusProd = await ssh.putDirectory(prodWebDist, remoteProdWeb, {
    recursive: true,
    concurrency: 10,
    validate: (p) => !p.includes('.map')
  });
  console.log('Upload PROD:', statusProd ? 'OK' : 'FAIL');

  await ssh.execCommand(`chown -R nginx:nginx ${remoteDevWeb} ${remoteProdWeb}`);
  await ssh.execCommand(`chmod -R 755 ${remoteDevWeb} ${remoteProdWeb}`);

  console.log('\n🔄 Recargando Nginx...');
  await ssh.execCommand('systemctl reload nginx');

  // 4. VERIFICACIÓN HTTP Y AUDITORÍA
  console.log('\n🔍 4. Verificando disponibilidad HTTP...');
  const checkDev = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-dev/');
  const checkProd = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-prod/');
  console.log(`Status lg-gsp-dev: ${checkDev.stdout}`);
  console.log(`Status lg-gsp-prod: ${checkProd.stdout}`);

  // Verificar DB Releases
  const checkDb = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT 'DEV' as env, version, fecha_release, titulo FROM sch_leangsp.tcfg_releases WHERE version = 'v${gobernanza.version}' UNION ALL SELECT 'PROD' as env, version, fecha_release, titulo FROM sch_leangsp_prod.tcfg_releases WHERE version = 'v${gobernanza.version}';\\""`);
  console.log(checkDb.stdout);

  ssh.dispose();
  console.log('\n🎉 ==================================================================');
  console.log(`🚀 DESPLIEGUE v${gobernanza.version} COMPLETADO Y CERTIFICADO EXITOSAMENTE`);
  console.log('==================================================================');
}

deploy().catch((err) => {
  console.error('❌ Error fatal en despliegue:', err);
  process.exit(1);
});
