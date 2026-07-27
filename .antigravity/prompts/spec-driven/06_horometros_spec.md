# ⏱ Especificación de Formulario: Registro Diario de Horómetros

Este documento define la estructura de datos, lógica de control, validaciones y protocolo de persistencia para el formulario **Registro Diario de Horómetros** en la App del Operador.

---

## 1. MODELO DE DATOS REACTIVO LITERAL
```javascript
const horometrosData = {
  id: "HR-20260621-SRV041", // Formato: HR-YYYYMMDD-[ServiceNumber]
  serviceId: "#SRV-2026-041",
  operatorId: "usr-uuid-123",
  cranePlate: "GZBC-58",
  engineHoursStart: 6864.0,
  engineHoursEnd: 6870.5,
  operationHoursToday: 6.5, // Calculado automáticamente: End - Start
  litersFuelCharged: 45.0,
  observations: "Operación de montaje normal. CMPC Laja."
};
```

---

## 2. PROTOCOLO DE PERSISTENCIA
- **Prefijo de ID:** `HR-`
- **Destino en LocalStorage:** `gsp_buffered_horometros`
- **Endpoint del API:** `POST /api/operator/horometros`
- **Mapeo a PDF:** Los datos de este formulario alimentan de forma directa el `Reporte_Horometros_SRV041.pdf` que se visualiza en la Consola de Despacho.

---

## 3. REGLAS DE UI/UX Y VALIDACIÓN
- **Validación de Rango:** El campo `engineHoursEnd` debe ser estrictamente mayor que `engineHoursStart`. La interfaz mostrará un mensaje de error si es igual o menor, impidiendo el envío.
- **Cálculo en Tiempo Real:** El valor de `operationHoursToday` se calcula y muestra en pantalla dinámicamente a medida que el operador edita la hora de término.
