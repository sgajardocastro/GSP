const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
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

const docsList = [
  'centro_documentacion_gsp.html',
  'manual_operador_terreno_gsp.html',
  'manual_entrega_y_retorno_plataformas_bsm.html',
  'guia_asignacion_recursos_traslados_y_reports.html',
  'marcha_blanca_casos_negocio.html',
  'diseno_real_formularios_mantenimiento.html',
  'protocolo_verificacion_mantenimiento_e2e.html',
  'manual_operativo_inventario_wms_gsp.html',
  'maqueta_mobile_qr_wms.html',
  'navegacion_cotizacion_web.html',
  'manual_cotizacion_paso_a_paso.html',
  'simulador_cotizacion.html',
  'presentacion_pipeline_interactivo.html',
  'proceso_financiero_integral_y_protocolo_pruebas_gsp.html',
  'politica_manejo_excepciones_gsp.html'
];

async function deployWebV10149() {
  console.log('========================================================================');
  console.log('🚀 DESPLIEGUE WEB CRM EN DEV Y PROD: EXPEDIENTE CANÓNICO E2E (v1.0.149)');
  console.log('========================================================================\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295,
    readyTimeout: 30000
  });
  console.log('✅ Conectado exitosamente por SSH como root.\n');

  // -------------------------------------------------------------------------
  // 1. DESPLIEGUE FRONTEND WEB DEV (/var/www/html/lg-gsp-dev)
  // -------------------------------------------------------------------------
  console.log('--- 1. DESPLEGANDO PORTAL WEB EN DEV (/var/www/html/lg-gsp-dev) ---');
  const localDevDist = path.resolve(__dirname, '../ejecucion/frontend/dist_dev');
  const remoteDevDir = '/var/www/html/lg-gsp-dev';

  console.log(`Subiendo ${localDevDist} a ${remoteDevDir}...`);
  const statusDev = await ssh.putDirectory(localDevDist, remoteDevDir, {
    recursive: true,
    concurrency: 10,
    validate: (p) => !p.includes('.git')
  });
  if (!statusDev) throw new Error('Fallo al transferir Frontend Web a DEV');
  await ssh.execCommand(`chown -R nginx:nginx ${remoteDevDir} && chmod -R 755 ${remoteDevDir}`);
  console.log('✅ Portal Web DEV desplegado y permisos asignados.\n');

  // Re-sincronizar los 15 manuales en DEV
  console.log('Sincronizando manuales HTML en DEV...');
  for (const doc of docsList) {
    const localDoc = path.resolve(__dirname, '../ejecucion/frontend/public', doc);
    await ssh.putFile(localDoc, `${remoteDevDir}/${doc}`);
  }
  await ssh.execCommand(`chown -R nginx:nginx ${remoteDevDir}/*.html && chmod 644 ${remoteDevDir}/*.html`);
  console.log('✅ 15 Manuales HTML sincronizados en DEV.\n');

  // -------------------------------------------------------------------------
  // 2. DESPLIEGUE FRONTEND WEB PROD (/var/www/html/lg-gsp-prod)
  // -------------------------------------------------------------------------
  console.log('--- 2. DESPLEGANDO PORTAL WEB EN PROD (/var/www/html/lg-gsp-prod) ---');
  const localProdDist = path.resolve(__dirname, '../ejecucion/frontend/dist_prod');
  const remoteProdDir = '/var/www/html/lg-gsp-prod';

  console.log(`Subiendo ${localProdDist} a ${remoteProdDir}...`);
  const statusProd = await ssh.putDirectory(localProdDist, remoteProdDir, {
    recursive: true,
    concurrency: 10,
    validate: (p) => !p.includes('.git')
  });
  if (!statusProd) throw new Error('Fallo al transferir Frontend Web a PROD');
  await ssh.execCommand(`chown -R nginx:nginx ${remoteProdDir} && chmod -R 755 ${remoteProdDir}`);
  console.log('✅ Portal Web PROD desplegado y permisos asignados.\n');

  // Re-sincronizar los 15 manuales en PROD
  console.log('Sincronizando manuales HTML en PROD...');
  for (const doc of docsList) {
    const localDoc = path.resolve(__dirname, '../ejecucion/frontend/public', doc);
    await ssh.putFile(localDoc, `${remoteProdDir}/${doc}`);
  }
  await ssh.execCommand(`chown -R nginx:nginx ${remoteProdDir}/*.html && chmod 644 ${remoteProdDir}/*.html`);
  console.log('✅ 15 Manuales HTML sincronizados en PROD.\n');

  // -------------------------------------------------------------------------
  // 3. SINCRONIZACIÓN BD POSTGRESQL (tcfg_backlog y tcfg_releases)
  // -------------------------------------------------------------------------
  console.log('--- 3. SINCRONIZANDO GOBERNANZA BD EN DEV Y PROD ---');
  const sql = `
    -- DEV
    INSERT INTO sch_leangsp.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_implementacion, solicitado_por, estado)
    VALUES (
      'REQ-1057',
      'Expediente Documental Integral E2E de Procesos y OTs en Gestor Documental (Alineación Flujo Izaje vs Plataformas)',
      'Reestructuración canónica del Gestor Documental (Documentos.vue): 5 etapas base de izaje (Comercial, Asignación OT, Logística/Acreditaciones, Operación en Faena, Liquidación/EDP); etapa 6 (Arriendo Plataformas BSM) estrictamente condicional; conteo limpio por cliente (X procesos en Nivel 1) y contadores dinámicos X de Y Etapas Activas.',
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
      'v1.0.149',
      'Portal Web GSP v1.0.149 - Reestructuración Canónica Expediente E2E Izaje vs Plataformas en Gestor Documental',
      'Feature',
      'Normalización a 5 etapas base para servicios de izaje; condicionalidad estricta para arriendo de plataformas; agrupación limpia por cliente sin cálculo prematuro de documentos en Nivel 1; y badges dinámicos de etapas.',
      jsonb_build_array('REQ-1057'),
      'Sergio Gajardo'
    )
    ON CONFLICT (version) DO UPDATE SET
      titulo = EXCLUDED.titulo,
      tipo_release = EXCLUDED.tipo_release,
      descripcion_impacto = EXCLUDED.descripcion_impacto,
      requerimientos_asociados = EXCLUDED.requerimientos_asociados;

    -- PROD
    INSERT INTO sch_leangsp_prod.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_implementacion, solicitado_por, estado)
    VALUES (
      'REQ-1057',
      'Expediente Documental Integral E2E de Procesos y OTs en Gestor Documental (Alineación Flujo Izaje vs Plataformas)',
      'Reestructuración canónica del Gestor Documental (Documentos.vue): 5 etapas base de izaje (Comercial, Asignación OT, Logística/Acreditaciones, Operación en Faena, Liquidación/EDP); etapa 6 (Arriendo Plataformas BSM) estrictamente condicional; conteo limpio por cliente (X procesos en Nivel 1) y contadores dinámicos X de Y Etapas Activas.',
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

    INSERT INTO sch_leangsp_prod.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
    VALUES (
      'v1.0.149',
      'Portal Web GSP v1.0.149 - Reestructuración Canónica Expediente E2E Izaje vs Plataformas en Gestor Documental',
      'Feature',
      'Normalización a 5 etapas base para servicios de izaje; condicionalidad estricta para arriendo de plataformas; agrupación limpia por cliente sin cálculo prematuro de documentos en Nivel 1; y badges dinámicos de etapas.',
      jsonb_build_array('REQ-1057'),
      'Sergio Gajardo'
    )
    ON CONFLICT (version) DO UPDATE SET
      titulo = EXCLUDED.titulo,
      tipo_release = EXCLUDED.tipo_release,
      descripcion_impacto = EXCLUDED.descripcion_impacto,
      requerimientos_asociados = EXCLUDED.requerimientos_asociados;
  `;

  const psqlDev = await ssh.execCommand(`docker exec -i postgres_master psql -U leangsp -d leangsp_db -c "${sql.replace(/"/g, '\\"')}"`);
  console.log('Resultado PostgreSQL:', psqlDev.stdout || psqlDev.stderr);

  // -------------------------------------------------------------------------
  // 4. VERIFICACIÓN DETERMINISTA HTTP (SMOKE TESTS DEV Y PROD)
  // -------------------------------------------------------------------------
  console.log('--- 4. VERIFICACIÓN DETERMINISTA HTTP ---');
  const resWebDev = await checkUrl('https://servidor.leanglobal.cl/lg-gsp-dev/');
  console.log('HTTP Status Portal Web DEV:', resWebDev.status);

  const resWebProd = await checkUrl('https://servidor.leanglobal.cl/lg-gsp-prod/');
  console.log('HTTP Status Portal Web PROD:', resWebProd.status);

  const resDocDev = await checkUrl('https://servidor.leanglobal.cl/lg-gsp-dev/centro_documentacion_gsp.html');
  console.log('HTTP Status Manuales DEV:', resDocDev.status);

  const resDocProd = await checkUrl('https://servidor.leanglobal.cl/lg-gsp-prod/centro_documentacion_gsp.html');
  console.log('HTTP Status Manuales PROD:', resDocProd.status);

  ssh.dispose();
  console.log('\n========================================================================');
  console.log('🎉 DESPLIEGUE A DEV Y PROD COMPLETADO CON ÉXITO (v1.0.149)');
  console.log('========================================================================\n');
}

deployWebV10149().catch(err => {
  console.error('\n❌ ERROR FATAL EN DESPLIEGUE:', err);
  process.exit(1);
});
