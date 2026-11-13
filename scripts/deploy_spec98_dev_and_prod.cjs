const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const https = require('https');
const ssh = new NodeSSH();

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({ status: res.statusCode, headers: res.headers });
    }).on('error', (e) => {
      resolve({ error: e.message });
    });
  });
}

async function main() {
  console.log('======================================================================');
  console.log(' DESPLIEGUE REQ-1067 / SPEC-098: DISPONIBILIDAD E2E PDF REPORTS DIARIOS');
  console.log(' AMBIENTES: DEV (PM2 10, /lg-gsp-dev) & PROD (PM2 13, /lg-gsp-prod)');
  console.log('======================================================================\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });
  console.log('✓ Conectado vía SSH a 138.255.103.18:1295');

  const localBackend = path.resolve(__dirname, '../ejecucion/backend_remoto');
  const backendFiles = [
    'src/services/reportDiarioPdfService.js',
    'src/controllers/reportDiarioController.js',
    'src/routes/reportDiarioRoutes.js'
  ];

  // 1. DESPLIEGUE BACKEND DEV
  console.log('\n--- 1. DESPLEGANDO BACKEND DEV (/home/nodeadmin/proyectos/lean-services-gsp) ---');
  const devBackendRemote = '/home/nodeadmin/proyectos/lean-services-gsp';
  for (const f of backendFiles) {
    const lPath = path.join(localBackend, f);
    const rPath = `${devBackendRemote}/${f}`;
    console.log(`Subiendo DEV: ${f} -> ${rPath}...`);
    await ssh.putFile(lPath, rPath);
    await ssh.execCommand(`chown nodeadmin:nodeadmin ${rPath}`);
  }

  console.log('Reiniciando PM2 DEV (10)...');
  const devRestart = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
  console.log(devRestart.stdout.trim() || devRestart.stderr.trim());

  // 2. DESPLIEGUE BACKEND PROD
  console.log('\n--- 2. DESPLEGANDO BACKEND PROD (/home/nodeadmin/proyectos/lean-services-gsp-prod) ---');
  const prodBackendRemote = '/home/nodeadmin/proyectos/lean-services-gsp-prod';
  for (const f of backendFiles) {
    const lPath = path.join(localBackend, f);
    const rPath = `${prodBackendRemote}/${f}`;
    console.log(`Subiendo PROD: ${f} -> ${rPath}...`);
    await ssh.putFile(lPath, rPath);
    await ssh.execCommand(`chown nodeadmin:nodeadmin ${rPath}`);
  }

  console.log('Reiniciando PM2 PROD (13)...');
  const prodRestart = await ssh.execCommand('su - nodeadmin -c "pm2 restart 13"');
  console.log(prodRestart.stdout.trim() || prodRestart.stderr.trim());

  // Esperar 3 segundos para que ambos procesos PM2 inicien
  await new Promise(r => setTimeout(r, 3000));

  // 3. DESPLIEGUE FRONTEND WEB DEV
  console.log('\n--- 3. DESPLEGANDO FRONTEND WEB DEV (/var/www/html/lg-gsp-dev) ---');
  const localDistDev = path.resolve(__dirname, '../ejecucion/frontend/dist_dev');
  const remoteDistDev = '/var/www/html/lg-gsp-dev';
  console.log(`Subiendo ${localDistDev} -> ${remoteDistDev}...`);
  const okDev = await ssh.putDirectory(localDistDev, remoteDistDev, {
    recursive: true,
    concurrency: 10,
    validate: (item) => !item.includes('.git')
  });
  if (!okDev) throw new Error('Fallo al transferir dist_dev a DEV');
  await ssh.execCommand(`chown -R nginx:nginx ${remoteDistDev} && chmod -R 755 ${remoteDistDev}`);
  console.log('✓ Permisos ajustados en Web DEV.');

  // 4. DESPLIEGUE FRONTEND WEB PROD
  console.log('\n--- 4. DESPLEGANDO FRONTEND WEB PROD (/var/www/html/lg-gsp-prod) ---');
  const localDistProd = path.resolve(__dirname, '../ejecucion/frontend/dist_prod');
  const remoteDistProd = '/var/www/html/lg-gsp-prod';
  console.log(`Subiendo ${localDistProd} -> ${remoteDistProd}...`);
  const okProd = await ssh.putDirectory(localDistProd, remoteDistProd, {
    recursive: true,
    concurrency: 10,
    validate: (item) => !item.includes('.git')
  });
  if (!okProd) throw new Error('Fallo al transferir dist_prod a PROD');
  await ssh.execCommand(`chown -R nginx:nginx ${remoteDistProd} && chmod -R 755 ${remoteDistProd}`);
  console.log('✓ Permisos ajustados en Web PROD.');

  // 5. AUDITORÍA Y AUTO-REPARACIÓN EN BASE DE DATOS
  console.log('\n--- 5. AUDITORÍA Y AUTO-REPARACIÓN DE REPORTS EN BASE DE DATOS ---');
  
  // Auditar DEV
  console.log('\nAuditando reports en DEV (sch_leangsp)...');
  const auditDevCmd = `su - postgres -c "psql -d gruas_san_pablo -t -c \\"SELECT count(*) as total, count(*) FILTER (WHERE id_doc_pdf IS NOT NULL) as con_pdf, count(*) FILTER (WHERE id_doc_pdf IS NULL) as sin_pdf FROM sch_leangsp.tedp_reporte_avance;\\""`;
  const auditDevRes = await ssh.execCommand(auditDevCmd);
  console.log('DEV Reports [Total | Con PDF | Sin PDF]:', auditDevRes.stdout.trim());

  // Auditar PROD
  console.log('\nAuditando reports en PROD (sch_leangsp_prod)...');
  const auditProdCmd = `su - postgres -c "psql -d gruas_san_pablo -t -c \\"SELECT count(*) as total, count(*) FILTER (WHERE id_doc_pdf IS NOT NULL) as con_pdf, count(*) FILTER (WHERE id_doc_pdf IS NULL) as sin_pdf FROM sch_leangsp_prod.tedp_reporte_avance;\\""`;
  const auditProdRes = await ssh.execCommand(auditProdCmd);
  console.log('PROD Reports [Total | Con PDF | Sin PDF]:', auditProdRes.stdout.trim());

  // Obtener último ID de report en DEV y probar endpoint
  const lastDevRepCmd = `su - postgres -c "psql -d gruas_san_pablo -t -c \\"SELECT id_reporte_avance FROM sch_leangsp.tedp_reporte_avance ORDER BY id_reporte_avance DESC LIMIT 1;\\""`;
  const lastDevRepRes = await ssh.execCommand(lastDevRepCmd);
  const lastDevId = lastDevRepRes.stdout.trim();
  if (lastDevId) {
    console.log(`\nProbando endpoint DEV /api/operaciones/report/${lastDevId}/pdf en puerto 3006...`);
    const testDev = await ssh.execCommand(`curl -s -I "http://127.0.0.1:3006/api/operaciones/report/${lastDevId}/pdf"`);
    console.log(testDev.stdout.trim());
  }

  // Obtener último ID de report en PROD y probar endpoint (esto desencadenará auto-reparación si faltaba id_doc_pdf)
  const lastProdRepCmd = `su - postgres -c "psql -d gruas_san_pablo -t -c \\"SELECT id_reporte_avance FROM sch_leangsp_prod.tedp_reporte_avance ORDER BY id_reporte_avance DESC LIMIT 1;\\""`;
  const lastProdRepRes = await ssh.execCommand(lastProdRepCmd);
  const lastProdId = lastProdRepRes.stdout.trim();
  if (lastProdId) {
    console.log(`\nProbando endpoint PROD /api/operaciones/report/${lastProdId}/pdf en puerto 3016...`);
    const testProd = await ssh.execCommand(`curl -s -I "http://127.0.0.1:3016/api/operaciones/report/${lastProdId}/pdf"`);
    console.log(testProd.stdout.trim());
  }

  // 6. VERIFICACIÓN HTTP PÚBLICA
  console.log('\n--- 6. VERIFICACIÓN HTTP PÚBLICA ---');
  const devUrl = 'https://servidor.leanglobal.cl/lg-gsp-dev/';
  const prodUrl = 'https://servidor.leanglobal.cl/lg-gsp-prod/';
  const checkDevRes = await checkUrl(devUrl);
  const checkProdRes = await checkUrl(prodUrl);
  console.log(`Web DEV  (${devUrl}): HTTP ${checkDevRes.status}`);
  console.log(`Web PROD (${prodUrl}): HTTP ${checkProdRes.status}`);

  ssh.dispose();
  console.log('\n======================================================================');
  console.log('✓ DESPLIEGUE REQ-1067 / SPEC-098 CONCLUIDO CON ÉXITO EN DEV Y PROD');
  console.log('======================================================================');
}

main().catch(err => {
  console.error('\n❌ ERROR DURANTE DESPLIEGUE:', err);
  if (ssh) ssh.dispose();
  process.exit(1);
});
