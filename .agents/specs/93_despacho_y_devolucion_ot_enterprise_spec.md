# SPEC-093: Reingeniería Enterprise de Despacho a OT & Devolución de Sobrantes (WMS Outbound)
## (Erradicación del Simulador PWA, Datos Reales de Taller, Despacho Atómico a Racks y Crédito Contable de Devolución)

**Estado:** Aprobada para Implementación en DEV  
**Fecha:** 2026-10-21  
**Autor:** Sergio Gajardo / Senior ERP & WMS Specialist  
**Ambiente:** DEV (`https://servidor.leanglobal.cl/lg-gsp-dev/`)  
**Requerimiento Asociado:** `REQ-1065`  
**Componente Principal:** `ejecucion/frontend/src/views/inventario/DespachoConsumoView.vue`  
**Navegación:** `Sidebar.vue` (Opción 4: `4. Despacho e Imputación OT`)

---

## 1. Contexto, Diagnóstico Crítico y Objetivos Operacionales

### 1.1 Diagnóstico Crítico Previo
1. **La aberración del simulador de teléfono Android:** La vista actual exhibe en el tercio derecho una maqueta interactiva de un smartphone (`PWA Taller GSP · Android 📶 🔋 98%`) con marcos de esquinas redondeadas, emojis de cámara `📷`, y 5 pasos animados que culminan en un `alert('Despacho confirmado en la PWA...')`. Esto constituye un antipatrón inaceptable en una consola web enterprise de escritorio.
2. **100% de datos mock desconectados de la base de datos:** El array `otsReservas` contiene 2 OTs fijadas a mano en el código (`MNT-2610-014` y `MNT-2610-016`) con repuestos quemados. No consume `tmnt_ot`, no consulta `tinv_stock` ni posee llamadas a la API para efectuar despachos.
3. **Pestaña de devolución ficticia con cálculo en memoria:** La pestaña "Devolución a Bodega" cuenta con una única fila quemada (`MNT-2610-009`, manguera Parker) con una fórmula local `Math.round(devolucionQty * 6900)` y un botón que arroja un `alert(...)`. No realiza ningún reingreso a casillero ni genera el asiento `DEVOLUCION_OT` en el Kardex.
4. **Exposición de notas internas de desarrollo:** La cabecera muestra textos técnicos como `"Resuelve: M5 · Despacho a OT, M6 · Devoluciones, C6 · PWA Picking"`.
5. **Inconsistencia de columnas en el backend legado (`inventarioModel.devolverOt`):** El método legado de devolución intenta actualizar `estado_despacho = 'DEVUELTO'` en `tmnt_ot_repuesto`, columna inexistente en la tabla PostgreSQL (`estado`), lo que provocaría un error fatal al intentar procesar devoluciones reales.

### 1.2 Objetivos de la Especificación
- Erradicar por completo el simulador móvil, los datos mock y los banners de desarrollo de la pantalla web.
- Proveer una consola de despacho de almacén de alta densidad, conectada en tiempo real a las OTs activas del taller (`tmnt_ot`).
- Implementar un **Modal Centrado Enterprise de Despacho a OT** con búsqueda reactiva de repuestos en catálogo, selección de casillero físico de origen con saldo validado, y confirmación atómica que rebaje `tinv_stock`, genere asiento `SALIDA_OT` en `tinv_movimiento` e impute el costo PMP a la OT.
- Implementar un flujo real de **Devolución de Sobrantes a Bodega** con selección de casillero de reingreso, generación de asiento `DEVOLUCION_OT` al costo original y emisión de nota de crédito / ajuste a la OT.
- Incorporar 4 KPIs ejecutivos superiores calculados en tiempo real.

---

## 2. Requerimientos Funcionales y Arquitectura de Pantalla

### RF-93.1: Panel Superior de Indicadores Clave (4 KPIs Ejecutivos)
Cuatro tarjetas métricas de estado operativo en tiempo real:

| KPI | Nombre | Fórmula / Lógica | Fuente de Datos | Formato Visual |
| :--- | :--- | :--- | :--- | :--- |
| **KPI-01** | **OTs en Taller Activas** | $\text{COUNT}(ot \mid ot.\text{estado} \in \{\text{'ABIERTA'}, \text{'EN_PROCESO'}, \text{'PENDIENTE_REPUESTOS'}\})$ | `tmnt_ot` | Número entero ámbar |
| **KPI-02** | **Líneas Despachadas Hoy** | $\text{COUNT}(m \mid m.\text{tipo} = \text{'SALIDA_OT'} \land m.\text{fecha} = \text{hoy})$ | `tinv_movimiento` | Número entero blanco |
| **KPI-03** | **Costo Imputado a Flota** | $\sum (r.\text{cantidad} \times r.\text{costo\_unitario}) \quad [r.\text{origen} = \text{'BODEGA_WMS'}]$ | `tmnt_ot_repuesto` | Formato CLP esmeralda (ej. `$4.850.000`) |
| **KPI-04** | **Sobrantes Devueltos** | $\sum (m.\text{cantidad} \times m.\text{costo}) \quad [m.\text{tipo} = \text{'DEVOLUCION_OT'}]$ | `tinv_movimiento` | Formato CLP cyan (ej. `$240.000`) |

---

### RF-93.2: Pestaña 1 · Salida a OT (Picking & Imputación en Almacén)
Estructurada en una grilla ejecutiva de dos secciones:

#### 1. Bandeja Lateral Izquierda: Selector de OTs de Taller
- Listado ordenado por prioridad (`ALTA` > `MEDIA` > `BAJA`) y fecha programada.
- Cada tarjeta muestra:
  * Folio de la OT (`OT-2026-0001`).
  * Equipo / Grúa asociada (`Marca · Modelo · Patente`).
  * Tipo de mantenimiento (`PREVENTIVO`, `CORRECTIVO`, etc.) con badge semántico.
  * Técnico responsable asignado.
  * Contador de repuestos ya despachados.
- Búsqueda reactiva por folio, equipo o patente.

#### 2. Panel Central / Derecho: Detalle de la OT Seleccionada & Imputación
- **Ficha Resumen de la OT:** Cabecera con datos del activo, horómetro de entrada, estado y total devengado en materiales.
- **Grilla de Repuestos Imputados:**
  * Tabla con: SKU, Descripción del Insumo, Origen (`[📦 BODEGA WMS: Casillero]` vs `[📝 COMPRA DIRECTA]`), Cantidad Entregada, Unidad, Costo Unitario (PMP), Total Imputado.
- **Botón de Acción Principal:** `[ + Despachar Repuesto desde Bodega ]`.
  * Abre el **Modal Centrado Enterprise de Despacho**.

---

### RF-93.3: Modal Centrado Enterprise de Despacho a OT
Modal centrado (`max-w-2xl`, `backdrop-blur-sm`, `z-50`) con los siguientes controles:
1. **Información Contextual:** Folio de la OT receptora y Equipo/Grúa asociado.
2. **Buscador de Repuestos:** Input con debounce que busca sobre el catálogo general (`GET /api/inventario/productos`).
3. **Ficha del Repuesto Seleccionado:** Al seleccionar un ítem:
   * Muestra SKU, Nombre, Familia, Unidad de Medida Base.
   * Costo PMP vigente (de solo lectura).
   * **Selector de Ubicación / Casillero de Origen:** Menú desplegable que muestra todas las ubicaciones donde existe stock físico libre (`tinv_stock`), indicando código de rack y saldo disponible (ej. `E4-F2 (Disponible: 6 UN)`).
4. **Cantidad a Despachar:**
   * Input numérico con validación en tiempo real: bloquea si `cantidad <= 0` o `cantidad > stock_disponible`.
5. **Costo Total a Imputar:** Cálculo reactivo:
   $$\text{Total Imputado} = \text{Cantidad} \times \text{PMP Vigente}$$
6. **Confirmación Transaccional:**
   * Invoca `POST /api/mantenimiento/ots/:id/materiales` con payload:
     ```json
     {
       "origen_insumo": "BODEGA_WMS",
       "id_producto": 158,
       "id_ubicacion": 42,
       "cantidad": 2,
       "unidad_medida": "UN"
     }
     ```
   * En caso de éxito: recarga la lista de repuestos de la OT, actualiza los KPIs y emite notificación toast de confirmación.

---

### RF-93.4: Pestaña 2 · Devolución de Sobrantes a Bodega (Crédito a OT)
Permite a pañol recibir materiales no utilizados en faena o taller (ej. metros de cable, mangueras, sobrantes de aceites o piezas no instaladas):
1. **Bandeja de Repuestos Despachados desde Bodega:**
   * Tabla con buscador universal que lista repuestos de OTs con `origen_insumo = 'BODEGA_WMS'` y saldo devuelto menor a la cantidad entregada.
   * Columnas: Folio OT, Grúa / Equipo, SKU, Descripción, Casillero de Salida Original, Cantidad Entregada, Costo PMP, Botón de Acción.
2. **Botón `[ ↩️ Devolver a Pañol ]`:**
   * Abre el **Modal Centrado de Devolución de Sobrante**:
     * Muestra repuesto, OT y cantidad máxima retornable.
     * **Input de Cantidad a Devolver:** Con validación `0 < cant <= cantidad_entregada`.
     * **Selector de Casillero de Reingreso:** Permite devolver a la misma ubicación de origen o a un casillero alternativo de pañol.
     * **Cálculo del Crédito:** Muestra el abono exacto que se descontará de la OT en base al PMP original.
     * **Confirmación:** Invoca `POST /api/inventario/devolucion-ot` (o reversión limpia en backend), reintegrando el stock físico y registrando el asiento `DEVOLUCION_OT` en Kardex.

---

## 3. Matriz de Cambios por Archivo

| Archivo | Ámbito de Intervención |
| :--- | :--- |
| `.agents/specs/93_despacho_y_devolucion_ot_enterprise_spec.md` | Especificación canónica formal (`SPEC-093` / `REQ-1065`). |
| `ejecucion/backend_remoto/src/models/inventarioModel.js` | Blindar `devolverOt`: corregir `estado` en vez de `estado_despacho`, asegurar recálculo de `costo_total` en `tmnt_ot_repuesto`. |
| `ejecucion/frontend/src/views/inventario/DespachoConsumoView.vue` | 1. Eliminar simulador de teléfono móvil y emojis infantiles.<br>2. Eliminar arrays mock (`otsReservas`, `pwaSteps`, etc.).<br>3. Eliminar notas de desarrollo de la cabecera.<br>4. Implementar 4 KPIs superiores ejecutivos.<br>5. Pestaña 1: Selector de OTs reales, tabla de repuestos imputados y Modal Centrado de Despacho WMS.<br>6. Pestaña 2: Listado de consumos WMS y Modal Centrado de Devolución con crédito a OT.<br>7. Notificaciones toast semánticas en reemplazo de `alert()`. |
| `Gestión/tareas.md` & `RELEASE_LOG.md` | Registro de trazabilidad y gobernanza de despliegue. |

---

## 4. Criterios de Aceptación (Hard Gate QA)
1. **Zero Mocks:** No debe existir ninguna OT, repuesto o saldo quemado en el código fuente de `DespachoConsumoView.vue`.
2. **Zero Phone Simulators:** Queda prohibido renderizar maquetas de teléfonos móviles en vistas web de escritorio.
3. **Atomicidad Transaccional:** Todo despacho desde Bodega WMS debe disminuir el stock físico en `tinv_stock`, insertar una fila `SALIDA_OT` en `tinv_movimiento` e imputar el insumo en `tmnt_ot_repuesto`.
4. **Trazabilidad de Devolución:** Toda devolución debe reintegrar el stock físico a la ubicación seleccionada, registrar `DEVOLUCION_OT` en Kardex y rebajar el costo total acumulado de la OT.
5. **Zero Compile Errors:** Compilación limpia de Vite (`npm run build:dev`) y respuesta HTTP 200 OK en `https://servidor.leanglobal.cl/lg-gsp-dev/#/inventario/despacho`.
