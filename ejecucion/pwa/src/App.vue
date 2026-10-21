<template>
  <v-app>
    <v-app-bar app :elevation="1">
      <v-toolbar-title class="app-title font-weight-black pl-4">
        SAN PABLO
      </v-toolbar-title>

      <v-spacer />

      <!-- Versión a la derecha -->
      <span class="app-version mr-2">
        v{{ version }}
      </span>

      <!-- Botón Manuales Operativos -->
      <v-btn icon @click="abrirManualOperador" class="mr-1" size="small" title="Manual del Operador en Terreno">
        <v-icon color="amber-darken-2">mdi-book-open-page-variant</v-icon>
      </v-btn>

      <!-- Theme Toggle -->
      <v-btn icon @click="toggleTheme" class="mr-4" size="small">
        <v-icon>{{ currentTheme === 'dark' ? 'mdi-white-balance-sunny' : 'mdi-weather-night' }}</v-icon>
      </v-btn>
    </v-app-bar>

    <!-- 🔴 Banner de estado de conexión -->
    <v-alert v-if="!isOnline" type="warning" variant="tonal" density="compact" class="mb-4 py-4 alerta-offline">
      Estás sin conexión. Algunos cambios se enviarán cuando vuelvas a estar online.
    </v-alert>

    <!-- ⚠️ Banner permanente de Marcha Blanca Finalizada / Ambiente DEV -->
    <v-banner
      v-if="esAmbienteDev"
      color="amber-darken-3"
      lines="two"
      density="comfortable"
      elevation="2"
      class="bg-amber-darken-4 text-white"
    >
      <template #prepend>
        <v-icon icon="mdi-alert-decagram" color="white" size="large"></v-icon>
      </template>
      <v-banner-text class="font-weight-medium text-body-2 text-white">
        <strong>Ambiente de Pruebas:</strong> La marcha blanca ha finalizado. Para registrar operaciones oficiales ingresa a la app de Producción.
      </v-banner-text>
      <template #actions>
        <v-btn
          color="white"
          variant="flat"
          class="text-amber-darken-4 font-weight-black text-none"
          size="small"
          prepend-icon="mdi-rocket-launch"
          @click="irAProduccion"
        >
          Ir a Producción Oficial ➔
        </v-btn>
      </template>
    </v-banner>

    <v-main>
      <router-view />
    </v-main>

    <!-- 📱 Barra de Navegación Inferior Fija (Apple iOS Native Tab Bar) -->
    <v-bottom-navigation
      v-if="estaLogueado"
      grow
      class="ios-tab-bar pb-safe"
      elevation="0"
    >
      <v-btn to="/surveys" value="surveys" class="ios-tab-btn">
        <v-badge :content="fmt(counts.calidad)" :model-value="counts.calidad > 0" color="error" floating>
          <v-icon size="22">mdi-view-dashboard-outline</v-icon>
        </v-badge>
        <span class="ios-tab-label">Operación</span>
      </v-btn>

      <v-btn to="/firmas" value="firmas" class="ios-tab-btn">
        <v-badge :content="fmt(counts.documentos)" :model-value="counts.documentos > 0" color="error" floating>
          <v-icon size="22">mdi-file-sign</v-icon>
        </v-badge>
        <span class="ios-tab-label">Firmas</span>
      </v-btn>

      <v-btn to="/taller" value="taller" class="ios-tab-btn">
        <v-icon size="22" color="amber-darken-2">mdi-wrench-clock</v-icon>
        <span class="ios-tab-label">Taller</span>
      </v-btn>

      <!-- Bodega / Pañol WMS para perfiles autorizados (Bodega / Taller / Admin) -->
      <v-btn v-if="esBodegaOTaller" to="/bodega" value="bodega" class="ios-tab-btn">
        <v-icon size="22" color="amber-darken-2">mdi-warehouse</v-icon>
        <span class="ios-tab-label">Bodega</span>
      </v-btn>

      <!-- Cotizador solo para perfiles autorizados (Comercial / Admin) -->
      <v-btn v-if="esAdminOComercial" to="/cotizador-express" value="cotizador" class="ios-tab-btn">
        <v-icon size="22" color="amber-darken-2">mdi-calculator-variant-outline</v-icon>
        <span class="ios-tab-label">Cotizador</span>
      </v-btn>

      <v-btn id="perfil-btn" value="perfil" class="ios-tab-btn">
        <v-icon size="22">mdi-account-circle-outline</v-icon>
        <span class="ios-tab-label">Mi Perfil</span>

        <v-menu activator="#perfil-btn" location="top end">
          <v-card min-width="260" class="d-flex flex-column rounded-2xl border border-white/10 shadow-xl">
            <v-card-title class="py-3">
              <div class="text-subtitle-1 font-weight-bold">
                {{ userName || 'Usuario' }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ userDetailStore.userDetail?.email || userDetailStore.userDetail?.codi_user }}
              </div>
            </v-card-title>
            <v-divider />
            <v-card-text class="py-3">
              <div class="text-caption text-medium-emphasis mb-1">Roles Asignados</div>
              <div v-if="userRolesList.length">
                <v-chip v-for="(rol, idx) in userRolesList" :key="idx" size="small" class="ma-1" color="primary" variant="outlined">
                  {{ rol.name_rol }}
                </v-chip>
              </div>
              <div v-else class="text-caption text-medium-emphasis">Sin roles asignados</div>
            </v-card-text>
            <v-divider />
            <v-card-text class="py-2">
              <div class="text-caption text-medium-emphasis mb-2 font-weight-bold">Documentación Oficial</div>
              <v-btn
                variant="tonal"
                color="amber-darken-3"
                size="small"
                class="w-100 mb-2 text-none font-weight-bold"
                prepend-icon="mdi-book-open-page-variant"
                @click="abrirManualOperador"
              >
                Manual Operador en Terreno
              </v-btn>
              <v-btn
                variant="tonal"
                color="blue-darken-2"
                size="small"
                class="w-100 text-none font-weight-bold"
                prepend-icon="mdi-file-document-check"
                @click="abrirManualPlataformas"
              >
                Manual Plataformas 360°
              </v-btn>
            </v-card-text>
            <v-divider />
            <v-card-actions class="py-2">
              <v-btn variant="text" color="red-lighten-2" prepend-icon="mdi-logout" class="text-capitalize w-100 font-bold" @click="logout">
                Cerrar sesión
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>
      </v-btn>
    </v-bottom-navigation>
  </v-app>
</template>

<script setup>
import { ref, provide, watchEffect, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import packageJson from '../package.json'

const version = ref(packageJson.version || '1.1.9')
import apiAxios from '@/services/api'

import useProfileStore from '@/store/profile.js'
import { useUserDetailStore } from '@/store/userDetail'
import { useApiWatcher } from '@/useApiWatcher.js'
import { useNetworkStatus } from '@/composables/useNetworkStatus'
import { verificarEsAdminOComercial } from '@/composables/usePermisosCotizador'

/* eslint-disable */

/* ---------- stores y router ---------- */
const route = useRoute()
const router = useRouter()
const profileStore = useProfileStore()
const userDetailStore = useUserDetailStore()
// TRANSAMAC_REMOVE_CONEXION_20260428: oculta menus y redirecciones CNX/vehiculos.
// Volver a false para restaurar la navegacion CNX.
const DISABLE_CNX_SURFACES = true

/* ---------- estado online/offline ---------- */
const { isOnline } = useNetworkStatus()

/* ---------- layout / estado general ---------- */
const drawer = ref(false)
const message = ref(1)
provide('global-puerto', message)

/* ---------- IndexedDB (igual que antes) ---------- */
const indexedDB = window.indexedDB
const conexion = indexedDB.open('TransmacSST', 1)

const roles = ref([]);
const rolesNombres = ref([]);

let db

conexion.onsuccess = () => {
  db = conexion.result
  console.log('Base de Datos abierta', db)
}

conexion.onupgradeneeded = (e) => {
  console.log(e)
  db = conexion.result
  console.log('Base de Datos creada', db)

  db.createObjectStore('Lotes', {
    keyPath: 'NUMERO_LOTE'
  })
  db.createObjectStore('LotesDetalles', {
    keyPath: 'NUMERO_LOTE'
  })
  db.createObjectStore('Inspecciones', {
    keyPath: 'numeroLote'
  })
}

conexion.onerror = (error) => {
  console.log('Error', error)
}

const estaLogueado = computed(() => {
  return !!userDetailStore.userDetail?.id_user
})

/* ---------- Axios instance para watcher ---------- */
const api = apiAxios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL,
  timeout: 10000
})

const currentTheme = ref('dark')

const applyTheme = (theme) => {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

const toggleTheme = () => {
  const next = currentTheme.value === 'light' ? 'dark' : 'light'
  currentTheme.value = next
  localStorage.setItem('theme', next)
  applyTheme(next)
}

onMounted(async () => {
  const saved = localStorage.getItem('theme') || 'dark'
  currentTheme.value = saved
  applyTheme(saved)
  await Promise.all([obtenerUsuariosRoles(), obtenerRoles()])
})

/* ---------- Notificaciones / counts ---------- */
const counts = reactive({
  calidad: 0,
  documentos: 0,
  enrolamiento: 0,
  medioAmbiente: 0
})

const AREA_ID_TO_KEY = {
  1: 'calidad',
  2: 'seguridad',
  3: 'medioAmbiente',
  4: 'enrolamiento',
  6: 'documentos'
}

function aplicarCountsDesdeNotifs(notifs) {
  counts.calidad = counts.documentos = counts.enrolamiento = counts.medioAmbiente = 0
  for (const n of (notifs || [])) {
    const idArea = Number(n?.json_data?.id_area)
    const key = AREA_ID_TO_KEY[idArea]
    if (key) counts[key]++
  }
}

/* ---------- useApiWatcher para notificaciones ---------- */
const watcher = useApiWatcher({
  url: '/servicio/leanglobal/obtenerNortificaciones',
  method: 'get',
  params: { id_user_target: userDetailStore.userDetail?.id_user },
  axiosInstance: api,
  intervalMs: 10000,
  maxIntervalMs: 60000,
  backoffFactor: 2,
  immediate: true
})

watchEffect(() => {
  const snap = watcher.data.value

  if (snap?.counts) {
    counts.calidad = Number(snap.counts.calidad || 0)
    counts.documentos = Number(snap.counts.documentos || 0)
    counts.enrolamiento = Number(snap.counts.enrolamiento || 0)
    counts.medioAmbiente = Number(snap.counts.medioAmbiente || 0)
  } else if (Array.isArray(snap)) {
    aplicarCountsDesdeNotifs(snap)
  }
})

/* ---------- helpers ---------- */
function isActiveRoute(path) {
  return route.path === path
}

const fmt = (n) => (n > 99 ? '99+' : String(n))

/* ---------- ambiente DEV / Fin de Marcha Blanca ---------- */
const esAmbienteDev = computed(() => {
  if (typeof window !== 'undefined') {
    const path = window.location.pathname || ''
    if (path.startsWith('/pwa-gsp-prod') || path.startsWith('/lg-gsp-prod')) {
      return false
    }
    if (path.startsWith('/pwa-gsp-dev') || path.startsWith('/lg-gsp-dev')) {
      return true
    }
  }
  return process.env.VUE_APP_BASE_URL === '/pwa-gsp-dev/'
})

const irAProduccion = () => {
  window.location.href = 'https://servidor.leanglobal.cl/pwa-gsp-prod/'
}

const esSup = computed(() => {
  const u = userDetailStore.userDetail
  const roles = u?.usuarioRoles
  if (!Array.isArray(roles)) return false
  return roles.some(r =>
    typeof r === 'number'
      ? r === 11
      : r?.id_rol === 11 && (r?.id_user ?? u?.id_user) === u?.id_user
  )
})

/* ---------- usuario + roles para el menú ---------- */
const userName = computed(() => {
  const u = userDetailStore.userDetail || {}
  const nombre = `${u.name_frst ?? ''} ${u.apellido_pat ?? ''}`.trim()
  return nombre || u.codi_user || u.email || ''
})

const obtenerUsuariosRoles = async () => {
  try {
    const { data } = await apiAxios.get(
      '/servicio/leanglobal/obtenerUsuariosRoles'
    )
    roles.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('roles error:', e)
    roles.value = []
  }
}

const obtenerRoles = async () => {
  try {
    const { data } = await apiAxios.get(
      '/servicio/leanglobal/obtenerRoles'
    )
    rolesNombres.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('roles error:', e)
    rolesNombres.value = []
  }
}

// Mapa rápido: id_rol => { id_rol, name_rol, description }
const rolesMap = computed(() => {
  const map = new Map()
  for (const r of rolesNombres.value) {
    if (r?.id_rol != null) {
      map.set(String(r.id_rol), r)
    }
  }
  return map
})

// Lista de roles del usuario actual, con nombre y descripción
const userRolesList = computed(() => {
  const u = userDetailStore.userDetail
  const idUser = u?.id_user

  if (!idUser || !Array.isArray(roles.value)) return []

  // Filtramos los roles que corresponden al usuario actual
  const rolesUsuario = roles.value.filter(r =>
    String(r.id_user) === String(idUser)
  )

  const list = rolesUsuario
    .map(r => {
      const meta = rolesMap.value.get(String(r.id_rol))

      if (meta) {
        return {
          id_rol: meta.id_rol,
          name_rol: meta.name_rol,
          description: meta.description
        }
      }

      // Fallback por si el backend algún día trae name_rol directo en esta tabla
      if (r.name_rol || r.description) {
        return {
          id_rol: r.id_rol,
          name_rol: r.name_rol || `Rol ${r.id_rol ?? '?'}`,
          description: r.description || ''
        }
      }

      return {
        id_rol: r.id_rol,
        name_rol: `Rol ${r.id_rol ?? '?'}`,
        description: ''
      }
    })
    .filter(Boolean)

  // Evitar duplicados por id_rol
  const unique = new Map()
  for (const rol of list) {
    unique.set(String(rol.id_rol), rol)
  }

  return Array.from(unique.values())
})

const esAdminOComercial = computed(() => {
  return verificarEsAdminOComercial(userRolesList.value)
})

const esBodegaOTaller = computed(() => {
  const roles = userRolesList.value || []
  return roles.some(r => {
    const name = String(r.name_rol || '').toUpperCase()
    return name.includes('ADMIN') || name.includes('BODEGA') || name.includes('TALLER') || name.includes('PAÑOL')
  })
})

const hasCnxRole = computed(() => {
  return !DISABLE_CNX_SURFACES && false
})

watch(
  [hasCnxRole, () => route.path, estaLogueado],
  async () => {
    if (DISABLE_CNX_SURFACES) return
  },
  { immediate: true }
)

const abrirManualOperador = () => {
  const isDev = window.location.pathname.includes('-dev') || window.location.port === '8085'
  const prefix = isDev ? '/lg-gsp-dev' : '/lg-gsp-prod'
  const origin = window.location.port === '8085' ? 'http://localhost:5173' : window.location.origin
  window.open(`${origin}${prefix}/manual_operador_terreno_gsp.html`, '_blank')
}

const abrirManualPlataformas = () => {
  const isDev = window.location.pathname.includes('-dev') || window.location.port === '8085'
  const prefix = isDev ? '/lg-gsp-dev' : '/lg-gsp-prod'
  const origin = window.location.port === '8085' ? 'http://localhost:5173' : window.location.origin
  window.open(`${origin}${prefix}/manual_entrega_y_retorno_plataformas_bsm.html`, '_blank')
}

const logout = () => {
  // Limpia autenticación sin tocar datos offline de inspecciones
  localStorage.removeItem('token')
  sessionStorage.removeItem('token')
  localStorage.removeItem('perfil')
  localStorage.removeItem('rolesIds')
  localStorage.removeItem('rolesNames')
  localStorage.removeItem('isLogin')
  localStorage.removeItem('hasRole13')
  localStorage.removeItem('isExternalCompany')
  localStorage.removeItem('userDetail')

  userDetailStore.userDetail = null
  drawer.value = false

  router.replace({ path: '/login' })
}

</script>

<style scoped>
.v-navigation-drawer {
  padding-top: 10px;
}

.v-navigation-drawer :deep(.v-list-item--active) {
  background: rgba(0, 59, 150, 0.08) !important;
  border: 1px solid rgba(0, 59, 150, 0.28) !important;
  border-left: 4px solid #003B96 !important;
  color: #003B96 !important;
}

.v-navigation-drawer :deep(.v-list-item--active .v-icon),
.v-navigation-drawer :deep(.v-list-item--active .v-list-item-title) {
  color: #003B96 !important;
}

.v-navigation-drawer :deep(.v-list-item--active .v-list-item__overlay) {
  opacity: 0 !important;
}

:deep(.dark) .v-navigation-drawer :deep(.v-list-item--active) {
  background: rgba(16, 185, 129, 0.18) !important;
  border: 1px solid rgba(16, 185, 129, 0.78) !important;
  border-left: 4px solid #10b981 !important;
  color: #6ee7b7 !important;
}

:deep(.dark) .v-navigation-drawer :deep(.v-list-item--active .v-icon),
:deep(.dark) .v-navigation-drawer :deep(.v-list-item--active .v-list-item-title) {
  color: #6ee7b7 !important;
}

.user-menu-activator {
  cursor: pointer;
  border-radius: 999px;
  padding: 4px 8px;
  transition: background-color 0.15s ease-in-out;
}

.user-menu-activator:hover {
  background-color: rgba(255, 255, 255, 0.12);
}

.app-title {
  white-space: nowrap;
}

.app-version {
  font-size: 0.75rem;
  opacity: 0.8;
  white-space: nowrap;
}

.alerta-offline {
  margin-top: 100px !important;
}

/* =========================================================================
 * 🍏 APPLE iOS NATIVE TAB BAR STYLES
 * ========================================================================= */
.ios-tab-bar {
  background: rgba(255, 255, 255, 0.88) !important;
  backdrop-filter: blur(20px) !important;
  -webkit-backdrop-filter: blur(20px) !important;
  border-top: 1px solid rgba(0, 0, 0, 0.08) !important;
  height: 60px !important;
}

:deep(.v-theme--dark) .ios-tab-bar,
.dark .ios-tab-bar {
  background: rgba(24, 24, 27, 0.88) !important;
  border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
}

.ios-tab-btn {
  letter-spacing: -0.2px !important;
  min-width: 64px !important;
  opacity: 0.65;
  transition: opacity 0.2s ease, transform 0.15s ease;
}

.ios-tab-btn:hover {
  opacity: 0.9;
}

.ios-tab-btn.v-btn--active {
  opacity: 1 !important;
  color: #007AFF !important;
}

:deep(.ios-tab-btn.v-btn--active .v-icon) {
  color: #007AFF !important;
}

.ios-tab-label {
  display: block !important;
  font-size: 11px !important;
  font-weight: 600 !important;
  line-height: 1.2 !important;
  margin-top: 2px !important;
}
</style>
