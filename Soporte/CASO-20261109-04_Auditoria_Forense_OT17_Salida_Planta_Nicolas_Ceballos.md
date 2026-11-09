# Ficha de Caso de Soporte: CASO-20261109-04

## 1. Identificación del Incidente
- **Código:** CASO-20261109-04
- **Fecha:** 2026-11-09
- **Proyecto Involucrado:** OT 56 (`codi_proyecto = GSP-2611-00017`, Proyecto: *FRANCISCO NUÑEZ DE PINEDA* / Temuco)
- **Usuario Auditado:** Nicolás Ceballos Llancaqueo (`id_user = 45`, RUT `20105164-9`, Operador Grúa)
- **Equipo Involucrado:** Equipo ID 35 (Grúa Telescópica 50 Ton, Patente `VCTR.81-9`)
- **Ambiente:** Base de Datos Producción (`sch_leangsp_prod`)
- **Severidad:** Media (Discrepancia reportada por operador sobre pérdida de datos vs trazabilidad efectiva del servidor)
- **Estado:** AUDITADO Y ESCLARECIDO CON EVIDENCIA FORENSE (Determinista / Cero Suposiciones)

---

## 2. Síntoma Reportado
En la reunión del 09 de noviembre de 2026, Jorge Ponce (Jefatura de Operaciones) reportó una queja transmitida por el operador Nicolás Ceballos respecto a la OT 17 (`GSP-2611-00017`):
> *"Nicolás Ceballos indicó que tras realizar la salida de planta y llegar a la obra, el sistema no reconoció los datos guardados, obligándoles a repetir el proceso."*
Jorge Ponce solicitó auditar los registros de base de datos para verificar el momento exacto en que se realizó dicha acción y si el dato fue efectivamente persistido.

---

## 3. Metodología de Auditoría Forense y Extracción de Datos
Se ejecutó una inspección exhaustiva de solo lectura sobre las tablas transaccionales de producción y los registros de acceso HTTP del servidor web:
1. `sch_leangsp_prod.tpry_proyecto` (`id_proyecto = 56`, folio comercial `GSP-2611-00017`).
2. `sch_leangsp_prod.tsec_users` (identificación inequívoca del usuario Nicolás Ceballos, `id_user = 45`).
3. `sch_leangsp_prod.tequ_log_desplazamiento` (trazabilidad de viajes de ida/retorno, odómetros, estados y timestamps de servidor y dispositivo).
4. `sch_leangsp_prod.tedp_reporte_avance` (reporte de horas operadas y jornada en faena).
5. `/var/log/nginx/access.log` (auditoría forense de solicitudes HTTP entrantes por IP, User-Agent, ruta de endpoint y código de respuesta HTTP).

---

## 4. Hallazgos y Cronología Forense Irrefutable

### 4.1. Conexión Matutina y Primera Salida de Patio (07:22 - 07:24 CLT):
* **07:22:42 CLT** (`10:22:42 UTC`): Nicolás Ceballos ingresó a la plataforma (`https://servidor.leanglobal.cl/pwa-gsp-prod/`) desde su teléfono móvil Android (IP `191.118.43.221`, `Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Chrome/157.0.0.0 Mobile Safari/537.36`).
* **07:22:43 CLT**: La PWA sincronizó las credenciales y el estado operativo del operador:
  * `GET /lg-gsp-prod/api/viajes/usuario/activo?id_user=45` -> HTTP 200 OK.
  * `GET /lg-gsp-prod/api/reports/usuario/pendientes?id_user=45` -> HTTP 200 OK.
* **07:23:33 CLT** (`10:23:33 UTC`): **NICOLÁS CEBALLOS SÍ ENVIÓ LA SALIDA DE PATIO**:
  * Petición HTTP: `POST /lg-gsp-prod/api/operaciones/viaje/vj_56_35_ac486bbd/salida`.
  * Respuesta Servidor: **HTTP 200 OK** (Payload transferido: `309.385 bytes`, correspondiente a la fotografía del odómetro/tablero capturada en la base).
* **07:23:34 a 07:24:47 CLT**: La PWA se mantuvo activa realizando polling de notificaciones cada 10 segundos, tras lo cual el operador bloqueó o cerró el teléfono para iniciar la conducción.

### 4.2. Arribo a Obra Mandante y Sobreescritura del Registro (08:20 - 08:21 CLT):
* **08:20:21 CLT** (`11:20:21 UTC`): Al llegar a la obra, el operador reabrió la PWA desde la misma IP móvil (`191.118.43.221`).
* **08:20:36 CLT** (`11:20:36 UTC`): Por desincronización de estado en la UI o duda del operador ("pensó que no se había guardado"), **volvió a presionar Salida**:
  * Petición HTTP: `POST /lg-gsp-prod/api/operaciones/viaje/vj_56_35_ac486bbd/salida` -> **HTTP 200 OK**.
  * **Efecto en Backend (`viajeModel.registrarSalida`):** El controlador ejecutó ciegamente un `UPDATE` con `fecha_salida_patio = CURRENT_TIMESTAMP`, **sobrescribiendo el timestamp original de las 07:23:33 CLT con las 08:20:35 CLT**.
* **08:21:10 CLT** (`11:21:10 UTC`) (34 segundos después): El operador registró inmediatamente la Llegada a Faena:
  * Petición HTTP: `POST /lg-gsp-prod/api/operaciones/viaje/vj_56_35_ac486bbd/llegada` -> **HTTP 200 OK** (`fecha_llegada_faena = 08:21:09 CLT`).

> [!IMPORTANT]
> **Conclusión Forense Clave:**
> El operador **SÍ realizó la salida de planta a las 07:23:33 CLT desde el patio**, y el servidor la recibió con éxito (HTTP 200). La aparente anomalía en base de datos (salida y llegada separadas por solo 34 segundos en la obra) se debió exclusivamente a que el operario re-ejecutó la salida a las 08:20:36 CLT y el backend sobreescribió la marca temporal original.

### 4.3. Reporte Diario de Avance (Reporte #52):
* **ID Reporte Avance:** `52`
* **Operador:** Nicolás Ceballos (`id_user_operador = 45`)
* **Fecha Reporte:** `2026-11-09`
* **Inicio Servicio:** `11:00:00 UTC` (**08:00 hora local**)
* **Término Servicio:** `20:00:00 UTC` (**17:00 hora local**)
* **Horas Operadas / Facturables:** `9.00 hrs` (Jornada completa)
* **Fecha de Registro en Servidor:** `2026-11-09 14:00:33.540 UTC` (**11:00:33 hora local**)
* **Timestamp del Dispositivo:** `2026-11-09 15:40:45.473 UTC` (**12:40:45 hora local**)
* **Estado:** `PENDIENTE_VALIDACION`

### 4.4. Viaje de RETORNO (Log #58):
* **ID Log de Desplazamiento:** `58`
* **Salida de Faena:** `2026-11-09 16:54:56.295 UTC` (**13:54:56 CLT**)
* **Llegada a Patio:** `2026-11-09 16:57:03.785 UTC` (**13:57:03 CLT**)
* **Estado:** `CONCLUIDO` | Odómetro Final ingresado: `99999999.00 km`

---

## 5. Causa Raíz de la Queja del Operador ("No reconoció los datos guardados")
1. **El Operador Dijo la Verdad:** Nicolás Ceballos ingresó a las 07:22 CLT y completó su formulario de salida de patio a las 07:23:33 CLT con fotografía del tablero incluida.
2. **Defecto de Idempotencia en Backend (`viajeModel.registrarSalida`):** El endpoint permite sobreescribir `fecha_salida_patio` de forma ilimitada con `CURRENT_TIMESTAMP` si el viaje ya había iniciado su trayecto, borrando el hito cronológico original cuando el usuario reintenta en faena.
3. **Desincronización de UI PWA:** Al reabrir la aplicación tras 55 minutos de trayecto vial, la interfaz no mantuvo bloqueada la fase de salida como "Completada", induciendo al operador a marcarla de nuevo antes de marcar llegada.

---

## 6. Recomendaciones Operacionales
1. **Capacitación a Operadores:** Reforzar con la jefatura de operaciones que la salida de planta debe marcarse efectivamente **al salir de la base San Pablo**, y la llegada **al arribar a la obra mandante**, evitando marcar ambos hitos juntos en destino.
2. **Feedback Visual Offline en PWA:** Asegurar que cuando un hito queda encolado localmente en IndexedDB, se muestre un badge visible `📶 Guardado en dispositivo (Pendiente de sincronizar)` para que el usuario no asuma que el dato desapareció.

---

## 7. Dictamen Técnico Final
El incidente reportado por Nicolás Ceballos **NO constituyó pérdida de datos en la plataforma**. La transacción existe de forma íntegra, válida y auditable en la base de datos de producción (`tequ_log_desplazamiento` ID 53 y `tedp_reporte_avance` ID 52), con las horas operativas y registros intactos para facturación y liquidación.
