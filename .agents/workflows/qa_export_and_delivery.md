# 🛡️ Workflow: Empaquetado, Versionamiento y Entrega de Fuentes para QA (`qa_export_and_delivery`)

**Alcance:** Grúas San Pablo (GSP) / LeanGlobal Platform  
**Responsables:** Antigravity Architect & QA Engineer (Juanma)  
**Frecuencia:** Obligatoria tras cada despliegue exitoso al servidor remoto.

---

## 1. 📌 Principio Rector
> **"Para que un QA sea riguroso y determinístico, el auditor debe contar con el código fuente 100% limpio y la especificación canónica (.agents/specs/) contra la cual contrastar el comportamiento del sistema."**

Queda estrictamente prohibido entregar código con dependencias pesadas (`node_modules/`), compilados temporales (`dist/`) o sin las especificaciones técnicas asociadas.

---

## 2. 🔄 Ciclo de Entrega en 4 Fases

```
[ 🚀 Despliegue Exitoso en Servidor ]
               │
               ▼
┌────────────────────────────────────────────────────────┐
│ FASE 1: SNAPSHOT & BACKUP HISTÓRICO                    │
│ Mover el paquete anterior a:                           │
│ 📂 _historico/YYYYMMDD_HHmm_v[Hash]/                   │
└──────────────────────┬─────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────┐
│ FASE 2: EMPAQUETADO DE FUENTES LIMPIOS (Zero Garbage)  │
│ • 📁 frontend/       (Web CRM Vite/Vue 3)              │
│ • 📁 pwa/            (PWA Móvil Vue CLI)               │
│ • 📁 backend/        (API Node.js/Express & SQL)       │
│ 🚫 Exclusiones: node_modules, dist, .git, .env         │
└──────────────────────┬─────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────┐
│ FASE 3: INYECCIÓN DE ESPECIFICACIONES & BACKLOG        │
│ • 📁 specs/          (Compendio .agents/specs/)        │
│ • 📄 tareas.md       (Backlog oficial con estados)     │
└──────────────────────┬─────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────┐
│ FASE 4: HOJA DE RUTA Y GUÍA DE AUDITORÍA QA            │
│ • 📄 LEEME_QA.md     (URLs, Commit y Casos Críticos)   │
└────────────────────────────────────────────────────────┘
```

---

## 3. 📁 Estructura del Paquete Entregado a QA

```
📦 [Directorio QA Google Drive]
├── 📄 LEEME_QA.md                     # Bitácora de la versión, URLs activas y focos de prueba
├── 📄 tareas.md                       # Backlog oficial del proyecto y criterios de aceptación
├── 📁 specs/                          # 39+ Especificaciones formales Spec-Driven
│   ├── 01_proceso_general_operacion_y_comercial_gsp_spec.md
│   ├── 31_qa_matriz_casos_de_prueba_estados_y_kanban_spec.md
│   ├── 32_registro_viaje_telemetria_y_combustible_offline_spec.md
│   ├── 34_report_diario_izaje_firma_manual_spec.md
│   ├── 39_tratamiento_integral_flota_viaje_control_y_report_spec.md
│   └── ...
├── 📁 frontend/                       # Código fuente Web CRM Torre de Control
│   ├── package.json
│   ├── vite.config.js
│   └── src/
├── 📁 pwa/                            # Código fuente PWA Móvil de Terreno
│   ├── package.json
│   ├── vue.config.js
│   └── src/
├── 📁 backend/                        # Código fuente API Backend
│   ├── package.json
│   └── src/
└── 📁 _historico/                     # Respaldos de entregas anteriores
    └── YYYYMMDD_HHmm/
```

---

## 4. ⚙️ Comando de Ejecución
Para disparar el empaquetado de forma automática:
```bash
node scripts/export_qa_release.cjs
```
