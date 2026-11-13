# Ficha de Incidente: CASO-20261022-03

## 1. Ficha del Incidente
- **ID del Caso:** `CASO-20261022-03`
- **Fecha / Hora:** 2026-10-22 18:15:00 CLT
- **Operador / Usuario Afectado:** **Leonel Vergara** (Jefe de Taller, `id_user = 18`), **Eduardo Aguirre** (Encargado Adquisiciones e Inventario Pañol Temuco, `id_user = 19`), **Alan Sarpi**
- **Negocio / OT:** Mantenimiento de Flota (OT `#8` / `MNT-2610-004`, OT `#10` / `MNT-2610-006`) e Inventario WMS-Lite
- **Equipo Involucrado:** Flota de Grúas San Pablo (LIEBHERR LTM-1400 `CHGC.99-4`, Grúa 70 Ton `TLXF.37-9`, etc.)
- **Ambiente:** Producción (`PROD`) y Desarrollo (`DEV`)
- **Severidad:** Alta (Riesgo de descontrol de existencias, vulneración de Segregación de Funciones / SoD entre Taller y Pañol, duplicidad de OTs por doble clic)

---

## 2. Síntoma Reportado por Terreno
Durante la sesión de pruebas operativas en vivo entre Taller y Bodega:
1. Al momento en que **Leonel Vergara** agregaba un repuesto a una OT desde la PWA móvil o la consola web, cuando **Eduardo Aguirre** abría el módulo de Inventario (`Despacho a OT & Devolución de Sobrantes`), los materiales ya figuraban en estado `ENTREGADO`, con el stock ya rebajado de bodega y el Kardex afectado de forma anticipada. Esto impedía a Bodega ejercer el control físico del despacho (picking, verificación de estantería y entrega física).
2. Adicionalmente, **Leonel Vergara** creó accidentalmente dos veces la misma OT por hacer doble clic en el botón de creación ("Guardar Orden de Trabajo").
3. Existía discrepancia en la visualización de existencias al buscar repuestos entre perfiles.

---

## 3. Diagnóstico Técnico & Evidencia Empírica
1. **Inspección de Backend (`mantenimientoModel.js` - SPEC-089 inicial):**
   - El método `agregarMaterialManual` insertaba el repuesto en `tmnt_ot_repuesto` directamente con `estado = 'ENTREGADO'`, restaba de forma inmediata `tinv_stock.cantidad_fisica` y emitía el movimiento inmutable `SALIDA_OT` en `tinv_movimiento`.
   - Se evidenció que no existía el estado intermedio `SOLICITADO` para las solicitudes provenientes del Taller que requerían despacho por el pañolero.
2. **Inspección de Frontend (`MantenimientoView.vue`):**
   - El método `submitNuevaOt` carecía de flag de bloqueo reactivo (`creandoOt = true`, `:disabled="creandoOt"`), permitiendo que múltiples clics rápidos enviaran peticiones paralelas consecutivas al endpoint `POST /api/mantenimiento/ots`.

---

## 4. Causa Raíz de Arquitectura (SoD & Control de Concurrencia)
- **Falta de Segregación de Funciones (SoD - Segregation of Duties):** Taller y Pañol compartían un flujo acoplado de consumo directo donde la orden de trabajo operaba como auto-despacho automático. No existía la diferenciación entre "Requisición de Taller" (demanda) y "Despacho de Bodega" (suministro y custodia física).
- **Frontend sin Debounce / Bloqueo en Creación de OT:** Ausencia de guardia de estado durante la promesa asíncrona de creación.

---

## 5. Plan de Mitigación y Resolución

### A. Especificación Formal
- Redacción y aprobación de la especificación canónica:
  `.agents/specs/95_flujo_solicitud_taller_y_despacho_bodega_spec.md` (SPEC-095).

### B. Backend (Modelos, Controladores y Rutas)
1. **`mantenimientoModel.js`:**
   - Modificado `agregarMaterialManual`: Si `origen_insumo === 'BODEGA_WMS'` y no es despacho directo (`!data.es_despacho_directo`), el registro se crea en `tmnt_ot_repuesto` con `estado = 'SOLICITADO'`, `cantidad_solicitada = cant`, `cantidad_entregada = 0`, `costo_total = 0`. No se toca `tinv_stock` ni se crea asiento de Kardex.
   - Modificado `eliminarMaterial`: Solo reintegra existencias e inserta `DEVOLUCION_OT` si el repuesto estaba en `ENTREGADO`. Si estaba en `SOLICITADO`, se elimina la requisición limpiamente sin alterar Kardex.
2. **`inventarioModel.js`:**
   - Implementado método atómico `despacharLineaOt(empresaId, userId, data)`:
     * Valida que la línea en `tmnt_ot_repuesto` exista y esté en `SOLICITADO`.
     * Valida existencias en la ubicación seleccionada (`id_ubicacion`).
     * Descuenta `tinv_stock.cantidad_fisica`.
     * Registra movimiento inmutable `SALIDA_OT` en `tinv_movimiento` al costo PMP oficial.
     * Actualiza `tmnt_ot_repuesto` a `estado = 'ENTREGADO'`, vincula `id_movimiento_kardex`, `id_ubicacion`, `cantidad_entregada = cantidad_despachar`, `costo_total = cantidad * costo_unitario`.
3. **`inventarioController.js` y `inventarioRoutes.js`:**
   - Creado endpoint oficial `POST /api/inventario/despacho-linea-ot`.

### C. Frontend Web (`DespachoConsumoView.vue` y `MantenimientoView.vue`)
1. **`DespachoConsumoView.vue`:**
   - Incorporado badge semántico para líneas de repuestos: `⏳ SOLICITADO` vs `📦 ENTREGADO` vs `↩️ DEVUELTO`.
   - Botón contextual por fila: `[📦 Despachar]` para líneas en `SOLICITADO` (despliega modal de picking con selección de casillero y stock en tiempo real) y `[↩️ Devolver]` para líneas en `ENTREGADO`.
2. **`MantenimientoView.vue`:**
   - Badge visual en la tabla de repuestos de la OT: `[⏳ SOLICITADO A BODEGA]` vs `[📦 BODEGA WMS]`.
   - Protección anti-doble clic en `submitNuevaOt` con variable `creandoOt`, deshabilitación de botón y feedback visual.

### D. PWA Móvil (`TallerOtDetalleView.vue`)
- Adaptado botón de ingreso de insumos: `Solicitar Repuesto a Bodega`.
- La lista de materiales renderiza `[⏳ SOLICITADO A BODEGA]` mientras no haya sido despachado por el pañolero.

### E. Despliegue y Validación
- Compilado Vite en Frontend Web y PWA con 0 errores.
- Desplegado en servidores PROD (PM2 13) y DEV (PM2 10), así como en `/var/www/html/lg-gsp-prod/` y `/var/www/html/pwa-gsp-prod/`.
- Verificación empírica transaccional ejecutada con script automatizado: Solicitud (stock no baja, Kardex intacto) -> Despacho (stock baja, Kardex `SALIDA_OT` emitido, línea `ENTREGADO`).

---

## 6. Protocolo de Respuesta y Guía al Usuario / Operador
1. **Para Leonel Vergara (Taller):**
   - Al registrar un repuesto de pañol para la OT (desde la PWA o Web), el sistema registra una solicitud formal que quedará visible como `⏳ SOLICITADO A BODEGA`.
   - El costo se imputará formalmente a la OT una vez que Bodega realice la entrega física.
   - El botón para guardar nuevas OTs ahora cuenta con protección anti-doble clic, evitando que se generen registros duplicados si se pulsa rápidamente.
2. **Para Eduardo Aguirre (Bodega / Pañol Temuco):**
   - En la consola Web, abrir el módulo **Inventario > Despacho a OT & Devolución de Sobrantes**.
   - Al ingresar a la OT correspondiente, verá las piezas pendientes con el distintivo `⏳ SOLICITADO`.
   - Presionar `[📦 Despachar]`, seleccionar el casillero físico de donde se retira el producto y confirmar la entrega.
   - El sistema en ese instante rebajará las existencias del casillero, registrará el movimiento en el Kardex y marcará la línea como `ENTREGADO`.

---

## 7. Lecciones Aprendidas y Acciones Preventivas
- Todo flujo que involucre custodia física de activos o existencias debe regirse por la Segregación de Funciones (SoD), separando la requisición (taller) del despacho formal (bodega).
- Los botones de creación de entidades críticas con persistencia en base de datos deben tener por estándar de UI protección reactiva contra eventos repetidos de clic.
