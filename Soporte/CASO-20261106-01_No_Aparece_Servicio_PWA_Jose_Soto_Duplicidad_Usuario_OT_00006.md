# CASO-20261106-01: Servicio No Aparece en PWA a José Soto por Duplicidad de Identidad de Usuario (Enrolamiento FES vs Cuenta Corporativa OT)

---

## 1. Ficha del Incidente

- **ID del Caso:** `CASO-20261106-01`
- **Fecha / Hora:** 2026-11-06 12:40:00 (Hora Chile)
- **Operador / Usuario Afectado:** José Horacio Soto Jofré / Soto Cofré
  - Cuenta enrolada hoy en PWA: `josesotojofre1@gmail.com` (`id_user = 100`, RUT `120573179`)
  - Cuenta previa en OT: `jose.soto@arriendosanpablo.cl` (`id_user = 39`, RUT `12057317-9`)
- **Negocio / OT:** `GSP-2611-00006` (Versión 8, Proyecto `id_proyecto = 35`), Mandante: *CONSTRUCTORA INARCO S.A.*, Obra: *624 TALLERES Y COCHERAS TRENES*.
- **Equipo Involucrado:** Grúa Telescópica 70 Ton, Patente `VPSR.26-1` (`id_equipo = 42`).
- **Ambiente:** Producción (`PROD`).
- **Severidad:** Crítica (Bloqueo en terreno: el operador no puede registrar ni cerrar el Report Diario del Día 5).
- **Estado:** `RESUELTO Y NORMALIZADO EN PRODUCCIÓN`

---

## 2. Síntoma Reportado por Terreno

Operaciones de Grúas San Pablo reporta que el operador **José Soto** ingresa a la aplicación móvil (PWA) en su teléfono Android y no le aparece el servicio asignado de la OT `GSP-2611-00006` en la pantalla de *Operación* (`/surveys`). El contador de reports pendientes indica "Al Día" o "0 Pendientes" en lugar de mostrar la tarjeta del servicio en curso para el llenado del Report Diario.

---

## 3. Diagnóstico Técnico & Evidencia Empírica

1. **Inspección de Logs de Acceso Nginx en Producción:**
   Se revisó la IP móvil del operador (`191.126.179.162`) durante la mañana del 06/11/2026:
   ```text
   191.126.179.162 - - [06/Nov/2026:09:24:34 -0300] "GET /lg-gsp-prod/enrolamiento?email=josesotojofre1%40gmail.com&rut=120573179 HTTP/2.0" 200
   191.126.179.162 - - [06/Nov/2026:09:25:30 -0300] "POST /lg-gsp-prod/api/auth/login-google HTTP/2.0" 200
   191.126.179.162 - - [06/Nov/2026:09:27:53 -0300] "POST /lg-gsp-prod/api/survey/consentimiento-enrolamiento?_id_empresa=9 HTTP/2.0" 200
   191.126.179.162 - - [06/Nov/2026:12:19:26 -0300] "GET /lg-gsp-prod/api/reports/usuario/pendientes?id_user=100 HTTP/2.0" 304 0
   ```
   **Evidencia:** El teléfono del operador tiene iniciada sesión con `id_user = 100` (`josesotojofre1@gmail.com`).

2. **Inspección de Registros de Usuario en `sch_leangsp_prod.tsec_users`:**
   Existen dos registros en base de datos para la misma persona natural:
   - `id_user = 39`: `jose.soto@arriendosanpablo.cl`, RUT `12057317-9`, rol `USR-CONSENT` (sin rol `GSP_EJEC`, sin hash FES).
   - `id_user = 100`: `josesotojofre1@gmail.com`, RUT `120573179`, roles `USR-CONSENT` y `GSP_EJEC`, con hash PIN FES generado hoy a las 09:22 hrs.

3. **Inspección de la OT `GSP-2611-00006` (Proyecto 35):**
   - En `json_field->'ejecucion_v1'->'operador_id'` figuraba `'39'`.
   - En `tpry_rel_persona` figuraba `id_user = 39`.
   - En `tequ_log_desplazamiento` figuraba `id_user_chofer = 39`.
   - En `tedp_reporte_avance` los reportes de los días 1, 2, 3, 4 y la jornada activa 40 (Día 5) figuraban con `id_user_operador = 39`.

4. **Simulación del Endpoint `/reports/usuario/pendientes`:**
   - Con `id_user = 100`: Retornaba `pendientes: []` (0 resultados).
   - Con `id_user = 39`: Retornaba 1 pendiente correspondiente al proyecto 35 (`GSP-2611-00006`) con jornada en curso `id_reporte_avance = 40`.

---

## 4. Causa Raíz de Arquitectura

El problema se originó por una **desalineación de identidades entre el enrolamiento móvil FES y la asignación comercial/operativa**:
- Hoy en la mañana, para habilitar la firma digital FES del operador, José Soto fue enrolado mediante Google OAuth usando su correo personal `josesotojofre1@gmail.com`, creándose un nuevo registro en `tsec_users` con `id_user = 100`.
- Paralelamente, la OT `GSP-2611-00006` venía planificada y ejecutándose desde el 01/11/2026 vinculada al registro histórico corporativo `jose.soto@arriendosanpablo.cl` (`id_user = 39`).
- La consulta SQL de la PWA filtra estrictamente por `id_user` en el JSON y tablas relacionales (`p.json_field->'ejecucion_v1'->>'operador_id' = :id_user` o `v.id_user_chofer = :id_user` o `ra.id_user_operador = :id_user`), por lo que la aplicación en el celular (autenticada con el ID 100) no encontraba ningún servicio asignado.

---

## 5. Plan de Mitigación y Resolución

Se ejecutó una transacción atómica en `sch_leangsp_prod` para migrar integralmente las asignaciones hacia la cuenta activa del operador (`id_user = 100`):

```sql
BEGIN;

-- 1. Actualizar reportes de avance existentes (Días 1 al 4 y Jornada en curso Día 5)
UPDATE sch_leangsp_prod.tedp_reporte_avance
SET id_user_operador = 100
WHERE id_proyecto = 35 AND id_user_operador = 39;

-- 2. Actualizar relación de dotación humana de la faena
UPDATE sch_leangsp_prod.tpry_rel_persona
SET id_user = 100
WHERE id_proyecto = 35 AND id_user = 39;

-- 3. Actualizar registro de desplazamiento / viaje
UPDATE sch_leangsp_prod.tequ_log_desplazamiento
SET id_user_chofer = 100
WHERE id_proyecto = 35 AND id_user_chofer = 39;

-- 4. Actualizar asignación del operador en el json_field de la OT
UPDATE sch_leangsp_prod.tpry_proyecto
SET json_field = jsonb_set(
  jsonb_set(
    jsonb_set(
      json_field,
      '{ejecucion_v1,operador_id}',
      '100'::jsonb
    ),
    '{ejecucion_v1,tripulacion_asignada}',
    (
      SELECT jsonb_agg(
        CASE 
          WHEN (elem->>'id_user')::text = '39' THEN jsonb_set(elem, '{id_user}', '100'::jsonb)
          ELSE elem 
        END
      )
      FROM jsonb_array_elements(json_field->'ejecucion_v1'->'tripulacion_asignada') elem
    )
  ),
  '{crm_v1,lineas_servicio}',
  (
    SELECT jsonb_agg(
      CASE 
        WHEN (l->>'operador_asignado_id')::text = '39' THEN jsonb_set(l, '{operador_asignado_id}', '100'::jsonb)
        ELSE l 
      END
    )
    FROM jsonb_array_elements(json_field->'crm_v1'->'lineas_servicio') l
  )
)
WHERE id_proyecto = 35;

-- 5. Consolidar cuenta activa e inactivar cuenta duplicada
UPDATE sch_leangsp_prod.tsec_users
SET email_alternativo = 'jose.soto@arriendosanpablo.cl'
WHERE id_user = 100;

UPDATE sch_leangsp_prod.tsec_users
SET activo = false
WHERE id_user = 39;

COMMIT;
```

### Verificación Empírica Post-Migración:
Al consultar nuevamente `getReportsPendientesUsuario(100)`:
```json
{
  "status": 200,
  "body": {
    "success": true,
    "pendientes": [
      {
        "id_proyecto": 35,
        "codi_proyecto": "GSP-2611-00006",
        "nombre_proyecto": "624 TALLERES Y COCHERAS TRENES",
        "cliente_nombre": "CONSTRUCTORA INARCO S.A.",
        "id_equipo": 42,
        "patente": "VPSR.26-1",
        "total_dias": 30,
        "dias_reportados": 4,
        "dia_a_reportar": 5,
        "reportado_hoy": false,
        "jornada_en_curso": true,
        "id_reporte_avance_activo": "40",
        "puede_reportar": true,
        "motivo": "JORNADA_EN_CURSO"
      }
    ],
    "total_pendientes": 1
  }
}
```

---

## 6. Protocolo de Respuesta y Guía al Usuario / Operador

> *"Estimado José Soto: Tu servicio de la grúa VPSR.26-1 (OT GSP-2611-00006 en Constructora Inarco) ya se encuentra activo y visible en tu aplicación. Para visualizarlo, únicamente debes abrir la app o deslizar la pantalla hacia abajo para refrescar. Encontrarás tu jornada del Día 5 en curso lista para registrar el horario de término y firmar el reporte diario con tu PIN de firma electrónica."*

---

## 7. Lecciones Aprendidas y Acciones Preventivas

1. **Unificación Previa por RUT en Enrolamiento:**
   Cuando un usuario se enrola con Google OAuth y aporta un RUT que ya existe en `tsec_users` (normalizando guiones y puntos), el flujo debe fusionar o actualizar la cuenta existente en vez de crear un `id_user` nuevo disociado de las asignaciones operativas en curso.
2. **Depuración de Cuentas Huérfanas:**
   Al inactivar la cuenta antigua (`id_user = 39`), los coordinadores y despachadores en la consola web ya no podrán asignarla por error en futuras órdenes de trabajo.
