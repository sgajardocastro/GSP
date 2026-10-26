const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const fs = require('fs');
const https = require('https');

const ssh = new NodeSSH();

function httpRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed = data;
        try { parsed = JSON.parse(data); } catch (_) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: parsed,
          rawLength: Buffer.byteLength(data)
        });
      });
    });
    req.on('error', reject);
    if (postData) req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    req.end();
  });
}

async function run() {
  console.log('=================================================================');
  console.log('  DESPLIEGUE A PRODUCCIÓN: RELEASE v1.0.161 (REQ-1072)');
  console.log('  Fix Cotización PDF, Fail-Closed DTE y Tarifas Operador ITS');
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

  const filesBackend = [
    { local: 'ejecucion/backend_remoto/src/routes/estadoPagoRoutes.js', remote: `${backendProdDir}/src/routes/estadoPagoRoutes.js` },
    { local: 'ejecucion/backend_remoto/src/controllers/estadoPagoController.js', remote: `${backendProdDir}/src/controllers/estadoPagoController.js` },
    { local: 'ejecucion/backend_remoto/src/services/dtePdfParserService.js', remote: `${backendProdDir}/src/services/dtePdfParserService.js` },
    { local: 'ejecucion/backend_remoto/src/services/tarifasOperadorService.js', remote: `${backendProdDir}/src/services/tarifasOperadorService.js` },
    { local: 'ejecucion/backend_remoto/src/controllers/itsController.js', remote: `${backendProdDir}/src/controllers/itsController.js` }
  ];

  for (const f of filesBackend) {
    const localPath = path.join(localBase, f.local);
    console.log(`Subiendo ${path.basename(f.local)} -> ${f.remote}`);
    await ssh.putFile(localPath, f.remote);
  }

  console.log('Ajustando permisos backend nodeadmin:nodeadmin...');
  const remotePaths = filesBackend.map(f => f.remote).join(' ');
  await ssh.execCommand(`chown -R nodeadmin:nodeadmin ${remotePaths}`);

  // 2. Reiniciar PM2 proceso 13 (lean-services-gsp-prod)
  console.log('\n--- 2. REINICIO DE SERVICIO PM2 PRODUCCIÓN (ID 13) ---');
  const pm2Res = await ssh.execCommand('su - nodeadmin -c "pm2 restart 13"');
  console.log(pm2Res.stdout || pm2Res.stderr);

  // Esperar 3s para estabilización
  await new Promise(r => setTimeout(r, 3000));

  // 3. Subir Frontend dist_prod a /var/www/html/lg-gsp-prod
  console.log('\n--- 3. DESPLIEGUE FRONTEND PRODUCCIÓN (dist_prod) ---');
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
        'REQ-1072',
        'Apertura Directa de Cotización Comercial PDF, Blindaje Fail-Closed Anti-Descalce Tributario DTE y Tarifas Operador ITS',
        'SPEC-101 v2 / SPEC-078 v2: Apertura directa del PDF oficial de Cotización Comercial en primera columna de Perspectiva Contabilidad. Blindaje fail-closed con rechazo HTTP 400 ante emisor ajeno al holding o incongruencia de RUT receptor mandante. Integración de 19 tarifas horarias maestras de operadores en ITS con auditoría de Control de Gestión.',
        'Critica',
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
        '1.0.161',
        'Apertura Directa de Cotización Comercial PDF, Blindaje Fail-Closed Anti-Descalce Tributario DTE y Tarifas Operador ITS',
        'FEATURE',
        'Corrige navegación de primera columna abriendo PDF oficial de Cotización Comercial. Cierra brecha anti-descalce con validación determinista fail-closed por holding y cliente receptor. Incorpora 19 tarifas maestras de operador en ITS.',
        'REQ-1072',
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

  ssh.dispose();

  // =========================================================================
  // SUITE DE VERIFICACIÓN EMPÍRICA DETERMINISTA EN PRODUCCIÓN
  // =========================================================================
  console.log('\n=================================================================');
  console.log('  INICIANDO SUITE DE AUDITORÍA EMPÍRICA DETERMINISTA EN PROD');
  console.log('=================================================================\n');

  // PRUEBA 1: Verificación HTTP Frontend PROD
  console.log('--- PRUEBA 1: Verificación HTTP Frontend PROD ---');
  const resWeb = await httpRequest({
    hostname: 'servidor.leanglobal.cl',
    port: 443,
    path: '/lg-gsp-prod/',
    method: 'GET',
    rejectUnauthorized: false
  });
  console.log(`Status Frontend PROD: ${resWeb.statusCode} OK (Length: ${resWeb.rawLength} bytes)`);
  if (resWeb.statusCode !== 200) throw new Error('Frontend PROD no responde 200 OK');
  console.log('✔ PRUEBA 1 SUPERADA\n');

  // PRUEBA 2: Descarga de Cotización Comercial PDF en Proyecto 1 de PROD
  console.log('--- PRUEBA 2: GET /api/operaciones/edp/proyecto/1/cotizacion-pdf ---');
  const resCotizPdf = await httpRequest({
    hostname: 'servidor.leanglobal.cl',
    port: 443,
    path: '/lg-gsp-prod/api/operaciones/edp/proyecto/1/cotizacion-pdf',
    method: 'GET',
    rejectUnauthorized: false
  });
  console.log(`Status PROD: ${resCotizPdf.statusCode}`);
  console.log(`Content-Type: ${resCotizPdf.headers['content-type']}`);
  console.log(`Tamaño de PDF: ${resCotizPdf.rawLength} bytes`);
  if (resCotizPdf.statusCode !== 200 || !resCotizPdf.headers['content-type']?.includes('pdf') || resCotizPdf.rawLength < 1000) {
    throw new Error('Fallo en PRUEBA 2: No se sirvió el PDF oficial de la cotización en PROD');
  }
  console.log('✔ PRUEBA 2 SUPERADA: PDF de Cotización servido exitosamente en PROD\n');

  // PRUEBA 3: Prueba Negativa Anti-Descalce en PROD (Ingevec en Proyecto 1)
  console.log('--- PRUEBA 3: Rechazo Fail-Closed Cliente Incongruente en PROD ---');
  const payloadRechazoIngevec = JSON.stringify({
    id_proyecto: 1,
    declarar_facturado: false,
    factura: {
      folio_dte: '83',
      rut_emisor: '78.254.535-3',
      empresa_facturadora: 'Royal Rental',
      cliente_receptor_rut: '96.844.500-8',
      cliente_receptor_nombre: 'Constructora Ingevec S.A.',
      monto_neto: 200000,
      monto_total: 238000
    }
  });

  const resRechazoIngevec = await httpRequest({
    hostname: 'servidor.leanglobal.cl',
    port: 443,
    path: '/lg-gsp-prod/api/operaciones/edp/proyecto/1/soporte-documental',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payloadRechazoIngevec)
    },
    rejectUnauthorized: false
  }, payloadRechazoIngevec);

  console.log(`Status devuelto por PROD: ${resRechazoIngevec.statusCode} (Esperado: 400 Bad Request)`);
  console.log('Respuesta cruda PROD:', JSON.stringify(resRechazoIngevec.body));
  if (resRechazoIngevec.statusCode !== 400 || !resRechazoIngevec.body?.message?.includes('Rechazo Contable')) {
    throw new Error('Fallo en PRUEBA 3: El servidor PROD no rechazó la factura de otro cliente');
  }
  console.log('✔ PRUEBA 3 SUPERADA: Bloqueo Anti-Descalce HTTP 400 verificado empíricamente en PROD\n');

  // PRUEBA 4: Prueba Negativa Emisor Ajeno al Holding en PROD
  console.log('--- PRUEBA 4: Rechazo Fail-Closed Emisor Ajeno al Holding en PROD ---');
  const payloadRechazoEmisor = JSON.stringify({
    id_proyecto: 1,
    declarar_facturado: false,
    factura: {
      folio_dte: '9999',
      rut_emisor: '12.345.678-9',
      empresa_facturadora: 'Empresa Externa No Autorizada SpA',
      cliente_receptor_rut: '78.249.226-8',
      cliente_receptor_nombre: 'LeanGlobal SpA',
      monto_neto: 500000,
      monto_total: 595000
    }
  });

  const resRechazoEmisor = await httpRequest({
    hostname: 'servidor.leanglobal.cl',
    port: 443,
    path: '/lg-gsp-prod/api/operaciones/edp/proyecto/1/soporte-documental',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payloadRechazoEmisor)
    },
    rejectUnauthorized: false
  }, payloadRechazoEmisor);

  console.log(`Status devuelto por PROD: ${resRechazoEmisor.statusCode} (Esperado: 400 Bad Request)`);
  console.log('Respuesta cruda PROD:', JSON.stringify(resRechazoEmisor.body));
  if (resRechazoEmisor.statusCode !== 400 || !resRechazoEmisor.body?.message?.includes('no pertenece al holding autorizado')) {
    throw new Error('Fallo en PRUEBA 4: El servidor PROD no rechazó el emisor ajeno al holding');
  }
  console.log('✔ PRUEBA 4 SUPERADA: Bloqueo Emisor Ajeno HTTP 400 verificado empíricamente en PROD\n');

  console.log('=================================================================');
  console.log('🎉 DESPLIEGUE A PRODUCCIÓN v1.0.161 FINALIZADO CON ÉXITO AL 100%');
  console.log('=================================================================');
}

run().catch(err => {
  console.error('❌ Error en ejecución PROD:', err);
  ssh.dispose();
  process.exit(1);
});
