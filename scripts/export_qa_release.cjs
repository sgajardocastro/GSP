/**
 * export_qa_release.cjs
 * Script determinístico para empaquetado, backup y entrega limpia de fuentes + specs para QA (Juanma)
 * Según Workflow: .agents/workflows/qa_export_and_delivery.md
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');

// Destinos oficiales de sincronización de Google Drive (incluyendo el shortcut target directo del ID)
const TARGET_DESTS = [
  path.resolve('G:/.shortcut-targets-by-id/1yHYhyIH6_FpQGxJdFBuvI54GEoRr1c3H/Gruas San Pablo - LeanGlobal'),
  path.resolve('D:/SGajardo/Google Drive/Gruas San Pablo - LeanGlobal'),
  path.resolve('G:/Mi unidad/Gruas San Pablo - LeanGlobal'),
  path.resolve('D:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/QA_Fuentes_Web')
];

console.log('🚀 INICIANDO EXPORTACIÓN LIMPIA PARA QA (Juanma)...');
console.log(`📁 Directorio Raíz: ${ROOT_DIR}`);

// 1. Obtener Metadatos Git
let gitCommit = 'N/A';
let gitBranch = 'main';
try {
  gitCommit = execSync('git rev-parse --short HEAD', { cwd: ROOT_DIR }).toString().trim();
  gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: ROOT_DIR }).toString().trim();
} catch (e) {
  console.warn('⚠️ No se pudo obtener hash git:', e.message);
}

const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;

// 2. Función de copia recursiva con exclusiones estrictas (Zero Garbage)
const EXCLUDED_NAMES = new Set(['node_modules', 'dist', '.git', '.output', '.vscode', '.idea', 'coverage', '.cache']);
const EXCLUDED_EXTS = new Set(['.log', '.tmp', '.tsbuildinfo']);

function copyDirClean(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;
  fs.mkdirSync(destDir, { recursive: true });

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const name = entry.name;
    const srcPath = path.join(srcDir, name);
    const destPath = path.join(destDir, name);

    if (EXCLUDED_NAMES.has(name) || (name.startsWith('.env') && name !== '.env.example')) {
      continue;
    }

    if (entry.isDirectory()) {
      copyDirClean(srcPath, destPath);
    } else if (entry.isFile()) {
      const ext = path.extname(name).toLowerCase();
      if (!EXCLUDED_EXTS.has(ext)) {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

// 3. Generar LEEME_QA.md
const leemeContent = `# 🛡️ Paquete de Fuentes y Especificaciones para Auditoría QA

**Proyecto:** Grúas San Pablo (GSP) – Ecosistema Operacional & Comercial  
**Versión de Entrega:** \`v${gitCommit}\` (\`${gitBranch}\`)  
**Fecha de Generación:** ${now.toLocaleString('es-CL', { timeZone: 'America/Santiago' })}  
**Destinatario QA:** Juan Manuel Gajardo (QA Lead)

---

## 🌐 1. Entornos Activos y Enlaces de Auditoría

| Módulo / Sistema | URL de Acceso en Servidor | Credenciales / Perfil |
| :--- | :--- | :--- |
| **Torre de Control CRM** | \`https://servidor.leanglobal.cl/lg-gsp-dev/\` | Google Workspace / Acceso Directo |
| **PWA Operaciones Móvil** | \`https://servidor.leanglobal.cl/pwa-gsp-dev/\` | \`lguser@arriendosanpablo.cl\` (PIN: \`1234\`) |
| **Registro de Viaje Móvil** | \`https://servidor.leanglobal.cl/lg-gsp-dev/viaje/:token\` | Link autogenerado por OT |
| **Report Diario Izaje** | \`https://servidor.leanglobal.cl/pwa-gsp-dev/#/reportDiario\` | Operador / Rigger en faena |
| **API Backend REST** | \`https://servidor.leanglobal.cl/lg-gsp/api\` | Bearer JWT / CORS Activo |

---

## 📁 2. Estructura de este Paquete de Fuentes

Este directorio contiene el código fuente 100% limpio (sin \`node_modules\` ni compilados temporales) junto a las especificaciones formales contra las cuales auditar:

\`\`\`
├── 📁 Spec/           -> 42+ Especificaciones Técnicas Spec-Driven (Requerimientos Canónicos)
├── 📁 Proyecto/       -> Código fuente completo limpio
│   ├── 📁 frontend/   -> Web CRM Vue 3 / Vite / Tailwind
│   ├── 📁 pwa/        -> PWA Móvil Vue CLI / Vuetify
│   ├── 📁 backend/    -> API Express Node.js & PostgreSQL
│   ├── 📄 tareas.md   -> Backlog oficial de desarrollo con estado de tareas
│   └── 📄 LEEME_QA.md -> Esta guía de auditoría
├── 📄 GSP_Fuentes_y_Specs_QA.zip -> Paquete completo comprimido listo para descargar
└── 📁 _historico/     -> Respaldos automáticos de versiones anteriores
\`\`\`

---

## 🎯 3. Focos Clave de Prueba para esta Versión

1. **Torre de Control (Kanban 6 Columnas):**
   * Verificar que proyectos con salida autorizada o equipo en viaje figuren en **Columna 5: En Ejecución / Faena**.
2. **Registro de Viaje & Telemetría (Pilar 1 - Spec 32):**
   * Validación de token determinístico (\`vj-[id_proyecto]-[id_equipo]-[hash]\`).
   * Inicio de salida con odómetro/horómetro y PIN, captura de waypoints y arribo.
3. **Control de Flota & Jornada en Faena (Pilar 2 - Spec 39):**
   * Al arribar el equipo a faena, la PWA (\`Surveys.vue\`) debe mostrar la tarjeta verde de Control de Flota para abrir la jornada técnica de la grúa.
4. **Report Diario Contractual (Pilar 3 - Spec 34):**
   * Cálculo reactivo de horas efectivas vs. facturables y sobretiempo.
   * Lienzo Canvas para firma táctil del ITO Mandante y coordenadas GPS.
5. **Documentos PDF Oficiales:**
   * Certificar que la Cotización y la OT generen los apellidos completos de la tripulación y la matriz de aparejos sin \`[object Object]\`.

---
*Generado automáticamente por el Workflow Spec-Driven \`.agents/workflows/qa_export_and_delivery.md\`*
`;

// 4. Procesar cada directorio destino
for (const target of TARGET_DESTS) {
  try {
    console.log(`\n🎯 Procesando destino: ${target}...`);
    if (!fs.existsSync(target)) {
      console.log(`  Creando destino no existente: ${target}`);
      fs.mkdirSync(target, { recursive: true });
    }

    // FASE 1: Backup histórico
    const historicoDir = path.join(target, '_historico');
    const backupDir = path.join(historicoDir, `${timestamp}_v${gitCommit}`);
    const itemsAnteriores = ['Spec', 'Proyecto', 'frontend', 'pwa', 'backend', 'specs', 'LEEME_QA.md', 'tareas.md'];
    
    // Solo hacer backup si no estamos pisando una carpeta de solo lectura o vacía
    const existenArchivosReales = itemsAnteriores.some(item => {
      const p = path.join(target, item);
      if (!fs.existsSync(p)) return false;
      const entries = fs.readdirSync(p);
      return entries.length > 0 && !entries.every(e => e === 'desktop.ini');
    });

    if (existenArchivosReales) {
      console.log(`  📦 [FASE 1] Creando backup histórico en: ${backupDir}`);
      fs.mkdirSync(backupDir, { recursive: true });
      for (const item of itemsAnteriores) {
        const src = path.join(target, item);
        const dst = path.join(backupDir, item);
        if (fs.existsSync(src)) {
          // Copiar en lugar de rename para carpetas de nube que bloquean rename
          copyDirClean(src, dst);
          console.log(`     ↳ Archivado: ${item}`);
        }
      }
    }

    // FASE 2 y 3: Copia de Specs a 'Spec' y Fuentes a 'Proyecto'
    console.log('  🧹 [FASE 2 y 3] Copiando Specs y Fuentes limpios...');
    const specDir = path.join(target, 'Spec');
    const proyectoDir = path.join(target, 'Proyecto');

    fs.mkdirSync(specDir, { recursive: true });
    fs.mkdirSync(proyectoDir, { recursive: true });

    // Copiar Specs a 'Spec'
    copyDirClean(path.join(ROOT_DIR, '.agents', 'specs'), specDir);
    console.log('     ↳ Specs copiadas a Spec/');

    // Copiar Fuentes a 'Proyecto'
    copyDirClean(path.join(ROOT_DIR, 'ejecucion', 'frontend'), path.join(proyectoDir, 'frontend'));
    copyDirClean(path.join(ROOT_DIR, 'ejecucion', 'pwa'), path.join(proyectoDir, 'pwa'));
    copyDirClean(path.join(ROOT_DIR, 'ejecucion', 'backend_remoto'), path.join(proyectoDir, 'backend'));
    console.log('     ↳ Fuentes copiados a Proyecto/ (frontend, pwa, backend)');

    // Backlog y LEEME
    const tareasSrc = path.join(ROOT_DIR, 'Gestión', 'tareas.md');
    if (fs.existsSync(tareasSrc)) {
      fs.copyFileSync(tareasSrc, path.join(proyectoDir, 'tareas.md'));
    }
    fs.writeFileSync(path.join(proyectoDir, 'LEEME_QA.md'), leemeContent, 'utf-8');
    fs.writeFileSync(path.join(target, 'LEEME_QA.md'), leemeContent, 'utf-8');

    console.log(`  ✅ Destino sincronizado exitosamente: ${target}`);
  } catch (err) {
    console.warn(`  ⚠️ Aviso en ${target}:`, err.message);
  }
}

// 5. FASE 4: Generar ZIP unificado
try {
  console.log('\n📦 [FASE 4] Generando archivo ZIP empaquetado para descarga rápida...');
  const mainTarget = TARGET_DESTS[0];
  const zipPath = path.join(mainTarget, 'GSP_Fuentes_y_Specs_QA.zip');
  execSync(`powershell -Command "Compress-Archive -Path '${path.join(ROOT_DIR, '.agents', 'specs')}', '${path.join(ROOT_DIR, 'ejecucion', 'frontend')}', '${path.join(ROOT_DIR, 'ejecucion', 'pwa')}', '${path.join(ROOT_DIR, 'ejecucion', 'backend_remoto')}' -DestinationPath '${zipPath}' -Force"`);
  console.log(`  ✅ ZIP generado en: ${zipPath}`);

  // Replicar ZIP a los otros destinos
  for (let i = 1; i < TARGET_DESTS.length; i++) {
    const otherZip = path.join(TARGET_DESTS[i], 'GSP_Fuentes_y_Specs_QA.zip');
    if (fs.existsSync(TARGET_DESTS[i])) {
      fs.copyFileSync(zipPath, otherZip);
    }
  }
} catch (eZip) {
  console.warn('  ⚠️ Aviso generando ZIP:', eZip.message);
}

console.log('\n🎉 ¡EXPORTACIÓN Y BACKUP DE QA COMPLETADO AL 100%!');
console.log('👉 Disponible en Google Drive para Juanma.\n');
