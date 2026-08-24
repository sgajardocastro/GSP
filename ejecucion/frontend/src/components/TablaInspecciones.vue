<template>
  <section class="glass-card rounded-2xl border border-white/10 overflow-hidden">
    <div class="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10">
      <div>
        <h2 class="text-sm font-black uppercase tracking-widest text-white">Inspecciones</h2>
        <p class="text-xs text-muted-foreground mt-1">{{ subtitle }}</p>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          class="h-9 px-3 inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
          :disabled="loading || !surveys.length"
          title="Exportar a Excel"
          @click="exportToExcel"
        >
          <FileSpreadsheet class="w-4 h-4" />
          <span class="text-[10px] font-black uppercase tracking-widest">Exportar</span>
        </button>

        <button
          type="button"
          class="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08] transition-colors disabled:opacity-50"
          :disabled="loading"
          title="Actualizar"
          @click="getSurveys"
        >
          <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
        </button>
      </div>
    </div>

    <div v-if="error" class="px-4 py-3 text-sm font-semibold text-red-400 border-b border-red-500/20 bg-red-500/10">
      {{ error }}
    </div>

    <div class="overflow-auto max-h-[620px]">
      <table class="min-w-[1700px] w-full text-left text-xs">
        <thead class="sticky top-0 z-10 bg-[#101114] text-white">
          <tr class="border-b border-white/10">
            <th class="table-th">Id Protocolo</th>
            <th v-if="String(tipoServiceId) !== '7' && String(tipoServiceId) !== '8'" class="table-th">Familia</th>
            <th v-if="String(tipoServiceId) !== '7' && String(tipoServiceId) !== '8'" class="table-th">Nombre Protocolo</th>
            <th class="table-th">Cliente</th>
            <th class="table-th">Proyecto</th>
            <th class="table-th">Usuario</th>
            <th v-if="String(tipoServiceId) !== '7' && String(tipoServiceId) !== '8' && !excludeEquipos" class="table-th">Patente</th>
            <th v-if="String(tipoServiceId) === '7'" class="table-th text-red-500">Conducta Riesgosa</th>
            <th v-if="String(tipoServiceId) === '8'" class="table-th text-red-500">Condición Insegura</th>
            <th class="table-th">Estado</th>
            <th class="table-th">Fecha Inicio Plan</th>
            <th class="table-th">Fecha Fin Plan</th>
            <th class="table-th">Fecha Inicio Real</th>
            <th class="table-th">Fecha Fin Real</th>
            <th class="table-th">Fecha Fin Ejec</th>
            <th class="table-th">Fecha Fin Verificacion</th>
            <th class="table-th text-center">Reporte</th>
            <th class="table-th text-center">Acciones</th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="loading">
            <td colspan="18" class="px-4 py-8 text-center text-muted-foreground font-semibold">
              Cargando inspecciones...
            </td>
          </tr>

          <tr v-else-if="!surveys.length">
            <td colspan="18" class="px-4 py-8 text-center text-muted-foreground font-semibold">
              Sin inspecciones para mostrar.
            </td>
          </tr>

          <tr
            v-for="item in surveys"
            v-else
            :key="item.id_survey"
            class="border-b border-white/10 text-zinc-200 hover:bg-white/[0.03] transition-colors"
          >
            <td class="table-td font-mono text-zinc-300">#{{ item.id_survey }}</td>
            <td v-if="String(tipoServiceId) !== '7' && String(tipoServiceId) !== '8'" class="table-td">{{ item.name_tipo_srv || '-' }}</td>
            <td v-if="String(tipoServiceId) !== '7' && String(tipoServiceId) !== '8'" class="table-td font-semibold text-white">{{ item.name_template_srv || '-' }}</td>
            <td class="table-td">{{ item.name_empresa_cliente || '-' }}</td>
            <td class="table-td">{{ item.nombre_proyecto || '-' }}</td>
            <td class="table-td">{{ item.nombre_user || 'SIN USUARIO' }}</td>
            <td v-if="String(tipoServiceId) !== '7' && String(tipoServiceId) !== '8' && !excludeEquipos" class="table-td font-mono font-bold">{{ getPatente(item) }}</td>
            <td v-if="String(tipoServiceId) === '7'" class="table-td font-bold text-center">
              <span v-if="hasConductaRiesgosa(item)" class="px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">RIESGOSA</span>
              <span v-else class="text-zinc-500 font-normal">-</span>
            </td>
            <td v-if="String(tipoServiceId) === '8'" class="table-td font-bold text-center">
              <span v-if="hasCondicionInsegura(item)" class="px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">INSEGURA</span>
              <span v-else class="text-zinc-500 font-normal">-</span>
            </td>
            <td class="table-td">
              <span class="inline-flex px-2 py-1 rounded-md border text-[10px] font-black uppercase" :class="estadoClass(item.estado_srv)">
                {{ item.estado_srv || '-' }}
              </span>
            </td>
            <td class="table-td">{{ item.fecha_plan_ini || '-' }}</td>
            <td class="table-td">{{ item.fecha_plan_fin || '-' }}</td>
            <td class="table-td">{{ item.fecha_real_ini || '-' }}</td>
            <td class="table-td">{{ item.fecha_real_fin || '-' }}</td>
            <td class="table-td">{{ item.fecha_ejec_fin || '-' }}</td>
            <td class="table-td">{{ item.fecha_verif_fin || '-' }}</td>
            <td class="table-td">
              <div class="flex justify-center gap-1">
                <button
                  type="button"
                  @click="abrirVisorWeb(item.id_survey)"
                  class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-amber-400 hover:bg-amber-500/10"
                  title="Ver Encuesta Web"
                >
                  <Eye class="w-4 h-4" />
                </button>
                <a
                  v-if="item.id_doc"
                  :href="`${archivoBaseUrl}/v1/storage/view/${item.id_doc}`"
                  target="_blank"
                  rel="noopener"
                  class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-400 hover:bg-blue-500/10"
                  title="Abrir PDF"
                >
                  <FileText class="w-4 h-4" />
                </a>
                <span v-else class="inline-flex h-8 w-8 items-center justify-center text-zinc-500" title="PDF no disponible">-</span>
              </div>
            </td>
            <td class="table-td">
              <div class="flex justify-center gap-2">
                <button
                  type="button"
                  class="icon-action text-blue-400 hover:bg-blue-500/10"
                  title="Asignacion completa"
                  @click="$emit('asignar', item)"
                >
                  <Users class="w-4 h-4" />
                </button>

                <button
                  v-if="item.estado_srv === 'Creado' || item.estado_srv === 'Pre Creado'"
                  type="button"
                  class="icon-action text-zinc-300 hover:bg-red-500/10 hover:text-red-400"
                  title="Eliminar"
                  :disabled="deletingId === item.id_survey"
                  @click="deleteSurvey(item)"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <!-- MODAL VISOR WEB -->
  <VerSurveyModal
    v-model="showVisorModal"
    :id-survey="visorSurveyId"
  />
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { FileText, RefreshCw, Trash2, Users, FileSpreadsheet, Eye } from 'lucide-vue-next'
import * as XLSX from 'xlsx'
import apiAxios, { sstAxios } from '@/services/api'
import VerSurveyModal from '@/components/VerSurveyModal.vue'

const props = defineProps({
  fechaDesde: {
    type: String,
    default: ''
  },
  fechaHasta: {
    type: String,
    default: ''
  },
  clienteId: {
    type: [String, Number],
    default: ''
  },
  proyectoId: {
    type: [String, Number],
    default: ''
  },
  tipoServiceId: {
    type: [String, Number],
    default: ''
  },
  excludeEquipos: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['asignar', 'deleted'])

const surveys = ref([])
const loading = ref(false)
const deletingId = ref(null)
const error = ref('')

const showVisorModal = ref(false)
const visorSurveyId = ref(null)
// Set de id_survey que tienen TIPO DE CONDUCTA = RIESGOSA (cargado desde SST endpoint)
const riesgosasIds = ref(new Set())
// Set de id_survey que tienen al menos una CONDICION INSEGURA (cargado desde SST endpoint)
const insegurasIds = ref(new Set())

const getPatente = (item) => {
  if (!item.header_exec) return 'SIN DATO'
  try {
    let data = item.header_exec
    // Intentar parsear (maneja posible doble stringify)
    if (typeof data === 'string') data = JSON.parse(data)
    if (typeof data === 'string') data = JSON.parse(data)
      
    return data?.patente || '-'
  } catch {
    return 'ERR PARSE'
  }
}

const todayISO = () => new Date().toISOString().slice(0, 10)

const addDays = (date, days) => {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy.toISOString().slice(0, 10)
}

const fechaDesdeFinal = computed(() => props.fechaDesde || addDays(new Date(), -90))
const fechaHastaFinal = computed(() => props.fechaHasta || addDays(new Date(), 30))

const subtitle = computed(() => `${fechaDesdeFinal.value} a ${fechaHastaFinal.value}`)

const archivoBaseUrl = computed(() => String(apiAxios.defaults.baseURL || '').replace(/\/$/, ''))

const normalizeFilter = (value) => {
  if (value == null) return ''
  const str = String(value).trim()
  return str && str.toLowerCase() !== 'null' ? str : ''
}

const estadoClass = (estado) => {
  const value = String(estado || '').toLowerCase()
  if (value.includes('pre')) return 'border-amber-500/30 bg-amber-500/10 text-amber-300'
  if (value.includes('ejec')) return 'border-blue-500/30 bg-blue-500/10 text-blue-300'
  if (value.includes('verif')) return 'border-purple-500/30 bg-purple-500/10 text-purple-300'
  if (value.includes('creado')) return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
  return 'border-white/10 bg-white/[0.04] text-zinc-300'
}

async function getSurveys() {
  loading.value = true
  error.value = ''

  const clienteId = normalizeFilter(props.clienteId)
  const proyectoId = normalizeFilter(props.proyectoId)

  try {
    const qparams = {
      fecha_desde: fechaDesdeFinal.value,
      fecha_hasta: fechaHastaFinal.value,
      'ts.id_empresa_cliente': clienteId,
      'ts.id_proyecto': proyectoId
    }
    const { data } = await apiAxios.get('/servicio/leanglobal/procesosSurveyV3', {
      params: qparams
    })

    let raw = data?.datos || []
    if (props.tipoServiceId) {
      raw = raw.filter(item => Number(item.id_tipo_srv) === Number(props.tipoServiceId))
    } else {
      // Para Equipos, excluimos Reporte Conductual (7), Consentimiento (0) e Inspección de Seguridad (8)
      raw = raw.filter(item => Number(item.id_tipo_srv) !== 7 && Number(item.id_tipo_srv) !== 0 && Number(item.id_tipo_srv) !== 8)
      if (props.excludeEquipos) {
        // Para Otras Inspecciones (No Equipos), excluimos también Inspección de Equipos (5)
        raw = raw.filter(item => Number(item.id_tipo_srv) !== 5)
      }
    }

    surveys.value = [...raw].sort((a, b) => Number(b.id_survey) - Number(a.id_survey))

    // Si es Observación Conductual, cargar qué surveys son riesgosos
    if (String(props.tipoServiceId) === '7') {
      await cargarRiesgosas()
    }
    // Si es Inspección de Seguridad, cargar qué surveys son inseguros
    if (String(props.tipoServiceId) === '8') {
      await cargarInseguras()
    }
  } catch (err) {
    surveys.value = []
    error.value = 'Error al obtener inspecciones: ' + err.message
    console.error('Error al obtener inspecciones:', err)
  } finally {
    loading.value = false
  }
}

async function deleteSurvey(item) {
  if (!item?.id_survey) return
  if (!window.confirm(`Eliminar survey #${item.id_survey}?`)) return

  deletingId.value = item.id_survey
  error.value = ''

  try {
    await apiAxios.post('/survey/DelSurvey/', { id_survey: item.id_survey })
    await getSurveys()
    emit('deleted', item)
  } catch (err) {
    error.value = 'Error al eliminar inspeccion: ' + err.message
    console.error('Error al eliminar inspeccion:', err)
  } finally {
    deletingId.value = null
  }
}

function abrirVisorWeb(idSurvey) {
  visorSurveyId.value = idSurvey
  showVisorModal.value = true
}

watch(
  () => [props.fechaDesde, props.fechaHasta, props.clienteId, props.proyectoId],
  () => getSurveys()
)

onMounted(() => {
  getSurveys()
})

async function cargarRiesgosas() {
  try {
    const { data } = await sstAxios.get('/sst/conductas-riesgosas')
    const ids = new Set((Array.isArray(data) ? data : []).map(r => Number(r.id_survey)))
    riesgosasIds.value = ids
  } catch {
    riesgosasIds.value = new Set()
  }
}

const hasConductaRiesgosa = (item) => {
  // Usar el set cargado desde SST backend (body_exec no viene en procesosSurveyV3)
  return riesgosasIds.value.has(Number(item.id_survey))
}

async function cargarInseguras() {
  try {
    const { data } = await sstAxios.get('/sst/condiciones-inseguras')
    const ids = new Set((Array.isArray(data) ? data : []).map(r => Number(r.id_survey)))
    insegurasIds.value = ids
  } catch {
    insegurasIds.value = new Set()
  }
}

const hasCondicionInsegura = (item) => {
  return insegurasIds.value.has(Number(item.id_survey))
}

function exportToExcel() {
  if (!surveys.value.length) return

  const isConduct = String(props.tipoServiceId) === '7'
  const isSafety = String(props.tipoServiceId) === '8'
  const hideFamProt = isConduct || isSafety

  const data = surveys.value.map(item => {
    const row = {
      'ID Survey': item.id_survey
    }
    if (!hideFamProt) {
      row['Familia'] = item.name_tipo_srv
      row['Protocolo'] = item.name_template_srv
    }
    row['Cliente'] = item.name_empresa_cliente
    row['Proyecto'] = item.nombre_proyecto
    row['Usuario'] = item.nombre_user || 'Sin Usuario'
    if (isConduct) {
      row['Conducta Riesgosa'] = hasConductaRiesgosa(item) ? 'SÍ' : 'NO'
    }
    if (isSafety) {
      row['Condición Insegura'] = hasCondicionInsegura(item) ? 'SÍ' : 'NO'
    }
    row['Estado'] = item.estado_srv
    row['Inicio Plan'] = item.fecha_plan_ini
    row['Fin Plan'] = item.fecha_plan_fin
    row['Inicio Real'] = item.fecha_real_ini
    row['Fin Real'] = item.fecha_real_fin
    return row
  })

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Inspecciones")

  // Generar archivo y descargar
  XLSX.writeFile(workbook, `Inspecciones_Equipos_${new Date().toISOString().split('T')[0]}.xlsx`)
}

// EXPOSE METHODS AND STATE TO PARENT
defineExpose({ getSurveys, surveys, hasConductaRiesgosa, riesgosasIds, hasCondicionInsegura, insegurasIds })
</script>

<style scoped>
.table-th {
  padding: 14px 12px;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.78);
  white-space: normal;
  line-height: 1.25;
}

.table-td {
  padding: 12px;
  vertical-align: middle;
  line-height: 1.35;
}

.icon-action {
  display: inline-flex;
  height: 32px;
  width: 32px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.icon-action:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}
</style>
