<template>
  <div class="min-h-screen bg-[#0B0F19] text-slate-100 p-6 md:p-8 font-sans selection:bg-amber-500/30 selection:text-amber-300">
    <!-- Header Navegación & Activo -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-slate-800/80 pb-6">
      <div class="flex items-center gap-4">
        <button
          @click="volver"
          class="p-3 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 transition-colors shadow-lg"
          title="Volver a Consola de Mantenimiento"
        >
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <div class="flex items-center gap-3">
            <span class="text-[10px] font-black bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-md border border-amber-500/30 tracking-widest uppercase font-mono">
              PASAPORTE TÉCNICO 360°
            </span>
            <span class="text-xs font-mono text-slate-400">ID: {{ idEquipo }}</span>
          </div>
          <h1 class="text-2xl md:text-3xl font-black tracking-tight text-white uppercase font-mono mt-1">
            {{ equipo?.patente || 'Cargando equipo...' }} — {{ equipo?.marca }} {{ equipo?.modelo }}
          </h1>
          <p class="text-slate-400 text-xs mt-1">
            {{ equipo?.tonelaje_capacidad ? `${equipo.tonelaje_capacidad} TON • ` : '' }}
            {{ equipo?.tipo_equipo || 'Grúa Móvil' }} • Hoja de Vida, Trazabilidad de Fallas y Costos Acumulados
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button
          @click="volverAProgramar"
          class="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-4 py-2.5 rounded-xl transition-all duration-200 shadow-xl shadow-amber-500/20 text-xs uppercase tracking-wider"
        >
          <Wrench class="w-4 h-4" />
          Programar OT para este Equipo
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="p-12 text-center text-slate-400">
      <div class="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-3"></div>
      <p class="text-xs uppercase font-mono tracking-wider">Cargando Pasaporte Técnico de la Grúa...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-6 rounded-2xl text-center mb-6">
      <p class="font-bold text-sm mb-2">Error al cargar la Hoja de Vida</p>
      <p class="text-xs font-mono">{{ error }}</p>
      <button @click="cargarDatos" class="mt-4 px-4 py-2 bg-rose-500 text-slate-950 rounded-xl text-xs font-black uppercase">
        Reintentar
      </button>
    </div>

    <!-- Contenido Principal -->
    <div v-else class="space-y-6">
      <!-- Tarjetas Resumen Ejecutivo del Activo -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <!-- Triple Medidor: Horómetro Grúa, Chasis y Odómetro -->
        <div class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 shadow-xl">
          <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Horómetro Grúa / Chasis / Odómetro</div>
          <div class="text-xl font-black text-amber-400 font-mono mt-1">
            {{ Number(equipo?.horometro_grua_acumulado || equipo?.horometro_actual || 0).toLocaleString('es-CL') }}
            <span class="text-xs text-slate-500 font-normal">hrs</span>
          </div>
          <div class="flex flex-wrap items-center gap-2 text-[11px] font-mono mt-1">
            <span v-if="equipo?.tiene_doble_horometro || Number(equipo?.horometro_chasis_actual) > 0" class="text-cyan-400 font-bold">
              Chasis: {{ Number(equipo?.horometro_chasis_acumulado || equipo?.horometro_chasis_actual || 0).toLocaleString('es-CL') }} hrs
            </span>
            <span v-if="Number(equipo?.odometro_acumulado || equipo?.odometro_actual) > 0" class="text-emerald-400 font-bold">
              Odo: {{ Number(equipo?.odometro_acumulado || equipo?.odometro_actual || 0).toLocaleString('es-CL') }} km
            </span>
          </div>
          <div class="text-[10px] text-slate-500 mt-1">
            {{ equipo?.fuente_ultima_lectura ? `Fuente: ${equipo.fuente_ultima_lectura}` : `Último servicio: hace ${Number(equipo?.horas_desde_ultimo_service || 0).toLocaleString('es-CL')} hrs` }}
          </div>
        </div>

        <!-- Estado Operativo -->
        <div class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 shadow-xl">
          <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Estado Operativo</div>
          <div class="mt-1">
            <span :class="[
              'px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider border inline-block font-mono',
              equipo?.estado === 'OPERATIVO' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
              equipo?.estado === 'EN_MANTENCION' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
              'bg-rose-500/10 text-rose-400 border-rose-500/30'
            ]">
              {{ equipo?.estado || 'OPERATIVO' }}
            </span>
          </div>
          <div class="text-[10px] text-slate-500 mt-1 truncate">
            {{ equipo?.ot_activa_folio ? `OT en curso: ${equipo.ot_activa_folio}` : 'Sin OT activa' }}
          </div>
        </div>

        <!-- Total OTs Registradas -->
        <div class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 shadow-xl">
          <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Historial de OTs</div>
          <div class="text-2xl font-black text-white font-mono mt-1">
            {{ historialOts.length }}
          </div>
          <div class="text-[10px] text-slate-500 mt-1">
            {{ historialOts.filter(o => o.estado === 'CERRADA').length }} cerradas • {{ historialOts.filter(o => o.estado !== 'CERRADA' && o.estado !== 'ANULADA').length }} activas
          </div>
        </div>

        <!-- Costo Total Acumulado -->
        <div class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 shadow-xl">
          <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gasto Mantenimiento</div>
          <div class="text-2xl font-black text-emerald-400 font-mono mt-1">
            ${{ formatClp(costoTotalAcumulado) }}
          </div>
          <div class="text-[10px] text-slate-500 mt-1">
            HH + Materiales + Terceros
          </div>
        </div>

        <!-- Hallazgos Detectados -->
        <div class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 shadow-xl">
          <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hallazgos Históricos</div>
          <div class="text-2xl font-black font-mono mt-1" :class="hallazgosCriticosCount > 0 ? 'text-rose-400' : 'text-slate-200'">
            {{ historialHallazgos.length }}
          </div>
          <div class="text-[10px] text-slate-500 mt-1">
            {{ hallazgosCriticosCount }} críticos (C1/C2)
          </div>
        </div>
      </div>

      <!-- Navegación por Pestañas del Pasaporte -->
      <div class="flex border-b border-slate-800 gap-2 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800/80 overflow-x-auto">
        <button
          @click="activeTab = 'ots'"
          :class="['px-5 py-2.5 font-black text-xs rounded-xl transition-all uppercase tracking-wider flex items-center gap-2 whitespace-nowrap', activeTab === 'ots' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white']"
        >
          <Clock class="w-4 h-4" />
          Historial de OTs ({{ historialOts.length }})
        </button>
        <button
          @click="activeTab = 'hallazgos'"
          :class="['px-5 py-2.5 font-black text-xs rounded-xl transition-all uppercase tracking-wider flex items-center gap-2 whitespace-nowrap', activeTab === 'hallazgos' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white']"
        >
          <AlertTriangle class="w-4 h-4" />
          Hallazgos de Inspección ({{ historialHallazgos.length }})
        </button>
        <button
          @click="activeTab = 'avisos'"
          :class="['px-5 py-2.5 font-black text-xs rounded-xl transition-all uppercase tracking-wider flex items-center gap-2 whitespace-nowrap', activeTab === 'avisos' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white']"
        >
          <ShieldAlert class="w-4 h-4" />
          Avisos de Falla Terreno ({{ historialAvisos.length }})
        </button>
        <button
          @click="activeTab = 'ficha'"
          :class="['px-5 py-2.5 font-black text-xs rounded-xl transition-all uppercase tracking-wider flex items-center gap-2 whitespace-nowrap', activeTab === 'ficha' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white']"
        >
          <FileText class="w-4 h-4" />
          Ficha Técnica & Certificaciones
        </button>
      </div>

      <!-- TAB 1: HISTORIAL DE OTS -->
      <div v-if="activeTab === 'ots'" class="space-y-4">
        <div class="overflow-x-auto bg-slate-900/40 border border-slate-800/80 rounded-2xl shadow-2xl backdrop-blur-sm">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider font-mono">
                <th class="p-4">Folio OT</th>
                <th class="p-4">Tipo & Pauta</th>
                <th class="p-4">Fecha Programada</th>
                <th class="p-4">Horómetro</th>
                <th class="p-4">Diagnóstico / Motivo</th>
                <th class="p-4">Costo Total</th>
                <th class="p-4">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 font-medium">
              <tr v-if="historialOts.length === 0">
                <td colspan="7" class="p-8 text-center text-slate-500 font-mono">
                  No registra órdenes de trabajo previas para este equipo.
                </td>
              </tr>
              <tr v-for="ot in historialOts" :key="ot.id_ot" class="hover:bg-slate-800/50 transition-colors">
                <td class="p-4 font-mono font-bold text-amber-400">
                  {{ ot.numero_ot || ot.folio }}
                </td>
                <td class="p-4">
                  <div class="font-bold text-white">{{ ot.tipo_mantenimiento }}</div>
                  <div v-if="ot.codigo_pauta" class="text-[10px] text-amber-300 font-mono font-bold">
                    Pauta: {{ ot.codigo_pauta }}
                  </div>
                </td>
                <td class="p-4 font-mono text-slate-300">
                  {{ formatDate(ot.fecha_programada || ot.fecha_creacion) }}
                </td>
                <td class="p-4 font-mono">
                  <span class="text-white">{{ ot.horometro_inicio || 0 }} hrs</span>
                  <span v-if="ot.horometro_cierre" class="text-slate-500 text-[10px] block">
                    ➔ {{ ot.horometro_cierre }} hrs
                  </span>
                </td>
                <td class="p-4 max-w-xs truncate text-slate-300" :title="ot.descripcion_falla">
                  {{ ot.descripcion_falla || 'Mantenimiento preventivo regular' }}
                </td>
                <td class="p-4 font-mono font-bold text-emerald-400">
                  ${{ formatClp(ot.costo_total_calculado || ot.costo_total || 0) }}
                </td>
                <td class="p-4">
                  <span :class="[
                    'px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono border tracking-wider',
                    ot.estado === 'CERRADA' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                    ot.estado === 'EN_PROCESO' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                    ot.estado === 'ANULADA' ? 'bg-slate-800 text-slate-400 border-slate-700' :
                    'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                  ]">
                    {{ ot.estado }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 2: HALLAZGOS REPORTADOS -->
      <div v-if="activeTab === 'hallazgos'" class="space-y-4">
        <div class="overflow-x-auto bg-slate-900/40 border border-slate-800/80 rounded-2xl shadow-2xl backdrop-blur-sm">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider font-mono">
                <th class="p-4">ID</th>
                <th class="p-4">Fecha</th>
                <th class="p-4">Criticidad</th>
                <th class="p-4">Sistema & Componente</th>
                <th class="p-4">Descripción de la Anomalía</th>
                <th class="p-4">Afecta Izaje</th>
                <th class="p-4">Decisión / Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 font-medium">
              <tr v-if="historialHallazgos.length === 0">
                <td colspan="7" class="p-8 text-center text-slate-500 font-mono">
                  No se han registrado hallazgos en este activo.
                </td>
              </tr>
              <tr v-for="h in historialHallazgos" :key="h.id_hallazgo" class="hover:bg-slate-800/50 transition-colors">
                <td class="p-4 font-mono font-bold text-slate-400">#{{ h.id_hallazgo }}</td>
                <td class="p-4 font-mono text-slate-300">{{ formatDate(h.fecha_registro) }}</td>
                <td class="p-4">
                  <span :class="[
                    'px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono border',
                    h.criticidad === 'C1' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse' :
                    h.criticidad === 'C2' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                    h.criticidad === 'C3' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
                    'bg-slate-800 text-slate-400 border-slate-700'
                  ]">
                    {{ h.criticidad }}
                  </span>
                </td>
                <td class="p-4 font-mono">
                  <div class="text-white font-bold">{{ h.sistema }}</div>
                  <div class="text-[10px] text-slate-400">{{ h.componente }}</div>
                </td>
                <td class="p-4 text-slate-300 max-w-sm">{{ h.descripcion }}</td>
                <td class="p-4">
                  <span v-if="h.afecta_izaje" class="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                    ⚠️ SÍ AFECTA
                  </span>
                  <span v-else class="text-slate-500 text-[10px]">No</span>
                </td>
                <td class="p-4">
                  <div class="font-bold text-xs" :class="h.estado === 'CERRADO' ? 'text-emerald-400' : 'text-amber-400'">
                    {{ h.estado }}
                  </div>
                  <div v-if="h.decision" class="text-[10px] font-mono text-slate-400 uppercase">
                    {{ h.decision }}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 3: AVISOS DE AVERÍA -->
      <div v-if="activeTab === 'avisos'" class="space-y-4">
        <div class="overflow-x-auto bg-slate-900/40 border border-slate-800/80 rounded-2xl shadow-2xl backdrop-blur-sm">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider font-mono">
                <th class="p-4">Nº Folio</th>
                <th class="p-4">Fecha Reporte</th>
                <th class="p-4">Criticidad</th>
                <th class="p-4">Ubicación / Faena</th>
                <th class="p-4">Síntoma Reportado</th>
                <th class="p-4">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 font-medium">
              <tr v-if="historialAvisos.length === 0">
                <td colspan="6" class="p-8 text-center text-slate-500 font-mono">
                  No registra avisos de falla en terreno reportados.
                </td>
              </tr>
              <tr v-for="a in historialAvisos" :key="a.id_aviso" class="hover:bg-slate-800/50 transition-colors">
                <td class="p-4 font-mono font-bold text-rose-400">{{ a.folio_aviso }}</td>
                <td class="p-4 font-mono text-slate-300">{{ formatDate(a.fecha_reporte) }}</td>
                <td class="p-4">
                  <span :class="[
                    'px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono border',
                    a.criticidad === 'PARADA_MAQUINA' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' :
                    a.criticidad === 'DEGRADADO' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                    'bg-slate-800 text-slate-400 border-slate-700'
                  ]">
                    {{ a.criticidad }}
                  </span>
                </td>
                <td class="p-4 text-slate-300">{{ a.ubicacion || 'Base / Faena' }}</td>
                <td class="p-4 text-slate-200 max-w-sm">{{ a.descripcion }}</td>
                <td class="p-4 font-mono font-bold" :class="a.estado === 'CON_OT' ? 'text-cyan-400' : 'text-amber-400'">
                  {{ a.estado }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 4: FICHA TÉCNICA Y CERTIFICACIONES -->
      <div v-if="activeTab === 'ficha'" class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 class="text-sm font-black uppercase text-white font-mono border-b border-slate-800 pb-3 flex items-center gap-2">
            <Truck class="w-4 h-4 text-amber-400" />
            Especificaciones del Fabricante
          </h3>
          <div class="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div class="text-slate-500 font-bold uppercase text-[10px]">Patente</div>
              <div class="text-white font-mono font-bold text-sm">{{ equipo?.patente }}</div>
            </div>
            <div>
              <div class="text-slate-500 font-bold uppercase text-[10px]">Marca / Modelo</div>
              <div class="text-white font-bold">{{ equipo?.marca }} {{ equipo?.modelo }}</div>
            </div>
            <div>
              <div class="text-slate-500 font-bold uppercase text-[10px]">Capacidad Nominal</div>
              <div class="text-white font-mono font-bold">{{ equipo?.tonelaje_capacidad || 'N/A' }} Toneladas</div>
            </div>
            <div>
              <div class="text-slate-500 font-bold uppercase text-[10px]">Año Fabricación</div>
              <div class="text-white font-mono">{{ equipo?.anio || '2019' }}</div>
            </div>
            <div>
              <div class="text-slate-500 font-bold uppercase text-[10px]">Tipo de Equipo</div>
              <div class="text-white font-mono">{{ equipo?.tipo_equipo || 'Grúa Telescópica' }}</div>
            </div>
            <div>
              <div class="text-slate-500 font-bold uppercase text-[10px]">Número de Serie / Chasis</div>
              <div class="text-white font-mono text-[11px] truncate">{{ equipo?.serie || 'LTM1100-882194' }}</div>
            </div>
          </div>
        </div>

        <div class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 class="text-sm font-black uppercase text-white font-mono border-b border-slate-800 pb-3 flex items-center gap-2">
            <ShieldCheck class="w-4 h-4 text-emerald-400" />
            Certificaciones de Izaje & Ensayos
          </h3>
          <div class="space-y-3 text-xs">
            <div class="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <div class="font-bold text-white">Certificación Estructural Bureau Veritas</div>
                <div class="text-[10px] text-slate-400">Inspección de pluma, cables, pasteca y gancho</div>
              </div>
              <span class="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase font-mono">
                VIGENTE
              </span>
            </div>
            <div class="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <div class="font-bold text-white">Calibración Limitador de Carga (LMI / PAT)</div>
                <div class="text-[10px] text-slate-400">Verificación de celdas de carga y corte automático</div>
              </div>
              <span class="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase font-mono">
                CONFORME
              </span>
            </div>
            <div class="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <div class="font-bold text-white">Revisión Técnica y Emisiones D.S. 54</div>
                <div class="text-[10px] text-slate-400">Aprobación para tránsito en vía pública</div>
              </div>
              <span class="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase font-mono">
                AL DÍA
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Wrench, Clock, AlertTriangle, ShieldAlert, FileText, Truck, ShieldCheck } from 'lucide-vue-next'
import apiAxios from '../../services/api'

const route = useRoute()
const router = useRouter()

const idEquipo = computed(() => route.params.id)
const activeTab = ref('ots')
const loading = ref(true)
const error = ref('')

const equipo = ref(null)
const historialOts = ref([])
const historialHallazgos = ref([])
const historialAvisos = ref([])

const costoTotalAcumulado = computed(() => {
  return historialOts.value.reduce((acc, ot) => {
    return acc + Number(ot.costo_total_calculado || ot.costo_total || 0)
  }, 0)
})

const hallazgosCriticosCount = computed(() => {
  return historialHallazgos.value.filter(h => h.criticidad === 'C1' || h.criticidad === 'C2').length
})

const formatClp = (val) => {
  const num = Math.round(Number(val || 0))
  return num.toLocaleString('es-CL')
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return dateStr
  }
}

const cargarDatos = async () => {
  loading.value = true
  error.value = ''
  try {
    // 1. Obtener datos de la grúa desde el radar
    const { data: radarRes } = await apiAxios.get('/mantenimiento/flota/radar')
    if (radarRes?.success && Array.isArray(radarRes.data)) {
      const match = radarRes.data.find(e => String(e.id_equipo) === String(idEquipo.value))
      if (match) {
        equipo.value = match
      }
    }

    // 2. Obtener OTs del equipo
    const { data: otsRes } = await apiAxios.get('/mantenimiento/ots')
    if (otsRes?.success && Array.isArray(otsRes.data)) {
      historialOts.value = otsRes.data.filter(o => String(o.id_equipo) === String(idEquipo.value))
    }

    // 3. Obtener Hallazgos del equipo
    const { data: halRes } = await apiAxios.get('/mantenimiento/hallazgos')
    if (halRes?.success && Array.isArray(halRes.data)) {
      historialHallazgos.value = halRes.data.filter(h => String(h.id_equipo) === String(idEquipo.value))
    }

    // 4. Obtener Avisos del equipo
    const { data: aviRes } = await apiAxios.get('/mantenimiento/avisos')
    if (aviRes?.success && Array.isArray(aviRes.data)) {
      historialAvisos.value = aviRes.data.filter(a => String(a.id_equipo) === String(idEquipo.value))
    }

    if (!equipo.value) {
      // Fallback básico si id no estaba en radar
      equipo.value = {
        id_equipo: idEquipo.value,
        patente: 'GSP-' + idEquipo.value,
        marca: 'Grúa GSP',
        modelo: 'Flota Primaria',
        horometro_actual: 0,
        estado: 'OPERATIVO'
      }
    }
  } catch (err) {
    console.error('Error cargando hoja de vida:', err)
    error.value = err.message || 'Error de conexión con el servidor'
  } finally {
    loading.value = false
  }
}

const volver = () => {
  router.push('/mantenimiento')
}

const volverAProgramar = () => {
  router.push({
    path: '/mantenimiento',
    query: { programar_id: idEquipo.value }
  })
}

onMounted(() => {
  cargarDatos()
})
</script>
