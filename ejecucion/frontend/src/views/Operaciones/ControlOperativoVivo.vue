<template>
  <div class="space-y-4 text-left animate-fadeIn">
    <!-- BARRA SUPERIOR: RELOJ EN VIVO + TIMER 5 MIN + ACCIONES + ALERTAS -->
    <div class="bg-[#0a0f1e] p-3.5 rounded-xl border border-white/10 flex flex-wrap items-center justify-between gap-3 shadow-xl">
      <!-- Título + Reloj Oficial CLT -->
      <div class="flex items-center gap-3">
        <div class="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-lg">
          📡
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-sm font-black text-white uppercase tracking-wider font-mono">
              Control Operativo en Vivo
            </h2>
            <span 
              class="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border"
              :class="ventanaActiva ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-white/10'"
            >
              {{ ventanaActiva ? '🟢 Ventana Activa (07:00 - 20:00)' : '⚪ Fuera de Ventana' }}
            </span>
          </div>
          <p class="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
            <span>Hora Oficial Chile:</span>
            <strong class="text-amber-300 font-bold text-xs">{{ horaChileStr }}</strong>
            <span class="text-slate-600">|</span>
            <span>Refresco en:</span>
            <span class="text-blue-400 font-bold font-mono">{{ formatearSegundos(segundosRestantes) }}</span>
          </p>
        </div>
      </div>

      <!-- Controles: Selector de Fecha + Botón Recargar + Campana Alertas -->
      <div class="flex items-center gap-2 flex-wrap">
        <!-- Selector de Fecha Operativa -->
        <div class="flex items-center gap-1.5 bg-[#050810] border border-white/10 rounded-lg px-2.5 py-1">
          <span class="text-[11px] text-slate-400 font-mono">Fecha:</span>
          <input 
            type="date" 
            v-model="fechaFiltro" 
            @change="cargarDatos"
            class="bg-transparent text-white text-xs font-mono font-bold outline-none [color-scheme:dark]"
          />
        </div>

        <!-- Botón Solo Ícono para Actualizar (Regla Estricta: Sin texto ni 'Cockpit') -->
        <button 
          @click="cargarDatos" 
          :disabled="cargando"
          class="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center text-sm font-bold transition-all shadow-md disabled:opacity-50"
          :title="`Actualizar datos en vivo (Próximo auto-refresco en ${segundosRestantes}s)`"
        >
          <span :class="{ 'animate-spin': cargando }">🔄</span>
        </button>

        <!-- Campana Interactiva de Notificaciones In-Web -->
        <div class="relative">
          <button 
            @click="modalAlertasAbierto = !modalAlertasAbierto"
            class="h-8 px-2.5 rounded-lg border flex items-center gap-1.5 text-xs font-bold transition-all"
            :class="totalAlertasNoLeidas > 0 ? 'bg-red-500/10 border-red-500/40 text-red-300 hover:bg-red-500/20' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'"
            title="Centro de Alertas Operativas del Día"
          >
            <span>🔔</span>
            <span v-if="totalAlertasNoLeidas > 0" class="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            <span class="font-mono text-[11px]">{{ notificacionesWeb.length }}</span>
          </button>

          <!-- Dropdown Popup de Alertas -->
          <div 
            v-if="modalAlertasAbierto" 
            class="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0a0f1e] border border-white/20 rounded-xl shadow-2xl p-3 z-50 space-y-2 text-xs"
          >
            <div class="flex items-center justify-between border-b border-white/10 pb-2">
              <span class="font-bold text-white uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                <span>🔔</span> Alertas In-Web del Día
              </span>
              <button 
                v-if="totalAlertasNoLeidas > 0"
                @click="marcarTodasNotificacionesLeidas" 
                class="text-[10px] text-blue-400 hover:underline"
              >
                Marcar todas leídas
              </button>
            </div>

            <div v-if="notificacionesWeb.length === 0" class="py-6 text-center text-slate-400 text-xs">
              ✅ No hay alertas operativas pendientes para hoy.
            </div>

            <div v-else class="max-h-80 overflow-y-auto space-y-2 pr-1">
              <div 
                v-for="al in notificacionesWeb" 
                :key="al.id_notificacion"
                class="p-2.5 rounded-lg border transition-all text-left"
                :class="[
                  al.severidad === 'ALTA' ? 'border-red-500/40 bg-red-500/5' : 'border-amber-500/30 bg-amber-500/5',
                  al.leido_por ? 'opacity-60' : 'opacity-100 font-medium'
                ]"
              >
                <div class="flex items-start justify-between gap-2">
                  <span 
                    class="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase"
                    :class="al.severidad === 'ALTA' ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'"
                  >
                    {{ al.codigo_ot || 'OT' }} • {{ al.hito_clave }}
                  </span>
                  <span class="text-[9px] text-slate-400 font-mono">
                    {{ formatearHoraNotif(al.creado_en) }}
                  </span>
                </div>
                <p class="text-xs text-white mt-1 leading-snug">{{ al.mensaje }}</p>
                <div class="mt-1.5 flex justify-end">
                  <button 
                    v-if="!al.leido_por"
                    @click="marcarNotificacionLeida(al.id_notificacion)"
                    class="text-[10px] text-slate-400 hover:text-white underline"
                  >
                    Entendido / Leído
                  </button>
                  <span v-else class="text-[9px] text-emerald-400 font-mono">✓ Leída</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- BARRA DE KPIS CROMÁTICOS (FILTRABLES CON CLICK) -->
    <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
      <!-- Total OTs -->
      <div 
        @click="filtroEstado = 'TODOS'"
        class="bg-[#0f1629] border rounded-xl p-2.5 cursor-pointer transition-all hover:scale-[1.02] text-center"
        :class="filtroEstado === 'TODOS' ? 'border-blue-500 bg-blue-500/10 shadow-md' : 'border-white/5'"
      >
        <p class="text-[9px] font-black text-slate-400 uppercase tracking-wider">Total OTs</p>
        <p class="text-xl font-black text-white mt-0.5 font-mono">{{ kpis.total_ots || 0 }}</p>
        <p class="text-[8px] text-slate-500 mt-0.5">Programadas</p>
      </div>

      <!-- Rojo: Retraso / Excepción Crítica -->
      <div 
        @click="filtroEstado = 'rojo'"
        class="bg-[#0f1629] border rounded-xl p-2.5 cursor-pointer transition-all hover:scale-[1.02] text-center"
        :class="[
          filtroEstado === 'rojo' ? 'border-red-500 bg-red-500/10 shadow-md' : 'border-white/5',
          kpis.rojo > 0 ? 'border-red-500/50 bg-red-500/5' : ''
        ]"
      >
        <div class="flex items-center justify-center gap-1">
          <span v-if="kpis.rojo > 0" class="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
          <p class="text-[9px] font-black text-red-400 uppercase tracking-wider">🔴 Rojo</p>
        </div>
        <p class="text-xl font-black text-red-400 mt-0.5 font-mono">{{ kpis.rojo || 0 }}</p>
        <p class="text-[8px] text-slate-500 mt-0.5">Vencido / Alerta</p>
      </div>

      <!-- Amarillo: Próximo a Vencer (< 1 h) -->
      <div 
        @click="filtroEstado = 'amarillo'"
        class="bg-[#0f1629] border rounded-xl p-2.5 cursor-pointer transition-all hover:scale-[1.02] text-center"
        :class="filtroEstado === 'amarillo' ? 'border-amber-500 bg-amber-500/10 shadow-md' : 'border-white/5'"
      >
        <p class="text-[9px] font-black text-amber-400 uppercase tracking-wider">🟡 Amarillo</p>
        <p class="text-xl font-black text-amber-400 mt-0.5 font-mono">{{ kpis.amarillo || 0 }}</p>
        <p class="text-[8px] text-slate-500 mt-0.5">&lt; 1h al plan</p>
      </div>

      <!-- Azul: En Espera / Planificado (>= 1 h) -->
      <div 
        @click="filtroEstado = 'azul'"
        class="bg-[#0f1629] border rounded-xl p-2.5 cursor-pointer transition-all hover:scale-[1.02] text-center"
        :class="filtroEstado === 'azul' ? 'border-blue-500 bg-blue-500/10 shadow-md' : 'border-white/5'"
      >
        <p class="text-[9px] font-black text-blue-400 uppercase tracking-wider">🔵 Azul</p>
        <p class="text-xl font-black text-blue-400 mt-0.5 font-mono">{{ kpis.azul || 0 }}</p>
        <p class="text-[8px] text-slate-500 mt-0.5">&gt; 1h al plan</p>
      </div>

      <!-- Verde: En Tiempo / Cumplido Estricto -->
      <div 
        @click="filtroEstado = 'verde'"
        class="bg-[#0f1629] border rounded-xl p-2.5 cursor-pointer transition-all hover:scale-[1.02] text-center"
        :class="filtroEstado === 'verde' ? 'border-emerald-500 bg-emerald-500/10 shadow-md' : 'border-white/5'"
      >
        <p class="text-[9px] font-black text-emerald-400 uppercase tracking-wider">🟢 Verde</p>
        <p class="text-xl font-black text-emerald-400 mt-0.5 font-mono">{{ kpis.verde || 0 }}</p>
        <p class="text-[8px] text-slate-500 mt-0.5">En tiempo (≤ plan)</p>
      </div>

      <!-- Negro: Realizado Tarde -->
      <div 
        @click="filtroEstado = 'negro'"
        class="bg-[#0f1629] border rounded-xl p-2.5 cursor-pointer transition-all hover:scale-[1.02] text-center"
        :class="filtroEstado === 'negro' ? 'border-slate-400 bg-slate-500/10 shadow-md' : 'border-white/5'"
      >
        <p class="text-[9px] font-black text-slate-300 uppercase tracking-wider">⚫ Negro</p>
        <p class="text-xl font-black text-slate-300 mt-0.5 font-mono">{{ kpis.negro || 0 }}</p>
        <p class="text-[8px] text-slate-500 mt-0.5">Realizado tarde</p>
      </div>

      <!-- Candado: Concluido Operacionalmente -->
      <div 
        @click="filtroEstado = 'terminado'"
        class="bg-[#0f1629] border rounded-xl p-2.5 cursor-pointer transition-all hover:scale-[1.02] text-center"
        :class="filtroEstado === 'terminado' ? 'border-purple-500 bg-purple-500/10 shadow-md' : 'border-white/5'"
      >
        <p class="text-[9px] font-black text-purple-400 uppercase tracking-wider">🔒 Concluido</p>
        <p class="text-xl font-black text-purple-400 mt-0.5 font-mono">{{ kpis.terminado || 0 }}</p>
        <p class="text-[8px] text-slate-500 mt-0.5">Cupo cerrado</p>
      </div>

      <!-- Sin Plan (Gris) -->
      <div 
        @click="filtroEstado = 'sinplan'"
        class="bg-[#0f1629] border rounded-xl p-2.5 cursor-pointer transition-all hover:scale-[1.02] text-center"
        :class="filtroEstado === 'sinplan' ? 'border-slate-500 bg-slate-500/10 shadow-md' : 'border-white/5'"
      >
        <p class="text-[9px] font-black text-slate-500 uppercase tracking-wider">⚪ Sin Plan</p>
        <p class="text-xl font-black text-slate-400 mt-0.5 font-mono">{{ kpis.sinplan || 0 }}</p>
        <p class="text-[8px] text-slate-500 mt-0.5">Sin horario base</p>
      </div>
    </div>

    <!-- BARRA RESUMEN DE PIPELINE DOCUMENTAL & LIQUIDACIÓN (REQ-991) -->
    <div class="bg-[#0a0f1e] border border-white/10 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
      <div class="flex items-center gap-2">
        <span class="text-sm">📄</span>
        <span class="text-xs font-black text-white uppercase tracking-wider font-mono">
          Pipeline Documental & Facturación
        </span>
      </div>
      <div class="flex items-center gap-2 flex-wrap font-mono text-xs">
        <div class="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5 font-bold">
          <span>1. ITS Listos:</span>
          <span class="text-white">{{ kpis.pipeline?.its_listos || 0 }}</span>
        </div>
        <div 
          class="px-2.5 py-1 rounded-lg border flex items-center gap-1.5 font-bold"
          :class="kpis.pipeline?.its_sla_retraso > 0 ? 'bg-red-500/20 border-red-500/50 text-red-300 animate-pulse' : 'bg-white/5 border-white/10 text-slate-400'"
        >
          <span>🔴 Retraso SLA 13:00:</span>
          <span class="text-white font-black">{{ kpis.pipeline?.its_sla_retraso || 0 }}</span>
        </div>
        <div class="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 flex items-center gap-1.5 font-bold">
          <span>2. EDP Listos:</span>
          <span class="text-white">{{ kpis.pipeline?.edp_listos || 0 }}</span>
        </div>
        <div class="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 flex items-center gap-1.5 font-bold">
          <span>3. OC Listas:</span>
          <span class="text-white">{{ kpis.pipeline?.oc_listas || 0 }}</span>
        </div>
        <div class="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5 font-bold">
          <span>4. Facturas:</span>
          <span class="text-white">{{ kpis.pipeline?.facturas_listas || 0 }}</span>
        </div>
      </div>
    </div>

    <!-- BUSCADOR RÁPIDO & FILTROS DE EXCEPCIÓN -->
    <div class="bg-[#0f1629] border border-white/5 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2.5">
      <div class="flex items-center gap-2 flex-1 max-w-md">
        <span class="text-slate-400 text-xs">🔍</span>
        <input 
          v-model="busquedaTexto" 
          type="text" 
          placeholder="Filtrar por OT, Cliente, Grúa, Operador u Obra..." 
          class="w-full bg-[#070b14] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
        />
        <button 
          v-if="busquedaTexto" 
          @click="busquedaTexto = ''" 
          class="text-slate-400 hover:text-white text-xs px-1"
        >
          ✕
        </button>
      </div>

      <div class="flex items-center gap-2 text-xs">
        <span class="text-slate-400 font-mono text-[11px]">
          Mostrando: <strong class="text-white">{{ serviciosFiltrados.length }}</strong> de {{ servicios.length }} servicios
        </span>
        <button 
          v-if="filtroEstado !== 'TODOS' || busquedaTexto" 
          @click="resetFiltros"
          class="text-[10px] text-blue-400 hover:underline font-mono"
        >
          Restablecer filtros
        </button>
      </div>
    </div>

    <!-- SPINNER DE CARGA -->
    <div v-if="cargando && servicios.length === 0" class="py-16 text-center text-slate-400 font-mono text-xs">
      <div class="inline-block animate-spin text-2xl mb-2">🔄</div>
      <p>Sincronizando estado operacional en vivo desde terreno...</p>
    </div>

    <!-- ESTADO VACÍO -->
    <div v-else-if="serviciosFiltrados.length === 0" class="py-16 text-center bg-[#0a0f1e] border border-white/5 rounded-xl p-8">
      <p class="text-slate-400 text-sm">No se encontraron servicios programados que coincidan con los filtros aplicados.</p>
      <button @click="resetFiltros" class="mt-3 text-xs text-blue-400 font-bold hover:underline">
        Ver todos los servicios del día
      </button>
    </div>

    <!-- MATRIZ DE TARJETAS DE SERVICIOS (OPCIÓN 3 HÍBRIDA) -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
      <div 
        v-for="s in serviciosFiltrados" 
        :key="s.id_proyecto"
        class="bg-[#0f1629] border rounded-xl overflow-hidden shadow-lg flex flex-col justify-between transition-all hover:border-white/20"
        :class="getClaseBordeTarjeta(s.estado_global)"
      >
        <!-- CABECERA DE LA TARJETA -->
        <div class="p-3.5 border-b border-white/5 space-y-2">
          <!-- Línea 1: OT + Semáforo Global + Badge de Día -->
          <div class="flex items-start justify-between gap-2">
            <div>
              <div class="flex items-center gap-1.5">
                <span class="text-xs font-mono font-black text-amber-400">
                  {{ s.codigo_ot }}
                </span>
                <span class="text-[10px] font-mono text-slate-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                  {{ s.id_negocio }}
                </span>
              </div>
              <h3 class="text-xs font-bold text-white mt-1 leading-snug line-clamp-1" :title="s.cliente">
                {{ s.cliente || 'Cliente no registrado' }}
              </h3>
              <p class="text-[10px] text-slate-400 truncate" :title="s.obra">
                📍 {{ s.obra || 'Obra no especificada' }}
              </p>
            </div>

            <!-- Badge Semáforo Global -->
            <div class="flex flex-col items-end gap-1 shrink-0">
              <span 
                class="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono border"
                :class="getBadgeClaseSemaforo(s.estado_global)"
              >
                {{ getEtiquetaSemaforo(s.estado_global) }}
              </span>
              <span v-if="s.candado_activo" class="text-[9px] text-purple-300 font-mono font-bold flex items-center gap-0.5">
                🔒 Concluido
              </span>
            </div>
          </div>

          <!-- SELECTOR DE EQUIPO / FLOTA ASIGNADA (CUANDO LA OT TIENE MÁS DE 1 EQUIPO) -->
          <div v-if="s.equipos && s.equipos.length > 1" class="pt-2 border-t border-white/5">
            <div class="flex items-center justify-between text-[10px] font-mono mb-1 text-slate-400">
              <span class="flex items-center gap-1">
                <span>🚜</span> Flota Asignada ({{ s.equipos.length }} equipos):
              </span>
              <span class="text-slate-500 text-[9px]">Click para alternar máquina</span>
            </div>
            <div class="flex items-center gap-1.5 overflow-x-auto py-0.5">
              <button 
                v-for="eq in s.equipos" 
                :key="eq.id_equipo"
                @click.stop="seleccionarEquipo(s.id_proyecto, eq.id_equipo)"
                class="px-2 py-1 rounded text-[10px] font-mono font-bold border transition-all flex items-center gap-1.5 shrink-0"
                :class="getEquipoActivo(s).id_equipo === eq.id_equipo 
                  ? 'bg-blue-600/30 border-blue-400 text-white shadow-sm ring-1 ring-blue-500/50' 
                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'"
                :title="`${eq.patente || ''} - ${eq.modelo || ''} (${eq.operador || 'Sin operador'})`"
              >
                <span>{{ eq.es_equipo_faena ? '🚜' : '🚛' }}</span>
                <span class="truncate max-w-[85px]">{{ eq.patente || eq.modelo }}</span>
                <span 
                  class="w-2 h-2 rounded-full shrink-0"
                  :class="getPuntoClaseSemaforo(eq.estado_equipo)"
                ></span>
              </button>
            </div>
          </div>

          <!-- RIBBON HORIZONTAL DE JORNADAS MULTI-DÍA (REQ-1012 / SPEC-066) -->
          <div class="pt-2 border-t border-white/5 space-y-1.5">
            <div class="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span class="flex items-center gap-1">
                <span>🗓️</span>
                <strong class="text-slate-300">Ribbon de Jornadas</strong>
                <span class="text-slate-500">({{ getEquipoActivo(s).dias_totales || s.dias_totales }} días):</span>
              </span>
              <span class="text-[9px] text-cyan-400 font-bold font-mono">
                Día seleccionado: {{ getDiaSeleccionado(s) }} de {{ getEquipoActivo(s).dias_totales || s.dias_totales }}
              </span>
            </div>

            <!-- Scroll Horizontal de Cápsulas Interactivas de Jornadas -->
            <div class="flex items-center gap-1.5 overflow-x-auto py-1">
              <button 
                v-for="(d, idxDia) in (getEquipoActivo(s).franja_multidia || s.franja_multidia)" 
                :key="'dia-' + (d.fecha || idxDia)"
                type="button"
                @click.stop="seleccionarDia(s, d)"
                class="relative px-2.5 py-1.5 pr-4 rounded-lg text-[10px] font-mono font-bold border transition-all text-center flex flex-col items-center justify-center shrink-0 cursor-pointer select-none group/capsula"
                :class="[
                  esCapsulaSeleccionada(s, d)
                    ? (d.es_laboral === false
                        ? 'ring-2 ring-red-400 border-red-400 bg-red-950/90 text-red-100 shadow-md'
                        : 'ring-2 ring-cyan-400 border-cyan-400 bg-cyan-950/50 text-white shadow-md')
                    : d.es_laboral === false
                    ? 'bg-red-950/80 text-red-200 border-red-500/80 hover:bg-red-900/85'
                    : getClaseFranjaDia(d)
                ]"
                :title="d.es_laboral === false
                  ? `${d.motivo_no_laboral || 'Fin de Semana / Feriado'} (${d.fecha}) — NO LABORAL. Usa el botón [+] de la esquina para habilitarlo como laboral.`
                  : `Día ${d.dia} (${d.fecha}) — Clic para ver/editar horas. Usa la [✕] de la esquina para marcar como No Laboral.`"
              >
                <!-- Botón esquina independiente: [+] para pasar a Laboral | [✕] para pasar a No Laboral -->
                <span
                  v-if="d.es_laboral === false"
                  @click.stop="cambiarEstadoLaboralDia(s, d, true)"
                  class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center shadow border border-emerald-300/60 cursor-pointer transition-transform hover:scale-110"
                  title="Habilitar este día como Día Laboral"
                >+</span>
                <span
                  v-else
                  @click.stop="cambiarEstadoLaboralDia(s, d, false)"
                  class="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white text-[8px] font-black flex items-center justify-center shadow border border-white/20 cursor-pointer transition-transform hover:scale-110"
                  title="Marcar este día como No Laboral (FDS / Festivo / Sin Faena)"
                >✕</span>

                <!-- Contenido Día No Laboral (Rojo: SÁB FDS / DOM FDS / FERIADO) -->
                <template v-if="d.es_laboral === false">
                  <div class="flex items-center gap-1 text-red-300 font-extrabold">
                    <span>🚫</span>
                    <span>{{ d.etiqueta_no_laboral || 'FDS' }}</span>
                  </div>
                  <div class="text-[8px] text-red-200/90 mt-0.5 flex items-center gap-1 font-normal">
                    <span>{{ formatearFechaCorta(d.fecha) }}</span>
                    <span class="px-1 rounded bg-red-500/30 text-[7px] font-bold uppercase">No Lab</span>
                  </div>
                </template>

                <!-- Contenido Día Laboral (D1, D2... o FDS habilitado) -->
                <template v-else>
                  <div class="flex items-center gap-1">
                    <span 
                      v-if="d.tiene_report" 
                      @click.stop="abrirVisorReportDirecto(s, d)"
                      class="text-emerald-400 font-black hover:scale-125 transition-transform" 
                      title="Abrir Report Diario emitido de este día"
                    >✓</span>
                    <span v-else-if="d.es_hoy" class="text-amber-400 font-black">▶</span>
                    <span>D{{ d.dia }}</span>
                    <span v-if="d.es_fds_o_feriado" class="text-[7px] px-1 py-0.2 rounded bg-amber-500/30 text-amber-200">FDS</span>
                    <span v-if="d.es_fin" class="text-[8px] px-1 py-0.2 rounded bg-purple-500/30 text-purple-200">FIN</span>
                  </div>
                  <div class="text-[8px] opacity-80 mt-0.5 flex items-center gap-1 font-normal">
                    <span>{{ formatearFechaCorta(d.fecha) }}</span>
                    <span 
                      v-if="d.tiene_viaje" 
                      @click.stop="abrirTelemetriaViaje(s, d)"
                      class="hover:scale-125 transition-transform cursor-pointer" 
                      title="Abrir Telemetría GPS de este día"
                    >🛰️</span>
                    <span
                      v-if="d.documentos_dia && d.documentos_dia.length > 0"
                      class="text-cyan-300 font-bold"
                      :title="`${d.documentos_dia.length} documento(s) adjunto(s) en este día`"
                    >📎{{ d.documentos_dia.length > 1 ? d.documentos_dia.length : '' }}</span>
                    <span
                      v-if="d.obs_validador"
                      class="text-amber-300 font-bold"
                      :title="`Observación Validación: ${d.obs_validador}`"
                    >💬</span>
                  </div>
                </template>
              </button>
            </div>
          </div>

          <!-- RECURSOS: GRÚA & OPERADOR (CON BOTÓN DIRECTO WHATSAPP) -->
          <div class="bg-black/30 border border-white/5 rounded-lg p-2 flex items-center justify-between gap-2 text-xs">
            <div class="truncate">
              <div class="text-[10px] text-slate-400 font-mono">
                {{ getEquipoActivo(s).es_equipo_faena === false ? 'Vehículo Traslado / Apoyo:' : 'Equipo Operativo:' }}
              </div>
              <div class="text-xs font-bold text-white truncate" :title="getEquipoActivo(s).nombre_completo || s.equipo_principal">
                {{ getEquipoActivo(s).es_equipo_faena === false ? '🚛' : '🚜' }} 
                {{ getEquipoActivo(s).nombre_completo || s.equipo_principal }}
              </div>
            </div>

            <div class="text-right shrink-0">
              <div class="text-[10px] text-slate-400 font-mono">Operador / Conductor:</div>
              <div class="flex items-center gap-1.5 justify-end">
                <span class="text-xs font-bold text-amber-300 truncate max-w-[110px]" :title="getJornadaSeleccionada(s)?.operador || getEquipoActivo(s).operador || s.operador">
                  👤 {{ getJornadaSeleccionada(s)?.operador || getEquipoActivo(s).operador || s.operador }}
                </span>
                <a 
                  v-if="getJornadaSeleccionada(s)?.telefono_operador || getEquipoActivo(s).telefono_operador || s.telefono_operador" 
                  :href="getWhatsAppLink(getEquipoActivo(s), s)"
                  target="_blank"
                  class="p-1 rounded bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all text-[11px]"
                  :title="`Contactar a ${getJornadaSeleccionada(s)?.operador || getEquipoActivo(s).operador || s.operador} por WhatsApp`"
                >
                  💬
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- CUERPO: DESGLOSE DE ACTIVIDADES PLAN VS REAL DE LA JORNADA SELECCIONADA -->
        <div class="p-3.5 space-y-2 flex-1">
          <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-1.5 flex justify-between items-center gap-1 flex-wrap">
            <span class="flex items-center gap-1.5">
              <span>Actividad Planificada</span>
              <span 
                class="px-1.5 py-0.2 rounded text-[9px] font-mono font-black border"
                :class="getJornadaSeleccionada(s)?.es_hoy ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-blue-500/20 text-blue-300 border-blue-500/30'"
              >
                {{ getJornadaSeleccionada(s)?.es_hoy ? `▶ DÍA ${getDiaSeleccionado(s)} (HOY)` : `DÍA ${getDiaSeleccionado(s)} • ${formatearFechaCorta(getJornadaSeleccionada(s)?.fecha)}` }}
              </span>
            </span>
            <div class="flex items-center gap-1.5">
              <button
                type="button"
                @click.stop="abrirModalAdjuntarDocDia(s, getJornadaSeleccionada(s))"
                class="px-2 py-0.5 rounded bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-300 hover:text-white border border-cyan-500/40 text-[9px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all"
                title="Adjuntar cualquier documento, respaldo o fotografía asociada a este día de servicio"
              >
                <span>📎</span>
                <span>Adjuntar Documento</span>
                <span v-if="getJornadaSeleccionada(s)?.documentos_dia?.length" class="px-1 rounded bg-cyan-500/30 text-white text-[8px]">
                  {{ getJornadaSeleccionada(s).documentos_dia.length }}
                </span>
              </button>
              <button 
                v-if="!getJornadaSeleccionada(s)?.es_hoy && (getEquipoActivo(s).dia_actual || s.dia_actual)"
                @click.stop="irADiaHoy(s)"
                type="button"
                class="text-[9px] text-cyan-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                title="Volver a la jornada activa de hoy"
              >
                <span>↩ Ir a Hoy (D{{ getEquipoActivo(s).dia_actual || s.dia_actual }})</span>
              </button>
              <span>Plan vs Real</span>
            </div>
          </div>

          <div v-if="getJornadaSeleccionada(s)?.es_laboral === false" class="p-3 rounded-lg border border-red-500/40 bg-red-950/30 text-xs flex items-center justify-between gap-2">
            <div class="text-red-200">
              <strong class="block text-red-300 font-mono">🚫 {{ getJornadaSeleccionada(s)?.motivo_no_laboral || 'Fin de Semana / Feriado' }} ({{ formatearFechaCorta(getJornadaSeleccionada(s)?.fecha) }})</strong>
              <span class="text-[11px] text-red-200/80">Día marcado como No Laboral. Si se trabajará este día, habilítalo para gestionar sus horas.</span>
            </div>
            <button
              type="button"
              @click.stop="cambiarEstadoLaboralDia(s, getJornadaSeleccionada(s), true)"
              class="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-[10px] shrink-0 cursor-pointer shadow"
            >
              + Habilitar Laboral
            </button>
          </div>

          <div v-else class="space-y-1.5">
            <div 
              v-for="act in getActividadesMostradas(s)" 
              :key="act.clave"
              class="flex items-center justify-between p-1.5 rounded-lg border text-xs font-mono transition-colors"
              :class="getClaseFilaActividad(act.estado)"
            >
              <!-- Nombre e ícono del Hito + Accesos Directos a Telemetría y Report -->
              <div class="flex items-center gap-1.5 truncate">
                <span class="text-xs">{{ getIconoActividad(act.clave) }}</span>
                <span class="truncate" :class="act.ejecutado ? 'text-white' : 'text-slate-300'">
                  {{ act.nombre }}
                </span>
                <!-- Acceso rápido a Telemetría GPS en hitos de viaje -->
                <button 
                  v-if="['SALIDA_BASE', 'LLEGADA_FAENA', 'VIAJE_RETORNO'].includes(act.clave) && (getJornadaSeleccionada(s)?.tiene_viaje || getEquipoActivo(s).tiene_viaje)"
                  @click.stop="abrirTelemetriaViaje(s, getJornadaSeleccionada(s))"
                  type="button"
                  class="ml-1 px-1.5 py-0.2 rounded bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 text-[9px] font-bold border border-cyan-500/30 flex items-center gap-0.5 cursor-pointer transition-all shrink-0"
                  title="Abrir Hoja de Ruta & Telemetría GPS satelital"
                >
                  <span>🛰️</span>
                  <span class="hidden sm:inline">Ruta</span>
                </button>
                <!-- Acceso rápido a Report Diario en hitos de faena -->
                <button 
                  v-if="['REPORT_INICIO', 'REPORT_TERMINO'].includes(act.clave) && getJornadaSeleccionada(s)?.tiene_report"
                  @click.stop="abrirVisorReportDirecto(s, getJornadaSeleccionada(s))"
                  type="button"
                  class="ml-1 px-1.5 py-0.2 rounded bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 text-[9px] font-bold border border-emerald-500/30 flex items-center gap-0.5 cursor-pointer transition-all shrink-0"
                  title="Ver Report Diario sellado con firma digital"
                >
                  <span>📋</span>
                  <span class="hidden sm:inline">Report</span>
                </button>
              </div>

              <!-- Tiempos Plan vs Real + Desvío + Edición Rápida Yiara/Adm (REQ-997) -->
              <div class="flex items-center gap-2 shrink-0">
                <span class="text-slate-400 text-[10px]">{{ act.hora_plan || '--:--' }}</span>
                <span class="text-slate-600">➔</span>

                <!-- Modo Edición Inline -->
                <div v-if="editandoHitoKey === getHitoKey(s, act)" class="flex items-center gap-1" @click.stop>
                  <input
                    type="time"
                    v-model="horaOverrideInput"
                    class="bg-slate-900 border border-cyan-400 rounded px-1.5 py-0.5 text-xs text-cyan-300 font-mono font-bold outline-none [color-scheme:dark]"
                    @keyup.enter="guardarOverrideHito(s, act)"
                    @keyup.esc="cancelarEdicionHito"
                  />
                  <button
                    type="button"
                    @click.stop="guardarOverrideHito(s, act)"
                    class="px-1.5 py-0.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[10px] rounded cursor-pointer transition-all"
                    title="Guardar hora real (o dejar vacío --:-- si se borró)"
                    :disabled="guardandoOverride"
                  >✓</button>
                  <button
                    v-if="act.hora_real"
                    type="button"
                    @click.stop="limpiarHito(s, act)"
                    class="px-1.5 py-0.5 bg-rose-500/25 hover:bg-rose-500 text-rose-200 hover:text-white font-bold text-[10px] rounded border border-rose-500/40 cursor-pointer transition-all"
                    title="Dejar espacio vacío (--:--) / En ejecución"
                    :disabled="guardandoOverride"
                  >🗑️</button>
                  <button
                    type="button"
                    @click.stop="cancelarEdicionHito"
                    class="px-1.5 py-0.5 bg-white/10 hover:bg-white/20 text-slate-300 text-[10px] rounded cursor-pointer transition-all"
                    title="Cancelar"
                  >✕</button>
                </div>

                <!-- Modo Lectura con gatillo de edición -->
                <div v-else class="flex items-center gap-1 group/edit">
                  <span 
                    class="font-bold text-[11px] cursor-pointer hover:underline flex items-center gap-1" 
                    :class="getColorTextoReal(act.estado)"
                    @click.stop="iniciarEdicionHito(s, act)"
                    :title="act.override ? ('Hora ajustada manualmente por ' + (act.modificado_por || 'Torre de Control') + ' • Clic para corregir') : 'Clic para ingresar o corregir hora real'"
                  >
                    {{ act.hora_real || '--:--' }}
                  </span>
                  <button 
                    type="button" 
                    @click.stop="iniciarEdicionHito(s, act)" 
                    class="opacity-70 hover:opacity-100 text-slate-400 hover:text-cyan-400 text-[10px] p-0.5 cursor-pointer transition-opacity" 
                    title="Editar / Ingresar hora real"
                  >
                    ✏️
                  </button>
                  <span 
                    v-if="act.requiere_regularizacion || (act.override && !act.hora_real_original)" 
                    class="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold font-mono tracking-tight" 
                    title="Hora estimada ingresada en Torre de Control sin reporte móvil. Requiere regularización documental en ITS."
                  >
                    ⚠️ Req. Regularización
                  </span>
                  <span v-else-if="act.override" class="text-[9px] text-cyan-400" title="Ajustado manualmente por Torre de Control">⚙️</span>
                </div>

                <!-- Badge de Desvío / Estado -->
                <span 
                  class="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase border"
                  :class="getBadgeClaseSemaforo(act.estado)"
                >
                  {{ getTextoDesvio(act) }}
                </span>
              </div>
            </div>

            <!-- REQ-1099: Tira de Documentos / Fotos Adjuntos al Día Seleccionado -->
            <div
              v-if="getJornadaSeleccionada(s)?.documentos_dia && getJornadaSeleccionada(s).documentos_dia.length > 0"
              class="mt-2 pt-2 border-t border-white/10 space-y-1"
            >
              <div class="flex items-center justify-between text-[9.5px] font-mono text-cyan-300 font-bold">
                <span>📎 Documentos / Fotos del Día {{ getDiaSeleccionado(s) }} ({{ formatearFechaCorta(getJornadaSeleccionada(s)?.fecha) }}):</span>
                <button
                  type="button"
                  @click.stop="abrirModalAdjuntarDocDia(s, getJornadaSeleccionada(s))"
                  class="text-[9px] text-cyan-400 hover:text-white underline cursor-pointer"
                >
                  + Agregar otro
                </button>
              </div>
              <div class="flex flex-wrap gap-1.5">
                <div
                  v-for="doc in getJornadaSeleccionada(s).documentos_dia"
                  :key="doc.id_doc || doc.nombre_archivo"
                  class="flex items-center gap-1.5 bg-cyan-950/30 border border-cyan-500/30 rounded-md px-2 py-1 text-[10px] font-mono text-slate-200 max-w-full"
                >
                  <a
                    :href="getUrlDocumentoDia(doc)"
                    target="_blank"
                    class="flex items-center gap-1 hover:text-cyan-300 truncate max-w-[190px]"
                    :title="`${doc.titulo || doc.nombre_archivo}${doc.descripcion ? ' — ' + doc.descripcion : ''} (Clic para abrir)`"
                  >
                    <span>📄</span>
                    <span class="truncate font-semibold">{{ doc.titulo || doc.nombre_archivo }}</span>
                    <span class="text-cyan-400 text-[9px] shrink-0">↗</span>
                  </a>
                  <button
                    v-if="doc.id_doc"
                    type="button"
                    @click.stop="eliminarDocumentoDia(s, getJornadaSeleccionada(s), doc)"
                    class="text-slate-400 hover:text-rose-400 text-[10px] leading-none cursor-pointer ml-0.5"
                    title="Quitar documento del día"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>

            <!-- REQ-1120: Observaciones de Validación del Report Diario (visible para RRHH/Operaciones y editable en PMO) -->
            <div class="mt-2 pt-2 border-t border-white/10">
              <div
                v-if="editandoObsValidadorKey === getObsValidadorKey(s)"
                class="bg-amber-950/30 border border-amber-500/40 rounded-lg p-2 space-y-1.5"
                @click.stop
              >
                <div class="flex items-center justify-between text-[9.5px] font-mono text-amber-300 font-bold">
                  <span>🛡️ Observaciones de Validación — Día {{ getDiaSeleccionado(s) }} ({{ formatearFechaCorta(getJornadaSeleccionada(s)?.fecha) }})</span>
                  <span class="text-[8.5px] text-slate-400">Sincronizado con Report Diario</span>
                </div>
                <textarea
                  v-model="obsValidadorInput"
                  rows="2"
                  placeholder="Ej: Cuadratura horaria conforme con la OT y parte de terreno..."
                  class="w-full bg-[#050810] border border-amber-500/40 rounded px-2 py-1 text-[11px] text-white focus:border-amber-400 focus:outline-none resize-none"
                ></textarea>
                <div class="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    @click.stop="cancelarEdicionObsValidador"
                    class="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-slate-300 text-[10px] font-mono cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    @click.stop="guardarObsValidadorDia(s)"
                    :disabled="guardandoObsValidador"
                    class="px-2.5 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-mono font-black cursor-pointer disabled:opacity-50"
                  >
                    {{ guardandoObsValidador ? '⏳...' : '💾 Guardar Observación' }}
                  </button>
                </div>
              </div>

              <div
                v-else-if="getJornadaSeleccionada(s)?.obs_validador"
                class="bg-amber-950/20 border border-amber-500/30 rounded-lg px-2.5 py-1.5 flex items-start justify-between gap-2 group/obs"
              >
                <div class="text-[10.5px] text-amber-100 leading-snug">
                  <span class="text-[9px] font-mono font-bold uppercase text-amber-400 block">
                    🛡️ Obs. Validación Report (D{{ getDiaSeleccionado(s) }}):
                  </span>
                  <span class="italic">"{{ getJornadaSeleccionada(s).obs_validador }}"</span>
                </div>
                <button
                  type="button"
                  @click.stop="iniciarEdicionObsValidador(s)"
                  class="text-[10px] text-amber-300 hover:text-white px-1.5 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/30 border border-amber-500/30 font-mono shrink-0 cursor-pointer"
                  title="Editar Observaciones de Validación del Report Diario"
                >
                  ✏️ Editar
                </button>
              </div>

              <div v-else class="flex items-center justify-between text-[9.5px] font-mono text-slate-400">
                <span>🛡️ Obs. Validación Report (D{{ getDiaSeleccionado(s) }}): <em class="text-slate-500">Sin observaciones</em></span>
                <button
                  type="button"
                  @click.stop="iniciarEdicionObsValidador(s)"
                  class="text-[9.5px] text-amber-400 hover:text-amber-300 underline cursor-pointer"
                >
                  + Agregar Obs. Validación
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- SECCIÓN: PIPELINE DOCUMENTAL & LIQUIDACIÓN (REQ-991: ITS -> EDP -> OC -> FACTURA) -->
        <div class="px-3.5 py-2.5 bg-black/40 border-t border-white/5 space-y-1.5">
          <div class="flex items-center justify-between text-[10px] font-mono">
            <span class="text-slate-400 font-bold flex items-center gap-1">
              <span>📄</span> Pipeline Documental:
            </span>
            <span 
              v-if="s.documental?.alerta_sla" 
              class="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase"
              :class="s.documental.its?.estado === 'rojo_sla' ? 'bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'"
            >
              ⚠️ {{ s.documental.alerta_sla }}
            </span>
          </div>

          <!-- Banda de 4 Hitos Interactivos (Click para abrir modales directos) -->
          <div class="grid grid-cols-4 gap-1.5 text-center font-mono">
            <!-- 1. ITS -->
            <button
              type="button"
              @click.stop="abrirModalITS(s)"
              class="p-1.5 rounded-lg border text-[10px] font-bold transition-all flex flex-col items-center justify-center cursor-pointer hover:scale-[1.03]"
              :class="getClaseBadgeDocumental(s.documental?.its?.estado)"
              :title="`ITS: ${s.documental?.its?.etiqueta || 'Pendiente'}${s.documental?.its?.alerta_sla ? ' - ' + s.documental.its.alerta_sla : ''} (Clic para abrir)`"
            >
              <span class="text-[9px] opacity-75">1. ITS</span>
              <span class="truncate max-w-[70px] mt-0.5 leading-tight">
                {{ s.documental?.its?.folio || s.documental?.its?.etiqueta || 'Pendiente' }}
              </span>
            </button>

            <!-- 2. EDP -->
            <button
              type="button"
              @click.stop="abrirModalEDP(s)"
              class="p-1.5 rounded-lg border text-[10px] font-bold transition-all flex flex-col items-center justify-center cursor-pointer hover:scale-[1.03]"
              :class="getClaseBadgeDocumental(s.documental?.edp?.estado)"
              :title="`EDP: ${s.documental?.edp?.etiqueta || 'Pendiente'} (Clic para abrir)`"
            >
              <span class="text-[9px] opacity-75">2. EDP</span>
              <span class="truncate max-w-[70px] mt-0.5 leading-tight">
                {{ s.documental?.edp?.numero || s.documental?.edp?.etiqueta || 'Pendiente' }}
              </span>
            </button>

            <!-- 3. OC -->
            <button
              type="button"
              @click.stop="abrirModalOC(s)"
              class="p-1.5 rounded-lg border text-[10px] font-bold transition-all flex flex-col items-center justify-center cursor-pointer hover:scale-[1.03]"
              :class="getClaseBadgeDocumental(s.documental?.oc?.estado)"
              :title="`OC / HES: ${s.documental?.oc?.numero || s.documental?.oc?.etiqueta || 'Pendiente'} (Clic para ver)`"
            >
              <span class="text-[9px] opacity-75">3. OC</span>
              <span class="truncate max-w-[70px] mt-0.5 leading-tight">
                {{ s.documental?.oc?.numero ? 'OC ' + s.documental.oc.numero : (s.documental?.oc?.etiqueta || 'Pendiente') }}
              </span>
            </button>

            <!-- 4. FACTURA -->
            <button
              type="button"
              @click.stop="abrirModalFactura(s)"
              class="p-1.5 rounded-lg border text-[10px] font-bold transition-all flex flex-col items-center justify-center cursor-pointer hover:scale-[1.03]"
              :class="getClaseBadgeDocumental(s.documental?.factura?.estado)"
              :title="`Factura: ${s.documental?.factura?.numero || s.documental?.factura?.etiqueta || 'Pendiente'} (Clic para ver)`"
            >
              <span class="text-[9px] opacity-75">4. FAC</span>
              <span class="truncate max-w-[70px] mt-0.5 leading-tight">
                {{ s.documental?.factura?.numero ? 'Fac ' + s.documental.factura.numero : (s.documental?.factura?.etiqueta || 'Pendiente') }}
              </span>
            </button>
          </div>
        </div>

        <!-- PIE DE TARJETA: ACCIONES CONTEXTUALES DE YIARA -->
        <div class="p-2.5 bg-[#0a0f1e] border-t border-white/5 flex items-center justify-between gap-1.5">
          <button 
            @click="abrirDetalleTimeline(s)" 
            class="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[11px] font-bold border border-white/10 transition-colors flex items-center gap-1"
            title="Abrir Timeline Intradía 07:00 a 20:00"
          >
            <span>⏱️</span>
            <span>Timeline</span>
          </button>

          <div class="flex items-center gap-1.5">
            <!-- Botón Telemetría GPS de Ruta (REQ-1012) -->
            <button 
              v-if="tieneViajeDisponible(s)"
              @click="abrirTelemetriaViaje(s, getJornadaSeleccionada(s))"
              class="px-2.5 py-1 rounded bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white text-[11px] font-bold border border-cyan-500/30 transition-all flex items-center gap-1 cursor-pointer"
              title="Auditar Telemetría GPS satelital y Hoja de Ruta"
            >
              <span>🛰️ Telemetría</span>
            </button>

            <!-- Ver Report Sellado del Día Seleccionado (REQ-1012) -->
            <button 
              v-if="tieneReportDisponible(s)"
              @click="abrirVisorReportDirecto(s, getJornadaSeleccionada(s))" 
              class="px-2.5 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-[11px] font-bold border border-indigo-500/30 transition-all flex items-center gap-1 cursor-pointer"
              :title="`Auditar Report Diario (${getJornadaSeleccionada(s)?.tiene_report ? 'Día ' + getDiaSeleccionado(s) : 'Último sellado'})`"
            >
              <span>📋 Report D{{ getJornadaSeleccionada(s)?.dia || getDiaSeleccionado(s) }}</span>
            </button>

            <!-- Abrir PDF Oficial de la OT -->
            <button 
              @click="abrirPdfOT(s)" 
              :disabled="generandoOtId === s.id_proyecto"
              class="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer disabled:opacity-50"
              title="Abrir PDF Oficial de la Orden de Trabajo"
            >
              <span>{{ generandoOtId === s.id_proyecto ? '⏳ Abriendo...' : '📄 Abrir OT' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- PANEL LATERAL DESLIZABLE (DRAWER / SLIDE-OVER TIMELINE INTRADÍA 07:00 a 20:00) -->
    <div 
      v-if="drawerAbierto && servicioSeleccionado" 
      class="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-fadeIn"
      @click.self="drawerAbierto = false"
    >
      <div class="w-full max-w-lg bg-[#0a0f1e] border-l border-white/10 h-full flex flex-col shadow-2xl overflow-y-auto">
        <!-- Cabecera del Drawer -->
        <div class="p-4 bg-[#0f1629] border-b border-white/10 flex items-start justify-between gap-3 sticky top-0 z-10">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-mono font-black text-amber-400">
                {{ servicioSeleccionado.codigo_ot }}
              </span>
              <span 
                class="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono border"
                :class="getBadgeClaseSemaforo(servicioSeleccionado.estado_global)"
              >
                {{ getEtiquetaSemaforo(servicioSeleccionado.estado_global) }}
              </span>
            </div>
            <h3 class="text-sm font-bold text-white mt-1">{{ servicioSeleccionado.cliente }}</h3>
            <p class="text-xs text-slate-400">📍 {{ servicioSeleccionado.obra }}</p>
          </div>

          <button 
            @click="drawerAbierto = false" 
            class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 text-base"
          >
            ✕
          </button>
        </div>

        <!-- Contenido del Drawer: Resumen + Timeline Intradía -->
        <div class="p-4 space-y-4 flex-1">
          <!-- Selector de Flota en Drawer si tiene más de 1 equipo -->
          <div v-if="servicioSeleccionado.equipos && servicioSeleccionado.equipos.length > 1" class="bg-black/40 border border-white/10 rounded-xl p-2.5 space-y-1.5">
            <div class="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider flex items-center justify-between">
              <span>Flota Asignada ({{ servicioSeleccionado.equipos.length }} equipos):</span>
              <span class="text-slate-500 text-[9px]">Selecciona máquina a auditar</span>
            </div>
            <div class="flex items-center gap-1.5 overflow-x-auto py-0.5">
              <button 
                v-for="eq in servicioSeleccionado.equipos" 
                :key="'drw-'+eq.id_equipo"
                @click="seleccionarEquipo(servicioSeleccionado.id_proyecto, eq.id_equipo)"
                class="px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all flex items-center gap-1.5 shrink-0"
                :class="getEquipoActivo(servicioSeleccionado).id_equipo === eq.id_equipo 
                  ? 'bg-blue-600/30 border-blue-400 text-white shadow-sm ring-1 ring-blue-500/50' 
                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'"
              >
                <span>{{ eq.es_equipo_faena ? '🚜' : '🚛' }}</span>
                <span>{{ eq.patente || eq.modelo }}</span>
                <span 
                  class="w-2 h-2 rounded-full shrink-0"
                  :class="getPuntoClaseSemaforo(eq.estado_equipo)"
                ></span>
              </button>
            </div>
          </div>

          <!-- Tarjeta de Datos Operativos -->
          <div class="bg-black/30 border border-white/5 rounded-xl p-3 space-y-2 text-xs font-mono">
            <div class="flex justify-between">
              <span class="text-slate-400">Equipo Activo:</span>
              <strong class="text-white">{{ getEquipoActivo(servicioSeleccionado).nombre_completo || servicioSeleccionado.equipo_principal }}</strong>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Operador:</span>
              <strong class="text-amber-300">{{ getEquipoActivo(servicioSeleccionado).operador || servicioSeleccionado.operador }}</strong>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Día de Servicio:</span>
              <span class="text-white font-bold">Día {{ getEquipoActivo(servicioSeleccionado).dia_actual || servicioSeleccionado.dia_actual }} de {{ getEquipoActivo(servicioSeleccionado).dias_totales || servicioSeleccionado.dias_totales }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Candado Operativo:</span>
              <span :class="(getEquipoActivo(servicioSeleccionado).candado_activo ?? servicioSeleccionado.candado_activo) ? 'text-purple-400 font-bold' : 'text-slate-400'">
                {{ (getEquipoActivo(servicioSeleccionado).candado_activo ?? servicioSeleccionado.candado_activo) ? 'Activo (Servicio Concluido)' : 'Abierto' }}
              </span>
            </div>
          </div>

          <!-- Timeline Vertical Intradía (07:00 a 20:00) -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-black uppercase tracking-wider text-slate-300 font-mono">
                Línea de Tiempo Operativa (07:00 - 20:00)
              </h4>
              <span class="text-[10px] text-amber-400 font-mono font-bold">
                NOW: {{ horaChileStr }}
              </span>
            </div>

            <div class="relative border-l-2 border-white/10 ml-4 pl-4 space-y-6 py-2">
              <div 
                v-for="act in (getEquipoActivo(servicioSeleccionado).actividades || servicioSeleccionado.actividades)" 
                :key="'tl-'+act.clave"
                class="relative"
              >
                <!-- Punto en la línea de tiempo -->
                <div 
                  class="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full border-2 border-[#0a0f1e]"
                  :class="getPuntoClaseSemaforo(act.estado)"
                ></div>

                <!-- Detalle del Hito -->
                <div class="bg-[#0f1629] border border-white/5 rounded-xl p-3 space-y-1 shadow-sm">
                  <div class="flex items-center justify-between text-xs">
                    <span class="font-bold text-white flex items-center gap-1.5">
                      <span>{{ getIconoActividad(act.clave) }}</span>
                      <span>{{ act.nombre }}</span>
                    </span>
                    <span 
                      class="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase border"
                      :class="getBadgeClaseSemaforo(act.estado)"
                    >
                      {{ getEtiquetaSemaforo(act.estado) }}
                    </span>
                  </div>

                  <div class="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                    <div>
                      <span>Plan: </span>
                      <strong class="text-slate-200">{{ act.hora_plan || '--:--' }}</strong>
                    </div>
                    <div>
                      <span>Real: </span>
                      <strong :class="getColorTextoReal(act.estado)">{{ act.hora_real || 'Pendiente' }}</strong>
                      <span 
                        v-if="act.requiere_regularizacion || (act.override && !act.hora_real_original)" 
                        class="ml-1 text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold"
                        title="Hora estimada en Torre de Control. Requiere regularización documental."
                      >
                        ⚠️ Req. Regularización
                      </span>
                      <span v-else-if="act.override" class="ml-1 text-[9px] text-cyan-400" title="Ajustado manualmente">⚙️</span>
                    </div>
                  </div>

                  <div v-if="act.desvio_minutos !== null" class="text-[10px] font-mono text-slate-400 pt-0.5">
                    <span>Desvío: </span>
                    <span :class="act.desvio_minutos > 0 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'">
                      {{ act.desvio_minutos > 0 ? `+${act.desvio_minutos} min (retraso)` : `${act.desvio_minutos} min` }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pie del Drawer -->
        <div class="p-3 bg-[#0f1629] border-t border-white/10 flex items-center justify-between gap-2">
          <button 
            @click="drawerAbierto = false" 
            class="px-4 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold"
          >
            Cerrar
          </button>
          <button 
            @click="$emit('abrir-proyecto', servicioSeleccionado.id_proyecto)" 
            class="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md"
          >
            Abrir Expediente OT
          </button>
        </div>
      </div>
    </div>

    <!-- MODALES DE PIPELINE DOCUMENTAL (REQ-991: APERTURA DIRECTA SIN SALIR DE CONTROL EN VIVO) -->
    <!-- 1. Modal ITS -->
    <ModalITS
      v-if="modalITSAbierto"
      :visible="modalITSAbierto"
      :embedded="false"
      :id-proyecto="idProyectoModalITS"
      @close="modalITSAbierto = false"
      @actualizado="onItsActualizado"
    />

    <!-- 2. Modal Carátula EDP -->
    <ModalCaratulaEDP
      v-if="modalEDPAbierto"
      :visible="modalEDPAbierto"
      :edp-data="edpDataModal"
      :solo-lectura="false"
      @close="modalEDPAbierto = false"
      @edp-actualizado="onEdpActualizado"
    />

    <!-- 3. Modal Detalle OC / HES -->
    <div 
      v-if="modalOCAbierto && ocDataModal" 
      class="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
      @click.self="modalOCAbierto = false"
    >
      <div class="bg-[#0a0f1e] border border-white/20 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl text-left font-mono">
        <div class="flex items-center justify-between border-b border-white/10 pb-3">
          <div class="flex items-center gap-2">
            <span class="text-lg">📋</span>
            <h3 class="text-sm font-black text-white uppercase tracking-wider">Orden de Compra / HES</h3>
          </div>
          <button @click="modalOCAbierto = false" class="text-slate-400 hover:text-white text-base">✕</button>
        </div>

        <div class="space-y-2.5 text-xs">
          <div class="flex justify-between py-1 border-b border-white/5">
            <span class="text-slate-400">Servicio / OT:</span>
            <span class="text-amber-400 font-bold">{{ ocDataModal.codigo_ot }}</span>
          </div>
          <div class="flex justify-between py-1 border-b border-white/5">
            <span class="text-slate-400">Cliente:</span>
            <span class="text-white truncate max-w-[220px]">{{ ocDataModal.cliente }}</span>
          </div>
          <div class="flex justify-between py-1 border-b border-white/5">
            <span class="text-slate-400">Número de OC:</span>
            <span class="font-bold text-emerald-400">{{ ocDataModal.documental?.oc?.numero || 'Pendiente de emisión/recepción' }}</span>
          </div>
          <div class="flex justify-between py-1 border-b border-white/5">
            <span class="text-slate-400">Estado de Gestión:</span>
            <span 
              class="px-2 py-0.5 rounded text-[10px] font-bold uppercase border"
              :class="getClaseBadgeDocumental(ocDataModal.documental?.oc?.estado)"
            >
              {{ ocDataModal.documental?.oc?.estado === 'listo' ? '✅ RECIBIDA / REGISTRADA' : '⏳ EN GESTIÓN' }}
            </span>
          </div>
        </div>

        <div class="p-3 bg-white/5 rounded-xl text-[11px] text-slate-300 leading-relaxed">
          <p v-if="ocDataModal.documental?.oc?.numero">
            📌 La Orden de Compra se encuentra registrada formalmente en el expediente de la cotización/OT.
          </p>
          <p v-else>
            ⚠️ Aún no se ha adjuntado la Orden de Compra o HES del mandante. Para registrarla o adjuntarla, abre el expediente de la OT.
          </p>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2">
          <button 
            @click="modalOCAbierto = false"
            class="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
          >
            Cerrar
          </button>
          <button 
            @click="abrirExpedienteDesdeModal(ocDataModal.id_proyecto)"
            class="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md"
          >
            Abrir OT en Expediente
          </button>
        </div>
      </div>
    </div>

    <!-- 4. Modal Detalle Facturación ERP -->
    <div 
      v-if="modalFacturaAbierto && facturaDataModal" 
      class="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
      @click.self="modalFacturaAbierto = false"
    >
      <div class="bg-[#0a0f1e] border border-white/20 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl text-left font-mono">
        <div class="flex items-center justify-between border-b border-white/10 pb-3">
          <div class="flex items-center gap-2">
            <span class="text-lg">💰</span>
            <h3 class="text-sm font-black text-white uppercase tracking-wider">Facturación ERP</h3>
          </div>
          <button @click="modalFacturaAbierto = false" class="text-slate-400 hover:text-white text-base">✕</button>
        </div>

        <div class="space-y-2.5 text-xs">
          <div class="flex justify-between py-1 border-b border-white/5">
            <span class="text-slate-400">Servicio / OT:</span>
            <span class="text-amber-400 font-bold">{{ facturaDataModal.codigo_ot }}</span>
          </div>
          <div class="flex justify-between py-1 border-b border-white/5">
            <span class="text-slate-400">Cliente:</span>
            <span class="text-white truncate max-w-[220px]">{{ facturaDataModal.cliente }}</span>
          </div>
          <div class="flex justify-between py-1 border-b border-white/5">
            <span class="text-slate-400">Folio Factura ERP:</span>
            <span class="font-bold text-emerald-400">{{ facturaDataModal.documental?.factura?.numero || 'Pendiente de emisión' }}</span>
          </div>
          <div v-if="facturaDataModal.documental?.factura?.fecha" class="flex justify-between py-1 border-b border-white/5">
            <span class="text-slate-400">Fecha Facturación:</span>
            <span class="text-slate-200">{{ facturaDataModal.documental.factura.fecha }}</span>
          </div>
          <div class="flex justify-between py-1 border-b border-white/5">
            <span class="text-slate-400">Estado de Facturación:</span>
            <span 
              class="px-2 py-0.5 rounded text-[10px] font-bold uppercase border"
              :class="getClaseBadgeDocumental(facturaDataModal.documental?.factura?.estado)"
            >
              {{ facturaDataModal.documental?.factura?.estado === 'listo' ? '✅ FACTURADO' : '⏳ PENDIENTE' }}
            </span>
          </div>
        </div>

        <div class="p-3 bg-white/5 rounded-xl text-[11px] text-slate-300 leading-relaxed">
          <p v-if="facturaDataModal.documental?.factura?.numero">
            📌 Factura sincronizada con ERP / Carátula de EDP.
          </p>
          <p v-else>
            ⚠️ La factura no ha sido emitida o sincronizada aún. Requiere EDP aprobado previamente.
          </p>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2">
          <button 
            @click="modalFacturaAbierto = false"
            class="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
          >
            Cerrar
          </button>
          <button 
            @click="abrirExpedienteDesdeModal(facturaDataModal.id_proyecto)"
            class="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md"
          >
            Abrir OT en Expediente
          </button>
        </div>
      </div>
    </div>

    <!-- 5. Modal Hoja de Ruta & Telemetría GPS Satelital (REQ-1012 / SPEC-066) -->
    <ModalMapaViaje
      v-if="modalMapaViajeAbierto"
      :visible="modalMapaViajeAbierto"
      :viaje="viajeSeleccionadoTelemetria"
      @close="modalMapaViajeAbierto = false"
      @update:visible="modalMapaViajeAbierto = $event"
    />

    <!-- 6. Modal Visor de Report Diario FES Directo (REQ-1012 / SPEC-066) -->
    <ModalVisorReport
      v-if="modalVisorReportAbierto"
      :visible="modalVisorReportAbierto"
      :report="reportSeleccionadoVisor"
      :readonly="false"
      :modo-edicion-inicial="true"
      @close="modalVisorReportAbierto = false"
      @report-validado="onReportValidadoEnVivo"
    />

    <!-- 7. REQ-1099: Modal Transversal para Adjuntar Cualquier Documento o Foto al Día de Servicio -->
    <div
      v-if="modalAdjuntarDocDiaAbierto && ctxAdjuntarDocDia"
      class="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn"
      @click.self="cerrarModalAdjuntarDocDia"
    >
      <div class="bg-[#0b1021] border border-cyan-500/40 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl shadow-black text-slate-200">
        <div class="bg-[#050810] px-5 py-3.5 border-b border-white/10 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="text-xl">📎</span>
            <div>
              <h3 class="text-sm font-black text-white uppercase tracking-wider font-mono">
                Adjuntar Documento / Fotografía al Día {{ ctxAdjuntarDocDia.dia }}
              </h3>
              <p class="text-[11px] text-slate-400 font-mono">
                OT <strong class="text-amber-400">{{ ctxAdjuntarDocDia.codigo_ot }}</strong> • {{ ctxAdjuntarDocDia.cliente }} • Fecha: <strong class="text-cyan-300">{{ formatearFechaCorta(ctxAdjuntarDocDia.fecha) }}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            @click="cerrarModalAdjuntarDocDia"
            class="text-slate-400 hover:text-white text-xl font-bold leading-none cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form @submit.prevent="ejecutarSubidaDocDia" class="p-5 space-y-4">
          <p class="text-xs text-slate-300 bg-cyan-950/20 border border-cyan-500/20 rounded-lg p-2.5 leading-relaxed">
            Puedes adjuntar cualquier documento o fotografía de situaciones ocurridas durante el desarrollo del servicio en este día (report físico, fotografía en terreno, guía, acta, observación o comprobante). Quedará asociado tanto a este día como al Dossier de la OT.
          </p>

          <div>
            <label class="block text-[11px] font-bold uppercase text-slate-300 font-mono mb-1.5">
              1. Seleccionar Archivo o Fotografía (PDF, Imagen, Word, Excel) *
            </label>
            <input
              ref="inputArchivoDocDiaRef"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
              @change="onFileChangeDocDia"
              class="w-full text-xs text-slate-300 bg-[#050810] border border-white/15 rounded-lg p-2 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-cyan-600 file:text-white hover:file:bg-cyan-500 cursor-pointer"
            />
          </div>

          <div>
            <label class="block text-[11px] font-bold uppercase text-slate-300 font-mono mb-1.5">
              2. Etiqueta / Descripción del Documento (Opcional)
            </label>
            <input
              type="text"
              v-model="formDocDia.titulo"
              placeholder="Ej: Report físico firmado, Foto condición terreno, Guía cliente..."
              class="w-full bg-[#050810] border border-white/15 focus:border-cyan-400 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          <!-- Lista de documentos ya asociados a este día -->
          <div v-if="ctxAdjuntarDocDia.documentos_dia?.length" class="space-y-1.5 pt-2 border-t border-white/10">
            <span class="block text-[10px] font-mono font-bold uppercase text-cyan-300">
              Documentos ya asociados al Día {{ ctxAdjuntarDocDia.dia }} ({{ formatearFechaCorta(ctxAdjuntarDocDia.fecha) }}):
            </span>
            <div class="max-h-32 overflow-y-auto space-y-1">
              <div
                v-for="doc in ctxAdjuntarDocDia.documentos_dia"
                :key="doc.id_doc || doc.nombre_archivo"
                class="flex items-center justify-between bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono"
              >
                <a
                  :href="getUrlDocumentoDia(doc)"
                  target="_blank"
                  class="flex items-center gap-1.5 text-cyan-300 hover:underline truncate"
                >
                  <span>📄</span>
                  <span class="truncate">{{ doc.titulo || doc.nombre_archivo }}</span>
                  <span class="text-[10px]">↗</span>
                </a>
                <span class="text-[10px] text-slate-500 ml-2 shrink-0">{{ doc.subido_por || '' }}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
            <button
              type="button"
              @click="cerrarModalAdjuntarDocDia"
              class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-white/10 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="!archivoDocDiaSeleccionado || subiendoDocDia"
              class="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold font-mono shadow-lg disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              <span v-if="subiendoDocDia">⏳ Subiendo...</span>
              <span v-else>📎 Adjuntar al Día {{ ctxAdjuntarDocDia.dia }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { apiAxios } from '@/services/api'
import ModalITS from '@/components/Operaciones/ModalITS.vue'
import ModalCaratulaEDP from '@/components/Operaciones/ModalCaratulaEDP.vue'
import ModalMapaViaje from '@/components/Operaciones/ModalMapaViaje.vue'
import ModalVisorReport from '@/components/Operaciones/ModalVisorReport.vue'

const emit = defineEmits(['abrir-proyecto', 'ver-report'])

// Estado de Datos
const cargando = ref(false)
const servicios = ref([])
const kpis = ref({
  total_ots: 0,
  rojo: 0,
  amarillo: 0,
  azul: 0,
  verde: 0,
  negro: 0,
  terminado: 0,
  sinplan: 0,
  pipeline: { its_listos: 0, its_sla_retraso: 0, edp_listos: 0, oc_listas: 0, facturas_listas: 0 }
})
const fechaFiltro = ref(new Date().toLocaleDateString('en-CA')) // YYYY-MM-DD
const horaChileStr = ref('--:--:--')
const ventanaActiva = ref(true)
const notificacionesWeb = ref([])
const modalAlertasAbierto = ref(false)

// Modales de Pipeline Documental (REQ-991)
const modalITSAbierto = ref(false)
const idProyectoModalITS = ref(null)
const modalEDPAbierto = ref(false)
const edpDataModal = ref(null)
const cargandoEDP = ref(false)
const modalOCAbierto = ref(false)
const ocDataModal = ref(null)
const modalFacturaAbierto = ref(false)
const facturaDataModal = ref(null)

// Modales de Telemetría GPS y Visor Report Directo (REQ-1012 / SPEC-066)
const modalMapaViajeAbierto = ref(false)
const viajeSeleccionadoTelemetria = ref(null)
const cargandoViaje = ref(false)

const modalVisorReportAbierto = ref(false)
const reportSeleccionadoVisor = ref(null)
const cargandoReport = ref(false)

// Drawer Timeline
const drawerAbierto = ref(false)
const servicioSeleccionado = ref(null)

// Selección interactiva de Equipo por OT (para OTs con flota múltiple)
const selectedEquipoIdByOt = ref({})

const seleccionarEquipo = (idProyecto, idEquipo) => {
  if (!idProyecto) return
  selectedEquipoIdByOt.value[idProyecto] = idEquipo
}

const getEquipoActivo = (s) => {
  if (!s) return {}
  if (!s.equipos || s.equipos.length === 0) return s
  const selectedId = selectedEquipoIdByOt.value[s.id_proyecto]
  if (selectedId) {
    const found = s.equipos.find(e => e.id_equipo === selectedId)
    if (found) return found
  }
  return s.equipos[0]
}

// REQ-1012 / SPEC-066: Navegación Multi-Día en Ribbon Horizontal
const selectedDiaByOt = ref({})
const selectedFechaByOt = ref({})

const seleccionarDia = async (s, d) => {
  if (!d) return
  if (s && s.id_proyecto) {
    if (d.fecha) {
      selectedFechaByOt.value = { ...selectedFechaByOt.value, [s.id_proyecto]: d.fecha }
    }
    if (d.dia) {
      selectedDiaByOt.value = { ...selectedDiaByOt.value, [s.id_proyecto]: Number(d.dia) }
    }
  }
}

const esCapsulaSeleccionada = (s, d) => {
  if (!s || !d) return false
  const fSel = selectedFechaByOt.value[s.id_proyecto]
  if (fSel && d.fecha) return fSel === d.fecha
  return d.es_laboral !== false && getDiaSeleccionado(s) === d.dia
}

const cambiarEstadoLaboralDia = async (s, d, nuevoEstadoLaboral) => {
  if (!s || !d || !d.fecha) return
  try {
    guardandoOverride.value = true
    const { data } = await apiAxios.post('/operaciones/control-vivo/override-hito', {
      id_proyecto: s.id_proyecto,
      fecha: d.fecha,
      clave_actividad: 'TOGGLE_DIA_LABORAL',
      es_laboral: Boolean(nuevoEstadoLaboral)
    })
    if (data && data.success) {
      selectedFechaByOt.value = { ...selectedFechaByOt.value, [s.id_proyecto]: d.fecha }
      await cargarDatos()
    }
  } catch (err) {
    console.error('Error cambiando estado laboral del día:', err)
    alert('❌ No se pudo cambiar el estado del día: ' + (err.response?.data?.message || err.message))
  } finally {
    guardandoOverride.value = false
  }
}

const generandoOtId = ref(null)

const abrirPdfOT = async (s) => {
  if (!s?.id_proyecto) return
  const base = (apiAxios.defaults.baseURL || '').replace(/\/$/, '')
  if (s.ot_id_doc) {
    window.open(`${base}/v1/storage/view/${s.ot_id_doc}`, '_blank')
    return
  }
  if (s.ot_url) {
    const fullUrl = s.ot_url.startsWith('http') ? s.ot_url : `${base.replace(/\/api$/, '')}${s.ot_url}`
    window.open(fullUrl, '_blank')
    return
  }
  generandoOtId.value = s.id_proyecto
  try {
    const { data } = await apiAxios.post(`/proyectos/${s.id_proyecto}/generar-ot`, {})
    if (data?.ot?.id_doc) {
      s.ot_id_doc = data.ot.id_doc
      window.open(`${base}/v1/storage/view/${data.ot.id_doc}`, '_blank')
    } else if (data?.ot?.url) {
      s.ot_url = data.ot.url
      const fullUrl = data.ot.url.startsWith('http') ? data.ot.url : `${base.replace(/\/api$/, '')}${data.ot.url}`
      window.open(fullUrl, '_blank')
    }
  } catch (err) {
    alert('Error al abrir el PDF de la OT: ' + (err.response?.data?.error || err.message))
  } finally {
    generandoOtId.value = null
  }
}

const getDiaSeleccionado = (s) => {
  if (!s) return 1
  const eq = getEquipoActivo(s)
  const franja = eq.franja_multidia || s.franja_multidia || []
  const fSel = selectedFechaByOt.value[s.id_proyecto]
  if (fSel) {
    const found = franja.find(f => f.fecha === fSel)
    if (found && found.dia) return found.dia
  }
  if (selectedDiaByOt.value[s.id_proyecto]) {
    return selectedDiaByOt.value[s.id_proyecto]
  }
  return eq.dia_actual || s.dia_actual || 1
}

const getJornadaSeleccionada = (s) => {
  if (!s) return null
  const eq = getEquipoActivo(s)
  const franja = eq.franja_multidia || s.franja_multidia || []
  const fSel = selectedFechaByOt.value[s.id_proyecto]
  if (fSel) {
    const byFecha = franja.find(f => f.fecha === fSel)
    if (byFecha) return byFecha
  }
  const diaSel = getDiaSeleccionado(s)
  return franja.find(f => f.dia === diaSel) || franja.find(f => f.es_laboral !== false && f.es_hoy) || franja.find(f => f.es_laboral !== false) || franja[0] || null
}

const getActividadesMostradas = (s) => {
  if (!s) return []
  const jornada = getJornadaSeleccionada(s)
  if (jornada && Array.isArray(jornada.actividades) && jornada.actividades.length > 0) {
    return jornada.actividades
  }
  const eq = getEquipoActivo(s)
  return eq.actividades || s.actividades || []
}

const formatearFechaCorta = (fechaStr) => {
  if (!fechaStr) return ''
  const partes = String(fechaStr).split('-')
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}`
  }
  return fechaStr
}

const tieneViajeDisponible = (s) => {
  if (!s) return false
  const eq = getEquipoActivo(s)
  const franja = eq.franja_multidia || s.franja_multidia || []
  return franja.some(f => f.tiene_viaje) || !!eq.tiene_viaje || !!s.tiene_viaje
}

const tieneReportDisponible = (s) => {
  if (!s) return false
  const eq = getEquipoActivo(s)
  const franja = eq.franja_multidia || s.franja_multidia || []
  return franja.some(f => f.tiene_report) || (eq.reports_consumidos ?? s.reports_consumidos) > 0
}

// REQ-997 / REQ-1099: Carga Manual, Corrección y Limpieza (--:--) de Horas de Hitos (Yiara / Adm)
const editandoHitoKey = ref(null)
const horaOverrideInput = ref('')
const guardandoOverride = ref(false)

// REQ-1099: Estado Modal Adjuntar Documento al Día
const modalAdjuntarDocDiaAbierto = ref(false)
const ctxAdjuntarDocDia = ref(null)
const archivoDocDiaSeleccionado = ref(null)
const inputArchivoDocDiaRef = ref(null)
const subiendoDocDia = ref(false)
const formDocDia = ref({ titulo: '' })

const getUrlDocumentoDia = (doc) => {
  if (!doc) return '#'
  const base = (apiAxios.defaults.baseURL || '').replace(/\/$/, '')
  if (doc.id_doc) {
    return `${base}/v1/storage/view/${doc.id_doc}`
  }
  if (doc.url_vista) {
    return doc.url_vista.startsWith('http') ? doc.url_vista : `${base}${doc.url_vista.replace(/^\/api/, '')}`
  }
  return '#'
}

const irADiaHoy = (s) => {
  if (!s) return
  const eq = getEquipoActivo(s)
  const franja = eq.franja_multidia || s.franja_multidia || []
  const diaTarget = eq.dia_actual || s.dia_actual || 1
  const itemHoy = franja.find(f => f.es_hoy && f.es_laboral !== false) || franja.find(f => f.dia === diaTarget)
  if (itemHoy) {
    seleccionarDia(s, itemHoy)
  }
}

const abrirModalAdjuntarDocDia = (s, jornadaParam = null) => {
  if (!s) return
  const eq = getEquipoActivo(s)
  const jornada = jornadaParam || getJornadaSeleccionada(s)
  ctxAdjuntarDocDia.value = {
    servicio: s,
    id_proyecto: s.id_proyecto,
    codigo_ot: s.codigo_ot,
    cliente: s.cliente,
    id_equipo: eq?.id_equipo || 0,
    dia: jornada?.dia || getDiaSeleccionado(s) || 1,
    fecha: jornada?.fecha || fechaFiltro.value,
    id_reporte_avance: jornada?.id_reporte_avance || null,
    documentos_dia: jornada?.documentos_dia || []
  }
  archivoDocDiaSeleccionado.value = null
  formDocDia.value = { titulo: '' }
  modalAdjuntarDocDiaAbierto.value = true
}

const cerrarModalAdjuntarDocDia = () => {
  modalAdjuntarDocDiaAbierto.value = false
  ctxAdjuntarDocDia.value = null
  archivoDocDiaSeleccionado.value = null
}

const onFileChangeDocDia = (e) => {
  const f = e.target?.files?.[0] || null
  archivoDocDiaSeleccionado.value = f
  if (f && !formDocDia.value.titulo) {
    formDocDia.value.titulo = f.name.replace(/\.[^/.]+$/, '')
  }
}

const ejecutarSubidaDocDia = async () => {
  if (!ctxAdjuntarDocDia.value || !archivoDocDiaSeleccionado.value) return
  try {
    subiendoDocDia.value = true
    const fd = new FormData()
    fd.append('archivo', archivoDocDiaSeleccionado.value)
    fd.append('id_proyecto', ctxAdjuntarDocDia.value.id_proyecto)
    fd.append('id_equipo', ctxAdjuntarDocDia.value.id_equipo || 0)
    fd.append('fecha', ctxAdjuntarDocDia.value.fecha)
    fd.append('dia', ctxAdjuntarDocDia.value.dia)
    if (ctxAdjuntarDocDia.value.id_reporte_avance) {
      fd.append('id_reporte_avance', ctxAdjuntarDocDia.value.id_reporte_avance)
    }
    if (formDocDia.value.titulo?.trim()) {
      fd.append('titulo', formDocDia.value.titulo.trim())
    }

    const { data } = await apiAxios.post('/operaciones/control-vivo/adjuntar-documento-dia', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    if (data && data.success) {
      cerrarModalAdjuntarDocDia()
      await cargarDatos()
    }
  } catch (err) {
    console.error('Error subiendo documento del día:', err)
    alert('❌ No se pudo adjuntar el documento: ' + (err.response?.data?.message || err.message))
  } finally {
    subiendoDocDia.value = false
  }
}

const eliminarDocumentoDia = async (s, jornada, doc) => {
  if (!s || !doc?.id_doc) return
  if (!confirm(`¿Quitar el documento "${doc.titulo || doc.nombre_archivo}" del Día ${jornada?.dia || ''}?`)) return
  try {
    await apiAxios.delete(`/operaciones/control-vivo/documento-dia/${doc.id_doc}`, {
      params: {
        id_proyecto: s.id_proyecto,
        fecha: jornada?.fecha || '',
        id_reporte_avance: jornada?.id_reporte_avance || ''
      }
    })
    await cargarDatos()
  } catch (err) {
    console.error('Error quitando documento del día:', err)
    alert('❌ No se pudo quitar el documento: ' + (err.response?.data?.message || err.message))
  }
}

const getHitoKey = (s, act) => {
  const eq = getEquipoActivo(s)
  const eqId = eq?.id_equipo || 0
  return `${s.id_proyecto}-${eqId}-${act.clave}`
}

const iniciarEdicionHito = (s, act) => {
  editandoHitoKey.value = getHitoKey(s, act)
  horaOverrideInput.value = act.hora_real || act.hora_plan || '08:00'
}

const cancelarEdicionHito = () => {
  editandoHitoKey.value = null
  horaOverrideInput.value = ''
}

// REQ-1120: Edición inline de Observaciones de Validación del Report Diario desde la tarjeta PMO
const editandoObsValidadorKey = ref(null)
const obsValidadorInput = ref('')
const guardandoObsValidador = ref(false)

const getObsValidadorKey = (s) => {
  const eq = getEquipoActivo(s)
  const eqId = eq?.id_equipo || 0
  const dia = getDiaSeleccionado(s)
  return `${s.id_proyecto}-${eqId}-D${dia}`
}

const iniciarEdicionObsValidador = (s) => {
  const jornada = getJornadaSeleccionada(s)
  editandoObsValidadorKey.value = getObsValidadorKey(s)
  obsValidadorInput.value = jornada?.obs_validador || ''
}

const cancelarEdicionObsValidador = () => {
  editandoObsValidadorKey.value = null
  obsValidadorInput.value = ''
}

const guardarObsValidadorDia = async (s) => {
  const eq = getEquipoActivo(s)
  const jornada = getJornadaSeleccionada(s)
  try {
    guardandoObsValidador.value = true
    const { data } = await apiAxios.post('/operaciones/control-vivo/override-hito', {
      id_proyecto: s.id_proyecto,
      id_equipo: eq?.id_equipo || 0,
      fecha: jornada?.fecha || fechaFiltro.value,
      dia: jornada?.dia || getDiaSeleccionado(s),
      id_reporte_avance: jornada?.id_reporte_avance || null,
      clave_actividad: 'OBS_VALIDADOR',
      obs_validador: obsValidadorInput.value
    })
    if (data && data.success) {
      if (jornada) {
        jornada.obs_validador = data.data?.obs_validador || null
      }
      cancelarEdicionObsValidador()
      await cargarDatos()
    }
  } catch (err) {
    console.error('Error guardando observación de validación:', err)
    alert('❌ No se pudo guardar la observación de validación: ' + (err.response?.data?.message || err.message))
  } finally {
    guardandoObsValidador.value = false
  }
}

const limpiarHito = async (s, act) => {
  const eq = getEquipoActivo(s)
  const jornada = getJornadaSeleccionada(s)
  try {
    guardandoOverride.value = true
    const { data } = await apiAxios.post('/operaciones/control-vivo/override-hito', {
      id_proyecto: s.id_proyecto,
      id_equipo: eq?.id_equipo || 0,
      fecha: jornada?.fecha || fechaFiltro.value,
      dia: jornada?.dia || getDiaSeleccionado(s),
      clave_actividad: act.clave,
      hora_real: null,
      limpiar: true,
      motivo: 'Limpieza de hito (--:--) desde Torre de Control'
    })
    if (data && data.success) {
      act.hora_real = null
      act.ejecutado = false
      act.override = false
      act.requiere_regularizacion = false
      cancelarEdicionHito()
      await cargarDatos()
    }
  } catch (err) {
    console.error('Error limpiando hito:', err)
    alert('❌ Error al dejar vacío el hito: ' + (err.response?.data?.message || err.message))
  } finally {
    guardandoOverride.value = false
  }
}

const guardarOverrideHito = async (s, act) => {
  if (!horaOverrideInput.value || horaOverrideInput.value === '--:--') {
    return limpiarHito(s, act)
  }
  const eq = getEquipoActivo(s)
  const jornada = getJornadaSeleccionada(s)
  try {
    guardandoOverride.value = true
    const { data } = await apiAxios.post('/operaciones/control-vivo/override-hito', {
      id_proyecto: s.id_proyecto,
      id_equipo: eq?.id_equipo || 0,
      fecha: jornada?.fecha || fechaFiltro.value,
      dia: jornada?.dia || getDiaSeleccionado(s),
      clave_actividad: act.clave,
      hora_real: horaOverrideInput.value,
      motivo: 'Ajuste manual de Torre de Control',
      requiere_regularizacion: !act.hora_real_original
    })

    if (data && data.success) {
      act.hora_real = horaOverrideInput.value
      act.ejecutado = true
      act.override = true
      if (!act.hora_real_original) {
        act.requiere_regularizacion = true
      }
      cancelarEdicionHito()
      await cargarDatos()
    }
  } catch (err) {
    console.error('Error guardando override de hito:', err)
    alert('❌ Error al guardar la hora del hito: ' + (err.response?.data?.message || err.message))
  } finally {
    guardandoOverride.value = false
  }
}

// Filtros y Búsqueda
const filtroEstado = ref('TODOS')
const busquedaTexto = ref('')

// Auto-refresco 5 minutos (300 segundos)
const INTERVALO_REFRESCO = 300
const segundosRestantes = ref(INTERVALO_REFRESCO)
let timerReloj = null
let timerCuentaRegresiva = null

// Cálculos
const totalAlertasNoLeidas = computed(() => {
  return notificacionesWeb.value.filter(n => !n.leido_por).length
})

const serviciosFiltrados = computed(() => {
  let list = [...servicios.value]

  // Filtro por Estado Global
  if (filtroEstado.value !== 'TODOS') {
    list = list.filter(s => s.estado_global === filtroEstado.value)
  }

  // Filtro por Búsqueda de Texto
  if (busquedaTexto.value.trim()) {
    const q = busquedaTexto.value.toLowerCase().trim()
    list = list.filter(s => {
      // Coincidencia en datos del negocio / OT
      if (
        (s.codigo_ot && s.codigo_ot.toLowerCase().includes(q)) ||
        (s.id_negocio && s.id_negocio.toLowerCase().includes(q)) ||
        (s.cliente && s.cliente.toLowerCase().includes(q)) ||
        (s.obra && s.obra.toLowerCase().includes(q))
      ) {
        return true
      }

      // Coincidencia en cualquiera de los equipos y operadores de la flota
      if (s.equipos && s.equipos.length > 0) {
        const matchFlota = s.equipos.some(eq => 
          (eq.patente && eq.patente.toLowerCase().includes(q)) ||
          (eq.modelo && eq.modelo.toLowerCase().includes(q)) ||
          (eq.nombre_completo && eq.nombre_completo.toLowerCase().includes(q)) ||
          (eq.operador && eq.operador.toLowerCase().includes(q))
        )
        if (matchFlota) return true
      }

      return (
        (s.equipo_principal && s.equipo_principal.toLowerCase().includes(q)) ||
        (s.operador && s.operador.toLowerCase().includes(q))
      )
    })
  }

  return list
})

// Cargar Datos del Monitor en Vivo
const cargarDatos = async () => {
  try {
    cargando.value = true
    const { data } = await apiAxios.get('/operaciones/control-vivo', {
      params: { fecha: fechaFiltro.value }
    })

    if (data && data.success) {
      servicios.value = data.servicios || []
      kpis.value = data.kpis || kpis.value
      ventanaActiva.value = !!data.ventana_activa
      segundosRestantes.value = INTERVALO_REFRESCO
    }

    // Cargar Notificaciones
    await cargarNotificaciones()
  } catch (err) {
    console.error('Error cargando control operativo en vivo:', err)
  } finally {
    cargando.value = false
  }
}

const cargarNotificaciones = async () => {
  try {
    const { data } = await apiAxios.get('/operaciones/control-vivo/notificaciones', {
      params: { fecha: fechaFiltro.value }
    })
    if (data && data.success) {
      notificacionesWeb.value = data.data || []
    }
  } catch (err) {
    console.warn('Error cargando notificaciones web:', err)
  }
}

const marcarNotificacionLeida = async (id) => {
  try {
    await apiAxios.post(`/operaciones/control-vivo/notificaciones/${id}/leida`, {
      leido_por: 'YIARA'
    })
    const notif = notificacionesWeb.value.find(n => n.id_notificacion === id)
    if (notif) notif.leido_por = 'YIARA'
  } catch (err) {
    console.error('Error marcando notificación leída:', err)
  }
}

const marcarTodasNotificacionesLeidas = async () => {
  try {
    await apiAxios.post('/operaciones/control-vivo/notificaciones/marcar-todas', {
      fecha: fechaFiltro.value,
      leido_por: 'YIARA'
    })
    notificacionesWeb.value.forEach(n => { n.leido_por = 'YIARA' })
  } catch (err) {
    console.error('Error marcando todas leídas:', err)
  }
}

const resetFiltros = () => {
  filtroEstado.value = 'TODOS'
  busquedaTexto.value = ''
}

const abrirDetalleTimeline = (s) => {
  servicioSeleccionado.value = s
  drawerAbierto.value = true
}

const verUltimoReport = (s) => {
  const eq = getEquipoActivo(s)
  emit('ver-report', {
    id_proyecto: s.id_proyecto,
    codigo_proyecto: s.codigo_ot,
    cliente_nombre: s.cliente,
    dia_correlativo: eq.dia_actual || s.dia_actual,
    id_equipo: eq.id_equipo || null
  })
}

// Métodos de Pipeline Documental (REQ-991: Apertura Directa de Modales)
const abrirModalITS = (s) => {
  if (!s || !s.id_proyecto) return
  idProyectoModalITS.value = s.id_proyecto
  modalITSAbierto.value = true
}

const onItsActualizado = () => {
  cargarDatos()
}

const abrirModalEDP = async (s) => {
  if (!s || !s.id_proyecto) return
  cargandoEDP.value = true
  try {
    const { data } = await apiAxios.get(`/operaciones/report/edp/resumen/${s.id_proyecto}`)
    if (data?.success && data.data) {
      edpDataModal.value = data.data
      modalEDPAbierto.value = true
    } else {
      alert('No se encontró un Estado de Pago (EDP) generado aún para esta OT.')
    }
  } catch (err) {
    console.error('Error al abrir Carátula EDP:', err)
    alert('No se pudo abrir el EDP: ' + (err.response?.data?.message || err.message))
  } finally {
    cargandoEDP.value = false
  }
}

const onEdpActualizado = () => {
  cargarDatos()
}

const abrirModalOC = (s) => {
  ocDataModal.value = s
  modalOCAbierto.value = true
}

const abrirModalFactura = (s) => {
  facturaDataModal.value = s
  modalFacturaAbierto.value = true
}

const abrirExpedienteDesdeModal = (idProyecto) => {
  modalOCAbierto.value = false
  modalFacturaAbierto.value = false
  emit('abrir-proyecto', idProyecto)
}

// Métodos de Telemetría GPS y Visor Report Directo (REQ-1012 / SPEC-066)
const abrirTelemetriaViaje = async (s, jornadaParam = null) => {
  if (!s) return
  const jornada = jornadaParam || getJornadaSeleccionada(s)
  cargandoViaje.value = true
  try {
    // Si la jornada ya contiene el viaje_resumen con token
    const token = jornada?.viaje_resumen?.token_viaje
    if (token) {
      const { data } = await apiAxios.get(`/operaciones/viaje/${token}`)
      if (data) {
        viajeSeleccionadoTelemetria.value = data
        modalMapaViajeAbierto.value = true
        return
      }
    }

    // Consulta de respaldo por ID de Proyecto
    const { data } = await apiAxios.get(`/operaciones/viaje/proyecto/${s.id_proyecto}`)
    const viajes = Array.isArray(data) ? data : (data.data || [])
    if (viajes.length > 0) {
      // Si tenemos jornada con id_log_desplazamiento específico
      let viajeTarget = null
      if (jornada?.viaje_resumen?.id_log_desplazamiento) {
        viajeTarget = viajes.find(v => v.id_log_desplazamiento === jornada.viaje_resumen.id_log_desplazamiento)
      }
      viajeSeleccionadoTelemetria.value = viajeTarget || viajes[0]
      modalMapaViajeAbierto.value = true
    } else {
      alert('ℹ️ No se encontraron registros de telemetría de viaje para este servicio.')
    }
  } catch (err) {
    console.error('Error cargando telemetría de viaje:', err)
    alert('❌ Error al cargar telemetría de viaje: ' + (err.response?.data?.error || err.message))
  } finally {
    cargandoViaje.value = false
  }
}

const abrirVisorReportDirecto = async (s, jornadaParam = null) => {
  if (!s) return
  const jornada = jornadaParam || getJornadaSeleccionada(s)
  const eq = getEquipoActivo(s)
  const eqId = eq?.id_equipo || 0
  const fechaTarget = jornada?.fecha || null
  const diaSel = jornada?.dia || getDiaSeleccionado(s)

  const buscarReportDelDia = (lista) => {
    if (!Array.isArray(lista) || lista.length === 0) return null
    if (jornada?.id_reporte_avance) {
      const byId = lista.find(r => Number(r.id_reporte_avance) === Number(jornada.id_reporte_avance))
      if (byId) return byId
    }
    if (fechaTarget) {
      const fTargetNorm = String(fechaTarget).slice(0, 10)
      const byFechaEq = lista.find(r => {
        const fRep = r.fecha_reporte_iso || (r.fecha_reporte ? String(r.fecha_reporte).slice(0, 10) : '')
        const matchEq = !eqId || !r.id_equipo || Number(r.id_equipo) === Number(eqId)
        return fRep === fTargetNorm && matchEq
      })
      if (byFechaEq) return byFechaEq

      const byFechaAny = lista.find(r => {
        const fRep = r.fecha_reporte_iso || (r.fecha_reporte ? String(r.fecha_reporte).slice(0, 10) : '')
        return fRep === fTargetNorm
      })
      if (byFechaAny) return byFechaAny
    }
    const byDia = lista.find(r => Number(r.dia_correlativo) === Number(diaSel))
    if (byDia) return byDia
    if (lista.length === 1) return lista[0]
    const byEqOnly = lista.find(r => !eqId || !r.id_equipo || Number(r.id_equipo) === Number(eqId))
    if (byEqOnly) return byEqOnly
    return lista[0] || null
  }

  cargandoReport.value = true
  try {
    const { data } = await apiAxios.get(`/operaciones/report/proyecto/${s.id_proyecto}`)
    let reports = Array.isArray(data) ? data : (data.data || [])
    let rep = buscarReportDelDia(reports)

    // Si en el día seleccionado se ingresaron horas de report en PMO pero aún no existía fila en tedp_reporte_avance, sincronizar al vuelo
    if (!rep && fechaTarget && Array.isArray(jornada?.actividades)) {
      const actIni = jornada.actividades.find(a => a.clave === 'REPORT_INICIO' && a.hora_real)
      const actFin = jornada.actividades.find(a => a.clave === 'REPORT_TERMINO' && a.hora_real)
      if (actIni || actFin) {
        if (actIni) {
          await apiAxios.post('/operaciones/control-vivo/override-hito', {
            id_proyecto: s.id_proyecto,
            id_equipo: eqId,
            fecha: fechaTarget,
            dia: diaSel,
            clave_actividad: 'REPORT_INICIO',
            hora_real: actIni.hora_real,
            motivo: 'Sincronización automática de Report Día ' + diaSel
          })
        }
        if (actFin) {
          await apiAxios.post('/operaciones/control-vivo/override-hito', {
            id_proyecto: s.id_proyecto,
            id_equipo: eqId,
            fecha: fechaTarget,
            dia: diaSel,
            clave_actividad: 'REPORT_TERMINO',
            hora_real: actFin.hora_real,
            motivo: 'Sincronización automática de Report Día ' + diaSel
          })
        }
        const { data: dataRef } = await apiAxios.get(`/operaciones/report/proyecto/${s.id_proyecto}`)
        reports = Array.isArray(dataRef) ? dataRef : (dataRef.data || [])
        rep = buscarReportDelDia(reports)
      }
    }

    // Si no existiera reporte previo en BD, generar borrador contextual para permitir editarlo y validarlo de inmediato
    if (!rep) {
      const actIni = jornada?.actividades?.find(a => a.clave === 'REPORT_INICIO' && a.hora_real)
      const actFin = jornada?.actividades?.find(a => a.clave === 'REPORT_TERMINO' && a.hora_real)
      rep = {
        id_reporte_avance: null,
        id_proyecto: s.id_proyecto,
        codi_proyecto: s.codigo_ot,
        obra_nombre: s.obra,
        id_equipo: eqId,
        equipo_patente: eq?.patente || '',
        equipo_modelo: eq?.modelo || '',
        operador_nombre: jornada?.operador || eq?.operador || s.operador || '',
        dia_correlativo: diaSel || 1,
        fecha_reporte: fechaTarget || new Date().toISOString().slice(0, 10),
        fecha_inicio_servicio: actIni?.hora_real ? `${fechaTarget || new Date().toISOString().slice(0, 10)}T${actIni.hora_real}:00` : null,
        fecha_termino_servicio: actFin?.hora_real ? `${fechaTarget || new Date().toISOString().slice(0, 10)}T${actFin.hora_real}:00` : null,
        hora_inicio: actIni?.hora_real || '08:00',
        hora_termino: actFin?.hora_real || '18:00',
        horas_colacion: 1.0,
        estado_reporte: 'PENDIENTE_VALIDACION',
        documentos_dia: jornada?.documentos_dia || []
      }
    }

    if (rep) {
      reportSeleccionadoVisor.value = {
        ...rep,
        dia_correlativo: diaSel || rep.dia_correlativo || 1,
        codi_proyecto: rep.codi_proyecto || s.codigo_ot,
        obra_nombre: rep.obra_nombre || s.obra,
        documentos_dia: rep.documentos_dia?.length ? rep.documentos_dia : (jornada?.documentos_dia || [])
      }
      modalVisorReportAbierto.value = true
    } else {
      alert(`ℹ️ El Día ${diaSel || ''} (${formatearFechaCorta(fechaTarget)}) aún no tiene horario de inicio/término de jornada registrado.`)
    }
  } catch (err) {
    console.error('Error al abrir Visor de Report:', err)
    alert('❌ Error al cargar Report Diario: ' + (err.response?.data?.message || err.message))
  } finally {
    cargandoReport.value = false
  }
}

const onReportValidadoEnVivo = () => {
  cargarDatos()
}

const getClaseBadgeDocumental = (estado) => {
  switch (estado) {
    case 'listo':
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
    case 'rojo_sla':
      return 'bg-red-500/20 text-red-300 border-red-500/60 hover:bg-red-500/30 animate-pulse ring-1 ring-red-500/50'
    case 'por_vencer':
      return 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
    case 'en_curso':
      return 'bg-blue-500/20 text-blue-300 border-blue-500/40 hover:bg-blue-500/30'
    default:
      return 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
  }
}

// Helpers Visuales y Semáforos
const getClaseBordeTarjeta = (estado) => {
  switch (estado) {
    case 'rojo': return 'border-red-500/60 shadow-red-500/10'
    case 'amarillo': return 'border-amber-500/60 shadow-amber-500/10'
    case 'verde': return 'border-emerald-500/40 shadow-emerald-500/10'
    case 'negro': return 'border-slate-500/60'
    case 'azul': return 'border-blue-500/40'
    case 'terminado': return 'border-purple-500/50'
    default: return 'border-white/10'
  }
}

const getBadgeClaseSemaforo = (estado) => {
  switch (estado) {
    case 'rojo': return 'bg-red-500/20 text-red-300 border-red-500/40'
    case 'amarillo': return 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    case 'verde': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    case 'negro': return 'bg-slate-800 text-slate-300 border-slate-600'
    case 'azul': return 'bg-blue-500/20 text-blue-300 border-blue-500/40'
    case 'terminado': return 'bg-purple-500/20 text-purple-300 border-purple-500/40'
    default: return 'bg-slate-700/50 text-slate-400 border-slate-600'
  }
}

const getPuntoClaseSemaforo = (estado) => {
  switch (estado) {
    case 'rojo': return 'bg-red-500 shadow-md shadow-red-500/50'
    case 'amarillo': return 'bg-amber-400 shadow-md shadow-amber-400/50'
    case 'verde': return 'bg-emerald-400'
    case 'negro': return 'bg-slate-500'
    case 'azul': return 'bg-blue-400'
    default: return 'bg-slate-600'
  }
}

const getEtiquetaSemaforo = (estado) => {
  switch (estado) {
    case 'rojo': return 'Vencido / Alerta'
    case 'amarillo': return 'Próximo (< 1h)'
    case 'verde': return 'En Tiempo'
    case 'negro': return 'Realizado Tarde'
    case 'azul': return 'Planificado (> 1h)'
    case 'terminado': return 'Concluido'
    default: return 'Sin Plan'
  }
}

const getClaseFranjaDia = (d) => {
  if (d.tiene_report) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
  if (d.es_hoy) {
    if (d.estado === 'rojo') return 'bg-red-500/20 text-red-300 border-red-500/50 font-bold'
    if (d.estado === 'amarillo') return 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
    return 'bg-blue-500/20 text-blue-300 border-blue-500/50 font-bold'
  }
  return 'bg-white/5 text-slate-400 border-white/5'
}

const getClaseFilaActividad = (estado) => {
  switch (estado) {
    case 'rojo': return 'border-red-500/30 bg-red-500/5'
    case 'amarillo': return 'border-amber-500/20 bg-amber-500/5'
    case 'verde': return 'border-emerald-500/20 bg-emerald-500/5'
    case 'negro': return 'border-slate-600 bg-slate-800/30'
    default: return 'border-white/5 bg-black/20'
  }
}

const getColorTextoReal = (estado) => {
  switch (estado) {
    case 'verde': return 'text-emerald-400'
    case 'negro': return 'text-slate-400'
    case 'rojo': return 'text-red-400'
    case 'amarillo': return 'text-amber-400'
    default: return 'text-slate-400'
  }
}

const getIconoActividad = (clave) => {
  switch (clave) {
    case 'INSPECCION_PATIO': return '📋'
    case 'SALIDA_BASE': return '🚜'
    case 'LLEGADA_FAENA': return '📍'
    case 'REPORT_INICIO': return '🟢'
    case 'REPORT_TERMINO': return '🏁'
    case 'VIAJE_RETORNO': return '🚛'
    case 'INSPECCION_PATIO_RETORNO': return '🔍'
    default: return '⏱️'
  }
}

const getTextoDesvio = (act) => {
  if (act.ejecutado) {
    if (act.estado === 'verde') return 'OK'
    if (act.desvio_minutos !== null) return `+${act.desvio_minutos}m`
    return 'Realizado'
  }
  if (act.estado === 'rojo') {
    return act.desvio_minutos ? `+${act.desvio_minutos}m` : 'Vencido'
  }
  if (act.estado === 'amarillo') {
    return act.desvio_minutos ? `-${Math.abs(act.desvio_minutos)}m` : '< 1h'
  }
  return 'Pendiente'
}

const getWhatsAppLink = (eq, s = null) => {
  const targetEq = eq || {}
  const targetOt = s || eq || {}
  const tel = targetEq.telefono_operador || targetOt.telefono_operador
  if (!tel) return '#'
  const cleanPhone = tel.replace(/\D/g, '')
  const oper = targetEq.operador || targetOt.operador || 'Operador'
  const ot = targetOt.codigo_ot || targetEq.codigo_ot || 'Servicio'
  const cli = targetOt.cliente || ''
  const maq = targetEq.patente || targetEq.nombre_completo || ''
  const maqStr = maq ? ` asignado al equipo ${maq}` : ''

  // Parametrización por entorno (si estamos en DEV o localhost, advertir explícitamente)
  const isDev = window.location.pathname.includes('-dev') || window.location.hostname === 'localhost'
  const prefijoAmbiente = isDev ? '🟡 [PRUEBAS DEV / NO REAL] ' : ''

  const msg = encodeURIComponent(`${prefijoAmbiente}Hola ${oper}, te contacto desde Torre de Control GSP por la OT ${ot} (${cli})${maqStr}. Favor confirmar estado operativo.`)
  return `https://wa.me/${cleanPhone}?text=${msg}`
}

const formatearSegundos = (seg) => {
  const m = Math.floor(seg / 60)
  const s = seg % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

const formatearHoraNotif = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleTimeString('es-CL', {
    timeZone: 'America/Santiago',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

// Lifecycle Hooks
onMounted(() => {
  cargarDatos()

  // Reloj Oficial America/Santiago
  timerReloj = setInterval(() => {
    horaChileStr.value = new Date().toLocaleTimeString('es-CL', {
      timeZone: 'America/Santiago',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  }, 1000)

  // Timer de Auto-Refresco cada 5 minutos
  timerCuentaRegresiva = setInterval(() => {
    if (segundosRestantes.value > 0) {
      segundosRestantes.value--
    } else {
      cargarDatos()
    }
  }, 1000)
})

onUnmounted(() => {
  if (timerReloj) clearInterval(timerReloj)
  if (timerCuentaRegresiva) clearInterval(timerCuentaRegresiva)
})
</script>

<style scoped>
.animate-fadeIn {
  animation: fadeIn 0.2s ease-in-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
