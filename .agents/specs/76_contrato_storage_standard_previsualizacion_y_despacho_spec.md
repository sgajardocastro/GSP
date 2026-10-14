# SPEC-76: Estándar de Almacenamiento Canónico LG-Storage, Previsualización Resiliente y Despacho de Contratos

## 1. Contexto y Objetivos
- **Problema 1:** Error HTTP 404 al intentar visualizar el PDF oficial del contrato generado (`https://servidor.leanglobal.cl/lg-gsp-dev/api/archivo/ver/1467` arrojaba: *"El archivo físico (CTR-2026-0109.pdf) no se encuentra en la ruta esperada del servidor"*).
- **Problema 2:** En el CRM (`GestorOportunidades.vue`), el botón `[ Previsualizar (4 Págs) ]` parecía no hacer nada debido al bloqueo de popups por parte del navegador (al ejecutarse tras una llamada asíncrona de compilación) y a la falta de spinner reactivo.
- **Problema 3:** Al despachar por WhatsApp automático (Baileys), el cliente receptor recibía la notificación nativa de WhatsApp *"Esperando este mensaje. Esto puede demorar unos minutos..."* por falta de sincronización previa de preclaves criptográficas Signal.
- **Objetivo:** Alinear al 100% la generación, almacenamiento y consulta de contratos con el estándar corporativo `leanglobal_file_storage_standard`, asegurar compatibilidad y previsualización inmediata en navegador, y robustecer el despacho por WhatsApp.

---

## 2. Especificación Técnica de Almacenamiento (LG-Storage Standard)

### 2.1 Jerarquía en Sistema de Archivos
Todos los contratos de arrendamiento y sus versiones se deben compilar y almacenar en:
`/u05/LeanDocs/{tenant_code}/{app_env}/contratos/{YYYY}/{MM}/{folio}.pdf`

- **Tenant Code:** `GSP`
- **Ambiente:** `dev` o `prod` (resuelto por `process.env.APP_ENV || 'dev'`)
- **Módulo:** `contratos`
- **Año / Mes:** Dinámico POSIX según fecha de emisión (ej: `2026/10`)
- **Nombre de Archivo:** `{folio}.pdf` (ej: `CTR-2026-0109.pdf`)

### 2.2 Registro en Base de Datos (`sch_leangsp.tfmg_file`)
- `tipo_doc`: `'CONTRATO'`
- `mimetype`: `'application/pdf'`
- `name_doc_orig`: `{folio}.pdf`
- `name_doc_interno`: `{folio}.pdf`
- `path_doc` / `path_relativo`: `GSP/{env}/contratos/{YYYY}/{MM}` (Ruta relativa POSIX calculada mediante `buildStoragePath('GSP', 'contratos')`).
  > **REGLA INVIOLABLE:** NUNCA almacenar rutas absolutas `/u05/LeanDocs/...` ni nombres de archivo duplicados en `path_doc`.

### 2.3 Resolución y Fallback Determinista en Backend
Tanto `storageConfig.js` (`resolveStoragePath`) como `archivoController.js` (`verArchivoById`) deben contar con:
1. Resolución directa estándar: `path.join(STORAGE_ROOT, normRel, filename)`
2. Fallback de subcarpeta directa: `path.join(STORAGE_ROOT, normRel)`
3. Fallbacks de compatibilidad hacia directorios históricos locales:
   - `path.join(process.cwd(), 'public', 'contratos', filename)`
   - `/home/nodeadmin/proyectos/lean-services-gsp/public/contratos/{filename}`
   - `/home/nodeadmin/proyectos/lean-services-gsp-prod/public/contratos/{filename}`

---

## 3. Especificación Frontend: Previsualización y UX en CRM

### 3.1 Previsualización Resiliente Anti-Bloqueo de Popups
- En `GestorOportunidades.vue`, antes de invocar la promesa asíncrona de compilación (`apiAxios.post('/proyectos/:id/contrato/generar-pdf')`), se debe abrir una pestaña vacía con referencia segura:
  ```javascript
  const previewTab = window.open('about:blank', '_blank')
  ```
- Al resolver la respuesta con `data.contrato.url_pdf`:
  - Si la pestaña fue permitida: `previewTab.location.href = pdfFullUrl`
  - Si la llamada falla: `if (previewTab) previewTab.close()` y mostrar alerta con el error exacto.
- **Feedback Reactivo en Botón:**
  El botón debe deshabilitarse y mostrar spinner + texto dinámico:
  `<span v-if="generandoPdfContrato" class="animate-spin">⏳</span><span v-else>👁️</span> {{ generandoPdfContrato ? 'Generando PDF...' : 'Previsualizar (4 Págs)' }}`

### 3.2 Despacho Omnicanal y Botón WhatsApp Web Directo
- Además del despacho automático backend a través del microservicio Baileys, la interfaz debe ofrecer siempre visible el botón **"💬 WhatsApp Web"** para que el ejecutivo comercial pueda enviar el mensaje directamente desde su cliente personal/corporativo con un clic, eliminando cualquier demora o mensaje de cifrado.

---

## 4. Matriz de Pruebas y Criterios de Aceptación
1. `GET /api/archivo/ver/1467`: Retorna HTTP 200 OK con encabezado `Content-Type: application/pdf` y el archivo físico CTR-2026-0109.pdf.
2. Al hacer clic en `[ Previsualizar (4 Págs) ]` en la oportunidad 109, el botón muestra el spinner de carga y abre de inmediato la nueva pestaña con el documento PDF de 4 páginas compilado.
3. Generación de un nuevo contrato escribe físicamente en `/u05/LeanDocs/GSP/{dev|prod}/contratos/{YYYY}/{MM}/` y registra en `tfmg_file` con la ruta relativa estándar.
