# 📑 ESPECIFICACIÓN TÉCNICA Y FUNCIONAL CANÓNICA: PERSPECTIVA CONTABILIDAD, EMBUDO DE CONVERSIÓN FINANCIERA E2E Y REPORTES EXCEL (HORAS OPERADORES Y VENTAS POR EQUIPO)

- **ID Especificación:** `SPEC-100`
- **Requerimiento Backlog:** `REQ-1069`
- **Versión Objetivo:** Portal Web GSP `v1.0.159`
- **Ambientes de Despliegue:** `DEV` (`sch_leangsp`) y `PROD` (`sch_leangsp_prod`)
- **Fecha:** 2026-10-25
- **Estado:** APROBADO PARA IMPLEMENTACIÓN

---

## 1. Propósito y Contexto de Negocio

Proveer al área de **Contabilidad y Tesorería (Maritza Seguel)**, así como a **Control de Gestión (Yiara)** y **Gerencia**, de una **4ª Perspectiva dedicada en la Torre de Control (`💼 Perspectiva Contabilidad`)** que consolide en una sola vista ejecutiva y operativa:
1. El **Embudo Financiero E2E de 5 Etapas**:
   - **① Comprometido ($ CLP):** Monto neto adjudicado en Cotizaciones Ganadas / OTs Comerciales (`id_proyecto_estado >= 3`, excluyendo movimientos internos).
   - **② Devengado en Terreno ($ CLP):** Monto neto devengado a partir de los Reports Diarios ejecutados en faena (`tedp_reporte_avance`).
   - **③ Cerrado en ITS ($ CLP):** Monto neto de ingresos y costos operacionales auditados en Informes de Término de Servicio (`tits_informe_termino`).
   - **④ Emitido en EDP ($ CLP):** Monto neto de Estados de Pago en circuito de 3 firmas FES (`edp_flujo_v1`), destacando aquellos `🟢 Listos para Facturar`.
   - **⑤ Facturado DTE ($ CLP):** Monto neto efectivamente facturado en el SII (`liquidacion_v1.estado_financiero === 'FACTURADO_CONFORME'` o `id_proyecto_estado === 7`) y cálculo de la **Brecha Pendiente por Facturar**.
2. **Gráficos Ejecutivos de Conversión y Estado de Cobro:**
   - **Gráfico 1:** Cascada / Embudo comparativo de las 5 etapas financieras (`Comprometido ➔ Devengado ➔ Cerrado ITS ➔ Emitido EDP ➔ Facturado DTE`).
   - **Gráfico 2:** Distribución monetaria y de procesos por estado contable (*Facturado Conforme*, *Listo para Facturar Inmediato*, *Pendiente OC Mandante*, *En Ejecución / Conciliación*) y por Empresa Emisora del Holding.
3. **Tres Submenús Operativos con Exportación Nativa a Excel (`.xlsx`):**
   - **Submenú 1 — `📑 1. Avance y Calce por Proceso (Operativo-Contable)`:** Matriz maestra por OT con las 5 variables en paralelo, cálculo de calce/desviación (`$ EDP vs $ Cotizado`), estado de OC/HES, progreso de las 3 firmas FES del EDP y botones de acción directa (*Abrir Carátula EDP*, *Abrir ITS*, *Descargar PDF EDP*, *Registrar Factura DTE*).
   - **Submenú 2 — `👷 2. Reporte de Horas de Operadores / Riggers`:** Sábana consolidada y desglose diario por trabajador (Operador, Rigger, Chofer) desde `tedp_reporte_avance`, incluyendo horas normales, sobretiempo, días trabajados, OTs atendidas y viáticos/pensiones, con exportación a Excel de doble hoja (*Resumen por Trabajador* + *Detalle Diario de Jornadas*).
   - **Submenú 3 — `🚜 3. Reporte de Ventas y Rendimiento por Grúa / Equipo`:** Sábana financiera por activo de la flota (`tequ_equipo`), cruzando OTs atendidas, horas facturables, monto comprometido, monto devengado/EDP, monto facturado, costos directos imputados en ITS y margen de contribución, con exportación a Excel de doble hoja (*Resumen por Equipo* + *Detalle por OT*).

---

## 2. Contrato de API Backend (`GET /api/operaciones/edp/perspectiva-contabilidad`)

### 2.1. Ruta y Controlador
- **Ruta:** `GET /api/operaciones/edp/perspectiva-contabilidad` en `ejecucion/backend_remoto/src/routes/estadoPagoRoutes.js`.
- **Controlador:** `exports.getPerspectivaContabilidad` en `ejecucion/backend_remoto/src/controllers/estadoPagoController.js`.
- **Parámetros Query Opcionales:**
  - `id_empresa` (filtro por empresa emisora del holding: `9` San Pablo, `7` Bestmaq, `8` Logística del Sur, `11` Royal Rental, o `TODAS`).
  - `fecha_desde`, `fecha_hasta` (rango de fechas opcional).

### 2.2. Estructura de Respuesta JSON
```json
{
  "success": true,
  "data": {
    "kpis": {
      "comprometido_neto": 0,
      "comprometido_ots": 0,
      "devengado_neto": 0,
      "devengado_reports": 0,
      "devengado_horas": 0,
      "cerrado_its_neto": 0,
      "cerrado_its_costos": 0,
      "cerrado_its_count": 0,
      "emitido_edp_neto": 0,
      "emitido_edp_count": 0,
      "listos_facturar_neto": 0,
      "listos_facturar_count": 0,
      "facturado_neto": 0,
      "facturado_bruto": 0,
      "facturado_count": 0,
      "brecha_por_facturar_neto": 0
    },
    "procesos": [],
    "horas_personal": {
      "resumen_trabajadores": [],
      "detalle_jornadas": []
    },
    "ventas_equipos": {
      "resumen_equipos": [],
      "detalle_asignaciones": []
    }
  }
}
```

---

## 3. Reglas de Cálculo Determinista

1. **Exclusión de Movimientos Internos:** Todo proyecto marcado como requerimiento interno (`codi_proyecto LIKE 'INT-%'` o `json_field->'crm_v1'->>'es_requerimiento_interno' = 'true'`) se excluye de las métricas de venta/facturación comercial.
2. **Monto Comprometido (Cotización Ganada / OT):**
   - Se calcula desde `json_field->'crm_v1'->'totales'->>'neto'` o la suma de `lineas_servicio` para todos los proyectos comerciales adjudicados (`id_proyecto_estado >= 3`).
3. **Monto Devengado (Reports Diarios):**
   - Para cada OT con reportes en `tedp_reporte_avance`, pondera las horas facturables / jornadas registradas según la estructura tarifaria de la OT (o el avance proporcional de jornadas ejecutadas).
4. **Monto Cerrado en ITS:**
   - Lee directamente `tits_informe_termino.total_ingresos_facturables` y `tits_informe_termino.total_costos_operacionales`.
5. **Monto Emitido en EDP:**
   - Suma el neto de los proyectos que cuentan con Estado de Pago emitido/validado (`edp_flujo_v1.firma_1_analista` o `firma_2_contabilidad` o `estado_financiero === 'FACTURADO_CONFORME'`).
6. **Monto Facturado DTE:**
   - Suma el monto neto facturado de las OTs con `liquidacion_v1.estado_financiero === 'FACTURADO_CONFORME'` o `id_proyecto_estado === 7`.

---

## 4. Arquitectura de Componentes Frontend

1. **`ejecucion/frontend/src/components/Operaciones/PerspectivaContabilidad.vue`:**
   - Componente autónomo que consume `GET /operaciones/edp/perspectiva-contabilidad`.
   - Incluye filtros globales reactivos (*Empresa Emisora*, *Búsqueda rápida*, *Estado de Facturación*, *Rango de Fechas*).
   - Renderiza las **5 Tarjetas KPI Ejecutivas**, el **Bloque Gráfico Dual (Embudo de Conversión E2E + Distribución de Cartera)** y los **3 Submenús** con exportación `.xlsx` usando la librería `xlsx`.
2. **`ejecucion/frontend/src/views/Torre.vue`:**
   - Añade el botón `💼 Perspectiva Contabilidad` (`activeView = 'contabilidad'`) en la barra superior de perspectivas y monta `<PerspectivaContabilidad />` conectado a los modales nativos de la Torre (`abrirCaratulaEDP`, `abrirModalITS`, `abrirModalFacturacion`, `abrirProyecto`, `descargarPdfEdpDirecto`).
