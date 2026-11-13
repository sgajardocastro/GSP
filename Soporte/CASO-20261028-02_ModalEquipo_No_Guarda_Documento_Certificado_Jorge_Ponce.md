# CASO-20261028-02: No Guarda Documento / Certificado de Equipo (`CHGC.99-4`) en Modal de Edición de Flota

---

## 1. Ficha del Incidente

| Campo | Detalle |
| :--- | :--- |
| **ID del Caso** | `CASO-20261028-02` |
| **Fecha / Hora** | 2026-10-28 22:40 hrs (CLT) |
| **Operador / Usuario Afectado** | **Jorge Ponce** (`jponce@arriendosanpablo.cl`, Gerencia / Administración) |
| **Negocio / OT** | Gestión Documental de Flota / Consola Vista 360 |
| **Equipo Involucrado** | **LIEBHERR LTM-1400** (`CHGC.99-4`, Código Interno `GPT-120`, 400 Ton) |
| **Ambiente** | Producción (`PROD`) y Desarrollo (`DEV`) |
| **Severidad** | Alta (Imposibilidad de actualizar Permiso de Circulación y reflejar vigencia en semáforos de flota) |
| **Estado** | `RESUELTO Y DESPLEGADO EN PROD Y DEV` |

---

## 2. Síntoma Reportado por Terreno

* **Mensaje textual reportado por Jorge Ponce:**
  > *"hola Sergio, favor revisar la carga de documentos, trate de cambiar el permiso de circulacion pero no deja guardarlo"*
* **Evidencia visual suministrada:**
  * En el modal **`EDITAR EQUIPO FLOTA — CLASIFICACIÓN TÉCNICA, CAPACIDAD Y EXPEDIENTE DE DOCUMENTOS`** (`ModalCrearEditarEquipo.vue`) del equipo `CHGC.99-4` (`GPT-120`), sección **`2. EXPEDIENTE DIGITAL DE CERTIFICADOS`**:
    * El usuario seleccionó el archivo `+ PERMISO CIRCULACION CHGC99.4.PDF`.
    * Los campos **`TIPO DOCUMENTO`** (`Seleccione...`) y **`FECHA VENCIMIENTO`** (`dd-mm-aaaa`) quedaron sin completar.
    * El botón **`ADJUNTAR`** permaneció bloqueado (`disabled:opacity-50`) sin indicación visual del motivo.
    * Al presionar directamente el botón principal **`GUARDAR EQUIPO`** en la esquina inferior derecha, el sistema cerraba el modal descartando silenciosamente el archivo cargado en memoria (`newDoc.id_doc`).

---

## 3. Diagnóstico Técnico & Evidencia Empírica

* **Inspección de [`ModalCrearEditarEquipo.vue`](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/ejecucion/frontend/src/components/ModalCrearEditarEquipo.vue):**
  1. **Flujo en dos pasos no evidente y descarte silencioso:**
     * Al seleccionar un archivo en `onFileSelected()`, este se sube inmediatamente a `/v1/storage/upload` y su `id_doc` se guarda en el objeto reactivo temporal `newDoc.value`.
     * Sin embargo, `saveEquipment()` únicamente iteraba sobre `documentsList.value` (`for (const cert of documentsList.value)`). Si el usuario no presionaba previamente el botón secundario `Adjuntar` (o si este seguía deshabilitado por faltar `id_tipo_certificado` o `fecha_vencimiento`), `saveEquipment()` ejecutaba el `PUT /tequ-equipos/:id` y cerraba el modal (`emit('saved')`), perdiendo por completo el archivo recién subido sin mostrar alerta alguna.
  2. **Reemplazo de certificados existentes del mismo tipo:**
     * Cuando se intentaba **cambiar** un documento ya existente (ej. *Permiso de Circulación*), no existía un botón directo de reemplazo ni se eliminaba automáticamente el certificado anterior del mismo `id_tipo_certificado`, lo que podía dejar el certificado vencido coexistiendo con el nuevo y manteniendo el semáforo de flota en estado de error (`ce.fecha_vencimiento < CURRENT_DATE`).

---

## 4. Causa Raíz de Arquitectura (Software / State Machine / Datos)

1. **Desacople entre el estado del formulario de carga (`newDoc` / `selectedFile`) y la acción global de guardado (`saveEquipment`)** en [`ModalCrearEditarEquipo.vue`](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/ejecucion/frontend/src/components/ModalCrearEditarEquipo.vue).
2. **Ausencia de autodetección del tipo de certificado por nombre de archivo** y falta de validación preventiva antes de cerrar el modal cuando hay un archivo cargado pendiente de adjuntar.
3. **Ausencia de lógica de reemplazo (`replacedCertIds`)** al cargar un nuevo certificado de un `id_tipo_certificado` ya existente en el expediente del equipo.

---

## 5. Plan de Mitigación y Resolución

Se intervino el componente [`ejecucion/frontend/src/components/ModalCrearEditarEquipo.vue`](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/ejecucion/frontend/src/components/ModalCrearEditarEquipo.vue) implementando:

1. **Autodetección inteligente de `Tipo Documento` (`inferDocTypeFromFilename`):**
   * Al seleccionar un archivo (ej. `PERMISO CIRCULACION CHGC99.4.PDF`), el sistema analiza el nombre y preselecciona automáticamente el tipo correspondiente (*Permiso de Circulación*, *Revisión Técnica*, *SOAP*, *Padrón*, *Gases*, *Prueba de Carga*, *Ensayo de Gancho*, *Inspección*).
2. **Botón directo `CAMBIAR` en cada certificado del listado (`prepareReplaceCertificate`):**
   * Permite actualizar un documento existente en un clic, precargando su tipo, entidad emisora y fechas, y abriendo el selector de archivos.
3. **Reemplazo automático del certificado anterior del mismo tipo (`replacedCertIds`):**
   * Al adjuntar un certificado cuyo `id_tipo_certificado` ya existía en el equipo, reemplaza la entrada en la lista y elimina el registro antiguo en base de datos al guardar, asegurando que el semáforo legal/general de la Consola de Flota se actualice de inmediato.
4. **Auto-adjuntado y bloqueo preventivo en `saveEquipment()`:**
   * Si el usuario presiona **`Guardar Equipo`** con un archivo cargado sin haber presionado `Adjuntar`:
     * Si ya tiene `Tipo Documento` y `Fecha Vencimiento`, lo **adjunta y guarda automáticamente**.
     * Si falta `Tipo Documento` o `Fecha Vencimiento`, **impide el cierre del modal**, resalta en ámbar los campos requeridos y despliega una alerta indicando exactamente qué dato falta completar.

---

## 6. Protocolo de Respuesta y Guía al Usuario / Operador

> **Mensaje para Jorge Ponce:**
> *"Jorge, ya quedó corregido y desplegado el módulo de carga de documentos de equipos:*
> *1. Ahora al seleccionar el PDF (por ejemplo `PERMISO CIRCULACION CHGC99.4.PDF`), el sistema detecta automáticamente el Tipo de Documento (Permiso de Circulación).*
> *2. Solo debes ingresar la **Fecha de Vencimiento** del nuevo permiso y presionar **Guardar Equipo** (incluso sin necesidad de presionar antes el botón Adjuntar), o bien usar el nuevo botón **Cambiar** que aparece junto a cada certificado. Con eso reemplazará automáticamente el documento anterior."*

---

## 7. Lecciones Aprendidas y Acciones Preventivas

* **Prevención de pérdida silenciosa en formularios compuestos:** Todo modal que combine una sub-sección de carga de archivos con un botón global de guardado debe auto-consolidar el ítem en edición si está completo o advertir al usuario si faltan metadatos obligatorios antes de ejecutar el cierre del modal.
