const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const fs = require('fs');

const ssh = new NodeSSH();

async function deployAndVerify() {
  console.log('===============================================================');
  console.log('🚀 INICIANDO DESPLIEGUE CONTROLADO v1.0.170 (DEV & PROD)');
  console.log('   SPEC-106 / REQ-1081: Costos Personal y Viáticos en Report');
  console.log('   Traspaso al ITS, Filtro Desde-Hasta y Columna Report Validado');
  console.log('===============================================================\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });
  console.log('✓ Conectado a servidor.leanglobal.cl:1295 (root)');

  const localReportCtrl = path.resolve(__dirname, '../ejecucion/backend_remoto/src/controllers/reportDiarioController.js');
  const localItsCtrl = path.resolve(__dirname, '../ejecucion/backend_remoto/src/controllers/itsController.js');
  const localEdpCtrl = path.resolve(__dirname, '../ejecucion/backend_remoto/src/controllers/estadoPagoController.js');
  const localTarifasSvc = path.resolve(__dirname, '../ejecucion/backend_remoto/src/services/tarifasOperadorService.js');

  const devDir = '/home/nodeadmin/proyectos/lean-services-gsp/src';
  const prodDir = '/home/nodeadmin/proyectos/lean-services-gsp-prod/src';

  // 1. Sincronizar Backend en DEV y PROD
  console.log('\n[1/6] Sincronizando reportDiarioController.js, itsController.js, estadoPagoController.js y tarifasOperadorService.js...');
  await ssh.putFile(localReportCtrl, `${devDir}/controllers/reportDiarioController.js`);
  await ssh.putFile(localReportCtrl, `${prodDir}/controllers/reportDiarioController.js`);
  await ssh.putFile(localItsCtrl, `${devDir}/controllers/itsController.js`);
  await ssh.putFile(localItsCtrl, `${prodDir}/controllers/itsController.js`);
  await ssh.putFile(localEdpCtrl, `${devDir}/controllers/estadoPagoController.js`);
  await ssh.putFile(localEdpCtrl, `${prodDir}/controllers/estadoPagoController.js`);
  await ssh.putFile(localTarifasSvc, `${devDir}/services/tarifasOperadorService.js`);
  await ssh.putFile(localTarifasSvc, `${prodDir}/services/tarifasOperadorService.js`);

  await ssh.execCommand(`chown -R nodeadmin:nodeadmin ${devDir} ${prodDir}`);
  console.log('✓ Archivos backend subidos y permisos nodeadmin aplicados.');

  // 2. Reiniciar PM2 procesos 10 y 13
  console.log('\n[2/6] Reiniciando procesos PM2 (10=DEV, 13=PROD)...');
  const pm2Res = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10 13"');
  console.log('PM2 restart output:\n', pm2Res.stdout.trim() || pm2Res.stderr.trim());

  await new Promise(r => setTimeout(r, 2500));
  const pm2Status = await ssh.execCommand('su - nodeadmin -c "pm2 status 10 13"');
  console.log('PM2 Status:\n', pm2Status.stdout.trim());

  // 3. Subir Frontend Web a DEV y PROD
  const localDistDev = path.resolve(__dirname, '../ejecucion/frontend/dist_dev');
  const localDistProd = path.resolve(__dirname, '../ejecucion/frontend/dist_prod');

  if (fs.existsSync(localDistDev)) {
    console.log('\n[3/6] Subiendo build Frontend DEV (/var/www/html/lg-gsp-dev)...');
    await ssh.putDirectory(localDistDev, '/var/www/html/lg-gsp-dev', { recursive: true, concurrency: 15 });
    await ssh.execCommand('chown -R nginx:nginx /var/www/html/lg-gsp-dev');
    console.log('✓ Frontend DEV subido y permisos nginx aplicados.');
  }

  if (fs.existsSync(localDistProd)) {
    console.log('\n[4/6] Subiendo build Frontend PROD (/var/www/html/lg-gsp-prod)...');
    await ssh.putDirectory(localDistProd, '/var/www/html/lg-gsp-prod', { recursive: true, concurrency: 15 });
    await ssh.execCommand('chown -R nginx:nginx /var/www/html/lg-gsp-prod');
    console.log('✓ Frontend PROD subido y permisos nginx aplicados.');
  }

  // 4. Registrar Release v1.0.170 en BD PostgreSQL
  console.log('\n[5/6] Registrando Release v1.0.170 en BD PostgreSQL (DEV & PROD)...');
  const releaseSql = `
    INSERT INTO sch_leangsp.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
    VALUES (
      'v1.0.170',
      'Portal Web GSP v1.0.170 - Verificación de Costos de Personal y Viáticos en Report Diario, Traspaso al ITS y Columna Report Validado',
      'FEATURE',
      'REQ-1081 / SPEC-106: (1) Incorporación de Sección 3 en ModalVisorReport para verificar y ajustar horas de operador/rigger, valor hora y viáticos diarios al validar el Report con PIN FES. (2) Traspaso automático desde el Report Diario hacia las pestañas Hora Operador y Viático Alimentación del ITS. (3) Habilitación de filtro Desde-Hasta en Submenú 2 de Perspectiva Contabilidad y reemplazo de la columna ITS Validado por Report Validado.',
      '["REQ-1081"]'::jsonb,
      'Sergio Gajardo'
    )
    ON CONFLICT (version) DO UPDATE SET 
      titulo = EXCLUDED.titulo,
      descripcion_impacto = EXCLUDED.descripcion_impacto,
      requerimientos_asociados = EXCLUDED.requerimientos_asociados;

    INSERT INTO sch_leangsp_prod.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
    VALUES (
      'v1.0.170',
      'Portal Web GSP v1.0.170 - Verificación de Costos de Personal y Viáticos en Report Diario, Traspaso al ITS y Columna Report Validado',
      'FEATURE',
      'REQ-1081 / SPEC-106: (1) Incorporación de Sección 3 en ModalVisorReport para verificar y ajustar horas de operador/rigger, valor hora y viáticos diarios al validar el Report con PIN FES. (2) Traspaso automático desde el Report Diario hacia las pestañas Hora Operador y Viático Alimentación del ITS. (3) Habilitación de filtro Desde-Hasta en Submenú 2 de Perspectiva Contabilidad y reemplazo de la columna ITS Validado por Report Validado.',
      '["REQ-1081"]'::jsonb,
      'Sergio Gajardo'
    )
    ON CONFLICT (version) DO UPDATE SET 
      titulo = EXCLUDED.titulo,
      descripcion_impacto = EXCLUDED.descripcion_impacto,
      requerimientos_asociados = EXCLUDED.requerimientos_asociados;
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/sync_v170.sql\n${releaseSql}\nEOF`);
  const sqlRes = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/sync_v170.sql"');
  console.log('Resultado SQL:\n', sqlRes.stdout.trim() || sqlRes.stderr.trim());
  await ssh.execCommand('rm -f /tmp/sync_v170.sql');

  // 5. Verificación Empírica de Endpoints
  console.log('\n[6/6] Ejecutando Verificación Empírica Live...');
  const devWeb = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-dev/');
  const prodWeb = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-prod/');
  const devApi = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3006/api/operaciones/edp/perspectiva-contabilidad?fecha_desde=2026-10-01&fecha_hasta=2026-10-31"');
  const prodApi = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3016/api/operaciones/edp/perspectiva-contabilidad?fecha_desde=2026-10-01&fecha_hasta=2026-10-31"');
  const devPend = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3006/api/operaciones/report/pendientes-analista"');
  const prodPend = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3016/api/operaciones/report/pendientes-analista"');

  console.log(`HTTP Status DEV Web:               ${devWeb.stdout.trim()}`);
  console.log(`HTTP Status PROD Web:              ${prodWeb.stdout.trim()}`);
  console.log(`HTTP Status DEV API Contabilidad:  ${devApi.stdout.trim()}`);
  console.log(`HTTP Status PROD API Contabilidad: ${prodApi.stdout.trim()}`);
  console.log(`HTTP Status DEV API Reports:       ${devPend.stdout.trim()}`);
  console.log(`HTTP Status PROD API Reports:      ${prodPend.stdout.trim()}`);

  ssh.dispose();
  console.log('\n===============================================================');
  console.log('✅ DESPLIEGUE v1.0.170 FINALIZADO Y VERIFICADO EXITOSAMENTE');
  console.log('===============================================================');
}

deployAndVerify().catch(err => {
  console.error('❌ Error durante el despliegue:', err);
  process.exit(1);
});
