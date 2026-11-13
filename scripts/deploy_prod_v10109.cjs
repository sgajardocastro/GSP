const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function deployProd() {
  console.log('=== DESPLIEGUE A PRODUCCIÓN WEB v1.0.109 ===');
  console.log('Conectando a servidor SSH...');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const localDist = path.resolve(__dirname, '../ejecucion/frontend/dist');
  const remoteDir = '/var/www/html/lg-gsp-prod';

  console.log(`Subiendo ${localDist} a ${remoteDir}...`);
  const status = await ssh.putDirectory(localDist, remoteDir, {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.git')
  });

  if (!status) {
    throw new Error('Fallo al transferir archivos del directorio dist a producción');
  }

  console.log('Fijando permisos nginx:nginx y 755 en lg-gsp-prod...');
  await ssh.execCommand(`chown -R nginx:nginx ${remoteDir} && chmod -R 755 ${remoteDir}`);

  // Sincronización en BD PostgreSQL
  console.log('Sincronizando tcfg_backlog y tcfg_releases en sch_leangsp y sch_leangsp_prod...');
  const schemas = ['sch_leangsp', 'sch_leangsp_prod'];
  for (const s of schemas) {
    const sql = `
      INSERT INTO ${s}.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_implementacion, solicitado_por, estado)
      VALUES ('REQ-1010', 'Desacoplamiento Traslados Grúa y Contrapesos Pestaña C', 'Matriz de 5 casos Spec 65, supresión de traslados autopropulsados en equipos_extra, logística de contrapesos y protección de rol Operador', 'Alta', CURRENT_DATE, 'Sergio Gajardo', 'Implementado')
      ON CONFLICT (codigo_req) DO UPDATE SET 
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        estado = 'Implementado',
        fecha_implementacion = CURRENT_DATE,
        updated_at = NOW();

      INSERT INTO ${s}.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
      VALUES ('v1.0.109', 'Portal Web GSP v1.0.109 - Desacoplamiento de Traslados de Grúas Autopropulsadas y Logística de Contrapesos (Spec 65)', 'Feature', 'Desacoplamiento de traslados autopropulsados, supresión de cama baja forzada rural, logística de contrapesos en 4 trayectos, inmutabilidad de roles de operador en Pestaña C y nuevo manual Módulo 6.', '["REQ-1010"]'::jsonb, 'DevOps')
      ON CONFLICT (version) DO UPDATE SET
        titulo = EXCLUDED.titulo,
        descripcion_impacto = EXCLUDED.descripcion_impacto,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    `;
    const resSql = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sql}\\""`);
    console.log(`Esquema ${s}:`, resSql.stdout.replace(/\n+/g, ' ').trim());
  }

  console.log('\n--- VERIFICACIÓN HTTP PRODUCCIÓN ---');
  const resHttp = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-prod/');
  console.log('HTTP Status https://servidor.leanglobal.cl/lg-gsp-prod/:', resHttp.stdout.trim());

  const resIndex = await ssh.execCommand('curl -s https://servidor.leanglobal.cl/lg-gsp-prod/ | grep -o "index-[^\"]*"');
  console.log('Bundle activo en producción:', resIndex.stdout.trim());

  ssh.dispose();
  console.log('=== DESPLIEGUE A PRODUCCIÓN CONCLUIDO CON ÉXITO ===');
}

deployProd().catch(err => {
  console.error('Error en despliegue a producción:', err);
  process.exit(1);
});
