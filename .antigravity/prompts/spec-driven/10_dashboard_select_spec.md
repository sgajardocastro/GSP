# 📊 Especificación de Control: Selector de Sucursal del Dashboard

Este documento define la estructura de datos, lógica de control, reactividad de gráficos y protocolo de persistencia para el selector de sucursales en el **Dashboard Ejecutivo** de la Consola GSP.

---

## 1. MODELO DE DATOS REACTIVO LITERAL

```javascript
const branchSelectorState = {
  selectedBranch: "todas", // Opciones: "todas", "temuco", "la", "valdivia"
  branches: [
    { id: "todas", label: "Todas las Sucursales", multiplier: 1.0 },
    { id: "temuco", label: "Temuco (Matriz)", multiplier: 0.60 },
    { id: "la", label: "Los Ángeles", multiplier: 0.25 },
    { id: "valdivia", label: "Valdivia", multiplier: 0.15 }
  ],
  baseSeriesData: {
    categories: ['Ene 2026', 'Feb 2026', 'Mar 2026', 'Abr 2026', 'May 2026', 'Jun 2026'],
    devengado: [110.0, 125.0, 140.0, 160.0, 185.0, 186.45],  // Expresado en Millones CLP base
    ordenCompra: [100.0, 110.0, 120.0, 150.0, 170.0, 143.65],
    aprobadoEdp: [90.0, 100.0, 115.0, 140.0, 150.0, 108.15],
    facturadoSii: [85.0, 95.0, 110.0, 130.0, 140.0, 76.40]
  }
};
```

---

## 2. PROTOCOLO DE PERSISTENCIA

- **Prefijo de ID:** `DASH-SEL-`
- **Destino en LocalStorage:** `gsp_dashboard_config` (mantiene en memoria de sesión la última sucursal consultada por el usuario).
- **Endpoint del API (Lectura de Datos):** `GET /api/dashboard/metrics?branch={branchId}`
- **Payload de Sincronización:**
```json
{
  "selectedBranch": "temuco",
  "timestamp": "2026-06-21T23:12:19Z"
}
```

---

## 3. REGLAS DE UI/UX Y VALIDACIÓN

- **Reactividad Directa:** Al cambiar el valor del elemento HTML `<select id="branch-select">`, se dispara el evento `onchange="window.updateCharts()"`, recalculando los datos de las series multiplicando cada valor base por el factor correspondiente de la sucursal.
- **Redibujado Limpio de Highcharts:** La instancia global de Highcharts `window.hcChart` debe ser destruida (`window.hcChart.destroy()`) antes de inicializar un nuevo objeto de gráfico en el contenedor `#hc-container` para evitar fugas de memoria y solapamiento visual.
- **Inicialización Automática:** Si la vista activa de la consola cambia a `'dashboard'`, se debe invocar automáticamente `window.updateCharts()` con un pequeño retardo táctico de 50ms para asegurar el correcto reajuste dimensional del contenedor.
- **Unidades:** En la visualización del eje Y del histograma, los números deben formatearse dinámicamente como `$XM` (ej: `$110M` para $110.000.000 CLP).
