# 📋 CASO-20261116-01: Deshabilitación de Bloqueo por Horómetro Menor en Salida de Viajes y Apertura de Report Diario

---

## 1. Ficha del Incidente

* **ID del Caso:** `CASO-20261116-01`
* **Fecha / Hora:** 2026-11-16 08:50 CLT (GMT-03:00)
* **Operador / Usuario Afectado:** Operadores de Terreno (Chofer ID 62 en Proyecto 63)
* **Negocio / OT:** `GSP-2611-00021` (ID Proyecto 63 — CMPC San Javier, Maule) / Flota General
* **Equipo Involucrado:** Tadano GT 750EL (`TYGC.45-1`, ID Equipo 43) / Flota General
* **Ambiente:** Producción (`PROD`) y Desarrollo (`DEV`)
* **Severidad:** Crítica (bloqueo operativo total de despacho en faena y reporte diario)

---

## 2. Síntoma Reportado por Terreno

1. Al intentar realizar el inicio de viaje (Salida de Base) desde la PWA en el teléfono móvil, al ingresar el horómetro del motor camión / chasis (2.522 HRS) y capturar la fotografía del marcador, la aplicación arroja un cuadro de alerta bloqueante:
   > *"servidor.leanglobal.cl dice: 🚨 Valor Incremental Inválido: El Horómetro de Salida (2522 HRS) no puede ser menor al último registro acumulado del equipo (3240.2 HRS)."*
2. La aplicación aborta la acción, impidiendo iniciar el viaje.
3. Tampoco permite abrir el Report Diario de faena (`tedp_reporte_avance`), rechazando la jornada con error HTTP 422.
4. No se emite la notificación automática por WhatsApp hacia el grupo de operaciones.

---

## 3. Diagnóstico Técnico & Evidencia Empírica

1. **Inspección de Base de Datos (`sch_leangsp_prod`):**
   * En `tequ_equipo`, el equipo `id_equipo = 43` (`TYGC.45-1`) tenía registrado `horometro_chasis_acumulado = '3240.20'`.
   * En `tequ_log_desplazamiento`, el viaje previo (`id_log_desplazamiento = 87`, de fecha 16-nov 03:53 UTC) se registró con `horometro_inicial = 3240.20` y `horometro_final = 3240.20`.
   * Sin embargo, la evidencia fotográfica del tablero capturada por el operador acreditaba un valor físico real de **2.522 HRS**.
2. **Revisión de Código y Causa Raíz (`REQ-1143` incompleto):**
   * En la implementación anterior de `REQ-1143` (commit `5f54475`), se deshabilitó el bloqueo bloqueante **exclusivamente para el Odómetro (KM)** tanto en `ViajeConductor.vue` como en `viajeModel.js` y `reportDiarioController.js`.
   * El **Horómetro (HRS)** quedó con el bloqueo activo (`alert(...) + return` en frontend, `throw new Error(...)` en `viajeModel.js` y `res.status(422)` en `reportDiarioController.js`).
3. **Estado del Servicio WhatsApp:**
   * Se constató que el microservicio Baileys en el puerto 3085 estaba 100% online y conectado (`connected: true`). La falta de mensajes se debió exclusivamente a que la PWA en el teléfono del chofer abortaba la ejecución antes de enviar la petición POST al servidor.

---

## 4. Causa Raíz de Arquitectura

El software asumía de forma estricta que los horómetros nunca pueden ser menores al registro previo acumulado en base de datos. Ante cualquier error de digitación anterior, desfase de carga inicial o cambio de horómetro físico en taller, el sistema bloqueaba en seco al operador en terreno (`fail-closed`), impidiendo registrar viajes y reportes.

---

## 5. Plan de Mitigación y Resolución

1. **Saneamiento Inmediato de Base de Datos en PROD:**
   * Actualizado `tequ_equipo` para `id_equipo = 43` dejando `horometro_chasis_acumulado = 2520.00`.
   * Actualizado `tequ_log_desplazamiento` (`id_log = 87`) dejando `horometro_inicial = 2520.00` y `horometro_final = 2520.00`.
2. **Hotfix Quirúrgico en Backend de PROD (`/home/nodeadmin/proyectos/lean-services-gsp-prod/src`):**
   * En `src/models/viajeModel.js` (salida y llegada) se sustituyó el `throw new Error(...)` por un `console.warn(...)` bajo la directriz de `REQ-1143`.
   * En `src/controllers/reportDiarioController.js` (inicio y término) se sustituyó el `res.status(422)` por un `console.warn(...)`.
   * Reiniciado el proceso PM2 ID 13 (`lean-services-gsp-prod`) de forma exitosa.
3. **Compilación Limpia y Despliegue Formal de Versión PWA v1.0.66 en PROD:**
   * Aislado el código de producción en un worktree limpio a partir de `v1.0.65`.
   * Incrementada la versión en `package.json` a `1.0.66`.
   * Compilado con 0 errores (`vue-cli-service build`) y empaquetado en `/var/www/html/pwa-gsp-prod/`.
   * Verificada la versión `1.0.66` activa en producción y registrada en `RELEASE_LOG.md`.
4. **Sincronización en Rama de DEV (`feature/spec130-remediacion-estructural`):**
   * Modificados `viajeModel.js`, `reportDiarioController.js`, `ViajeConductor.vue`, `ReportDiarioIzaje.vue` y `package.json` (a `1.0.66`) para que la regla flexible permanezca integrada en las futuras versiones.

---

## 6. Protocolo de Respuesta y Guía al Usuario / Operador

* Indicar al operador que ingrese a la PWA, digite las 2.522 horas y presione **"INICIAR VIAJE (SALIDA DE BASE)"**.
* El viaje se registrará de inmediato, se emitirá la notificación de WhatsApp al equipo de operaciones y se habilitará la apertura del Report Diario sin ninguna traba.

---

## 7. Lecciones Aprendidas y Acciones Preventivas

* Toda regla de flexibilidad operativa aprobada para el odómetro (`REQ-1143`) debe abarcar simétricamente el horómetro tanto en salida/llegada de viaje como en inicio/cierre de report diario.
* El bloqueo en frontend (`alert`) nunca debe impedir la captura de datos en terreno; la consistencia debe alertarse mediante avisos no-bloqueantes (`console.warn` / snackbar informativo) para no paralizar la faena del cliente.
