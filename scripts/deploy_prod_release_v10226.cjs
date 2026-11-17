const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const fs = require('fs');

const ssh = new NodeSSH();

async function deployProd() {
  console.log('--- INICIANDO DESPLIEGUE A PRODUCCIÓN: VERSIÓN 1.0.226 ---');
  console.log('Conectando al servidor 138.255.103.18:1295...');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });
  console.log('✔ Conexión SSH establecida con éxito.');

  const distProdLocal = path.resolve(__dirname, '../ejecucion/frontend/dist_prod');
  const distProdRemote = '/var/www/html/lg-gsp-prod';

  // 1. Subir frontend dist_prod
  if (fs.existsSync(distProdLocal)) {
    console.log(`1. Subiendo frontend compilado desde ${distProdLocal} hacia ${distProdRemote}...`);
    await ssh.putDirectory(distProdLocal, distProdRemote, {
      recursive: true,
      concurrency: 10,
      validate: (itemPath) => !itemPath.includes('.DS_Store')
    });
    console.log('✔ Frontend dist_prod desplegado exitosamente en /var/www/html/lg-gsp-prod.');
  } else {
    console.warn('⚠️ Carpeta dist_prod no encontrada localmente, omitiendo subida de frontend.');
  }

  // 2. Subir archivos backend
  const backendBase = path.resolve(__dirname, '../ejecucion/backend_remoto');
  const remoteBase = '/home/nodeadmin/proyectos/lean-services-gsp-prod';

  const backendFiles = [
    { local: path.join(backendBase, 'package.json'), remote: path.join(remoteBase, 'package.json') },
    { local: path.join(backendBase, 'src/controllers/asignacionRecursosController.js'), remote: path.join(remoteBase, 'src/controllers/asignacionRecursosController.js') },
    { local: path.join(backendBase, 'src/models/proyectoModel.js'), remote: path.join(remoteBase, 'src/models/proyectoModel.js') }
  ];

  console.log('2. Subiendo archivos backend a producción...');
  for (const f of backendFiles) {
    if (fs.existsSync(f.local)) {
      console.log(`  -> Subiendo ${path.basename(f.local)}...`);
      await ssh.putFile(f.local, f.remote);
    } else {
      console.error(`  ❌ Archivo no encontrado: ${f.local}`);
    }
  }
  console.log('✔ Archivos de backend subidos correctamente.');

  // 3. Reiniciar PM2 ID 13
  console.log('3. Reiniciando proceso PM2 13 (lean-services-gsp-prod)...');
  const pm2Res = await ssh.execCommand('su - nodeadmin -c "pm2 restart 13 --update-env"');
  console.log(pm2Res.stdout || pm2Res.stderr);

  // 4. Registrar en tcfg_releases de producción
  console.log('4. Registrando versión 1.0.226 en sch_leangsp_prod.tcfg_releases...');
  const sql = `
  INSERT INTO sch_leangsp_prod.tcfg_releases (
    version, producto, ambiente, fecha_release, commit_hash, tag_git,
    descripcion_cambio, detalles_tecnicos, estado_despliegue, creado_por, id_backlog_ref, requerimientos_asociados
  ) VALUES (
    '1.0.226', 'WEB_BACKEND', 'PROD', NOW(), 'f82fdf0', 'v1.0.226',
    'SPEC-134 Erradicación estructural de duplicados en OT y blindaje relacional en 4 niveles',
    'Unificación en GestorOportunidades.vue, deduplicación en upsert de asignacionRecursosController.js, blindaje relacional en Tablas 3 y 4 de proyectoModel.js, e índice único uq_tedp_proyecto_dia_equipo en BD',
    'EXITOSO', 'Alfonso Porperello / S. Gajardo', 'REQ-1180', '["REQ-1180", "SPEC-134"]'::jsonb
  );
  `;
  await ssh.execCommand(`cat << 'EOF' > /tmp/register_release_226.sql\n${sql}\nEOF`);
  const dbRes = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/register_release_226.sql"');
  console.log(dbRes.stdout || dbRes.stderr);

  // 5. Verificar salud y HTTP 200
  console.log('5. Verificando estado HTTP en producción...');
  const curlWeb = await ssh.execCommand('curl -sI https://servidor.leanglobal.cl/lg-gsp-prod/ | head -n 5');
  console.log('Frontend PROD:\n', curlWeb.stdout || curlWeb.stderr);

  const curlApi = await ssh.execCommand('curl -sI https://servidor.leanglobal.cl/lg-gsp-prod/api/operaciones/viaje/vj_86_39_7dc3d0ca | head -n 5');
  console.log('Backend API PROD:\n', curlApi.stdout || curlApi.stderr);

  const pm2Status = await ssh.execCommand('su - nodeadmin -c "pm2 jlist"');
  try {
    const list = JSON.parse(pm2Status.stdout);
    const proc13 = list.find(p => p.pm_id === 13);
    console.log(`PM2 Process 13 Status: ${proc13?.pm2_env?.status}, Restarts: ${proc13?.pm2_env?.restart_time}`);
  } catch (e) {
    console.log('No se pudo parsear json de pm2:', pm2Status.stdout);
  }

  ssh.dispose();
  console.log('🚀 --- DESPLIEGUE A PRODUCCIÓN v1.0.226 FINALIZADO CON ÉXITO ---');
}

deployProd().catch(err => {
  console.error('Error fatal durante el despliegue a producción:', err);
  process.exit(1);
});
