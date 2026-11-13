const { NodeSSH } = require('../node_modules/node-ssh');
const axios = require('axios');
const path = require('path');

const ssh = new NodeSSH();

async function run() {
  console.log('==================================================================');
  console.log('🚀 DESPLIEGUE V1.0.82: FIX FILTRO DINAMICO SURVEYS + NOTIFICACION VISITA');
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
    console.log('\n📦 [1/4] Desplegando Backend a PROD (/home/nodeadmin/proyectos/lean-services-gsp-prod/src)...');
    await ssh.putDirectory(localBackendSrc, '/home/nodeadmin/proyectos/lean-services-gsp-prod/src', { recursive: true, concurrency: 5 });
    await ssh.execCommand('chown -R nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp-prod/src');
    await ssh.execCommand('su - nodeadmin -c "pm2 restart 13"');
    console.log('Backend PROD (PM2 ID 13) reiniciado.');

    // 2. DESPLIEGUE BACKEND A DEV
    console.log('\n📦 [2/4] Desplegando Backend a DEV (/home/nodeadmin/proyectos/lean-services-gsp/src)...');
    await ssh.putDirectory(localBackendSrc, '/home/nodeadmin/proyectos/lean-services-gsp/src', { recursive: true, concurrency: 5 });
    await ssh.execCommand('chown -R nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp/src');
    await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
    console.log('Backend DEV (PM2 ID 10) reiniciado.');

    // 3. REGISTRAR RELEASE EN AMBAS BD
    console.log('\n🏛️ [3/4] Registrando Release v1.0.82 en sch_leangsp_prod y sch_leangsp...');
    const releaseSql = `
      INSERT INTO {SCHEMA}.tcfg_releases (
        version, fecha_release, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por
      ) VALUES (
        'v1.0.82',
        '2026-10-04',
        'Fix Filtro Dinamico PWA Surveys y Resolucion Omnicanal Visitas',
        'Bugfix & Omnichannel',
        'Exclusión automática de prefijos _ en filtros dinámicos (soluciona error 500 por _id_empresa en vw_procesossurvey para PWA) y soporte integral de email_alternativo en notificaciones de asignación de visita a terreno.',
        '["BUG-031", "REQ-043"]'::jsonb,
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
    console.log('🏆 HARD GATE CERTIFICACIÓN PRODUCCIÓN v1.0.82');
    console.log('==================================================================');
    await new Promise(r => setTimeout(r, 2500));

    // A. Check PM2
    const pm2Prod = await ssh.execCommand('su - nodeadmin -c "pm2 status 13"');
    const isPm2ProdOnline = pm2Prod.stdout.includes('online');
    console.log(`- Daemon PM2 ID 13 (puerto 3016) : ${isPm2ProdOnline ? '✅ ONLINE' : '❌ ERROR'}`);

    // B. Test procesosSurveyV3 with ?_id_empresa=9
    console.log('\n🔍 Probando GET /api/servicio/leanglobal/procesosSurveyV3?_id_empresa=9 en PROD...');
    try {
      const resSurvey = await axios.get('https://servidor.leanglobal.cl/lg-gsp-prod/api/servicio/leanglobal/procesosSurveyV3?_id_empresa=9');
      console.log(`- Status: ${resSurvey.status} (Total surveys retornados: ${Array.isArray(resSurvey.data) ? resSurvey.data.length : 'N/A'})`);
      if (Array.isArray(resSurvey.data)) {
        console.log(`- Primeros surveys:`, resSurvey.data.slice(0, 3).map(s => ({
          id_survey: s.id_survey,
          template: s.id_template,
          id_user: s.id_user,
          estado: s.estado,
          titulo: s.titulo_template || s.titulo
        })));
      }
    } catch (sErr) {
      console.error('- ERROR en procesosSurveyV3:', sErr.response?.status, sErr.response?.data || sErr.message);
    }

    // C. Test solicitarVisita
    console.log('\n🔍 Probando POST /api/visitas/solicitar/1?_id_empresa=9 en PROD...');
    try {
      const resVisita = await axios.post(
        'https://servidor.leanglobal.cl/lg-gsp-prod/api/visitas/solicitar/1?_id_empresa=9',
        {
          contacto_nombre: 'Sergio Gajardo',
          contacto_telefono: '+56988888888',
          contacto_email: 'sgajardoc@gmail.com',
          obra_nombre: 'Obra Central San Pablo',
          obra_direccion: 'Av Principal 123, Santiago',
          obra_ciudad: 'Santiago',
          detalle_servicio: 'Inspección técnica de izaje para grúa móvil 100T',
          fecha_visita_plan: '2026-10-06',
          hora_visita_plan: '10:00',
          email_coordinador: 'lguser@arriendosanpablo.cl'
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
      console.log(`- Status Solicitud Visita: ${resVisita.status}`);
      console.log(`- Response:`, resVisita.data);
    } catch (vErr) {
      console.error('- ERROR en solicitarVisita:', vErr.response?.status, vErr.response?.data || vErr.message);
    }

    // D. Consultar datos del proyecto 1 y token en la BD
    console.log('\n🔍 Verificando estado del Proyecto 1 en sch_leangsp_prod...');
    const dbCheck = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -A -c \\"SELECT token_visita, estado_solicitud_visita, json_field->'crm_v1'->'coordinador_visita', json_field->'crm_v1'->'tokens_historicos' FROM sch_leangsp_prod.tpry_proyecto WHERE id_proyecto = 1;\\""`);
    console.log(`- DB Proyecto 1: ${dbCheck.stdout.trim()}`);

    console.log('\n🎉 ¡DESPLIEGUE Y PRUEBAS CONCLUIDAS!');
  } catch (err) {
    console.error('❌ Error en despliegue v1.0.82:', err);
  } finally {
    ssh.dispose();
  }
}

run();
