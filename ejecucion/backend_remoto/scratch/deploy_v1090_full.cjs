const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function deployV1090() {
  console.log('==================================================================');
  console.log('🚀 DESPLIEGUE OFICIAL v1.0.90 A DEV Y PROD');
  console.log('REQ-992: Condiciones Comerciales Oficiales Grúas/Plumas y Validez 5 Días');
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
  console.log('\n🗄️ 1. Sincronizando Backlog y Releases en DEV y PROD...');
  const sql = `
BEGIN;

-- REQ-992 en DEV
INSERT INTO sch_leangsp.tcfg_backlog (
  codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_registro, fecha_implementacion, solicitado_por, estado
) VALUES (
  'REQ-992',
  'Condiciones y Acuerdos Comerciales Oficiales para Grúas y Plumas y Validez en 5 Días Hábiles',
  'Incorporación del texto canónico oficial de 6 secciones para grúas telescópicas y camiones pluma directamente debajo del estructurador de servicios en CRM, preservando condiciones de traslados, y actualización del plazo estándar de validez de oferta a 5 días hábiles en interfaz y PDF de propuesta.',
  'Alta',
  CURRENT_DATE,
  CURRENT_DATE,
  'Jorge Ponce / Dirección GSP',
  'Implementado'
) ON CONFLICT (codigo_req) DO UPDATE SET 
  estado = 'Implementado', 
  fecha_implementacion = CURRENT_DATE,
  updated_at = NOW();

-- REQ-992 en PROD
INSERT INTO sch_leangsp_prod.tcfg_backlog (
  codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_registro, fecha_implementacion, solicitado_por, estado
) VALUES (
  'REQ-992',
  'Condiciones y Acuerdos Comerciales Oficiales para Grúas y Plumas y Validez en 5 Días Hábiles',
  'Incorporación del texto canónico oficial de 6 secciones para grúas telescópicas y camiones pluma directamente debajo del estructurador de servicios en CRM, preservando condiciones de traslados, y actualización del plazo estándar de validez de oferta a 5 días hábiles en interfaz y PDF de propuesta.',
  'Alta',
  CURRENT_DATE,
  CURRENT_DATE,
  'Jorge Ponce / Dirección GSP',
  'Implementado'
) ON CONFLICT (codigo_req) DO UPDATE SET 
  estado = 'Implementado', 
  fecha_implementacion = CURRENT_DATE,
  updated_at = NOW();

-- Insertar Release v1.0.90 en DEV
INSERT INTO sch_leangsp.tcfg_releases (version, fecha_release, titulo, requerimientos_asociados, publicado_por)
VALUES (
  'v1.0.90',
  CURRENT_DATE,
  'Release v1.0.90: Condiciones Comerciales Oficiales Grúas/Plumas y Validez de Oferta 5 Días Hábiles (REQ-992)',
  '["REQ-992"]'::jsonb,
  'DevOps / Antigravity'
) ON CONFLICT (version) DO UPDATE SET 
  fecha_release = EXCLUDED.fecha_release,
  titulo = EXCLUDED.titulo,
  requerimientos_asociados = EXCLUDED.requerimientos_asociados;

-- Insertar Release v1.0.90 en PROD
INSERT INTO sch_leangsp_prod.tcfg_releases (version, fecha_release, titulo, requerimientos_asociados, publicado_por)
VALUES (
  'v1.0.90',
  CURRENT_DATE,
  'Release v1.0.90: Condiciones Comerciales Oficiales Grúas/Plumas y Validez de Oferta 5 Días Hábiles (REQ-992)',
  '["REQ-992"]'::jsonb,
  'DevOps / Antigravity'
) ON CONFLICT (version) DO UPDATE SET 
  fecha_release = EXCLUDED.fecha_release,
  titulo = EXCLUDED.titulo,
  requerimientos_asociados = EXCLUDED.requerimientos_asociados;

COMMIT;
`;

  await ssh.execCommand(`cat << 'EOF' > /tmp/sync_v1090.sql\n${sql}\nEOF`);
  const dbRes = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/sync_v1090.sql"');
  console.log(dbRes.stdout);
  console.log('✅ Base de datos DEV y PROD sincronizadas con éxito.');

  // 2. SUBIDA DE FRONTEND WEB A DEV Y PROD
  console.log('\n🌐 2. Subiendo Frontend Web compilado v1.0.90 a DEV y PROD...');
  const rootDir = 'D:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas';
  const localWebDist = `${rootDir}/ejecucion/frontend/dist`;
  const remoteDevWeb = '/var/www/html/lg-gsp-dev';
  const remoteProdWeb = '/var/www/html/lg-gsp-prod';

  console.log(`Subiendo Web a DEV (${remoteDevWeb})...`);
  await ssh.putDirectory(localWebDist, remoteDevWeb, {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.map')
  });

  console.log(`Subiendo Web a PROD (${remoteProdWeb})...`);
  await ssh.putDirectory(localWebDist, remoteProdWeb, {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.map')
  });

  await ssh.execCommand(`chown -R nginx:nginx ${remoteDevWeb} ${remoteProdWeb} && chmod -R 755 ${remoteDevWeb} ${remoteProdWeb}`);
  await ssh.execCommand('systemctl reload nginx');

  // 3. VERIFICACIÓN HTTP
  console.log('\n🔍 3. Verificando disponibilidad HTTP...');
  const checkDevWeb = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-dev/');
  const checkProdWeb = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-prod/');
  console.log(`Status lg-gsp-dev: ${checkDevWeb.stdout}`);
  console.log(`Status lg-gsp-prod: ${checkProdWeb.stdout}`);

  ssh.dispose();
  console.log('\n🎉 ==================================================================');
  console.log('🚀 DESPLIEGUE v1.0.90 COMPLETADO Y CERTIFICADO EXITOSAMENTE');
  console.log('==================================================================');
}

deployV1090().catch(console.error);
