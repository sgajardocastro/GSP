# 🛠️ Ficha Técnica de Soporte Operacional: CASO-20261103-03

---

## 1. Ficha del Incidente

| Atributo | Detalle |
| :--- | :--- |
| **ID del Caso** | `CASO-20261103-03` |
| **Fecha / Hora de Reporte** | `2026-11-03 15:25:00 (-03:00)` |
| **Usuaria Reportante** | **Yiara Mendoza** (`id_user = 65` — Analista de Control de Gestión / PMO) |
| **Operador Asignado** | **Omar Patricio Fuentes** (`id_user = 97`) |
| **Negocio / OT** | **`GSP-2611-00004`** (`id_proyecto = 33`) — Cliente: **METTCO SPA** (`PLANTA FERRERO - FUNDO CARACAS`) |
| **Equipo Involucrado** | Camión Pluma **VOLKSWAGEN CONSTELLATION 32.360 DC 4580 MM AZ12 8X4** (`TRPS.20-8`, `id_equipo = 57`) |
| **Ambiente** | Producción (`PROD` — `sch_leangsp_prod`) & Desarrollo (`DEV` — `sch_leangsp`) |
| **Severidad** | **Alta** (Contaminación cruzada de reportes multi-día al digitar en orden no secuencial, cierre prematuro de jornada en curso y carencia de adjuntos documentales por día) |
| **Requerimiento Asociado** | `REQ-1099` / `SPEC-057 v1.3` / Release `v1.0.186` |

---

## 2. Síntoma Reportado por Control de Gestión (PMO)

La analista de Control de Gestión (**Yiara Mendoza**) reportó por correo electrónico tres observaciones al realizar el control manual en la Matriz PMO (`ControlOperativoVivo.vue`) para el servicio **`METTCO SPA` (`GSP-2611-00004`)**:

1. **Ausencia de botón para adjuntar documentos o fotos asociadas al día:**
   > *"En la sección donde registro los horarios de inicio/termino de la jornada no aparece un botón para adjuntar el report fisico. Tampoco aparece este botón al pinchar en 'Report dia X' para que quede todo asociado al día en cuestión, igualmente solicito que este boton no sea UNICAMENTE PARA EL REPORT, que solo sea un 'adjuntar documento' para adjuntar cualquier documento o foto de situaciones que puedan ocurrir durante el desarrollo de un servicio."*
2. **Cierre automático del control del día en curso (`03.11`) e imposibilidad de dejar término vacío (`--:--`):**
   > *"Primero registré el día de ayer 02.11 completo... Después de esto sucedieron 2 cosas: quise registrar el día 3.11 (hoy) y al ingresar la hora de inicio se cerró el control completo con el horario en que estaba realizando el registro (12:39). Luego quise editar y dejar el espacio de término vacío porque el servicio está en ejecución y no me permite guardar de esta forma (--:--), por lo que lo dejé en '00:00'."*
3. **Cruce de datos al ingresar retroactivamente el Día 1 (`29.10`):**
   > *"Luego quise ingresar los controles del día 29.10 (día 1) y viene pegado todo lo que registré en el día 2.11: horas facturables, sobretiempo, viatico etc."*

---

## 3. Diagnóstico Técnico & Evidencia Empírica

Al inspeccionar los registros de `sch_leangsp_prod.tedp_reporte_avance` y `tpry_proyecto.json_field` para `id_proyecto = 33` (`GSP-2611-00004`):

- **`id_reporte_avance = 3` (`fecha_reporte = 2026-11-02`):** Fue el primer reporte digitado por Yiara, por lo que `MAX(dia_correlativo) + 1` le asignó erróneamente **`dia_correlativo = 1`**, cuando en el calendario laboral de la OT (`29/10 = D1, 30/10 = D2, 02/11 = D3, 03/11 = D4`) el `02/11` corresponde al **Día 3 (`D3`)**.
- **`id_reporte_avance = 8` (`fecha_reporte = 2026-11-03`):** Fue el segundo reporte digitado (`dia_correlativo = 2`), y tenía `control_vivo_overrides['2026-11-03']['57']['REPORT_TERMINO'] = { hora_real: "00:00" }` porque la interfaz no permitía limpiar un hito horario (`--:--`).
- **`id_reporte_avance = 9` (`fecha_reporte = 2026-10-29`):** Fue el tercer reporte digitado (`dia_correlativo = 3`), cuando cronológicamente es el **Día 1 (`D1`)**.

---

## 4. Causa Raíz de Arquitectura (Software / State Machine / Datos)

1. **Correlativo por orden de inserción (`MAX(dia_correlativo) + 1`) y fallback por `dia_correlativo` en vez de fecha:**
   - En `overrideHitoActividad` (`controlVivoController.js`), cuando un reporte se creaba manualmente desde la matriz PMO, `dia_correlativo` se calculaba como `MAX(dia_correlativo) + 1` en lugar de usar la posición real de la fecha en el calendario laboral (`diasHabilesLista`).
   - En `abrirVisorReportDirecto` (`ControlOperativoVivo.vue`), el buscador hacía `r.dia_correlativo === jornada.dia || fRep === jornada.fecha || lista[0]`. Como `id_reporte_avance = 3` (`2026-11-02`) tenía `dia_correlativo = 1`, al hacer clic en `Report D1` (`29/10`, `jornada.dia = 1`), la condición `r.dia_correlativo === 1` hacía match con el reporte del `02/11` antes de evaluar la fecha `2026-10-29`.
2. **Fallback a `rDia.fecha_registro` para `Report término jornada` y bloqueo de input vacío (`!valorEditHito.value`):**
   - En `calcularActividadesDia` (`controlVivoController.js`), `repFinReal` evaluaba `rDia?.fecha_termino_servicio || rDia?.fecha_transmision_termino || rDia?.fecha_registro || rDia?.device_timestamp`. Así, apenas se insertaba el registro en `tedp_reporte_avance` al guardar el inicio de jornada (`12:39`), `rDia.fecha_registro` era distinto de `null` y el hito `Report término jornada` se daba por cerrado con la hora en que se hizo el registro (`12:39`).
   - Además, `guardarHito` en `ControlOperativoVivo.vue` tenía `if (!valorEditHito.value) return;`, impidiendo guardar vacío (`--:--`).
3. **Carencia de gestor documental diario en Matriz PMO y Visor Report:**
   - Ni la cabecera de actividades diarias de `ControlOperativoVivo.vue` ni `ModalVisorReport.vue` contaban con un botón transversal para adjuntar documentos o fotografías asociadas a un día específico (`fecha` / `dia_correlativo`).

---

## 5. Plan de Mitigación y Resolución

1. **Backend (`controlVivoController.js`, `controlVivoRoutes.js`, `reportDiarioController.js`):**
   - Implementación de `calcularDiaCorrelativoCalendario(pryRow, fechaIso)` para asignar `dia_correlativo` según la posición real de la fecha en el calendario laboral de la OT.
   - Emparejamiento estricto por `fecha_reporte_iso === fDia` en `calcularActividadesDia` y eliminación de `rDia?.fecha_registro || rDia?.device_timestamp` en `repFinReal`.
   - Soporte de `limpiar: true` / `hora_real = ''` en `overrideHitoActividad`, eliminando el override en `json_field` y reabriendo la jornada a `JORNADA_EN_CURSO` (`fecha_termino_servicio = NULL`) cuando se limpia `REPORT_TERMINO`.
   - Nuevos endpoints `POST /api/operaciones/control-vivo/adjuntar-documento-dia` y `DELETE /api/operaciones/control-vivo/documento-dia/:id_doc` para almacenar cualquier documento o fotografía por día en `tfmg_file`, `json_field.documentos_por_dia[fecha]` y `tedp_reporte_avance.ajustes_analista.documentos_dia`.
2. **Frontend (`ControlOperativoVivo.vue`, `ModalVisorReport.vue`):**
   - Botón `🗑️` (`Dejar espacio vacío --:--`) en el editor inline de horarios de `ControlOperativoVivo.vue` y botón `🗑️ --:--` en `ModalVisorReport.vue`.
   - Emparejamiento exclusivo por `id_reporte_avance` o `fecha_reporte_iso === jornada.fecha` en `abrirVisorReportDirecto`, sin caer jamás en reportes de otros días.
   - Botón **`📎 Adjuntar Documento`** y tira de documentos/fotos del día tanto en `ControlOperativoVivo.vue` como en `ModalVisorReport.vue`.
3. **Normalización de Datos en Producción (`sch_leangsp_prod` — `id_proyecto = 33`, `GSP-2611-00004`):**
   - `id_reporte_avance = 9` (`2026-10-29`): `dia_correlativo = 1` (`D1`), `id_user_operador = 97` (`OMAR PATRICIO FUENTES`), `10:53 -> 18:00`, `6.12 hrs` operadas (`8.00 hrs` facturables, `0.00 hrs` sobretiempo).
   - `id_reporte_avance = 3` (`2026-11-02`): `dia_correlativo = 3` (`D3`), `id_user_operador = 97` (`OMAR PATRICIO FUENTES`), `08:00 -> 19:30`, `10.50 hrs` operadas (`10.50 hrs` facturables, `2.50 hrs` sobretiempo).
   - `id_reporte_avance = 8` (`2026-11-03`): `dia_correlativo = 4` (`D4`), `id_user_operador = 97` (`OMAR PATRICIO FUENTES`), `08:00 -> NULL` (`--:--`), `estado_reporte = 'JORNADA_EN_CURSO'` y eliminación del override `"00:00"`.

---

## 6. Protocolo de Respuesta y Guía al Usuario

- **Para Yiara Mendoza (Control de Gestión / PMO):**
  1. El servicio **`METTCO SPA` (`GSP-2611-00004`)** ya quedó normalizado en producción:
     - **Día 1 (`29/10`):** Muestra su propio reporte (`10:53 ➔ 18:00`, `8.0 hrs` base sin sobretiempo).
     - **Día 3 (`02/11`):** Conserva su reporte validado (`08:00 ➔ 19:30`, `10.5 hrs`, `+2.5 hrs` sobretiempo y viático).
     - **Día 4 (`03/11`):** Quedó abierto en ejecución (`08:00 ➔ --:--`).
  2. Ahora al ingresar solo la hora de inicio de un día, el término permanece en **`--:--`** (sin cerrarse con la hora actual), y al editar cualquier horario aparece el botón **`🗑️`** para volver a dejarlo vacío (`--:--`).
  3. Tanto en la tarjeta de **Control en Vivo** (junto a `Actividad Planificada • DÍA X`) como dentro del visor **`Report Día X`** está disponible el botón **`📎 Adjuntar Documento`** para subir cualquier documento o fotografía de situaciones ocurridas en ese día.

---

## 7. Lecciones Aprendidas y Acciones Preventivas

- **Regla de Oro de Correlativos Multi-Día:** El número de día (`dia_correlativo`) de un reporte nunca debe depender del orden en que el usuario digite los registros (`MAX + 1`), sino de su posición cronológica en el calendario laboral de la OT (`fecha_reporte_iso`).
- **Separación Estricta entre Timestamp de Auditoría y Término Operativo:** `fecha_registro` y `device_timestamp` son metadatos de creación de fila y jamás deben utilizarse como fallback para `fecha_termino_servicio`.
