# ⚡ Especificación de Formulario: AST Digital (Análisis Seguro de Trabajo)

Este documento define la estructura de datos, lógica de control, validaciones y protocolo de persistencia para el formulario **AST Digital** en la App del Operador.

---

## 1. MODELO DE DATOS REACTIVO LITERAL
```javascript
const astData = {
  id: "AST-20260621-SRV041", // Formato: AST-YYYYMMDD-[ServiceNumber]
  serviceId: "#SRV-2026-041",
  windSpeedKmh: 38.0, // Lectura del anemómetro de cabina
  terrainOk: true,
  slingsOk: true,
  electricalHazardsChecked: true,
  riskChecklist: [
    { id: "risk-terrain", text: "Terreno inestable o fangoso", present: false },
    { id: "risk-powerlines", text: "Líneas eléctricas aéreas energizadas a menos de 10 metros", present: false },
    { id: "risk-wind", text: "Ráfagas de viento sobre 35 km/h", present: true },
    { id: "risk-rigging-angle", text: "Ángulo de estrobamiento crítico (< 45°)", present: false }
  ],
  mitigations: "Pausa operativa por ráfagas de viento de 38 km/h. Esperando disminución bajo 35 km/h.",
  operatorSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...",
  riggerSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...",
  hseSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg..."
};
```

---

## 2. PROTOCOLO DE PERSISTENCIA
- **Prefijo de ID:** `AST-`
- **Destino en LocalStorage:** `gsp_buffered_ast`
- **Endpoint del API:** `POST /api/operator/ast`
- **Mapeo a PDF:** Genera automáticamente el archivo `AST_Digital_SRV041.pdf` inyectando las imágenes Base64 de las tres firmas electrónicas y el historial de velocidad de viento.

---

## 3. REGLAS DE UI/UX Y VALIDACIÓN
- **Alerta de Viento:** Si `windSpeedKmh` es mayor a **35 km/h**, la interfaz debe pintar la sección del viento en rojo brillante con el símbolo de alerta `⚠ PAUSA OPERATIVA` y bloquear la firma digital del AST hasta que el operador declare medidas de mitigación específicas en el campo `mitigations`.
