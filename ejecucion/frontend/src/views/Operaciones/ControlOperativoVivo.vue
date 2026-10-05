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

          <!-- MINI-FRANJA MULTI-DÍA [R][R][▶][ ][FIN] -->
          <div class="pt-1.5 border-t border-white/5">
            <div class="flex items-center justify-between text-[10px] font-mono mb-1 text-slate-400">
              <span>Progreso: Día {{ getEquipoActivo(s).dia_actual || s.dia_actual }} de {{ getEquipoActivo(s).dias_totales || s.dias_totales }} ({{ getEquipoActivo(s).tipo_dia || s.tipo_dia }})</span>
              <span v-if="getEquipoActivo(s).es_equipo_faena !== false">
                Reports: <strong class="text-white">{{ getEquipoActivo(s).reports_consumidos ?? s.reports_consumidos }}/{{ getEquipoActivo(s).dias_totales || s.dias_totales }}</strong>
              </span>
              <span v-else class="text-[9px] text-blue-300 font-mono">
                Desplazamiento
              </span>
            </div>
            <div class="flex items-center gap-1 overflow-x-auto py-0.5">
              <div 
                v-for="d in (getEquipoActivo(s).franja_multidia || s.franja_multidia)" 
                :key="'dia-'+d.dia"
                class="px-2 py-1 rounded text-[10px] font-mono font-bold border transition-all text-center flex items-center justify-center gap-1 shrink-0"
                :class="getClaseFranjaDia(d)"
                :title="`Día ${d.dia} (${d.fecha})${d.es_hoy ? ' - HOY' : ''}${d.tiene_report ? ' - Report emitido' : ''}`"
              >
                <span v-if="d.tiene_report">✓</span>
                <span v-else-if="d.es_hoy">▶</span>
                <span>D{{ d.dia }}</span>
                <span v-if="d.es_fin" class="text-[8px] opacity-75">FIN</span>
              </div>
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
                <span class="text-xs font-bold text-amber-300 truncate max-w-[110px]" :title="getEquipoActivo(s).operador || s.operador">
                  👤 {{ getEquipoActivo(s).operador || s.operador }}
                </span>
                <a 
                  v-if="getEquipoActivo(s).telefono_operador || s.telefono_operador" 
                  :href="getWhatsAppLink(getEquipoActivo(s), s)"
                  target="_blank"
                  class="p-1 rounded bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all text-[11px]"
                  :title="`Contactar a ${getEquipoActivo(s).operador || s.operador} por WhatsApp`"
                >
                  💬
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- CUERPO: DESGLOSE DE ACTIVIDADES PLAN VS REAL -->
        <div class="p-3.5 space-y-2 flex-1">
          <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-1.5 flex justify-between">
            <span>Actividad Planificada</span>
            <span>Plan vs Real</span>
          </div>

          <div class="space-y-1.5">
            <div 
              v-for="act in (getEquipoActivo(s).actividades || s.actividades)" 
              :key="act.clave"
              class="flex items-center justify-between p-1.5 rounded-lg border text-xs font-mono transition-colors"
              :class="getClaseFilaActividad(act.estado)"
            >
              <!-- Nombre e ícono del Hito -->
              <div class="flex items-center gap-1.5 truncate">
                <span class="text-xs">{{ getIconoActividad(act.clave) }}</span>
                <span class="truncate" :class="act.ejecutado ? 'text-white' : 'text-slate-300'">
                  {{ act.nombre }}
                </span>
              </div>

              <!-- Tiempos Plan vs Real + Desvío -->
              <div class="flex items-center gap-2 shrink-0">
                <span class="text-slate-400 text-[10px]">{{ act.hora_plan || '--:--' }}</span>
                <span class="text-slate-600">➔</span>
                <span class="font-bold text-[11px]" :class="getColorTextoReal(act.estado)">
                  {{ act.hora_real || '--:--' }}
                </span>
                <!-- Badge de Desvío / Estado -->
                <span 
                  class="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase border"
                  :class="getBadgeClaseSemaforo(act.estado)"
                >
                  {{ getTextoDesvio(act) }}
                </span>
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
            <!-- Ver Report Sellado si ya existe -->
            <button 
              v-if="(getEquipoActivo(s).reports_consumidos ?? s.reports_consumidos) > 0"
              @click="verUltimoReport(s)" 
              class="px-2.5 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-[11px] font-bold border border-indigo-500/30 transition-all flex items-center gap-1"
              title="Auditar Report Diario sellado"
            >
              <span>📋 Report</span>
            </button>

            <!-- Abrir Expediente OT -->
            <button 
              @click="$emit('abrir-proyecto', s.id_proyecto)" 
              class="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold transition-all shadow-sm flex items-center gap-1"
              title="Abrir Expediente de la OT en Gestor de Oportunidades"
            >
              <span>📂 Abrir OT</span>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { apiAxios } from '@/services/api'
import ModalITS from '@/components/Operaciones/ModalITS.vue'
import ModalCaratulaEDP from '@/components/Operaciones/ModalCaratulaEDP.vue'

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
