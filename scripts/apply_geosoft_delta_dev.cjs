const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const https = require('https');
const ssh = new NodeSSH();

async function applyDelta() {
  console.log('=== APLICANDO SINCRONIZACIÓN DELTA DESDE GEOSOFT EN DEV ===\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const localSql = path.resolve(__dirname, '../ejecucion/bd/sync_geosoft_delta.sql');
  const remoteSql = '/tmp/sync_geosoft_delta.sql';

  console.log('1. Subiendo sync_geosoft_delta.sql -> /tmp/...');
  await ssh.putFile(localSql, remoteSql);
  await ssh.execCommand(`chmod 644 ${remoteSql}`);

  console.log('2. Ejecutando actualización atómica en PostgreSQL (sch_leangsp)...');
  const sqlRes = await ssh.execCommand(`su - postgres -c "psql -d postgres -f ${remoteSql}"`);
  console.log(sqlRes.stdout.trim().split('\n').slice(-15).join('\n'));
  if (sqlRes.stderr && sqlRes.stderr.includes('ERROR')) {
    console.error('Stderr SQL:', sqlRes.stderr);
  }

  ssh.dispose();

  // 3. Verificación en API DEV
  console.log('\n3. Verificando API de productos en DEV...');
  const req = https.request({
    hostname: 'servidor.leanglobal.cl',
    port: 443,
    path: '/lg-gsp-dev/api/inventario/productos',
    method: 'GET',
    rejectUnauthorized: false
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        console.log(`HTTP Status: ${res.statusCode}`);
        console.log(`Total productos en catálogo: ${json.count || json.data?.length}`);
        const conStock = (json.data || []).filter(p => Number(p.stock_fisico) > 0);
        console.log(`Productos con stock físico > 0: ${conStock.length}`);
        const totalUnidades = (json.data || []).reduce((acc, p) => acc + (Number(p.stock_fisico) || 0), 0);
        console.log(`Total unidades físicas en stock: ${totalUnidades}`);
      } catch (e) {
        console.log('Respuesta raw:', data.slice(0, 300));
      }
    });
  });
  req.on('error', console.error);
  req.end();
}

applyDelta().catch(console.error);
