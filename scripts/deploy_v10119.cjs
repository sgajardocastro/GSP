const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const https = require('https');
const ssh = new NodeSSH();

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve(res.statusCode);
    }).on('error', (e) => {
      resolve(e.message);
    });
  });
}

async function deployV10119() {
  console.log('=== DESPLIEGUE INTEGRAL DEV & PROD v1.0.119 (REQ-1021 / APERTURA COSTOS ITS SECCIÓN 3 Y 4) ===\n');
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
      VALUES ('REQ-1021', 'Apertura de Costos Operacionales en ITS Sección 3 y Resumen 4 (Sistema Jorge)', 'Desglose individual y canónico de los 9 rubros de costo en la Sección 3 (con formato de tabla completa o fallback de ítem sin registros a $0) y apertura detallada de 8 conceptos de egreso con % sobre venta en el resumen financiero de la Sección 4.', 'Alta', CURRENT_DATE, 'Sergio Gajardo', 'Implementado')
      ON CONFLICT (codigo_req) DO UPDATE SET 
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        estado = 'Implementado',
        fecha_implementacion = CURRENT_DATE,
        updated_at = NOW();

      INSERT INTO ${s}.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
      VALUES ('v1.0.119', 'Portal Web GSP v1.0.119 - Apertura Completa de Costos en ITS Sección 3 y 4', 'Feature', 'Desglose canónico e independiente de los 9 rubros de la Sección 3 y de los 8 conceptos de costos operacionales en la Sección 4.B del ITS con cálculo porcentual sobre venta.', jsonb_build_array('REQ-1021'), 'Sergio Gajardo')
      ON CONFLICT (version) DO UPDATE SET
        titulo = EXCLUDED.titulo,
        descripcion_impacto = EXCLUDED.descripcion_impacto,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    `;
    const resSql = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sql.replace(/"/g, '\\"')}\\""`);
    if (resSql.code !== 0) {
      console.warn(`Aviso gobernanza en ${s}:`, resSql.stderr);
    } else {
      console.log(`Gobernanza en ${s}: OK`);
    }
  }

  // 4. VERIFICACIÓN DETERMINISTA HTTP
  console.log('\n--- 4. VERIFICACIÓN DETERMINISTA HTTP ---');
  const devStatus = await checkUrl('https://servidor.leanglobal.cl/lg-gsp-dev/');
  const prodStatus = await checkUrl('https://servidor.leanglobal.cl/lg-gsp-prod/');
  console.log(`DEV URL: https://servidor.leanglobal.cl/lg-gsp-dev/ -> HTTP ${devStatus}`);
  console.log(`PROD URL: https://servidor.leanglobal.cl/lg-gsp-prod/ -> HTTP ${prodStatus}`);

  ssh.dispose();
  console.log('\n=== DESPLIEGUE v1.0.119 FINALIZADO CON ÉXITO ===');
}

deployV10119().catch(err => {
  console.error('ERROR EN DESPLIEGUE:', err);
  ssh.dispose();
  process.exit(1);
});
