<template>
  <v-container class="surveys-page">
    <!-- 🚛 BANNER / WIDGET NATIVO DE VIAJE ACTIVO ASIGNADO O EN RUTA -->
    <v-card
      v-if="viajeActivo"
      class="mb-4 rounded-xl border border-amber-500/40 text-white pa-4"
      style="background: linear-gradient(135deg, #0a0f1e 0%, #151e36 100%); box-shadow: 0 10px 25px -5px rgba(245, 158, 11, 0.2);"
      elevation="4"
    >
      <div class="d-flex align-center justify-space-between mb-2">
        <div class="d-flex align-center ga-2">
          <span class="text-h6">🚛</span>
          <div>
            <div class="text-caption font-weight-black text-amber-400 text-uppercase tracking-wider">
              {{ viajeActivo.estado_trayecto === 'EN_RUTA' ? '🛰️ En Tránsito / En Ruta' : '🚀 Salida de Patio Programada' }}
            </div>
            <div class="text-subtitle-2 font-weight-black text-white font-mono">
              {{ viajeActivo.patente }} <span class="text-grey-lighten-1 font-weight-normal">• {{ viajeActivo.modelo }}</span>
            </div>
          </div>
        </div>
        <v-chip size="small" :color="viajeActivo.estado_trayecto === 'EN_RUTA' ? 'info' : 'warning'" variant="flat" class="font-weight-bold">
          {{ viajeActivo.estado_trayecto }}
        </v-chip>
      </div>

      <div class="text-caption text-grey-lighten-2 mb-3 bg-black pa-2 rounded-lg border border-white/10">
        📍 <strong>Destino:</strong> {{ viajeActivo.obra_nombre }} <span class="text-amber-300">({{ viajeActivo.codi_proyecto }})</span>
        <div v-if="viajeActivo.obra_direccion" class="text-grey text-caption text-truncate">
          {{ viajeActivo.obra_direccion }}
        </div>
      </div>

      <v-btn
        block
        :color="viajeActivo.estado_trayecto === 'EN_RUTA' ? 'info' : 'amber-darken-2'"
        size="large"
        class="font-weight-black text-uppercase rounded-lg text-black"
        @click="abrirViajeNativo(viajeActivo.token_viaje)"
      >
        {{ viajeActivo.estado_trayecto === 'EN_RUTA' ? '🛰️ Continuar Registro de Viaje' : '▶️ Iniciar Registro de Viaje (Odómetro/PIN)' }}
      </v-btn>
    </v-card>

    <v-row dense class="align-center">
      <v-col v-if="!esVistaReclamos" cols="12" md="6" class="py-1">
        <div class="asignacion-dia-title">
          {{ esVistaAsignacionesCnx ? `Asignación para el día de ${tituloAsignacionDia}` : 'Protocolos e Inspecciones' }}
        </div>
      </v-col>

      <template v-else>
        <v-col cols="12" md="6" class="py-1">
          <div class="asignacion-dia-title">
            Reclamos
          </div>
        </v-col>
      </template>

      <v-col v-if="rolesSesionReady && !esVistaReclamos && !esVistaAsignacionesCnx" cols="6" md="6" class="py-1 d-flex align-center">
        <v-btn
          color="primary"
          prepend-icon="mdi-file-document-edit-outline"
          @click="abrirModalRegistrarProtocolo"
        >
          Registrar Inspección/Checklist
        </v-btn>
      </v-col>

      <v-dialog v-model="dialogRegistrarProtocolo" max-width="520">
        <v-card>
          <v-card-title class="text-subtitle-1 font-weight-bold">
            Registrar Inspección/Checklist
          </v-card-title>
          <v-card-text class="pt-2">
            <v-row dense>
              <v-col cols="12">
                <v-alert
                  v-if="errorCrearProtocolo"
                  type="error"
                  density="compact"
                  variant="tonal"
                  class="mb-2"
                >
                  {{ errorCrearProtocolo }}
                </v-alert>
              </v-col>

              <v-col cols="12" sm="6">
                <v-select
                  v-model="formProtocolo.id_empresa_cliente"
                  :items="clientesFiltrados"
                  item-title="name_empresa"
                  item-value="id_empresa"
                  label="Cliente"
                  variant="outlined"
                  density="compact"
                  :loading="loadingCatalogoProtocolo"
                  hide-details="auto"
                />
              </v-col>

              <v-col cols="12" sm="6">
                <v-select
                  v-model="formProtocolo.id_proyecto"
                  :items="proyectosFiltrados"
                  item-title="nombre_proyecto"
                  item-value="id_proyecto"
                  label="Proyecto"
                  variant="outlined"
                  density="compact"
                  :loading="loadingProyectosCatalogo"
                  :disabled="!formProtocolo.id_empresa_cliente"
                  hide-details="auto"
                />
              </v-col>

              <v-col cols="12" sm="6">
                <v-select
                  v-model="formProtocolo.area"
                  :items="areasOptions"
                  item-title="name_area"
                  item-value="name_area"
                  label="Area"
                  variant="outlined"
                  density="compact"
                  :loading="loadingCatalogoProtocolo"
                  :disabled="!formProtocolo.id_proyecto"
                  hide-details="auto"
                />
              </v-col>

              <v-col cols="12" sm="6">
                <v-select
                  v-model="formProtocolo.familia"
                  :items="familiasOptions"
                  item-title="familia"
                  item-value="familia"
                  label="Familia"
                  variant="outlined"
                  density="compact"
                  :loading="loadingCatalogoProtocolo"
                  :disabled="!formProtocolo.area"
                  hide-details="auto"
                />
              </v-col>

              <v-col cols="12">
                <v-select
                  v-model="formProtocolo.id_template"
                  :items="protocolosOptions"
                  item-title="display_name"
                  item-value="id_template"
                  label="Protocolo"
                  variant="outlined"
                  density="compact"
                  :loading="loadingCatalogoProtocolo"
                  :disabled="!formProtocolo.familia"
                  hide-details="auto"
                />
              </v-col>

              <v-col cols="12" class="pt-1">
                <div class="text-caption font-weight-bold text-medium-emphasis">
                  Asignación de Flujo
                </div>
              </v-col>

              <!--v-col cols="12" v-if="!surveyCreadoProtocoloId">
                <v-alert type="info" variant="tonal" density="compact">
                  Para asignar usuarios del flujo, primero presiona "Preparar Flujo".
                </v-alert>
              </v-col-->

              <v-col cols="12" v-if="loadingFlujoPlantilla">
                <v-progress-linear indeterminate color="primary" />
              </v-col>

              <v-col
                v-for="step in flujoPlantillaSteps"
                :key="`flow-step-${step.flow_tmpl_step_orden}-${step.name_rol}`"
                cols="12"
              >
                <v-select
                  v-model="step.id_user"
                  :label="step.flow_tmpl_step_name || 'Paso de flujo'"
                  :items="usuariosPorRol(step.name_rol)"
                  item-title="nombre_user"
                  item-value="id_user"
                  variant="outlined"
                  density="compact"
                  :class="{ 'flow-step-unassigned': !step.id_user }"
                  hide-details="auto"
                />
              </v-col>

              <!--v-col cols="12" v-if="!loadingFlujoPlantilla && !flujoPlantillaSteps.length">
                <v-alert type="info" variant="tonal" density="compact">
                  Este protocolo no tiene pasos de flujo configurados.
                </v-alert>
              </v-col-->
            </v-row>
          </v-card-text>
          <v-card-actions class="justify-end">
            <v-btn
              v-if="!surveyCreadoProtocoloId"
              color="primary"
              :loading="creandoProtocolo || loadingFlujoPlantilla"
              :disabled="!formularioProtocoloBasicoValido"
              @click="prepararFlujoModal"
            >
              Preparar Flujo
            </v-btn>
            <v-btn
              color="primary"
              v-else
              :loading="creandoProtocolo"
              :disabled="!formularioProtocoloValido"
              @click="crearSurveyDesdeModal"
            >
              Guardar Asignación
            </v-btn>
            <v-btn
              variant="text"
              @click="dialogRegistrarProtocolo = false"
            >
              Cerrar
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-col v-if="!esVistaReclamos && !esVistaAsignacionesCnx && rolesSesionReady" cols="12" class="pt-1">
        <v-row dense>
          <v-col cols="12" md="3">
            <v-select
              v-model="filtro"
              :items="filtros"
              item-value="ID"
              item-title="NOMBRE"
              label="Filtro Estados"
              density="compact"
              variant="outlined"
              class="surveys-filter-field"
              clearable
              return-object
              hide-details
              :menu-props="{ contentClass: 'surveys-select-menu' }"
            />
          </v-col>

          <v-col cols="12" md="3">
            <v-select
              v-model="filtroDim"
              :items="filtroDimension"
              item-value="ID"
              item-title="NOMBRE"
              label="Filtro Area"
              density="compact"
              variant="outlined"
              class="surveys-filter-field"
              clearable
              return-object
              hide-details
              :menu-props="{ contentClass: 'surveys-select-menu' }"
            />
          </v-col>

          <v-col cols="12" md="4">
            <v-text-field
              v-model="filtroTexto"
              label="Buscar Texto"
              density="compact"
              variant="outlined"
              class="surveys-filter-field"
              clearable
              hide-details
            />
          </v-col>

          <v-col cols="12" md="2" class="d-flex align-center justify-end">
            <v-switch
              v-model="verTerminados"
              label="Ver Terminados"
              density="compact"
              color="primary"
              hide-details
            />
          </v-col>
        </v-row>
      </v-col>
      
      <v-col cols="12" v-for="survey in filteredSurveys" :key="survey.id_survey">
        <div
          v-if="esVistaAsignacionesCnx && isConexionCompactSurvey(survey)"
          class="conexion-priority-card"
          @click="goToInspeccion(survey, notifPrimaryId(survey.id_survey))"
        >
          <div class="conexion-priority-card__top">
            <div class="conexion-priority-card__meta-pill">
              IC {{ getConexionCardData(survey).ic }}
            </div>
            <div class="conexion-priority-card__meta-pill">
              {{ getConexionCardData(survey).tipoTrabajo || 'Sin tipo' }}
            </div>
            <div class="conexion-priority-card__meta-pill">
              {{ getConexionCardData(survey).orden }}
            </div>
          </div>

          <div class="conexion-priority-card__address">
            {{ getConexionCardData(survey).direccionComuna }}
          </div>

          <div class="conexion-priority-card__people">
            <div class="conexion-priority-card__person-line">
              <span class="conexion-priority-card__label-inline">Proyecto</span>
              <span class="conexion-priority-card__value-inline">{{ getConexionCardData(survey).proyecto }}</span>
            </div>
            <div class="conexion-priority-card__person-line">
              <span class="conexion-priority-card__label-inline">Técnico</span>
              <span class="conexion-priority-card__value-inline">{{ getConexionCardData(survey).nombreTecnico }}</span>
            </div>
            <div class="conexion-priority-card__person-line">
              <span class="conexion-priority-card__label-inline">Sup. Metrogas</span>
              <span class="conexion-priority-card__value-inline">{{ getConexionCardData(survey).supMetrogas }}</span>
            </div>
          </div>
        </div>

        <div
          v-else-if="esVistaReclamos"
          class="reclamo-priority-card"
          @click="goToInspeccion(survey, notifPrimaryId(survey.id_survey))"
        >
          <div class="reclamo-priority-card__top">
            <div class="reclamo-priority-card__meta-pill">
              IC {{ getConexionCardData(survey).ic }}
            </div>
            <div class="reclamo-priority-card__meta-pill">
              NR {{ getReclamoCardData(survey).numeroReclamo }}
            </div>
            <div class="reclamo-priority-card__meta-pill">
              {{ getReclamoCardData(survey).orden }}
            </div>
          </div>

          <div class="reclamo-priority-card__address">
            {{ getReclamoCardData(survey).direccionComuna }}
          </div>

          <div class="reclamo-priority-card__people">
            <div class="reclamo-priority-card__person-line">
              <span class="reclamo-priority-card__label-inline">Técnico</span>
              <span class="reclamo-priority-card__value-inline">{{ getConexionCardData(survey).nombreTecnico }}</span>
            </div>
            <div class="reclamo-priority-card__person-line">
              <span class="reclamo-priority-card__label-inline">Sup. Terracon</span>
              <span class="reclamo-priority-card__value-inline">{{ getReclamoCardData(survey).supTerracon }}</span>
            </div>
            <div class="reclamo-priority-card__person-line">
              <span class="reclamo-priority-card__label-inline">Estado</span>
              <span class="reclamo-priority-card__value-inline">{{ getReclamoCardData(survey).estado }}</span>
            </div>
            <div class="reclamo-priority-card__person-line">
              <span class="reclamo-priority-card__label-inline">Obs. Terracon</span>
              <span class="reclamo-priority-card__value-inline reclamo-priority-card__value-inline--multiline">{{ getReclamoCardData(survey).observacionTerracon }}</span>
            </div>
            <div class="reclamo-priority-card__person-line">
              <span class="reclamo-priority-card__label-inline">Contenido Reclamo</span>
              <span class="reclamo-priority-card__value-inline reclamo-priority-card__value-inline--multiline">{{ getReclamoCardData(survey).contenidoReclamo }}</span>
            </div>
          </div>
        </div>

        <v-card
          v-else
          @click="goToInspeccion(survey, notifPrimaryId(survey.id_survey))"
          class="mx-auto sombra-resaltada"
          :class="{ 'conexion-card': isConexionSurvey(survey) }"
          :subtitle="`${survey.name_empresa_cliente} / ${survey.nombre_proyecto}`"
          :title="`${survey.desc_template_srv }: ${survey.name_template_srv}`"
        >
          <template #append>
            <v-icon
              v-if="hasNotif(survey.id_survey)"
              color="red-darken-2"
              icon="mdi-bell-ring"
              size="22"
            />
          </template>

          <v-chip
            v-if="!isConexionSurvey(survey)"
            :color="getEstadoColor(survey.estado_srv).color"
            label
            size="large"
            class="ml-2 text-white"
            variant="flat"
          >
            {{ getEstadoColor(survey.estado_srv).texto }}
          </v-chip>

          <v-card-text v-if="isConexionSurvey(survey)" class="conexion-card__body">
            <div class="conexion-card__panel">
              <div class="conexion-card__grid">
                <div
                  v-for="field in getConexionCardFields(survey)"
                  :key="`${survey.id_survey}-${field.label}`"
                  class="conexion-card__field"
                  :class="{ 'conexion-card__field--full': field.full }"
                >
                  <div class="conexion-card__label">{{ field.label }}</div>
                  <div class="conexion-card__value" :class="{ 'conexion-card__value--inline': field.metaTag }">
                    <span>{{ field.value }}</span>
                    <span v-if="field.metaTag" class="conexion-card__mini-tag">{{ field.metaTag }}</span>
                  </div>
                </div>
              </div>
            </div>
          </v-card-text>

          <v-card-text v-else>
            {{ `${survey.codi_template_srv} (Id ${survey.id_survey})` }}<br>
            Fecha Planificada de Ejecución: {{ survey.fecha_plan_ini }}<br>
            Estado: {{ survey.estado_srv }}
          </v-card-text>
        </v-card>
      </v-col>

    </v-row>
  </v-container>
</template>

<script setup>
import { onMounted, ref, reactive, computed, watch } from 'vue'
import apiAxios from '@/services/api'
import { useRouter, useRoute } from 'vue-router'
import { useUserDetailStore } from '@/store/userDetail'
import { useNetworkStatus } from '@/composables/useNetworkStatus'

/* eslint-disable */

const router = useRouter()
const route = useRoute()
const userDetailStore = useUserDetailStore()
const { isOnline } = useNetworkStatus()

// id_user seguro (no rompe si userDetail es null)
const idUser = computed(() => userDetailStore.userDetail?.id_user ?? null)

// --- MÓDULO DE VIAJE CONVOY / CHOFER PWA ---
const viajeActivo = ref(null)
const cargandoViajeActivo = ref(false)

const consultarViajeActivo = async () => {
  const uid = idUser.value || JSON.parse(localStorage.getItem('perfil') || '{}')?.id_user
  if (!uid) return
  try {
    cargandoViajeActivo.value = true
    const { data } = await apiAxios.get('/viajes/usuario/activo', { params: { id_user: uid } })
    if (data?.activo && data?.data) {
      viajeActivo.value = data.data
    } else {
      viajeActivo.value = null
    }
  } catch (err) {
    console.warn('No se pudo consultar viaje activo:', err)
  } finally {
    cargandoViajeActivo.value = false
  }
}

const abrirViajeNativo = (token) => {
  if (!token) return
  const baseOrigin = window.location.origin
  window.location.href = `${baseOrigin}/viaje/${token}`
}

const filtros = ref([
  { ID: 1, NOMBRE: 'Creado' },
  { ID: 2, NOMBRE: 'Ejecución' },
  { ID: 4, NOMBRE: 'VERIFICACION' },
  { ID: 5, NOMBRE: 'APROBADO' }
])

const verTerminados = ref(false)

const filtro = ref(null)
const filtroTexto = ref('')
const surveys = ref([])
const surveysRawById = ref({})
const filtroDim = ref(null)
const filtroDimension = ref([])
const dialogRegistrarProtocolo = ref(false)
const loadingCatalogoProtocolo = ref(false)
const loadingProyectosCatalogo = ref(false)
const creandoProtocolo = ref(false)
const errorCrearProtocolo = ref('')
const templatesCatalogo = ref([])
const metaByTemplateMap = ref(new Map())
const templatesEnriquecidos = computed(() => {
  const selectedClient = Number(formProtocolo.id_empresa_cliente);
  const targetClient = (selectedClient === 7 || selectedClient === 8) ? 3 : selectedClient;

  const filtrados = (templatesCatalogo.value || []).filter(t =>
    Number(t?.id_template) > 0 &&
    metaByTemplateMap.value.has(Number(t.id_template)) &&
    cumpleFiltroTemplate(t) &&
    t.flag_autonomo === true &&
    (!selectedClient || Number(t.id_empresa_cliente) === targetClient)
  )

  return filtrados.map(t => {
    const meta = metaByTemplateMap.value.get(Number(t.id_template))
    return {
      ...t,
      id_area: meta.id_area,
      name_area: meta.name_area,
      name_tipo_srv: meta.name_tipo_srv
    }
  })
})
const clientesCatalogo = ref([])
const proyectosCatalogo = ref([])
const usuariosCatalogo = ref([])
const rolesCatalogo = ref([])
const usuariosRolesCatalogo = ref([])
const rolesSesionReady = ref(false)
const flujoPlantillaSteps = ref([])
const loadingFlujoPlantilla = ref(false)
const surveyCreadoProtocoloId = ref(null)
const formProtocolo = reactive({
  area: null,
  familia: null,
  id_template: null,
  id_empresa_cliente: null,
  id_proyecto: null
})
const notificaciones = ref([])
const bodyExecDetalleBySurvey = ref({})
const surveyDetailRawById = ref({})
const surveyVinculoBySurvey = ref({})
const parentDetailByChildSurvey = ref({})
const nombresUsuariosById = ref({})
const navigatingToInspeccion = ref(false)
const lastGoToInspeccionAt = ref(0)
const expandedConexionRows = ref(new Set())

const isExternalCompany = computed(() => (
  userDetailStore.userDetail?.isExternalCompany === true ||
  localStorage.getItem('isExternalCompany') === 'true'
))

function parseLocalRolesNames() {
  const raw = localStorage.getItem('rolesNames')
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.map(r => (typeof r === 'string' ? r : r?.name_rol)).filter(Boolean)
    }
  } catch {}
  return String(raw)
    .split(',')
    .map(x => x.trim())
    .filter(Boolean)
}

const hasCnxRole = computed(() => {
  const uid = Number(userDetailStore.userDetail?.id_user || 0)
  const fromUserDetail = Array.isArray(userDetailStore.userDetail?.usuarioRoles)
    ? userDetailStore.userDetail.usuarioRoles.filter(r => {
      if (typeof r !== 'object' || !r) return true
      const ridUser = Number(r?.id_user || 0)
      return !ridUser || !uid || ridUser === uid
    })
    : []

  const roleNameById = new Map(
    (rolesCatalogo.value || [])
      .map(r => [Number(r?.id_rol), String(r?.name_rol || '').trim()])
      .filter(([id, name]) => id > 0 && !!name)
  )

  const fromCatalogo = (usuariosRolesCatalogo.value || [])
    .filter(ur => Number(ur?.id_user || 0) === uid)
    .map(ur => roleNameById.get(Number(ur?.id_rol || 0)))
    .filter(Boolean)

  const roleNames = [
    ...fromUserDetail.map(r => (typeof r === 'string' ? r : r?.name_rol)).filter(Boolean),
    ...fromCatalogo,
    ...parseLocalRolesNames()
  ]

  return roleNames.some(name => {
    const normalized = String(name || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toUpperCase()
    return normalized.startsWith('CNX') || normalized.includes('CONEXION')
  })
})

const userRoleNames = computed(() => {
  const uid = Number(idUser.value || 0)
  if (!uid) return []

  const fromUserDetail = Array.isArray(userDetailStore.userDetail?.usuarioRoles)
    ? userDetailStore.userDetail.usuarioRoles.filter(r => {
      if (typeof r !== 'object' || !r) return true
      const ridUser = Number(r?.id_user || 0)
      return !ridUser || ridUser === uid
    })
    : []

  const roleNameById = new Map(
    (rolesCatalogo.value || [])
      .map(r => [Number(r?.id_rol), String(r?.name_rol || '').trim()])
      .filter(([id, name]) => id > 0 && !!name)
  )

  const fromCatalogo = (usuariosRolesCatalogo.value || [])
    .filter(ur => Number(ur?.id_user || 0) === uid)
    .map(ur => roleNameById.get(Number(ur?.id_rol || 0)))
    .filter(Boolean)

  const names = [
    ...fromUserDetail.map(r => (typeof r === 'string' ? r : r?.name_rol)).filter(Boolean),
    ...fromCatalogo,
    ...parseLocalRolesNames()
  ]

  return [...new Set(names.map(n => String(n || '').trim().toUpperCase()))]
})

const clientesFiltrados = computed(() => {
  const rawList = clientesCatalogo.value || []
  const list = rawList.filter(c => {
    const id = Number(c.id_empresa);
    return id !== 4; // Excluir Pelambres (4) de SST
  })
  const roles = userRoleNames.value || []

  // Si es Administrador, no se restringe por contrato (comparación insensible a mayúsculas)
  if (roles.some(r => String(r).toUpperCase().includes('ADMIN'))) {
    return list
  }

  if (roles.some(r => r.startsWith('CDLC_DMH'))) {
    return list.filter(c => Number(c.id_empresa) === 3) // Codelco Ministro Hales
  }
  if (roles.some(r => r.startsWith('CDLC_DCH'))) {
    return list.filter(c => Number(c.id_empresa) === 6) // Codelco Chuquicamata
  }
  if (roles.some(r => r.startsWith('CDLC_SPOT'))) {
    return list.filter(c => [3, 6, 9].includes(Number(c.id_empresa))) // Ministro Hales, Chuquicamata, Distrito Norte
  }
  if (roles.some(r => r.startsWith('AMSA_MLP'))) {
    return list.filter(c => Number(c.id_empresa) === 4) // Minera Los Pelambres
  }
  if (roles.some(r => r.startsWith('TMAC_CALM') || r.startsWith('TMAC_LAND'))) {
    return list.filter(c => Number(c.id_empresa) === 1) // Transmac Ltda
  }
  return list
})

const proyectosFiltrados = computed(() => {
  const list = proyectosCatalogo.value || []
  const roles = userRoleNames.value || []

  // Si es Administrador, no se restringe por contrato (comparación insensible a mayúsculas)
  if (roles.some(r => String(r).toUpperCase().includes('ADMIN'))) {
    return list
  }

  if (roles.some(r => r.startsWith('CDLC_DMH'))) {
    return list.filter(p => [2, 4, 10].includes(Number(p.id_proyecto))) // Ministro Hales Mina, Spot, Planta
  }
  if (roles.some(r => r.startsWith('CDLC_DCH'))) {
    return list.filter(p => [1, 11].includes(Number(p.id_proyecto))) // Chuquicamata
  }
  if (roles.some(r => r.startsWith('CDLC_SPOT'))) {
    return list.filter(p => [4, 11].includes(Number(p.id_proyecto))) // Spot Ministro Hales, Spot Chuquicamata
  }
  if (roles.some(r => r.startsWith('AMSA_MLP'))) {
    return list.filter(p => Number(p.id_proyecto) === 3) // Minera Los Pelambres
  }
  if (roles.some(r => r.startsWith('TMAC_CALM'))) {
    return list.filter(p => Number(p.id_proyecto) === 7) // Suc. Calama
  }
  if (roles.some(r => r.startsWith('TMAC_LAND'))) {
    return list.filter(p => Number(p.id_proyecto) === 8) // Suc. Los Andes
  }
  return list
})

watch(clientesFiltrados, (newList) => {
  if (newList.length === 1 && formProtocolo.id_empresa_cliente !== newList[0].id_empresa) {
    formProtocolo.id_empresa_cliente = newList[0].id_empresa
  }
}, { immediate: true })

watch(proyectosFiltrados, (newList) => {
  if (newList.length === 1 && formProtocolo.id_proyecto !== newList[0].id_proyecto) {
    formProtocolo.id_proyecto = newList[0].id_proyecto
  }
}, { immediate: true })

watch(verTerminados, () => {
  getSurvey()
})

async function cargarRolesSesion() {
  try {
    const [{ data: rolesData }, { data: usuariosRolesData }] = await Promise.all([
      apiAxios.get('/servicio/leanglobal/obtenerRoles'),
      apiAxios.get('/servicio/leanglobal/obtenerUsuariosRoles')
    ])
    rolesCatalogo.value = Array.isArray(rolesData) ? rolesData : []
    usuariosRolesCatalogo.value = Array.isArray(usuariosRolesData) ? usuariosRolesData : []
  } catch (error) {
    console.error('[Survey] Error cargando roles de sesión:', error)
  } finally {
    rolesSesionReady.value = true
  }
}

const templateFilterMode = computed(() => {
  const fromMeta = route.meta?.templateFilter
  if (fromMeta === 'only153' || fromMeta === 'exclude153') return fromMeta
  return route.path === '/reclamos' ? 'only153' : 'exclude153'
})
const esVistaReclamos = computed(() => templateFilterMode.value === 'only153')
const esVistaAsignacionesCnx = computed(() => {
  const fromMeta = String(route.meta?.viewMode || '').trim().toLowerCase()
  return fromMeta === 'asignaciones-cnx' || route.path === '/asignaciones'
})
const tituloAsignacionDia = computed(() => {
  const d = new Date()
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}-${mm}-${yyyy}`
})

const areasOptions = computed(() => {
  const uniques = new Map()
  for (const t of templatesEnriquecidos.value) {
    const key = String(t?.name_area || '').trim()
    if (!key || uniques.has(key)) continue
    // Excluir "Administración" (sin importar tildes o mayúsculas/minúsculas)
    const upperKey = key.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    if (upperKey.includes('ADMINISTRACION')) continue
    uniques.set(key, { name_area: key })
  }
  return [...uniques.values()].sort((a, b) => a.name_area.localeCompare(b.name_area, 'es', { sensitivity: 'base' }))
})

const familiasOptions = computed(() => {
  if (!formProtocolo.area) return []
  const uniques = new Map()
  for (const t of templatesEnriquecidos.value) {
    if (String(t?.name_area || '') !== String(formProtocolo.area)) continue
    const key = String(t?.name_tipo_srv || '').trim()
    if (!key || uniques.has(key)) continue
    uniques.set(key, { familia: key })
  }
  return [...uniques.values()].sort((a, b) => a.familia.localeCompare(b.familia, 'es', { sensitivity: 'base' }))
})

const protocolosOptions = computed(() => {
  if (!formProtocolo.area || !formProtocolo.familia) return []
  return (templatesEnriquecidos.value || [])
    .filter(t =>
      String(t?.name_area || '') === String(formProtocolo.area) &&
      String(t?.name_tipo_srv || '') === String(formProtocolo.familia)
    )
    .map(t => ({
      ...t,
      display_name: `[${t.codi_template_srv}] / ${t.name_template_srv}`
    }))
    .sort((a, b) => String(a?.codi_template_srv || '').localeCompare(String(b?.codi_template_srv || ''), 'es', { sensitivity: 'base' }))
})

const rolNameToId = computed(() => {
  const m = Object.create(null)
  for (const r of rolesCatalogo.value) m[r.name_rol] = Number(r.id_rol)
  return m
})

const usersByRolId = computed(() => {
  const m = new Map()
  for (const ur of usuariosRolesCatalogo.value) {
    const rid = Number(ur.id_rol)
    const uid = Number(ur.id_user)
    if (!rid || !uid) continue
    if (!m.has(rid)) m.set(rid, new Set())
    m.get(rid).add(uid)
  }
  return m
})

const usuariosCatalogoOrdenados = computed(() =>
  [...(usuariosCatalogo.value || [])]
    .filter(u => String(u?.nombre_user || '').trim().length > 0)
    .sort((a, b) =>
      String(a?.nombre_user || '').localeCompare(String(b?.nombre_user || ''), 'es', { sensitivity: 'base' })
    )
)

const flujoSeleccionCompleto = computed(() =>
  (flujoPlantillaSteps.value || []).every(s => !!Number(s?.id_user))
)

const formularioProtocoloBasicoValido = computed(() =>
  !!idUser.value &&
  !!formProtocolo.area &&
  !!formProtocolo.familia &&
  !!formProtocolo.id_template &&
  !!Number(formProtocolo.id_empresa_cliente) &&
  !!Number(formProtocolo.id_proyecto)
)

const formularioProtocoloValido = computed(() =>
  formularioProtocoloBasicoValido.value &&
  !!surveyCreadoProtocoloId.value &&
  flujoSeleccionCompleto.value
)

function cumpleFiltroTemplate (survey) {
  const tid = Number(survey?.id_template)
  if (templateFilterMode.value === 'only153') return tid === 153
  if (templateFilterMode.value === 'exclude153') return tid !== 153
  return true
}

// 🔹 Configuración IndexedDB para snapshot de surveys
const DB_NAME = 'TransmacSST'
const DB_VERSION = 1
const STORE_SURVEYS = 'SurveysSnapshot'

function openDb () {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = event.target.result

      // Creamos el store solo si no existe
      if (!db.objectStoreNames.contains(STORE_SURVEYS)) {
        // Usamos key fija 'snapshot' para guardar el último resultado,
        // más idUser para evitar mezclar usuarios
        db.createObjectStore(STORE_SURVEYS, { keyPath: 'id' })
      }
    }

    request.onsuccess = (event) => {
      resolve(event.target.result)
    }

    request.onerror = (event) => {
      console.error('[Survey][IndexedDB] Error al abrir DB:', event.target.error)
      reject(event.target.error)
    }
  })
}

async function guardarSurveysOffline (listaSurveys) {
  try {
    const db = await openDb()
    const tx = db.transaction(STORE_SURVEYS, 'readwrite')
    const store = tx.objectStore(STORE_SURVEYS)

    const payload = {
      id: 'snapshot',                    // clave única
      idUser: idUser.value,              // usuario dueño del snapshot
      surveys: listaSurveys || [],
      updatedAt: new Date().toISOString()
    }

    store.put(payload)

    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = (e) => reject(e.target.error)
      tx.onabort  = (e) => reject(e.target.error)
    })

    console.log('[Survey] Snapshot de surveys guardado en IndexedDB')
  } catch (err) {
    console.error('[Survey] Error guardando snapshot en IndexedDB:', err)
  }
}

async function cargarSurveysOffline () {
  try {
    const db = await openDb()
    const tx = db.transaction(STORE_SURVEYS, 'readonly')
    const store = tx.objectStore(STORE_SURVEYS)

    const data = await new Promise((resolve, reject) => {
      const req = store.get('snapshot')
      req.onsuccess = () => resolve(req.result || null)
      req.onerror = (e) => reject(e.target.error)
    })

    if (!data) {
      console.log('[Survey] No hay snapshot de surveys en IndexedDB')
      return null
    }

    console.log('[Survey] Snapshot de surveys cargado desde IndexedDB:', data)
    return data
  } catch (err) {
    console.error('[Survey] Error leyendo snapshot de IndexedDB:', err)
    return null
  }
}

onMounted(async () => {
  console.log('BASE URL PWA:', apiAxios.defaults.baseURL)

  console.log('userDetailStore.userDetail en Survey:', userDetailStore.userDetail)
  console.log('idUser en Survey:', idUser.value)

  await cargarRolesSesion()
  if (esVistaAsignacionesCnx.value && !hasCnxRole.value) {
    await router.replace({ path: '/surveys' })
    return
  }
  await cargarNombresUsuarios()
  await getSurvey()
  await cargarNotificaciones()
  await consultarViajeActivo()
})

watch(() => route.path, async () => {
  if (esVistaAsignacionesCnx.value && !hasCnxRole.value) {
    await router.replace({ path: '/surveys' })
    return
  }
  await getSurvey()
  await consultarViajeActivo()
})

watch(() => idUser.value, async (newVal) => {
  if (newVal) {
    await consultarViajeActivo()
  }
})

watch(() => formProtocolo.id_empresa_cliente, async (idEmpresa) => {
  formProtocolo.id_proyecto = null
  formProtocolo.area = null
  formProtocolo.familia = null
  formProtocolo.id_template = null
  surveyCreadoProtocoloId.value = null
  flujoPlantillaSteps.value = []
  if (!idEmpresa) {
    proyectosCatalogo.value = []
    return
  }
  await cargarProyectosPorCliente(idEmpresa)
})

watch(() => formProtocolo.id_proyecto, () => {
  formProtocolo.area = null
  formProtocolo.familia = null
  formProtocolo.id_template = null
  surveyCreadoProtocoloId.value = null
  flujoPlantillaSteps.value = []
})

watch(() => formProtocolo.area, () => {
  formProtocolo.familia = null
  formProtocolo.id_template = null
  surveyCreadoProtocoloId.value = null
  flujoPlantillaSteps.value = []
})

watch(() => formProtocolo.familia, () => {
  formProtocolo.id_template = null
  surveyCreadoProtocoloId.value = null
  flujoPlantillaSteps.value = []
})

watch(() => formProtocolo.id_template, async (idTemplate) => {
  surveyCreadoProtocoloId.value = null
  await cargarFlujoPlantillaPorTemplate(idTemplate)
})

function usuariosPorRol(rolName) {
  if (!rolName) return usuariosCatalogoOrdenados.value
  if (String(rolName).trim().toUpperCase() === 'FES_DIRECTA') return usuariosCatalogoOrdenados.value
  const rolId = rolNameToId.value[rolName]
  if (!rolId) return usuariosCatalogoOrdenados.value
  const ids = usersByRolId.value.get(Number(rolId))
  if (!ids) return []
  return usuariosCatalogoOrdenados.value.filter(u => ids.has(Number(u.id_user)))
}

async function goToInspeccion(survey, tieneNotif) {
  const id = Number(survey?.id_survey || 0)
  if (!id) return
  const now = Date.now()
  if (navigatingToInspeccion.value) return
  if (now - lastGoToInspeccionAt.value < 700) return
  navigatingToInspeccion.value = true
  lastGoToInspeccionAt.value = now

  console.log('Ir a inspeccion', id, tieneNotif)

  try {
    if (tieneNotif && isOnline.value) {
      try {
        const response = await apiAxios.put(
          '/notfqueue/updNotfqueue',
          {
            id_notifcation: tieneNotif,
            estado: 'DONE'
          }
        )
        console.log('Notificacion actualizada:', response.data)
      } catch (error) {
        console.error('Error al actualizar la notificacion:', error)
      }
    } else if (!isOnline.value && tieneNotif) {
      console.log('Offline: notificacion no actualizada.')
    }

    try {
      const data = getConexionCardData(survey)
      const payload = {
        id_survey: id,
        fecha: data?.fechaFila || '',
        sup_metrogas: data?.supMetrogas || '',
        sup_terracon: data?.supTerracon || '',
        tipo: data?.tipoTrabajo || '',
        orden: data?.orden || '',
        direccion: data?.direccionComuna || data?.direccion || '',
        ic: data?.ic || ''
      }
      sessionStorage.setItem(`cnx_header_${id}`, JSON.stringify(payload))

      if (isConexionSurvey(survey)) {
        const hijos = getChildRowsForParent(id)
          .map(h => Number(h?.id_survey || 0))
          .filter(cid => cid > 0)
          .sort((a, b) => b - a)
        if (hijos.length) {
          sessionStorage.setItem(`cnx_child_${id}`, String(hijos[0]))
        }
      }
    } catch {}

    await router.push({
      path: '/inspeccion',
      query: { idInspeccion: String(id) }
    })
  } finally {
    setTimeout(() => {
      navigatingToInspeccion.value = false
    }, 400)
  }
}

async function getSurvey() {
  // Si por alguna razón no tenemos idUser, no seguimos
  if (!idUser.value) {
    console.warn('[Survey] No hay id_user disponible.')
    return
  }

  let name_area = ''

  try {
    // Cargar los pasos de flujo para ver si el superior logueado tiene firmas/cierres pendientes en alguna encuesta en VERIFICACION
    const surveysConPasoPendiente = new Set()
    try {
      const { data: steps } = await apiAxios.get('/servicio/leanglobal/flujosAprobacionSteps')
      if (Array.isArray(steps)) {
        steps.forEach(s => {
          if (Number(s.id_user_flujo) === Number(idUser.value) && String(s.estado_stp).trim().toUpperCase() === 'PENDIENTE') {
            surveysConPasoPendiente.add(Number(s.id_survey))
          }
        })
      }
    } catch (e) {
      console.warn('[Surveys] Error al obtener pasos de flujo pendientes:', e)
    }

    // Lógica declarativa resiliente para SST en VERIFICACION (Paso 2 superior)
    try {
      const { data: respFlujos } = await apiAxios.get('/servicio/leanglobal/flujosAprobacion')
      const flujosSST = (respFlujos?.datos || []).filter(f => 
        String(f.estado_srv).trim().toUpperCase() === 'VERIFICACION' &&
        (/conductual|seguridad|sst|obs-|ins-/i.test(f.codi_template_srv || f.name_template_srv || ''))
      )
      
      if (flujosSST.length > 0) {
        await Promise.all(
          flujosSST.map(async (flujo) => {
            try {
              const { data: detail } = await apiAxios.get(
                `/servicio/leanglobal/procesosSurveyDetail?id_survey=${flujo.id_survey}`
              )
              const s = detail?.[0]
              if (s) {
                const bodyExec = typeof s.body_exec === 'string' ? JSON.parse(s.body_exec) : (s.body_exec || {})
                const segmentos = Array.isArray(bodyExec.segmentos) ? bodyExec.segmentos : []
                
                let superiorId = null
                for (const seg of segmentos) {
                  const attrs = Array.isArray(seg.attributes) ? seg.attributes : []
                  for (const a of attrs) {
                    if (a.type === 'checkListObservacionConductual') {
                      superiorId = a.datos?.superiorDerivado
                    } else if (a.type === 'condicionesSeguridadTrabajo') {
                      superiorId = a.superiorDerivado
                    }
                    if (superiorId) break
                  }
                  if (superiorId) break
                }

                if (superiorId && Number(superiorId) === Number(idUser.value)) {
                  console.log(`[Surveys Resiliencia] Agregando survey ${flujo.id_survey} a pendientes de superior`)
                  surveysConPasoPendiente.add(Number(flujo.id_survey))
                }
              }
            } catch (errDet) {
              console.warn(`Error al cargar detalle de resiliencia para survey ${flujo.id_survey}:`, errDet)
            }
          })
        )
      }
    } catch (errFlujos) {
      console.warn('[Surveys] Error en consulta declarativa de flujos:', errFlujos)
    }

    // 👇 Online (o con SW dando respuesta de red/cache)
    let { data } = await apiAxios.get(
      '/servicio/leanglobal/procesosSurveyV3'
    )

    data = Array.isArray(data?.datos) ? data.datos : []

    // 1) Guardar snapshot RAW por id (sin filtro por usuario) para poder resolver datos de padre/hijo en conexión.
    const rawById = {}
    ;(data ?? []).forEach((row) => {
      const id = Number(row?.id_survey || 0)
      if (id > 0) rawById[id] = row
    })
    surveysRawById.value = rawById

    // 2) Filtra
    const filtrados = (data ?? []).filter(
      it => {
        const idSrv = Number(it.id_survey)
        const esMiPasoPendiente = surveysConPasoPendiente.has(idSrv)
        
        // Si está en VERIFICACION para template 70 o 80, SOLO lo ve el superior que tiene el paso pendiente
        const idTemplate = Number(it.id_template)
        const esVerificacionDerivada = String(it.estado_srv).trim().toUpperCase() === 'VERIFICACION' && [70, 80].includes(idTemplate)
        
        const coincideUsuario = esVistaReclamos.value || 
          (esVerificacionDerivada ? esMiPasoPendiente : (Number(it.id_user) === Number(idUser.value) || esMiPasoPendiente))

        // Ocultar si está APROBADO o TERMINADO, a menos que verTerminados sea true
        const esTerminada = it.estado_srv === 'APROBADO' || it.estado_srv === 'TERMINADO' || it.estado_srv === 'Terminado'
        const coincideEstado = verTerminados.value || !esTerminada || (it.estado_srv === 'VERIFICACION' && esMiPasoPendiente)

        return it.estado_srv !== 'Pre Creado' &&
          coincideEstado &&
          coincideUsuario &&
          it.desc_template_srv !== 'PPD' &&
          cumpleFiltroTemplate(it)
      }
    )

    console.log('Surveys filtrados:', filtrados)

    // 3) Ordena desc por id_survey (robusto si viene como string)
    const toNum = v => (typeof v === 'number' ? v : parseInt(String(v), 10) || 0)
    surveys.value = filtrados.sort((a, b) => toNum(b.id_survey) - toNum(a.id_survey))

    // 4) Filtro de áreas (opcional, igual que antes)
    const uniqueAreas = [...new Set(surveys.value.map(it => it.name_area))]
    filtroDimension.value = uniqueAreas.map((area, i) => ({ ID: i + 1, NOMBRE: area }))
    await cargarDetalleConexiones(surveys.value)
    await cargarDetalleReclamos(surveys.value)
    await logSurveysFiltradosConDetalleReclamo(surveys.value)

    // 🔹 Guardar snapshot para offline
    await guardarSurveysOffline(surveys.value)
  } catch (error) {
    console.error('Error al obtener survey:', error)

    // 🔹 Si falla (por ejemplo sin red), intentar cargar desde IndexedDB
    const snapshot = await cargarSurveysOffline()
    if (snapshot && snapshot.idUser === idUser.value) {
      console.log('[Survey] Usando snapshot local de surveys para idUser:', idUser.value)
      surveys.value = snapshot.surveys || []
      const rawById = {}
      ;(snapshot.surveys || []).forEach((row) => {
        const id = Number(row?.id_survey || 0)
        if (id > 0) rawById[id] = row
      })
      surveysRawById.value = rawById

      const uniqueAreas = [...new Set(surveys.value.map(it => it.name_area))]
      filtroDimension.value = uniqueAreas.map((area, i) => ({ ID: i + 1, NOMBRE: area }))
      await cargarDetalleConexiones(surveys.value)
      await cargarDetalleReclamos(surveys.value)
      await logSurveysFiltradosConDetalleReclamo(surveys.value)
    } else {
      console.warn('[Survey] No hay datos locales para este usuario.')
    }
  }
}

function safeParseJson(value, fallback) {
  try {
    if (value === null || value === undefined) return fallback
    if (typeof value === 'string') return JSON.parse(value)
    if (typeof value === 'object') return value
    return fallback
  } catch {
    return fallback
  }
}

function fechaActualYMD() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function resetFormProtocolo() {
  formProtocolo.area = null
  formProtocolo.familia = null
  formProtocolo.id_template = null
  formProtocolo.id_empresa_cliente = null
  formProtocolo.id_proyecto = null
  proyectosCatalogo.value = []
  flujoPlantillaSteps.value = []
  surveyCreadoProtocoloId.value = null
}

async function cargarCatalogosModalProtocolo() {
  loadingCatalogoProtocolo.value = true
  errorCrearProtocolo.value = ''

  try {
    const [{ data: tplData }, { data: areasAutonomosData }, { data: empresasData }, { data: usuariosData }, { data: rolesData }, { data: usuariosRolesData }] = await Promise.all([
      apiAxios.get('/servicio/leanglobal/obtenerTemplates'),
      apiAxios.get('/servicio/leanglobal/obtenerAreasAutonomos'),
      apiAxios.get('/servicio/leanglobal/obtenerEmpresas'),
      apiAxios.get('/servicio/leanglobal/obtenerUsuarios'),
      apiAxios.get('/servicio/leanglobal/obtenerRoles'),
      apiAxios.get('/servicio/leanglobal/obtenerUsuariosRoles')
    ])

    templatesCatalogo.value = Array.isArray(tplData) ? tplData : []
    usuariosCatalogo.value = (Array.isArray(usuariosData) ? usuariosData : [])
      .filter(u => String(u?.nombre_user || '').trim().length > 0)
    rolesCatalogo.value = Array.isArray(rolesData) ? rolesData : []
    usuariosRolesCatalogo.value = Array.isArray(usuariosRolesData) ? usuariosRolesData : []
    clientesCatalogo.value = (Array.isArray(empresasData) ? empresasData : [])
      .filter(e => {
        const isExterno = e.flag_externo === true || e.flag_externo === 1 || e.flag_externo === '1' || e.flag_externo === 't' || e.flag_externo === 'true';
        if (isExterno) return false;
        const isInactivo = e.flag_activo === false || e.flag_activo === 'f' || e.flag_activo === 'false';
        if (isInactivo) return false;
        return true;
      })
      .sort((a, b) => String(a?.name_empresa || '').localeCompare(String(b?.name_empresa || ''), 'es', { sensitivity: 'base' }))

    const surveyRows = Array.isArray(areasAutonomosData) ? areasAutonomosData : []
    const metaByTemplate = new Map()
    for (const row of surveyRows) {
      const idTpl = Number(row?.id_template)
      if (!idTpl || metaByTemplate.has(idTpl)) continue
      const idArea = Number(row?.id_area)
      const nameArea = String(row?.name_area || '').trim()
      const nameTipo = String(row?.name_tipo_srv || '').trim()
      if (!nameArea || !nameTipo) continue
      metaByTemplate.set(idTpl, {
        id_area: idArea,
        name_area: nameArea,
        name_tipo_srv: nameTipo
      })
    }

    metaByTemplateMap.value = metaByTemplate
  } catch (error) {
    console.error('[Survey] Error cargando catálogo de protocolo:', error)
    errorCrearProtocolo.value = 'No se pudo cargar el catálogo de protocolos.'
  } finally {
    loadingCatalogoProtocolo.value = false
  }
}

async function cargarFlujoPlantillaPorTemplate(idTemplate) {
  flujoPlantillaSteps.value = []
  if (!idTemplate) return
}

async function cargarProyectosPorCliente(idEmpresa) {
  loadingProyectosCatalogo.value = true
  try {
    const { data } = await apiAxios.get(`/servicio/leanglobal/obtenerProyectos?id_empresa_cliente=${idEmpresa}`)
    proyectosCatalogo.value = (Array.isArray(data) ? data : [])
      .filter(p => Number(p.id_proyecto) !== 6)
      .sort((a, b) => String(a?.nombre_proyecto || '').localeCompare(String(b?.nombre_proyecto || ''), 'es', { sensitivity: 'base' }))
  } catch (error) {
    console.error('[Survey] Error cargando proyectos:', error)
    proyectosCatalogo.value = []
  } finally {
    loadingProyectosCatalogo.value = false
  }
}

async function abrirModalRegistrarProtocolo() {
  dialogRegistrarProtocolo.value = true
  errorCrearProtocolo.value = ''
  resetFormProtocolo()
  await cargarCatalogosModalProtocolo()
}

async function crearSurveyBaseDesdeModal() {
  const tpl = templatesCatalogo.value.find(t => Number(t.id_template) === Number(formProtocolo.id_template))
  if (!tpl) throw new Error('No se encontró el protocolo seleccionado.')

  const headerSeed = safeParseJson(tpl.header_seed, {})
  const bodySeed = safeParseJson(tpl.body_seed, { segmentos: [] })
  const approvalSeed = safeParseJson(tpl.approval_seed, {})
  const fechaActual = fechaActualYMD()

  const payload = {
    id_tipo_srv: Number(tpl.id_tipo_srv),
    id_template: Number(tpl.id_template),
    id_survey_padre: null,
    id_user: Number(idUser.value),
    id_user_creacion: Number(idUser.value),
    id_empresa_cliente: Number(formProtocolo.id_empresa_cliente),
    estado_srv: 'Pre Creado',
    header_seed: JSON.stringify(headerSeed),
    body_seed: JSON.stringify(bodySeed),
    approval_seed: JSON.stringify(approvalSeed),
    header_exec: JSON.stringify(headerSeed),
    body_exec: JSON.stringify(bodySeed),
    approval_exec: JSON.stringify(approvalSeed),
    fecha_plan_ini: fechaActual,
    fecha_plan_fin: fechaActual,
    fecha_real_ini: null,
    fecha_real_fin: null,
    fecha_upload: null,
    latitud: null,
    longitud: null,
    id_proyecto: Number(formProtocolo.id_proyecto) || null,
    id_flow_tmpl: tpl.id_flow_tmpl || null
  }

  const resp = await apiAxios.post('/survey/', payload)
  return Number(resp?.data?.idSurvey || resp?.data?.id_survey || 0) || null
}

async function prepararFlujoModal() {
  if (!formularioProtocoloBasicoValido.value) return
  creandoProtocolo.value = true
  errorCrearProtocolo.value = ''
  try {
    const nuevoSurveyId = await crearSurveyBaseDesdeModal()
    if (!nuevoSurveyId) throw new Error('No se pudo crear el survey base para cargar flujo.')
    surveyCreadoProtocoloId.value = nuevoSurveyId
    await cargarFlujoPorSurvey(nuevoSurveyId)
  } catch (error) {
    console.error('[Survey] Error preparando flujo del modal:', error)
    errorCrearProtocolo.value = error?.response?.data?.message || error?.response?.data?.error || error.message || 'No se pudo preparar el flujo.'
  } finally {
    creandoProtocolo.value = false
  }
}

async function crearSurveyDesdeModal() {
  if (!formularioProtocoloValido.value || !surveyCreadoProtocoloId.value) return
  creandoProtocolo.value = true
  errorCrearProtocolo.value = ''
  try {
    await asignarFlujoSeleccionadoSurvey(Number(surveyCreadoProtocoloId.value))
    dialogRegistrarProtocolo.value = false
    resetFormProtocolo()
    await getSurvey()
  } catch (error) {
    console.error('[Survey] Error guardando asignación de flujo:', error)
    errorCrearProtocolo.value = error?.response?.data?.message || error?.response?.data?.error || error.message || 'No se pudo guardar la asignación del flujo.'
  } finally {
    creandoProtocolo.value = false
  }
}

async function obtenerFlowIdPorSurvey(idSurvey) {
  const { data } = await apiAxios.get('/servicio/leanglobal/flujosAprobacion')
  const rows = Array.isArray(data?.datos) ? data.datos : []
  const row = rows.find(r => Number(r?.id_survey) === Number(idSurvey))
  return Number(row?.id_flow || 0) || null
}

async function obtenerFlowSteps(idFlow) {
  if (!idFlow) return []
  const { data } = await apiAxios.get(`/servicio/leanglobal/flujosAprobacionSteps?id_flow=${idFlow}`)
  return Array.isArray(data) ? data : []
}

async function cargarFlujoPorSurvey(idSurvey) {
  loadingFlujoPlantilla.value = true
  try {
    const idFlow = await obtenerFlowIdPorSurvey(idSurvey)
    const steps = await obtenerFlowSteps(idFlow)
    flujoPlantillaSteps.value = steps
      .filter(s => !s?.flag_equipo)
      .sort((a, b) => Number(a?.flow_tmpl_step_orden || 0) - Number(b?.flow_tmpl_step_orden || 0))
      .map(s => ({
        ...s,
        id_user: null
      }))
  } catch (error) {
    console.error('[Survey] Error cargando flujo por survey:', error)
    flujoPlantillaSteps.value = []
  } finally {
    loadingFlujoPlantilla.value = false
  }
}

async function asignarFlujoSeleccionadoSurvey(idSurvey) {
  try {
    const idFlow = await obtenerFlowIdPorSurvey(idSurvey)
    const steps = await obtenerFlowSteps(idFlow)
    if (!steps.length) return

    const stepByOrdenRol = new Map()
    for (const s of flujoPlantillaSteps.value || []) {
      const key = `${Number(s?.flow_tmpl_step_orden || 0)}|${String(s?.name_rol || '')}`
      stepByOrdenRol.set(key, Number(s?.id_user || 0) || null)
    }

    const reqs = steps
      .filter(s => !s?.flag_equipo && Number(s?.id_flow_stp) > 0)
      .map(s => {
        const key = `${Number(s?.flow_tmpl_step_orden || 0)}|${String(s?.name_rol || '')}`
        const selectedUser = stepByOrdenRol.get(key) || Number(idUser.value) || null
        if (!selectedUser) return null
        return apiAxios.put('/survey/UpdUserFlow', {
          id_flow_stp: Number(s.id_flow_stp),
          id_user_flujo: Number(selectedUser),
          flag_equipo: false
        })
      })
      .filter(Boolean)

    if (reqs.length) await Promise.allSettled(reqs)

    await apiAxios.post('/survey/UpdSurveyEstado', {
      id_survey: Number(idSurvey),
      estado_srv: 'Creado'
    })
  } catch (error) {
    console.error('[Survey] Error asignando flujo seleccionado al crear survey:', error)
  }
}

const filteredSurveys = computed(() => {
  const allSurveys = surveys.value ?? []
  const hayConexionConFechaHoy = esVistaAsignacionesCnx.value
    ? allSurveys
      .filter(isConexionSurvey)
      .some(s => {
        const data = getConexionCardData(s)
        const fechaTablaRaw = String(data?.fechaTablaRaw || '').trim()
        return !!fechaTablaRaw && isFechaConexionHoy(fechaTablaRaw)
      })
    : false

  return allSurveys.filter(s => {
    const coincideEstado = !filtro.value || s.estado_srv === filtro.value.NOMBRE
    const coincideDimension = !filtroDim.value || s.name_area === filtroDim.value.NOMBRE

    const texto = filtroTexto.value?.toLowerCase() ?? ''
    const coincideTexto =
      !texto ||
      s.name_template_srv?.toLowerCase().includes(texto) ||
      s.name_empresa_cliente?.toLowerCase().includes(texto) ||
      s.nombre_proyecto?.toLowerCase().includes(texto) ||
      s.codi_template_srv?.toLowerCase().includes(texto)

    // Regla PWA Conexión (CNX):
    // - si existe al menos una conexión con fecha de hoy: mostrar solo las de hoy (o sin fecha)
    // - si no existe ninguna de hoy: mostrar todas para no dejar la pantalla vacía
    if (esVistaAsignacionesCnx.value) {
      if (!isConexionSurvey(s)) return false
      if (hayConexionConFechaHoy) {
        const data = getConexionCardData(s)
        const fechaTablaRaw = String(data?.fechaTablaRaw || '').trim()
        const mostrarPorFecha = !fechaTablaRaw || isFechaConexionHoy(fechaTablaRaw)
        if (!mostrarPorFecha) return false
      }
    }
    if (esVistaReclamos.value) {
      if (!surveyReclamoAsignadoATecnicoActual(s)) return false
    }

    return coincideEstado && coincideDimension && coincideTexto
  })
})

function getIdentidadesUsuarioSesion() {
  const u = userDetailStore.userDetail || {}
  const nombres = [
    u?.nombre_user,
    [u?.name_frst, u?.name_sec, u?.apellido_pat, u?.apellido_mat].filter(Boolean).join(' '),
    [u?.name_frst, u?.apellido_pat].filter(Boolean).join(' '),
    u?.email,
    u?.codi_user
  ]
    .map(v => String(v || '').trim())
    .filter(Boolean)
    .map(v => normalizarTexto(v))
  return new Set(nombres)
}

function nombreTecnicoEsValido(nombre) {
  const raw = String(nombre || '').trim()
  if (!raw) return false
  const n = normalizarTexto(raw)
  if (!n || n === '-' || n === 'asignado' || n === 'sin asignar') return false
  // Evita tomar nombres basura como ids/archivos UUID.jpg
  if (/^[a-f0-9-]{16,}\.[a-z0-9]{2,5}$/i.test(raw)) return false
  return true
}

function nombresCompatibles(a, b) {
  const na = normalizarTexto(a)
  const nb = normalizarTexto(b)
  if (!na || !nb) return false
  if (na === nb) return true

  const ta = [...new Set(na.split(' ').filter(Boolean))]
  const tb = [...new Set(nb.split(' ').filter(Boolean))]
  const inter = ta.filter(t => tb.includes(t))
  return inter.length >= 2
}

function surveyReclamoAsignadoATecnicoActual(survey) {
  const uid = Number(idUser.value || 0)
  if (uid <= 0) return false

  const idsTecnico = [survey?.id_user_tecnico]
    .map(v => Number(v || 0))
    .filter(v => v > 0)
  if (idsTecnico.length > 0) return idsTecnico.includes(uid)

  const data = getConexionCardData(survey)
  const nombresTecnico = [
    data?.nombreTecnico,
    survey?.nombre_tecnico
  ]
    .filter(nombreTecnicoEsValido)
    .map(v => normalizarTexto(v))

  if (!nombresTecnico.length) return false
  const identidades = [...getIdentidadesUsuarioSesion()]
  return nombresTecnico.some(n => identidades.some(i => nombresCompatibles(n, i)))
}

function toYMDLocal(dateObj) {
  const y = dateObj.getFullYear()
  const m = String(dateObj.getMonth() + 1).padStart(2, '0')
  const d = String(dateObj.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function addDateCandidate(set, y, m, d) {
  if (!(y > 1900 && m >= 1 && m <= 12 && d >= 1 && d <= 31)) return
  set.add(`${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
}

function fechaCandidatesYMD(raw) {
  const txt = String(raw || '').trim()
  const out = new Set()
  if (!txt) return out

  // yyyy-mm-dd / yyyy/mm/dd / yyyy.mm.dd
  let m = txt.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})/)
  if (m) {
    addDateCandidate(out, Number(m[1]), Number(m[2]), Number(m[3]))
    return out
  }

  // dd-mm-yyyy o mm-dd-yyyy (ambiguo cuando a<=12 y b<=12)
  m = txt.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/)
  if (m) {
    const a = Number(m[1]); const b = Number(m[2]); let y = Number(m[3])
    if (y < 100) y += 2000
    addDateCandidate(out, y, b, a) // dmy
    addDateCandidate(out, y, a, b) // mdy
    return out
  }

  const parsed = new Date(txt)
  if (!Number.isNaN(parsed.getTime())) out.add(toYMDLocal(parsed))
  return out
}

function isFechaConexionHoy(raw) {
  const hoy = toYMDLocal(new Date())
  const candidates = fechaCandidatesYMD(raw)
  return candidates.has(hoy)
}

function isConexionCompactSurvey(survey) {
  if (!isConexionSurvey(survey)) return false
  if (isExternalCompany.value) return false
  return getConexionVinculoInfo(survey).tipo === 'Padre'
}

function isConexionRowExpanded(idSurvey) {
  return expandedConexionRows.value.has(Number(idSurvey))
}

function toggleConexionRow(idSurvey) {
  const id = Number(idSurvey || 0)
  if (!id) return
  const next = new Set(expandedConexionRows.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedConexionRows.value = next
}

function getEstadoColor(estadoSrv) {
  const est = String(estadoSrv || '').trim().toUpperCase();
  switch (est) {
    case 'TERMINADO':
    case 'APROBADO':
      return { color: 'green-darken-2', texto: 'Aprobado' }
    case 'VERIFICACION':
    case 'VERIFICACIÓN':
    case 'VERIFICANDO':
      return { color: 'purple-darken-2', texto: 'En Verificación' }
    case 'EJECUCION':
    case 'EJECUCIÓN':
      return { color: 'blue-darken-2', texto: 'En Ejecución' }
    case 'CREADO':
      return { color: 'amber-darken-2', texto: 'Pendiente' }
    case 'RECHAZADO':
    case 'RECHAZADA':
      return { color: 'red-darken-2', texto: 'Rechazado' }
    case 'PRE CREADO':
    case 'PRE-CREADO':
    case 'PLANIFICADO':
      return { color: 'grey', texto: 'Planificado' }
    default:
      return { color: 'grey', texto: estadoSrv || 'Desconocido' }
  }
}

// Llama tu endpoint y normaliza
async function cargarNotificaciones() {
  if (!idUser.value) {
    console.warn('[Survey] No hay id_user para cargar notificaciones.')
    return
  }

  try {
    const { data } = await apiAxios.get(
      '/servicio/leanglobal/obtenerNortificaciones',
      {
        params: { id_user_target: idUser.value }
      }
    )
    notificaciones.value = Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Error al cargar notificaciones:', error)
  }
}

const notifSet = computed(() => {
  const s = new Set()
  for (const n of notificaciones.value) {
    const id = Number(n?.json_data?.id_survey)
    if (!Number.isNaN(id)) s.add(id)
  }
  return s
})

const hasNotif = id => notifSet.value.has(Number(id))

const notifBySurvey = computed(() => {
  const m = new Map()
  for (const n of notificaciones.value) {
    const sid = Number(n?.json_data?.id_survey)
    if (!Number.isNaN(sid)) {
      if (!m.has(sid)) m.set(sid, [])
      m.get(sid).push(n)
    }
  }
  return m
})

const notifPrimaryId = sid => {
  const arr = notifBySurvey.value.get(Number(sid))
  return arr?.[0]?.id_notification ?? null
}
const conexionCardDataCache = new Map()

function normalizarTexto(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function pareceFechaTexto(value) {
  const txt = String(value || '').trim()
  if (!txt) return false
  if (/^\d{4}[./-]\d{1,2}[./-]\d{1,2}([ T]\d{1,2}:\d{2}(:\d{2})?)?$/.test(txt)) return true
  if (/^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}([ T]\d{1,2}:\d{2}(:\d{2})?)?$/.test(txt)) return true
  return false
}

function esValorValidoSupMetrogas(value) {
  const txt = String(value || '').trim()
  if (!txt) return false
  if (esPlaceholderConexion(txt)) return false
  if (pareceFechaTexto(txt)) return false
  // Evita valores numéricos/horas/fechas sin letras
  if (!/[a-zA-Z\u00C0-\u024F]/.test(txt)) return false
  return true
}

function normalizeTipoEmpalmeGasificar(value) {
  const txt = normalizarTexto(value)
  if (!txt) return ''
  if (txt.includes('gasificar')) return 'Gasificar'
  if (txt.includes('empalme')) return 'Empalme Existente'
  return ''
}

function isConexionSurvey(survey) {
  const texto = normalizarTexto([
    survey?.desc_template_srv,
    survey?.name_template_srv,
    survey?.name_tipo_srv,
    survey?.codi_template_srv
  ].join(' '))

  return texto.includes('conexion') || texto.includes('conexiones')
}

function valorDesde(bodyExec, keys = []) {
  if (!bodyExec || typeof bodyExec !== 'object') return ''
  const keyNorms = (keys || []).map(normalizarCampo)
  const mapa = construirMapaBodyExec(bodyExec)

  for (const kn of keyNorms) {
    const exact = mapa.exact.get(kn)
    if (exact) return exact
  }

  for (const kn of keyNorms) {
    for (const [k, v] of mapa.exact.entries()) {
      if (k.includes(kn) || kn.includes(k)) return v
    }
  }

  for (const kn of keyNorms) {
    const byLabel = mapa.byLabel.get(kn)
    if (byLabel) return byLabel
  }

  for (const kn of keyNorms) {
    for (const [k, v] of mapa.byLabel.entries()) {
      if (k.includes(kn) || kn.includes(k)) return v
    }
  }

  return ''
}

function valorDesdeExacto(bodyExec, keys = []) {
  if (!bodyExec || typeof bodyExec !== 'object') return ''
  const keyNorms = (keys || []).map(normalizarCampo)
  const mapa = construirMapaBodyExec(bodyExec)

  for (const kn of keyNorms) {
    const exact = mapa.exact.get(kn)
    if (exact) return exact
  }

  for (const kn of keyNorms) {
    const byLabel = mapa.byLabel.get(kn)
    if (byLabel) return byLabel
  }

  return ''
}

function valorDesdeContieneSeguro(bodyExec, keys = []) {
  if (!bodyExec || typeof bodyExec !== 'object') return ''
  const keyNorms = (keys || [])
    .map(normalizarCampo)
    .filter(k => k.length >= 4)
  if (!keyNorms.length) return ''

  const mapa = construirMapaBodyExec(bodyExec)
  const findContains = (entries) => {
    for (const [k, v] of entries) {
      if (keyNorms.some(kn => k.includes(kn))) return v
    }
    return ''
  }

  return findContains(mapa.exact.entries()) || findContains(mapa.byLabel.entries()) || ''
}

function normalizarCampo(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function formatFechaConexionDisplay(raw) {
  const txt = String(raw || '').trim()
  if (!txt) return ''

  // yyyy-mm-dd / yyyy/mm/dd / yyyy.mm.dd
  let m = txt.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})/)
  if (m) {
    const y = Number(m[1]); const mm = Number(m[2]); const dd = Number(m[3])
    if (y > 1900 && mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31) {
      return `${String(dd).padStart(2, '0')}-${String(mm).padStart(2, '0')}-${String(y).padStart(4, '0')}`
    }
  }

  // dd-mm-yyyy / dd/mm/yyyy / dd.mm.yyyy (si d > 12 es inequívoco)
  m = txt.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/)
  if (m) {
    let a = Number(m[1]); let b = Number(m[2]); let y = Number(m[3])
    if (y < 100) y += 2000
    if (a >= 1 && a <= 31 && b >= 1 && b <= 12) {
      // Si ambas partes <= 12, asumimos origen US (mm/dd) para evitar inversión observada en PWA.
      const isAmbiguous = a <= 12 && b <= 12
      const dd = isAmbiguous ? b : a
      const mm = isAmbiguous ? a : b
      return `${String(dd).padStart(2, '0')}-${String(mm).padStart(2, '0')}-${String(y).padStart(4, '0')}`
    }
  }

  const parsed = new Date(txt)
  if (!Number.isNaN(parsed.getTime())) {
    const dd = String(parsed.getDate()).padStart(2, '0')
    const mm = String(parsed.getMonth() + 1).padStart(2, '0')
    const y = String(parsed.getFullYear())
    return `${dd}-${mm}-${y}`
  }
  return txt
}

function valorPlano(value) {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (typeof value === 'object') {
    const candidatos = [
      value?.nombre_user,
      value?.name_user,
      value?.nombre,
      value?.name,
      value?.label,
      value?.title,
      value?.text,
      value?.descripcion,
      value?.gestor,
      value?.gio,
      value?.value,
      value?.selected,
      value?.default,
      value?.id_user,
      value?.id
    ]
    for (const c of candidatos) {
      if (c === null || c === undefined) continue
      if (typeof c === 'string') {
        const t = c.trim()
        if (t) return t
      } else if (typeof c === 'number' || typeof c === 'boolean') {
        return String(c)
      }
    }
  }
  return ''
}

function construirMapaBodyExec(bodyExec) {
  const exact = new Map()
  const byLabel = new Map()
  const visitados = new Set()

  const pushExact = (key, value) => {
    const k = normalizarCampo(key)
    const v = valorPlano(value)
    if (!k || !v) return
    if (!exact.has(k)) exact.set(k, v)
  }

  const pushByLabel = (label, value) => {
    const k = normalizarCampo(label)
    const v = valorPlano(value)
    if (!k || !v) return
    if (!byLabel.has(k)) byLabel.set(k, v)
  }

  const walk = (node) => {
    if (!node || typeof node !== 'object') return
    if (visitados.has(node)) return
    visitados.add(node)

    if (Array.isArray(node)) {
      for (const item of node) walk(item)
      return
    }

    const label = node.label ?? node.nombre ?? node.name ?? node.titulo ?? node.title
    const labelValue =
      node.default ??
      node.values?.selected ??
      node.selected ??
      node.value ??
      node.valor ??
      node.texto ??
      node.text ??
      node.respuesta ??
      node.answer ??
      node.data
    if (label !== undefined && labelValue !== undefined) {
      pushByLabel(label, labelValue)
    }

    for (const [k, v] of Object.entries(node)) {
      if (typeof v === 'object' && v !== null) {
        walk(v)
      } else {
        pushExact(k, v)
      }
    }
  }

  walk(bodyExec)
  return { exact, byLabel }
}

function pickFirstAsignacionValue(obj, keys = []) {
  if (!obj || typeof obj !== 'object') return null
  for (const k of keys) {
    const v = obj[k]
    if (v === null || v === undefined || v === '') continue
    return v
  }
  return null
}

function extractAsignacionesLikeLG(detailOrRow) {
  const row = Array.isArray(detailOrRow)
    ? detailOrRow[0]
    : (detailOrRow?.surveyDetail?.[0] || detailOrRow)
  if (!row || typeof row !== 'object') return { contratista: null, supervisor: null, tecnico: null }

  const parseObj = (raw) => {
    if (!raw) return null
    if (typeof raw === 'object') return raw
    if (typeof raw === 'string') {
      try { return JSON.parse(raw) } catch { return null }
    }
    return null
  }

  const bodyObj = parseObj(row?.body_exec || row?.json_exec)
  const segAsignaciones = Array.isArray(bodyObj?.segmentos)
    ? bodyObj.segmentos.flatMap(seg => {
      const attrs = Array.isArray(seg?.attributes) ? seg.attributes : []
      return attrs.map(a => a?.asignaciones ?? null).filter(Boolean)
    })
    : []

  const a1 = row?.asignaciones ?? row?.asignacion ?? null
  const a2 = row?.header_exec?.asignaciones ?? row?.header_exec?.asignacion ?? null
  const a3 = row?.body_exec?.asignaciones ?? row?.body_exec?.asignacion ?? null
  const a4 = bodyObj?.asignaciones ?? bodyObj?.asignacion ?? null

  const rawPool = [a1, a2, a3, a4, ...segAsignaciones, row].filter(Boolean)
  const pool = rawPool.flatMap(src => (Array.isArray(src) ? src.filter(Boolean) : [src]))

  const kContr = ['id_user_contratista', 'contratista', 'Contratista', 'id_contratista', 'id_user_contratista_asignado']
  const kSup = ['id_user_supervisor', 'supervisor', 'Supervisor', 'id_supervisor', 'id_user_supervisor_asignado']
  const kTec = ['id_user_tecnico', 'tecnico', 'Tecnico', 'Técnico', 'id_tecnico', 'id_user_tecnico_asignado', 'nombre_tecnico', 'tecnico_nombre']

  let contratista = null
  let supervisor = null
  let tecnico = null

  for (const src of pool) {
    contratista = contratista || pickFirstAsignacionValue(src, kContr)
    supervisor = supervisor || pickFirstAsignacionValue(src, kSup)
    tecnico = tecnico || pickFirstAsignacionValue(src, kTec)
  }

  return { contratista, supervisor, tecnico }
}

function getTecnicoAsignadoDesdeBodyExec(bodyExec) {
  if (!bodyExec || typeof bodyExec !== 'object') return ''
  const visited = new Set()
  let found = ''

  const walk = (node) => {
    if (!node || found) return
    if (typeof node !== 'object') return
    if (visited.has(node)) return
    visited.add(node)

    if (Array.isArray(node)) {
      node.forEach(walk)
      return
    }

    const asig = node?.asignaciones || node?.asignacion || null
    if (asig && typeof asig === 'object') {
      const idTec = Number(asig?.tecnico || asig?.id_user_tecnico || 0)
      if (idTec > 0) {
        found = resolverNombreUsuario(idTec)
        if (found) return
      }
      const nomTec = String(asig?.nombre_tecnico || asig?.tecnico_nombre || '').trim()
      if (nomTec) {
        found = nomTec
        return
      }
    }

    Object.values(node).forEach(walk)
  }

  walk(bodyExec)
  return found
}

function getTecnicoDesdeFilaYBody(row, body) {
  const asig = extractAsignacionesLikeLG(row)
  const asigBody = extractAsignacionesLikeLG({ body_exec: body })
  return (
    asigBody?.tecnico ||
    asig?.tecnico ||
    getTecnicoAsignadoDesdeBodyExec(body) ||
    valorDesde(body, ['nombre tecnico', 'nombre técnico', 'tecnico', 'técnico', 'tecnico asignado']) ||
    valorDesde(row, ['nombre tecnico', 'nombre técnico', 'tecnico', 'técnico', 'tecnico asignado', 'nombre_tecnico']) ||
    resolverNombreUsuario(row?.id_user_tecnico) ||
    String(row?.nombre_tecnico || '').trim() ||
    ''
  )
}

function getChildRowsForParent(parentId) {
  const pid = Number(parentId || 0)
  if (!pid) return []
  const rawRows = Object.values(surveysRawById.value || {})
  return rawRows.filter(r => Number(r?.id_survey_padre || 0) === pid && isConexionSurvey(r))
}

function getTecnicoAsignadoDesdeHijos(parentId) {
  const pid = Number(parentId || 0)
  if (!pid) return ''
  const hijos = getChildRowsForParent(pid)
  for (const h of hijos) {
    const childId = Number(h?.id_survey || 0)
    const detailRawHijo = surveyDetailRawById.value?.[childId] || null
    const asigRawHijo = extractAsignacionesLikeLG(detailRawHijo)
    const tecnicoRawAsignado = asigRawHijo?.tecnico
    const tecnicoAsignado = resolverNombreUsuario(tecnicoRawAsignado)
    if (String(tecnicoAsignado || '').trim()) return String(tecnicoAsignado).trim()

    const detailHijo = bodyExecDetalleBySurvey.value?.[childId] || null
    const bodyHijo = hasBodyExecData(detailHijo)
      ? detailHijo
      : parseBodyExecFromSurveyDetail(h?.body_exec)
    const tecnico =
      getTecnicoDesdeFilaYBody(detailHijo || h, bodyHijo) ||
      getTecnicoDesdeFilaYBody(h, bodyHijo)
    if (tecnico) return tecnico
  }
  return ''
}

function getConexionCardData(survey) {
  const idSurveyNum = Number(survey?.id_survey || 0)
  const infoVinculo = getConexionVinculoInfo(survey)
  const sourceId = infoVinculo.tipo === 'Hijo' && infoVinculo.parentId > 0 ? infoVinculo.parentId : idSurveyNum
  const parentByChild = parentDetailByChildSurvey.value[idSurveyNum]
  const parentDetailRaw = surveyDetailRawById.value[sourceId] || null
  const parentBody = bodyExecDetalleBySurvey.value[sourceId]
  const childBody = bodyExecDetalleBySurvey.value[idSurveyNum]
  const fallbackBody = parseBodyExecFromSurveyDetail(survey?.body_exec)
  const parentBodyFromDetail = parseBodyExecFromSurveyDetail(parentDetailRaw?.body_exec)
  const parentSurveyRow = surveysRawById.value[sourceId] || null
  const parentBodyFromRow = parseBodyExecFromSurveyDetail(parentSurveyRow?.body_exec || parentSurveyRow?.json_exec)
  const parentHeaderFromRow = parseBodyExecFromSurveyDetail(parentSurveyRow?.header_exec)
  const bodySnapshot = hasBodyExecData(parentByChild)
    ? parentByChild
    : hasBodyExecData(parentBody)
      ? parentBody
    : hasBodyExecData(parentBodyFromDetail)
      ? parentBodyFromDetail
    : (hasBodyExecData(childBody) ? childBody : fallbackBody)
  const bodyPadrePreferido = hasBodyExecData(parentByChild)
    ? parentByChild
    : (hasBodyExecData(parentBody) ? parentBody : (hasBodyExecData(parentBodyFromDetail) ? parentBodyFromDetail : null))
  const cacheKey = `${idSurveyNum}|${sourceId}|${JSON.stringify(bodySnapshot)}`
  if (conexionCardDataCache.has(cacheKey)) return conexionCardDataCache.get(cacheKey)
  const body = bodySnapshot
  const bodyPadre = bodyPadrePreferido || body
  const bodyHijo = hasBodyExecData(childBody) ? childBody : fallbackBody

  const fuentesPrioridadPadre = [
    bodyPadre,
    parentBodyFromDetail,
    parentBodyFromRow,
    parentHeaderFromRow,
    parentDetailRaw,
    parentSurveyRow,
    body,
    survey
  ]

  const pickExact = (keys = []) => {
    for (const src of fuentesPrioridadPadre) {
      const v = valorDesdeExacto(src, keys)
      if (v) return v
    }
    return ''
  }

  const pickAny = (keys = []) => {
    for (const src of fuentesPrioridadPadre) {
      const v = valorDesde(src, keys)
      if (v) return v
    }
    return ''
  }

  const pickContains = (keys = []) => {
    for (const src of fuentesPrioridadPadre) {
      const v = valorDesdeContieneSeguro(src, keys)
      if (v) return v
    }
    return ''
  }

  const numeroProyecto =
    pickAny(['proyecto', 'numero proyecto', 'n proyecto', 'nro proyecto', 'numero_proyecto', 'num proyecto', 'proyecto numero', 'n de proyecto', 'n proyecto']) ||
    pickContains(['numeroproyecto', 'nproyecto']) ||
    valorPlano(parentSurveyRow?.id_proyecto)

  let supMetrogasRaw =
    pickExact(['gio', 'gio a cargo', 'gio mg', 'nombre gio', 'nombre gio mg', 'gestor interior de obra']) ||
    pickExact(['sup metrogas', 'supervisor metrogas', 'sup_metrogas', 'nombre supervisor metrogas']) ||
    pickContains(['gio', 'giomg', 'gestorinteriordeobra']) ||
    pickContains(['metrogas'])

  const supTerraconRaw =
    valorDesdeExacto(body, ['sup terracon', 'supervisor terracon', 'sup_terracon', 'id_user_supervisor']) ||
    valorDesdeExacto(parentSurveyRow, ['sup terracon', 'supervisor terracon', 'sup_terracon', 'id_user_supervisor']) ||
    valorDesdeExacto(survey, ['sup terracon', 'supervisor terracon', 'sup_terracon', 'id_user_supervisor']) ||
    parentSurveyRow?.id_user ||
    parentSurveyRow?.nombre_user ||
    survey?.id_user ||
    survey?.nombre_user

  const supTerracon = resolverNombreUsuario(supTerraconRaw)
  let supMetrogas = resolverNombrePlano(supMetrogasRaw)
  if (!esValorValidoSupMetrogas(supMetrogas)) supMetrogas = ''

  if (
    supMetrogas &&
    supTerracon &&
    normalizarTexto(supMetrogas) === normalizarTexto(supTerracon)
  ) {
    const metrogasAlt =
      valorDesdeExacto(body, ['nombre certificador', 'certificador']) ||
      valorDesdeExacto(parentSurveyRow, ['nombre certificador', 'certificador']) ||
      valorDesdeExacto(survey, ['nombre certificador', 'certificador'])
    if (
      metrogasAlt &&
      normalizarTexto(metrogasAlt) !== normalizarTexto(supTerracon) &&
      esValorValidoSupMetrogas(metrogasAlt)
    ) {
      supMetrogasRaw = metrogasAlt
      supMetrogas = resolverNombrePlano(supMetrogasRaw)
    }
  }

  if (!supMetrogas || !esValorValidoSupMetrogas(supMetrogas)) {
    const metrogasAlt =
      valorDesdeExacto(body, ['nombre certificador', 'certificador']) ||
      valorDesdeExacto(parentSurveyRow, ['nombre certificador', 'certificador']) ||
      valorDesdeExacto(survey, ['nombre certificador', 'certificador'])
    if (metrogasAlt && esValorValidoSupMetrogas(metrogasAlt)) {
      supMetrogas = resolverNombrePlano(metrogasAlt)
    }
  }

  const ic =
    valorDesdeExacto(body, ['ic sap mg', 'ic_sap_mg', 'ic sap', 'ic-sap', 'ic_sap', 'icsapmg']) ||
    valorDesdeExacto(parentSurveyRow, ['ic sap mg', 'ic_sap_mg', 'ic sap', 'ic-sap', 'ic_sap', 'icsapmg']) ||
    valorDesdeExacto(survey, ['ic sap mg', 'ic_sap_mg', 'ic sap', 'ic-sap', 'ic_sap', 'icsapmg']) ||
    valorDesdeContieneSeguro(body, ['icsap', 'icsapmg']) ||
    valorDesdeContieneSeguro(parentSurveyRow, ['icsap', 'icsapmg']) ||
    valorDesdeContieneSeguro(survey, ['icsap', 'icsapmg']) ||
    valorDesdeExacto(body, ['ic']) ||
    valorDesdeExacto(parentSurveyRow, ['ic']) ||
    valorDesdeExacto(survey, ['ic'])
  const direccion = valorDesde(body, ['direccion', 'dirección', 'address', 'dir']) || valorDesde(parentSurveyRow, ['direccion', 'dirección', 'address', 'dir']) || valorDesde(survey, ['direccion', 'dirección', 'address', 'dir'])
  const comuna = valorDesde(body, ['comuna']) || valorDesde(parentSurveyRow, ['comuna']) || valorDesde(survey, ['comuna'])
  const direccionComunaRaw =
    pickAny(['direccion y comuna', 'dirección y comuna', 'direccion/comuna', 'dirección/comuna']) ||
    pickContains(['direccionycomuna'])
  const direccionComuna = (() => {
    const com = String(comuna || '').trim()
    const raw = String(direccionComunaRaw || '').trim()
    if (raw) {
      if (!com) return raw
      const rawNorm = normalizarTexto(raw)
      const comNorm = normalizarTexto(com)
      if (!comNorm || rawNorm.includes(comNorm)) return raw
      return `${raw} / ${com}`
    }
    const dir = String(direccion || '').trim()
    if (dir && com) return `${dir} / ${com}`
    return dir || com || ''
  })()
  const comunaDisplay = (() => {
    const com = String(comuna || '').trim()
    if (com) return com
    const parts = String(direccionComuna || '').split('/')
    return String(parts?.[parts.length - 1] || '').trim()
  })()
  const proyectoNombre =
    valorDesde(parentSurveyRow, ['nombre proyecto', 'proyecto', 'nombre_proyecto']) ||
    valorDesde(survey, ['nombre proyecto', 'proyecto', 'nombre_proyecto']) ||
    parentSurveyRow?.nombre_proyecto ||
    survey?.nombre_proyecto
  const orden = (() => {
    const candidates = [
      pickAny(['numero orden', 'nro orden', 'n° orden', 'orden trabajo', 'n orden', 'n de orden']),
      pickContains(['numeroorden', 'nroorden', 'ordentrabajo', 'nmroordenmg']),
      pickAny(['orden', 'ot', 'o/t'])
    ]
      .map(v => String(v || '').trim())
      .filter(v => v && v !== '-')

    return (
      candidates.find(v => /\d{5,}/.test(v)) ||
      candidates.find(v => !/^(?:ot\s*)?\d{1,3}$/i.test(v)) ||
      candidates[0] ||
      '-'
    )
  })()
  const idSurvey = String(idSurveyNum || '-')
  const fechaAsignacionRaw =
    pickAny(['fecha', 'fecha asignacion', 'fecha asignación', 'fecha_asignacion', 'fecha asig', 'fecha de asignacion', 'fecha de asignación']) ||
    pickContains(['fechaasignacion', 'fechadeasignacion', 'fecha']) ||
    ''
  const fechaFilaRaw = fechaAsignacionRaw || survey?.fecha_real_ini || survey?.fecha_real_fin || survey?.fecha_plan_ini || survey?.fecha_plan_fin || ''
  const fechaAsignacion = formatFechaConexionDisplay(fechaAsignacionRaw)
  const fechaFila = formatFechaConexionDisplay(fechaFilaRaw)
  const tipoTrabajoRaw =
    valorDesde(bodyPadre, ['tipo empalme gasificar', 'tipoempalmegasificar', 'tipo empaleme gasificar', 'tipoempalemegasificar', 'tipo empalme/gasificar']) ||
    valorDesde(body, ['tipo empalme gasificar', 'tipoempalmegasificar', 'tipo empaleme gasificar', 'tipoempalemegasificar', 'tipo empalme/gasificar']) ||
    valorDesde(parentSurveyRow, ['tipo empalme gasificar', 'tipoempalmegasificar', 'tipo empaleme gasificar', 'tipoempalemegasificar', 'tipo empalme/gasificar']) ||
    valorDesde(survey, ['tipo empalme gasificar', 'tipoempalmegasificar', 'tipo empaleme gasificar', 'tipoempalemegasificar', 'tipo empalme/gasificar'])
  const tecnicoDesdeHijo = infoVinculo.tipo === 'Padre'
    ? getTecnicoAsignadoDesdeHijos(idSurveyNum)
    : ''
  const tecnicoRaw =
    // Prioridad real para técnico:
    // - Si estamos en padre, usar primero el técnico del hijo asignado.
    // - Luego resolver por body/fila del survey actual y fallback técnico del padre.
    tecnicoDesdeHijo ||
    getTecnicoAsignadoDesdeBodyExec(bodyHijo) ||
    valorDesde(bodyHijo, ['nombre tecnico', 'nombre técnico', 'tecnico', 'técnico', 'tecnico asignado']) ||
    valorDesde(survey, ['nombre tecnico', 'nombre técnico', 'tecnico', 'técnico', 'tecnico asignado', 'nombre_tecnico']) ||
    resolverNombreUsuario(survey?.id_user_tecnico) ||
    survey?.nombre_tecnico ||
    getTecnicoAsignadoDesdeBodyExec(bodyPadre) ||
    valorDesde(bodyPadre, ['nombre tecnico', 'nombre técnico', 'tecnico', 'técnico', 'tecnico asignado']) ||
    valorDesde(parentSurveyRow, ['nombre tecnico', 'nombre técnico', 'tecnico', 'técnico', 'tecnico asignado']) ||
    resolverNombreUsuario(parentSurveyRow?.id_user_tecnico) ||
    parentSurveyRow?.nombre_tecnico
  const tecnicoNombre = resolverNombreUsuario(tecnicoRaw)
  const observacion = valorDesde(body, ['observacion', 'observación', 'observaciones', 'obs']) || valorDesde(parentSurveyRow, ['observacion', 'observación', 'observaciones', 'obs']) || valorDesde(survey, ['observacion', 'observación', 'observaciones', 'obs'])

  const result = {
    numeroProyecto: numeroProyecto || '-',
    supMetrogas: supMetrogas || '-',
    supTerracon: supTerracon || '-',
    fechaFila: fechaFila || '-',
    fechaTablaRaw: fechaAsignacionRaw || '',
    tipoTrabajo: normalizeTipoEmpalmeGasificar(tipoTrabajoRaw) || '-',
    nombreTecnico: tecnicoNombre || '-',
    ic: ic || '-',
    direccion: direccion || '-',
    direccionComuna: direccionComuna || direccion || '-',
    comuna: comunaDisplay || '-',
    proyecto: String(proyectoNombre || '-').trim() || '-',
    orden: orden || '-',
    idSurvey: idSurvey || '-',
    fechaAsignacion: fechaAsignacion || '-',
    observacion
  }
  conexionCardDataCache.set(cacheKey, result)
  return result
}

function getReclamoCardData(survey) {
  const idSurvey = Number(survey?.id_survey || 0)
  const detailRaw = surveyDetailRawById.value?.[idSurvey] || null
  const bodyFromDetail = parseBodyExecFromSurveyDetail(detailRaw?.body_exec)
  const bodyFromSurvey = parseBodyExecFromSurveyDetail(survey?.body_exec)
  const body = hasBodyExecData(bodyFromDetail)
    ? bodyFromDetail
    : (hasBodyExecData(bodyFromSurvey) ? bodyFromSurvey : {})

  const numeroReclamo = (() => {
    const candidates = [
      valorDesdeExacto(body, ['nmro reclamo', 'nro reclamo', 'numero reclamo', 'número reclamo', 'n reclamo', 'id reclamo', 'reclamo']),
      valorDesdeContieneSeguro(body, ['nmroreclamo', 'nroreclamo', 'numeroreclamo', 'idreclamo']),
      valorDesde(detailRaw, ['nmro reclamo', 'nro reclamo', 'numero reclamo', 'número reclamo', 'n reclamo', 'id reclamo', 'reclamo']),
      valorDesde(survey, ['nmro reclamo', 'nro reclamo', 'numero reclamo', 'número reclamo', 'n reclamo', 'id reclamo', 'reclamo']),
      valorDesde(body, ['ticket', 'folio', 'caso']),
      valorDesde(detailRaw, ['ticket', 'folio', 'caso']),
      valorDesde(survey, ['ticket', 'folio', 'caso'])
    ]
      .map(v => String(v || '').trim())
      .filter(Boolean)

    const withRec = candidates.find(v => /rec/i.test(v))
    return withRec || '-'
  })()

  const observacionTerraconRaw =
    valorDesdeExacto(body, [
      'observacion/descripción del problema.',
      'observacion descripcion del problema',
      'observación/descripción del problema',
      'observacion terracon',
      'observación terracon',
      'observacion planificador',
      'observación planificador'
    ]) ||
    valorDesdeContieneSeguro(body, [
      'observaciondescripciondelproblema',
      'observacionterracon',
      'observacionplanificador'
    ]) ||
    valorDesdeExacto(detailRaw, [
      'observacion/descripción del problema.',
      'observacion descripcion del problema',
      'observación/descripción del problema',
      'observacion terracon',
      'observación terracon',
      'observacion planificador',
      'observación planificador'
    ]) ||
    valorDesdeExacto(survey, [
      'observacion/descripción del problema.',
      'observacion descripcion del problema',
      'observación/descripción del problema',
      'observacion terracon',
      'observación terracon',
      'observacion planificador',
      'observación planificador'
    ]) ||
    ''
  const observacionTerracon = String(observacionTerraconRaw || '-').trim() || '-'

  const contenidoReclamoRaw =
    valorDesdeExacto(body, ['contenido del reclamo', 'contenido reclamo', 'descripcion reclamo', 'detalle reclamo']) ||
    valorDesdeContieneSeguro(body, ['contenidodelreclamo', 'contenidoreclamo', 'descripcionreclamo', 'detallereclamo']) ||
    valorDesdeExacto(detailRaw, ['contenido del reclamo', 'contenido reclamo', 'descripcion reclamo', 'detalle reclamo']) ||
    valorDesdeExacto(survey, ['contenido del reclamo', 'contenido reclamo', 'descripcion reclamo', 'detalle reclamo']) ||
    ''
  const contenidoReclamo = String(contenidoReclamoRaw || '-').trim() || '-'

  const orden = (() => {
    const candidates = [
      valorDesdeExacto(body, ['numero orden', 'nro orden', 'n° orden', 'orden trabajo', 'n orden', 'n de orden']),
      valorDesdeContieneSeguro(body, ['numeroorden', 'nroorden', 'ordentrabajo', 'nmroordenmg']),
      valorDesde(detailRaw, ['numero orden', 'nro orden', 'n° orden', 'orden trabajo', 'n orden', 'n de orden']),
      valorDesde(survey, ['numero orden', 'nro orden', 'n° orden', 'orden trabajo', 'n orden', 'n de orden']),
      valorDesdeExacto(body, ['ot', 'o/t', 'orden']),
      valorDesde(detailRaw, ['ot', 'o/t', 'orden']),
      valorDesde(survey, ['ot', 'o/t', 'orden']),
      getConexionCardData(survey).orden
    ]
      .map(v => String(v || '').trim())
      .filter(v => v && v !== '-')

    const best =
      candidates.find(v => /\d{5,}/.test(v)) ||
      candidates.find(v => !/^(?:ot\s*)?\d{1,3}$/i.test(v)) ||
      candidates[0] ||
      '-'

    return best
  })()

  const supTerraconRaw =
    // En reclamos, SUP. TERRACON debe salir de "Gio a cargo del Reclamo" / Gestor.
    valorDesdeExacto(body, ['gio a cargo del reclamo', 'gio a cargo', 'gestor', 'nombre gestor', 'id_gestor', 'id gestor', 'gio', 'gio mg', 'nombre gio', 'nombre gio mg']) ||
    valorDesdeContieneSeguro(body, ['gestor', 'idgestor', 'gio', 'giomg', 'gestorinteriordeobra']) ||
    valorDesdeExacto(detailRaw, ['gio a cargo del reclamo', 'gio a cargo', 'gestor', 'nombre gestor', 'id_gestor', 'id gestor', 'gio', 'gio mg', 'nombre gio', 'nombre gio mg']) ||
    valorDesdeContieneSeguro(detailRaw, ['gestor', 'idgestor', 'gio', 'giomg', 'gestorinteriordeobra']) ||
    valorDesdeExacto(survey, ['gio a cargo del reclamo', 'gio a cargo', 'gestor', 'nombre gestor', 'id_gestor', 'id gestor', 'gio', 'gio mg', 'nombre gio', 'nombre gio mg']) ||
    valorDesdeContieneSeguro(survey, ['gestor', 'idgestor', 'gio', 'giomg', 'gestorinteriordeobra']) ||
    getConexionCardData(survey).supTerracon ||
    ''
  const supTerracon = esValorValidoSupMetrogas(supTerraconRaw)
    ? resolverNombreUsuario(supTerraconRaw)
    : '-'

  const statusSrv = String(detailRaw?.estado_srv || survey?.estado_srv || '').trim()
  const estadoRaw = (
    (statusSrv === 'Terminado' || statusSrv === 'APROBADO' || statusSrv === 'VERIFICACION')
      ? statusSrv
      : (
          valorDesdeExacto(body, ['estado conexion', 'estado conexión', 'estado_conexion', 'estado']) ||
          valorDesdeContieneSeguro(body, ['estadoconexion', 'estado']) ||
          valorDesde(detailRaw, ['estado conexion', 'estado conexión', 'estado_conexion', 'estado']) ||
          valorDesde(survey, ['estado conexion', 'estado conexión', 'estado_conexion', 'estado']) ||
          ''
        )
  )
  const estadoNorm = normalizarTexto(estadoRaw)
  const estado = (estadoRaw === 'Terminado' || estadoRaw === 'APROBADO' || estadoRaw === 'VERIFICACION')
    ? estadoRaw
    : (estadoNorm.includes('solucion') ? 'Solucionado' : (estadoNorm.includes('pend') ? 'Pendiente' : '-'))

  const direccion =
    valorDesde(body, ['direccion', 'dirección', 'address', 'dir']) ||
    valorDesde(detailRaw, ['direccion', 'dirección', 'address', 'dir']) ||
    valorDesde(survey, ['direccion', 'dirección', 'address', 'dir'])
  const comuna =
    valorDesde(body, ['comuna']) ||
    valorDesde(detailRaw, ['comuna']) ||
    valorDesde(survey, ['comuna'])
  const direccionComunaRaw =
    valorDesdeExacto(body, ['direccion y comuna', 'dirección y comuna', 'direccion/comuna', 'dirección/comuna']) ||
    valorDesdeContieneSeguro(body, ['direccionycomuna']) ||
    valorDesde(detailRaw, ['direccion y comuna', 'dirección y comuna', 'direccion/comuna', 'dirección/comuna']) ||
    valorDesdeContieneSeguro(detailRaw, ['direccionycomuna']) ||
    valorDesde(survey, ['direccion y comuna', 'dirección y comuna', 'direccion/comuna', 'dirección/comuna'])
  const direccionComuna = (() => {
    const raw = String(direccionComunaRaw || '').trim()
    const com = String(comuna || '').trim()
    if (raw) {
      if (!com) return raw
      const rawNorm = normalizarTexto(raw)
      const comNorm = normalizarTexto(com)
      // Si el campo combinado no trae comuna, la agrega al final.
      if (!comNorm || rawNorm.includes(comNorm)) return raw
      return `${raw} / ${com}`
    }
    const dir = String(direccion || '').trim()
    if (dir && com) return `${dir} / ${com}`
    return dir || com || '-'
  })()

  return {
    numeroReclamo: String(numeroReclamo || '-').trim() || '-',
    orden,
    supTerracon,
    estado,
    observacionTerracon,
    contenidoReclamo,
    direccionComuna: String(direccionComuna || '-').trim() || '-'
  }
}

function resolverNombreUsuario(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  const numeric = Number(raw)
  if (!Number.isNaN(numeric) && nombresUsuariosById.value[numeric]) {
    return nombresUsuariosById.value[numeric]
  }
  return raw
}

function resolverNombrePlano(value) {
  return String(value ?? '').trim()
}

function esPlaceholderConexion(value) {
  const n = normalizarCampo(value)
  if (!n) return true
  const placeholders = new Set([
    'medidormetrogas',
    'supmetrogas',
    'supervisormetrogas',
    'supterracon',
    'supervisorterracon',
    'icsap',
    'icsapmg'
  ])
  return placeholders.has(n)
}

function getConexionCardFields(survey) {
  const data = getConexionCardData(survey)
  const infoVinculo = getConexionVinculoInfo(survey)
  return [
    { label: 'Numero Proyecto', value: data.numeroProyecto },
    { label: 'Sup Metrogas', value: data.supMetrogas },
    { label: 'Sup Terracon', value: data.supTerracon },
    { label: 'IC', value: data.ic },
    { label: 'Direccion', value: data.direccionComuna || data.direccion },
    { label: 'Orden', value: data.orden },
    {
      label: 'ID Survey',
      value: data.idSurvey,
      metaTag: infoVinculo.tipo === 'Hijo' && infoVinculo.parentId > 0 ? `Hijo de ${infoVinculo.parentId}` : 'Padre'
    },
    { label: 'Fecha Asignacion', value: data.fechaAsignacion },
    { label: 'Tipo', value: data.tipoTrabajo },
    { label: 'Observacion', value: data.observacion, full: true }
  ]
}

function getConexionVinculoInfo(survey) {
  const idSurvey = Number(survey?.id_survey || 0)
  const fromRow = Number(survey?.id_survey_padre || 0)
  const fromDetail = Number(surveyVinculoBySurvey.value[idSurvey]?.id_survey_padre || 0)
  const parentId = fromDetail || fromRow || 0
  return {
    tipo: parentId > 0 ? 'Hijo' : 'Padre',
    parentId
  }
}

function parseBodyExecFromSurveyDetail(bodyExecRaw) {
  let bodyExec = bodyExecRaw
  if (typeof bodyExec === 'string') {
    const txt = bodyExec.trim()
    if (txt && txt.toLowerCase() !== 'null') {
      try {
        bodyExec = JSON.parse(txt)
      } catch (e) {
        console.error('[Survey] Error parseando body_exec de detail:', e)
        bodyExec = {}
      }
    } else {
      bodyExec = {}
    }
  }
  if (!bodyExec || typeof bodyExec !== 'object') bodyExec = {}
  return bodyExec
}

function hasBodyExecData(bodyExec) {
  return !!(bodyExec && typeof bodyExec === 'object' && Object.keys(bodyExec).length > 0)
}

function extractSurveyDetail(payload) {
  if (!payload) return null
  if (Array.isArray(payload)) return payload[0] || null
  if (Array.isArray(payload?.data)) return payload.data[0] || null
  if (Array.isArray(payload?.datos)) return payload.datos[0] || null
  if (Array.isArray(payload?.surveyDetail)) return payload.surveyDetail[0] || null
  if (payload?.data && typeof payload.data === 'object') return payload.data
  return (typeof payload === 'object') ? payload : null
}

async function fetchSurveyDetailById(idSurvey) {
  const id = Number(idSurvey || 0)
  if (!id) return null

  try {
    const { data } = await apiAxios.get(`/servicio/leanglobal/procesosSurveyDetail?id_survey=${id}`)
    return extractSurveyDetail(data)
  } catch (error) {
    console.error('[Survey] fetchSurveyDetailById error:', id, error?.response?.status || error?.message)
    return null
  }
}

async function cargarDetalleConexiones(listaSurveys = []) {
  const conexiones = (listaSurveys || []).filter(isConexionSurvey)
  if (!conexiones.length || !isOnline.value) return

  const idsBase = conexiones.map(s => Number(s?.id_survey)).filter(id => id > 0)
  if (!idsBase.length) return

  const nextBodyExec = { ...bodyExecDetalleBySurvey.value }
  const nextDetailRaw = { ...surveyDetailRawById.value }
  const nextVinculos = { ...surveyVinculoBySurvey.value }
  const nextParentByChild = { ...parentDetailByChildSurvey.value }
  const procesados = new Set()
  let idsPendientes = idsBase.filter(id => !hasBodyExecData(nextBodyExec[id]) || !nextVinculos[id])

  while (idsPendientes.length) {
    const lote = [...new Set(idsPendientes)].filter(id => !procesados.has(id))
    if (!lote.length) break
    lote.forEach(id => procesados.add(id))

    const resultados = await Promise.allSettled(
      lote.map(id =>
        apiAxios.get(`/servicio/leanglobal/procesosSurveyDetail?id_survey=${id}`)
      )
    )

    const nuevosPadres = []
    resultados.forEach((res, idx) => {
      if (res.status !== 'fulfilled') return
      const idSurvey = lote[idx]
      const payload = res.value?.data
      const detail = extractSurveyDetail(payload)
      if (!detail) return

      nextDetailRaw[idSurvey] = detail
      const parentId = Number(detail?.id_survey_padre || 0)
      nextVinculos[idSurvey] = { id_survey_padre: parentId }
      const bodyParsed = parseBodyExecFromSurveyDetail(detail?.body_exec)
      // Si el body_exec viene vacío (caso frecuente por perfil), usamos el detail completo como respaldo.
      nextBodyExec[idSurvey] = hasBodyExecData(bodyParsed) ? bodyParsed : (detail && typeof detail === 'object' ? detail : {})
      if (parentId > 0 && !hasBodyExecData(nextBodyExec[parentId])) nuevosPadres.push(parentId)
    })

    idsPendientes = nuevosPadres
  }

  bodyExecDetalleBySurvey.value = nextBodyExec
  surveyDetailRawById.value = nextDetailRaw
  surveyVinculoBySurvey.value = nextVinculos

  // Refuerzo: si los hijos no están visibles por filtro de usuario, igual los obtenemos
  // desde la lista RAW para resolver técnico asignado del hijo.
  const parentIdsVisibles = new Set(
    (conexiones || [])
      .map(s => Number(s?.id_survey || 0))
      .filter(id => id > 0)
  )
  const childIdsFromRaw = Object.values(surveysRawById.value || {})
    .filter(r => {
      const pid = Number(r?.id_survey_padre || 0)
      const rid = Number(r?.id_survey || 0)
      return pid > 0 && rid > 0 && parentIdsVisibles.has(pid) && isConexionSurvey(r)
    })
    .map(r => Number(r?.id_survey || 0))
    .filter(id => id > 0)

  for (const childId of [...new Set(childIdsFromRaw)]) {
    if (nextDetailRaw[childId] && hasBodyExecData(nextBodyExec[childId])) continue
    const detailHijo = await fetchSurveyDetailById(childId)
    if (!detailHijo) continue
    nextDetailRaw[childId] = detailHijo
    const parsedHijo = parseBodyExecFromSurveyDetail(detailHijo?.body_exec)
    nextBodyExec[childId] = hasBodyExecData(parsedHijo)
      ? parsedHijo
      : (detailHijo && typeof detailHijo === 'object' ? detailHijo : {})
    const pid = Number(detailHijo?.id_survey_padre || 0)
    if (pid > 0) nextVinculos[childId] = { id_survey_padre: pid }
  }

  // Refuerzo explícito: para cada hijo visible, pedir el detalle del padre por id_survey
  // incluso si no quedó en la lista filtrada del usuario actual.
  const parentIdsNecesarios = [...new Set(
    conexiones
      .map((s) => {
        const sid = Number(s?.id_survey || 0)
        const fromVinculo = Number(nextVinculos[sid]?.id_survey_padre || 0)
        const fromRow = Number(s?.id_survey_padre || 0)
        return fromVinculo || fromRow || 0
      })
      .filter((id) => id > 0 && !hasBodyExecData(nextBodyExec[id]))
  )]

  for (const parentId of parentIdsNecesarios) {
    const detailPadre = await fetchSurveyDetailById(parentId)
    if (!detailPadre) continue

    nextDetailRaw[parentId] = detailPadre
    const parsedPadre = parseBodyExecFromSurveyDetail(detailPadre?.body_exec)
    nextBodyExec[parentId] = hasBodyExecData(parsedPadre)
      ? parsedPadre
      : (detailPadre && typeof detailPadre === 'object' ? detailPadre : {})
  }

  // Llamada explícita por hijo: guarda snapshot de padre asociado al hijo
  // para usarlo directo en la tarjeta (caso técnico externo).
  for (const child of conexiones) {
    const childId = Number(child?.id_survey || 0)
    if (!childId) continue

    const parentId = Number(nextVinculos[childId]?.id_survey_padre || child?.id_survey_padre || 0)
    if (!parentId) continue

    const detailPadre = await fetchSurveyDetailById(parentId)
    if (!detailPadre) continue

    nextDetailRaw[parentId] = detailPadre
    const parsedPadre = parseBodyExecFromSurveyDetail(detailPadre?.body_exec)
    const snapshotPadre = hasBodyExecData(parsedPadre)
      ? parsedPadre
      : (detailPadre && typeof detailPadre === 'object' ? detailPadre : {})

    nextParentByChild[childId] = snapshotPadre
    if (!hasBodyExecData(nextBodyExec[parentId]) && hasBodyExecData(snapshotPadre)) {
      nextBodyExec[parentId] = snapshotPadre
    }
  }

  bodyExecDetalleBySurvey.value = nextBodyExec
  surveyDetailRawById.value = nextDetailRaw
  parentDetailByChildSurvey.value = nextParentByChild
  conexionCardDataCache.clear()
}

async function cargarDetalleReclamos(listaSurveys = []) {
  if (!esVistaReclamos.value || !isOnline.value) return

  const ids = (listaSurveys || [])
    .map(s => Number(s?.id_survey || 0))
    .filter(id => id > 0)

  if (!ids.length) return

  const nextBodyExec = { ...bodyExecDetalleBySurvey.value }
  const nextDetailRaw = { ...surveyDetailRawById.value }

  const pendientes = ids.filter(id => !nextDetailRaw[id])
  if (!pendientes.length) return

  const resultados = await Promise.allSettled(
    pendientes.map(id => apiAxios.get(`/servicio/leanglobal/procesosSurveyDetail?id_survey=${id}`))
  )

  resultados.forEach((res, idx) => {
    if (res.status !== 'fulfilled') return
    const idSurvey = pendientes[idx]
    const detail = extractSurveyDetail(res.value?.data)
    if (!detail) return
    nextDetailRaw[idSurvey] = detail
    const bodyParsed = parseBodyExecFromSurveyDetail(detail?.body_exec)
    nextBodyExec[idSurvey] = hasBodyExecData(bodyParsed)
      ? bodyParsed
      : (detail && typeof detail === 'object' ? detail : {})
  })

  surveyDetailRawById.value = nextDetailRaw
  bodyExecDetalleBySurvey.value = nextBodyExec
}

async function logSurveysFiltradosConDetalleReclamo(listaSurveys = []) {
  if (!esVistaReclamos.value) return

  const reclamos = (listaSurveys || [])
    .filter(s => Number(s?.id_survey || 0) > 0)

  if (!reclamos.length) {
    console.log('[Reclamos] Surveys filtrados + surveyDetail/body_exec: sin registros')
    return
  }

  // Refuerzo: asegura surveyDetail para cada reclamo filtrado (si falta en caché local).
  const idsFaltantes = reclamos
    .map(s => Number(s?.id_survey || 0))
    .filter(id => id > 0 && !surveyDetailRawById.value[id])

  if (idsFaltantes.length && isOnline.value) {
    const nextDetailRaw = { ...surveyDetailRawById.value }
    const nextBodyExec = { ...bodyExecDetalleBySurvey.value }
    const resultados = await Promise.allSettled(
      idsFaltantes.map(id => apiAxios.get(`/servicio/leanglobal/procesosSurveyDetail?id_survey=${id}`))
    )

    resultados.forEach((res, idx) => {
      if (res.status !== 'fulfilled') return
      const idSurvey = idsFaltantes[idx]
      const detail = extractSurveyDetail(res.value?.data)
      if (!detail) return
      nextDetailRaw[idSurvey] = detail
      const bodyParsed = parseBodyExecFromSurveyDetail(detail?.body_exec)
      nextBodyExec[idSurvey] = hasBodyExecData(bodyParsed)
        ? bodyParsed
        : (detail && typeof detail === 'object' ? detail : {})
    })

    surveyDetailRawById.value = nextDetailRaw
    bodyExecDetalleBySurvey.value = nextBodyExec
  }

  const salida = reclamos.map((s) => {
    const idSurvey = Number(s?.id_survey || 0)
    const detail = surveyDetailRawById.value?.[idSurvey] || null
    const bodyFromDetail = parseBodyExecFromSurveyDetail(detail?.body_exec)
    const bodyExec = hasBodyExecData(bodyFromDetail)
      ? bodyFromDetail
      : (bodyExecDetalleBySurvey.value?.[idSurvey] || {})
    const gestor =
      valorDesdeExacto(bodyExec, ['gestor', 'nombre gestor', 'gio', 'gio a cargo', 'nombre gio']) ||
      valorDesdeContieneSeguro(bodyExec, ['gestor', 'gio']) ||
      '-'

    return {
      id_survey: idSurvey,
      codi_template_srv: s?.codi_template_srv,
      name_template_srv: s?.name_template_srv,
      gestor,
      surveyDetail: detail,
      body_exec: bodyExec
    }
  })

  console.groupCollapsed(`[Reclamos] Surveys filtrados + surveyDetail/body_exec (${salida.length})`)
  salida.forEach(row => console.log(row))
  console.groupEnd()
}

async function cargarNombresUsuarios() {
  try {
    const { data } = await apiAxios.get('/servicio/leanglobal/obtenerUsuarios')
    const rows = Array.isArray(data) ? data : []
    const next = {}
    for (const u of rows) {
      const id = Number(u?.id_user)
      const nombre = String(u?.nombre_user ?? '').trim()
      if (!Number.isNaN(id) && nombre) next[id] = nombre
    }
    nombresUsuariosById.value = next
  } catch (error) {
    console.error('[Survey] Error cargando nombres de usuarios:', error)
  }
}
</script>

<style scoped>
.surveys-page :deep(.surveys-filter-field .v-field) {
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.055) !important;
  box-shadow: none;
  transition: all 0.3s ease;
}

.surveys-page :deep(.surveys-filter-field .v-field__overlay) {
  opacity: 0;
}

.surveys-page :deep(.surveys-filter-field .v-field--variant-outlined .v-field__outline) {
  --v-field-border-opacity: 1;
  color: var(--tm-border) !important;
}

.surveys-page :deep(.surveys-filter-field .v-field:hover .v-field__outline) {
  color: rgba(52, 211, 153, 0.42) !important;
}

.surveys-page :deep(.surveys-filter-field .v-field.v-field--focused) {
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.18);
}

.surveys-page :deep(.surveys-filter-field .v-field.v-field--focused .v-field__outline) {
  color: var(--tm-emerald) !important;
}

.surveys-page :deep(.surveys-filter-field .v-label.v-field-label) {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--tm-text) !important;
  opacity: 1;
}

.surveys-page :deep(.surveys-filter-field .v-field__input) {
  min-height: 42px;
  padding-top: 8px;
  padding-bottom: 8px;
  color: var(--tm-text) !important;
}

.surveys-page :deep(.surveys-filter-field input),
.surveys-page :deep(.surveys-filter-field .v-select__selection-text) {
  color: var(--tm-text) !important;
  -webkit-text-fill-color: var(--tm-text) !important;
}

.surveys-page :deep(.surveys-filter-field input::placeholder) {
  color: var(--tm-muted) !important;
  opacity: 1;
}

.surveys-page :deep(.surveys-filter-field .v-field__append-inner .v-icon),
.surveys-page :deep(.surveys-filter-field .v-field__clearable .v-icon) {
  color: var(--tm-muted) !important;
}

:global(.surveys-select-menu) {
  border: 1px solid var(--tm-border) !important;
  border-radius: 8px !important;
  background: #162033 !important;
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.42) !important;
  overflow: hidden !important;
}

:global(.surveys-select-menu .v-list) {
  background: #162033 !important;
  color: var(--tm-text) !important;
  padding: 4px 0 !important;
}

:global(.surveys-select-menu .v-list-item) {
  min-height: 36px !important;
  color: var(--tm-text) !important;
  padding-inline: 12px !important;
}

:global(.surveys-select-menu .v-list-item:hover),
:global(.surveys-select-menu .v-list-item--active) {
  background: rgba(16, 185, 129, 0.14) !important;
  color: var(--tm-emerald-2) !important;
}

:global(.surveys-select-menu .v-list-item-title) {
  font-size: 0.84rem !important;
  font-weight: 700 !important;
}

:global(.surveys-select-menu ::-webkit-scrollbar) {
  width: 8px;
}

:global(.surveys-select-menu ::-webkit-scrollbar-track) {
  background: rgba(255, 255, 255, 0.06);
}

:global(.surveys-select-menu ::-webkit-scrollbar-thumb) {
  background: rgba(156, 163, 175, 0.75);
  border-radius: 999px;
}

tbody tr:nth-of-type(odd) {
  background-color: rgba(0, 0, 0, 0.05);
}
.sombra-resaltada {
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18) !important;
  border-radius: 12px;
}
.asignacion-dia-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
}
.conexion-priority-card {
  border: 1px solid #b9c8da;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 3px 10px rgba(15, 23, 42, 0.12);
  padding: 8px;
  display: grid;
  gap: 6px;
  cursor: pointer;
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}
.conexion-priority-card:active {
  transform: translateY(1px);
  box-shadow: 0 1px 6px rgba(15, 23, 42, 0.12);
}
.conexion-priority-card__top {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}
.conexion-priority-card__meta-pill {
  font-size: 0.72rem;
  font-weight: 700;
  color: #1e293b;
  border: 1px solid #dbe3ef;
  border-radius: 999px;
  padding: 2px 6px;
  text-align: center;
  background: #f8fafc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.conexion-priority-card__address {
  font-size: 0.84rem;
  font-weight: 700;
  line-height: 1.2;
  color: #0f172a;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 6px 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.conexion-priority-card__people {
  display: grid;
  grid-template-columns: 1fr;
  gap: 4px;
}
.conexion-priority-card__person-line {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 6px;
  align-items: center;
  min-width: 0;
}
.conexion-priority-card__label-inline {
  font-size: 0.66rem;
  font-weight: 700;
  color: #0f766e;
  text-transform: uppercase;
}
.conexion-priority-card__value-inline {
  font-size: 0.78rem;
  font-weight: 700;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.reclamo-priority-card {
  border: 1px solid #b9c8da;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 3px 10px rgba(15, 23, 42, 0.12);
  padding: 8px;
  display: grid;
  gap: 6px;
  cursor: pointer;
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}
.reclamo-priority-card:active {
  transform: translateY(1px);
  box-shadow: 0 1px 6px rgba(15, 23, 42, 0.12);
}
.reclamo-priority-card__top {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}
.reclamo-priority-card__meta-pill {
  font-size: 0.72rem;
  font-weight: 700;
  color: #1e293b;
  border: 1px solid #dbe3ef;
  border-radius: 999px;
  padding: 2px 6px;
  text-align: center;
  background: #f8fafc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.reclamo-priority-card__address {
  font-size: 0.84rem;
  font-weight: 700;
  line-height: 1.2;
  color: #0f172a;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 6px 8px;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.reclamo-priority-card__people {
  display: grid;
  grid-template-columns: 1fr;
  gap: 4px;
}
.reclamo-priority-card__person-line {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 6px;
  align-items: center;
  min-width: 0;
}
.reclamo-priority-card__label-inline {
  font-size: 0.66rem;
  font-weight: 700;
  color: #0f766e;
  text-transform: uppercase;
}
.reclamo-priority-card__value-inline {
  font-size: 0.78rem;
  font-weight: 700;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.reclamo-priority-card__value-inline--multiline {
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
  word-break: break-word;
}
@media (max-width: 600px) {
  .conexion-priority-card {
    padding: 7px;
    gap: 5px;
  }
  .conexion-priority-card__meta-pill {
    font-size: 0.68rem;
    padding: 2px 5px;
  }
  .conexion-priority-card__address {
    font-size: 0.8rem;
  }
  .reclamo-priority-card {
    padding: 7px;
    gap: 5px;
  }
  .reclamo-priority-card__meta-pill {
    font-size: 0.68rem;
    padding: 2px 5px;
  }
  .reclamo-priority-card__address {
    font-size: 0.8rem;
  }
}
.conexion-card {
  border-radius: 14px;
  border: 1px solid #99d9cf;
  box-shadow: 0 4px 12px rgba(15, 118, 110, 0.12) !important;
  overflow: hidden;
}
.conexion-card :deep(.v-card-title) {
  font-size: 1.02rem;
  line-height: 1.2;
  font-weight: 600;
  padding: 10px 12px 0 !important;
}
.conexion-card :deep(.v-card-subtitle) {
  font-size: 0.8rem;
  line-height: 1.2;
  opacity: 0.85;
  padding: 2px 12px 4px !important;
}
.conexion-card__body {
  padding: 4px 8px 8px;
}
.conexion-card__panel {
  border-radius: 12px;
  padding: 7px;
  border: 1px solid #caebe5;
  background: #ffffff;
  box-shadow: inset 0 0 0 1px #eef8f6;
}
.conexion-card__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
}
.conexion-card__field {
  border: 1px solid #d7efea;
  border-radius: 10px;
  background: linear-gradient(180deg, #f9fffe 0%, #f1fbf9 100%);
  padding: 6px 8px;
}
.conexion-card__label {
  font-size: 0.6rem;
  font-weight: 700;
  color: #0f766ecc;
  line-height: 1.15;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}
.conexion-card__value {
  margin-top: 2px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
  word-break: break-word;
}
.conexion-card__value--inline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.conexion-card__mini-tag {
  font-size: 0.56rem;
  line-height: 1;
  padding: 2px 5px;
  border-radius: 999px;
  color: #0f766e;
  background: #def7f3;
  border: 1px solid #a8ddd4;
  white-space: nowrap;
}
@media (min-width: 600px) {
  .conexion-card__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .conexion-card__field--full {
    grid-column: 1 / -1;
  }
}
.flow-step-unassigned :deep(.v-label.v-field-label) {
  color: #c62828 !important;
  font-weight: 600;
}
</style>
