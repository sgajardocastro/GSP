const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const https = require('https');
const ssh = new NodeSSH();

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, body: body.slice(0, 400) });
      });
    }).on('error', (e) => {
      resolve({ error: e.message });
    });
  });
}

async function deploy() {
  console.log('=== Despliegue Integral Spec 87 (Bloques 1, 2 y 3) a DEV ===');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });
  console.log('Conexión SSH establecida con éxito.\n');

  const backendBase = '/home/nodeadmin/proyectos/lean-services-gsp';

  const filesToTransfer = [
    { local: '../ejecucion/backend_remoto/src/models/aprobacionGerenciaModel.js', remote: `${backendBase}/src/models/aprobacionGerenciaModel.js` },
    { local: '../ejecucion/backend_remoto/src/controllers/aprobacionGerenciaController.js', remote: `${backendBase}/src/controllers/aprobacionGerenciaController.js` },
    { local: '../ejecucion/backend_remoto/src/routes/aprobacionGerenciaRoutes.js', remote: `${backendBase}/src/routes/aprobacionGerenciaRoutes.js` },
    { local: '../ejecucion/backend_remoto/src/models/comprasModel.js', remote: `${backendBase}/src/models/comprasModel.js` },
    { local: '../ejecucion/backend_remoto/src/controllers/comprasController.js', remote: `${backendBase}/src/controllers/comprasController.js` },
    { local: '../ejecucion/backend_remoto/src/routes/comprasRoutes.js', remote: `${backendBase}/src/routes/comprasRoutes.js` },
    { local: '../ejecucion/backend_remoto/src/models/proyectoModel.js', remote: `${backendBase}/src/models/proyectoModel.js` },
    { local: '../ejecucion/backend_remoto/src/models/viajeModel.js', remote: `${backendBase}/src/models/viajeModel.js` },
    { local: '../ejecucion/backend_remoto/src/controllers/proyectosController.js', remote: `${backendBase}/src/controllers/proyectosController.js` },
    { local: '../ejecucion/backend_remoto/src/routes/proyectoRoutes.js', remote: `${backendBase}/src/routes/proyectoRoutes.js` },
    { local: '../ejecucion/backend_remoto/src/routes/index.js', remote: `${backendBase}/src/routes/index.js` }
  ];

  console.log('--- 1. TRANSFERIENDO ARCHIVOS BACKEND A DEV ---');
  for (const f of filesToTransfer) {
    const absLocal = path.resolve(__dirname, f.local);
    console.log(`Subiendo ${path.basename(absLocal)} -> ${f.remote}...`);
    await ssh.putFile(absLocal, f.remote);
  }

  await ssh.execCommand(`chown -R nodeadmin:nodeadmin ${backendBase}/src/models ${backendBase}/src/controllers ${backendBase}/src/routes`);
  console.log('Permisos corregidos para nodeadmin en backend.\n');

  console.log('--- 2. NORMALIZANDO REQUERIMIENTOS INTERNOS EN BD DEV (ESTADO 4 ASIGNACIÓN, SIN VB OMAR) ---');
  const sqlFix = `
    SET search_path TO sch_leangsp;
    UPDATE tpry_proyecto
    SET id_proyecto_estado = CASE WHEN id_proyecto_estado < 4 THEN 4 ELSE id_proyecto_estado END,
        estado_vb_gerencia = 'NO_REQUERIDO',
        sucursal_origen = CASE WHEN sucursal_origen IN ('Temuco', 'Valdivia', 'Puerto Montt', 'Los Ángeles') THEN sucursal_origen ELSE 'Temuco' END,
        sucursal_destino = CASE WHEN sucursal_destino IN ('Temuco', 'Valdivia', 'Puerto Montt', 'Los Ángeles') THEN sucursal_destino ELSE 'Puerto Montt' END,
        json_field = jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(
                COALESCE(json_field, '{}'::jsonb),
                '{crm_v1,requiere_vb_gerencia}', 'false'::jsonb, true
              ),
              '{crm_v1,estado_vb_gerencia}', '"NO_REQUERIDO"'::jsonb, true
            ),
            '{ejecucion_v1,estado_requerimiento}', '"APROBADO"'::jsonb, true
          ),
          '{ejecucion_v1,subtab_activa}', '"asignacion"'::jsonb, true
        )
    WHERE es_interno = true OR codi_proyecto LIKE 'INT-%';
    DELETE FROM tapr_gerencia_token WHERE tipo_entidad = 'REQUERIMIENTO_INTERNO';
  `;
  const dbFixRes = await ssh.execCommand(`sudo -u postgres psql -d postgres -c '${sqlFix.replace(/'/g, "'\\''")}'`);
  console.log(dbFixRes.stdout || dbFixRes.stderr);

  console.log('--- 2B. REINICIANDO PROCESO PM2 10 (lean-services-gsp DEV) ---');
  const pm2Res = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
  console.log(pm2Res.stdout || pm2Res.stderr);
  await new Promise(r => setTimeout(r, 3500));
  const logRes = await ssh.execCommand('su - nodeadmin -c "pm2 logs 10 --lines 25 --nostream"');
  console.log(logRes.stdout || logRes.stderr);

  console.log('--- 3. SUBIENDO FRONTEND WEB A DEV (/var/www/html/lg-gsp-dev) ---');
  const localWebDist = path.resolve(__dirname, '../ejecucion/frontend/dist_dev');
  const remoteWebDev = '/var/www/html/lg-gsp-dev';

  const statusWeb = await ssh.putDirectory(localWebDist, remoteWebDev, {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.map')
  });
  if (!statusWeb) throw new Error('Fallo al transferir Frontend Web a DEV');
  await ssh.execCommand(`chown -R nginx:nginx ${remoteWebDev} && chmod -R 755 ${remoteWebDev}`);
  console.log('Frontend Web actualizado en DEV.\n');

  ssh.dispose();

  console.log('--- 4. VERIFICANDO RESPUESTA HTTP EN VIVO ---');
  const webCheck = await checkUrl('https://servidor.leanglobal.cl/lg-gsp-dev/');
  console.log(`GET /lg-gsp-dev/ -> Status: ${webCheck.status}`);

  const comprasCheck = await checkUrl('https://servidor.leanglobal.cl/lg-gsp-dev/api/compras/resumen');
  console.log(`GET /api/compras/resumen -> Status: ${comprasCheck.status} | Body: ${comprasCheck.body}`);

  const aprobCheck = await checkUrl('https://servidor.leanglobal.cl/lg-gsp-dev/api/aprobaciones-gerencia/pendientes');
  console.log(`GET /api/aprobaciones-gerencia/pendientes -> Status: ${aprobCheck.status} | Body: ${aprobCheck.body}`);

  console.log('\n=== Despliegue Spec 87 completado exitosamente ===');
}

deploy().catch((err) => {
  console.error('Error durante el despliegue:', err);
  process.exit(1);
});
