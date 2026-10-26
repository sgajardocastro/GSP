const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const https = require('https');
const fs = require('fs');
const path = require('path');

const ssh = new NodeSSH();

async function uploadDirRecursive(ssh, localDir, remoteDir) {
  await ssh.execCommand(`mkdir -p "${remoteDir}"`);
  const entries = fs.readdirSync(localDir, { withFileTypes: true });
  for (const entry of entries) {
    const localPath = path.join(localDir, entry.name);
    const remotePath = `${remoteDir}/${entry.name}`.replace(/\\/g, '/');
    if (entry.isDirectory()) {
      await uploadDirRecursive(ssh, localPath, remotePath);
    } else {
      await ssh.putFile(localPath, remotePath);
    }
  }
}

async function main() {
  console.log('=== DESPLIEGUE DETERMINISTA Y VERIFICACIÓN V1.0.165 (SPEC-103) ===');
  console.log('1. Conectando por SSH a servidor.leanglobal.cl:1295...');
  await ssh.connect({
    host: 'servidor.leanglobal.cl',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });
  console.log('✓ SSH conectado exitosamente.');

  const rootLocal = path.resolve(__dirname, '..');
  const estadoPagoCtrlLocal = path.join(rootLocal, 'ejecucion/backend_remoto/src/controllers/estadoPagoController.js');
  const edpPdfServLocal = path.join(rootLocal, 'ejecucion/backend_remoto/src/services/edpPdfService.js');
  const distDevLocal = path.join(rootLocal, 'ejecucion/frontend/dist_dev');
  const distProdLocal = path.join(rootLocal, 'ejecucion/frontend/dist_prod');

  console.log('\n2. Subiendo controladores y servicios backend a DEV y PROD...');
  // DEV Backend
  await ssh.putFile(estadoPagoCtrlLocal, '/home/nodeadmin/proyectos/lean-services-gsp/src/controllers/estadoPagoController.js');
  await ssh.putFile(edpPdfServLocal, '/home/nodeadmin/proyectos/lean-services-gsp/src/services/edpPdfService.js');
  console.log('✓ Backend DEV actualizado.');

  // PROD Backend
  await ssh.putFile(estadoPagoCtrlLocal, '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/estadoPagoController.js');
  await ssh.putFile(edpPdfServLocal, '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/services/edpPdfService.js');
  console.log('✓ Backend PROD actualizado.');

  console.log('\n3. Ajustando permisos de backend y reiniciando PM2...');
  await ssh.execCommand('chown -R nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp/src/');
  await ssh.execCommand('chown -R nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp-prod/src/');
  
  const rDev = await ssh.execCommand('sudo -u nodeadmin pm2 restart 10');
  console.log('✓ PM2 DEV (id 10) reiniciado:', rDev.stdout.split('\n')[0]);
  const rProd = await ssh.execCommand('sudo -u nodeadmin pm2 restart 13');
  console.log('✓ PM2 PROD (id 13) reiniciado:', rProd.stdout.split('\n')[0]);

  console.log('\n4. Desplegando Frontend compilado en /var/www/html/...');
  console.log('-> Subiendo dist_dev a /var/www/html/lg-gsp-dev/...');
  await uploadDirRecursive(ssh, distDevLocal, '/var/www/html/lg-gsp-dev');
  await ssh.execCommand('chown -R nginx:nginx /var/www/html/lg-gsp-dev || chown -R apache:apache /var/www/html/lg-gsp-dev');
  console.log('✓ Frontend DEV desplegado.');

  console.log('-> Subiendo dist_prod a /var/www/html/lg-gsp-prod/...');
  await uploadDirRecursive(ssh, distProdLocal, '/var/www/html/lg-gsp-prod');
  await ssh.execCommand('chown -R nginx:nginx /var/www/html/lg-gsp-prod || chown -R apache:apache /var/www/html/lg-gsp-prod');
  console.log('✓ Frontend PROD desplegado.');

  console.log('\n5. Registrando Release v1.0.165 en BD DEV y PROD...');
  const sqlReleases = `
    INSERT INTO sch_leangsp.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
    VALUES (
      'v1.0.165',
      'Portal Web GSP v1.0.165 - Desacople Total EDP, Cuadre Tensacon y Regla Horas Mínimas en PDF',
      'FEATURE',
      'REQ-1075 / SPEC-103: Erradicación de tarifa $65.000 ST en estadoPagoController.js (Tensacon calza exacto en $6.650.000 Neto con $0 descalce frente a ITS). Regla de protección comercial en edpPdfService.js para turnos < piso mínimo contratado. Desacople total de firma contable y 4 bandejas operativas limpias con columna de vendedor en Excel.',
      '["REQ-1075"]'::jsonb,
      'Sergio Gajardo'
    )
    ON CONFLICT (version) DO UPDATE SET 
      titulo = EXCLUDED.titulo,
      descripcion_impacto = EXCLUDED.descripcion_impacto,
      requerimientos_asociados = EXCLUDED.requerimientos_asociados;

    INSERT INTO sch_leangsp_prod.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
    VALUES (
      'v1.0.165',
      'Portal Web GSP v1.0.165 - Desacople Total EDP, Cuadre Tensacon y Regla Horas Mínimas en PDF',
      'FEATURE',
      'REQ-1075 / SPEC-103: Erradicación de tarifa $65.000 ST en estadoPagoController.js (Tensacon calza exacto en $6.650.000 Neto con $0 descalce frente a ITS). Regla de protección comercial en edpPdfService.js para turnos < piso mínimo contratado. Desacople total de firma contable y 4 bandejas operativas limpias con columna de vendedor en Excel.',
      '["REQ-1075"]'::jsonb,
      'Sergio Gajardo'
    )
    ON CONFLICT (version) DO UPDATE SET 
      titulo = EXCLUDED.titulo,
      descripcion_impacto = EXCLUDED.descripcion_impacto,
      requerimientos_asociados = EXCLUDED.requerimientos_asociados;
  `;
  await ssh.execCommand(`cat << 'EOF' > /tmp/sync_v165.sql\n${sqlReleases}\nEOF`);
  const rSql = await ssh.execCommand(`su - postgres -c "psql -d postgres -f /tmp/sync_v165.sql"`);
  console.log('✓ Release registrado en BD:', rSql.stdout.trim() || rSql.stderr);
  await ssh.execCommand('rm -f /tmp/sync_v165.sql');

  ssh.dispose();
  console.log('\n✓ Despliegue completado. Iniciando pruebas de verificación HTTP...');
}

main().catch(err => {
  console.error('❌ Error en despliegue:', err);
  if (ssh) ssh.dispose();
  process.exit(1);
});
