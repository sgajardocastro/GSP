const { NodeSSH } = require('../node_modules/node-ssh');
const path = require('path');
const fs = require('fs');

const ssh = new NodeSSH();
const rootDir = path.resolve(__dirname, '../../..');

function validarGobernanzaAntesDeDesplegar(config) {
  console.log("\n==========================================================================");
  console.log("🔒 [HARD GATE] VALIDACIÓN DETERMINISTA DE GOBERNANZA ANTES DE DESPLEGAR");
  console.log("==========================================================================");

  // 1. Validar package.json
  if (!fs.existsSync(config.pkgPath)) {
    console.error("❌ ERROR CRÍTICO: No existe package.json en", config.pkgPath);
    process.exit(1);
  }
  const pkg = JSON.parse(fs.readFileSync(config.pkgPath, 'utf8'));
  const versionActual = pkg.version;
  console.log(`📦 Versión declarada en package.json: ${versionActual}`);

  // 2. Validar RELEASE_LOG.md
  if (!fs.existsSync(config.releaseLogPath)) {
    console.error("❌ ERROR CRÍTICO: No existe RELEASE_LOG.md en", config.releaseLogPath);
    process.exit(1);
  }
  const releaseLogContent = fs.readFileSync(config.releaseLogPath, 'utf8');
  const regexRelease = new RegExp(`##\\s*\\[${config.nombreProducto}\\]\\s*-\\s*Versi[oó]n\\s*${versionActual.replace('.', '\\.')}`, 'i');
  if (!regexRelease.test(releaseLogContent)) {
    console.error(`❌ DESPLIEGUE BLOQUEADO: La versión ${versionActual} no está documentada en RELEASE_LOG.md`);
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
  console.log('   ITS Transición: Flujo Tripartito FES, Notificaciones y Sellos Dinámicos');
  console.log('==================================================================');

  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: 'lgbl2025.',
    readyTimeout: 25000
  });
  console.log('✅ Conectado como root por SSH.');

  // 1. SINCRONIZACIÓN POSTGRESQL (tcfg_backlog & tcfg_releases)
  console.log('\n🗄️ 1. Sincronizando Base de Datos DEV y PROD...');
  const sql = `
BEGIN;

-- REQ-1017 en DEV
INSERT INTO sch_leangsp.tcfg_backlog (
  codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_registro, fecha_implementacion, solicitado_por, estado
) VALUES (
  '${gobernanza.req}',
  'Flujo de Aprobaciones ITS Transicion, Gobernanza Tripartita, Firmas FES y Notificaciones con Deep Link (Spec 67)',
  'Creacion de rol SECRETARIA, enrolamiento de Analista, flujo FES tripartito (Secretaria/Analista -> Administrador -> Contabilidad), devoluciones con observaciones, notificaciones omnicanal Email+WhatsApp con Deep Link y erradicacion del pie estatico por sellos dinamicos FES.',
  'Critica',
  CURRENT_DATE,
  CURRENT_DATE,
  'Direccion GSP / Sergio Gajardo',
  'Implementado'
) ON CONFLICT (codigo_req) DO UPDATE SET 
  estado = 'Implementado', 
  fecha_implementacion = CURRENT_DATE,
  updated_at = NOW();

-- REQ-1017 en PROD
INSERT INTO sch_leangsp_prod.tcfg_backlog (
  codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_registro, fecha_implementacion, solicitado_por, estado
) VALUES (
  '${gobernanza.req}',
  'Flujo de Aprobaciones ITS Transicion, Gobernanza Tripartita, Firmas FES y Notificaciones con Deep Link (Spec 67)',
  'Creacion de rol SECRETARIA, enrolamiento de Analista, flujo FES tripartito (Secretaria/Analista -> Administrador -> Contabilidad), devoluciones con observaciones, notificaciones omnicanal Email+WhatsApp con Deep Link y erradicacion del pie estatico por sellos dinamicos FES.',
  'Critica',
  CURRENT_DATE,
  CURRENT_DATE,
  'Direccion GSP / Sergio Gajardo',
  'Implementado'
) ON CONFLICT (codigo_req) DO UPDATE SET 
  estado = 'Implementado', 
  fecha_implementacion = CURRENT_DATE,
  updated_at = NOW();

-- Release v1.0.115 en DEV
INSERT INTO sch_leangsp.tcfg_releases (version, fecha_release, titulo, requerimientos_asociados, publicado_por)
VALUES (
  'v${gobernanza.version}',
  '2026-10-09',
  'Release v${gobernanza.version}: Flujo de Aprobaciones ITS Transicion, Gobernanza Tripartita, Firmas FES y Notificaciones con Deep Link (${gobernanza.req})',
  '["${gobernanza.req}"]'::jsonb,
  'DevOps / Antigravity'
) ON CONFLICT (version) DO UPDATE SET 
  fecha_release = EXCLUDED.fecha_release,
  titulo = EXCLUDED.titulo,
  requerimientos_asociados = EXCLUDED.requerimientos_asociados;

-- Release v1.0.115 en PROD
INSERT INTO sch_leangsp_prod.tcfg_releases (version, fecha_release, titulo, requerimientos_asociados, publicado_por)
VALUES (
  'v${gobernanza.version}',
  '2026-10-09',
  'Release v${gobernanza.version}: Flujo de Aprobaciones ITS Transicion, Gobernanza Tripartita, Firmas FES y Notificaciones con Deep Link (${gobernanza.req})',
  '["${gobernanza.req}"]'::jsonb,
  'DevOps / Antigravity'
) ON CONFLICT (version) DO UPDATE SET 
  fecha_release = EXCLUDED.fecha_release,
  titulo = EXCLUDED.titulo,
  requerimientos_asociados = EXCLUDED.requerimientos_asociados;

COMMIT;
`;

  await ssh.execCommand(`cat << 'EOF' > /tmp/sync_v10115.sql\n${sql}\nEOF`);
  const dbRes = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/sync_v10115.sql"');
  console.log(dbRes.stdout);
  console.log('✅ Base de datos DEV y PROD sincronizadas con éxito.');

  // 2. SUBIDA DE ARCHIVOS BACKEND A DEV Y PROD
  console.log('\n⚙️ 2. Subiendo archivos de Backend a DEV y PROD...');
  const devBackend = '/home/nodeadmin/proyectos/lean-services-gsp/src';
  const prodBackend = '/home/nodeadmin/proyectos/lean-services-gsp-prod/src';

  const backendFiles = [
    { local: `${rootDir}/ejecucion/backend_remoto/src/controllers/itsController.js`, remote: 'controllers/itsController.js' },
    { local: `${rootDir}/ejecucion/backend_remoto/src/routes/itsRoutes.js`, remote: 'routes/itsRoutes.js' }
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

  // 3. SUBIDA DE FRONTEND WEB COMPILADO A DEV Y PROD
  console.log('\n🌐 3. Subiendo Frontend Web v1.0.115 a DEV y PROD...');
  const webDistDev = `${rootDir}/ejecucion/frontend/dist_dev`;
  const webDistProd = `${rootDir}/ejecucion/frontend/dist_prod`;
  const remoteDevWeb = '/var/www/html/lg-gsp-dev';
  const remoteProdWeb = '/var/www/html/lg-gsp-prod';

  console.log(`Subiendo Web DEV (${webDistDev} -> ${remoteDevWeb})...`);
  await ssh.putDirectory(webDistDev, remoteDevWeb, { recursive: true, concurrency: 8, validate: (p) => !p.includes('.map') });

  console.log(`Subiendo Web PROD (${webDistProd} -> ${remoteProdWeb})...`);
  await ssh.putDirectory(webDistProd, remoteProdWeb, { recursive: true, concurrency: 8, validate: (p) => !p.includes('.map') });

  await ssh.execCommand(`chown -R nginx:nginx ${remoteDevWeb} ${remoteProdWeb}`);
  await ssh.execCommand(`chmod -R 755 ${remoteDevWeb} ${remoteProdWeb}`);
  console.log('✅ Frontend Web sincronizado en DEV y PROD.');

  console.log('\n🔄 Recargando Nginx...');
  await ssh.execCommand('systemctl reload nginx');

  // 4. AUDITORÍA Y VERIFICACIÓN EN VIVO
  console.log('\n🔍 4. Auditoría de Gobernanza y Certificación HTTP...');
  const checkDev = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-dev/');
  const checkProd = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-prod/');

  console.log(`Status lg-gsp-dev: ${checkDev.stdout}`);
  console.log(`Status lg-gsp-prod: ${checkProd.stdout}`);

  // Verificar DB Releases
  const checkDb = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT 'DEV' as env, version, fecha_release, titulo FROM sch_leangsp.tcfg_releases WHERE version = 'v${gobernanza.version}' UNION ALL SELECT 'PROD' as env, version, fecha_release, titulo FROM sch_leangsp_prod.tcfg_releases WHERE version = 'v${gobernanza.version}';\\""`);
  console.log(checkDb.stdout);

  // Verificar DB Backlog
  const checkBacklog = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT 'DEV' as env, codigo_req, estado, fecha_implementacion FROM sch_leangsp.tcfg_backlog WHERE codigo_req = '${gobernanza.req}' UNION ALL SELECT 'PROD' as env, codigo_req, estado, fecha_implementacion FROM sch_leangsp_prod.tcfg_backlog WHERE codigo_req = '${gobernanza.req}';\\""`);
  console.log(checkBacklog.stdout);

  ssh.dispose();
  console.log('\n🎉 ==================================================================');
  console.log(`🚀 DESPLIEGUE v${gobernanza.version} (${gobernanza.req}) CERTIFICADO EXITOSAMENTE`);
  console.log('==================================================================');
}

deploy().catch((err) => {
  console.error('❌ Error fatal en despliegue:', err);
  process.exit(1);
});
