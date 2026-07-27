<template>
  <div class="min-h-screen w-full flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden p-6">
    <!-- Background Gradients -->
    <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full"></div>
    <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full"></div>

    <div class="w-full max-w-2xl relative z-10">
      <div class="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
        <!-- Header -->
        <div class="flex items-center gap-4 mb-10 pb-6 border-b border-white/10">
          <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
            <ShieldCheck class="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 class="text-xl font-bold text-white tracking-tight">Completar Enrolamiento</h1>
            <p class="text-muted-foreground text-sm">Actualiza tus datos para habilitar la firma electrónica</p>
          </div>
        </div>

        <!-- Progress (Simplified) -->
        <div class="flex gap-2 mb-10">
          <div class="h-1 flex-1 bg-primary rounded-full"></div>
          <div class="h-1 flex-1 bg-white/10 rounded-full"></div>
          <div class="h-1 flex-1 bg-white/10 rounded-full"></div>
        </div>

        <!-- Form -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <!-- Datos Read-only -->
          <div class="space-y-2">
            <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">RUT</label>
            <div class="bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white/50 cursor-not-allowed">
              {{ rut }}
            </div>
          </div>
          <div class="space-y-2">
            <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Correo Corporativo</label>
            <div class="bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white/50 cursor-not-allowed truncate">
              {{ email }}
            </div>
          </div>

          <!-- Nombres -->
          <div class="space-y-2">
            <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Primer Nombre *</label>
            <input v-model="form.name_frst" type="text" class="input-modern" placeholder="Juan" />
          </div>
          <div class="space-y-2">
            <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Segundo Nombre</label>
            <input v-model="form.name_sec" type="text" class="input-modern" placeholder="Andrés" />
          </div>

          <!-- Apellidos -->
          <div class="space-y-2">
            <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Apellido Paterno *</label>
            <input v-model="form.apellido_pat" type="text" class="input-modern" placeholder="Pérez" />
          </div>
          <div class="space-y-2">
            <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Apellido Materno</label>
            <input v-model="form.apellido_mat" type="text" class="input-modern" placeholder="González" />
          </div>

          <!-- Contacto -->
          <div class="space-y-2">
            <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Correo Alternativo *</label>
            <input v-model="form.email_alternativo" type="email" class="input-modern" placeholder="personal@gmail.com" />
          </div>
          <div class="space-y-2">
            <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Celular *</label>
            <input v-model="form.movil" type="tel" class="input-modern" placeholder="+56912345678" />
          </div>

          <!-- Clave FES -->
          <div class="space-y-2 col-span-full">
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
            class="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
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

    <!-- Modal de Firma -->
    <FirmaConsentimientoModal
      v-model="showSignatureModal"
      :pdf-url="consentPdfUrl"
      :detalle="consentDetail"
      :user="user"
      @firmado="onConsentimientoFirmado"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ShieldCheck } from 'lucide-vue-next'
import apiAxios from '@/services/api'
import FirmaConsentimientoModal from '@/components/FirmaConsentimientoModal.vue'

const router = useRouter()
const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://servidor.leanglobal.cl:3005'

const user = JSON.parse(localStorage.getItem('user') || '{}')
const rut = ref(user.rut || '')
const email = ref(user.email || '')
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
    
    const hashedFes = await hashSHA256(form.pass_hash_fes)
    
    const payload = {
      id_user: user.id_user,
      rut: user.rut,
      correo: user.email,
      ...form,
      pass_hash_fes: hashedFes
    }

    await apiAxios.put('/usuarios/enrolamiento/', payload)
    
    statusMsg.value = '✅ Datos guardados. Preparando documento para firma...'
    statusType.value = 'success'
    
    // 2) Obtener el consentimiento para firmar
    const { data: consentResp } = await apiAxios.post('/survey/consentimiento-enrolamiento', {
      id_user: user.id_user,
      rut: user.rut
    })

    consentDetail.value = consentResp
    const docName = consentResp?.detalles?.[0]?.name_doc_interno_in
    consentPdfUrl.value = docName 
      ? `${API_URL}/archivo/transmac/${docName}`
      : ''

    showSignatureModal.value = true
    
  } catch (err) {
    console.error('Error Enrolamiento:', err)
    statusMsg.value = 'Hubo un error al procesar tu solicitud. Revisa los datos e intenta nuevamente.'
    statusType.value = 'error'
  } finally {
    loading.value = false
  }
}

const onConsentimientoFirmado = () => {
  statusMsg.value = '✅ ¡Enrolamiento COMPLETADO y consentimiento firmado!'
  statusType.value = 'success'
  
  // Actualizar usuario local para que ya no sea redirigido a enrolamiento
  user.flag_proc_enrol = false
  localStorage.setItem('user', JSON.stringify(user))
  
  setTimeout(() => {
    router.push('/')
  }, 2000)
}
</script>

<style scoped>
.input-modern {
  @apply w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all;
}
</style>
