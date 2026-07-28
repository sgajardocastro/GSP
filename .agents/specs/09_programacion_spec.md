# 📅 Especificación de Formulario: Programar Nuevo Servicio

Este documento define la estructura de datos, lógica de control, validaciones y protocolo de persistencia para el formulario **Programar Nuevo Servicio** en el Panel de Despacho.

---

## 1. MODELO DE DATOS REACTIVO LITERAL
```javascript
const nuevoServicioData = {
  id: "SRV-2026-055", // Autoincremental autogenerado por el backend
  clientName: "Celulosa Arauco",
  faenaName: "Planta Horcones",
  maneuverDescription: "Montaje de estructura metálica de galpón",
  craneTypeRequired: "PESADO", // PLUMA | CAMA | PESADO
  ratePerHour: 350000, // CLP
  estimatedHours: 24,
  estimatedTotal: 8400000, // Calculado: ratePerHour * estimatedHours
  startDate: "2026-06-25",
  endDate: "2026-06-28"
};
```

---

## 2. PROTOCOLO DE PERSISTENCIA
- **Prefijo de ID:** `SRV-2026-`
- **Destino en Base de Datos:** Inserta una fila en la tabla `ServiceRequest` con estado inicial `SOLICITADO`.
- **Endpoint del API:** `POST /api/services`

---

## 3. REGLAS DE UI/UX Y VALIDACIÓN
- **Cálculo Automático:** A medida que se edita el campo `ratePerHour` o `estimatedHours`, el total estimado (`estimatedTotal`) se calcula y formatea automáticamente en pantalla.
- **Fecha Mínima:** La fecha de inicio (`startDate`) debe ser igual o posterior a la fecha del día actual.
