<template>
  <div v-if="modelValue" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <!-- Backdrop (Sin cierre al hacer click) -->
    <div class="absolute inset-0 bg-slate-900/80 backdrop-blur-md"></div>

    <!-- Modal Content -->
    <div class="relative w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] border border-white/20">
      
      <!-- Left Column: Form -->
      <div class="w-full md:w-1/3 p-8 overflow-y-auto border-r border-slate-100 flex flex-col">
        <div class="flex items-center gap-3 mb-8">
          <div class="p-2 bg-primary/10 rounded-xl">
            <ShieldCheck class="w-6 h-6 text-primary" />
          </div>
          <h2 class="text-xl font-bold text-slate-800">Confirmar Firma FES</h2>
        </div>

        <div class="space-y-6 flex-1">
          <!-- Observaciones -->
          <div class="space-y-2">
            <label class="text-sm font-semibold text-slate-600">Observaciones</label>
            <textarea 
              v-model="observaciones"
              rows="2"
              class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-sm text-slate-700"
              placeholder="Ej: Acepto los términos de enrolamiento..."
            ></textarea>
          </div>

          <!-- Decision -->
          <div class="space-y-2">
            <label class="text-sm font-semibold text-slate-600">Estado de la firma</label>
            <div class="grid grid-cols-2 gap-3">
              <button 
                @click="decision = 'APRUEBA'"
                :class="[
                  'flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all text-sm font-bold',
                  decision === 'APRUEBA' 
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                    : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                ]"
              >
                <CheckCircle2 class="w-4 h-4" />
                <span>Aprueba</span>
              </button>
              <button 
                @click="decision = 'RECHAZA'"
                :class="[
                  'flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all text-sm font-bold',
                  decision === 'RECHAZA' 
                    ? 'bg-rose-50 border-rose-500 text-rose-700' 
                    : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                ]"
              >
                <XCircle class="w-4 h-4" />
                <span>Rechaza</span>
              </button>
            </div>
          </div>

          <!-- Motivo de rechazo -->
          <div v-if="decision === 'RECHAZA'" class="space-y-2 animate-in fade-in slide-in-from-top-1">
            <label class="text-sm font-semibold text-slate-600">Motivo de Rechazo</label>
            <select 
              v-model="motivoRechazo"
              class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-slate-700"
            >
              <option :value="null" disabled>Selecciona por qué rechazas</option>
              <option v-for="m in motivosRechazo" :key="m.id_motivo_rechazo" :value="m.id_motivo_rechazo">
                {{ m.motivo_rechazo }}
              </option>
            </select>
          </div>

          <!-- Clave FES -->
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <label class="text-sm font-semibold text-slate-600">Tu Clave FES (4 dígitos)</label>
            </div>
            <div class="relative">
              <input 
                v-model="passFes"
                type="password"
                maxlength="4"
                class="w-full px-4 py-4 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-center tracking-[1em] font-mono text-2xl text-emerald-400 placeholder:text-slate-600"
                placeholder="••••"
                inputmode="numeric"
              />
              <div class="absolute inset-y-0 right-4 flex items-center">
                <Lock class="w-5 h-5 text-slate-500" />
              </div>
            </div>
            <p class="text-[10px] text-slate-500 italic">Ingresa el PIN que acabas de definir en el paso anterior.</p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col gap-3 pt-8 border-t border-slate-100 mt-auto">
          <button 
            @click="firmar"
            :disabled="loading"
            class="w-full py-4 rounded-xl bg-emerald-600 text-white font-black uppercase tracking-widest shadow-xl shadow-emerald-200 hover:bg-emerald-700 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:translate-y-0 transition-all flex items-center justify-center gap-3"
          >
            <Loader2 v-if="loading" class="w-5 h-5 animate-spin" />
            <CheckCircle2 v-else class="w-5 h-5" />
            <span>{{ loading ? 'Procesando firma...' : 'Confirmar y Firmar' }}</span>
          </button>
          
          <button 
            @click="close"
            :disabled="loading"
            class="w-full py-3 rounded-xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-all text-sm"
          >
            Cancelar Proceso
          </button>
        </div>
      </div>

      <!-- Right Column: PDF Viewer -->
      <div class="hidden md:flex flex-1 bg-slate-100 flex-col items-center justify-center relative p-6">
        <div class="w-full flex justify-between items-center bg-slate-800 text-white px-6 py-3 rounded-t-2xl shadow-md border-b border-slate-700">
          <span class="text-xs font-bold uppercase tracking-wider">Previsualización del Consentimiento</span>
          <a 
            v-if="pdfUrl"
            :href="pdfUrl" 
            target="_blank"
            class="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all shadow-md active:scale-95"
          >
            <ExternalLink class="w-3.5 h-3.5" />
            <span>Ver PDF en Nueva Pestaña</span>
          </a>
        </div>
        <div class="flex-1 w-full bg-white relative rounded-b-2xl overflow-hidden shadow-inner flex items-center justify-center border border-t-0 border-slate-200">
          <iframe 
            v-if="pdfUrl"
            :src="pdfUrl" 
            class="w-full h-full border-none"
          ></iframe>
          
          <div v-if="!pdfUrl" class="text-slate-400 flex flex-col items-center gap-4 p-12 text-center">
            <FileWarning class="w-16 h-16 opacity-20" />
            <div>
              <p class="text-lg font-bold">Documento no disponible</p>
              <p class="text-sm">No pudimos cargar la previsualización del PDF. Por favor, reintenta el proceso.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ShieldCheck, CheckCircle2, XCircle, Loader2, Lock, FileWarning, ExternalLink } from 'lucide-vue-next'
import apiAxios from '@/services/api'

const props = defineProps({
  modelValue: Boolean,
  pdfUrl: String,
  detalle: Object,
  user: Object
})

const emit = defineEmits(['update:modelValue', 'firmado'])

const observaciones = ref('Acepto enrolamiento y firma electrónica simple.')
const decision = ref('APRUEBA')
const motivoRechazo = ref(null)
const passFes = ref('')
const loading = ref(false)

const motivosRechazo = ref([
  { id_motivo_rechazo: 1, motivo_rechazo: 'Datos personales incorrectos' },
  { id_motivo_rechazo: 2, motivo_rechazo: 'No estoy de acuerdo con el consentimiento' },
  { id_motivo_rechazo: 3, motivo_rechazo: 'Error en la visualización del documento' }
])

// Resetear campos al abrir
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    passFes.value = ''
    loading.value = false
  }
})

const close = () => {
  if (loading.value) return
  emit('update:modelValue', false)
}

const hashSHA256 = async (texto) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(texto)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

const firmar = async () => {
  if (passFes.value.length !== 4) {
    alert('⚠️ Por favor, ingresa tu clave FES de 4 dígitos.')
    return
  }

  if (decision.value === 'RECHAZA' && !motivoRechazo.value) {
    alert('⚠️ Debes seleccionar un motivo de rechazo.')
    return
  }

  loading.value = true
  try {
    const hashedPin = await hashSHA256(passFes.value)
    const step = props.detalle?.detalles?.[0]
    
    if (!step) throw new Error('No se encontró el paso de flujo para firmar.')

    const filenameQr = `${crypto.randomUUID()}.pdf`

    // 1) Actualizar Approval Exec (Para que aparezca en el JSON del PDF)
    await apiAxios.post('/signature/UpdApprovalExec', {
      id_survey: props.detalle.id_survey,
      nuevaFirma: {
        firma: {
          nombre: `${props.user.name_frst} ${props.user.apellido_pat}`,
          rut: props.user.rut,
          rol: 'USUARIO ENROLADO',
          fecha: new Date().toLocaleString(),
          metodo_autenticacion: 'FES',
          aprueba_rechaza: decision.value,
          observaciones: observaciones.value || 'Sin observaciones',
          id_user: props.user.id_user,
          ip_firma: 'LOCAL_BROWSER',
          user_agent: navigator.userAgent,
          geo_latitude: -33.456,
          geo_longitude: -70.648,
          qrUrl: filenameQr
        }
      }
    })

    // 2) Crear firma física en el PDF (postSignature3)
    // El backend espera pass_fes para verificar contra tsec_users
    await apiAxios.post('/signature/', {
      id_flow_stp: step.id_flow_stp,
      id_flow: props.detalle.id_flow,
      id_user: props.user.id_user,
      id_doc: step.id_doc_in,
      hash_pdf: 'SHA256_PENDING',
      codigo_validacion: crypto.randomUUID(),
      observaciones: observaciones.value,
      aprueba_rechaza: decision.value,
      id_motivo_rechazo: motivoRechazo.value,
      geo_latitude: -33.456,
      geo_longitude: -70.648,
      metodo_autenticacion: 'FES',
      rol: step.id_rol,
      rol_nombre: 'USUARIO ENROLADO',
      rut: props.user.rut,
      nombre: `${props.user.name_frst} ${props.user.apellido_pat}`,
      id_survey: props.detalle.id_survey,
      pass_fes: hashedPin, // Enviamos el hash para que el backend compare contra lo guardado
      filenameQr: filenameQr,
      destinoFolder: '/u05/LeanDocs/transmac/'
    })

    emit('firmado')
    close()
  } catch (error) {
    console.error('❌ Error al firmar:', error)
    const msg = error.response?.data?.error || error.message || 'Error desconocido'
    alert(`Error al procesar la firma: ${msg}`)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Estilo para que el input de password se vea bien en fondo oscuro */
input[type="password"] {
  -webkit-text-security: disc;
}
</style>
