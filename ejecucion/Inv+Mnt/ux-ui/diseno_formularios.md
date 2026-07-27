# Diseños Visuales de Formularios (Maquetas UI/UX)

**Sistema**: Global Manager (Transmac / GSP)  
**Tema Visual**: Dark Slate (`#030712`), Acento Índigo (`#6366f1` WMS), Acento Esmeralda (`#10b981` Mantenimiento)  

---

## 🎨 Galería de Maquetas UI en Alta Fidelidad

````carousel
![Formulario de Recepción e Ingreso a Bodega (WMS-Lite)](file:///C:/Users/sgaja/.gemini/antigravity/brain/841d80bf-22f4-45cc-b03c-e1cf54b1019c/recepcion_material_ui_1785105979788.png)
<!-- slide -->
![Vista de Detalle de OT, Checklist y Cierre con PIN (Mantenimiento)](file:///C:/Users/sgaja/.gemini/antigravity/brain/841d80bf-22f4-45cc-b03c-e1cf54b1019c/detalle_ot_ui_1785105991026.png)
````

---

## 1. Formulario: Recepción e Ingreso de Materiales (WMS-Lite)

![Maqueta UI Recepción de Materiales](file:///C:/Users/sgaja/.gemini/antigravity/brain/841d80bf-22f4-45cc-b03c-e1cf54b1019c/recepcion_material_ui_1785105979788.png)

### Elementos Clave del Diseño
- **Formato**: Drawer lateral deslizante (*Slide-Over*) que no pierde el contexto de la lista de bodegas de fondo.
- **Header**: Botón de cierre `[X]` y título descriptivo con icono de bodega.
- **Búsqueda**: Autocomplete reactivo para encontrar repuestos por código de fábrica o SKU.
- **Badges de Alerta**:
  - Alerta en rojo si el costo de adquisición es $0 (`COSTO_CERO_NO_PERMITIDO`).
  - Asterisco de obligatoriedad en campo de Nº de Orden de Compra (OC).
- **Acción Primaria**: Botón destacado en color Índigo (`#6366f1`) con animación hover y efecto de elevación.

---

## 2. Formulario: Detalle, Checklist y Cierre de OT con PIN (Mantenimiento)

![Maqueta UI Detalle de OT y Cierre PIN](file:///C:/Users/sgaja/.gemini/antigravity/brain/841d80bf-22f4-45cc-b03c-e1cf54b1019c/detalle_ot_ui_1785105991026.png)

### Elementos Clave del Diseño
- **Formato**: Modal de pantalla completa o container principal con navegación por pestañas (*Actividades*, *Materiales*, *Mano de Obra*, *Servicios Externos*).
- **Header de OT**: Patente visible (`PAD-33-SN`), modelo de equipo y pill semafórico para el estado (`EN_PROCESO` en amarillo).
- **Tabla de Actividades**:
  - Filas con tarjetas oscuras (`bg-darkcard`).
  - Badges de estado por tarea (`COMPLETADA` en verde, `EN_PROCESO` en amarillo, `PENDIENTE` en gris).
- **Modal de Seguridad PIN**:
  - Tarjeta en la esquina inferior derecha con candado de seguridad.
  - Inputs de 4 dígitos tipo PIN (`* * * *`) que autoriza la firma del supervisor para cerrar la OT.
  - Botón primario en color Esmeralda (`#10b981`).
