# CASO-20261113-04: Depuración de Asignación Residual de Grúa TLXF.37-9 y Operador Claudio Gallardo en Negocio 00028 (Planta Comasa Lautaro)

## 1. Ficha del Incidente
- **ID del Caso:** `CASO-20261113-04`
- **Fecha / Hora:** `2026-11-13 15:30 CLT` (Resuelto y certificado a las `15:46 CLT`)
- **Operador / Usuario Afectado:** Sergio Gajardo (`id_user = 55`, Dirección) / Yiara Mendoza (`id_user = 65`, Control de Gestión)
- **Negocio / OT:** Negocio `00028` (`GSP-2611-00028`, `id_proyecto = 74`) — PLANTA COMASA LAUTARO (Cliente: J&J MAESJA SPA)
- **Equipos Involucrados:** 
  - Grúa Telescópica 70 Ton `SKYJ.61-8` (Liebherr LTM-1070, ID 40 - Equipo Real y Definitivo)
  - Vehículo de Apoyo y Escolta `RKVZ-61-0` (Maxus T60, ID 86)
  - Grúa Telescópica `TLXF.37-9` (Liebherr LTM-1070, ID 39 - Asignación residual previa a eliminar)
- **Personal Involucrado:**
  - Héctor Beltrán (`id_user = 33`, Operador Grúa Real)
  - José Arriagada (`id_user = 38`, Rigger Real)
  - Luis Mercado (`id_user = 40`, Chofer Escolta Real)
  - Claudio Gallardo (`id_user = 62`, Conductor asignado residualmente en borrador inicial)
- **Ambiente:** Producción (`PROD` — `sch_leangsp_prod`)
- **Severidad:** **Media-Alta** (generación errónea de jornadas fantasma en ITS e interferencia en validación de horas)

---

## 2. Síntoma Reportado por Terreno / Administración
Al ingresar a la Sección 2 (Control de Flota y Validación de Horas) del Informe de Término de Servicio (ITS) en el Negocio 00028, se requería que el ITS estuviese conformado exclusivamente por las 3 jornadas reales del servicio operado el 12 de noviembre de 2026:
1. Grúa `SKYJ.61-8` — Flete Ida y Retorno: $600.000 (TRASLADO).
2. Grúa `SKYJ.61-8` — 9 horas operadas a $130.000: $1.170.000 (`REP-74-84`).
3. Camioneta `RKVZ-61-0` — Flete Ida y Retorno: $0 (`VIAJE-74-76`).
Total facturable esperado: **$1.770.000**.

Sin embargo, el sistema arrastraba indebidamente referencias a la grúa `TLXF.37-9` y al chofer/operador `Claudio Gallardo`, agregando una 4ta fila fantasma de viaje (`VIAJE-74-67`) y listando a Claudio Gallardo en la tripulación operativa del ITS y en los filtros de patio de Torre de Control.

---

## 3. Diagnóstico Técnico & Evidencia Empírica
1. **Inspección de Desplazamientos (`sch_leangsp_prod.tequ_log_desplazamiento`):**
   - Existía el registro residual `id_log_desplazamiento = 67` vinculado al proyecto 74 con `id_equipo = 39` (`TLXF.37-9`), `id_user_chofer = 62` (`Claudio Gallardo`) y todas sus marcas temporales (`fecha_programada`, `fecha_salida_patio`, etc.) en `NULL`.
   - `itsController.js` escanea los desplazamientos del proyecto para construir la grilla de viajes y flota de apoyo. Al encontrar este registro borrador, lo insertaba automáticamente como una 4ta jornada activa (`VIAJE-74-67`) con patente `TLXF.37-9` y sumaba a Claudio Gallardo al mapa de personal asignado.
2. **Inspección de Preparación de Patio (`sch_leangsp_prod.tpry_proyecto.json_field`):**
   - En `json_field->'ejecucion_v1'->'preparacion_salida'->'inspecciones_patio'` persistía la clave `"39"` con `operador_id = 62` y `jefe_patio_id = 62`.
   - En Torre de Control (`Torre.vue`), la condición `ej.preparacion_salida.inspecciones_patio[String(idEq)]` provocaba que la grúa `TLXF.37-9` siguiera enlazada como equipo en patio del proyecto.
3. **Inspección de Jornadas Reales en Base de Datos (`sch_leangsp_prod.tits_jornada_detalle`):**
   - Las 3 jornadas activas reales (IDs 120, 121 y 122) registraban estrictamente a `SKYJ.61-8` y `RKVZ-61-0` con un total de $1.770.000.

---

## 4. Causa Raíz de Arquitectura (Software / State Machine / Datos)
Persistencia de registros de desplazamiento en borrador con marcas temporales nulas en `tequ_log_desplazamiento` y de claves huérfanas en el JSON de inspección de patio al reasignar equipos en etapas previas a la ejecución, sin un mecanismo automático de purga de recursos descartados.

---

## 5. Plan de Mitigación y Resolución
1. **Depuración de Desplazamiento Fantasma:**
   Ejecución transaccional de eliminación en `sch_leangsp_prod.tequ_log_desplazamiento` del registro `id_log_desplazamiento = 67`.
2. **Saneamiento de Preparación de Salida en Proyecto:**
   Eliminación de la clave `"39"` de `inspecciones_patio` en `tpry_proyecto.json_field` mediante `jsonb_set` y el operador `- '39'`.
3. **Verificación Directa en API de Producción:**
   - Consulta a `GET /api/operaciones/its/74`:
     - Asignación de Equipos: 2 equipos exclusivos (`SKYJ.61-8` y `RKVZ-61-0`).
     - Asignación de Personal: 3 personas exclusivas (Héctor Beltrán, José Arriagada y Luis Mercado).
     - Jornadas: Exactamente 3 filas correspondientes al flete y faena de la grúa y camioneta escolta.
   - Consulta a `GET /api/operaciones/its/preview-pdf/74`:
     - Generación de PDF oficial: **HTTP 200 OK (141.330 bytes)**.
     - Extracción cruda con `pdftotext`: 0 menciones de `TLXF` y 0 menciones de `Gallardo`.

---

## 6. Verificación & Certificación
- Grúa `TLXF.37-9` y conductor `Claudio Gallardo` completamente erradicados del proyecto 74.
- ITS consolidado y listo para generar/emitir con los datos exactos solicitados:
  - Flete $600.000
  - Faena 9 hrs $1.170.000
  - Total $1.770.000
- PDF del ITS previsualizado y validado en producción.

---

## 7. Medida de Prevención y Aprendizaje Continuo
Incorporar en el flujo de reasignación de recursos en CRM/Operaciones la eliminación en cascada de desplazamientos huérfanos con timestamps nulos cuando el usuario desasigna un equipo o cambia la tripulación en etapas previas al despacho.
