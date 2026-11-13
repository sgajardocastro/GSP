const { NodeSSH } = require('../node_modules/node-ssh');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const ssh = new NodeSSH();

async function deployVersion103() {
  console.log('==================================================================');
  console.log('🚀 INICIANDO DESPLIEGUE OFICIAL v1.0.103 - HOTFIX VISUAL & RBAC COTIZADOR');
  console.log('==================================================================');

  const pwaDir = path.resolve(__dirname, '../../pwa');
  const distDir = path.join(pwaDir, 'dist');

  // Limpiar dist local
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }

  // 1. COMPILAR PWA DEV
  console.log('\n--- 1. COMPILANDO PWA DEV ---');
  fs.copyFileSync(path.join(pwaDir, '.env.dev'), path.join(pwaDir, '.env'));
  fs.copyFileSync(path.join(pwaDir, '.env.dev'), path.join(pwaDir, '.env.production'));
  execSync('npm run build', { cwd: pwaDir, stdio: 'inherit' });
  console.log('✔ PWA DEV compilado.');

  // 2. CONECTAR SSH
  console.log('\n--- 2. CONECTANDO SSH ---');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295,
    readyTimeout: 20000
  });
  console.log('✅ SSH Conectado.');

  // 3. SUBIR PWA DEV
  console.log('\n--- 3. SUBIENDO A /var/www/html/pwa-gsp-dev ---');
  await ssh.putDirectory(distDir, '/var/www/html/pwa-gsp-dev', {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.map')
  });
  await ssh.execCommand('chown -R nginx:nginx /var/www/html/pwa-gsp-dev && chmod -R 755 /var/www/html/pwa-gsp-dev');
  console.log('✔ PWA DEV desplegado.');

  // Limpiar dist local para PROD
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }

  // 4. COMPILAR PWA PROD
  console.log('\n--- 4. COMPILANDO PWA PROD ---');
  fs.copyFileSync(path.join(pwaDir, '.env.prod'), path.join(pwaDir, '.env'));
  fs.copyFileSync(path.join(pwaDir, '.env.prod'), path.join(pwaDir, '.env.production'));
  execSync('npm run build', { cwd: pwaDir, stdio: 'inherit' });
  console.log('✔ PWA PROD compilado.');

  // 5. SUBIR PWA PROD
  console.log('\n--- 5. SUBIENDO A /var/www/html/pwa-gsp-prod ---');
  await ssh.putDirectory(distDir, '/var/www/html/pwa-gsp-prod', {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.map')
  });
  await ssh.execCommand('chown -R nginx:nginx /var/www/html/pwa-gsp-prod && chmod -R 755 /var/www/html/pwa-gsp-prod');
  await ssh.execCommand('systemctl reload nginx');
  console.log('✔ PWA PROD desplegado y NGINX recargado.');

  // 6. GOBERNANZA DB: REGISTRO v1.0.103
  console.log('\n--- 6. REGISTRANDO RELEASE v1.0.103 EN BASE DE DATOS ---');
  const sql = `
BEGIN;

INSERT INTO sch_leangsp.tcfg_releases (version, fecha_release, titulo, requerimientos_asociados)
VALUES (
  'v1.0.103', CURRENT_DATE,
  'Portal Web & PWA GSP v1.0.103: Rediseño Ergonómico Cotizador Express Móvil, Cero Solapamientos y Segregación Estricta RBAC Admin/Comercial',
  '["REQ-994"]'::jsonb
) ON CONFLICT (version) DO UPDATE SET 
  fecha_release = EXCLUDED.fecha_release,
  titulo = EXCLUDED.titulo,
  requerimientos_asociados = EXCLUDED.requerimientos_asociados;

INSERT INTO sch_leangsp_prod.tcfg_releases (version, fecha_release, titulo, requerimientos_asociados)
VALUES (
  'v1.0.103', CURRENT_DATE,
  'Portal Web & PWA GSP v1.0.103: Rediseño Ergonómico Cotizador Express Móvil, Cero Solapamientos y Segregación Estricta RBAC Admin/Comercial',
  '["REQ-994"]'::jsonb
) ON CONFLICT (version) DO UPDATE SET 
  fecha_release = EXCLUDED.fecha_release,
  titulo = EXCLUDED.titulo,
  requerimientos_asociados = EXCLUDED.requerimientos_asociados;

COMMIT;
`;

  await ssh.execCommand(`cat << 'EOF' > /tmp/sync_v10103.sql\n${sql}\nEOF`);
  const resSql = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/sync_v10103.sql"');
  console.log('✔ SQL Gobernanza:\n', resSql.stdout);

  // 7. VERIFICACIÓN HTTP
  console.log('\n--- 7. CERTIFICACIÓN HTTP ---');
  const devStatus = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/pwa-gsp-dev/');
  console.log(`🌐 PWA DEV HTTP: ${devStatus.stdout.trim()}`);

  const prodStatus = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/pwa-gsp-prod/');
  console.log(`🌐 PWA PROD HTTP: ${prodStatus.stdout.trim()}`);

  ssh.dispose();
  console.log('\n==================================================================');
  console.log('🎉 DESPLIEGUE v1.0.103 COMPLETADO CON ÉXITO');
  console.log('==================================================================');
}

deployVersion103().catch(console.error);
