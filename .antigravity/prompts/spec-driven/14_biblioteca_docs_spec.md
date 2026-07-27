# 📁 Especificación de Módulo: Gestor Documental (FileManager Tree)

Este documento define la estructura de datos, lógica del árbol de directorios, control de vigencias y reglas de UI/UX para el módulo de **Gestor Documental** de la Consola GSP.

---

## DESCRIPCIÓN CONCEPTUAL

El **Gestor Documental** de Grúas San Pablo centraliza en una única interfaz unificada todos los expedientes digitales que se generan y administran de forma distribuida a lo largo de la operación. Resuelve el problema de la dispersión de información reuniendo en un explorador tipo árbol (File Manager) los documentos técnicos de los equipos (Flota), los registros de acreditación de personal (Operadores/Riggers) y los comprobantes operacionales y financieros vinculados a los servicios prestados (Planes de Rigging, ASTs, Partes Diarios, Órdenes de Compra, EDPs y Facturas). Esto reduce el riesgo de multas o bloqueos en faena por documentos vencidos y agiliza las conciliaciones durante las auditorías de mandantes.

## DESCRIPCIÓN FUNCIONAL

El módulo opera como un explorador interactivo estructurado en dos columnas:
1. **Explorador de Carpetas (Panel Izquierdo):** Permite al usuario navegar a través de dos jerarquías principales:
   - **Equipos (Flota):** Despliega las grúas de GSP permitiendo acceder a su carpeta de mantenimiento y certificaciones.
   - **Clientes & Servicios:** Agrupa los servicios prestados bajo la carpeta de cada Cliente Mandante, estructurando las subcarpetas con el número de servicio (`#SRV-XXXX`).
2. **Visualizador de Archivos (Panel Derecho):** Muestra el listado de documentos de la carpeta seleccionada en formato de grilla de control de vigencias.
   - **Sistema Semáforo de Alertas:** Identifica visualmente si el archivo está vigente (verde), por vencer en menos de 30 días (ámbar con icono ⏳), o vencido (rojo pulsante con icono ⚠).
   - **Filtros Activos:** Ofrece un buscador por texto y un combobox de vigencia para aislar rápidamente archivos según su estado crítico.
   - **Acción Integrada:** Permite previsualizar el documento firmado digitalmente en el modal visor oficial de la consola.

---

## 1. MODELO DE DATOS REACTIVO LITERAL

```javascript
const documentLibrary = {
  // FLOTA EQUIPOS
  'flota-ltm-1220': {
    path: 'Equipos / Liebherr LTM 1220 (GZBC-58)',
    files: [
      { name: 'Certificado_Izaje_LTM-1220_2026.pdf', type: 'Certificado de Izaje', date: '15 Mar 2026', expiry: '15 Mar 2027', status: 'green', size: '2.4 MB', fileKey: 'Plan_Rigging_SRV-2026-041' },
      { name: 'Revision_Tecnica_GZBC-58.pdf', type: 'Revisión Técnica', date: '10 Ene 2026', expiry: '10 Ene 2027', status: 'green', size: '1.8 MB', fileKey: 'Reporte_Horometros_SRV-2026-041' },
      { name: 'Seguro_Responsabilidad_Civil_LTM1220.pdf', type: 'Seguro Mandante', date: '01 Ene 2026', expiry: '01 Jul 2026', status: 'amber', size: '3.1 MB', fileKey: 'AST_Digital_SRV-2026-041' },
      { name: 'Hoja_Vida_Equipo_GZBC-58.pdf', type: 'Hoja de Vida', date: '20 May 2026', expiry: 'N/A', status: 'green', size: '1.2 MB', fileKey: 'EDP_Periodo_Actual_SRV-2026-041' },
      { name: 'Certificacion_Ganchos_Eslingas_2025.pdf', type: 'Certificado Elementos', date: '15 Nov 2025', expiry: '15 May 2026', status: 'red', size: '2.1 MB', fileKey: 'AST_Digital_SRV-2026-041' }
    ]
  },
  'flota-ltm-1250': {
    path: 'Equipos / Liebherr LTM 1250 (GZBC-61)',
    files: [
      { name: 'Certificado_Izaje_LTM-1250_2026.pdf', type: 'Certificado de Izaje', date: '18 Abr 2026', expiry: '18 Abr 2027', status: 'green', size: '2.5 MB', fileKey: 'Plan_Rigging_SRV-2026-043' },
      { name: 'Revision_Tecnica_GZBC-61.pdf', type: 'Revisión Técnica', date: '05 Jun 2026', expiry: '05 Jun 2027', status: 'green', size: '1.7 MB', fileKey: 'Reporte_Horometros_SRV-2026-043' },
      { name: 'Garantia_Seguro_RC_GZBC-61.pdf', type: 'Seguro Mandante', date: '01 Ene 2026', expiry: '01 Ene 2027', status: 'green', size: '2.9 MB', fileKey: 'EDP_Periodo_Actual_SRV-2026-043' },
      { name: 'Certificacion_Pasteca_LTM1250.pdf', type: 'Certificado Elementos', date: '10 Jun 2025', expiry: '10 Jun 2026', status: 'red', size: '1.5 MB', fileKey: 'AST_Digital_SRV-2026-043' }
    ]
  },
  'flota-ltm-1400': {
    path: 'Equipos / Liebherr LTM 1400 (GZBC-71)',
    files: [
      { name: 'Certificado_Izaje_LTM-1400_2026.pdf', type: 'Certificado de Izaje', date: '12 Jun 2026', expiry: '12 Jun 2027', status: 'green', size: '3.0 MB', fileKey: 'Plan_Rigging_SRV-2026-048' },
      { name: 'Revision_Tecnica_GZBC-71.pdf', type: 'Revisión Técnica', date: '10 Dic 2025', expiry: '10 Jun 2026', status: 'red', size: '2.0 MB', fileKey: 'AST_Digital_SRV-2026-048' },
      { name: 'Seguro_Danos_Liebherr_1400.pdf', type: 'Seguro Mandante', date: '15 Ene 2026', expiry: '15 Ene 2027', status: 'green', size: '4.2 MB', fileKey: 'Plan_Rigging_SRV-2026-048' }
    ]
  },
  'flota-ltm-1090': {
    path: 'Equipos / Liebherr LTM 1090 (GZBC-40)',
    files: [
      { name: 'Certificado_Izaje_LTM-1090.pdf', type: 'Certificado de Izaje', date: '20 May 2026', expiry: '20 May 2027', status: 'green', size: '2.2 MB', fileKey: 'Plan_Rigging_SRV-2026-038' },
      { name: 'Revision_Tecnica_GZBC-40.pdf', type: 'Revisión Técnica', date: '15 May 2026', expiry: '15 May 2027', status: 'green', size: '1.6 MB', fileKey: 'EDP_Periodo_Actual_SRV-2026-038' }
    ]
  },
  'flota-ltm-1070': {
    path: 'Equipos / Liebherr LTM 1070 (GZBC-28)',
    files: [
      { name: 'Certificado_Izaje_LTM-1070.pdf', type: 'Certificado de Izaje', date: '11 Jun 2026', expiry: '11 Jun 2027', status: 'green', size: '2.1 MB', fileKey: 'Plan_Rigging_SRV-2026-050' },
      { name: 'Revision_Tecnica_GZBC-28.pdf', type: 'Revisión Técnica', date: '20 Ene 2026', expiry: '20 Ene 2027', status: 'green', size: '1.5 MB', fileKey: 'AST_Digital_SRV-2026-050' }
    ]
  },
  'flota-ltm-1050': {
    path: 'Equipos / Liebherr LTM 1050 (GZBC-22)',
    files: [
      { name: 'Certificado_Izaje_LTM-1050.pdf', type: 'Certificado de Izaje', date: '15 May 2026', expiry: '15 May 2027', status: 'green', size: '2.0 MB', fileKey: 'Plan_Rigging_SRV-2026-035' },
      { name: 'Revision_Tecnica_GZBC-22.pdf', type: 'Revisión Técnica', date: '14 Abr 2026', expiry: '14 Abr 2027', status: 'green', size: '1.4 MB', fileKey: 'AST_Digital_SRV-2026-035' }
    ]
  },
  'flota-ltm-1040': {
    path: 'Equipos / Liebherr LTM 1040 (GZBC-12)',
    files: [
      { name: 'Certificado_Izaje_LTM-1040.pdf', type: 'Certificado de Izaje', date: '10 May 2026', expiry: '10 May 2027', status: 'green', size: '1.9 MB', fileKey: 'Plan_Rigging_SRV-2026-032' },
      { name: 'Revision_Tecnica_GZBC-12.pdf', type: 'Revisión Técnica', date: '18 Dic 2025', expiry: '18 Jun 2026', status: 'red', size: '1.3 MB', fileKey: 'EDP_Periodo_Actual_SRV-2026-032' }
    ]
  },
  'flota-xcmg-qy70': {
    path: 'Equipos / XCMG QY70K (GZBC-32)',
    files: [
      { name: 'Certificado_Izaje_XCMG.pdf', type: 'Certificado de Izaje', date: '08 Jun 2026', expiry: '08 Jun 2027', status: 'green', size: '2.3 MB', fileKey: 'Plan_Rigging_SRV-2026-045' },
      { name: 'Revision_Tecnica_GZBC-32.pdf', type: 'Revisión Técnica', date: '12 Ene 2026', expiry: '12 Ene 2027', status: 'green', size: '1.6 MB', fileKey: 'OC-4540' }
    ]
  },

  // CLIENTS & SERVICES
  'srv-2026-041': {
    path: 'Servicios / CMPC Celulosa / #SRV-2026-041',
    files: [
      { name: 'Plan_Rigging_SRV-2026-041.pdf', type: 'Plan de Rigging', date: '30 May 2026', expiry: 'N/A', status: 'green', size: '1.4 MB', fileKey: 'Plan_Rigging_SRV-2026-041' },
      { name: 'AST_Digital_SRV-2026-041.pdf', type: 'AST Digital', date: '02 Jun 2026', expiry: 'N/A', status: 'green', size: '0.8 MB', fileKey: 'AST_Digital_SRV-2026-041' },
      { name: 'Reporte_Horometros_SRV-2026-041.pdf', type: 'Reporte Horómetros', date: '21 Jun 2026', expiry: 'N/A', status: 'green', size: '1.1 MB', fileKey: 'Reporte_Horometros_SRV-2026-041' },
      { name: 'EDP_Periodo_Actual_SRV-2026-041.pdf', type: 'Estado de Pago (EDP)', date: '21 Jun 2026', expiry: 'N/A', status: 'green', size: '1.6 MB', fileKey: 'EDP_Periodo_Actual_SRV-2026-041' },
      { name: 'Orden_Compra_OC-4530.pdf', type: 'Orden de Compra', date: '01 Jun 2026', expiry: 'N/A', status: 'green', size: '0.9 MB', fileKey: 'OC-4530' },
      { name: 'Factura_F-2026-1049.pdf', type: 'Factura Comercial', date: '25 Jun 2026', expiry: 'N/A', status: 'green', size: '1.2 MB', fileKey: 'Factura_F-2026-1049' }
    ]
  },
  'srv-2026-047': {
    path: 'Servicios / CMPC Celulosa / #SRV-2026-047',
    files: [
      { name: 'Plan_Rigging_SRV-2026-047.pdf', type: 'Plan de Rigging', date: '09 Jun 2026', expiry: 'N/A', status: 'green', size: '1.5 MB', fileKey: 'Plan_Rigging_SRV-2026-047' },
      { name: 'AST_Digital_SRV-2026-047.pdf', type: 'AST Digital', date: '10 Jun 2026', expiry: 'N/A', status: 'green', size: '0.9 MB', fileKey: 'AST_Digital_SRV-2026-047' },
      { name: 'Orden_Compra_OC-4528.pdf', type: 'Orden de Compra', date: '08 Jun 2026', expiry: 'N/A', status: 'green', size: '0.8 MB', fileKey: 'OC-4528' }
    ]
  },
  'srv-2026-043': {
    path: 'Servicios / Arauco Forestal / #SRV-2026-043',
    files: [
      { name: 'Plan_Rigging_SRV-2026-043.pdf', type: 'Plan de Rigging', date: '04 Jun 2026', expiry: 'N/A', status: 'green', size: '1.3 MB', fileKey: 'Plan_Rigging_SRV-2026-043' },
      { name: 'AST_Digital_SRV-2026-043.pdf', type: 'AST Digital', date: '05 Jun 2026', expiry: 'N/A', status: 'green', size: '0.8 MB', fileKey: 'AST_Digital_SRV-2026-043' },
      { name: 'Reporte_Horometros_SRV-2026-043.pdf', type: 'Reporte Horómetros', date: '18 Jun 2026', expiry: 'N/A', status: 'green', size: '1.0 MB', fileKey: 'Reporte_Horometros_SRV-2026-043' },
      { name: 'EDP_Periodo_Actual_SRV-2026-043.pdf', type: 'Estado de Pago (EDP)', date: '18 Jun 2026', expiry: 'N/A', status: 'green', size: '1.4 MB', fileKey: 'EDP_Periodo_Actual_SRV-2026-043' },
      { name: 'Orden_Compra_OC-4533.pdf', type: 'Orden de Compra', date: '03 Jun 2026', expiry: 'N/A', status: 'green', size: '0.9 MB', fileKey: 'OC-4533' }
    ]
  },
  'srv-2026-048': {
    path: 'Servicios / Arauco S.A. / #SRV-2026-048',
    files: [
      { name: 'Plan_Rigging_SRV-2026-048.pdf', type: 'Plan de Rigging', date: '11 Jun 2026', expiry: 'N/A', status: 'green', size: '1.6 MB', fileKey: 'Plan_Rigging_SRV-2026-048' },
      { name: 'AST_Digital_SRV-2026-048.pdf', type: 'AST Digital', date: '12 Jun 2026', expiry: 'N/A', status: 'green', size: '0.9 MB', fileKey: 'AST_Digital_SRV-2026-048' }
    ]
  },
  'srv-2026-035': {
    path: 'Servicios / Aguas Araucanía / #SRV-2026-035',
    files: [
      { name: 'Plan_Rigging_SRV-2026-035.pdf', type: 'Plan de Rigging', date: '14 May 2026', expiry: 'N/A', status: 'green', size: '1.2 MB', fileKey: 'Plan_Rigging_SRV-2026-035' },
      { name: 'AST_Digital_SRV-2026-035.pdf', type: 'AST Digital', date: '15 May 2026', expiry: 'N/A', status: 'green', size: '0.8 MB', fileKey: 'AST_Digital_SRV-2026-035' }
    ]
  },
  'srv-2026-038': {
    path: 'Servicios / Cementos Biobío / #SRV-2026-038',
    files: [
      { name: 'Plan_Rigging_SRV-2026-038.pdf', type: 'Plan de Rigging', date: '18 May 2026', expiry: 'N/A', status: 'green', size: '1.1 MB', fileKey: 'Plan_Rigging_SRV-2026-038' },
      { name: 'AST_Digital_SRV-2026-038.pdf', type: 'AST Digital', date: '20 May 2026', expiry: 'N/A', status: 'green', size: '0.8 MB', fileKey: 'AST_Digital_SRV-2026-038' },
      { name: 'EDP_Periodo_Actual_SRV-2026-038.pdf', type: 'Estado de Pago (EDP)', date: '28 May 2026', expiry: 'N/A', status: 'green', size: '1.3 MB', fileKey: 'EDP_Periodo_Actual_SRV-2026-038' },
      { name: 'Orden_Compra_OC-4521.pdf', type: 'Orden de Compra', date: '18 May 2026', expiry: 'N/A', status: 'green', size: '0.9 MB', fileKey: 'OC-4521' }
    ]
  },
  'srv-2026-032': {
    path: 'Servicios / Latam Airlines / #SRV-2026-032',
    files: [
      { name: 'Plan_Rigging_SRV-2026-032.pdf', type: 'Plan de Rigging', date: '08 May 2026', expiry: 'N/A', status: 'green', size: '1.2 MB', fileKey: 'Plan_Rigging_SRV-2026-032' },
      { name: 'AST_Digital_SRV-2026-032.pdf', type: 'AST Digital', date: '10 May 2026', expiry: 'N/A', status: 'green', size: '0.8 MB', fileKey: 'AST_Digital_SRV-2026-032' },
      { name: 'EDP_Periodo_Actual_SRV-2026-032.pdf', type: 'Estado de Pago (EDP)', date: '15 May 2026', expiry: 'N/A', status: 'green', size: '1.3 MB', fileKey: 'EDP_Periodo_Actual_SRV-2026-032' },
      { name: 'Orden_Compra_OC-4498.pdf', type: 'Orden de Compra', date: '08 May 2026', expiry: 'N/A', status: 'green', size: '0.9 MB', fileKey: 'OC-4498' }
    ]
  },
  'srv-2026-045': {
    path: 'Servicios / Colbún Energía / #SRV-2026-045',
    files: [
      { name: 'Plan_Rigging_SRV-2026-045.pdf', type: 'Plan de Rigging', date: '07 Jun 2026', expiry: 'N/A', status: 'green', size: '1.4 MB', fileKey: 'Plan_Rigging_SRV-2026-045' },
      { name: 'AST_Digital_SRV-2026-045.pdf', type: 'AST Digital', date: '08 Jun 2026', expiry: 'N/A', status: 'green', size: '0.8 MB', fileKey: 'AST_Digital_SRV-2026-045' },
      { name: 'Orden_Compra_OC-4540.pdf', type: 'Orden de Compra', date: '06 Jun 2026', expiry: 'N/A', status: 'green', size: '0.9 MB', fileKey: 'OC-4540' }
    ]
  },
  'srv-2026-050': {
    path: 'Servicios / Puerto Lirquén / #SRV-2026-050',
    files: [
      { name: 'Plan_Rigging_SRV-2026-050.pdf', type: 'Plan de Rigging', date: '10 Jun 2026', expiry: 'N/A', status: 'green', size: '1.3 MB', fileKey: 'Plan_Rigging_SRV-2026-050' },
      { name: 'AST_Digital_SRV-2026-050.pdf', type: 'AST Digital', date: '11 Jun 2026', expiry: 'N/A', status: 'green', size: '0.8 MB', fileKey: 'AST_Digital_SRV-2026-050' }
    ]
  }
};
```

---

## 2. PROTOCOLO DE PERSISTENCIA

- **Prefijo de ID:** `DOC-`
- **Destino en LocalStorage:** `gsp_document_library_active_folder` (mantiene la carpeta seleccionada en el árbol para conservar el estado tras recargar).
- **Endpoint del API (Consulta de Archivos):** `GET /api/documentos/folder/{folderKey}`
- **Endpoint del API (Filtros):** `GET /api/documentos/folder/{folderKey}?status={all|green|amber|red}&q={query}`
- **Payload de Sincronización:**
```json
{
  "activeFolder": "flota-ltm-1220",
  "filters": {
    "query": "Certificado",
    "status": "green"
  }
}
```

---

## 3. REGLAS DE UI/UX Y VALIDACIÓN

- **Navegación e Inicialización:**
  - El sidebar de la consola contiene la pestaña **Gestor Documental** (`data-view="documentos"`).
  - Al hacer clic, invoca `switchView('documentos', this)` lo cual carga la carpeta inicial por defecto (`flota-ltm-1220`).
  - La selección se realiza ejecutando `selectFolder(folderKey, element)`. Esta limpia los filtros de búsqueda local y refresca la lista.
- **Estructura Estilo File Manager (FileManager Tree):**
  - **Panel Izquierdo:** Un árbol de directorios con dos secciones raíz expandibles/colapsables mediante la función `toggleTreeSection(sectionId)`:
    - *Equipos (Flota):* Grúas con formato `[Modelo] ([Patente])`.
    - *Clientes & Servicios:* Carpetas de clientes con subcarpetas para cada servicio en formato `#SRV-[Año]-[Folio] ([Faena])`.
  - **Panel Derecho:** Visor de archivos que carga la tabla con la lista de documentos en formato de grilla.
- **Control de Vigencias en Semáforo:**
  - **Vigente (Green):** Indica que el documento está al día.
  - **Por Vencer (Amber):** Para plazos inferiores a 30 días. Muestra icono de reloj de arena (`⏳`).
  - **Vencido (Red):** Destaca el documento con animación CSS pulsante (`pulse`) e icono de advertencia (`⚠`).
- **Filtro y Búsqueda Local:**
  - El input `#fm-search` y el combobox `#fm-filter-status` ejecutan la función reactiva `filterFmFiles()` con el evento `oninput` y `onchange`. Ocultan del DOM las filas de la tabla `#fm-files-table` que no correspondan a los criterios aplicados.
- **Acción Integrada PDF:** Al presionar "Ver Doc", se ejecuta `openPdfModal(fileKey)`. Esta función simula la descarga o visualización in situ en el visor oficial de firmas y sellos digitales de la Consola GSP.
