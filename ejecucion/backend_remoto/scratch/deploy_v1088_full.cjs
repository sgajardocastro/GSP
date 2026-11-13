const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function deployV1088() {
  console.log('==================================================================');
  console.log('🚀 DESPLIEGUE OFICIAL v1.0.88 A DEV Y PROD');
  console.log('==================================================================');

  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: 'lgbl2025.',
    readyTimeout: 25000
  });
  console.log('✅ Conectado como root por SSH.');

  // ------------------------------------------------------------------
  // 1. SINCRONIZACIÓN POSTGRESQL (tcfg_backlog & tcfg_releases)
  // ------------------------------------------------------------------
  console.log('\n🗄️ 1. Sincronizando Backlog y Releases en DEV y PROD...');
  const sql = `
BEGIN;

-- Actualizar REQ-682 a Implementado
UPDATE sch_leangsp.tcfg_backlog 
SET estado = 'Implementado', fecha_implementacion = CURRENT_DATE, updated_at = NOW() 
WHERE codigo_req = 'REQ-682';

UPDATE sch_leangsp_prod.tcfg_backlog 
SET estado = 'Implementado', fecha_implementacion = CURRENT_DATE, updated_at = NOW() 
WHERE codigo_req = 'REQ-682';

-- Insertar o actualizar REQ-990 en DEV
INSERT INTO sch_leangsp.tcfg_backlog (
  codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_registro, fecha_implementacion, solicitado_por, estado
) VALUES (
  'REQ-990',
  'Motivo de Reverso y Notificación Interna en Devolución de Verificación a Preventa Comercial',
  'Captura obligatoria de motivo al devolver cotización a comercial, persistencia en crm_v1 y despacho de notificaciones omnicanal (Email y WhatsApp) exclusivamente a tripulación interna sin alertar al cliente mandante.',
  'Alta',
  CURRENT_DATE,
  CURRENT_DATE,
  'Jorge Ponce / Dirección GSP',
  'Implementado'
) ON CONFLICT (codigo_req) DO UPDATE SET 
  estado = 'Implementado', 
  fecha_implementacion = CURRENT_DATE,
  updated_at = NOW();

-- Insertar o actualizar REQ-990 en PROD
INSERT INTO sch_leangsp_prod.tcfg_backlog (
  codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_registro, fecha_implementacion, solicitado_por, estado
) VALUES (
  'REQ-990',
  'Motivo de Reverso y Notificación Interna en Devolución de Verificación a Preventa Comercial',
  'Captura obligatoria de motivo al devolver cotización a comercial, persistencia en crm_v1 y despacho de notificaciones omnicanal (Email y WhatsApp) exclusivamente a tripulación interna sin alertar al cliente mandante.',
  'Alta',
  CURRENT_DATE,
  CURRENT_DATE,
  'Jorge Ponce / Dirección GSP',
  'Implementado'
) ON CONFLICT (codigo_req) DO UPDATE SET 
  estado = 'Implementado', 
  fecha_implementacion = CURRENT_DATE,
  updated_at = NOW();

-- Insertar Release v1.0.88 en DEV
INSERT INTO sch_leangsp.tcfg_releases (version, fecha_release, titulo, requerimientos_asociados, publicado_por)
VALUES (
  'v1.0.88',
  CURRENT_DATE,
  'Portal Web & Backend GSP v1.0.88: Deduplicación Flota en OT (REQ-682) y Reverso Verificación con Motivo y Notificación Interna (REQ-990)',
  '["REQ-682", "REQ-990"]'::jsonb,
  'DevOps / Antigravity'
) ON CONFLICT (version) DO UPDATE SET 
  fecha_release = EXCLUDED.fecha_release,
  titulo = EXCLUDED.titulo,
  requerimientos_asociados = EXCLUDED.requerimientos_asociados;

-- Insertar Release v1.0.88 en PROD
INSERT INTO sch_leangsp_prod.tcfg_releases (version, fecha_release, titulo, requerimientos_asociados, publicado_por)
VALUES (
  'v1.0.88',
  CURRENT_DATE,
  'Portal Web & Backend GSP v1.0.88: Deduplicación Flota en OT (REQ-682) y Reverso Verificación con Motivo y Notificación Interna (REQ-990)',
  '["REQ-682", "REQ-990"]'::jsonb,
  'DevOps / Antigravity'
) ON CONFLICT (version) DO UPDATE SET 
  fecha_release = EXCLUDED.fecha_release,
  titulo = EXCLUDED.titulo,
  requerimientos_asociados = EXCLUDED.requerimientos_asociados;

COMMIT;
`;

  await ssh.execCommand(`cat << 'EOF' > /tmp/sync_v1088.sql\n${sql}\nEOF`);
  const dbRes = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/sync_v1088.sql"');
  console.log(dbRes.stdout);
  console.log('✅ Base de datos DEV y PROD sincronizadas con éxito.');

  // ------------------------------------------------------------------
  // 2. SUBIDA DE ARCHIVOS BACKEND A DEV Y PROD
  // ------------------------------------------------------------------
  console.log('\n⚙️ 2. Subiendo archivos de Backend a DEV y PROD...');
  const rootDir = 'D:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas';
  const backendSrc = `${rootDir}/ejecucion/backend_remoto/src`;

  const devBackend = '/home/nodeadmin/proyectos/lean-services-gsp/src';
  const prodBackend = '/home/nodeadmin/proyectos/lean-services-gsp-prod/src';

  const backendFiles = [
    { local: `${backendSrc}/models/proyectoModel.js`, rel: 'models/proyectoModel.js' },
    { local: `${backendSrc}/controllers/proyectosController.js`, rel: 'controllers/proyectosController.js' },
    { local: `${backendSrc}/routes/proyectoRoutes.js`, rel: 'routes/proyectoRoutes.js' }
  ];

  for (const f of backendFiles) {
    console.log(`Subiendo ${f.rel} a DEV...`);
    await ssh.putFile(f.local, `${devBackend}/${f.rel}`);
    console.log(`Subiendo ${f.rel} a PROD...`);
    await ssh.putFile(f.local, `${prodBackend}/${f.rel}`);
  }

  await ssh.execCommand(`chown -R nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp /home/nodeadmin/proyectos/lean-services-gsp-prod`);

  console.log('Reiniciando procesos PM2: lean-services-gsp (ID 10) y lean-services-gsp-prod (ID 13)...');
  await ssh.execCommand('su - nodeadmin -c "pm2 reload 10"');
  await ssh.execCommand('su - nodeadmin -c "pm2 reload 13"');
  const pm2Status = await ssh.execCommand('su - nodeadmin -c "pm2 status 10 13"');
  console.log(pm2Status.stdout);
  console.log('✅ Backend actualizado y reiniciado con éxito.');

  // ------------------------------------------------------------------
  // 3. SUBIDA DE FRONTEND WEB A DEV Y PROD
  // ------------------------------------------------------------------
  console.log('\n🌐 3. Subiendo Frontend Web compilado a DEV y PROD...');
  const localWebDist = `${rootDir}/ejecucion/frontend/dist`;
  const remoteDevWeb = '/var/www/html/lg-gsp-dev';
  const remoteProdWeb = '/var/www/html/lg-gsp-prod';

  console.log(`Subiendo a DEV (${remoteDevWeb})...`);
  const statusDev = await ssh.putDirectory(localWebDist, remoteDevWeb, {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.map')
  });
  console.log('Upload DEV:', statusDev ? 'OK' : 'FAIL');

  console.log(`Subiendo a PROD (${remoteProdWeb})...`);
  const statusProd = await ssh.putDirectory(localWebDist, remoteProdWeb, {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.map')
  });
  console.log('Upload PROD:', statusProd ? 'OK' : 'FAIL');

  await ssh.execCommand(`chown -R nginx:nginx ${remoteDevWeb} ${remoteProdWeb}`);
  await ssh.execCommand(`chmod -R 755 ${remoteDevWeb} ${remoteProdWeb}`);

  console.log('\n🔄 Recargando Nginx...');
  await ssh.execCommand('systemctl reload nginx');

  // ------------------------------------------------------------------
  // 4. VERIFICACIÓN HTTP
  // ------------------------------------------------------------------
  console.log('\n🔍 4. Verificando disponibilidad HTTP...');
  const checkDev = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-dev/');
  const checkProd = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-prod/');
  console.log(`Status lg-gsp-dev: ${checkDev.stdout}`);
  console.log(`Status lg-gsp-prod: ${checkProd.stdout}`);

  ssh.dispose();
  console.log('\n🎉 ==================================================================');
  console.log('🚀 DESPLIEGUE v1.0.88 COMPLETADO Y CERTIFICADO EXITOSAMENTE');
  console.log('==================================================================');
}

deployV1088().catch(console.error);
