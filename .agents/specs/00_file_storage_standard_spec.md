# 📐 Especificación Spec-Driven: Estándar Global de Almacenamiento y Gestión de Archivos (LG-Storage Standard v1.0)

> **Estado:** Aprobado para Ejecución  
> **Versión:** 1.0.0  
> **Módulo:** Core / Infrastructure Storage Engine  
> **Aplica a:** Ecosistema LeanGlobal (Transmac, Terracon, Grúas San Pablo, Besalco, Multi-Tenant Global)

---

## 📌 1. Contexto y Propósito

Este documento establece la arquitectura técnica, normas de modelado en base de datos, taxonomía de sistema de archivos y contratos de API REST estandarizados para la carga, almacenamiento, visualización y descarga de archivos en todo el producto **LeanGlobal**.

El objetivo es eliminar de forma definitiva la fragmentación de carpetas, las rutas hardcodeadas en componentes de interfaz (`/archivo/transmac/...`), la bicefalia de tablas en la base de datos y la pérdida de acceso a archivos entre entornos (*Dev*, *QA*, *Prod*) o al cambiar de directorio de trabajo en PM2.

---

## 🔍 2. Diagnóstico Forense y Auditoría Completa de los 28 Puntos de Contacto Legacy

Un análisis del código reveló **28 puntos de contacto** en el sistema que deberán ser migrados progresivamente al nuevo estándar.

### 2.1 Web Frontend (`ejecucion/frontend`) — 12 Puntos

#### 🟢 Escritura (Formularios de Carga):
1. **`src/components/ModalCrearEditarEquipo.vue` (Línea 529):**
   - *Estado Legacy:* Petición `POST /archivo` con `path_doc: 'GSP/Equipos'`.
   - *Problema:* Enviaba ruta relativa que Node guardaba en el CWD del servidor (`/home/nodeadmin/proyectos/lean-services-gsp/GSP/Equipos/`).
2. **`src/components/ModalCrearEditarPersonal.vue` (Línea 453):**
   - *Estado Legacy:* Petición `POST /archivo` con `path_doc: '/u05/LeanDocs/personal'`.
   - *Problema:* Hardcodeaba la ruta absoluta sin contemplar la separación por tenant (`gsp/personal`).
3. **`src/views/ListadosMinsal.vue` (Línea 714):**
   - *Estado Legacy:* Petición `POST /archivo/imagen` enviando `path_doc: 'transmac/sst'`.
   - *Problema:* Hardcodeaba el nombre del cliente `transmac` en vistas genéricas de salud.
4. **`src/views/ListadosRecss.vue` (Línea 409):**
   - *Estado Legacy:* Petición `POST /archivo/imagen` enviando `path_doc: 'transmac/sst'`.
   - *Problema:* Mismo acoplamiento al tenant `transmac`.

#### 🔵 Lectura y Previsualización:
5. **`src/views/Vista360.vue` (Líneas 305, 397, 593):** Enlaces directos a `https://servidor.leanglobal.cl/lean-services-transmac-dev/api/archivo/transmac/${item.id_doc}`.
6. **`src/views/FichaEquipoPublica.vue` (Línea 219):** Render de documentos QR con `/api/archivo/ver/${doc.id_doc}`.
7. **`src/views/ListadosResso.vue` (Líneas 929, 954):** Manipulación manual de strings `.replace('/archivo/', '/u05/LeanDocs/')` y `.replace('/u05/LeanDocs/', '/archivo/')` en el cliente.
8. **`src/views/Enrolamiento.vue` (Línea 201):** Visualización de cédulas con `${API_URL}/archivo/transmac/${docName}`.
9. **`src/views/CRM/GestorOportunidades.vue` (Líneas 376, 1497, 1526):** Apertura de reportes con `${archivoBaseUrl}/archivo/transmac/${v.id_doc}`.
10. **`src/components/VerDoc.vue` (Línea 250):** Componente modal con `${API_BASE}/archivo/transmac/${row.name_doc_interno}`.
11. **`src/components/TablaInspecciones.vue` (Línea 119):** Descarga en grillas con `${archivoBaseUrl}/archivo/transmac/${item.id_doc}`.
12. **`src/pages/verSurveyPrint.vue` (Líneas 4620, 4633):** Inyección de logos e imágenes con `${API_BASE_URL}/archivo/transmac/${logoName}`.

---

### 2.2 PWA Operador (`ejecucion/pwa`) — 9 Puntos

#### 🟢 Escritura (Carga de Fotos y Evidencias de Terreno):
13. **`src/views/Inspeccion.vue` (Líneas 6714, 6779):** Subida de evidencias fotográficas en comprimido Base64 mediante `POST /archivo/imagen` asignando la URL estática `/archivo/transmac/...`.
14. **`src/views/Inspeccion2.vue` (Línea 255):** Componente `FileUpload` reactivo en checklists secundarios.
15. **`src/components/CheckListGruaHorquillaDmh.vue` (Líneas 469, 531):** Inspección de grúas horquilla que sube con `POST /archivo/imagen` y fuerza la subcarpeta `transmac`.
16. **`src/components/RegistroEventos.vue` (Líneas 415, 419):** Anexos de bitácora de eventos asignando `${API_BASE}/archivo/transmac/${interno}`.

#### 🔵 Lectura y Resolución de Assets:
17. **`src/views/Inspeccion.vue` (Línea 7235):** Función de resolución local que valida `if (src.startsWith('/archivo/')) return src; else return '/archivo/' + subcarpeta + '/' + nombre`.
18. **`src/views/EquipamientoView.vue` (Líneas 526, 664):** Consulta con `GET /archivo/id/${id}` y renderiza con `/archivo/transmac/${filename}`.
19. **`src/views/EquiposMoviles.vue` (Línea 442):** Render de documentos móviles apuntando a `/archivo/transmac/${nameInterno}`.
20. **`src/views/FirmaElectronica.vue` (Líneas 474, 528):** Descarga del PDF de survey desde `/archivo/transmac/${docName}` para estampado de firma.
21. **`src/views/segmentosEjemplos.js` (Línea 385):** Mock asset `/archivo/adc172bd-fb2a-4f6e-9ca3-1749adb8ebe7.png`.

---

### 2.3 Backend Services (`ejecucion/backend_remoto`) — 7 Puntos

22. **`src/config/docsConfig.js`:** Lógica de normalización con condicionales hardcodeados `if (normalized === 'transmac' || normalized === 'terracon') return TRANSMAC_DOCS_DIR;`.
23. **`src/controllers/archivoController.js`:** Controlador principal con endpoints fragmentados (`postArchivo`, `postArchivoImagen`, `getArchivo`, `getArchivoById`, `verArchivoById`).
24. **`src/models/archivoModel.js`:** SSOT de base de datos que ejecuta `INSERT INTO tfmg_file`.
25. **`src/models/proyectoModel.js` (Línea 324):** Generador de PDFs de cotizaciones guardando la URL fija `/lg-gsp/api/archivo/cotizaciones/${fileName}`.
26. **`src/controllers/sstController.js` (Línea 229):** Generador de PDFs de auditorías asignando `/archivo/${folderName}/${archivoId.name_doc_interno}`.
27. **`src/controllers/signatureController.js` (Líneas 200, 481, 768, 995):** Estampa firma digital e invoca URLs fijas `https://servidor.leanglobal.cl/lean-services/api/archivo/${TRANSMAC_DOCS_FOLDER}/${nuevoNombre}`.
28. **`src/controllers/exportarController.js` (Línea 42):** Exportador Puppeteer de encuestas a PDF guardando en disco local.

---

## 📐 3. Especificación de la Arquitectura Objetivo (LG-Storage Standard)

### 3.1 Taxonomía de Sistema de Archivos (Directory Tree)
Todos los archivos subidos al servidor DEBEN ser almacenados siguiendo la norma:

$$\text{Ruta Absoluta} = \text{STORAGE\_ROOT} \;/\; \text{tenant\_code} \;/\; \text{app\_env} \;/\; \text{modulo} \;/\; \text{YYYY} \;/\; \text{MM} \;/\; \text{filename}$$

#### Parámetros Estándar:
- **`STORAGE_ROOT`**: Variable de entorno global en `.env` (Valor por defecto: `/u05/LeanDocs`).
- **`tenant_code`**: Identificador del tenant en minúsculas (Ej: `gsp`, `transmac`, `terracon`, `besalco`, `global`).
- **`app_env`**: Ambiente de ejecución (Ej: `prod`, `dev`, `qa`).
- **`modulo`**: Categoría funcional (`equipos`, `personal`, `surveys`, `reportes`, `firmas`, `acreditaciones`, `general`).
- **`YYYY/MM`**: Subdirectorios automáticos por año y mes de creación.
- **`filename`**: Identificador físico inmutable con formato `{uuidv4}.{ext}`.

---

### 3.2 Esquema Único de Base de Datos (`sch_leanglobal.tfmg_file`)

La base de datos **NUNCA** guardará la ruta absoluta física del servidor (`/u05/LeanDocs/...`). Solo guardará el **`path_relativo`**:

```sql
CREATE TABLE IF NOT EXISTS sch_leanglobal.tfmg_file (
    id_doc              SERIAL PRIMARY KEY,
    tenant_code         VARCHAR(32) NOT NULL DEFAULT 'global',
    app_env             VARCHAR(16) NOT NULL DEFAULT 'dev',
    modulo              VARCHAR(64) NOT NULL DEFAULT 'general',
    path_relativo       VARCHAR(512) NOT NULL, -- Ej: 'gsp/dev/equipos/2026/07'
    name_doc_interno    VARCHAR(255) NOT NULL, -- Ej: '46e97bb5-8b7b-4f0b-8610-415747d7657b.pdf'
    name_doc_orig       VARCHAR(255) NOT NULL, -- Ej: 'Certificado_Grua_LTM1100.pdf'
    mimetype            VARCHAR(128) NOT NULL DEFAULT 'application/pdf',
    size_bytes          BIGINT DEFAULT 0,
    checksum_sha256     VARCHAR(64) NULL,
    id_user             INTEGER NULL,
    estado              VARCHAR(16) NOT NULL DEFAULT 'A',
    fecha_creacion      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tfmg_file_tenant_modulo ON sch_leanglobal.tfmg_file(tenant_code, modulo);
```

---

### 3.3 Contratos API REST (API v1 Storage Engine)

#### 1. Carga de Archivos (`POST /api/v1/storage/upload`)
- **Headers:** `Content-Type: multipart/form-data`, `Authorization: Bearer <jwt>`
- **Body:** `archivo` (File), `modulo` (String, opcional), `tenant_code` (String, opcional).
- **Respuesta 201 Created:**
  ```json
  {
    "status": true,
    "message": "Archivo almacenado exitosamente",
    "data": {
      "id_doc": 1066,
      "name_doc_orig": "Certificado_Grua.pdf",
      "name_doc_interno": "46e97bb5-8b7b-4f0b-8610-415747d7657b.pdf",
      "mimetype": "application/pdf",
      "path_relativo": "gsp/dev/equipos/2026/07",
      "url_view": "/api/v1/storage/view/1066",
      "url_download": "/api/v1/storage/download/1066"
    }
  }
  ```

#### 2. Visualización Inline (`GET /api/v1/storage/view/:id_doc`)
- Resuelve `fullPath = path.join(STORAGE_ROOT, record.path_relativo, record.name_doc_interno)`.
- Si el archivo no existe en la ruta calculada, aplica **fallback automático** hacia rutas legacy o `process.cwd()`.
- Emite `res.setHeader('Content-Type', record.mimetype)` y `res.sendFile(fullPath)`.

#### 3. Descarga Forzada (`GET /api/v1/storage/download/:id_doc`)
- Responde con `Content-Type: application/octet-stream` y `Content-Disposition: attachment; filename="name_doc_orig"`.

---

## 🚀 4. Guía de Ejecución de Refactorización (Roadmap para Antigravity 2.0)

Al ejecutar esta tarea con **Antigravity 2.0**, se deberán realizar las siguientes 4 fases en orden:

### **Paso 1: Implementar el Storage Engine en Backend**
- Crear `src/config/storageConfig.js` con las funciones `buildStoragePath()` y `resolveStoragePath()`.
- Crear el controlador unificado `src/controllers/storageController.js` con los endpoints `/api/v1/storage/upload`, `/api/v1/storage/view/:id` y `/api/v1/storage/download/:id`.
- Registrar las rutas en `src/routes/storageRoutes.js`.

### **Paso 2: Creación del Helper en Web & PWA**
- Crear el composable/helper `src/utils/storage.js`:
  ```javascript
  export function getStorageUrl(idDoc) {
    if (!idDoc) return '#';
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    return `${baseUrl}/v1/storage/view/${idDoc}`;
  }
  ```
- Reemplazar las concatenaciones estáticas `/archivo/transmac/...` en los 21 componentes frontend identficados.

### **Paso 3: Saneamiento y Migración Masiva de Archivos Legacy**
- Ejecutar un script Node.js en servidor que lea los registros en `tfmg_file` con rutas relativas o antiguas (`GSP/Equipos`, `transmac/sst`, etc.), los traslade a `/u05/LeanDocs/{tenant}/{env}/{modulo}/{yyyy}/{mm}/` y actualice `path_relativo` en la base de datos.

### **Paso 4: Verificación y Pruebas de Regresión**
- Probar subida y previsualización en Equipos GSP.
- Probar subida y previsualización en Personal GSP.
- Verificar apertura de encuestas en PWA.
- Verificar que las cotizaciones y firmas digitales de Transmac y GSP funcionen sin lanzar error 404.
