<template>
  <v-dialog
    v-model="dialogModel"
    fullscreen
    transition="dialog-bottom-transition"
    class="qr-scanner-dialog"
  >
    <v-card class="bg-slate-950 text-white flex flex-col h-full overflow-hidden select-none">
      
      <!-- Top App Bar del Escáner -->
      <div class="bg-slate-900/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-white/10 z-20">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
            <v-icon size="20">mdi-qrcode-scan</v-icon>
          </div>
          <div>
            <div class="text-xs font-black uppercase text-white tracking-wide">
              {{ titulo || 'Escáner QR & Barcode' }}
            </div>
            <div class="text-[10px] text-amber-400 font-semibold">
              {{ subtitulo || 'Enfoque un código QR o use pistola láser' }}
            </div>
          </div>
        </div>

        <div class="flex items-center gap-1.5">
          <!-- Botón de Linterna (Torch) -->
          <v-btn
            icon
            size="small"
            variant="tonal"
            :color="torchActive ? 'amber' : 'default'"
            @click="toggleTorch"
            title="Encender Linterna"
          >
            <v-icon size="18">{{ torchActive ? 'mdi-flashlight' : 'mdi-flashlight-off' }}</v-icon>
          </v-btn>

          <!-- Toggle Sonido Beep -->
          <v-btn
            icon
            size="small"
            variant="tonal"
            :color="soundEnabled ? 'amber' : 'default'"
            @click="soundEnabled = !soundEnabled"
            title="Sonido Beep"
          >
            <v-icon size="18">{{ soundEnabled ? 'mdi-volume-high' : 'mdi-volume-off' }}</v-icon>
          </v-btn>

          <!-- Cerrar Modal -->
          <v-btn
            icon="mdi-close"
            size="small"
            variant="text"
            color="white"
            @click="closeScanner"
          ></v-btn>
        </div>
      </div>

      <!-- Área de la Cámara con Retícula y Láser -->
      <div class="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
        
        <!-- Componente QrStream (vue3-qr-reader) -->
        <div v-if="cameraActive" class="absolute inset-0 flex items-center justify-center">
          <QrStream
            @decode="onDecode"
            @init="onInit"
            :paused="paused"
            class="w-full h-full object-cover"
          />
        </div>

        <div v-else class="text-center p-6 text-slate-400">
          <v-icon size="64" color="amber-darken-2" class="mb-3">mdi-camera-off</v-icon>
          <div class="text-xs font-bold uppercase text-slate-300">Cámara Pausada</div>
          <div class="text-[11px] mt-1 text-slate-500">Use la entrada manual o active la cámara</div>
          <v-btn
            color="amber"
            variant="flat"
            size="small"
            class="mt-3 font-black text-slate-950 text-xs"
            @click="restartCamera"
          >
            Reactivar Cámara
          </v-btn>
        </div>

        <!-- Retícula de Escaneo Láser -->
        <div
          v-if="cameraActive"
          class="relative w-64 h-64 rounded-2xl border border-white/20 backdrop-blur-[0.5px] shadow-2xl flex items-center justify-center pointer-events-none z-10"
        >
          <div class="reticle-corner reticle-tl"></div>
          <div class="reticle-corner reticle-tr"></div>
          <div class="reticle-corner reticle-bl"></div>
          <div class="reticle-corner reticle-br"></div>
          <div :class="['laser-line', { 'laser-success': scanSuccessEffect }]"></div>
          
          <span class="text-[10px] uppercase tracking-widest font-black text-amber-400 bg-slate-950/80 px-3 py-1 rounded-full border border-amber-400/30">
            ENFOQUE QR / BARCODE
          </span>
        </div>

        <!-- Feedback Visual de Éxito al Escanear -->
        <div
          v-if="scanSuccessEffect"
          class="absolute inset-0 bg-emerald-500/20 backdrop-blur-xs pointer-events-none transition-opacity duration-300 z-20 flex items-center justify-center"
        >
          <div class="p-4 bg-emerald-500 text-slate-950 rounded-2xl font-black text-sm flex items-center gap-2 shadow-2xl animate-bounce">
            <v-icon color="slate-950">mdi-check-circle</v-icon>
            <span>¡CÓDIGO LEÍDO!</span>
          </div>
        </div>

        <!-- Banner de Error de Cámara si no hay permisos -->
        <div
          v-if="cameraError"
          class="absolute top-4 left-4 right-4 bg-red-900/90 border border-red-500 text-red-100 p-3 rounded-xl text-xs z-30 flex items-center justify-between"
        >
          <div class="flex items-center gap-2">
            <v-icon color="red-300" size="18">mdi-alert-circle</v-icon>
            <span>{{ cameraError }}</span>
          </div>
          <v-btn size="x-small" variant="text" color="white" @click="cameraError = ''">OK</v-btn>
        </div>
      </div>

      <!-- Barra Inferior de Entrada Manual / Pistola Láser HID -->
      <div class="bg-slate-900/95 border-t border-white/10 p-3 space-y-2 z-20">
        <div class="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase">
          <span class="flex items-center gap-1.5">
            <v-icon size="14" color="amber">mdi-barcode-scan</v-icon>
            Pistola Bluetooth / Entrada Manual
          </span>
          <span class="text-amber-400 font-mono text-[10px]">Auto-Enter</span>
        </div>

        <div class="flex gap-2">
          <v-text-field
            ref="barcodeInputRef"
            v-model="manualInput"
            placeholder="Pegar o disparar con pistola (ej: GSP:SKU:FILT-00373)..."
            variant="outlined"
            density="compact"
            color="amber"
            hide-details
            class="font-mono text-xs uppercase"
            @keyup.enter="handleManualSubmit"
          ></v-text-field>

          <v-btn
            color="amber"
            class="font-black text-slate-950 text-xs px-4"
            height="40"
            @click="handleManualSubmit"
          >
            Leer
          </v-btn>
        </div>

        <!-- Acceso Rápido a Últimos Códigos Leídos -->
        <div v-if="lastScans.length > 0" class="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pt-1 text-[10px]">
          <span class="text-slate-500 font-bold whitespace-nowrap">Recientes:</span>
          <button
            v-for="(scan, idx) in lastScans"
            :key="idx"
            class="px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-white/5 font-mono whitespace-nowrap"
            @click="emitPayload(scan)"
          >
            {{ scan }}
          </button>
        </div>
      </div>

    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { QrStream } from 'vue3-qr-reader'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  titulo: {
    type: String,
    default: 'Escáner QR & Barcode'
  },
  subtitulo: {
    type: String,
    default: 'Enfoque un código QR o use pistola láser'
  },
  continuous: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'scan', 'close'])

const dialogModel = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const barcodeInputRef = ref(null)
const manualInput = ref('')
const paused = ref(false)
const cameraActive = ref(true)
const cameraError = ref('')
const torchActive = ref(false)
const soundEnabled = ref(true)
const scanSuccessEffect = ref(false)
const lastScans = ref([])

// Audio Context Web Audio API (sintetizador nativo para el BEEP de escaneo)
let audioCtx = null

function initAudio() {
  if (!audioCtx && typeof window !== 'undefined') {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (AudioContextClass) {
      audioCtx = new AudioContextClass()
    }
  }
}

function playBeep(freq = 1900, duration = 0.08) {
  if (!soundEnabled.value) return
  try {
    initAudio()
    if (!audioCtx) return
    if (audioCtx.state === 'suspended') {
      audioCtx.resume()
    }
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime)
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration)
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.start()
    osc.stop(audioCtx.currentTime + duration)
  } catch (err) {
    console.warn('Audio Beep no disponible:', err)
  }
}

// Detección de código por Cámara
function onDecode(result) {
  if (!result || paused.value) return
  const cleanResult = String(result).trim()
  if (!cleanResult) return

  emitPayload(cleanResult)

  if (!props.continuous) {
    paused.value = true
  }
}

function onInit(promise) {
  promise
    .then(() => {
      cameraActive.value = true
      cameraError.value = ''
    })
    .catch((error) => {
      cameraActive.value = false
      if (error.name === 'NotAllowedError') {
        cameraError.value = 'Permiso de cámara denegado. Permita el acceso en su navegador o use la entrada manual.'
      } else if (error.name === 'NotFoundError') {
        cameraError.value = 'No se detectó una cámara en este dispositivo.'
      } else {
        cameraError.value = 'Error al iniciar la cámara: ' + (error.message || error.name)
      }
    })
}

function restartCamera() {
  cameraActive.value = false
  paused.value = false
  nextTick(() => {
    cameraActive.value = true
  })
}

function toggleTorch() {
  torchActive.value = !torchActive.value
  // Nota: En navegadores móviles modernos la antorcha se controla mediante MediaStreamTrack
  try {
    const videoElem = document.querySelector('.qr-scanner-dialog video')
    if (videoElem && videoElem.srcObject) {
      const track = videoElem.srcObject.getVideoTracks()[0]
      if (track && track.getCapabilities && track.getCapabilities().torch) {
        track.applyConstraints({
          advanced: [{ torch: torchActive.value }]
        })
      }
    }
  } catch (e) {
    console.warn('Antorcha no soportada directamente por el hardware:', e)
  }
}

// Disparo de Payload unificado (Cámara, Pistola o Manual)
function emitPayload(payload) {
  playBeep(2100, 0.09)
  
  // Efecto visual
  scanSuccessEffect.value = true
  setTimeout(() => {
    scanSuccessEffect.value = false
  }, 350)

  // Guardar en recientes (máximo 5)
  if (!lastScans.value.includes(payload)) {
    lastScans.value.unshift(payload)
    if (lastScans.value.length > 5) lastScans.value.pop()
  }

  emit('scan', payload)

  if (!props.continuous) {
    dialogModel.value = false
  }
}

function handleManualSubmit() {
  const val = manualInput.value.trim()
  if (!val) return
  emitPayload(val)
  manualInput.value = ''
}

function closeScanner() {
  dialogModel.value = false
  emit('close')
}

// Listener para pistola lectora HID por hardware (captura rápida por teclado)
let bufferBarcode = ''
let lastKeyTime = Date.now()

function handleGlobalKeydown(e) {
  if (!props.modelValue) return
  
  // Si el usuario está escribiendo explícitamente en el input manual, no interferir
  if (e.target && e.target.tagName === 'INPUT') return

  const currentTime = Date.now()
  if (currentTime - lastKeyTime > 150) {
    bufferBarcode = ''
  }
  lastKeyTime = currentTime

  if (e.key === 'Enter') {
    if (bufferBarcode.length >= 3) {
      e.preventDefault()
      emitPayload(bufferBarcode.trim())
      bufferBarcode = ''
    }
  } else if (e.key.length === 1) {
    bufferBarcode += e.key
  }
}

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    paused.value = false
    cameraActive.value = true
    initAudio()
    nextTick(() => {
      window.addEventListener('keydown', handleGlobalKeydown)
    })
  } else {
    paused.value = true
    window.removeEventListener('keydown', handleGlobalKeydown)
  }
})

onMounted(() => {
  if (props.modelValue) {
    window.addEventListener('keydown', handleGlobalKeydown)
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})
</script>

<style scoped>
@keyframes scanLaser {
  0% { top: 8%; opacity: 0.7; }
  50% { top: 92%; opacity: 1; }
  100% { top: 8%; opacity: 0.7; }
}

.laser-line {
  position: absolute;
  left: 8%;
  right: 8%;
  height: 3px;
  background: linear-gradient(90deg, transparent, #f59e0b, #ef4444, #f59e0b, transparent);
  box-shadow: 0 0 15px rgba(245, 158, 11, 0.9), 0 0 25px rgba(239, 68, 68, 0.7);
  animation: scanLaser 2.2s infinite ease-in-out;
}

.laser-line.laser-success {
  background: linear-gradient(90deg, transparent, #10b981, #34d399, #10b981, transparent);
  box-shadow: 0 0 20px #10b981, 0 0 35px #10b981;
}

.reticle-corner {
  position: absolute;
  width: 24px;
  height: 24px;
  border-color: #f59e0b;
  border-width: 4px;
}
.reticle-tl { top: 10px; left: 10px; border-right: none; border-bottom: none; border-top-left-radius: 8px; }
.reticle-tr { top: 10px; right: 10px; border-left: none; border-bottom: none; border-top-right-radius: 8px; }
.reticle-bl { bottom: 10px; left: 10px; border-right: none; border-top: none; border-bottom-left-radius: 8px; }
.reticle-br { bottom: 10px; right: 10px; border-left: none; border-top: none; border-bottom-right-radius: 8px; }

.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
