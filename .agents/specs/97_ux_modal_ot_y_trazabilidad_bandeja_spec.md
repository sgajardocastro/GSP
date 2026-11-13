# SPEC-097: Rediseño UX de Orden de Trabajo como Full-Workspace Modal y Trazabilidad en Bandeja de OTs

**Fecha:** 23 de octubre de 2026  
**Estado:** Aprobado para Implementación  
**Módulo:** Mantenimiento de Flota & Taller (`MantenimientoView.vue` / `mantenimientoModel.js`)  
**Responsables Operativos:** Allan / Leonel Vergara (Jefatura de Taller), Sergio Gajardo (Dirección Proyecto)

---

## 1. Problema y Objetivo Operacional
1. **Asfixia de Viewport y Atrapamiento:** Al abrir una OT en el flujo inferior de la página, los encabezados globales, las 6 tarjetas de KPIs y las alertas críticas consumían más del 50% de la pantalla, dejando un área reducida para imputar HH o repuestos. Además, al ocultarse la barra de pestañas (`v-if="!selectedOt"`), el usuario perdía la navegación principal para regresar a la bandeja.
2. **Falta de Trazabilidad en Bandeja de OTs:** La tabla principal de OTs no exhibía quién creó la OT (`id_user_creador`), fecha/hora de inicio (`DD/MM/YYYY HH:mm`), fecha/hora de término (`DD/MM/YYYY HH:mm`) ni la duración transcurrida o esfuerzo acumulado (`HH`).

---

## 2. Especificación de Capa Backend (`mantenimientoModel.js`)
### 2.1. Método `getOts(empresaId, filtros)`
- Seleccionar explícitamente `ot.id_user_creador`.
- Incorporar subconsulta hacia `tsec_users`:
  `(SELECT u.name_frst || ' ' || u.apellido_pat FROM tsec_users u WHERE u.id_user = ot.id_user_creador) AS nombre_creador`
- Incorporar fecha de cierre consolidada:
  `COALESCE(ot.fecha_cierre_real, ot.fecha_hora_liberacion, (SELECT c.fecha_cierre FROM tmnt_ot_cierre c WHERE c.id_ot = ot.id_ot ORDER BY c.id_cierre DESC LIMIT 1)) AS fecha_cierre`
- Incorporar sumatoria de horas-hombre imputadas:
  `COALESCE((SELECT SUM(h.horas) FROM tmnt_ot_hh h WHERE h.id_ot = ot.id_ot), 0) AS total_hh`
- Eliminar subconsultas duplicadas de `nombre_tecnico` y `nombre_supervisor`.

### 2.2. Método `getOtById(idOt, empresaId)`
- Incorporar en el `SELECT` principal de la OT:
  - `(SELECT u.name_frst || ' ' || u.apellido_pat FROM tsec_users u WHERE u.id_user = ot.id_user_creador) AS nombre_creador`
  - `COALESCE(ot.fecha_cierre_real, ot.fecha_hora_liberacion) AS fecha_cierre`

---

## 3. Especificación de Capa Frontend (`MantenimientoView.vue`)
### 3.1. Navegación Permanente en Consola Principal
- Eliminar la condición `!selectedOt` de la barra de 5 pestañas principales y de los contenedores de pestañas para que la Bandeja de OTs conserve siempre su posición, filtros y scroll en segundo plano.
- Corregir `ejecutarAccionAlerta` para que limpie `selectedOt.value = null` al navegar hacia una alerta.

### 3.2. Ficha de OT como Full-Workspace Modal (`max-w-7xl h-[92vh]`)
- Renderizar `v-if="selectedOt"` como un modal superpuesto (`fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-2 md:p-4`) con soporte de cierre mediante botón `✕`, botón `← Volver a Bandeja`, clic en el fondo (`@click.self`) y tecla `Escape`.
- **Header Fijo (`shrink-0`):** Folio, Estado (con selector directo de transición `ABIERTA` / `EN_PROCESO` / `ESPERA_REPUESTOS`), Prioridad, Equipo, Trazabilidad (`Creada por`, `Mecánico`, `Inicio`, `Término`, `Duración`), Costo Acumulado y acciones (`Imprimir Pauta`, `Ficha QR`, `Cierre FES`).
- **Sub-pestañas Fijas (`shrink-0`):** Abrir por defecto en `'actividades'`. Integrar la tarjeta de Medidores de Entrada dentro de la pestaña de Recepción/360° para liberar el 84% del alto del modal (`flex-1 overflow-y-auto`) para los formularios de trabajo.
- **Jerarquía de `z-index`:** Sub-modales hijos (`showCierreModal`, `showNuevaHhModal`, `showNuevoRepuestoModal`, `showNuevaActividadModal`, `showNuevoServicioModal`, `showNuevoHallazgoModal`, `showResolverHallazgoModal`, `mostrarModalFichaQrWeb`) en `z-[60]`, visor de fotos en `z-[70]` y Toast en `z-[80]`.

### 3.3. Columnas de Trazabilidad y Tiempos en Bandeja de OTs
Actualizar la tabla de OTs con las siguientes columnas:
1. **Folio & Prioridad:** `numero_ot` + badge `P1-P4`.
2. **Equipo & Horómetro:** `patente`, `equipo_nombre` y `horometro_inicio`.
3. **Tipo & Diagnóstico:** `tipo_mantenimiento`, `codigo_pauta` y `descripcion_falla`.
4. **Creador & Mecánico:** **Creada por:** `nombre_creador || 'Sistema'` y **Mecánico:** `nombre_tecnico || 'Sin asignar'`.
5. **Inicio:** Fecha y hora en formato `DD/MM/YYYY HH:mm`.
6. **Término:** Fecha y hora `DD/MM/YYYY HH:mm` (si `CERRADA`) o badge `EN CURSO`.
7. **Duración & HH:** Tiempo transcurrido (`Xd Yh` o `Xh Ym`) + total de `HH` imputadas.
8. **Costo Total:** Monto en CLP + `%` de avance del checklist.
9. **Estado & Acción:** Badge de estado + botón `Abrir OT`.

### 3.4. Registro de Eventos / Avisos de Avería desde la Consola Web (`MantenimientoView.vue`)
- Incorporar botón `[ 🚨 + Registrar Aviso de Avería ]` tanto en la cabecera superior de la consola como en el encabezado de la Pestaña 3 (`Avisos de Avería`).
- Implementar Modal `showNuevoAvisoModal` (`z-[60]`) conectado a `POST /api/mantenimiento/avisos` con:
  1. **Selección de Grúa / Equipo (`id_equipo`):** Precarga automática del horómetro actual del equipo.
  2. **Nivel de Criticidad (`criticidad`):** `PARADA_MAQUINA` (dispara alerta inmediata Email + WhatsApp a Jefatura/Operaciones), `DEGRADADO` u `OBSERVACION`.
  3. **Horómetro al Momento de la Falla (`horometro`):** Numérico editable.
  4. **Descripción del Síntoma / Evento de Avería (`descripcion`):** Detalle reportado desde terreno o taller.
  5. **Evidencias Fotográficas (`fotos`):** Subida de imágenes vía `POST /api/v1/storage/upload` (`modulo: 'mantenimiento'`, `tipo_doc: 'AVISO_FALLA'`) con previsualización y eliminación individual.

### 3.5. Inspección de Entrada y de Salida / Liberación de la OTM (`MantenimientoView.vue`)
- **Pestañas del Modal de OT ordenadas cronológicamente:**
  1. `📥 1. Inspección Entrada (360°)` (Medidores de Recepción + 6 Fotos 360° de ingreso)
  2. `📋 2. Pauta & Actividades`
  3. `👷 3. Mano de Obra (HH)`
  4. `🔩 4. Repuestos & Materiales`
  5. `🏢 5. Servicios Externos`
  6. `⚠️ 6. Hallazgos (C1-C4)`
  7. `📤 7. Inspección Salida & Cierre` (Resumen de Liberación o acceso directo al protocolo de salida)
- **Protocolo de Inspección de Salida y Cierre Supervisado (`showCierreModal` y Sub-tab Salida):**
  - **Medidores de Término / Salida:** Captura de `horometro_cierre` (`horometro_grua_cierre`), `horometro_chasis_cierre` (si el equipo tiene doble horómetro) y `odometro_cierre`, mostrando al lado los valores de entrada y validando no-regresión (`>= inicio`).
  - **Checklist Técnico de Inspección de Salida (5 puntos verificables):**
    1. `niveles_y_fugas_ok`: Niveles de fluidos verificados (motor, hidráulico, refrigerante) y sin fugas activas tras presurizar.
    2. `torque_y_guardas_ok`: Torque de elementos intervenidos y guardas/protecciones reinstaladas.
    3. `retiro_loto_y_limpieza_ok`: Retiro de bloqueo LOTO, cuñas y orden/limpieza general del equipo.
    4. `prueba_funcional_ok`: Prueba funcional en vacío conforme (frenos, dirección, giro, pluma y mandos).
    5. `sistemas_seguridad_ok`: Sistemas de seguridad operativos (LMI/PAT, fin de carrera / anti-two-block, luces y alarmas).
  - **Evidencias Fotográficas de Salida (`fotos_salida`):** Carga de fotografías de entrega/tablero final persistidas dentro del JSONB `checklist_liberacion` en `tmnt_ot_cierre`.
  - **Estado Resultante del Activo, Diagnóstico/Observación Final y Firma PIN FES (4 dígitos).**
