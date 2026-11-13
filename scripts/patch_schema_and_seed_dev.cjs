const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function patchAndSeed() {
  console.log('=== APLICANDO PARCHE DE COLUMNAS, GRANTS Y SEED EN DEV ===\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const localPatch = path.resolve(__dirname, '../ejecucion/bd/patch_tinv_columns_and_grants.sql');
  const remotePatch = '/tmp/patch_tinv_columns_and_grants.sql';

  console.log('1. Subiendo patch_tinv_columns_and_grants.sql -> /tmp/...');
  await ssh.putFile(localPatch, remotePatch);
  await ssh.execCommand(`chmod 644 ${remotePatch}`);

  console.log('2. Ejecutando psql -f /tmp/patch_tinv_columns_and_grants.sql...');
  const alterRes = await ssh.execCommand(`su - postgres -c "psql -d postgres -f ${remotePatch}"`);
  console.log('Resultado ALTER/GRANT:\n', alterRes.stdout.trim());
  if (alterRes.stderr) console.error('Stderr ALTER:', alterRes.stderr.trim());

  console.log('\n3. Subiendo y ejecutando seed de carga inicial (seed_carga_inicial_inventario.sql)...');
  const localSeed = path.resolve(__dirname, '../ejecucion/bd/seed_carga_inicial_inventario.sql');
  const remoteSeed = '/tmp/seed_carga_inicial_inventario.sql';
  await ssh.putFile(localSeed, remoteSeed);
  await ssh.execCommand(`chmod 644 ${remoteSeed}`);

  const seedRes = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/seed_carga_inicial_inventario.sql"');
  const seedLines = seedRes.stdout.split('\n');
  const errorLines = seedRes.stderr ? seedRes.stderr.split('\n').filter(l => l.includes('ERROR')) : [];
  console.log(`   Total sentencias ejecutadas: ${seedLines.length}, Errores: ${errorLines.length}`);
  if (errorLines.length > 0) {
    console.log('   Muestra errores:', errorLines.slice(0, 5).join(' | '));
  } else {
    console.log('   ✓ Carga inicial aplicada sin errores.');
  }

  console.log('\n4. Verificando conteos en BD...');
  const checkSql = `
    SELECT 
      (SELECT COUNT(*) FROM sch_leangsp.tinv_bodega) AS bodegas,
      (SELECT COUNT(*) FROM sch_leangsp.tinv_ubicacion) AS ubicaciones,
      (SELECT COUNT(*) FROM sch_leangsp.tinv_producto) AS productos,
      (SELECT COUNT(*) FROM sch_leangsp.tinv_stock WHERE cantidad_fisica > 0) AS stock_activo,
      (SELECT COALESCE(SUM(cantidad_fisica * costo_unitario_promedio), 0) FROM sch_leangsp.tinv_stock) AS valor_stock,
      (SELECT COUNT(*) FROM sch_leangsp.tinv_movimiento) AS kardex_movs;
  `;
  const countRes = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -A -c \\"${checkSql.replace(/\n/g, ' ')}\\""`);
  console.log('   Conteos:', countRes.stdout.trim());

  console.log('\n5. Reiniciando PM2 DEV (10)...');
  await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
  await new Promise(r => setTimeout(r, 2000));

  console.log('\n6. Verificando endpoints en DEV (http://127.0.0.1:3006)...');
  const testBodegas = await ssh.execCommand('curl -s "http://127.0.0.1:3006/api/inventario/bodegas"');
  console.log('   GET /bodegas:\n  ', testBodegas.stdout.substring(0, 200));

  const testUbicaciones = await ssh.execCommand('curl -s "http://127.0.0.1:3006/api/inventario/ubicaciones"');
  console.log('   GET /ubicaciones:\n  ', testUbicaciones.stdout.substring(0, 200));

  const testProductos = await ssh.execCommand('curl -s "http://127.0.0.1:3006/api/inventario/productos"');
  console.log('   GET /productos:\n  ', testProductos.stdout.substring(0, 200));

  const testExistencias = await ssh.execCommand('curl -s "http://127.0.0.1:3006/api/inventario/existencias"');
  console.log('   GET /existencias:\n  ', testExistencias.stdout.substring(0, 200));

  const testAlertas = await ssh.execCommand('curl -s "http://127.0.0.1:3006/api/inventario/alertas/reposicion"');
  console.log('   GET /alertas/reposicion:\n  ', testAlertas.stdout.substring(0, 200));

  ssh.dispose();
  console.log('\n🎉 Parche y verificación completados.');
}

patchAndSeed().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
