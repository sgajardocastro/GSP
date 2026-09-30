# Especificación Técnica Nº 56: Ajustes Operacionales de Segunda Sesión de Marcha Blanca — Prevencionista Fantasma, Reasignación Centralizada, Rigger Bajo Operador y Filtros con Advertencia de Capacidad

* **Código de Especificación**: `Spec 56`
* **Archivo**: `.agents/specs/56_ajustes_operacionales_segunda_sesion_marcha_blanca_spec.md`
* **Versión**: `1.0.0`
* **Fecha**: `30 de Septiembre de 2026`
* **Requerimiento Backlog**: `REQ-017`
* **Versión SemVer**: `Portal Web GSP v1.0.62`
* **Autor / Responsable**: Sergio Gajardo / Líder de Proyecto LeanGlobal
* **Participantes de Marcha Blanca**: Jorge Ponce (GG GSP), Yiara Mendoza (Control Flota), Richard Jara (Operaciones)
* **Módulos Afectados**:
  * Frontend CRM / Operaciones: `ejecucion/frontend/src/views/CRM/GestorOportunidades.vue`
  * Versionamiento Frontend: `ejecucion/frontend/package.json`
  * Backlog y Release: `Gestión/tareas.md`, `RELEASE_LOG.md`, tablas PostgreSQL `sch_leangsp.tcfg_backlog` y `sch_leangsp.tcfg_releases`.
* **Especificaciones Previas Relacionadas**:
  * `Spec 16`: Gestor de Oportunidades y Estructurador CRM
  * `Spec 22`: Asignación de Recursos y Tripulación en BD
  * `Spec 24`: Flujo Operativo de OT y Acreditaciones
  * `Spec 51`: Backlog y Mejoras de Marcha Blanca

---

## 1. Diagnóstico Forense y Necesidad Operativa

Durante la Segunda Sesión de Marcha Blanca en vivo con la Gerencia General (Jorge Ponce), Control de Gestión (Yiara Mendoza) y Logística/Operaciones (Richard Jara), se detectaron 4 fallas e inconsistencias de flujo operacional en el Portal Web de Grúas San Pablo:

### 1.1. Incidente #1: Prevencionista Fantasma (Caso GSP-2609-3707-013)
* **Síntoma:** En cotizaciones donde comercialmente solo se solicitaba grúa y Rigger (`requiere_rigger = true`, `requiere_prevencionista = false`), al pasar a la Sub-tab 2 (*Asignación*), el sistema renderizaba automáticamente una fila vacía con cargo *"Prevencionista de Riesgos"*, insinuando falsamente que la faena requería asignar un profesional APR.
* **Causa Raíz:** `especialistasTerreno` se inicializaba con un array estático que contenía `{ id_user: '', cargo: 'Prevencionista de Riesgos', ... }`. El parser de hidratación no descartaba este placeholder cuando la cotización no demandaba prevencionista.

### 1.2. Incidente #2: Fricción en Modificación de Recursos Asignados (Asignación vs Despacho)
* **Síntoma:** Cuando la OT pasaba a estado $\ge 5$ (`isAsignacionConfirmada = true`), la Sub-tab 2 (*Asignación*) se bloqueaba íntegramente con `pointer-events-none opacity-80`. Si la operación sufría un cambio imprevisto (ej. chofer indispuesto o falla mecánica), el usuario se veía forzado a entrar a la Sub-tab 5 (*Despacho*) para cambiar los recursos.
* **Causa Raíz:** Acoplamiento rígido de inmutabilidad en la vista de Asignación. Los cambios en Despacho alteraban la acreditación pero desestructuraban el flujo natural de planificación.

### 1.3. Incidente #3: Desconexión Visual Rigger / Equipo Principal
* **Síntoma:** En la Sub-tab 2, la tabla superior de *Flota Principal* únicamente vinculaba cada grúa con su *Operador Asignado*. El Rigger asignado se encontraba segregado en la Sección 3 inferior (*Especialistas de Terreno / Tripulación*), disperso y sin relación directa con la máquina en la cual ejecutará las maniobras.
* **Causa Raíz:** Modelo de presentación desacoplado entre máquinas y tripulación técnica especializada.

### 1.4. Incidente #4: Bloqueo de Asignación ante Flota Indisponible (Filtros Excluyentes)
* **Síntoma:** La lista desplegable de grúas solo mostraba los equipos que coincidían rígidamente con la subcategoría o tonelaje comercial de la cotización. Si la grúa comprometida no estaba disponible en base por faena activa o mantenimiento, el despachador no podía seleccionar un equipo de mayor tonelaje (ej. 70T en vez de 50T) para cumplir el servicio sin retrasar al cliente.
* **Causa Raíz:** `getEquiposFiltradosPorLinea` ejecutaba un filtrado exclusivo `filter()` estricto, sin contemplar la posibilidad de recurrir a equipos de mayor capacidad.

---

## 2. Arquitectura de Dominio y Nuevas Reglas de Negocio

### 2.1. Regla Anti-Fantasma en Especialistas de Terreno
1. `especialistasTerreno` se inicializa como array vacío reactivo (`ref([])`).
2. Al cargar o inicializar una oportunidad, se evalúan exclusivamente los requerimientos reales:
   * Si `opportunity.requiere_prevencionista === true` o existe línea comercial con subcategoría `PREVENCIONISTA` / `APR`, se habilita el slot de Prevencionista.
   * Si `opportunity.requiere_prevencionista === false` o nulo, se purgan de forma absoluta los slots huérfanos de prevencionista sin usuario.
3. Se mantiene el slot de Rigger únicamente si `opportunity.requiere_rigger === true` o si existe línea comercial correspondiente.

### 2.2. Regla de Centralización de Asignación y Bloqueo en Despacho
1. **Sub-tab 2 (Asignación) — Desbloqueo y Reasignación Formal:**
   * Se elimina la clase `pointer-events-none` de la Sub-tab 2.
   * Si `isAsignacionConfirmada === true`, la vista presenta un encabezado informativo de estado confirmado con botón explícito: `[🔄 Reasignar Recursos / Actualizar OT]`.
   * El usuario puede modificar operadores, riggers o máquinas directamente desde la matriz de asignación. Al pulsar *"Guardar Reasignación"*, se actualiza la OT, se re-gatilla la verificación de acreditaciones (Sub-tab 3) y se sincronizan los viajes de despacho.
2. **Sub-tab 5 (Despacho) — Modo Solo Lectura de Recursos:**
   * Conforme a lo acordado con el usuario, en Despacho los selectores de recursos se inhabilitan (`disabled` o texto formateado tipo badge).
   * Despacho opera estrictamente como compuerta de salida física: confirmación de chofer/operador receptor, número de teléfono, generación de link PWA y despacho de WhatsApp. No se permiten alteraciones de asignación en esta etapa.

### 2.3. Regla de Rigger Anidado Bajo Operador / Conductor
1. **Ergonomía de Interfaz:** No se agrega una nueva columna que sature el ancho útil de la tabla.
2. **Ubicación:** Dentro de la celda de *Operador Asignado* de la *Flota Principal*, si la cotización exige Rigger (`opportunity.requiere_rigger === true`), se renderiza un sub-registro anidado inmediatamente bajo el selector del operador:
   ```html
   <div class="mt-1.5 pt-1.5 border-t border-white/5 flex items-center gap-1.5">
     <span class="text-[10px] text-cyan-400 font-bold flex items-center gap-1">🪝 Rigger:</span>
     <select v-model="line.rigger_asignado_id" class="...">
       <option value="">-- Sin Rigger Asignado --</option>
       <option v-for="r in riggersDisponibles" :value="r.id_user">{{ r.name }}</option>
     </select>
     <button :class="semaforoBadge">🟢 VIG</button>
   </div>
   ```
3. **Regla Multi-Grúa en Servicios Complejos:**
   * En maniobras con múltiples grúas cotizadas, el sub-registro de Rigger se presenta por defecto en la **Grúa Principal** (`linesEquiposPrincipales[0]`).
   * Únicamente si la cotización comercial incluye la venta de 2 o más Riggers (por ejemplo, maniobras combinadas o dobles turnos), las líneas secundarias de grúa habilitarán también el sub-registro de Rigger correspondiente.
4. **Sincronización:** Al seleccionar el Rigger bajo la grúa, se sincroniza reactivamente con `operacionesAssignment.rigger_id` y con la lista de tripulación de la OT para la emisión del PDF de despacho.

### 2.4. Regla de Filtro Inclusivo con Separador y Aviso de Mayor Prestación
1. **Agrupación en Dos Niveles (`getEquiposAgrupados`):**
   * El `<select>` de asignación de equipos se estructura en dos `<optgroup>` semánticos:
     - **Grupo 1 (`🎯 Equipos Sugeridos (Compromiso Comercial)`):** Grúas que cumplen con la subcategoría/tonelaje comercialmente pactado.
     - **Grupo 2 (`🚜 Flota Alternativa / Mayores Prestaciones`):** Toda la flota disponible en el maestro para cubrir indisponibilidades de última hora.
2. **Aviso de Mayor Prestación:**
   * Si el usuario selecciona un equipo perteneciente al Grupo 2 (*Alternativas / Mayores Prestaciones*), el sistema renderiza un banner informativo destacado bajo el selector:
     ```html
     <div v-if="esEquipoMayorPrestacion(line)" class="mt-1 flex items-center gap-1 text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
       <span>⚠️</span> <span>Equipo de Mayor Capacidad (Alternativa Operativa — Tarifa Comercial Respaldada)</span>
     </div>
     ```
   * Esto garantiza transparencia operativa sin alterar los montos de la cotización pactados con el cliente.

---

## 3. Matriz de Componentes y Modificaciones

| Archivo | Capa | Modificación Principal |
| :--- | :--- | :--- |
| `ejecucion/frontend/src/views/CRM/GestorOportunidades.vue` | Frontend CRM / Ops | • Erradicación de prevencionista estático.<br/>• Desbloqueo de Sub-tab 2 para reasignaciones.<br/>• Bloqueo solo-lectura de recursos en Sub-tab 5 Despacho.<br/>• Sub-registro de Rigger anidado bajo operador.<br/>• `<optgroup>` doble nivel en selector de grúas + badge de aviso de mayor prestación. |
| `ejecucion/frontend/package.json` | Versionamiento | Incremento SemVer a `1.0.62`. |
| `Gestión/tareas.md` | Backlog Físico | Registro de requerimiento `REQ-017`. |
| `RELEASE_LOG.md` | Documentación | Declaración de versión `v1.0.62` asociada a `REQ-017` y Spec 56. |
| `sch_leangsp.tcfg_backlog` & `tcfg_releases` | Base de Datos DEV | Sincronización determinista vía Hard Gate. |

---

## 4. Matriz de Casos de Prueba y Criterios de Aceptación

| ID | Escenario de Prueba | Comportamiento Esperado | Criterio de Éxito |
| :--- | :--- | :--- | :--- |
| **TC-56.1** | Apertura de cotización GSP-2609-3707-013 con Rigger y sin Prevencionista. | La Sub-tab 2 solo muestra el selector de Rigger (anidado en la grúa). No aparece fila de Prevencionista. | `PASSED`: Cero prevencionistas fantasma. |
| **TC-56.2** | Intento de cambio de recursos en OT confirmada ($\ge 5$). | Sub-tab 2 permite cambiar recursos con botón de confirmación. En Sub-tab 5 Despacho los selectores están bloqueados. | `PASSED`: Flujo disciplinado desde Asignación. |
| **TC-56.3** | Cotización con 1 Rigger y 2 Grúas. | El sub-registro de Rigger solo se muestra en la grúa principal (Línea 0). | `PASSED`: Regla multi-grúa cumplida. |
| **TC-56.4** | Selección de grúa de 70T para línea cotizada en 50T. | Aparece en el `<optgroup>` de alternativas y muestra el badge `[⚠️ Equipo de Mayor Capacidad...]`. | `PASSED`: Aviso visible y tarifa intacta. |
| **TC-56.5** | Compilación y Hard Gate. | `npm run build` en Frontend exitoso (0 errores), sincronización en `tcfg_backlog` y `tcfg_releases`. | `PASSED`: Exit code 0 y trazabilidad total. |
