# Especificación Técnica REQ-039: Perspectiva Temporal de Flota (Gantt), Métricas Económicas/Inspecciones y Navegación Operacional

## 1. Contexto y Objetivos del Requerimiento
En el marco de la operación de Grúas San Pablo y el ecosistema LeanGlobal, la **Perspectiva Temporal de Flota** en la Torre de Control (`Torre.vue`, vista `gantt`) requería una reingeniería integral para satisfacer las demandas ejecutivas y operacionales:
1. **Erradicación de Términos Desalineados ("Cockpit"):** Sustitución del botón de texto `[ Actualizar Cockpit ]` por un botón compacto, moderno y de solo ícono `🔄`, consistente con el diseño minimalista de la plataforma.
2. **Métricas de Gestión por Equipo en Fila Fija:**
   - **Inspecciones Realizadas:** Visualización inmediata del número de inspecciones/checklists preoperacionales y de patio asociados a cada grúa o equipo de apoyo (`📋 X`).
   - **Producción Económica ($):** Cuantificación de los ingresos netos devengados o facturados producidos por cada máquina en base a sus líneas de servicio y OTs ejecutadas.
   - **Productividad OEE (%):** Porcentaje de ocupación temporal en la ventana cronológica seleccionada con barra de avance gráfico.
3. **Matriz de Barras Temporales con 4 Estados Cromáticos Contrastados:**
   - 🟦 **Reservado / Programado:** Servicios asignados o agendados futuros (Azul / Cian en faena).
   - 🟩 **Ya Ejecutado:** Servicios finalizados, cerrados o realizados en días pasados (Verde Esmeralda).
   - ⬛ **Cancelado:** OTs desestimadas o canceladas (Gris pizarra con texto tachado `line-through`).
   - 🟧 **En Mantenimiento:** Equipos en taller o mantención técnica preventiva/correctiva (Ámbar).
   - 🟥 **Colisión Horaria:** Alerta crítica visual pulsante ante traslape de 2 o más OTs activas sobre el mismo equipo.
4. **Navegación e Interactividad 1-Clic:**
   - Al hacer clic en cualquier barra de servicio o evento, se redirige de forma inmediata a la OT correspondiente (`abrirProyecto(p.id_proyecto, subtab)`), aterrizando contextualmente en la sub-pestaña pertinente (Ejecución/Operaciones o Comercial).

---

## 2. Arquitectura de Datos y Reglas de Negocio

### 2.1. Conteo de Inspecciones (`calcularInspeccionesEquipo`)
- **Fuente Primaria (PostgreSQL):** Subconsulta correlacionada en `tequEquipoModel.js` (`getEquipos`) que consulta `sch_leangsp.tsrv_survey` donde `s.id_equipo = e.id_equipo` o donde el JSON de ejecución (`body_exec->>'patente'` o `header_exec->>'patente'`) coincide con la patente del equipo.
- **Fuente Secundaria (Patio Reactivo):** Revisión de inspecciones en patio registradas en OTs activas dentro de `p.json_field.ejecucion_v1.preparacion_salida.inspecciones_patio` para aquellos registros en tránsito que aún no posean `id_survey`.

### 2.2. Producción Económica Producida (`calcularProduccionEquipo`)
- Para cada equipo, se recorre el catálogo de proyectos activos (`todosLosProyectos`), omitiendo de forma estricta los proyectos cancelados o perdidos (`id_proyecto_estado >= 99` o `id_proyecto_estado === 6` con desestimación).
- Se analizan las líneas de servicio en `crm_v1.lineas_servicio` y `ejecucion_v1.snapshot_comercial.lines`:
  1. Si una línea coincide en `id_equipo`, `equipo_asignado_id` o `patente`, se adiciona su valor neto computado con la función canónica `calcularSubtotalLinea(l)`.
  2. Si el proyecto carece de líneas desagregadas por equipo pero el equipo es la grúa principal de la faena (`ejecucion_v1.patente_grua === eq.patente`), se le imputan las líneas de servicio de izaje correspondientes o el valor neto de la OT.

### 2.3. Cronograma Temporal y Estados de Barras (`getEventoEquipoEnDia`)
- Soporte para ventanas de 7, 15, 30 y 45 días, con un desfase al pasado (`diasAtras = Math.min(6, Math.floor(total * 0.3))`) para permitir auditar simultáneamente OTs recién ejecutadas y servicios programados futuros.
- Coincidencia de fechas robusta con fallback determinista: `fecha_plan_ini || fecha_real_ini || fecha_creacion` hasta `fecha_plan_fin || fecha_real_fin`.
- Mapeo semántico de clases:
  - **Cancelado:** `bg-slate-700/80 hover:bg-slate-600 text-slate-300 border-slate-500/60 line-through opacity-75`
  - **Ya Ejecutado:** `bg-emerald-600/90 hover:bg-emerald-500 text-white border-emerald-400`
  - **En Faena Activa:** `bg-cyan-600/90 hover:bg-cyan-500 text-white border-cyan-400 ring-1 ring-cyan-400/60`
  - **Reservado / Programado:** `bg-blue-600/90 hover:bg-blue-500 text-white border-blue-400`
  - **En Mantenimiento:** `bg-amber-600/90 hover:bg-amber-500 text-white border-amber-400`
  - **Colisión:** `bg-red-600/95 hover:bg-red-500 text-white border-red-400 animate-pulse ring-2 ring-red-400`

---

## 3. Matriz de Componentes Modificados

| Componente / Archivo | Cambio Realizado |
| :--- | :--- |
| `Torre.vue` | Erradicación total de la palabra "Cockpit", botón de actualización sólo con ícono `🔄`, rediseño de cabecera de flota con columnas sticky de Inspecciones y Producido ($), leyenda cromática, lógica de eventos con 4 colores y click handler hacia la OT. |
| `tequEquipoModel.js` | Inclusión de subconsulta correlacionada `cant_inspecciones` en `getEquipos()` que audita checklists en `tsrv_survey`. |
| `package.json` | Incremento de versión a `1.0.75`. |
| `RELEASE_LOG.md` | Registro de versión `1.0.75` con el detalle de `REQ-039`. |
| `Gestión/tareas.md` | Registro de `[x] REQ-039` para satisfacción del Hard Gate determinista. |


---

## 4. Evolución UX Torre de Control: Unificación Kanban, Vista Cardex, Agrupación Flota Gantt e Invariante Contable (Nov 2026)

### 4.1. Unificación de Vista `Kanban` y Renombrado de `Vista Cardex` (`Torre.vue`)
1. **Unificación de Tablero Kanban:** Se elimina la vista Kanban simple antigua y se conserva como única vista **`Kanban`** (`activeView === 'kanban'`) el tablero avanzado con barra de filtros (anteriormente llamado `"Kanban + Filtros"`).
2. **Incorporación de Filtros de Cardex en Kanban:** Se incorpora en la cabecera de filtros de la vista **`Kanban`** la tira interactiva de píldoras de **"Fechas con fichas"** (`fechasDisponiblesKardex` / `seleccionarFechaPuntualKardex`), sincronizada con los filtros de Rango de Fechas (`Desde` — `Hasta`), Cliente, Operador, Grúa/Patente y Estado.
3. **Renombrado de Vista Cardex:** Se elimina toda referencia engañosa a `"Cardex 3D"` / `"Kardex 3D"` / `"Mueble Tarjetero Cardex 3D"` en botones y encabezados de `Torre.vue`, renombrándose formalmente como **`Vista Cardex`**.

### 4.2. Rediseño UX de `Flota Gantt` (`Torre.vue`)
1. **KPIs Superiores del Período:** En la parte superior de la vista `Flota Gantt` se despliegan tarjetas de indicadores reactivos al filtro activo:
   - **Equipos con Movimiento / Total Flota** (y % de utilización en el período).
   - **Equipos Sin Movimiento** en el rango seleccionado.
   - **OTs Activas / Asignaciones** en el período.
   - **Horas Operadas Totales** (según Reports del período).
   - **Total Devengado ($)** (valorizado según Reports reales del período).
2. **Barra de Filtros Operativos en Flota Gantt:**
   - Selector de rango de fechas **`Desde`** (`fechaDesdeGantt`) y **`Hasta`** (`fechaHastaGantt`).
   - Toggle / botón **`Ocultar sin movimiento`** (`ocultarSinMovimientoGantt`) para filtrar inmediatamente los equipos sin OTs ni reports en el período.
   - Botón para **Expandir / Colapsar todas** las categorías.
3. **Agrupación por Categoría con Apertura a Demanda (`chevron`):**
   - Los equipos se agrupan por su categoría operativa (`Grúas Telescópicas`, `Camiones Pluma`, `Tractocamiones y Camas Bajas`, `Manipuladores y Horquillas`, `Alzahombres y Plataformas`, `Camionetas y Apoyo`).
   - Cada cabecera de categoría muestra un `chevron` interactivo para abrir/cerrar a demanda, el conteo de equipos (totales vs con movimiento en el rango), horas operadas del grupo y el subtotal **Devengado ($)** de la categoría.
4. **Columnas por Equipo en Flota Gantt:**
   - Se agrega la columna **`Últ. Mantenimiento`** (mostrando fecha/horómetro o pauta de la última mantención registrada del equipo o estado de taller).
   - Se reemplaza la columna `Producido ($)` por **`Devengado ($)`**, calculado a partir del registro real de los Reports Diarios del equipo dentro del rango de fechas activo.

### 4.3. Corrección de Invariante Contable (`Devengado <= Comprometido` en `estadoPagoController.js` y Saneamiento BD)
1. **Lógica de Valorización en `getPerspectivaContabilidad`:**
   - Se corrige la valorización por líneas para distinguir unidades globales/diarias (`diario`, `dia`, `día`, `jornada`, `global`, `gl`, `servicio`, `mes`) y tarifas cerradas, evitando multiplicar montos globales por las horas del report.
   - Cuando una cotización contiene múltiples líneas o tarifas horarias con `cantidad = 1` hora referencial, el cálculo pondera las horas por línea sin duplicar `horasFacturablesPry` y asegura la invariante contable donde el **Comprometido** refleja el piso contractual real frente al **Devengado** de Reports/ITS.

### 4.4. Agrupación Jerárquica por OT en Bandeja de Reports Diarios de Torre PMO (`REQ-1133`)
1. **Problema Detectado:**
   - La bandeja de entrada de Reports Diarios (`pmoVistaSecundaria === 'pendientes_reports'`) mostraba una grilla plana donde los reportes de distintas faenas u OTs se mezclaban únicamente por orden de fecha, dificultando a Control de Gestión / Analista PMO la lectura integral del avance de cada servicio.
2. **Jerarquía Nivel 1 — OT (Fila Padre):**
   - Agrupación determinista por `id_proyecto` / `codi_proyecto`.
   - Cabecera interactiva con acordeón (`chevron` `▶`), código OT, cliente mandante, faena/obra, período cubierto (`rangoFechasLabel`), conteo de reports (total, validados y pendientes con alerta ámbar `🟡`), total acumulado de horas facturables y operadas, y botón de acción rápida `🏢 Abrir OT`.
   - Ordenamiento por criticidad operativa: primero las OTs con reportes pendientes de validación, luego por fecha más reciente de reporte y código de proyecto.
   - Controles globales en barra superior: botón `📂 Expandir OTs / 📁 Colapsar OTs` y contador de OTs agrupadas.
3. **Jerarquía Nivel 2 — Reports Diarios (Filas Hijas):**
   - Cada reporte cuelga visualmente bajo su OT con sangría e indicador de subordinación (`↳ Fecha de Report · Día correlativo #N`).
   - Orden cronológico ascendente (de Día #1 en adelante) dentro de cada OT.
   - Mantenimiento íntegro de columnas técnicas: Grúa & Operador, Horas Terreno, Horómetro, Estado de Auditoría (Pendiente, Validado con Ajustes, Validado Conforme) y acciones de visualización (`📄 PDF` con doble firma FES y `Auditar y Validar` / `Ver Detalle`).

