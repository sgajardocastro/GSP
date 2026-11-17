const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const fs = require('fs');

const ssh = new NodeSSH();

async function run() {
  console.log('=================================================================');
  console.log('  DESPLIEGUE A DEV: RELEASE v1.0.228');
  console.log('  SPEC-16 §28: Erradicacion Integral json_field Asignacion a Facturacion');
  console.log('=================================================================\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });
  console.log('✔ Conexión SSH establecida con servidor DEV (138.255.103.18:1295)');

  const localBase = path.resolve(__dirname, '..');
  const remoteBackendDev = '/home/nodeadmin/proyectos/lean-services-gsp';
  const remoteWebDev = '/var/www/html/lg-gsp-dev';
  const localDistDev = path.join(localBase, 'ejecucion/frontend/dist_dev');
  const localSrc = path.join(localBase, 'ejecucion/backend_remoto/src');
  const localPkg = path.join(localBase, 'ejecucion/backend_remoto/package.json');

  // 1. Subir Backend src a /home/nodeadmin/proyectos/lean-services-gsp/src
  console.log(`\n--- 1. DESPLIEGUE BACKEND DEV (${remoteBackendDev}/src) ---`);
  console.log('Subiendo directorio src...');
  const okSrc = await ssh.putDirectory(localSrc, path.join(remoteBackendDev, 'src'), {
    recursive: true,
    concurrency: 10,
    validate: (item) => !item.includes('.git') && !item.includes('node_modules')
  });
  if (!okSrc) throw new Error('Fallo al transferir backend src a DEV');

  console.log('Subiendo package.json...');
  await ssh.putFile(localPkg, path.join(remoteBackendDev, 'package.json'));

  await ssh.execCommand(`chown -R nodeadmin:nodeadmin ${remoteBackendDev}`);
  console.log('✔ Permisos nodeadmin aplicados en backend DEV');

  // 2. Reiniciar PM2 ID 10 en DEV
  console.log('\n--- 2. REINICIO PM2 DEV (ID 10: lean-services-gsp) ---');
  const pm2Res = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
  console.log(pm2Res.stdout || pm2Res.stderr);

  // 3. Subir Frontend dist_dev a /var/www/html/lg-gsp-dev
  console.log(`\n--- 3. DESPLIEGUE FRONTEND DEV (${remoteWebDev}) ---`);
  console.log(`Subiendo Frontend dist_dev a ${remoteWebDev}...`);
  const okWeb = await ssh.putDirectory(localDistDev, remoteWebDev, {
    recursive: true,
    concurrency: 10,
    validate: (item) => !item.includes('.git')
  });
  if (!okWeb) throw new Error('Fallo al transferir dist_dev a DEV');

  await ssh.execCommand(`chown -R nginx:nginx ${remoteWebDev} && chmod -R 755 ${remoteWebDev}`);
  console.log('✔ Permisos nginx aplicados en DEV');

  // 4. Test HTTP Health Backend DEV
  console.log('\n--- 4. TEST HEALTH BACKEND DEV ---');
  const healthRes = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3015/api/proyectos');
  console.log(`HTTP Status /api/proyectos en 127.0.0.1:3015: ${healthRes.stdout}`);

  // 5. Registro de Gobernanza en BD PostgreSQL (sch_leangsp)
  console.log('\n--- 5. REGISTRO EN BASE DE DATOS (TCFG_BACKLOG / TCFG_RELEASES) ---');
  const sql = `
    INSERT INTO sch_leangsp.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_implementacion, solicitado_por, estado)
    VALUES (
      'REQ-1185',
      'Erradicación Integral de json_field y Blindaje Canónico E2E desde Asignación hasta Facturación',
      'SPEC-16 §28: Unificación arquitectónica de blindaje anti-resurrección en 4 capas. Tablas relacionales tpry_linea_servicio, tpry_rel_equipo, tpry_rel_persona, tedp_reporte_avance, tits_* y tedp_estado_pago como única fuente de verdad a partir de estado Adjudicado. Índice único físico uq_tedp_proyecto_dia_equipo. Sanitización de fechas YYYY-MM-DD y soporte canónico de relevos y convoy.',
      'Critica',
      CURRENT_DATE,
      'Sergio Gajardo',
      'Implementado'
    )
    ON CONFLICT (codigo_req) DO UPDATE SET
      nombre_requerimiento = EXCLUDED.nombre_requerimiento,
      descripcion = EXCLUDED.descripcion,
      fecha_implementacion = CURRENT_DATE,
      estado = 'Implementado';

    INSERT INTO sch_leangsp.tcfg_releases (version_release, fecha_release, nombre_release, descripcion, rollback_plan, estado_release, componentes_impactados)
    VALUES (
      'v1.0.228',
      CURRENT_TIMESTAMP,
      'Blindaje Canónico E2E SPEC-16 §28: Erradicación json_field de Asignación a Facturación',
      'Eliminación de lecturas/escrituras operativas en tpry_proyecto.json_field para proyectos adjudicados (>=4). Tablas relacionales como autoridad absoluta en Backend, Web, PWA y Motores PDF. Índice físico de unicidad en tedp_reporte_avance. Soporte multi-máquina y sanitización estricta de fechas.',
      'git revert f82fdf0..HEAD y restaurar controladores anteriores',
      'DESPLEGADO_DEV',
      'Backend (Controladores, Modelos, PDF Services), Base de Datos (sch_leangsp), Frontend Web (Torre, CRM Gestor, ControlVivo, Asignador) y PWA Móvil'
    )
    ON CONFLICT (version_release) DO UPDATE SET
      fecha_release = CURRENT_TIMESTAMP,
      nombre_release = EXCLUDED.nombre_release,
      descripcion = EXCLUDED.descripcion,
      estado_release = 'DESPLEGADO_DEV';
  `;

  const escapedSql = sql.replace(/'/g, "'\\''");
  const psqlCmd = `su - postgres -c "psql -d postgres -c '${escapedSql}'"`;
  const psqlRes = await ssh.execCommand(psqlCmd);
  console.log(psqlRes.stdout || psqlRes.stderr);

  ssh.dispose();
  console.log('\n=================================================================');
  console.log('  DESPLIEGUE A DEV v1.0.228 COMPLETADO EXITOSAMENTE');
  console.log('=================================================================');
}

run().catch(err => {
  console.error('Error durante despliegue:', err);
  ssh.dispose();
  process.exit(1);
});
