<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
    @click.self="cerrar"
  >
    <div class="w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-[#101114] shadow-2xl">
      <header class="flex items-center justify-between border-b border-white/10 bg-blue-600 px-5 py-4">
        <h2 class="text-lg font-black text-white">Asignacion Completa</h2>
        <button type="button" class="icon-close" title="Cerrar" @click="cerrar">
          <X class="h-5 w-5" />
        </button>
      </header>

      <div class="space-y-5 p-5">
        <div v-if="error" class="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-300">
          {{ error }}
        </div>

        <div class="info-line">
          <Info class="h-5 w-5 shrink-0" />
          <span>Selecciona usuario del protocolo y, si corresponde, usuarios de flujo.</span>
        </div>

        <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[1fr_180px_180px]">
          <div class="space-y-1">
            <label class="field-label">Usuario</label>
            <div class="relative">
              <select v-model="asignacion.id_user_survey" class="form-field form-select">
                <option value="">Seleccionar usuario</option>
                <option v-for="usuario in usuariosOrdenados" :key="usuario.id_user" :value="usuario.id_user">
                  {{ usuario.nombre_user }}
                </option>
              </select>
              <ChevronDown class="field-icon" />
            </div>
          </div>

          <div class="space-y-1">
            <label class="field-label">Fecha Inicio Plan</label>
            <input v-model="asignacion.fecha_plan_ini" type="date" class="form-field">
          </div>

          <div class="space-y-1">
            <label class="field-label">Fecha Fin Plan</label>
            <input v-model="asignacion.fecha_plan_fin" type="date" class="form-field">
          </div>
        </div>

        <div class="info-line">
          <Info class="h-5 w-5 shrink-0" />
          <span>Flujo: asigna usuario por cada paso.</span>
        </div>

        <div v-if="cargando" class="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-6 text-center text-sm font-semibold text-muted-foreground">
          Cargando flujo...
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="flujo in flujosAsignacion"
            :key="`flujo-${flujo.id_flow_stp}`"
            class="grid grid-cols-1 gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 md:grid-cols-[240px_1fr]"
          >
            <div class="text-sm text-zinc-200">
              <strong class="text-white">Paso {{ flujo.flow_tmpl_step_name || flujo.flow_tmpl_step_orden }}:</strong>
              <span class="text-zinc-400"> ({{ flujo.name_rol || 'Sin rol' }})</span>
            </div>

            <div class="relative">
              <select
                v-model="flujo.id_user"
                class="form-field form-select"
                @change="markDirty(flujo)"
              >
                <option value="">{{ flujo.flag_equipo ? 'Seleccionar equipo' : 'Seleccionar usuario' }}</option>
                <option
                  v-for="item in itemsPorFlujo(flujo)"
                  :key="item.value"
                  :value="item.value"
                >
                  {{ item.title }}
                </option>
              </select>
              <ChevronDown class="field-icon" />
            </div>
          </div>

          <div v-if="!flujosAsignacion.length" class="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-200">
            Esta inspeccion no tiene pasos de flujo disponibles.
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button type="button" class="btn-secondary" @click="cerrar">
            <X class="h-4 w-4" />
            Cancelar
          </button>
          <button
            type="button"
            class="btn-primary"
            :disabled="!puedeGuardar || guardando || cargando"
            @click="guardarAsignacion"
          >
            <Check class="h-4 w-4" />
            {{ guardando ? 'Asignando...' : 'Asignar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { Check, ChevronDown, Info, X } from 'lucide-vue-next'
import apiAxios from '@/services/api'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  survey: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'guardado'])

const obtenerFechaHoy = () => new Date().toISOString().slice(0, 10)
const normalizaNum = (value) => (value == null || value === '' ? null : Number(value))

const asignacion = reactive({
  id_survey: null,
  id_template: null,
  id_user_survey: '',
  fecha_plan_ini: obtenerFechaHoy(),
  fecha_plan_fin: obtenerFechaHoy()
})

const usuarios = ref([])
const usuariosRoles = ref([])
const roles = ref([])
const equipos = ref([])
const flujosAsignacion = ref([])
const idFlow = ref(null)
const cargando = ref(false)
const guardando = ref(false)
const error = ref('')

const usuariosOrdenados = computed(() => {
  return [...usuarios.value]
    .filter(u => String(u.nombre_user || '').trim())
    .sort((a, b) => String(a.nombre_user).localeCompare(String(b.nombre_user), 'es', { sensitivity: 'base' }))
})

const rolNameToId = computed(() => {
  const map = new Map()
  for (const rol of roles.value) map.set(String(rol.name_rol || ''), Number(rol.id_rol))
  return map
})

const usersByRolId = computed(() => {
  const map = new Map()
  for (const item of usuariosRoles.value) {
    const idRol = Number(item.id_rol)
    const idUser = Number(item.id_user)
    if (!map.has(idRol)) map.set(idRol, new Set())
    map.get(idRol).add(idUser)
  }
  return map
})

const equiposItems = computed(() => {
  return [...equipos.value]
    .map(e => ({
      value: Number(e.id_equipo_proyecto),
      title: e.nombre_equipo || `Equipo ${e.id_equipo_proyecto}`
    }))
    .sort((a, b) => String(a.title).localeCompare(String(b.title), 'es', { sensitivity: 'base' }))
})

const flujoIncompleto = computed(() => {
  return flujosAsignacion.value.some(f => !normalizaNum(f.id_user))
})

const puedeGuardar = computed(() => {
  return !!Number(asignacion.id_survey) &&
    !!normalizaNum(asignacion.id_user_survey) &&
    !!asignacion.fecha_plan_ini &&
    !!asignacion.fecha_plan_fin &&
    !flujoIncompleto.value
})

const cerrar = () => {
  emit('update:modelValue', false)
}

const itemsPorFlujo = (flujo) => {
  if (flujo.flag_equipo) return equiposItems.value

  const rolId = rolNameToId.value.get(String(flujo.name_rol || ''))
  const ids = usersByRolId.value.get(Number(rolId))
  const base = ids
    ? usuariosOrdenados.value.filter(u => ids.has(Number(u.id_user)))
    : usuariosOrdenados.value

  return base.map(u => ({
    value: Number(u.id_user),
    title: u.nombre_user
  }))
}

const markDirty = (flujo) => {
  const nuevo = normalizaNum(flujo.id_user)
  if (flujo._orig_id === undefined) flujo._orig_id = normalizaNum(flujo.id_user)
  flujo.id_user = nuevo || ''
  flujo._dirty = nuevo !== flujo._orig_id
}

async function cargarCatalogos() {
  const [usuariosRes, rolesRes, usuariosRolesRes, equiposRes] = await Promise.all([
    apiAxios.get('/servicio/leanglobal/obtenerUsuarios'),
    apiAxios.get('/servicio/leanglobal/obtenerRoles'),
    apiAxios.get('/servicio/leanglobal/obtenerUsuariosRoles'),
    apiAxios.get('/servicio/leanglobal/obtenerEquiposProyectos')
  ])

  usuarios.value = Array.isArray(usuariosRes.data) ? usuariosRes.data : []
  roles.value = Array.isArray(rolesRes.data) ? rolesRes.data : []
  usuariosRoles.value = Array.isArray(usuariosRolesRes.data) ? usuariosRolesRes.data : []
  equipos.value = Array.isArray(equiposRes.data) ? equiposRes.data : []
}

async function obtenerFlujoSurvey(surveyId) {
  const { data } = await apiAxios.get('/servicio/leanglobal/flujosAprobacion')
  const row = (data?.datos || []).find(f => Number(f.id_survey) === Number(surveyId))
  idFlow.value = row?.id_flow ?? null
}

async function cargarStepsFlujo() {
  if (!idFlow.value) {
    flujosAsignacion.value = []
    return
  }

  const { data } = await apiAxios.get('/servicio/leanglobal/flujosAprobacionSteps', {
    params: { id_flow: idFlow.value }
  })

  flujosAsignacion.value = (Array.isArray(data) ? data : [])
    .sort((a, b) => (a?.flow_tmpl_step_orden ?? Infinity) - (b?.flow_tmpl_step_orden ?? Infinity))
    .map(f => {
      const flagEquipo = !!f.flag_equipo || /eq-?\s*fescol/i.test(String(f.name_rol || ''))
      const idUser = normalizaNum(f.id_user)
      return {
        ...f,
        flag_equipo: flagEquipo,
        id_user: idUser || '',
        _orig_id: idUser,
        _dirty: false
      }
    })
}

async function abrirConSurvey(survey) {
  if (!survey?.id_survey) return

  asignacion.id_survey = Number(survey.id_survey)
  asignacion.id_template = normalizaNum(survey.id_template)
  asignacion.id_user_survey = normalizaNum(survey.id_user) || ''
  asignacion.fecha_plan_ini = survey.fecha_plan_ini || obtenerFechaHoy()
  asignacion.fecha_plan_fin = survey.fecha_plan_fin || obtenerFechaHoy()

  error.value = ''
  cargando.value = true
  flujosAsignacion.value = []

  try {
    await cargarCatalogos()
    await obtenerFlujoSurvey(survey.id_survey)
    await cargarStepsFlujo()
  } catch (err) {
    error.value = 'Error al cargar asignacion: ' + err.message
    console.error('Error al cargar asignacion:', err)
  } finally {
    cargando.value = false
  }
}

async function actualizarEstadoSurveyCreado(surveyId) {
  await apiAxios.post('/survey/UpdSurveyEstado', {
    id_survey: surveyId,
    estado_srv: 'Creado'
  })
}

async function guardarAsignacion() {
  if (!puedeGuardar.value) {
    error.value = 'Selecciona usuario, fechas y todos los pasos del flujo.'
    return
  }

  guardando.value = true
  error.value = ''

  try {
    const sid = Number(asignacion.id_survey)
    const idUserSurvey = Number(asignacion.id_user_survey)

    await apiAxios.put(`/survey/UpdPlan/${sid}`, {
      id_user: idUserSurvey,
      fecha_plan_ini: asignacion.fecha_plan_ini,
      fecha_plan_fin: asignacion.fecha_plan_fin
    })

    await apiAxios.post('/notfqueue', {
      id_user_target: idUserSurvey,
      id_template: null,
      json_data: {
        id_survey: sid,
        id_flow: idFlow.value || null,
        id_area: 1,
        tipo_notf: 'asignacion_protocolo',
        obs_notf: 'asignacion protocolo'
      },
      channels: { channel: 'WEB' },
      estado: 'PENDING'
    })

    const cambios = flujosAsignacion.value.filter(f => f._dirty)
    const reqsFlujo = cambios.map(f => apiAxios.put('/survey/UpdUserFlow', {
      id_flow_stp: f.id_flow_stp,
      id_user_flujo: Number(f.id_user),
      flag_equipo: f.flag_equipo
    }))

    const reqsNotf = cambios
      .filter(f => !f.flag_equipo && normalizaNum(f.id_user))
      .map(f => apiAxios.post('/notfqueue', {
        id_user_target: Number(f.id_user),
        id_template: null,
        json_data: {
          id_survey: sid,
          id_flow: idFlow.value || null,
          id_area: 6,
          tipo_notf: 'asignacion_firma',
          obs_notf: 'asignacion firma'
        },
        channels: { channel: 'WEB' },
        estado: 'PENDING'
      }))

    const resultados = await Promise.allSettled(reqsFlujo)
    await Promise.allSettled(reqsNotf)
    const fallidos = resultados.filter(r => r.status === 'rejected')

    if (fallidos.length) {
      console.warn('Asignacion de flujo incompleta:', fallidos)
      error.value = 'Algunos pasos no pudieron guardarse.'
      return
    }

    await actualizarEstadoSurveyCreado(sid)
    emit('guardado')
    cerrar()
  } catch (err) {
    error.value = 'Error al guardar asignacion: ' + err.message
    console.error('Error al guardar asignacion:', err)
  } finally {
    guardando.value = false
  }
}

watch(
  () => props.modelValue,
  (abierto) => {
    if (abierto) abrirConSurvey(props.survey)
  }
)

watch(
  () => props.survey,
  (survey) => {
    if (props.modelValue && survey) abrirConSurvey(survey)
  }
)

onMounted(() => {
  if (props.modelValue && props.survey) abrirConSurvey(props.survey)
})
</script>

<style scoped>
.field-label {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.58);
}

.form-field {
  width: 100%;
  height: 42px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
  padding: 0 12px;
  font-size: 14px;
  font-weight: 600;
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

.info-line {
  display: flex;
  align-items: center;
  gap: 12px;
  border-radius: 10px;
  border: 1px solid rgba(59, 130, 246, 0.2);
  background: rgba(59, 130, 246, 0.12);
  padding: 10px 14px;
  color: #93c5fd;
  font-size: 14px;
  font-weight: 700;
}

.icon-close {
  display: inline-flex;
  height: 34px;
  width: 34px;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  color: white;
  transition: background 0.2s ease;
}

.icon-close:hover {
  background: rgba(255, 255, 255, 0.16);
}

.btn-primary,
.btn-secondary {
  display: inline-flex;
  height: 40px;
  align-items: center;
  gap: 8px;
  border-radius: 10px;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 900;
  text-transform: uppercase;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #2563eb;
  color: white;
}

.btn-primary:hover {
  background: #3b82f6;
}

.btn-primary:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.btn-secondary {
  color: rgba(255, 255, 255, 0.74);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.07);
  color: white;
}
</style>
