# SPEC-090: Reingeniería Enterprise de Experiencia de Usuario en Inventario & WMS
## (Navegación Persistente, Auditoría de Racks, Dualidad de QRs y Expediente 360° de Existencias)

**Estado:** Aprobada para Implementación  
**Fecha:** 2026-10-21  
**Autor:** Sergio Gajardo / Senior ERP & WMS Specialist  
**Ambiente:** DEV (`https://servidor.leanglobal.cl/lg-gsp-dev/`)  
**Requerimiento Asociado:** `REQ-1062`  

---

## 1. Contexto y Diagnóstico Operativo

Tras la sesión de validación operativa en terreno del módulo de inventario, se identificaron fricciones críticas de experiencia de usuario y diseño conceptual que distancian la solución del estándar de un sistema Enterprise WMS (Warehouse Management System).

### 1.1 Deficiencias Detectadas
1. **Autocierre del Menú Lateral (`Sidebar.vue`):** En jornadas de almacén, el usuario realiza navegación intensiva continua entre bodegas, catálogo, recepciones y despachos. El cierre o colapso automático del menú lateral entorpece el flujo de trabajo.
2. **Denominación Reductiva ("Lite"):** El sufijo "Lite" (`Inventario (WMS-Lite)`) devalúa la percepción corporativa del producto frente a la gerencia de Grúas San Pablo, transmitiendo la falsa impresión de una herramienta preliminar o incompleta.
3. **Ambigüedad y Confusión en la Celda de Racks (`BodegasView.vue`):**
   * En un casillero físico de estantería (ej. `E1-C2`) conviven múltiples repuestos diferentes (hasta 5 o más SKUs).
   * La interfaz presentaba una única etiqueta QR estática al pie de la columna sin aclarar si correspondía al casillero o a los productos, impidiendo imprimir etiquetas individuales para los repuestos físicos.
   * Las tarjetas de repuestos de la celda eran inertes (no permitían hacer clic ni ver antecedentes).
4. **Pestaña Técnica Expuesta ("Migración de Ubicaciones Legadas"):** La presencia de una pestaña orientada a la migración histórica de GeoSoft resulta incomprensible e inapropiada en la vista operativa de los usuarios de bodega.
5. **Formateo Numérico Inadecuado y Falta de Trazabilidad en "Todas las Existencias":**
   * Mostrar cantidades como `0.0000 UN` o `7.0000 UN` resulta tosco y desprolijo para unidades enteras.
   * La tabla no permitía hacer clic sobre los registros para consultar la historia, traspasos o consumos de cada existencia.

---

## 2. Requerimientos Funcionales y de Arquitectura UI

### RF-90.1: Persistencia del Menú Lateral y Erradicación del Sufijo "Lite"
* **Persistencia de Navegación:** El sidebar debe respetar el estado expandido del usuario (`navStore.isCollapsed = false`) y persistirlo en `localStorage` (`gsp_sidebar_collapsed`). No debe colapsarse automáticamente al navegar entre vistas del módulo de inventario.
* **Denominación Corporativa:** Renombrar todas las referencias de "Inventario (WMS-Lite)" a **"Inventario & WMS"** (en menú lateral, títulos de vistas, breadcrumbs y metadatos).

### RF-90.2: Reingeniería del Mapa de Bodegas y Racks (`BodegasView.vue`)
* **Supresión de la Pestaña Legada:** Retirar la pestaña "Migración de Ubicaciones Legadas" de la interfaz de usuario.
* **Pantalla Principal Despejada (Sin Columna Lateral Estática):**
  * Se elimina completamente la columna estática de inspección que reducía el espacio útil del mapa.
  * El mapa de estanterías y casilleros se expande sobre el espacio principal (`lg:col-span-3`), ofreciendo una visualización amplia y limpia de las 42 celdas por rack.
* **Apertura de Casillero mediante Modal Interactivo (Split 1/4 vs 3/4):**
  Al hacer clic en cualquier celda de la estantería (ej. `E4-D2`), se abre un **Modal Interactivo** con distribución asimétrica:
  1. **Panel Izquierdo (1/4 - 25% del ancho):**
     * Identificación y coordenadas de la celda (`Est. E4 · Nivel D · Posición 2`).
     * Bodega asignada y conteo total de repuestos alojados y unidades físicas.
     * Simulación exacta de la **Etiqueta Física del Casillero en Rack (50×30 mm)** con QR de viga `UB:E4-D2` para adherir a la estructura metálica.
     * Botón de acción: `[ 🖨️ Imprimir QR de Casillero ]`.
  2. **Panel Derecho (3/4 - 75% del ancho):**
     * **Tabla Enterprise Densa de Existencias:** Visualización completa de todos los repuestos alojados en el casillero seleccionado.
     * Columnas operacionales: SKU Canónico, Código Legado, Descripción / Repuesto, Familia / Categoría, Stock Físico, Reservado en OTs, Disponible Neto, Costo Unitario PMP, Total Valorizado y Acciones.
     * Acciones por cada registro:
       - `[ 🔍 Abrir Formulario Único ]`: Abre el expediente maestro de la existencia con todo su historial Kardex 360°, entradas por compra, salidas a OTs y traspasos entre bodegas.
       - `[ 🏷️ QR SKU ]`: Emisión directa de la etiqueta térmica adhesiva individual del SKU (50×30 mm) con su QR de producto.

### RF-90.3: Expediente 360° de la Existencia (Modal / Drawer Interactivo)
Al hacer clic sobre cualquier repuesto —ya sea en la columna de la celda del rack o en la tabla consolidada de existencias— se abrirá una ventana modal de **Expediente 360° de la Existencia** con tres bloques informativos:
1. **Ficha y Saldos Actuales:**
   * SKU, Código Legado, Nombre oficial y Familia.
   * Ubicación física exacta (Estantería, Nivel, Posición o Área especial).
   * Desglose de existencias: Stock Físico Total, Stock Reservado (en OTs de taller abiertas), y Stock Disponible Neto.
   * Precio Medio Ponderado (PMP) vigente en \$ CLP.
2. **Historial de Movimientos y Trazabilidad (Línea de Tiempo Kardex):**
   * Fecha y hora de cada transacción.
   * Tipo de movimiento (`RECEPCION_COMPRA`, `SALIDA_OT`, `DEVOLUCION_OT`, `TRASPASO_SALIDA`, `TRASPASO_ENTRADA`, `AJUSTE_CONTEO`).
   * Documento y Folio asociado (N° de OT de grúa, N° Factura/Guía de Proveedor, Acta de Conteo).
   * Cantidad (+/-) y saldo posterior resultante.
   * Usuario responsable del movimiento.
3. **Acciones Operativas:**
   * Botón para imprimir etiqueta individual de repuesto.
   * Acceso directo a la ficha del catálogo maestro.

### RF-90.4: Formateo Numérico Inteligente y Filtros en "Todas las Existencias"
* **Función de Formateo Canónica (`formatCantidad`):**
  * Para unidades de medida discretas (`UN`, `PAR`, `JUEGO`, `KIT`, `PZA`, `TAMBOR`, `BALDE`, `ROLLO`): Formatear estrictamente sin decimales (`7 UN`, `0 UN`).
  * Para unidades fraccionables (`L`, `kg`, `m`, `m2`, `m3`): Mostrar decimales necesarios (hasta 2 decimales, suprimiendo ceros redundantes: `15.5 L`, `2.75 kg`).
* **Filtros Operacionales:**
  * Segmented control o switch:
    * `[ Con Stock Físico (> 0) ]` (Seleccionado por defecto para evitar ruido visual).
    * `[ Todo el Catálogo (Incluye saldo 0) ]`.
* **Interactividad en Tabla:** Todas las filas de existencias deben contar con efecto visual de selección (`cursor-pointer`, `hover:bg-slate-800/60`) y disparar la apertura del Expediente 360°.

### RF-90.5: Reingeniería Enterprise de Recepción de Materiales (WMS Inbound)
* **Integración con Órdenes de Compra (`tcmp_orden_compra`):** Selector reactivo de OCs aprobadas (`/api/compras/ordenes`) que puebla automáticamente el proveedor, condiciones y líneas pedidas a recepcionar.
* **Soporte de Ingreso Directo:** Modo alternativo para compras locales en faena, devoluciones de OT de mantenimiento y garantías de proveedores.
* **Erradicación de Datos Mock y Límites Ciegos:** Consulta real de los 2.854 repuestos de catálogo y todas las ubicaciones físicas de estantería disponibles.
* **Emisión Inmediata de Etiquetas Adhesivas (50×30 mm):** Modal post-recepción con confirmación de folio `REC-XXXX` y botón de impresión en lote para rotular físicamente los repuestos antes de guardarlos en los racks.
* **Historial Conectado a Kardex Real:** Pestaña 2 que lista las entradas inmutables registradas en `tinv_movimiento` con reimpresión de QR individual.

---

## 3. Matriz de Cambios por Archivo

| Archivo | Ámbito de Intervención |
| :--- | :--- |
| `ejecucion/frontend/src/components/Sidebar.vue` | Renombrar menú a `Inventario & WMS`. Preservar estado expandido sin autocierre. Renombrar a `1. Bodegas & Ubicaciones` y `2. Maestro de Existencias`. |
| `ejecucion/frontend/src/views/inventario/BodegasView.vue` | 1. Eliminar pestaña de migración legada.<br>2. Expansión a 3 columnas del mapa y eliminación de columna fija lateral.<br>3. Modal interactivo 1/4 (casillero y QR viga 50x30mm) vs 3/4 (tabla enterprise con Formulario Único 360°). |
| `ejecucion/frontend/src/views/inventario/ProductosView.vue` | Erradicación total del drawer lateral deslizante. Modal Enterprise Centrado del Formulario Único. 5 KPIs ejecutivos superiores y barra de búsqueda/filtros profesional. |
| `ejecucion/frontend/src/views/inventario/RecepcionMaterialesView.vue` | Rediseño integral Inbound: 2 pestañas (Nueva Recepción vs Historial Kardex), integración nativa con OCs de Compras, eliminación de datos mock y emisión de etiquetas térmicas 50x30 mm. |

---

## 4. Criterios de Aceptación y QA Determinista

1. **CA-01 (Menú):** El usuario navega entre Bodegas, Catálogo y Recepción; el sidebar permanece fijo y abierto según su preferencia.
2. **CA-02 (Identidad):** Ninguna pantalla, menú o título contiene la palabra "Lite".
3. **CA-03 (Rack y QRs):** En una celda con múltiples repuestos, cada repuesto cuenta con su botón para imprimir su etiqueta individual con SKU, y la sección inferior identifica sin dudas que el QR grande es del casillero físico.
4. **CA-04 (Expediente 360°):** Al hacer clic en un repuesto (en rack o en tabla), se despliega el modal con su historial Kardex completo (recepciones, salidas a OTs y traspasos).
5. **CA-05 (Higiene Numérica):** En ninguna vista se renderiza `0.0000 UN` ni `7.0000 UN`.
6. **CA-06 (Compilación y Despliegue):** `npm run build:dev` finaliza con 0 errores y despliegue exitoso en DEV con HTTP 200 OK.
