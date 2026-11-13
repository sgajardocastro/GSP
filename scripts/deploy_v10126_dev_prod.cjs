const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function deployDevProdV10126() {
  console.log('=== DESPLIEGUE A DEV Y PROD v1.0.126 (REQ-1028 / SPEC-073) ===\n');
  console.log('Conectando a servidor SSH...');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  // 1. DESPLIEGUE CONTROLADORES Y RUTAS BACKEND
  console.log('\n--- 1. DESPLIEGUE BACKEND A DEV Y PROD ---');
  const localController = path.resolve(__dirname, '../ejecucion/backend_remoto/src/controllers/itsController.js');
  const localRoutes = path.resolve(__dirname, '../ejecucion/backend_remoto/src/routes/itsRoutes.js');

  const devController = '/home/nodeadmin/proyectos/lean-services-gsp/src/controllers/itsController.js';
  const devRoutes = '/home/nodeadmin/proyectos/lean-services-gsp/src/routes/itsRoutes.js';

  const prodController = '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/itsController.js';
  const prodRoutes = '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/routes/itsRoutes.js';

  console.log('1.1 Subiendo a DEV backend...');
  await ssh.putFile(localController, devController);
  await ssh.putFile(localRoutes, devRoutes);
  await ssh.execCommand(`chown nodeadmin:nodeadmin ${devController} ${devRoutes}`);

  console.log('1.2 Subiendo a PROD backend...');
  await ssh.putFile(localController, prodController);
  await ssh.putFile(localRoutes, prodRoutes);
  await ssh.execCommand(`chown nodeadmin:nodeadmin ${prodController} ${prodRoutes}`);

  console.log('1.3 Reiniciando PM2 DEV (10) y PROD (13)...');
  const restartDev = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
  console.log('PM2 10 (DEV):', restartDev.stdout.split('\n')[0] || restartDev.stderr);
  const restartProd = await ssh.execCommand('su - nodeadmin -c "pm2 restart 13"');
  console.log('PM2 13 (PROD):', restartProd.stdout.split('\n')[0] || restartProd.stderr);

  await new Promise(r => setTimeout(r, 2000));

  // 2. DESPLIEGUE FRONTEND
  console.log('\n--- 2. DESPLIEGUE FRONTEND DIST A DEV Y PROD ---');
  const localDist = path.resolve(__dirname, '../ejecucion/frontend/dist');
  const remoteDevDist = '/var/www/html/lg-gsp-dev';
  const remoteProdDist = '/var/www/html/lg-gsp-prod';

  console.log(`2.1 Subiendo a DEV (${remoteDevDist})...`);
  const statusDev = await ssh.putDirectory(localDist, remoteDevDist, {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.git')
  });
  if (!statusDev) throw new Error('Fallo al transferir dist a DEV');

  console.log(`2.2 Subiendo a PROD (${remoteProdDist})...`);
  const statusProd = await ssh.putDirectory(localDist, remoteProdDist, {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.git')
  });
  if (!statusProd) throw new Error('Fallo al transferir dist a PROD');

  console.log('2.3 Ajustando permisos nginx:nginx y 755...');
  await ssh.execCommand(`chown -R nginx:nginx ${remoteDevDist} && chmod -R 755 ${remoteDevDist}`);
  await ssh.execCommand(`chown -R nginx:nginx ${remoteProdDist} && chmod -R 755 ${remoteProdDist}`);

  // 3. GOBERNANZA: SINCRONIZACIÓN EN TCFG_BACKLOG Y TCFG_RELEASES
  console.log('\n--- 3. GOBERNANZA: REGISTRO EN TCFG_BACKLOG Y TCFG_RELEASES ---');
  const schemas = ['sch_leangsp', 'sch_leangsp_prod'];
  for (const s of schemas) {
    const sql = `
      INSERT INTO ${s}.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_implementacion, solicitado_por, estado)
      VALUES (
        'REQ-1028',
        'Colaboración Universal, Visibilidad Multi-Usuario y Autoguardado en Nube de ITS Transición',
        'SPEC-073: Autoguardado inmediato en servidor al elaborar ITS, visibilidad multi-usuario con autor en Matriz Operativa de Conciliación, botón continuar colaborativo y erradicación de almacenamiento local aislado.',
        'Alta',
        CURRENT_DATE,
        'Sergio Gajardo',
        'Implementado'
      )
      ON CONFLICT (codigo_req) DO UPDATE SET 
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        estado = 'Implementado',
        fecha_implementacion = CURRENT_DATE,
        updated_at = NOW();

      INSERT INTO ${s}.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
      VALUES (
        '1.0.126',
        'Colaboración Universal, Visibilidad Multi-Usuario y Autoguardado en Nube de ITS Transición (SPEC-073)',
        'FEATURE',
        'Se erradica el aislamiento local de los ITS elaborados. Ahora se crea de inmediato un borrador compartido en PostgreSQL visible para toda la organización con el nombre del elaborador, sincronización automática y botón continuar colaborativo.',
        'REQ-1028',
        'Sergio Gajardo'
      )
      ON CONFLICT (version) DO UPDATE SET
        titulo = EXCLUDED.titulo,
        descripcion_impacto = EXCLUDED.descripcion_impacto,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados,
        fecha_release = CURRENT_TIMESTAMP;
    `;
    const resSql = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sql.replace(/\n/g, ' ')}\\""`);
    console.log(`Gobernanza ${s}:`, resSql.stdout || resSql.stderr);
  }

  // 4. VERIFICACIÓN EMPÍRICA HTTP
  console.log('\n--- 4. VERIFICACIÓN EMPÍRICA HTTP ---');
  const resHttpDev = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-dev/');
  console.log('HTTP Status DEV (Frontend):', resHttpDev.stdout.trim());

  const resHttpProd = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-prod/');
  console.log('HTTP Status PROD (Frontend):', resHttpProd.stdout.trim());

  const resApiDev = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" http://localhost:3006/api/operaciones/its/transicion/list');
  console.log('HTTP Status DEV (API PM2 10):', resApiDev.stdout.trim());

  const resApiProd = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" http://localhost:3007/api/operaciones/its/transicion/list');
  console.log('HTTP Status PROD (API PM2 13):', resApiProd.stdout.trim());

  ssh.dispose();
  console.log('\n=== DESPLIEGUE A DEV Y PROD v1.0.126 FINALIZADO CON ÉXITO ===');
}

deployDevProdV10126().catch(err => {
  console.error('Error durante despliegue:', err);
  process.exit(1);
});
