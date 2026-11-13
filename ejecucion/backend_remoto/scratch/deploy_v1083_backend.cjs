const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  console.log('==================================================================');
  console.log('🚀 DESPLIEGUE V1.0.83: IMPLEMENTACIÓN COMPLETA DE ASIGNAR VISITA');
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

    // 1. DESPLIEGUE BACKEND A PROD
    console.log('\n📦 [1/3] Desplegando Backend a PROD (/home/nodeadmin/proyectos/lean-services-gsp-prod/src)...');
    await ssh.putDirectory(localBackendSrc, '/home/nodeadmin/proyectos/lean-services-gsp-prod/src', { recursive: true, concurrency: 5 });
    await ssh.execCommand('chown -R nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp-prod/src');
    await ssh.execCommand('su - nodeadmin -c "pm2 restart 13"');
    console.log('Backend PROD (PM2 ID 13) reiniciado.');

    // 2. DESPLIEGUE BACKEND A DEV
    console.log('\n📦 [2/3] Desplegando Backend a DEV (/home/nodeadmin/proyectos/lean-services-gsp/src)...');
    await ssh.putDirectory(localBackendSrc, '/home/nodeadmin/proyectos/lean-services-gsp/src', { recursive: true, concurrency: 5 });
    await ssh.execCommand('chown -R nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp/src');
    await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
    console.log('Backend DEV (PM2 ID 10) reiniciado.');

    // 3. REGISTRAR RELEASE EN AMBAS BD
    console.log('\n🏛️ [3/3] Registrando Release v1.0.83 en sch_leangsp_prod y sch_leangsp...');
    const releaseSql = `
      INSERT INTO {SCHEMA}.tcfg_releases (
        version, fecha_release, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por
      ) VALUES (
        'v1.0.83',
        '2026-10-04',
        'Implementacion Canónica Asignación Visita Técnica y Notificación a Especialista',
        'Feature & Omnichannel',
        'Creación/actualización automática de tsrv_survey (Template 80) pre-sembrada y despacho omnicanal garantizado al técnico asignado con soporte email_alternativo y deep link PWA.',
        '["REQ-044", "BUG-032"]'::jsonb,
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

    console.log('\n✅ Backend v1.0.83 desplegado exitosamente.');
  } catch (err) {
    console.error('❌ Error en despliegue backend v1.0.83:', err);
  } finally {
    ssh.dispose();
  }
}

run();
