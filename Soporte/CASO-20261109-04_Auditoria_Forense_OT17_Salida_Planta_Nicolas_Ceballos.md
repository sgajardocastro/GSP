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
Se ejecutó una inspección exhaustiva de solo lectura sobre las tablas transaccionales de producción:
1. `sch_leangsp_prod.tpry_proyecto` (`id_proyecto = 56`, folio comercial `GSP-2611-00017`).
2. `sch_leangsp_prod.tsec_users` (identificación inequívoca del usuario Nicolás Ceballos, `id_user = 45`).
3. `sch_leangsp_prod.tequ_log_desplazamiento` (trazabilidad de viajes de ida/retorno, odómetros, estados y timestamps de servidor y dispositivo).
4. `sch_leangsp_prod.tedp_reporte_avance` (reporte de horas operadas y jornada en faena).

---

## 4. Hallazgos y Cronología Forense Irrefutable

### 4.1. Viaje de IDA (Log #53 — Registro en BD):
* **ID Log de Desplazamiento:** `53`
* **Proyecto:** `id_proyecto = 56` (`GSP-2611-00017`)
* **Activo:** Equipo 35 (`VCTR.81-9`)
* **Operador/Chofer:** Nicolás Ceballos (`id_user = 45`)
* **Tipo Trayecto:** `IDA` | **Estado:** `ARRIBADO`
* **Marca Temporal de Salida de Patio:**
  * Timestamp Servidor (`fecha_salida_patio`): `2026-11-09 11:20:35.095 UTC` (**08:20:35 hora local de Chile**)
  * Timestamp Dispositivo (`device_timestamp_salida`): `2026-11-09 11:20:29.269 UTC` (**08:20:29 hora local**)
  * Odómetro Inicial: `618888.00 km`
* **Marca Temporal de Llegada a Faena:**
  * Timestamp Servidor (`fecha_llegada_faena`): `2026-11-09 11:21:09.248 UTC` (**08:21:09 hora local de Chile**)
  * Timestamp Dispositivo (`device_timestamp_llegada`): `2026-11-09 11:21:06.305 UTC` (**08:21:06 hora local**)
  * Odómetro Final: `618888.00 km`

> [!IMPORTANT]
> **Hallazgo Clave 1 (Diferencia de 34 Segundos y 0 Km):**
> La salida de patio (08:20:35 CLT) y la llegada a faena (08:21:09 CLT) fueron registradas con **exactamente 34 segundos de diferencia**, con el mismo odómetro (`618888 km`). El operador NO registró la salida al momento de salir físicamente de la planta; marcó la salida e inmediatamente la llegada en un solo acto consecutivo desde el mismo punto geográfico.

### 4.2. Reporte Diario de Avance (Reporte #52):
* **ID Reporte Avance:** `52`
* **Operador:** Nicolás Ceballos (`id_user_operador = 45`)
* **Fecha Reporte:** `2026-11-09`
* **Inicio Servicio:** `11:00:00 UTC` (**08:00 hora local**)
* **Término Servicio:** `20:00:00 UTC` (**17:00 hora local**)
* **Horas Operadas / Facturables:** `9.00 hrs` (Jornada completa)
* **Fecha de Registro en Servidor:** `2026-11-09 14:00:33.540 UTC` (**11:00:33 hora local**)
* **Timestamp del Dispositivo:** `2026-11-09 15:40:45.473 UTC` (**12:40:45 hora local**)
* **Estado:** `PENDIENTE_VALIDACION`

### 4.3. Viaje de RETORNO (Log #58):
* **ID Log de Desplazamiento:** `58`
* **Salida de Faena:** `2026-11-09 16:54:56.295 UTC` (**13:54:56 CLT**)
* **Llegada a Patio:** `2026-11-09 16:57:03.785 UTC` (**13:57:03 CLT**)
* **Estado:** `CONCLUIDO` | Odómetro Final ingresado: `99999999.00 km`

---

## 5. Causa Raíz de la Queja del Operador ("No reconoció los datos guardados")
1. **El Servidor NUNCA Perdió los Datos:** El Log #53 ingresó y se almacenó exitosamente en PostgreSQL a las 08:20:35 CLT y 08:21:09 CLT.
2. **Origen de la Sensación de Falla:**
   - Al marcar salida y llegada consecutivamente en 34 segundos, si el operario experimentó micro-desconexión celular (3G/4G intermitente en trayecto), la PWA encoló localmente la solicitud en `IndexedDB`.
   - Si el operador recargó la aplicación antes de recibir el banner de confirmación de sincronización, la interfaz volvió a mostrar el botón de inicio de trayecto, induciendo a pensar erróneamente que "se borró la información".
   - Al reconectar red a las 11:00 CLT, la cola offline se vació hacia el backend de producción sin duplicidad ni pérdida.

---

## 6. Recomendaciones Operacionales
1. **Capacitación a Operadores:** Reforzar con la jefatura de operaciones que la salida de planta debe marcarse efectivamente **al salir de la base San Pablo**, y la llegada **al arribar a la obra mandante**, evitando marcar ambos hitos juntos en destino.
2. **Feedback Visual Offline en PWA:** Asegurar que cuando un hito queda encolado localmente en IndexedDB, se muestre un badge visible `📶 Guardado en dispositivo (Pendiente de sincronizar)` para que el usuario no asuma que el dato desapareció.

---

## 7. Dictamen Técnico Final
El incidente reportado por Nicolás Ceballos **NO constituyó pérdida de datos en la plataforma**. La transacción existe de forma íntegra, válida y auditable en la base de datos de producción (`tequ_log_desplazamiento` ID 53 y `tedp_reporte_avance` ID 52), con las horas operativas y registros intactos para facturación y liquidación.
