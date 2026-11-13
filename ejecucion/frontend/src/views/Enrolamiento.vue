<template>
  <div class="min-h-screen w-full flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden p-6">
    <!-- Background Gradients -->
    <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full"></div>
    <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full"></div>

    <div class="w-full max-w-2xl relative z-10">
      <div class="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
        
        <!-- CASO 1: CONFLICTO DE SESIÓN ACTIVA DETECTADO -->
        <div v-if="sessionConflict" class="space-y-6 text-center py-4">
          <div class="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto text-3xl shadow-lg shadow-amber-500/10">
            ⚠️
          </div>

          <div class="space-y-2">
            <h2 class="text-lg font-black text-white uppercase tracking-wider font-mono">Conflicto de Sesión Detectado</h2>
            <p class="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
              Actualmente tienes una sesión iniciada como <strong class="text-amber-400 font-mono">{{ localUser.email }}</strong>, pero este enlace de invitación pertenece al usuario:
            </p>
            <div class="bg-[#050810] border border-emerald-500/30 rounded-xl p-3 max-w-sm mx-auto space-y-0.5">
              <span class="text-emerald-400 font-bold font-mono text-sm block">{{ queryEmail }}</span>
              <span v-if="queryRut" class="text-slate-400 font-mono text-xs block">RUT: {{ queryRut }}</span>
            </div>
          </div>

          <div class="pt-2 flex flex-col sm:flex-row justify-center gap-3 max-w-md mx-auto">
            <button 
              @click="desconectarParaEnrolar" 
              type="button" 
              class="flex-1 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              🔄 Cerrar Sesión y Enrolar a {{ queryEmail.split('@')[0] }}
            </button>
            <button 
              @click="router.push('/dashboard')" 
              type="button" 
              class="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Volver a mi Sesión
            </button>
          </div>
        </div>

        <!-- CASO 2: USUARIO ACTUAL YA ENROLADO -->
        <div v-else-if="yaEnrolado" class="space-y-6 text-center py-4">
          <div class="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto text-3xl shadow-lg shadow-emerald-500/10">
            ✓
          </div>

          <div class="space-y-2">
            <h2 class="text-lg font-black text-white uppercase tracking-wider font-mono">Tu Cuenta ya está Enrolada</h2>
            <p class="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
              La cuenta <strong class="text-emerald-400 font-mono">{{ localUser.email }}</strong> ya completó exitosamente el proceso de enrolamiento y cuenta con firma electrónica simple (FES) habilitada.
            </p>
          </div>

          <div class="pt-2 flex flex-col sm:flex-row justify-center gap-3 max-w-md mx-auto">
            <button 
              @click="router.push('/dashboard')" 
              type="button" 
              class="flex-1 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              Ir al Dashboard Operativo
            </button>
            <button 
              @click="cerrarSesion" 
              type="button" 
              class="px-4 py-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

        <!-- CASO 3: FORMULARIO DE ENROLAMIENTO ACTIVO -->
        <div v-else>
          <!-- Header -->
          <div class="flex items-center gap-4 mb-8 pb-6 border-b border-white/10">
            <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
              <ShieldCheck class="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 class="text-xl font-bold text-white tracking-tight">Completar Enrolamiento</h1>
              <p class="text-muted-foreground text-sm">Actualiza tus datos para habilitar la firma electrónica</p>
            </div>
          </div>

          <!-- Progress (Simplified) -->
          <div class="flex gap-2 mb-8">
            <div class="h-1 flex-1 bg-primary rounded-full"></div>
            <div class="h-1 flex-1 bg-white/10 rounded-full"></div>
            <div class="h-1 flex-1 bg-white/10 rounded-full"></div>
          </div>

          <!-- Form -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
            <!-- Datos Read-only -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">RUT</label>
              <div class="bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white/70 font-mono font-bold cursor-not-allowed">
                {{ rut || 'Sin RUT' }}
              </div>
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Correo Corporativo</label>
              <div class="bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white/70 font-mono font-bold cursor-not-allowed truncate">
                {{ email || 'Sin Correo' }}
              </div>
            </div>

            <!-- Nombres -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Primer Nombre *</label>
              <input v-model="form.name_frst" type="text" class="input-modern" placeholder="Juan" />
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Segundo Nombre</label>
              <input v-model="form.name_sec" type="text" class="input-modern" placeholder="Andrés" />
            </div>

            <!-- Apellidos -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Apellido Paterno *</label>
              <input v-model="form.apellido_pat" type="text" class="input-modern" placeholder="Pérez" />
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Apellido Materno</label>
              <input v-model="form.apellido_mat" type="text" class="input-modern" placeholder="González" />
            </div>

            <!-- Contacto -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Correo Alternativo *</label>
              <input v-model="form.email_alternativo" type="email" class="input-modern" placeholder="personal@gmail.com" />
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Celular *</label>
              <input v-model="form.movil" type="tel" class="input-modern" placeholder="+56912345678" />
            </div>

            <!-- Clave FES -->
            <div class="space-y-2 col-span-full pt-2">
              <div class="flex justify-between items-center mb-1">
                <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Clave de Firma (4 dígitos) *</label>
                <button @click="showFesInfo = !showFesInfo" class="text-[10px] text-primary hover:underline">¿Para qué sirve?</button>
              </div>
              <input v-model="form.pass_hash_fes" type="password" maxlength="4" class="input-modern text-center tracking-[1em] font-mono text-xl" placeholder="••••" />
              <transition enter-active-class="transition duration-200" enter-from-class="opacity-0 -translate-y-2" enter-to-class="opacity-100 translate-y-0">
                <div v-if="showFesInfo" class="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-xl text-xs text-muted-foreground leading-relaxed">
                  Esta clave será utilizada cada vez que firmes un documento digitalmente. Se almacena de forma encriptada y es personal e intransferible.
                </div>
              </transition>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="flex flex-col sm:flex-row gap-4 items-center pt-6 border-t border-white/10">
            <p class="text-[10px] text-muted-foreground flex-1 italic text-center sm:text-left">Todos los campos marcados con * son obligatorios para continuar.</p>
            <button 
              @click="submitEnrolamiento"
              :disabled="loading"
              class="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Loader2 v-if="loading" class="w-5 h-5 animate-spin" />
              <span>{{ loading ? 'Generando PDF...' : 'FINALIZAR ENROLAMIENTO' }}</span>
            </button>
          </div>

          <!-- Error/Success Messages -->
          <div v-if="statusMsg" :class="statusType === 'error' ? 'text-destructive bg-destructive/10 border-destructive/20' : 'text-primary bg-primary/10 border-primary/20'" class="mt-6 p-3 rounded-lg border text-center text-sm font-medium">
            {{ statusMsg }}
          </div>
        </div>

      </div>
    </div>

    <!-- Modal de Firma -->
    <FirmaConsentimientoModal
      v-model="showSignatureModal"
      :pdf-url="consentPdfUrl"
      :detalle="consentDetail"
      :user="activeEnrolUser"
      @firmado="onConsentimientoFirmado"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ShieldCheck, Loader2 } from 'lucide-vue-next'
import apiAxios from '@/services/api'
import FirmaConsentimientoModal from '@/components/FirmaConsentimientoModal.vue'
import { getStorageUrl } from '@/utils/storage'

const router = useRouter()
const route = useRoute()

// Sesión local almacenada en el navegador
const localUser = reactive(JSON.parse(localStorage.getItem('user') || '{}'))

// Parámetros de la URL del correo de invitación
const queryEmail = computed(() => (route.query.email || '').toString().trim())
const queryRut = computed(() => (route.query.rut || '').toString().trim())

// Detección de colisión de sesión
const sessionConflict = computed(() => {
  if (!queryEmail.value) return false
  const activeEmail = (localUser.email || '').toLowerCase().trim()
  const targetEmail = queryEmail.value.toLowerCase().trim()
  return Boolean(activeEmail && activeEmail !== targetEmail)
})

// Caso ya enrolado (si no viene invitando a otro usuario)
const yaEnrolado = computed(() => {
  if (queryEmail.value) return false
  return Boolean(localUser.id_user && (localUser.flag_proc_enrol === false || localUser.flag_proc_enrol === 'f' || localUser.flag_proc_enrol === 0))
})

// Datos del usuario que se está enrolando
const targetUser = reactive({
  id_user: null,
  rut: '',
  email: ''
})

const rut = computed(() => targetUser.rut || queryRut.value || localUser.rut || '')
const email = computed(() => targetUser.email || queryEmail.value || localUser.email || '')

const activeEnrolUser = computed(() => ({
  id_user: targetUser.id_user || localUser.id_user,
  rut: rut.value,
  email: email.value
}))

const loading = ref(false)
const showFesInfo = ref(false)
const statusMsg = ref('')
const statusType = ref('error')

// Firma de consentimiento
const showSignatureModal = ref(false)
const consentDetail = ref(null)
const consentPdfUrl = ref('')

const form = reactive({
  name_frst: '',
  name_sec: '',
  apellido_pat: '',
  apellido_mat: '',
  email_alternativo: '',
  movil: '',
  pass_hash_fes: ''
})

onMounted(async () => {
  // Si viene rut en la URL, consultar datos del usuario invitado
  const targetRut = queryRut.value || localUser.rut
  if (targetRut) {
    try {
      const { data } = await apiAxios.get(`/usuarios/by-rut/${targetRut}`)
      if (data) {
        targetUser.id_user = data.id_user
        targetUser.rut = data.rut
        targetUser.email = data.email
        if (data.name_frst) form.name_frst = data.name_frst
        if (data.name_sec) form.name_sec = data.name_sec
        if (data.apellido_pat) form.apellido_pat = data.apellido_pat
        if (data.apellido_mat) form.apellido_mat = data.apellido_mat
      }
    } catch (e) {
      console.warn('Precarga de usuario por rut falló:', e)
    }
  } else if (localUser.id_user) {
    targetUser.id_user = localUser.id_user
    targetUser.rut = localUser.rut
    targetUser.email = localUser.email
  }
})

const desconectarParaEnrolar = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  Object.keys(localUser).forEach(k => delete localUser[k])
  window.location.reload()
}

const cerrarSesion = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}

async function hashSHA256(texto) {
  const encoder = new TextEncoder()
  const data = encoder.encode(texto)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

const submitEnrolamiento = async () => {
  if (!form.name_frst || !form.apellido_pat || !form.email_alternativo || !form.movil || !form.pass_hash_fes) {
    statusMsg.value = 'Por favor completa todos los campos obligatorios.'
    statusType.value = 'error'
    return
  }

  if (form.pass_hash_fes.length !== 4 || isNaN(form.pass_hash_fes)) {
    statusMsg.value = 'La clave de firma debe ser de 4 números.'
    statusType.value = 'error'
    return
  }

  try {
    loading.value = true
    statusMsg.value = ''
    
    // Si aún no tenemos id_user, resolverlo por rut
    let finalIdUser = targetUser.id_user || localUser.id_user
    if (!finalIdUser && rut.value) {
      try {
        const { data } = await apiAxios.get(`/usuarios/by-rut/${rut.value}`)
        if (data?.id_user) {
          finalIdUser = data.id_user
          targetUser.id_user = data.id_user
        }
      } catch (e) {}
    }

    if (!finalIdUser) {
      statusMsg.value = 'No se pudo identificar el identificador del usuario para enrolamiento.'
      statusType.value = 'error'
      return
    }

    const hashedFes = await hashSHA256(form.pass_hash_fes)
    
    const payload = {
      id_user: finalIdUser,
      rut: rut.value,
      correo: email.value,
      ...form,
      pass_hash_fes: hashedFes
    }

    await apiAxios.put('/usuarios/enrolamiento/', payload)
    
    statusMsg.value = '✅ Datos guardados. Preparando documento para firma...'
    statusType.value = 'success'
    
    // 2) Obtener el consentimiento para firmar
    const { data: consentResp } = await apiAxios.post('/survey/consentimiento-enrolamiento', {
      id_user: finalIdUser,
      rut: rut.value
    })

    consentDetail.value = consentResp
    const docId = consentResp?.detalles?.[0]?.id_doc_in || consentResp?.id_doc
    const docName = consentResp?.detalles?.[0]?.name_doc_interno_in
    consentPdfUrl.value = docId ? getStorageUrl(docId) : (docName ? getStorageUrl(docName) : '')

    showSignatureModal.value = true
    
  } catch (err) {
    console.error('Error Enrolamiento:', err)
    statusMsg.value = err.response?.data?.error || err.response?.data?.message || 'Hubo un error al procesar tu solicitud. Revisa los datos e intenta nuevamente.'
    statusType.value = 'error'
  } finally {
    loading.value = false
  }
}

const onConsentimientoFirmado = () => {
  statusMsg.value = '✅ ¡Enrolamiento COMPLETADO y consentimiento firmado!'
  statusType.value = 'success'
  
  if (localUser.email === email.value) {
    localUser.flag_proc_enrol = false
    localStorage.setItem('user', JSON.stringify(localUser))
  }
  
  setTimeout(() => {
    router.push('/login')
  }, 2500)
}
</script>

<style scoped>
.input-modern {
  @apply w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all;
}
</style>
