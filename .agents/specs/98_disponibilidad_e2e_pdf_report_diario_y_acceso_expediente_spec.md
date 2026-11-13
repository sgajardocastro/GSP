# SPEC-098: Disponibilidad E2E de Archivos PDF para Reportes Diarios de Izaje, Filtro de Privacidad Granular y Regeneración FES Web

- **Versión:** `v1.1.0`
- **Fecha Inicial (v1.0.0):** 24 de octubre de 2026
- **Fecha Actualización (v1.1.0):** 10 de noviembre de 2026
- **Estado:** `CANÓNICO VIGENTE — AMPLIADO CON FILTRO DE PRIVACIDAD DE FLOTA Y ANEXOS (REQ-1147)`
- **Módulos Afectados:**
  - Backend API (`reportDiarioController.js`, `reportDiarioRoutes.js`)
  - Motor de PDF (`reportDiarioPdfService.js`)
  - Gestor Documental E2E (`Documentos.vue`)
  - Visor & Validador PMO (`ModalVisorReport.vue`)
  - CRM Operaciones / Torre de Control (`GestorOportunidades.vue`)
  - Base de Datos PostgreSQL (`sch_leangsp` y `sch_leangsp_prod`: `tedp_reporte_avance.ajustes_analista`, `tfmg_file`)
- **Requerimientos Asociados:**
  - `REQ-1067` (v1.0.0: Emisión automática App, regeneración FES Web y streaming directo)
  - `REQ-1147` (v1.1.0: Ítem 118 backlog — Filtro de privacidad y selección granular de fotografías y documentos anexos para PDF de cliente)
- **Responsables Operativos:** Sergio Gajardo (LeanGlobal), Jorge Ponce (Jefe Operaciones GSP), Alfonso Porperrello (PM GSP), Yiara Mendoza (Control de Gestión GSP)

---

## 1. Problema y Objetivo Operacional

### 1.1. Diagnóstico del Problema
1. **Atrapamiento en el Formulario Web:** Tanto en el Gestor Documental (`Documentos.vue`) como en el CRM (`GestorOportunidades.vue`), hacer clic en un reporte de faena abre exclusivamente el modal web interactivo (`ModalVisorReport`). El usuario final queda impedido de visualizar, imprimir o descargar el PDF oficial de manera directa.
2. **Inexistencia de PDF en Terreno (Nivel 1 omitido):** Al guardar y cerrar el reporte desde la PWA en terreno (`POST /operaciones/report/guardar`), el backend almacena los datos en `tedp_reporte_avance` pero **no compila el PDF**. El sistema solo intenta compilar un PDF cuando un analista valida con PIN FES en la web. Si el reporte no pasa por el analista, o si la compilación falla silenciosamente, el reporte carece por completo de archivo PDF (`id_doc_pdf IS NULL`).
3. **Falta de Trazabilidad y Disponibilidad Inmediata:** La operación en faena requiere entregar o enviar el comprobante en PDF al cliente de inmediato tras la firma del receptor en obra, sin esperar que la oficina central audite el reporte horas o días después.

### 1.2. Objetivo
Asegurar que **el 100% de los reportes diarios de izaje cuenten con un archivo PDF oficial accesible y descargable desde el primer minuto** (emisión en terreno), y que al ser auditado en la web se regenere con el sello criptográfico FES, manteniendo accesos diferenciados entre ver el PDF oficial y editar los datos en el formulario web.

---

## 2. Arquitectura y Reglas del Ciclo de Vida del PDF (Dos Niveles)

```
[ TERRENO - PWA ]
  Operador llena jornada + fotos tablero + firma táctil mandante GPS
       │
       ▼
  POST /operaciones/report/guardar
       │
       ├─► Guarda datos en tedp_reporte_avance
       └─► [NIVEL 1] Compila inmediatamente PDF Operativo de Faena
                 │
                 ├─► Guarda en tfmg_file (Almacenamiento GSP/reports/)
                 └─► Actualiza tedp_reporte_avance.id_doc_pdf = idDocPdf
                          │
                          ▼
            DISPONIBLE DE INMEDIATO EN EL GESTOR DOCUMENTAL (PDF OFICIAL)

[ OFICINA / PMO - WEB ]
  Analista audita horarios, colación, horómetros y standby
       │
       ▼
  [NUEVO v1.1.0 - REQ-1147] Configura Filtro de Privacidad Granular:
       ├─► Decide si incluye fotos de tablero/horómetro (Inicio / Término) [Default: NO]
       └─► Selecciona casillas de documentos y fotos del día anexas al PDF
       │
       ▼
  POST /operaciones/report/:id/validar (con PIN FES de 4 dígitos + payload privacidad_pdf)
       │
       ├─► Actualiza tedp_reporte_avance con ajustes, privacidad_pdf y estado VALIDADO_ANALISTA
       └─► [NIVEL 2] Regenera PDF Oficial con Doble Certificación y Filtro de Privacidad Aplicado
                 │     (Firma Mandante GPS + Sello Criptográfico SHA-256 FES Analista + Anexos Autorizados)
                 │
                 ├─► Sobrescribe o genera nuevo tfmg_file
                 ├─► Actualiza tedp_reporte_avance.id_doc_pdf
                 └─► Despacha correo electrónico formal con enlace de descarga
```

---

## 3. Especificación de Capa Backend (`reportDiarioController.js` & Rutas)

### 3.1. Emisión Inmediata de PDF en `guardarReportDiario` (Nivel 1)
* Al recibir el cierre del reporte (Momento 2: cuando `cliente_firma_canvas_base64` o `horas_operadas` están presentes):
  1. Invocar a `generarPdfReportDiario({ report, proyecto, validador: null, codigoFes: null })`.
  2. Si el reporte aún no tiene firma FES de analista, el bloque de firma FES se renderiza como `"PENDIENTE DE AUDITORÍA PMO"`, manteniendo intacta y visible la firma manuscrita del mandante con coordenadas GPS y fecha/hora de terreno.
  3. Guardar el PDF en `tfmg_file` mediante `archivoModel.insertarTfmgFile(...)`.
  4. Actualizar inmediatamente `UPDATE tedp_reporte_avance SET id_doc_pdf = $1 WHERE id_reporte_avance = $2`.
  5. Anexar el ítem al `json_field.ejecucion_v1.dossier_documentos` de `tpry_proyecto`.

### 3.2. Regeneración con Certificación FES en `validarReportDiario` (Nivel 2)
* Mantener la validación del PIN FES.
* Regenerar el PDF con los valores ajustados (`ajustes_analista`), el código de validación FES (`codigoFes`) y los datos del analista (`validadorUser`).
* Actualizar el registro en `tfmg_file` y en `tedp_reporte_avance.id_doc_pdf`.

### 3.2.1. [NUEVO v1.1.0 - REQ-1147] Filtro de Privacidad Granular de Fotografías y Documentos Anexos
En faena, los operadores fotografían horómetros, odómetros y tacógrafos para el control de flota interno de GSP. El mandante no debe recibir telemetría sensible ni kilometrajes en el PDF de certificación comercial.

#### 📌 Invariantes Canónicas de Privacidad:
- **`INV-PRIV-01` (Exclusión por Defecto de Telemetría Interna):** Toda fotografía de tablero, odómetro o tacógrafo capturada en terreno (`foto_tablero_inicio`, `foto_horometro_inicio`, `foto_tablero_termino`, `foto_horometro`) queda **excluida por omisión** del PDF oficial del cliente (`incluir_foto_inicio = false`, `incluir_foto_termino = false`). El PDF estándar de cliente se genera en 1 sola página. Solo se anexa una fotografía si el analista activa explícitamente el flag en `true`.
- **`INV-PRIV-02` (Persistencia Estructurada en BD):** La decisión de privacidad se almacena dentro de la columna JSONB `tedp_reporte_avance.ajustes_analista`:
  ```json
  {
    "modificado": true,
    "privacidad_pdf": {
      "incluir_foto_inicio": false,
      "incluir_foto_termino": false,
      "docs_incluidos_pdf": [1402, 1405]
    }
  }
  ```
- **`INV-PRIV-03` (Fusión Selectiva de Documentos Anexos):** Los documentos y fotografías del día (`dossier_documentos` / `id_doc_evidencia`) solo se fusionan o anexan al PDF final si su identificador `id_doc` se encuentra contenido en el arreglo `docs_incluidos_pdf`. Si el analista desmarca un documento, este permanece accesible en la plataforma web interna pero no viaja al cliente.
- **`INV-PRIV-04` (Inmutabilidad Post-Firma FES):** Al validar el reporte, el PDF generado en storage (`tfmg_file`) aplica determinantemente estas reglas y el código FES sella el documento resultante.

#### 🔌 Contrato de API (`POST /operaciones/report/:id/validar`):
El payload del frontend envía el nodo `privacidad_pdf`:
```json
{
  "id_validador": 3,
  "pin": "1234",
  "obs_validador": "Validado conforme",
  "ajustes": { ... },
  "privacidad_pdf": {
    "incluir_foto_inicio": false,
    "incluir_foto_termino": false,
    "docs_incluidos_pdf": [1402]
  },
  "liquidacion_personal_dia": { ... }
}
```
En `reportDiarioController.js`, `payloadAjustes.privacidad_pdf` se consolida e inyecta al invocar `generarPdfReportDiario({ report: { ... rep, ... reportActualizado, ajustes_analista: payloadAjustes }, privacidad_pdf: payloadAjustes.privacidad_pdf })`.

#### ⚙️ Lógica del Motor de PDF (`reportDiarioPdfService.js`):
En `resolverAnexosDelReporte(data)`:
```javascript
const privacidad = data.privacidad_pdf || ajustes.privacidad_pdf || {};
if (privacidad.incluir_foto_inicio === true && fotoIni) {
  anexosImagenes.push({ titulo: 'FOTOGRAFÍA TABLERO / HORÓMETRO INICIO EN TERRENO', dataUri: fotoIni });
}
if (privacidad.incluir_foto_termino === true && fotoFin) {
  anexosImagenes.push({ titulo: 'FOTOGRAFÍA TABLERO / HORÓMETRO TÉRMINO EN TERRENO', dataUri: fotoFin });
}
const docsAutorizados = Array.isArray(privacidad.docs_incluidos_pdf) ? privacidad.docs_incluidos_pdf.map(Number) : null;
const incluirDocEvidencia = idDocEvidencia && (!docsAutorizados || docsAutorizados.includes(Number(idDocEvidencia)));
// Solo si incluirDocEvidencia es true se añade el documento a anexosPdfs o anexosImagenes
```

### 3.3. Endpoint de Streaming Dinámico (`GET /operaciones/report/:id/pdf`)
* Si un usuario intenta acceder al PDF de un reporte antiguo que no tenga `id_doc_pdf`:
  - El endpoint consulta los datos en `tedp_reporte_avance` y `tpry_proyecto`.
  - Compila el PDF al vuelo con `generarPdfReportDiario`.
  - Guarda el archivo en `tfmg_file`, vincula `id_doc_pdf` de manera retroactiva (auto-reparación transparente) y devuelve el stream `application/pdf` con código HTTP 200.

---

## 4. Especificación de Capa Frontend

### 4.1. Gestor Documental (`Documentos.vue`)
1. **Acción Principal ("Abrir ↗" y Clic en Nombre):**
   - Abre de forma inequívoca el archivo PDF en una nueva pestaña del navegador:
     * Si el reporte tiene `id_doc_pdf`: `${base}/v1/storage/view/${id_doc_pdf}`
     * Si no tiene `id_doc_pdf`: `${base}/operaciones/report/${id_reporte_avance}/pdf`
2. **Acción Secundaria ("✏️ Formulario Web"):**
   - Botón visible únicamente para reportes de izaje (`v-if="file.rawReport"`), ubicado junto a "Abrir".
   - Al presionarlo, levanta el modal interactivo `ModalVisorReport` para auditoría, ajustes horarios o regularización manual.

### 4.2. CRM Operaciones — Pestaña 6 (`GestorOportunidades.vue`)
1. **Columna "Acciones" en la Tabla de Cronograma de Reports:**
   - Botón Principal: `📄 PDF` (abre directamente el PDF en nueva pestaña).
   - Botón Secundario: `👁️ Auditar` (abre el `ModalVisorReport`).
   - Botón Terciario: `📎 Adjuntar Doc` (para adjuntar hoja física escaneada si aplica).

### 4.3. [NUEVO v1.1.0 - REQ-1147] Controles de Privacidad en Visor de Auditoría (`ModalVisorReport.vue`)
1. **Bloque 2: Evidencias Panel / Horómetro:**
   - En cada tarjeta fotográfica (Foto Inicio y Foto Término):
     * **Modo Edición / Validación:** Se incorpora un switch o checkbox táctil ergonómico: `[ ] Incluir en PDF Mandante` (por defecto desmarcado en gris neutro).
     * **Modo Solo Lectura (Reporte ya validado):** Badge visual no interactivo (`🔒 Excluido de PDF Mandante (Solo Interno)` o `📄 Incluido en PDF Mandante`).
2. **Bloque 2.B: Documentos y Fotografías del Día:**
   - En cada fila de archivo adjunto:
     * Checkbox interactivo: `[x] PDF Mandante`.
     * Permite a Control de Gestión (Yara) decidir individualmente qué respaldos viajan en el PDF oficial del cliente.
3. **Persistencia y Envío:**
   - El payload al validar (`POST /operaciones/report/:id/validar`) incluye el objeto `privacidad_pdf` construido reactivamente desde el estado del formulario.

---

## 5. Auditoría y Regularización en Producción (`sch_leangsp_prod`)

1. **Diagnóstico de Base de Datos:**
   - Consultar `SELECT count(*) FROM sch_leangsp_prod.tedp_reporte_avance WHERE id_doc_pdf IS NULL;`.
2. **Rutina de Regularización (Script Node.js):**
   - Recorrer todos los reportes huérfanos de PDF.
   - Compilar con `generarPdfReportDiario`.
   - Insertar en `tfmg_file` y actualizar `id_doc_pdf`.
   - Verificar integridad de visualización con HTTP 200.

---

## 6. Criterios de Aceptación (Verificación Determinista)

- [x] **CA-01:** Al presionar "Abrir ↗" sobre un reporte en `Documentos.vue`, el navegador abre una nueva pestaña con el archivo PDF oficial.
- [x] **CA-02:** Al presionar "✏️ Formulario Web" en `Documentos.vue`, se abre el modal interactivo `ModalVisorReport`.
- [x] **CA-03:** Al emitir un reporte desde la PWA móvil, el backend retorna `id_doc_pdf` no nulo y el archivo existe físicamente en storage.
- [x] **CA-04:** Al validar el reporte en la web con PIN FES, el PDF se regenera con el sello FES y el hash SHA-256.
- [x] **CA-05:** La ruta `/api/operaciones/report/:id/pdf` auto-repara y entrega el PDF para cualquier reporte histórico.
- [x] **CA-06:** En `sch_leangsp_prod`, el 100% de los reportes tienen `id_doc_pdf` asociado y accesible.
- [ ] **CA-07 (v1.1.0):** Al validar un reporte sin marcar fotos de tablero/horómetro, el PDF oficial generado no contiene anexos fotográficos internos y consta de 1 sola página.
- [ ] **CA-08 (v1.1.0):** Al marcar selectivamente la Foto de Inicio o Foto de Término, el PDF oficial incorpora únicamente la(s) foto(s) autorizada(s) en sus correspondientes anexos numerados.
- [ ] **CA-09 (v1.1.0):** Al marcar o desmarcar documentos adicionales del día, el PDF final solo fusiona/adjunta los archivos cuyos `id_doc` estén en `docs_incluidos_pdf`.
- [ ] **CA-10 (v1.1.0):** Al reabrir el reporte validado en `ModalVisorReport.vue`, el estado de los controles de privacidad se restaura fielmente desde `ajustes_analista.privacidad_pdf`.
