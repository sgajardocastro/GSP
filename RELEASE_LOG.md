# 🏛️ REGISTRO DE LIBERACIONES Y MEJORAS (RELEASE LOG) - GRÚAS SAN PABLO (GSP)

Este archivo contiene el historial detallado de versiones y mejoras liberadas en los ambientes del Ecosistema GSP (Web, PWA y Backend).

---

## [Portal Web GSP & PWA] - Versión 1.0.14
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-28 12:25:00 (-04:00)
- **Ruta Web CRM:** `/var/www/html/lg-gsp-dev/` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Ruta PWA:** `/var/www/html/pwa-gsp-dev/` (URL: `https://servidor.leanglobal.cl/pwa-gsp-dev/`)
- **Detalle de Mejoras y Cambios:**
  - **[FEAT]** **Visor Web de Inspecciones (`/versurveyprint`):** Integrada la ruta e iframe de previsualización de reportes de visitas a terreno en el Vue Router y Web CRM.
  - **[FEAT]** **Correos B2B Enriquecidos:** Estandarizado el despacho de cotizaciones vía `POST /message` con maquetas HTML comerciales responsivas de tarjetas corporativas.
  - **[FIX]** **Resolución Paramétrica de Logos en PDF:** Incorporada la resolución física de `logo-sanpablo.png` desde la carpeta `/public` del backend con permisos de `nodeadmin`.

## [Backend GSP] - Versión 1.0.14
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-28 12:25:00 (-04:00)
- **Proceso PM2:** `lean-services-gsp` (ID 10)
- **Ruta Remota:** `/home/nodeadmin/proyectos/lean-services-gsp`
- **Detalle de Mejoras y Cambios:**
  - **[FIX]** **Logos en PDFs de Cotizaciones:** Corregida la ruta de lectura de logos en `proyectoModel.js` a la carpeta local del proyecto con fallback dinámico in-memory.

---

## [Portal Web GSP] - Versión 1.0.13
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-22 23:27:33 (-04:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Detalle de Mejoras y Cambios:**
  - **[FEAT]** **Ordenamiento de Columnas:** Implementada lógica interactiva para ordenar de forma ascendente/descendente las columnas (ID, Email, Nombre, Rut, Empresa, Estado, Cargo, Nacimiento, FES) al clickear sus encabezados en la grilla de usuarios.

## [Backend GSP] - Versión 1.0.13
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-22 23:27:33 (-04:00)
- **Proceso PM2:** `lean-services-gsp` (ID 10)
- **Ruta Remota:** `/home/nodeadmin/proyectos/lean-services-gsp`
- **Detalle de Mejoras y Cambios:**
  - **[FIX]** **Integridad de Datos en BD:** Saneado el mapeo de los 4 administradores enrolados principales en PostgreSQL asignándoles `id_empresa = 9` para consistencia con el filtro de multi-tenant de GSP.

## [Portal Web GSP] - Versión 1.0.12
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-22 17:52:59 (-04:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Detalle de Mejoras y Cambios:**
  - **[FEAT]** **Expediente de Personal:** Rediseño del modal de edición del especialista liberando el 100% de la columna derecha para los certificados y trasladando la carga de archivos a un sub-modal flotante blur.
  - **[FEAT]** **Navegación e Interacción:** Unificada la grilla de personal con la de equipos eliminando el botón 'Editar', haciendo la fila cliqueable y añadiendo el chevron de navegación.
  - **[FEAT]** **Descarga de PDFs:** Habilitados botones para abrir de forma directa los archivos PDF reales del personal almacenados en el servidor Centos.

## [Backend GSP] - Versión 1.0.12
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-22 17:52:59 (-04:00)
- **Proceso PM2:** `lean-services-gsp` (ID 10)
- **Ruta Remota:** `/home/nodeadmin/proyectos/lean-services-gsp`
- **Detalle de Mejoras y Cambios:**
  - **[FIX]** **Normalización de Parámetros:** Corregida la utilidad `dbQuery` para sanitizar el prefijo de guion bajo en parámetros como `_id_empresa` y evitar excepciones de Postgres.
  - **[FIX]** **Acreditación Model:** Corregido el mapeo de certificados de personal cambiando `cp.documento_url` por la columna real `cp.id_doc` en PostgreSQL.
  - **[FEAT]** **Semáforos HSEC:** Implementados los cuatro estados de alertas de vigencias HSEC (Verde, Amarillo, Rojo, Gris) idénticos a los criterios de flota de equipos.
  - **[FEAT]** **Carga de Archivos Históricos:** Ejecutada subida automatizada vía SSH de los 287 archivos PDF reales de trabajadores registrando su respectivo `id_doc` en Postgres.

## [Portal Web GSP] - Versión 1.0.11
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-22 15:55:39 (-04:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Detalle de Mejoras y Cambios:**
  - **[FEAT]** **Expediente de Personal:** Rediseño del modal de edición del especialista liberando el 100% de la columna derecha para los certificados y trasladando la carga de archivos a un sub-modal flotante blur.
  - **[FEAT]** **Navegación e Interacción:** Unificada la grilla de personal con la de equipos eliminando el botón 'Editar', haciendo la fila cliqueable y añadiendo el chevron de navegación.
  - **[FEAT]** **Descarga de PDFs:** Habilitados botones para abrir de forma directa los archivos PDF reales del personal almacenados en el servidor Centos.

## [Backend GSP] - Versión 1.0.11
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-22 15:55:39 (-04:00)
- **Proceso PM2:** `lean-services-gsp` (ID 10)
- **Ruta Remota:** `/home/nodeadmin/proyectos/lean-services-gsp`
- **Detalle de Mejoras y Cambios:**
  - **[FIX]** **Acreditación Model:** Corregido el mapeo de certificados de personal cambiando `cp.documento_url` por la columna real `cp.id_doc` en PostgreSQL.
  - **[FEAT]** **Semáforos HSEC:** Implementados los cuatro estados de alertas de vigencias HSEC (Verde, Amarillo, Rojo, Gris) idénticos a los criterios de flota de equipos.
  - **[FEAT]** **Carga de Archivos Históricos:** Ejecutada subida automatizada vía SSH de los 287 archivos PDF reales de trabajadores registrando su respectivo `id_doc` en Postgres.

## [Portal Web GSP] - Versión 1.0.10
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-22 11:49:12 (-04:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Detalle de Mejoras y Cambios:**
  - **[FIX]** **Layout Público GSP:** Configurado el router-view en App.vue para renderizar de manera limpia la ficha pública sin layouts de barra lateral o cabeceras de la consola.
  - **[FIX]** **Ficha Equipo GSP:** Reescrita FichaEquipoPublica.vue para que consuma de manera nativa los endpoints de flota y certificados del backend de GSP en vez de Transmac, ajustando el pie de página.

## [Backend GSP] - Versión 1.0.10
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-22 11:49:12 (-04:00)
- **Proceso PM2:** `lean-services-gsp` (ID 10)
- **Ruta Remota:** `/home/nodeadmin/proyectos/lean-services-gsp`
- **Detalle de Mejoras y Cambios:**
  - **[FIX]** **Mantenimiento:** Sincronizado el reinicio del servidor de backend de GSP.

## [Portal Web GSP] - Versión 1.0.9
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-21 13:28:54 (-04:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Detalle de Mejoras y Cambios:**
  - **[FIX]** **Layout Público GSP:** Configurado el router-view en App.vue para renderizar de manera limpia la ficha pública sin layouts de barra lateral o cabeceras de la consola.
  - **[FIX]** **Ficha Equipo GSP:** Reescrita FichaEquipoPublica.vue para que consuma de manera nativa los endpoints de flota y certificados del backend de GSP en vez de Transmac, ajustando el pie de página.

## [Backend GSP] - Versión 1.0.9
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-21 13:28:54 (-04:00)
- **Proceso PM2:** `lean-services-gsp` (ID 10)
- **Ruta Remota:** `/home/nodeadmin/proyectos/lean-services-gsp`
- **Detalle de Mejoras y Cambios:**
  - **[FIX]** **Mantenimiento:** Sincronizado el reinicio del servidor de backend de GSP.

## [Portal Web GSP] - Versión 1.0.8
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-21 13:21:39 (-04:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Detalle de Mejoras y Cambios:**
  - **[FIX]** **Ficha QR Pública GSP:** Corregida la URL del código QR para redireccionar al portal de GSP (/lg-gsp-dev/equipo/{patente}) en lugar de Transmac.
  - **[FIX]** **Coherencia Tipográfica en Vista 360:** Normalizados los pesos de letra (reemplazando font-black por font-bold) y removidas cursivas e imposiciones de mayúsculas en marca/modelo para alinearse estéticamente con el modal de edición.

## [Backend GSP] - Versión 1.0.8
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-21 13:21:39 (-04:00)
- **Proceso PM2:** `lean-services-gsp` (ID 10)
- **Ruta Remota:** `/home/nodeadmin/proyectos/lean-services-gsp`
- **Detalle de Mejoras y Cambios:**
  - **[FIX]** **Mantenimiento:** Sincronizado el reinicio del servidor de backend de GSP para propagar las correcciones del modelo de flota.

## [Portal Web GSP] - Versión 1.0.7
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-21 13:13:15 (-04:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Detalle de Mejoras y Cambios:**
  - **[FEAT]** **Filtro Multi-Empresa Reactivo:** Vinculado el selector de empresa de la barra superior con las consultas de proyectos de la Torre de Control, incorporando la opción 'Todas las empresas'.
  - **[FEAT]** **CRUD de Equipos y Certificados:** Integrado el nuevo modal unificado `ModalCrearEditarEquipo.vue` para el registro, edición de maquinaria y carga/gestión digital de sus documentos en la Vista 360.

## [Backend GSP] - Versión 1.0.7
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-21 13:13:15 (-04:00)
- **Proceso PM2:** `lean-services-gsp` (ID 10)
- **Ruta Remota:** `/home/nodeadmin/proyectos/lean-services-gsp`
- **Detalle de Mejoras y Cambios:**
  - **[FEAT]** **Filtro de Empresa Dinámico:** Ajustado el controlador de proyectos para permitir consultar el total consolidado de empresas cuando se selecciona 'all'.
  - **[FEAT]** **API de Equipos normalizada:** Actualizado el backend de equipos para persistir campos técnicos normalizados de la migración y proveer catálogo de tipos de certificados.

## [Portal Web GSP] - Versión 1.0.6
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-21 12:50:43 (-04:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Detalle de Mejoras y Cambios:**
  - **[FEAT]** **Filtro Multi-Empresa Reactivo:** Vinculado el selector de empresa de la barra superior con las consultas de proyectos de la Torre de Control, incorporando la opción 'Todas las empresas'.
  - **[FEAT]** **CRUD de Equipos y Certificados:** Integrado el nuevo modal unificado `ModalCrearEditarEquipo.vue` para el registro, edición de maquinaria y carga/gestión digital de sus documentos en la Vista 360.

## [Backend GSP] - Versión 1.0.6
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-21 12:50:43 (-04:00)
- **Proceso PM2:** `lean-services-gsp` (ID 10)
- **Ruta Remota:** `/home/nodeadmin/proyectos/lean-services-gsp`
- **Detalle de Mejoras y Cambios:**
  - **[FEAT]** **Filtro de Empresa Dinámico:** Ajustado el controlador de proyectos para permitir consultar el total consolidado de empresas cuando se selecciona 'all'.
  - **[FEAT]** **API de Equipos normalizada:** Actualizado el backend de equipos para persistir campos técnicos normalizados de la migración y proveer catálogo de tipos de certificados.

## [Portal Web GSP] - Versión 1.0.5
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-21 12:46:06 (-04:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Detalle de Mejoras y Cambios:**
  - **[FEAT]** **Filtro Multi-Empresa Reactivo:** Vinculado el selector de empresa de la barra superior con las consultas de proyectos de la Torre de Control, incorporando la opción 'Todas las empresas'.
  - **[FEAT]** **CRUD de Equipos y Certificados:** Integrado el nuevo modal unificado `ModalCrearEditarEquipo.vue` para el registro, edición de maquinaria y carga/gestión digital de sus documentos en la Vista 360.

## [Backend GSP] - Versión 1.0.5
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-21 12:46:06 (-04:00)
- **Proceso PM2:** `lean-services-gsp` (ID 10)
- **Ruta Remota:** `/home/nodeadmin/proyectos/lean-services-gsp`
- **Detalle de Mejoras y Cambios:**
  - **[FEAT]** **Filtro de Empresa Dinámico:** Ajustado el controlador de proyectos para permitir consultar el total consolidado de empresas cuando se selecciona 'all'.
  - **[FEAT]** **API de Equipos normalizada:** Actualizado el backend de equipos para persistir campos técnicos normalizados de la migración y proveer catálogo de tipos de certificados.

## [Portal Web GSP] - Versión 1.0.4
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-21 12:39:32 (-04:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Detalle de Mejoras y Cambios:**
  - **[FEAT]** **Filtro Multi-Empresa Reactivo:** Vinculado el selector de empresa de la barra superior con las consultas de proyectos de la Torre de Control, incorporando la opción 'Todas las empresas'.
  - **[FEAT]** **CRUD de Equipos y Certificados:** Integrado el nuevo modal unificado `ModalCrearEditarEquipo.vue` para el registro, edición de maquinaria y carga/gestión digital de sus documentos en la Vista 360.

## [Backend GSP] - Versión 1.0.4
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-21 12:39:32 (-04:00)
- **Proceso PM2:** `lean-services-gsp` (ID 10)
- **Ruta Remota:** `/home/nodeadmin/proyectos/lean-services-gsp`
- **Detalle de Mejoras y Cambios:**
  - **[FEAT]** **Filtro de Empresa Dinámico:** Ajustado el controlador de proyectos para permitir consultar el total consolidado de empresas cuando se selecciona 'all'.
  - **[FEAT]** **API de Equipos normalizada:** Actualizado el backend de equipos para persistir campos técnicos normalizados de la migración y proveer catálogo de tipos de certificados.

## [Portal Web GSP] - Versión 1.0.3
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-21 12:16:14 (-04:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Detalle de Mejoras y Cambios:**
  - **[FIX]** **Independización del Tema en Consola:** Reemplazada la clave genérica 'theme' por 'gsp-theme' en el localStorage del portal para evitar interferencias estéticas (menú lateral en color blanco) causadas por la selección de tema en aplicaciones hermanas del mismo dominio.

## [Backend GSP] - Versión 1.0.3
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-21 12:16:14 (-04:00)
- **Proceso PM2:** `lean-services-gsp` (ID 10)
- **Ruta Remota:** `/home/nodeadmin/proyectos/lean-services-gsp`
- **Detalle de Mejoras y Cambios:**
  - **[FEAT]** **Mantenimiento:** Sincronizado el reinicio del servidor de backend de GSP.

## [Portal Web GSP] - Versión 1.0.2
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-21 11:59:30 (-04:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Detalle de Mejoras y Cambios:**
  - **[FIX]** **Eliminación de Mapas en Cotizaciones:** Ocultado el elemento gráfico del mapa Yandex en la previsualización e impresión de cotizaciones para mostrar exclusivamente Latitud y Longitud en formato de texto.
  - **[FEAT]** **Tabla de Estructurador de Servicios:** Integrado el desglose completo de líneas de servicio (Tarifas Comerciales) y totales de cotización en el reporte de impresión de cotizaciones.

## [Backend GSP] - Versión 1.0.2
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-21 11:59:30 (-04:00)
- **Proceso PM2:** `lean-services-gsp` (ID 10)
- **Ruta Remota:** `/home/nodeadmin/proyectos/lean-services-gsp`
- **Detalle de Mejoras y Cambios:**
  - **[FEAT]** **Estructurador de Servicios:** Sincronizado el segmento estructurador y las líneas de servicio cotizadas reales en la creación de cotizaciones.

## [Portal Web GSP] - Versión 1.0.1
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-20 22:32:50 (-04:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Detalle de Mejoras y Cambios:**
  - **[FEAT]** **Semáforos por Máxima Severidad:** Implementada agregación por riesgo (Rojo > Amarillo > Verde > Gris).
  - **[FIX]** **URL Singular de Archivos:** Ajustada la ruta de previsualización a `/api/archivo/ver/:id`.

## [Backend GSP] - Versión 1.0.1
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-20 22:32:50 (-04:00)
- **Proceso PM2:** `lean-services-gsp` (ID 10)
- **Ruta Remota:** `/home/nodeadmin/proyectos/lean-services-gsp`
- **Detalle de Mejoras y Cambios:**
  - **[FEAT]** **Evaluación SQL en `tequEquipoModel.getEquipos()`:** Agregada evaluación por máxima severidad en la carga inicial de flota.
  - **[FEAT]** **Endpoint de Archivos Físicos:** Expuesta la ruta `/api/archivo/ver/:id` leyendo de `/u05/LeanDocs/GSP/Equipos/`.

## [Portal Web GSP] - Versión 1.0.1
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-20 22:20:00 (-04:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Detalle de Mejoras y Cambios:**
  - **[FEAT]** **Semáforos de Severidad Estricta en Flota:** Implementado cálculo dinámico en PostgreSQL que asigna estados por máxima severidad: Rojo (Vencido < HOY), Amarillo (Alerta <= 30 días), Verde (Vigente > 30 días) y Gris (Sin Documentos ✕).
  - **[FIX]** **Ruta de Visualización de Documentos:** Corregida la URL de previsualización en `Vista360.vue` al prefijo singular `/api/archivo/ver/:id` para abrir de forma directa los PDFs escaneados desde `/u05/LeanDocs/GSP/Equipos/`.
  - **[FEAT]** **Sincronización de KPIs y Filtros:** Actualizadas las tarjetas del encabezado ("Total Flota", "A Vencer", "Vencidos") y botones de filtro para considerar la severidad combinada de certificados legales y generales.

## [Backend GSP] - Versión 1.0.1
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-20 22:20:00 (-04:00)
- **Proceso PM2:** `lean-services-gsp` (ID 10)
- **Ruta Remota:** `/home/nodeadmin/proyectos/lean-services-gsp`
- **Detalle de Mejoras y Cambios:**
  - **[FEAT]** **Evaluación SQL en `tequEquipoModel.js`:** Incorporadas expresiones `CASE` con `FILTER (WHERE ...)` en la función `getEquipos()` para calcular el semáforo `estado_doc_legal` y `estado_doc_gral` directamente en la base de datos PostgreSQL.
  - **[FEAT]** **Servicio de Lectura de Archivos:** Incorporado `verArchivoById` en `archivoController.js` y expuesto `/api/archivo/ver/:id` en `archivoRoutes.js`.
