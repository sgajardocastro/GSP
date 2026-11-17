const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const fs = require('fs');

const ssh = new NodeSSH();

async function deployProd() {
  console.log('Connecting to production server 138.255.103.18:1295...');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });
  console.log('Connected via SSH successfully.');

  const distProdLocal = path.resolve(__dirname, '../../gsp-hotfix-prod/ejecucion/frontend/dist_prod');
  const distProdRemote = '/var/www/html/lg-gsp-prod';
  const backendModelLocal = path.resolve(__dirname, '../../gsp-hotfix-prod/ejecucion/backend_remoto/src/models/proyectoModel.js');
  const backendModelRemote = '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/models/proyectoModel.js';
  const backendPkgLocal = path.resolve(__dirname, '../../gsp-hotfix-prod/ejecucion/backend_remoto/package.json');
  const backendPkgRemote = '/home/nodeadmin/proyectos/lean-services-gsp-prod/package.json';

  console.log(`1. Uploading frontend dist_prod from ${distProdLocal} to ${distProdRemote}...`);
  await ssh.putDirectory(distProdLocal, distProdRemote, {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.DS_Store')
  });
  console.log('✔ Frontend dist_prod uploaded successfully.');

  console.log(`2. Uploading backend proyectoModel.js to ${backendModelRemote}...`);
  await ssh.putFile(backendModelLocal, backendModelRemote);
  await ssh.putFile(backendPkgLocal, backendPkgRemote);
  console.log('✔ Backend files uploaded successfully.');

  console.log('3. Restarting PM2 ID 13 (lean-services-gsp-prod)...');
  const pm2Res = await ssh.execCommand('su - nodeadmin -c "pm2 restart 13"');
  console.log(pm2Res.stdout || pm2Res.stderr);

  console.log('4. Registering release in sch_leangsp_prod.tcfg_releases...');
  const sql = `
  INSERT INTO sch_leangsp_prod.tcfg_releases (
    version, producto, ambiente, fecha_release, commit_hash, tag_git,
    descripcion_cambio, detalles_tecnicos, estado_despliegue, creado_por, id_backlog_ref
  ) VALUES (
    '1.0.224', 'WEB_BACKEND', 'PROD', NOW(), '8da56df', 'v1.0.224',
    'Hotfix Quirurgico: Sanitizacion determinista de fechas, limites input y supresion rigger fantasma',
    'Restriccion min/max en inputs date, sanitizarFechaLocal anti-crash toISOString, regex 4 digitos en Torre.vue y eliminacion de reinyector zombi en proyectoModel.js',
    'EXITOSO', 'Alfonso Porperello / S. Gajardo', 'REQ-1182'
  );
  `;
  await ssh.execCommand(`cat << 'EOF' > /tmp/register_release_224.sql\n${sql}\nEOF`);
  const dbRes = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/register_release_224.sql"');
  console.log(dbRes.stdout || dbRes.stderr);

  console.log('5. Verifying HTTP 200 on PROD frontend...');
  const curlRes = await ssh.execCommand('curl -sI https://servidor.leanglobal.cl/lg-gsp-prod/ | head -n 5');
  console.log(curlRes.stdout || curlRes.stderr);

  ssh.dispose();
  console.log('🚀 Deployment of v1.0.224 to PROD completed successfully!');
}

deployProd().catch(err => {
  console.error('Deployment error:', err);
  process.exit(1);
});
