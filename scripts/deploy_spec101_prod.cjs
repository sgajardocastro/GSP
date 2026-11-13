const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const fs = require('fs');
const https = require('https');

const ssh = new NodeSSH();

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({ status: res.statusCode });
    }).on('error', (e) => {
      resolve({ error: e.message });
    });
  });
}

async function testPdfProd(pdfFileName) {
  const pdfPath = path.resolve(__dirname, '../Contabilidad', pdfFileName);
  if (!fs.existsSync(pdfPath)) {
    throw new Error('No se encontró el PDF real en ' + pdfPath);
  }
  const pdfBuffer = fs.readFileSync(pdfPath);
  const pdfBase64 = pdfBuffer.toString('base64');

  const payload = JSON.stringify({
    pdf_base64: pdfBase64,
    nombre_archivo: pdfFileName
  });

  const options = {
    hostname: 'servidor.leanglobal.cl',
    port: 443,
    path: '/lg-gsp-prod/api/operaciones/edp/parsear-dte-pdf',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    },
    rejectUnauthorized: false
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: JSON.parse(data)
        });
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function deployProd() {
  console.log('=================================================================');
  console.log('  DESPLIEGUE REQ-1070 (SPEC-101) - ENTORNO PRODUCCIÓN (v1.0.160)');
  console.log('  Reconocimiento DTE PDF (Laudus/SII) + Facturación Multi-DTE');
  console.log('=================================================================\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });
  console.log('✔ Conexión SSH establecida con servidor PRODUCCIÓN (138.255.103.18:1295)');

  const localBase = path.resolve(__dirname, '..');
  const backendProdDir = '/home/nodeadmin/proyectos/lean-services-gsp-prod';

  // 1. Subir backend a PROD
  console.log('\n--- 1. DESPLIEGUE BACKEND PRODUCCIÓN ---');
  const localParser = path.join(localBase, 'ejecucion/backend_remoto/src/services/dtePdfParserService.js');
  const remoteParser = `${backendProdDir}/src/services/dtePdfParserService.js`;
  console.log(`1.1 Subiendo dtePdfParserService.js -> ${remoteParser}`);
  await ssh.putFile(localParser, remoteParser);

  const localController = path.join(localBase, 'ejecucion/backend_remoto/src/controllers/estadoPagoController.js');
  const remoteController = `${backendProdDir}/src/controllers/estadoPagoController.js`;
  console.log(`1.2 Subiendo estadoPagoController.js -> ${remoteController}`);
  await ssh.putFile(localController, remoteController);

  const localRoutes = path.join(localBase, 'ejecucion/backend_remoto/src/routes/estadoPagoRoutes.js');
  const remoteRoutes = `${backendProdDir}/src/routes/estadoPagoRoutes.js`;
  console.log(`1.3 Subiendo estadoPagoRoutes.js -> ${remoteRoutes}`);
  await ssh.putFile(localRoutes, remoteRoutes);

  console.log('1.4 Ajustando permisos nodeadmin:nodeadmin...');
  await ssh.execCommand(`chown -R nodeadmin:nodeadmin ${remoteParser} ${remoteController} ${remoteRoutes}`);

  // 2. Reiniciar PM2 PROD (ID 13)
  console.log('\n--- 2. REINICIO DE SERVICIO PM2 PROD (ID 13) ---');
  const pm2Res = await ssh.execCommand('su - nodeadmin -c "pm2 restart 13"');
  console.log(pm2Res.stdout || pm2Res.stderr);

  // Esperar 2.5s para estabilización
  await new Promise(r => setTimeout(r, 2500));

  // 3. Subir Frontend dist_prod a /var/www/html/lg-gsp-prod
  console.log('\n--- 3. DESPLIEGUE FRONTEND DIST_PROD ---');
  const localDistProd = path.join(localBase, 'ejecucion/frontend/dist_prod');
  const remoteWebProd = '/var/www/html/lg-gsp-prod';
  console.log(`Subiendo Frontend dist_prod a ${remoteWebProd}...`);
  const ok = await ssh.putDirectory(localDistProd, remoteWebProd, {
    recursive: true,
    concurrency: 10,
    validate: (item) => !item.includes('.git')
  });
  if (!ok) throw new Error('Fallo al transferir dist_prod a PROD');

  await ssh.execCommand(`chown -R nginx:nginx ${remoteWebProd} && chmod -R 755 ${remoteWebProd}`);
  console.log('✔ Frontend dist_prod transferido y permisos nginx aplicados');

  // 4. Registro de Gobernanza en BD PostgreSQL (sch_leangsp_prod y sch_leangsp)
  console.log('\n--- 4. REGISTRO EN BASE DE DATOS (TCFG_BACKLOG / TCFG_RELEASES) ---');
  const schemas = ['sch_leangsp_prod', 'sch_leangsp'];
  for (const s of schemas) {
    const sql = `
      INSERT INTO ${s}.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_implementacion, solicitado_por, estado)
      VALUES (
        'REQ-1070',
        'Reconocimiento Automático de Facturas PDF (Laudus ERP / Portal SII) y Facturación Múltiple por Proceso (1 OT -> N Facturas DTE)',
        'SPEC-101: Motor parser determinista nativo zlib para DTEs de Laudus ERP (Grúas San Pablo 52.004.162-1) y Portal SII (Bestmaq 76.209.534-3, Logística del Sur 76.218.576-8, Royal Rental 78.254.535-3). Modelo multi-factura con cuenta corriente, cuotas, arriendos mensuales y cierre total.',
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
        '1.0.160',
        'Reconocimiento Automático de Facturas PDF (Laudus ERP / Portal SII) y Facturación Múltiple por Proceso (1 OT -> N Facturas DTE)',
        'FEATURE',
        'Incorpora motor parser inteligente sin dependencias externas pesadas para reconocimiento instantáneo de DTEs de Laudus y Portal SII, y modelo multi-factura para cubrir anticipos, cuotas y arriendos continuos en la Perspectiva Contabilidad.',
        'REQ-1070',
        'Sergio Gajardo'
      )
      ON CONFLICT (version) DO UPDATE SET 
        titulo = EXCLUDED.titulo,
        descripcion_impacto = EXCLUDED.descripcion_impacto,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados,
        updated_at = NOW();
    `;
    const resSql = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sql.replace(/"/g, '\\"')}\\""`);
    console.log(`Base de Datos (${s}):`, resSql.stdout.trim() || resSql.stderr);
  }

  // 5. Verificación HTTP en vivo de Frontend PROD
  console.log('\n--- 5. VERIFICACIÓN HTTP EN VIVO DE PRODUCCIÓN ---');
  const curlWeb = await ssh.execCommand('curl -I -s https://servidor.leanglobal.cl/lg-gsp-prod/ | head -n 3');
  console.log('HTTP Status Frontend PROD:\n' + curlWeb.stdout.trim());

  // 6. Verificación de Endpoints API en PROD con Facturas Reales
  console.log('\n--- 6. PRUEBA EMPÍRICA CONTRA ENDPOINT API EN PRODUCCIÓN ---');
  console.log('Probando DTE 14664 (Laudus ERP - Grúas San Pablo)...');
  const res1 = await testPdfProd('DTE 14664 de LUIS GHISELLINI J ARREND MAQ Y VEH MOTOR EN GRAL EIRL (1).pdf');
  console.log('Status PROD:', res1.statusCode);
  console.log('Folio:', res1.body.data.folio_dte, '| Emisor:', res1.body.data.empresa_facturadora, '| Formato:', res1.body.data.formato_detectado, '| Neto:', res1.body.data.monto_neto);

  console.log('\nProbando Fact. 2907 (Portal SII - Bestmaq)...');
  const res2 = await testPdfProd('Fact. 2907 Soc. Hormigones y Baldosas.pdf');
  console.log('Status PROD:', res2.statusCode);
  console.log('Folio:', res2.body.data.folio_dte, '| Emisor:', res2.body.data.empresa_facturadora, '| Formato:', res2.body.data.formato_detectado, '| Neto:', res2.body.data.monto_neto);

  ssh.dispose();

  if (res1.statusCode === 200 && res2.statusCode === 200) {
    console.log('\n=================================================================');
    console.log('🎉 DESPLIEGUE A PRODUCCIÓN v1.0.160 FINALIZADO CON ÉXITO');
    console.log('=================================================================');
  } else {
    throw new Error('Fallo en aserciones de prueba en producción');
  }
}

deployProd().catch(err => {
  console.error('❌ Error en despliegue PROD:', err);
  ssh.dispose();
  process.exit(1);
});
