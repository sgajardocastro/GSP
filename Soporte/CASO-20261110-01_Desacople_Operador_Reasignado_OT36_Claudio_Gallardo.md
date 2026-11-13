# CASO-20261110-01: Desacople de Operador Previo Reasignado en OT 36 (`GSP-2611-00007`) — Claudio Gallardo a Ernesto Ríos

- **Fecha del Incidente:** 10 de Noviembre de 2026
- **Entorno Afectado:** Producción (`https://servidor.leanglobal.cl/pwa-gsp-prod/` / `sch_leangsp_prod`)
- **Estado:** CERRADO / RESUELTO DE FONDO
- **Requerimiento Asociado:** `REQ-1145` (Minuta Reunión 10-Nov-2026)
- **Componentes Intervenidos:**
  - Backend: `src/controllers/reportDiarioController.js` (`getReportsPendientesUsuario`)
  - Base de Datos: `sch_leangsp_prod.tpry_rel_persona`

---

## 1. Resumen Ejecutivo del Incidente
En el servicio `GSP-2611-00007` (Proyecto ID 36, Planta Ferrero), la tripulación fue reasignada de Claudio Gallardo (`id_user: 62`) a Ernesto Ríos (`id_user: 9`) a partir del 6 de noviembre de 2026. A pesar de que la planificación en la tabla relacional `tpry_rel_persona` registraba el turno de Claudio finalizado el 5 de noviembre y el de Ernesto vigente hasta el 2 de diciembre, la PWA continuaba mostrando la orden de trabajo en la bandeja de reportes pendientes de Claudio Gallardo. Esto le impedía a Claudio iniciar o gestionar nuevos servicios (como su asignación real en el Parque Costanera, OT 34) y generaba desorden operativo en faena.

---

## 2. Síntoma Reportado y Contexto Operacional
- **Reportado por:** Alfonso Porperrello (Product Manager GSP) y Jorge Ponce (Jefe de Operaciones).
- **Impacto Operativo:** El operador Claudio Gallardo ingresaba a la PWA con su cuenta (`claudiogallardo1984@gmail.com`, `id_user: 62`) y le aparecía como pendiente de reporte el servicio `GSP-2611-00007`, bloqueándole la operación regular en terreno.
- **Inconsistencia Detectada:** El relevo físico ya se había consumado y Ernesto Ríos estaba operando el camión pluma en faena, pero el sistema no liberaba al operador anterior.

---

## 3. Diagnóstico Forense y Causa Raíz
Al auditar el endpoint `/api/operaciones/report/usuario/pendientes` en `reportDiarioController.js`, se identificó que la consulta SQL utilizaba filtros sobre campos JSON históricos y registros pasados de reportes:
1. **Inspección de JSON en vez del modelo relacional:** Se ejecutaba `jsonb_array_elements(p.json_field->'ejecucion_v1'->'tripulacion_asignada')` y `json_field->'crm_v1'->'lineas_servicio'`. Como Claudio Gallardo figuraba en el histórico del turno 1 dentro del JSON, la condición siempre daba verdadera.
2. **Persistencia indebida por reportes históricos:** La cláusula `OR EXISTS (SELECT 1 FROM tedp_reporte_avance ra WHERE ra.id_proyecto = p.id_proyecto AND (ra.id_user_operador = $1))` causaba que cualquier operador que hubiese firmado un reporte en el pasado para esa OT quedara eternamente vinculado como si tuviera la OT pendiente hoy.
3. **Omisión de la vigencia de fechas en `tpry_rel_persona`:** En la tabla relacional `tpry_rel_persona`, Claudio Gallardo tenía `fecha_plan_ini: 2026-11-04`, `fecha_plan_fin: 2026-11-05`, mientras que Ernesto Ríos tenía `fecha_plan_ini: 2026-11-06`, `fecha_plan_fin: 2026-12-02`. El backend no evaluaba `CURRENT_DATE BETWEEN fecha_plan_ini::date AND fecha_plan_fin::date`.

---

## 4. Resolución Estructural Aplicada (4 Niveles)
1. **Nivel 1 (Origen del dato):** La fuente canónica de asignación de personas es la tabla relacional `tpry_rel_persona`, eliminando la dependencia de arreglos JSON desfasados.
2. **Nivel 2 (Lógica intermedia en Backend):** En `reportDiarioController.js` (`getReportsPendientesUsuario`), se reemplazaron las comprobaciones en JSON y reportes históricos por la consulta relacional con vigencia temporal:
   ```sql
   EXISTS (
     SELECT 1 
     FROM tpry_rel_persona rp
     WHERE rp.id_proyecto = p.id_proyecto
       AND rp.id_user = $1
       AND rp.estado_real = 'PROGRAMADO'
       AND (
         (rp.fecha_plan_ini IS NULL AND rp.fecha_plan_fin IS NULL)
         OR CURRENT_DATE BETWEEN rp.fecha_plan_ini::date AND rp.fecha_plan_fin::date
       )
   )
   ```
   Se mantuvo el soporte para traslados en curso (`tequ_log_desplazamiento`) y jornadas abiertas sin cerrar (`tedp_reporte_avance` en estado `JORNADA_EN_CURSO`).
3. **Nivel 3 (Integridad en BD):** Se validó que los registros en `tpry_rel_persona` para la OT 36 reflejan los turnos exactos (ID 24 para Claudio finalizado el 05/11, e ID 19 para Ernesto vigente).
4. **Nivel 4 (Vistas y PWA):** Se añadió la clasificación `TURNO_FINALIZADO` en caso de que una OT no tenga jornada en curso y sus turnos asignados hayan expirado, enviándola a concluidos sin bloquear al operador.

---

## 5. Verificación Empírica y Evidencias de Pruebas
Se ejecutó la prueba directa sobre el endpoint de producción `http://127.0.0.1:3016/api/operaciones/report/usuario/pendientes`:

```json
RESULT_CLAUDIO (id_user: 62):
{
  "status": 200,
  "user": "Claudio Gallardo",
  "id": 62,
  "pendientes": [
    {
      "id": 34,
      "codi": "GSP-2611-00005",
      "motivo": "PENDIENTE"
    }
  ],
  "concluidos": []
}

RESULT_ERNESTO (id_user: 9):
{
  "status": 200,
  "user": "Ernesto Rios",
  "id": 9,
  "pendientes": [
    {
      "id": 36,
      "codi": "GSP-2611-00007",
      "motivo": "JORNADA_EN_CURSO"
    }
  ],
  "concluidos": []
}
```
**Resultado:**
- Claudio Gallardo ya **no** ve la OT 36 (`GSP-2611-00007`) en sus pendientes. Solo tiene su asignación activa (OT 34).
- Ernesto Ríos tiene asignada la OT 36 con su jornada en curso y la ve en su bandeja.

---

## 6. Lecciones Aprendidas y Medidas de Blindaje
- **Principio Spec-Driven:** Las asignaciones de personas deben consultarse siempre desde la tabla relacional `tpry_rel_persona` y no desde campos JSON desnormalizados (`tripulacion_asignada`), evitando divergencias entre la planificación y la ejecución.
- **Idempotencia de Turnos:** Ningún operador debe quedar atrapado en una orden por haber firmado un reporte previo si su turno planificado ya expiró.

---

## 7. Trazabilidad y Referencias Cruzadas
- **Minuta:** [20261110-Reunión-Prioridades-del-Día-Alfonso-Sergio.md](file:///d:/SGajardo/Google%20Drive/Antigravity/Grúas%20San%20Pablo/Propuesta%20Gestión%20Operación%20Grúas/antecedentes_reuniones/reuniones/20261110-Reunión-Prioridades-del-Día-Alfonso-Sergio.md)
- **Backlog:** `REQ-1145` en [Gestión/tareas.md](file:///d:/SGajardo/Google%20Drive/Antigravity/Grúas%20San%20Pablo/Propuesta%20Gestión%20Operación%20Grúas/Gestión/tareas.md)
- **Código:** [`src/controllers/reportDiarioController.js`](file:///d:/SGajardo/Google%20Drive/Antigravity/Grúas%20San%20Pablo/Propuesta%20Gestión%20Operación%20Grúas/ejecucion/backend_remoto/src/controllers/reportDiarioController.js)
