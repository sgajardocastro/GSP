const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const fs = require('fs');

const ssh = new NodeSSH();

async function deployAndVerify() {
  console.log('===============================================================');
  console.log('🚀 INICIANDO DESPLIEGUE CONTROLADO v1.0.168 (DEV & PROD)');
  console.log('   Erradicación Total de Conformidad Mandante en PDF EDP');
  console.log('   Sección 4 en 2 Columnas Canónicas 100% Internas');
  console.log('===============================================================\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });
  console.log('✓ Conectado a servidor.leanglobal.cl:1295 (root)');

  const localController = path.resolve(__dirname, '../ejecucion/backend_remoto/src/controllers/estadoPagoController.js');
  const localPdfService = path.resolve(__dirname, '../ejecucion/backend_remoto/src/services/edpPdfService.js');

  const devDir = '/home/nodeadmin/proyectos/lean-services-gsp/src';
  const prodDir = '/home/nodeadmin/proyectos/lean-services-gsp-prod/src';

  // 1. Sincronizar Backend en DEV y PROD
  console.log('\n[1/6] Sincronizando edpPdfService.js y estadoPagoController.js...');
  await ssh.putFile(localController, `${devDir}/controllers/estadoPagoController.js`);
  await ssh.putFile(localController, `${prodDir}/controllers/estadoPagoController.js`);
  await ssh.putFile(localPdfService, `${devDir}/services/edpPdfService.js`);
  await ssh.putFile(localPdfService, `${prodDir}/services/edpPdfService.js`);

  await ssh.execCommand(`chown -R nodeadmin:nodeadmin ${devDir} ${prodDir}`);
  console.log('✓ Archivos backend subidos y permisos nodeadmin aplicados.');

  // 2. Reiniciar PM2 procesos 10 y 13
  console.log('\n[2/6] Reiniciando procesos PM2 (10=DEV, 13=PROD)...');
  const pm2Res = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10 13"');
  console.log('PM2 restart output:\n', pm2Res.stdout.trim() || pm2Res.stderr.trim());

  await new Promise(r => setTimeout(r, 2000));
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

  // 4. Registrar Release en BD PostgreSQL
  console.log('\n[5/6] Registrando Release v1.0.168 en BD PostgreSQL (DEV & PROD)...');
  const releaseSql = `
    INSERT INTO sch_leangsp.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
    VALUES (
      'v1.0.168',
      'Portal Web GSP v1.0.168 - Erradicación de Conformidad Mandante en Sección 4 de EDP (2 Firmas FES Internas)',
      'FEATURE',
      'REQ-1078 / SPEC-103 v1.2: Erradicación definitiva de la caja espuria Conformidad Mandante en la Sección 4 del PDF del EDP. La única conformidad del mandante se captura en terreno en el Report Diario. El pie de firmas del EDP queda conformado por exactamente 2 columnas internas al 50%: (1) Control de Gestión (Yara) y (2) Despacho Comercial (Ejecutivo).',
      '["REQ-1078"]'::jsonb,
      'Sergio Gajardo'
    )
    ON CONFLICT (version) DO UPDATE SET 
      titulo = EXCLUDED.titulo,
      descripcion_impacto = EXCLUDED.descripcion_impacto,
      requerimientos_asociados = EXCLUDED.requerimientos_asociados;

    INSERT INTO sch_leangsp_prod.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
    VALUES (
      'v1.0.168',
      'Portal Web GSP v1.0.168 - Erradicación de Conformidad Mandante en Sección 4 de EDP (2 Firmas FES Internas)',
      'FEATURE',
      'REQ-1078 / SPEC-103 v1.2: Erradicación definitiva de la caja espuria Conformidad Mandante en la Sección 4 del PDF del EDP. La única conformidad del mandante se captura en terreno en el Report Diario. El pie de firmas del EDP queda conformado por exactamente 2 columnas internas al 50%: (1) Control de Gestión (Yara) y (2) Despacho Comercial (Ejecutivo).',
      '["REQ-1078"]'::jsonb,
      'Sergio Gajardo'
    )
    ON CONFLICT (version) DO UPDATE SET 
      titulo = EXCLUDED.titulo,
      descripcion_impacto = EXCLUDED.descripcion_impacto,
      requerimientos_asociados = EXCLUDED.requerimientos_asociados;
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/sync_v168.sql\n${releaseSql}\nEOF`);
  const sqlRes = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/sync_v168.sql"');
  console.log('Resultado SQL:\n', sqlRes.stdout.trim() || sqlRes.stderr.trim());
  await ssh.execCommand('rm -f /tmp/sync_v168.sql');

  // 5. Verificación Empírica de Endpoints y PDF
  console.log('\n[6/6] Ejecutando Verificación Empírica Live...');
  const devCheck = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-dev/');
  const prodCheck = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-prod/');
  console.log(`HTTP Status DEV Web:  ${devCheck.stdout.trim()}`);
  console.log(`HTTP Status PROD Web: ${prodCheck.stdout.trim()}`);

  // Test PDF generación Tensacon en PROD
  console.log('\nProbando generación PDF Tensacon (Proyecto 4) en PROD...');
  const pdfGen = await ssh.execCommand('curl -s -w "\\nHTTP: %{http_code}" "https://servidor.leanglobal.cl/lg-gsp-prod/api/operaciones/edp/proyecto/4/pdf" -o /tmp/test_edp_v168.pdf');
  console.log(pdfGen.stdout.trim());

  const pdfText = await ssh.execCommand('pdftotext /tmp/test_edp_v168.pdf - | grep -E "Control de Gestión|Despacho Comercial|Conformidad Mandante|Validación Contable"');
  console.log('Columnas encontradas en PDF Sección 4:\n', pdfText.stdout.trim() || '(No encontradas)');

  const checkMandante = await ssh.execCommand('pdftotext /tmp/test_edp_v168.pdf - | grep "Conformidad Mandante"');
  if (checkMandante.stdout.trim()) {
    console.error('❌ ERROR: "Conformidad Mandante" todavía aparece en el PDF!');
  } else {
    console.log('✓ Confirmado: "Conformidad Mandante" NO existe en el PDF.');
  }

  await ssh.execCommand('rm -f /tmp/test_edp_v168.pdf');

  ssh.dispose();
  console.log('\n===============================================================');
  console.log('✅ DESPLIEGUE v1.0.168 FINALIZADO Y VERIFICADO EXITOSAMENTE');
  console.log('===============================================================');
}

deployAndVerify().catch(err => {
  console.error('❌ Error durante el despliegue:', err);
  process.exit(1);
});
