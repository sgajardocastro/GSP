<template>
  <div class="p-6 max-w-full mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0c0c0e]/95 border border-emerald-500/10 p-5 rounded-2xl shadow-xl backdrop-blur-md">
      <div>
        <h1 class="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
          <FileText class="w-7 h-7 text-emerald-500 animate-pulse" />
          Registro SST Mensual
        </h1>
        <p class="text-xs text-emerald-500/70 mt-1 font-mono tracking-widest uppercase">Consolidado de KPIs operativos, incidentes y observaciones por contrato.</p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <!-- Filtro Periodo -->
        <div class="flex items-center gap-2 bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 shadow-inner">
          <span class="text-[9px] font-black uppercase tracking-wider text-zinc-500">Periodo:</span>
          <select 
            v-model="selectedPeriod"
            class="bg-transparent text-xs text-emerald-400 font-bold focus:outline-none cursor-pointer outline-none"
          >
            <option value="YTD">Año Completo (YTD)</option>
            <option v-for="p in periodosDisponibles" :key="p" :value="p">{{ p }}</option>
          </select>
        </div>

        <button 
          @click="exportToCSV"
          class="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-semibold transition-all border border-border/50 flex items-center gap-2"
        >
          <Download class="w-4 h-4 text-emerald-500" /> Exportar Excel
        </button>
        <button 
          @click="toggleNewRow"
          class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-black rounded-lg text-sm font-black uppercase tracking-wide transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center gap-2"
        >
          <Plus class="w-4 h-4" /> {{ showNewRow ? 'Ocultar Formulario' : 'Nuevo Registro' }}
        </button>
      </div>
    </div>

    <!-- KPIs Consolidados -->
    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      <div 
        v-for="kpi in kpisSST" 
        :key="kpi.label" 
        class="bg-[#111113] p-4 rounded-xl border border-white/5 shadow-md flex flex-col justify-between hover:border-white/10 transition-colors"
      >
        <div class="flex items-center justify-between">
          <span class="text-[9px] font-black uppercase tracking-widest text-zinc-500">{{ kpi.label }}</span>
          <div :class="`w-6 h-6 rounded bg-${kpi.color}-500/10 flex items-center justify-center text-${kpi.color}-500`">
            <component :is="kpi.icon" class="w-3.5 h-3.5" />
          </div>
        </div>
        <div class="text-lg font-black text-white mt-3 font-mono">{{ kpi.value }}</div>
      </div>
    </div>

    <!-- Main Grid Table -->
    <div class="bg-[#111113] border border-white/5 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-black/60 border-b border-white/5 text-[9px] uppercase tracking-wider text-zinc-400 font-black leading-tight">
              <th class="p-3 pl-6 sticky left-0 bg-[#0c0c0e]/95 z-10 border-r border-white/5 whitespace-nowrap">Mes</th>
              <th class="p-3 sticky left-[100px] bg-[#0c0c0e]/95 z-10 border-r border-white/5 whitespace-nowrap">Contrato /<br>Sucursal</th>
              <th class="p-3 text-center border-r border-white/5">Trabajadores<br>(Dotación)</th>
              <th class="p-3 text-center border-r border-white/5">Horas Hombre<br>(HH)</th>
              <th class="p-3 text-center border-r border-white/5">Accidentes<br>STP</th>
              <th class="p-3 text-center border-r border-white/5">Accidentes<br>CTP</th>
              <th class="p-3 text-center border-r border-white/5">Accidentes<br>Trayecto</th>
              <th class="p-3 text-center border-r border-white/5">Incidentes<br>SST</th>
              <th class="p-3 text-center border-r border-white/5">Conductas<br>Riesgosas</th>
              <th class="p-3 text-center border-r border-white/5">Condiciones<br>Inseguras</th>
              <th class="p-3 text-center border-r border-white/5">Días<br>Perdidos</th>
              <th class="p-3 text-center border-r border-white/5">Días<br>Arrastre</th>
              <th class="p-3 text-center border-r border-white/5 text-emerald-500 font-bold">Índice<br>Frecuencia (IF)</th>
              <th class="p-3 text-center border-r border-white/5 text-emerald-500 font-bold">Índice<br>Gravedad (IG)</th>
              <th class="p-3 text-center border-r border-white/5 text-emerald-500 font-bold">Índice<br>Accidentabilidad (IA)</th>
              <th class="p-3 text-center pr-6 whitespace-nowrap">Acciones</th>
            </tr>
          </thead>
          <tbody class="text-xs font-semibold text-zinc-300 divide-y divide-white/5">
            <!-- Inline Add New Row Form -->
            <tr v-if="showNewRow" class="bg-emerald-950/10 border-b border-emerald-500/20">
              <td class="p-3 pl-6 sticky left-0 bg-[#14261d] z-10 border-r border-white/5">
                <input 
                  type="month" 
                  v-model="newRecord.mes" 
                  class="bg-black/60 border border-emerald-500/30 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 w-[120px]" 
                />
              </td>
              <td class="p-3 sticky left-[100px] bg-[#14261d] z-10 border-r border-white/5">
                <select 
                  v-model="newRecord.id_proyecto" 
                  class="bg-black/60 border border-emerald-500/30 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 w-[180px]"
                >
                  <option :value="null" disabled>Seleccione Contrato</option>
                  <option v-for="p in proyectos" :key="p.id_proyecto" :value="p.id_proyecto">
                    {{ p.nombre_proyecto }} ({{ p.codi_proyecto }})
                  </option>
                </select>
              </td>
              <td class="p-3 text-center border-r border-white/5">
                <input 
                  type="number" 
                  v-model.number="newRecord.dotacion_promedio" 
                  class="bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-center focus:outline-none focus:border-emerald-500 w-16" 
                />
              </td>
              <td class="p-3 text-center border-r border-white/5">
                <input 
                  type="number" 
                  v-model.number="newRecord.horas_hombre" 
                  class="bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-center focus:outline-none focus:border-emerald-500 w-24" 
                />
              </td>
              <td class="p-3 text-center border-r border-white/5">
                <input 
                  type="number" 
                  v-model.number="newRecord.accidentes_stp" 
                  class="bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-center focus:outline-none focus:border-emerald-500 w-16" 
                />
              </td>
              <td class="p-3 text-center border-r border-white/5">
                <input 
                  type="number" 
                  v-model.number="newRecord.accidentes_ctp" 
                  class="bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-center focus:outline-none focus:border-emerald-500 w-16" 
                />
              </td>
              <td class="p-3 text-center border-r border-white/5">
                <input 
                  type="number" 
                  v-model.number="newRecord.accidentes_trayecto" 
                  class="bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-center focus:outline-none focus:border-emerald-500 w-16" 
                />
              </td>
              <td class="p-3 text-center border-r border-white/5 text-zinc-400 font-mono">
                <span class="px-2 py-1 bg-white/5 rounded block">0</span>
              </td>
              <td class="p-3 text-center border-r border-white/5 text-zinc-400 font-mono">
                <span class="px-2 py-1 bg-white/5 rounded block">0</span>
              </td>
              <td class="p-3 text-center border-r border-white/5 text-zinc-400 font-mono">
                <span class="px-2 py-1 bg-white/5 rounded block">0</span>
              </td>
              <td class="p-3 text-center border-r border-white/5">
                <input 
                  type="number" 
                  v-model.number="newRecord.dias_perdidos" 
                  class="bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-center focus:outline-none focus:border-emerald-500 w-16" 
                />
              </td>
              <td class="p-3 text-center border-r border-white/5">
                <input 
                  type="number" 
                  v-model.number="newRecord.dias_arrastre" 
                  class="bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-center focus:outline-none focus:border-emerald-500 w-16" 
                />
              </td>
              <td class="p-3 text-center border-r border-white/5 font-mono text-emerald-400 font-black">
                {{ calculateIF(newRecord.accidentes_ctp, newRecord.horas_hombre) }}
              </td>
              <td class="p-3 text-center border-r border-white/5 font-mono text-emerald-400 font-black">
                {{ calculateIG(newRecord.dias_perdidos, newRecord.horas_hombre) }}
              </td>
              <td class="p-3 text-center border-r border-white/5 font-mono text-emerald-400 font-black">
                {{ calculateIA(newRecord.accidentes_ctp, newRecord.dotacion_promedio) }}
              </td>
              <td class="p-3 text-center pr-6">
                <div class="flex gap-2 justify-center">
                  <button 
                    @click="saveNewRecord"
                    class="p-1.5 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-black rounded-lg transition-all"
                    title="Guardar Registro"
                  >
                    <Save class="w-4 h-4" />
                  </button>
                  <button 
                    @click="showNewRow = false"
                    class="p-1.5 bg-white/5 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-500 rounded-lg transition-all"
                  >
                    <X class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>

            <!-- Existing Grid Rows -->
            <template v-if="filteredRecords.length > 0">
              <tr 
                v-for="row in filteredRecords" 
                :key="row.id_registro" 
                class="hover:bg-white/[0.01] transition-all group"
                :class="{ 'bg-emerald-950/5': editingRowId === row.id_registro }"
              >
                <!-- Mes Cell -->
                <td class="p-3 pl-6 sticky left-0 bg-[#111113] group-hover:bg-[#151518] z-10 border-r border-white/5 text-white font-mono">
                  <input 
                    v-if="editingRowId === row.id_registro"
                    type="month" 
                    v-model="editRecord.mes" 
                    class="bg-black/60 border border-emerald-500/30 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500 w-[120px]" 
                  />
                  <span v-else>{{ row.periodo_anio }}-{{ String(row.periodo_mes).padStart(2, '0') }}</span>
                </td>

                <!-- Contrato Cell -->
                <td class="p-3 sticky left-[100px] bg-[#111113] group-hover:bg-[#151518] z-10 border-r border-white/5 font-bold">
                  <select 
                    v-if="editingRowId === row.id_registro"
                    v-model="editRecord.id_proyecto" 
                    class="bg-black/60 border border-emerald-500/30 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500 w-[180px]"
                  >
                    <option v-for="p in proyectos" :key="p.id_proyecto" :value="p.id_proyecto">
                      {{ p.nombre_proyecto }} ({{ p.codi_proyecto }})
                    </option>
                  </select>
                  <span v-else>{{ row.nombre_proyecto }} ({{ row.codi_proyecto }})</span>
                </td>

                <!-- Trabajadores Cell -->
                <td class="p-3 text-center border-r border-white/5">
                  <input 
                    v-if="editingRowId === row.id_registro"
                    type="number" 
                    v-model.number="editRecord.dotacion_promedio" 
                    class="bg-black/60 border border-white/10 rounded px-2 py-0.5 text-center focus:outline-none focus:border-emerald-500 w-16" 
                  />
                  <span v-else>{{ row.dotacion_promedio }}</span>
                </td>

                <!-- HH Cell -->
                <td class="p-3 text-center border-r border-white/5 font-mono text-emerald-400">
                  <input 
                    v-if="editingRowId === row.id_registro"
                    type="number" 
                    v-model.number="editRecord.horas_hombre" 
                    class="bg-black/60 border border-white/10 rounded px-2 py-0.5 text-center focus:outline-none focus:border-emerald-500 w-24" 
                  />
                  <span v-else>{{ formatNumber(row.horas_hombre) }}</span>
                </td>

                <!-- STP Cell -->
                <td class="p-3 text-center border-r border-white/5">
                  <input 
                    v-if="editingRowId === row.id_registro"
                    type="number" 
                    v-model.number="editRecord.accidentes_stp" 
                    class="bg-black/60 border border-white/10 rounded px-2 py-0.5 text-center focus:outline-none focus:border-emerald-500 w-16" 
                  />
                  <span v-else>{{ row.accidentes_stp }}</span>
                </td>

                <!-- CTP Cell -->
                <td class="p-3 text-center border-r border-white/5 text-rose-500 font-black">
                  <input 
                    v-if="editingRowId === row.id_registro"
                    type="number" 
                    v-model.number="editRecord.accidentes_ctp" 
                    class="bg-black/60 border border-white/10 rounded px-2 py-0.5 text-center focus:outline-none focus:border-emerald-500 w-16" 
                  />
                  <span v-else>{{ row.accidentes_ctp }}</span>
                </td>

                <!-- Trayecto Cell -->
                <td class="p-3 text-center border-r border-white/5">
                  <input 
                    v-if="editingRowId === row.id_registro"
                    type="number" 
                    v-model.number="editRecord.accidentes_trayecto" 
                    class="bg-black/60 border border-white/10 rounded px-2 py-0.5 text-center focus:outline-none focus:border-emerald-500 w-16" 
                  />
                  <span v-else>{{ row.accidentes_trayecto }}</span>
                </td>

                <!-- Incidentes Cell -->
                <td class="p-3 text-center border-r border-white/5 text-orange-400 font-bold">
                  {{ incidentesCount[row.id_proyecto + '-' + row.periodo_anio + '-' + row.periodo_mes] || 0 }}
                </td>

                <!-- Actos Inseguros Cell -->
                <td class="p-3 text-center border-r border-white/5 text-amber-500 font-bold">
                  {{ actosInsegurosCount[row.id_proyecto + '-' + row.periodo_anio + '-' + row.periodo_mes] || 0 }}
                </td>

                <!-- Condiciones Inseguras Cell -->
                <td class="p-3 text-center border-r border-white/5 text-blue-400 font-bold">
                  {{ condicionesInsegurasCount[row.id_proyecto + '-' + row.periodo_anio + '-' + row.periodo_mes] || 0 }}
                </td>

                <!-- Días Perdidos Cell -->
                <td class="p-3 text-center border-r border-white/5 text-rose-500">
                  <input 
                    v-if="editingRowId === row.id_registro"
                    type="number" 
                    v-model.number="editRecord.dias_perdidos" 
                    class="bg-black/60 border border-white/10 rounded px-2 py-0.5 text-center focus:outline-none focus:border-emerald-500 w-16" 
                  />
                  <span v-else>{{ row.dias_perdidos }}</span>
                </td>

                <!-- Días Arrastre Cell -->
                <td class="p-3 text-center border-r border-white/5 text-zinc-500">
                  <input 
                    v-if="editingRowId === row.id_registro"
                    type="number" 
                    v-model.number="editRecord.dias_arrastre" 
                    class="bg-black/60 border border-white/10 rounded px-2 py-0.5 text-center focus:outline-none focus:border-emerald-500 w-16" 
                  />
                  <span v-else>{{ row.dias_arrastre }}</span>
                </td>

                <!-- IF Cell -->
                <td class="p-3 text-center border-r border-white/5 font-mono text-emerald-400 font-black">
                  <span v-if="editingRowId === row.id_registro">
                    {{ calculateIF(editRecord.accidentes_ctp, editRecord.horas_hombre) }}
                  </span>
                  <span v-else>{{ calculateIF(row.accidentes_ctp, row.horas_hombre) }}</span>
                </td>

                <!-- IG Cell -->
                <td class="p-3 text-center border-r border-white/5 font-mono text-emerald-400 font-black">
                  <span v-if="editingRowId === row.id_registro">
                    {{ calculateIG(editRecord.dias_perdidos, editRecord.horas_hombre) }}
                  </span>
                  <span v-else>{{ calculateIG(row.dias_perdidos, row.horas_hombre) }}</span>
                </td>

                <!-- IA Cell -->
                <td class="p-3 text-center border-r border-white/5 font-mono text-emerald-400 font-black">
                  <span v-if="editingRowId === row.id_registro">
                    {{ calculateIA(editRecord.accidentes_ctp, editRecord.dotacion_promedio) }}
                  </span>
                  <span v-else>{{ calculateIA(row.accidentes_ctp, row.dotacion_promedio) }}</span>
                </td>

                <!-- Actions Cell -->
                <td class="p-3 text-center pr-6">
                  <div class="flex gap-2 justify-center">
                    <template v-if="editingRowId === row.id_registro">
                      <button 
                        @click="saveEditRecord(row.id_registro)"
                        class="p-1 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-black rounded transition-all"
                        title="Guardar Cambios"
                      >
                        <Save class="w-3.5 h-3.5" />
                      </button>
                      <button 
                        @click="editingRowId = null"
                        class="p-1 bg-white/5 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-500 rounded transition-all"
                        title="Cancelar"
                      >
                        <X class="w-3.5 h-3.5" />
                      </button>
                    </template>
                    <template v-else>
                      <button 
                        @click="startEdit(row)"
                        class="p-1.5 rounded hover:bg-white/5 text-zinc-400 hover:text-white transition-all"
                        title="Editar"
                      >
                        <Edit2 class="w-3.5 h-3.5" />
                      </button>
                      <button 
                        v-if="!String(row.id_registro).startsWith('virtual-')"
                        @click="deleteRecord(row.id_registro)"
                        class="p-1.5 rounded hover:bg-rose-500/10 text-zinc-500 hover:text-rose-500 transition-all"
                        title="Eliminar"
                      >
                        <Trash2 class="w-3.5 h-3.5" />
                      </button>
                    </template>
                  </div>
                </td>
              </tr>
            </template>
            <tr v-else>
              <td colspan="16" class="p-8 text-center text-zinc-500 font-medium">
                No hay registros mensuales o datos automáticos para mostrar. Haga clic en "Nuevo Registro" para crear uno.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { 
  FileText, 
  Plus, 
  Download, 
  Edit2, 
  Save, 
  X,
  Trash2,
  Users,
  Activity,
  AlertTriangle,
  AlertOctagon,
  Eye,
  ShieldAlert,
  CalendarDays
} from 'lucide-vue-next'
import { sstAxios } from '../services/api'

// States
const records = ref([])
const proyectos = ref([])
const showNewRow = ref(false)
const editingRowId = ref(null)

const selectedPeriod = ref('YTD')

const periodosDisponibles = computed(() => {
  const periods = new Set()
  records.value.forEach(r => {
    periods.add(`${r.periodo_anio}-${String(r.periodo_mes).padStart(2, '0')}`)
  })
  
  const addKeyPeriods = (obj) => {
    Object.keys(obj).forEach(k => {
      const parts = k.split('-')
      if (parts.length === 3) {
        periods.add(`${parts[1]}-${parts[2].padStart(2, '0')}`)
      }
    })
  }
  addKeyPeriods(actosInsegurosCount.value)
  addKeyPeriods(condicionesInsegurasCount.value)
  addKeyPeriods(incidentesCount.value)

  return Array.from(periods).sort().reverse()
})

const filteredRecords = computed(() => {
  if (selectedPeriod.value === 'YTD') {
    return finalRecords.value
  }
  const [anio, mes] = selectedPeriod.value.split('-').map(Number)
  return finalRecords.value.filter(r => r.periodo_anio === anio && r.periodo_mes === mes)
})

const totalDotacion = computed(() => filteredRecords.value.reduce((sum, r) => sum + (r.dotacion_promedio || 0), 0))
const totalHH = computed(() => filteredRecords.value.reduce((sum, r) => sum + (r.horas_hombre || 0), 0))
const totalAccidentes = computed(() => filteredRecords.value.reduce((sum, r) => sum + (r.accidentes_stp || 0) + (r.accidentes_ctp || 0) + (r.accidentes_trayecto || 0), 0))
const totalIncidentes = computed(() => {
  return filteredRecords.value.reduce((sum, r) => {
    const key = `${r.id_proyecto}-${r.periodo_anio}-${r.periodo_mes}`
    return sum + (incidentesCount.value[key] || 0)
  }, 0)
})
const totalConductas = computed(() => {
  return filteredRecords.value.reduce((sum, r) => {
    const key = `${r.id_proyecto}-${r.periodo_anio}-${r.periodo_mes}`
    return sum + (actosInsegurosCount.value[key] || 0)
  }, 0)
})
const totalCondiciones = computed(() => {
  return filteredRecords.value.reduce((sum, r) => {
    const key = `${r.id_proyecto}-${r.periodo_anio}-${r.periodo_mes}`
    return sum + (condicionesInsegurasCount.value[key] || 0)
  }, 0)
})
const totalDiasPerdidos = computed(() => filteredRecords.value.reduce((sum, r) => sum + (r.dias_perdidos || 0) + (r.dias_arrastre || 0), 0))

const kpisSST = computed(() => [
  { label: 'Dotación Total', value: formatNumber(totalDotacion.value), color: 'emerald', icon: Users },
  { label: 'HH Totales', value: formatNumber(totalHH.value), color: 'blue', icon: Activity },
  { label: 'Total Accidentes', value: formatNumber(totalAccidentes.value), color: 'red', icon: AlertTriangle },
  { label: 'Total Incidentes', value: formatNumber(totalIncidentes.value), color: 'amber', icon: AlertOctagon },
  { label: 'Conductas Riesg.', value: formatNumber(totalConductas.value), color: 'amber', icon: Eye },
  { label: 'Condiciones Inseg.', value: formatNumber(totalCondiciones.value), color: 'rose', icon: ShieldAlert },
  { label: 'Días Perdidos', value: formatNumber(totalDiasPerdidos.value), color: 'orange', icon: CalendarDays }
])

const finalRecords = computed(() => {
  const list = [...records.value]
  const existingKeys = new Set(records.value.map(r => `${r.id_proyecto}-${r.periodo_anio}-${r.periodo_mes}`))

  const allPeriods = new Set()
  
  // Agregar llaves de todos los orígenes automáticos
  Object.keys(actosInsegurosCount.value).forEach(k => allPeriods.add(k))
  Object.keys(condicionesInsegurasCount.value).forEach(k => allPeriods.add(k))
  Object.keys(incidentesCount.value).forEach(k => allPeriods.add(k))

  allPeriods.forEach(key => {
    if (!existingKeys.has(key)) {
      const [id_proyecto_str, anio_str, mes_str] = key.split('-')
      const id_proyecto = Number(id_proyecto_str)
      const periodo_anio = Number(anio_str)
      const periodo_mes = Number(mes_str)

      // Buscar datos de proyecto
      const proyecto = proyectos.value.find(p => Number(p.id_proyecto) === id_proyecto)

      list.push({
        id_registro: `virtual-${id_proyecto}-${periodo_anio}-${periodo_mes}`,
        isVirtual: true,
        periodo_anio,
        periodo_mes,
        id_proyecto,
        nombre_proyecto: proyecto ? proyecto.nombre_proyecto : `Proyecto #${id_proyecto}`,
        codi_proyecto: proyecto ? proyecto.codi_proyecto : '',
        dotacion_promedio: 0,
        horas_hombre: 0,
        accidentes_stp: 0,
        accidentes_ctp: 0,
        accidentes_trayecto: 0,
        dias_perdidos: 0,
        dias_arrastre: 0
      })
    }
  })

  // Ordenar: año desc, mes desc, nombre proyecto asc
  return list.sort((a, b) => {
    if (b.periodo_anio !== a.periodo_anio) {
      return b.periodo_anio - a.periodo_anio
    }
    if (b.periodo_mes !== a.periodo_mes) {
      return b.periodo_mes - a.periodo_mes
    }
    return String(a.nombre_proyecto).localeCompare(String(b.nombre_proyecto), 'es', { sensitivity: 'base' })
  })
})

// Dynamic aggregates maps key: `${id_proyecto}-${anio}-${mes}`
const incidentesCount = ref({})
const actosInsegurosCount = ref({})
const condicionesInsegurasCount = ref({})

// Empty state for Add
const newRecord = ref({
  mes: new Date().toISOString().substring(0, 7),
  id_proyecto: null,
  dotacion_promedio: 0,
  horas_hombre: 0,
  accidentes_stp: 0,
  accidentes_ctp: 0,
  accidentes_trayecto: 0,
  dias_perdidos: 0,
  dias_arrastre: 0
})

// Editing copy state
const editRecord = ref({})

// Format numbers nicely
const formatNumber = (val) => {
  if (val === undefined || val === null) return '0'
  return Number(val).toLocaleString('es-CL')
}

// Inline autocalculated KPI helpers
const calculateIF = (accidents, hh) => {
  if (!hh || hh === 0) return '0.00'
  return (((accidents || 0) * 1000000) / hh).toFixed(2)
}

const calculateIG = (lostDays, hh) => {
  if (!hh || hh === 0) return '0.00'
  return (((lostDays || 0) * 1000000) / hh).toFixed(2)
}

const calculateIA = (ctp, dotacion) => {
  if (!dotacion || dotacion === 0) return '0.00'
  return (((ctp || 0) / dotacion) * 100).toFixed(2)
}

// Fetch Initial Data
const fetchData = async () => {
  try {
    // 1. Fetch Proyectos
    const { data: proys } = await sstAxios.get('/sst/proyectos')
    proyectos.value = proys
    if (proys.length > 0 && !newRecord.value.id_proyecto) {
      newRecord.value.id_proyecto = proys[0].id_proyecto
    }

    // 2. Fetch Registros
    const { data: recs } = await sstAxios.get('/sst/registros')
    records.value = recs

    // 3. Fetch automated stats
    await fetchAutomatedStats()
  } catch (err) {
    console.error('Error fetching data:', err)
  }
}

// Mapeo de Datos: Fetch incidentes, acts and conditions to aggregate reactive sums per month & contract
const fetchAutomatedStats = async () => {
  try {
    const { data: incidentes } = await sstAxios.get('/audits?type=incidente').catch(() => ({ data: [] }))
    const { data: automatedStats } = await sstAxios.get('/sst/indicadores-automaticos').catch(() => ({ data: [] }))
    
    const acts = {}
    const conditions = {}
    const incs = {}

    // 1. Count incidents from audits with type incident
    if (Array.isArray(incidentes)) {
      incidentes.forEach(inc => {
        const d = new Date(inc.audit_date || inc.created_at)
        const period = `${inc.id_proyecto || 1}-${d.getFullYear()}-${d.getMonth() + 1}`
        incs[period] = (incs[period] || 0) + 1
      })
    }

    // 2. Map automated stats (acts & conditions) from endpoint
    if (Array.isArray(automatedStats)) {
      automatedStats.forEach(stat => {
        const period = `${stat.id_proyecto}-${stat.periodo_anio}-${stat.periodo_mes}`
        acts[period] = Number(stat.total_actos_inseguros || 0)
        conditions[period] = Number(stat.total_condiciones_inseguras || 0)
      })
    }

    // Unify state
    actosInsegurosCount.value = acts
    condicionesInsegurasCount.value = conditions
    incidentesCount.value = incs
  } catch (err) {
    console.error('Error fetching automated stats:', err)
  }
}

// Toggle Add Form Row
const toggleNewRow = () => {
  showNewRow.value = !showNewRow.value
}

// Action: Save New Record
const saveNewRecord = async () => {
  if (!newRecord.value.mes || !newRecord.value.id_proyecto) {
    alert('Por favor complete el mes y seleccione un contrato.')
    return
  }

  const [anio, mes] = newRecord.value.mes.split('-').map(Number)
  const payload = {
    periodo_anio: anio,
    periodo_mes: mes,
    id_proyecto: newRecord.value.id_proyecto,
    dotacion_promedio: newRecord.value.dotacion_promedio || 0,
    horas_hombre: newRecord.value.horas_hombre || 0,
    dias_perdidos: newRecord.value.dias_perdidos || 0,
    dias_arrastre: newRecord.value.dias_arrastre || 0,
    accidentes_stp: newRecord.value.accidentes_stp || 0,
    accidentes_ctp: newRecord.value.accidentes_ctp || 0,
    accidentes_trayecto: newRecord.value.accidentes_trayecto || 0
  }

  try {
    await sstAxios.post('/sst/registros', payload)
    showNewRow.value = false
    // Reset form
    newRecord.value = {
      mes: new Date().toISOString().substring(0, 7),
      id_proyecto: proyectos.value[0]?.id_proyecto || null,
      dotacion_promedio: 0,
      horas_hombre: 0,
      accidentes_stp: 0,
      accidentes_ctp: 0,
      accidentes_trayecto: 0,
      dias_perdidos: 0,
      dias_arrastre: 0
    }
    await fetchData()
    alert('Registro guardado exitosamente.')
  } catch (err) {
    alert('Error al guardar el registro: ' + (err.response?.data?.error || err.message))
  }
}

// Action: Start Edit
const startEdit = (row) => {
  editingRowId.value = row.id_registro
  editRecord.value = {
    mes: `${row.periodo_anio}-${String(row.periodo_mes).padStart(2, '0')}`,
    id_proyecto: row.id_proyecto,
    dotacion_promedio: row.dotacion_promedio,
    horas_hombre: row.horas_hombre,
    accidentes_stp: row.accidentes_stp,
    accidentes_ctp: row.accidentes_ctp,
    accidentes_trayecto: row.accidentes_trayecto,
    dias_perdidos: row.dias_perdidos,
    dias_arrastre: row.dias_arrastre
  }
}

// Action: Save Edit
const saveEditRecord = async (id) => {
  const [anio, mes] = editRecord.value.mes.split('-').map(Number)
  const payload = {
    periodo_anio: anio,
    periodo_mes: mes,
    id_proyecto: editRecord.value.id_proyecto,
    dotacion_promedio: editRecord.value.dotacion_promedio || 0,
    horas_hombre: editRecord.value.horas_hombre || 0,
    dias_perdidos: editRecord.value.dias_perdidos || 0,
    dias_arrastre: editRecord.value.dias_arrastre || 0,
    accidentes_stp: editRecord.value.accidentes_stp || 0,
    accidentes_ctp: editRecord.value.accidentes_ctp || 0,
    accidentes_trayecto: editRecord.value.accidentes_trayecto || 0
  }

  try {
    if (String(id).startsWith('virtual-')) {
      await sstAxios.post('/sst/registros', payload)
    } else {
      await sstAxios.put(`/sst/registros/${id}`, payload)
    }
    editingRowId.value = null
    await fetchData()
    alert('Registro guardado exitosamente.')
  } catch (err) {
    alert('Error al guardar cambios: ' + (err.response?.data?.error || err.message))
  }
}

// Action: Delete Record
const deleteRecord = async (id) => {
  if (!confirm('¿Está seguro de que desea eliminar este registro?')) return
  try {
    await sstAxios.delete(`/sst/registros/${id}`)
    await fetchData()
    alert('Registro eliminado.')
  } catch (err) {
    alert('Error al eliminar registro: ' + (err.response?.data?.error || err.message))
  }
}

// Action: Premium CSV Export
const exportToCSV = () => {
  if (filteredRecords.value.length === 0) {
    alert('No hay datos para exportar.')
    return
  }

  let csvContent = '\uFEFF' // BOM for Spanish characters
  
  // Headers
  csvContent += 'Mes,Contrato,Trabajadores,HH Mes,Accidentes STP,Accidentes CTP,Trayecto,Incidentes,Conductas Riesgosas,Condiciones Inseguras,Dias Perdidos,Dias Arrastre,IF,IG,IA\n'
  
  // Rows
  filteredRecords.value.forEach(r => {
    const key = `${r.id_proyecto}-${r.periodo_anio}-${r.periodo_mes}`
    const incs = incidentesCount.value[key] || 0
    const acts = actosInsegurosCount.value[key] || 0
    const conds = condicionesInsegurasCount.value[key] || 0
    
    const ifVal = calculateIF(r.accidentes_ctp, r.horas_hombre)
    const igVal = calculateIG(r.dias_perdidos, r.horas_hombre)
    const iaVal = calculateIA(r.accidentes_ctp, r.dotacion_promedio)
    
    csvContent += `"${r.periodo_anio}-${String(r.periodo_mes).padStart(2, '0')}",`
    csvContent += `"${r.nombre_proyecto}",`
    csvContent += `${r.dotacion_promedio},`
    csvContent += `${r.horas_hombre},`
    csvContent += `${r.accidentes_stp},`
    csvContent += `${r.accidentes_ctp},`
    csvContent += `${r.accidentes_trayecto},`
    csvContent += `${incs},`
    csvContent += `${acts},`
    csvContent += `${conds},`
    csvContent += `${r.dias_perdidos},`
    csvContent += `${r.dias_arrastre},`
    csvContent += `${ifVal},`
    csvContent += `${igVal},`
    csvContent += `${iaVal}\n`
  })

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `Registro_SST_Mensual_${new Date().toISOString().substring(0, 10)}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.glass-card {
  background: rgba(17, 17, 19, 0.95);
  backdrop-filter: blur(10px);
}
</style>
