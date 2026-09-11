# 📐 Especificación Técnica: Subpestaña 7 - Valorización, ITS & Facturación (Spec 38)

**Documento:** `38_liquidacion_edp_y_facturacion_spec.md`  
**Ecosistema:** Grúas San Pablo (GSP) / LeanGlobal Platform  
**Módulo:** Torre de Control CRM / Operaciones (`GestorOportunidades.vue`)  
**Subpestaña:** Subpestaña 7: `7. Valorización, ITS & Facturación`  
**Fase de Dominio:** Fases 6 & 7 - Cierre Operacional, Conciliación, Respaldo OC y Emisión DTE (`id_proyecto_estado = 6` / Liquidación y `id_proyecto_estado = 7` / Facturado y Concluido)  
**Estado:** `CANÓNICO VIGENTE`  
**Última Actualización:** 8 de Septiembre de 2026 (Consolidación Pipeline 4 Pasos & Repositorio OCs Mandante)  

---

## 1. 📌 Resumen Ejecutivo y Objetivo de Negocio

La **Subpestaña 7 ("Valorización, ITS & Facturación")** consolida el cierre de ciclo de una Orden de Trabajo (OT) en Grúas San Pablo tras la ejecución en terreno.

Conforme a las definiciones operativas y contables acordadas con Gerencia General y Jefatura de Contabilidad (8 de Septiembre de 2026), este módulo unifica en un **Pipeline Secuencial de 4 Pasos** todo el proceso de cierre para eliminar fugas de facturación y discrepancias con el mandante:

1. **Paso 1 - ITS (Informe de Término de Servicio - [Spec 46](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/.agents/specs/46_informe_termino_servicio_its_spec.md) & [Spec 47](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/.agents/specs/47_its_pdf_flujo_aprobacion_fes_spec.md)):** Liquidación técnica de horas de terreno (auto-pobladas de PWA), imputación de costos directos en 8 categorías, determinación de Utilidad Bruta y Margen % reactivo, plantillas de observación de 1-clic y triple firma interna previa a la emisión del EDP.
2. **Paso 2 - EDP Mandante (Protegido por Candado Criptográfico FES):** Conciliación automática de jornadas operadas contra tarifas pactadas, cálculo de sobretiempos y emisión de la Carátula Oficial de Estado de Pago respaldada por reports firmados con geolocalización. **Invariante:** La Carátula Oficial permanece bloqueada hasta que Jefatura de Operaciones (Richard) apruebe el ITS con su PIN FES de 4 dígitos.
3. **Paso 3 - Respaldo OC (Orden de Compra Mandante):** Repositorio documental de Órdenes de Compra / HES recibidas del cliente con validación financiera de cobertura:
   $$\sum \text{Monto OCs} \ge \text{Total Neto EDP}$$
4. **Paso 4 - Factura DTE:** Vinculación al ERP Laudus, asociación de la OC seleccionada con un solo clic, registro de Folio DTE y cierre formal de la OT en estado `7` (Facturado y Concluido).

---

## 2. 🔄 Diagrama del Pipeline Canónico de 4 Pasos (Navegación Nativa Full-Screen)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│               PIPELINE DE VALORIZACIÓN, LIQUIDACIÓN Y FACTURACIÓN (SUBPESTAÑA 7)       │
│               Barra Superior de Selección: [ ① ITS ] ➔ [ ② EDP ] ➔ [ ③ OC ] ➔ [ ④ DTE ] │
└────────────────────────────────────────────────────────────────────────────────────────┘
                                             │
  PASO ①: ITS (INFORME TÉRMINO DE SERVICIO - SPEC 46)  ▼
  ┌──────────────────────────────────────────────────────────────────────────────────────┐
  │  • Renderizado NATIVO a pantalla completa mediante ModalITS.vue (:embedded="true").  │
  │  • Auto-población de horas desde Reports Diarios PWA y ajuste con filas tachadas.    │
  │  • Imputación de Costos Directos en 8 categorías (Alimentación, Peajes, Pensiones,  │
  │    Personal Externo, Feriados, Subcontrato Flete, Gastos Extra, Costo Hora Operador).│
  │  • Balance Financiero en vivo: Venta vs Costos ➔ Utilidad Bruta & Margen Operacional.│
  │  • Plantillas de Observación [ Urbano ] / [ Rural ] y Triple V°B° Interno.           │
  │  • Navegación: Botón [ ➔ Guardar y Pasar a EDP ] que transiciona a Paso ②.          │
  └─────────────────────────────────────────┬────────────────────────────────────────────┘
                                             │
  PASO ②: EDP MANDANTE (CONCILIACIÓN)       ▼
  ┌──────────────────────────────────────────────────────────────────────────────────────┐
  │  • Pantalla completa de conciliación de jornadas y horas extras validadas.           │
  │  • Base Tarifa según Unidad Canónica (Piso Diario 8h, Piso Mes 180h, Traslado, Fijo).│
  │  • Carátula de Estado de Pago, dossier y visualización de respaldos.                │
  │  • Navegación: [ ⬅️ Volver a ITS (Costos) ] | [ ➔ Continuar a Respaldo OC ].          │
  └─────────────────────────────────────────┬────────────────────────────────────────────┘
                                             │
  PASO ③: RESPALDO OC (REPOSITORIO)         ▼
  ┌──────────────────────────────────────────────────────────────────────────────────────┐
  │  • Repositorio documental de Órdenes de Compra / HES recibidas del mandante (PDFs).  │
  │  • Semáforo de Cobertura Financiera: Suma OCs >= Monto EDP (100% Cubierto).          │
  │  • Visor integrado de PDF para auditoría rápida en pantalla completa.                │
  │  • Navegación: [ ⬅️ Volver a EDP Mandante ] | [ ➔ Continuar a Facturación DTE ].      │
  └─────────────────────────────────────────┬────────────────────────────────────────────┘
                                             │
  PASO ④: FACTURA DTE (CIERRE LAUDUS)       ▼
  ┌──────────────────────────────────────────────────────────────────────────────────────┐
  │  • Selector rápido (chips) para precargar el N° de OC validada en el Paso 3.         │
  │  • Selección de Tipo de Documento: Factura Electrónica (33) / Exenta (34).           │
  │  • Registro de Folio Factura y Fecha de Emisión.                                     │
  │  • Botón Maestro: [ 🏁 Declarar OT Facturada y Cerrar Servicio ].                     │
  │  • Navegación: [ ⬅️ Volver a Respaldo OC ].                                          │
  │  • Transición relacional inmediata: id_proyecto_estado = 7 (Facturado / Cerrado).    │
  └──────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 2.1. Invariante del Candado Criptográfico FES en EDP Mandante (Spec 47)
Para blindar el proceso comercial y erradicar discrepancias entre lo ejecutado en terreno y lo facturado:
1. **Regla de Bloqueo Inviolable:**
   - Si el ITS está en estado `BORRADOR`, `EN_CORRECCION` o `EN_REVISION_OPERACIONES`:
     * El botón **`[ Ver Carátula Oficial de EDP ]`** permanece **bloqueado (`disabled`)** con icono `🔒`.
     * Se renderiza un **Banner Dorado de Bloqueo** informando el estado actual del ITS y un botón de navegación directa `[ 🔏 Ir a Visar ITS con PIN FES ]`.
2. **Desbloqueo Criptográfico:**
   - Una vez que Jefatura de Operaciones (Richard) firma el ITS con su PIN OTP de 4 dígitos (Paso 2 `EN_REVISION_CONTABILIDAD` o `CONCLUIDO`), el candado se libera automáticamente, habilitando la apertura y descarga de la Carátula Oficial de EDP.

---

## 3. 🗄️ Modelo de Datos y Persistencia PostgreSQL

Toda la traza documental y financiera de la Subpestaña 7 reside en el esquema `sch_leangsp.tpry_proyecto`:

### 3.1. Repositorio de Órdenes de Compra (`json_field->'crm_v1'->'ordenes_compra'`)
```json
[
  {
    "id": "oc-1725804901234",
    "numero_oc": "OC-MINERA-99482",
    "fecha_emision": "2026-09-08",
    "monto_neto": 3500000,
    "centro_costo": "CC-FAENA-NORTE",
    "archivo": {
      "id_doc": 885,
      "nombre": "Orden_Compra_99482_Firmada.pdf",
      "url": "/archivo/ver/885"
    },
    "observaciones": "OC que cubre servicio de grúa 80T y flete cama baja"
  }
]
```

### 3.2. Registro de Cierre y Facturación (`json_field->'liquidacion_v1'`)
```json
{
  "total_horas_base": 18.0,
  "total_horas_sobretiempo": 2.5,
  "monto_neto_equipos": 1800000,
  "monto_neto_sobretiempo": 375000,
  "monto_neto_flete": 500000,
  "subtotal_neto": 2675000,
  "iva_19": 508250,
  "total_bruto": 3183250,
  "tipo_dte": "Factura Electrónica",
  "hes_oc_numero": "OC-MINERA-99482",
  "factura_numero": "F-14029",
  "fecha_facturacion": "2026-09-08",
  "observaciones_facturacion": "Facturado conforme a OC aprobada por mandante.",
  "usuario_cierre_id": 55,
  "fecha_cierre": "2026-09-08T18:30:00Z"
}
```

---

## 4. 🔌 Especificación de Endpoints Backend

### 4.1. `GET /api/operaciones/edp/resumen/:id_proyecto`
* **Descripción:** Calcula la conciliación financiera cruzando las líneas de la cotización comercial con los reports validados.
* **Respuesta:**
```json
{
  "success": true,
  "data": {
    "proyecto": { "id_proyecto": 69, "codi_proyecto": "GSP-2608-4851-037", "cliente_nombre": "Minera El Abra" },
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
    }
  }
}
```

### 4.2. `POST /api/operaciones/edp/cerrar-facturacion`
* **Body:** `{ id_proyecto, tipo_dte, hes_oc_numero, factura_numero, fecha_facturacion, monto_facturado, observaciones }`
* **Comportamiento:**
  1. Persiste el cierre en `json_field->'liquidacion_v1'`.
  2. Actualiza relacionalmente `id_proyecto_estado = 7` (Facturado / Cerrado).
  3. Despacha evento de cierre y retorna `{ success: true, message: 'OT Facturada y Concluida exitosamente' }`.

### 4.3. `POST /archivo/upload` o `POST /v1/storage/upload`
* **Descripción:** Sube el PDF de la Orden de Compra física/digital y retorna `{ id_doc, url }` para su almacenamiento en el repositorio de OCs del proyecto.

---

## 5. 🖥️ Interfaz en GestorOportunidades.vue (Subpestaña 7)

* **Identificador de Vista:** `operacionesSubTab === 'liquidacion'`.
* **Regla de Visualización:** Habilitada para proyectos con `estadoDbActual >= 5`.
* **Componentes Embebidos:**
  * **Paso 1 (Card ITS):** Indicador de costos directos registrados en faena, margen porcentual estimado y botón `[ 📄 Generar / Editar Informe Término de Servicio (ITS) ]` que abre `ModalITS.vue` (gobernado por la [Spec 46](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/.agents/specs/46_informe_termino_servicio_its_spec.md)).
  * **Paso 2 (Card EDP):** Cuadro de mando con Total Neto Liquidado, Horas Acumuladas, Días Operados y botón `[ 📄 Ver Carátula Oficial de EDP ]` que abre `ModalCaratulaEDP.vue`.
  * **Paso 3 (Repositorio OCs):**
    * Botón `[ + Adjuntar Orden de Compra (OC) ]` para abrir modal de carga.
    * Barra comparativa de cobertura: Monto Total OCs vs Total Neto EDP.
    * Grid de tarjetas de OCs con número, monto, centro de costo, badge de archivo PDF y botón de previsualización.
  * **Paso 4 (Cierre DTE):**
    * Chips seleccionables con las OCs cargadas en el Paso 3 para auto-completar el número de OC sin errores tipográficos.
    * Formulario de Folio Factura, Tipo DTE y Fecha.
    * Botón maestro `[ 🏁 Declarar OT Facturada y Cerrar Servicio ]`.

---

## 6. 🧪 Matriz de Verificación y Criterios de Aceptación (QA)

| ID | Escenario de Prueba | Criterio de Aceptación |
| :--- | :--- | :--- |
| **QA-38-01** | Conciliación Automática | El total neto liquida las horas de los reports validados respetando los pisos mínimos pactados ($8.0$ o $180.0$ hrs) más sobretiempos y fletes. |
| **QA-38-02** | Visualización de Carátula EDP | Al presionar `[ Ver Carátula Oficial de EDP ]`, abre `ModalCaratulaEDP.vue` con firmas manuscritas y membrete institucional. |
| **QA-38-03** | Carga y Repositorio de OC | Permite subir el archivo PDF de la OC, calcular la cobertura respecto al EDP y visualizar el documento en el visor nativo. |
| **QA-38-04** | Auto-completado de OC en Facturación | Al hacer clic en el chip de una OC del Paso 3, el campo N° OC del Paso 4 se llena automáticamente. |
| **QA-38-05** | Cierre y Transición a Facturado | Al registrar la factura y confirmar el cierre, la OT pasa a `id_proyecto_estado = 7` y se refleja en la columna final del Kanban. |
