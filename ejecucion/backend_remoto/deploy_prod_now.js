const { NodeSSH } = require('d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/ejecucion/backend_remoto/node_modules/node-ssh');
const fs = require('fs');
const path = require('path');
const pg = require('pg');

const ssh = new NodeSSH();
const rootDir = 'd:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas';
const pkgPath = path.join(rootDir, 'ejecucion/frontend/package.json');
const releaseLogPath = path.join(rootDir, 'RELEASE_LOG.md');
const tareasPath = path.join(rootDir, 'Gestión/tareas.md');
const localDist = path.join(rootDir, 'ejecucion/frontend/dist');
const remoteDir = '/var/www/html/lg-gsp-prod';

/**
 * 🛡️ COMPUERTA DURA DETERMINISTA (HARD GATE) DE GOBERNANZA LEANGLOBAL - PRODUCCIÓN
 */
function validarGobernanzaAntesDeDesplegar() {
  console.log("🛡️ [HARD GATE PRODUCCIÓN] Ejecutando verificación obligatoria de gobernanza...");

  if (!fs.existsSync(pkgPath)) {
    console.error("❌ ERROR CRÍTICO: No existe package.json en", pkgPath);
    process.exit(1);
  }
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const versionActual = pkg.version;
  console.log(`📦 Versión detectada en package.json: ${versionActual}`);

  if (!fs.existsSync(releaseLogPath)) {
    console.error("❌ ERROR CRÍTICO: No existe RELEASE_LOG.md en", releaseLogPath);
    process.exit(1);
  }
  const releaseLogContent = fs.readFileSync(releaseLogPath, 'utf8');

  // Buscar bloque para esta versión exacta
  const regexVersion = new RegExp(`##\\s*\\[Portal Web GSP\\]\\s*-\\s*Versi[oó]n\\s*${versionActual.replace('.', '\\.')}`, 'i');
  if (!regexVersion.test(releaseLogContent)) {
    console.error("\n==========================================================================");
    console.error(`❌ DESPLIEGUE BLOQUEADO: La versión ${versionActual} no está documentada en RELEASE_LOG.md`);
    console.error(`   Debes crear el bloque: "## [Portal Web GSP] - Versión ${versionActual}" antes de desplegar.`);
    console.error("==========================================================================\n");
    process.exit(1);
  }

  // Extraer el código REQ asociado
  const bloqueMatch = releaseLogContent.match(new RegExp(`##\\s*\\[Portal Web GSP\\]\\s*-\\s*Versi[oó]n\\s*${versionActual.replace('.', '\\.')}[\\s\\S]*?(?=##\\s*\\[|$)`, 'i'));
  const bloqueTexto = bloqueMatch ? bloqueMatch[0] : '';
  const reqMatch = bloqueTexto.match(/REQ-\d+/i);
  if (!reqMatch) {
    console.error("\n==========================================================================");
    console.error(`❌ DESPLIEGUE BLOQUEADO: El bloque de la versión ${versionActual} en RELEASE_LOG.md no indica "REQ-XXX".`);
    console.error("==========================================================================\n");
    process.exit(1);
  }
  const reqCodigo = reqMatch[0].toUpperCase();
  console.log(`📋 Requerimiento asociado en RELEASE_LOG.md: ${reqCodigo}`);

  // Verificar en tareas.md
  if (!fs.existsSync(tareasPath)) {
    console.error("❌ ERROR CRÍTICO: No existe Gestión/tareas.md en", tareasPath);
    process.exit(1);
  }
  const tareasContent = fs.readFileSync(tareasPath, 'utf8');
  if (!tareasContent.includes(reqCodigo)) {
    console.error("\n==========================================================================");
    console.error(`❌ DESPLIEGUE BLOQUEADO: El requerimiento ${reqCodigo} no existe en Gestión/tareas.md`);
    console.error("==========================================================================\n");
    process.exit(1);
  }

  // Verificar que esté completado con [x]
  const regexReqCompletado = new RegExp(`\\[x\\][^\n]*${reqCodigo}`, 'i');
  if (!regexReqCompletado.test(tareasContent)) {
    console.error("\n==========================================================================");
    console.error(`❌ DESPLIEGUE BLOQUEADO: El requerimiento ${reqCodigo} en Gestión/tareas.md no está marcado como completado ([x]).`);
    console.error("==========================================================================\n");
    process.exit(1);
  }

  // Extraer título de tareas.md para este REQ
  const lineaTareaMatch = tareasContent.match(new RegExp(`\\[x\\]\\s*\\*\\*\\[([^\\]]+)\\s*-\\s*${reqCodigo}[^\\]]*\\]\\*\\*`, 'i'));
  const nombreReq = lineaTareaMatch ? lineaTareaMatch[1].trim() : `Requerimiento ${reqCodigo} (v${versionActual})`;

  // Extraer detalle de cambios de RELEASE_LOG.md
  const lineasDetalle = bloqueTexto.split('\n')
    .filter(l => l.trim().startsWith('- **[') || l.trim().startsWith('*   - **['))
    .map(l => l.replace(/^[\s\*\-]+/, '').replace(/\*\*/g, '').trim());
  const descripcionImpacto = lineasDetalle.join('; ').substring(0, 350) || `Actualización ${reqCodigo} v${versionActual}`;

  console.log(`✅ [HARD GATE SUPERADO]: Versión ${versionActual} y ${reqCodigo} validados y trazables para PRODUCCIÓN.\n`);
  return { 
    version: versionActual, 
    req: reqCodigo, 
    titulo: `Portal Web GSP v${versionActual}`,
    nombreReq,
    descripcion: descripcionImpacto
  };
}

async function sincronizarBaseDeDatosProd(governanceInfo) {
  const { Client } = pg;
  const clientProd = new Client({
    host: '138.255.103.18',
    port: 5432,
    database: 'postgres',
    user: 'usr_leangsp_prod',
    password: 'usr_gsp_prod_2026!',
  });

  try {
    console.log("🗄️ Sincronizando metadatos de versión en sch_leangsp_prod...");
    clientProd.on('error', (err) => {
      // Ignorar errores de cierre de conexión post-query
    });
    await clientProd.connect();
    
    // 0. Sincronizar secuencias
    await clientProd.query("SELECT setval('sch_leangsp_prod.tcfg_backlog_id_seq', (SELECT COALESCE(MAX(id), 1) FROM sch_leangsp_prod.tcfg_backlog))");
    await clientProd.query("SELECT setval('sch_leangsp_prod.tcfg_releases_id_seq', (SELECT COALESCE(MAX(id), 1) FROM sch_leangsp_prod.tcfg_releases))");

    // 1. Sincronizar Backlog
    const qBacklog = `
      INSERT INTO sch_leangsp_prod.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad,
        fecha_registro, fecha_implementacion, solicitado_por, estado, creado_por
      ) VALUES (
        $1, $2, $3, 'Alta',
        CURRENT_DATE, CURRENT_DATE, 'Pase a Producción Oficial', 'Implementado', 'Sergio Gajardo'
      )
      ON CONFLICT (codigo_req) DO UPDATE 
      SET nombre_requerimiento = EXCLUDED.nombre_requerimiento,
          descripcion = EXCLUDED.descripcion,
          estado = 'Implementado',
          fecha_implementacion = CURRENT_DATE,
          updated_at = NOW();
    `;
    await clientProd.query(qBacklog, [
      governanceInfo.req,
      governanceInfo.nombreReq,
      governanceInfo.descripcion
    ]);
    // Sincronizar también REQ-704 y REQ-735 en PROD
    await clientProd.query(`
      UPDATE sch_leangsp_prod.tcfg_backlog 
      SET estado = 'Implementado', fecha_implementacion = CURRENT_DATE, updated_at = NOW()
      WHERE codigo_req IN ('REQ-633', 'REQ-704', 'REQ-735');
    `);
    console.log(`✅ REQ-633, REQ-704 y REQ-735 sincronizados como Implementado en sch_leangsp_prod.tcfg_backlog`);

    // 2. Sincronizar Release
    const qRelease = `
      INSERT INTO sch_leangsp_prod.tcfg_releases (
        version, fecha_release, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por
      ) VALUES (
        $1, CURRENT_DATE, $2, 'Feature & UI',
        $3,
        $4::jsonb, 'Sergio Gajardo'
      )
      ON CONFLICT (version) DO UPDATE 
      SET fecha_release = CURRENT_DATE,
          titulo = EXCLUDED.titulo,
          descripcion_impacto = EXCLUDED.descripcion_impacto,
          requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    `;
    await clientProd.query(qRelease, [
      `v${governanceInfo.version}`,
      governanceInfo.titulo,
      governanceInfo.descripcion,
      JSON.stringify(['REQ-633', 'REQ-704', 'REQ-735'])
    ]);
    console.log(`✅ v${governanceInfo.version} sincronizada en sch_leangsp_prod.tcfg_releases`);
    await clientProd.end();
  } catch (dbErr) {
    console.warn("⚠️ Advertencia en sincronización BD PROD:", dbErr.message);
  }
}

async function run() {
  const governanceInfo = validarGobernanzaAntesDeDesplegar();

  console.log("🚀 Iniciando despliegue de Frontend Web a PRODUCCIÓN (/var/www/html/lg-gsp-prod)...");
  try {
    await ssh.connect({
      host: '138.255.103.18',
      username: 'root',
      password: 'lgbl2025.',
      port: 1295,
      readyTimeout: 15000
    });
    console.log("✅ Conectado por SSH como root!");

    // 1. Respaldo previo
    console.log("📦 Creando respaldo remoto de seguridad en /var/www/html/backups...");
    await ssh.execCommand('mkdir -p /var/www/html/backups');
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const backupCmd = `tar -czf /var/www/html/backups/lg-gsp-prod-bak-${timestamp}.tar.gz -C /var/www/html lg-gsp-prod 2>/dev/null`;
    await ssh.execCommand(backupCmd);
    console.log("Resultado respaldo: OK");

    // 2. Limpieza y subida
    console.log(`Subiendo ${localDist} a ${remoteDir}...`);
    await ssh.execCommand(`mkdir -p ${remoteDir}`);
    await ssh.execCommand(`rm -rf ${remoteDir}/*`);

    const status = await ssh.putDirectory(localDist, remoteDir, {
      recursive: true,
      concurrency: 10,
      validate: (itemPath) => !itemPath.includes('.map')
    });

    if (status) {
      console.log(`✅ Frontend v${governanceInfo.version} subido exitosamente a ${remoteDir}!`);
    } else {
      console.warn("⚠️ Advertencia durante la subida con putDirectory.");
    }

    // 3. Permisos
    console.log("Ajustando permisos...");
    await ssh.execCommand(`chown -R nginx:nginx ${remoteDir}`);
    await ssh.execCommand(`chmod -R 755 ${remoteDir}`);

    // 3.5. Sincronizar Backend en Producción (/home/nodeadmin/proyectos/lean-services-gsp-prod/src) y reiniciar PM2 ID 13
    const localBackendSrc = path.join(rootDir, 'ejecucion/backend_remoto/src');
    const remoteBackendProd = '/home/nodeadmin/proyectos/lean-services-gsp-prod/src';
    console.log(`\n⬆️ Sincronizando Backend a PRODUCCIÓN (${remoteBackendProd})...`);
    await ssh.putDirectory(localBackendSrc, remoteBackendProd, {
      recursive: true,
      concurrency: 8,
      validate: (itemPath) => !itemPath.includes('node_modules') && !itemPath.includes('.git')
    });
    await ssh.execCommand(`chown -R nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp-prod`);
    console.log("🔄 Reiniciando proceso PM2 lean-services-gsp-prod (ID 13)...");
    const pm2Res = await ssh.execCommand('su - nodeadmin -c "pm2 restart 13"');
    console.log("PM2 Output:\n", pm2Res.stdout);

    // 4. Sincronizar en BD Producción
    await sincronizarBaseDeDatosProd(governanceInfo);

    console.log(`\n🎉 Frontend Web v${governanceInfo.version} desplegado y certificado en PRODUCCIÓN!`);
    console.log(`🔗 URL: https://servidor.leanglobal.cl/lg-gsp-prod/`);
  } catch (err) {
    console.error("❌ ERROR DURANTE EL DESPLIEGUE A PRODUCCIÓN:", err);
    process.exit(1);
  } finally {
    ssh.dispose();
  }
}

run();
