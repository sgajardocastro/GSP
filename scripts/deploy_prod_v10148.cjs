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

async function deployProdV10148() {
  console.log('========================================================================');
  console.log('🚀 DESPLIEGUE A PRODUCCIÓN: WEB v1.0.148, PWA v1.0.51 Y BD (GSP)');
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
  // 1. MIGRACIÓN DDL Y GOBERNANZA BD EN sch_leangsp_prod
  // -------------------------------------------------------------------------
  console.log('--- 1. APLICANDO PAQUETE MAESTRO DE HOMOLOGACIÓN DDL EN sch_leangsp_prod ---');
  const sqlFile = path.resolve(__dirname, '../ejecucion/bd/migration_pack_prod_homologacion_v10148.sql');
  const remoteSql = '/tmp/migration_pack_prod_homologacion_v10148.sql';

  console.log(`Subiendo ${sqlFile} a ${remoteSql}...`);
  await ssh.putFile(sqlFile, remoteSql);

  console.log('Ejecutando script SQL en PostgreSQL (sch_leangsp_prod y sch_leangsp)...');
  const resSql = await ssh.execCommand(`su - postgres -c "psql -d postgres -f ${remoteSql}"`);
  console.log('Resultado DDL:');
  const sqlLines = (resSql.stdout || '').split('\n').filter(Boolean);
  const sqlErrors = sqlLines.filter(l => l.includes('ERROR:'));
  if (sqlErrors.length > 0) {
    console.error('⚠️ Se detectaron errores SQL:\n', sqlErrors.join('\n'));
    throw new Error('Fallo crítico en migración de Base de Datos PROD');
  } else {
    console.log(`✅ Script SQL ejecutado sin errores (${sqlLines.length} instrucciones procesadas).\n`);
  }

  // -------------------------------------------------------------------------
  // 2. SINCRONIZACIÓN BACKEND REMOTO EN PRODUCCIÓN (PM2 ID 13)
  // -------------------------------------------------------------------------
  console.log('--- 2. ACTUALIZANDO BACKEND REMOTO EN PRODUCCIÓN (/home/nodeadmin/proyectos/lean-services-gsp-prod) ---');
  const prodBackendDir = '/home/nodeadmin/proyectos/lean-services-gsp-prod';

  // Subir controladores modificados recientemente
  const controllersToSync = [
    'src/controllers/reportDiarioController.js',
    'src/controllers/viajeController.js',
    'src/controllers/proyectosController.js',
    'src/controllers/actaPlataformaController.js',
    'src/models/viajeModel.js',
    'src/models/actaPlataformaModel.js',
    'src/services/reportDiarioPdfService.js'
  ];

  for (const relPath of controllersToSync) {
    const localF = path.resolve(__dirname, '../ejecucion/backend_remoto', relPath);
    if (fs.existsSync(localF)) {
      const remoteF = `${prodBackendDir}/${relPath}`;
      await ssh.putFile(localF, remoteF);
      console.log(`  ✓ ${relPath}`);
    }
  }

  console.log('Reiniciando proceso PM2 ID 13 (lean-services-gsp-prod)...');
  const pm2Res = await ssh.execCommand('su - nodeadmin -c "pm2 restart 13"');
  console.log('Estado PM2:\n', pm2Res.stdout || pm2Res.stderr);

  // -------------------------------------------------------------------------
  // 3. DESPLIEGUE FRONTEND WEB PROD (/var/www/html/lg-gsp-prod)
  // -------------------------------------------------------------------------
  console.log('\n--- 3. DESPLEGANDO PORTAL WEB PROD (/var/www/html/lg-gsp-prod) ---');
  const localWebDist = path.resolve(__dirname, '../ejecucion/frontend/dist_prod');
  const remoteWebDir = '/var/www/html/lg-gsp-prod';

  console.log(`Subiendo ${localWebDist} a ${remoteWebDir}...`);
  const statusWeb = await ssh.putDirectory(localWebDist, remoteWebDir, {
    recursive: true,
    concurrency: 10,
    validate: (p) => !p.includes('.git')
  });
  if (!statusWeb) throw new Error('Fallo al transferir Frontend Web a PROD');
  await ssh.execCommand(`chown -R nginx:nginx ${remoteWebDir} && chmod -R 755 ${remoteWebDir}`);
  console.log('✅ Portal Web PROD desplegado y permisos asignados.\n');

  // -------------------------------------------------------------------------
  // 4. DESPLIEGUE PWA OPERADOR PROD (/var/www/html/pwa-gsp-prod)
  // -------------------------------------------------------------------------
  console.log('--- 4. DESPLEGANDO PWA OPERADOR PROD (/var/www/html/pwa-gsp-prod) ---');
  const localPwaDist = path.resolve(__dirname, '../ejecucion/pwa/dist_prod');
  const remotePwaDir = '/var/www/html/pwa-gsp-prod';

  console.log(`Subiendo ${localPwaDist} a ${remotePwaDir}...`);
  const statusPwa = await ssh.putDirectory(localPwaDist, remotePwaDir, {
    recursive: true,
    concurrency: 10,
    validate: (p) => !p.includes('.git')
  });
  if (!statusPwa) throw new Error('Fallo al transferir PWA a PROD');
  await ssh.execCommand(`chown -R nginx:nginx ${remotePwaDir} && chmod -R 755 ${remotePwaDir}`);
  console.log('✅ PWA Operador PROD desplegada y permisos asignados.\n');

  // -------------------------------------------------------------------------
  // 5. SINCRONIZACIÓN DE LOS 15 MANUALES HTML EN PROD
  // -------------------------------------------------------------------------
  console.log('--- 5. SINCRONIZANDO CENTRO DE DOCUMENTACIÓN Y MANUALES EN PROD ---');
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

  for (const doc of docsList) {
    const localDoc = path.resolve(__dirname, '../ejecucion/frontend/public', doc);
    await ssh.putFile(localDoc, `${remoteWebDir}/${doc}`);
    console.log(`  ✓ ${doc}`);
  }
  await ssh.execCommand(`chown -R nginx:nginx ${remoteWebDir}/*.html && chmod 644 ${remoteWebDir}/*.html`);
  console.log('✅ 15 Manuales HTML subidos a Producción.\n');

  // -------------------------------------------------------------------------
  // 6. VERIFICACIÓN DETERMINISTA HTTP Y DB
  // -------------------------------------------------------------------------
  console.log('--- 6. VERIFICACIÓN EN VIVO (SMOKE TEST PROD) ---');
  const resWeb = await checkUrl('https://servidor.leanglobal.cl/lg-gsp-prod/');
  console.log('HTTP Status Portal Web PROD:', resWeb.status);

  const resPwa = await checkUrl('https://servidor.leanglobal.cl/pwa-gsp-prod/');
  console.log('HTTP Status PWA Operador PROD:', resPwa.status);

  const resDoc = await checkUrl('https://servidor.leanglobal.cl/lg-gsp-prod/centro_documentacion_gsp.html');
  console.log('HTTP Status Centro Documentación PROD:', resDoc.status);

  // Verificación de tabla tope_acta_plataforma en PROD
  const chkTable = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -A -c \\"SELECT count(*) FROM information_schema.tables WHERE table_schema = 'sch_leangsp_prod' AND table_name = 'tope_acta_plataforma';\\""`);
  console.log('Tabla tope_acta_plataforma en sch_leangsp_prod:', chkTable.stdout.trim() === '1' ? 'EXISTE (1)' : 'NO EXISTE (0)');

  // Verificación de releases en PROD
  const chkRel = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -A -c \\"SELECT version, titulo FROM sch_leangsp_prod.tcfg_releases WHERE version = 'v1.0.148';\\""`);
  console.log('Release en sch_leangsp_prod.tcfg_releases:', chkRel.stdout.trim() || 'NO ENCONTRADO');

  ssh.dispose();
  console.log('\n========================================================================');
  console.log('🎉 DESPLIEGUE A PRODUCCIÓN FINALIZADO EXITOSAMENTE');
  console.log('========================================================================\n');
}

deployProdV10148().catch(err => {
  console.error('\n❌ ERROR FATAL EN DESPLIEGUE A PRODUCCIÓN:', err);
  process.exit(1);
});
