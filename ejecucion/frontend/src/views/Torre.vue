<template>
  <div class="space-y-6 text-left">
    <!-- Header -->
    <div class="bg-[#0a0f1e]/40 p-4 border border-white/5 rounded-xl">
      <h2 class="text-lg font-black text-white uppercase tracking-wider font-display">Torre de Control Operativa</h2>
      <p class="text-xs text-slate-400 mt-1">Planificación y seguimiento de maniobras de izaje, logística de contrapesos y telemetría de ruta.</p>
    </div>

    <!-- Kanban Columns (6 Columnas Operativas) -->
    <div class="grid grid-cols-1 lg:grid-cols-6 gap-3.5 h-[calc(100vh-210px)] overflow-y-auto">
      <!-- Columna 1: Requerimiento Registrado -->
      <div class="bg-[#0f1629] border-t-4 border-[#6366f1] border border-white/5 rounded-xl p-3 flex flex-col">
        <div class="flex justify-between items-center mb-4">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 bg-[#6366f1] rounded-full"></span>
            <span class="text-xs font-black uppercase text-white">Requerimiento Registrado</span>
          </div>
          <span class="bg-black/20 text-[10px] text-slate-400 font-bold px-2 py-0.5 rounded border border-white/5">
            {{ preventa.length }}
          </span>
        </div>
        <div class="space-y-3 flex-1 overflow-y-auto">
          <button @click="abrirCotizacion" class="w-full py-2 bg-[#6366f1]/10 hover:bg-[#6366f1]/20 border border-[#6366f1]/30 text-[#818cf8] rounded-lg text-xs font-bold transition-all mb-2 flex items-center justify-center gap-1">
            <span>+ Nueva Oportunidad</span>
          </button>
          
          <div 
            v-for="p in preventa" 
            :key="p.id_proyecto" 
            @click="abrirProyecto(p.id_proyecto)"
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
            {{ verificacion.length }}
          </span>
        </div>
        <div class="space-y-3 flex-1 overflow-y-auto">
          <div 
            v-for="p in verificacion" 
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
            {{ asignados.length }}
          </span>
        </div>
        <div class="space-y-3 flex-1 overflow-y-auto">
          <div 
            v-for="p in asignados" 
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
            {{ desplazamiento.length }}
          </span>
        </div>
        <div class="space-y-3 flex-1 overflow-y-auto">
          <div 
            v-for="p in desplazamiento" 
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
            {{ maniobra.length }}
          </span>
        </div>
        <div class="space-y-3 flex-1 overflow-y-auto">
          <div 
            v-for="p in maniobra" 
            :key="p.id_proyecto" 
            @click="abrirProyecto(p.id_proyecto, 'preparacion_salida')"
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
              <p v-if="formatMonto(p)" class="text-white font-bold">{{ formatMonto(p) }}</p>
              <p v-if="p.fecha_plan_fin" class="text-purple-400/70"><span class="font-semibold">Término Est.:</span> {{ new Date(p.fecha_plan_fin).toLocaleDateString() }}</p>
            </div>
            <div class="flex gap-1.5 mt-3">
              <span class="text-[8px] font-bold uppercase bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/25 text-purple-400">Izaje</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Columna 6: Finalizado / Devengado -->
      <div class="bg-[#0f1629] border-t-4 border-emerald-500 border border-white/5 rounded-xl p-3 flex flex-col">
        <div class="flex justify-between items-center mb-4">
          <span class="text-xs font-black uppercase text-white">Finalizado / Devengado</span>
          <span class="bg-black/20 text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/20">
            {{ completados.length }}
          </span>
        </div>
        <div class="space-y-3 flex-1 overflow-y-auto">
          <div 
            v-for="p in completados" 
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
import { ref, onMounted, watch } from 'vue'
import GestorOportunidades from './CRM/GestorOportunidades.vue'
import AcreditacionDrawer from '../components/acreditacion/AcreditacionDrawer.vue'
import apiAxios from '../services/api'
import { navStore } from '../stores/navStore'

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

    preventa.value       = proyectos.filter(p => p.id_proyecto_estado === 1 || p.id_proyecto_estado === 2)
    
    // Columna 2: En Verificación Operaciones (Sub-tab validación o sin subtab)
    verificacion.value   = proyectos.filter(p => p.id_proyecto_estado === 3 && (!p.json_field?.ejecucion_v1?.subtab_activa || p.json_field?.ejecucion_v1?.subtab_activa === 'validacion'))

    // Columna 3: En Asignación Recursos (Sub-tab asignacion)
    asignados.value      = proyectos.filter(p => p.id_proyecto_estado === 3 && p.json_field?.ejecucion_v1?.subtab_activa === 'asignacion')

    // Columna 4: En Preparación Operaciones (Sub-tab preparacion_salida, patio_programado, asignacionConfirmada o estado 4/5)
    desplazamiento.value = proyectos.filter(p => 
      p.id_proyecto_estado === 4 || 
      p.id_proyecto_estado === 5 || 
      (p.id_proyecto_estado === 3 && (
        ['preparacion_salida', 'acreditaciones'].includes(p.json_field?.ejecucion_v1?.subtab_activa) ||
        p.json_field?.ejecucion_v1?.preparacion_salida?.patio_programado ||
        p.json_field?.ejecucion_v1?.asignacionConfirmada
      ))
    )

    maniobra.value       = proyectos.filter(p => p.id_proyecto_estado === 7 || p.json_field?.ejecucion_v1?.fase === 'maniobra')
    completados.value    = proyectos.filter(p => p.id_proyecto_estado === 8)
    noAsignadas.value    = proyectos.filter(p => p.id_proyecto_estado === 6)

    try {
      const resAcr = await apiAxios.get('/acreditaciones')
      acreditacionesList.value = resAcr.data || []
    } catch(errAcr) {
      console.warn("No se cargaron acreditaciones:", errAcr.message)
    }
  } catch (e) {
    console.error('Error cargando proyectos:', e)
  }
}

const abrirCotizacion = () => {
  proyectoSeleccionadoId.value = null
  proyectoSubTabInicial.value = null
  mostrarModalCotizacion.value = true
}

const abrirProyecto = (id, subtab = null) => {
  proyectoSeleccionadoId.value = id
  proyectoSubTabInicial.value = subtab
  mostrarModalCotizacion.value = true
}

const calcularPorcentajeAcreditacion = (p) => {
  if (p.json_field?.ejecucion_v1?.porcentaje_acreditacion !== undefined) {
    return Number(p.json_field.ejecucion_v1.porcentaje_acreditacion)
  }
  const reqDocs = p.json_field?.crm_v1?.acreditacion_docs || p.acreditacion_docs || { 
    empresa: ['Inicio de actividades', 'Carpeta tributaria', 'Certificado cotizaciones', 'Constitución de empresa', 'RIOHS'], 
    equipos: ['SOAP', 'Revisión Técnica', 'Certificación Anual Izaje'], 
    personas: ['Contrato de trabajo', 'Cédula identidad', 'Licencia conducir'] 
  }
  const total = (reqDocs.empresa?.length || 0) + (reqDocs.equipos?.length || 0) + (reqDocs.personas?.length || 0)
  if (total === 0) return 100
  
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

const formatMonto = (p) => {
  const lineas = p.json_field?.crm_v1?.lineas_servicio
  if (!lineas?.length) return null
  const total = lineas.reduce((s, l) => s + (l.cantidad * l.valorUnitario), 0)
  return total > 0 ? '$' + total.toLocaleString('es-CL') : null
}

onMounted(cargarProyectos)
</script>
