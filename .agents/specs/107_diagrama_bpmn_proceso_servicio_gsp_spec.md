# SPEC-107: Diagrama de Proceso BPMN 2.0 Asíncrono y Multi-Carril (GSP E2E)

> **Estado:** ESPECIFICACIÓN TÉCNICA OFICIAL  
> **Estándar Base:** `leanglobal_bpmn_process_diagram_standard` (ISO/IEC 19510)  
> **Proyecto:** Grúas San Pablo (GSP) / LeanGlobal  
> **Ubicación:** `.agents/specs/107_diagrama_bpmn_proceso_servicio_gsp_spec.md`  
> **Archivo Destino Web:** `ejecucion/frontend/public/presentacion_pipeline_interactivo.html`  
> **Puntos de Acceso:** Menú *Centro Documentación* (`DocumentacionView.vue`) y catálogo (`centro_documentacion_gsp.html`).

---

## 1. Arquitectura del Proceso Real (Desacoplado y Asíncrono)

A diferencia de un flujo secuencial lineal ("happy path"), la operación de Grúas San Pablo se compone de **4 Macro-Fases Asíncronas**:

```text
[ FASE 1: PREVENTA & COTIZACIÓN ]
        │ (Oportunidad -> Bypass XOR Visita -> Matriz Categorías -> Cotización V1)
        ▼
[ FASE 2: HABILITACIÓN OPERATIVA OT ]
        │ (Diff con Penalización KPI -> Asignación Nominativa -> AND: Acreditaciones + Patio)
        ▼
[ FASE 3: BUCLE MULTI-JORNADA TERRENO (REPORTS DIARIOS) ] ◄──┐
        │                                                     │ (Por cada día de faena)
        │ 1. Salida Base / Llegada Faena (Odómetro Camión)     │
        │ 2. Maniobras de Izaje (Horómetro Grúa / Pluma)       │
        │ 3. Confección Report Diario PWA & Firma FES Mandante │
        │ 4. Validación Diaria Control Gestión (Sección 3 PIN) │
        └─────────────────────────────────────────────────────┘
        │
        ├────────────────────────────────────────────────────────┐
        ▼ (Carril A: Externo Comercial)                          ▼ (Carril B: Interno RRHH/Costos)
[ FASE 4A: CIRCUITO EDP & FACTURACIÓN ]                 [ FASE 4B: TRASPASO ITS & CIERRE RRHH ]
(NO espera al cierre del ITS)                           (Verificación diaria en Report)
1. Control de Gestión emite EDP [Firma 1].              1. Traspaso automático (✔ Report) a ITS.
2. Comercial firma EDP [Firma 2] y envía a Cliente.     2. Cierre Técnico de Servicio y liberación flota.
3. Cliente entrega Orden de Compra (OC).               3. RRHH liquida sueldos a fin de mes por
4. Contabilidad factura en Laudus / SII y sube PDF.        filtro Desde-Hasta sin esperar fin del ITS.
```

---

## 2. Definición de Roles y Responsabilidades RBAC
- **`COMERCIAL GSP`**: Ejecutivo Comercial y Adm. Comercial (`COMERCIAL` / `ADM_COM`).
- **`OPERACIONES GSP`**: Coordinador de Operaciones (`COORD` / `GSP_PROG`).
- **`PATIO / PAÑOL GSP`**: Encargado de Patio y Pañolero (`GSP_TALLER_PROG` / `GSP_BODEGA`).
- **`TERRENO GSP`**: Operador de Grúa Móvil / Camión Pluma y Rigger (`GSP_EJEC`).
- **`CLIENTE MANDANTE`**: Administrador de Contratos y Supervisor de Obra en Terreno.
- **`CONTROL DE GESTIÓN`**: Analista de Control de Gestión (Yiara - `GSP_APROB`).
- **`CONTABILIDAD GSP`**: Jefatura de Contabilidad (Maritza - `GSP_CONTA`).
- **`RRHH Y REMUNERACIONES`**: Analista de Remuneraciones (Tesalia).

---

## 3. Matriz de Entregables y Bases de Datos
- **Oportunidad / Cotización:** `tpry_proyecto` (`json_field.servicios`, `json_field.pensiones`).
- **Visita a Terreno:** `tsrv_survey` (Fotos, obstáculos, aparejos sugeridos).
- **Orden de Trabajo:** `tpry_orden_trabajo`, `tpry_rel_equipo`, `tpry_rel_persona`.
- **Dossier Acreditaciones:** `json_field.dossier_acreditacion` (Versiones `v1.0`, semáforo 30 días).
- **Hitos de Viaje (Carretera):** `tequ_log_desplazamiento` (Odómetro, horómetro chasis, fotos petróleo).
- **Report Diario (Obra):** `tedp_reporte_avance` (Horómetro grúa, standby, colación, firma FES cliente).
- **Validación Diaria RRHH:** Sección 3 del Report (`tpar_tarifa_operador`, viático alimentación).
- **Estado de Pago:** `tedp_estado_pago` (Firma 1 Yiara, Firma 2 Comercial, subida de OC).
- **Informe Término Servicio:** `tpry_its` (Consolidación con sello `✔ Report`).
- **Factura:** Documento Laudus/SII cargado en `tpry_factura` con folio y PDF.
