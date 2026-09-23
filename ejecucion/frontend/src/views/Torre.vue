<template>
  <div class="space-y-6 text-left">
    <!-- Header -->
    <div class="bg-[#0a0f1e]/40 p-4 border border-white/5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-lg font-black text-white uppercase tracking-wider font-display">Torre de Control Operativa</h2>
        <p class="text-xs text-slate-400 mt-1">Planificación y seguimiento de maniobras de izaje, logística de contrapesos y telemetría de ruta.</p>
      </div>

      <!-- Buscador Omnibox Reactivo (Spec 16 - Sección 11) -->
      <div v-if="activeView === 'kanban'" class="flex-1 max-w-md relative w-full md:w-auto">
        <div class="relative flex items-center">
          <span class="absolute left-3 text-slate-400 pointer-events-none text-xs">🔍</span>
          <input 
            v-model="busquedaKanban"
            type="text" 
            placeholder="Buscar por N° Cotización, Cliente o Vendedor..." 
            @keydown.esc="busquedaKanban = ''"
            class="w-full bg-[#070b14] border border-white/10 rounded-xl pl-8 pr-16 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
          />
          <div class="absolute right-2 flex items-center gap-1.5">
            <span v-if="busquedaKanban" class="text-[9px] text-blue-400 font-mono font-bold bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
              {{ totalCoincidenciasKanban }}
            </span>
            <button 
              v-if="busquedaKanban"
              @click="busquedaKanban = ''"
              type="button"
              class="text-slate-400 hover:text-white p-0.5 transition-colors"
              title="Limpiar búsqueda (Esc)"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      <!-- Selector Tri-Modal de Vistas -->
      <div class="flex items-center bg-[#070b14] p-1 rounded-xl border border-white/10 shrink-0">
        <button 
          @click="activeView = 'kanban'" 
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
          :class="activeView === 'kanban' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'"
        >
          <span>🗂️</span>
          <span>Tablero Kanban</span>
        </button>
        <button 
          @click="activeView = 'pmo'" 
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all relative"
          :class="activeView === 'pmo' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'"
        >
          <span>📊</span>
          <span>Matriz PMO (Control Gestión)</span>
          <span v-if="alertasCriticasTotales > 0" class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
        </button>
        <button 
          @click="activeView = 'gantt'" 
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
          :class="activeView === 'gantt' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'"
        >
          <span>📅</span>
          <span>Perspectiva Temporal (Flota Gantt)</span>
        </button>
      </div>
    </div>

    <!-- Kanban Columns (6 Columnas Operativas) -->
    <div v-if="activeView === 'kanban'" class="grid grid-cols-1 lg:grid-cols-6 gap-3.5 h-[calc(100vh-210px)] overflow-y-auto">
      <!-- Columna 1: Requerimiento Registrado -->
      <div class="bg-[#0f1629] border-t-4 border-[#6366f1] border border-white/5 rounded-xl p-3 flex flex-col">
        <div class="flex justify-between items-center mb-4">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 bg-[#6366f1] rounded-full"></span>
            <span class="text-xs font-black uppercase text-white">Requerimiento Registrado</span>
          </div>
          <span class="bg-black/20 text-[10px] text-slate-400 font-bold px-2 py-0.5 rounded border border-white/5">
            {{ preventaFiltrados.length }}
          </span>
        </div>
        <div class="space-y-3 flex-1 overflow-y-auto">
          <button @click="abrirCotizacion" class="w-full py-2 bg-[#6366f1]/10 hover:bg-[#6366f1]/20 border border-[#6366f1]/30 text-[#818cf8] rounded-lg text-xs font-bold transition-all mb-2 flex items-center justify-center gap-1">
            <span>+ Nueva Oportunidad</span>
          </button>
          
          <div 
            v-for="p in preventaFiltrados" 
            :key="p.id_proyecto" 
            @click="abrirProyecto(p.id_proyecto, 'comercial')"
            class="bg-[#151d35] border rounded-lg p-3 hover:bg-[#6366f1]/5 transition-all cursor-pointer text-left"
            :class="p.json_field?.crm_v1?.prioridad === 'alta' ? 'border-red-500/40 shadow-lg shadow-red-500/5' : 'border-white/5 hover:border-[#6366f1]/40'"
          >
            <div class="flex justify-between items-start">
              <span class="text-[9px] font-mono text-[#818cf8] font-bold">{{ p.codi_proyecto || '—' }}</span>
              <span v-if="p.json_field?.crm_v1?.prioridad === 'alta'" class="text-[8px] font-bold uppercase bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/30 text-red-400 flex items-center gap-0.5">
                🔥 Alta
              </span>
            </div>
            <h4 class="text-xs font-bold text-white mt-1">{{ p.nombre_cliente || '—' }}</h4>
            <p class="text-[10px] text-slate-400 mt-0.5 truncate">{{ p.nombre_proyecto }}</p>
            <div class="text-[10px] text-slate-400 mt-2 space-y-1">
              <p>{{ p.json_field?.crm_v1?.familia_servicio || p.objetivo_proyecto || '—' }}</p>
              <p v-if="getNombreVendedor(p)" class="text-[9px] text-indigo-400 font-medium flex items-center gap-1">
                <span>👤</span> {{ getNombreVendedor(p) }}
              </p>
              <p v-if="formatMonto(p)" class="text-white font-bold">{{ formatMonto(p) }}</p>
              <p v-if="p.fecha_plan_ini" class="text-amber-500/70"><span class="font-semibold">Tentativa:</span> {{ new Date(p.fecha_plan_ini).toLocaleDateString() }}</p>
            </div>
            <div class="flex gap-1.5 mt-2">
              <span class="text-[8px] font-bold uppercase bg-[#6366f1]/10 px-2 py-0.5 rounded border border-[#6366f1]/20 text-[#818cf8]">
                {{ p.id_proyecto_estado === 1 ? 'Oportunidad' : 'Cotizando' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Columna 2: En Verificación Operaciones -->
      <div class="bg-[#0f1629] border-t-4 border-amber-500 border border-white/5 rounded-xl p-3 flex flex-col">
        <div class="flex justify-between items-center mb-4">
          <div class="flex items-center gap-1.5">
            <span class="text-xs">🔥</span>
            <span class="text-xs font-black uppercase text-white">En Verificación Operaciones</span>
          </div>
          <span class="bg-black/20 text-[10px] text-amber-500 font-bold px-2 py-0.5 rounded border border-amber-500/20">
            {{ verificacionFiltrados.length }}
          </span>
        </div>
        <div class="space-y-3 flex-1 overflow-y-auto">
          <div 
            v-for="p in verificacionFiltrados" 
            :key="p.id_proyecto" 
            @click="abrirProyecto(p.id_proyecto, 'validacion')"
            class="bg-[#151d35] border rounded-lg p-3 hover:bg-amber-500/5 transition-all cursor-pointer text-left"
            :class="p.json_field?.crm_v1?.prioridad === 'alta' ? 'border-red-500/40 shadow-lg shadow-red-500/5' : 'border-white/5 hover:border-amber-500/40'"
          >
            <div class="flex justify-between items-start">
              <span class="text-[9px] font-mono text-amber-500 font-bold">{{ p.codi_proyecto || '—' }}</span>
              <div class="flex items-center gap-1.5">
                <span v-if="p.json_field?.crm_v1?.prioridad === 'alta'" class="text-[8px] font-bold uppercase bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/30 text-red-400 flex items-center gap-0.5">
                  🔥 Alta
                </span>
                <!-- Micro-Gauge Avance Acreditación (Visible solo desde Preparación de Salida / Estado 5) -->
                <div 
                  v-if="Number(p.id_proyecto_estado) >= 5"
                  @click.stop="abrirProyecto(p.id_proyecto, 'acreditaciones')"
                  class="relative w-14 h-14 flex items-center justify-center shrink-0 cursor-pointer hover:scale-105 transition-transform bg-[#0a0f1e]/80 rounded-full border border-white/10 p-1 shadow-md" 
                  :title="`Acreditación: ${calcularPorcentajeAcreditacion(p)}% (Clic para gestionar Acreditaciones)`"
                >
                  <svg class="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                    <path class="text-slate-800" stroke-width="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                    <path 
                      :class="calcularPorcentajeAcreditacion(p) === 100 ? 'text-emerald-400' : 'text-red-500'" 
                      class="transition-all duration-700" 
                      stroke-width="3.5" 
                      :stroke-dasharray="`${calcularPorcentajeAcreditacion(p)}, 100`" 
                      stroke-linecap="round" 
                      stroke="currentColor" 
                      fill="none" 
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span :class="calcularPorcentajeAcreditacion(p) === 100 ? 'text-emerald-400' : 'text-red-400'" class="absolute text-xs font-black font-mono">
                    {{ calcularPorcentajeAcreditacion(p) }}%
                  </span>
                </div>
              </div>
            </div>
            <h4 class="text-xs font-bold text-white mt-1">{{ p.nombre_cliente || '—' }}</h4>
            <p class="text-[10px] text-slate-400 mt-0.5 truncate">{{ p.nombre_proyecto }}</p>
            <div class="text-[10px] text-slate-400 mt-2 space-y-1">
              <p>Operador: {{ p.json_field?.ejecucion_v1?.operador_nombre || '—' }}</p>
              <p>Rigger: {{ p.json_field?.ejecucion_v1?.rigger_nombre || '—' }}</p>
              <p v-if="getNombreVendedor(p)" class="text-[9px] text-indigo-400 font-medium flex items-center gap-1">
                <span>👤</span> {{ getNombreVendedor(p) }}
              </p>
              <p v-if="formatMonto(p)" class="text-white font-bold">{{ formatMonto(p) }}</p>
              <p v-if="p.fecha_plan_ini" class="text-amber-500/70"><span class="font-semibold">Asignación:</span> {{ new Date(p.fecha_plan_ini).toLocaleDateString() }}</p>
            </div>
            <div class="flex gap-1.5 mt-3">
              <span class="text-[8px] font-bold uppercase bg-white/5 px-2 py-0.5 rounded border border-white/5 text-slate-400">
                {{ p.json_field?.crm_v1?.requiere_acreditacion ? 'Acreditación' : 'Sin Acreditación' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Columna 3: En Asignación Recursos -->
      <div class="bg-[#0f1629] border-t-4 border-blue-500 border border-white/5 rounded-xl p-3 flex flex-col">
        <div class="flex justify-between items-center mb-4">
          <span class="text-xs font-black uppercase text-white">En Asignación Recursos</span>
          <span class="bg-black/20 text-[10px] text-blue-400 font-bold px-2 py-0.5 rounded border border-blue-500/20">
            {{ asignadosFiltrados.length }}
          </span>
        </div>
        <div class="space-y-3 flex-1 overflow-y-auto">
          <div 
            v-for="p in asignadosFiltrados" 
            :key="p.id_proyecto" 
            @click="abrirProyecto(p.id_proyecto, 'asignacion')"
            class="bg-[#151d35] border rounded-lg p-3 hover:bg-blue-500/5 transition-all cursor-pointer text-left"
            :class="p.json_field?.crm_v1?.prioridad === 'alta' ? 'border-red-500/40 shadow-lg shadow-red-500/5' : 'border-white/5 hover:border-blue-500/40'"
          >
            <div class="flex justify-between items-start">
              <span class="text-[9px] font-mono text-blue-400 font-bold">{{ p.codi_proyecto || '—' }}</span>
              <div class="flex items-center gap-1.5">
                <span v-if="p.json_field?.crm_v1?.prioridad === 'alta'" class="text-[8px] font-bold uppercase bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/30 text-red-400 flex items-center gap-0.5">
                  🔥 Alta
                </span>
                <!-- Micro-Gauge Avance Acreditación (Visible solo desde Preparación de Salida / Estado 5) -->
                <div 
                  v-if="Number(p.id_proyecto_estado) >= 5"
                  @click.stop="abrirProyecto(p.id_proyecto, 'acreditaciones')"
                  class="relative w-14 h-14 flex items-center justify-center shrink-0 cursor-pointer hover:scale-105 transition-transform bg-[#0a0f1e]/80 rounded-full border border-white/10 p-1 shadow-md" 
                  :title="`Acreditación: ${calcularPorcentajeAcreditacion(p)}% (Clic para gestionar Acreditaciones)`"
                >
                  <svg class="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                    <path class="text-slate-800" stroke-width="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                    <path 
                      :class="calcularPorcentajeAcreditacion(p) === 100 ? 'text-emerald-400' : 'text-red-500'" 
                      class="transition-all duration-700" 
                      stroke-width="3.5" 
                      :stroke-dasharray="`${calcularPorcentajeAcreditacion(p)}, 100`" 
                      stroke-linecap="round" 
                      stroke="currentColor" 
                      fill="none" 
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span :class="calcularPorcentajeAcreditacion(p) === 100 ? 'text-emerald-400' : 'text-red-400'" class="absolute text-xs font-black font-mono">
                    {{ calcularPorcentajeAcreditacion(p) }}%
                  </span>
                </div>
              </div>
            </div>
            <h4 class="text-xs font-bold text-white mt-1">{{ p.nombre_cliente || '—' }}</h4>
            <p class="text-[10px] text-slate-400 mt-0.5 truncate">{{ p.nombre_proyecto }}</p>
            <div class="text-[10px] text-slate-400 mt-2 space-y-1">
              <p>Operador: {{ p.json_field?.ejecucion_v1?.operador_nombre || '—' }}</p>
              <p>Rigger: {{ p.json_field?.ejecucion_v1?.rigger_nombre || '—' }}</p>
              <p v-if="getNombreVendedor(p)" class="text-[9px] text-indigo-400 font-medium flex items-center gap-1">
                <span>👤</span> {{ getNombreVendedor(p) }}
              </p>
              <p v-if="formatMonto(p)" class="text-white font-bold">{{ formatMonto(p) }}</p>
              <p v-if="p.fecha_plan_ini" class="text-blue-400/70"><span class="font-semibold">Asignación:</span> {{ new Date(p.fecha_plan_ini).toLocaleDateString() }}</p>
            </div>
            <div class="flex gap-1.5 mt-3">
              <span class="text-[8px] font-bold uppercase bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/25 text-blue-400">Asignando OT</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Columna 4: En Preparación Operaciones -->
      <div class="bg-[#0f1629] border-t-4 border-cyan-500 border border-white/5 rounded-xl p-3 flex flex-col">
        <div class="flex justify-between items-center mb-4">
          <span class="text-xs font-black uppercase text-white">En Preparación Operaciones</span>
          <span class="bg-black/20 text-[10px] text-cyan-400 font-bold px-2 py-0.5 rounded border border-cyan-500/20">
            {{ desplazamientoFiltrados.length }}
          </span>
        </div>
        <div class="space-y-3 flex-1 overflow-y-auto">
          <div 
            v-for="p in desplazamientoFiltrados" 
            :key="p.id_proyecto" 
            @click="abrirProyecto(p.id_proyecto, 'preparacion_salida')"
            @mouseenter="hoveredProyectoId = p.id_proyecto"
            @mouseleave="hoveredProyectoId = null"
            class="bg-[#151d35] border rounded-lg p-3 hover:bg-cyan-500/5 transition-all cursor-pointer text-left select-none space-y-2"
            :class="[
              p.json_field?.crm_v1?.prioridad === 'alta' ? 'border-red-500/40 shadow-lg shadow-red-500/5' : 'border-white/5 hover:border-cyan-500/40',
              hoveredProyectoId === p.id_proyecto ? 'ring-2 ring-cyan-400 shadow-xl shadow-cyan-500/20 scale-[1.01]' : ''
            ]"
          >
            <div class="flex justify-between items-start">
              <span class="text-[9px] font-mono text-cyan-400 font-bold">{{ p.codi_proyecto || '—' }}</span>
              <div class="flex items-center gap-1.5">
                <span v-if="p.json_field?.crm_v1?.prioridad === 'alta'" class="text-[8px] font-bold uppercase bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/30 text-red-400 flex items-center gap-0.5">
                  🔥 Alta
                </span>
                <!-- Micro-Gauge Avance Acreditación (3x Tamaño) -->
                <div 
                  @click.stop="abrirProyecto(p.id_proyecto, 'acreditaciones')"
                  class="relative w-14 h-14 flex items-center justify-center shrink-0 cursor-pointer hover:scale-105 transition-transform bg-[#0a0f1e]/80 rounded-full border border-white/10 p-1 shadow-md" 
                  :title="`Acreditación: ${calcularPorcentajeAcreditacion(p)}% (Clic para gestionar Acreditaciones)`"
                >
                  <svg class="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                    <path class="text-slate-800" stroke-width="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                    <path 
                      :class="calcularPorcentajeAcreditacion(p) === 100 ? 'text-emerald-400' : 'text-red-500'" 
                      class="transition-all duration-700" 
                      stroke-width="3.5" 
                      :stroke-dasharray="`${calcularPorcentajeAcreditacion(p)}, 100`" 
                      stroke-linecap="round" 
                      stroke="currentColor" 
                      fill="none" 
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span :class="calcularPorcentajeAcreditacion(p) === 100 ? 'text-emerald-400' : 'text-red-400'" class="absolute text-xs font-black font-mono">
                    {{ calcularPorcentajeAcreditacion(p) }}%
                  </span>
                </div>
              </div>
            </div>

            <h4 class="text-xs font-bold text-white mt-1">{{ p.nombre_cliente || '—' }}</h4>
            <p class="text-[10px] text-slate-400 mt-0.5 truncate">{{ p.nombre_proyecto }}</p>

            <div class="text-[10px] text-slate-400 mt-2 space-y-1">
              <p>Operador: {{ p.json_field?.ejecucion_v1?.operador_nombre || '—' }}</p>
              <p>Equipo: {{ p.json_field?.ejecucion_v1?.patente_grua || '—' }}</p>
              <p v-if="getNombreVendedor(p)" class="text-[9px] text-indigo-400 font-medium flex items-center gap-1">
                <span>👤</span> {{ getNombreVendedor(p) }}
              </p>
              <p v-if="formatMonto(p)" class="text-white font-bold">{{ formatMonto(p) }}</p>
              <p v-if="p.fecha_plan_ini" class="text-cyan-400/70"><span class="font-semibold">Inicio:</span> {{ new Date(p.fecha_plan_ini).toLocaleDateString() }}</p>
            </div>

            <div class="flex items-center justify-between gap-1.5 mt-3 pt-1 border-t border-white/5">
              <span class="text-[8px] font-bold uppercase bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/25 text-cyan-400">Patio / Salida</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Columna 5: En Ejecución / Faena -->
      <div class="bg-[#0f1629] border-t-4 border-purple-400 border border-white/5 rounded-xl p-3 flex flex-col">
        <div class="flex justify-between items-center mb-4">
          <span class="text-xs font-black uppercase text-white">En Ejecución / Faena</span>
          <span class="bg-black/20 text-[10px] text-purple-400 font-bold px-2 py-0.5 rounded border border-purple-500/20">
            {{ maniobraFiltrados.length }}
          </span>
        </div>
        <div class="space-y-3 flex-1 overflow-y-auto">
          <div 
            v-for="p in maniobraFiltrados" 
            :key="p.id_proyecto" 
            @click="abrirProyecto(p.id_proyecto, 'reports')"
            class="bg-[#151d35] border rounded-lg p-3 hover:bg-purple-400/5 transition-all cursor-pointer text-left"
            :class="p.json_field?.crm_v1?.prioridad === 'alta' ? 'border-red-500/40 shadow-lg shadow-red-500/5' : 'border-white/5 hover:border-purple-400/40'"
          >
            <div class="flex justify-between items-start">
              <span class="text-[9px] font-mono text-purple-400 font-bold">{{ p.codi_proyecto || '—' }}</span>
              <div class="flex items-center gap-1.5">
                <span v-if="p.json_field?.crm_v1?.prioridad === 'alta'" class="text-[8px] font-bold uppercase bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/30 text-red-400 flex items-center gap-0.5">
                  🔥 Alta
                </span>
                <!-- Micro-Gauge Avance Acreditación (3x Tamaño) -->
                <div 
                  @click.stop="abrirProyecto(p.id_proyecto, 'acreditaciones')"
                  class="relative w-14 h-14 flex items-center justify-center shrink-0 cursor-pointer hover:scale-105 transition-transform bg-[#0a0f1e]/80 rounded-full border border-white/10 p-1 shadow-md" 
                  :title="`Acreditación: ${calcularPorcentajeAcreditacion(p)}% (Clic para gestionar Acreditaciones)`"
                >
                  <svg class="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                    <path class="text-slate-800" stroke-width="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                    <path 
                      :class="calcularPorcentajeAcreditacion(p) === 100 ? 'text-emerald-400' : 'text-red-500'" 
                      class="transition-all duration-700" 
                      stroke-width="3.5" 
                      :stroke-dasharray="`${calcularPorcentajeAcreditacion(p)}, 100`" 
                      stroke-linecap="round" 
                      stroke="currentColor" 
                      fill="none" 
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span :class="calcularPorcentajeAcreditacion(p) === 100 ? 'text-emerald-400' : 'text-red-400'" class="absolute text-xs font-black font-mono">
                    {{ calcularPorcentajeAcreditacion(p) }}%
                  </span>
                </div>
              </div>
            </div>
            <h4 class="text-xs font-bold text-white mt-1">{{ p.nombre_cliente || '—' }}</h4>
            <p class="text-[10px] text-slate-400 mt-0.5 truncate">{{ p.nombre_proyecto }}</p>
            <div class="text-[10px] text-slate-400 mt-2 space-y-1">
              <p>Operador: {{ p.json_field?.ejecucion_v1?.operador_nombre || '—' }}</p>
              <p>Rigger: {{ p.json_field?.ejecucion_v1?.rigger_nombre || '—' }}</p>
              <p v-if="getNombreVendedor(p)" class="text-[9px] text-indigo-400 font-medium flex items-center gap-1">
                <span>👤</span> {{ getNombreVendedor(p) }}
              </p>
              <p v-if="formatMonto(p)" class="text-white font-bold">{{ formatMonto(p) }}</p>
              <p v-if="p.fecha_plan_fin" class="text-purple-400/70"><span class="font-semibold">Término Est.:</span> {{ new Date(p.fecha_plan_fin).toLocaleDateString() }}</p>
            </div>
            <div class="flex items-center justify-between gap-1.5 mt-3 pt-1 border-t border-white/5">
              <span class="text-[8px] font-bold uppercase bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/25 text-purple-400">Izaje / Faena</span>
              <span class="text-[8px] font-bold uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 text-amber-400 flex items-center gap-1">
                <span>📋</span>
                <span>Reports Diarios</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Columna 6: Finalizado / Devengado -->
      <div class="bg-[#0f1629] border-t-4 border-emerald-500 border border-white/5 rounded-xl p-3 flex flex-col">
        <div class="flex justify-between items-center mb-4">
          <span class="text-xs font-black uppercase text-white">Finalizado / Devengado</span>
          <span class="bg-black/20 text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/20">
            {{ completadosFiltrados.length }}
          </span>
        </div>
        <div class="space-y-3 flex-1 overflow-y-auto">
          <div 
            v-for="p in completadosFiltrados" 
            :key="p.id_proyecto" 
            @click="abrirProyecto(p.id_proyecto, 'dossier_acreditacion')"
            class="bg-[#151d35] border rounded-lg p-3 hover:bg-emerald-500/5 transition-all cursor-pointer text-left"
            :class="p.json_field?.crm_v1?.prioridad === 'alta' ? 'border-red-500/40 shadow-lg shadow-red-500/5' : 'border-white/5 hover:border-emerald-500/40'"
          >
            <div class="flex justify-between items-start">
              <span class="text-[9px] font-mono text-emerald-400 font-bold">{{ p.codi_proyecto || '—' }}</span>
              <div class="flex items-center gap-1.5">
                <span v-if="p.json_field?.crm_v1?.prioridad === 'alta'" class="text-[8px] font-bold uppercase bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/30 text-red-400 flex items-center gap-0.5">
                  🔥 Alta
                </span>
                <!-- Micro-Gauge Avance Acreditación (3x Tamaño) -->
                <div 
                  @click.stop="abrirProyecto(p.id_proyecto, 'acreditaciones')"
                  class="relative w-14 h-14 flex items-center justify-center shrink-0 cursor-pointer hover:scale-105 transition-transform bg-[#0a0f1e]/80 rounded-full border border-white/10 p-1 shadow-md" 
                  :title="`Acreditación: ${calcularPorcentajeAcreditacion(p)}% (Clic para gestionar Acreditaciones)`"
                >
                  <svg class="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                    <path class="text-slate-800" stroke-width="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                    <path 
                      :class="calcularPorcentajeAcreditacion(p) === 100 ? 'text-emerald-400' : 'text-red-500'" 
                      class="transition-all duration-700" 
                      stroke-width="3.5" 
                      :stroke-dasharray="`${calcularPorcentajeAcreditacion(p)}, 100`" 
                      stroke-linecap="round" 
                      stroke="currentColor" 
                      fill="none" 
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span :class="calcularPorcentajeAcreditacion(p) === 100 ? 'text-emerald-400' : 'text-red-400'" class="absolute text-xs font-black font-mono">
                    {{ calcularPorcentajeAcreditacion(p) }}%
                  </span>
                </div>
              </div>
            </div>
            <h4 class="text-xs font-bold text-white mt-1">{{ p.nombre_cliente || '—' }}</h4>
            <p class="text-[10px] text-slate-400 mt-0.5 truncate">{{ p.nombre_proyecto }}</p>
            <div class="text-[10px] text-slate-400 mt-2 space-y-1">
              <p v-if="getNombreVendedor(p)" class="text-[9px] text-indigo-400 font-medium flex items-center gap-1">
                <span>👤</span> {{ getNombreVendedor(p) }}
              </p>
              <p v-if="formatMonto(p)" class="text-white font-bold">{{ formatMonto(p) }}</p>
              <p>Estado: {{ p.id_proyecto_estado === 5 ? 'Cerrado' : 'Perdido' }}</p>
              <p v-if="p.fecha_plan_fin" class="text-emerald-400/70"><span class="font-semibold">Finalizado:</span> {{ new Date(p.fecha_plan_fin).toLocaleDateString() }}</p>
            </div>
            <div class="flex gap-1.5 mt-3">
              <span class="text-[8px] font-bold uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/25 text-emerald-400">Dossier</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Vista 2: Matriz PMO de Control de Gestión & Excepciones Temporales -->
    <div v-else-if="activeView === 'pmo'" class="space-y-4">
      <!-- KPIs PMO -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div class="bg-[#0f1629] border border-white/5 rounded-xl p-3.5 flex items-center justify-between shadow-sm">
          <div>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total OTs en Gestión</p>
            <p class="text-xl font-black text-white mt-1">{{ proyectosActivosPMO.length }}</p>
          </div>
          <span class="text-2xl">📋</span>
        </div>
        <div class="bg-[#0f1629] border border-red-500/30 rounded-xl p-3.5 flex items-center justify-between shadow-sm">
          <div>
            <p class="text-[10px] font-bold text-red-400 uppercase tracking-wider">Alertas Críticas</p>
            <p class="text-xl font-black text-red-400 mt-1">{{ alertasCriticasTotales }}</p>
          </div>
          <span class="text-2xl">🚨</span>
        </div>
        <div class="bg-[#0f1629] border border-amber-500/30 rounded-xl p-3.5 flex items-center justify-between shadow-sm">
          <div>
            <p class="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Sin OC Mandante</p>
            <p class="text-xl font-black text-amber-400 mt-1">{{ otsSinOC }}</p>
          </div>
          <span class="text-2xl">📄</span>
        </div>
        <div class="bg-[#0f1629] border border-cyan-500/30 rounded-xl p-3.5 flex items-center justify-between shadow-sm">
          <div>
            <p class="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Salida Retrasada</p>
            <p class="text-xl font-black text-cyan-400 mt-1">{{ salidasRetrasadas }}</p>
          </div>
          <span class="text-2xl">⏱️</span>
        </div>
        <div class="bg-[#0f1629] border border-purple-500/30 rounded-xl p-3.5 flex items-center justify-between shadow-sm">
          <div>
            <p class="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Pend. Facturación</p>
            <p class="text-xl font-black text-purple-400 mt-1">{{ pendientesFacturacion }}</p>
          </div>
          <span class="text-2xl">💰</span>
        </div>
      </div>

      <!-- DataGrid PMO (7 Hitos) -->
      <div class="bg-[#0f1629] border border-white/5 rounded-xl overflow-hidden shadow-xl">
        <div class="p-3 border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-3 bg-[#0a0f1e]/60">
          <div class="flex items-center gap-2">
            <span class="text-xs font-black uppercase text-white tracking-wider">Matriz de Hitos & Auditoría de Ocurrencias</span>
            <span class="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/5 font-mono">Reloj en Tiempo Real</span>
          </div>
          <input 
            v-model="filtroPMO" 
            type="text" 
            placeholder="Buscar por OT, cliente o faena..." 
            class="bg-[#070b14] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 w-full md:w-80 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <div class="overflow-x-auto max-h-[calc(100vh-270px)]">
          <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-[#070b14] text-slate-400 uppercase text-[10px] tracking-wider font-bold border-b border-white/10 sticky top-0 z-10 select-none">
              <tr>
                <th class="py-2.5 px-3">OT / Negocio</th>
                <th class="py-2.5 px-3">Programación</th>
                <th class="py-2.5 px-3 text-center">1. OC Mandante</th>
                <th class="py-2.5 px-3 text-center">2. Validación Op.</th>
                <th class="py-2.5 px-3 text-center">3. Asignación</th>
                <th class="py-2.5 px-3 text-center">4. Acreditación</th>
                <th class="py-2.5 px-3 text-center">5. Salida Patio</th>
                <th class="py-2.5 px-3 text-center">6. Report PWA</th>
                <th class="py-2.5 px-3 text-center">7. Facturación</th>
                <th class="py-2.5 px-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5 text-slate-300">
              <tr v-for="p in proyectosFiltradosPMO" :key="p.id_proyecto" class="hover:bg-white/5 transition-colors">
                <!-- OT / Negocio -->
                <td class="py-2.5 px-3">
                  <div class="font-mono font-bold text-blue-400 text-xs">{{ p.codi_proyecto || '—' }}</div>
                  <div class="font-bold text-white text-xs truncate max-w-[190px]" :title="p.nombre_cliente">{{ p.nombre_cliente || '—' }}</div>
                  <div class="text-[10px] text-slate-400 truncate max-w-[190px]">{{ p.nombre_proyecto }}</div>
                </td>
                <!-- Programación -->
                <td class="py-2.5 px-3 whitespace-nowrap text-[11px]">
                  <div class="text-white">{{ formatFecha(p.fecha_plan_ini) }}</div>
                  <div class="text-slate-400 text-[10px]">al {{ formatFecha(p.fecha_plan_fin) }}</div>
                </td>
                <!-- 1. OC Mandante -->
                <td class="py-2.5 px-3 text-center whitespace-nowrap">
                  <span v-if="getHitoOC(p).status === 'OK'" class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    ✓ {{ getHitoOC(p).label }}
                  </span>
                  <span v-else-if="getHitoOC(p).status === 'CRITICAL'" class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse" :title="getHitoOC(p).tooltip">
                    🔴 {{ getHitoOC(p).label }}
                  </span>
                  <span v-else class="text-[10px] text-slate-500">No Requerida</span>
                </td>
                <!-- 2. Validación Op. -->
                <td class="py-2.5 px-3 text-center whitespace-nowrap">
                  <span v-if="getHitoValidacion(p).status === 'OK'" class="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    ✓ Validado
                  </span>
                  <span v-else-if="getHitoValidacion(p).status === 'PENDING'" class="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    🟡 Pendiente
                  </span>
                  <span v-else class="text-[10px] text-slate-500">Preventa</span>
                </td>
                <!-- 3. Asignación -->
                <td class="py-2.5 px-3 text-center">
                  <div v-if="getHitoAsignacion(p).status === 'OK'">
                    <span class="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                      {{ getHitoAsignacion(p).equipo }}
                    </span>
                    <div class="text-[9px] text-slate-400 mt-0.5 truncate max-w-[120px] mx-auto">{{ getHitoAsignacion(p).operador }}</div>
                  </div>
                  <span v-else class="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Por Asignar
                  </span>
                </td>
                <!-- 4. Acreditación -->
                <td class="py-2.5 px-3 text-center whitespace-nowrap">
                  <span 
                    class="text-[10px] font-bold px-2 py-0.5 rounded"
                    :class="getHitoAcreditacion(p).classes"
                    :title="getHitoAcreditacion(p).tooltip"
                  >
                    {{ getHitoAcreditacion(p).label }}
                  </span>
                </td>
                <!-- 5. Salida Patio -->
                <td class="py-2.5 px-3 text-center whitespace-nowrap">
                  <span 
                    class="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded"
                    :class="getHitoSalidaPatio(p).classes"
                    :title="getHitoSalidaPatio(p).tooltip"
                  >
                    {{ getHitoSalidaPatio(p).label }}
                  </span>
                </td>
                <!-- 6. Report PWA -->
                <td class="py-2.5 px-3 text-center whitespace-nowrap">
                  <span 
                    class="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded"
                    :class="getHitoReport(p).classes"
                    :title="getHitoReport(p).tooltip"
                  >
                    {{ getHitoReport(p).label }}
                  </span>
                </td>
                <!-- 7. Facturación -->
                <td class="py-2.5 px-3 text-center whitespace-nowrap">
                  <span 
                    class="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded"
                    :class="getHitoFacturacion(p).classes"
                  >
                    {{ getHitoFacturacion(p).label }}
                  </span>
                </td>
                <!-- Acción -->
                <td class="py-2.5 px-3 text-right whitespace-nowrap">
                  <button 
                    @click="abrirProyecto(p.id_proyecto, getSubTabSugeridaPMO(p))"
                    class="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded border border-blue-500/30 text-[10px] font-bold transition-all flex items-center gap-1 ml-auto"
                  >
                    <span>Auditar OT</span>
                    <span>➔</span>
                  </button>
                </td>
              </tr>
              <tr v-if="proyectosFiltradosPMO.length === 0">
                <td colspan="10" class="text-center py-12 text-slate-500 italic">
                  No se encontraron proyectos activos que coincidan con el filtro.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Vista 3: Perspectiva Temporal de Flota (Gantt Operacional & Productividad) -->
    <div v-else-if="activeView === 'gantt'" class="space-y-4">
      <!-- Controles del Gantt -->
      <div class="bg-[#0f1629] border border-white/5 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold text-slate-400">Ventana Temporal:</span>
          <div class="flex items-center bg-[#070b14] p-0.5 rounded-lg border border-white/10">
            <button 
              v-for="dias in [7, 15, 30]" 
              :key="dias"
              @click="rangoDiasGantt = dias" 
              class="px-2.5 py-1 rounded text-xs font-bold transition-all"
              :class="rangoDiasGantt === dias ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'"
            >
              {{ dias }} Días
            </button>
          </div>
          <!-- Leyenda compacta -->
          <div class="hidden lg:flex items-center gap-3 ml-4 text-[10px] text-slate-400">
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded bg-blue-600"></span> OT Asignada</span>
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded bg-emerald-600"></span> En Faena / Ruta</span>
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded bg-amber-600"></span> Mantención</span>
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded bg-yellow-500"></span> Inspección</span>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <!-- Filtro Categoría -->
          <select 
            v-model="filtroCategoriaGantt" 
            class="bg-[#070b14] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="TODOS">Todas las Categorías</option>
            <option value="GRUA">Grúas Telescópicas</option>
            <option value="CAMION_PLUMA">Camiones Pluma</option>
            <option value="TRANSPORTE">Camas Bajas / Fletes</option>
            <option value="ESCOLTA">Escoltas y Apoyo</option>
          </select>
          <!-- Buscador -->
          <input 
            v-model="busquedaGantt" 
            type="text" 
            placeholder="Buscar patente o modelo..." 
            class="bg-[#070b14] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 w-56 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      <!-- Tabla Gantt -->
      <div class="bg-[#0f1629] border border-white/5 rounded-xl overflow-hidden shadow-xl">
        <div class="overflow-x-auto max-h-[calc(100vh-270px)]">
          <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-[#070b14] text-slate-400 text-[10px] tracking-wider uppercase font-bold border-b border-white/10 sticky top-0 z-20 select-none">
              <tr>
                <th class="py-2.5 px-3 w-56 sticky left-0 bg-[#070b14] z-30 border-r border-white/10">Equipo / Flota</th>
                <th class="py-2.5 px-2 w-28 text-center sticky left-56 bg-[#070b14] z-30 border-r border-white/10">Productividad</th>
                <!-- Días del Cronograma -->
                <th 
                  v-for="dia in diasGantt" 
                  :key="dia.fechaStr" 
                  class="py-2 px-1 text-center font-mono border-r border-white/5 min-w-[54px]"
                  :class="dia.esHoy ? 'bg-blue-900/30 text-blue-400 font-black' : (dia.esFDS ? 'bg-white/[0.02] text-slate-600' : '')"
                >
                  <div class="text-[9px]">{{ dia.diaSemana }}</div>
                  <div class="text-[11px]">{{ dia.diaNumero }}</div>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5 text-slate-300">
              <tr v-for="eq in flotaFiltradaGantt" :key="eq.id_equipo" class="hover:bg-white/5 transition-colors">
                <!-- Equipo Info (Sticky Left) -->
                <td class="py-2 px-3 sticky left-0 bg-[#0f1629] z-10 border-r border-white/10">
                  <div class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full" :class="eq.estado === 'MANTENCION' ? 'bg-amber-500' : 'bg-emerald-500'"></span>
                    <span class="font-mono font-bold text-white text-xs">{{ eq.patente || 'S/P' }}</span>
                  </div>
                  <div class="text-[10px] text-slate-400 truncate max-w-[200px]">{{ eq.nombre_equipo || eq.modelo }}</div>
                  <div class="text-[9px] text-slate-500">{{ eq.nombre_categoria || 'Maquinaria' }}</div>
                </td>
                <!-- Columna Productividad (% OEE) -->
                <td class="py-2 px-2 text-center sticky left-56 bg-[#0f1629] z-10 border-r border-white/10">
                  <div class="text-[11px] font-black font-mono" :class="getProductividadColor(eq.productividadPct)">
                    {{ eq.productividadPct }}%
                  </div>
                  <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                    <div 
                      class="h-full rounded-full transition-all"
                      :class="getProductividadBarClass(eq.productividadPct)"
                      :style="{ width: `${eq.productividadPct}%` }"
                    ></div>
                  </div>
                </td>
                <!-- Celdas de Días -->
                <td 
                  v-for="dia in diasGantt" 
                  :key="dia.fechaStr" 
                  class="p-0.5 text-center border-r border-white/5 relative"
                  :class="dia.esHoy ? 'bg-blue-950/20' : (dia.esFDS ? 'bg-white/[0.01]' : '')"
                >
                  <div 
                    v-if="getEventoEquipoEnDia(eq, dia.fechaStr)"
                    @click="onClicEventoGantt(getEventoEquipoEnDia(eq, dia.fechaStr))"
                    class="h-9 w-full rounded flex flex-col items-center justify-center text-[9px] font-bold p-0.5 cursor-pointer hover:scale-105 transition-transform"
                    :class="getEventoEquipoEnDia(eq, dia.fechaStr).classes"
                    :title="getEventoEquipoEnDia(eq, dia.fechaStr).tooltip"
                  >
                    <span class="truncate max-w-[48px]">{{ getEventoEquipoEnDia(eq, dia.fechaStr).label }}</span>
                    <span v-if="getEventoEquipoEnDia(eq, dia.fechaStr).esColision" class="text-[8px] animate-pulse">⚠️ Colisión</span>
                  </div>
                </td>
              </tr>
              <tr v-if="flotaFiltradaGantt.length === 0">
                <td :colspan="diasGantt.length + 2" class="text-center py-12 text-slate-500 italic">
                  No se encontraron equipos para el filtro seleccionado.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Botón flotante Biblioteca de Cotizaciones No Ganadas -->
    <div class="fixed bottom-6 right-6 z-40">
      <button 
        @click="abrirBiblioteca" 
        class="flex items-center justify-center w-14 h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-2xl hover:scale-105 transition-all focus:outline-none group relative"
        title="Biblioteca de Cotizaciones No Ganadas"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"></path>
        </svg>
        <span v-if="noAsignadas.length > 0" class="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-slate-950">
          {{ noAsignadas.length }}
        </span>
      </button>
    </div>

    <!-- Modal Biblioteca de Cotizaciones No Ganadas -->
    <div v-if="mostrarModalBiblioteca" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div class="bg-slate-950 border border-white/10 rounded-2xl w-[80vw] max-w-4xl h-[70vh] flex flex-col p-6 shadow-2xl overflow-hidden relative text-left">
        <div class="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
          <div>
            <h3 class="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
              <svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"></path>
              </svg>
              <span>Biblioteca de Cotizaciones No Ganadas</span>
            </h3>
            <p class="text-xs text-slate-400 mt-1">Historial de requerimientos que no fueron concretados.</p>
          </div>
          <button @click="cerrarBiblioteca" class="text-slate-400 hover:text-white transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto min-h-0">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-white/10 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th class="py-3 px-4">Fecha</th>
                <th class="py-3 px-4">Código</th>
                <th class="py-3 px-4">Cliente</th>
                <th class="py-3 px-4">Oportunidad</th>
                <th class="py-3 px-4">Motivo</th>
                <th class="py-3 px-4">Observaciones</th>
              </tr>
            </thead>
            <tbody class="text-slate-300 text-xs">
              <tr 
                v-for="p in noAsignadas" 
                :key="p.id_proyecto" 
                @click="seleccionarNoAsignada(p.id_proyecto)"
                class="hover:bg-white/5 cursor-pointer border-b border-white/5 transition-colors"
              >
                <td class="py-3 px-4 whitespace-nowrap">{{ formatFecha(p.fecha_creacion || p.fecha_plan_ini) }}</td>
                <td class="py-3 px-4 font-mono font-bold text-blue-400">{{ p.codi_proyecto || '—' }}</td>
                <td class="py-3 px-4 font-bold text-white">{{ p.nombre_cliente || '—' }}</td>
                <td class="py-3 px-4">{{ p.nombre_proyecto }}</td>
                <td class="py-3 px-4">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                    {{ p.json_field?.crm_v1?.razon_no_asignada || 'No especificado' }}
                  </span>
                </td>
                <td class="py-3 px-4 truncate max-w-[200px]" :title="p.json_field?.crm_v1?.observacion_no_asignada">
                  {{ p.json_field?.crm_v1?.observacion_no_asignada || '—' }}
                </td>
              </tr>
              <tr v-if="noAsignadas.length === 0">
                <td colspan="6" class="text-center py-10 text-slate-500 italic">
                  No hay cotizaciones no ganadas registradas.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Gestor de Oportunidades -->
    <div v-if="mostrarModalCotizacion" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div class="bg-slate-950 border border-white/10 rounded-2xl w-[96vw] max-w-none h-[96vh] flex flex-col p-6 shadow-2xl overflow-hidden relative">
        <button @click="onModalClose" class="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        <div class="flex-1 overflow-y-auto">
          <GestorOportunidades 
            :proyecto-id="proyectoSeleccionadoId"
            :initial-sub-tab="proyectoSubTabInicial"
            @close="onModalClose" 
            @creada="onCotizacionCreada" 
          />
        </div>
      </div>
    </div>
    <!-- Componente Modal Drawer de Acreditaciones -->
    <AcreditacionDrawer 
      :is-open="drawerAcreditacionAbierto"
      :acreditacion-id="acreditacionIdSeleccionada"
      @close="drawerAcreditacionAbierto = false"
      @updated="cargarProyectos"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import GestorOportunidades from './CRM/GestorOportunidades.vue'
import AcreditacionDrawer from '../components/acreditacion/AcreditacionDrawer.vue'
import apiAxios from '../services/api'
import { navStore } from '../stores/navStore'

const router = useRouter()

// Vista activa tri-modal
const activeView = ref('kanban') // 'kanban' | 'pmo' | 'gantt'
const busquedaKanban = ref('')
const mapaUsuarios = ref(new Map())

const mostrarModalCotizacion = ref(false)
const proyectoSeleccionadoId  = ref(null)
const proyectoSubTabInicial    = ref(null)

const acreditacionesList = ref([])
const acreditacionIdSeleccionada = ref(null)
const drawerAcreditacionAbierto = ref(false)

const abrirAcreditacionDrawer = (id_acreditacion) => {
  acreditacionIdSeleccionada.value = id_acreditacion
  drawerAcreditacionAbierto.value = true
}

watch(() => navStore.activeEmpresa, () => {
  cargarProyectos()
})

const mostrarModalBiblioteca = ref(false)
const hoveredProyectoId = ref(null)
const noAsignadas = ref([])

// Todos los proyectos para PMO y Gantt
const todosLosProyectos = ref([])
const flotaEquiposMaster = ref([])

// Proyectos agrupados por estado
const preventa       = ref([])
const verificacion   = ref([])
const asignados      = ref([])
const desplazamiento = ref([])
const maniobra       = ref([])
const completados    = ref([])

const cargarProyectos = async () => {
  try {
    const { data } = await apiAxios.get('/proyectos')
    const proyectos = data.proyectos || []
    todosLosProyectos.value = proyectos

    // Columna 1: Requerimiento Registrado / Preventa Comercial
    preventa.value       = proyectos.filter(p => [1, 2].includes(Number(p.id_proyecto_estado)))
    
    // Columna 2: En Verificación Operaciones (Validación Diff)
    verificacion.value   = proyectos.filter(p => Number(p.id_proyecto_estado) === 3)

    // Columna 3: En Asignación Recursos OT (Flota y Tripulación)
    asignados.value      = proyectos.filter(p => Number(p.id_proyecto_estado) === 4)

    // Helper para determinar si un proyecto en estado 5 ya tiene equipos autorizados o en faena
    const estaEnFaena = (p) => {
      const ej = p.json_field?.ejecucion_v1 || {}
      if (ej.preparacion_salida?.preparacion_finalizada || ej.viaje_iniciado || ej.subtab_activa === 'reports' || ej.subtab_activa === 'despacho' || ej.subtab_actual_view === 'reports') {
        return true
      }
      const insPatio = ej.preparacion_salida?.inspecciones_patio || {}
      const algunAutorizado = Object.values(insPatio).some(i => i && (i.salida_autorizada || i.patio_checklist_completado))
      return algunAutorizado
    }

    // Columna 4: En Preparación Operaciones (Patio, Checklists y Acreditaciones)
    desplazamiento.value = proyectos.filter(p => {
      const st = Number(p.id_proyecto_estado)
      if (st !== 5) return false
      return !estaEnFaena(p)
    })

    // Columna 5: En Ejecución / Faena (Ruta, Izaje y Reports)
    maniobra.value = proyectos.filter(p => {
      const st = Number(p.id_proyecto_estado)
      if (st === 5) {
        return estaEnFaena(p)
      }
      return [6, 7].includes(st)
    })

    // Columna 6: Completados / Cerrados
    completados.value    = proyectos.filter(p => Number(p.id_proyecto_estado) === 8)

    // No Asignadas / Desestimadas
    noAsignadas.value    = proyectos.filter(p => Number(p.id_proyecto_estado) === 99 || (Number(p.id_proyecto_estado) === 6 && p.motivo_desestimacion))

    try {
      const resAcr = await apiAxios.get('/acreditaciones')
      acreditacionesList.value = resAcr.data || []
    } catch(errAcr) {
      console.warn("No se cargaron acreditaciones:", errAcr.message)
    }

    try {
      const { data: resUsers } = await apiAxios.get('/usuarios')
      const uList = resUsers?.data || resUsers || []
      if (Array.isArray(uList)) {
        const m = new Map()
        uList.forEach(u => {
          if (u.id_user) {
            const nombre = [u.name_frst, u.apellido_pat].filter(Boolean).join(' ').trim() || u.nombre || u.email || `Usuario ${u.id_user}`
            m.set(Number(u.id_user), nombre)
          }
        })
        mapaUsuarios.value = m
      }
    } catch (errU) {
      console.warn("No se cargó catálogo de usuarios:", errU.message)
    }

    await cargarFlotaMaster()
  } catch (e) {
    console.error('Error cargando proyectos:', e)
  }
}

const cargarFlotaMaster = async () => {
  try {
    const { data: res } = await apiAxios.get('/tequ-equipos')
    const raw = res?.data || res || []
    if (Array.isArray(raw) && raw.length > 0) {
      flotaEquiposMaster.value = raw.map(e => ({
        ...e,
        id_equipo: e.id_equipo || e.id,
        patente: e.patente || e.ppu || 'S/P',
        nombre_equipo: e.nombre_equipo || `${e.marca || ''} ${e.modelo || ''}`.trim() || e.tipo_equipo || 'Equipo',
        modelo: e.modelo || '',
        nombre_categoria: e.nombre_categoria || e.tipo_equipo || e.tipo || 'Maquinaria',
        estado: e.estado || 'DISPONIBLE'
      }))
    }
  } catch (err) {
    console.warn('Error cargando flota de equipos:', err)
  }
}

// -------------------------------------------------------------
// LÓGICA DE FILTRADO REACTIVO OMNIBOX KANBAN (SPEC 16 - SEC 11)
// -------------------------------------------------------------
const getNombreVendedor = (p) => {
  if (!p) return null
  const idUser = Number(p.id_usuario_creacion || p.id_user_creacion)
  if (idUser && mapaUsuarios.value.has(idUser)) {
    return mapaUsuarios.value.get(idUser)
  }
  const crm = p.json_field?.crm_v1 || {}
  if (crm.vendedor_nombre) return crm.vendedor_nombre
  if (crm.vendedor) return crm.vendedor
  if (crm.usuario_creacion) return crm.usuario_creacion
  if (p.creador_nombre) return p.creador_nombre
  return null
}

const coincideBusqueda = (p, query) => {
  if (!query) return true
  const q = query.trim().toLowerCase()
  
  const cod = (p.codi_proyecto || '').toLowerCase()
  const idPry = String(p.id_proyecto || '')
  const codMaestro = (p.codigo_maestro || '').toLowerCase()
  const nLic = (p.json_field?.crm_v1?.n_licitacion || '').toLowerCase()
  
  const clt = (p.nombre_cliente || '').toLowerCase()
  const contacto = (p.json_field?.crm_v1?.contacto_nombre || '').toLowerCase()
  
  const vendedor = (getNombreVendedor(p) || '').toLowerCase()
  
  const proy = (p.nombre_proyecto || '').toLowerCase()
  const obra = (p.json_field?.crm_v1?.obra_nombre || '').toLowerCase()
  const ciudad = (p.json_field?.crm_v1?.obra_ciudad || '').toLowerCase()
  
  const grua = (p.json_field?.ejecucion_v1?.patente_grua || '').toLowerCase()
  const operador = (p.json_field?.ejecucion_v1?.operador_nombre || '').toLowerCase()

  return cod.includes(q) || idPry.includes(q) || codMaestro.includes(q) || nLic.includes(q) ||
         clt.includes(q) || contacto.includes(q) ||
         vendedor.includes(q) ||
         proy.includes(q) || obra.includes(q) || ciudad.includes(q) ||
         grua.includes(q) || operador.includes(q)
}

const preventaFiltrados       = computed(() => preventa.value.filter(p => coincideBusqueda(p, busquedaKanban.value)))
const verificacionFiltrados   = computed(() => verificacion.value.filter(p => coincideBusqueda(p, busquedaKanban.value)))
const asignadosFiltrados      = computed(() => asignados.value.filter(p => coincideBusqueda(p, busquedaKanban.value)))
const desplazamientoFiltrados = computed(() => desplazamiento.value.filter(p => coincideBusqueda(p, busquedaKanban.value)))
const maniobraFiltrados       = computed(() => maniobra.value.filter(p => coincideBusqueda(p, busquedaKanban.value)))
const completadosFiltrados    = computed(() => completados.value.filter(p => coincideBusqueda(p, busquedaKanban.value)))

const totalCoincidenciasKanban = computed(() => {
  return preventaFiltrados.value.length +
         verificacionFiltrados.value.length +
         asignadosFiltrados.value.length +
         desplazamientoFiltrados.value.length +
         maniobraFiltrados.value.length +
         completadosFiltrados.value.length
})

// -------------------------------------------------------------
// LÓGICA DE LA MATRIZ PMO DE CONTROL DE GESTIÓN & EXCEPCIONES
// -------------------------------------------------------------
const filtroPMO = ref('')

const proyectosActivosPMO = computed(() => {
  return todosLosProyectos.value.filter(p => {
    const st = Number(p.id_proyecto_estado)
    return st < 99 && st !== 6 && st > 0
  })
})

const proyectosFiltradosPMO = computed(() => {
  const query = (filtroPMO.value || '').trim().toLowerCase()
  if (!query) return proyectosActivosPMO.value

  return proyectosActivosPMO.value.filter(p => {
    const cod = (p.codi_proyecto || '').toLowerCase()
    const clt = (p.nombre_cliente || '').toLowerCase()
    const proy = (p.nombre_proyecto || '').toLowerCase()
    const eq = (p.json_field?.ejecucion_v1?.patente_grua || '').toLowerCase()
    return cod.includes(query) || clt.includes(query) || proy.includes(query) || eq.includes(query)
  })
})

const getHitoOC = (p) => {
  const crm = p.json_field?.crm_v1 || {}
  const reqOC = crm.requiere_oc_hes === true || crm.requiere_oc === true
  const nroOC = crm.orden_compra || crm.nro_oc || crm.ordenes_compra?.[0]?.nro_oc || crm.ordenes_compra?.[0]?.numero_oc
  
  if (nroOC) {
    return { status: 'OK', label: `OC ${nroOC}`, tooltip: `OC Mandante Registrada: ${nroOC}` }
  }
  if (!reqOC) {
    return { status: 'NONE', label: 'No Requerida', tooltip: 'El mandante no exige OC/HES previa' }
  }

  const fechaIni = p.fecha_plan_ini ? new Date(p.fecha_plan_ini) : null
  const ahora = new Date()
  const st = Number(p.id_proyecto_estado)
  const horasFaltantes = fechaIni ? (fechaIni - ahora) / (1000 * 60 * 60) : 999

  if (st >= 5 || horasFaltantes <= 48) {
    return { 
      status: 'CRITICAL', 
      label: 'Falta OC', 
      tooltip: '¡Alerta! Servicio a menos de 48h (o en curso) sin OC Mandante cargada.' 
    }
  }
  return { status: 'PENDING', label: 'Pendiente', tooltip: 'Esperando OC de mandante' }
}

const getHitoValidacion = (p) => {
  const st = Number(p.id_proyecto_estado)
  const ej = p.json_field?.ejecucion_v1 || {}
  if (st >= 4 || ej.validacion_completada) {
    return { status: 'OK' }
  }
  if (st === 3) {
    return { status: 'PENDING' }
  }
  return { status: 'PREVENTA' }
}

const getHitoAsignacion = (p) => {
  const st = Number(p.id_proyecto_estado)
  const ej = p.json_field?.ejecucion_v1 || {}
  const crm = p.json_field?.crm_v1 || {}
  const primeraLinea = crm.lineas_servicio?.find(l => l.patente || l.id_equipo)
  const grua = ej.patente_grua || primeraLinea?.patente || ej.recursos_asignados?.equipos?.[0]?.patente || null
  const operador = ej.operador_nombre || ej.recursos_asignados?.personas?.[0]?.nombre_persona || null

  if (st >= 4 && (grua || operador)) {
    return { status: 'OK', equipo: grua || 'Asignado', operador: operador || 'Operador Asignado' }
  }
  return { status: 'PENDING', equipo: 'S/P', operador: 'Sin Asignar' }
}

const getHitoAcreditacion = (p) => {
  const pct = calcularPorcentajeAcreditacion(p)
  const st = Number(p.id_proyecto_estado)
  if (pct === 100) {
    return { label: '100% OK', classes: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', tooltip: 'Dossier Acreditado 100%' }
  }
  if (st >= 5) {
    return { 
      label: `${pct}% Crítico`, 
      classes: 'bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse', 
      tooltip: `Acreditación incompleta (${pct}%) para equipo en patio/faena` 
    }
  }
  if (st >= 3) {
    return { label: `${pct}% En Proceso`, classes: 'bg-amber-500/10 text-amber-400 border border-amber-500/20', tooltip: 'Acreditación en curso' }
  }
  return { label: 'Preventa', classes: 'bg-white/5 text-slate-500 border border-white/5', tooltip: 'No iniciada aún' }
}

const getHitoSalidaPatio = (p) => {
  const st = Number(p.id_proyecto_estado)
  const ej = p.json_field?.ejecucion_v1 || {}
  const viajeIniciado = ej.viaje_iniciado || ej.subtab_activa === 'reports' || ej.subtab_activa === 'despacho'
  if (st >= 6 || viajeIniciado) {
    return { label: 'En Ruta / Obra', classes: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', tooltip: 'Convoy en trayecto o faena activa' }
  }
  if (st === 5) {
    const ahora = new Date()
    const iniPlan = p.fecha_plan_ini ? new Date(p.fecha_plan_ini) : null
    if (iniPlan && ahora > iniPlan) {
      const desfaseHoras = Math.round((ahora - iniPlan) / (1000 * 60 * 60))
      return { 
        label: `Retraso (+${desfaseHoras}h)`, 
        classes: 'bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse', 
        tooltip: `Hora programada superada hace ${desfaseHoras} horas sin salida registrada` 
      }
    }
    return { label: 'En Preparación', classes: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20', tooltip: 'Preparación de patio y checklist' }
  }
  return { label: 'Programado', classes: 'bg-white/5 text-slate-500 border border-white/5', tooltip: 'Esperando fecha de inicio' }
}

const getHitoReport = (p) => {
  const st = Number(p.id_proyecto_estado)
  const ej = p.json_field?.ejecucion_v1 || {}
  const reportsCount = ej.reports?.length || 0
  if (st === 8) {
    return { label: `Concluido (${reportsCount})`, classes: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', tooltip: 'Reports validados y servicio cerrado' }
  }
  if (st >= 6 || st === 5) {
    const horaActual = new Date().getHours()
    if (horaActual >= 19 && reportsCount === 0) {
      return { 
        label: 'Hoy Pendiente', 
        classes: 'bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse', 
        tooltip: 'Son más de las 19:00 hrs y no se ha transmitido el Report Diario de hoy' 
      }
    }
    if (reportsCount > 0) {
      return { label: `Al Día (${reportsCount})`, classes: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', tooltip: `${reportsCount} reports transmitidos` }
    }
    return { label: 'En Faena', classes: 'bg-purple-500/10 text-purple-400 border border-purple-500/20', tooltip: 'Faena activa' }
  }
  return { label: '—', classes: 'text-slate-600', tooltip: 'No aplica aún' }
}

const getHitoFacturacion = (p) => {
  const st = Number(p.id_proyecto_estado)
  const crm = p.json_field?.crm_v1 || {}
  const fact = p.json_field?.facturacion_v1 || {}
  const dte = fact.nro_dte || crm.dte || fact.folio_factura
  if (st === 8) {
    if (dte) {
      return { label: `DTE #${dte}`, classes: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' }
    }
    return { label: 'Pend. Facturar', classes: 'bg-purple-500/15 text-purple-400 border border-purple-500/30 animate-pulse' }
  }
  return { label: 'En Curso', classes: 'text-slate-600' }
}

const getSubTabSugeridaPMO = (p) => {
  const st = Number(p.id_proyecto_estado)
  if (st <= 2) return 'comercial'
  if (st === 3) return 'validacion'
  if (st === 4) return 'asignacion'
  if (st === 5) return 'preparacion_salida'
  if (st >= 6) return 'reports'
  return 'comercial'
}

// Métricas de KPIs PMO
const alertasCriticasTotales = computed(() => {
  return proyectosActivosPMO.value.filter(p => {
    const oc = getHitoOC(p).status === 'CRITICAL'
    const salida = getHitoSalidaPatio(p).label.includes('Retraso')
    const acr = getHitoAcreditacion(p).label.includes('Crítico')
    return oc || salida || acr
  }).length
})

const otsSinOC = computed(() => {
  return proyectosActivosPMO.value.filter(p => {
    const oc = getHitoOC(p)
    return oc.status === 'CRITICAL' || oc.status === 'PENDING'
  }).length
})

const salidasRetrasadas = computed(() => {
  return proyectosActivosPMO.value.filter(p => {
    return getHitoSalidaPatio(p).label.includes('Retraso')
  }).length
})

const pendientesFacturacion = computed(() => {
  return todosLosProyectos.value.filter(p => {
    return Number(p.id_proyecto_estado) === 8 && !p.json_field?.facturacion_v1?.nro_dte && !p.json_field?.crm_v1?.dte
  }).length
})

// -------------------------------------------------------------
// LÓGICA DE LA PERSPECTIVA TEMPORAL DE FLOTA (GANTT & PRODUCTIVIDAD)
// -------------------------------------------------------------
const rangoDiasGantt = ref(15)
const filtroCategoriaGantt = ref('TODOS')
const busquedaGantt = ref('')

const diasGantt = computed(() => {
  const total = rangoDiasGantt.value
  const dias = []
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  
  const inicio = new Date(hoy)
  inicio.setDate(hoy.getDate() - 2)

  const diasSemanaNombres = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB']

  for (let i = 0; i < total; i++) {
    const d = new Date(inicio)
    d.setDate(inicio.getDate() + i)
    
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const fechaStr = `${yyyy}-${mm}-${dd}`

    const esHoy = d.getTime() === hoy.getTime()
    const diaNumSemana = d.getDay()
    const esFDS = diaNumSemana === 0 || diaNumSemana === 6

    dias.push({
      fechaStr,
      diaNumero: d.getDate(),
      diaSemana: diasSemanaNombres[diaNumSemana],
      esHoy,
      esFDS
    })
  }
  return dias
})

const calcularProductividadEquipo = (eq, diasVentana) => {
  if (!diasVentana || diasVentana.length === 0) return 0
  let diasOcupados = 0
  for (const d of diasVentana) {
    const ev = getEventoEquipoEnDia(eq, d.fechaStr)
    if (ev) diasOcupados++
  }
  return Math.min(100, Math.round((diasOcupados / diasVentana.length) * 100))
}

const flotaFiltradaGantt = computed(() => {
  let list = [...flotaEquiposMaster.value]
  const cat = filtroCategoriaGantt.value
  const q = (busquedaGantt.value || '').trim().toLowerCase()

  if (cat !== 'TODOS') {
    list = list.filter(e => {
      const c = (e.nombre_categoria || '').toUpperCase()
      if (cat === 'GRUA') return c.includes('GRÚA') || c.includes('GRUA') || c.includes('TELESCOPICA')
      if (cat === 'CAMION_PLUMA') return c.includes('PLUMA') || c.includes('CAMIÓN') || c.includes('CAMION')
      if (cat === 'TRANSPORTE') return c.includes('CAMA') || c.includes('BAJA') || c.includes('FLETE') || c.includes('TRASLADO')
      if (cat === 'ESCOLTA') return c.includes('ESCOLTA') || c.includes('VEHÍCULO') || c.includes('VEHICULO') || c.includes('APOYO')
      return true
    })
  }

  if (q) {
    list = list.filter(e => {
      const pat = (e.patente || '').toLowerCase()
      const nom = (e.nombre_equipo || '').toLowerCase()
      const mod = (e.modelo || '').toLowerCase()
      return pat.includes(q) || nom.includes(q) || mod.includes(q)
    })
  }

  const dias = diasGantt.value
  return list.map(e => ({
    ...e,
    productividadPct: calcularProductividadEquipo(e, dias)
  }))
})

const getEventoEquipoEnDia = (eq, fechaStr) => {
  const targetDate = new Date(fechaStr + 'T00:00:00')
  const patEq = (eq.patente || '').toUpperCase().trim()
  const idEq = Number(eq.id_equipo)

  const proyectosCoincidentes = []

  for (const p of todosLosProyectos.value) {
    if (Number(p.id_proyecto_estado) >= 99 || Number(p.id_proyecto_estado) === 6) continue

    const ini = p.fecha_plan_ini ? new Date(p.fecha_plan_ini.split('T')[0] + 'T00:00:00') : null
    const fin = p.fecha_plan_fin ? new Date(p.fecha_plan_fin.split('T')[0] + 'T23:59:59') : ini

    if (!ini) continue
    if (targetDate >= ini && targetDate <= (fin || ini)) {
      const ej = p.json_field?.ejecucion_v1 || {}
      const crm = p.json_field?.crm_v1 || {}
      
      const esGrua = (ej.patente_grua || '').toUpperCase().trim() === patEq
      const enLineas = crm.lineas_servicio?.some(l => {
        const lp = (l.patente || '').toUpperCase().trim()
        const lid = Number(l.id_equipo || l.equipo_asignado_id)
        return (lp && lp === patEq) || (lid && lid === idEq)
      })
      const enRecursos = ej.recursos_asignados?.equipos?.some(re => {
        const rp = (re.patente || '').toUpperCase().trim()
        const rid = Number(re.id_equipo)
        return (rp && rp === patEq) || (rid && rid === idEq)
      })

      if (esGrua || enLineas || enRecursos) {
        proyectosCoincidentes.push(p)
      }
    }
  }

  if (proyectosCoincidentes.length > 1) {
    const otsConfig = proyectosCoincidentes.map(p => p.codi_proyecto).join(' y ')
    return {
      esColision: true,
      classes: 'bg-red-600/90 text-white border border-red-400 shadow-md ring-2 ring-red-400',
      label: 'Colisión',
      tooltip: `⚠️ COLISIÓN HORARIA: Equipo asignado simultáneamente a ${otsConfig}`,
      proyectoId: proyectosCoincidentes[0].id_proyecto
    }
  }

  if (proyectosCoincidentes.length === 1) {
    const p = proyectosCoincidentes[0]
    const st = Number(p.id_proyecto_estado)
    let colorClasses = 'bg-blue-600/90 text-white border border-blue-400/60 shadow-sm'
    
    if (st >= 6) {
      colorClasses = 'bg-emerald-600/90 text-white border border-emerald-400/60 shadow-sm'
    } else if (st === 3) {
      colorClasses = 'bg-amber-600/90 text-white border border-amber-400/60 shadow-sm'
    }

    return {
      esColision: false,
      classes: colorClasses,
      label: p.codi_proyecto || 'OT',
      tooltip: `${p.codi_proyecto} - ${p.nombre_cliente} (${p.nombre_proyecto})`,
      proyectoId: p.id_proyecto
    }
  }

  if (eq.estado === 'MANTENCION') {
    return {
      esColision: false,
      classes: 'bg-amber-600/90 text-white border border-amber-400 shadow-sm',
      label: 'Taller',
      tooltip: 'Equipo en mantención de taller programada',
      proyectoId: null
    }
  }

  return null
}

const onClicEventoGantt = (evento) => {
  if (evento?.proyectoId) {
    abrirProyecto(evento.proyectoId)
  }
}

const getProductividadColor = (pct) => {
  if (pct >= 70) return 'text-emerald-400'
  if (pct >= 30) return 'text-blue-400'
  return 'text-slate-400'
}

const getProductividadBarClass = (pct) => {
  if (pct >= 70) return 'bg-emerald-500'
  if (pct >= 30) return 'bg-blue-500'
  return 'bg-slate-500'
}

const abrirCotizacion = () => {
  router.push({ name: 'crm' })
}

const abrirProyecto = (id, subtab = null) => {
  if (id) {
    router.push({ name: 'crm', query: { id_proyecto: id, subtab: subtab || 'comercial' } })
  } else {
    router.push({ name: 'crm' })
  }
}

const calcularPorcentajeAcreditacion = (p) => {
  const estadoId = Number(p.id_proyecto_estado || 1)
  // Invariante de negocio: La acreditación sólo se activa cuando los recursos están asignados (Preparación de Salida / Estado 5 o superior).
  if (estadoId < 5) {
    return 0
  }

  if (p.json_field?.ejecucion_v1?.porcentaje_acreditacion !== undefined) {
    return Number(p.json_field.ejecucion_v1.porcentaje_acreditacion)
  }
  const reqDocs = p.json_field?.crm_v1?.acreditacion_docs || p.acreditacion_docs || { 
    empresa: ['Inicio de actividades', 'Carpeta tributaria', 'Certificado cotizaciones', 'Constitución de empresa', 'RIOHS'], 
    equipos: ['SOAP', 'Revisión Técnica', 'Certificación Anual Izaje'], 
    personas: ['Contrato de trabajo', 'Cédula identidad', 'Licencia conducir'] 
  }
  const total = (reqDocs.empresa?.length || 0) + (reqDocs.equipos?.length || 0) + (reqDocs.personas?.length || 0)
  if (total === 0) return 0
  
  const cumpsObj = p.json_field?.ejecucion_v1?.cumplimiento_acreditaciones || {}
  const cumps = Object.keys(cumpsObj).filter(k => cumpsObj[k] === 'OK').length
  const docsHomologados = Object.keys(p.json_field?.ejecucion_v1?.docs_homologados || p.json_field?.crm_v1?.docs_homologados || {}).length
  const totalValidos = Math.max(cumps, docsHomologados)
  
  const pct = Math.round((totalValidos / total) * 100)
  return Math.min(100, Math.max(0, pct))
}

const onModalClose = () => {
  mostrarModalCotizacion.value = false
  proyectoSeleccionadoId.value = null
  proyectoSubTabInicial.value = null
  cargarProyectos() // recargar al cerrar por si se cambio a No Asignada
}

const onCotizacionCreada = (nueva) => {
  cargarProyectos()
}

const abrirBiblioteca = () => {
  mostrarModalBiblioteca.value = true
}

const cerrarBiblioteca = () => {
  mostrarModalBiblioteca.value = false
}

const seleccionarNoAsignada = (id) => {
  mostrarModalBiblioteca.value = false
  abrirProyecto(id)
}

const formatFecha = (fStr) => {
  if (!fStr) return '—'
  return new Date(fStr).toLocaleDateString()
}

const calcularSubtotalLinea = (l) => {
  if (!l) return 0
  if (l.subtotal !== undefined && l.subtotal !== null && Number(l.subtotal) > 0) {
    return Number(l.subtotal)
  }
  const vu = Number(l.valor_unitario !== undefined ? l.valor_unitario : (l.valorUnitario || 0))
  if (l.unidad === 'Horas Diarias Minimas' || l.unidad === 'Horas Diarias' || l.unidad === 'Diario' || l.unidad === 'Jornada') {
    const dias = Number(l.cantidad_dias !== undefined ? l.cantidad_dias : l.cantidad) || 1
    const horas = Number(l.cantidad_horas !== undefined ? l.cantidad_horas : (l.pisoMinimo || 8))
    return dias * horas * vu
  }
  if (l.unidad === 'Horas Mes Minimas' || l.unidad === 'Horas Mensuales Minimas' || l.unidad === 'Mensual') {
    const meses = Number(l.cantidad_meses !== undefined ? l.cantidad_meses : l.cantidad) || 1
    const horas = Number(l.cantidad_horas !== undefined ? l.cantidad_horas : (l.pisoMinimo || 180))
    return meses * horas * vu
  }
  const cant = Number(l.cantidad) || 1
  return cant * vu
}

const formatMonto = (p) => {
  const lineas = p.json_field?.crm_v1?.lineas_servicio || p.json_field?.ejecucion_v1?.snapshot_comercial?.lines
  if (lineas && lineas.length > 0) {
    const total = lineas.reduce((s, l) => s + calcularSubtotalLinea(l), 0)
    if (total > 0) return '$' + total.toLocaleString('es-CL')
  }
  const mDirecto = Number(p.monto_neto || p.monto || 0)
  return mDirecto > 0 ? '$' + mDirecto.toLocaleString('es-CL') : null
}

onMounted(cargarProyectos)
</script>
