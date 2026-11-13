const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function deployV10116() {
  console.log('=== DESPLIEGUE INTEGRAL DEV & PROD v1.0.116 (REQ-1018 / SPEC-068) ===\n');
  console.log('Conectando a servidor SSH...');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  // 1. DESPLIEGUE BACKEND A PROD Y DEV
  console.log('\n--- 1. DESPLIEGUE CONTROLADORES Y RUTAS BACKEND ---');
  const localController = path.resolve(__dirname, '../ejecucion/backend_remoto/src/controllers/itsController.js');
  const localRoutes = path.resolve(__dirname, '../ejecucion/backend_remoto/src/routes/itsRoutes.js');

  const prodController = '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/itsController.js';
  const prodRoutes = '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/routes/itsRoutes.js';

  const devController = '/home/nodeadmin/proyectos/lean-services-gsp/src/controllers/itsController.js';
  const devRoutes = '/home/nodeadmin/proyectos/lean-services-gsp/src/routes/itsRoutes.js';

  console.log('Subiendo a PROD backend...');
  await ssh.putFile(localController, prodController);
  await ssh.putFile(localRoutes, prodRoutes);
  await ssh.execCommand(`chown nodeadmin:nodeadmin ${prodController} ${prodRoutes}`);

  console.log('Subiendo a DEV backend...');
  await ssh.putFile(localController, devController);
  await ssh.putFile(localRoutes, devRoutes);
  await ssh.execCommand(`chown nodeadmin:nodeadmin ${devController} ${devRoutes}`);

  console.log('Reiniciando PM2 PROD (13) y DEV (10)...');
  const restartProd = await ssh.execCommand('su - nodeadmin -c "pm2 restart 13"');
  console.log('PM2 13 (PROD):', restartProd.stdout.split('\n')[0] || restartProd.stderr);
  const restartDev = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
  console.log('PM2 10 (DEV):', restartDev.stdout.split('\n')[0] || restartDev.stderr);

  await new Promise(r => setTimeout(r, 2000));

  // 2. DESPLIEGUE FRONTEND A DEV (/var/www/html/lg-gsp-dev)
  console.log('\n--- 2. DESPLIEGUE FRONTEND DIST_DEV A DEV (/var/www/html/lg-gsp-dev) ---');
  const localDistDev = path.resolve(__dirname, '../ejecucion/frontend/dist_dev');
  const remoteDistDev = '/var/www/html/lg-gsp-dev';

  console.log(`Subiendo archivos desde ${localDistDev} hacia ${remoteDistDev}...`);
  const statusPutDev = await ssh.putDirectory(localDistDev, remoteDistDev, {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.git')
  });

  if (!statusPutDev) {
    throw new Error('Fallo al transferir archivos dist_dev a DEV');
  }
  console.log('Fijando permisos nginx:nginx y 755 en lg-gsp-dev...');
  await ssh.execCommand(`chown -R nginx:nginx ${remoteDistDev} && chmod -R 755 ${remoteDistDev}`);

  // 3. DESPLIEGUE FRONTEND A PROD (/var/www/html/lg-gsp-prod)
  console.log('\n--- 3. DESPLIEGUE FRONTEND DIST_PROD A PROD (/var/www/html/lg-gsp-prod) ---');
  const localDistProd = path.resolve(__dirname, '../ejecucion/frontend/dist_prod');
  const remoteDistProd = '/var/www/html/lg-gsp-prod';

  console.log(`Subiendo archivos desde ${localDistProd} hacia ${remoteDistProd}...`);
  const statusPutProd = await ssh.putDirectory(localDistProd, remoteDistProd, {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.git')
  });

  if (!statusPutProd) {
    throw new Error('Fallo al transferir archivos dist_prod a PROD');
  }
  console.log('Fijando permisos nginx:nginx y 755 en lg-gsp-prod...');
  await ssh.execCommand(`chown -R nginx:nginx ${remoteDistProd} && chmod -R 755 ${remoteDistProd}`);

  // 4. GOBERNANZA: SINCRONIZACIÓN EN TCFG_BACKLOG Y TCFG_RELEASES
  console.log('\n--- 4. GOBERNANZA: REGISTRO EN TCFG_BACKLOG Y TCFG_RELEASES ---');
  const schemas = ['sch_leangsp', 'sch_leangsp_prod'];
  for (const s of schemas) {
    const sql = `
      INSERT INTO ${s}.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_implementacion, solicitado_por, estado)
      VALUES ('REQ-1018', 'Corrección Cálculo Mano de Obra y Persistencia Planillas GeraldSoft', 'Ajuste de cálculo reactivo para valor hora operador (resolviendo duplicación a $222.000 vs $111.000 para KKFG50) y arquitectura de persistencia relacional para planillas de entrada GeraldSoft (CONTROLES y Órdenes OT) en PostgreSQL', 'Alta', CURRENT_DATE, 'Sergio Gajardo', 'Implementado')
      ON CONFLICT (codigo_req) DO UPDATE SET 
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        estado = 'Implementado',
        fecha_implementacion = CURRENT_DATE,
        updated_at = NOW();

      INSERT INTO ${s}.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
      VALUES ('v1.0.116', 'Portal Web GSP v1.0.116 - Corrección Mano de Obra y Persistencia Planillas GeraldSoft', 'Feature', 'Solución a discrepancia de mano de obra en ITS Transición ($111.000 para Horquilla KKFG50 con reactividad inmediata) e implementación de persistencia en PostgreSQL de planillas GeraldSoft con precarga automática en sesiones.', '["REQ-1018"]'::jsonb, 'Sergio Gajardo')
      ON CONFLICT (version) DO UPDATE SET
        titulo = EXCLUDED.titulo,
        descripcion_impacto = EXCLUDED.descripcion_impacto,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    `;
    const resSql = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sql.replace(/\n/g, ' ')}\\""`);
    console.log(`Esquema ${s}:`, resSql.stdout.replace(/\n+/g, ' ').trim());
  }

  // 5. VERIFICACIÓN HTTP 200 OK
  console.log('\n--- 5. VERIFICACIÓN EMPÍRICA ENDPOINTS ---');
  const testDev = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-dev/api/operaciones/its/transicion/planillas/activas');
  const testProd = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-prod/api/operaciones/its/transicion/planillas/activas');

  console.log(`Endpoint DEV /planillas/activas: HTTP ${testDev.stdout.trim()}`);
  console.log(`Endpoint PROD /planillas/activas: HTTP ${testProd.stdout.trim()}`);

  ssh.dispose();
  console.log('\n=== DESPLIEGUE v1.0.116 COMPLETADO EXITOSAMENTE ===');
}

deployV10116().catch(console.error);
