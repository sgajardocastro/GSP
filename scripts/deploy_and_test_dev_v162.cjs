const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const fs = require('fs');
const https = require('https');

const ssh = new NodeSSH();

function httpRequest(options) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          rawLength: Buffer.byteLength(data)
        });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('=================================================================');
  console.log('  DESPLIEGUE A DEV: RELEASE v1.0.162 (REQ-1073)');
  console.log('  Task Buckets, Primary CTA Contabilidad & Diagrama en Web Docs');
  console.log('=================================================================\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });
  console.log('✔ Conexión SSH establecida con servidor DEV (138.255.103.18:1295)');

  const localBase = path.resolve(__dirname, '..');
  const remoteWebDev = '/var/www/html/lg-gsp-dev';
  const localDistDev = path.join(localBase, 'ejecucion/frontend/dist_dev');

  // 1. Subir Frontend dist_dev a /var/www/html/lg-gsp-dev
  console.log(`\n--- 1. DESPLIEGUE FRONTEND DEV (dist_dev) ---`);
  console.log(`Subiendo Frontend dist_dev a ${remoteWebDev}...`);
  const ok = await ssh.putDirectory(localDistDev, remoteWebDev, {
    recursive: true,
    concurrency: 10,
    validate: (item) => !item.includes('.git')
  });
  if (!ok) throw new Error('Fallo al transferir dist_dev a DEV');

  // 2. Subir Manuales HTML a la Web Documental de DEV
  console.log(`\n--- 2. DESPLIEGUE DE MANUALES HTML EN WEB DOCUMENTAL ---`);
  const manuales = [
    'manual_contabilidad_edp_y_facturacion_gsp.html',
    'manual_perspectiva_contabilidad_bi_y_facturacion_gsp.html'
  ];
  for (const m of manuales) {
    const localFile = path.join(localBase, 'ejecucion/frontend/public', m);
    const remoteFile = `${remoteWebDev}/${m}`;
    console.log(`Subiendo ${m} -> ${remoteFile}`);
    await ssh.putFile(localFile, remoteFile);
  }

  await ssh.execCommand(`chown -R nginx:nginx ${remoteWebDev} && chmod -R 755 ${remoteWebDev}`);
  console.log('✔ Permisos nginx aplicados en DEV');

  // 3. Registro de Gobernanza en BD PostgreSQL (sch_leangsp)
  console.log('\n--- 3. REGISTRO EN BASE DE DATOS (TCFG_BACKLOG / TCFG_RELEASES) ---');
  const sql = `
    INSERT INTO sch_leangsp.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_implementacion, solicitado_por, estado)
    VALUES (
      'REQ-1073',
      'Rediseño UX/UI Perspectiva Contabilidad: Bandejas Operativas por Tarea, Primary Call-to-Action y Diagrama Oficial en Web Documental',
      'SPEC-102: Implementación de 5 bandejas operativas (Task Buckets: Por Facturar, Mi Firma EDP, Esperando OC, Facturadas, Todas) con contadores reactivos. Rediseño de la tabla a 5 columnas con botón primario sólido de alto contraste por fila (Primary CTA de 1 clic). Inclusión del diagrama de secuencia Mermaid oficial de segregación de funciones en los manuales HTML de la web documental.',
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

    INSERT INTO sch_leangsp.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
    VALUES (
      '1.0.162',
      'Rediseño UX/UI Perspectiva Contabilidad: Task Buckets, Primary CTA y Diagrama Oficial en Web Documental',
      'FEATURE',
      'Reduce sobrecarga cognitiva con bandejas por tarea y botón primario de 1 clic. Agrega diagrama de secuencia Mermaid en manuales oficiales de contabilidad.',
      'REQ-1073',
      'Sergio Gajardo'
    )
    ON CONFLICT (version) DO UPDATE SET 
      titulo = EXCLUDED.titulo,
      descripcion_impacto = EXCLUDED.descripcion_impacto,
      requerimientos_asociados = EXCLUDED.requerimientos_asociados,
      updated_at = NOW();
  `;
  const resSql = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sql.replace(/"/g, '\\"')}\\""`);
  console.log('Base de Datos (sch_leangsp):', resSql.stdout.trim() || resSql.stderr);

  ssh.dispose();

  // =========================================================================
  // SUITE DE VERIFICACIÓN EMPÍRICA DETERMINISTA EN DEV
  // =========================================================================
  console.log('\n=================================================================');
  console.log('  INICIANDO SUITE DE AUDITORÍA EMPÍRICA DETERMINISTA EN DEV');
  console.log('=================================================================\n');

  // PRUEBA 1: Verificación HTTP Frontend DEV
  console.log('--- PRUEBA 1: Verificación HTTP Frontend DEV ---');
  const resWeb = await httpRequest({
    hostname: 'servidor.leanglobal.cl',
    port: 443,
    path: '/lg-gsp-dev/',
    method: 'GET',
    rejectUnauthorized: false
  });
  console.log(`Status Frontend DEV: ${resWeb.statusCode} OK (Length: ${resWeb.rawLength} bytes)`);
  if (resWeb.statusCode !== 200) throw new Error('Frontend DEV no responde 200 OK');
  console.log('✔ PRUEBA 1 SUPERADA\n');

  // PRUEBA 2: Verificación de manual_contabilidad_edp_y_facturacion_gsp.html con Mermaid
  console.log('--- PRUEBA 2: Verificación Manual Contabilidad con Diagrama de Secuencia ---');
  const resMan1 = await httpRequest({
    hostname: 'servidor.leanglobal.cl',
    port: 443,
    path: '/lg-gsp-dev/manual_contabilidad_edp_y_facturacion_gsp.html',
    method: 'GET',
    rejectUnauthorized: false
  });
  console.log(`Status Manual 1: ${resMan1.statusCode} OK (Length: ${resMan1.rawLength} bytes)`);
  const hasMermaid1 = resMan1.body.includes('mermaid.initialize') && resMan1.body.includes('sequenceDiagram');
  console.log(`Contiene Mermaid y Diagrama de Secuencia: ${hasMermaid1 ? 'SÍ (100%)' : 'NO'}`);
  if (resMan1.statusCode !== 200 || !hasMermaid1) {
    throw new Error('Fallo en PRUEBA 2: manual_contabilidad_edp_y_facturacion_gsp.html no contiene el diagrama de secuencia');
  }
  console.log('✔ PRUEBA 2 SUPERADA\n');

  // PRUEBA 3: Verificación de manual_perspectiva_contabilidad_bi_y_facturacion_gsp.html con Mermaid
  console.log('--- PRUEBA 3: Verificación Manual Perspectiva Contabilidad con Diagrama ---');
  const resMan2 = await httpRequest({
    hostname: 'servidor.leanglobal.cl',
    port: 443,
    path: '/lg-gsp-dev/manual_perspectiva_contabilidad_bi_y_facturacion_gsp.html',
    method: 'GET',
    rejectUnauthorized: false
  });
  console.log(`Status Manual 2: ${resMan2.statusCode} OK (Length: ${resMan2.rawLength} bytes)`);
  const hasMermaid2 = resMan2.body.includes('mermaid.initialize') && resMan2.body.includes('sequenceDiagram');
  console.log(`Contiene Mermaid y Diagrama de Secuencia: ${hasMermaid2 ? 'SÍ (100%)' : 'NO'}`);
  if (resMan2.statusCode !== 200 || !hasMermaid2) {
    throw new Error('Fallo en PRUEBA 3: manual_perspectiva_contabilidad_bi_y_facturacion_gsp.html no contiene el diagrama');
  }
  console.log('✔ PRUEBA 3 SUPERADA\n');

  console.log('=================================================================');
  console.log('🎉 DESPLIEGUE A DEV v1.0.162 FINALIZADO CON ÉXITO AL 100%');
  console.log('=================================================================');
}

run().catch(err => {
  console.error('❌ Error en ejecución DEV:', err);
  ssh.dispose();
  process.exit(1);
});
