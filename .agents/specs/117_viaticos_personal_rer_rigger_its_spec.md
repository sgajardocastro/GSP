# SPEC-117 / REQ-1128: Inclusión de Viáticos para Personal RER y Riggers en el ITS

---

## 1. Identificación y Estado

- **Código Requerimiento:** `REQ-1128`
- **Código Especificación:** `SPEC-117`
- **Fecha:** 2026-11-07
- **Autor / Arquitectura:** Antigravity / LeanGlobal
- **Ambientes:** Desarrollo (`DEV`) y Producción (`PROD`)
- **Impacto Backend:** `ejecucion/backend_remoto/src/controllers/itsController.js`, `ejecucion/backend_remoto/src/services/tarifasOperadorService.js`
- **Impacto Base de Datos:** `sch_leangsp_prod.tedp_reporte_avance`, `sch_leangsp_prod.tits_costo_item`
- **Estado:** `PROPUESTA FORMAL / PENDIENTE DE APROBACIÓN DE DIFF`

---

## 2. Definición del Problema & Congruencia Operacional

### 2.1. Síntoma Detectado (Caso OT 06 Inarco / José Soto y Alfonso Maldonado)
Durante la revisión ejecutiva de los Informes de Trabajo de Servicio (ITS) con Alfonso Porperrello (PM de GSP):
- En la Orden de Trabajo N° 06 (Inarco, `id_proyecto = 35`, `GSP-2611-00006`), la tripulación en terreno estuvo compuesta por:
  - **Operador:** José Soto (`id_user = 22`).
  - **Rigger / RER:** Alfonso Maldonado (`id_user = 21`).
- En la Sección 4 del ITS (*Detalle de Costos Operacionales Imputados - Viáticos de Alimentación*), el sistema liquidó y mostró únicamente al operador José Soto ($8.000 por 9 horas), **omitiendo completamente al Rigger Alfonso Maldonado** o arrojando $0.
- Esto generó una distorsión en la liquidación real de costos del servicio y en el cálculo de viáticos que deben transferirse al personal.

### 2.2. Mandato Operacional
> *"Sergio Gajardo reconoció que había extrapolado incorrectamente la exclusión de horas del operador RER a los viáticos, comprometiéndose a corregir la condición para que el personal RER también reciba el pago correspondiente de viáticos."* (Minuta Ejecutiva 2026-11-07).

---

## 3. Causa Raíz de Arquitectura

1. **Pérdida de Identidad del Rigger en `tedp_reporte_avance`:**
   En algunos reportes diarios emitidos desde la PWA, la columna relacional `ra.id_user_rigger` quedó en `NULL`, a pesar de que el rigger estaba registrado en el objeto JSON estructurado `ra.json_field.ejecucion_v1.tripulacion_asignada` o en el proyecto.
2. **Evaluación de `tarifaSug` y Viático en `itsController.js`:**
   En `itsController.js:95-97`, el código estipula:
   ```javascript
   const esRigger = pers.rol_personal === 'RIGGER';
   const tarifaSug = esRigger ? 0 : (liqRep?.tarifa_sugerida || tarifaComercialOperador);
   ```
   Esta exclusión de tarifa por hora es correcta para el *Costo Valor Hora Operador* (ya que el rigger se liquida por sueldo base o modalidad diferenciada de faena), pero en las líneas 193-201, si `liqRep.monto_viatico_rigger` venía en `0` o no definido, se transfería un valor en cero sin ejecutar el fallback tabular `calcularViaticoAlimentacionDia`.
3. **Desconexión con Escala Tabular de Viáticos:**
   Todo personal en terreno (Operador principal, Rigger, Chofer de escolta o RER) que cumpla jornada efectiva devenga viático de alimentación idéntico según la escala:
   - `< 8` horas efectivas: `$0`.
   - `8` horas efectivas: `$7.000`.
   - `+1` hora adicional sobre 8: `+$1.000` por hora (ej. 9 horas = `$8.000`).
   - Tope máximo diario: `$18.000`.

---

## 4. Especificación Canónica de la Solución

### 4.1. Respaldo Dinámico (Fallback) de Tripulación en `itsController.js`
Al consultar los reportes de avance diarios de la OT, si `ra.id_user_rigger` es nulo:
- Buscar en `ra.json_field.ejecucion_v1.tripulacion_asignada` el miembro con cargo o rol `RIGGER` o `RER`.
- Si existe, asignar su `id_user` y nombre completo a `mov.id_user_rigger` y `mov.nombre_rigger`.

### 4.2. Inclusión Determinista en Matriz de Viáticos
En la función constructora de filas de viáticos:
- Crear siempre el registro para todo personal con rol `RIGGER` o `RER` presente en la jornada.
- Si no existe override manual de Yiara, calcular `monto_viatico` llamando obligatoriamente a `calcularViaticoAlimentacionDia` con las horas de la jornada.

### 4.3. Datafix en Base de Datos (Caso OT 35 / Inarco)
- Corregir en `sch_leangsp_prod.tedp_reporte_avance` para `id_proyecto = 35` los registros donde Alfonso Maldonado participó como Rigger, asignando `id_user_rigger = 21`.
- Regenerar el dataset del ITS de OT 35 en `sch_leangsp_prod.tits_costo_item` para que Alfonso Maldonado figure con su viático correspondiente ($8.000).

---

## 5. Criterios de Aceptación (QA Determinista)

1. En el ITS de OT 06 (Inarco `id_proyecto = 35`), la Sección 4 debe listar dos ítems de viático:
   - José Soto (Operador): `$8.000`.
   - Alfonso Maldonado (Rigger): `$8.000`.
2. Total Viáticos de Alimentación = `$16.000`.
3. El PDF oficial generado y el Resumen Económico reflejan `$16.000` en la categoría 1 de costos directos (Viáticos Alimentación).
