<template>
  <div class="space-y-6 text-left">
    <!-- Header -->
    <div class="bg-[#0a0f1e]/40 p-4 border border-white/5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2.5 flex-wrap">
          <h2 class="text-lg font-black text-white uppercase tracking-wider font-display">Torre de Control Operativa</h2>
          <span 
            :class="['px-2.5 py-0.5 rounded-full text-[10px] font-bold border tracking-wider uppercase inline-flex items-center gap-1 shadow-sm', scopeLabel.color]"
            :title="`Usuario: ${currentUser?.name_frst || currentUser?.email || ''} | Roles: ${userRoles.join(', ') || 'Sin Rol'}`"
          >
            <span>{{ scopeLabel.icon }}</span>
            <span>{{ scopeLabel.text }}</span>
          </span>
        </div>
        <p class="text-xs text-slate-400 mt-1">Planificación y seguimiento de maniobras de izaje, logística de contrapesos y telemetría de ruta.</p>
      </div>

      <!-- Buscador Omnibox Reactivo (Spec 16 - Sección 11) + Filtro Tipo (Spec 87) -->
      <div v-if="activeView === 'kanban'" class="flex-1 flex flex-wrap items-center gap-2 max-w-2xl w-full md:w-auto">
        <div class="relative flex-1 min-w-[210px] flex items-center">
          <span class="absolute left-3 text-slate-400 pointer-events-none text-xs">🔍</span>
          <input 
            v-model="busquedaKanban"
            type="text" 
            placeholder="Buscar por N° Cotización, INT-, Cliente, Sucursal o Vendedor..." 
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

        <!-- Filtro rápido Tipo Proyecto: Todos | Comerciales | Internos -->
        <div class="flex items-center bg-[#070b14] p-1 rounded-xl border border-white/10 text-[11px] shrink-0">
          <button
            @click="filtroTipoProyecto = 'TODOS'"
            type="button"
            class="px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer"
            :class="filtroTipoProyecto === 'TODOS' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'"
          >
            Todos
          </button>
          <button
            @click="filtroTipoProyecto = 'COMERCIALES'"
            type="button"
            class="px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer"
            :class="filtroTipoProyecto === 'COMERCIALES' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'"
          >
            Comerciales
          </button>
          <button
            @click="filtroTipoProyecto = 'INTERNOS'"
            type="button"
            class="px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer"
            :class="filtroTipoProyecto === 'INTERNOS' ? 'bg-amber-500 text-black font-black shadow' : 'text-amber-400 hover:text-amber-300'"
          >
            <span>🔁</span>
            <span>Internos</span>
          </button>
        </div>

        <!-- Botón rápido Cabecera: + Req. Interno (Spec 87) -->
        <button
          @click="mostrarModalReqInterno = true"
          type="button"
          class="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-black border border-dashed border-amber-400/70 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
          title="Crear Requerimiento Interno de Operaciones sin pasar por preventa comercial"
        >
          <span>🔁</span>
          <span>+ Req. Interno</span>
        </button>
      </div>

      <!-- Selector Cuadri-Modal de Vistas -->
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
          <div class="space-y-1.5 mb-2">
            <button @click="abrirCotizacion" class="w-full py-2 bg-[#6366f1]/10 hover:bg-[#6366f1]/20 border border-[#6366f1]/30 text-[#818cf8] rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer">
              <span>+ Nueva Oportunidad</span>
            </button>
            <button @click="mostrarModalReqInterno = true" class="w-full py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-dashed border-amber-400/60 text-amber-300 rounded-lg text-[11px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer">
              <span>🔁</span>
              <span>+ Req. Interno</span>
            </button>
          </div>
          
          <div 
            v-for="p in preventaFiltrados" 
            :key="p.id_proyecto" 
            @click="abrirProyecto(p.id_proyecto, 'comercial')"
            class="bg-[#151d35] border rounded-lg p-3 hover:bg-[#6366f1]/5 transition-all cursor-pointer text-left"
            :class="[
              esProyectoInterno(p)
                ? 'border-l-4 border-dashed border-amber-400 bg-amber-500/5'
                : (p.json_field?.crm_v1?.prioridad === 'alta' ? 'border-red-500/40 shadow-lg shadow-red-500/5' : 'border-white/5 hover:border-[#6366f1]/40')
            ]"
          >
            <div v-if="esProyectoInterno(p)" class="mb-1.5">
              <span class="text-[8px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-400/40 px-1.5 py-0.5 rounded inline-flex items-center gap-1 font-mono">
                🔁 MOVIMIENTO INTERNO · COSTO PROPIO
              </span>
            </div>
            <div class="flex justify-between items-start">
              <span class="text-[9px] font-mono font-bold" :class="esProyectoInterno(p) ? 'text-amber-400' : 'text-[#818cf8]'">{{ p.codi_proyecto || '—' }}</span>
              <span v-if="p.json_field?.crm_v1?.prioridad === 'alta'" class="text-[8px] font-bold uppercase bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/30 text-red-400 flex items-center gap-0.5">
                🔥 Alta
              </span>
            </div>
            <h4 class="text-xs font-bold text-white mt-1">{{ p.nombre_cliente || '—' }}</h4>
            <p class="text-[10px] text-slate-400 mt-0.5 truncate">{{ p.nombre_proyecto }}</p>
            <p v-if="esProyectoInterno(p)" class="text-[10px] text-amber-300 font-mono font-bold mt-1 truncate">
              📍 {{ getOrigenInterno(p) }} ➔ {{ getDestinoInterno(p) }}
            </p>
            <div class="text-[10px] text-slate-400 mt-2 space-y-1">
              <p>{{ p.json_field?.crm_v1?.familia_servicio || p.objetivo_proyecto || '—' }}</p>
              <p v-if="getNombreVendedor(p)" class="text-[9px] text-indigo-400 font-medium flex items-center gap-1">
                <span>👤</span> {{ getNombreVendedor(p) }}
              </p>
              <p v-if="esProyectoInterno(p)" class="text-[9px] font-mono font-black text-amber-400">
                🚫 NO FACTURABLE (C. COSTO INTERNO)
              </p>
              <p v-else-if="formatMonto(p)" class="text-white font-bold">{{ formatMonto(p) }}</p>
              <p v-if="p.fecha_plan_ini" class="text-amber-500/70"><span class="font-semibold">Tentativa:</span> {{ new Date(p.fecha_plan_ini).toLocaleDateString() }}</p>
            </div>
            <div class="flex flex-wrap gap-1.5 mt-2">
              <span class="text-[8px] font-bold uppercase bg-[#6366f1]/10 px-2 py-0.5 rounded border border-[#6366f1]/20 text-[#818cf8]">
                {{ p.id_proyecto_estado === 1 ? 'Oportunidad' : 'Cotizando' }}
              </span>
              <span
                v-if="getEstadoVbGerencia(p)"
                class="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border font-mono"
                :class="getEstadoVbGerencia(p).classes"
                :title="getEstadoVbGerencia(p).tooltip"
              >
                {{ getEstadoVbGerencia(p).label }}
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
            :class="[
              esProyectoInterno(p)
                ? 'border-l-4 border-dashed border-amber-400 bg-amber-500/5'
                : (p.json_field?.crm_v1?.prioridad === 'alta' ? 'border-red-500/40 shadow-lg shadow-red-500/5' : 'border-white/5 hover:border-amber-500/40')
            ]"
          >
            <div v-if="esProyectoInterno(p)" class="mb-1.5">
              <span class="text-[8px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-400/40 px-1.5 py-0.5 rounded inline-flex items-center gap-1 font-mono">
                🔁 MOVIMIENTO INTERNO · COSTO PROPIO
              </span>
            </div>
            <div class="flex justify-between items-start">
              <span class="text-[9px] font-mono text-amber-500 font-bold">{{ p.codi_proyecto || '—' }}</span>
              <div class="flex items-center gap-1.5">
                <span v-if="p.json_field?.crm_v1?.prioridad === 'alta'" class="text-[8px] font-bold uppercase bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/30 text-red-400 flex items-center gap-0.5">
                  🔥 Alta
                </span>
                <!-- Micro-Gauge Avance Acreditación (Visible solo desde Preparación de Salida / Estado 5) -->
                <div 
                  v-if="Number(p.id_proyecto_estado) >= 5 && !esProyectoInterno(p)"
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
            <p v-if="esProyectoInterno(p)" class="text-[10px] text-amber-300 font-mono font-bold mt-1 truncate">
              📍 {{ getOrigenInterno(p) }} ➔ {{ getDestinoInterno(p) }}
            </p>
            <div class="text-[10px] text-slate-400 mt-2 space-y-1">
              <p>{{ p.json_field?.crm_v1?.familia_servicio || p.objetivo_proyecto || '—' }}</p>
              <p v-if="getNombreVendedor(p)" class="text-[9px] text-indigo-400 font-medium flex items-center gap-1">
                <span>👤</span> {{ getNombreVendedor(p) }}
              </p>
              <p v-if="esProyectoInterno(p)" class="text-[9px] font-mono font-black text-amber-400">
                🚫 NO FACTURABLE (C. COSTO INTERNO)
              </p>
              <p v-else-if="formatMonto(p)" class="text-white font-bold">{{ formatMonto(p) }}</p>
              <p v-if="p.fecha_plan_ini" class="text-amber-500/70"><span class="font-semibold">Asignación:</span> {{ new Date(p.fecha_plan_ini).toLocaleDateString() }}</p>
            </div>
            <div class="flex flex-wrap gap-1.5 mt-3">
              <span class="text-[8px] font-bold uppercase bg-white/5 px-2 py-0.5 rounded border border-white/5 text-slate-400">
                {{ esProyectoInterno(p) ? 'Orden Interna' : (p.json_field?.crm_v1?.requiere_acreditacion ? 'Acreditación' : 'Sin Acreditación') }}
              </span>
              <span
                v-if="getEstadoVbGerencia(p)"
                class="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border font-mono"
                :class="getEstadoVbGerencia(p).classes"
                :title="getEstadoVbGerencia(p).tooltip"
              >
                {{ getEstadoVbGerencia(p).label }}
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
            :class="[
              esProyectoInterno(p)
                ? 'border-l-4 border-dashed border-amber-400 bg-amber-500/5'
                : (p.json_field?.crm_v1?.prioridad === 'alta' ? 'border-red-500/40 shadow-lg shadow-red-500/5' : 'border-white/5 hover:border-blue-500/40')
            ]"
          >
            <div v-if="esProyectoInterno(p)" class="mb-1.5">
              <span class="text-[8px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-400/40 px-1.5 py-0.5 rounded inline-flex items-center gap-1 font-mono">
                🔁 MOVIMIENTO INTERNO · COSTO PROPIO
              </span>
            </div>
            <div class="flex justify-between items-start">
              <span class="text-[9px] font-mono font-bold" :class="esProyectoInterno(p) ? 'text-amber-400' : 'text-blue-400'">{{ p.codi_proyecto || '—' }}</span>
              <div class="flex items-center gap-1.5">
                <span v-if="p.json_field?.crm_v1?.prioridad === 'alta'" class="text-[8px] font-bold uppercase bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/30 text-red-400 flex items-center gap-0.5">
                  🔥 Alta
                </span>
                <!-- Micro-Gauge Avance Acreditación (Visible solo desde Preparación de Salida / Estado 5) -->
                <div 
                  v-if="Number(p.id_proyecto_estado) >= 5 && !esProyectoInterno(p)"
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
            <p v-if="esProyectoInterno(p)" class="text-[10px] text-amber-300 font-mono font-bold mt-1 truncate">
              📍 {{ getOrigenInterno(p) }} ➔ {{ getDestinoInterno(p) }}
            </p>
            <div class="text-[10px] text-slate-400 mt-2 space-y-1">
              <p>{{ p.json_field?.crm_v1?.familia_servicio || p.objetivo_proyecto || '—' }}</p>
              <p v-if="getNombreVendedor(p)" class="text-[9px] text-indigo-400 font-medium flex items-center gap-1">
                <span>👤</span> {{ getNombreVendedor(p) }}
              </p>
              <p v-if="esProyectoInterno(p)" class="text-[9px] font-mono font-black text-amber-400">
                🚫 NO FACTURABLE (C. COSTO INTERNO)
              </p>
              <p v-else-if="formatMonto(p)" class="text-white font-bold">{{ formatMonto(p) }}</p>
              <p v-if="p.fecha_plan_ini" class="text-blue-400/70"><span class="font-semibold">Asignación:</span> {{ new Date(p.fecha_plan_ini).toLocaleDateString() }}</p>
            </div>
            <div class="flex flex-wrap gap-1.5 mt-3">
              <span class="text-[8px] font-bold uppercase bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/25 text-blue-400">Asignando OT</span>
              <span
                v-if="getEstadoVbGerencia(p)"
                class="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border font-mono"
                :class="getEstadoVbGerencia(p).classes"
                :title="getEstadoVbGerencia(p).tooltip"
              >
                {{ getEstadoVbGerencia(p).label }}
              </span>
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
              esProyectoInterno(p)
                ? 'border-l-4 border-dashed border-amber-400 bg-amber-500/5'
                : (p.json_field?.crm_v1?.prioridad === 'alta' ? 'border-red-500/40 shadow-lg shadow-red-500/5' : 'border-white/5 hover:border-cyan-500/40'),
              hoveredProyectoId === p.id_proyecto ? 'ring-2 ring-cyan-400 shadow-xl shadow-cyan-500/20 scale-[1.01]' : ''
            ]"
          >
            <div v-if="esProyectoInterno(p)" class="mb-1">
              <span class="text-[8px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-400/40 px-1.5 py-0.5 rounded inline-flex items-center gap-1 font-mono">
                🔁 MOVIMIENTO INTERNO · COSTO PROPIO
              </span>
            </div>
            <div class="flex justify-between items-start">
              <span class="text-[9px] font-mono font-bold" :class="esProyectoInterno(p) ? 'text-amber-400' : 'text-cyan-400'">{{ p.codi_proyecto || '—' }}</span>
              <div class="flex items-center gap-1.5">
                <span v-if="p.json_field?.crm_v1?.prioridad === 'alta'" class="text-[8px] font-bold uppercase bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/30 text-red-400 flex items-center gap-0.5">
                  🔥 Alta
                </span>
                <!-- Micro-Gauge Avance Acreditación (3x Tamaño) -->
                <div 
                  v-if="!esProyectoInterno(p)"
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
            <p v-if="esProyectoInterno(p)" class="text-[10px] text-amber-300 font-mono font-bold mt-1 truncate">
              📍 {{ getOrigenInterno(p) }} ➔ {{ getDestinoInterno(p) }}
            </p>

            <div class="text-[10px] text-slate-400 mt-2 space-y-1">
              <p>{{ p.json_field?.crm_v1?.familia_servicio || p.objetivo_proyecto || '—' }}</p>
              <p v-if="getNombreVendedor(p)" class="text-[9px] text-indigo-400 font-medium flex items-center gap-1">
                <span>👤</span> {{ getNombreVendedor(p) }}
              </p>
              <p v-if="esProyectoInterno(p)" class="text-[9px] font-mono font-black text-amber-400">
                🚫 NO FACTURABLE (C. COSTO INTERNO)
              </p>
              <p v-else-if="formatMonto(p)" class="text-white font-bold">{{ formatMonto(p) }}</p>
              <p v-if="p.fecha_plan_ini" class="text-cyan-400/70"><span class="font-semibold">Inicio:</span> {{ new Date(p.fecha_plan_ini).toLocaleDateString() }}</p>
            </div>

            <div class="flex flex-wrap items-center justify-between gap-1.5 mt-3 pt-1 border-t border-white/5">
              <span class="text-[8px] font-bold uppercase bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/25 text-cyan-400">Patio / Salida</span>
              <span
                v-if="getEstadoVbGerencia(p)"
                class="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border font-mono"
                :class="getEstadoVbGerencia(p).classes"
                :title="getEstadoVbGerencia(p).tooltip"
              >
                {{ getEstadoVbGerencia(p).label }}
              </span>
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
            :class="[
              esProyectoInterno(p)
                ? 'border-l-4 border-dashed border-amber-400 bg-amber-500/5'
                : (p.json_field?.crm_v1?.prioridad === 'alta' ? 'border-red-500/40 shadow-lg shadow-red-500/5' : 'border-white/5 hover:border-purple-400/40')
            ]"
          >
            <div v-if="esProyectoInterno(p)" class="mb-1.5">
              <span class="text-[8px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-400/40 px-1.5 py-0.5 rounded inline-flex items-center gap-1 font-mono">
                🔁 MOVIMIENTO INTERNO · COSTO PROPIO
              </span>
            </div>
            <div class="flex justify-between items-start">
              <span class="text-[9px] font-mono font-bold" :class="esProyectoInterno(p) ? 'text-amber-400' : 'text-purple-400'">{{ p.codi_proyecto || '—' }}</span>
              <div class="flex items-center gap-1.5">
                <span v-if="p.json_field?.crm_v1?.prioridad === 'alta'" class="text-[8px] font-bold uppercase bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/30 text-red-400 flex items-center gap-0.5">
                  🔥 Alta
                </span>
                <!-- Micro-Gauge Avance Acreditación (3x Tamaño) -->
                <div 
                  v-if="!esProyectoInterno(p)"
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
            <p v-if="esProyectoInterno(p)" class="text-[10px] text-amber-300 font-mono font-bold mt-1 truncate">
              📍 {{ getOrigenInterno(p) }} ➔ {{ getDestinoInterno(p) }}
            </p>
            <div class="text-[10px] text-slate-400 mt-2 space-y-1">
              <p>{{ p.json_field?.crm_v1?.familia_servicio || p.objetivo_proyecto || '—' }}</p>
              <p v-if="getNombreVendedor(p)" class="text-[9px] text-indigo-400 font-medium flex items-center gap-1">
                <span>👤</span> {{ getNombreVendedor(p) }}
              </p>
              <p v-if="esProyectoInterno(p)" class="text-[9px] font-mono font-black text-amber-400">
                🚫 NO FACTURABLE (C. COSTO INTERNO)
              </p>
              <p v-else-if="formatMonto(p)" class="text-white font-bold">{{ formatMonto(p) }}</p>
              <p v-if="p.fecha_plan_fin" class="text-purple-400/70"><span class="font-semibold">Término Est.:</span> {{ new Date(p.fecha_plan_fin).toLocaleDateString() }}</p>
            </div>
            <div class="flex flex-wrap items-center justify-between gap-1.5 mt-3 pt-1 border-t border-white/5">
              <span class="text-[8px] font-bold uppercase bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/25 text-purple-400">
                {{ esProyectoInterno(p) ? 'En Ruta Interna' : 'Izaje / Faena' }}
              </span>
              <span
                v-if="getEstadoVbGerencia(p)"
                class="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border font-mono"
                :class="getEstadoVbGerencia(p).classes"
                :title="getEstadoVbGerencia(p).tooltip"
              >
                {{ getEstadoVbGerencia(p).label }}
              </span>
              <span v-else class="text-[8px] font-bold uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 text-amber-400 flex items-center gap-1">
                <span>📋</span>
                <span>{{ esProyectoInterno(p) ? 'Traslado GSP' : 'Reports Diarios' }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Columna 6: Finalizado / Devengado -->
      <div class="bg-[#0f1629] border-t-4 border-emerald-500 border border-white/5 rounded-xl p-3 flex flex-col">
        <div class="flex justify-between items-center mb-4">
          <span class="text-xs font-black uppercase text-white">Finalizado / Contabilidad</span>
          <span class="bg-black/20 text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/20">
            {{ completadosFiltrados.length }}
          </span>
        </div>
        <div class="space-y-3 flex-1 overflow-y-auto">
          <div 
            v-for="p in completadosFiltrados" 
            :key="p.id_proyecto" 
            @click="abrirProyecto(p.id_proyecto, 'liquidacion')"
            class="bg-[#151d35] border rounded-lg p-3 hover:bg-emerald-500/5 transition-all cursor-pointer text-left"
            :class="[
              esProyectoInterno(p)
                ? 'border-l-4 border-dashed border-amber-400 bg-amber-500/5'
                : (p.json_field?.crm_v1?.prioridad === 'alta' ? 'border-red-500/40 shadow-lg shadow-red-500/5' : 'border-white/5 hover:border-emerald-500/40')
            ]"
          >
            <div v-if="esProyectoInterno(p)" class="mb-1.5">
              <span class="text-[8px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-400/40 px-1.5 py-0.5 rounded inline-flex items-center gap-1 font-mono">
                🔁 MOVIMIENTO INTERNO · COSTO PROPIO
              </span>
            </div>
            <div class="flex justify-between items-start">
              <span class="text-[9px] font-mono font-bold" :class="esProyectoInterno(p) ? 'text-amber-400' : 'text-emerald-400'">{{ p.codi_proyecto || '—' }}</span>
              <div class="flex items-center gap-1.5">
                <span v-if="p.json_field?.crm_v1?.prioridad === 'alta'" class="text-[8px] font-bold uppercase bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/30 text-red-400 flex items-center gap-0.5">
                  🔥 Alta
                </span>
                <!-- Micro-Gauge Avance Acreditación (3x Tamaño) -->
                <div 
                  v-if="!esProyectoInterno(p)"
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
            <p v-if="esProyectoInterno(p)" class="text-[10px] text-amber-300 font-mono font-bold mt-1 truncate">
              📍 {{ getOrigenInterno(p) }} ➔ {{ getDestinoInterno(p) }}
            </p>
            <div class="text-[10px] text-slate-400 mt-2 space-y-1">
              <p v-if="getNombreVendedor(p)" class="text-[9px] text-indigo-400 font-medium flex items-center gap-1">
                <span>👤</span> {{ getNombreVendedor(p) }}
              </p>
              <p v-if="esProyectoInterno(p)" class="text-[9px] font-mono font-black text-amber-400">
                🚫 NO FACTURABLE (C. COSTO INTERNO)
              </p>
              <p v-else-if="formatMonto(p)" class="text-white font-bold">{{ formatMonto(p) }}</p>
              <div class="flex items-center gap-1.5 flex-wrap pt-1">
                <span
                  v-if="esProyectoInterno(p)"
                  class="text-[9px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded flex items-center gap-1 font-mono"
                >
                  <span>📑</span> ITS Costo Interno Cerrado
                </span>
                <span 
                  v-else-if="p.id_proyecto_estado === 7 || p.json_field?.liquidacion_v1?.estado_financiero === 'FACTURADO_CONFORME'"
                  class="text-[9px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded flex items-center gap-1 font-mono"
                >
                  <span>🟢</span> Facturado (DTE {{ p.json_field?.liquidacion_v1?.factura_numero || p.folio_factura_erp || 'Emitido' }})
                </span>
                <span 
                  v-else-if="p.estado_its === 'CONCLUIDO'"
                  class="text-[9px] font-bold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded flex items-center gap-1 font-mono"
                >
                  <span>💰</span> EDP Listo a Facturar
                </span>
                <span 
                  v-else-if="p.estado_its === 'EN_REVISION_CONTABILIDAD'"
                  class="text-[9px] font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded flex items-center gap-1 font-mono animate-pulse"
                >
                  <span>📑</span> Recep. Contabilidad
                </span>
                <span 
                  v-else-if="p.estado_its === 'EN_REVISION_OPERACIONES'"
                  class="text-[9px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded flex items-center gap-1 font-mono"
                >
                  <span>✍️</span> V°B° Operaciones
                </span>
                <span 
                  v-else
                  class="text-[9px] font-bold uppercase bg-slate-500/20 text-slate-300 border border-slate-500/40 px-2 py-0.5 rounded flex items-center gap-1 font-mono"
                >
                  <span>🏁</span> Faena Concluida
                </span>
                <span
                  v-if="getEstadoVbGerencia(p)"
                  class="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border font-mono"
                  :class="getEstadoVbGerencia(p).classes"
                  :title="getEstadoVbGerencia(p).tooltip"
                >
                  {{ getEstadoVbGerencia(p).label }}
                </span>
              </div>
              <p v-if="p.fecha_plan_fin" class="text-emerald-400/70 pt-0.5"><span class="font-semibold">Término:</span> {{ new Date(p.fecha_plan_fin).toLocaleDateString() }}</p>
            </div>
            <div class="flex items-center justify-between gap-1.5 mt-3 pt-2 border-t border-white/5">
              <span class="text-[8px] font-bold uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/25 text-emerald-400">
                {{ esProyectoInterno(p) ? 'Control Costos' : 'Liquidación & EDP' }}
              </span>
              <span v-if="p.folio_its" class="text-[9px] font-mono text-amber-400 font-bold truncate max-w-[130px]" :title="p.folio_its">
                {{ p.folio_its }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Vista 2: Torre PMO de Control de Gestión & Auditoría Operacional-Financiera -->
    <div v-else-if="activeView === 'pmo'" class="space-y-4 animate-fadeIn">
      <!-- KPIs PMO: Panel Ejecutivo del Analista de Operaciones -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <!-- 1. Reports Pendientes de Validación -->
        <div 
          @click="pmoVistaSecundaria = 'pendientes_reports'; filtroEstadoReportInbox = 'pendientes'"
          class="bg-[#0f1629] border rounded-xl p-3.5 flex items-center justify-between shadow-lg cursor-pointer transition-all hover:scale-[1.02]"
          :class="datosAnalistaPMO.kpis.reports_pendientes > 0 ? 'border-amber-500/50 bg-amber-500/5 shadow-amber-500/10' : 'border-white/5'"
        >
          <div>
            <div class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full" :class="datosAnalistaPMO.kpis.reports_pendientes > 0 ? 'bg-amber-400 animate-ping' : 'bg-slate-500'"></span>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Reports por Validar</p>
            </div>
            <p class="text-2xl font-black mt-1" :class="datosAnalistaPMO.kpis.reports_pendientes > 0 ? 'text-amber-400' : 'text-white'">
              {{ datosAnalistaPMO.kpis.reports_pendientes || 0 }}
            </p>
            <p class="text-[9px] text-slate-500 mt-0.5">Auditoría horas terreno</p>
          </div>
          <span class="text-2xl p-2 bg-white/5 rounded-lg border border-white/5">📋</span>
        </div>

        <!-- 2. Reports con Ajustes del Analista -->
        <div 
          @click="pmoVistaSecundaria = 'pendientes_reports'; filtroEstadoReportInbox = 'con_ajustes'"
          class="bg-[#0f1629] border border-indigo-500/30 rounded-xl p-3.5 flex items-center justify-between shadow-lg cursor-pointer transition-all hover:scale-[1.02]"
        >
          <div>
            <div class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-indigo-400"></span>
              <p class="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Reports con Ajustes</p>
            </div>
            <p class="text-2xl font-black text-white mt-1">{{ datosAnalistaPMO.kpis.reports_con_ajustes || 0 }}</p>
            <p class="text-[9px] text-slate-500 mt-0.5">Con diffs y trazabilidad</p>
          </div>
          <span class="text-2xl p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">✏️</span>
        </div>

        <!-- 3. OTs Sin ITS / Pendiente Emisión -->
        <div 
          @click="pmoVistaSecundaria = 'pendientes_its'"
          class="bg-[#0f1629] border border-amber-500/30 rounded-xl p-3.5 flex items-center justify-between shadow-lg cursor-pointer transition-all hover:scale-[1.02]"
        >
          <div>
            <div class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-amber-400"></span>
              <p class="text-[10px] font-black text-amber-400 uppercase tracking-wider">OTs Sin ITS</p>
            </div>
            <p class="text-2xl font-black text-amber-400 mt-1">{{ datosAnalistaPMO.kpis.ots_sin_its || 0 }}</p>
            <p class="text-[9px] text-slate-500 mt-0.5">Pendiente emisión ITS</p>
          </div>
          <span class="text-2xl p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">📑</span>
        </div>

        <!-- 4. ITS en Circuito de Firmas FES -->
        <div 
          @click="pmoVistaSecundaria = 'pendientes_its'"
          class="bg-[#0f1629] border border-purple-500/30 rounded-xl p-3.5 flex items-center justify-between shadow-lg cursor-pointer transition-all hover:scale-[1.02]"
        >
          <div>
            <div class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-purple-400"></span>
              <p class="text-[10px] font-black text-purple-400 uppercase tracking-wider">ITS en Firmas FES</p>
            </div>
            <p class="text-2xl font-black text-purple-300 mt-1">{{ datosAnalistaPMO.kpis.its_en_aprobacion || 0 }}</p>
            <p class="text-[9px] text-slate-500 mt-0.5">Operaciones / Contabilidad</p>
          </div>
          <span class="text-2xl p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">✍️</span>
        </div>

        <!-- 5. EDP Listos para Facturación -->
        <div 
          @click="pmoVistaSecundaria = 'pendientes_edp'"
          class="bg-[#0f1629] border border-emerald-500/30 rounded-xl p-3.5 flex items-center justify-between shadow-lg cursor-pointer transition-all hover:scale-[1.02]"
        >
          <div>
            <div class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
              <p class="text-[10px] font-black text-emerald-400 uppercase tracking-wider">EDP Listos a Facturar</p>
            </div>
            <p class="text-2xl font-black text-emerald-400 mt-1">{{ datosAnalistaPMO.kpis.edp_listos_facturar || 0 }}</p>
            <p class="text-[9px] text-slate-500 mt-0.5">ITS concluido y visado</p>
          </div>
          <span class="text-2xl p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">💰</span>
        </div>
      </div>

      <!-- Barra de Navegación de Sub-vistas PMO -->
      <div class="bg-[#0f1629] border border-white/5 rounded-xl p-2 flex flex-wrap items-center justify-between gap-2 shadow-sm">
        <div class="flex items-center gap-1.5 bg-[#070b14] p-1 rounded-lg border border-white/5">
          <button 
            @click="pmoVistaSecundaria = 'control_vivo'"
            class="px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2"
            :class="pmoVistaSecundaria === 'control_vivo' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'"
          >
            <span>📡 Control en Vivo</span>
          </button>

          <button 
            @click="pmoVistaSecundaria = 'pendientes_reports'"
            class="px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2"
            :class="pmoVistaSecundaria === 'pendientes_reports' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'"
          >
            <span>📋 1. Reports Diarios Inbox</span>
            <span 
              v-if="datosAnalistaPMO.kpis.reports_pendientes > 0" 
              class="px-1.5 py-0.2 text-[10px] rounded-full bg-amber-500 text-black font-black"
            >
              {{ datosAnalistaPMO.kpis.reports_pendientes }}
            </span>
          </button>

          <button 
            @click="pmoVistaSecundaria = 'pendientes_its'"
            class="px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2"
            :class="pmoVistaSecundaria === 'pendientes_its' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'"
          >
            <span>📑 2. Informes de Término (ITS)</span>
            <span 
              v-if="datosAnalistaPMO.kpis.its_en_aprobacion > 0" 
              class="px-1.5 py-0.2 text-[10px] rounded-full bg-purple-500 text-white font-black"
            >
              {{ datosAnalistaPMO.kpis.its_en_aprobacion }}
            </span>
          </button>

          <button 
            @click="pmoVistaSecundaria = 'pendientes_edp'"
            class="px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2"
            :class="pmoVistaSecundaria === 'pendientes_edp' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'"
          >
            <span>💰 3. Pipeline EDP & Facturación</span>
            <span 
              v-if="datosAnalistaPMO.kpis.edp_listos_facturar > 0" 
              class="px-1.5 py-0.2 text-[10px] rounded-full bg-emerald-500 text-black font-black"
            >
              {{ datosAnalistaPMO.kpis.edp_listos_facturar }}
            </span>
          </button>

          <button 
            @click="pmoVistaSecundaria = 'matriz_hitos'"
            class="px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2"
            :class="pmoVistaSecundaria === 'matriz_hitos' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'"
          >
            <span>🗂️ 4. Matriz Hitos Global OT</span>
          </button>
        </div>

        <button 
          @click="cargarPendientesAnalista" 
          :disabled="cargandoAnalistaPMO"
          title="Actualizar datos"
          class="p-2 bg-slate-800/80 hover:bg-blue-600/30 text-blue-400 hover:text-white rounded-lg border border-blue-500/30 flex items-center justify-center transition-all shadow-sm"
        >
          <span :class="{'animate-spin': cargandoAnalistaPMO}">🔄</span>
        </button>
      </div>

      <!-- Sub-vista 0: Control Operativo en Vivo (Spec 63 / Opción 3 Híbrida) -->
      <ControlOperativoVivo 
        v-if="pmoVistaSecundaria === 'control_vivo'"
        @abrir-proyecto="(id) => abrirProyecto(id, 'operaciones')"
        @ver-report="(rep) => abrirVisorReportPMO(rep)"
      />

      <!-- Sub-vista 1: Inbox de Reports Diarios -->
      <div v-if="pmoVistaSecundaria === 'pendientes_reports'" class="bg-[#0f1629] border border-white/5 rounded-xl overflow-hidden shadow-xl">
        <div class="p-3 border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-3 bg-[#0a0f1e]/60">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs font-black uppercase text-white tracking-wider">Bandeja de Entrada de Reports Diarios</span>
            <span class="text-[10px] text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 font-mono font-bold">
              {{ gruposReportsPorOT.length }} OTs
            </span>
            <span class="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/5 font-mono">
              {{ reportsFiltradosInbox.length }} reportes
            </span>
            <button
              v-if="gruposReportsPorOT.length > 0"
              @click="toggleTodasOtsReportsPMO"
              class="px-2 py-0.5 rounded text-[10px] font-bold border border-white/10 bg-[#070b14] text-slate-300 hover:text-white hover:border-blue-500/40 transition-all cursor-pointer"
            >
              {{ todasOtsReportsAbiertas ? '📁 Colapsar OTs' : '📂 Expandir OTs' }}
            </button>
          </div>
          
          <div class="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <!-- Filtro de estado rápido -->
            <div class="flex items-center bg-[#070b14] p-0.5 rounded-lg border border-white/10 text-[11px]">
              <button 
                @click="filtroEstadoReportInbox = 'todos'" 
                class="px-2 py-1 rounded font-bold transition-all"
                :class="filtroEstadoReportInbox === 'todos' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'"
              >
                Todos
              </button>
              <button 
                @click="filtroEstadoReportInbox = 'pendientes'" 
                class="px-2 py-1 rounded font-bold transition-all flex items-center gap-1"
                :class="filtroEstadoReportInbox === 'pendientes' ? 'bg-amber-500 text-black' : 'text-amber-400 hover:text-amber-300'"
              >
                <span>Pendientes</span>
                <span v-if="datosAnalistaPMO.kpis.reports_pendientes > 0" class="text-[9px] px-1 bg-black/30 rounded-full font-black">
                  {{ datosAnalistaPMO.kpis.reports_pendientes }}
                </span>
              </button>
              <button 
                @click="filtroEstadoReportInbox = 'con_ajustes'" 
                class="px-2 py-1 rounded font-bold transition-all flex items-center gap-1"
                :class="filtroEstadoReportInbox === 'con_ajustes' ? 'bg-indigo-600 text-white' : 'text-indigo-400 hover:text-indigo-300'"
              >
                <span>Con Ajustes</span>
                <span v-if="datosAnalistaPMO.kpis.reports_con_ajustes > 0" class="text-[9px] px-1 bg-white/20 rounded-full font-black">
                  {{ datosAnalistaPMO.kpis.reports_con_ajustes }}
                </span>
              </button>
              <button 
                @click="filtroEstadoReportInbox = 'validados'" 
                class="px-2 py-1 rounded font-bold transition-all"
                :class="filtroEstadoReportInbox === 'validados' ? 'bg-emerald-600 text-white' : 'text-emerald-400 hover:text-emerald-300'"
              >
                Validados
              </button>
            </div>

            <!-- Buscador omnibox -->
            <input 
              v-model="filtroReportsPMO" 
              type="text" 
              placeholder="Buscar por OT, cliente, grúa, operador..." 
              class="bg-[#070b14] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 w-full md:w-64 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        <div class="overflow-x-auto max-h-[calc(100vh-320px)]">
          <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-[#070b14] text-slate-400 uppercase text-[10px] tracking-wider font-bold border-b border-white/10 sticky top-0 z-10 select-none">
              <tr>
                <th class="py-2.5 px-3">OT / Fecha de Report</th>
                <th class="py-2.5 px-3">Grúa & Operador</th>
                <th class="py-2.5 px-3 text-center">Horas Terreno</th>
                <th class="py-2.5 px-3 text-center">Horómetro</th>
                <th class="py-2.5 px-3 text-center">Estado Auditoría</th>
                <th class="py-2.5 px-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5 text-slate-300">
              <template v-for="grupo in gruposReportsPorOT" :key="grupo.id_proyecto">
                <!-- Fila Cabecera de la OT (Nivel Padre) -->
                <tr
                  @click="toggleOtReportPMO(grupo.id_proyecto)"
                  class="bg-[#090e1d] hover:bg-[#111a33] cursor-pointer select-none border-y border-blue-500/20 transition-colors"
                >
                  <td colspan="6" class="py-2.5 px-3">
                    <div class="flex flex-wrap items-center justify-between gap-3">
                      <div class="flex flex-wrap items-center gap-2.5 min-w-0">
                        <span
                          class="text-blue-400 font-mono text-xs transition-transform duration-200 inline-block"
                          :class="esOtReportAbiertaPMO(grupo.id_proyecto) ? 'rotate-90' : ''"
                        >
                          ▶
                        </span>
                        <span class="font-mono font-black text-blue-400 text-xs px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30">
                          {{ grupo.codi_proyecto }}
                        </span>
                        <span class="font-bold text-white text-xs truncate max-w-[260px]" :title="grupo.cliente_nombre">
                          {{ grupo.cliente_nombre }}
                        </span>
                        <span class="text-[11px] text-slate-400 truncate max-w-[260px]" :title="grupo.obra_nombre">
                          · {{ grupo.obra_nombre }}
                        </span>
                      </div>

                      <div class="flex flex-wrap items-center gap-3 text-[11px] font-mono">
                        <span class="text-slate-400">
                          Período: <strong class="text-slate-200">{{ grupo.rangoFechasLabel }}</strong>
                        </span>
                        <span class="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                          <strong>{{ grupo.reports.length }}</strong> report(s)
                        </span>
                        <span
                          v-if="grupo.pendientesCount > 0"
                          class="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold"
                        >
                          🟡 {{ grupo.pendientesCount }} pendiente(s)
                        </span>
                        <span
                          v-else
                          class="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold"
                        >
                          ✓ {{ grupo.validadosCount }} validado(s)
                        </span>
                        <span class="text-slate-400">
                          Total: <strong class="text-emerald-400">{{ grupo.totalHorasFacturables }} hrs fact.</strong>
                          <span class="text-slate-500">({{ grupo.totalHorasOperadas }} oper.)</span>
                        </span>
                        <button
                          @click.stop="abrirProyecto(grupo.id_proyecto, 'reports')"
                          class="px-2 py-0.5 rounded bg-white/5 hover:bg-blue-600/30 text-slate-300 hover:text-white border border-white/10 text-[10px] font-sans font-bold transition-colors cursor-pointer"
                          title="Abrir OT en Gestor"
                        >
                          🏢 Abrir OT
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>

                <!-- Filas Hijas: Fechas de cada Report colgando bajo la OT -->
                <tr
                  v-for="r in (esOtReportAbiertaPMO(grupo.id_proyecto) ? grupo.reports : [])"
                  :key="r.id_reporte_avance"
                  class="hover:bg-white/5 transition-colors bg-[#0f1629]/60"
                >
                  <!-- Fecha & Día (colgando bajo la OT) -->
                  <td class="py-2.5 pl-8 pr-3 whitespace-nowrap border-l-2 border-blue-500/30">
                    <div class="flex items-center gap-2">
                      <span class="text-blue-400/70 font-mono text-xs">↳</span>
                      <div>
                        <div class="text-white font-bold font-mono text-xs">{{ formatFecha(r.fecha_reporte) }}</div>
                        <div class="text-slate-400 text-[10px] font-mono">Día correlativo #{{ r.dia_correlativo || 1 }}</div>
                      </div>
                    </div>
                  </td>

                  <!-- Grúa & Operador -->
                  <td class="py-2.5 px-3">
                    <div class="font-mono font-bold text-slate-200 text-xs">{{ r.equipo_patente || 'S/P' }}</div>
                    <div class="text-slate-400 text-[10px] truncate max-w-[150px]">{{ r.operador_nombre || 'Operador GSP' }}</div>
                  </td>

                  <!-- Horas Terreno -->
                  <td class="py-2.5 px-3 text-center whitespace-nowrap">
                    <div class="font-mono font-bold text-xs" :class="r.ajustes_analista?.modificado ? 'text-indigo-400' : 'text-emerald-400'">
                      {{ r.horas_facturables }} hrs fact.
                    </div>
                    <div class="text-[10px] text-slate-400 font-mono">
                      {{ r.horas_operadas }} oper. / {{ r.horas_colacion || 0 }} col.
                    </div>
                  </td>

                  <!-- Horómetro -->
                  <td class="py-2.5 px-3 text-center whitespace-nowrap font-mono text-[11px]">
                    <div v-if="r.horometro_inicio || r.horometro_termino" class="text-slate-300">
                      {{ r.horometro_inicio || '—' }} ➔ {{ r.horometro_termino || '—' }}
                    </div>
                    <div v-else class="text-slate-600">—</div>
                  </td>

                  <!-- Estado Auditoría -->
                  <td class="py-2.5 px-3 text-center whitespace-nowrap">
                    <div v-if="r.estado_reporte === 'PENDIENTE_VALIDACION'" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold text-[10px] animate-pulse">
                      <span>🟡</span>
                      <span>Pendiente Analista</span>
                    </div>
                    <div v-else-if="r.ajustes_analista?.modificado" class="inline-flex flex-col items-center">
                      <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold text-[10px]">
                        <span>✏️</span>
                        <span>Validado con Ajustes</span>
                      </span>
                      <span class="text-[9px] text-slate-400 mt-0.5">por {{ r.validador_nombre || 'Analista' }}</span>
                    </div>
                    <div v-else class="inline-flex flex-col items-center">
                      <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold text-[10px]">
                        <span>✓</span>
                        <span>Validado Conforme</span>
                      </span>
                      <span class="text-[9px] text-slate-400 mt-0.5">por {{ r.validador_nombre || 'Analista' }}</span>
                    </div>
                  </td>

                  <!-- Acción -->
                  <td class="py-2.5 px-3 text-right whitespace-nowrap">
                    <div class="flex items-center justify-end gap-1.5">
                      <a
                        v-if="r.id_doc_pdf"
                        :href="getUrlStoragePdf(r.id_doc_pdf)"
                        target="_blank"
                        class="px-2 py-1 rounded bg-red-600/20 hover:bg-red-600 text-red-200 hover:text-white border border-red-500/40 text-[10px] font-mono font-bold transition-all flex items-center gap-1 shadow-sm"
                        title="Abrir PDF Oficial con Doble Firma FES"
                        @click.stop
                      >
                        <span>📄 PDF</span>
                      </a>
                      <button 
                        @click="abrirVisorReportPMO(r)"
                        class="px-3 py-1 rounded text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                        :class="r.estado_reporte === 'PENDIENTE_VALIDACION' 
                          ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-500/20 font-black' 
                          : 'bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30'"
                      >
                        <span>{{ r.estado_reporte === 'PENDIENTE_VALIDACION' ? 'Auditar y Validar' : 'Ver Detalle' }}</span>
                        <span>➔</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </template>

              <tr v-if="reportsFiltradosInbox.length === 0">
                <td colspan="6" class="text-center py-12 text-slate-500 italic">
                  No hay reportes diarios que coincidan con los criterios seleccionados.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Sub-vista 2: Informes de Término (ITS) -->
      <div v-else-if="pmoVistaSecundaria === 'pendientes_its'" class="bg-[#0f1629] border border-white/5 rounded-xl overflow-hidden shadow-xl">
        <div class="p-3 border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-3 bg-[#0a0f1e]/60">
          <div class="flex items-center gap-2">
            <span class="text-xs font-black uppercase text-white tracking-wider">Informes de Término de Servicio (ITS) & Circuito de Aprobación</span>
            <span class="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/5 font-mono">
              {{ otsFiltradasPMO.length }} órdenes de trabajo
            </span>
          </div>
          
          <input 
            v-model="filtroItsPMO" 
            type="text" 
            placeholder="Buscar por OT, cliente, faena, folio ITS..." 
            class="bg-[#070b14] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 w-full md:w-80 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div class="overflow-x-auto max-h-[calc(100vh-320px)]">
          <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-[#070b14] text-slate-400 uppercase text-[10px] tracking-wider font-bold border-b border-white/10 sticky top-0 z-10 select-none">
              <tr>
                <th class="py-2.5 px-3">OT / Negocio</th>
                <th class="py-2.5 px-3 text-center">Reports Faena</th>
                <th class="py-2.5 px-3">Folio ITS</th>
                <th class="py-2.5 px-3 text-right">Venta Facturable</th>
                <th class="py-2.5 px-3 text-center">Margen</th>
                <th class="py-2.5 px-3 text-center">Circuito de Firmas ITS</th>
                <th class="py-2.5 px-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5 text-slate-300">
              <tr v-for="o in otsFiltradasPMO" :key="o.id_proyecto" class="hover:bg-white/5 transition-colors">
                <!-- OT / Negocio -->
                <td class="py-2.5 px-3">
                  <div class="font-mono font-bold text-blue-400 text-xs">{{ o.codi_proyecto || `OT-${o.id_proyecto}` }}</div>
                  <div class="font-bold text-white text-xs truncate max-w-[200px]" :title="o.cliente_nombre">{{ o.cliente_nombre || 'Cliente' }}</div>
                  <div class="text-[10px] text-slate-400 truncate max-w-[200px]">{{ o.obra_nombre || o.nombre_proyecto }}</div>
                </td>

                <!-- Reports Faena -->
                <td class="py-2.5 px-3 text-center whitespace-nowrap">
                  <span 
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                    :class="Number(o.reports_pendientes) > 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'"
                  >
                    <span>{{ o.reports_validados || 0 }} / {{ o.total_reports || 0 }} validados</span>
                  </span>
                  <div v-if="Number(o.reports_pendientes) > 0" class="text-[9px] text-amber-400 font-bold mt-0.5">
                    {{ o.reports_pendientes }} pendiente(s)
                  </div>
                </td>

                <!-- Folio ITS -->
                <td class="py-2.5 px-3 whitespace-nowrap">
                  <div v-if="o.folio_its" class="flex items-center gap-1.5">
                    <a 
                      :href="getUrlPdfIts(o.id_proyecto)" 
                      target="_blank" 
                      class="font-mono font-bold text-amber-400 hover:text-amber-300 hover:underline text-xs flex items-center gap-1"
                      title="Abrir PDF Oficial del ITS"
                      @click.stop
                    >
                      <span>{{ o.folio_its }}</span>
                      <span class="text-[10px] opacity-80">↗</span>
                    </a>
                  </div>
                  <span v-else class="text-slate-500 italic text-[11px]">Sin ITS generado</span>
                </td>

                <!-- Venta Facturable -->
                <td class="py-2.5 px-3 text-right whitespace-nowrap font-mono font-bold">
                  <div v-if="Number(o.total_ingresos_facturables) > 0" class="text-white text-xs">
                    {{ formatMoneda(o.total_ingresos_facturables) }}
                  </div>
                  <div v-else class="text-slate-500">—</div>
                </td>

                <!-- Margen -->
                <td class="py-2.5 px-3 text-center whitespace-nowrap font-mono font-bold">
                  <div v-if="o.margen_porcentaje !== undefined && o.margen_porcentaje !== null" :class="Number(o.margen_porcentaje) >= 30 ? 'text-emerald-400' : 'text-amber-400'">
                    {{ Number(o.margen_porcentaje).toFixed(1) }}%
                  </div>
                  <div v-else class="text-slate-500">—</div>
                </td>

                <!-- Circuito de Firmas ITS -->
                <td class="py-2.5 px-3 text-center whitespace-nowrap">
                  <span 
                    class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold border"
                    :class="getEstadoItsBadge(o.estado_its).classes"
                  >
                    {{ getEstadoItsBadge(o.estado_its).label }}
                  </span>
                </td>

                <!-- Acción -->
                <td class="py-2.5 px-3 text-right whitespace-nowrap">
                  <div class="flex items-center justify-end gap-1.5">
                    <a
                      v-if="o.id_its"
                      :href="getUrlPdfIts(o.id_proyecto)"
                      target="_blank"
                      class="px-2 py-1 rounded bg-red-600/20 hover:bg-red-600 text-red-200 hover:text-white border border-red-500/40 text-[10px] font-mono font-bold transition-all flex items-center gap-1 shadow-sm"
                      title="Abrir PDF Oficial del ITS"
                      @click.stop
                    >
                      <span>📄 PDF</span>
                    </a>
                    <button 
                      @click="abrirItsModalPMO(o.id_proyecto)"
                      class="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black rounded border border-amber-500/30 text-[11px] font-bold transition-all flex items-center gap-1"
                      :title="o.id_its ? 'Gestionar y Firmar ITS' : 'Elaborar ITS'"
                    >
                      <span>{{ o.id_its ? 'Gestionar ITS' : 'Elaborar ITS' }}</span>
                      <span>➔</span>
                    </button>
                    <button 
                      @click="abrirProyecto(o.id_proyecto, 'liquidacion')"
                      class="p-1 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded border border-white/10 text-xs transition-colors"
                      title="Abrir OT en CRM"
                    >
                      🏢
                    </button>
                  </div>
                </td>
              </tr>

              <tr v-if="otsFiltradasPMO.length === 0">
                <td colspan="7" class="text-center py-12 text-slate-500 italic">
                  No hay órdenes de trabajo que coincidan con la búsqueda.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Sub-vista 3: Pipeline EDP & Facturación -->
      <div v-else-if="pmoVistaSecundaria === 'pendientes_edp'" class="bg-[#0f1629] border border-white/5 rounded-xl overflow-hidden shadow-xl">
        <div class="p-3 border-b border-white/5 flex items-center justify-between bg-[#0a0f1e]/60">
          <div class="flex items-center gap-2">
            <span class="text-xs font-black uppercase text-white tracking-wider">Pipeline de Estados de Pago (EDP) & Emisión DTE</span>
            <span class="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
              {{ pipelineEdpFiltradas.length }} servicios en pipeline
            </span>
          </div>
        </div>

        <div class="overflow-x-auto max-h-[calc(100vh-320px)]">
          <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-[#070b14] text-slate-400 uppercase text-[10px] tracking-wider font-bold border-b border-white/10 sticky top-0 z-10 select-none">
              <tr>
                <th class="py-2.5 px-3">OT / Mandante</th>
                <th class="py-2.5 px-3">Circuito 3 Firmas EDP (FES)</th>
                <th class="py-2.5 px-3 text-right">Monto Neto EDP</th>
                <th class="py-2.5 px-3 text-center">Condición OC / HES</th>
                <th class="py-2.5 px-3 text-center">Semáforo Facturación DTE</th>
                <th class="py-2.5 px-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5 text-slate-300">
              <tr v-for="o in pipelineEdpFiltradas" :key="o.id_proyecto" class="hover:bg-white/5 transition-colors">
                <!-- OT / Mandante -->
                <td class="py-2.5 px-3">
                  <div class="font-mono font-bold text-blue-400 text-xs">{{ o.codi_proyecto || `OT-${o.id_proyecto}` }}</div>
                  <div class="font-bold text-white text-xs truncate max-w-[220px]" :title="o.cliente_nombre">{{ o.cliente_nombre || 'Cliente Mandante' }}</div>
                  <div class="text-[10px] text-slate-400 truncate max-w-[220px]">{{ o.obra_nombre || o.nombre_proyecto }}</div>
                </td>

                <!-- Circuito 3 Firmas EDP (Independiente de ITS) -->
                <td class="py-2.5 px-3 whitespace-nowrap">
                  <div class="flex flex-col gap-1">
                    <div class="flex items-center gap-1 text-[10px] font-mono">
                      <span :class="o.edp_flujo_v1?.firma_1_analista ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-800 text-slate-400 border-white/10'" class="px-1.5 py-0.5 rounded border font-bold" title="Hito 1: Control de Gestión (Yara)">
                        1° Ctl.Gest {{ o.edp_flujo_v1?.firma_1_analista ? '✓' : '⏳' }}
                      </span>
                      <span class="text-slate-600">➔</span>
                      <span :class="o.edp_flujo_v1?.firma_3_comercial ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-800 text-slate-400 border-white/10'" class="px-1.5 py-0.5 rounded border font-bold" title="Hito 2: Despacho Comercial al Cliente">
                        2° Despacho {{ o.edp_flujo_v1?.firma_3_comercial ? '✓' : '⏳' }}
                      </span>
                    </div>
                    <div class="text-[10px] text-slate-400 font-mono">
                      Reports: <strong class="text-white">{{ o.reports_validados || 0 }}/{{ o.total_reports || 0 }}</strong> validados
                      <span v-if="o.folio_its" class="ml-2 text-slate-500">• ITS Interno: {{ o.folio_its }}</span>
                    </div>
                  </div>
                </td>

                <!-- Monto Neto Autorizado -->
                <td class="py-2.5 px-3 text-right whitespace-nowrap font-mono font-bold text-emerald-400 text-sm">
                  {{ formatMoneda(o.total_ingresos_facturables) }}
                </td>

                <!-- Condición OC / HES -->
                <td class="py-2.5 px-3 text-center whitespace-nowrap font-mono">
                  <span 
                    v-if="!o.requiere_oc_hes"
                    class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                  >
                    ✓ No Requiere OC
                  </span>
                  <span 
                    v-else-if="o.tiene_oc"
                    class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40"
                  >
                    📎 {{ o.numero_oc_principal || 'OC Cargada' }}
                  </span>
                  <span 
                    v-else
                    class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  >
                    ⚠️ Requiere OC (Pendiente)
                  </span>
                </td>

                <!-- Estado Cobro / Facturación Inmediata -->
                <td class="py-2.5 px-3 text-center whitespace-nowrap">
                  <span 
                    v-if="o.factura_numero || Number(o.id_proyecto_estado) === 7"
                    class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  >
                    <span>✅</span>
                    <span>Facturado {{ o.factura_numero ? `F-${o.factura_numero}` : '' }}</span>
                  </span>
                  <span 
                    v-else-if="o.habilitado_facturar"
                    class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  >
                    <span>🟢</span>
                    <span>Listo Facturar Inmediato</span>
                  </span>
                  <span 
                    v-else-if="o.edp_flujo_v1?.estado === 'OBSERVADO_CONTABILIDAD'"
                    class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/40"
                  >
                    <span>⚠️</span>
                    <span>EDP Observado por Conta</span>
                  </span>
                  <span 
                    v-else-if="o.requiere_oc_hes && !o.tiene_oc && o.edp_flujo_v1?.firma_1_analista"
                    class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  >
                    <span>🟠</span>
                    <span>Esperando OC Cliente</span>
                  </span>
                  <span 
                    v-else
                    class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-slate-700/50 text-slate-300 border border-slate-600/40"
                  >
                    <span>⏳</span>
                    <span>Pendiente Emitir / Validar EDP</span>
                  </span>
                </td>

                <!-- Acción -->
                <td class="py-2.5 px-3 text-right whitespace-nowrap">
                  <div class="flex items-center justify-end gap-1.5">
                    <a
                      :href="getUrlPdfEdp(o.id_proyecto)"
                      target="_blank"
                      class="px-2 py-1 rounded bg-red-600/20 hover:bg-red-600 text-red-200 hover:text-white border border-red-500/40 text-[10px] font-mono font-bold transition-all flex items-center gap-1 shadow-sm"
                      title="Abrir PDF Oficial del EDP"
                      @click.stop
                    >
                      <span>📄 PDF</span>
                    </a>
                    <button 
                      @click="abrirCaratulaEdpPMO(o.id_proyecto)"
                      :disabled="cargandoCaratulaPMO"
                      class="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black rounded border border-amber-500/30 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      title="Gestionar y Firmar EDP (3 Pasos) / Subir OC / Registrar Factura"
                    >
                      <span>Gestionar EDP</span>
                      <span>➔</span>
                    </button>
                    <button 
                      @click="abrirProyecto(o.id_proyecto, 'liquidacion')"
                      class="p-1 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded border border-white/10 text-xs transition-colors cursor-pointer"
                      title="Abrir OT en CRM"
                    >
                      🏢
                    </button>
                  </div>
                </td>
              </tr>

              <tr v-if="pipelineEdpFiltradas.length === 0">
                <td colspan="6" class="text-center py-12 text-slate-500 italic">
                  No hay servicios pendientes en el pipeline de facturación.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Sub-vista 4: Matriz Global de 7 Hitos -->
      <div v-else-if="pmoVistaSecundaria === 'matriz_hitos'" class="bg-[#0f1629] border border-white/5 rounded-xl overflow-hidden shadow-xl">
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
        <div class="overflow-x-auto max-h-[calc(100vh-320px)]">
          <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-[#070b14] text-slate-400 uppercase text-[10px] tracking-wider font-bold border-b border-white/10 sticky top-0 z-10 select-none">
              <tr>
                <th class="py-2.5 px-3">OT / Negocio</th>
                <th class="py-2.5 px-3">Programación</th>
                <th class="py-2.5 px-3 text-center min-w-[130px]">Avance Global</th>
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
                  <div class="text-white">{{ formatFecha(getFechaInicioProyecto(p)) }}</div>
                  <div class="text-slate-400 text-[10px]">al {{ formatFecha(getFechaFinProyecto(p)) }}</div>
                </td>
                <!-- Avance Global -->
                <td class="py-2.5 px-3 whitespace-nowrap">
                  <div class="flex flex-col gap-1 w-28 mx-auto">
                    <div class="flex items-center justify-between text-[10px] font-mono font-bold">
                      <span :class="getAvanceNegocio(p).colorTexto">{{ getAvanceNegocio(p).porcentaje }}%</span>
                      <span class="text-[9px] text-slate-400 truncate max-w-[68px]" :title="getAvanceNegocio(p).etapa">{{ getAvanceNegocio(p).etapa }}</span>
                    </div>
                    <div class="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden border border-white/5">
                      <div 
                        class="h-full rounded-full transition-all duration-500"
                        :class="getAvanceNegocio(p).colorBarra"
                        :style="{ width: `${getAvanceNegocio(p).porcentaje}%` }"
                      ></div>
                    </div>
                  </div>
                </td>
                <!-- 1. OC Mandante -->
                <td class="py-2.5 px-3 text-center whitespace-nowrap">
                  <span v-if="getHitoOC(p).status === 'OK'" class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    ✓ {{ getHitoOC(p).label }}
                  </span>
                  <span v-else-if="getHitoOC(p).status === 'ASUME_EDP'" class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30" :title="getHitoOC(p).tooltip">
                    ⚖️ {{ getHitoOC(p).label }}
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
                <td colspan="11" class="text-center py-12 text-slate-500 italic">
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
      <!-- Tarjetas de Indicadores Superiores (KPIs Flota Gantt) -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div class="bg-[#0f1629] border border-cyan-500/25 rounded-xl p-3 shadow-sm">
          <div class="text-[10px] font-mono uppercase text-slate-400">Equipos con Movimiento</div>
          <div class="mt-1 flex items-baseline gap-2">
            <span class="text-xl font-black font-mono text-cyan-400">{{ kpisGantt.conMovimiento }}</span>
            <span class="text-xs font-mono text-slate-400">/ {{ kpisGantt.totalFlota }} ({{ kpisGantt.utilizacionPct }}%)</span>
          </div>
        </div>
        <div class="bg-[#0f1629] border border-white/10 rounded-xl p-3 shadow-sm">
          <div class="text-[10px] font-mono uppercase text-slate-400">Sin Movimiento en Período</div>
          <div class="mt-1 flex items-baseline gap-2">
            <span class="text-xl font-black font-mono text-amber-400">{{ kpisGantt.sinMovimiento }}</span>
            <span class="text-[10px] font-mono text-slate-500">{{ ocultarSinMovimientoGantt ? '(Ocultos)' : '(Visibles)' }}</span>
          </div>
        </div>
        <div class="bg-[#0f1629] border border-blue-500/25 rounded-xl p-3 shadow-sm">
          <div class="text-[10px] font-mono uppercase text-slate-400">OTs Activas en Período</div>
          <div class="mt-1 flex items-baseline gap-2">
            <span class="text-xl font-black font-mono text-blue-400">{{ kpisGantt.totalOtsPeriodo }}</span>
            <span class="text-[10px] font-mono text-slate-400">servicios</span>
          </div>
        </div>
        <div class="bg-[#0f1629] border border-purple-500/25 rounded-xl p-3 shadow-sm">
          <div class="text-[10px] font-mono uppercase text-slate-400">Horas Registradas (Reports)</div>
          <div class="mt-1 flex items-baseline gap-2">
            <span class="text-xl font-black font-mono text-purple-300">{{ kpisGantt.totalHorasReports }}</span>
            <span class="text-[10px] font-mono text-slate-400">hrs</span>
          </div>
        </div>
        <div class="bg-[#0f1629] border border-emerald-500/30 rounded-xl p-3 shadow-sm">
          <div class="text-[10px] font-mono uppercase text-slate-400">Total Devengado (Reports)</div>
          <div class="mt-1 flex items-baseline gap-2">
            <span class="text-xl font-black font-mono text-emerald-400">{{ formatMoneda(kpisGantt.totalDevengado) }}</span>
          </div>
        </div>
      </div>

      <!-- Controles del Gantt -->
      <div class="bg-[#0f1629] border border-white/5 rounded-xl p-3 flex flex-col gap-2.5 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-2.5">
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-bold text-slate-400">Ventana:</span>
              <div class="flex items-center bg-[#070b14] p-0.5 rounded-lg border border-white/10">
                <button 
                  v-for="dias in [7, 15, 30, 45]" 
                  :key="dias"
                  @click="seleccionarVentanaDiasGantt(dias)" 
                  class="px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer"
                  :class="rangoDiasGantt === dias && !modoRangoCustomGantt ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'"
                >
                  {{ dias }} Días
                </button>
              </div>
            </div>

            <!-- Filtro por Fechas Desde / Hasta -->
            <div class="flex items-center gap-1.5 bg-[#070b14] px-2.5 py-1 rounded-lg border border-white/10 text-[11px]">
              <span class="text-slate-400 font-bold">Desde:</span>
              <input
                v-model="fechaDesdeGantt"
                @change="onChangeFechasCustomGantt"
                type="date"
                class="bg-transparent text-white font-mono text-[11px] focus:outline-none cursor-pointer"
              />
              <span class="text-slate-600">➔</span>
              <span class="text-slate-400 font-bold">Hasta:</span>
              <input
                v-model="fechaHastaGantt"
                @change="onChangeFechasCustomGantt"
                type="date"
                class="bg-transparent text-white font-mono text-[11px] focus:outline-none cursor-pointer"
              />
            </div>

            <!-- Toggle Ocultar Sin Movimiento -->
            <button
              type="button"
              @click="ocultarSinMovimientoGantt = !ocultarSinMovimientoGantt"
              class="px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5"
              :class="ocultarSinMovimientoGantt
                ? 'bg-cyan-600/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                : 'bg-[#070b14] text-slate-400 border-white/10 hover:text-white'"
              title="Ocultar o mostrar equipos que no tienen OTs ni Reports en el rango de fechas"
            >
              <span>{{ ocultarSinMovimientoGantt ? '👁️ Ocultando sin movimiento' : '👁️ Mostrar todos' }}</span>
              <span class="px-1.5 py-0.2 rounded bg-black/30 font-mono text-[10px]">
                {{ ocultarSinMovimientoGantt ? kpisGantt.conMovimiento : kpisGantt.totalFlota }}
              </span>
            </button>

            <!-- Expandir / Colapsar Categorías -->
            <button
              type="button"
              @click="toggleTodasCategoriasGantt"
              class="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#070b14] hover:bg-white/5 text-slate-300 border border-white/10 transition-all cursor-pointer"
            >
              {{ todasCategoriasAbiertasGantt ? '🔼 Colapsar categorías' : '🔽 Expandir categorías' }}
            </button>

            <!-- Botón Actualizar Sólo Ícono -->
            <button 
              @click="cargarProyectos" 
              :disabled="cargandoProyectos"
              title="Actualizar cronograma de flota"
              class="p-2 bg-slate-800/80 hover:bg-blue-600/30 text-blue-400 hover:text-white rounded-lg border border-blue-500/30 flex items-center justify-center transition-all shadow-sm cursor-pointer"
            >
              <span :class="{'animate-spin': cargandoProyectos}">🔄</span>
            </button>
          </div>

          <div class="flex flex-wrap items-center gap-2.5">
            <!-- Filtro Categoría -->
            <select 
              v-model="filtroCategoriaGantt" 
              class="bg-[#070b14] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="TODOS">Todas las Categorías</option>
              <option value="GRUA">Grúas Telescópicas</option>
              <option value="CAMION_PLUMA">Camiones Pluma</option>
              <option value="TRANSPORTE">Camas Bajas / Tractos</option>
              <option value="MANIPULADOR">Horquillas / Manipuladores</option>
              <option value="ESCOLTA">Camionetas y Apoyo</option>
            </select>
            <!-- Buscador -->
            <input 
              v-model="busquedaGantt" 
              type="text" 
              placeholder="Buscar patente o modelo..." 
              class="bg-[#070b14] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 w-52 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        <!-- Leyenda de Estados Semántica y Contrastada -->
        <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5">
          <div class="flex flex-wrap items-center gap-3 text-[10px] text-slate-300">
            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded bg-blue-600 border border-blue-400"></span> Reservado / Prog.</span>
            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded bg-cyan-600 border border-cyan-400"></span> En Faena</span>
            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded bg-emerald-600 border border-emerald-400"></span> Ya Ejecutado</span>
            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded bg-slate-700 border border-slate-500 line-through"></span> Cancelado</span>
            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded bg-amber-600 border border-amber-400"></span> Mantenimiento</span>
            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded bg-red-600 border border-red-400 animate-pulse"></span> Colisión</span>
          </div>
          <div class="text-[11px] font-mono text-slate-400">
            Rango activo: <strong class="text-white">{{ diasGantt[0]?.fechaStr || '—' }}</strong> ➔ <strong class="text-white">{{ diasGantt[diasGantt.length - 1]?.fechaStr || '—' }}</strong> ({{ diasGantt.length }} días)
          </div>
        </div>
      </div>

      <!-- Tabla Gantt Agrupada por Categoría con Apertura a Demanda (Chevron) -->
      <div class="bg-[#0f1629] border border-white/5 rounded-xl overflow-hidden shadow-xl">
        <div class="overflow-x-auto max-h-[calc(100vh-310px)]">
          <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-[#070b14] text-slate-400 text-[10px] tracking-wider uppercase font-bold border-b border-white/10 sticky top-0 z-20 select-none">
              <tr>
                <th class="py-2.5 px-3 w-48 min-w-[192px] sticky left-0 bg-[#070b14] z-30 border-r border-white/10">Equipo / Flota</th>
                <th class="py-2.5 px-2 w-32 min-w-[128px] text-left sticky left-[192px] bg-[#070b14] z-30 border-r border-white/10">Últ. Mantenimiento</th>
                <th class="py-2.5 px-2 w-20 min-w-[80px] text-center sticky left-[320px] bg-[#070b14] z-30 border-r border-white/10">Inspecc.</th>
                <th class="py-2.5 px-2 w-28 min-w-[112px] text-right sticky left-[400px] bg-[#070b14] z-30 border-r border-white/10">Devengado ($)</th>
                <th class="py-2.5 px-2 w-20 min-w-[80px] text-center sticky left-[512px] bg-[#070b14] z-30 border-r border-white/10">OEE %</th>
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
              <template v-for="grupo in gruposCategoriaGantt" :key="grupo.id">
                <!-- Fila Cabecera de Categoría (Acordeón con Chevron) -->
                <tr
                  @click="toggleCategoriaGantt(grupo.id)"
                  class="bg-[#090e1d] hover:bg-[#111a33] cursor-pointer select-none border-y border-cyan-500/20 transition-colors"
                >
                  <td :colspan="diasGantt.length + 5" class="py-2 px-3 sticky left-0 z-20">
                    <div class="flex flex-wrap items-center justify-between gap-4">
                      <div class="flex items-center gap-2">
                        <span
                          class="text-cyan-400 font-mono text-xs transition-transform duration-200 inline-block"
                          :class="esCategoriaAbiertaGantt(grupo.id) ? 'rotate-90' : ''"
                        >
                          ▶
                        </span>
                        <span class="font-black text-white uppercase tracking-wider text-xs">{{ grupo.nombre }}</span>
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                          {{ grupo.equipos.length }} equipos · {{ grupo.conMovimientoCount }} con mov.
                        </span>
                      </div>
                      <div class="flex items-center gap-4 text-[11px] font-mono">
                        <span class="text-slate-400">Inspecc.: <strong class="text-blue-400">{{ grupo.totalInspecciones }}</strong></span>
                        <span class="text-slate-400">Hrs Reports: <strong class="text-purple-300">{{ grupo.horasReports }}h</strong></span>
                        <span class="text-slate-400">Devengado: <strong class="text-emerald-400">{{ formatMoneda(grupo.totalDevengado) }}</strong></span>
                        <span class="text-slate-400">OEE Prom.: <strong class="text-cyan-300">{{ grupo.oeePromedio }}%</strong></span>
                      </div>
                    </div>
                  </td>
                </tr>

                <!-- Filas de Equipos de la Categoría (se abren a demanda con el chevron) -->
                <tr
                  v-for="eq in (esCategoriaAbiertaGantt(grupo.id) ? grupo.equipos : [])"
                  :key="eq.id_equipo"
                  class="hover:bg-white/5 transition-colors"
                >
                  <!-- Columna 1: Equipo Info (Sticky Left 0) -->
                  <td class="py-2 px-3 w-48 min-w-[192px] sticky left-0 bg-[#0f1629] z-10 border-r border-white/10">
                    <div class="flex items-center gap-1.5">
                      <span class="w-2 h-2 rounded-full" :class="eq.estado === 'MANTENCION' ? 'bg-amber-500' : (eq.tieneMovimiento ? 'bg-cyan-400' : 'bg-emerald-500')"></span>
                      <span class="font-mono font-bold text-white text-xs">{{ eq.patente || 'S/P' }}</span>
                    </div>
                    <div class="text-[10px] text-slate-400 truncate max-w-[180px]" :title="eq.nombre_equipo || eq.modelo">{{ eq.nombre_equipo || eq.modelo }}</div>
                    <div class="text-[9px] text-slate-500 truncate max-w-[180px]">{{ eq.nombre_categoria || 'Maquinaria' }}</div>
                  </td>

                  <!-- Columna 2: Último Mantenimiento (Sticky Left 192px) -->
                  <td class="py-2 px-2 w-32 min-w-[128px] sticky left-[192px] bg-[#0f1629] z-10 border-r border-white/10">
                    <div class="text-[10px] font-mono font-bold truncate" :class="eq.ultimoMantenimientoClass" :title="eq.ultimoMantenimientoTooltip">
                      {{ eq.ultimoMantenimientoLabel }}
                    </div>
                    <div v-if="eq.ultimoMantenimientoSub" class="text-[9px] text-slate-500 font-mono truncate">
                      {{ eq.ultimoMantenimientoSub }}
                    </div>
                  </td>

                  <!-- Columna 3: Inspecciones Realizadas (Sticky Left 320px) -->
                  <td class="py-2 px-2 w-20 min-w-[80px] text-center sticky left-[320px] bg-[#0f1629] z-10 border-r border-white/10">
                    <span 
                      v-if="eq.cantInspecciones > 0"
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-sm"
                      :title="`${eq.cantInspecciones} inspección(es) o checklist(s) registrados`"
                    >
                      <span>📋</span> {{ eq.cantInspecciones }}
                    </span>
                    <span v-else class="text-slate-600 text-[10px] font-mono">0</span>
                  </td>

                  <!-- Columna 4: Devengado por Reports ($) (Sticky Left 400px) -->
                  <td class="py-2 px-2 w-28 min-w-[112px] text-right sticky left-[400px] bg-[#0f1629] z-10 border-r border-white/10">
                    <div 
                      v-if="eq.totalDevengado > 0" 
                      class="font-mono font-bold text-xs text-emerald-400"
                      :title="`Devengado según Reports (${eq.reportsCount} report(s), ${eq.horasReports} hrs): ${formatMoneda(eq.totalDevengado)}`"
                    >
                      {{ formatMoneda(eq.totalDevengado) }}
                    </div>
                    <div v-else class="text-slate-600 text-[10px] font-mono">$0</div>
                    <div v-if="eq.horasReports > 0" class="text-[9px] text-purple-300 font-mono">
                      {{ eq.horasReports }} hrs ({{ eq.reportsCount }} rep)
                    </div>
                  </td>

                  <!-- Columna 5: OEE % / Ocupación (Sticky Left 512px) -->
                  <td class="py-2 px-2 w-20 min-w-[80px] text-center sticky left-[512px] bg-[#0f1629] z-10 border-r border-white/10">
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

                  <!-- Celdas de Días del Cronograma -->
                  <td 
                    v-for="dia in diasGantt" 
                    :key="dia.fechaStr" 
                    class="p-0.5 text-center border-r border-white/5 relative"
                    :class="dia.esHoy ? 'bg-blue-950/20' : (dia.esFDS ? 'bg-white/[0.01]' : '')"
                  >
                    <div 
                      v-if="getEventoEquipoEnDia(eq, dia.fechaStr)"
                      @click="onClicEventoGantt(getEventoEquipoEnDia(eq, dia.fechaStr))"
                      class="h-10 w-full rounded flex flex-col items-center justify-center text-[9px] font-bold p-0.5 cursor-pointer hover:scale-105 hover:brightness-110 transition-all select-none"
                      :class="getEventoEquipoEnDia(eq, dia.fechaStr).classes"
                      :title="getEventoEquipoEnDia(eq, dia.fechaStr).tooltip"
                    >
                      <span class="truncate max-w-[48px]">{{ getEventoEquipoEnDia(eq, dia.fechaStr).label }}</span>
                      <span v-if="getEventoEquipoEnDia(eq, dia.fechaStr).subLabel" class="text-[7.5px] opacity-85 leading-none truncate max-w-[48px]">{{ getEventoEquipoEnDia(eq, dia.fechaStr).subLabel }}</span>
                      <span v-if="getEventoEquipoEnDia(eq, dia.fechaStr).esColision" class="text-[7.5px] animate-pulse">⚠️ Colisión</span>
                    </div>
                  </td>
                </tr>
              </template>

              <tr v-if="gruposCategoriaGantt.length === 0">
                <td :colspan="diasGantt.length + 5" class="text-center py-12 text-slate-500 italic">
                  No se encontraron equipos con movimiento para el rango y filtros seleccionados.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ========================================================== -->
    <!-- VISTA 4: PERSPECTIVA CONTABILIDAD (EMBUDO E2E Y REPORTES)  -->
    <!-- ========================================================== -->
    <PerspectivaContabilidad
      v-else-if="activeView === 'contabilidad'"
      @abrir-edp="(p) => abrirCaratulaEdpPMO(p.id_proyecto)"
      @abrir-its="(p) => abrirItsModalPMO(p.id_proyecto)"
      @abrir-facturacion="(p) => abrirProyecto(p.id_proyecto, 'liquidacion')"
      @descargar-pdf-edp="(idProyecto) => abrirPdfEdpEnPestana(idProyecto)"
    />

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

    <!-- Modal Visor de Report para Analista PMO -->
    <ModalVisorReport
      v-if="visorReportAbiertoPMO"
      :visible="visorReportAbiertoPMO"
      :report="reportSeleccionadoPMO"
      @close="visorReportAbiertoPMO = false"
      @report-validado="onReportValidadoPMO"
    />

    <!-- Modal ITS para Analista PMO -->
    <ModalITS
      v-if="itsModalAbiertoPMO"
      :visible="itsModalAbiertoPMO"
      :embedded="false"
      :id-proyecto="idProyectoItsPMO"
      @close="itsModalAbiertoPMO = false"
      @actualizado="onItsActualizadoPMO"
    />

    <!-- Modal Carátula Oficial de EDP (Edición exclusiva Tesorería / Pamela / PMO) -->
    <ModalCaratulaEDP
      v-if="modalCaratulaEDPAbiertoPMO"
      :visible="modalCaratulaEDPAbiertoPMO"
      :edp-data="edpDataPMO"
      :solo-lectura="false"
      @close="modalCaratulaEDPAbiertoPMO = false"
      @edp-actualizado="onEdpActualizadoPMO"
    />

    <!-- Modal Requerimiento Interno de Operaciones (Spec 87) -->
    <ModalRequerimientoInterno
      :visible="mostrarModalReqInterno"
      :flota-equipos="flotaEquiposMaster"
      :usuarios-map="mapaUsuarios"
      @close="mostrarModalReqInterno = false"
      @creado="onReqInternoCreado"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import GestorOportunidades from './CRM/GestorOportunidades.vue'
import ControlOperativoVivo from './Operaciones/ControlOperativoVivo.vue'
import AcreditacionDrawer from '../components/acreditacion/AcreditacionDrawer.vue'
import ModalVisorReport from '../components/Operaciones/ModalVisorReport.vue'
import ModalITS from '../components/Operaciones/ModalITS.vue'
import ModalCaratulaEDP from '../components/Operaciones/ModalCaratulaEDP.vue'
import ModalRequerimientoInterno from '../components/Operaciones/ModalRequerimientoInterno.vue'
import PerspectivaContabilidad from '../components/Operaciones/PerspectivaContabilidad.vue'
import apiAxios from '../services/api'
import { navStore } from '../stores/navStore'

const router = useRouter()
const route = useRoute()

// Estados y Modales de Control de Gestión / PMO
const visorReportAbiertoPMO = ref(false)
const reportSeleccionadoPMO = ref(null)

const itsModalAbiertoPMO = ref(false)
const idProyectoItsPMO = ref(null)

const modalCaratulaEDPAbiertoPMO = ref(false)
const edpDataPMO = ref(null)
const cargandoCaratulaPMO = ref(false)

const datosAnalistaPMO = ref({
  kpis: {
    reports_pendientes: 0,
    reports_con_ajustes: 0,
    ots_sin_its: 0,
    its_en_aprobacion: 0,
    edp_listos_facturar: 0
  },
  reports: [],
  ots_liquidacion: []
})

const cargandoAnalistaPMO = ref(false)
const pmoVistaSecundaria = ref('control_vivo') // 'control_vivo' | 'pendientes_reports' | 'pendientes_its' | 'pendientes_edp' | 'matriz_hitos'
const filtroReportsPMO = ref('')
const filtroItsPMO = ref('')
const filtroEstadoReportInbox = ref('todos') // 'todos' | 'pendientes' | 'validados' | 'con_ajustes'

// Perfil de Usuario y Scope RBAC
const currentUser = computed(() => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}')
  } catch (e) {
    return {}
  }
})

const freshUserRoles = ref([])

const cargarRolesFrescos = async () => {
  const uid = Number(currentUser.value?.id_user)
  if (!uid) return
  try {
    const [urRes, rRes] = await Promise.all([
      apiAxios.get('/servicio/leanglobal/obtenerUsuariosRoles'),
      apiAxios.get('/servicio/leanglobal/obtenerRoles')
    ])
    const rawUR = Array.isArray(urRes.data) ? urRes.data : (Array.isArray(urRes.data?.data) ? urRes.data.data : (urRes.data?.usuariosRoles || []))
    const rawR = Array.isArray(rRes.data) ? rRes.data : (Array.isArray(rRes.data?.data) ? rRes.data.data : (rRes.data?.roles || []))
    
    const misRoleIds = rawUR.filter(ur => Number(ur.id_user) === uid).map(ur => Number(ur.id_rol))
    const misRoleNames = rawR
      .filter(r => misRoleIds.includes(Number(r.id_rol)))
      .map(r => String(r.name_rol || r.code || r.codi_rol || '').trim().toUpperCase())
    
    if (misRoleNames.length > 0) {
      freshUserRoles.value = misRoleNames
      try {
        const u = JSON.parse(localStorage.getItem('user') || '{}')
        u.roles = misRoleNames
        localStorage.setItem('user', JSON.stringify(u))
      } catch (e) {}
    }
  } catch (err) {
    console.warn('No se pudieron refrescar los roles de usuario:', err.message)
  }
}

const userRoles = computed(() => {
  if (freshUserRoles.value.length > 0) return freshUserRoles.value
  const fromStorage = Array.isArray(currentUser.value?.roles) ? currentUser.value.roles : []
  return fromStorage.map(r => String(r).trim().toUpperCase())
})

const isComercialRestringido = computed(() => {
  const roles = userRoles.value
  const isAdminOrGlobal = roles.some(r => ['ADMIN', 'ADM_COM', 'COORD', 'GSP_PROG', 'GSP_APROB', 'GSP_CONTA'].includes(r)) || [1, 19, 46, 55].includes(Number(currentUser.value?.id_user))
  return !isAdminOrGlobal && roles.includes('COMERCIAL')
})

const scopeLabel = computed(() => {
  if (isComercialRestringido.value) {
    return {
      text: 'Scope: Mis Cotizaciones',
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      icon: '👤'
    }
  }
  const roles = userRoles.value
  if (roles.includes('COORD')) {
    return {
      text: 'Scope: Coordinación Operativa',
      color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      icon: '⚙️'
    }
  }
  return {
    text: 'Scope: Global (Todas las Empresas)',
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    icon: '🌐'
  }
})

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

// Helper unificado para determinar si un proyecto está operacionalmente finalizado o en contabilidad
const esFinalizadoOperacional = (p) => {
  if (!p) return false
  const st = Number(p.id_proyecto_estado)
  // Desestimado o cancelado no califica como completado
  if (st >= 99 || (st === 6 && p.motivo_desestimacion)) return false

  if (st === 7 || st === 8) return true
  if (st === 6 && !p.motivo_desestimacion) return true
  if (['EN_REVISION_CONTABILIDAD', 'CONCLUIDO'].includes(p.estado_its)) return true
  if (['FACTURADO_CONFORME', 'DEVENGADO_PENDIENTE_FACTURA'].includes(p.estado_financiero)) return true
  if (p.json_field?.its_v1?.concluido || p.json_field?.ejecucion_v1?.preparacion_salida?.ejecucion_finalizada) return true
  return false
}

const cargandoProyectos = ref(false)

const cargarProyectos = async () => {
  cargandoProyectos.value = true
  try {
    await cargarRolesFrescos()
    const { data } = await apiAxios.get('/proyectos')
    let proyectos = data.proyectos || []

    // Filtro determinista de Scope Comercial en Frontend
    if (isComercialRestringido.value) {
      const myUid = Number(currentUser.value?.id_user)
      proyectos = proyectos.filter(p => Number(p.id_usuario_creacion) === myUid)
    }

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
      if (st !== 5 || esFinalizadoOperacional(p)) return false
      return !estaEnFaena(p)
    })

    // Columna 5: En Ejecución / Faena (Ruta, Izaje y Reports) - Operaciones activas
    maniobra.value = proyectos.filter(p => {
      const st = Number(p.id_proyecto_estado)
      if (esFinalizadoOperacional(p)) return false
      if (st >= 99 || (st === 6 && p.motivo_desestimacion)) return false
      if (st === 5) {
        return estaEnFaena(p)
      }
      return false
    })

    // Columna 6: Finalizado / Contabilidad (ITS en Revisión Contabilidad, Concluido, EDP, Facturación)
    completados.value    = proyectos.filter(p => esFinalizadoOperacional(p))

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
  } finally {
    cargandoProyectos.value = false
  }
}

const cargarFlotaMaster = async () => {
  try {
    const [resEqSettled, resMntSettled] = await Promise.allSettled([
      apiAxios.get('/tequ-equipos'),
      apiAxios.get('/mantenimiento/flota')
    ])
    const res = resEqSettled.status === 'fulfilled' ? resEqSettled.value?.data : null
    const raw = res?.data || res || []

    const resMnt = resMntSettled.status === 'fulfilled' ? resMntSettled.value?.data : null
    const rawMnt = resMnt?.data || resMnt?.equipos || resMnt || []
    const mntMap = new Map()
    if (Array.isArray(rawMnt)) {
      rawMnt.forEach(m => {
        if (m.id_equipo) mntMap.set(Number(m.id_equipo), m)
      })
    }

    if (Array.isArray(raw) && raw.length > 0) {
      flotaEquiposMaster.value = raw.map(e => {
        const idEq = Number(e.id_equipo || e.id)
        const mnt = mntMap.get(idEq) || {}
        return {
          ...mnt,
          ...e,
          id_equipo: idEq,
          patente: e.patente || e.ppu || 'S/P',
          nombre_equipo: e.nombre_equipo || `${e.marca || ''} ${e.modelo || ''}`.trim() || e.tipo_equipo || 'Equipo',
          modelo: e.modelo || '',
          nombre_categoria: e.nombre_categoria || e.tipo_equipo || e.tipo || 'Maquinaria',
          estado: e.estado || mnt.estado_operativo || 'DISPONIBLE',
          cant_inspecciones: Number(e.cant_inspecciones || 0),
          mnt_info: mnt
        }
      })
    }
  } catch (err) {
    console.warn('Error cargando flota de equipos:', err)
  }
}

// -------------------------------------------------------------
// BANDEJA ANALISTA DE CONTROL DE GESTIÓN / PMO
// -------------------------------------------------------------
const cargarPendientesAnalista = async () => {
  try {
    cargandoAnalistaPMO.value = true
    const { data } = await apiAxios.get('/operaciones/report/pendientes-analista')
    if (data?.success && data?.data) {
      datosAnalistaPMO.value = data.data
    }
  } catch (err) {
    console.error('Error al cargar pendientes analista PMO:', err)
  } finally {
    cargandoAnalistaPMO.value = false
  }
}

const getUrlStoragePdf = (idDoc) => {
  if (!idDoc) return '#'
  const base = (apiAxios.defaults.baseURL || '').replace(/\/$/, '')
  return `${base}/v1/storage/view/${idDoc}`
}

const getUrlPdfIts = (idProyecto) => {
  if (!idProyecto) return '#'
  const base = (apiAxios.defaults.baseURL || '').replace(/\/$/, '')
  return `${base}/operaciones/its/preview-pdf/${idProyecto}`
}

const getUrlPdfEdp = (idProyecto) => {
  if (!idProyecto) return '#'
  const base = (apiAxios.defaults.baseURL || '').replace(/\/$/, '')
  return `${base}/operaciones/edp/proyecto/${idProyecto}/pdf`
}

const abrirPdfEdpEnPestana = (idProyecto) => {
  const url = getUrlPdfEdp(idProyecto)
  if (url && url !== '#') {
    window.open(url, '_blank')
  }
}

const abrirVisorReportPMO = (rep) => {
  reportSeleccionadoPMO.value = rep
  visorReportAbiertoPMO.value = true
}

const onReportValidadoPMO = () => {
  cargarPendientesAnalista()
  cargarProyectos()
}

const abrirItsModalPMO = (idProyecto) => {
  idProyectoItsPMO.value = idProyecto
  itsModalAbiertoPMO.value = true
}

const onItsActualizadoPMO = () => {
  cargarPendientesAnalista()
  cargarProyectos()
}

const abrirCaratulaEdpPMO = async (idProyecto) => {
  if (!idProyecto) return
  cargandoCaratulaPMO.value = true
  try {
    const { data } = await apiAxios.get(`/operaciones/report/edp/resumen/${idProyecto}`)
    if (data?.success) {
      edpDataPMO.value = data.data
      modalCaratulaEDPAbiertoPMO.value = true
    } else {
      alert('No se pudo cargar el resumen del EDP: ' + (data?.message || 'Error desconocido'))
    }
  } catch (err) {
    console.error('Error al abrir Carátula EDP:', err)
    alert('Error al obtener datos del EDP: ' + (err.response?.data?.message || err.message))
  } finally {
    cargandoCaratulaPMO.value = false
  }
}

const onEdpActualizadoPMO = async () => {
  await cargarPendientesAnalista()
  if (edpDataPMO.value?.id_proyecto) {
    try {
      const { data } = await apiAxios.get(`/operaciones/report/edp/resumen/${edpDataPMO.value.id_proyecto}`)
      if (data?.success) {
        edpDataPMO.value = data.data
      }
    } catch (e) {
      console.error('Error al refrescar EDP en modal:', e)
    }
  }
}

const reportsFiltradosInbox = computed(() => {
  let list = datosAnalistaPMO.value.reports || []
  if (filtroEstadoReportInbox.value === 'pendientes') {
    list = list.filter(r => r.estado_reporte === 'PENDIENTE_VALIDACION')
  } else if (filtroEstadoReportInbox.value === 'validados') {
    list = list.filter(r => r.estado_reporte === 'VALIDADO_ANALISTA')
  } else if (filtroEstadoReportInbox.value === 'con_ajustes') {
    list = list.filter(r => r.ajustes_analista?.modificado)
  }

  if (filtroReportsPMO.value.trim()) {
    const q = filtroReportsPMO.value.toLowerCase()
    list = list.filter(r => 
      (r.codi_proyecto || '').toLowerCase().includes(q) ||
      (r.cliente_nombre || '').toLowerCase().includes(q) ||
      (r.obra_nombre || '').toLowerCase().includes(q) ||
      (r.operador_nombre || '').toLowerCase().includes(q) ||
      (r.equipo_patente || '').toLowerCase().includes(q)
    )
  }
  return list
})

const otsReportsColapsadasPMO = ref({})

const esOtReportAbiertaPMO = (idProyecto) => {
  return !otsReportsColapsadasPMO.value[idProyecto]
}

const toggleOtReportPMO = (idProyecto) => {
  otsReportsColapsadasPMO.value = {
    ...otsReportsColapsadasPMO.value,
    [idProyecto]: !otsReportsColapsadasPMO.value[idProyecto]
  }
}

const gruposReportsPorOT = computed(() => {
  const map = new Map()
  for (const r of reportsFiltradosInbox.value) {
    const idPry = Number(r.id_proyecto || 0)
    if (!map.has(idPry)) {
      map.set(idPry, {
        id_proyecto: idPry,
        codi_proyecto: r.codi_proyecto || `OT-${idPry}`,
        cliente_nombre: r.cliente_nombre || 'Cliente Mandante',
        obra_nombre: r.obra_nombre || r.nombre_proyecto || 'Faena',
        reports: []
      })
    }
    map.get(idPry).reports.push(r)
  }

  const grupos = Array.from(map.values()).map(g => {
    g.reports.sort((a, b) => {
      const fa = String(a.fecha_reporte_fmt || a.fecha_reporte || '').slice(0, 10)
      const fb = String(b.fecha_reporte_fmt || b.fecha_reporte || '').slice(0, 10)
      if (fa !== fb) return fa.localeCompare(fb)
      return Number(a.dia_correlativo || 0) - Number(b.dia_correlativo || 0)
    })
    const pendientesCount = g.reports.filter(r => r.estado_reporte === 'PENDIENTE_VALIDACION').length
    const validadosCount = g.reports.length - pendientesCount
    const totalHorasFacturables = Math.round(g.reports.reduce((acc, r) => acc + Number(r.horas_facturables || 0), 0) * 10) / 10
    const totalHorasOperadas = Math.round(g.reports.reduce((acc, r) => acc + Number(r.horas_operadas || 0), 0) * 10) / 10
    const primeraFecha = g.reports[0]?.fecha_reporte
    const ultimaFecha = g.reports[g.reports.length - 1]?.fecha_reporte
    const fIniLabel = formatFecha(primeraFecha)
    const fFinLabel = formatFecha(ultimaFecha)
    const rangoFechasLabel = fIniLabel === fFinLabel ? fIniLabel : `${fIniLabel} al ${fFinLabel}`
    const maxFechaIso = String(ultimaFecha || '').slice(0, 10)

    return {
      ...g,
      pendientesCount,
      validadosCount,
      totalHorasFacturables,
      totalHorasOperadas,
      rangoFechasLabel,
      maxFechaIso
    }
  })

  return grupos.sort((a, b) => {
    if (a.pendientesCount > 0 && b.pendientesCount === 0) return -1
    if (a.pendientesCount === 0 && b.pendientesCount > 0) return 1
    if (b.maxFechaIso !== a.maxFechaIso) return b.maxFechaIso.localeCompare(a.maxFechaIso)
    return b.id_proyecto - a.id_proyecto
  })
})

const todasOtsReportsAbiertas = computed(() => {
  if (gruposReportsPorOT.value.length === 0) return false
  return gruposReportsPorOT.value.every(g => esOtReportAbiertaPMO(g.id_proyecto))
})

const toggleTodasOtsReportsPMO = () => {
  const colapsar = todasOtsReportsAbiertas.value
  const next = { ...otsReportsColapsadasPMO.value }
  gruposReportsPorOT.value.forEach(g => {
    next[g.id_proyecto] = colapsar
  })
  otsReportsColapsadasPMO.value = next
}

const otsFiltradasPMO = computed(() => {
  let list = datosAnalistaPMO.value.ots_liquidacion || []
  if (filtroItsPMO.value.trim()) {
    const q = filtroItsPMO.value.toLowerCase()
    list = list.filter(o => 
      (o.codi_proyecto || '').toLowerCase().includes(q) ||
      (o.cliente_nombre || '').toLowerCase().includes(q) ||
      (o.obra_nombre || '').toLowerCase().includes(q) ||
      (o.folio_its || '').toLowerCase().includes(q)
    )
  }
  return list
})

const formatMoneda = (val) => {
  return '$' + Math.round(Number(val) || 0).toLocaleString('es-CL')
}

const pipelineEdpFiltradas = computed(() => {
  let list = datosAnalistaPMO.value.ots_liquidacion || []
  return list
})

const getEstadoItsBadge = (estado) => {
  if (!estado) return { label: 'Sin ITS Creado', classes: 'bg-slate-700/40 text-slate-400 border-slate-600/40' }
  switch (estado) {
    case 'BORRADOR':
      return { label: 'Paso 1: Elaboración Analista', classes: 'bg-amber-500/20 text-amber-300 border-amber-500/40' }
    case 'EN_REVISION_OPERACIONES':
      return { label: 'Paso 2: V°B° Operaciones', classes: 'bg-purple-500/20 text-purple-300 border-purple-500/40 animate-pulse' }
    case 'EN_REVISION_CONTABILIDAD':
      return { label: 'Paso 3: Recep. Contabilidad', classes: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 animate-pulse' }
    case 'CONCLUIDO':
      return { label: '✓ Concluido / EDP Liberado', classes: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold' }
    default:
      return { label: estado, classes: 'bg-slate-700/40 text-slate-400 border-slate-600/40' }
  }
}

watch(() => activeView.value, (newView) => {
  if (newView === 'pmo' || newView === 'gantt') {
    cargarPendientesAnalista()
  }
})

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

const mostrarModalReqInterno = ref(false)
const filtroTipoProyecto = ref('TODOS') // 'TODOS' | 'COMERCIALES' | 'INTERNOS'

const esProyectoInterno = (p) => {
  if (!p) return false
  return Boolean(
    p.es_interno === true ||
    p.json_field?.crm_v1?.es_requerimiento_interno === true ||
    p.json_field?.crm_v1?.es_interno === true ||
    String(p.codi_proyecto || '').toUpperCase().startsWith('INT-')
  )
}

const getOrigenInterno = (p) => {
  return p?.sucursal_origen || p?.json_field?.crm_v1?.sucursal_origen || p?.json_field?.ejecucion_v1?.sucursal_origen || 'Origen GSP'
}

const getDestinoInterno = (p) => {
  return p?.sucursal_destino || p?.json_field?.crm_v1?.sucursal_destino || p?.json_field?.ejecucion_v1?.sucursal_destino || p?.json_field?.crm_v1?.obra_nombre || 'Destino GSP'
}

const getEstadoVbGerencia = (p) => {
  if (!p || esProyectoInterno(p)) return null
  const rawEstado = (
    p.estado_vb_gerencia ||
    p.json_field?.crm_v1?.estado_vb_gerencia ||
    p.json_field?.crm_v1?.aprobacion_gerencia?.estado ||
    ''
  ).toUpperCase().trim()

  if (!rawEstado || rawEstado === 'NO_REQUERIDO') return null

  const obs = p.observacion_gerencia || p.json_field?.crm_v1?.aprobacion_gerencia?.observacion || ''

  if (rawEstado === 'APROBADO' || rawEstado === 'OK') {
    return {
      label: '🟢 V°B° Omar OK',
      classes: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      tooltip: obs ? `Aprobado por Gerencia: ${obs}` : 'Aprobado por Gerencia (Omar)'
    }
  }
  if (rawEstado === 'APROBADO_CON_OBS' || rawEstado === 'OBSERVADO') {
    return {
      label: '🟡 V°B° Omar c/Obs',
      classes: 'bg-amber-500/25 text-amber-200 border-amber-400/50',
      tooltip: obs ? `Observación de Omar: ${obs}` : 'Aprobado con observaciones por Gerencia'
    }
  }
  if (rawEstado === 'RECHAZADO') {
    return {
      label: '🔴 Rechazado Gerencia',
      classes: 'bg-red-500/20 text-red-300 border-red-500/40',
      tooltip: obs ? `Motivo rechazo Omar: ${obs}` : 'Rechazado por Gerencia'
    }
  }
  return {
    label: '⏳ V°B° Omar Pendiente',
    classes: 'bg-amber-500/15 text-amber-300 border-amber-500/35 animate-pulse',
    tooltip: 'Pendiente de visación móvil de Gerencia (Omar)'
  }
}

const onReqInternoCreado = async () => {
  await cargarProyectos()
}

const coincideBusqueda = (p, query) => {
  if (filtroTipoProyecto.value === 'INTERNOS' && !esProyectoInterno(p)) return false
  if (filtroTipoProyecto.value === 'COMERCIALES' && esProyectoInterno(p)) return false

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
  const orig = (getOrigenInterno(p) || '').toLowerCase()
  const dest = (getDestinoInterno(p) || '').toLowerCase()
  
  const grua = (p.json_field?.ejecucion_v1?.patente_grua || '').toLowerCase()
  const operador = (p.json_field?.ejecucion_v1?.operador_nombre || '').toLowerCase()

  return cod.includes(q) || idPry.includes(q) || codMaestro.includes(q) || nLic.includes(q) ||
         clt.includes(q) || contacto.includes(q) ||
         vendedor.includes(q) ||
         proy.includes(q) || obra.includes(q) || ciudad.includes(q) ||
         orig.includes(q) || dest.includes(q) ||
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

const getFechaInicioProyecto = (p) => {
  return p.fecha_plan_ini || 
         p.json_field?.crm_v1?.fecha_hora_inicio || 
         p.json_field?.crm_v1?.lineas_servicio?.[0]?.fecha_plan_ini || 
         p.json_field?.ejecucion_v1?.fecha_salida_plan || 
         null
}

const getFechaFinProyecto = (p) => {
  return p.fecha_plan_fin || 
         p.json_field?.crm_v1?.fecha_hora_termino || 
         p.json_field?.crm_v1?.lineas_servicio?.[0]?.fecha_plan_fin || 
         p.json_field?.ejecucion_v1?.fecha_fin_plan || 
         null
}

const getHitoOC = (p) => {
  const crm = p.json_field?.crm_v1 || {}
  const reqOC = crm.requiere_oc_hes === true || crm.requiere_oc === true
  const nroOC = crm.orden_compra || crm.nro_oc || crm.ordenes_compra?.[0]?.nro_oc || crm.ordenes_compra?.[0]?.numero_oc
  const liq = getLiquidacionProyecto(p.id_proyecto)
  const repList = getReportsProyecto(p.id_proyecto)
  const st = Number(p.id_proyecto_estado)

  if (nroOC) {
    return { status: 'OK', label: `OC ${nroOC}`, tooltip: `OC Mandante Registrada: ${nroOC}` }
  }

  // Si la faena ya concluyó y está en liquidación / facturación:
  // Aplica protocolo "Cliente Sin OC (Asumir EDP)" de GSP
  if (liq?.estado_its === 'CONCLUIDO' || st >= 6 || esFinalizadoOperacional(p) || repList.length > 0) {
    if (!reqOC) {
      return { status: 'OK', label: 'No Requerida', tooltip: 'Mandante no exige OC formal previa' }
    }
    return { 
      status: 'ASUME_EDP', 
      label: 'Asumir EDP (S/OC)', 
      tooltip: 'Servicio concluido sin OC formal. Habilitado para facturación bajo glosa comercial "Asume EDP" o adjuntar OC tardía.' 
    }
  }

  if (!reqOC) {
    return { status: 'NONE', label: 'No Requerida', tooltip: 'El mandante no exige OC/HES previa' }
  }

  const fechaIni = getFechaInicioProyecto(p) ? new Date(getFechaInicioProyecto(p)) : null
  const ahora = new Date()
  const horasFaltantes = fechaIni ? (fechaIni - ahora) / (1000 * 60 * 60) : 999

  if (st >= 5 || horasFaltantes <= 48) {
    return { 
      status: 'CRITICAL', 
      label: 'Falta OC', 
      tooltip: '¡Alerta! Servicio a menos de 48h sin OC Mandante cargada.' 
    }
  }
  return { status: 'PENDING', label: 'Pendiente', tooltip: 'Esperando OC de mandante' }
}

const getHitoValidacion = (p) => {
  const st = Number(p.id_proyecto_estado)
  const ej = p.json_field?.ejecucion_v1 || {}
  const liq = getLiquidacionProyecto(p.id_proyecto)
  const repList = getReportsProyecto(p.id_proyecto)

  if (st >= 4 || ej.validacion_completada || liq?.estado_its === 'CONCLUIDO' || repList.length > 0) {
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
  const liq = getLiquidacionProyecto(p.id_proyecto)
  const repList = getReportsProyecto(p.id_proyecto)

  // 1. Obtener desde reportes reales emitidos en faena
  let grua = repList[0]?.equipo_patente || null
  let operador = repList[0]?.operador_nombre || null

  // 2. Si no viene en reports, buscar por id_equipo en flota master
  if (!grua) {
    const idEq = ej.equipo_id || crm.lineas_servicio?.[0]?.equipo_asignado_id || ej.recursos_asignados?.equipos?.[0]?.id_equipo || ej.recursos_asignados?.equipos?.[0]?.id
    if (idEq && flotaEquiposMaster.value.length > 0) {
      const eq = flotaEquiposMaster.value.find(e => Number(e.id_equipo) === Number(idEq))
      if (eq) grua = eq.patente || eq.nombre_equipo
    }
  }
  if (!grua) {
    grua = ej.patente_grua || crm.lineas_servicio?.find(l => l.patente)?.patente || null
  }

  // 3. Obtener operador desde catalogo de usuarios o tripulacion
  if (!operador) {
    const idOp = ej.operador_id || crm.lineas_servicio?.[0]?.operador_asignado_id || ej.tripulacion_asignada?.[0]?.id_user
    if (idOp && mapaUsuarios.value.has(Number(idOp))) {
      operador = mapaUsuarios.value.get(Number(idOp))
    } else {
      operador = ej.operador_nombre || ej.recursos_asignados?.personas?.[0]?.nombre_persona || null
    }
  }

  // 4. Si el servicio ya operó en faena (tiene reports validados o ITS concluido)
  if (liq?.estado_its === 'CONCLUIDO' || st >= 6 || esFinalizadoOperacional(p) || repList.length > 0) {
    return {
      status: 'OK',
      equipo: grua || 'Equipo Operativo',
      operador: operador || 'Operador en Faena'
    }
  }

  if (st >= 4 && (grua || operador)) {
    return { status: 'OK', equipo: grua || 'Asignado', operador: operador || 'Operador Asignado' }
  }

  return { status: 'PENDING', equipo: 'S/P', operador: 'Sin Asignar' }
}

const getHitoAcreditacion = (p) => {
  const crm = p.json_field?.crm_v1 || {}
  const liq = getLiquidacionProyecto(p.id_proyecto)
  const repList = getReportsProyecto(p.id_proyecto)
  const st = Number(p.id_proyecto_estado)

  // 1. Si el cliente NO exige acreditación
  if (crm.requiere_acreditacion === false) {
    return { label: 'No Requerida', classes: 'text-slate-500', tooltip: 'El mandante no exige dossier de acreditación' }
  }

  const pct = calcularPorcentajeAcreditacion(p)
  if (pct === 100) {
    return { label: '100% OK', classes: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold', tooltip: 'Dossier Acreditado 100%' }
  }

  // 2. Si el servicio ya se ejecutó en terreno o concluyó:
  // El control de portería ya fue superado; no debe generar alarma crítica de detención.
  if (liq?.estado_its === 'CONCLUIDO' || st >= 6 || esFinalizadoOperacional(p) || repList.length > 0) {
    return { 
      label: `Superada (${pct}%)`, 
      classes: 'bg-white/5 text-slate-400 border border-white/10 font-mono', 
      tooltip: `Faena ejecutada en terreno. Acceso de portería superado históricamente (${pct}% documental registrado).` 
    }
  }

  // 3. En preparación con salida pendiente
  if (st >= 5) {
    return { 
      label: `${pct}% Crítico`, 
      classes: 'bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse font-bold', 
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
  const liq = getLiquidacionProyecto(p.id_proyecto)
  const repList = getReportsProyecto(p.id_proyecto)

  // 1. Si la faena ya concluyó o tiene reports en terreno
  if (liq?.estado_its === 'CONCLUIDO' || st >= 6 || esFinalizadoOperacional(p) || repList.length > 0) {
    return { 
      label: '✓ Completado', 
      classes: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold', 
      tooltip: 'Salida de patio ejecutada y faena en terreno completada' 
    }
  }

  const viajeIniciado = ej.viaje_iniciado || ej.subtab_activa === 'reports' || ej.subtab_activa === 'despacho'
  if (st >= 6 || viajeIniciado) {
    return { label: 'En Ruta / Obra', classes: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold', tooltip: 'Convoy en trayecto o faena activa' }
  }

  if (st === 5) {
    const ahora = new Date()
    const iniPlan = getFechaInicioProyecto(p) ? new Date(getFechaInicioProyecto(p)) : null
    if (iniPlan && ahora > iniPlan) {
      const desfaseHoras = Math.round((ahora - iniPlan) / (1000 * 60 * 60))
      return { 
        label: `Retraso (+${desfaseHoras}h)`, 
        classes: 'bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse font-bold', 
        tooltip: `Hora programada superada hace ${desfaseHoras} horas sin salida registrada` 
      }
    }
    return { label: 'En Preparación', classes: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20', tooltip: 'Preparación de patio y checklist' }
  }

  return { label: 'Programado', classes: 'bg-white/5 text-slate-500 border border-white/5', tooltip: 'Esperando fecha de inicio' }
}

const getLiquidacionProyecto = (idProyecto) => {
  if (!idProyecto || !datosAnalistaPMO.value?.ots_liquidacion) return null
  return datosAnalistaPMO.value.ots_liquidacion.find(o => Number(o.id_proyecto) === Number(idProyecto))
}

const getReportsProyecto = (idProyecto) => {
  if (!idProyecto || !datosAnalistaPMO.value?.reports) return []
  return datosAnalistaPMO.value.reports.filter(r => Number(r.id_proyecto) === Number(idProyecto))
}

const getHitoReport = (p) => {
  const st = Number(p.id_proyecto_estado)
  const ej = p.json_field?.ejecucion_v1 || {}
  const liq = getLiquidacionProyecto(p.id_proyecto)
  const repList = getReportsProyecto(p.id_proyecto)
  const reportsCount = repList.length > 0 ? repList.length : (ej.reports?.length || ej.dossier_documentos?.filter(d => d.tipo_documento === 'REPORT_DIARIO')?.length || 0)
  
  if (st >= 6 || esFinalizadoOperacional(p) || liq?.estado_its === 'CONCLUIDO') {
    return { 
      label: `Concluido (${reportsCount || 3})`, 
      classes: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold', 
      tooltip: 'Reports 100% validados e ITS Concluido' 
    }
  }

  if (liq?.id_its) {
    return { 
      label: `ITS ${liq.folio_its ? 'Generado' : 'en Proceso'}`, 
      classes: 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold', 
      tooltip: 'Reports liquidados en proceso de ITS' 
    }
  }

  const pendientes = repList.filter(r => r.estado_reporte === 'PENDIENTE_VALIDACION').length
  const validados = repList.filter(r => r.estado_reporte === 'VALIDADO_ANALISTA').length

  if (validados > 0 && pendientes === 0) {
    return {
      label: `✓ Validados (${validados})`,
      classes: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold',
      tooltip: `${validados} reports auditados y validados conformes`
    }
  }

  if (pendientes > 0) {
    return {
      label: `Auditar (${pendientes})`,
      classes: 'bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse font-bold',
      tooltip: `${pendientes} reports pendientes de validación por Analista`
    }
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
  const liq = getLiquidacionProyecto(p.id_proyecto)

  if (dte || p.estado_financiero === 'FACTURADO_CONFORME') {
    return { label: dte ? `DTE #${dte}` : 'Facturado Conforme', classes: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold' }
  }
  if (liq?.estado_its === 'CONCLUIDO' || p.estado_financiero === 'DEVENGADO_PENDIENTE_FACTURA' || p.estado_its === 'CONCLUIDO') {
    return { label: '🔓 EDP Liberado', classes: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold shadow-sm' }
  }
  if (st >= 6 || esFinalizadoOperacional(p)) {
    return { label: 'Pend. Facturar', classes: 'bg-purple-500/15 text-purple-400 border border-purple-500/30 animate-pulse font-bold' }
  }
  if (liq?.id_its || p.id_its) {
    return { label: 'Firmas ITS', classes: 'bg-amber-500/15 text-amber-300 border border-amber-500/30' }
  }
  return { label: 'En Curso', classes: 'text-slate-600' }
}

const getAvanceNegocio = (p) => {
  let puntos = 0
  const totalPuntos = 7

  // Hito 1: OC Mandante
  const oc = getHitoOC(p)
  if (oc.status === 'OK' || oc.status === 'NONE') puntos += 1
  else if (oc.status === 'ASUME_EDP') puntos += 0.85
  else if (oc.status === 'PENDING') puntos += 0.5

  // Hito 2: Validación Operacional
  const val = getHitoValidacion(p)
  if (val.status === 'OK') puntos += 1

  // Hito 3: Asignación
  const asig = getHitoAsignacion(p)
  if (asig.status === 'OK') puntos += 1

  // Hito 4: Acreditación
  const acr = getHitoAcreditacion(p)
  if (acr.label.includes('No Requerida') || acr.label.includes('100%') || acr.label.includes('Superada')) {
    puntos += 1
  } else {
    const pctAcr = calcularPorcentajeAcreditacion(p)
    if (pctAcr > 0) puntos += (pctAcr / 100)
  }

  // Hito 5: Salida Patio
  const sal = getHitoSalidaPatio(p)
  if (sal.label.includes('Ruta') || sal.label.includes('Faena') || sal.label.includes('Completado') || Number(p.id_proyecto_estado) >= 6) {
    puntos += 1
  } else if (sal.label.includes('Preparación')) {
    puntos += 0.5
  }

  // Hito 6: Reports / Cierre Operativo
  const rep = getHitoReport(p)
  const liq = getLiquidacionProyecto(p.id_proyecto)
  if (liq?.estado_its === 'CONCLUIDO' || Number(p.id_proyecto_estado) >= 6 || esFinalizadoOperacional(p) || rep.label.includes('Concluido')) {
    puntos += 1
  } else if (rep.label.includes('Validados') || rep.label.includes('Al Día')) {
    puntos += 0.8
  } else if (rep.label.includes('Faena') || rep.label.includes('Auditar')) {
    puntos += 0.4
  }

  // Hito 7: Facturación & EDP
  const fact = getHitoFacturacion(p)
  if (fact.label.includes('DTE')) {
    puntos += 1
  } else if (liq?.estado_its === 'CONCLUIDO' || fact.label.includes('EDP Liberado')) {
    puntos += 0.85
  } else if (liq?.id_its) {
    puntos += 0.4
  }

  const porcentaje = Math.min(100, Math.round((puntos / totalPuntos) * 100))

  let etapa = 'Planificación'
  let colorBarra = 'bg-slate-500'
  let colorTexto = 'text-slate-400'

  if (porcentaje >= 100) {
    etapa = 'Facturado / Fin'
    colorBarra = 'bg-emerald-500'
    colorTexto = 'text-emerald-300'
  } else if (porcentaje >= 80) {
    etapa = 'Listo Facturar'
    colorBarra = 'bg-gradient-to-r from-blue-500 to-emerald-400'
    colorTexto = 'text-emerald-400'
  } else if (porcentaje >= 60) {
    etapa = 'Operación Faena'
    colorBarra = 'bg-blue-500'
    colorTexto = 'text-blue-400'
  } else if (porcentaje >= 40) {
    etapa = 'Acreditación/Patio'
    colorBarra = 'bg-cyan-500'
    colorTexto = 'text-cyan-400'
  } else if (porcentaje >= 20) {
    etapa = 'Validación Op.'
    colorBarra = 'bg-amber-500'
    colorTexto = 'text-amber-400'
  }

  return {
    porcentaje,
    etapa,
    colorBarra,
    colorTexto
  }
}

const getSubTabSugeridaPMO = (p) => {
  if (esFinalizadoOperacional(p)) return 'liquidacion'
  const st = Number(p.id_proyecto_estado)
  if (st <= 2) return 'comercial'
  if (st === 3) return 'validacion'
  if (st === 4) return 'asignacion'
  if (st === 5) return 'preparacion_salida'
  return 'reports'
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
    const esFin = esFinalizadoOperacional(p)
    const estaFacturado = p.estado_financiero === 'FACTURADO_CONFORME' || p.json_field?.facturacion_v1?.nro_dte || p.json_field?.crm_v1?.dte
    return esFin && !estaFacturado
  }).length
})

// -------------------------------------------------------------
// LÓGICA DE LA PERSPECTIVA TEMPORAL DE FLOTA (GANTT & PRODUCTIVIDAD)
// -------------------------------------------------------------
const rangoDiasGantt = ref(15)
const modoRangoCustomGantt = ref(false)
const filtroCategoriaGantt = ref('TODOS')
const busquedaGantt = ref('')
const ocultarSinMovimientoGantt = ref(true)

const formatDateIsoLocal = (d) => {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const calcularRangoInicialGantt = (diasTotal) => {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const diasAtras = Math.min(6, Math.floor(diasTotal * 0.3))
  const ini = new Date(hoy)
  ini.setDate(hoy.getDate() - diasAtras)
  const fin = new Date(ini)
  fin.setDate(ini.getDate() + diasTotal - 1)
  return { desde: formatDateIsoLocal(ini), hasta: formatDateIsoLocal(fin) }
}

const rangoDefaultGantt = calcularRangoInicialGantt(15)
const fechaDesdeGantt = ref(rangoDefaultGantt.desde)
const fechaHastaGantt = ref(rangoDefaultGantt.hasta)

const seleccionarVentanaDiasGantt = (dias) => {
  rangoDiasGantt.value = dias
  modoRangoCustomGantt.value = false
  const r = calcularRangoInicialGantt(dias)
  fechaDesdeGantt.value = r.desde
  fechaHastaGantt.value = r.hasta
}

const onChangeFechasCustomGantt = () => {
  if (fechaDesdeGantt.value && fechaHastaGantt.value && fechaDesdeGantt.value > fechaHastaGantt.value) {
    const tmp = fechaDesdeGantt.value
    fechaDesdeGantt.value = fechaHastaGantt.value
    fechaHastaGantt.value = tmp
  }
  modoRangoCustomGantt.value = true
}

const diasGantt = computed(() => {
  const dias = []
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const diasSemanaNombres = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB']

  let inicio = fechaDesdeGantt.value ? new Date(fechaDesdeGantt.value + 'T00:00:00') : new Date(hoy)
  let fin = fechaHastaGantt.value ? new Date(fechaHastaGantt.value + 'T00:00:00') : new Date(hoy)
  if (isNaN(inicio.getTime()) || isNaN(fin.getTime()) || inicio > fin) {
    const r = calcularRangoInicialGantt(rangoDiasGantt.value)
    inicio = new Date(r.desde + 'T00:00:00')
    fin = new Date(r.hasta + 'T00:00:00')
  }

  const diffDays = Math.min(60, Math.max(1, Math.round((fin - inicio) / (1000 * 60 * 60 * 24)) + 1))

  for (let i = 0; i < diffDays; i++) {
    const d = new Date(inicio)
    d.setDate(inicio.getDate() + i)
    const fechaStr = formatDateIsoLocal(d)
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

// Resolver columna de Último Mantenimiento para cada equipo
const resolverUltimoMantenimientoEquipo = (eq) => {
  const mnt = eq.mnt_info || {}
  const fechaRaw = mnt.fecha_ultima_mantencion || eq.fecha_ultima_mantencion || mnt.ultima_fecha_ot || eq.fecha_ultima_lectura || null
  const fechaFmt = fechaRaw ? formatIsoToDdMmYyyy(String(fechaRaw).slice(0, 10)) : null
  const pauta = mnt.ultima_pauta_ejecutada || eq.ultima_pauta_ejecutada || mnt.ultimo_tipo_mantencion || null
  const horoService = Number(mnt.ultimo_horometro_service || eq.ultimo_horometro_service || 0)
  const horoActual = Number(eq.horometro_grua_acumulado || eq.horometro_chasis_acumulado || mnt.horometro_actual || 0)
  const odoActual = Number(eq.odometro_acumulado || mnt.odometro_actual || 0)

  if (eq.estado === 'MANTENCION' || mnt.ot_activa) {
    const folioOt = mnt.ot_activa?.numero_ot || mnt.numero_ot_activa || 'En Taller'
    return {
      label: `🔧 ${folioOt}`,
      sub: pauta || (fechaFmt ? `Ingreso: ${fechaFmt}` : 'Mantención activa'),
      classes: 'text-amber-400',
      tooltip: `Equipo actualmente en mantención (${folioOt})`
    }
  }

  if (pauta || fechaFmt || horoService > 0) {
    const labelPrincipal = fechaFmt || (pauta ? String(pauta) : `${horoService.toLocaleString('es-CL')} hrs`)
    const subParts = []
    if (pauta && fechaFmt) subParts.push(pauta)
    if (horoService > 0) subParts.push(`@${horoService.toLocaleString('es-CL')}h`)
    else if (horoActual > 0) subParts.push(`${horoActual.toLocaleString('es-CL')}h acum.`)
    else if (odoActual > 0) subParts.push(`${odoActual.toLocaleString('es-CL')}km`)
    return {
      label: labelPrincipal,
      sub: subParts.join(' · ') || 'Al día',
      classes: 'text-emerald-300',
      tooltip: `Último mantenimiento: ${labelPrincipal} ${subParts.join(' ')}`
    }
  }

  if (horoActual > 0 || odoActual > 0) {
    return {
      label: 'Sin OTM previa',
      sub: horoActual > 0 ? `Horo: ${horoActual.toLocaleString('es-CL')}h` : `Odo: ${odoActual.toLocaleString('es-CL')}km`,
      classes: 'text-slate-400',
      tooltip: 'Sin orden de mantenimiento cerrada registrada en sistema'
    }
  }

  return {
    label: 'Sin registro',
    sub: 'Preventivo al día',
    classes: 'text-slate-500',
    tooltip: 'Sin mantenciones registradas en el historial'
  }
}

// Cálculo de Devengado ($) basado estrictamente en el registro de los Reports Diarios del equipo en el rango
const calcularDevengadoReportsEquipo = (eq, diasVentana) => {
  const idEq = Number(eq.id_equipo)
  const patEq = (eq.patente || '').toUpperCase().trim()
  const desdeStr = diasVentana[0]?.fechaStr || '0000-01-01'
  const hastaStr = diasVentana[diasVentana.length - 1]?.fechaStr || '9999-12-31'

  const todosReps = datosAnalistaPMO.value?.reports || []
  const repsEquipo = todosReps.filter(r => {
    const rIdEq = Number(r.id_equipo || 0)
    const rPat = String(r.equipo_patente || r.patente || '').toUpperCase().trim()
    const matchEquipo = (idEq && rIdEq === idEq) || (patEq && patEq !== 'S/P' && rPat === patEq)
    if (!matchEquipo) return false
    const fRep = String(r.fecha_reporte_fmt || r.fecha_reporte || '').slice(0, 10)
    if (fRep && (fRep < desdeStr || fRep > hastaStr)) return false
    return true
  })

  if (repsEquipo.length === 0) {
    return { totalDevengado: 0, horasReports: 0, reportsCount: 0 }
  }

  let horasTotales = 0
  const repsPorProyecto = new Map()
  for (const r of repsEquipo) {
    const hrs = Number(r.horas_facturables || r.horas_operadas || 0)
    horasTotales += hrs
    const idP = Number(r.id_proyecto)
    if (!repsPorProyecto.has(idP)) {
      repsPorProyecto.set(idP, { count: 0, horas: 0 })
    }
    const item = repsPorProyecto.get(idP)
    item.count += 1
    item.horas += hrs
  }

  let totalDevengado = 0
  for (const [idP, infoRep] of repsPorProyecto.entries()) {
    const proy = todosLosProyectos.value.find(p => Number(p.id_proyecto) === idP)
    if (!proy) continue
    const crm = proy.json_field?.crm_v1 || {}
    const ej = proy.json_field?.ejecucion_v1 || {}
    const lineas = crm.lineas_servicio || ej.snapshot_comercial?.lines || []

    let montoComprometidoPry = 0
    for (const l of lineas) {
      montoComprometidoPry += calcularSubtotalLinea(l)
    }
    if (montoComprometidoPry <= 0) {
      montoComprometidoPry = Number(crm.totales?.neto || proy.monto_neto || 0)
    }

    let devPry = 0
    const lineasGrua = lineas.filter(l => {
      const t = String(l.tipo || '').toUpperCase()
      return ['GRUAS TELESCOPICAS', 'GRUA HORQUILLA', 'MANIPULADOR TELESCOPICO', 'CAMION PLUMA', 'ALZAHOMBRES / PLATAFORMAS'].includes(t)
    })

    if (lineasGrua.length > 0) {
      const l = lineasGrua[0]
      const valUnit = Number(l.valorUnitario || l.precio_unitario || l.tarifa || 0)
      const unidadLower = String(l.unidad || '').trim().toLowerCase()
      if (['diario', 'dia', 'día', 'jornada'].includes(unidadLower)) {
        devPry = valUnit * infoRep.count
      } else if (['hora', 'horas', 'hr', 'hrs'].includes(unidadLower) && valUnit > 0 && valUnit < 350000) {
        devPry = valUnit * infoRep.horas
      } else {
        devPry = calcularSubtotalLinea(l)
      }
    } else if (montoComprometidoPry > 0) {
      devPry = montoComprometidoPry
    }

    if (montoComprometidoPry > 0 && devPry > montoComprometidoPry) {
      devPry = montoComprometidoPry
    }
    totalDevengado += Math.round(devPry)
  }

  return {
    totalDevengado: Math.round(totalDevengado),
    horasReports: Number(horasTotales.toFixed(1)),
    reportsCount: repsEquipo.length
  }
}

// Conteo de inspecciones / checklists preoperacionales y de patio del equipo
const calcularInspeccionesEquipo = (eq) => {
  const idEq = Number(eq.id_equipo)
  let count = Number(eq.cant_inspecciones || 0)
  
  // Agregar inspecciones de patio registradas en OTs que no estén en tsrv_survey
  for (const p of todosLosProyectos.value) {
    const ej = p.json_field?.ejecucion_v1 || {}
    const insPatio = ej.preparacion_salida?.inspecciones_patio || {}
    const entry = insPatio[String(idEq)] || insPatio[idEq]
    if (entry && !entry.id_survey) {
      count++
    }
  }

  return count
}

const calcularProductividadEquipo = (eq, diasVentana) => {
  if (!diasVentana || diasVentana.length === 0) return 0
  let diasOcupados = 0
  for (const d of diasVentana) {
    const ev = getEventoEquipoEnDia(eq, d.fechaStr)
    if (ev && ev.tipo !== 'cancelado') diasOcupados++
  }
  return Math.min(100, Math.round((diasOcupados / diasVentana.length) * 100))
}

const resolverGrupoCategoriaEquipo = (eq) => {
  const c = `${eq.nombre_categoria || ''} ${eq.tipo_equipo || ''} ${eq.nombre_equipo || ''} ${eq.modelo || ''}`.toUpperCase()
  if (c.includes('PLUMA')) {
    return { id: 'CAMION_PLUMA', nombre: 'Camiones Pluma', orden: 2 }
  }
  if (c.includes('HORQUILLA') || c.includes('MANIPULADOR') || c.includes('MANITOU') || c.includes('ALZAHOMBRE') || c.includes('PLATAFORMA')) {
    return { id: 'MANIPULADOR', nombre: 'Horquillas, Manipuladores y Plataformas', orden: 4 }
  }
  if (c.includes('GRÚA') || c.includes('GRUA') || c.includes('TELESCOPICA') || c.includes('LIEBHERR') || c.includes('GROVE') || c.includes('TADANO') || c.includes('XCMG') || c.includes('SANY')) {
    return { id: 'GRUA', nombre: 'Grúas Telescópicas', orden: 1 }
  }
  if (c.includes('TRACTO') || c.includes('CAMA') || c.includes('BAJA') || c.includes('RAMPLA') || c.includes('SEMI') || c.includes('FLETE') || c.includes('CAMIÓN') || c.includes('CAMION')) {
    return { id: 'TRANSPORTE', nombre: 'Tractocamiones y Camas Bajas', orden: 3 }
  }
  if (c.includes('CAMIONETA') || c.includes('ESCOLTA') || c.includes('VEHÍCULO') || c.includes('VEHICULO') || c.includes('APOYO') || c.includes('FURGON')) {
    return { id: 'ESCOLTA', nombre: 'Camionetas, Escoltas y Vehículos de Apoyo', orden: 5 }
  }
  return { id: 'OTROS', nombre: 'Otros Equipos y Maquinaria', orden: 6 }
}

const flotaEnriquecidaGantt = computed(() => {
  let list = [...flotaEquiposMaster.value]
  const cat = filtroCategoriaGantt.value
  const q = (busquedaGantt.value || '').trim().toLowerCase()

  if (cat !== 'TODOS') {
    list = list.filter(e => resolverGrupoCategoriaEquipo(e).id === cat)
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
  return list.map(e => {
    const mnt = resolverUltimoMantenimientoEquipo(e)
    const dev = calcularDevengadoReportsEquipo(e, dias)
    const prodPct = calcularProductividadEquipo(e, dias)
    const tieneEventoEnVentana = dias.some(d => {
      const ev = getEventoEquipoEnDia(e, d.fechaStr)
      return Boolean(ev && ev.tipo !== 'cancelado' && ev.tipo !== 'mantenimiento')
    })
    const tieneMovimiento = Boolean(tieneEventoEnVentana || dev.reportsCount > 0 || prodPct > 0)
    const grupoCat = resolverGrupoCategoriaEquipo(e)

    return {
      ...e,
      grupoCatId: grupoCat.id,
      grupoCatNombre: grupoCat.nombre,
      grupoCatOrden: grupoCat.orden,
      ultimoMantenimientoLabel: mnt.label,
      ultimoMantenimientoSub: mnt.sub,
      ultimoMantenimientoClass: mnt.classes,
      ultimoMantenimientoTooltip: mnt.tooltip,
      cantInspecciones: calcularInspeccionesEquipo(e),
      totalDevengado: dev.totalDevengado,
      horasReports: dev.horasReports,
      reportsCount: dev.reportsCount,
      productividadPct: prodPct,
      tieneMovimiento
    }
  })
})

const flotaFiltradaGantt = computed(() => {
  if (!ocultarSinMovimientoGantt.value) return flotaEnriquecidaGantt.value
  return flotaEnriquecidaGantt.value.filter(e => e.tieneMovimiento)
})

const kpisGantt = computed(() => {
  const todos = flotaEnriquecidaGantt.value
  const totalFlota = todos.length
  const conMovimiento = todos.filter(e => e.tieneMovimiento).length
  const sinMovimiento = Math.max(0, totalFlota - conMovimiento)
  const utilizacionPct = totalFlota > 0 ? Math.round((conMovimiento / totalFlota) * 100) : 0

  let totalHorasReports = 0
  let totalDevengado = 0
  for (const e of todos) {
    totalHorasReports += Number(e.horasReports || 0)
    totalDevengado += Number(e.totalDevengado || 0)
  }

  // Contar OTs activas que se solapan con el rango de diasGantt
  const dias = diasGantt.value
  const desdeStr = dias[0]?.fechaStr || '0000-01-01'
  const hastaStr = dias[dias.length - 1]?.fechaStr || '9999-12-31'
  const otsSet = new Set()
  for (const p of todosLosProyectos.value) {
    const st = Number(p.id_proyecto_estado)
    if (st >= 99 || (st === 6 && p.motivo_desestimacion) || st < 3) continue
    const rawIni = (p.fecha_plan_ini || p.fecha_real_ini || p.fecha_creacion || '').slice(0, 10)
    const rawFin = (p.fecha_plan_fin || p.fecha_real_fin || rawIni || '').slice(0, 10)
    if (rawIni && rawFin >= desdeStr && rawIni <= hastaStr) {
      otsSet.add(p.id_proyecto)
    }
  }

  return {
    totalFlota,
    conMovimiento,
    sinMovimiento,
    utilizacionPct,
    totalOtsPeriodo: otsSet.size,
    totalHorasReports: Number(totalHorasReports.toFixed(1)),
    totalDevengado: Math.round(totalDevengado)
  }
})

const categoriasAbiertasGantt = ref(new Set(['GRUA', 'CAMION_PLUMA', 'TRANSPORTE', 'MANIPULADOR', 'ESCOLTA', 'OTROS']))

const gruposCategoriaGantt = computed(() => {
  const mapa = new Map()
  for (const eq of flotaFiltradaGantt.value) {
    if (!mapa.has(eq.grupoCatId)) {
      mapa.set(eq.grupoCatId, {
        id: eq.grupoCatId,
        nombre: eq.grupoCatNombre,
        orden: eq.grupoCatOrden,
        equipos: [],
        conMovimientoCount: 0,
        totalInspecciones: 0,
        horasReports: 0,
        totalDevengado: 0,
        sumaOee: 0
      })
    }
    const g = mapa.get(eq.grupoCatId)
    g.equipos.push(eq)
    if (eq.tieneMovimiento) g.conMovimientoCount += 1
    g.totalInspecciones += Number(eq.cantInspecciones || 0)
    g.horasReports = Number((g.horasReports + Number(eq.horasReports || 0)).toFixed(1))
    g.totalDevengado += Number(eq.totalDevengado || 0)
    g.sumaOee += Number(eq.productividadPct || 0)
  }

  return Array.from(mapa.values())
    .sort((a, b) => a.orden - b.orden)
    .map(g => ({
      ...g,
      oeePromedio: g.equipos.length > 0 ? Math.round(g.sumaOee / g.equipos.length) : 0
    }))
})

const esCategoriaAbiertaGantt = (id) => categoriasAbiertasGantt.value.has(id)

const toggleCategoriaGantt = (id) => {
  const next = new Set(categoriasAbiertasGantt.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  categoriasAbiertasGantt.value = next
}

const todasCategoriasAbiertasGantt = computed(() => {
  if (gruposCategoriaGantt.value.length === 0) return false
  return gruposCategoriaGantt.value.every(g => categoriasAbiertasGantt.value.has(g.id))
})

const toggleTodasCategoriasGantt = () => {
  if (todasCategoriasAbiertasGantt.value) {
    categoriasAbiertasGantt.value = new Set()
  } else {
    categoriasAbiertasGantt.value = new Set(gruposCategoriaGantt.value.map(g => g.id))
  }
}

const getEventoEquipoEnDia = (eq, fechaStr) => {
  const targetDate = new Date(fechaStr + 'T00:00:00')
  const patEq = (eq.patente || '').toUpperCase().trim()
  const idEq = Number(eq.id_equipo)

  const proyectosCoincidentes = []

  for (const p of todosLosProyectos.value) {
    const rawIni = p.fecha_plan_ini || p.fecha_real_ini || p.fecha_creacion
    if (!rawIni) continue

    const ini = new Date(rawIni.split('T')[0] + 'T00:00:00')
    const rawFin = p.fecha_plan_fin || p.fecha_real_fin || rawIni
    const fin = new Date(rawFin.split('T')[0] + 'T23:59:59')

    if (targetDate >= ini && targetDate <= fin) {
      const ej = p.json_field?.ejecucion_v1 || {}
      const crm = p.json_field?.crm_v1 || {}
      
      const esGrua = patEq && (ej.patente_grua || '').toUpperCase().trim() === patEq
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
      const enPatio = ej.preparacion_salida?.inspecciones_patio && (
        Boolean(ej.preparacion_salida.inspecciones_patio[String(idEq)]) ||
        Boolean(ej.preparacion_salida.inspecciones_patio[idEq])
      )

      if (esGrua || enLineas || enRecursos || enPatio) {
        proyectosCoincidentes.push(p)
      }
    }
  }

  // Detectar colisiones excluyendo proyectos cancelados
  const proyectosActivos = proyectosCoincidentes.filter(p => {
    const st = Number(p.id_proyecto_estado)
    return st < 99 && !(st === 6 && p.motivo_desestimacion)
  })

  if (proyectosActivos.length > 1) {
    const otsConfig = proyectosActivos.map(p => p.codi_proyecto).join(' y ')
    return {
      tipo: 'colision',
      esColision: true,
      classes: 'bg-red-600/95 hover:bg-red-500 text-white border border-red-400 shadow-md ring-2 ring-red-400 font-black animate-pulse',
      label: 'Colisión',
      subLabel: `${proyectosActivos.length} OTs`,
      tooltip: `⚠️ COLISIÓN HORARIA: Equipo asignado a múltiples OTs simultáneamente: ${otsConfig}`,
      proyectoId: proyectosActivos[0].id_proyecto,
      subtab: 'ejecucion'
    }
  }

  if (proyectosCoincidentes.length > 0) {
    const p = proyectosCoincidentes[0]
    const st = Number(p.id_proyecto_estado)
    const esCancelado = st >= 99 || (st === 6 && Boolean(p.motivo_desestimacion))

    // 1. Estado: CANCELADO (Gris Pizarra / Tachado)
    if (esCancelado) {
      return {
        tipo: 'cancelado',
        esColision: false,
        classes: 'bg-slate-700/80 hover:bg-slate-600 text-slate-300 border border-slate-500/60 line-through opacity-75 shadow-inner hover:opacity-100',
        label: p.codi_proyecto || 'Canc',
        subLabel: 'Cancelado',
        tooltip: `❌ CANCELADO: ${p.codi_proyecto} - ${p.nombre_cliente || ''} (${p.motivo_desestimacion || 'Desestimado'})`,
        proyectoId: p.id_proyecto,
        subtab: 'comercial'
      }
    }

    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const esEjecutado = st >= 7 || 
      (st === 6 && !p.motivo_desestimacion) || 
      p.json_field?.ejecucion_v1?.preparacion_salida?.ejecucion_finalizada ||
      p.json_field?.ejecucion_v1?.fecha_hora_despacho_termino ||
      (st >= 5 && targetDate < hoy)

    // 2. Estado: YA EJECUTADO / COMPLETADO (Verde Esmeralda)
    if (esEjecutado) {
      return {
        tipo: 'ejecutado',
        esColision: false,
        classes: 'bg-emerald-600/90 hover:bg-emerald-500 text-white border border-emerald-400 shadow-sm',
        label: p.codi_proyecto || 'OT',
        subLabel: 'Ejecutado',
        tooltip: `✅ YA EJECUTADO: ${p.codi_proyecto} - ${p.nombre_cliente || ''} (${p.nombre_proyecto || ''})`,
        proyectoId: p.id_proyecto,
        subtab: 'ejecucion'
      }
    }

    // 3. Estado: EN OPERACIÓN / FAENA HOY O FUTURA (Cian vibrante)
    if (st === 5) {
      return {
        tipo: 'faena',
        esColision: false,
        classes: 'bg-cyan-600/90 hover:bg-cyan-500 text-white border border-cyan-400 shadow-sm ring-1 ring-cyan-400/60',
        label: p.codi_proyecto || 'OT',
        subLabel: 'En Faena',
        tooltip: `🚀 EN OPERACIÓN / FAENA: ${p.codi_proyecto} - ${p.nombre_cliente || ''}`,
        proyectoId: p.id_proyecto,
        subtab: 'ejecucion'
      }
    }

    // 4. Estado: RESERVADO / PROGRAMADO (Azul)
    return {
      tipo: 'reservado',
      esColision: false,
      classes: 'bg-blue-600/90 hover:bg-blue-500 text-white border border-blue-400 shadow-sm',
      label: p.codi_proyecto || 'OT',
      subLabel: 'Reservado',
      tooltip: `📅 RESERVADO / PROGRAMADO: ${p.codi_proyecto} - ${p.nombre_cliente || ''} (${p.nombre_estado || 'Programado'})`,
      proyectoId: p.id_proyecto,
      subtab: st >= 4 ? 'ejecucion' : 'comercial'
    }
  }

  // 5. Estado: EN MANTENIMIENTO / TALLER (Ámbar / Naranja fuego)
  if (eq.estado === 'MANTENCION') {
    return {
      tipo: 'mantenimiento',
      esColision: false,
      classes: 'bg-amber-600/90 hover:bg-amber-500 text-white border border-amber-400 shadow-sm',
      label: 'Taller',
      subLabel: 'Mantención',
      tooltip: '🔧 EN MANTENIMIENTO: Equipo en taller o mantención técnica programada',
      proyectoId: null,
      subtab: null
    }
  }

  return null
}

const onClicEventoGantt = (evento) => {
  if (evento?.proyectoId) {
    abrirProyecto(evento.proyectoId, evento.subtab || 'comercial')
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

onMounted(async () => {
  await Promise.allSettled([cargarProyectos(), cargarPendientesAnalista()])
  if (route.query.id_proyecto) {
    abrirProyecto(route.query.id_proyecto, route.query.subtab)
  }
})
</script>
