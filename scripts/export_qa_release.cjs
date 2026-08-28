/**
 * export_qa_release.cjs
 * Script determinístico para empaquetado, backup y entrega limpia de fuentes + specs para QA (Juanma)
 * Según Workflow: .agents/workflows/qa_export_and_delivery.md
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');

// Destinos soportados (Se sincroniza en el directorio oficial de entrega QA de GSP)
const DEFAULT_DEST = path.resolve('D:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/QA_Fuentes_Web');
const TARGET_DEST = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_DEST;

console.log('🚀 INICIANDO EXPORTACIÓN LIMPIA PARA QA...');
console.log(`📁 Directorio Raíz: ${ROOT_DIR}`);
console.log(`🎯 Directorio Destino QA: ${TARGET_DEST}`);

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

// 2. Crear directorios base
if (!fs.existsSync(TARGET_DEST)) {
  fs.mkdirSync(TARGET_DEST, { recursive: true });
}

// 3. FASE 1: Backup del estado anterior
const historicoDir = path.join(TARGET_DEST, '_historico');
const backupDir = path.join(historicoDir, `${timestamp}_v${gitCommit}`);

const itemsAnteriores = ['frontend', 'pwa', 'backend', 'specs', 'LEEME_QA.md', 'tareas.md'];
const existenItems = itemsAnteriores.some(item => fs.existsSync(path.join(TARGET_DEST, item)));

if (existenItems) {
  console.log(`\n📦 [FASE 1] Creando backup histórico en: ${backupDir}`);
  fs.mkdirSync(backupDir, { recursive: true });
  for (const item of itemsAnteriores) {
    const src = path.join(TARGET_DEST, item);
    const dst = path.join(backupDir, item);
    if (fs.existsSync(src)) {
      fs.renameSync(src, dst);
      console.log(`   ↳ Archivado: ${item}`);
    }
  }
}

// 4. Función de copia recursiva con exclusiones estrictas (Zero Garbage)
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

// 5. FASE 2: Copia de Fuentes Limpios
console.log('\n🧹 [FASE 2] Copiando fuentes limpios (sin node_modules ni compilados)...');

// 5.1 Frontend
console.log('   ↳ Copiando Frontend Web CRM (ejecucion/frontend)...');
copyDirClean(path.join(ROOT_DIR, 'ejecucion', 'frontend'), path.join(TARGET_DEST, 'frontend'));

// 5.2 PWA
console.log('   ↳ Copiando PWA Móvil (ejecucion/pwa)...');
copyDirClean(path.join(ROOT_DIR, 'ejecucion', 'pwa'), path.join(TARGET_DEST, 'pwa'));

// 5.3 Backend
console.log('   ↳ Copiando Backend Node.js (ejecucion/backend_remoto)...');
copyDirClean(path.join(ROOT_DIR, 'ejecucion', 'backend_remoto'), path.join(TARGET_DEST, 'backend'));

// 6. FASE 3: Inyección de Especificaciones y Backlog
console.log('\n📐 [FASE 3] Inyectando especificaciones técnicas Spec-Driven...');

// 6.1 Specs
console.log('   ↳ Copiando 39+ Specs (.agents/specs)...');
copyDirClean(path.join(ROOT_DIR, '.agents', 'specs'), path.join(TARGET_DEST, 'specs'));

// 6.2 Backlog tareas.md
const tareasSrc = path.join(ROOT_DIR, 'Gestión', 'tareas.md');
if (fs.existsSync(tareasSrc)) {
  fs.copyFileSync(tareasSrc, path.join(TARGET_DEST, 'tareas.md'));
  console.log('   ↳ Copiado Gestión/tareas.md');
}

// 7. FASE 4: Generación de LEEME_QA.md
console.log('\n📄 [FASE 4] Generando Guía de Auditoría LEEME_QA.md...');

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
├── 📁 frontend/       -> Código Web CRM Vue 3 / Vite / Tailwind
│   ├── src/views/CRM/GestorOportunidades.vue (6 Subpestañas completas)
│   ├── src/views/Torre.vue (Kanban Operacional 6 Columnas)
│   └── src/components/Operaciones/ (ModalMapaViaje, ModalVisorReport)
├── 📁 pwa/            -> Código PWA Móvil Vue CLI / Vuetify
│   ├── src/views/Surveys.vue (Checklists, AST, Banners de Viaje y Flota)
│   └── src/views/ReportDiarioIzaje.vue (Control de Flota y Firma Mandante)
├── 📁 backend/        -> API Express Node.js & PostgreSQL
│   ├── src/controllers/ (viajeController, reportDiarioController, proyectoController)
│   ├── src/models/ (viajeModel, reportDiarioModel, proyectoModel)
│   └── src/database/ (Migraciones SQL y esquemas sch_leangsp)
├── 📁 specs/          -> 39+ Especificaciones Técnicas Spec-Driven (Requerimientos Canónicos)
└── 📄 tareas.md       -> Backlog oficial de desarrollo con estado de tareas
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

fs.writeFileSync(path.join(TARGET_DEST, 'LEEME_QA.md'), leemeContent, 'utf-8');

console.log('\n✅ EXPORTACIÓN QA COMPLETADA EXITOSAMENTE!');
console.log(`📦 Paquete disponible en: ${TARGET_DEST}\n`);
