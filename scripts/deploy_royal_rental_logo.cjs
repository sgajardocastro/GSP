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

async function run() {
  console.log('=== DESPLIEGUE LOGO ROYAL RENTAL A DEV Y PROD ===\n');
  console.log('Conectando a servidor SSH...');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const localLogo = path.resolve(__dirname, '../ejecucion/backend_remoto/public/logo-royalrental.png');
  const localModel = path.resolve(__dirname, '../ejecucion/backend_remoto/src/models/proyectoModel.js');

  // 1. TRANSFERIR LOGO A CARPETAS PUBLICAS DE BACKEND Y FRONTEND
  console.log('\n--- 1. TRANSFERENCIA DE LOGO A SERVIDOR ---');
  const targets = [
    '/home/nodeadmin/proyectos/lean-services-gsp/public/logo-royalrental.png',
    '/home/nodeadmin/proyectos/lean-services-gsp-prod/public/logo-royalrental.png',
    '/var/www/html/lg-gsp-dev/logo-royalrental.png',
    '/var/www/html/lg-gsp-prod/logo-royalrental.png'
  ];

  for (const t of targets) {
    console.log(`Subiendo logo a: ${t}...`);
    await ssh.putFile(localLogo, t);
    if (t.startsWith('/var/www/html')) {
      await ssh.execCommand(`chown nginx:nginx ${t} && chmod 644 ${t}`);
    } else {
      await ssh.execCommand(`chown nodeadmin:nodeadmin ${t} && chmod 644 ${t}`);
    }
  }

  // 2. TRANSFERIR PROYECTOMODEL.JS A DEV Y PROD
  console.log('\n--- 2. TRANSFERENCIA DE PROYECTOMODEL.JS ---');
  const devModel = '/home/nodeadmin/proyectos/lean-services-gsp/src/models/proyectoModel.js';
  const prodModel = '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/models/proyectoModel.js';

  console.log('Subiendo a DEV backend...');
  await ssh.putFile(localModel, devModel);
  await ssh.execCommand(`chown nodeadmin:nodeadmin ${devModel}`);

  console.log('Subiendo a PROD backend...');
  await ssh.putFile(localModel, prodModel);
  await ssh.execCommand(`chown nodeadmin:nodeadmin ${prodModel}`);

  // 3. REINICIAR PM2 10 (DEV) Y PM2 13 (PROD)
  console.log('\n--- 3. REINICIO DE SERVICIOS PM2 ---');
  const restartDev = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
  console.log('PM2 10 (DEV):', restartDev.stdout.split('\n')[0] || restartDev.stderr);

  const restartProd = await ssh.execCommand('su - nodeadmin -c "pm2 restart 13"');
  console.log('PM2 13 (PROD):', restartProd.stdout.split('\n')[0] || restartProd.stderr);

  await new Promise(r => setTimeout(r, 2000));

  // 4. ACTUALIZAR BASE DE DATOS POSTGRESQL
  console.log('\n--- 4. ACTUALIZACIÓN DE BASE DE DATOS TPAR_EMPRESAS ---');
  const sql = `
    UPDATE sch_leangsp.tpar_empresas SET logo_empresa = 'logo-royalrental.png' WHERE id_empresa = 11;
    UPDATE sch_leangsp_prod.tpar_empresas SET logo_empresa = 'logo-royalrental.png' WHERE id_empresa = 11;
  `;
  const resSql = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sql}\\""`);
  console.log('Salida SQL:\n', resSql.stdout.trim() || resSql.stderr);

  // Verificar DEV
  const verifyDev = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT id_empresa, name_empresa, logo_empresa FROM sch_leangsp.tpar_empresas WHERE id_empresa = 11;\\""`);
  console.log('DEV tpar_empresas (id=11):', verifyDev.stdout.trim());

  // Verificar PROD
  const verifyProd = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT id_empresa, name_empresa, logo_empresa FROM sch_leangsp_prod.tpar_empresas WHERE id_empresa = 11;\\""`);
  console.log('PROD tpar_empresas (id=11):', verifyProd.stdout.trim());

  ssh.dispose();

  // 5. VERIFICACIÓN HTTP EMPÍRICA
  console.log('\n--- 5. VERIFICACIÓN HTTP EMPÍRICA ---');
  const devUrl = 'https://servidor.leanglobal.cl/lg-gsp-dev/logo-royalrental.png';
  const prodUrl = 'https://servidor.leanglobal.cl/lg-gsp-prod/logo-royalrental.png';
  
  const devRes = await checkUrl(devUrl);
  console.log(`Logo DEV (${devUrl}) -> Status: ${devRes.status}`);

  const prodRes = await checkUrl(prodUrl);
  console.log(`Logo PROD (${prodUrl}) -> Status: ${prodRes.status}`);

  const devApi = await checkUrl('https://servidor.leanglobal.cl/api-gsp/saludo');
  console.log(`Backend DEV API (/api-gsp/saludo) -> Status: ${devApi.status}`);

  const prodApi = await checkUrl('https://servidor.leanglobal.cl/api-gsp-prod/saludo');
  console.log(`Backend PROD API (/api-gsp-prod/saludo) -> Status: ${prodApi.status}`);

  console.log('\n=== DESPLIEGUE FINALIZADO CON ÉXITO ===');
}

run().catch(err => {
  console.error('Error durante el despliegue:', err);
  process.exit(1);
});
