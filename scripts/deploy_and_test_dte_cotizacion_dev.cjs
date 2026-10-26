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
  console.log('  DESPLIEGUE A DEV: FIX COTIZACIÓN PDF & CANDADO FAIL-CLOSED DTE');
  console.log('=================================================================\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });
  console.log('✔ Conexión SSH establecida con servidor DEV (138.255.103.18:1295)');

  const localBase = path.resolve(__dirname, '..');
  const backendRemoteDir = '/home/nodeadmin/proyectos/lean-services-gsp';

  // 1. Subir estadoPagoRoutes.js
  const localRoutes = path.join(localBase, 'ejecucion/backend_remoto/src/routes/estadoPagoRoutes.js');
  const remoteRoutes = `${backendRemoteDir}/src/routes/estadoPagoRoutes.js`;
  console.log(`1. Subiendo estadoPagoRoutes.js -> ${remoteRoutes}`);
  await ssh.putFile(localRoutes, remoteRoutes);

  // 2. Subir estadoPagoController.js
  const localEdpController = path.join(localBase, 'ejecucion/backend_remoto/src/controllers/estadoPagoController.js');
  const remoteEdpController = `${backendRemoteDir}/src/controllers/estadoPagoController.js`;
  console.log(`2. Subiendo estadoPagoController.js -> ${remoteEdpController}`);
  await ssh.putFile(localEdpController, remoteEdpController);

  // 3. Subir dtePdfParserService.js
  const localParser = path.join(localBase, 'ejecucion/backend_remoto/src/services/dtePdfParserService.js');
  const remoteParser = `${backendRemoteDir}/src/services/dtePdfParserService.js`;
  console.log(`3. Subiendo dtePdfParserService.js -> ${remoteParser}`);
  await ssh.putFile(localParser, remoteParser);

  // 4. Ajustar permisos backend
  console.log('4. Ajustando permisos backend...');
  await ssh.execCommand(`chown -R nodeadmin:nodeadmin ${remoteRoutes} ${remoteEdpController} ${remoteParser}`);

  // 5. Reiniciar PM2 proceso 10
  console.log('5. Reiniciando servicio PM2 DEV (ID 10)...');
  const pm2Res = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
  console.log(pm2Res.stdout || pm2Res.stderr);

  // Esperar 3s para estabilización
  await new Promise(r => setTimeout(r, 3000));

  // 6. Subir Frontend dist_dev a /var/www/html/lg-gsp-dev
  const localDistDev = path.join(localBase, 'ejecucion/frontend/dist_dev');
  const remoteWebDev = '/var/www/html/lg-gsp-dev';
  console.log(`6. Subiendo Frontend dist_dev a ${remoteWebDev}...`);
  const ok = await ssh.putDirectory(localDistDev, remoteWebDev, {
    recursive: true,
    concurrency: 10,
    validate: (item) => !item.includes('.git')
  });
  if (!ok) throw new Error('Fallo al transferir dist_dev a DEV');

  await ssh.execCommand(`chown -R nginx:nginx ${remoteWebDev} && chmod -R 755 ${remoteWebDev}`);
  console.log('✔ Frontend dist_dev transferido y permisos nginx aplicados');

  ssh.dispose();

  // =========================================================================
  // SUITE DE VERIFICACIÓN EMPÍRICA DETERMINISTA (CERO SUPOSICIONES)
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
  console.log(`Status Frontend: ${resWeb.statusCode} OK (Length: ${resWeb.rawLength} bytes)`);
  if (resWeb.statusCode !== 200) throw new Error('Frontend DEV no responde 200 OK');
  console.log('✔ PRUEBA 1 SUPERADA\n');

  // PRUEBA 2: Descarga de Cotización Comercial PDF en Proyecto 105
  console.log('--- PRUEBA 2: GET /api/operaciones/edp/proyecto/105/cotizacion-pdf ---');
  const resCotizPdf = await httpRequest({
    hostname: 'servidor.leanglobal.cl',
    port: 443,
    path: '/lg-gsp-dev/api/operaciones/edp/proyecto/105/cotizacion-pdf',
    method: 'GET',
    rejectUnauthorized: false
  });
  console.log(`Status: ${resCotizPdf.statusCode}`);
  console.log(`Content-Type: ${resCotizPdf.headers['content-type']}`);
  console.log(`Tamaño de PDF: ${resCotizPdf.rawLength} bytes`);
  if (resCotizPdf.statusCode !== 200 || !resCotizPdf.headers['content-type']?.includes('pdf') || resCotizPdf.rawLength < 1000) {
    throw new Error('Fallo en PRUEBA 2: No se sirvió el PDF oficial de la cotización');
  }
  console.log('✔ PRUEBA 2 SUPERADA: PDF de Cotización servido exitosamente\n');

  // PRUEBA 3: Prueba Negativa Anti-Descalce (Rechazo Factura Ingevec a Proyecto LeanGlobal)
  console.log('--- PRUEBA 3: Rechazo Fail-Closed Cliente Incongruente (Ingevec en LeanGlobal) ---');
  const payloadRechazoIngevec = JSON.stringify({
    id_proyecto: 105,
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
    path: '/lg-gsp-dev/api/operaciones/edp/proyecto/105/soporte-documental',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payloadRechazoIngevec)
    },
    rejectUnauthorized: false
  }, payloadRechazoIngevec);

  console.log(`Status devuelto por el servidor: ${resRechazoIngevec.statusCode} (Esperado: 400 Bad Request)`);
  console.log('Respuesta cruda:', JSON.stringify(resRechazoIngevec.body));
  if (resRechazoIngevec.statusCode !== 400 || !resRechazoIngevec.body?.message?.includes('Rechazo Contable')) {
    throw new Error('Fallo en PRUEBA 3: El servidor no rechazó la factura de otro cliente');
  }
  console.log('✔ PRUEBA 3 SUPERADA: Bloqueo Anti-Descalce HTTP 400 verificado empíricamente\n');

  // PRUEBA 4: Prueba Negativa Emisor Ajeno al Holding
  console.log('--- PRUEBA 4: Rechazo Fail-Closed Emisor Ajeno al Holding GSP ---');
  const payloadRechazoEmisor = JSON.stringify({
    id_proyecto: 105,
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
    path: '/lg-gsp-dev/api/operaciones/edp/proyecto/105/soporte-documental',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payloadRechazoEmisor)
    },
    rejectUnauthorized: false
  }, payloadRechazoEmisor);

  console.log(`Status devuelto por el servidor: ${resRechazoEmisor.statusCode} (Esperado: 400 Bad Request)`);
  console.log('Respuesta cruda:', JSON.stringify(resRechazoEmisor.body));
  if (resRechazoEmisor.statusCode !== 400 || !resRechazoEmisor.body?.message?.includes('no pertenece al holding autorizado')) {
    throw new Error('Fallo en PRUEBA 4: El servidor no rechazó el emisor ajeno al holding');
  }
  console.log('✔ PRUEBA 4 SUPERADA: Bloqueo Emisor Ajeno HTTP 400 verificado empíricamente\n');

  // PRUEBA 5: Intento de asociar DTE 14664 (Cimol, RUT 77.050.638-7) a Proyecto 105 (LeanGlobal, RUT 78.249.226-8)
  console.log('--- PRUEBA 5: Intento de asociar DTE 14664 (Constructora Cimol) a OT 105 (LeanGlobal) ---');
  const payloadDteCimol = JSON.stringify({
    id_proyecto: 105,
    declarar_facturado: false,
    factura: {
      folio_dte: '14664',
      rut_emisor: '52.004.162-1',
      empresa_facturadora: 'Grúas San Pablo',
      cliente_receptor_rut: '77.050.638-7',
      cliente_receptor_nombre: 'CONSTRUCTORA CIMOL SPA',
      monto_neto: 1820000,
      monto_total: 2165800
    }
  });

  const resRechazoCimol = await httpRequest({
    hostname: 'servidor.leanglobal.cl',
    port: 443,
    path: '/lg-gsp-dev/api/operaciones/edp/proyecto/105/soporte-documental',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payloadDteCimol)
    },
    rejectUnauthorized: false
  }, payloadDteCimol);

  console.log(`Status devuelto por el servidor: ${resRechazoCimol.statusCode} (Esperado: 400 Bad Request)`);
  console.log('Respuesta cruda del servidor:', JSON.stringify(resRechazoCimol.body));
  if (resRechazoCimol.statusCode !== 400 || !resRechazoCimol.body?.message?.includes('Rechazo Contable: La factura N° 14664 está emitida al RUT 77.050.638-7')) {
    throw new Error('Fallo en PRUEBA 5: El servidor no rechazó la factura de Constructora Cimol en el proyecto LeanGlobal');
  }
  console.log('✔ PRUEBA 5 SUPERADA: Factura de Constructora Cimol (DTE 14664) RECHAZADA exitosamente en proyecto LeanGlobal (HTTP 400)\n');

  // PRUEBA 6: Calce Positivo Válido (Factura emitida a LeanGlobal con RUT coincidente)
  console.log('--- PRUEBA 6: Calce Válido (Factura emitida legítimamente a LeanGlobal) ---');
  const payloadCalceValido = JSON.stringify({
    id_proyecto: 105,
    declarar_facturado: false,
    factura: {
      folio_dte: '14665',
      rut_emisor: '52.004.162-1',
      empresa_facturadora: 'Grúas San Pablo',
      cliente_receptor_rut: '78.249.226-8',
      cliente_receptor_nombre: 'LeanGlobal Spa',
      monto_neto: 1820000,
      monto_total: 2165800
    }
  });

  const resCalceValido = await httpRequest({
    hostname: 'servidor.leanglobal.cl',
    port: 443,
    path: '/lg-gsp-dev/api/operaciones/edp/proyecto/105/soporte-documental',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payloadCalceValido)
    },
    rejectUnauthorized: false
  }, payloadCalceValido);

  console.log(`Status devuelto por el servidor: ${resCalceValido.statusCode} (Esperado: 200 OK)`);
  console.log('Respuesta cruda del servidor:', JSON.stringify(resCalceValido.body));
  if (resCalceValido.statusCode !== 200 || !resCalceValido.body?.success) {
    throw new Error('Fallo en PRUEBA 6: El servidor no asoció la factura legítima de LeanGlobal');
  }
  console.log('✔ PRUEBA 6 SUPERADA: Factura legítima asociada y calzada con éxito (HTTP 200)\n');

  console.log('=================================================================');
  console.log('🎉 TODAS LAS PRUEBAS EMPÍRICAS DETERMINISTAS PASARON AL 100%');
  console.log('=================================================================');
}

run().catch(err => {
  console.error('❌ Error en ejecución:', err);
  ssh.dispose();
  process.exit(1);
});
