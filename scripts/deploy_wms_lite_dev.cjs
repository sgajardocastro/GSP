const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function deployWmsLiteDev() {
  console.log('================================================================');
  console.log('🚀 DESPLIEGUE WMS-LITE E INVENTARIO CANÓNICO EN DEV (GSP)');
  console.log('================================================================\n');

  const password = process.env.SSH_PASSWORD || 'lgbl2025.';

  console.log('1. Conectando a servidor SSH (138.255.103.18:1295)...');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: password,
    port: 1295
  });
  console.log('   ✓ Conexión SSH establecida.\n');

  // ---------------------------------------------------------------------------
  // PASO A: APLICAR DDL CANÓNICO
  // ---------------------------------------------------------------------------
  console.log('2. Aplicando DDL canónico (20261012_tinv_wms_lite_ddl.sql)...');
  const localDdl = path.resolve(__dirname, '../ejecucion/bd/20261012_tinv_wms_lite_ddl.sql');
  const remoteDdl = '/tmp/20261012_tinv_wms_lite_ddl.sql';
  await ssh.putFile(localDdl, remoteDdl);
  await ssh.execCommand(`chmod 644 ${remoteDdl}`);

  const ddlRes = await ssh.execCommand(`su - postgres -c "psql -d postgres -f ${remoteDdl}"`);
  console.log('   Salida DDL (resumen):', ddlRes.stdout.split('\n').filter(l => l.includes('CREATE') || l.includes('ALTER') || l.includes('ERROR')).slice(0, 10).join(' | '));
  if (ddlRes.stderr && ddlRes.stderr.includes('ERROR')) {
    console.error('   ⚠️ Error en DDL:', ddlRes.stderr);
  } else {
    console.log('   ✓ DDL ejecutado exitosamente.');
  }

  // ---------------------------------------------------------------------------
  // PASO B: APLICAR SEED DE CARGA INICIAL
  // ---------------------------------------------------------------------------
  console.log('\n3. Aplicando Seed de Carga Inicial (seed_carga_inicial_inventario.sql)...');
  const localSeed = path.resolve(__dirname, '../ejecucion/bd/seed_carga_inicial_inventario.sql');
  const remoteSeed = '/tmp/seed_carga_inicial_inventario.sql';
  await ssh.putFile(localSeed, remoteSeed);
  await ssh.execCommand(`chmod 644 ${remoteSeed}`);

  const seedRes = await ssh.execCommand(`su - postgres -c "psql -d postgres -f ${remoteSeed}"`);
  console.log('   Salida Seed (resumen):', seedRes.stdout.split('\n').filter(l => l.includes('INSERT') || l.includes('ERROR')).slice(-5).join(' | '));
  if (seedRes.stderr && seedRes.stderr.includes('ERROR')) {
    console.error('   ⚠️ Advertencia en Seed:', seedRes.stderr);
  } else {
    console.log('   ✓ Seed de carga inicial aplicado correctamente.');
  }

  // ---------------------------------------------------------------------------
  // PASO C: VERIFICAR REGISTROS EN BASE DE DATOS
  // ---------------------------------------------------------------------------
  console.log('\n4. Verificando integridad de datos en PostgreSQL (sch_leangsp)...');
  const countSql = `
    SELECT 
      (SELECT COUNT(*) FROM sch_leangsp.tinv_bodega) AS total_bodegas,
      (SELECT COUNT(*) FROM sch_leangsp.tinv_ubicacion) AS total_ubicaciones,
      (SELECT COUNT(*) FROM sch_leangsp.tinv_producto) AS total_productos,
      (SELECT COUNT(*) FROM sch_leangsp.tinv_stock WHERE cantidad_fisica > 0) AS items_con_stock,
      (SELECT COALESCE(SUM(cantidad_fisica * costo_unitario_promedio), 0) FROM sch_leangsp.tinv_stock) AS valorizacion_total,
      (SELECT COUNT(*) FROM sch_leangsp.tinv_movimiento) AS total_movimientos_kardex;
  `;
  const countRes = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -A -c \\"${countSql.replace(/\n/g, ' ')}\\""`);
  console.log('   Conteos en BD (bodegas|ubicaciones|productos|items_stock|valorizacion|kardex):');
  console.log('   ->', countRes.stdout.trim());

  // ---------------------------------------------------------------------------
  // PASO D: DESPLEGAR BACKEND EN DEV
  // ---------------------------------------------------------------------------
  console.log('\n5. Desplegando archivos de Backend en DEV (/home/nodeadmin/proyectos/lean-services-gsp)...');
  const baseRemote = '/home/nodeadmin/proyectos/lean-services-gsp';
  const baseLocal = path.resolve(__dirname, '../ejecucion/backend_remoto');

  const files = [
    { local: 'src/models/inventarioModel.js', remote: `${baseRemote}/src/models/inventarioModel.js` },
    { local: 'src/controllers/inventarioController.js', remote: `${baseRemote}/src/controllers/inventarioController.js` },
    { local: 'src/routes/inventarioRoutes.js', remote: `${baseRemote}/src/routes/inventarioRoutes.js` },
    { local: 'src/routes/index.js', remote: `${baseRemote}/src/routes/index.js` }
  ];

  for (const f of files) {
    const lPath = path.join(baseLocal, f.local);
    console.log(`   Subiendo ${f.local}...`);
    await ssh.putFile(lPath, f.remote);
    await ssh.execCommand(`chown nodeadmin:nodeadmin ${f.remote}`);
  }

  console.log('\n6. Reiniciando PM2 DEV (10)...');
  const restartRes = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
  console.log('   PM2 Status:', restartRes.stdout.split('\n').find(l => l.includes('10')) || restartRes.stdout.trim());

  await new Promise(r => setTimeout(r, 2500));

  // ---------------------------------------------------------------------------
  // PASO E: TEST EN VIVO DE ENDPOINTS BACKEND DEV (PORT 3006)
  // ---------------------------------------------------------------------------
  console.log('\n7. Verificando endpoints en vivo en DEV (http://127.0.0.1:3006)...');
  
  const testBodegas = await ssh.execCommand('curl -s "http://127.0.0.1:3006/api/inventario/bodegas"');
  console.log('   GET /api/inventario/bodegas:\n  ', testBodegas.stdout.substring(0, 160));

  const testUbicaciones = await ssh.execCommand('curl -s "http://127.0.0.1:3006/api/inventario/ubicaciones"');
  console.log('   GET /api/inventario/ubicaciones:\n  ', testUbicaciones.stdout.substring(0, 160));

  const testProductos = await ssh.execCommand('curl -s "http://127.0.0.1:3006/api/inventario/productos"');
  console.log('   GET /api/inventario/productos:\n  ', testProductos.stdout.substring(0, 160));

  const testExistencias = await ssh.execCommand('curl -s "http://127.0.0.1:3006/api/inventario/existencias"');
  console.log('   GET /api/inventario/existencias:\n  ', testExistencias.stdout.substring(0, 160));

  // ---------------------------------------------------------------------------
  // PASO F: DESPLEGAR FRONTEND EN DEV
  // ---------------------------------------------------------------------------
  console.log('\n8. Desplegando Frontend en DEV (/var/www/html/lg-gsp-dev)...');
  const localDist = path.resolve(__dirname, '../ejecucion/frontend/dist');
  const remoteDir = '/var/www/html/lg-gsp-dev';

  const putStatus = await ssh.putDirectory(localDist, remoteDir, {
    recursive: true,
    concurrency: 10,
    validate: (p) => !p.includes('.git')
  });

  if (!putStatus) throw new Error('Error al sincronizar directorio dist con servidor remoto');

  await ssh.execCommand(`chown -R nginx:nginx ${remoteDir} && chmod -R 755 ${remoteDir}`);
  const httpDev = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-dev/');
  console.log(`   ✓ Frontend transferido. HTTP Status DEV: ${httpDev.stdout.trim()}`);

  ssh.dispose();
  console.log('\n================================================================');
  console.log('🎉 DESPLIEGUE Y MIGRACIÓN DEV COMPLETADOS CON ÉXITO');
  console.log('================================================================');
}

deployWmsLiteDev().catch(err => {
  console.error('\n❌ ERROR DURANTE DESPLIEGUE:', err);
  process.exit(1);
});
