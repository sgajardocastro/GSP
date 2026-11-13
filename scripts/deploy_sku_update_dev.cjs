const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const https = require('https');
const ssh = new NodeSSH();

async function deploySkuUpdate() {
  console.log('=== DESPLIEGUE DE ACTUALIZACIÓN DE SKUS Y BACKEND EN DEV ===\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  // 1. Subir backend inventarioModel.js
  const localModel = path.resolve(__dirname, '../ejecucion/backend_remoto/src/models/inventarioModel.js');
  const remoteModel = '/home/nodeadmin/proyectos/lean-services-gsp/src/models/inventarioModel.js';
  console.log(`1. Subiendo inventarioModel.js -> ${remoteModel}...`);
  await ssh.putFile(localModel, remoteModel);

  // 2. Subir y ejecutar update_skus_familia.sql en PostgreSQL
  const localSql = path.resolve(__dirname, '../ejecucion/bd/update_skus_familia.sql');
  const remoteSql = '/tmp/update_skus_familia.sql';
  console.log(`2. Subiendo update_skus_familia.sql -> ${remoteSql}...`);
  await ssh.putFile(localSql, remoteSql);
  await ssh.execCommand(`chmod 644 ${remoteSql}`);

  console.log('3. Ejecutando actualización de SKUs en base de datos PostgreSQL (sch_leangsp)...');
  const sqlRes = await ssh.execCommand(`su - postgres -c "psql -d postgres -f ${remoteSql}"`);
  console.log(sqlRes.stdout.trim());
  if (sqlRes.stderr && sqlRes.stderr.includes('ERROR')) {
    console.error('Error SQL:', sqlRes.stderr);
  }

  // 4. Reiniciar PM2 id 10
  console.log('\n4. Reiniciando servicio PM2 id 10...');
  const pm2Res = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
  console.log(pm2Res.stdout.trim().split('\n').slice(-5).join('\n'));

  ssh.dispose();

  // 5. Test en vivo HTTP 200 OK y verificación de SKUs
  console.log('\n5. Verificando API en vivo en DEV...');
  const options = {
    hostname: 'servidor.leanglobal.cl',
    port: 443,
    path: '/api/inventario/productos',
    method: 'GET',
    rejectUnauthorized: false
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      console.log(`HTTP Status: ${res.statusCode}`);
      try {
        const json = JSON.parse(data);
        console.log(`Total productos retornados: ${json.count || (json.data && json.data.length)}`);
        const sample = (json.data || []).slice(0, 5).map(p => ({ sku: p.sku, legado: p.codigo_legado, nombre: p.nombre, familia: p.familia }));
        console.log('Muestra de productos con nuevo SKU:', sample);
      } catch (e) {
        console.log('Respuesta recibida:', data.slice(0, 200));
      }
    });
  });
  req.on('error', (e) => { console.error('Error request:', e.message); });
  req.end();
}

deploySkuUpdate().catch(console.error);
