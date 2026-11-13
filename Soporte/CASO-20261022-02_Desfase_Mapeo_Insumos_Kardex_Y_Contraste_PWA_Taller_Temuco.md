# CASO-20261022-02 — Desfase de Mapeo de Insumos, Kardex, Contraste en PWA y Carga de Técnicos de Taller Temuco

---

## 1. Ficha del Incidente

| Campo | Detalle |
| :--- | :--- |
| **ID del Caso** | `CASO-20261022-02` |
| **Fecha / Hora** | `2026-10-22 13:45 CL` (Resolución: `2026-10-22 15:45 CL`) |
| **Operadores / Usuarios Involucrados** | **Sergio Gajardo** (`id_user = 55`), **Leonel Vergara** (`id_user = 18`, Encargado Mantención Taller), **Omar Ghiselini** (Dueño GSP), **Jorge Ponce** (Gerente General GSP) |
| **Negocio / OT** | OT `#8` (`MNT-2610-004`) — Taller Central Temuco (Bodega Central ID 1) |
| **Equipo Involucrado** | Grúa Móvil Liebherr LTM-1400 (`CHGC.99-4`, ID 40) |
| **Ambiente** | Producción (`PROD` — `sch_leangsp_prod`, PM2 13) y Desarrollo (`DEV` — `sch_leangsp`) |
| **Severidad** | **Alta** (Bloqueo previo a la demo ejecutiva de las 18:00 hrs y facturación del Hito 3) |
| **Estado** | `RESUELTO Y DESPLEGADO EN PROD Y DEV` |

---

## 2. Síntoma Reportado por Terreno

Durante la verificación operacional en vivo del circuito Taller ↔ Pañol Temuco para la grúa Liebherr 400 Ton (`CHGC.99-4` / `MNT-2610-004`), se identificaron las siguientes discrepancias y bloqueos:
1. **Costo acumulado congelado en $0:** Al ingresar 3 horas hombre (3 hrs a $15.000 = $45.000) en la OT `#8`, el encabezado de la OT continuaba mostrando `$0` de costo acumulado hasta que se forzaba un refresco manual completo de la vista.
2. **Buscador de repuestos sin indicador de stock:** Al querer agregar un insumo en la OT, el modal no mostraba de forma clara e inmediata si el repuesto seleccionado poseía stock en la bodega de Temuco o si estaba en saldo cero.
3. **Contraste nulo en PWA móvil:** En la tarjeta de insumos de `TallerOtDetalleView.vue`, el texto aparecía blanco sobre fondo claro, resultando ilegible en pantallas de teléfonos en taller.
4. **Cantidades con 5 decimales superfluos:** La visualización de existencias y despachos mostraba valores crudos de base de datos como `2.00000 UN` y `32.00000 UN`.
5. **Filas en blanco en Despacho por Consumo WMS:** Al consultar la OT `#8` en `DespachoConsumoView.vue`, la tabla de materiales aparecía vacía a pesar de existir insumos asociados en la base de datos.
6. **Mapeo erróneo en Kardex Ledger:** El movimiento de salida en `ProcesosInventarioView.vue` se listaba con folio ficticio `ACTA-INV-20261001`, valor unitario en `$0` y usuario genérico `sistema`.
7. **Gobernanza de personal de taller:** Se acordó directivamente con Omar y Jorge Ponce que Leonel Vergara (`mantencion@arriendosanpablo.cl`) es el **único operador activo** del software en taller. Se requería cargar la nómina de técnicos de patio únicamente como recursos imputables a OTs y HH (sin usuario/login propio) con el cargo oficial **`Técnico Taller Mantenimiento`**, excluyendo expresamente a Alan Sarpi.

---

## 3. Diagnóstico Técnico & Evidencia Empírica

### 3.1. Discrepancia de Contratos JSON entre Backend y Frontend
Al inspeccionar `mantenimientoModel.getDetalleOt`, el backend retornaba los insumos bajo la clave `repuestos`, mientras que `DespachoConsumoView.vue` leía exclusivamente `otDetail.repuestos_manuales`. Al no encontrar la clave, la tabla renderizaba un array vacío `[]`.

### 3.2. Asiento de Kardex sin Enriquecimiento de Usuario
En `inventarioModel.js`, la consulta del historial de movimientos leía `m.id_usuario` directamente sin realizar un `LEFT JOIN` a la tabla de usuarios `tsec_users`. Por su parte, `ProcesosInventarioView.vue` tenía asignado un valor hardcodeado `'ACTA-INV-20261001'` y `$0` como fallback visual.

### 3.3. Estilos CSS en PWA Móvil
En `ejecucion/pwa/src/views/taller/TallerOtDetalleView.vue`, el contenedor de la lista de repuestos poseía clases con fondo claro y tipografía blanca `text-white font-medium`, generando un colapso de contraste bajo la luz solar en el patio de maniobras.

### 3.4. Nómina de Personal Operativo no Registrada en BD
Al consultar `GET /api/mantenimiento/tecnicos`, solo se listaban usuarios administrativos o choferes, impidiendo asignar los trabajos a los mecánicos reales de foso y taller de Temuco.

---

## 4. Causa Raíz de Arquitectura

1. **Falta de unificación de alias en el modelo de Mantenimiento:** Existencia de múltiples nombres de clave (`repuestos`, `materiales`, `repuestos_manuales`) tras la evolución del modelo híbrido WMS-Lite vs Compra Directa.
2. **Ledger de Kardex desacoplado de la sesión:** No se estaba inyectando el ID de usuario activo (`id_user = 55`, Sergio Gajardo) en la resolución de nombres del Kardex, mostrando `sistema` en el frontend.
3. **Ausencia de registros en `tsec_users` para personal de mantención:** Los 9 técnicos de foso no habían sido dados de alta en el esquema de producción con el perfil adecuado (`id_empresa = 9`, `rol_taller`).

---

## 5. Plan de Mitigación y Resolución

### 5.1. Backend (`mantenimientoModel.js` e `inventarioModel.js`)
- En `mantenimientoModel.js`, se expusieron simultáneamente los alias `repuestos_manuales`, `repuestos` y `materiales` para garantizar compatibilidad retroactiva total.
- En `inventarioModel.js`, se agregó `LEFT JOIN tsec_users u_reg ON u_reg.id_user = m.id_usuario` retornando `COALESCE(TRIM(CONCAT(u_reg.name_frst, ' ', u_reg.apellido_pat)), 'sistema') AS usuario_registro`.

### 5.2. Frontend Web (`MantenimientoView.vue`, `DespachoConsumoView.vue`, `ProcesosInventarioView.vue`)
- `MantenimientoView.vue`:
  * Inyección del cálculo reactivo `costoAcumuladoOtSeleccionada` computando en tiempo real: `HH + Insumos + Servicios Externos`.
  * Recarga forzada de la OT seleccionada (`await recargarSelectedOt()`) inmediatamente después de registrar HH.
  * Inclusión de badges visuales `[✓ Stock: X UN]` (verde) vs `[✕ Sin Stock (0)]` (rojo) en el modal de selección de repuestos.
  * Helper `formatCantidad()` para erradicar los 5 decimales superfluos.
- `DespachoConsumoView.vue`:
  * Mapeo robusto: `otDetail.repuestos_manuales || otDetail.materiales || otDetail.repuestos || []`.
- `ProcesosInventarioView.vue`:
  * Mapeo de `documento_folio` (`OT-8`), formato monetario CLP `$1.950` y estilo semántico en rojo para cantidades negativas en salidas.

### 5.3. PWA Móvil (`TallerOtDetalleView.vue`)
- Rediseño integral de la tarjeta de insumos con tema oscuro industrial `bg-slate-900/90 border border-slate-800`.
- Texto blanco puro de alta visibilidad, badges `[📦 BODEGA WMS]` vs `[📝 COMPRA LOCAL]` y cantidades limpias (`1 UN`).

### 5.4. Carga de Nómina de Técnicos en Producción (`scripts/carga_tecnicos_taller_prod.cjs`)
Se ejecutó script determinista en `sch_leangsp_prod`:
- Usuario ID 18 actualizado: **LEONEL EDUARDO VERGARA** (`Encargado Mantención Taller`).
- **Alan Sarpi omitido al 100%** por instrucción expresa de jefatura.
- 9 técnicos dados de alta con cargo `Técnico Taller Mantenimiento`:
  1. Dayan Andrés Gormaz Muñoz (`16.632.333-9`, ID 82)
  2. Guillermo Enrique Schaaff Halabi (`9.243.228-9`, ID 78)
  3. José Henry Pérez Jara (`13.113.937-3`, ID 81)
  4. José Rubén Riquelme Merino (`10.975.397-1`, ID 79)
  5. Juan José Espinoza Saavedra (`20.766.608-4`, ID 76)
  6. Luis Gerardo Vásquez Berberia (`27.137.851-3`, ID 83)
  7. Mauricio Alejandro Sepúlveda Riquelme (`12.931.289-0`, ID 77)
  8. Rodrigo Ariel Marilao Curriman (`17.255.018-5`, ID 84)
  9. Víctor Freddy Ruiz Riffo (`12.192.744-6`, ID 80)
- Configurados con `orden_rol = 1` en `/api/mantenimiento/tecnicos` para encabezar la lista en la creación y asignación de OTs.

---

## 6. Protocolo de Respuesta y Guía al Usuario / Operador

Para la operación de Leonel Vergara en Taller y la presentación directiva con Omar y Jorge:
1. **Acceso único para Taller:** Leonel ingresa con `mantencion@arriendosanpablo.cl`.
2. **Asignación de Trabajos:** En el selector de técnicos de la OT o HH, los 9 mecánicos de patio figuran en primer lugar bajo el cargo `Técnico Taller Mantenimiento`.
3. **Consumo de Bodega Temuco:** Al agregar repuestos, el sistema indica de inmediato el stock disponible en Pañol Temuco.
4. **Transparencia en Kardex:** Cada despacho genera su asiento de salida con folio oficial (`OT-8`), registrando al usuario responsable y rebajando el stock físico.

---

## 7. Lecciones Aprendidas y Acciones Preventivas

1. **Normalización de Contratos de API:** Centralizar en la capa de modelos los alias estándar para evitar discrepancias entre distintos consumidores (Web vs PWA vs WMS).
2. **Diseño Mobile-First de Alto Contraste:** Emplear paletas oscuras industriales estandarizadas para vistas utilizadas en talleres y faenas al aire libre.
3. **Validación E2E con Rollback:** Mantener la política de ejecutar suites de prueba deterministas (`qa_e2e_prod_integral_rollback.cjs`) antes de cualquier hito directivo.
