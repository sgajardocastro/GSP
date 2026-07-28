# 🏗 Especificación de Formulario: Asignación de Recursos / Personal

Este documento define la estructura de datos, lógica de control, validaciones y protocolo de persistencia para el formulario **Asignación de Recursos / Personal** en el Panel de Despacho.

---

## 1. MODELO DE DATOS REACTIVO LITERAL
```javascript
const asignacionRecursosData = {
  id: "AS-SRV041", // Formato: AS-[ServiceNumber]
  serviceId: "#SRV-2026-041",
  craneId: "crn-uuid-789", // Liebherr LTM 1220
  operatorId: "op-uuid-456", // Juan Pérez
  riggerId: "op-uuid-889", // Roberto Soto
  hseId: "usr-uuid-990", // Gonzalo Parra
  scheduledStartDate: "2026-06-02T08:00:00Z",
  scheduledEndDate: "2026-06-28T18:00:00Z"
};
```

---

## 2. PROTOCOLO DE PERSISTENCIA
- **Prefijo de ID:** `AS-`
- **Destino en Base de Datos:** Actualiza el registro de `ServiceRequest` y asocia los IDs de la grúa, operador y riggers en la base de datos PostgreSQL mediante Prisma.
- **Endpoint del API:** `PUT /api/services/assign-resources`

---

## 3. REGLAS DE UI/UX Y VALIDACIÓN
- **Validación de Acreditación:** Al seleccionar un operador o grúa, el sistema consulta en segundo plano su estado de acreditación. Si el operador tiene documentos bloqueados o la grúa tiene su certificado de izaje vencido, el formulario debe emitir una advertencia roja en pantalla: *"BLOQUEANTE: El operador seleccionado se encuentra bloqueado por inducción vencida. No se puede guardar la asignación."*
