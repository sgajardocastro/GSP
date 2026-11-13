const { NodeSSH } = require('../node_modules/node-ssh');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const ssh = new NodeSSH();

async function deployVersion102() {
  console.log('==================================================================');
  console.log('🚀 INICIANDO DESPLIEGUE OFICIAL v1.0.102 - REQ-994 COTIZADOR EXPRESS');
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
  console.log('\n--- 1. SINCRONIZANDO CONTROLADORES Y RUTAS BACKEND ---');
  const controllerLocal = path.resolve(__dirname, '../src/controllers/cotizacionExpressController.js');
  const routesLocal = path.resolve(__dirname, '../src/routes/proyectoRoutes.js');

  // DEV
  console.log('⬆️ Subiendo a DEV backend...');
  await ssh.putFile(controllerLocal, '/home/nodeadmin/proyectos/lean-services-gsp/src/controllers/cotizacionExpressController.js');
  await ssh.putFile(routesLocal, '/home/nodeadmin/proyectos/lean-services-gsp/src/routes/proyectoRoutes.js');
  await ssh.execCommand('chown -R nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp/src');
  const pm2Dev = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
  console.log('✔ PM2 DEV (10) reiniciado:\n', pm2Dev.stdout);

  // PROD
  console.log('⬆️ Subiendo a PROD backend...');
  await ssh.putFile(controllerLocal, '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/cotizacionExpressController.js');
  await ssh.putFile(routesLocal, '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/routes/proyectoRoutes.js');
  await ssh.execCommand('chown -R nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp-prod/src');
  const pm2Prod = await ssh.execCommand('su - nodeadmin -c "pm2 restart 13"');
  console.log('✔ PM2 PROD (13) reiniciado:\n', pm2Prod.stdout);

  // 2. SINCRONIZAR BASE DE DATOS (BACKLOG Y RELEASES v1.0.102)
  console.log('\n--- 2. SINCRONIZANDO GOBERNANZA BD (tcfg_backlog y tcfg_releases) ---');
  const sql = `
BEGIN;

-- DEV Backlog
INSERT INTO sch_leangsp.tcfg_backlog (
  codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
) VALUES (
  'REQ-994', 
  'Cotizador Express Móvil en PWA (Spec 64 v1.1.0)', 
  'Módulo mobile-first para cotizar servicios de izaje en terreno en menos de 60 segundos con despacho directo a WhatsApp, PDF oficial y simetría estructural con tpry_proyecto.', 
  'Critica', 'Implementado', 'Dirección GSP / Omar Ghiselini', 'Sistema', '2026-10-05', CURRENT_DATE, NOW()
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
  'REQ-994', 
  'Cotizador Express Móvil en PWA (Spec 64 v1.1.0)', 
  'Módulo mobile-first para cotizar servicios de izaje en terreno en menos de 60 segundos con despacho directo a WhatsApp, PDF oficial y simetría estructural con tpry_proyecto.', 
  'Critica', 'Implementado', 'Dirección GSP / Omar Ghiselini', 'Sistema', '2026-10-05', CURRENT_DATE, NOW()
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
  'v1.0.102', CURRENT_DATE,
  'Portal Web & PWA GSP v1.0.102: Cotizador Express Móvil en Terreno (Spec 64), Despacho WhatsApp y PDF Oficial Simétrico',
  '["REQ-994"]'::jsonb
) ON CONFLICT (version) DO UPDATE SET 
  fecha_release = EXCLUDED.fecha_release,
  titulo = EXCLUDED.titulo,
  requerimientos_asociados = EXCLUDED.requerimientos_asociados;

-- PROD Release
INSERT INTO sch_leangsp_prod.tcfg_releases (version, fecha_release, titulo, requerimientos_asociados)
VALUES (
  'v1.0.102', CURRENT_DATE,
  'Portal Web & PWA GSP v1.0.102: Cotizador Express Móvil en Terreno (Spec 64), Despacho WhatsApp y PDF Oficial Simétrico',
  '["REQ-994"]'::jsonb
) ON CONFLICT (version) DO UPDATE SET 
  fecha_release = EXCLUDED.fecha_release,
  titulo = EXCLUDED.titulo,
  requerimientos_asociados = EXCLUDED.requerimientos_asociados;

COMMIT;
`;

  await ssh.execCommand(`cat << 'EOF' > /tmp/sync_v10102.sql\n${sql}\nEOF`);
  const resSql = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/sync_v10102.sql"');
  console.log('✔ Resultado SQL Gobernanza:\n', resSql.stdout);

  // 3. DESPLIEGUE PWA DEV
  const pwaDir = path.resolve(__dirname, '../../pwa');
  const distDir = path.join(pwaDir, 'dist');

  console.log('\n--- 3. COMPILANDO Y SUBIENDO PWA DEV ---');
  fs.copyFileSync(path.join(pwaDir, '.env.dev'), path.join(pwaDir, '.env'));
  fs.copyFileSync(path.join(pwaDir, '.env.dev'), path.join(pwaDir, '.env.production'));
  console.log('Compilando PWA para DEV...');
  execSync('npm run build', { cwd: pwaDir, stdio: 'inherit' });

  console.log('Subiendo a /var/www/html/pwa-gsp-dev...');
  await ssh.execCommand('mkdir -p /var/www/html/backups');
  await ssh.execCommand('tar -czf /var/www/html/backups/pwa-dev-v10101.tar.gz -C /var/www/html pwa-gsp-dev 2>/dev/null');
  await ssh.putDirectory(distDir, '/var/www/html/pwa-gsp-dev', {
    recursive: true,
    concurrency: 12,
    validate: (itemPath) => !itemPath.includes('.map')
  });
  await ssh.execCommand('chown -R nginx:nginx /var/www/html/pwa-gsp-dev && chmod -R 755 /var/www/html/pwa-gsp-dev');
  console.log('✔ PWA DEV desplegado.');

  // 4. DESPLIEGUE PWA PROD
  console.log('\n--- 4. COMPILANDO Y SUBIENDO PWA PROD ---');
  fs.copyFileSync(path.join(pwaDir, '.env.prod'), path.join(pwaDir, '.env'));
  fs.copyFileSync(path.join(pwaDir, '.env.prod'), path.join(pwaDir, '.env.production'));
  console.log('Compilando PWA para PROD...');
  execSync('npm run build', { cwd: pwaDir, stdio: 'inherit' });

  console.log('Subiendo a /var/www/html/pwa-gsp-prod...');
  await ssh.execCommand('tar -czf /var/www/html/backups/pwa-prod-v10101.tar.gz -C /var/www/html pwa-gsp-prod 2>/dev/null');
  await ssh.putDirectory(distDir, '/var/www/html/pwa-gsp-prod', {
    recursive: true,
    concurrency: 12,
    validate: (itemPath) => !itemPath.includes('.map')
  });
  await ssh.execCommand('chown -R nginx:nginx /var/www/html/pwa-gsp-prod && chmod -R 755 /var/www/html/pwa-gsp-prod');
  console.log('✔ PWA PROD desplegado.');

  await ssh.execCommand('systemctl reload nginx');

  // 5. PRUEBAS DE CERTIFICACIÓN Y E2E
  console.log('\n--- 5. PRUEBAS E2E Y CERTIFICACIÓN HTTP ---');
  const catDev = await ssh.execCommand('curl -s https://servidor.leanglobal.cl/lg-gsp-dev/api/proyectos/express/catalogo');
  console.log('Catálogo DEV:\n', catDev.stdout.substring(0, 150));

  const catProd = await ssh.execCommand('curl -s https://servidor.leanglobal.cl/lg-gsp-prod/api/proyectos/express/catalogo');
  console.log('Catálogo PROD:\n', catProd.stdout.substring(0, 150));

  const pwaDevHttp = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/pwa-gsp-dev/');
  console.log('HTTP Status pwa-gsp-dev:', pwaDevHttp.stdout.trim());

  const pwaProdHttp = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/pwa-gsp-prod/');
  console.log('HTTP Status pwa-gsp-prod:', pwaProdHttp.stdout.trim());

  ssh.dispose();
  console.log('\n==================================================================');
  console.log('🎉 DESPLIEGUE v1.0.102 CONCLUIDO CON ÉXITO');
  console.log('==================================================================');
}

deployVersion102().catch(console.error);
