# SPEC-091: Reingeniería Enterprise del Maestro de Existencias & Expediente 360°
## (Erradicación del Drawer Lateral, Tablero de Control de Inventario, Filtros Avanzados y Ficha Maestra)

**Estado:** Aprobada para Producción / Implementada en DEV  
**Fecha:** 2026-10-21  
**Autor:** Sergio Gajardo / Senior ERP & WMS Specialist  
**Ambiente:** DEV (`https://servidor.leanglobal.cl/lg-gsp-dev/`)  
**Requerimiento Asociado:** `REQ-1063`  
**Componente Principal:** `ejecucion/frontend/src/views/inventario/ProductosView.vue`  
**Navegación:** `Sidebar.vue` (Opción 2: `2. Maestro de Existencias`)

---

## 1. Contexto, Diagnóstico y Objetivos Operacionales

### 1.1 Diagnóstico Crítico Previo
1. **Inconsistencia de Navegación por Drawer Lateral:** La interfaz utilizaba un cajón lateral deslizante (`max-w-[620px]`) desde la derecha al hacer clic sobre un producto. Esta interacción era totalmente ajena al resto del sistema GSP (que opera uniformemente mediante modales enterprise centrados), provocando rechazo visual y desorientación del usuario.
2. **Cero Indicadores Ejecutivos (KPIs):** La pantalla iniciaba de forma abrupta con una tabla plana, sin ofrecer a la jefatura de bodega ni a la gerencia un resumen cuantitativo del catálogo, stock valorizado, quiebres o distribución por familias.
3. **Filtro Lateral Desbordado e Ineficiente:** Se utilizaba una hilera de botones de familias con scroll horizontal infinito que saturaba el espacio útil y carecía de filtros por disponibilidad física de stock o criticidad operacional.
4. **Exposición de Textos de Desarrollo:** En la cabecera se mostraban notas internas de especificación técnica (*"Resuelve: C1 · SKU Mudo, C2 · Multi-referencia, C5 · BOM Grúas"*), impropias de una consola de nivel corporativo.

### 1.2 Objetivos de la Especificación
- Establecer un estándar visual corporativo de alta densidad para la gestión del catálogo y existencias físicas.
- Reemplazar el drawer deslizante por el **Modal Enterprise Centrado del Formulario Único de Existencias · Expediente Maestro 360°**.
- Incorporar 5 indicadores clave de desempeño (KPIs) calculados reactivamente sobre la data real.
- Disponer de una barra de control enterprise con búsqueda universal, selector de familias, selector de criticidad y segmented control de stock (`con existencias`, `saldo cero` y `todo el catálogo`).
- Garantizar la emisión de etiquetas térmicas adhesivas individuales (50×30 mm) con QR vectorial SVG autónomo.

---

## 2. Requerimientos Funcionales y de Arquitectura UI

### RF-91.1: Panel Superior de Indicadores Clave (KPIs Ejecutivos)
En la parte superior de la vista se disponen 5 tarjetas métricas de lectura inmediata:

| KPI | Nombre | Fórmula / Lógica | Fuente de Datos | Formato Visual |
| :--- | :--- | :--- | :--- | :--- |
| **KPI-01** | **Catálogo Total** | $\text{COUNT}(p \in \text{productos})$ | `tinv_producto` | Número entero (ej. `348`) |
| **KPI-02** | **Familias Activas** | $|\text{DISTINCT}(p.\text{familia})|$ | `tinv_producto.familia` | Número entero cyan (ej. `12`) |
| **KPI-03** | **Existencias Físicas** | $\sum \max(0, p.\text{stock\_fisico})$ | `tinv_stock` / `tinv_producto` | Formato entero UOM (ej. `4.820 UN`) |
| **KPI-04** | **Valorización PMP** | $\sum (p.\text{stock\_fisico} \times p.\text{pmp})$ | `tinv_producto.costo_pmp_vigente` | Millones y CLP completo (ej. `$148M`) |
| **KPI-05** | **Saldo Cero / Quiebre** | $\text{COUNT}(p \mid p.\text{stock\_fisico} = 0)$ | `tinv_stock` / `tinv_producto` | Número entero rojo alerta (ej. `24`) |

---

### RF-91.2: Barra de Control y Filtros Enterprise
Reemplazo total de la botonera horizontal por una barra estructurada en dos niveles:

1. **Nivel Superior (Búsqueda y Clasificación):**
   * **Buscador Universal:** Input reactivo que filtra en tiempo real sobre cuatro atributos canónicos:
     $$\text{Match} \iff (p.\text{sku} \lor p.\text{codigo\_legado} \lor p.\text{nombre} \lor p.\text{descripcion}) \text{ ILIKE } \%q\%$$
   * **Selector de Familias:** Menú desplegable `<select>` ordenado alfabéticamente con el conteo total de repuestos por familia.
   * **Selector de Criticidad:** Filtro por impacto operacional con tres niveles de riesgo:
     - `CRÍTICO`: Repuestos cuya falta provoca parada no programada de grúa (filtros primarios, cables, válvulas).
     - `IMPORTANTE`: Repuestos de mantenimiento preventivo estándar.
     - `NORMAL`: Consumibles y elementos de desgaste menor.

2. **Nivel Inferior (Control de Existencias Físicas):**
   * **Segmented Control de Stock:**
     - `[ Con Existencias (> 0) ]`: Activo por defecto. Oculta repuestos con saldo cero para agilizar la operación de bodega.
     - `[ Sin Stock (0 UN) ]`: Filtra exclusivamente artículos en quiebre para generar requisiciones de compra.
     - `[ Todo el Catálogo ]`: Vista maestra consolidada para auditorías globales.
   * **Contador Dinámico:** Muestra el número exacto de repuestos filtrados respecto al universo total.

---

### RF-91.3: Tabla Maestra de Existencias
Tabla enterprise densa optimizada para alta velocidad de lectura:
- **Columnas Canónicas:**
  1. `SKU Canónico`: Enlace monoespaciado en negrita con efecto hover.
  2. `Cód. Legado`: Referencia histórica del ERP anterior (GeoSoft).
  3. `Descripción & Referencias`: Nombre oficial y descripción técnica corta.
  4. `Familia`: Agrupación funcional del material.
  5. `Unidad`: Unidad de medida base con formateo humano (`UN`, `L`, `kg`, etc.).
  6. `Criticidad`: Badge semántico de tres colores (rojo para crítico, ámbar para importante, verde para normal).
  7. `Stock Físico`: Cantidad física consolidada en todas las bodegas.
  8. `Disponible Neto`: Saldo libre para despacho (restando reservas de OTs de taller).
  9. `PMP Vigente`: Costo unitario oficial en \$ CLP según Precio Medio Ponderado.
  10. `Total Valorizado`: Monto total inmovilizado ($\text{Stock} \times \text{PMP}$).
  11. `Acciones`: Botón `[ 📋 Formulario Único ]` y botón `[ 🏷️ QR SKU ]`.
- **Interactividad:** Clic en cualquier punto de la fila dispara la apertura del expediente 360°.

---

### RF-91.4: Modal Formulario Único de Existencias · Expediente Maestro 360°
Sustituto formal y definitivo del antiguo drawer deslizante:
- **Estructura Visual:** Modal flotante centrado (`max-w-5xl`, `max-h-[92vh]`) con fondo desenfocado (`backdrop-blur-md`).
- **Encabezado:**
  - Identificación del SKU (`GSP-XXXXXX`) con código legado y badge de casillero físico.
  - Nombre completo del repuesto.
  - Subtítulo unificado: *"Formulario Único de Existencias · Expediente Maestro 360°"*.
- **Cuatro Pestañas Operacionales:**
  1. **Ficha & Saldos:**
     - Tarjetas métricas: Stock Físico Total, Reservado en OTs, Disponible Neto y PMP Vigente.
     - Bloques de Datos Maestros (Familia, UOM, Control de Serie/Lote), Gestión de Compras (Presentación, Factor de Conversión, Condición de Rotable) y Parámetros de Reposición (Punto de Reorden ROP, Stock Mínimo y Máximo).
  2. **Ubicación en Racks:**
     - Identificación de la bodega de almacenamiento (`Bodega Taller Central`, etc.).
     - Código exacto del casillero físico en la estantería (ej. `E4-F2`, `CORRAL`, `PAÑOL`).
     - Cantidad física resguardada en dicha posición.
  3. **Trazabilidad Kardex:**
     - Historial inmutable de movimientos consumido en vivo desde `/api/inventario/kardex?id_producto=:id`.
     - Columnas: Fecha/Hora, Tipo de Operación (`RECEPCION_COMPRA`, `SALIDA_OT`, `DEVOLUCION_OT`, `TRASPASO`), Documento/Folio, Cantidad (+/-), Saldo resultante y Observaciones.
  4. **OEM & Compatibilidad:**
     - Referencias cruzadas con códigos de fabricante original (Liebherr, Parker, Rexroth) y alternativos (Donaldson, Fleetguard).
     - Lista de modelos de grúas y camiones pluma compatibles de la flota GSP.
- **Acciones en Pie de Modal:**
  - Botón: `[ 🏷️ Imprimir Etiqueta SKU Adhesiva (50×30 mm) ]`.
  - Botón: `[ Cerrar ]`.

---

### RF-91.5: Protocolo de Emisión de Etiquetas Adhesivas (50×30 mm)
- **Generación Vectorial SVG:** Función autónoma `qrSvg(text, px)` sin dependencias de librerías externas ni llamadas de red.
- **Payload del QR:** `SKU:<codigo_sku_inmutable>`.
- **Estructura de Impresión:**
  - Marca: `GRÚAS SAN PABLO · WMS`.
  - Código SKU grande en tipografía monoespaciada de 11px.
  - Nombre del repuesto (hasta 2 líneas con clamp).
  - Precio Medio Ponderado (PMP) y unidad de medida.
  - Regla CSS `@page { size: 50mm 30mm; margin: 0; }` optimizada para impresoras térmicas Zebra, Dymo y Brother.

---

## 3. Matriz de Trazabilidad y Casos de Prueba Deterministas (QA)

| Código | Escenario de Prueba | Entrada | Comportamiento Esperado | Resultado |
| :--- | :--- | :--- | :--- | :---: |
| **TC-E01** | Visualización de KPIs | Carga de `ProductosView.vue` | 5 tarjetas métricas renderizadas con datos reales consolidados de BD | **PASA** |
| **TC-E02** | Filtro por Disponibilidad | Clic en `[ Sin Stock (0 UN) ]` | La tabla filtra y muestra únicamente artículos con `stock_fisico === 0` | **PASA** |
| **TC-E03** | Búsqueda Universal | Tipear `P553004` (OEM) o `TMR` | Filtra el catálogo instantáneamente mostrando el SKU correspondiente | **PASA** |
| **TC-E04** | Erradicación del Drawer | Clic sobre una fila de producto | NO se abre cajón lateral. Se despliega el Modal Centrado 360° | **PASA** |
| **TC-E05** | Trazabilidad Kardex | Clic en pestaña "Kardex" del modal | Consulta `/api/inventario/kardex` y renderiza la tabla inmutable con fecha y folios | **PASA** |
| **TC-E06** | Impresión Térmica SKU | Clic en `[ Imprimir Etiqueta SKU ]` | Ventana emergente con etiqueta 50×30 mm, QR SVG legible y diálogo de impresión | **PASA** |
