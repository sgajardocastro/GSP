const { NodeSSH } = require('../node_modules/node-ssh');
const path = require('path');

const ssh = new NodeSSH();

async function run() {
  console.log('==================================================================');
  console.log('🚀 DESPLIEGUE V1.0.81: PARAMETRIZACIÓN AMBIENTE EN WSP Y NOTIFICACIONES');
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
    const localBackendSrc = `${rootDir}/ejecucion/backend_remoto/src`;
    const localFrontendDist = `${rootDir}/ejecucion/frontend/dist`;

    // 1. DESPLIEGUE BACKEND A DEV Y PROD
    console.log('\n📦 [1/4] Desplegando Backend a PROD (/home/nodeadmin/proyectos/lean-services-gsp-prod/src)...');
    await ssh.putDirectory(localBackendSrc, '/home/nodeadmin/proyectos/lean-services-gsp-prod/src', { recursive: true, concurrency: 5 });
    await ssh.execCommand('chown -R nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp-prod/src');
    await ssh.execCommand('su - nodeadmin -c "pm2 restart 13"');
    console.log('Backend PROD (PM2 ID 13) reiniciado.');

    console.log('\n📦 [2/4] Desplegando Backend a DEV (/home/nodeadmin/proyectos/lean-services-gsp/src)...');
    await ssh.putDirectory(localBackendSrc, '/home/nodeadmin/proyectos/lean-services-gsp/src', { recursive: true, concurrency: 5 });
    await ssh.execCommand('chown -R nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp/src');
    await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
    console.log('Backend DEV (PM2 ID 10) reiniciado.');

    // 2. DESPLIEGUE FRONTEND A PROD
    console.log('\n🌐 [3/4] Desplegando Frontend PROD (/var/www/html/lg-gsp-prod)...');
    await ssh.putDirectory(localFrontendDist, '/var/www/html/lg-gsp-prod', { recursive: true, concurrency: 8 });
    await ssh.execCommand('chown -R nginx:nginx /var/www/html/lg-gsp-prod && chmod -R 755 /var/www/html/lg-gsp-prod');
    console.log('Frontend PROD actualizado.');

    // 3. REGISTRAR RELEASE EN AMBAS BD
    console.log('\n🏛️ [4/4] Registrando Release v1.0.81 en sch_leangsp_prod y sch_leangsp...');
    const releaseSql = `
      INSERT INTO {SCHEMA}.tcfg_releases (
        version, fecha_release, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por
      ) VALUES (
        'v1.0.81',
        '2026-10-04',
        'Parametrización Estricta de Ambiente en Notificaciones y WhatsApp',
        'Feature & Seguridad',
        'Parametrización estricta por entorno (DEV vs PROD) en notificaciones omnicanal, prefijos automáticos en mensajes de WhatsApp y correo, dinamización de URLs de retorno y deep links.',
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

    await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${releaseSql.replace('{SCHEMA}', 'sch_leangsp_prod').replace(/\n/g, ' ')}\\""`);
    await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${releaseSql.replace('{SCHEMA}', 'sch_leangsp').replace(/\n/g, ' ')}\\""`);
    console.log('Releases registrados en BD DEV y PROD.');

    // 4. HARD GATE VERIFICACIÓN
    console.log('\n==================================================================');
    console.log('🏆 HARD GATE CERTIFICACIÓN PRODUCCIÓN v1.0.81');
    console.log('==================================================================');
    await new Promise(r => setTimeout(r, 2000));

    const pm2Prod = await ssh.execCommand('su - nodeadmin -c "pm2 status 13"');
    const isPm2ProdOnline = pm2Prod.stdout.includes('online');

    const curlProd = await ssh.execCommand('curl -s http://localhost:3016/api/operaciones/control-vivo');
    const isApiProdOk = curlProd.stdout.includes('"success":true');

    const curlNginx = await ssh.execCommand('curl -s -k https://127.0.0.1/lg-gsp-prod/api/operaciones/control-vivo');
    const isNginxOk = curlNginx.stdout.includes('"success":true');

    const webCheck = await ssh.execCommand('curl -s -k -I https://127.0.0.1/lg-gsp-prod/ | head -n 1');
    const isWebOk = webCheck.stdout.includes('200');

    console.log(`- Daemon PM2 ID 13 (puerto 3016) : ${isPm2ProdOnline ? '✅ ONLINE' : '❌ ERROR'}`);
    console.log(`- Backend API PROD Local (3016)  : ${isApiProdOk ? '✅ 200 OK' : '❌ ERROR'}`);
    console.log(`- Proxy Nginx HTTPS PROD API     : ${isNginxOk ? '✅ 200 OK' : '❌ ERROR'}`);
    console.log(`- Web Console Desktop (/lg-gsp-prod/) : ${isWebOk ? '✅ 200 OK' : '❌ ERROR'}`);

    if (isPm2ProdOnline && isApiProdOk && isNginxOk && isWebOk) {
      console.log('\n🎉 ¡DESPLIEGUE v1.0.81 COMPLETADO Y CERTIFICADO EXITOSAMENTE!');
    }
  } catch (err) {
    console.error('❌ Error en despliegue v1.0.81:', err);
  } finally {
    ssh.dispose();
  }
}

run();
