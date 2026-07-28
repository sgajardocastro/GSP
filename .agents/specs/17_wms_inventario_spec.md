# 📋 ESPECIFICACIÓN TÉCNICA: MÓDULO WMS-LITE (INVENTARIO Y BODEGAS)

> **Módulo**: Inventario WMS-Lite  
> **Sistema**: Grúas San Pablo (GSP) / LeanGlobal  
> **Código Requerimiento**: RF-WMS-01 a RF-WMS-07  
> **Esquema DB**: `sch_leangsp`  

---

## 1. Alcance Funcional Explicito

El módulo WMS-Lite gestiona el ciclo completo de inventario físico de repuestos, insumos y herramientas en bodegas de cada empresa (`id_empresa`), integrando:
1. Maestro de Bodegas por empresa y sucursal.
2. Catálogo unificado de productos/repuestos con prefijo de SKU de 4 letras.
3. Control de existencias físicas por lote o serie con trazabilidad de Orden de Compra (OC).
4. Movimientos de inventario (Ingreso, Despacho, Traspaso, Baja).
5. Traspaso entre bodegas con estado En Tránsito.
6. Despacho directo a Orden de Trabajo (OT) previa validación de código de barras.
7. Alertas de stock crítico según nivel mínimo configurado.

---

## 2. Definición Detallada de Campos y Restricciones

### A. Tabla: `tinv_bodega`
- `id_bodega` (BIGSERIAL PRIMARY KEY)
- `id_empresa` (BIGINT NOT NULL — Tenant Scope)
- `id_sucursal` (BIGINT NOT NULL — FK a Sucursales GSP)
- `nombre` (VARCHAR(100) NOT NULL — Nombre único por empresa)
- `consolida_stock` (BOOLEAN DEFAULT true)
- `estado` (VARCHAR(30) DEFAULT 'ACTIVO' CHECK (ACTIVO, INACTIVO))
- `fecha_registro` (TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP)

### B. Tabla: `tinv_producto`
- `id_producto` (BIGSERIAL PRIMARY KEY)
- `id_empresa` (BIGINT NOT NULL — Tenant Scope)
- `codigo_fabricante` (VARCHAR(100) NOT NULL)
- `nombre` (VARCHAR(255) NOT NULL)
- `prefijo_sku` (VARCHAR(4) NOT NULL — CHECK 4 letras MAYÚSCULAS)
- `marca` (VARCHAR(100) NOT NULL)
- `tipo_repuesto` (VARCHAR(50) NOT NULL)
- `estado` (VARCHAR(30) DEFAULT 'ACTIVO' CHECK (ACTIVO, INACTIVO))
- `fecha_registro` (TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP)
- Restricción: `UNIQUE (id_empresa, codigo_fabricante)`

### C. Tabla: `tinv_existencia`
- `id_existencia` (BIGSERIAL PRIMARY KEY)
- `id_empresa` (BIGINT NOT NULL — Tenant Scope)
- `id_producto` (BIGINT NOT NULL FK `tinv_producto`)
- `id_bodega` (BIGINT NOT NULL FK `tinv_bodega`)
- `sku` (VARCHAR(50) NOT NULL)
- `codigo_barras` (VARCHAR(100) NOT NULL)
- `costo_adquisicion` (NUMERIC(15,2) NOT NULL — CHECK > 0 `COSTO_CERO_NO_PERMITIDO`)
- `numero_oc` (VARCHAR(50) NOT NULL — CHECK NOT NULL / NOT EMPTY `OC_REQUERIDA`)
- `numero_factura` (VARCHAR(50) NULL)
- `cantidad_disponible` (INTEGER NOT NULL DEFAULT 1 CHECK >= 0)
- `estado` (VARCHAR(30) DEFAULT 'DISPONIBLE' CHECK (DISPONIBLE, EN_TRANSITO, ASIGNADA, BAJA))
- `ubicacion_fisica` (VARCHAR(100) NULL)
- `fecha_ingreso` (TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP)

---

## 3. Reglas de Negocio Duras (Backend Validations HTTP 422)

1. **`COSTO_CERO_NO_PERMITIDO`**: No se puede registrar ningún ingreso a bodega con `costo_adquisicion <= 0`.
2. **`OC_REQUERIDA`**: El campo `numero_oc` es estrictamente obligatorio para ingresar existencias a bodega.
3. **`REPUESTO_NO_CORRESPONDE`**: Al despachar repuestos a una OT, el código de barras escaneado debe corresponder a un producto planificado en esa OT.
4. **`SCOPE_EMPRESA_NO_AUTORIZADO`**: Todo query valida `id_empresa = req.user.id_empresa`.

---

## 4. Endpoints REST API (`/api/inventario`)

- `GET /api/inventario/bodegas` — Listado de bodegas filtradas por `id_empresa`.
- `POST /api/inventario/bodegas` — Creación de bodega.
- `PUT /api/inventario/bodegas/:id` — Actualización de bodega.
- `GET /api/inventario/productos` — Catálogo de productos paginado.
- `POST /api/inventario/productos` — Registro de nuevo producto.
- `GET /api/inventario/existencias` — Stock físico en bodegas.
- `POST /api/inventario/existencias/ingresar` — Ingreso de existencias (Aplica validaciones duras HTTP 422).
- `POST /api/inventario/existencias/baja` — Registro de baja con motivo obligatorio.
- `POST /api/inventario/traspasos` — Inicio de traspaso entre bodegas.
- `POST /api/inventario/traspasos/:id/recibir` — Confirmación de recepción de traspaso.
- `POST /api/inventario/despacho` — Despacho de material imputado a OT.
- `GET /api/inventario/alertas/stock` — Reporte de productos bajo nivel mínimo.
