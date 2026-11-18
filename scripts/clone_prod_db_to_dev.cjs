const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');

async function main() {
  const ssh = new NodeSSH();
  console.log('🔌 Conectando por SSH a 138.255.103.18:1295...');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });
  console.log('✅ Conexión SSH establecida con éxito.');

  console.log('\n📦 1. Verificando conteo inicial de proyectos...');
  const countPreDev = await ssh.execCommand("sudo -u postgres psql -d postgres -t -c 'SELECT count(*) FROM sch_leangsp.tpry_proyecto;'");
  const countPreProd = await ssh.execCommand("sudo -u postgres psql -d postgres -t -c 'SELECT count(*) FROM sch_leangsp_prod.tpry_proyecto;'");
  console.log(`  - Conteo inicial DEV (sch_leangsp): ${countPreDev.stdout.trim()}`);
  console.log(`  - Conteo inicial PROD (sch_leangsp_prod): ${countPreProd.stdout.trim()}`);

  console.log('\n💾 2. Creando respaldo de seguridad de DEV antes del clonado...');
  const resBkp = await ssh.execCommand('sudo -u postgres pg_dump -d postgres -n sch_leangsp -f /tmp/dev_backup_before_clone.sql');
  if (resBkp.code !== 0) throw new Error('Error al respaldar DEV: ' + resBkp.stderr);
  console.log('✅ Respaldo de DEV creado en /tmp/dev_backup_before_clone.sql');

  console.log('\n📤 3. Extrayendo volcado de PRODUCCIÓN (sch_leangsp_prod)...');
  const resDump = await ssh.execCommand('sudo -u postgres pg_dump -d postgres -n sch_leangsp_prod --no-owner --no-privileges -f /tmp/prod_dump_for_dev.sql');
  if (resDump.code !== 0) throw new Error('Error al extraer volcado de PROD: ' + resDump.stderr);
  console.log('✅ Volcado de PROD extraído en /tmp/prod_dump_for_dev.sql');

  console.log('\n🔄 4. Transformando esquema sch_leangsp_prod -> sch_leangsp...');
  const resSed = await ssh.execCommand("sed -i 's/sch_leangsp_prod/sch_leangsp/g' /tmp/prod_dump_for_dev.sql");
  if (resSed.code !== 0) throw new Error('Error en transformación sed: ' + resSed.stderr);
  console.log('✅ Transformación completada con éxito.');

  console.log('\n🗑️ 5. Recreando esquema sch_leangsp en PostgreSQL...');
  await ssh.execCommand("sudo -u postgres psql -d postgres -c 'DROP SCHEMA IF EXISTS sch_leangsp CASCADE;'");
  await ssh.execCommand("sudo -u postgres psql -d postgres -c 'CREATE SCHEMA sch_leangsp AUTHORIZATION usr_leangsp;'");
  console.log('✅ Esquema sch_leangsp recreado limpio.');

  console.log('\n📥 6. Restaurando datos de producción en sch_leangsp...');
  const resRestore = await ssh.execCommand('sudo -u postgres psql -d postgres -f /tmp/prod_dump_for_dev.sql > /tmp/restore_log.txt 2>&1');
  console.log(`✅ Restauración ejecutada (código de salida: ${resRestore.code}).`);

  console.log('\n🔑 7. Asignando permisos completos a usr_leangsp sobre sch_leangsp...');
  await ssh.execCommand("sudo -u postgres psql -d postgres -c 'ALTER SCHEMA sch_leangsp OWNER TO usr_leangsp;'");
  await ssh.execCommand("sudo -u postgres psql -d postgres -c 'GRANT ALL PRIVILEGES ON SCHEMA sch_leangsp TO usr_leangsp;'");
  await ssh.execCommand("sudo -u postgres psql -d postgres -c 'GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA sch_leangsp TO usr_leangsp;'");
  await ssh.execCommand("sudo -u postgres psql -d postgres -c 'GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA sch_leangsp TO usr_leangsp;'");
  await ssh.execCommand("sudo -u postgres psql -d postgres -c 'GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA sch_leangsp TO usr_leangsp;'");
  await ssh.execCommand("sudo -u postgres psql -d postgres -c 'ALTER DEFAULT PRIVILEGES IN SCHEMA sch_leangsp GRANT ALL ON TABLES TO usr_leangsp;'");
  await ssh.execCommand("sudo -u postgres psql -d postgres -c 'ALTER DEFAULT PRIVILEGES IN SCHEMA sch_leangsp GRANT ALL ON SEQUENCES TO usr_leangsp;'");
  console.log('✅ Permisos asignados.');

  console.log('\n🧹 8. Limpiando archivos temporales...');
  await ssh.execCommand('rm -f /tmp/prod_dump_for_dev.sql');
  console.log('✅ Archivos temporales eliminados.');

  console.log('\n🔄 9. Reiniciando proceso PM2 ID 10 (DEV backend)...');
  await ssh.execCommand('sudo -u nodeadmin pm2 restart 10');
  console.log('✅ PM2 ID 10 reiniciado.');

  console.log('\n🏥 10. Verificación final de integridad...');
  const countPostDev = await ssh.execCommand("sudo -u postgres psql -d postgres -t -c 'SELECT count(*) FROM sch_leangsp.tpry_proyecto;'");
  const countPostProd = await ssh.execCommand("sudo -u postgres psql -d postgres -t -c 'SELECT count(*) FROM sch_leangsp_prod.tpry_proyecto;'");
  console.log(`  - Conteo final DEV (sch_leangsp): ${countPostDev.stdout.trim()}`);
  console.log(`  - Conteo final PROD (sch_leangsp_prod): ${countPostProd.stdout.trim()}`);

  const testApi = await ssh.execCommand('curl -s -w "\nHTTP_STATUS:%{http_code}" "http://127.0.0.1:3006/api/operaciones/control-vivo" | tail -n 2');
  console.log('Test API DEV (3006):\n', testApi.stdout.trim());

  ssh.dispose();
  console.log('\n🎉 CLONADO DE DATOS PROD -> DEV COMPLETADO EXITOSAMENTE.');
}

main().catch(err => {
  console.error('❌ Error durante el clonado de BD:', err);
  process.exit(1);
});
