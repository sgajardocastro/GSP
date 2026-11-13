const path = require('path');
const fs = require('fs');
const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function main() {
  console.log('🚀 INICIANDO DESPLIEGUE CONTROLADO A DEV (v1.0.220 / REQ-1162 & REQ-1163)...');

  const rootDir = path.resolve(__dirname, '..');
  const localWebDist = path.join(rootDir, 'ejecucion', 'frontend', 'dist_dev');
  const localBackendDir = path.join(rootDir, 'ejecucion', 'backend_remoto', 'src');

  if (!fs.existsSync(localWebDist)) {
    throw new Error(`No se encontró dist_dev en: ${localWebDist}`);
  }

  console.log('\n🔌 1. Conectando por SSH a servidor.leanglobal.cl:1295...');
  await ssh.connect({
    host: 'servidor.leanglobal.cl',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });
  console.log('✅ Conexión SSH establecida con éxito.');

  // 2. Subir Frontend Web a /var/www/html/lg-gsp-dev
  const webRemote = '/var/www/html/lg-gsp-dev';
  console.log(`\n⬆️ 2. Subiendo nuevo build de Frontend Web DEV (${localWebDist} -> ${webRemote})...`);
  await ssh.putDirectory(localWebDist, webRemote, {
    recursive: true,
    concurrency: 15
  });
  await ssh.execCommand(`chown -R nginx:nginx ${webRemote}`);
  console.log('✅ Frontend Web subido y permisos nginx aplicados.');

  // 3. Subir archivos backend modificados
  const remoteBackendSrc = '/home/nodeadmin/proyectos/lean-services-gsp/src';
  console.log(`\n⬆️ 3. Sincronizando backend services y controllers en ${remoteBackendSrc}...`);
  await ssh.putFile(
    path.join(localBackendDir, 'services', 'reportDiarioPdfService.js'),
    path.join(remoteBackendSrc, 'services', 'reportDiarioPdfService.js')
  );
  await ssh.putFile(
    path.join(localBackendDir, 'controllers', 'reportDiarioController.js'),
    path.join(remoteBackendSrc, 'controllers', 'reportDiarioController.js')
  );
  await ssh.execCommand(`chown -R nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp`);
  console.log('✅ Archivos de backend sincronizados con permisos aplicados.');

  // 4. Reiniciar PM2 proceso ID 10
  console.log('\n🔄 4. Reiniciando proceso PM2 ID 10 (lean-services-gsp)...');
  const pm2Res = await ssh.execCommand('sudo -u nodeadmin pm2 restart 10');
  console.log('PM2 Output:\n', pm2Res.stdout || pm2Res.stderr);

  // 5. Sincronizar Hard Gate en BD DEV (sch_leangsp)
  console.log('\n🗄️ 5. Sincronizando tcfg_backlog y tcfg_releases en PostgreSQL DEV (sch_leangsp)...');
  const sql = `
    INSERT INTO sch_leangsp.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_implementacion, solicitado_por, estado)
    VALUES 
    (
      'REQ-1162',
      'Persistencia y Sincronizacion de Horas a Facturar en PDF Oficial y Visor Modal',
      'Correccion de calculo en reportDiarioPdfService para priorizar ajustes manuales de horas facturables sobre horas operadas en contratos mensuales, y persistencia reactiva en ModalVisorReport evitando reversion a calculo automatico.',
      'Alta',
      CURRENT_DATE,
      'Sergio Gajardo',
      'Implementado'
    ),
    (
      'REQ-1163',
      'Segmentacion de Observaciones de Validacion FES vs Observaciones para Mandante (Caso 005 Besalco)',
      'Incorporacion de campo independiente de Observaciones para el Cliente en ModalVisorReport, despliegue destacado en Seccion 4 del PDF oficial y aislamiento estricto de notas de justificacion interna FES.',
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
      'v1.0.220',
      'Portal Web & Backend GSP v1.0.220 - Persistencia Horas Facturables y Segmentacion Observaciones Mandante',
      'FEATURE',
      'Persistencia de horas a facturar manuales en PDF oficial y visor modal (REQ-1162), y segmentacion de observaciones de validacion FES interna vs observaciones para el cliente en PDF oficial (REQ-1163 / Caso 005 Besalco).',
      '["REQ-1162", "REQ-1163"]'::jsonb,
      'Sergio Gajardo'
    )
    ON CONFLICT (version) DO UPDATE SET 
      titulo = EXCLUDED.titulo,
      descripcion_impacto = EXCLUDED.descripcion_impacto,
      requerimientos_asociados = EXCLUDED.requerimientos_asociados;
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/sync_v220_dev.sql\n${sql}\nEOF`);
  const resSql = await ssh.execCommand(`su - postgres -c "psql -d postgres -f /tmp/sync_v220_dev.sql"`);
  console.log('Resultado SQL DEV:\n', resSql.stdout.trim() || resSql.stderr);
  await ssh.execCommand('rm -f /tmp/sync_v220_dev.sql');

  // 6. Verificación HTTP en DEV
  console.log('\n🌐 6. Verificando disponibilidad HTTP de https://servidor.leanglobal.cl/lg-gsp-dev/...');
  const curlRes = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-dev/');
  console.log(`HTTP Status Code: ${curlRes.stdout.trim()}`);

  console.log('\n🎉 DESPLIEGUE A DEV v1.0.220 FINALIZADO CON ÉXITO!');
  ssh.dispose();
}

main().catch(err => {
  console.error('\n❌ ERROR DURANTE EL DESPLIEGUE:', err);
  ssh.dispose();
  process.exit(1);
});
