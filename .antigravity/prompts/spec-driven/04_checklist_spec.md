# 📋 Especificación de Formulario: Checklist Pre-Operacional

Este documento define la estructura de datos, lógica de control, validaciones y protocolo de persistencia para el formulario **Checklist Pre-Operacional** en la App del Operador.

---

## 1. MODELO DE DATOS REACTIVO LITERAL
```javascript
const checklistData = {
  id: "CH-20260621-SRV041", // Formato: CH-YYYYMMDD-[ServiceNumber]
  serviceId: "#SRV-2026-041",
  operatorId: "usr-uuid-123",
  cranePlate: "GZBC-58",
  timestamp: "2026-06-21T08:00:00Z",
  items: [
    { id: "item-eslingas", text: "Eslingas y grilletes inspeccionados (sin fisuras ni deformaciones)", val: true, obs: "" },
    { id: "item-hidraulico", text: "Nivel hidráulico y lubricantes verificados", val: true, obs: "" },
    { id: "item-cables", text: "Cables de izaje inspeccionados (sin hilos rotos ni cocas)", val: true, obs: "" },
    { id: "item-estabilizadores", text: "Estabilizadores completamente desplegados y apoyados sobre platos", val: true, obs: "" },
    { id: "item-ast", text: "AST (Análisis Seguro de Trabajo) completado y firmado por equipo", val: false, obs: "Pendiente firma de rigger" }
  ],
  generalObservations: "Equipos de izaje auxiliares conformes. Terreno compactado."
};
```

---

## 2. PROTOCOLO DE PERSISTENCIA
- **Prefijo de ID:** `CH-`
- **Destino en LocalStorage:** `gsp_buffered_checklists`
- **Endpoint del API:** `POST /api/operator/checklist`
- **Payload de Sincronización:**
```json
{
  "id": "CH-20260621-SRV041",
  "serviceId": "#SRV-2026-041",
  "items": [
    { "id": "item-eslingas", "val": true, "obs": "" },
    { "id": "item-hidraulico", "val": true, "obs": "" },
    { "id": "item-cables", "val": true, "obs": "" },
    { "id": "item-estabilizadores", "val": true, "obs": "" },
    { "id": "item-ast", "val": false, "obs": "Pendiente firma de rigger" }
  ],
  "generalObservations": "Equipos de izaje auxiliares conformes. Terreno compactado."
}
```

---

## 3. REGLAS DE UI/UX Y VALIDACIÓN
- **Bloqueo Operativo:** Si cualquiera de los primeros 4 ítems críticos (`item-eslingas`, `item-hidraulico`, `item-cables`, `item-estabilizadores`) se marca como `false`, la aplicación debe deshabilitar el botón "Enviar Reporte del Día" y emitir una alerta roja con el mensaje: *"CRÍTICO: No se puede operar la grúa con fallas en elementos de izaje o estabilización."*
- **Sincronización:** Si falla la conexión HTTP, se almacena en el búfer local con estado `PENDING_SYNC`.
