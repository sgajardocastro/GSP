# SPEC-092: Reingeniería Enterprise de Recepción & Ingreso de Materiales (WMS Inbound)
## (Integración con Órdenes de Compra, Erradicación de Datos Mock, Trazabilidad Kardex y Etiquetado en Andén)

**Estado:** Aprobada para Producción / Implementada en DEV  
**Fecha:** 2026-10-21  
**Autor:** Sergio Gajardo / Senior ERP & WMS Specialist  
**Ambiente:** DEV (`https://servidor.leanglobal.cl/lg-gsp-dev/`)  
**Requerimiento Asociado:** `REQ-1064`  
**Componente Principal:** `ejecucion/frontend/src/views/inventario/RecepcionMaterialesView.vue`  
**Navegación:** `Sidebar.vue` (Opción 3: `3. Recepción e Ingreso OC`)

---

## 1. Contexto, Diagnóstico y Objetivos Operacionales

### 1.1 Diagnóstico Crítico Previo
1. **Datos Mock Hardcodeados en el Formulario:** La pantalla cargaba por defecto valores inventados en código (`OC-4512`, `Distribuidora Hidráulica Sur`, `GDI-88213`), transmitiendo desprolijidad y riesgo de registrar transacciones basura en la base de datos.
2. **Desconexión Total con el Módulo de Compras (`tcmp_orden_compra`):** A pesar de contar con un módulo oficial de Órdenes de Compra en el sistema, el bodeguero debía escribir a mano el número de OC y tipear línea por línea los repuestos adquiridos, perdiendo la correlación entre lo comprado y lo recibido.
3. **Cuello de Botella Artificial en el Catálogo (`slice(0, 50)`):** El código forzaba `catalogoProductos.value = pData.slice(0, 50)`, ocultando 2.804 repuestos de la base de datos de GSP e impidiendo su ingreso al almacén.
4. **Falta de Trazabilidad en Recepciones Recientes:** La tabla superior contenía un array de 4 filas estáticas (`recentReceptions`) en lugar de consultar las entradas efectivas registradas en el Kardex.
5. **Cero Rotulación en Andén:** Al confirmar una entrada, el sistema mostraba un `alert()` de navegador sin emitir las etiquetas térmicas necesarias para identificar los bultos antes de almacenarlos en los racks.

### 1.2 Objetivos de la Especificación
- Implementar un flujo guiado de recepción en andén (WMS Inbound) conectado directamente a las Órdenes de Compra autorizadas del módulo de Compras.
- Soportar el ingreso manual para compras directas de faena, devoluciones de taller (OTs) y garantías de proveedor.
- Habilitar la consulta y búsqueda sobre el catálogo completo (2.854 repuestos) y la totalidad de ubicaciones físicas de estantería.
- Conectar la pestaña de historial al Kardex inmutable (`tinv_movimiento`).
- Integrar la emisión inmediata de etiquetas térmicas adhesivas en lote (50×30 mm) con código QR al confirmar la recepción.

---

## 2. Requerimientos Funcionales y Arquitectura de Procesos

### RF-92.1: Panel de Control del Andén de Recepción (KPIs Superiores)
Cuatro indicadores ejecutivos de estado operativo:

| KPI | Nombre | Fórmula / Lógica | Fuente de Datos | Formato Visual |
| :--- | :--- | :--- | :--- | :--- |
| **KPI-01** | **OCs para Recepción** | $\text{COUNT}(oc \mid oc.\text{estado} \in \{\text{'AUTORIZADA'}, \text{'PARCIAL'}\})$ | `tcmp_orden_compra` | Número entero ámbar |
| **KPI-02** | **Recepciones Registradas** | $\text{COUNT}(m \in \text{entradas})$ | `tinv_movimiento` | Número entero blanco |
| **KPI-03** | **Unidades Recibidas** | $\sum m.\text{cantidad}$ | `tinv_movimiento` | Entero cyan (ej. `142 UN`) |
| **KPI-04** | **Valorización Ingresos** | $\sum (m.\text{cantidad} \times m.\text{costo\_unitario})$ | `tinv_movimiento` | Formato CLP en esmeralda |

---

### RF-92.2: Organización en Dos Pestañas Operacionales
- **Pestaña 1 (`activeTab = 'nueva'`):** Formulario Guiado de Nueva Recepción en Andén.
- **Pestaña 2 (`activeTab = 'historial'`):** Historial Consolidado de Entradas & Auditoría Kardex.

---

### RF-92.3: Flujo Guiado de Recepción en 4 Pasos

#### Paso 1: Modo y Origen de la Mercadería
El operador selecciona mediante un segmented control el canal de entrada:
1. **Modo `CON_OC` (Con Orden de Compra):**
   * Consulta en tiempo real las órdenes de compra autorizadas vía `GET /api/compras/ordenes`.
   * Selector desplegable que muestra: `Folio OC · Proveedor / Razón Social · Monto Total`.
   * Al seleccionar una OC:
     - Auto-llena Proveedor, RUT y Empresa Emisora (`selectedOcData`).
     - Consulta el detalle completo de la orden vía `GET /api/compras/ordenes/:id_oc`.
     - Carga automáticamente en la tabla las líneas de repuestos adquiridos con su SKU, descripción, UOM, cantidad pedida y costo unitario pactado.
2. **Modo `DIRECTO` (Ingreso Directo / Devolución):**
   * Selector del tipo de ingreso: `COMPRA_DIRECTA` (faena/terreno), `DEVOLUCION_OT` (sobrante de taller), `GARANTIA` (reposición $0), `CARGA_INICIAL` (ajuste).
   * Campos abiertos para Proveedor / Origen y Folio de Referencia (N° Factura, N° de OT de origen o Acta).
   * Selector de Bodega de Destino (`Bodega Taller Central`, etc.).

#### Paso 2: Documentos de Respaldo Físico del Transportista
- **N° Guía de Despacho:** Folio del documento tributario de traslado emitido por el proveedor.
- **N° Factura Comercial / DTE:** Folio de la factura comercial asociada.
- **Observaciones de Andén:** Campo de texto libre para registrar el estado de los embalajes, sellos o anomalías de transporte.

#### Paso 3: Tabla de Líneas a Recepcionar & Asignación de Racks
Grilla reactiva donde el bodeguero verifica la descarga física:
- **Repuesto / SKU:** Muestra la ficha del producto. En modo directo, permite seleccionar sobre el catálogo completo (2.854 repuestos) con auto-completado de SKU y PMP referencial.
- **Unidad de Medida:** UOM oficial (`UN`, `L`, `kg`).
- **Cantidad OC:** Cantidad originalmente comprada (modo `CON_OC`).
- **Cantidad a Ingresar:** Input numérico editable para registrar recepciones completas o parciales.
- **Costo Unitario ($ CLP):** Costo neto unitario de la compra.
- **Subtotal Neto:** Cálculo reactivo ($\text{Cantidad a Ingresar} \times \text{Costo Unitario}$).
- **Casillero de Destino:** Menú desplegable con todas las ubicaciones físicas de estantería (`E1` a `E9`, `PAÑOL`, `CORRAL`, `CUARENTENA`).
- **Lote / N° Serie:** Trazabilidad opcional del fabricante.
- **Acción:** Botón para añadir líneas manuales (`+ Agregar Repuesto`) o eliminar líneas no entregadas.

#### Paso 4: Totales y Confirmación de Entrada
- Resumen consolidado: Total de SKUs distintos, suma total de unidades físicas y monto total neto valorizado.
- Botón **`[ 📥 Confirmar Entrada & Generar Etiquetas ]`**:
  * Ejecuta la transacción atómica contra `POST /api/inventario/recepciones`.
  * Genera el folio secuencial único de recepción (`REC-2610-XXXX`).
  * Inserta los asientos inmutables en `tinv_movimiento` con tipo `RECEPCION_COMPRA`.
  * Incrementa la cantidad física en `tinv_stock` para cada casillero asignado.
  * Recalcula automáticamente el Precio Medio Ponderado (PMP) en `tinv_producto`:
    $$\text{PMP}_{\text{nuevo}} = \frac{(\text{Stock}_{\text{ant}} \times \text{PMP}_{\text{ant}}) + (\text{Cant}_{\text{rec}} \times \text{Costo}_{\text{rec}})}{\text{Stock}_{\text{ant}} + \text{Cant}_{\text{rec}}}$$

---

### RF-92.4: Modal Post-Recepción & Emisión de Etiquetas Térmicas en Lote
Al confirmarse con éxito la entrada en base de datos:
1. Se abre automáticamente el **Modal Post-Recepción**:
   - Icono de confirmación esmeralda.
   - Mensaje oficial: *"¡Entrada Confirmada Exitosamente!"*.
   - Folio asignado (ej. `REC-2610-0014`).
   - Resumen del impacto en inventario.
2. Botón Destacado: **`[ 🖨️ Imprimir Etiquetas Adhesivas (50×30 mm) ]`**:
   - Genera una ventana de impresión HTML con salto de página CSS (`page-break-after: always`).
   - Renderiza tantas etiquetas térmicas como unidades fueron recibidas (hasta el tope configurado de seguridad).
   - Cada etiqueta incluye: Logo de marca `GRÚAS SAN PABLO · WMS`, código QR vectorial con payload `SKU:<codigo>`, descripción del producto y PMP oficial.

---

### RF-92.5: Pestaña 2: Historial Conectado a Kardex Real
- Consulta en vivo a `GET /api/inventario/kardex?limit=100`.
- Filtra movimientos de entrada (`RECEPCION_COMPRA`, `CARGA_INICIAL`, `DEVOLUCION_OT`).
- Presenta: Fecha y hora exacta, Tipo de Operación, Documento/Folio, SKU Canónico, Nombre del Repuesto, Casillero de Destino, Cantidad recibida, Costo Unitario PMP y Total Valorizado.
- Botón por fila: `[ 🏷️ QR SKU ]` para reimprimir la etiqueta adhesiva en caso de deterioro o reetiquetado.

---

## 3. Matriz de Trazabilidad y Casos de Prueba Deterministas (QA)

| Código | Escenario de Prueba | Entrada | Comportamiento Esperado | Resultado |
| :--- | :--- | :--- | :--- | :---: |
| **TC-R01** | Carga de OCs Aprobadas | Apertura de pestaña "Nueva Recepción" | Dropdown lista las órdenes de compra reales de `tcmp_orden_compra` | **PASA** |
| **TC-R02** | Auto-poblado desde OC | Seleccionar `OC-2026-089` | Carga automáticamente proveedor, RUT y detalle de líneas con cantidades | **PASA** |
| **TC-R03** | Catálogo Completo | Modo "Ingreso Directo" / Selector manual | Acceso total a los 2.854 repuestos de la BD sin truncamiento de 50 ítems | **PASA** |
| **TC-R04** | Confirmación Transaccional | Clic en `[ Confirmar Entrada ]` | Genera `POST /api/inventario/recepciones`, folio `REC-XXXX` y actualiza Kardex | **PASA** |
| **TC-R05** | Modal Post-Recepción | Retorno exitoso de API | Despliegue de modal con folio oficial y botón de impresión en lote | **PASA** |
| **TC-R06** | Impresión en Lote (50×30 mm) | Clic en `[ Imprimir Etiquetas Adhesivas ]` | Popup con etiquetas térmicas formateadas y código QR SVG por repuesto | **PASA** |
| **TC-R07** | Historial Kardex Real | Clic en pestaña "Historial de Entradas" | Renderiza las entradas registradas en `tinv_movimiento` sin datos mock | **PASA** |


---

## 6. Actualización v1.1 (REQ-1075 / 26-Oct-2026): Buscador Predictivo en Paso 3 y Claridad Compra en Terreno (Paso 1)
- **Paso 1 (Claridad de Compra en Terreno / Proveedor Directo):** El botón de alternancia para compras directas en terreno sin Orden de Compra se rotula explícitamente como **`Compra en Terreno / Proveedor Directo`** y el selector de proveedor permite **`+ Nuevo Proveedor Rápido (Terreno)`** en modal inline.
- **Paso 3 (Buscador Predictivo del Catálogo WMS):** En cada línea de recepción se reemplaza el `<select>` estático por un buscador predictivo en tiempo real (`filtrarCatalogoLinea`, `seleccionarProductoCatalogo`, `limpiarProductoLinea`) que filtra los 2.854 ítems por nombre, código SKU o familia, mostrando unidad, stock actual y PMP vigente, con botón **`[Cambiar]`** para rectificar el ítem seleccionado.
