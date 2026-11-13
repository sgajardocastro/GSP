# 📋 Ficha Canónica de Incidente / Caso de Soporte

## 1. Ficha del Incidente
- **ID del Caso:** `CASO-20261111-02`
- **Fecha / Hora:** 2026-11-11 20:05:00 (-03:00)
- **Operador / Usuario Afectado:** Sergio Gajardo / Yiara Mendoza (Control de Gestión)
- **Negocio / OT:** `GSP-2611-00003` (`id_proyecto = 32`) — Gerardo Barthou (Izaje Contenedor 6m Sector Laguna)
- **Equipo Involucrado:** Liebherr LTM-1090 (`PJYY.20-1`, ID `45`) — Categoría: Grúas Telescópicas
- **Ambiente:** Producción (`PROD`)
- **Severidad:** Alta (Distorsión financiera x8 en carátula y firma digital de Estado de Pago)

---

## 2. Síntoma Reportado por Terreno / Usuario
Al visualizar el servicio `GSP-2611-00003` en la pantalla inicial de Conciliación y Estado de Pago (EDP), el total neto devengado se mostraba correctamente por **$1.000.000** (modalidad "Valor Fijo").
Sin embargo, al hacer clic en el botón verde **`Abrir Carátula EDP / Firmar (3 Pasos)`** para iniciar el circuito de firmas FES:
- La tarjeta de cabecera indicaba: **TOTAL NETO A COBRAR: $8.000.000** (Total Bruto: $9.520.000).
- La fila del servicio indicaba: Tarifa Pactada: $1.000.000, Unidad: Valor Fijo, Cant: 1, **Subtotal Neto: $8.000.000**.
- De firmarse el Paso 1 (FES), el modal persistía en la base de datos PostgreSQL (`tpry_proyecto.json_field.edp_flujo_v1.monto_edp_neto`) el monto inflado de $8.000.000.

---

## 3. Diagnóstico Técnico & Evidencia Empírica
1. **Inspección de Backend (`reportDiarioController.js`):**
   - El endpoint `/api/operaciones/edp/32/resumen` devolvía la estructura canónica correcta:
     - `resumen_financiero.total_neto = 1000000`.
     - `lineas_cotizadas[0].subtotal_calculado = 1000000`.
     - `lineas_cotizadas[0].unidad = "Valor Fijo"`.
2. **Inspección de Frontend (`ModalCaratulaEDP.vue`):**
   - En las líneas 1255–1267 existía una función de cálculo local `calcularSubtotalLinea(linea)`:
     ```javascript
     const calcularSubtotalLinea = (linea) => {
       if (!linea) return 0
       const valUnit = Number(linea.valorUnitario ?? linea.precio_unitario ?? linea.tarifa ?? 0)
       const cant = Number(linea.cantidad ?? 1)
       if (linea.unidad === 'Diario') {
         const diasFaena = Math.max(1, props.edpData?.reports_validados?.length || 1)
         return valUnit * diasFaena * cant
       } else if (linea.tipo?.includes('GRUA')) { // <--- CULPABLE
         const hrs = Number(props.edpData?.resumen_financiero?.horas_facturables_totales) || (cant * 8)
         return valUnit * hrs
       }
       return valUnit * cant
     }
     ```
   - Al coincidir `linea.tipo = "GRUAS TELESCOPICAS"` con `linea.tipo?.includes('GRUA')`, la condición evaluaba a verdadero e ignoraba completamente que `linea.unidad` era `"Valor Fijo"`.
   - Multiplicaba: $\$1.000.000 \times 8.0\text{ hrs} = \$8.000.000$.
3. **Auditoría de Base de Datos PostgreSQL (`sch_leangsp_prod`):**
   - Se verificó que `json_field->'edp_flujo_v1'` en `tpry_proyecto` para la OT `GSP-2611-00003` permanecía en `null`, constatando que la jefatura se detuvo antes de firmar, por lo que la base de datos no fue corrompida.

---

## 4. Causa Raíz de Arquitectura (Software / State Machine / Datos)
- **Vicio de Lógicas Locales en Componentes Frontend:** El modal de firma de carátula estaba recalculando los subtotales comerciales a partir de reglas simplistas e inconsistentes con el motor del backend.
- Al no comprobar si la unidad contratada correspondía a `"Valor Fijo"` o `"Suma Alzada"`, y asumir que cualquier categoría que contuviera la palabra `"GRUA"` debía cobrarse por horas, se produjo una multiplicación ciega por la jornada de terreno (8 horas).

---

## 5. Plan de Mitigación y Resolución
1. **Refactorización de `calcularSubtotalLinea` en [`ModalCaratulaEDP.vue`](file:///d:/SGajardo/Google%20Drive/Antigravity/Grúas%20San%20Pablo/Propuesta%20Gestión%20Operación%20Grúas/ejecucion/frontend/src/components/Operaciones/ModalCaratulaEDP.vue):**
   - Se estableció la prioridad absoluta del valor canónico devuelto por el backend (`linea.subtotal_calculado`) cuando no se encuentra activo el modo de ajuste manual de tesorería.
   - Para recálculos interactivos, se blindó la jerarquía de unidades:
     - `FIJO` / `ALZADA`: $\text{tarifa} \times \text{cantidad}$.
     - `DIARIO` / `DIA` / `JORNADA`: $\text{tarifa} \times \text{días faena} \times \text{cantidad}$.
     - `MES` / `MENSUAL`: $\text{tarifa} \times \text{cantidad}$.
     - `HORA` / `GRUA` (por hora): $\text{tarifa} \times \text{horas facturables}$.
2. **Control de Versión y Despliegue:**
   - Incremento de versión a `1.0.216` (`REQ-1156`) en `package.json`, `RELEASE_LOG.md` y `Gestión/tareas.md`.
   - Compilación exitosa en `dist_prod` y despliegue a `/var/www/html/lg-gsp-prod`.

---

## 6. Protocolo de Respuesta y Guía al Usuario / Operador
- La plataforma ha sido actualizada a la versión **1.0.218** (`REQ-1156`, `REQ-1157` y `REQ-1158`).
- Al abrir la carátula de Estado de Pago para `GSP-2611-00003` (o cualquier servicio pactado a suma alzada / valor fijo):
  * El subtotal refleja fielmente el monto acordado de **$1.000.000 neto** ($1.190.000 bruto).
  * La tarjeta de Horas Facturables indica explícitamente: **`No aplica tarificación por hora`** con la bajada `Tarifa Plana / Suma Alzada`.
  * La tarjeta de Sobretiempos indica: **`No aplica`** (`Servicio a Valor Fijo`).
  * La tarjeta de Días se rotula canónicamente como **`Días de Arriendo`** e incorpora dinámicamente el rango de fechas: **`📅 04/11/2026`** (o `📅 DD/MM/AAAA al DD/MM/AAAA` para arriendos multi-día).
  * En el respaldo firmado de terreno se indica **`Respaldo de Ejecución`**.
- Puede proceder a firmar el **Paso 1 (FES)** con total seguridad de que el valor registrado y el documento emitido reflejan con total rigor la propuesta comercial convenida.

---

## 7. Lecciones Aprendidas y Acciones Preventivas
- **Prohibición de Lógicas de Negocio Duplicadas en Frontend:** Los componentes visuales deben comportarse como presentadores puros de la información calculada por el backend. Cuando se requiera editabilidad interactiva en el cliente, las reglas deben seguir la misma jerarquía estricta que el controlador de conciliación.
