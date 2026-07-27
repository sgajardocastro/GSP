import { NodeSSH } from 'node-ssh';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '../..'); // Root de Grúas San Pablo
const frontendRoot = path.join(rootDir, 'ejecucion', 'frontend');
const pwaRoot = path.join(rootDir, 'ejecucion', 'pwa');
const backendRoot = path.join(rootDir, 'ejecucion', 'backend_remoto');
const releaseLogPath = path.join(rootDir, 'RELEASE_LOG.md');

const ssh = new NodeSSH();

function bumpVersion(pkgPath) {
  if (!fs.existsSync(pkgPath)) {
    console.warn(`⚠️ No se encontró package.json en: ${pkgPath}`);
    return null;
  }
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const oldVer = pkg.version || '1.0.0';
  const parts = oldVer.split('.');
  if (parts.length === 3) {
    parts[2] = String(Number(parts[2]) + 1);
  } else {
    parts.push('1');
  }
  const newVer = parts.join('.');
  pkg.version = newVer;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  console.log(`📈 Versión actualizada en ${path.basename(pkgPath)} (${pkg.name}): ${oldVer} -> ${newVer}`);
  return newVer;
}

function updateReleaseLog(webVer, pwaVer, changes) {
  if (!fs.existsSync(releaseLogPath)) {
    console.warn(`⚠️ No se encontró RELEASE_LOG.md`);
    return;
  }

  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  const webChanges = changes.web || [
    "- **[FEAT]** **Semáforos por Máxima Severidad:** Implementada agregación por riesgo (Rojo > Amarillo > Verde > Gris).",
    "- **[FIX]** **URL Singular de Archivos:** Ajustada la ruta de previsualización a `/api/archivo/ver/:id`."
  ];

  const backendChanges = changes.backend || [
    "- **[FEAT]** **Evaluación SQL en `tequEquipoModel.getEquipos()`:** Agregada evaluación por máxima severidad en la carga inicial de flota.",
    "- **[FEAT]** **Endpoint de Archivos Físicos:** Expuesta la ruta `/api/archivo/ver/:id` leyendo de `/u05/LeanDocs/GSP/Equipos/`."
  ];

  const logEntry = `## [Portal Web GSP] - Versión ${webVer}
- **Ambiente:** \`dev\`
- **Fecha de Despliegue:** ${todayStr} (-04:00)
- **Ruta de Despliegue:** \`/var/www/html/lg-gsp-dev\` (URL: \`https://servidor.leanglobal.cl/lg-gsp-dev/\`)
- **Detalle de Mejoras y Cambios:**
${webChanges.map(c => `  ${c}`).join('\n')}

## [Backend GSP] - Versión ${webVer}
- **Ambiente:** \`dev\`
- **Fecha de Despliegue:** ${todayStr} (-04:00)
- **Proceso PM2:** \`lean-services-gsp\` (ID 10)
- **Ruta Remota:** \`/home/nodeadmin/proyectos/lean-services-gsp\`
- **Detalle de Mejoras y Cambios:**
${backendChanges.map(c => `  ${c}`).join('\n')}

`;

  const logContent = fs.readFileSync(releaseLogPath, 'utf8');
  const insertIndex = logContent.indexOf('## [');
  if (insertIndex !== -1) {
    const updatedContent = logContent.slice(0, insertIndex) + logEntry + logContent.slice(insertIndex);
    fs.writeFileSync(releaseLogPath, updatedContent, 'utf8');
    console.log('📝 RELEASE_LOG.md actualizado exitosamente con la nueva versión.');
  } else {
    fs.appendFileSync(releaseLogPath, '\n' + logEntry, 'utf8');
    console.log('📝 RELEASE_LOG.md actualizado (adjuntado).');
  }
}

async function deploy() {
  console.log(`🚀 INICIANDO PROCESO DE DESPLIEGUE CONTROLADO DE GRÚAS SAN PABLO (GSP)`);

  try {
    // 1. Incrementar versiones
    console.log('\n🔄 1. Incrementando números de versión en package.json...');
    const webVer = bumpVersion(path.join(frontendRoot, 'package.json')) || '1.0.1';
    const pwaVer = bumpVersion(path.join(pwaRoot, 'package.json')) || '1.0.1';

    // 2. Registrar en RELEASE_LOG.md
    console.log('\n📝 2. Actualizando RELEASE_LOG.md con la traza oficial...');
    const customChanges = {
      web: [
        "- **[FEAT]** **Ordenamiento de Columnas:** Implementada lógica interactiva para ordenar de forma ascendente/descendente las columnas (ID, Email, Nombre, Rut, Empresa, Estado, Cargo, Nacimiento, FES) al clickear sus encabezados en la grilla de usuarios."
      ],
      backend: [
        "- **[FIX]** **Integridad de Datos en BD:** Saneado el mapeo de los 4 administradores enrolados principales en PostgreSQL asignándoles `id_empresa = 9` para consistencia con el filtro de multi-tenant de GSP."
      ]
    };
    updateReleaseLog(webVer, pwaVer, customChanges);

    // 3. Compilar Web App (Vite)
    console.log('\n🏗️ 3. Compilando Web App (Vite) en ejecucion/frontend...');
    const localWebDist = path.join(frontendRoot, 'dist');
    if (fs.existsSync(localWebDist)) {
      fs.rmSync(localWebDist, { recursive: true, force: true });
    }
    execSync('npm run build', { cwd: frontendRoot, stdio: 'inherit' });

    // 4. Conectar por SSH
    console.log('\n🔌 4. Conectando a servidor.leanglobal.cl:1295 via SSH...');
    await ssh.connect({
      host: 'servidor.leanglobal.cl',
      port: 1295,
      username: 'root',
      password: 'lgbl2025.'
    });
    console.log('✅ Conexión SSH establecida con éxito.');

    // 5. Crear respaldo remoto de la versión anterior en /var/www/html/backups
    const webRemote = '/var/www/html/lg-gsp-dev';
    console.log(`\n📦 5. Respaldando directorio remoto existente ${webRemote}...`);
    await ssh.execCommand('mkdir -p /var/www/html/backups');
    const backupName = `lg-gsp-dev-backup-\$(date +%Y%m%d_%H%M%S).tar.gz`;
    const checkDir = await ssh.execCommand(`ls -d ${webRemote}`);
    if (checkDir.code === 0) {
      console.log(`🗜️ Creando archivo de respaldo /var/www/html/backups/${backupName}...`);
      await ssh.execCommand(`tar -czf /var/www/html/backups/${backupName} -C /var/www/html lg-gsp-dev`);
      console.log(`✅ Respaldo creado exitosamente.`);
    }

    // 6. Subir Frontend Web a /var/www/html/lg-gsp-dev
    console.log(`\n⬆️  6. Subiendo nuevo build de Frontend Web (${localWebDist} -> ${webRemote})...`);
    await ssh.putDirectory(localWebDist, webRemote, {
      recursive: true,
      concurrency: 15
    });
    await ssh.execCommand(`chown -R nginx:nginx ${webRemote}`);
    console.log('✅ Frontend Web subido y permisos nginx aplicados.');

    // 7. Subir Backend a /home/nodeadmin/proyectos/lean-services-gsp/src
    const localBackendSrc = path.join(backendRoot, 'src');
    const remoteBackendSrc = '/home/nodeadmin/proyectos/lean-services-gsp/src';
    console.log(`\n⬆️  7. Sincronizando código de Backend (${localBackendSrc} -> ${remoteBackendSrc})...`);
    await ssh.putDirectory(localBackendSrc, remoteBackendSrc, {
      recursive: true,
      concurrency: 15
    });
    await ssh.execCommand(`chown -R nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp`);
    console.log('✅ Backend sincronizado y permisos nodeadmin aplicados.');

    // 8. Reiniciar PM2
    console.log(`\n🔄 8. Reiniciando proceso PM2 lean-services-gsp (ID 10)...`);
    const pm2Res = await ssh.execCommand('sudo -u nodeadmin pm2 restart lean-services-gsp');
    console.log("PM2 Output:\n", pm2Res.stdout || pm2Res.stderr);

    console.log(`\n🎉 DESPLIEGUE OFICIAL COMPLETADO CON ÉXITO PARA GSP VERSIÓN ${webVer}!`);
  } catch (err) {
    console.error('\n❌ ERROR DURANTE EL DESPLIEGUE:', err.message || err);
    process.exit(1);
  } finally {
    ssh.dispose();
  }
}

deploy();
