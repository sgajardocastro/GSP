# 📋 SPEC-073: Rediseño Modular PWA Taller (Patrón Operación), Google SSO Exclusivo, Eliminación de Surveys Residuales y Concurrencia de OTMs

## 📌 Metadatos del Documento
- **Código de Requerimiento:** `REQ-1038`
- **ID de Especificación:** `SPEC-073`
- **Módulos Afectados:** PWA (`Login.vue`, `TallerHomeView.vue`), Backend (`mantenimientoModel.js`), Gestión (`tareas.md`, `RELEASE_LOG.md`).
- **Versiones Objetivo:** PWA `v1.0.42`, Backend PM2 ID 10 (DEV :3006) y PM2 ID 13 (PROD :3007).
- **Fecha:** 14 de Octubre de 2026
- **Estado:** ESPECIFICADO / EN IMPLEMENTACIÓN

---

## 1. Problema de Negocio y Operacional
1. **Fricción en Autenticación PWA:** El login tradicional por usuario/contraseña confunde a los operadores y mecánicos de Grúas San Pablo, cuya identidad corporativa reside al 100% en Google Workspace (`@arriendosanpablo.cl`). El formulario clásico debe subordinarse para que el botón de Google SSO sea el acceso principal inmediato.
2. **Caos Visual en PWA Taller:** En `TallerHomeView.vue`, las funciones estaban dispersas y sobrecargadas. Debe adoptarse la arquitectura canónica de tarjetas modulares presente en la pestaña **Operación** (`Surveys.vue`), segmentando claramente:
   - *Tarjeta 1:* Apertura de Trabajos ➔ **Nueva Orden de Trabajo (OTM)**.
   - *Tarjeta 2:* Alertas de Terreno ➔ **Aviso de Avería / Falla**.
   - *Tarjeta 3:* Trabajos en Curso ➔ **Bandeja de OTMs Activas**.
3. **Sección Residual No Deseada:** El bloque *"Inspecciones Obligatorias de Grúa (Surveys)"* (Checklist Pre-Trabajo 501 y Liberación Post-Trabajo 502) al pie de la vista de taller fue identificado como confuso y no operativo, debiendo ser eliminado completamente.
4. **Restricción Bloqueante de Concurrencia:** En `mantenimientoModel.crearOt`, el sistema bloqueaba la creación de una nueva OT si el equipo ya tenía una en curso (`EQUIPO_CON_OT_ACTIVA`). En la operación real de izaje, una grúa puede y debe registrar múltiples OTMs concurrentes (ej. eléctrica + mecánica + neumáticos).
5. **Sincronización en Producción:** Todas las mejoras deben ser compiladas y desplegadas tanto en DEV (`/pwa-gsp-dev/`) como en Producción (`/pwa-gsp-prod/`) con reinicio del backend PM2.

---

## 2. Especificación Técnica de Componentes

### 2.1 PWA Login (`ejecucion/pwa/src/views/Login.vue`)
- **Jerarquía:** 
  1. Título corporativo y logo GSP.
  2. Botón principal de **Google Workspace Sign-In** centrado y destacado.
  3. Separador sutil o enlace colapsable: *"¿No tienes cuenta Google Workspace? Ingresar con credenciales clásicas"*.
  4. Formulario clásico de usuario/contraseña oculto por defecto (expandible sólo en caso de contingencia o soporte).

### 2.2 PWA Taller (`ejecucion/pwa/src/views/taller/TallerHomeView.vue`)
- **Arquitectura de 3 Tarjetas Modulares (Patrón Operación):**
  - **Card 1: Apertura de Trabajos (Nueva OTM)**
    - Barra de acento: Ámbar corporativo (`from-amber-500 to-amber-600`).
    - Ícono: `mdi-wrench-outline` con fondo ámbar suave.
    - Categoría: `APERTURA DE TRABAJOS`.
    - Título: `Nueva Orden de Trabajo (OTM)`.
    - Badge: `DISPONIBLE`.
    - Descripción: *"Apertura de mantenimiento preventivo, correctivo o predictivo con asignación de mecánico y horómetro inicial."*
    - Botón: `➕ Abrir Nueva Orden de Trabajo (OTM) ➔` (abre modal de creación con autocompletado de flota).
  - **Card 2: Alertas de Terreno (Aviso de Falla)**
    - Barra de acento: Rojo/carmín (`from-rose-500 to-red-600`).
    - Ícono: `mdi-alert-octagon-outline` con fondo rojo suave.
    - Categoría: `ALERTAS DE TERRENO`.
    - Título: `Aviso de Avería / Falla`.
    - Badge: `URGENCIAS`.
    - Descripción: *"Reporte inmediato de anomalías mecánicas, fugas hidráulicas, ruidos o códigos de falla con captura de fotos desde terreno."*
    - Botón: `🚨 Reportar Falla o Avería Urgente ➔` (abre modal de aviso de avería con subida de evidencias).
  - **Card 3: Trabajos en Curso (Bandeja de OTMs Activas)**
    - Barra de acento: Azul/slate (`from-blue-500 to-indigo-600`).
    - Ícono: `mdi-clipboard-list-outline` con fondo azul suave.
    - Categoría: `TRABAJOS EN CURSO`.
    - Título: `Bandeja de OTMs Activas`.
    - Badge: `${otsFiltradasFinal.length} ACTIVAS`.
    - Buscador integrado: Campo de texto reactivo para filtrar por patente o código interno (`GPT-xxx`).
    - Filtros por estado: Chips interactivos (`Todas`, `En Proceso`, `Abiertas`).
    - Lista de OTMs activas: Tarjetas legibles con número de folio, patente, tipo de mantención, mecánico asignado y botón `Atender OT ➔`.
- **Eliminación Total:** Suprimir el bloque de surveys (líneas 358-385) y sus manejadores asociados si quedan huérfanos.

### 2.3 Backend Concurrencia de OTMs (`ejecucion/backend_remoto/src/models/mantenimientoModel.js`)
- En `crearOt`:
  - Retirar el bloqueo `if (actCheck.length > 0 && !data.forzar_creacion) { throw err; }`.
  - Permitir la inserción de la nueva OT incluso si existen otras OTs abiertas para el mismo `id_equipo`.
  - Devolver en el payload de respuesta `tiene_otras_ots_activas: actCheck.length > 0` con propósitos puramente informativos.

---

## 3. Plan de Pruebas y Criterios de Aceptación
1. **Google SSO en PWA:** Al cargar la app, se presenta de inmediato la opción de inicio con Google corporativo sin exigir usuario/clave de entrada.
2. **Navegación Taller PWA:** La pantalla de Taller presenta con claridad los 3 bloques modulares idénticos al estilo de la pestaña Operación.
3. **Ausencia de Surveys Residuales:** No existe referencia a "Inspecciones Obligatorias de Grúa (Surveys)" en pantalla.
4. **Múltiples OTMs por Grúa:** Es posible crear dos o más OTMs para la misma grúa sin recibir el error `EQUIPO_CON_OT_ACTIVA`.
5. **Despliegue Producción:** Build de Vite/Vue CLI sin errores (0 warnings bloqueantes), desplegado en `/var/www/html/pwa-gsp-prod/` y `/var/www/html/lg-gsp-prod/`.
