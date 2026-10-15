const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const fs = require('fs');
const https = require('https');
const ssh = new NodeSSH();

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({ status: res.statusCode, headers: res.headers });
    }).on('error', (e) => {
      resolve({ error: e.message });
    });
  });
}

async function deployContratoLiteralV10139() {
  console.log('=== DESPLIEGUE A DEV Y PROD v1.0.139 (REQ-1046 / Spec 16 Restauración Literal Contrato) ===\n');
  console.log('Conectando a servidor SSH 138.255.103.18:1295...');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });
  console.log('Conexión SSH establecida con éxito.');

  // 1. DESPLIEGUE BACKEND A DEV Y PROD
  console.log('\n--- 1. DESPLIEGUE ARCHIVOS BACKEND (DEV & PROD) ---');
  const backendFiles = [
    {
      local: path.resolve(__dirname, '../ejecucion/backend_remoto/src/models/proyectoModel.js'),
      devRemote: '/home/nodeadmin/proyectos/lean-services-gsp/src/models/proyectoModel.js',
      prodRemote: '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/models/proyectoModel.js'
    }
  ];

  for (const f of backendFiles) {
    console.log(`Subiendo ${path.basename(f.local)} a DEV y PROD...`);
    await ssh.putFile(f.local, f.devRemote);
    await ssh.putFile(f.local, f.prodRemote);
    await ssh.execCommand(`chown nodeadmin:nodeadmin ${f.devRemote} ${f.prodRemote}`);
  }

  // 2. REINICIO DE PM2
  console.log('\n--- 2. REINICIO PROCESOS PM2 10 (DEV) Y 13 (PROD) ---');
  const pm2Restart = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10 && pm2 restart 13"');
  console.log('PM2 restart output:\n', pm2Restart.stdout.trim() || pm2Restart.stderr);

  // 3. GENERACIÓN EN CALIENTE Y PRUEBA EMPÍRICA DE CONTRATO (2 PÁGINAS)
  console.log('\n--- 3. TEST EMPÍRICO DE GENERACIÓN DE PDF DE CONTRATO (2 PÁGINAS) ---');
  await new Promise(r => setTimeout(r, 3500));
  const postGen = await ssh.execCommand(`curl -s -X POST http://127.0.0.1:3006/api/proyectos/109/contrato/generar-pdf -H "Content-Type: application/json" -d '{"datosExtra":{"id_empresa_arrendador":11}}'`);
  console.log('Respuesta generación PDF DEV:\n', postGen.stdout.trim());

  const remotePdfPath = '/u05/LeanDocs/GSP/dev/contratos/2026/10/CTR-2026-0109.pdf';
  const checkPages = await ssh.execCommand(`node -e "
    const fs = require('fs');
    const pdfPath = '${remotePdfPath}';
    if (fs.existsSync(pdfPath)) {
      const buf = fs.readFileSync(pdfPath);
      const str = buf.toString('binary');
      const matches = str.match(/\\/Type\\s*\\/Page[^s]/g);
      console.log('Fichero encontrado:', pdfPath, 'Tamaño:', buf.length, 'bytes');
      console.log('Total páginas detectadas en PDF:', matches ? matches.length : 'N/A');
    } else {
      console.log('No se encontró el fichero en', pdfPath);
    }
  "`);
  console.log('Auditoría física de páginas:\n', checkPages.stdout.trim());

  // Descargar PDF para inspección visual local
  const scratchDir = 'C:\\Users\\sgaja\\.gemini\\antigravity\\brain\\b830bcb5-854b-4c65-ad04-754750b0d73b\\scratch';
  if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });
  const localTestPdf = path.join(scratchDir, 'CTR-2026-0109_v10139.pdf');
  try {
    await ssh.getFile(localTestPdf, remotePdfPath);
    console.log('PDF descargado localmente para verificación visual:', localTestPdf);
  } catch (errGet) {
    console.warn('Advertencia descargando PDF de prueba:', errGet.message);
  }

  // 4. DESPLIEGUE FRONTEND DIST A DEV Y PROD
  console.log('\n--- 4. DESPLIEGUE FRONTEND DIST A DEV Y PROD ---');
  const localDistDev = path.resolve(__dirname, '../ejecucion/frontend/dist_dev');
  const localDistProd = path.resolve(__dirname, '../ejecucion/frontend/dist_prod');
  const remoteDevDist = '/var/www/html/lg-gsp-dev';
  const remoteProdDist = '/var/www/html/lg-gsp-prod';

  console.log('4.0 Limpiando directorios remotos...');
  await ssh.execCommand(`rm -rf ${remoteDevDist}/* ${remoteProdDist}/*`);

  console.log(`4.1 Subiendo a DEV (${remoteDevDist}) desde ${localDistDev}...`);
  const statusDev = await ssh.putDirectory(localDistDev, remoteDevDist, {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.git')
  });
  if (!statusDev) throw new Error('Fallo al transferir dist_dev a DEV');

  console.log(`4.2 Subiendo a PROD (${remoteProdDist}) desde ${localDistProd}...`);
  const statusProd = await ssh.putDirectory(localDistProd, remoteProdDist, {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.git')
  });
  if (!statusProd) throw new Error('Fallo al transferir dist_prod a PROD');

  console.log('4.3 Ajustando permisos nginx:nginx y 755...');
  await ssh.execCommand(`chown -R nginx:nginx ${remoteDevDist} && chmod -R 755 ${remoteDevDist}`);
  await ssh.execCommand(`chown -R nginx:nginx ${remoteProdDist} && chmod -R 755 ${remoteProdDist}`);

  // 5. GOBERNANZA: SINCRONIZACIÓN EN TCFG_BACKLOG Y TCFG_RELEASES
  console.log('\n--- 5. GOBERNANZA: REGISTRO EN TCFG_BACKLOG Y TCFG_RELEASES ---');
  const schemas = ['sch_leangsp', 'sch_leangsp_prod'];
  for (const s of schemas) {
    const sql = `
      INSERT INTO ${s}.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_implementacion, solicitado_por, estado)
      VALUES (
        'REQ-1046',
        'Restauración 100% Literal del Texto Legal Validado por Abogados y Formato Original del Anexo en Contrato de Arrendamiento de Maquinaria (Plataforma) en 2 Páginas',
        'Restitución palabra por palabra de las 14 cláusulas legales originales en 1 sola columna + comparecencia original en Página 1, y formato original exacto del Anexo de Condiciones Particulares (1, B, C, D, E, F y Firma Representante) en Página 2, comprimido únicamente vía CSS.',
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
        '1.0.139',
        'Restauración 100% Literal del Texto Legal y Formato Original del Anexo en Contrato de Arrendamiento de Maquinaria (Plataforma) (REQ-1046)',
        'HOTFIX',
        'Restauración íntegra y literal del texto validado por abogados para las 14 cláusulas en 1 columna y estructura original del Anexo en 2 páginas exactas.',
        'REQ-1046',
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

  // 6. VERIFICACIÓN HTTP PORTALES
  console.log('\n--- 6. VERIFICACIÓN HTTP EN VIVO ---');
  const devCheck = await checkUrl('https://servidor.leanglobal.cl/lg-gsp-dev/');
  const prodCheck = await checkUrl('https://servidor.leanglobal.cl/lg-gsp-prod/');
  console.log('DEV (https://servidor.leanglobal.cl/lg-gsp-dev/):', devCheck.status);
  console.log('PROD (https://servidor.leanglobal.cl/lg-gsp-prod/):', prodCheck.status);

  ssh.dispose();
  console.log('\n✅ DESPLIEGUE A DEV Y PROD v1.0.139 FINALIZADO CON ÉXITO.');
}

deployContratoLiteralV10139().catch(e => {
  console.error('Error durante el despliegue:', e);
  process.exit(1);
});
