const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
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

async function deployDevProdV10130() {
  console.log('=== DESPLIEGUE A DEV Y PROD v1.0.130 (SPEC-075 / SOPORTE COMERCIAL Y COTIZADOR) ===\n');
  console.log('Conectando a servidor SSH...');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  // 1. DESPLIEGUE BACKEND (proyectoModel.js)
  console.log('\n--- 1. DESPLIEGUE BACKEND A DEV Y PROD ---');
  const localModel = path.resolve(__dirname, '../ejecucion/backend_remoto/src/models/proyectoModel.js');
  const devModel = '/home/nodeadmin/proyectos/lean-services-gsp/src/models/proyectoModel.js';
  const prodModel = '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/models/proyectoModel.js';

  console.log('1.1 Subiendo a DEV backend...');
  await ssh.putFile(localModel, devModel);
  await ssh.execCommand(`chown nodeadmin:nodeadmin ${devModel}`);

  console.log('1.2 Subiendo a PROD backend...');
  await ssh.putFile(localModel, prodModel);
  await ssh.execCommand(`chown nodeadmin:nodeadmin ${prodModel}`);

  console.log('1.3 Reiniciando PM2 DEV (10) y PROD (13)...');
  const restartDev = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
  console.log('PM2 10 (DEV):', restartDev.stdout.split('\n')[0] || restartDev.stderr);
  const restartProd = await ssh.execCommand('su - nodeadmin -c "pm2 restart 13"');
  console.log('PM2 13 (PROD):', restartProd.stdout.split('\n')[0] || restartProd.stderr);

  await new Promise(r => setTimeout(r, 2000));

  // 2. DESPLIEGUE FRONTEND
  console.log('\n--- 2. DESPLIEGUE FRONTEND DIST A DEV Y PROD ---');
  const localDistDev = path.resolve(__dirname, '../ejecucion/frontend/dist_dev');
  const localDistProd = path.resolve(__dirname, '../ejecucion/frontend/dist_prod');
  const remoteDevDist = '/var/www/html/lg-gsp-dev';
  const remoteProdDist = '/var/www/html/lg-gsp-prod';

  console.log(`2.1 Subiendo a DEV (${remoteDevDist}) desde ${localDistDev}...`);
  const statusDev = await ssh.putDirectory(localDistDev, remoteDevDist, {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.git')
  });
  if (!statusDev) throw new Error('Fallo al transferir dist_dev a DEV');

  console.log(`2.2 Subiendo a PROD (${remoteProdDist}) desde ${localDistProd}...`);
  const statusProd = await ssh.putDirectory(localDistProd, remoteProdDist, {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.git')
  });
  if (!statusProd) throw new Error('Fallo al transferir dist_prod a PROD');

  console.log('2.3 Ajustando permisos nginx:nginx y 755...');
  await ssh.execCommand(`chown -R nginx:nginx ${remoteDevDist} && chmod -R 755 ${remoteDevDist}`);
  await ssh.execCommand(`chown -R nginx:nginx ${remoteProdDist} && chmod -R 755 ${remoteProdDist}`);

  // 3. GOBERNANZA: SINCRONIZACIÓN EN TCFG_BACKLOG Y TCFG_RELEASES
  console.log('\n--- 3. GOBERNANZA: REGISTRO EN TCFG_BACKLOG Y TCFG_RELEASES ---');
  const schemas = ['sch_leangsp', 'sch_leangsp_prod'];
  for (const s of schemas) {
    const sql = `
      INSERT INTO ${s}.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_implementacion, solicitado_por, estado)
      VALUES 
      (
        'REQ-1031',
        'Desbloqueo de Conceptos de Alimentación en Servicios de 1 Día',
        'TSK-SOP-01: Elimina bloqueo y forzado a NA en pensiones/viáticos en servicios de 1 día, permitiendo al comercial acordar si el cliente provee o no alimentación.',
        'Alta',
        CURRENT_DATE,
        'Jorge Ponce',
        'Implementado'
      ),
      (
        'REQ-1032',
        'Incorporación de Camión Plataforma en Traslados CRM',
        'TSK-SOP-02: Agrega subcategoría Camión Plataforma (ID 905) bajo categoría TRASLADOS (99) y permite asignación de ramplas/camiones plataforma en cotizador.',
        'Alta',
        CURRENT_DATE,
        'Jorge Ponce',
        'Implementado'
      ),
      (
        'REQ-1033',
        'Prevención de Conflicto de Autocompletado en Formulario CRM',
        'TSK-SOP-03: Erradica sobreescritura indeseada y borrado de teléfonos en inputs de mandante y contactos usando autocomplete="new-password" y name namespaced.',
        'Alta',
        CURRENT_DATE,
        'Jorge Ponce',
        'Implementado'
      ),
      (
        'REQ-1034',
        'Inclusión de Ejecutivo Comercial y Fono Directo en PDF Cotización',
        'TSK-COT-01: Muestra nombre y número de contacto directo del ejecutivo responsable en el bloque de metadatos de la cotización PDF.',
        'Media',
        CURRENT_DATE,
        'Jorge Ponce',
        'Implementado'
      ),
      (
        'REQ-1035',
        'Parametrización y Branding Dinámico de Empresa Emisora en Cotización PDF',
        'TSK-COT-02: Asocia dinámicamente razón social, RUT y logo de Royal Rental, Bestmaq, Logística o San Pablo según id_empresa de la cotización.',
        'Media',
        CURRENT_DATE,
        'Jorge Ponce',
        'Implementado'
      ),
      (
        'REQ-1036',
        'Supresión de Cláusula de Régimen Urbano en Caso 5 (Plataformas / Partidas Abiertas)',
        'TSK-COT-03: Oculta la leyenda de régimen urbano en el PDF cuando la cotización corresponde a Caso 5, catalogándolo como Especial / Plataformas.',
        'Baja',
        CURRENT_DATE,
        'Jorge Ponce',
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
        'v1.0.130',
        'Mejoras de Soporte CRM: Alimentación Flexible, Camión Plataforma y PDF Paramétrico (SPEC-075)',
        'Feature & Mejoras',
        'Desbloqueo de edición de viáticos en servicios de 1 día, nueva categoría de Camión Plataforma en traslados, blindaje anti-autofill en formularios CRM y personalización completa de ejecutivo y empresa emisora en cotizaciones PDF.',
        '["REQ-1031", "REQ-1032", "REQ-1033", "REQ-1034", "REQ-1035", "REQ-1036"]'::jsonb,
        'Sergio Gajardo'
      )
      ON CONFLICT (version) DO UPDATE SET 
        titulo = EXCLUDED.titulo,
        tipo_release = EXCLUDED.tipo_release,
        descripcion_impacto = EXCLUDED.descripcion_impacto,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados,
        fecha_release = CURRENT_DATE;
    `;
    const resSql = await ssh.execCommand('su - postgres -c "psql -d postgres"', { stdin: sql });
    console.log(`Base de Datos (${s}):`, resSql.stdout.trim() || resSql.stderr);
  }

  // 4. VERIFICACIÓN HTTP
  console.log('\n--- 4. VERIFICACIÓN HTTP EN VIVO ---');
  const devCheck = await checkUrl('https://servidor.leanglobal.cl/lg-gsp-dev/');
  const prodCheck = await checkUrl('https://servidor.leanglobal.cl/lg-gsp-prod/');
  console.log('DEV (https://servidor.leanglobal.cl/lg-gsp-dev/):', devCheck.status);
  console.log('PROD (https://servidor.leanglobal.cl/lg-gsp-prod/):', prodCheck.status);

  const headDev = await ssh.execCommand('head -n 25 /var/www/html/lg-gsp-dev/index.html');
  console.log('\nDEV index.html script tag:');
  console.log(headDev.stdout.split('\n').filter(l => l.includes('script') || l.includes('link')).join('\n'));

  const headProd = await ssh.execCommand('head -n 25 /var/www/html/lg-gsp-prod/index.html');
  console.log('\nPROD index.html script tag:');
  console.log(headProd.stdout.split('\n').filter(l => l.includes('script') || l.includes('link')).join('\n'));

  ssh.dispose();
  console.log('\n✅ DESPLIEGUE A DEV Y PROD v1.0.130 FINALIZADO CON ÉXITO.');
}

deployDevProdV10130().catch(e => {
  console.error('Error durante el despliegue:', e);
  process.exit(1);
});
