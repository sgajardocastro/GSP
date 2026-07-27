<template>
  <div v-if="modelValue" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <!-- Backdrop (Sin cierre al hacer click) -->
    <div class="absolute inset-0 bg-black/80 backdrop-blur-md"></div>

    <!-- Modal Content -->
    <div class="relative w-full max-w-6xl bg-zinc-950 text-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] border border-white/10">
      
      <!-- Left Column: Form -->
      <div class="w-full md:w-1/3 p-8 overflow-y-auto border-r border-white/5 flex flex-col bg-[#121212]">
        <div class="flex items-center gap-3 mb-8">
          <div class="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <ShieldCheck class="w-6 h-6 text-emerald-500" />
          </div>
          <h2 class="text-lg font-black uppercase tracking-wider text-white">Firma Electrónica</h2>
        </div>

        <div class="space-y-6 flex-1">
          <!-- Observaciones -->
          <div class="space-y-2">
            <label class="text-[10px] font-black uppercase tracking-widest text-white/40">Observaciones</label>
            <textarea 
              v-model="observaciones"
              rows="3"
              class="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:border-emerald-500/50 outline-none transition-all resize-none text-xs text-white/90 placeholder:text-white/20 shadow-inner"
              placeholder="Ej: Aprobado sin observaciones..."
            ></textarea>
          </div>

          <!-- Decision -->
          <div class="space-y-2">
            <label class="text-[10px] font-black uppercase tracking-widest text-white/40">Decisión</label>
            <div class="grid grid-cols-2 gap-3">
              <button 
                type="button"
                @click="decision = 'APRUEBA'"
                :class="[
                  'flex items-center justify-center gap-2 py-3 rounded-xl border transition-all text-xs font-black uppercase tracking-wider',
                  decision === 'APRUEBA' 
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-lg' 
                    : 'bg-black/40 border-white/10 text-white/40 hover:bg-white/5 hover:text-white/60'
                ]"
              >
                <CheckCircle2 class="w-4 h-4" />
                <span>Aprueba</span>
              </button>
              <button 
                type="button"
                @click="decision = 'RECHAZA'"
                :class="[
                  'flex items-center justify-center gap-2 py-3 rounded-xl border transition-all text-xs font-black uppercase tracking-wider',
                  decision === 'RECHAZA' 
                    ? 'bg-rose-500/10 border-rose-500/40 text-rose-400 shadow-lg' 
                    : 'bg-black/40 border-white/10 text-white/40 hover:bg-white/5 hover:text-white/60'
                ]"
              >
                <XCircle class="w-4 h-4" />
                <span>Rechaza</span>
              </button>
            </div>
          </div>

          <!-- Motivo de rechazo -->
          <div v-if="decision === 'RECHAZA'" class="space-y-2 animate-in fade-in duration-300">
            <label class="text-[10px] font-black uppercase tracking-widest text-white/40">Motivo de Rechazo</label>
            <select 
              v-model="motivoRechazo"
              class="w-full px-4 py-3 bg-black/60 border border-white/10 rounded-xl focus:border-emerald-500/50 outline-none transition-all text-xs text-white/90"
            >
              <option :value="null" disabled>Seleccione un motivo</option>
              <option v-for="m in motivosRechazo" :key="m.id_motivo_rechazo" :value="m.id_motivo_rechazo">
                {{ m.motivo_rechazo }}
              </option>
            </select>
          </div>

          <!-- Clave FES -->
          <div class="space-y-2">
            <label class="text-[10px] font-black uppercase tracking-widest text-white/40">PIN FES (4 dígitos)</label>
            <div class="relative">
              <input 
                v-model="passFes"
                type="password"
                maxlength="4"
                class="w-full px-4 py-3 bg-black border border-white/10 rounded-xl focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500/50 outline-none transition-all text-center tracking-[1.5em] font-mono text-xl text-emerald-400 placeholder:text-white/10"
                placeholder="••••"
                inputmode="numeric"
              />
              <div class="absolute inset-y-0 right-4 flex items-center">
                <Lock class="w-4 h-4 text-white/30" />
              </div>
            </div>
            <p class="text-[10px] text-white/30 italic">La clave FES se ingresa de forma segura.</p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col gap-3 pt-6 border-t border-white/5 mt-8">
          <button 
            type="button"
            @click="firmar"
            :disabled="loading"
            class="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-black uppercase tracking-wider text-xs shadow-lg shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all flex items-center justify-center gap-2"
          >
            <Loader2 v-if="loading" class="w-4 h-4 animate-spin text-black" />
            <CheckCircle2 v-else class="w-4 h-4 text-black" />
            <span>{{ loading ? 'Firmando...' : 'Confirmar y Firmar' }}</span>
          </button>
          
          <button 
            type="button"
            @click="close"
            :disabled="loading"
            class="w-full py-3.5 rounded-xl border border-white/10 text-white/50 hover:text-white hover:bg-white/5 transition-all text-xs font-black uppercase tracking-wider"
          >
            Cancelar
          </button>
        </div>
      </div>

      <!-- Right Column: PDF Viewer -->
      <div class="hidden md:flex flex-1 bg-zinc-900 flex-col relative p-6">
        <div class="w-full flex justify-between items-center bg-[#18181b] text-white px-5 py-3 rounded-t-2xl border border-white/10 border-b-0 shadow-md">
          <span class="text-[9px] font-black uppercase tracking-widest text-white/50">Previsualización de Reporte</span>
          <a 
            v-if="pdfUrl"
            :href="pdfUrl" 
            target="_blank"
            class="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all"
          >
            <ExternalLink class="w-3 h-3" />
            <span>Ver PDF completo</span>
          </a>
        </div>
        <div class="flex-1 w-full bg-black relative rounded-b-2xl overflow-hidden shadow-inner flex items-center justify-center border border-white/10">
          <iframe 
            v-if="pdfUrl"
            :src="pdfUrl" 
            class="w-full h-full border-none bg-black"
          ></iframe>
          
          <div v-if="!pdfUrl" class="text-white/40 flex flex-col items-center gap-4 p-12 text-center">
            <FileWarning class="w-16 h-16 opacity-20 text-emerald-500" />
            <div>
              <p class="text-sm font-bold text-white">Documento no disponible</p>
              <p class="text-[11px] text-white/50 mt-1">No pudimos cargar la previsualización del PDF. Por favor, reintente el proceso.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { ShieldCheck, CheckCircle2, XCircle, Loader2, Lock, FileWarning, ExternalLink } from 'lucide-vue-next'
import { apiAxios } from '@/services/api'

const props = defineProps({
  modelValue: Boolean,
  pdfUrl: String,
  idDoc: [Number, String],
  origenPath: String,
  destinoFolder: String,
  user: Object,
  rolNombre: {
    type: String,
    default: 'Auditor SST'
  }
})

const emit = defineEmits(['update:modelValue', 'firmado'])

const observaciones = ref('Aprobado y firmado mediante Firma Electrónica Simple.')
const decision = ref('APRUEBA')
const motivoRechazo = ref(null)
const passFes = ref('')
const loading = ref(false)
const motivosRechazo = ref([])

// Cargar motivos de rechazo desde la BD
const fetchMotivosRechazo = async () => {
  try {
    const { data } = await apiAxios.get('/servicio/leanglobal/obtnerMotivosRechazo')
    if (Array.isArray(data)) {
      motivosRechazo.value = data
    } else {
      useFallbackMotivos()
    }
  } catch (err) {
    console.warn('No se pudieron obtener motivos de rechazo, usando locales:', err)
    useFallbackMotivos()
  }
}

const useFallbackMotivos = () => {
  motivosRechazo.value = [
    { id_motivo_rechazo: 1, motivo_rechazo: 'Datos del informe incorrectos' },
    { id_motivo_rechazo: 2, motivo_rechazo: 'Falta información en el reporte' },
    { id_motivo_rechazo: 3, motivo_rechazo: 'Discrepancia en evaluación de terreno' }
  ]
}

// Resetear campos al abrir
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    passFes.value = ''
    observaciones.value = 'Aprobado y firmado mediante Firma Electrónica Simple.'
    decision.value = 'APRUEBA'
    motivoRechazo.value = null
    loading.value = false
    fetchMotivosRechazo()
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
    
    // Payload compatible con el endpoint /api/signature/
    const payload = {
      origenPath: props.origenPath,
      destinoFolder: props.destinoFolder || '/u05/LeanDocs/transmac/',
      id_user: props.user?.id_user || 1,
      id_doc: Number(props.idDoc),
      pass_fes: hashedPin,
      aprueba_rechaza: decision.value,
      observaciones: observaciones.value || 'Firmado por FES',
      geo_latitude: -33.456,
      geo_longitude: -70.648,
      metodo_autenticacion: 'OTP',
      rut: props.user?.rut || '1-9',
      nombre: props.user ? `${props.user.name_frst || ''} ${props.user.apellido_pat || ''}`.trim() : 'Auditor SST',
      rol_nombre: props.rolNombre || 'Inspector'
    }

    const { data } = await apiAxios.post('/signature/', payload)

    emit('firmado', data)
    loading.value = false
    emit('update:modelValue', false)
  } catch (error) {
    console.error('❌ Error al firmar:', error)
    const msg = error.response?.data?.error || error.message || 'Error desconocido'
    alert(`Error al procesar la firma: ${msg}`)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchMotivosRechazo()
})
</script>

<style scoped>
input[type="password"] {
  -webkit-text-security: disc;
}
</style>
