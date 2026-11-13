const { NodeSSH } = require('../node_modules/node-ssh');
const path = require('path');
const fs = require('fs');

const ssh = new NodeSSH();

async function deployVersion107() {
  console.log('==================================================================');
  console.log('🚀 INICIANDO DESPLIEGUE OFICIAL v1.0.107 - REQ-1009');
  console.log('   Hotfix Enlace PDF Cotizador Express y Formato WhatsApp');
  console.log('==================================================================');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295,
    readyTimeout: 20000
  });
  console.log('✅ SSH Conectado.');

  // 1. SINCRONIZAR BACKEND EN DEV Y PROD
  console.log('\n--- 1. SINCRONIZANDO CONTROLADOR COTIZACIÓN EXPRESS ---');
  const controllerLocal = path.resolve(__dirname, '../src/controllers/cotizacionExpressController.js');

  // DEV
  console.log('⬆️ Subiendo a DEV backend...');
  await ssh.putFile(controllerLocal, '/home/nodeadmin/proyectos/lean-services-gsp/src/controllers/cotizacionExpressController.js');
  await ssh.execCommand('chown -R nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp/src');
  const pm2Dev = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
  console.log('✔ PM2 DEV (10) reiniciado:\n', pm2Dev.stdout);

  // PROD
  console.log('⬆️ Subiendo a PROD backend...');
  await ssh.putFile(controllerLocal, '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/cotizacionExpressController.js');
  await ssh.execCommand('chown -R nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp-prod/src');
  const pm2Prod = await ssh.execCommand('su - nodeadmin -c "pm2 restart 13"');
  console.log('✔ PM2 PROD (13) reiniciado:\n', pm2Prod.stdout);

  // 2. SINCRONIZAR BASE DE DATOS (BACKLOG Y RELEASES v1.0.107)
  console.log('\n--- 2. SINCRONIZANDO GOBERNANZA BD (tcfg_backlog y tcfg_releases) ---');
  const sql = `
BEGIN;

-- DEV Backlog
INSERT INTO sch_leangsp.tcfg_backlog (
  codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
) VALUES (
  'REQ-1009', 
  'Hotfix Enlace PDF Cotizador Express y Formato de Mensajería WhatsApp', 
  'Inyección dinámica de prefijo de proxy Nginx (envPrefix /lg-gsp-prod o /lg-gsp-dev) en cotizacionExpressController.js para evitar error 404 en descarga de PDF desde WhatsApp, y homologación de obra_nombre y obra_comuna.', 
  'Critica', 'Implementado', 'Dirección GSP / Sergio Gajardo', 'Sistema', CURRENT_DATE, CURRENT_DATE, NOW()
) ON CONFLICT (codigo_req) DO UPDATE SET
  nombre_requerimiento = EXCLUDED.nombre_requerimiento,
  descripcion = EXCLUDED.descripcion,
  prioridad = EXCLUDED.prioridad,
  estado = 'Implementado',
  fecha_implementacion = CURRENT_DATE,
  updated_at = NOW();

-- PROD Backlog
INSERT INTO sch_leangsp_prod.tcfg_backlog (
  codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
) VALUES (
  'REQ-1009', 
  'Hotfix Enlace PDF Cotizador Express y Formato de Mensajería WhatsApp', 
  'Inyección dinámica de prefijo de proxy Nginx (envPrefix /lg-gsp-prod o /lg-gsp-dev) en cotizacionExpressController.js para evitar error 404 en descarga de PDF desde WhatsApp, y homologación de obra_nombre y obra_comuna.', 
  'Critica', 'Implementado', 'Dirección GSP / Sergio Gajardo', 'Sistema', CURRENT_DATE, CURRENT_DATE, NOW()
) ON CONFLICT (codigo_req) DO UPDATE SET
  nombre_requerimiento = EXCLUDED.nombre_requerimiento,
  descripcion = EXCLUDED.descripcion,
  prioridad = EXCLUDED.prioridad,
  estado = 'Implementado',
  fecha_implementacion = CURRENT_DATE,
  updated_at = NOW();

-- DEV Release
INSERT INTO sch_leangsp.tcfg_releases (version, fecha_release, titulo, requerimientos_asociados)
VALUES (
  'v1.0.107', CURRENT_DATE,
  'Portal Web & PWA GSP v1.0.107: Hotfix Enlace PDF Cotizador Express (envPrefix Nginx) y Formato Mensajería WhatsApp',
  '["REQ-1009"]'::jsonb
) ON CONFLICT (version) DO UPDATE SET 
  fecha_release = EXCLUDED.fecha_release,
  titulo = EXCLUDED.titulo,
  requerimientos_asociados = EXCLUDED.requerimientos_asociados;

-- PROD Release
INSERT INTO sch_leangsp_prod.tcfg_releases (version, fecha_release, titulo, requerimientos_asociados)
VALUES (
  'v1.0.107', CURRENT_DATE,
  'Portal Web & PWA GSP v1.0.107: Hotfix Enlace PDF Cotizador Express (envPrefix Nginx) y Formato Mensajería WhatsApp',
  '["REQ-1009"]'::jsonb
) ON CONFLICT (version) DO UPDATE SET 
  fecha_release = EXCLUDED.fecha_release,
  titulo = EXCLUDED.titulo,
  requerimientos_asociados = EXCLUDED.requerimientos_asociados;

COMMIT;
`;

  await ssh.execCommand(`cat << 'EOF' > /tmp/sync_v10107.sql\n${sql}\nEOF`);
  const resSql = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/sync_v10107.sql"');
  console.log('✔ Resultado SQL Gobernanza:\n', resSql.stdout);

  ssh.dispose();
  console.log('\n==================================================================');
  console.log('🎉 DESPLIEGUE v1.0.107 COMPLETADO EXITOSAMENTE');
  console.log('==================================================================');
}

deployVersion107().catch(err => {
  console.error('❌ Error fatal en despliegue:', err);
  process.exit(1);
});
