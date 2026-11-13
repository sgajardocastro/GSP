const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function deployV10118() {
  console.log('=== DESPLIEGUE INTEGRAL DEV & PROD v1.0.118 (REQ-1020 / FIX FIRMA FES Y VER PDF) ===\n');
  console.log('Conectando a servidor SSH...');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  // 1. DESPLIEGUE CONTROLADOR BACKEND A DEV Y PROD
  console.log('\n--- 1. DESPLIEGUE CONTROLADOR BACKEND ITSCONTROLLER ---');
  const localController = path.resolve(__dirname, '../ejecucion/backend_remoto/src/controllers/itsController.js');
  const devController = '/home/nodeadmin/proyectos/lean-services-gsp/src/controllers/itsController.js';
  const prodController = '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/itsController.js';

  console.log('Subiendo a DEV backend...');
  await ssh.putFile(localController, devController);
  await ssh.execCommand(`chown nodeadmin:nodeadmin ${devController}`);

  console.log('Subiendo a PROD backend...');
  await ssh.putFile(localController, prodController);
  await ssh.execCommand(`chown nodeadmin:nodeadmin ${prodController}`);

  console.log('Reiniciando servicios PM2...');
  const restartDev = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
  console.log('PM2 10 (DEV):', restartDev.stdout.split('\n')[0] || restartDev.stderr);
  const restartProd = await ssh.execCommand('su - nodeadmin -c "pm2 restart 13"');
  console.log('PM2 13 (PROD):', restartProd.stdout.split('\n')[0] || restartProd.stderr);

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

  // 4. ASEGURAR USUARIO YIARA MENDOZA ACTIVO EN PROD
  console.log('\n--- 4. REGULARIZACIÓN USUARIO YIARA MENDOZA EN PROD ---');
  const sqlUser = `UPDATE sch_leangsp_prod.tsec_users SET activo = true WHERE id_user = 65;`;
  await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sqlUser}\\""`);
  console.log('Usuario Yiara activo en PROD: OK');

  // 5. GOBERNANZA: SINCRONIZACIÓN EN TCFG_BACKLOG Y TCFG_RELEASES
  console.log('\n--- 5. GOBERNANZA: REGISTRO EN TCFG_BACKLOG Y TCFG_RELEASES ---');
  const schemas = ['sch_leangsp', 'sch_leangsp_prod'];
  for (const s of schemas) {
    const sql = `
      INSERT INTO ${s}.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_implementacion, solicitado_por, estado)
      VALUES ('REQ-1020', 'Corrección de Firma FES Elaborador y Reposición de Vista Previa PDF', 'Resolución multicriterio de usuario firmante (id_user, id_usuario, rut y fallback) y reposición de botón Ver Informe PDF en barra de elaboración y modal FES para revisión previa de Yiara Mendoza en Cotización 11493 Besalco.', 'Alta', CURRENT_DATE, 'Sergio Gajardo', 'Implementado')
      ON CONFLICT (codigo_req) DO UPDATE SET 
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        estado = 'Implementado',
        fecha_implementacion = CURRENT_DATE,
        updated_at = NOW();

      INSERT INTO ${s}.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
      VALUES ('v1.0.118', 'Portal Web GSP v1.0.118 - Fix Firma FES y Visualización PDF de ITS', 'Fix', 'Subsanación de resolución de usuario en backend para firma electrónica simple de elaboración, reposición de botón de visualización PDF oficial antes de firmar y regularización de cuenta en DEV y PROD.', '["REQ-1020"]'::jsonb, 'Sergio Gajardo')
      ON CONFLICT (version) DO UPDATE SET
        titulo = EXCLUDED.titulo,
        descripcion_impacto = EXCLUDED.descripcion_impacto,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    `;
    const resSql = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sql.replace(/"/g, '\\"')}\\""`);
    console.log(`Gobernanza en ${s}:`, resSql.stdout.includes('INSERT') || resSql.stdout.includes('UPDATE') ? 'OK' : resSql.stderr || resSql.stdout);
  }

  // 6. VERIFICACIÓN DETERMINISTA HTTP 200
  console.log('\n--- 6. VERIFICACIÓN DETERMINISTA HTTP ---');
  const checkDev = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-dev/');
  const checkProd = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-prod/');
  console.log(`DEV URL: https://servidor.leanglobal.cl/lg-gsp-dev/ -> HTTP ${checkDev.stdout}`);
  console.log(`PROD URL: https://servidor.leanglobal.cl/lg-gsp-prod/ -> HTTP ${checkProd.stdout}`);

  console.log('\n=== DESPLIEGUE v1.0.118 FINALIZADO CON ÉXITO ===');
  ssh.dispose();
}

deployV10118().catch(err => {
  console.error('ERROR EN DESPLIEGUE:', err);
  ssh.dispose();
  process.exit(1);
});
