# CASO-20261022-04 — Orden de Trabajo No Visible al Ingresar a la PWA hasta Navegar a «Firmas» y Volver (`Surveys.vue`)

---

## 1. Ficha del Incidente

| Campo | Detalle |
| :--- | :--- |
| **ID del Caso** | `CASO-20261022-04` |
| **Fecha / Hora** | `2026-10-22 18:45 CL` (Resolución: `2026-10-22 19:38 CL`) |
| **Operador / Usuario Afectado** | **Robert Rodríguez** (`id_user = 49`, RUT `26.588.627-5`, `triarrodriguez2@gmail.com`) |
| **Negocio / OT** | `GSP-2610-233-016` (`id_proyecto = 16`, Cliente: `Sociedad de Constructores Tensacon S.A.`, Faena: `Planta Ferrero`) |
| **Equipo Involucrado** | Grúa Móvil Liebherr LTM-1040 (`DZXL.21-0`, `id_equipo = 33`) |
| **Ambiente** | Producción (`PROD` — `sch_leangsp_prod` / `/pwa-gsp-prod/`) y Desarrollo (`DEV` — `sch_leangsp` / `/pwa-gsp-dev/`) |
| **Severidad** | **Alta** (Fricción operativa diaria al abrir la PWA en terreno: la OT asignada no aparecía hasta cambiar de pestaña y regresar) |
| **Estado** | `RESUELTO Y DESPLEGADO EN PROD Y DEV` |

---

## 2. Síntoma Reportado por Terreno

Reporte textual enviado por el operador **Robert Rodríguez** tras confirmar que el cierre del Report Diario ya funcionó correctamente:
> *"Hola buenas , si hoy pude cerrar correctamente , pero el ingreso aun no aparece visible la orden , tengo que hacer lo de pinchar donde dise firmas , volver y hay aparece la orden ."*

- **Pantalla afectada:** Consola Maestra de Operaciones en Terreno ([`ejecucion/pwa/src/views/Surveys.vue`](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/ejecucion/pwa/src/views/Surveys.vue)), ruta `/surveys`.
- **Comportamiento observado:** Al abrir la aplicación PWA, el Bloque B (**Report Diario de Izaje**) mostraba el chip verde **`AL DÍA`** sin la tarjeta de la OT `GSP-2610-233-016`. El operador debía pulsar la pestaña inferior **Firmas** (`/firmas`) y luego volver a **Operación** (`/surveys`) para que apareciera la orden.

---

## 3. Diagnóstico Técnico & Evidencia Empírica

### 3.1. Inspección del Ciclo de Vida `onMounted` en `Surveys.vue`
En [`ejecucion/pwa/src/views/Surveys.vue`](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/ejecucion/pwa/src/views/Surveys.vue#L3811-L3833), la función `consultarReportsPendientes()` —encargada de invocar `GET /reports/usuario/pendientes?id_user=49`— se encontraba en el **último lugar (paso 7)** de una cascada estrictamente secuencial de `await`:

```javascript
await cargarRolesSesion()
await cargarNombresUsuarios()
await getSurvey()
await cargarNotificaciones()
await consultarViajeActivo()
await cargarDatosRealesPlataformaBsm() // Descarga GET /proyectos completo con json_field + fotos Base64 + GET /tequ-equipos
await consultarReportsPendientes()     // Recién se ejecutaba al terminar todos los anteriores
```

### 3.2. Reanudación de PWA `standalone` en Android y Desalineación de `idUser`
1. **Reanudación desde segundo plano sin re-ejecutar `onMounted`:** En modo `standalone` (`manifest.json`), cuando el operador abre la PWA desde el ícono del teléfono y la ruta activa ya es `/surveys`, el WebView reanuda la vista en memoria sin disparar `onMounted`. Al tocar **Firmas** (`/firmas`) y volver a **Operación** (`/surveys`), `vue-router` destruye `FirmaElectronica.vue` y vuelve a montar `Surveys.vue`, disparando `onMounted`.
2. **Desalineación de clave en `localStorage` (`ID_USUARIO` vs `id_user`):** `Login.vue` almacena el perfil en `localStorage.getItem('perfil')` con la clave `ID_USUARIO` (en mayúsculas), mientras que `Surveys.vue` buscaba únicamente `userDetailStore.userDetail?.id_user` o `perfil?.id_user` (en minúsculas). Si Pinia aún no terminaba de hidratar en el primer tick, `uid` resultaba `null`/`undefined` y `consultarReportsPendientes()` retornaba sin consultar el backend; tras navegar a `/firmas` y volver, `userDetailStore` ya estaba hidratado.
3. **Invisibilidad de la OT cuando el Report del día ya está cerrado (`primerConcluido`):** Cuando el operador ya selló el report del día (`reportsPendientes` queda vacío y la OT pasa al arreglo `reportsConcluidos` / `primerConcluido`), el `<template>` ocultaba los datos de la OT y el botón llamaba a `abrirReportDiario(undefined, ...)`.

---

## 4. Causa Raíz de Arquitectura (Software / State Machine / Datos)

1. **Bloqueo por Cascada Secuencial (`Waterfall Await`) en el Arranque de `Surveys.vue`:** La consulta más crítica para el operador de grúa (`consultarReportsPendientes()`) esperaba detrás de 6 funciones pesadas de catálogos, encuestas e imágenes Base64, mientras el `<template>` mostraba un falso estado `AL DÍA` sin indicador de carga (`cargandoReportsPendientes` no se renderizaba).
2. **Falta de Listeners de Ciclo de Vida de Visibilidad (`visibilitychange` / `focus`):** La vista principal `/surveys` no refrescaba las órdenes operativas al despertar la PWA desde segundo plano en dispositivos móviles.
3. **Resolución Incompleta de `idUser` y Ocultamiento de `primerConcluido`:** El `computed` `idUser` no leía `localStorage('userDetail')` ni `localStorage('perfil').ID_USUARIO`, y el Bloque B no renderizaba la tarjeta de `primerConcluido` una vez cerrado el reporte diario.

---

## 5. Plan de Mitigación y Resolución

### 5.1. Corrección en [`ejecucion/pwa/src/views/Surveys.vue`](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/ejecucion/pwa/src/views/Surveys.vue)
1. **Paralelización en Primer Tick de `onMounted`:** Se lanzó `Promise.all([consultarReportsPendientes(), consultarViajeActivo()])` como prioridad 1 al inicio de `onMounted`, sin esperar a `cargarRolesSesion()`, `getSurvey()` ni `cargarDatosRealesPlataformaBsm()`.
2. **Auto-Refresco al Reabrir la App (`visibilitychange` y `focus`) + Botón Manual de Refresco:** Se registraron listeners `window.addEventListener('focus', ...)` y `document.addEventListener('visibilitychange', ...)` (con limpieza en `onBeforeUnmount`) además de un botón `mdi-refresh` en la cabecera del Bloque B.
3. **Resolución Resiliente de `idUser`:** El `computed` `idUser` ahora resuelve en cascada: `userDetailStore.userDetail?.id_user` ➔ `localStorage('userDetail')` ➔ `localStorage('perfil').id_user ?? localStorage('perfil').ID_USUARIO`.
4. **Renderizado de Estado de Carga y de OT con Jornada del Día Cerrada (`primerConcluido`):**
   - Mientras `cargandoReportsPendientes` está activo y aún no hay datos, se muestra el estado explícito **`CARGANDO...`** y el mensaje *"Sincronizando orden de trabajo y estado de jornada..."*.
   - Si el operador ya cerró su jornada del día (`primerConcluido`), se muestra la tarjeta esmeralda con el código de OT (`OT GSP-2610-233-016`), patente, faena, avance de reportes (`dias_reportados/total_dias`) y acceso directo con `abrirReportDiario`.

### 5.2. Compilación y Despliegue en DEV y PROD
- Compilados los bundles de la PWA para `DEV` (`dist_dev`) y `PROD` (`dist_prod`) con 0 errores.
- Desplegados en `/var/www/html/pwa-gsp-dev` y `/var/www/html/pwa-gsp-prod` con respaldo previo y purga de bundles antiguos.
- Verificado empíricamente con `HTTP 200 OK` en `https://servidor.leanglobal.cl/pwa-gsp-prod/`, `https://servidor.leanglobal.cl/pwa-gsp-dev/` y `GET /lg-gsp-prod/api/reports/usuario/pendientes?id_user=49`.

---

## 6. Protocolo de Respuesta y Guía al Usuario

> *"Hola Robert, muchas gracias por avisar. Ya corregimos y actualizamos la aplicación para que tu orden de trabajo cargue de inmediato apenas abres la app, sin tener que ir a la pestaña Firmas y volver. Por favor cierra completamente la aplicación y vuélvela a abrir para que tome la actualización."*

---

## 7. Lecciones Aprendidas y Acciones Preventivas

1. **Prioridad de Consultas Operativas en Vistas Móviles de Terreno:** En pantallas de arranque de la PWA, los endpoints de asignación directa del operador (`/reports/usuario/pendientes` y `/viajes/usuario/activo`) deben ejecutarse siempre en el primer tick en paralelo, nunca detrás de descargas masivas de catálogos o históricos.
2. **Ciclo de Vida `visibilitychange` en PWAs `standalone`:** Toda vista principal de una PWA instalada en Android/iOS debe suscribirse a `visibilitychange` y `focus` para sincronizar el estado operativo cuando el usuario reabre la aplicación desde segundo plano.
3. **Homologación de Claves de Sesión en `localStorage`:** Siempre contemplar tanto `id_user` como `ID_USUARIO` al leer `localStorage.getItem('perfil')` como respaldo de Pinia.
