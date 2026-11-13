const fs = require('fs');

const currentTorre = fs.readFileSync('ejecucion/frontend/src/views/Torre.vue', 'utf8').replace(/\r\n/g, '\n');
const baseTorre = fs.readFileSync('scratch/Torre_recovered_base.vue', 'utf8').replace(/\r\n/g, '\n');

// 1. Selector replacement
const selectorTarget = `      <!-- Selector Cuadri-Modal de Vistas -->
      <div class="flex flex-wrap items-center bg-[#070b14] p-1 rounded-xl border border-white/10 shrink-0 gap-0.5">
        <button 
          @click="activeView = 'kanban'" 
          class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
          :class="activeView === 'kanban' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'"
        >
          <span>🗂️</span>
          <span>Tablero Kanban</span>
        </button>
        <button 
          @click="activeView = 'pmo'" 
          class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all relative cursor-pointer"
          :class="activeView === 'pmo' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'"
        >
          <span>📊</span>
          <span>Matriz PMO</span>
          <span v-if="alertasCriticasTotales > 0" class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
        </button>
        <button 
          @click="activeView = 'gantt'" 
          class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
          :class="activeView === 'gantt' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'"
        >
          <span>📅</span>
          <span>Flota Gantt</span>
        </button>
        <button 
          @click="activeView = 'contabilidad'" 
          class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all relative cursor-pointer"
          :class="activeView === 'contabilidad' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'"
        >
          <span>💼</span>
          <span>Contabilidad</span>
          <span v-if="pendientesFacturacion > 0" class="w-2 h-2 rounded-full bg-emerald-400"></span>
        </button>
      </div>`;

const selectorReplacement = `      <!-- Selector de Vistas Principal -->
      <div class="flex flex-wrap items-center bg-[#070b14] p-1 rounded-xl border border-white/10 shrink-0 gap-0.5">
        <button 
          @click="activeView = 'kanban'" 
          class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
          :class="activeView === 'kanban' ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:text-white'"
          title="Vista Kanban: Tablero operativo con filtros avanzados y densidad ajustable"
        >
          <span>🗂️</span>
          <span>Kanban</span>
        </button>

        <button 
          @click="activeView = 'kardex'" 
          class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
          :class="activeView === 'kardex' ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20' : 'text-amber-400/90 hover:text-amber-300'"
          title="Vista Cardex: Mueble tarjetero indexado con elevación de fichas por estado y fecha"
        >
          <span>🗄️</span>
          <span>Vista Cardex</span>
        </button>

        <button 
          @click="activeView = 'pmo'" 
          class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all relative cursor-pointer"
          :class="activeView === 'pmo' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'"
        >
          <span>📊</span>
          <span>Matriz PMO</span>
          <span v-if="alertasCriticasTotales > 0" class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
        </button>

        <button 
          @click="activeView = 'gantt'" 
          class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
          :class="activeView === 'gantt' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'"
        >
          <span>📅</span>
          <span>Flota Gantt</span>
        </button>

        <button 
          @click="activeView = 'contabilidad'" 
          class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all relative cursor-pointer"
          :class="activeView === 'contabilidad' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'"
        >
          <span>💼</span>
          <span>Contabilidad</span>
        </button>
      </div>`;

// 2. Top bar: show search and internal req for both kanban and kardex
const topBarTarget = `<div v-if="activeView === 'kanban'" class="flex-1 flex flex-wrap items-center gap-2 max-w-2xl w-full md:w-auto">`;
const topBarReplacement = `<div v-if="['kanban', 'kardex'].includes(activeView)" class="flex-1 flex flex-wrap items-center gap-2 max-w-2xl w-full md:w-auto">`;

// 3. Old Kanban Target
const kanbanComment = '    <!-- Kanban Columns (6 Columnas Operativas) -->';
const pmoComment = '    <!-- Vista 2: Torre PMO de Control de Gestión & Auditoría Operacional-Financiera -->';

const idx1 = currentTorre.indexOf(kanbanComment);
const idx2 = currentTorre.indexOf(pmoComment);

if (idx1 === -1 || idx2 === -1) {
  throw new Error(`Markers not found: idx1=${idx1}, idx2=${idx2}`);
}

const oldKanban = currentTorre.slice(idx1, idx2);

// 4. New Kanban Template (Extract lines 727 to 1049 of baseTorre and adjust)
const baseLines = baseTorre.split('\n');
let kanbanProLines = baseLines.slice(726, 1049); // 0-indexed: line 727 is index 726

// Replace the v-else-if with v-if="activeView === 'kanban'"
let kanbanProStr = kanbanProLines.join('\n');
kanbanProStr = kanbanProStr.replace(
  `<div v-else-if="activeView === 'kanban_filtros'" class="space-y-3 animate-fadeIn">`,
  `<!-- ========================================================================= -->\n    <!-- VISTA 1: KANBAN OPERATIVO CON FILTROS MULTICRITERIO Y FECHAS CON FICHAS   -->\n    <!-- ========================================================================= -->\n    <div v-if="activeView === 'kanban'" class="space-y-3 animate-fadeIn">`
);

// Inject the interactive pill bar "Fechas con fichas" right after density buttons (after Fila 1)
const densityTarget = `                ☰ Compacta (Full Sucursal)
              </button>
            </div>
          </div>
        </div>

        <!-- Fila 2: Selectores por Operador, Rigger, Equipo, Cliente y Comercial -->`;

const densityReplacement = `                ☰ Compacta
              </button>
            </div>
          </div>
        </div>

        <!-- Tira Interactiva de Fechas con Fichas (incorporada desde Vista Cardex) -->
        <div v-if="fechasDisponiblesKardex.length > 0" class="flex items-center gap-1 overflow-x-auto py-1 border-t border-white/5 max-w-full">
          <span class="text-[10px] text-slate-400 font-bold uppercase px-1 shrink-0">Fechas con fichas:</span>
          <button
            v-for="itemFecha in fechasDisponiblesKardex"
            :key="itemFecha.iso"
            type="button"
            @click="seleccionarFechaPuntualKardex(itemFecha.iso)"
            class="px-2 py-1 rounded-lg text-[10px] font-mono font-bold border transition-all shrink-0 cursor-pointer flex items-center gap-1"
            :class="fechaPuntualKardex === itemFecha.iso
              ? 'bg-cyan-500 text-slate-950 border-cyan-300 font-black scale-105 shadow-md shadow-cyan-500/30'
              : 'bg-[#070b14] text-cyan-300 border-cyan-500/25 hover:border-cyan-400'"
          >
            <span>{{ itemFecha.label }}</span>
            <span class="px-1 rounded bg-black/30 text-[9px]" :class="fechaPuntualKardex === itemFecha.iso ? 'text-white' : 'text-amber-300'">
              {{ itemFecha.count }}
            </span>
          </button>
        </div>

        <!-- Fila 2: Selectores por Operador, Rigger, Equipo, Cliente y Comercial -->`;

if (!kanbanProStr.includes(densityTarget)) {
  throw new Error('densityTarget not found in kanbanProStr!');
}
kanbanProStr = kanbanProStr.replace(densityTarget, densityReplacement);

// 5. Vista Cardex Template
const cardexTemplate = `
    <!-- ========================================================================= -->
    <!-- VISTA 2: VISTA CARDEX — TARJETERO INDEXADO CON ELEVACIÓN DE FICHAS        -->
    <!-- ========================================================================= -->
    <div v-else-if="activeView === 'kardex'" class="space-y-3 animate-fadeIn">
      <!-- Panel de Control de Vista Cardex -->
      <div class="bg-gradient-to-r from-[#0d1326] via-[#11182d] to-[#0d1326] border border-amber-500/35 rounded-xl p-3.5 space-y-3 shadow-xl">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-lg shadow-inner">
              🗄️
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-xs font-black uppercase tracking-wider text-amber-300">Vista Cardex — Tarjetero Indexado</h3>
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/30 font-mono font-bold">
                  {{ totalLevantadasKardex }} fichas levantadas de {{ totalProyectosTablero }}
                </span>
              </div>
              <p class="text-[11px] text-slate-400">
                En reposo solo se asoma el <strong class="text-white">N° de Negocio y el Cliente</strong>. Selecciona criterios por <strong class="text-amber-300">Fecha, Operador o Rigger</strong> (o toca una pestaña) para desplegar las fichas.
              </p>
            </div>
          </div>

          <!-- Botones de Acción Rápida del Tarjetero -->
          <div class="flex flex-wrap items-center gap-2">
            <label class="inline-flex items-center gap-1.5 text-[11px] text-slate-300 bg-[#070b14] px-2.5 py-1.5 rounded-lg border border-white/10 cursor-pointer select-none">
              <input type="checkbox" v-model="kardexSoloLevantadas" class="accent-amber-500 rounded cursor-pointer" />
              <span>Ocultar fichas guardadas</span>
            </label>
            <button
              type="button"
              @click="kardexLevantarTodas = !kardexLevantarTodas"
              class="px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer"
              :class="kardexLevantarTodas ? 'bg-amber-500 text-slate-950 border-amber-400 font-black' : 'bg-[#070b14] text-amber-300 border-amber-500/30 hover:bg-amber-500/10'"
            >
              {{ kardexLevantarTodas ? '🔽 Guardar todas en el cajón' : '🔼 Levantar todas las fichas' }}
            </button>
            <button
              v-if="tieneCriterioActivoKardex"
              type="button"
              @click="limpiarFiltrosKanbanPro"
              class="px-2.5 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 font-bold text-[11px] transition-all cursor-pointer"
            >
              ✕ Bajar Fichas (Reset)
            </button>
          </div>
        </div>

        <!-- Tira Interactiva de Fechas ("Teclado del Tarjetero") -->
        <div class="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
          <!-- Selector Modo Fecha: Ejecución vs Venta -->
          <div class="flex items-center bg-[#060a12] p-0.5 rounded-lg border border-white/10 text-[11px] shrink-0">
            <button
              type="button"
              @click="tipoFechaKanbanPro = 'EJECUCION'"
              class="px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer"
              :class="tipoFechaKanbanPro === 'EJECUCION' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'"
            >
              📅 Por Fecha Ejecución
            </button>
            <button
              type="button"
              @click="tipoFechaKanbanPro = 'VENTA'"
              class="px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer"
              :class="tipoFechaKanbanPro === 'VENTA' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'"
            >
              🏷️ Por Fecha Venta / Cotiz
            </button>
          </div>

          <!-- Presets Rápidos -->
          <div class="flex items-center bg-[#060a12] p-0.5 rounded-lg border border-white/10 text-[11px]">
            <button
              v-for="preset in [
                { id: 'TODOS', label: 'Todos' },
                { id: 'HOY', label: 'Hoy' },
                { id: 'MANANA', label: 'Mañana' },
                { id: 'SEMANA', label: 'Esta Semana' },
                { id: 'MES', label: 'Este Mes' }
              ]"
              :key="preset.id"
              type="button"
              @click="seleccionarPresetFechaPro(preset.id)"
              class="px-2 py-1 rounded-md font-bold transition-all cursor-pointer"
              :class="presetFechaKanbanPro === preset.id && !fechaPuntualKardex ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'"
            >
              {{ preset.label }}
            </button>
          </div>

          <!-- Botones Píldora de Fechas Específicas -->
          <div v-if="fechasDisponiblesKardex.length > 0" class="flex items-center gap-1 overflow-x-auto py-0.5 max-w-[460px]">
            <button
              v-for="itemFecha in fechasDisponiblesKardex"
              :key="itemFecha.iso"
              type="button"
              @click="seleccionarFechaPuntualKardex(itemFecha.iso)"
              class="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border transition-all shrink-0 cursor-pointer flex items-center gap-1"
              :class="fechaPuntualKardex === itemFecha.iso
                ? 'bg-amber-400 text-slate-950 border-amber-300 font-black scale-105 shadow-md shadow-amber-500/30'
                : 'bg-[#070b14] text-amber-300 border-amber-500/25 hover:border-amber-400'"
            >
              <span>{{ itemFecha.label }}</span>
              <span class="px-1 rounded bg-black/30 text-[9px]" :class="fechaPuntualKardex === itemFecha.iso ? 'text-black' : 'text-amber-200'">
                {{ itemFecha.count }}
              </span>
            </button>
          </div>

          <!-- Rango Personalizado -->
          <div class="flex items-center gap-1 bg-[#060a12] px-2 py-1 rounded-lg border border-white/10 text-[11px] ml-auto">
            <span class="text-slate-500 font-bold">Desde:</span>
            <input
              v-model="fechaDesdeKanbanPro"
              @change="presetFechaKanbanPro = 'CUSTOM'; fechaPuntualKardex = ''"
              type="date"
              class="bg-transparent text-white font-mono text-[11px] focus:outline-none cursor-pointer"
            />
            <span class="text-slate-600">➔</span>
            <span class="text-slate-500 font-bold">Hasta:</span>
            <input
              v-model="fechaHastaKanbanPro"
              @change="presetFechaKanbanPro = 'CUSTOM'; fechaPuntualKardex = ''"
              type="date"
              class="bg-transparent text-white font-mono text-[11px] focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        <!-- Filtros Secundarios: Operador, Rigger, Equipo y Cliente -->
        <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
          <div class="flex flex-wrap items-center gap-2">
            <select
              v-model="filtroOperadorKanbanPro"
              class="bg-[#060a12] border border-white/10 rounded-lg px-2.5 py-1 text-[11px] text-white focus:outline-none focus:border-amber-500 cursor-pointer max-w-[170px]"
            >
              <option value="">👤 Todos los Operadores</option>
              <option v-for="op in opcionesOperadoresKanban" :key="op" :value="op">{{ op }}</option>
            </select>

            <select
              v-model="filtroRiggerKanbanPro"
              class="bg-[#060a12] border border-white/10 rounded-lg px-2.5 py-1 text-[11px] text-white focus:outline-none focus:border-amber-500 cursor-pointer max-w-[170px]"
            >
              <option value="">🦺 Todos los Riggers</option>
              <option v-for="rig in opcionesRiggersKanban" :key="rig" :value="rig">{{ rig }}</option>
            </select>

            <select
              v-model="filtroEquipoKanbanPro"
              class="bg-[#060a12] border border-white/10 rounded-lg px-2.5 py-1 text-[11px] text-white focus:outline-none focus:border-amber-500 cursor-pointer max-w-[180px]"
            >
              <option value="">🚜 Todas las Máquinas</option>
              <option v-for="eq in opcionesEquiposKanban" :key="eq" :value="eq">{{ eq }}</option>
            </select>

            <select
              v-model="filtroClienteKanbanPro"
              class="bg-[#060a12] border border-white/10 rounded-lg px-2.5 py-1 text-[11px] text-white focus:outline-none focus:border-amber-500 cursor-pointer max-w-[180px]"
            >
              <option value="">🏢 Todos los Clientes</option>
              <option v-for="cli in opcionesClientesKanban" :key="cli" :value="cli">{{ cli }}</option>
            </select>

            <select
              v-model="filtroVendedorKanbanPro"
              class="bg-[#060a12] border border-white/10 rounded-lg px-2.5 py-1 text-[11px] text-white focus:outline-none focus:border-amber-500 cursor-pointer max-w-[170px]"
            >
              <option value="">💼 Todos los Comerciales</option>
              <option v-for="vend in opcionesVendedoresKanban" :key="vend" :value="vend">{{ vend }}</option>
            </select>
          </div>

          <div v-if="tieneCriterioActivoKardex" class="text-[11px] text-amber-300 font-mono flex items-center gap-1.5">
            <span>✨ Elevando fichas coincidentes</span>
          </div>
        </div>
      </div>

      <!-- 6 Cajones del Mueble Tarjetero Cardex -->
      <div class="grid grid-cols-1 lg:grid-cols-6 gap-3.5 h-[calc(100vh-340px)] overflow-y-auto">
        <div
          v-for="col in columnasKardex3D"
          :key="col.id"
          class="kardex-cabinet-column bg-[#0b1020] border-t-4 border border-white/10 rounded-xl p-2.5 flex flex-col min-h-0 shadow-2xl"
          :class="col.borderTopClass"
        >
          <!-- Cabecera Metálica del Cajón Cardex -->
          <div class="flex justify-between items-center mb-3 pb-2 border-b border-white/10 px-1">
            <div class="flex items-center gap-1.5 min-w-0">
              <span class="w-2 h-2 rounded-full shrink-0" :class="col.dotClass"></span>
              <span class="text-[11px] font-black uppercase text-white truncate" :title="col.titulo">{{ col.titulo }}</span>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <span
                v-if="col.levantadasCount > 0"
                class="bg-amber-500 text-slate-950 text-[9px] font-mono font-black px-1.5 py-0.5 rounded shadow"
                title="Fichas levantadas en este cajón"
              >
                ▲ {{ col.levantadasCount }}
              </span>
              <span class="bg-black/40 text-[10px] font-mono text-slate-400 font-bold px-1.5 py-0.5 rounded border border-white/10">
                {{ col.items.length }}
              </span>
            </div>
          </div>

          <!-- Interior del Cajón Tarjetero -->
          <div class="kardex-drawer-viewport flex-1 overflow-y-auto px-1 pt-2 pb-8">
            <div
              v-for="(p, idx) in col.items"
              :key="p.id_proyecto"
              @mouseenter="hoveredKardexId = p.id_proyecto"
              @mouseleave="hoveredKardexId = null"
              @click="toggleTarjetaKardexManual(p.id_proyecto)"
              class="kardex-card-3d select-none cursor-pointer"
              :class="[
                esTarjetaLevantadaKardex(p) ? 'is-lifted' : 'is-resting',
                tieneCriterioActivoKardex && !esTarjetaCoincidenteCriterio(p) && !kardexPinesManuales.has(p.id_proyecto) ? 'is-dimmed' : ''
              ]"
              :style="{ zIndex: esTarjetaLevantadaKardex(p) ? 50 + idx : idx + 1 }"
            >
              <!-- CEJA / PESTAÑA SUPERIOR DEL TARJETERO (Siempre visible: Solo N° Negocio y Cliente) -->
              <div
                class="kardex-tab-header flex items-center justify-between gap-1.5 px-2.5 py-2 rounded-t-lg border-t border-x transition-all"
                :class="esTarjetaLevantadaKardex(p)
                  ? 'bg-gradient-to-r from-[#1e293b] via-[#172554] to-[#1e293b] border-amber-400/80 shadow-lg'
                  : 'bg-gradient-to-b from-[#172036] to-[#0f172a] border-white/15 hover:border-cyan-400/50'"
              >
                <div class="flex items-center gap-1.5 min-w-0 flex-1">
                  <span
                    class="text-[9.5px] font-mono font-black px-1.5 py-0.5 rounded shrink-0 border"
                    :class="esTarjetaLevantadaKardex(p)
                      ? 'bg-amber-500 text-slate-950 border-amber-300'
                      : 'bg-black/40 text-cyan-300 border-white/10'"
                  >
                    {{ p.codi_proyecto || \`ID-\${p.id_proyecto}\` }}
                  </span>
                  <span
                    class="text-[10.5px] font-bold truncate"
                    :class="esTarjetaLevantadaKardex(p) ? 'text-white' : 'text-slate-200'"
                    :title="p.nombre_cliente"
                  >
                    {{ p.nombre_cliente || 'Sin Cliente' }}
                  </span>
                </div>
                <span
                  class="text-[8.5px] font-mono shrink-0 px-1 py-0.5 rounded"
                  :class="esTarjetaLevantadaKardex(p) ? 'text-amber-300 bg-amber-500/15 font-bold' : 'text-slate-400'"
                >
                  {{ tipoFechaKanbanPro === 'EJECUCION' ? getFichaOperativa(p).fechaEjecIniCorto : getFichaOperativa(p).fechaVentaCorto }}
                </span>
              </div>

              <!-- CUERPO DE LA FICHA (Se despliega al levantarse la tarjeta) -->
              <div
                v-if="esTarjetaLevantadaKardex(p)"
                class="kardex-card-body bg-[#131c33] border-x border-b border-amber-400/70 rounded-b-lg p-2.5 space-y-2 text-left shadow-2xl"
              >
                <div class="flex items-center justify-between gap-1 border-b border-white/10 pb-1.5">
                  <p class="text-[10px] text-slate-300 font-semibold truncate" :title="p.nombre_proyecto">
                    📍 {{ p.nombre_proyecto || 'Sin nombre de obra' }}
                  </p>
                  <span
                    v-if="getFichaOperativa(p).esSoloRigger"
                    class="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/40 shrink-0"
                  >
                    🦺 SOLO RIGGER
                  </span>
                </div>

                <!-- Fechas de Ejecución y Venta -->
                <div class="bg-[#090d18] border border-white/10 rounded p-1.5 text-[9.5px] font-mono space-y-0.5">
                  <div class="flex items-center justify-between text-slate-300">
                    <span class="text-slate-500 text-[9px]">Ejecución:</span>
                    <span class="text-white font-bold">{{ getFichaOperativa(p).fechaEjecRango }}</span>
                  </div>
                  <div class="flex items-center justify-between gap-1 text-indigo-300">
                    <span class="text-indigo-400/70 text-[9px]">Venta / Cotiz:</span>
                    <span>{{ getFichaOperativa(p).fechaVenta }}</span>
                  </div>
                </div>

                <!-- Recursos Asignados -->
                <div class="bg-[#0b1324] border border-cyan-500/15 rounded p-1.5 text-[9.5px] space-y-1">
                  <div class="flex items-center justify-between gap-1">
                    <span class="text-slate-400 text-[9px]">Equipo:</span>
                    <span class="text-cyan-300 font-bold truncate max-w-[130px]" :title="getFichaOperativa(p).equipo">{{ getFichaOperativa(p).equipo }}</span>
                  </div>
                  <div class="flex items-center justify-between gap-1">
                    <span class="text-slate-400 text-[9px]">Operador:</span>
                    <span class="text-white truncate max-w-[130px]" :title="getFichaOperativa(p).operador">{{ getFichaOperativa(p).operador }}</span>
                  </div>
                  <div class="flex items-center justify-between gap-1">
                    <span class="text-slate-400 text-[9px]">Rigger:</span>
                    <span class="text-amber-300 font-medium truncate max-w-[130px]" :title="getFichaOperativa(p).rigger">{{ getFichaOperativa(p).rigger }}</span>
                  </div>
                </div>

                <!-- Footer con Vendedor y Monto -->
                <div class="flex items-center justify-between pt-1 border-t border-white/10 text-[9.5px]">
                  <span v-if="formatMonto(p)" class="font-mono font-bold text-emerald-400">{{ formatMonto(p) }}</span>
                  <span v-else class="text-slate-500">—</span>
                  <button
                    type="button"
                    @click.stop="abrirProyecto(p.id_proyecto, col.subtab)"
                    class="px-2 py-0.5 rounded bg-cyan-600/30 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/40 text-[9px] font-bold transition-all cursor-pointer"
                  >
                    Abrir Ficha ↗
                  </button>
                </div>
              </div>
            </div>

            <div v-if="col.items.length === 0" class="text-center py-12 text-[11px] text-slate-500 italic">
              Cajón vacío (sin fichas)
            </div>
          </div>
        </div>
      </div>
    </div>\n\n`;

// 6. Script block to add (using original definitions from baseTorre lines 3925-4532)
// Extract clean script block from baseTorre
const baseScriptLines = baseTorre.split('\n');
// In baseTorre, lines 3929 to 4531
// Let's filter out the duplicate formatIsoToDdMmYyyy since currentTorre already defines it
const rawScriptBlock = baseScriptLines.slice(3928, 4532).join('\n');
const scriptBlockClean = rawScriptBlock.replace(
  `const formatIsoToDdMmYyyy = (iso) => {
  if (!iso) return '—'
  const [yyyy, mm, dd] = String(iso).split('T')[0].split('-')
  if (!yyyy || !mm || !dd) return String(iso)
  return \`\${dd}/\${mm}/\${yyyy}\`
}`,
  `// formatIsoToDdMmYyyy already defined above`
);

// 7. Style block
const styleBlock = `
<style scoped>
/* =========================================================================
   ESTILOS DE VISTA CARDEX (TARJETERO INDEXADO)
   ========================================================================= */
.kardex-cabinet-column {
  background: linear-gradient(180deg, #0d1428 0%, #070b16 100%);
  box-shadow: inset 0 2px 12px rgba(0, 0, 0, 0.75);
}

.kardex-drawer-viewport {
  perspective: 1100px;
  transform-style: preserve-3d;
}

.kardex-card-3d {
  position: relative;
  transform-origin: bottom center;
  transition:
    transform 0.36s cubic-bezier(0.22, 1, 0.36, 1),
    margin 0.32s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.25s ease,
    filter 0.25s ease;
}

/* Estado Reposo: Ficha guardada en el cajón mostrando la ceja superior */
.kardex-card-3d.is-resting {
  transform: rotateX(-16deg) scale(0.975);
  margin-bottom: -3px;
  box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.65);
}

.kardex-card-3d.is-resting .kardex-tab-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  border-bottom-left-radius: 0.375rem;
  border-bottom-right-radius: 0.375rem;
}

/* Fichas no coincidentes cuando hay un criterio activo se atenúan */
.kardex-card-3d.is-resting.is-dimmed {
  opacity: 0.38;
  transform: rotateX(-22deg) scale(0.94);
  filter: saturate(0.5);
}

/* Estado Levantado: La ficha emerge y despliega su cuerpo completo */
.kardex-card-3d.is-lifted {
  transform: translateY(-6px) translateZ(28px) rotateX(0deg) scale(1.015);
  margin-top: 8px;
  margin-bottom: 12px;
  opacity: 1 !important;
  filter: none !important;
}

.kardex-card-body {
  animation: kardexUnfold 0.28s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

@keyframes kardexUnfold {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
`;

// Assemble the final Torre.vue
let assembled = currentTorre;

// A. Replace selector
assembled = assembled.replace(selectorTarget, selectorReplacement);

// B. Replace top bar condition
assembled = assembled.replace(topBarTarget, topBarReplacement);

// C. Replace old kanban with kanbanProStr + cardexTemplate
assembled = assembled.replace(oldKanban, kanbanProStr + '\n' + cardexTemplate);

// D. Insert script block right before "onMounted(async () => {"
const onMountedTarget = 'onMounted(async () => {';
if (!assembled.includes(onMountedTarget)) {
  throw new Error('onMountedTarget not found in assembled!');
}
assembled = assembled.replace(onMountedTarget, scriptBlockClean + '\n\n' + onMountedTarget);

// E. Append styles after </script>
assembled = assembled.replace('</script>', '</script>\n' + styleBlock);

fs.writeFileSync('scratch/Torre_final_assembled.vue', assembled, 'utf8');
console.log('SUCCESS! Saved scratch/Torre_final_assembled.vue, length:', assembled.length, 'lines:', assembled.split('\n').length);
