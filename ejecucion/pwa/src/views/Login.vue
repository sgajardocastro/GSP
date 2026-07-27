<template>
  <div class="login-page relative">
    <!-- Theme Toggle at Top Right -->
    <div style="position: absolute; top: 16px; right: 16px; z-index: 20;">
      <v-btn icon @click="toggleTheme" size="small" variant="tonal" class="bg-card">
        <v-icon>{{ currentTheme === 'dark' ? 'mdi-white-balance-sunny' : 'mdi-weather-night' }}</v-icon>
      </v-btn>
    </div>

    <v-img
      class="mx-auto my-6"
      max-width="240"
      :src="logoUrl"
    ></v-img>

    <v-card
      class="mx-auto pa-8 pb-8 login-card"
      elevation="0"
      max-width="448"
      rounded="lg"
    >
      <h1 class="mb-4 login-title">Acceso</h1>

      <!-- Avisos según estado de conexión -->
      <v-alert
        v-if="!isOnline && !tieneSesionLocal"
        type="warning"
        variant="tonal"
        density="compact"
        class="mb-4"
      >
        Estás sin conexión a internet.
        Para iniciar sesión por primera vez necesitas estar conectado.
      </v-alert>

      <v-alert
        v-else-if="!isOnline && tieneSesionLocal"
        type="info"
        variant="tonal"
        density="compact"
        class="mb-4"
      >
        Estás sin conexión, pero ya tienes una sesión guardada.
        Puedes seguir usando la app con los datos locales.
      </v-alert>

      <!-- Bloque Login -->
      <div class="login-section">
      <v-form @submit.prevent="login">
        <div class="text-subtitle-1 text-medium-emphasis">
          Usuario / Email *
        </div>

        <v-text-field
          v-model="username"
          density="compact"
          placeholder="Ingresar Usuario"
          variant="outlined"
          autocomplete="username"
          hide-details="auto"
          :disabled="!isOnline && !tieneSesionLocal"
        ></v-text-field>

        <div
          class="text-subtitle-1 text-medium-emphasis d-flex align-center justify-space-between mt-4"
        >
          Contraseña *
        </div>

        <v-text-field
          v-model="password"
          :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
          :type="visible ? 'text' : 'password'"
          density="compact"
          placeholder="Ingresar Contraseña"
          variant="outlined"
          autocomplete="current-password"
          hide-details="auto"
          @click:append-inner="visible = !visible"
          :disabled="!isOnline && !tieneSesionLocal"
        ></v-text-field>

        <v-btn
          block
          color="#2A3C67"
          class="mt-4 mb-4 access-btn"
          size="large"
          type="submit"
          :disabled="(!isOnline && !tieneSesionLocal) || !username || (!password && !esLoginBypass)"
        >
          Acceder
        </v-btn>
      </v-form>

      <div class="d-flex justify-center google-login-wrapper">
        <div ref="googleBtnRef"></div>
      </div>
      </div>

      <!-- Bloque Descarga deshabilitado temporalmente
      <div class="download-section">
        <div class="text-center text-caption text-medium-emphasis">
          Continua con la web o descarga la App de Terracon
        </div>

        <div class="mt-3 d-flex justify-center">
          <v-btn
            :href="apkUrl"
            target="_blank"
            rel="noopener"
            variant="flat"
            color="#f59e0b"
            class="download-btn"
            prepend-icon="mdi-download"
          >
            Descagar App
          </v-btn>
        </div>
      </div>
      -->
    </v-card>
  </div>
  <v-dialog v-model="dialogSync" width="auto">
    <v-card>
      <v-card-text class="text-center py-6">
        <v-progress-circular indeterminate color="primary" />
        <div class="mt-4">
          Sincronizando datos para uso offline...
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useNetworkStatus } from '@/composables/useNetworkStatus'
import { useRouter } from 'vue-router'
import apiAxios from '@/services/api'
import { useUserDetailStore } from '@/store/userDetail'
import useProfileStore from '@/store/profile'

/* eslint-disable */
const userDetailStore = useUserDetailStore()
const profileStore = useProfileStore()

const router = useRouter()
const logoUrl = `${process.env.BASE_URL || '/'}img/logo_gsp.png`
const username = ref('')
const password = ref('')
const visible = ref(false)
const JWT = ref('')
const usuariosRoles = ref(null)
const googleBtnRef = ref(null)
const dialogSync = ref(false) // 🔹 nuevo

const { isOnline } = useNetworkStatus()
const apkFile = 'app-release-signed-2.0.22.apk'
const apkUrl = `${process.env.BASE_URL}${apkFile}`
const BYPASS_LOGIN_EMAILS = [
  'MauricioOCavieresR@gmail.com',
  'sgajardoc@gmail.com'
]
const DEFAULT_BYPASS_LOGIN_EMAIL = BYPASS_LOGIN_EMAILS[0]
const BYPASS_USER_ID = 1

// 👉 Detectamos si ya hay sesión local (userDetailStore o localStorage)
const tieneSesionLocal = computed(() => {
  return !!userDetailStore.userDetail?.id_user
})

const esLoginBypass = computed(() => {
  const email = String(username.value || '').trim().toLowerCase()
  return BYPASS_LOGIN_EMAILS.some((allowedEmail) => allowedEmail.toLowerCase() === email)
})

const GOOGLE_CLIENT_ID = process.env.VUE_APP_GOOGLE_CLIENT_ID || '377216762278-t19n05j9jkksqbufafs9j5pa474mu14e.apps.googleusercontent.com'

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

  // Si ya hay sesión guardada y estamos offline, entramos directo
  if (!isOnline.value && tieneSesionLocal.value) {
    console.log('[PWA] Offline con sesión válida, entrando directo...')
    router.replace({ name: 'surveys' })
    return
  }

  await obtenerUsuariosRoles()
  initGoogleIdentity()
})

async function obtenerUsuariosRoles() {
  const url = '/servicio/leanglobal/obtenerUsuariosRoles'
  try {
    const response = await apiAxios.get(url)
    usuariosRoles.value = response.data
  } catch (error) {
    console.error('❌ Error al obtener usuariosRoles:', error?.response || error)
  }
}

function normalizeRut (input) {
  const r = String(input || '').trim()
  if (!r) return ''
  let out = r.replace(/\./g, '').replace(/\s+/g, '')
  out = out.replace(/k$/i, 'K')
  return out
}

function normalizeText (value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()
}

function getCargoFromUser (user) {
  let jsonData = user?.json_data
  if (typeof jsonData === 'string') {
    try {
      jsonData = JSON.parse(jsonData)
    } catch {
      jsonData = null
    }
  }

  return String(
    jsonData?.cargo ??
    user?.cargo_ext ??
    user?.cargo ??
    ''
  ).trim()
}

function isLikelyRut (input) {
  const rut = normalizeRut(input)
  return /^[0-9]+-?[0-9K]$/.test(rut)
}

async function getEmailByRut (rutRaw) {
  const rutNorm = normalizeRut(rutRaw)
  if (!rutNorm) return ''
  try {
    const resp = await apiAxios.get(`/usuarios/mail-rut/${encodeURIComponent(rutNorm)}`)
    return resp.data?.data?.email || resp.data?.email || ''
  } catch (error) {
    console.warn('[PWA] No se pudo resolver email por RUT:', error?.response?.status || error?.message)
    return ''
  }
}

function decodeEmailFromGoogleCredential (credential) {
  try {
    const base64Url = String(credential || '').split('.')[1]
    if (!base64Url) return ''
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)?.email || ''
  } catch (e) {
    console.error('[PWA] Error al decodificar credential de Google:', e)
    return ''
  }
}

async function loginGoogleBackend (idToken) {
  try {
    const res = await apiAxios.post('/auth/login-google', { token: idToken })
    if (res?.data?.token) return res
  } catch (e) {
    console.warn('[PWA] Fallback login Google endpoint 1:', e?.response?.status || e?.message)
  }

  return apiAxios.post('/auth/google/login', { id_token: idToken })
}

async function resolveAuthIdentifier (rawInput, loginData) {
  const fromBackend = loginData?.user?.email || loginData?.email || ''
  if (fromBackend) return fromBackend

  const value = String(rawInput || '').trim()
  if (!value) return ''
  if (value.includes('@')) return value

  if (isLikelyRut(value)) {
    const emailByRut = await getEmailByRut(value)
    if (emailByRut) return emailByRut
  }

  return value
}

// --- GOOGLE GIS ---

function initGoogleIdentity() {
  const initGIS = () => {
    // eslint-disable-next-line no-undef
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
      auto_select: false,
      cancel_on_tap_outside: true
    })

    if (googleBtnRef.value) {
      // eslint-disable-next-line no-undef
      google.accounts.id.renderButton(googleBtnRef.value, {
        type: 'standard',
        shape: 'rectangular',
        theme: 'outline',
        text: 'continue_with',
        size: 'large',
        logo_alignment: 'left',
      })
    }
    // Si quisieras One Tap:
    // google.accounts.id.prompt()
  }

  const waitForGIS = () => {
    if (window.google?.accounts?.id) {
      initGIS()
    } else {
      setTimeout(waitForGIS, 100)
    }
  }

  waitForGIS()
}

// Opcional: botón custom para lanzar One Tap (si luego lo agregas en el template)
function loginWithGoogle() {
  if (!window.google?.accounts?.id) return
  // eslint-disable-next-line no-undef
  google.accounts.id.prompt()
}

// Respuesta de Google (ID Token en response.credential)
async function handleGoogleCredential(response) {
  try {
    console.log('[GOOGLE PWA] Credential recibida:', response)

    if (!response || !response.credential) {
      console.warn('[GOOGLE PWA] No se recibió response.credential')
      return
    }

    // 1) Enviar SOLO el ID Token al backend
    const idToken = response.credential

    const loginResponse = await loginGoogleBackend(idToken)

    // Guardamos token y datos básicos
    localStorage.setItem('token', loginResponse.data.token)
    JWT.value = loginResponse.data.token

    const emailFromGoogle = await resolveAuthIdentifier(
      decodeEmailFromGoogleCredential(idToken),
      loginResponse.data
    )
    await authorization(emailFromGoogle || username.value)

    // 🔹 Igual que arriba, precalentar cache
    await sincronizarDatosIniciales()

    router.push({ name: 'surveys' })
  } catch (error) {
    console.error('❌ Error en login con Google (PWA):', error?.response || error)
  }
}

// --- LOGIN NORMAL (POP3 vía backend) ---
async function login() {
  // Si estoy offline y NO tengo sesión → no puedo validar
  if (!isOnline.value && !tieneSesionLocal.value) {
    console.warn('Intento de login sin conexión y sin sesión previa')
    return
  }

  // Si estoy offline pero tengo sesión → entro directo
  if (!isOnline.value && tieneSesionLocal.value) {
    console.log('[PWA] Offline con sesión válida, entrando sin validar...')
    router.replace({ name: 'surveys' })
    return
  }

  if (esLoginBypass.value) {
    await loginBypassTransmac()
    return
  }

  // 👇 Aquí login normal online
  try {
    const response = await apiAxios.post(
      '/auth/login-email',
      {
        email: username.value,
        password: password.value
      }
    )

    localStorage.setItem('token', response.data.token)
    JWT.value = response.data.token

    const authIdentifier = await resolveAuthIdentifier(username.value, response.data)
    await authorization(authIdentifier || username.value)   // aquí se rellena userDetailStore.userDetail
    
    // 🔹 Precalentamos cache de APIs importantes
    await sincronizarDatosIniciales()

    router.push({ name: 'surveys' })
  } catch (error) {
    console.error('❌ Error en login:', error?.response || error)
  }
}

function normalizarListaUsuarios(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.datos)) return data.datos
  if (Array.isArray(data?.data)) return data.data
  if (data && typeof data === 'object') return [data]
  return []
}

async function obtenerUsuarioById(idUser) {
  try {
    const response = await apiAxios.get('/servicio/leanglobal/obtenerUsuarios', {
      params: { id_user: idUser }
    })
    const usuario = normalizarListaUsuarios(response.data)
      .find(u => Number(u?.id_user) === Number(idUser))

    if (usuario) return usuario
  } catch (error) {
    console.warn('[PWA] No se pudo obtener usuario por id_user, se intenta catalogo completo:', error?.response || error)
  }

  const response = await apiAxios.get('/servicio/leanglobal/obtenerUsuarios')
  const usuario = normalizarListaUsuarios(response.data)
    .find(u => Number(u?.id_user) === Number(idUser))

  if (!usuario) {
    throw new Error(`No se encontro el usuario id_user ${idUser}`)
  }

  return usuario
}

async function obtenerUsuarioByEmail(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase()
  if (!normalizedEmail) return null

  const response = await apiAxios.get('/servicio/leanglobal/obtenerUsuarios')
  return normalizarListaUsuarios(response.data)
    .find((u) => String(u?.email || u?.correo_user || '').trim().toLowerCase() === normalizedEmail) || null
}

function guardarSesionLocal(userData) {
  const fallbackEmail = String(userData?.email || userData?.correo_user || DEFAULT_BYPASS_LOGIN_EMAIL).trim()
  const perfil = {
    ID_USUARIO: userData?.id_user || BYPASS_USER_ID,
    CODI_USUARIO: userData?.rut_user || userData?.rut || fallbackEmail,
    NOMBRE_USUARIO: userData?.name_frst || userData?.nombre_user || userData?.nombre || '',
    RUT_USUARIO: userData?.rut_user || userData?.rut || '',
    TELEFONO_USUARIO: userData?.telefono_user || userData?.telefono || '',
    CELULAR_USUARIO: userData?.celular_user || userData?.celular || '',
    CORREO_USUARIO: fallbackEmail,
    ESTADO_USUARIO: userData?.estado_user || userData?.estado || 'A',
    USUARIO: fallbackEmail,
    NOMBRE: userData?.name_frst || userData?.nombre_user || userData?.nombre || '',
    APELLIDO_MATERNO: userData?.apellido_mat || userData?.apellido_materno || null,
    APELLIDO_PATERNO: userData?.apellido_pat || userData?.apellido_paterno || '',
    RUT: userData?.rut_user || userData?.rut || '',
    TELEFONO: userData?.telefono_user || userData?.telefono || '',
    CELULAR: userData?.celular_user || userData?.celular || '',
    CORREO: fallbackEmail,
    ID_ROL: userData?.id_rol || 0,
    NOMBRE_ROL: userData?.nombre_rol || '',
    CODI_GRUPO_BASE_ROL: userData?.codi_grupo_base_rol || null,
    ID_PERFIL: userData?.id_perfil || 0,
    CODI_GRUPO_BASE_PERFIL: userData?.codi_grupo_base_perfil || ' ',
    NOMBRE_PERFIL: userData?.nombre_perfil || 'TRANSMAC',
    ESTADO: userData?.estado || userData?.estado_user || 'A',
    ID_EMPRESA: userData?.id_empresa || 0,
    NOMBRE_EMPRESA: userData?.nombre_empresa || '',
    ID_AREA: userData?.id_area || 0,
    NOMBRE_AREA: userData?.nombre_area || '',
    PASSWORD_USUARIO: '',
    PASSWORD: '',
    OBSERVACION_USUARIO: userData?.observacion_user || null,
    auth: true,
    lastLogIn: new Date().toISOString()
  }

  profileStore.auth = true
  localStorage.setItem('perfil', JSON.stringify(perfil))
}

async function loginBypassTransmac() {
  try {
    if (!usuariosRoles.value) {
      await obtenerUsuariosRoles()
    }

    const emailIngresado = String(username.value || DEFAULT_BYPASS_LOGIN_EMAIL).trim()
    const user = await obtenerUsuarioByEmail(emailIngresado) || await obtenerUsuarioById(BYPASS_USER_ID)
    const userData = {
      ...user,
      email: user?.email || user?.correo_user || emailIngresado,
      usuarioRoles: usuariosRoles.value || []
    }

    userDetailStore.userDetail = userData
    guardarSesionLocal(userData)

    await sincronizarDatosIniciales()

    router.push({ name: 'surveys' })
  } catch (error) {
    console.error('❌ Error en bypass Transmac:', error?.response || error)
  }
}

async function authorization(emailParam) {
  if (!JWT.value) {
    console.warn('⚠️ No hay token en PWA')
    return
  }
  try {
    const response = await apiAxios.post(
      '/auth/users/email',
      { email: emailParam || username.value }
    )

    const user = Array.isArray(response.data) ? response.data[0] : response.data

    const userData = {
      ...user,
      usuarioRoles: usuariosRoles.value || []
    }

    userDetailStore.userDetail = userData   // 👈 basta esto, el plugin lo persiste
    guardarSesionLocal(userData)

    const cargo = getCargoFromUser(userData)
    if (normalizeText(cargo) === 'JEFE CUADRILLA') {
      console.log('[PWA][CargoDetect] Usuario con cargo JEFE CUADRILLA detectado', {
        id_user: userData?.id_user,
        email: userData?.email,
        cargo
      })
    }
  } catch (error) {
    console.error('❌ Error en autorización (PWA):', error?.response || error)
  }
}

async function sincronizarDatosIniciales () {
  // Sólo tiene sentido si estamos online
  if (!isOnline.value) return

  dialogSync.value = true

  try {
    const idUser = userDetailStore.userDetail?.id_user

    // 1) Primero disparamos en paralelo las APIs "grandes"
    const procesosReq = apiAxios.get(
      '/servicio/leanglobal/procesosSurveyV3'
    )

    const flujosReq = apiAxios.get(
      '/servicio/leanglobal/flujosAprobacion',
      {
        params: {
          fecha_desde: '',
          fecha_hasta: '',
          'ts.id_empresa_cliente': '',
          'ts.id_proyecto': ''
        }
      }
    )

    const flujosStepsReq = apiAxios.get(
      '/servicio/leanglobal/flujosAprobacionSteps'
    )

    const usuariosRolesReq = apiAxios.get(
      '/servicio/leanglobal/obtenerUsuariosRoles'
    )

    const rolesReq = apiAxios.get(
      '/servicio/leanglobal/obtenerRoles'
    )

    const notifsReq = idUser
      ? apiAxios.get(
          '/servicio/leanglobal/obtenerNortificaciones',
          { params: { id_user_target: idUser } }
        )
      : Promise.resolve()

    // Esperamos todas esas
    const [
      procesosResp,
      flujosResp,
      flujosStepsResp,
      usuariosRolesResp,
      rolesResp,
      notifsResp
    ] = await Promise.all([
      procesosReq,
      flujosReq,
      flujosStepsReq,
      usuariosRolesReq,
      rolesReq,
      notifsReq
    ])

    console.log('[Login] Sincronización base OK (listas principales cacheadas)')

    // 2) A partir de procesosSurveyV3, armamos la lista de surveys del usuario
    let data = Array.isArray(procesosResp.data?.datos)
      ? procesosResp.data.datos
      : []

    // Misma lógica de Surveys.vue
    const propios = (data ?? []).filter(it =>
      it.estado_srv !== 'APROBADO' &&
      it.estado_srv !== 'Pre Creado' &&
      it.estado_srv !== 'VERIFICACION' &&
      it.id_user == idUser &&
      it.desc_template_srv !== 'PPD'
    )

    // Ordenar por id_survey desc igual que en Surveys
    const toNum = v => (typeof v === 'number' ? v : parseInt(String(v), 10) || 0)
    propios.sort((a, b) => toNum(b.id_survey) - toNum(a.id_survey))

    // ⚠️ Opcional: limitar a N más recientes para no matar al usuario
    const limite = 50
    const aPrefetchear = propios.slice(0, limite)

    console.log(`[Login] Prefetch de detalles para ${aPrefetchear.length} surveys`)

    // 3) Prefetch de detalles de inspección por cada id_survey
    const detallePromises = aPrefetchear.map(s =>
      apiAxios.get(
        // 🔴 CAMBIA ESTA URL POR LA QUE OCUPAS EN LA VISTA DE INSPECCIÓN
        // Ejemplo: /servicio/leanglobal/inspeccionDetalle?id_survey=...
        '/servicio/leanglobal/procesosSurveyDetail',
        {
          params: { id_survey: s.id_survey }
        }
      )
    )
    
    console.log("aPrefetchear", aPrefetchear);
    // Usamos allSettled para que si un detalle falla, no caiga toda la sync
    await Promise.allSettled(detallePromises)

    console.log('[Login] Prefetch de detalles de inspección completado')

    // El SW ya tiene en cache:
    // - procesosSurveyV3
    // - flujosAprobacion / Steps
    // - usuariosRoles / roles
    // - notificaciones
    // - detalleInspección por id_survey (para los N primeros)
  } catch (e) {
    console.error('[Login] Error en sincronización inicial:', e)
  } finally {
    dialogSync.value = false
  }
}


</script>

<style scoped>
.login-page {
  min-height: 100%;
  padding-bottom: 16px;
}

.login-card {
  border: 1px solid rgba(255, 255, 255, 0.10);
}

.login-title {
  color: #ffffff;
  font-weight: 800;
  letter-spacing: 0.2px;
}

.login-section {
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 12px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.035);
}

.download-section {
  border: 1px solid rgba(245, 158, 11, 0.26);
  border-radius: 12px;
  padding: 12px;
  background: rgba(245, 158, 11, 0.055);
  margin-top: 12px;
}

.download-btn {
  color: #f8fafc !important;
  font-weight: 700;
}

.access-btn {
  font-weight: 700;
  background: linear-gradient(135deg, #10b981, #059669) !important;
  color: #02110c !important;
}

.access-btn:deep(.v-btn__overlay) {
  opacity: 0 !important;
}

.access-btn.v-btn--disabled {
  background: linear-gradient(135deg, #10b981, #059669) !important;
  color: #02110c !important;
  opacity: 1 !important;
}

.login-section > .google-login-wrapper {
  margin-top: 30px !important;
}
</style>
