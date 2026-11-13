const { NodeSSH } = require('../node_modules/node-ssh');
const path = require('path');

const ssh = new NodeSSH();

async function run() {
  console.log('==================================================================');
  console.log('🚀 PASE A PRODUCCIÓN: PASO 3 (FRONTEND) + PASO 4 (RELEASE) + HARD GATE 6 CAPAS');
  console.log('==================================================================');

  try {
    await ssh.connect({
      host: '138.255.103.18',
      username: 'root',
      password: 'lgbl2025.',
      port: 1295
    });
    console.log('✅ Conectado por SSH como root.');

    const rootDir = 'D:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas';
    const localFrontendDist = `${rootDir}/ejecucion/frontend/dist`;
    const remoteFrontendProd = '/var/www/html/lg-gsp-prod';

    // -------------------------------------------------------------------------
    // PASO 3: DESPLIEGUE FRONTEND WEB EN PRODUCCIÓN
    // -------------------------------------------------------------------------
    console.log(`\n📦 [PASO 3] Respaldando y preparando ${remoteFrontendProd}...`);
    const ts = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    await ssh.execCommand(`mkdir -p /var/www/html/backups`);
    await ssh.execCommand(`tar -czf /var/www/html/backups/lg-gsp-prod-bak-${ts}.tar.gz -C /var/www/html lg-gsp-prod 2>/dev/null`);

    console.log(`Subiendo Frontend Dist a ${remoteFrontendProd}...`);
    const frontendStatus = await ssh.putDirectory(localFrontendDist, remoteFrontendProd, {
      recursive: true,
      concurrency: 8
    });
    console.log('putDirectory Frontend PROD:', frontendStatus ? 'OK' : 'FAIL');

    console.log('Ajustando permisos nginx:nginx...');
    await ssh.execCommand(`chown -R nginx:nginx ${remoteFrontendProd}`);
    await ssh.execCommand(`chmod -R 755 ${remoteFrontendProd}`);

    // -------------------------------------------------------------------------
    // PASO 4: REGISTRO DE RELEASE EN sch_leangsp_prod.tcfg_releases
    // -------------------------------------------------------------------------
    console.log('\n🏛️ [PASO 4] Registrando Release v1.0.80 en sch_leangsp_prod.tcfg_releases...');
    const insertReleaseSql = `
      INSERT INTO sch_leangsp_prod.tcfg_releases (
        version, fecha_release, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por
      ) VALUES (
        'v1.0.80',
        '2026-10-04',
        'Control Operativo en Vivo Multi-Equipo con la OT como Driver (Producción)',
        'Feature & UX',
        'Pase a producción de la Spec 63: Control Operativo en Vivo con la OT como driver comercial/operativo, selector de flota multi-equipo interactivo, rollup de semáforos cromáticos, mini-franja multi-día, drawer timeline intradía 07:00 a 20:00 y candado operacional.',
        '["REQ-042"]'::jsonb,
        'Sergio Gajardo / Antigravity Agent'
      )
      ON CONFLICT (version) DO UPDATE 
      SET titulo = EXCLUDED.titulo,
          tipo_release = EXCLUDED.tipo_release,
          descripcion_impacto = EXCLUDED.descripcion_impacto,
          requerimientos_asociados = EXCLUDED.requerimientos_asociados,
          publicado_por = EXCLUDED.publicado_por;
    `;
    await ssh.execCommand(`cat << 'EOF' > /tmp/prod_release.sql\n${insertReleaseSql}\nEOF`);
    const relRes = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/prod_release.sql"');
    console.log('Resultado registro BD:', relRes.stdout.trim() || relRes.stderr.trim());
    await ssh.execCommand('rm -f /tmp/prod_release.sql');

    // -------------------------------------------------------------------------
    // PASO 5: PROTOCOLO HARD GATE DE 6 CAPAS (CERTIFICACIÓN 100% PRODUCCIÓN)
    // -------------------------------------------------------------------------
    console.log('\n==================================================================');
    console.log('🏆 BATERÍA HARD GATE DE CERTIFICACIÓN 100% PRODUCCIÓN GSP');
    console.log('==================================================================');
    const gates = {};

    // Gate 1: Base de Datos & Aislamiento Estricto
    console.log('\n🗄️ [Gate 1] Base de Datos & Esquema (sch_leangsp_prod)...');
    const qEq = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -c \\"SELECT count(*) FROM sch_leangsp_prod.tequ_equipo;\\""`);
    const qUsr = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -c \\"SELECT count(*) FROM sch_leangsp_prod.tsec_users;\\""`);
    const qCat = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -c \\"SELECT count(*) FROM sch_leangsp_prod.tequ_categoria;\\""`);
    const qNotifTable = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -c \\"SELECT count(*) FROM information_schema.tables WHERE table_schema = 'sch_leangsp_prod' AND table_name = 'tnot_notification_web';\\""`);
    const qColColacion = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -c \\"SELECT count(*) FROM information_schema.columns WHERE table_schema = 'sch_leangsp_prod' AND table_name = 'tedp_reporte_avance' AND column_name IN ('hora_inicio_colacion', 'hora_termino_colacion');\\""`);

    const countEquipos = parseInt(qEq.stdout.trim(), 10) || 0;
    const countUsuarios = parseInt(qUsr.stdout.trim(), 10) || 0;
    const countCategorias = parseInt(qCat.stdout.trim(), 10) || 0;
    const hasNotifTable = parseInt(qNotifTable.stdout.trim(), 10) === 1;
    const hasColacionCols = parseInt(qColColacion.stdout.trim(), 10) === 2;

    console.log(`   - Equipos en flota: ${countEquipos} (esperado 110)`);
    console.log(`   - Usuarios activos: ${countUsuarios} (esperado 45)`);
    console.log(`   - Categorías: ${countCategorias} (esperado 8)`);
    console.log(`   - Tabla tnot_notification_web: ${hasNotifTable ? 'EXISTE' : 'FALTA'}`);
    console.log(`   - Columnas colación en tedp_reporte_avance: ${hasColacionCols ? 'COMPLETAS (2/2)' : 'INCOMPLETAS'}`);

    gates.gate1 = countEquipos === 110 && countUsuarios === 45 && countCategorias === 8 && hasNotifTable && hasColacionCols;

    // Gate 2: Daemon Backend PM2 (lean-services-gsp-prod)
    console.log('\n⚙️ [Gate 2] Backend Daemon PM2 (lean-services-gsp-prod, puerto 3016)...');
    const pm2Check = await ssh.execCommand('su - nodeadmin -c "pm2 describe lean-services-gsp-prod"');
    const isPm2Online = pm2Check.stdout.includes('online');
    console.log('   - PM2 Status:', isPm2Online ? 'online' : 'OFFLINE');

    const curlVivo = await ssh.execCommand('curl -s http://localhost:3016/api/operaciones/control-vivo');
    let vivoOk = false;
    try {
      const jVivo = JSON.parse(curlVivo.stdout);
      vivoOk = jVivo.success === true && typeof jVivo.kpis === 'object';
      console.log('   - Endpoint /api/operaciones/control-vivo:', vivoOk ? '200 OK (KPIs activos)' : 'FAIL');
    } catch (e) {
      console.log('   - Endpoint /api/operaciones/control-vivo: FAIL PARSE');
    }

    const curlNotif = await ssh.execCommand('curl -s http://localhost:3016/api/operaciones/control-vivo/notificaciones');
    let notifOk = false;
    try {
      const jNotif = JSON.parse(curlNotif.stdout);
      notifOk = jNotif.success === true && Array.isArray(jNotif.data);
      console.log('   - Endpoint /api/operaciones/control-vivo/notificaciones:', notifOk ? '200 OK (Array activo)' : 'FAIL');
    } catch (e) {
      console.log('   - Endpoint /api/operaciones/control-vivo/notificaciones: FAIL PARSE');
    }

    gates.gate2 = isPm2Online && vivoOk && notifOk;

    // Gate 3: Proxy Inverso Nginx y SSL
    console.log('\n🔒 [Gate 3] Proxy Inverso Nginx & SSL...');
    const curlNginxVivo = await ssh.execCommand('curl -s -k https://127.0.0.1/lg-gsp-prod/api/operaciones/control-vivo');
    let nginxVivoOk = false;
    try {
      const jNv = JSON.parse(curlNginxVivo.stdout);
      nginxVivoOk = jNv.success === true;
      console.log('   - Proxy /lg-gsp-prod/api/operaciones/control-vivo:', nginxVivoOk ? '200 OK' : 'FAIL');
    } catch (e) {
      console.log('   - Proxy Nginx: FAIL');
    }

    const curlNginxUsers = await ssh.execCommand('curl -s -k https://127.0.0.1/lg-gsp-prod/api/usuarios | head -c 80');
    const nginxUsersOk = curlNginxUsers.stdout.includes('id_user') || curlNginxUsers.stdout.includes('data');
    console.log('   - Proxy /lg-gsp-prod/api/usuarios:', nginxUsersOk ? '200 OK' : 'FAIL');

    gates.gate3 = nginxVivoOk && nginxUsersOk;

    // Gate 4: Web Console Desktop Torre de Control
    console.log('\n🌐 [Gate 4] Web Console Desktop (/var/www/html/lg-gsp-prod/)...');
    const webStatus = await ssh.execCommand('curl -s -k -I https://127.0.0.1/lg-gsp-prod/ | head -n 1');
    const isWeb200 = webStatus.stdout.includes('200');
    console.log('   - HTTP Status index.html:', webStatus.stdout.trim());

    const htmlContent = await ssh.execCommand('cat /var/www/html/lg-gsp-prod/index.html');
    const matchJs = htmlContent.stdout.match(/src="(\/lg-gsp-prod\/assets\/[^"]+\.js)"/);
    const assetPath = matchJs ? matchJs[1] : null;
    console.log('   - Asset bundle detectado:', assetPath || '(Ninguno)');

    let assetOk = false;
    if (assetPath) {
      const assetCheck = await ssh.execCommand(`curl -s -k -I https://127.0.0.1${assetPath} | head -n 1`);
      assetOk = assetCheck.stdout.includes('200');
      console.log('   - HTTP Status bundle JS:', assetCheck.stdout.trim());
    }

    gates.gate4 = isWeb200 && assetOk;

    // Gate 5: PWA Móvil Terreno
    console.log('\n📱 [Gate 5] App PWA Terreno (/var/www/html/pwa-gsp-prod/)...');
    const pwaStatus = await ssh.execCommand('curl -s -k -I https://127.0.0.1/pwa-gsp-prod/ | head -n 1');
    const manifestStatus = await ssh.execCommand('curl -s -k -I https://127.0.0.1/pwa-gsp-prod/manifest.json | head -n 1');
    const isPwa200 = pwaStatus.stdout.includes('200');
    const isManifest200 = manifestStatus.stdout.includes('200');
    console.log('   - HTTP Status PWA:', pwaStatus.stdout.trim());
    console.log('   - HTTP Status Manifest:', manifestStatus.stdout.trim());

    gates.gate5 = isPwa200 && isManifest200;

    // Gate 6: Satélites (WhatsApp Baileys & Storage)
    console.log('\n💬 [Gate 6] Servicios Satélite (WhatsApp & Almacenamiento Documental)...');
    const wspCheck = await ssh.execCommand('su - nodeadmin -c "pm2 describe gsp-whatsapp"');
    const isWspOnline = wspCheck.stdout.includes('online');
    console.log('   - Daemon WhatsApp (PM2 ID 17):', isWspOnline ? 'online' : 'OFFLINE');

    const storageCheck = await ssh.execCommand('test -w /u05/LeanDocs/GSP/prod/cotizaciones && echo WRITABLE');
    const isStorageOk = storageCheck.stdout.trim() === 'WRITABLE';
    console.log('   - Storage /u05/LeanDocs/GSP/prod/cotizaciones:', isStorageOk ? 'WRITABLE' : 'READONLY/ERROR');

    gates.gate6 = isWspOnline && isStorageOk;

    // -------------------------------------------------------------------------
    // RESUMEN CERTIFICACIÓN
    // -------------------------------------------------------------------------
    console.log('\n==================================================================');
    console.log('📊 RESUMEN FINAL CERTIFICACIÓN PRODUCCIÓN GSP v1.0.80');
    console.log('==================================================================');
    console.log(`Gate 1: Base de Datos & Aislamiento (sch_leangsp_prod) : ${gates.gate1 ? '✅ APROBADO' : '❌ FALLÓ'}`);
    console.log(`Gate 2: Daemon Backend PM2 ID 13 (puerto 3016)          : ${gates.gate2 ? '✅ APROBADO' : '❌ FALLÓ'}`);
    console.log(`Gate 3: Proxy Inverso Nginx & SSL                      : ${gates.gate3 ? '✅ APROBADO' : '❌ FALLÓ'}`);
    console.log(`Gate 4: Web Console Desktop (/lg-gsp-prod/ v1.0.80)     : ${gates.gate4 ? '✅ APROBADO' : '❌ FALLÓ'}`);
    console.log(`Gate 5: App PWA Móvil Terreno (/pwa-gsp-prod/)         : ${gates.gate5 ? '✅ APROBADO' : '❌ FALLÓ'}`);
    console.log(`Gate 6: Satélites (WhatsApp Baileys & Storage)         : ${gates.gate6 ? '✅ APROBADO' : '❌ FALLÓ'}`);

    const allPassed = Object.values(gates).every(v => v === true);
    if (allPassed) {
      console.log('\n🎉 ¡CERTIFICACIÓN 100% EXITOSA! EL AMBIENTE DE PRODUCCIÓN ESTÁ OPERATIVO Y DISPONIBLE.');
    } else {
      console.log('\n⚠️ AL MENOS UN GATE NO CUMPLIÓ CON LOS ESTÁNDARES. REVISAR EL LOG ANTERIOR.');
    }

  } catch (err) {
    console.error('❌ Error general durante el proceso:', err);
  } finally {
    ssh.dispose();
  }
}

run();
