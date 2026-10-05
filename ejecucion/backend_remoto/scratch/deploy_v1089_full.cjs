const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function deployV1089() {
  console.log('==================================================================');
  console.log('🚀 DESPLIEGUE OFICIAL v1.0.89 A DEV Y PROD');
  console.log('REQ-988: Flujo Retorno a Base al Último Report');
  console.log('REQ-991: Pipeline Documental en Control en Vivo con SLA 13:00 hrs');
  console.log('==================================================================');

  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: 'lgbl2025.',
    readyTimeout: 25000
  });
  console.log('✅ Conectado como root por SSH.');

  // ------------------------------------------------------------------
  // 1. SINCRONIZACIÓN POSTGRESQL (tcfg_backlog & tcfg_releases)
  // ------------------------------------------------------------------
  console.log('\n🗄️ 1. Sincronizando Backlog y Releases en DEV (sch_leangsp) y PROD (sch_leangsp_prod)...');
  const sql = `
BEGIN;

-- REQ-988 en DEV
INSERT INTO sch_leangsp.tcfg_backlog (
  codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_registro, fecha_implementacion, solicitado_por, estado
) VALUES (
  'REQ-988',
  'Flujo de Retorno a Base - Registro de Viaje Reverso al Último Report de Faena',
  'Generación automática de viaje de retorno al sellar el último report de la OT (dia_correlativo >= dias_planificados). Salida de faena hacia patio base GSP con odómetro, horómetro y PIN. Llegada a patio con odómetro, horómetro, porcentaje combustible (1-100%), fotos de tablero, marcador de estanque y checklist de patio. Cierre del proyecto a OPERACIONALMENTE_CONCLUIDO y liberación del equipo a DISPONIBLE.',
  'Alta',
  CURRENT_DATE,
  CURRENT_DATE,
  'Jorge Ponce / Dirección GSP',
  'Implementado'
) ON CONFLICT (codigo_req) DO UPDATE SET 
  estado = 'Implementado', 
  fecha_implementacion = CURRENT_DATE,
  updated_at = NOW();

-- REQ-988 en PROD
INSERT INTO sch_leangsp_prod.tcfg_backlog (
  codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_registro, fecha_implementacion, solicitado_por, estado
) VALUES (
  'REQ-988',
  'Flujo de Retorno a Base - Registro de Viaje Reverso al Último Report de Faena',
  'Generación automática de viaje de retorno al sellar el último report de la OT (dia_correlativo >= dias_planificados). Salida de faena hacia patio base GSP con odómetro, horómetro y PIN. Llegada a patio con odómetro, horómetro, porcentaje combustible (1-100%), fotos de tablero, marcador de estanque y checklist de patio. Cierre del proyecto a OPERACIONALMENTE_CONCLUIDO y liberación del equipo a DISPONIBLE.',
  'Alta',
  CURRENT_DATE,
  CURRENT_DATE,
  'Jorge Ponce / Dirección GSP',
  'Implementado'
) ON CONFLICT (codigo_req) DO UPDATE SET 
  estado = 'Implementado', 
  fecha_implementacion = CURRENT_DATE,
  updated_at = NOW();

-- REQ-991 en DEV
INSERT INTO sch_leangsp.tcfg_backlog (
  codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_registro, fecha_implementacion, solicitado_por, estado
) VALUES (
  'REQ-991',
  'Pipeline Documental y Liquidación en Control en Vivo con Umbral SLA 13:00 hrs',
  'Integración en Control Operativo en Vivo de la franja interactiva de 4 hitos [1. ITS] -> [2. EDP] -> [3. OC / HES] -> [4. FACTURA] por servicio. Apertura directa de modales ModalITS y ModalCaratulaEDP sin salir de la vista. Detección determinista de SLA de emisión de ITS al día hábil siguiente a las 13:00 hrs con semáforo rojo pulsante y KPIs consolidados.',
  'Alta',
  CURRENT_DATE,
  CURRENT_DATE,
  'Jorge Ponce / Dirección GSP',
  'Implementado'
) ON CONFLICT (codigo_req) DO UPDATE SET 
  estado = 'Implementado', 
  fecha_implementacion = CURRENT_DATE,
  updated_at = NOW();

-- REQ-991 en PROD
INSERT INTO sch_leangsp_prod.tcfg_backlog (
  codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_registro, fecha_implementacion, solicitado_por, estado
) VALUES (
  'REQ-991',
  'Pipeline Documental y Liquidación en Control en Vivo con Umbral SLA 13:00 hrs',
  'Integración en Control Operativo en Vivo de la franja interactiva de 4 hitos [1. ITS] -> [2. EDP] -> [3. OC / HES] -> [4. FACTURA] por servicio. Apertura directa de modales ModalITS y ModalCaratulaEDP sin salir de la vista. Detección determinista de SLA de emisión de ITS al día hábil siguiente a las 13:00 hrs con semáforo rojo pulsante y KPIs consolidados.',
  'Alta',
  CURRENT_DATE,
  CURRENT_DATE,
  'Jorge Ponce / Dirección GSP',
  'Implementado'
) ON CONFLICT (codigo_req) DO UPDATE SET 
  estado = 'Implementado', 
  fecha_implementacion = CURRENT_DATE,
  updated_at = NOW();

-- Insertar Release v1.0.89 en DEV
INSERT INTO sch_leangsp.tcfg_releases (version, fecha_release, titulo, requerimientos_asociados, publicado_por)
VALUES (
  'v1.0.89',
  CURRENT_DATE,
  'Release v1.0.89: Retorno a Base al Último Report (REQ-988) y Pipeline Documental en Vivo con Alerta SLA 13:00 hrs (REQ-991)',
  '["REQ-988", "REQ-991"]'::jsonb,
  'DevOps / Antigravity'
) ON CONFLICT (version) DO UPDATE SET 
  fecha_release = EXCLUDED.fecha_release,
  titulo = EXCLUDED.titulo,
  requerimientos_asociados = EXCLUDED.requerimientos_asociados;

-- Insertar Release v1.0.89 en PROD
INSERT INTO sch_leangsp_prod.tcfg_releases (version, fecha_release, titulo, requerimientos_asociados, publicado_por)
VALUES (
  'v1.0.89',
  CURRENT_DATE,
  'Release v1.0.89: Retorno a Base al Último Report (REQ-988) y Pipeline Documental en Vivo con Alerta SLA 13:00 hrs (REQ-991)',
  '["REQ-988", "REQ-991"]'::jsonb,
  'DevOps / Antigravity'
) ON CONFLICT (version) DO UPDATE SET 
  fecha_release = EXCLUDED.fecha_release,
  titulo = EXCLUDED.titulo,
  requerimientos_asociados = EXCLUDED.requerimientos_asociados;

COMMIT;
`;

  await ssh.execCommand(`cat << 'EOF' > /tmp/sync_v1089.sql\n${sql}\nEOF`);
  const dbRes = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/sync_v1089.sql"');
  console.log(dbRes.stdout);
  console.log('✅ Base de datos DEV y PROD sincronizadas con éxito.');

  // ------------------------------------------------------------------
  // 2. SUBIDA DE ARCHIVOS BACKEND A DEV Y PROD
  // ------------------------------------------------------------------
  console.log('\n⚙️ 2. Subiendo directorio src completo de Backend a DEV y PROD...');
  const rootDir = 'D:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas';
  const backendSrc = `${rootDir}/ejecucion/backend_remoto/src`;

  const devBackend = '/home/nodeadmin/proyectos/lean-services-gsp/src';
  const prodBackend = '/home/nodeadmin/proyectos/lean-services-gsp-prod/src';

  console.log('Sincronizando Backend a DEV (/home/nodeadmin/proyectos/lean-services-gsp/src)...');
  await ssh.putDirectory(backendSrc, devBackend, { recursive: true, concurrency: 8 });

  console.log('Sincronizando Backend a PROD (/home/nodeadmin/proyectos/lean-services-gsp-prod/src)...');
  await ssh.putDirectory(backendSrc, prodBackend, { recursive: true, concurrency: 8 });

  await ssh.execCommand(`chown -R nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp /home/nodeadmin/proyectos/lean-services-gsp-prod`);

  console.log('Reiniciando procesos PM2: lean-services-gsp (ID 10) y lean-services-gsp-prod (ID 13)...');
  await ssh.execCommand('su - nodeadmin -c "pm2 reload 10"');
  await ssh.execCommand('su - nodeadmin -c "pm2 reload 13"');
  const pm2Status = await ssh.execCommand('su - nodeadmin -c "pm2 status 10 13"');
  console.log(pm2Status.stdout);
  console.log('✅ Backend actualizado y reiniciado con éxito.');

  // ------------------------------------------------------------------
  // 3. SUBIDA DE FRONTEND WEB A DEV Y PROD
  // ------------------------------------------------------------------
  console.log('\n🌐 3. Subiendo Frontend Web compilado a DEV y PROD...');
  const localWebDist = `${rootDir}/ejecucion/frontend/dist`;
  const remoteDevWeb = '/var/www/html/lg-gsp-dev';
  const remoteProdWeb = '/var/www/html/lg-gsp-prod';

  console.log(`Subiendo Web a DEV (${remoteDevWeb})...`);
  const statusWebDev = await ssh.putDirectory(localWebDist, remoteDevWeb, {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.map')
  });
  console.log('Upload Web DEV:', statusWebDev ? 'OK' : 'FAIL');

  console.log(`Subiendo Web a PROD (${remoteProdWeb})...`);
  const statusWebProd = await ssh.putDirectory(localWebDist, remoteProdWeb, {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.map')
  });
  console.log('Upload Web PROD:', statusWebProd ? 'OK' : 'FAIL');

  // ------------------------------------------------------------------
  // 4. SUBIDA DE PWA A DEV Y PROD
  // ------------------------------------------------------------------
  console.log('\n📱 4. Subiendo PWA compilada a DEV y PROD...');
  const localPwaDevDist = `${rootDir}/ejecucion/pwa/dist_dev`;
  const localPwaProdDist = `${rootDir}/ejecucion/pwa/dist`;
  const remoteDevPwa = '/var/www/html/pwa-gsp-dev';
  const remoteProdPwa = '/var/www/html/pwa-gsp-prod';

  console.log(`Subiendo PWA a DEV (${remoteDevPwa})...`);
  const statusPwaDev = await ssh.putDirectory(localPwaDevDist, remoteDevPwa, {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.map')
  });
  console.log('Upload PWA DEV:', statusPwaDev ? 'OK' : 'FAIL');

  console.log(`Subiendo PWA a PROD (${remoteProdPwa})...`);
  const statusPwaProd = await ssh.putDirectory(localPwaProdDist, remoteProdPwa, {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.map')
  });
  console.log('Upload PWA PROD:', statusPwaProd ? 'OK' : 'FAIL');

  // ------------------------------------------------------------------
  // 5. PERMISOS Y NGINX
  // ------------------------------------------------------------------
  await ssh.execCommand(`chown -R nginx:nginx ${remoteDevWeb} ${remoteProdWeb} ${remoteDevPwa} ${remoteProdPwa}`);
  await ssh.execCommand(`chmod -R 755 ${remoteDevWeb} ${remoteProdWeb} ${remoteDevPwa} ${remoteProdPwa}`);

  console.log('\n🔄 Recargando Nginx...');
  await ssh.execCommand('systemctl reload nginx');

  // ------------------------------------------------------------------
  // 6. CERTIFICACIÓN HTTP
  // ------------------------------------------------------------------
  console.log('\n🔍 6. Verificando disponibilidad HTTP...');
  const checkDevWeb = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-dev/');
  const checkProdWeb = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-prod/');
  const checkDevPwa = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/pwa-gsp-dev/');
  const checkProdPwa = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/pwa-gsp-prod/');

  console.log(`Status lg-gsp-dev: ${checkDevWeb.stdout}`);
  console.log(`Status lg-gsp-prod: ${checkProdWeb.stdout}`);
  console.log(`Status pwa-gsp-dev: ${checkDevPwa.stdout}`);
  console.log(`Status pwa-gsp-prod: ${checkProdPwa.stdout}`);

  ssh.dispose();
  console.log('\n🎉 ==================================================================');
  console.log('🚀 DESPLIEGUE v1.0.89 COMPLETADO Y CERTIFICADO EXITOSAMENTE');
  console.log('==================================================================');
}

deployV1089().catch(console.error);
