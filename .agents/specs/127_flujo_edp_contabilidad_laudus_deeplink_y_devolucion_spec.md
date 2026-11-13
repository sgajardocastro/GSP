# SPEC-127: Flujo de Estado de Pago (EDP) en 2 Hitos (Control de Gestión -> Contabilidad Laudus), Deep Linking Contextual y Devolución con Observaciones

- **Código Spec:** `SPEC-127`
- **Requerimiento Backlog:** `REQ-1165`
- **Versión Objetivo:** `v1.0.222`
- **Fecha:** 2026-11-12
- **Estado:** Aprobado para Producción (`PROD` & `DEV`)
- **Estándares Aplicados:** `leanglobal_notification_standard`, `gsp_pdf_and_email_standards`, `leanglobal_release_and_backlog_standard`

---

## 1. Contexto y Definición de Negocio

Por instrucción directa de Dirección / Operaciones de Grúas San Pablo (GSP), el circuito de aprobación y cierre del **Estado de Pago (EDP)** opera en **2 Hitos internos** (excluyendo temporalmente al rol Comercial de la cadena de firmas FES):

1. **Hito 1 — Control de Gestión (Yiara Mendoza, `id_user = 65`):**
   - Verifica el 100% de los Reports Diarios del servicio y firma el EDP con su PIN FES de 4 dígitos (`paso = 1`, `accion = 'FIRMAR'`).
   - Al firmar, el EDP pasa inmediatamente a la etapa **`EN_CONTABILIDAD` (`paso_actual = 2`)**.
   - Se despacha notificación formal por correo electrónico resolviendo dinámicamente los correos desde `tsec_users`:
     - **Para (`To`):**
       1. **Contabilidad:** Maritza Seguel (`id_user = 61`, `mseguel@arriendosanpablo.cl`)
       2. **Responsable Comercial del Negocio:** Resuelto dinámicamente desde la OT (`crm_v1.vendedor_email` / `tpry_proyecto.id_usuario_creacion` -> `tsec_users`)
       3. **Gerencia:** Omar Ghiselini (`id_user = 2`, `omar.ghiselini@arriendosanpablo.cl`)
       4. **Coordinador de Operaciones:** Jonathan Castillo (`id_user = 17`, `logistica@arriendosanpablo.cl`)
       5. **Operaciones:** Jorge Ponce (`id_user = 3`, `jponce@arriendosanpablo.cl`)
     - **Copia (`CC`):**
       - **Control de Gestión:** Yiara Mendoza (`id_user = 65` / email del firmante de Paso 1, `controlflota@arriendosanpablo.cl`)
     - **Enlaces Obligatorios en el Correo:**
       1. **Botón Principal (Deep Link Contextual para Contabilidad):** `{BASE_URL_WEB}/torre?view=contabilidad&id_proyecto={id_proyecto}&accion=caratula` — abre directamente la vista de Contabilidad y despliega la Carátula EDP del servicio exacto a facturar (preservando `redirect` tras Google SSO si no tenía sesión iniciada).
       2. **Botón / Enlace Secundario Directo al PDF Firmado:** `{BASE_URL_WEB}/api/operaciones/edp/proyecto/{id_proyecto}/pdf` — descarga/visualiza el PDF oficial del EDP con la firma FES de Control de Gestión estampada.

2. **Hito 2 — Contabilidad y Facturación (Maritza Seguel, `id_user = 61`):**
   Mientras el EDP se encuentra en etapa `EN_CONTABILIDAD` (`paso_actual = 2`), Contabilidad dispone de dos caminos excluyentes:
   - **Camino A — Emisión en Laudus, Carga de Documento DTE y Firma FES (`paso = 2`, `accion = 'FIRMAR'`):**
     1. Contabilidad genera la Factura Electrónica en **Laudus ERP**.
     2. Sube el archivo PDF de la factura en nuestra plataforma (desde `ModalCaratulaEDP.vue` o `PerspectivaContabilidad.vue`, con lectura automática de Folio, RUTs, Fecha, Neto, IVA y Total mediante `/api/operaciones/edp/parsear-dte-pdf` y guardado en `/api/operaciones/edp/soporte-documental`).
     3. Firma con su PIN FES de 4 dígitos (`Paso 2`) certificando que emitió y subió la factura al sistema (`firma_2_contabilidad`).
     4. **Invariante de Integridad (`INV-EDP-CONTA-01`):** El backend rechaza con `HTTP 400` cualquier intento de firmar `Paso 2` si el proyecto aún no registra al menos una factura DTE cargada (`facturas_dte.length > 0` o `liquidacion_v1.factura_numero`).
     5. Al completarse la firma `Paso 2`, el EDP pasa a `estado = 'FACTURADO_CONFORME'`, `paso_actual = 3`, consolidando el cierre financiero de la OT (`id_proyecto_estado = 7` salvo facturación parcial explícita) y estampando la firma FES de Contabilidad en el cuadro 2 del PDF oficial (`edpPdfService.js`).
   - **Camino B — Rechazo / Devolución con Observaciones a Control de Gestión (`paso = 2`, `accion = 'DEVOLVER'`):**
     1. Si Contabilidad detecta una discrepancia, pulsa **Devolver EDP a Yiara con Observaciones** e ingresa el motivo obligatorio.
     2. El backend cambia el flujo a `estado = 'OBSERVADO_CONTABILIDAD'`, retrocede `paso_actual = 1`, archiva la firma previa en `historial` y limpia `firma_1_analista = null` y `firma_2_contabilidad = null` (`habilitado_facturar = false`), exigiendo que Control de Gestión corrija y vuelva a firmar el Hito 1.
     3. Se despacha correo formal a **Yiara Mendoza** (con `CC` a Maritza Seguel, Jonathan Castillo y Jorge Ponce) mostrando la observación en recuadro destacado y el Deep Link directo `{BASE_URL_WEB}/torre?view=pmo&id_proyecto={id_proyecto}&accion=caratula`.

---

## 2. Arquitectura y Archivos Intervenidos

1. `ejecucion/backend_remoto/src/services/notificacionService.js`:
   - Habilitación del parámetro `cc` en `despacharEmailSmtp` hacia `messageModel.enviarYRegistrarCorreo` y en `despacharNotificacion`.
2. `ejecucion/backend_remoto/src/controllers/estadoPagoController.js`:
   - Refactorización de `firmarPasoEdp` al circuito de 2 Hitos (Control de Gestión -> Contabilidad), resolución relacional de destinatarios en `tsec_users`, Deep Links canónicos (`notificacionService.construirDeepLink`), validación `INV-EDP-CONTA-01` de DTE cargado antes de firma `Paso 2`, y limpieza de `firma_1_analista` en `DEVOLVER`.
   - Homologación de `OBSERVADO_CONTABILIDAD` en `getPerspectivaContabilidad`.
3. `ejecucion/backend_remoto/src/services/edpPdfService.js`:
   - Actualización del Cuadro 2 de firmas FES en el PDF del EDP a `2. Contabilidad y Facturación` (`f2Contabilidad`).
4. `ejecucion/frontend/src/views/Torre.vue`:
   - Soporte de Deep Link en `onMounted` y `watch` sobre `route.query` (`view=contabilidad|pmo` y `accion=caratula` -> `abrirCaratulaEdpPMO(id_proyecto)`).
5. `ejecucion/frontend/src/components/Operaciones/ModalCaratulaEDP.vue`:
   - Rediseño del encabezado de hitos a **2 Hitos** (`Hito 1: Control de Gestión (Yiara Mendoza)` y `Hito 2: Contabilidad y Facturación (Maritza Seguel)`), integración de reconocimiento automático PDF Laudus (`/operaciones/edp/parsear-dte-pdf`) al subir factura en la carátula, botón de Firma FES Paso 2 y submodal formal de devolución con observaciones a Yiara.
6. `ejecucion/frontend/src/components/Operaciones/PerspectivaContabilidad.vue`:
   - Actualización de indicadores de firmas FES (`1°Ctl` + `2°Conta`) y botones directos en el modal `FE` / `DTE` para firmar la recepción/carga de factura con PIN FES o devolver el EDP con observaciones a Yiara.
