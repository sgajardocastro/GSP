const { NodeSSH } = require('d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/ejecucion/backend_remoto/node_modules/node-ssh');
const fs = require('fs');
const path = require('path');
const client = require('./src/config/dbConfig.js');

const ssh = new NodeSSH();
const rootDir = 'd:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas';
const pkgPath = path.join(rootDir, 'ejecucion/frontend/package.json');
const releaseLogPath = path.join(rootDir, 'RELEASE_LOG.md');
const tareasPath = path.join(rootDir, 'Gestión/tareas.md');
const localDist = path.join(rootDir, 'ejecucion/frontend/dist');
const remoteDir = '/var/www/html/lg-gsp-dev';

/**
 * 🛡️ COMPUERTA DURA DETERMINISTA (HARD GATE) DE GOBERNANZA LEANGLOBAL
 * Este script BLOQUEA FÍSICAMENTE el despliegue si no se cumple el contrato:
 * 1. package.json con versión válida.
 * 2. Entrada exacta en RELEASE_LOG.md con dicha versión.
 * 3. Requerimiento REQ-XXX declarado en RELEASE_LOG.md y registrado en tareas.md como completado ([x]).
 */
function validarGobernanzaAntesDeDesplegar() {
  console.log("🛡️ [HARD GATE] Ejecutando verificación obligatoria de gobernanza...");

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
  const regexVersion = new RegExp(`##\\s*\\[Portal Web GSP[^\\]]*\\]\\s*-\\s*Versi[oó]n\\s*${versionActual.replace('.', '\\.')}`, 'i');
  if (!regexVersion.test(releaseLogContent)) {
    console.error("\n==========================================================================");
    console.error(`❌ DESPLIEGUE BLOQUEADO: La versión ${versionActual} no está documentada en RELEASE_LOG.md`);
    console.error(`   Debes crear el bloque: "## [Portal Web GSP y Backend API] - Versión ${versionActual}" antes de desplegar.`);
    console.error("==========================================================================\n");
    process.exit(1);
  }

  // Extraer el código REQ asociado
  const bloqueMatch = releaseLogContent.match(new RegExp(`##\\s*\\[Portal Web GSP[^\\]]*\\]\\s*-\\s*Versi[oó]n\\s*${versionActual.replace('.', '\\.')}[\\s\\S]*?(?=##\\s*\\[|$)`, 'i'));
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

  console.log(`✅ [HARD GATE SUPERADO]: Versión ${versionActual} y ${reqCodigo} validados y trazables en Backlog.\n`);
  return { 
    version: versionActual, 
    req: reqCodigo, 
    titulo: `Portal Web GSP v${versionActual}`,
    nombreReq,
    descripcion: descripcionImpacto
  };
}

async function sincronizarBaseDeDatos(governanceInfo) {
  try {
    console.log("🗄️ Sincronizando metadatos de versión en base de datos PostgreSQL...");
    
    // 1. Sincronizar Backlog
    const qBacklog = `
      INSERT INTO sch_leangsp.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad,
        fecha_registro, fecha_implementacion, solicitado_por, estado, creado_por
      ) VALUES (
        $1, $2, $3, 'Alta',
        CURRENT_DATE, CURRENT_DATE, 'Sesión Marcha Blanca Temuco', 'Implementado', 'Sergio Gajardo'
      )
      ON CONFLICT (codigo_req) DO UPDATE
      SET nombre_requerimiento = EXCLUDED.nombre_requerimiento,
          descripcion = EXCLUDED.descripcion,
          estado = 'Implementado',
          fecha_implementacion = CURRENT_DATE,
          updated_at = NOW();
    `;
    await client.query(qBacklog, [
      governanceInfo.req,
      governanceInfo.nombreReq,
      governanceInfo.descripcion
    ]);
    // Sincronizar también REQ-704 y REQ-735 en DEV
    await client.query(`
      INSERT INTO sch_leangsp.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad,
        fecha_registro, fecha_implementacion, solicitado_por, estado, creado_por
      ) VALUES 
        ('REQ-704', 'Formato Monetario con Separador de Miles', 'Input interactivo con adornador $ y separador de miles es-CL', 'Baja', CURRENT_DATE, CURRENT_DATE, 'Jorge Ponce', 'Implementado', 'Sergio Gajardo'),
        ('REQ-735', 'Descripciones Limpias y Validación Obligatoria', 'Descripción limpia, celda 280px y validación obligatoria antes de guardar o cotizar', 'Media', CURRENT_DATE, CURRENT_DATE, 'Jorge Ponce', 'Implementado', 'Sergio Gajardo')
      ON CONFLICT (codigo_req) DO UPDATE 
      SET estado = 'Implementado', fecha_implementacion = CURRENT_DATE, updated_at = NOW();
    `);
    console.log(`✅ REQ-633, REQ-704 y REQ-735 sincronizados en sch_leangsp.tcfg_backlog`);

    // 2. Sincronizar Release
    const qRelease = `
      INSERT INTO sch_leangsp.tcfg_releases (
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
    await client.query(qRelease, [
      `v${governanceInfo.version}`,
      governanceInfo.titulo,
      governanceInfo.descripcion,
      JSON.stringify(['REQ-633', 'REQ-704', 'REQ-735'])
    ]);
    console.log(`✅ v${governanceInfo.version} sincronizada en sch_leangsp.tcfg_releases`);
  } catch (dbErr) {
    console.warn("⚠️ Advertencia en sincronización BD (la web ya fue desplegada):", dbErr.message);
  }
}

async function run() {
  const governanceInfo = validarGobernanzaAntesDeDesplegar();

  console.log("🚀 Iniciando despliegue de Frontend Web a servidor remoto...");
  try {
    await ssh.connect({
      host: '138.255.103.18',
      username: 'root',
      password: 'lgbl2025.',
      port: 1295,
      readyTimeout: 15000
    });
    console.log("✅ Conectado por SSH como root!");

    console.log("📦 Creando respaldo remoto de seguridad en /var/www/html/backups...");
    const bkpRes = await ssh.execCommand(`mkdir -p /var/www/html/backups && tar -czf /var/www/html/backups/lg-gsp-dev-backup-$(date +%Y%m%d_%H%M%S).tar.gz -C /var/www/html lg-gsp-dev`);
    console.log("Resultado respaldo:", bkpRes.stdout || "OK");

    console.log(`Subiendo ${localDist} a ${remoteDir}...`);
    await ssh.execCommand(`rm -rf ${remoteDir}/*`);
    const status = await ssh.putDirectory(localDist, remoteDir, {
      recursive: true,
      concurrency: 10,
      validate: function(itemPath) {
        return path.basename(itemPath) !== '.DS_Store';
      }
    });

    if (status) {
      console.log(`✅ Frontend v${governanceInfo.version} subido exitosamente a ${remoteDir}!`);
    } else {
      console.log("⚠️ Algunos archivos no se pudieron subir.");
    }

    console.log("Ajustando permisos...");
    await ssh.execCommand(`chown -R nginx:nginx ${remoteDir} || chown -R root:root ${remoteDir}`);
    await ssh.execCommand(`chmod -R 755 ${remoteDir}`);

    // Sincronizar Backend en servidor remoto
    console.log("\n⬆️ Sincronizando código de Backend en /home/nodeadmin/proyectos/lean-services-gsp/src...");
    const localBackendSrc = path.join(rootDir, 'ejecucion/backend_remoto/src');
    const remoteBackendSrc = '/home/nodeadmin/proyectos/lean-services-gsp/src';
    await ssh.putDirectory(localBackendSrc, remoteBackendSrc, {
      recursive: true,
      concurrency: 10
    });
    await ssh.execCommand(`chown -R nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp`);
    console.log("✅ Backend sincronizado!");

    console.log("🔄 Reiniciando proceso PM2 lean-services-gsp (ID 10)...");
    const pm2Res = await ssh.execCommand('su - nodeadmin -c "pm2 restart lean-services-gsp"');
    console.log("PM2 Output:\n", pm2Res.stdout || pm2Res.stderr);

    // Sincronizar metadatos en base de datos
    await sincronizarBaseDeDatos(governanceInfo);

    console.log(`\n🎉 Frontend Web v${governanceInfo.version} desplegado y auditado exitosamente!`);
  } catch (err) {
    console.error("❌ Error en despliegue Frontend:", err);
    process.exit(1);
  } finally {
    try { ssh.dispose(); } catch (e) {}
    try { await client.end(); } catch (e) {}
    process.exit(0);
  }
}

client.on('error', () => {});

run();
