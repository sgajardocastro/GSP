const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const { Client } = require('../ejecucion/backend_remoto/node_modules/pg');
const path = require('path');
const https = require('https');
const ssh = new NodeSSH();

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({ status: res.statusCode });
    }).on('error', (e) => {
      resolve({ error: e.message });
    });
  });
}

async function main() {
  console.log('1. Conectando por SSH a 138.255.103.18:1295...');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295,
    readyTimeout: 30000
  });
  console.log('✅ Conectado SSH.');

  const localDist = path.resolve(__dirname, '../ejecucion/pwa/dist');
  const remotePwaProd = '/var/www/html/pwa-gsp-prod';

  console.log(`2. Subiendo bundle PWA v1.0.65 a ${remotePwaProd}...`);
  await ssh.putDirectory(localDist, remotePwaProd, {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.map')
  });

  await ssh.execCommand(`chown -R nginx:nginx ${remotePwaProd} && chmod -R 755 ${remotePwaProd}`);
  console.log('✅ Permisos nginx aplicados.');

  console.log('3. Sincronizando tcfg_releases en PostgreSQL PROD...');
  const clientProd = new Client({
    host: '138.255.103.18',
    port: 5432,
    user: 'usr_leangsp_prod',
    password: 'usr_gsp_prod_2026!',
    database: 'postgres'
  });
  await clientProd.connect();
  await clientProd.query(`DELETE FROM sch_leangsp_prod.tcfg_releases WHERE version IN ('v1.0.65', '1.0.65')`);
  await clientProd.query(`
    INSERT INTO sch_leangsp_prod.tcfg_releases (
      version, titulo, tipo_release, fecha_release, descripcion_impacto, requerimientos_asociados, publicado_por
    ) VALUES (
      'v1.0.65',
      'PWA GSP v1.0.65 - Deshabilitación Temporal Odómetro Incremental y Saneamiento Flota',
      'BUGFIX',
      CURRENT_DATE,
      'Deshabilitación temporal de la regla de kilometraje incremental en PWA (ViajeConductor.vue) y backend para destrabar inicio y cierre de jornadas; saneamiento de odómetros corruptos en flota e invalidación de Service Worker móvil.',
      '["REQ-1143"]'::jsonb,
      'Sergio Gajardo'
    )
  `);
  console.log('✅ Release v1.0.65 insertada en sch_leangsp_prod.tcfg_releases.');
  await clientProd.end();

  console.log('4. Verificando HTTP en producción...');
  const resHttp = await checkUrl('https://servidor.leanglobal.cl/pwa-gsp-prod/');
  console.log('HTTP PWA PROD:', resHttp.status);

  const checkIndex = await ssh.execCommand(`head -n 10 ${remotePwaProd}/index.html`);
  console.log('Index.html en remoto:\n', checkIndex.stdout.trim());

  ssh.dispose();
  console.log('\n🚀 DESPLIEGUE PWA v1.0.65 COMPLETADO AL 100%');
}

main().catch(err => {
  console.error('ERROR EN DESPLIEGUE:', err);
  process.exit(1);
});
