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
  console.log('  DESPLIEGUE A PRODUCCIÓN: RELEASES v1.0.162 & v1.0.163');
  console.log('  Task Buckets, Primary CTA, Diagrama Docs & SoD OC Comercial');
  console.log('=================================================================\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });
  console.log('✔ Conexión SSH establecida con servidor PRODUCCIÓN (138.255.103.18:1295)');

  const localBase = path.resolve(__dirname, '..');
  const remoteWebProd = '/var/www/html/lg-gsp-prod';
  const localDistProd = path.join(localBase, 'ejecucion/frontend/dist_prod');

  // 1. Subir Frontend dist_prod a /var/www/html/lg-gsp-prod
  console.log(`\n--- 1. DESPLIEGUE FRONTEND PRODUCCIÓN (dist_prod) ---`);
  console.log(`Subiendo Frontend dist_prod a ${remoteWebProd}...`);
  const ok = await ssh.putDirectory(localDistProd, remoteWebProd, {
    recursive: true,
    concurrency: 10,
    validate: (item) => !item.includes('.git')
  });
  if (!ok) throw new Error('Fallo al transferir dist_prod a PROD');
  console.log('✔ Frontend dist_prod transferido');

  // 2. Subir Manuales HTML a la Web Documental de PROD
  console.log(`\n--- 2. DESPLIEGUE DE MANUALES HTML EN PRODUCCIÓN ---`);
  const manuales = [
    'manual_contabilidad_edp_y_facturacion_gsp.html',
    'manual_perspectiva_contabilidad_bi_y_facturacion_gsp.html'
  ];
  for (const m of manuales) {
    const localFile = path.join(localBase, 'ejecucion/frontend/public', m);
    const remoteFile = `${remoteWebProd}/${m}`;
    console.log(`Subiendo ${m} -> ${remoteFile}`);
    await ssh.putFile(localFile, remoteFile);
  }

  await ssh.execCommand(`chown -R nginx:nginx ${remoteWebProd} && chmod -R 755 ${remoteWebProd}`);
  console.log('✔ Permisos nginx aplicados en PROD');

  // 3. Registro de Gobernanza en BD PostgreSQL (sch_leangsp_prod y sch_leangsp)
  console.log('\n--- 3. REGISTRO EN BASE DE DATOS (TCFG_BACKLOG / TCFG_RELEASES) ---');
  const schemas = ['sch_leangsp_prod', 'sch_leangsp'];
  for (const s of schemas) {
    const sql = `
      INSERT INTO ${s}.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_implementacion, solicitado_por, estado)
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

      INSERT INTO ${s}.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
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
        tipo_release = EXCLUDED.tipo_release,
        descripcion_impacto = EXCLUDED.descripcion_impacto,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados,
        publicado_por = EXCLUDED.publicado_por,
        created_at = NOW();

      INSERT INTO ${s}.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_implementacion, solicitado_por, estado)
      VALUES (
        'REQ-1074',
        'Segregación Estricta de Funciones (SoD) en Perspectiva Contabilidad: Carga Exclusiva de OC por Comercial, Apertura Directa de DTE y Habilitación Determinista de Facturación',
        'SPEC-102 v1.1: Atribución exclusiva de la carga de OC al área Comercial. Retiro de diálogos de subida de OC en Contabilidad y despliegue de cápsula no interactiva Bloqueado: Falta OC (Comercial). Apertura directa del PDF oficial de la factura en nueva pestaña para servicios concluidos. Habilitación inmediata del botón verde Cargar Factura DTE para servicios exentos de OC una vez visado el EDP.',
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
        '1.0.163',
        'Segregación SoD OC Comercial, Apertura Directa DTE y Habilitación Determinista de Facturación',
        'FEATURE',
        'Retira la responsabilidad de OC de Contabilidad asignándola a Comercial. Habilita facturación directa a servicios sin OC y abre PDFs tributarios sin diálogos.',
        'REQ-1074',
        'Sergio Gajardo'
      )
      ON CONFLICT (version) DO UPDATE SET 
        titulo = EXCLUDED.titulo,
        tipo_release = EXCLUDED.tipo_release,
        descripcion_impacto = EXCLUDED.descripcion_impacto,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados,
        publicado_por = EXCLUDED.publicado_por,
        created_at = NOW();
    `;

    const escapedSql = sql.replace(/"/g, '\\"');
    const resSql = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${escapedSql}\\""`);
    console.log(`Base de Datos (${s}): ${resSql.stdout.trim() || resSql.stderr.trim()}`);
  }

  // 4. Suite de Verificación HTTP en PRODUCCIÓN
  console.log('\n=================================================================');
  console.log('  INICIANDO SUITE DE AUDITORÍA EMPÍRICA DETERMINISTA EN PRODUCCIÓN');
  console.log('=================================================================');

  console.log('\n--- PRUEBA 1: Verificación HTTP Frontend PROD ---');
  const frontRes = await httpRequest({
    hostname: 'servidor.leanglobal.cl',
    port: 443,
    path: '/lg-gsp-prod/',
    method: 'GET'
  });
  console.log(`Status Frontend PROD: ${frontRes.statusCode} OK (Length: ${frontRes.rawLength} bytes)`);
  if (frontRes.statusCode !== 200) throw new Error('Frontend PROD no responde 200 OK');
  console.log('✔ PRUEBA 1 SUPERADA');

  console.log('\n--- PRUEBA 2: Verificación Manual Contabilidad con Diagrama Mermaid PROD ---');
  const manRes1 = await httpRequest({
    hostname: 'servidor.leanglobal.cl',
    port: 443,
    path: '/lg-gsp-prod/manual_contabilidad_edp_y_facturacion_gsp.html',
    method: 'GET'
  });
  console.log(`Status Manual Contabilidad PROD: ${manRes1.statusCode} OK (Length: ${manRes1.rawLength} bytes)`);
  if (manRes1.statusCode !== 200 || !manRes1.body.includes('mermaid')) throw new Error('Manual Contabilidad PROD inválido');
  console.log('✔ PRUEBA 2 SUPERADA');

  console.log('\n--- PRUEBA 3: Verificación Endpoint Perspectiva Contabilidad PROD ---');
  const apiRes = await httpRequest({
    hostname: 'servidor.leanglobal.cl',
    port: 443,
    path: '/lg-gsp-prod/api/operaciones/edp/perspectiva-contabilidad',
    method: 'GET'
  });
  console.log(`Status API Contabilidad PROD: ${apiRes.statusCode} OK`);
  if (apiRes.statusCode !== 200) throw new Error('API Contabilidad PROD no responde 200 OK');
  const data = JSON.parse(apiRes.body);
  if (!data.success || !Array.isArray(data.data.procesos)) throw new Error('Payload API inválido');
  console.log(`Procesos devueltos en PROD: ${data.data.procesos.length}`);
  console.log('✔ PRUEBA 3 SUPERADA');

  ssh.dispose();
  console.log('\n=================================================================');
  console.log('🎉 DESPLIEGUE A PRODUCCIÓN v1.0.163 FINALIZADO CON ÉXITO AL 100%');
  console.log('=================================================================');
}

run().catch(err => {
  console.error('\n❌ ERROR EN DESPLIEGUE A PRODUCCIÓN:', err.message);
  if (ssh) ssh.dispose();
  process.exit(1);
});
