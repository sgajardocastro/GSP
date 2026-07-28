# 💵 Especificación de Filtro: Estados de Pago (EDP)

Este documento define la estructura de datos, lógica de búsqueda, filtros de fecha, KPIs financieros autocalculados en tiempo real (monto devengado y estados), exportación a Excel y generación de Dossier PDF para la sección de **Estados de Pago** (Control de Cruce de Devengado) en la Consola GSP.

---

## 1. MODELO DE DATOS REACTIVO LITERAL

```javascript
const edpCruceState = {
  filters: {
    query: "",          // Mapeado a input #edp-search
    dateFrom: "",       // Mapeado a input #edp-date-from (formato YYYY-MM-DD)
    dateTo: ""          // Mapeado a input #edp-date-to (formato YYYY-MM-DD)
  },
  kpis: {
    totalServicios: 0,  // Mapeado a #edp-kpi-total
    montoAcumulado: 0,  // Mapeado a #edp-kpi-monto (Suma total en pesos CLP)
    aprobadosOc: 0,     // Mapeado a #edp-kpi-aprobados
    pendientesFirma: 0  // Mapeado a #edp-kpi-pendientes
  },
  columns: [
    { key: "servicio", label: "Servicio", type: "text_mono_amber" },
    { key: "fecha", label: "Fecha", type: "date_mono" },
    { key: "clienteObra", label: "Cliente / Obra", type: "composite" },
    { key: "grua", label: "Grúa", type: "text_mono" },
    { key: "hrsReportadas", label: "Hrs Reportadas", type: "text_mono" },
    { key: "tarifaHr", label: "Tarifa/Hr", type: "text_mono" },
    { key: "devengadoTerreno", label: "Devengado Terreno", type: "text_mono_bold" },
    { key: "ordenCompra", label: "Orden de Compra", type: "badge" },
    { key: "firmaFes", label: "Firma (FES)", type: "badge" },
    { key: "accion", label: "Acción", type: "button_pdf_modal" }
  ]
};
```

---

## 2. PROTOCOLO DE PERSISTENCIA

- **Prefijo de ID:** `EDP-`
- **Destino en LocalStorage:** `gsp_edp_filters` (mantiene los filtros activos del listado de Estados de Pago).
- **Endpoint del API (Consulta de Datos):** `GET /api/edp/list?q={query}&from={dateFrom}&to={dateTo}`
- **Payload de Sincronización:**
```json
{
  "filters": {
    "query": "CMPC",
    "dateFrom": "2026-06-01",
    "dateTo": "2026-06-21"
  }
}
```

---

## 3. REGLAS DE UI/UX Y VALIDACIÓN

- **Búsqueda General:** El input `#edp-search` ejecuta la función `applyTableFilters('cruce')` mediante el evento `oninput`. Realiza búsquedas de coincidencia en el ID del servicio, cliente, faena y patente de la grúa.
- **Rango de Fechas Operacionales:** Los inputs `#edp-date-from` y `#edp-date-to` evalúan el atributo `data-date` (fecha del servicio) en cada fila de `edp-table` para ocultar o mostrar filas.
- **Lógica de KPIs Financieros y Estados (Tiempo Real):**
  - **Suma de Devengado:** Para cada fila visible, se extrae el texto de la columna 7 (Devengado Terreno, índice 6). Se eliminan caracteres no numéricos (`row.cells[6].textContent.replace(/[^0-9]/g, '')`), se convierte a entero y se suma. El total acumulado se renderiza en `#edp-kpi-monto` formateado en moneda local (`'$' + totalMonto.toLocaleString('es-CL')`).
  - **Aprobados (con OC):** Se incrementa si la fila visible contiene el texto `"aprobado"` o `"oc-"`.
  - **Pendientes:** Se incrementa para cualquier otra fila visible que no cumpla el criterio de aprobado.
- **Acción Dossier PDF:** Al hacer clic en "Generar Dossier PDF", se ejecuta la función `openPdfModal(serviceId)` (ej: `#SRV-041`). Carga los datos consolidados del servicio (horas devengadas, firmas del supervisor, firma digital FES y hash único) y los renderiza en un visor modal interactivo que simula el documento oficial de firma electrónica.
- **Exportación en Español (Separado por `;` con BOM):** El botón de exportar Excel invoca la función `exportTableToExcel('edp-table', 'Estados_de_Pago_GSP.csv')`. Esta función elimina del CSV los botones de acción para generar Dossier PDF y escribe un archivo plano con prefijo UTF-8 BOM (`\uFEFF`) y delimitadores de punto y coma (`;`), asegurando que Excel en entornos en español abra los montos financieros y caracteres con tildes correctamente sin requerir importación manual.
