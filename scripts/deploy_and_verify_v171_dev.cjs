const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const fs = require('fs');

const ssh = new NodeSSH();

function validarGobernanzaAntesDeDesplegar() {
  console.log('🛡️ [HARD GATE] Ejecutando verificación obligatoria de gobernanza...');
  const pkgPath = path.resolve(__dirname, '../ejecucion/frontend/package.json');
  const releaseLogPath = path.resolve(__dirname, '../RELEASE_LOG.md');
  const tareasPath = path.resolve(__dirname, '../Gestión/tareas.md');

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const versionActual = pkg.version;
  console.log(`📦 Versión detectada en package.json: ${versionActual}`);

  const releaseLogContent = fs.readFileSync(releaseLogPath, 'utf8');
  const regexVersion = new RegExp(`##\\s*\\[Portal Web GSP\\]\\s*-\\s*Versi[oó]n\\s*${versionActual.replace(/\./g, '\\.')}`, 'i');
  if (!regexVersion.test(releaseLogContent)) {
    throw new Error(`DESPLIEGUE BLOQUEADO: La versión ${versionActual} no está en RELEASE_LOG.md`);
  }

  const tareasContent = fs.readFileSync(tareasPath, 'utf8');
  if (!/\[x\][^\n]*REQ-1082/i.test(tareasContent)) {
    throw new Error('DESPLIEGUE BLOQUEADO: REQ-1082 no está marcado como [x] en Gestión/tareas.md');
  }

  console.log(`✅ [HARD GATE SUPERADO]: Versión ${versionActual} y REQ-1082 validados.\n`);
  return versionActual;
}

async function deployDev() {
  const version = validarGobernanzaAntesDeDesplegar();

  console.log('===============================================================');
  console.log(`🚀 INICIANDO DESPLIEGUE EN DEV v${version} (SPEC-016 v3.8.0 / REQ-1082)`);
  console.log('===============================================================\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });
  console.log('✓ Conectado a servidor.leanglobal.cl:1295 (root)');

  const devDir = '/home/nodeadmin/proyectos/lean-services-gsp/src';

  // 1. Subir archivos backend a DEV
  console.log('\n[1/5] Sincronizando archivos Backend en DEV...');
  await ssh.putFile(
    path.resolve(__dirname, '../ejecucion/backend_remoto/src/services/tarifasOperadorService.js'),
    `${devDir}/services/tarifasOperadorService.js`
  );
  await ssh.putFile(
    path.resolve(__dirname, '../ejecucion/backend_remoto/src/controllers/reportDiarioController.js'),
    `${devDir}/controllers/reportDiarioController.js`
  );
  await ssh.putFile(
    path.resolve(__dirname, '../ejecucion/backend_remoto/src/controllers/itsController.js'),
    `${devDir}/controllers/itsController.js`
  );
  await ssh.putFile(
    path.resolve(__dirname, '../ejecucion/backend_remoto/src/controllers/proyectosController.js'),
    `${devDir}/controllers/proyectosController.js`
  );
  await ssh.putFile(
    path.resolve(__dirname, '../ejecucion/backend_remoto/src/models/proyectoModel.js'),
    `${devDir}/models/proyectoModel.js`
  );
  await ssh.execCommand(`chown -R nodeadmin:nodeadmin ${devDir}`);
  console.log('✓ Archivos backend DEV actualizados.');

  // 2. Reiniciar PM2 proceso 10 (DEV)
  console.log('\n[2/5] Reiniciando proceso PM2 10 (DEV)...');
  const pm2Res = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
  console.log(pm2Res.stdout.trim() || pm2Res.stderr.trim());

  // 3. Subir Frontend dist_dev a /var/www/html/lg-gsp-dev
  const localDistDev = path.resolve(__dirname, '../ejecucion/frontend/dist_dev');
  console.log('\n[3/5] Subiendo build Frontend DEV (/var/www/html/lg-gsp-dev)...');
  await ssh.putDirectory(localDistDev, '/var/www/html/lg-gsp-dev', {
    recursive: true,
    concurrency: 15,
    validate: (itemPath) => !itemPath.includes('.git')
  });
  await ssh.execCommand('chown -R nginx:nginx /var/www/html/lg-gsp-dev && chmod -R 755 /var/www/html/lg-gsp-dev');
  console.log('✓ Frontend DEV subido y permisos nginx aplicados.');

  // 4. Sincronizar tcfg_backlog y tcfg_releases en sch_leangsp
  console.log('\n[4/5] Sincronizando tcfg_backlog y tcfg_releases en sch_leangsp...');
  const syncSql = `
    INSERT INTO sch_leangsp.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_implementacion, solicitado_por, estado, creado_por)
    VALUES (
      'REQ-1082',
      'Redefinición del Estructurador Comercial Autónomo y Diferimiento de Política Urbana/Rural a Operaciones',
      'SPEC-016 v3.8.0: Estructuración libre en Preventa Comercial mantendo distancia_km como antecedente; definición de Política Urbana o Rural en Verificación de Operaciones con botón de devolución a Comercial; cobro al cliente Urbano desde salida de base a término en obra y Rural de inicio a término en obra; pago al operador Urbano sin traslado (solo horas reportadas) y Rural con diferencia positiva sobre horas mínimas.',
      'Alta',
      CURRENT_DATE,
      'Jorge Ponce / Sergio Gajardo',
      'Implementado',
      'Sergio Gajardo'
    )
    ON CONFLICT (codigo_req) DO UPDATE SET
      estado = 'Implementado',
      fecha_implementacion = CURRENT_DATE,
      descripcion = EXCLUDED.descripcion;

    INSERT INTO sch_leangsp.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
    VALUES (
      'v1.0.171',
      'Portal Web GSP v1.0.171 - Estructurador Comercial Autónomo, Política Urbana/Rural en Operaciones y Reglas de Cobro/Liquidación',
      'FEATURE',
      'REQ-1082 / SPEC-016 v3.8.0: Eliminación de bloques rígidos de casos en Preventa Comercial, selector de Política Urbana/Rural y devolución a Comercial en Verificación de Operaciones, y actualización de reglas de cobro al cliente e incentivos de horas al operador.',
      '["REQ-1082"]'::jsonb,
      'Sergio Gajardo'
    )
    ON CONFLICT (version) DO UPDATE SET
      titulo = EXCLUDED.titulo,
      descripcion_impacto = EXCLUDED.descripcion_impacto,
      requerimientos_asociados = EXCLUDED.requerimientos_asociados;
  `;
  await ssh.execCommand(`cat << 'EOF' > /tmp/sync_v171_dev.sql\n${syncSql}\nEOF`);
  const sqlRes = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/sync_v171_dev.sql"');
  console.log('Resultado SQL:\n', sqlRes.stdout.trim() || sqlRes.stderr.trim());
  await ssh.execCommand('rm -f /tmp/sync_v171_dev.sql');

  // 5. Verificación Empírica Live en DEV
  console.log('\n[5/5] Verificando HTTP 200 OK en DEV...');
  const devWeb = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-dev/');
  const devApi = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3006/api/operaciones/report/pendientes-analista"');
  console.log(`HTTP Status DEV Web: ${devWeb.stdout.trim()}`);
  console.log(`HTTP Status DEV API: ${devApi.stdout.trim()}`);

  ssh.dispose();
  console.log('\n===============================================================');
  console.log(`✅ DESPLIEGUE DEV v${version} FINALIZADO EXITOSAMENTE`);
  console.log('===============================================================');
}

deployDev().catch(err => {
  console.error('❌ Error desplegando en DEV:', err);
  process.exit(1);
});
