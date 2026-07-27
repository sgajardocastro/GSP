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

      <!-- Theme Toggle -->
      <v-btn icon @click="toggleTheme" class="mr-4" size="small">
        <v-icon>{{ currentTheme === 'dark' ? 'mdi-white-balance-sunny' : 'mdi-weather-night' }}</v-icon>
      </v-btn>
    </v-app-bar>

    <!-- 🔴 Banner de estado de conexión -->
    <v-alert v-if="!isOnline" type="warning" variant="tonal" density="compact" class="mb-4 py-4 alerta-offline">
      Estás sin conexión. Algunos cambios se enviarán cuando vuelvas a estar online.
    </v-alert>

    <v-main>
      <router-view />
    </v-main>

    <!-- 📱 Barra de Navegación Inferior Fija (Estilo App Nativa) -->
    <v-bottom-navigation
      v-if="estaLogueado"
      grow
      color="primary"
      class="pb-safe"
      elevation="4"
      mode="shift"
    >
      <v-btn to="/surveys" value="surveys">
        <v-badge :content="fmt(counts.calidad)" :model-value="counts.calidad > 0" color="error" floating>
          <v-icon>mdi-clipboard-text-multiple</v-icon>
        </v-badge>
        <span class="text-caption font-weight-bold">Inspecciones</span>
      </v-btn>

      <v-btn to="/firmas" value="firmas">
        <v-badge :content="fmt(counts.documentos)" :model-value="counts.documentos > 0" color="error" floating>
          <v-icon>mdi-signature-freehand</v-icon>
        </v-badge>
        <span class="text-caption font-weight-bold">Firmas</span>
      </v-btn>

      <v-btn id="perfil-btn" value="perfil">
        <v-icon>mdi-account-circle</v-icon>
        <span class="text-caption font-weight-bold">Mi Perfil</span>

        <v-menu activator="#perfil-btn" location="top end">
          <v-card min-width="260" class="d-flex flex-column rounded-xl border border-white/5">
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
              <div class="text-caption text-medium-emphasis mb-1">Roles</div>
              <div v-if="userRolesList.length">
                <v-chip v-for="(rol, idx) in userRolesList" :key="idx" size="small" class="ma-1" color="primary" variant="outlined">
                  {{ rol.name_rol }}
                </v-chip>
              </div>
              <div v-else class="text-caption text-medium-emphasis">Sin roles asignados</div>
            </v-card-text>
            <v-divider />
            <v-card-actions class="py-2">
              <v-btn variant="text" color="red-lighten-2" prepend-icon="mdi-logout" class="text-capitalize w-100" @click="logout">
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
</style>
