<template>
  <section class="space-y-6 pb-12 animate-in fade-in duration-500 overflow-y-auto custom-scroll h-full">
    
    <!-- SECTION 1: ANÁLISIS DE COMPORTAMIENTO (COLAPSABLE) -->
    <div class="glass-card-design rounded-2xl border border-slate-800 bg-[#16191f] overflow-hidden shadow-xl transition-all duration-300">
      <div 
        @click="sections.stats = !sections.stats" 
        class="p-5 flex items-center gap-4 cursor-pointer hover:bg-white/[0.01] transition-colors"
      >
        <ChevronDown 
          class="w-5 h-5 text-slate-500 transition-transform duration-300 shrink-0" 
          :class="{'rotate-180': !sections.stats}" 
        />
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <Eye class="w-4 h-4" />
          </div>
          <h2 class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-200">Análisis de Comportamiento</h2>
        </div>
      </div>

      <div class="collapse-transition" :class="{'collapsed': !sections.stats}">
        <div class="p-6 pt-0 border-t border-slate-800/50">
          <!-- KPIs (Compacto) -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 my-2 pb-2">
            <div v-for="kpi in kpisDinamicos" :key="kpi.label" class="bg-[#1a1e26]/50 p-2.5 rounded-xl border border-slate-800/40 hover:border-slate-700 transition-colors group flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div :class="`w-7 h-7 rounded-lg bg-${kpi.color}-500/10 flex items-center justify-center text-${kpi.color}-500 group-hover:scale-110 transition-transform`">
                  <component :is="kpi.icon" class="w-3.5 h-3.5" />
                </div>
                <span class="text-[9px] font-black uppercase tracking-widest text-slate-500">{{ kpi.label }}</span>
              </div>
              <div class="text-xl font-black text-white tracking-tight pr-2">{{ kpi.value }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SECTION 2: PLANIFICACIÓN Y REGISTRO (COLAPSABLE) -->
    <div class="glass-card-design rounded-2xl border border-slate-800 bg-[#16191f] overflow-hidden shadow-2xl transition-all duration-300">
      <div 
        @click="sections.plan = !sections.plan" 
        class="p-5 flex items-center gap-4 cursor-pointer group hover:bg-white/[0.02] transition-colors"
      >
        <ChevronDown 
          class="w-5 h-5 text-slate-500 transition-transform duration-300 shrink-0" 
          :class="{'rotate-180': !sections.plan}" 
        />
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
            <Edit3 class="w-4 h-4" />
          </div>
          <h2 class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-200">Planificación y Registro Conductual</h2>
        </div>
      </div>
      
      <div class="collapse-transition" :class="{'collapsed': !sections.plan}">
        <div class="p-6 pt-0 border-t border-slate-800/50">
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mt-6">
            <!-- Cliente -->
            <div class="space-y-2">
              <label class="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Cliente <span class="text-red-500">*</span></label>
              <div class="relative">
                <select v-model="form.cliente" class="w-full h-11 bg-[#0a0a0c] border border-slate-800 rounded-xl px-4 text-xs focus:border-blue-500 outline-none text-slate-400 appearance-none">
                  <option value="" disabled hidden>Seleccionar cliente</option>
                  <option v-for="cliente in clientes" :key="cliente.id_empresa" :value="cliente.id_empresa">
                    {{ getClienteLabel(cliente) }}
                  </option>
                </select>
                <ChevronDown class="absolute right-4 top-3.5 w-4 h-4 text-slate-600 pointer-events-none" />
              </div>
            </div>

            <!-- Proyecto -->
            <div class="space-y-2">
              <label class="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Proyecto <span class="text-red-500">*</span></label>
              <div class="relative">
                <select v-model="form.proyecto" class="w-full h-11 bg-[#0a0a0c] border border-slate-800 rounded-xl px-4 text-xs focus:border-blue-500 outline-none text-slate-400 appearance-none" :disabled="!form.cliente || loadingProyectos">
                  <option value="" disabled hidden>Seleccionar proyecto</option>
                  <option v-for="proyecto in proyectos" :key="proyecto.id_proyecto" :value="proyecto.id_proyecto">
                    {{ proyecto.nombre_proyecto }}
                  </option>
                </select>
                <ChevronDown class="absolute right-4 top-3.5 w-4 h-4 text-slate-600 pointer-events-none" />
              </div>
            </div>

            <!-- Familia (Solo lectura) -->
            <div class="space-y-2">
              <label class="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Familia</label>
              <div class="w-full h-11 bg-white/[0.02] border border-slate-800 rounded-xl px-4 flex items-center text-sm text-slate-400 font-bold opacity-70">
                Reporte Conductual
              </div>
            </div>

            <!-- Protocolo (Solo lectura) -->
            <div class="space-y-2">
              <label class="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Protocolo</label>
              <div class="w-full h-11 bg-white/[0.02] border border-slate-800 rounded-xl px-4 flex items-center text-sm text-slate-400 font-bold opacity-70">
                Observación Conductual
              </div>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] gap-5 mt-6 items-end">
            <div class="space-y-2">
              <label class="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 tracking-widest">Inicio de Observación</label>
              <div class="relative">
                <input v-model="form.fechaInicio" type="date" class="w-full h-11 bg-[#0a0a0c] border border-slate-800 rounded-xl px-4 text-xs focus:border-blue-500 outline-none text-slate-400">
                <Calendar class="absolute right-4 top-3.5 w-4 h-4 text-slate-600 pointer-events-none" />
              </div>
            </div>
            <div class="space-y-2">
              <label class="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 tracking-widest">Fin de Observación</label>
              <div class="relative">
                <input v-model="form.fechaFin" type="date" class="w-full h-11 bg-[#0a0a0c] border border-slate-800 rounded-xl px-4 text-xs focus:border-blue-500 outline-none text-slate-400">
                <Calendar class="absolute right-4 top-3.5 w-4 h-4 text-slate-600 pointer-events-none" />
              </div>
            </div>
            <button 
              @click="crearSurvey"
              :disabled="creandoSurvey"
              class="h-11 px-8 bg-blue-700 hover:bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-900/40 group active:scale-[0.98] disabled:opacity-50"
            >
              <Plus class="w-4 h-4 transition-transform group-hover:rotate-90" />
              {{ creandoSurvey ? 'Creando...' : 'Crear Reporte Conductual' }}
            </button>
          </div>
          <p v-if="mensaje" class="text-sm font-semibold mt-4" :class="mensajeTipo === 'error' ? 'text-red-400' : 'text-emerald-400'">
            {{ mensaje }}
          </p>
        </div>
      </div>
    </div>

    <!-- SECTION 3: HISTORIAL (TABLA) -->
    <TablaInspecciones
      ref="tablaInspeccionesRef"
      tipo-service-id="7"
      @asignar="abrirAsignacion"
    />

    <AsignacionInspeccionModal
      v-model="showAsignacionModal"
      :survey="surveySeleccionado"
      @guardado="onAsignacionGuardada"
    />
  </section>
</template>

<script setup>
import { computed, reactive, ref, onMounted, watch } from 'vue'
import { 
  Edit3, 
  ChevronDown, 
  Plus, 
  TrendingUp, 
  List, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  History,
  SlidersHorizontal,
  Eye,
  DownloadCloud,
  Calendar,
  Zap,
  Activity
} from 'lucide-vue-next'
import apiAxios from '@/services/api'
import TablaInspecciones from '@/components/TablaInspecciones.vue'
import AsignacionInspeccionModal from '@/components/AsignacionInspeccionModal.vue'

const sections = reactive({
  plan: false,
  stats: true
})

const showFilter = ref(false)
const clientes = ref([])
const proyectos = ref([])
const loading = ref(false)
const loadingProyectos = ref(false)
const tablaInspeccionesRef = ref(null)
const showAsignacionModal = ref(false)
const surveySeleccionado = ref(null)

const todayISO = () => new Date().toISOString().slice(0, 10)
const form = reactive({
  cliente: '',
  proyecto: '',
  familia: 'Observación Conductual',
  protocolo: 'Observación Conductual',
  fechaInicio: todayISO(),
  fechaFin: todayISO()
})

const encuestasActuales = computed(() => tablaInspeccionesRef.value?.surveys || [])

const planificadasCount = computed(() => encuestasActuales.value.filter(s => ['pre creado', 'pre-creado', 'planificado'].includes(String(s.estado_srv).toLowerCase().trim())).length)
const pendientesCount = computed(() => encuestasActuales.value.filter(s => ['creado', 'verificando', 'verificacion', 'verificación', 'ejecucion', 'ejecución'].includes(String(s.estado_srv).toLowerCase().trim())).length)
const realizadasCount = computed(() => encuestasActuales.value.filter(s => ['terminado', 'aprobado'].includes(String(s.estado_srv).toLowerCase().trim())).length)

// Conteo de Conductas Riesgosas: surveys visibles en la tabla que están en el set de riesgosas
const conductasRiesgosasCount = computed(() => {
  const ids = tablaInspeccionesRef.value?.riesgosasIds
  if (!ids || ids.size === 0) return 0
  return encuestasActuales.value.filter(s => ids.has(Number(s.id_survey))).length
})

const kpisDinamicos = computed(() => [
  { label: 'Planificadas', value: planificadasCount.value, icon: Calendar, color: 'blue' },
  { label: 'Pendientes', value: pendientesCount.value, icon: Clock, color: 'amber' },
  { label: 'Realizadas', value: realizadasCount.value, icon: CheckCircle, color: 'emerald' },
  { label: 'Conductas Riesgosas', value: conductasRiesgosasCount.value, icon: AlertTriangle, color: 'red' }
])

const getClienteLabel = (cliente) => {
  const nombre = String(cliente?.name_empresa || '').trim()
  const duplicados = clientes.value.filter(c => String(c?.name_empresa || '').trim() === nombre)

  if (nombre && duplicados.length <= 1) return nombre

  const respaldo = String(cliente?.razon_social || cliente?.rut_empresa || '').trim()
  if (respaldo && respaldo !== nombre) return `${nombre || 'Cliente'} - ${respaldo}`

  return nombre || `Cliente ${cliente?.id_empresa || ''}`.trim()
}

const obtenerClientes = async () => {
  loading.value = true
  try {
    const response = await apiAxios.get('/servicio/leanglobal/obtenerEmpresas')
    clientes.value = (Array.isArray(response.data) ? response.data : []).filter(
      e => {
        const isExterno = e.flag_externo === true || e.flag_externo === 1 || e.flag_externo === '1' || e.flag_externo === 't' || e.flag_externo === 'true';
        if (isExterno) return false;

        const name = String(e.name_empresa || '').toLowerCase().trim();
        const razon = String(e.razon_social || '').toLowerCase().trim();
        const isExcluded = name.includes('transmac spa') || name.includes('transmac s.p.a.') ||
                           name.includes('lin global spa') || name.includes('lin global s.p.a.') ||
                           name.includes('leanglobal spa') || name.includes('leanglobal s.p.a.') ||
                           name.includes('lean global spa') || name.includes('lean global s.p.a.') ||
                           razon.includes('transmac spa') || razon.includes('transmac s.p.a.') ||
                           razon.includes('lin global spa') || razon.includes('lin global s.p.a.') ||
                           razon.includes('leanglobal spa') || razon.includes('leanglobal s.p.a.') ||
                           razon.includes('lean global spa') || razon.includes('lean global s.p.a.');
        return !isExcluded;
      }
    )
  } catch (error) {
    console.error('Error fetching clientes:', error)
  } finally {
    loading.value = false
  }
}

const obtenerProyectos = async (idCliente) => {
  if (!idCliente) {
    proyectos.value = []
    return
  }

  loadingProyectos.value = true
  try {
    const { data } = await apiAxios.get('/servicio/leanglobal/obtenerProyectos?id_empresa_cliente=' + idCliente)
    proyectos.value = [...(Array.isArray(data) ? data : [])].sort((a, b) =>
      String(a.nombre_proyecto || '').localeCompare(String(b.nombre_proyecto || ''), 'es', { sensitivity: 'base' })
    )
  } catch (err) {
    proyectos.value = []
    console.error('Error fetching proyectos:', err)
  } finally {
    loadingProyectos.value = false
  }
}

const creandoSurvey = ref(false)
const mensaje = ref('')
const mensajeTipo = ref('success')

const resolveCurrentUserId = () => {
  const sources = [
    localStorage.getItem('userDetail'),
    localStorage.getItem('user'),
    sessionStorage.getItem('userDetail'),
    sessionStorage.getItem('user')
  ]
  for (const source of sources) {
    if (!source) continue
    try {
      const parsed = JSON.parse(source)
      const id = Number(parsed?.id_user || parsed?.userDetail?.id_user)
      if (Number.isFinite(id) && id > 0) return id
    } catch {
      const id = Number(source)
      if (Number.isFinite(id) && id > 0) return id
    }
  }
  return 1
}

const crearSurvey = async () => {
  mensaje.value = ''
  
  if (!form.cliente) {
    mensajeTipo.value = 'error'
    mensaje.value = 'Debe seleccionar un Cliente obligatorio.'
    return
  }

  if (!form.proyecto) {
    mensajeTipo.value = 'error'
    mensaje.value = 'Debe seleccionar un Proyecto obligatorio.'
    return
  }

  creandoSurvey.value = true
  try {
    const response = await apiAxios.get('/servicio/leanglobal/obtenerTemplates', {
      params: { id_tipo_srv: 7 }
    })
    const templates = Array.isArray(response.data) ? response.data : []
    const template = templates.find(t => Number(t.id_template) === 70)
    if (!template) {
      throw new Error('No se encontró el template 70 para Observación Conductual.')
    }

    const headerSeed = typeof template.header_seed === 'string' ? JSON.parse(template.header_seed) : template.header_seed || {}
    const bodySeed = typeof template.body_seed === 'string' ? JSON.parse(template.body_seed) : template.body_seed || []
    const approvalSeed = typeof template.approval_seed === 'string' ? JSON.parse(template.approval_seed) : template.approval_seed || {}
    const idFlowTmpl = Number(template.id_flow_tmpl) || 1

    const payload = {
      id_tipo_srv: 7,
      id_template: 70,
      id_user: null,
      id_user_creacion: resolveCurrentUserId(),
      id_empresa_cliente: Number(form.cliente),
      estado_srv: 'Pre Creado',
      header_seed: JSON.stringify(headerSeed),
      body_seed: JSON.stringify(bodySeed),
      approval_seed: JSON.stringify(approvalSeed),
      header_exec: JSON.stringify(headerSeed),
      body_exec: JSON.stringify(bodySeed),
      approval_exec: JSON.stringify(approvalSeed),
      fecha_plan_ini: form.fechaInicio,
      fecha_plan_fin: form.fechaFin,
      fecha_real_ini: form.fechaInicio,
      fecha_real_fin: form.fechaFin,
      fecha_upload: null,
      latitud: null,
      longitud: null,
      id_proyecto: Number(form.proyecto) || null,
      id_flow_tmpl: idFlowTmpl
    }

    const { data } = await apiAxios.post('/survey/', payload)
    const creado = data?.datos?.[0] || data?.survey || (data?.id_survey ? data : null)
    mensajeTipo.value = 'success'
    mensaje.value = creado?.id_survey
      ? `Reporte creado correctamente (#${creado.id_survey}).`
      : 'Reporte creado correctamente.'
    await tablaInspeccionesRef.value?.getSurveys?.()
  } catch (err) {
    mensajeTipo.value = 'error'
    mensaje.value = 'Error al crear el reporte: ' + err.message
    console.error(err)
  } finally {
    creandoSurvey.value = false
  }
}

const abrirAsignacion = (survey) => {
  surveySeleccionado.value = survey
  showAsignacionModal.value = true
}

const onAsignacionGuardada = async () => {
  mensajeTipo.value = 'success'
  mensaje.value = 'Asignación guardada correctamente.'
  await tablaInspeccionesRef.value?.getSurveys?.()
}

watch(
  () => form.cliente,
  async (nuevoCliente) => {
    form.proyecto = ''
    proyectos.value = []
    await obtenerProyectos(nuevoCliente)
  }
)

onMounted(async () => {
  await obtenerClientes()
  // Autoseleccionar Transmac
  const transmac = clientes.value.find(c => 
    String(c.name_empresa || '').toLowerCase().includes('transmac') || 
    String(c.razon_social || '').toLowerCase().includes('transmac')
  )
  if (transmac) {
    form.cliente = transmac.id_empresa
  }
})
</script>

<style scoped>
.glass-card-design {
  backdrop-filter: blur(10px);
}
.collapse-transition {
  transition: max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-out;
  max-height: 2000px;
  overflow: hidden;
}
.collapsed {
  max-height: 0;
  opacity: 0;
  pointer-events: none;
}
.custom-scroll::-webkit-scrollbar {
  width: 5px;
}
.custom-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scroll::-webkit-scrollbar-thumb {
  background: #1e293b;
  border-radius: 10px;
}
</style>
