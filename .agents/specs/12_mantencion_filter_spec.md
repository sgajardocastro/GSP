# 🚛 Especificación de Filtro: Mantención de Flota

Este documento define la estructura de datos, lógica de búsqueda, filtros de fecha, KPIs autocalculados y la interacción de la Ficha 360° para la sección de **Mantención de Flota** en la Consola GSP.

---

## 1. MODELO DE DATOS REACTIVO LITERAL

```javascript
const fleetMantencionState = {
  filters: {
    query: "",          // Mapeado a input #fleet-search
    dateFrom: "",       // Mapeado a input #fleet-date-from (formato YYYY-MM-DD)
    dateTo: ""          // Mapeado a input #fleet-date-to (formato YYYY-MM-DD)
  },
  kpis: {
    totalEquipos: 0,    // Mapeado a #fleet-kpi-total
    operativos: 0,      // Mapeado a #fleet-kpi-operativos
    enTaller: 0,        // Mapeado a #fleet-kpi-taller
    alertasDocs: 0      // Mapeado a #fleet-kpi-alertas
  },
  columns: [
    { key: "equipo", label: "Equipo (Marca/Modelo/Patente)", type: "composite" },
    { key: "capacidad", label: "Capacidad (T)", type: "text_mono" },
    { key: "sucursal", label: "Sucursal", type: "text" },
    { key: "horometroMotor", label: "Horómetro Motor", type: "text_mono" },
    { key: "horometroIzaje", label: "Horómetro Izaje", type: "text_mono" },
    { key: "proxMantencion", label: "Próx. Mantención", type: "composite" },
    { key: "ultimaInsp", label: "Última Insp.", type: "date_mono" },
    { key: "statusDocs", label: "Status Docs", type: "badge_indicator" },
    { key: "accion", label: "Acción", type: "button_modal" }
  ]
};
```

---

## 2. PROTOCOLO DE PERSISTENCIA

- **Prefijo de ID:** `FLEET-`
- **Destino en LocalStorage:** `gsp_fleet_filters` (mantiene los filtros aplicados en el control de flota de grúas pesadas).
- **Endpoint del API (Consulta de Datos):** `GET /api/fleet/status?q={query}&from={dateFrom}&to={dateTo}`
- **Payload de Sincronización:**
```json
{
  "filters": {
    "query": "Liebherr",
    "dateFrom": "2026-06-10",
    "dateTo": "2026-06-21"
  }
}
```

---

## 3. REGLAS DE UI/UX Y VALIDACIÓN

- **Búsqueda Filtrada:** El input `#fleet-search` activa la función `applyTableFilters('mantencion')` en cada evento `oninput`. Filtra filas de manera instantánea buscando coincidencia de texto en patente, modelo y sucursal de la grúa.
- **Rango Temporal de Inspección:** El filtro de fecha desde (`#fleet-date-from`) y hasta (`#fleet-date-to`) evalúa el atributo `data-date` de cada fila (el cual representa la fecha de su última inspección). Oculta la fila si cae fuera de los límites.
- **Lógica de KPIs de Flota:**
  - **Taller (En Mantención):** Se incrementa si el texto de la fila contiene "en taller" o "en mantención".
  - **Alertas de Documentación:** Se incrementa si el texto de la fila contiene "vencido", "vencidos", "RT Próxima" o "rt próxima".
  - **Operativos:** Se incrementa para todas las demás grúas que no estén en taller ni posean alertas/vencimientos vigentes.
- **Interacción Ficha 360°:** El botón de acción "Ver Ficha 360" en la última columna ejecuta la función `openFichaEquipo(plate)`. Carga en tiempo de ejecución los metadatos correspondientes de la patente (Liebherr GZBC-71, GZBC-61, GZBC-58 o GZBC-43) y actualiza de forma dinámica las pestañas de especificaciones técnicas, documentos legales vigentes/vencidos, checklist de inspecciones y mantenimientos correctivos.
- **Exportación Segura:** Exporta la tabla mediante `exportTableToExcel('fleet-table', 'Control_Flota_GSP.csv')`. Remueve del flujo del archivo CSV el botón "Ver Ficha 360" y la columna de Acción para que sólo contenga datos útiles de la flota.
