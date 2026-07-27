<template>
  <section class="space-y-4 pb-8">
    <!-- SECTION 1: ANÁLISIS DE INSPECCIONES (COLAPSABLE) -->
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
          <h2 class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-200">Análisis de Otras Inspecciones</h2>
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
          <h2 class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-200">Planificación y Registro (Sin Patente)</h2>
        </div>
      </div>
      
      <div class="collapse-transition" :class="{'collapsed': !sections.plan}">
        <div class="p-6 pt-0 border-t border-slate-800/50 space-y-5">
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <div class="space-y-1">
              <label class="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Cliente <span class="text-red-500">*</span></label>
              <div class="relative">
                <select v-model="form.cliente" class="form-field form-select">
                  <option value="" disabled hidden>Seleccionar cliente</option>
                  <option
                    v-for="cliente in clientesFiltrados"
                    :key="cliente.id_empresa"
                    :value="cliente.id_empresa"
                  >
                    {{ getClienteLabel(cliente) }}
                  </option>
                </select>
                <ChevronDown class="field-icon" />
              </div>
            </div>

            <div class="space-y-1">
              <label class="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Proyecto <span class="text-red-500">*</span></label>
              <div class="relative">
                <select
                  v-model="form.proyecto"
                  class="form-field form-select"
                  :disabled="!form.cliente || loadingProyectos"
                >
                  <option value="" disabled hidden>Seleccionar proyecto</option>
                  <option
                    v-for="proyecto in proyectosFiltrados"
                    :key="proyecto.id_proyecto"
                    :value="proyecto.id_proyecto"
                  >
                    {{ proyecto.nombre_proyecto }}
                  </option>
                </select>
                <ChevronDown class="field-icon" />
              </div>
            </div>

            <div class="space-y-1">
              <label class="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Familia Checklist</label>
              <div class="relative">
                <select
                  v-model="form.familia"
                  class="form-field form-select"
                  :disabled="!form.cliente || loadingFamilias"
                >
                  <option value="" disabled hidden>Seleccionar familia</option>
                  <option
                    v-for="familia in familias"
                    :key="familia.id_tipo_srv"
                    :value="familia.id_tipo_srv"
                  >
                    {{ familia.name_tipo_srv }}
                  </option>
                </select>
                <ChevronDown class="field-icon" />
              </div>
            </div>

            <div class="space-y-1">
              <label class="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Protocolo / Pauta</label>
              <div class="relative">
                <select
                  v-model="form.protocolo"
                  class="form-field form-select"
                  :disabled="!form.familia || loadingTemplates"
                >
                  <option value="" disabled hidden>Seleccionar protocolo</option>
                  <option
                    v-for="template in templatesSurvey"
                    :key="template.id_template"
                    :value="template.id_template"
                  >
                    {{ template.name_template_srv }}
                  </option>
                </select>
                <ChevronDown class="field-icon" />
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[1fr_1fr_auto] gap-3 items-end">
            <div class="space-y-1">
              <label class="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Fecha Inicio Plan</label>
              <div class="relative">
                <input v-model="form.fechaInicio" type="date" class="form-field pr-10">
                <Calendar class="field-icon" />
              </div>
            </div>

            <div class="space-y-1">
              <label class="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Fecha Fin Plan</label>
              <div class="relative">
                <input v-model="form.fechaFin" type="date" class="form-field pr-10">
                <Calendar class="field-icon" />
              </div>
            </div>

            <button
              type="button"
              class="h-11 px-7 bg-blue-600 text-white rounded-lg text-sm font-black uppercase tracking-wider hover:bg-blue-500 transition-all shadow-[0_0_10px_rgba(37,99,235,0.35)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-600"
              :disabled="!puedeCrearSurvey || creandoSurvey"
              @click="crearSurvey"
            >
              {{ creandoSurvey ? 'Creando...' : 'Crear Inspección / Registro' }}
            </button>
          </div>

          <p v-if="mensaje" class="text-sm font-semibold" :class="mensajeTipo === 'error' ? 'text-red-400' : 'text-emerald-400'">
            {{ mensaje }}
          </p>
        </div>
      </div>
    </div>

    <TablaInspecciones
      ref="tablaInspeccionesRef"
      :exclude-equipos="true"
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
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { Calendar, ChevronDown, Edit3, CheckCircle, Clock, AlertTriangle, Eye } from 'lucide-vue-next'
import apiAxios from '@/services/api'
import TablaInspecciones from '@/components/TablaInspecciones.vue'
import AsignacionInspeccionModal from '@/components/AsignacionInspeccionModal.vue'

const sections = reactive({
  plan: false,
  stats: true
})

const DEFAULT_AREA_ID = 1
const DEFAULT_USER_ID = 1
const DEFAULT_FLOW_TMPL_ID = 1

const todayISO = () => new Date().toISOString().slice(0, 10)

const form = reactive({
  area: DEFAULT_AREA_ID,
  familia: '',
  protocolo: '',
  cliente: '',
  proyecto: '',
  fechaInicio: todayISO(),
  fechaFin: todayISO()
})

const encuestasActuales = computed(() => tablaInspeccionesRef.value?.surveys || [])

const planificadasCount = computed(() => encuestasActuales.value.filter(s => ['pre creado', 'pre-creado', 'planificado'].includes(String(s.estado_srv).toLowerCase().trim())).length)
const pendientesCount = computed(() => encuestasActuales.value.filter(s => ['creado', 'verificando', 'verificacion', 'verificación', 'ejecucion', 'ejecución'].includes(String(s.estado_srv).toLowerCase().trim())).length)
const realizadasCount = computed(() => encuestasActuales.value.filter(s => ['terminado', 'aprobado'].includes(String(s.estado_srv).toLowerCase().trim())).length)
const rechazadasCount = computed(() => encuestasActuales.value.filter(s => ['rechazado', 'rechazada'].includes(String(s.estado_srv).toLowerCase().trim())).length)

const kpisDinamicos = computed(() => [
  { label: 'Planificadas', value: planificadasCount.value, icon: Calendar, color: 'blue' },
  { label: 'Pendientes', value: pendientesCount.value, icon: Clock, color: 'amber' },
  { label: 'Realizadas', value: realizadasCount.value, icon: CheckCircle, color: 'emerald' },
  { label: 'Rechazadas', value: rechazadasCount.value, icon: AlertTriangle, color: 'red' }
])

const clientes = ref([])
const proyectos = ref([])
const familias = ref([])
const templatesSurvey = ref([])
const templatesSurveyBase = ref([])

const rolesCatalogo = ref([])
const usuariosRolesCatalogo = ref([])

const cargarRolesSesion = async () => {
  try {
    const [{ data: rolesData }, { data: usuariosRolesData }] = await Promise.all([
      apiAxios.get('/servicio/leanglobal/obtenerRoles'),
      apiAxios.get('/servicio/leanglobal/obtenerUsuariosRoles')
    ])
    rolesCatalogo.value = Array.isArray(rolesData) ? rolesData : []
    usuariosRolesCatalogo.value = Array.isArray(usuariosRolesData) ? usuariosRolesData : []
  } catch (error) {
    console.error('[OtrasInspecciones] Error cargando roles de sesión:', error)
  }
}

function parseLocalRolesNames() {
  const raw = localStorage.getItem('rolesNames')
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return String(raw).split(',').map(x => x.trim()).filter(Boolean)
  }
}

const userRoleNames = computed(() => {
  const currentUserId = resolveCurrentUserId()
  const fromCatalogo = (usuariosRolesCatalogo.value || [])
    .filter(ur => Number(ur.id_user) === currentUserId)
    .map(ur => {
      const match = (rolesCatalogo.value || []).find(r => Number(r.id_rol) === Number(ur.id_rol))
      return match ? String(match.name_rol).trim() : ''
    })
    .filter(Boolean)

  const all = new Set([
    ...fromCatalogo,
    ...parseLocalRolesNames()
  ])
  return Array.from(all)
})

const clientesFiltrados = computed(() => {
  const roles = userRoleNames.value || []
  if (!roles.length) return clientes.value

  if (roles.some(r => r.startsWith('CDLC_DMH') || r.startsWith('CDLC_DCH') || r.startsWith('CDLC_SPOT'))) {
    return clientes.value.filter(c => Number(c.id_empresa) === 3)
  }
  if (roles.some(r => r.startsWith('AMSA_MLP'))) {
    return clientes.value.filter(c => Number(c.id_empresa) === 4)
  }
  if (roles.some(r => r.startsWith('TMAC_CALM') || r.startsWith('TMAC_LAND'))) {
    return clientes.value.filter(c => Number(c.id_empresa) === 1)
  }
  return clientes.value
})

const proyectosFiltrados = computed(() => {
  const roles = userRoleNames.value || []
  if (!roles.length) return proyectos.value

  if (roles.some(r => r.startsWith('CDLC_DMH'))) {
    return proyectos.value.filter(p => Number(p.id_proyecto) === 2)
  }
  if (roles.some(r => r.startsWith('CDLC_DCH'))) {
    return proyectos.value.filter(p => Number(p.id_proyecto) === 1)
  }
  if (roles.some(r => r.startsWith('CDLC_SPOT'))) {
    return proyectos.value.filter(p => Number(p.id_proyecto) === 4)
  }
  if (roles.some(r => r.startsWith('AMSA_MLP'))) {
    return proyectos.value.filter(p => Number(p.id_proyecto) === 3)
  }
  if (roles.some(r => r.startsWith('TMAC_CALM'))) {
    return proyectos.value.filter(p => Number(p.id_proyecto) === 7)
  }
  if (roles.some(r => r.startsWith('TMAC_LAND'))) {
    return proyectos.value.filter(p => Number(p.id_proyecto) === 8)
  }
  return proyectos.value
})

watch(clientesFiltrados, (newVal) => {
  if (newVal && newVal.length === 1) {
    form.cliente = newVal[0].id_empresa
  }
}, { immediate: true })

watch(proyectosFiltrados, (newVal) => {
  if (newVal && newVal.length === 1) {
    form.proyecto = newVal[0].id_proyecto
  }
}, { immediate: true })
const loading = ref(false)
const loadingProyectos = ref(false)
const loadingFamilias = ref(false)
const loadingTemplates = ref(false)
const creandoSurvey = ref(false)
const tablaInspeccionesRef = ref(null)
const showAsignacionModal = ref(false)
const surveySeleccionado = ref(null)
const mensaje = ref('')
const mensajeTipo = ref('success')
const error = ref(null)

const puedeCrearSurvey = computed(() => {
  return !!form.cliente && !!form.proyecto && !!form.familia && !!form.protocolo && !!form.fechaInicio && !!form.fechaFin
})

const sortByText = (items, selector) => {
  return [...(Array.isArray(items) ? items : [])].sort((a, b) =>
    String(selector(a) || '').localeCompare(String(selector(b) || ''), 'es', { sensitivity: 'base' })
  )
}

const templatePerteneceAlProyecto = (template) => {
  const templateProyecto = template?.id_proyecto
  if (templateProyecto == null || String(templateProyecto).trim() === '') return true
  if (!form.proyecto) return false
  return Number(templateProyecto) === Number(form.proyecto)
}

const aplicarFiltroTemplatesPorProyecto = () => {
  const filtrados = templatesSurveyBase.value.filter(templatePerteneceAlProyecto)
  templatesSurvey.value = sortByText(filtrados, t => t.name_template_srv)

  if (
    form.protocolo &&
    !templatesSurvey.value.some(t => Number(t.id_template) === Number(form.protocolo))
  ) {
    form.protocolo = ''
  }
}

const safeJsonValue = (value, fallback) => {
  if (value == null || value === '') return fallback
  if (typeof value !== 'string') return value

  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function resolveCurrentUserId() {
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

  return DEFAULT_USER_ID
}

const resolveTemplateFlowId = (template) => {
  const idFlow = Number(template?.id_flow_tmpl)
  return Number.isFinite(idFlow) && idFlow > 0 ? idFlow : DEFAULT_FLOW_TMPL_ID
}

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
  error.value = null
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
  } catch (err) {
    error.value = 'Error al obtener clientes: ' + err.message
    console.error(err)
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
  error.value = null

  try {
    const { data } = await apiAxios.get('/servicio/leanglobal/obtenerProyectos?id_empresa_cliente=' + idCliente)
    proyectos.value = sortByText(data, p => p.nombre_proyecto)
  } catch (err) {
    proyectos.value = []
    error.value = 'Error al obtener proyectos: ' + err.message
    console.error(err)
  } finally {
    loadingProyectos.value = false
  }
}

const obtenerFamilias = async (idEmpresa) => {
  if (!idEmpresa) {
    familias.value = []
    return
  }

  loadingFamilias.value = true
  error.value = null
  try {
    const response = await apiAxios.get('/servicio/leanglobal/obtenerFamilias?id_empresa=' + idEmpresa)
    const filtered = (Array.isArray(response.data) ? response.data : []).filter(
      f => {
        const id = Number(f.id_tipo_srv)
        const name = String(f.name_tipo_srv || '').toLowerCase().trim();
        // Excluimos equipos (5), conductual (7), seguridad (8) y consentimientos (0)
        return id !== 5 && id !== 7 && id !== 8 && id !== 0 && !name.includes('consentimiento');
      }
    )
    familias.value = sortByText(filtered, f => f.name_tipo_srv)
  } catch (err) {
    familias.value = []
    error.value = 'Error al obtener familias: ' + err.message
    console.error(err)
  } finally {
    loadingFamilias.value = false
  }
}

const obtenerTemplates = async (idTipoSrv) => {
  if (!idTipoSrv) {
    templatesSurveyBase.value = []
    templatesSurvey.value = []
    return
  }

  loadingTemplates.value = true
  error.value = null
  try {
    const { data } = await apiAxios.get('/servicio/leanglobal/obtenerTemplates', {
      params: { id_tipo_srv: idTipoSrv }
    })
    templatesSurveyBase.value = Array.isArray(data) ? data : []
    aplicarFiltroTemplatesPorProyecto()
  } catch (err) {
    templatesSurveyBase.value = []
    templatesSurvey.value = []
    error.value = 'Error al obtener templates: ' + err.message
    console.error('Error al obtener templates:', err)
  } finally {
    loadingTemplates.value = false
  }
}

const crearSurvey = async () => {
  mensaje.value = ''
  error.value = null

  if (!puedeCrearSurvey.value) {
    mensajeTipo.value = 'error'
    mensaje.value = 'Completa cliente, proyecto, familia, protocolo y fechas.'
    return
  }

  const template = templatesSurvey.value.find(t => Number(t.id_template) === Number(form.protocolo))
  if (!template) {
    mensajeTipo.value = 'error'
    mensaje.value = 'No se encontró el template seleccionado.'
    return
  }

  const headerSeed = safeJsonValue(template.header_seed, {})
  const bodySeed = safeJsonValue(template.body_seed, [])
  const approvalSeed = safeJsonValue(template.approval_seed, {})
  const idFlowTmpl = resolveTemplateFlowId(template)

  const payload = {
    id_tipo_srv: Number(form.familia),
    id_template: Number(form.protocolo),
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
    fecha_real_ini: null,
    fecha_real_fin: null,
    fecha_upload: null,
    latitud: null,
    longitud: null,
    id_proyecto: Number(form.proyecto),
    id_flow_tmpl: idFlowTmpl
  }

  creandoSurvey.value = true
  try {
    const { data } = await apiAxios.post('/survey/', payload)
    const creado = data?.datos?.[0] || data?.survey || (data?.id_survey ? data : null)
    mensajeTipo.value = 'success'
    mensaje.value = creado?.id_survey
      ? `Checklist creado correctamente (#${creado.id_survey}).`
      : 'Checklist creado correctamente.'
    await tablaInspeccionesRef.value?.getSurveys?.()
  } catch (err) {
    mensajeTipo.value = 'error'
    mensaje.value = 'Error al crear la inspección: ' + err.message
    error.value = mensaje.value
    console.error('Error al crear la inspección:', err)
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
    form.familia = ''
    form.protocolo = ''
    proyectos.value = []
    familias.value = []
    templatesSurveyBase.value = []
    templatesSurvey.value = []
    if (nuevoCliente) {
      obtenerProyectos(nuevoCliente)
    }
    await obtenerFamilias(nuevoCliente)
  }
)

watch(
  () => form.proyecto,
  () => {
    form.protocolo = ''
    aplicarFiltroTemplatesPorProyecto()
  }
)

watch(
  () => form.familia,
  async (nuevaFamilia) => {
    form.protocolo = ''
    templatesSurveyBase.value = []
    templatesSurvey.value = []
    await obtenerTemplates(nuevaFamilia)
  }
)

onMounted(async () => {
  await cargarRolesSesion()
  await obtenerClientes()
})
</script>

<style scoped>
.form-field {
  width: 100%;
  height: 42px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
  padding: 0 12px;
  font-size: 15px;
  font-weight: 500;
  line-height: 1;
  transition: all 0.2s ease;
}

.form-field:focus {
  outline: none;
  border-color: rgba(59, 130, 246, 0.65);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.form-select {
  appearance: none;
  padding-right: 32px;
}

.form-select option {
  background: #0d0e11;
  color: #f8fafc;
  font-weight: 600;
}

.form-select option:checked,
.form-select option:hover {
  background: #2563eb;
  color: #ffffff;
}

.field-icon {
  pointer-events: none;
  position: absolute;
  right: 10px;
  top: 50%;
  height: 16px;
  width: 16px;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.55);
}

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
</style>
