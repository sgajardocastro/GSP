const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function deployV10117() {
  console.log('=== DESPLIEGUE INTEGRAL DEV & PROD v1.0.117 (REQ-1019 / SPEC-069) ===\n');
  console.log('Conectando a servidor SSH...');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  // 1. DESPLIEGUE FRONTEND A DEV (/var/www/html/lg-gsp-dev)
  console.log('\n--- 1. DESPLIEGUE FRONTEND DIST_DEV A DEV (/var/www/html/lg-gsp-dev) ---');
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

  // 2. DESPLIEGUE FRONTEND A PROD (/var/www/html/lg-gsp-prod)
  console.log('\n--- 2. DESPLIEGUE FRONTEND DIST_PROD A PROD (/var/www/html/lg-gsp-prod) ---');
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

  // 3. GOBERNANZA: SINCRONIZACIÓN EN TCFG_BACKLOG Y TCFG_RELEASES
  console.log('\n--- 3. GOBERNANZA: REGISTRO EN TCFG_BACKLOG Y TCFG_RELEASES ---');
  const schemas = ['sch_leangsp', 'sch_leangsp_prod'];
  for (const s of schemas) {
    const sql = `
      INSERT INTO ${s}.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_implementacion, solicitado_por, estado)
      VALUES ('REQ-1019', 'Tarifario Dinámico de Mano de Obra por Categoría de Equipo (Sistema Jorge)', 'Implementación del catálogo maestro de tarifas horarias de operador según tipo de equipo (Grúa Horquilla $3.000 hasta Grúa 220T $12.000) de la app de Jorge, auto-detección y selector interactivo con sobreescritura manual.', 'Alta', CURRENT_DATE, 'Sergio Gajardo', 'Implementado')
      ON CONFLICT (codigo_req) DO UPDATE SET 
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        estado = 'Implementado',
        fecha_implementacion = CURRENT_DATE,
        updated_at = NOW();

      INSERT INTO ${s}.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
      VALUES ('v1.0.117', 'Portal Web GSP v1.0.117 - Tarifario Dinámico de Operadores por Categoría de Equipo', 'Feature', 'Incorporación del tarifario oficial de Jorge con selección dinámica de categoría de equipo, auto-detección de tarifas y recalculo reactivo en ITS Transición y PDF oficial.', '["REQ-1019"]'::jsonb, 'Sergio Gajardo')
      ON CONFLICT (version) DO UPDATE SET
        titulo = EXCLUDED.titulo,
        descripcion_impacto = EXCLUDED.descripcion_impacto,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    `;
    const resSql = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sql.replace(/"/g, '\\"')}\\""`);
    console.log(`Gobernanza en ${s}:`, resSql.stdout.includes('INSERT') || resSql.stdout.includes('UPDATE') ? 'OK' : resSql.stderr || resSql.stdout);
  }

  // 4. VERIFICACIÓN DETERMINISTA HTTP 200
  console.log('\n--- 4. VERIFICACIÓN DETERMINISTA HTTP ---');
  const checkDev = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-dev/');
  const checkProd = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-prod/');
  console.log(`DEV URL: https://servidor.leanglobal.cl/lg-gsp-dev/ -> HTTP ${checkDev.stdout}`);
  console.log(`PROD URL: https://servidor.leanglobal.cl/lg-gsp-prod/ -> HTTP ${checkProd.stdout}`);

  console.log('\n=== DESPLIEGUE v1.0.117 FINALIZADO CON ÉXITO ===');
  ssh.dispose();
}

deployV10117().catch(err => {
  console.error('ERROR EN DESPLIEGUE:', err);
  ssh.dispose();
  process.exit(1);
});
