# Ficha de Soporte Operacional: CASO-20261102-01

## 1. Ficha del Incidente
- **ID del Caso:** `CASO-20261102-01`
- **Fecha / Hora:** `2026-11-02 12:01:36 -03:00`
- **Operador / Usuario Afectado:** Robert Rodríguez (`id_user = 49`)
- **Negocio / OT:** `GSP-2611-00003` (`id_proyecto = 32` — `GRARDO BARTHOU SERVICIO PERSONAL`, `id_survey = 31`, `id_template = 80`)
- **Equipo Involucrado:** No Aplica (Evaluación Comercial / Visita Técnica a Terreno)
- **Ambiente:** Producción (`PROD` — `https://servidor.leanglobal.cl/pwa-gsp-prod/`)
- **Severidad:** Alta (Visibilidad operativa de Visitas a Terreno en PWA)

---

## 2. Síntoma Reportado por Terreno
- **Descripción textual:** *"INCIDENTE: GSP-2611-00003 Este servicio se le requirió una visita a Terreno, Robert la vió, pero ya no aparece. Que está pasando?"*
- **Pantalla afectada:** Vista principal de operación en la PWA móvil (`ejecucion/pwa/src/views/surveys.vue`, ruta `/surveys`).

---

## 3. Diagnóstico Técnico & Evidencia Empírica
- **Verificación en Base de Datos (`sch_leangsp_prod`):**
  - En `sch_leangsp_prod.tpry_proyecto`, el negocio `GSP-2611-00003` (`id_proyecto = 32`, `"GRARDO BARTHOU SERVICIO PERSONAL"`) tiene `visita_terreno: true`.
  - En `sch_leangsp_prod.tsrv_survey`, existe la encuesta de Visita Técnica a Terreno `id_survey = 31` (`id_template = 80`, `id_proyecto = 32`, `id_user = 49` — Robert Rodríguez, `estado_srv = 'Creado'`).
- **Inspección de Código (`ejecucion/pwa/src/views/surveys.vue`):**
  - El método `getSurvey()` descargaba correctamente la encuesta `id_survey = 31` y la incluía en la propiedad computada `filteredSurveys`.
  - Sin embargo, en el `<template>` de `surveys.vue`, la grilla de protocolos/encuestas asignadas había quedado oculta con `v-if="false"`, mostrando únicamente los bloques de Viajes, Plataformas 360°, Report Diario, AST y Plan de Izaje.

---

## 4. Causa Raíz de Arquitectura (Software / State Machine / Datos)
- Al simplificar el Panel Operativo de Campo en `surveys.vue` para operadores de grúa y choferes, se desactivó (`v-if="false"`) la sección que renderizaba `filteredSurveys` (`tsrv_survey`). Como consecuencia, cuando un evaluador como Robert ingresaba por primera vez desde una notificación directa podía ver el formulario, pero al volver a la pestaña principal `Operación` (`/surveys`) no existía ninguna tarjeta que listara las **Visitas a Terreno Asignadas (`id_template = 80`)**.

---

## 5. Plan de Mitigación y Resolución
- Se incorporó en `ejecucion/pwa/src/views/surveys.vue` el **Bloque C: Visitas Técnicas a Terreno & Protocolos Asignados (`v-if="filteredSurveys.length > 0"`)**, que renderiza todas las visitas técnicas y formularios asignados pendientes del usuario con su estado, cliente, proyecto y botón directo **`Abrir Visita a Terreno ➔`** (`goToInspeccion`).
- Se compiló el bundle de producción (`dist_prod_visita`, `0 errores`) y se desplegó en `/var/www/html/pwa-gsp-prod`, verificando respuesta `HTTP 200 OK`.

---

## 6. Protocolo de Respuesta y Guía al Usuario / Operador
- Indicar a Robert Rodríguez que recargue o vuelva a entrar a la pestaña **Operación** en la App Móvil (`https://servidor.leanglobal.cl/pwa-gsp-prod/`). Verá de inmediato la tarjeta celeste **"Visitas a Terreno Asignadas"** con el servicio **`GRARDO BARTHOU SERVICIO PERSONAL` (`#31`)** y el botón **`Abrir Visita a Terreno ➔`**.

---

## 7. Lecciones Aprendidas y Acciones Preventivas
- Mantener siempre visible en el Panel Operativo de Campo de la PWA el bloque reactivo de `filteredSurveys` para que las **Visitas Técnicas a Terreno (`id_template = 80`)** y cualquier protocolo asignado al usuario aparezcan de forma nativa sin depender del enlace de notificación inicial.
