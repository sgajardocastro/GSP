# 👤 Especificación de Filtro: Acreditación de Personal

Este documento define la estructura de datos, lógica de búsqueda, filtros de fecha, KPIs autocalculados y exportación a Excel para la sección de **Acreditación de Personal** en la Consola GSP.

---

## 1. MODELO DE DATOS REACTIVO LITERAL

```javascript
const personalAcreditacionState = {
  filters: {
    query: "",          // Mapeado a input #acred-search
    dateFrom: "",       // Mapeado a input #acred-date-from (formato YYYY-MM-DD)
    dateTo: ""          // Mapeado a input #acred-date-to (formato YYYY-MM-DD)
  },
  kpis: {
    totalPersonal: 0,   // Mapeado a #acred-kpi-total
    habilitados: 0,     // Mapeado a #acred-kpi-habilitados
    bloqueados: 0,      // Mapeado a #acred-kpi-bloqueados
    tasaHabilitacion: 0 // Mapeado a #acred-kpi-tasa (porcentaje %)
  },
  columns: [
    { key: "nombre", label: "Nombre", type: "text" },
    { key: "rol", label: "Rol", type: "text" },
    { key: "fechaControl", label: "Fecha Control", type: "date" },
    { key: "licenciaD", label: "Licencia Clase D", type: "badge" },
    { key: "certIzaje", label: "Cert. Izaje", type: "badge" },
    { key: "induccion", label: "Inducción Mandante", type: "badge" },
    { key: "examen", label: "Examen Ocupacional", type: "badge" },
    { key: "estado", label: "Estado", type: "badge" }
  ]
};
```

---

## 2. PROTOCOLO DE PERSISTENCIA

- **Prefijo de ID:** `ACRED-`
- **Destino en LocalStorage:** `gsp_acred_filters` (mantiene en memoria los parámetros de búsqueda activos para evitar que el usuario los pierda al navegar entre módulos).
- **Endpoint del API (Consulta de Datos):** `GET /api/acreditacion/personal?q={query}&from={dateFrom}&to={dateTo}`
- **Payload de Sincronización:**
```json
{
  "filters": {
    "query": "Juan Pérez",
    "dateFrom": "2026-06-01",
    "dateTo": "2026-06-22"
  }
}
```

---

## 3. REGLAS DE UI/UX Y VALIDACIÓN

- **Búsqueda en Tiempo Real (Fuzzy Text):** Cada vez que se ingresa texto en el input `#acred-search`, se ejecuta la función `applyTableFilters('acreditacion')` vía el evento `oninput`. La búsqueda es insensible a mayúsculas/minúsculas y evalúa todas las columnas de texto de la fila.
- **Rango de Fechas Operativo:** Al cambiar `#acred-date-from` o `#acred-date-to`, se ejecuta `applyTableFilters('acreditacion')` vía `onchange`. Las filas de la tabla deben poseer un atributo `data-date` (formato `YYYY-MM-DD`). Si el atributo de la fila está fuera del rango ingresado, la fila se oculta (`style.display = 'none'`).
- **Botón de Limpieza Dinámico:** El botón `#acred-reset` ("Limpiar") debe mostrarse (`style.display = 'inline-block'`) únicamente cuando al menos uno de los tres filtros (búsqueda, fecha desde, fecha hasta) tenga un valor configurado. Al hacer clic, se restablecen los valores a vacío y se refresca la tabla.
- **Cálculo de KPIs en Tiempo Real:** Posterior al filtrado de la tabla, la función `updateTableKPIs('acreditacion')` analiza las filas visibles (`style.display !== 'none'`) y actualiza:
  - **Total de Personal Visible:** Cantidad de filas filtradas.
  - **Habilitados:** Filas visibles cuya celda de estado contenga el texto "habilitado".
  - **Bloqueados:** Filas visibles cuya celda de estado contenga el texto "bloqueado".
  - **Tasa de Habilitación:** `Math.round((habilitados / total) * 100)`. Si no hay filas, se define en `0%`.
- **Exportación a Excel:** El botón "Exportar a Excel" invoca `exportTableToExcel('acred-table', 'Acreditacion_Personal_GSP.csv')`. Esta función omite la columna de acciones del CSV resultante y antepone el prefijo UTF-8 BOM (`\uFEFF`) separando columnas con punto y coma (`;`) para asegurar la compatibilidad automática con Microsoft Excel en español.
