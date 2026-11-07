# SPEC-118 / REQ-1129: Soporte de Carga y Pegado de Imágenes en Tickets del Backlog

---

## 1. Identificación y Estado

- **Código Requerimiento:** `REQ-1129`
- **Código Especificación:** `SPEC-118`
- **Fecha:** 2026-11-07
- **Autor / Arquitectura:** Antigravity / LeanGlobal
- **Ambientes:** Desarrollo (`DEV`) y Producción (`PROD`)
- **Impacto Frontend:** `ejecucion/frontend/src/views/BacklogView.vue`
- **Impacto Backend:** `ejecucion/backend_remoto/src/controllers/backlogController.js`, `ejecucion/backend_remoto/src/controllers/archivoController.js`
- **Impacto Base de Datos:** Tabla `sch_leangsp_prod.tcfg_backlog` (columna `adjuntos JSONB DEFAULT '[]'::jsonb`)
- **Estado:** `PROPUESTA FORMAL / PENDIENTE DE APROBACIÓN DE DIFF`

---

## 2. Definición del Problema & Congruencia Operacional

### 2.1. Síntoma Detectado (Reunión 2026-11-07 con Alfonso Porperrello)
- Alfonso Porperrello solicitó un canal estructurado para levantar incidencias y mejoras con capturas de pantalla de los errores que reportan los clientes o los operadores.
- Actualmente, el módulo de Backlog (`BacklogView.vue`) solo cuenta con campos de texto plano (Título, Descripción, Prioridad, Módulo).
- Para compartir evidencia visual, el equipo tenía que enviar correos paralelos o mensajes de WhatsApp, fragmentando la trazabilidad del requerimiento y dificultando el diagnóstico ágil por parte de desarrollo.

### 2.2. Mandato Operacional
> *"Se acordó habilitar la incorporación de imágenes en el backlog para asegurar una única fuente centralizada en el registro de requerimientos."* (Minuta Ejecutiva 2026-11-07).

---

## 3. Causa Raíz de Arquitectura

1. **Esquema de Datos Estricto de Texto:** La tabla `tcfg_backlog` no posee una columna nativa para almacenar referencias a archivos multimedia o capturas adjuntas.
2. **Falta de Dropzone y Listener de Portapapeles en Frontend:** `BacklogView.vue` no implementa captura de evento `paste` (`Ctrl+V`) ni selector de archivos multipart.

---

## 4. Especificación Canónica de la Solución

### 4.1. Base de Datos (`tcfg_backlog`)
Agregar columna JSONB si no existe:
```sql
ALTER TABLE sch_leangsp.tcfg_backlog ADD COLUMN IF NOT EXISTS adjuntos JSONB DEFAULT '[]'::jsonb;
ALTER TABLE sch_leangsp_prod.tcfg_backlog ADD COLUMN IF NOT EXISTS adjuntos JSONB DEFAULT '[]'::jsonb;
```
Estructura de cada elemento en `adjuntos`:
```json
{
  "id_file": 1234,
  "url": "https://servidor.leanglobal.cl/storage/gsp/.../captura.png",
  "nombre": "error_pantalla.png",
  "tamano_kb": 145,
  "fecha_subida": "2026-11-07T16:30:00Z"
}
```

### 4.2. Frontend (`BacklogView.vue`)
1. **Soporte de Portapapeles Directo (`Ctrl+V`):**
   Al estar enfocado en el formulario o modal del ticket, al presionar `Ctrl+V` con una imagen copiada en el portapapeles, el sistema detecta el blob, lo sube automáticamente mediante `multipart/form-data` a `/api/archivo/subir` y lo agrega a la galería del ticket.
2. **Zona de Carga (Drag & Drop / Botón Subir Imagen):**
   Botón `📎 Adjuntar Captura` con preview interactivo en cuadrícula de miniaturas.
3. **Visor Lightbox:**
   Al hacer clic sobre cualquier miniatura adjunta en la lista o detalle del ticket, se abre un visor en pantalla completa para inspeccionar el detalle gráfico del requerimiento.

---

## 5. Criterios de Aceptación (QA Determinista)

1. Crear un ticket en el Backlog pegando una captura con `Ctrl+V`.
2. La imagen se almacena en el storage oficial y queda persistida en `tcfg_backlog.adjuntos`.
3. Al recargar la vista, el ticket muestra la miniatura de la captura y permite abrirla en alta resolución.
