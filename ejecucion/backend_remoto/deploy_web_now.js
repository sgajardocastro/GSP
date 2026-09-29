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

  console.log(`✅ [HARD GATE SUPERADO]: Versión ${versionActual} y ${reqCodigo} validados y trazables en Backlog.\n`);
  return { version: versionActual, req: reqCodigo, titulo: `Portal Web GSP v${versionActual}` };
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
        CURRENT_DATE, CURRENT_DATE, 'Sergio Gajardo / Operaciones', 'Implementado', 'Sergio Gajardo'
      )
      ON CONFLICT (codigo_req) DO UPDATE
      SET estado = 'Implementado',
          fecha_implementacion = CURRENT_DATE,
          updated_at = NOW();
    `;
    await client.query(qBacklog, [
      governanceInfo.req,
      `Estandarización Kanban y Rediseño Asignación (v${governanceInfo.version})`,
      'Redirección directa a Torre, erradicación de falsa alerta dirty en etapas 3+, tarjetas Kanban estándar y rediseño de asignación con títulos azules sin guiones ni candados.'
    ]);
    console.log(`✅ ${governanceInfo.req} sincronizado en sch_leangsp.tcfg_backlog`);

    // 2. Sincronizar Release
    const qRelease = `
      INSERT INTO sch_leangsp.tcfg_releases (
        version, fecha_release, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por
      ) VALUES (
        $1, CURRENT_DATE, $2, 'Feature & UI',
        'Estandarización visual Kanban, inmutabilidad anti-dirty y rediseño de asignación de recursos.',
        $3::jsonb, 'Sergio Gajardo'
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
      JSON.stringify([governanceInfo.req])
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

    // Sincronizar metadatos en base de datos
    await sincronizarBaseDeDatos(governanceInfo);

    console.log(`\n🎉 Frontend Web v${governanceInfo.version} desplegado y auditado exitosamente!`);
  } catch (err) {
    console.error("❌ Error en despliegue Frontend:", err);
    process.exit(1);
  } finally {
    ssh.dispose();
  }
}

run();
