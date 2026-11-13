const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const fs = require('fs');
const ssh = new NodeSSH();

async function run() {
  console.log('=== 1. INICIANDO CONEXIÓN SSH ===');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });
  console.log('Conexión SSH establecida con éxito.');

  const devDir = '/home/nodeadmin/proyectos/lean-services-gsp';
  const prodDir = '/home/nodeadmin/proyectos/lean-services-gsp-prod';
  const localPublic = path.resolve(__dirname, '../ejecucion/backend_remoto/public');
  const localModel = path.resolve(__dirname, '../ejecucion/backend_remoto/src/models/proyectoModel.js');

  console.log('\n=== 2. CREANDO DIRECTORIOS PUBLIC SI NO EXISTEN ===');
  await ssh.execCommand(`mkdir -p ${devDir}/public ${prodDir}/public`);

  console.log('\n=== 3. SUBIENDO LOGOS A DEV Y PROD ===');
  const logoFiles = ['logo-sanpablo.png', 'logo-bestmaq.png', 'logo-logisticadelsur.png'];
  for (const file of logoFiles) {
    const src = path.join(localPublic, file);
    console.log(`Subiendo ${file}...`);
    await ssh.putFile(src, `${devDir}/public/${file}`);
    await ssh.putFile(src, `${prodDir}/public/${file}`);
  }

  console.log('\n=== 4. SUBIENDO MODELO PROYECTOMODEL.JS A DEV Y PROD ===');
  await ssh.putFile(localModel, `${devDir}/src/models/proyectoModel.js`);
  await ssh.putFile(localModel, `${prodDir}/src/models/proyectoModel.js`);

  console.log('\n=== 5. AJUSTANDO PERMISOS ===');
  await ssh.execCommand(`chown -R nodeadmin:nodeadmin ${devDir}/public ${prodDir}/public ${devDir}/src/models/proyectoModel.js ${prodDir}/src/models/proyectoModel.js`);

  console.log('\n=== 6. ACTUALIZANDO BASE DE DATOS (TPAR_EMPRESAS EN DEV Y PROD) ===');
  const sqlCommands = `
    UPDATE sch_leangsp.tpar_empresas SET logo_empresa = 'logo-sanpablo.png' WHERE id_empresa IN (9, 11);
    UPDATE sch_leangsp.tpar_empresas SET logo_empresa = 'logo-bestmaq.png' WHERE id_empresa = 7;
    UPDATE sch_leangsp.tpar_empresas SET logo_empresa = 'logo-logisticadelsur.png' WHERE id_empresa = 8;
    
    UPDATE sch_leangsp_prod.tpar_empresas SET logo_empresa = 'logo-sanpablo.png' WHERE id_empresa IN (9, 11);
    UPDATE sch_leangsp_prod.tpar_empresas SET logo_empresa = 'logo-bestmaq.png' WHERE id_empresa = 7;
    UPDATE sch_leangsp_prod.tpar_empresas SET logo_empresa = 'logo-logisticadelsur.png' WHERE id_empresa = 8;
  `;
  const psqlRes = await ssh.execCommand(`su - postgres -c "psql -d bd_leanglobal -c \\"${sqlCommands}\\""`);
  console.log('Resultado PostgreSQL:\n', psqlRes.stdout || psqlRes.stderr);

  console.log('\n=== 7. VERIFICANDO REGISTROS EN BASE DE DATOS ===');
  const checkRes = await ssh.execCommand(`su - postgres -c "psql -d bd_leanglobal -c \\"SELECT id_empresa, name_empresa, logo_empresa FROM sch_leangsp_prod.tpar_empresas WHERE id_empresa IN (7, 8, 9, 11);\\""`);
  console.log('Registros PROD:\n', checkRes.stdout);

  console.log('\n=== 8. REINICIANDO PM2 PROCESOS 10 Y 13 ===');
  await ssh.execCommand('su - nodeadmin -c "pm2 restart 10 13"');
  await new Promise(r => setTimeout(r, 3000));

  const pm2Res = await ssh.execCommand('su - nodeadmin -c "pm2 status 10 13"');
  console.log(pm2Res.stdout);

  console.log('\n=== 9. PRUEBA REAL EMPÍRICA A LA API DE PRODUCCIÓN (HTTP GET) ===');
  const curlApi = await ssh.execCommand('curl -s -i "https://servidor.leanglobal.cl/lg-gsp-prod/api/proyectos?_id_empresa=9" | head -n 15');
  console.log('Respuesta API:\n', curlApi.stdout);

  console.log('\n=== 10. PRUEBA REAL DE GENERACIÓN DE COTIZACIÓN PROYECTO 18 ===');
  const curlGen = await ssh.execCommand('curl -s -i -X POST "https://servidor.leanglobal.cl/lg-gsp-prod/api/proyectos/18/generar-cotizacion?_id_empresa=11" -H "Content-Type: application/json" -d "{}"');
  console.log('Respuesta Generación Cotización Proyecto 18:\n', curlGen.stdout.slice(0, 600));

  ssh.dispose();
  console.log('\n=== DESPLIEGUE FINALIZADO EXITOSAMENTE ===');
}

run().catch(err => {
  console.error('Error durante el despliegue:', err);
  process.exit(1);
});
