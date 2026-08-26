# 📐 Especificación Técnica: Liquidación Operacional, Consolidación de EDP y Registro de Facturación (Spec 38)

**Documento:** `38_liquidacion_edp_y_facturacion_spec.md`  
**Ecosistema:** Grúas San Pablo (GSP) / LeanGlobal Platform  
**Fase de Dominio:** Fase 6 & 7 - Cierre Operacional, Liquidación y Facturación (`id_proyecto_estado = 6` / Liquidación y `id_proyecto_estado = 7` / Facturado y Concluido)  
**Estado:** `ESPECIFICACIÓN FORMAL - PROPUESTA PARA APROBACIÓN`  
**Fecha:** 26 de Agosto de 2026  

---

## 1. 📌 Resumen Ejecutivo y Objetivo

El presente documento especifica el módulo final del ciclo de vida de una Orden de Trabajo (OT) en Grúas San Pablo: **La Liquidación Financiera, Emisión de Carátula de Estado de Pago (EDP) y Registro de Facturación**.

Este módulo actúa como el puente definitivo entre las operaciones de terreno (Reports Diarios firmados por el cliente) y la administración comercial, garantizando que el **100% de las horas operadas, sobretiempos y fletes se liquiden sin fricción ni discrepancias**, cerrando el *Happy Path* de punta a punta.

### 🎯 Principios de Negocio:
1. **Liquidación Automática por Conciliación:** El sistema cruza automáticamente la tarifa pactada en la cotización comercial con las horas reales facturables y sobretiempos de los reports validados.
2. **Respaldo Documental Indiscutible:** Toda carátula de EDP está respaldada por los Reports Diarios inmutables con firma manuscrita del mandante, geolocalización GPS y fotografías de horómetro.
3. **Cierre de Ciclo en Kanban:** El registro del N° de Factura y N° de HES/OC transiciona el proyecto a **"Facturado / Concluido"**, completando el ciclo de vida en la Torre de Control.

---

## 2. 🔄 Diagrama del Flujo de Liquidación y Cierre

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        FLUJO DE LIQUIDACIÓN Y FACTURACIÓN GSP                          │
└────────────────────────────────────────────────────────────────────────────────────────┘
                                            │
  1. FAENA CONCLUIDA EN TERRENO             ▼
  ┌──────────────────────────────────────────────────────────────────────────────────────┐
  │  • Todos los días de servicio cuentan con Report Diario validado por el Analista.    │
  │  • La OT se encuentra en estado >= 5 (En Ejecución / Lista para Liquidar).           │
  └─────────────────────────────────────────┬────────────────────────────────────────────┘
                                            ▼
  2. CONSOLIDACIÓN FINANCIERA (Subpestaña 7: Liquidación & EDP)
  ┌──────────────────────────────────────────────────────────────────────────────────────┐
  │  • Cuadro Resumen de Cobro:                                                          │
  │    - Grúa / Maquinaria: Base $/hr o $/día pactada                                    │
  │    - Total Horas Facturables Acumuladas (Σ reports validados)                        │
  │    - Total Sobretiempos Acumulados ($/hr extra pactada)                              │
  │    - Traslados / Fletes Fijos pactados                                               │
  │    ─────────────────────────────────────────────────────────────────────────────     │
  │    MONTO NETO TOTAL LIQUIDADO = Σ (Horas × Tarifa) + Σ Sobretiempos + Fletes          │
  └─────────────────────────────────────────┬────────────────────────────────────────────┘
                                            ▼
  3. EMISIÓN DE CARÁTULA DE EDP (ModalCaratulaEDP.vue)
  ┌──────────────────────────────────────────────────────────────────────────────────────┐
  │  • Generación de Documento Formal de Cobro con membrete Grúas San Pablo.             │
  │  • Datos del Mandante (Razón Social, RUT, Faena, Contacto).                          │
  │  • Desglose cronológico día por día con detalle de horas y firmante mandante.        │
  │  • Botón: [ 🖨️ Exportar Carátula EDP / PDF de Respaldo ]                            │
  └─────────────────────────────────────────┬────────────────────────────────────────────┘
                                            ▼
  4. REGISTRO DE FACTURA & CIERRE COMERCIAL
  ┌──────────────────────────────────────────────────────────────────────────────────────┐
  │  • Ingreso de N° Orden de Compra / HES del Mandante (ej. HES-49201)                  │
  │  • Ingreso de N° Factura Emitida (ej. F-12940)                                       │
  │  • Fecha de Facturación y Monto Final Facturado                                      │
  │  • Botón: [ 🏁 Declarar OT Facturada y Cerrar Servicio ]                             │
  │  • Transición de Estado: id_proyecto_estado = 7 (Facturado / Cerrado)                │
  └──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. 🗄️ Modelo de Datos y Persistencia PostgreSQL

### 3.1. Almacenamiento en `sch_leangsp.tpry_proyecto`
Para mantener simplicidad y robustez sin añadir migraciones complejas antes de la presentación, la información de liquidación y facturación se persiste directamente en la estructura `json_field->'liquidacion_v1'` y se actualiza el estado relacional `id_proyecto_estado`.

```json
{
  "liquidacion_v1": {
    "total_horas_base": 18.0,
    "total_horas_sobretiempo": 2.5,
    "monto_neto_equipos": 1800000,
    "monto_neto_sobretiempo": 375000,
    "monto_neto_flete": 500000,
    "subtotal_neto": 2675000,
    "iva_19": 508250,
    "total_bruto": 3183250,
    "hes_oc_numero": "HES-2026-8841",
    "factura_numero": "F-14029",
    "fecha_facturacion": "2026-08-26",
    "observaciones_facturacion": "Facturado conforme a HES aprobada por ITO mandante.",
    "usuario_cierre_id": 55,
    "fecha_cierre": "2026-08-26T00:30:00Z"
  }
}
```

---

## 4. 🔌 Especificación de Endpoints API Backend

**Controlador:** `ejecucion/backend_remoto/src/controllers/estadoPagoController.js` (o `reportDiarioController.js`)  
**Rutas:** `/api/operaciones/edp/*`

### 4.1. `GET /api/operaciones/edp/resumen/:id_proyecto`
* **Descripción:** Calcula y retorna la conciliación financiera completa cruzando la cotización comercial con los reports validados.
* **Respuesta:**
```json
{
  "success": true,
  "data": {
    "proyecto": { "id_proyecto": 69, "codi_proyecto": "GSP-2608-4851-037", "cliente_nombre": "LeanGlobal Spa" },
    "lineas_cotizadas": [ ... ],
    "reports_validados": [ ... ],
    "resumen_liquidacion": {
      "dias_totales": 2,
      "horas_facturables_totales": 19.0,
      "horas_sobretiempo_totales": 1.5,
      "monto_equipos_neto": 1900000,
      "monto_sobretiempo_neto": 225000,
      "monto_flete_neto": 500000,
      "total_neto": 2625000,
      "iva": 498750,
      "total_bruto": 3123750
    },
    "facturacion_guardada": { ... }
  }
}
```

### 4.2. `POST /api/operaciones/edp/cerrar-facturacion`
* **Body:** `{ id_proyecto, hes_oc_numero, factura_numero, fecha_facturacion, monto_facturado, observaciones }`
* **Acción:**
  1. Guarda los datos en `json_field->'liquidacion_v1'`.
  2. Actualiza `id_proyecto_estado = 7` (Facturado / Cerrado).
  3. Retorna `{ success: true, message: 'OT Facturada y Concluida exitosamente' }`.

---

## 5. 🖥️ Interfaz en Torre de Control CRM (`GestorOportunidades.vue`)

### 5.1. Subpestaña 7: `7. Liquidación & EDP`
* **Identificador:** `operacionesSubTab === 'liquidacion'`.
* **Condición de acceso:** Visible para proyectos con `estadoDbActual >= 5`.
* **Contenido Visual:**
  * **Bloque A - Tarjetas KPI Financieras:**
    * `💰 Total Neto Liquidado` (en tipografía dorada destacada).
    * `⏱️ Horas Totales a Facturar` (desglose Base + Sobretiempo).
    * `📑 Días Operados Respaldados` (con badge 100% firmado).
  * **Bloque B - Tabla de Detalle de Conciliación:**
    * Fila por cada equipo / línea de servicio con cantidad, horas, tarifa unitaria y subtotal.
    * Fila de Flete / Traslado.
    * Fila de Sobretiempos devengados.
  * **Bloque C - Carátula de EDP & Acciones:**
    * Botón destacado: `[ 📄 Ver Carátula Oficial de EDP ]` (Abre `ModalCaratulaEDP.vue`).
  * **Bloque D - Formulario de Cierre de Facturación:**
    * Input N° Orden de Compra / HES Mandante.
    * Input N° Factura Emitida.
    * Input Fecha de Facturación.
    * Botón de Cierre Maestro: `[ 🏁 Declarar OT Facturada y Cerrar Servicio ]`.

### 5.2. Componente `ModalCaratulaEDP.vue` [NUEVO]
* **Ubicación:** `ejecucion/frontend/src/components/Operaciones/ModalCaratulaEDP.vue`
* **Diseño:** Documento ejecutivo A4 en pantalla con membrete Grúas San Pablo, identificación del mandante, desglose de jornadas, tabla de horas efectivas y galería de miniaturas de las firmas de los supervisores en terreno.

---

## 6. 🧪 Matriz de Validación y Criterios de Aceptación (QA)

| ID | Escenario de Prueba | Criterio de Aceptación |
| :--- | :--- | :--- |
| **QA-38-01** | Conciliación Automática | El sistema calcula el total neto sumando las horas de los reports validados multiplicadas por la tarifa de la cotización + fletes. |
| **QA-38-02** | Visualización de Carátula EDP | Al presionar `[ Ver Carátula Oficial de EDP ]`, se abre el modal con membrete GSP y desglose completo. |
| **QA-38-03** | Registro de Factura y Cierre | Al ingresar N° Factura (ej. `F-12049`) y N° HES (ej. `HES-8821`) y confirmar, el proyecto pasa a estado `7`. |
| **QA-38-04** | Actualización en Kanban | Al regresar a la Torre de Control, la tarjeta del proyecto aparece en la columna final de facturados. |
