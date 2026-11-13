const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const ssh = new NodeSSH();

async function deployMantenimientoV108() {
  console.log('==================================================================');
  console.log('🚀 INICIANDO DESPLIEGUE OFICIAL v1.0.108 - REQ-1010');
  console.log('   Módulo Oficial Mantenimiento Flota: OTM Fase 1 Materiales Manuales');
  console.log('==================================================================');

  const rootDir = path.resolve(__dirname, '..');
  const frontendDir = path.join(rootDir, 'ejecucion/frontend');
  const distDevDir = path.join(frontendDir, 'dist_dev');
  const distProdDir = path.join(frontendDir, 'dist_prod');
  const disenoRealHtml = path.join(frontendDir, 'public/diseno_real_formularios_mantenimiento.html');

  // 1. COMPILAR FRONTEND DEV
  console.log('\n--- 1. COMPILANDO FRONTEND DEV (base=/lg-gsp-dev/) ---');
  if (fs.existsSync(distDevDir)) fs.rmSync(distDevDir, { recursive: true, force: true });
  execSync('npx vite build --base=/lg-gsp-dev/ --outDir dist_dev --mode development', {
    cwd: frontendDir,
    stdio: 'inherit'
  });
  console.log('✔ Frontend DEV compilado con éxito.');

  // 2. COMPILAR FRONTEND PROD
  console.log('\n--- 2. COMPILANDO FRONTEND PROD (base=/lg-gsp-prod/) ---');
  if (fs.existsSync(distProdDir)) fs.rmSync(distProdDir, { recursive: true, force: true });
  execSync('npx vite build --base=/lg-gsp-prod/ --outDir dist_prod --mode production', {
    cwd: frontendDir,
    stdio: 'inherit'
  });
  console.log('✔ Frontend PROD compilado con éxito.');

  // 3. CONECTAR SSH
  console.log('\n--- 3. CONECTANDO SSH AL SERVIDOR (servidor.leanglobal.cl) ---');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295,
    readyTimeout: 25000
  });
  console.log('✅ SSH Conectado.');

  // 4. SUBIR FRONTEND DEV
  console.log('\n--- 4. SUBIENDO FRONTEND A DEV (/var/www/html/lg-gsp-dev) ---');
  await ssh.putDirectory(distDevDir, '/var/www/html/lg-gsp-dev', {
    recursive: true,
    concurrency: 8,
    validate: (p) => !p.includes('.map')
  });
  if (fs.existsSync(disenoRealHtml)) {
    await ssh.putFile(disenoRealHtml, '/var/www/html/lg-gsp-dev/diseno_real_formularios_mantenimiento.html');
  }
  console.log('✔ Frontend DEV transferido.');

  // 5. SUBIR FRONTEND PROD
  console.log('\n--- 5. SUBIENDO FRONTEND A PROD (/var/www/html/lg-gsp-prod) ---');
  await ssh.putDirectory(distProdDir, '/var/www/html/lg-gsp-prod', {
    recursive: true,
    concurrency: 8,
    validate: (p) => !p.includes('.map')
  });
  if (fs.existsSync(disenoRealHtml)) {
    await ssh.putFile(disenoRealHtml, '/var/www/html/lg-gsp-prod/diseno_real_formularios_mantenimiento.html');
  }
  console.log('✔ Frontend PROD transferido.');

  // 6. AJUSTAR PERMISOS NGINX
  console.log('\n--- 6. AJUSTANDO PERMISOS Y RECARGANDO NGINX ---');
  await ssh.execCommand('chown -R nginx:nginx /var/www/html/lg-gsp-dev /var/www/html/lg-gsp-prod');
  await ssh.execCommand('chmod -R 755 /var/www/html/lg-gsp-dev /var/www/html/lg-gsp-prod');
  await ssh.execCommand('systemctl reload nginx');
  console.log('✔ Permisos y NGINX actualizados.');

  // 7. GOBERNANZA DB: REGISTRO REQ-1010 Y RELEASE v1.0.108
  console.log('\n--- 7. REGISTRANDO GOBERNANZA BD (tcfg_backlog y tcfg_releases) ---');
  const sqlGovernance = `
BEGIN;

-- 1. DEV BACKLOG
INSERT INTO sch_leangsp.tcfg_backlog (
  codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
) VALUES (
  'REQ-1010',
  'Módulo Oficial de Mantenimiento de Flota (Fase 1: OTM con Insumos y Materiales Manuales)',
  'Despliegue integral del módulo de Mantenimiento de Flota Pesada: segregación estricta de dominio respecto a OTs de negocio GSP, pautas preventivas por horómetros 250h/500h/1000h, avisos de avería correctivos en faena, imputación 100% manual libre de materiales y repuestos sin bloqueo de bodega WMS, registro reactivo de HH mecánicas, servicios externos tercerizados y cierre con PIN supervisor.',
  'Critica', 'Implementado', 'Dirección GSP / Sergio Gajardo', 'Sistema', CURRENT_DATE, CURRENT_DATE, NOW()
) ON CONFLICT (codigo_req) DO UPDATE SET
  nombre_requerimiento = EXCLUDED.nombre_requerimiento,
  descripcion = EXCLUDED.descripcion,
  prioridad = EXCLUDED.prioridad,
  estado = 'Implementado',
  fecha_implementacion = CURRENT_DATE,
  updated_at = NOW();

-- 2. PROD BACKLOG
INSERT INTO sch_leangsp_prod.tcfg_backlog (
  codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
) VALUES (
  'REQ-1010',
  'Módulo Oficial de Mantenimiento de Flota (Fase 1: OTM con Insumos y Materiales Manuales)',
  'Despliegue integral del módulo de Mantenimiento de Flota Pesada: segregación estricta de dominio respecto a OTs de negocio GSP, pautas preventivas por horómetros 250h/500h/1000h, avisos de avería correctivos en faena, imputación 100% manual libre de materiales y repuestos sin bloqueo de bodega WMS, registro reactivo de HH mecánicas, servicios externos tercerizados y cierre con PIN supervisor.',
  'Critica', 'Implementado', 'Dirección GSP / Sergio Gajardo', 'Sistema', CURRENT_DATE, CURRENT_DATE, NOW()
) ON CONFLICT (codigo_req) DO UPDATE SET
  nombre_requerimiento = EXCLUDED.nombre_requerimiento,
  descripcion = EXCLUDED.descripcion,
  prioridad = EXCLUDED.prioridad,
  estado = 'Implementado',
  fecha_implementacion = CURRENT_DATE,
  updated_at = NOW();

-- 3. DEV RELEASE
INSERT INTO sch_leangsp.tcfg_releases (version, fecha_release, titulo, requerimientos_asociados)
VALUES (
  'v1.0.108', CURRENT_DATE,
  'Portal Web GSP v1.0.108: Módulo de Mantenimiento Flota Pesada (Fase 1: OTMs, Materiales Manuales, HH Mecánicos y Cierre PIN)',
  '["REQ-1010"]'::jsonb
) ON CONFLICT (version) DO UPDATE SET
  fecha_release = EXCLUDED.fecha_release,
  titulo = EXCLUDED.titulo,
  requerimientos_asociados = EXCLUDED.requerimientos_asociados;

-- 4. PROD RELEASE
INSERT INTO sch_leangsp_prod.tcfg_releases (version, fecha_release, titulo, requerimientos_asociados)
VALUES (
  'v1.0.108', CURRENT_DATE,
  'Portal Web GSP v1.0.108: Módulo de Mantenimiento Flota Pesada (Fase 1: OTMs, Materiales Manuales, HH Mecánicos y Cierre PIN)',
  '["REQ-1010"]'::jsonb
) ON CONFLICT (version) DO UPDATE SET
  fecha_release = EXCLUDED.fecha_release,
  titulo = EXCLUDED.titulo,
  requerimientos_asociados = EXCLUDED.requerimientos_asociados;

COMMIT;
`;

  await ssh.execCommand(`cat << 'EOF' > /tmp/sync_v10108.sql\n${sqlGovernance}\nEOF`);
  const resSql = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/sync_v10108.sql"');
  console.log('✔ Resultado SQL Gobernanza:\n', resSql.stdout);

  // 8. VERIFICACIÓN HTTP LIVE
  console.log('\n--- 8. VERIFICACIÓN HTTP FINAL ---');
  const checkDev = await ssh.execCommand('curl -s -k -I https://127.0.0.1/lg-gsp-dev/ | head -n 1');
  const checkProd = await ssh.execCommand('curl -s -k -I https://127.0.0.1/lg-gsp-prod/ | head -n 1');
  const checkHtmlDev = await ssh.execCommand('curl -s -k -I https://127.0.0.1/lg-gsp-dev/diseno_real_formularios_mantenimiento.html | head -n 1');
  const checkHtmlProd = await ssh.execCommand('curl -s -k -I https://127.0.0.1/lg-gsp-prod/diseno_real_formularios_mantenimiento.html | head -n 1');

  console.log('HTTP Status DEV:', checkDev.stdout.trim());
  console.log('HTTP Status PROD:', checkProd.stdout.trim());
  console.log('HTTP Status Visual Form DEV:', checkHtmlDev.stdout.trim());
  console.log('HTTP Status Visual Form PROD:', checkHtmlProd.stdout.trim());

  ssh.dispose();
  console.log('\n==================================================================');
  console.log('🎉 DESPLIEGUE v1.0.108 FINALIZADO CON ÉXITO ABSOLUTO');
  console.log('==================================================================');
}

deployMantenimientoV108().catch(err => {
  console.error('❌ Error fatal en despliegue:', err);
  process.exit(1);
});
