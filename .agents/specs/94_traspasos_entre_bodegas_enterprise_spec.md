# SPEC-094: Reingeniería Enterprise de Traspasos & Traslados entre Bodegas
## (Guías de Despacho Interno GDI, Tránsito Interbodega/Interempresa, Descuento Atómico y Recepción en Destino)

**Estado:** Aprobada para Implementación en DEV  
**Fecha:** 2026-10-21  
**Autor:** Sergio Gajardo / Senior ERP & WMS Specialist  
**Ambiente:** DEV (`https://servidor.leanglobal.cl/lg-gsp-dev/`)  
**Requerimiento Asociado:** `REQ-1066`  
**Componente Principal:** `ejecucion/frontend/src/views/inventario/TraspasosTrasladosView.vue`  
**Navegación:** `Sidebar.vue` (Opción 5: `5. Traspasos entre Bodegas`)

---

## 1. Contexto, Diagnóstico Crítico y Objetivos Operacionales

### 1.1 Diagnóstico Crítico Previo
1. **100% de datos mock desconectados:** La pantalla actual contenía un array de 3 filas fijas en código (`TRP-0007`, `TRP-0006`, `TRP-0005`) con textos simulados.
2. **Acciones falsas mediante `alert()`:**
   - El botón `+ Nuevo Traspaso` ejecutaba un `alert('Formulario de Nuevo Traspaso...')` sin abrir ningún formulario ni modal.
   - El botón "Confirmar Recepción Física en Destino" mutaba en memoria RAM `selectedTrp.value.est = 'RECIBIDO'` y mostraba otro `alert()`.
3. **Cero conexión con el backend:** A pesar de que las tablas `tinv_traspaso` y `tinv_traspaso_linea` ya existían en la base de datos PostgreSQL (`sch_leangsp`), no existía ningún controlador, modelo ni endpoint en el backend para gestionar traslados.
4. **Exposición de notas internas de desarrollo:** Exhibía en el encabezado el texto `"Resuelve: C7 · Multi-bodega & Tránsitos"`.

### 1.2 Objetivos de la Especificación
- Erradicar todos los datos mock, alertas y textos de desarrollo.
- Activar las tablas PostgreSQL `tinv_traspaso` y `tinv_traspaso_linea` con extensión no destructiva para numeración de Guías de Despacho Interno (`GDI-XXXX`), transportista y trazabilidad de usuarios.
- Implementar los endpoints de backend transaccionales en `inventarioModel.js`:
  * `crearTraspaso`: Valida stock en bodega/casillero origen, descuenta existencias físicas en `tinv_stock`, emite asiento inmutable `SALIDA_TRASPASO` en Kardex y deja el envío en estado `EN_TRANSITO`.
  * `recepcionarTraspaso`: Recibe en bodega destino, asigna casillero de estantería receptora, incrementa existencias físicas en `tinv_stock`, emite asiento inmutable `ENTRADA_TRASPASO` en Kardex y marca el traspaso como `RECIBIDO`.
  * `getTraspasos`: Lista los traspasos con cabecera y líneas detalladas.
- Construir una interfaz enterprise en `TraspasosTrasladosView.vue` con 4 KPIs en tiempo real, tabla interactiva de guías, panel lateral de seguimiento con stepper de trazabilidad física y modales centrados para emisión y recepción.

---

## 2. Modelo de Base de Datos y Extensión DDL No Destructiva

### 2.1 Extensión de `sch_leangsp.tinv_traspaso`
```sql
ALTER TABLE sch_leangsp.tinv_traspaso
  ADD COLUMN IF NOT EXISTS numero_guia VARCHAR(50),
  ADD COLUMN IF NOT EXISTS tipo_traspaso VARCHAR(50) DEFAULT 'INTERBODEGA',
  ADD COLUMN IF NOT EXISTS empresa_destino_nombre VARCHAR(100),
  ADD COLUMN IF NOT EXISTS chofer_transporte VARCHAR(150),
  ADD COLUMN IF NOT EXISTS patente_transporte VARCHAR(20),
  ADD COLUMN IF NOT EXISTS id_usuario_creacion BIGINT,
  ADD COLUMN IF NOT EXISTS id_usuario_recepcion BIGINT,
  ADD COLUMN IF NOT EXISTS observaciones TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

CREATE SEQUENCE IF NOT EXISTS sch_leangsp.seq_tinv_traspaso_folio START WITH 1;
```

---

## 3. Requerimientos Funcionales y Arquitectura de Pantalla

### RF-94.1: Panel Superior de Indicadores Clave (4 KPIs Ejecutivos)
Cuatro tarjetas métricas de estado operativo en tiempo real:

| KPI | Nombre | Fórmula / Lógica | Fuente de Datos | Formato Visual |
| :--- | :--- | :--- | :--- | :--- |
| **KPI-01** | **Guías en Tránsito** | $\text{COUNT}(t \mid t.\text{estado} = \text{'EN_TRANSITO'})$ | `tinv_traspaso` | Número entero azul/ámbar |
| **KPI-02** | **Traspasos Completados** | $\text{COUNT}(t \mid t.\text{estado} = \text{'RECIBIDO'})$ | `tinv_traspaso` | Número entero blanco |
| **KPI-03** | **Unidades en Tránsito** | $\sum l.\text{cantidad} \quad [t.\text{estado} = \text{'EN_TRANSITO'}]$ | `tinv_traspaso_linea` | Entero UOM (ej. `48 UN`) |
| **KPI-04** | **Valor Mercadería en Ruta** | $\sum (l.\text{cantidad} \times l.\text{costo\_unitario\_pmp}) \quad [t.\text{estado} = \text{'EN_TRANSITO'}]$ | `tinv_traspaso_linea` | Formato CLP esmeralda |

---

### RF-94.2: Grilla de Dos Secciones (Listado de Guías vs Detalle de Seguimiento)

#### 1. Columna Izquierda: Historial de Guías de Despacho Interno (GDI)
- Barra de herramientas con buscador universal (por folio GDI, bodega origen, bodega destino o chofer) y selector de estado (`[ Todos ]` | `[ En Tránsito ]` | `[ Recibidos ]`).
- Tabla de alta densidad:
  * N° Folio Guía (`GDI-0001`).
  * Bodega Origen (`📍 Bodega Taller Central`).
  * Bodega Destino (`📍 Bodega Faena Antofagasta` o Empresa receptora).
  * Cantidad de ítems / líneas transferidas.
  * Tipo de traspaso (`[ Interbodega ]` vs `[ Interempresa ]`).
  * Fecha de despacho.
  * Estado con badge semántico: `[ EN TRÁNSITO ]` (azul) vs `[ RECIBIDO ]` (esmeralda).

#### 2. Columna Derecha: Expediente de la Guía y Trazabilidad de Ruta
- Cabecera con N° de Guía GDI, fecha y datos de transporte (Chofer y Patente).
- Ficha visual Origen ➔ Destino.
- **Línea de Tiempo / Stepper de 4 Pasos:**
  1. Preparado en Pañol Origen.
  2. Despachado (Descuento físico y asiento `SALIDA_TRASPASO` en Kardex).
  3. En Tránsito (Transporte en ruta).
  4. Recibido y Ubicado en Destino (Asiento `ENTRADA_TRASPASO` en Kardex).
- Tabla detallada de las líneas del cargamento: SKU, Repuesto, Cantidad despachada, Casillero de origen, Casillero de destino asignado.
- Botón de Acción Condicional: `[ ✔ Confirmar Recepción Física en Destino ]` (solo visible si el estado es `EN_TRANSITO`).
  * Abre el **Modal Centrado de Recepción de Traspaso**.

---

### RF-94.3: Modal Centrado Enterprise de Nuevo Traspaso
Modal centrado (`max-w-3xl`, `backdrop-blur-sm`, `z-50`):
1. **Bodega de Origen:** Menú desplegable con las bodegas activas de GSP (`tinv_bodega`).
2. **Tipo de Destino:** Segmented control:
   * `[ Bodega GSP ]`: Menú desplegable de bodegas destino (valida que sea distinta al origen).
   * `[ Interempresa ]`: Selección de empresa hermana (Bestmaq, Royal Rental, Logística del Sur) y nombre de pañol destino.
3. **Datos de Despacho / Flete:** Chofer responsable, Patente del camión/camioneta y Observaciones.
4. **Grilla Dinámica de Repuestos:**
   * Selector reactivo de producto sobre el catálogo general.
   * Selector del casillero físico de origen con saldo libre disponible.
   * Input de cantidad (validado contra saldo máximo del casillero).
   * Botón `[ + Agregar Línea ]` con cálculo de subtotal y PMP oficial.
5. **Confirmación:** Invoca `POST /api/inventario/traspasos` (ejecución atómica en base de datos).

---

### RF-94.4: Modal Centrado de Recepción en Destino
Modal centrado (`max-w-2xl`):
1. Muestra cabecera de la guía (`GDI-XXXX`), fecha y bodega receptora.
2. Para cada línea del traspaso:
   * Muestra SKU, Nombre del Repuesto y Cantidad recibida.
   * **Selector de Casillero Destino:** Menú desplegable con las ubicaciones de estantería de la bodega destino para almacenar físicamente el material.
3. **Confirmación:** Invoca `POST /api/inventario/traspasos/:id/recepcionar`, incrementando el stock en destino y cerrando el ciclo.

---

## 4. Matriz de Cambios por Archivo

| Archivo | Ámbito de Intervención |
| :--- | :--- |
| `.agents/specs/94_traspasos_entre_bodegas_enterprise_spec.md` | Especificación canónica formal (`SPEC-094` / `REQ-1066`). |
| `scripts/apply_ddl_spec94_traspasos.cjs` | DDL de extensión en DEV: columnas adicionales en `tinv_traspaso` y secuencia `seq_tinv_traspaso_folio`. |
| `ejecucion/backend_remoto/src/models/inventarioModel.js` | Métodos `getTraspasos`, `crearTraspaso` y `recepcionarTraspaso`. |
| `ejecucion/backend_remoto/src/controllers/inventarioController.js` | Métodos de controlador correspondientes. |
| `ejecucion/backend_remoto/src/routes/inventarioRoutes.js` | Endpoints `/api/inventario/traspasos` y `/api/inventario/traspasos/:id/recepcionar`. |
| `ejecucion/frontend/src/views/inventario/TraspasosTrasladosView.vue` | Rediseño integral: erradicación de mocks, 4 KPIs, grilla interactiva y modales enterprise. |
| `Gestión/tareas.md` & `RELEASE_LOG.md` | Gobernanza de backlog y release. |
