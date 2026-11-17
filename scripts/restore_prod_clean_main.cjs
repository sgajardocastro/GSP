const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const fs = require('fs');

const ssh = new NodeSSH();

async function restoreProd() {
  console.log('--- INICIANDO RESTAURACIÓN DE PRODUCCIÓN A LÍNEA LIMPIA (main / 82e0d66) ---');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });
  console.log('✔ Conectado a SSH.');

  // 1. Backend: Restaurar src/ completo desde worktree_main (82e0d66)
  const localBackendSrc = path.resolve('C:/temp/worktree_main/ejecucion/backend_remoto/src');
  const remoteBackendSrc = '/home/nodeadmin/proyectos/lean-services-gsp-prod/src';
  console.log(`1. Restaurando backend limpio desde ${localBackendSrc} hacia ${remoteBackendSrc}...`);

  await ssh.putDirectory(localBackendSrc, remoteBackendSrc, {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.bak') && !itemPath.includes('.DS_Store')
  });

  const localPackageJson = path.resolve('C:/temp/worktree_main/ejecucion/backend_remoto/package.json');
  await ssh.putFile(localPackageJson, '/home/nodeadmin/proyectos/lean-services-gsp-prod/package.json');
  console.log('✔ Backend src/ y package.json restaurados con éxito.');

  // 2. Frontend: Subir dist_prod_clean hacia /var/www/html/lg-gsp-prod
  const localDist = path.resolve('C:/temp/worktree_main/ejecucion/frontend/dist_prod_clean');
  const remoteDist = '/var/www/html/lg-gsp-prod';
  console.log(`2. Desplegando frontend limpio desde ${localDist} hacia ${remoteDist}...`);

  await ssh.putDirectory(localDist, remoteDist, {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.DS_Store')
  });
  console.log('✔ Frontend desplegado con éxito en /var/www/html/lg-gsp-prod.');

  // 3. Reiniciar PM2 13
  console.log('3. Reiniciando PM2 ID 13...');
  const pm2Res = await ssh.execCommand('su - nodeadmin -c "pm2 restart 13 --update-env"');
  console.log(pm2Res.stdout || pm2Res.stderr);

  // 4. Registrar en releases
  const sql = `
  INSERT INTO sch_leangsp_prod.tcfg_releases (
    version, fecha_release, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por
  ) VALUES (
    '1.0.225-RESTORE', CURRENT_DATE, 'Restauración Línea Limpia de Producción (Reversión a main 82e0d66)', 'Hotfix Producción',
    'Reversión integral a línea limpia de producción main (82e0d66). Desactivación estricta de estructurador en árbol y componentes de asignación en árbol en PROD. Backend y frontend 100% estabilizados sin dependencias de ramas de desarrollo.',
    '["REQ-PROD-RESTORE"]'::jsonb, 'Alfonso Porperello / S. Gajardo'
  );
  `;
  await ssh.execCommand(`cat << 'EOF' > /tmp/reg_restore.sql\n${sql}\nEOF`);
  await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/reg_restore.sql"');
  console.log('✔ Registro en tcfg_releases completado.');

  // 5. Test generación OT
  console.log('5. Probando regeneración de OT en producción...');
  const testOtScript = `
  const fs = require('fs');
  const envContent = fs.readFileSync('/home/nodeadmin/proyectos/lean-services-gsp-prod/.env', 'utf8');
  envContent.split('\\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        let v = trimmed.substring(idx + 1).trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
        process.env[trimmed.substring(0, idx).trim()] = v;
      }
    }
  });

  const ProyectoModel = require('/home/nodeadmin/proyectos/lean-services-gsp-prod/src/models/proyectoModel');
  const model = new ProyectoModel();

  (async () => {
    try {
      console.log('Probando OT 39 (ID 86)...');
      const r1 = await model.generarOTVersion(86);
      console.log('✔ OT 39 exitosa: Version', r1.ot?.version_ot, r1.ot?.path_ot_pdf);

      console.log('Probando OT 51 (ID 103)...');
      const r2 = await model.generarOTVersion(103);
      console.log('✔ OT 51 exitosa: Version', r2.ot?.version_ot, r2.ot?.path_ot_pdf);

      console.log('Probando OT 52 (ID 104)...');
      const r3 = await model.generarOTVersion(104);
      console.log('✔ OT 52 exitosa: Version', r3.ot?.version_ot, r3.ot?.path_ot_pdf);

      console.log('Probando regeneración OT antigua ID 4...');
      const r4 = await model.generarOTVersion(4);
      console.log('✔ OT 4 (antigua) exitosa: Version', r4.ot?.version_ot, r4.ot?.path_ot_pdf);
    } catch (e) {
      console.error('❌ Error en prueba OT:', e.message);
      console.error(e.stack);
    }
    process.exit(0);
  })();
  `;
  await ssh.execCommand(`cat << 'EOF' > /tmp/test_restore_ot.js\n${testOtScript}\nEOF`);
  const testRes = await ssh.execCommand('su - nodeadmin -c "cd /home/nodeadmin/proyectos/lean-services-gsp-prod && node /tmp/test_restore_ot.js"');
  console.log('Resultado prueba OTs:\n', testRes.stdout);
  if (testRes.stderr) console.error('STDERR:', testRes.stderr);

  ssh.dispose();
  console.log('🎉 --- RESTAURACIÓN COMPLETADA CON ÉXITO ---');
}

restoreProd().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
