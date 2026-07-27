# Inv+Mnt — Análisis de Diseño: Inventario WMS-Lite y Mantenimiento (OTs)

> **Proyecto**: Global Manager — Transmac / GSP  
> **Fecha de generación**: 2026-07-26  
> **Estado**: Análisis inicial completado. Pendiente revisión y aprobación.

---

## ¿Qué hay acá?

Este directorio contiene los tres entregables de la fase de **diseño spec-driven** para los módulos de **Inventario (WMS-Lite)** y **Mantenimiento de Flota (OTs)** del sistema Global Manager, que se migrará desde la aplicación legacy Polymer hacia la arquitectura GSP (Vue 3 + Node.js + PostgreSQL `sch_leangsp`).

---

## Entregables

### 1. 🗄️ `database/esquema_propuesto.sql`
**[Abrir archivo](database/esquema_propuesto.sql)**

El modelo relacional físico completo listo para ejecutar en PostgreSQL sobre el esquema `sch_leangsp`.

**Incluye:**
- Diagrama ERD en Mermaid (al inicio, como comentario)
- **6 tablas de Inventario** (prefijo `tinv_`): bodegas, productos, existencias, movimientos, traspasos, stock de seguridad
- **6 tablas de Mantenimiento** (prefijo `tmnt_`): OTs, actividades, repuestos planificados, mano de obra HH, servicios externos, cierre de OT
- Constraints de negocio nombrados: `ck_existencia_costo_positivo`, `ck_existencia_oc_not_null`, `ck_prefijo_sku_length`
- Columna generada `costo_calculado` en HH (horas × tarifa, sin lógica en backend)
- Trigger `trg_chk_cierre_ot` que bloquea el cierre de OTs con actividades incompletas o repuestos pendientes
- Índices de rendimiento en campos de búsqueda frecuente (estado, folio, id_equipo)

**⚠️ Antes de ejecutar**: Descomentar la línea 145 (FK hacia `tequ_equipo`) una vez confirmado el nombre exacto de la tabla en `sch_leangsp`.

---

### 2. 📋 `specs/openapi_gsp_maint_wms.yaml`
**[Abrir archivo](specs/openapi_gsp_maint_wms.yaml)**

Contrato OpenAPI 3.0 completo (945 líneas) para todos los endpoints de ambos módulos.

**Rutas definidas:**
| Módulo | Prefijo | Endpoints |
|--------|---------|-----------|
| Inventario — Bodegas | `/inventario/bodegas` | GET, POST, PUT |
| Inventario — Productos | `/inventario/productos` | GET, POST, GET by id |
| Inventario — Existencias | `/inventario/existencias` | GET, POST ingresar, GET barcode, POST baja |
| Inventario — Traspasos | `/inventario/traspasos` | POST, POST recibir |
| Inventario — Despacho | `/inventario/despacho` | POST |
| Inventario — Alertas | `/inventario/alertas/stock` | GET |
| Mantenimiento — OTs | `/mantenimiento/ots` | GET, POST, GET folio, PUT estado, POST cerrar |
| Mantenimiento — Actividades | `/mantenimiento/ots/{folio}/actividades` | POST, PUT |
| Mantenimiento — Repuestos | `/mantenimiento/ots/{folio}/repuestos` | POST, DELETE |
| Mantenimiento — HH | `/mantenimiento/ots/{folio}/hh` | POST, DELETE |
| Mantenimiento — Servicios Ext. | `/mantenimiento/ots/{folio}/servicios` | POST, DELETE |

**Códigos de error de negocio documentados** (`HTTP 422`):
- `COSTO_CERO_NO_PERMITIDO`
- `OC_REQUERIDA`
- `EQUIPO_CON_OT_ACTIVA`
- `OT_CON_ACTIVIDADES_PENDIENTES`
- `OT_CON_REPUESTOS_PENDIENTES`
- `PIN_INVALIDO`
- `REPUESTO_NO_CORRESPONDE`

---

### 3. 🎨 `ux-ui/flujos_visuales.md`
**[Abrir archivo](ux-ui/flujos_visuales.md)**

Documento visual con diagramas Mermaid y wireframes textuales para guiar el desarrollo del frontend Vue 3.

**Incluye:**
- Mapa de módulos (navegación top-level)
- Flujo de recepción de material (PWA bodeguero)
- Flujo de despacho a OT (bodeguero + validación de barcode)
- State diagram del ciclo completo de una OT
- Flujo de traspaso inter-bodega (dos actores: origen y destino)
- Tabla de mapeo: Pantalla → Rol → Dispositivo → Endpoints
- Wireframes textuales de Recepción de Material y Detalle de OT

---

## Decisiones de Arquitectura Tomadas

| Decisión | Resolución |
|----------|-----------|
| Esquema de BD | Todo en `sch_leangsp` (mismo que flota) |
| Flota/Equipos | FK hacia `tequ_equipo.id_equipo` (ya existe en GSP) |
| SolPeds automáticas | **No.** Solo descuento directo de bodega |
| Generación de SKU | `prefijo_sku` (4 chars) + correlativo BIGSERIAL |
| Cierre de OT | Requiere PIN de supervisor (hash SHA-256) |
| Costo $0 en ingreso | Bloqueado por constraint en BD |
| OC obligatoria en ingreso | Bloqueado por constraint en BD |
| Columna costo HH | Calculada automáticamente en Postgres (GENERATED ALWAYS) |

---

## Próximos Pasos

- [ ] Revisión y aprobación de este análisis
- [ ] Ejecutar `esquema_propuesto.sql` en `sch_leangsp` (entorno dev)
- [ ] Implementar rutas del backend Node.js (GSP API) siguiendo el contrato YAML
- [ ] Desarrollar componentes Vue 3 del módulo de Inventario
- [ ] Desarrollar componentes Vue 3 del módulo de Mantenimiento
