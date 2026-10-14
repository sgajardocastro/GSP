<template>
  <div class="min-h-screen bg-[#080c16] text-slate-100 flex flex-col font-sans relative selection:bg-amber-500 selection:text-black">
    <!-- Ambient Light Highlights -->
    <div class="fixed top-[-10%] left-[-10%] w-[50%] h-[40%] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none"></div>
    <div class="fixed bottom-[-10%] right-[-10%] w-[50%] h-[40%] bg-blue-500/10 rounded-full blur-[140px] pointer-events-none"></div>

    <!-- Header Móvil Limpio -->
    <header class="w-full border-b border-white/10 bg-[#0c1222]/90 backdrop-blur-md px-4 py-3.5 sticky top-0 z-20 flex items-center justify-between shadow-lg">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <FileSignature class="w-4 h-4" />
        </div>
        <div>
          <h1 class="text-xs font-black uppercase tracking-wider text-white">Portal de Firma Digital FES</h1>
          <p class="text-[10px] text-slate-400">Contrato de Arriendo de Maquinaria</p>
        </div>
      </div>
      <div v-if="contrato.folio" class="text-right">
        <span class="inline-block text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">
          {{ contrato.folio }}
        </span>
      </div>
    </header>

    <!-- Contenedor Principal Responsive -->
    <main class="flex-1 w-full max-w-3xl mx-auto p-4 sm:p-6 relative z-10 flex flex-col justify-center">
      
      <!-- ESTADO 1: Cargando -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 class="w-8 h-8 text-amber-500 animate-spin" />
        <p class="text-xs text-slate-400 font-medium">Validando token de seguridad...</p>
      </div>

      <!-- ESTADO 2: Error o Expirado -->
      <div v-else-if="errorMsg" class="bg-red-950/40 border border-red-500/30 rounded-2xl p-6 text-center shadow-xl">
        <div class="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-3">
          <AlertCircle class="w-6 h-6" />
        </div>
        <h2 class="text-sm font-bold text-white uppercase tracking-wide mb-1">Enlace no disponible</h2>
        <p class="text-xs text-red-300 leading-relaxed mb-4">{{ errorMsg }}</p>
        <p class="text-[11px] text-slate-500">Si necesitas un nuevo enlace de firma, contacta al ejecutivo comercial a cargo.</p>
      </div>

      <!-- ESTADO 3: Ya Firmado Previamente o Éxito Inmediato -->
      <div v-else-if="yaFirmado" class="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-6 text-center shadow-xl">
        <div class="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 class="w-7 h-7" />
        </div>
        <h2 class="text-base font-black text-white uppercase tracking-wider mb-1">Contrato Firmado Exitosamente</h2>
        <p class="text-xs text-emerald-300 mb-4">
          Este documento ya cuenta con firma digital registrada y plena validez legal.
        </p>

        <div class="bg-black/40 border border-white/10 rounded-xl p-3.5 mb-5 text-left text-xs space-y-1.5">
          <div class="flex justify-between"><span class="text-slate-400">Folio:</span><span class="font-mono text-white font-bold">{{ contrato.folio }}</span></div>
          <div class="flex justify-between"><span class="text-slate-400">Mandante:</span><span class="text-white font-semibold">{{ proyecto.mandante_razon_social }}</span></div>
          <div class="flex justify-between"><span class="text-slate-400">Representante:</span><span class="text-white">{{ contrato.representante_nombre }}</span></div>
        </div>

        <a 
          v-if="contrato.url_pdf"
          :href="resolverUrlPdf(contrato.url_pdf)" 
          target="_blank" 
          class="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 px-4 rounded-xl transition-all shadow-lg shadow-emerald-900/30"
        >
          <Download class="w-4 h-4" />
          Descargar Contrato Firmado (PDF)
        </a>
      </div>

      <!-- ESTADO 4: Formulario de Firma Móvil con Lectura Obligatoria -->
      <div v-else class="space-y-4">
        
        <!-- Tarjeta Resumen del Negocio -->
        <div class="bg-[#0f172a]/90 border border-white/10 rounded-2xl p-4 shadow-xl">
          <div class="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
            <span class="text-[10px] font-black uppercase tracking-wider text-amber-400">Detalles de Comparecencia</span>
            <a 
              v-if="contrato.url_pdf"
              :href="resolverUrlPdf(contrato.url_pdf)" 
              target="_blank"
              class="text-[10px] text-blue-400 hover:text-blue-300 font-semibold underline flex items-center gap-1"
            >
              <Eye class="w-3 h-3" /> Ver borrador PDF
            </a>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <p><strong class="text-slate-400">Empresa Mandante:</strong> <span class="text-white font-semibold">{{ proyecto.mandante_razon_social }}</span></p>
            <p><strong class="text-slate-400">RUT Mandante:</strong> <span class="text-slate-200 font-mono">{{ proyecto.mandante_rut }}</span></p>
            <p><strong class="text-slate-400">Equipo Arrendado:</strong> <span class="text-white">{{ contrato.equipo_nombre }}</span></p>
            <p><strong class="text-slate-400">Tarifa Pactada:</strong> <span class="text-emerald-400 font-bold">{{ contrato.tarifa_pactada }}</span></p>
          </div>
        </div>

        <!-- VISOR OFICIAL DEL CONTRATO COMPLETO (4 PÁGINAS) -->
        <div class="bg-[#0f172a]/95 border border-white/10 rounded-2xl p-4 shadow-2xl space-y-3">
          <div class="flex items-center justify-between border-b border-white/10 pb-2">
            <span class="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              📜 Texto Íntegro del Contrato (4 Páginas)
            </span>
            <a 
              v-if="contrato.url_pdf"
              :href="resolverUrlPdf(contrato.url_pdf)" 
              target="_blank" 
              class="text-[11px] text-sky-400 hover:text-sky-300 font-bold underline flex items-center gap-1 cursor-pointer"
            >
              <Download class="w-3.5 h-3.5" /> Descargar Borrador PDF
            </a>
          </div>

          <!-- Document Container Scrollable -->
          <div class="bg-white rounded-xl shadow-inner border border-slate-300 overflow-hidden">
            <iframe 
              v-if="htmlContrato" 
              :srcdoc="htmlContrato" 
              class="w-full h-[520px] sm:h-[620px] border-0 bg-white"
              sandbox="allow-same-origin"
              title="Documento Oficial de Contrato de Arrendamiento"
            ></iframe>
            <div v-else class="text-center py-16 text-slate-500 text-xs">
              <Loader2 class="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
              Cargando documento completo para lectura...
            </div>
          </div>
          <p class="text-[10px] text-slate-400 text-center italic">
            👆 Deslice verticalmente dentro del recuadro para leer las 14 cláusulas legales y el anexo técnico de condiciones particulares.
          </p>
        </div>

        <!-- Casilla Legal de Aceptación Obligatoria -->
        <div 
          class="p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none"
          :class="aceptoTerminos ? 'bg-amber-500/15 border-amber-500/50' : 'bg-black/40 border-white/10 hover:border-white/20'"
          @click="aceptoTerminos = !aceptoTerminos"
        >
          <input 
            type="checkbox" 
            v-model="aceptoTerminos" 
            class="mt-0.5 rounded text-amber-500 focus:ring-amber-500 cursor-pointer h-4 w-4"
          />
          <label class="text-xs text-slate-200 cursor-pointer leading-relaxed">
            <strong class="text-amber-400">He leído atentamente y acepto íntegramente las 14 cláusulas y el anexo particular de este contrato</strong>, declarando contar con las facultades legales para representar a la arrendataria.
          </label>
        </div>

        <!-- Formulario de Datos del Firmante -->
        <div class="bg-[#0f172a]/90 border border-white/10 rounded-2xl p-4 shadow-xl space-y-3">
          <h3 class="text-xs font-black uppercase tracking-wider text-slate-300">Datos del Representante que Firma</h3>

          <div class="grid grid-cols-1 gap-2.5">
            <div>
              <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nombre Completo *</label>
              <input 
                v-model="form.nombre" 
                type="text" 
                placeholder="Ej: Juan Pérez González"
                class="w-full bg-[#050810] border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">RUT Representante *</label>
                <input 
                  v-model="form.rut" 
                  type="text" 
                  placeholder="Ej: 12.345.678-9"
                  class="w-full bg-[#050810] border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cargo *</label>
                <input 
                  v-model="form.cargo" 
                  type="text" 
                  placeholder="Ej: Representante Legal"
                  class="w-full bg-[#050810] border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fecha de Firma</label>
              <input 
                :value="fechaHoy" 
                disabled 
                type="text" 
                class="w-full bg-[#050810]/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        <!-- Canvas de Firma Digital Táctil -->
        <div class="bg-[#0f172a]/90 border border-white/10 rounded-2xl p-4 shadow-xl space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-black uppercase tracking-wider text-slate-300">Firme con el dedo en el recuadro</span>
            <button 
              type="button" 
              @click="limpiarCanvas" 
              class="text-[10px] font-bold text-red-400 hover:text-red-300 flex items-center gap-1 uppercase tracking-wider"
            >
              <RotateCcw class="w-3 h-3" /> Limpiar
            </button>
          </div>

          <div class="relative bg-white rounded-xl overflow-hidden border-2 border-dashed border-slate-400 touch-none">
            <canvas 
              ref="canvasRef" 
              class="w-full h-44 block cursor-crosshair"
              @mousedown="startDrawing" 
              @mousemove="draw" 
              @mouseup="stopDrawing" 
              @mouseleave="stopDrawing"
              @touchstart.prevent="startTouchDrawing" 
              @touchmove.prevent="touchDraw" 
              @touchend.prevent="stopDrawing"
            ></canvas>
            <div v-if="!hasDrawn" class="absolute inset-0 pointer-events-none flex items-center justify-center">
              <span class="text-slate-400 text-xs font-medium">Dibuje su firma aquí</span>
            </div>
          </div>

          <p class="text-[9.5px] text-slate-400 leading-tight">
            🔒 Al presionar firmar, declara bajo fe de juramento que la información ingresada es fidedigna y acepta todas las cláusulas del contrato de arrendamiento.
          </p>
        </div>

        <!-- Botón de Acción Principal -->
        <button 
          type="button" 
          @click="confirmarFirma"
          :disabled="firmando || !form.nombre || !form.rut || !hasDrawn || !aceptoTerminos"
          class="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-black text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20"
        >
          <Loader2 v-if="firmando" class="w-4 h-4 animate-spin" />
          <PenTool v-else class="w-4 h-4" />
          <span>{{ firmando ? 'Procesando y Estampando Firma...' : 'Confirmar y Firmar Contrato' }}</span>
        </button>

      </div>

    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { 
  FileSignature, AlertCircle, CheckCircle2, Download, Eye, RotateCcw, PenTool, Loader2 
} from 'lucide-vue-next'

const route = useRoute()
const token = ref(route.query.token || route.params.token || '')

const loading = ref(true)
const firmando = ref(false)
const errorMsg = ref('')
const yaFirmado = ref(false)
const hasDrawn = ref(false)

const proyecto = ref({})
const contrato = ref({})
const htmlContrato = ref('')
const aceptoTerminos = ref(false)
const form = ref({
  nombre: '',
  rut: '',
  cargo: 'Representante Legal'
})

const fechaHoy = new Date().toLocaleDateString('es-CL', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})

const canvasRef = ref(null)
let ctx = null
let isDrawing = false

const resolveApiBase = () => {
  if (typeof window !== 'undefined') {
    if (window.location.pathname.startsWith('/lg-gsp-prod')) {
      return 'https://servidor.leanglobal.cl/lg-gsp-prod/api'
    }
    if (window.location.pathname.startsWith('/lg-gsp-dev')) {
      return 'https://servidor.leanglobal.cl/lg-gsp-dev/api'
    }
  }
  return 'https://servidor.leanglobal.cl/lg-gsp-dev/api'
}

const resolverUrlPdf = (path) => {
  if (!path) return '#'
  if (path.startsWith('http')) return path
  const base = resolveApiBase().replace(/\/api$/, '')
  return `${base}${path}`
}

const setupCanvas = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * 2
  canvas.height = rect.height * 2
  ctx = canvas.getContext('2d')
  ctx.scale(2, 2)
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
}

const startDrawing = (e) => {
  isDrawing = true
  hasDrawn.value = true
  const rect = canvasRef.value.getBoundingClientRect()
  ctx.beginPath()
  ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
}

const draw = (e) => {
  if (!isDrawing) return
  const rect = canvasRef.value.getBoundingClientRect()
  ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
  ctx.stroke()
}

const stopDrawing = () => {
  if (!isDrawing) return
  isDrawing = false
}

const startTouchDrawing = (e) => {
  isDrawing = true
  hasDrawn.value = true
  const touch = e.touches[0]
  const rect = canvasRef.value.getBoundingClientRect()
  ctx.beginPath()
  ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top)
}

const touchDraw = (e) => {
  if (!isDrawing) return
  const touch = e.touches[0]
  const rect = canvasRef.value.getBoundingClientRect()
  ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top)
  ctx.stroke()
}

const limpiarCanvas = () => {
  if (!ctx || !canvasRef.value) return
  ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
  hasDrawn.value = false
}

const cargarContrato = async () => {
  if (!token.value) {
    loading.value = false
    errorMsg.value = 'No se especificó un token de firma en el enlace.'
    return
  }

  try {
    const apiBase = resolveApiBase()
    const res = await axios.get(`${apiBase}/proyectos/contrato/public/${token.value}`)
    if (res.data.success) {
      proyecto.value = res.data.proyecto || {}
      contrato.value = res.data.contrato || {}
      htmlContrato.value = res.data.html_contrato || ''
      form.value.nombre = contrato.value.representante_nombre || ''
      form.value.rut = contrato.value.representante_rut || ''
      form.value.cargo = contrato.value.representante_cargo || 'Representante Legal'

      if (contrato.value.estado === 'FIRMADO_DIGITAL' || contrato.value.estado === 'FIRMADO') {
        yaFirmado.value = true
      }
    } else {
      errorMsg.value = res.data.error || 'No fue posible validar el contrato.'
    }
  } catch (err) {
    if (err.response?.data?.ya_firmado) {
      yaFirmado.value = true
      contrato.value = err.response.data.contrato || {}
      htmlContrato.value = err.response.data.html_contrato || ''
    } else {
      errorMsg.value = err.response?.data?.error || 'Enlace inválido o expirado.'
    }
  } finally {
    loading.value = false
    if (!yaFirmado.value && !errorMsg.value) {
      await nextTick()
      setupCanvas()
      window.addEventListener('resize', setupCanvas)
    }
  }
}

const confirmarFirma = async () => {
  if (!aceptoTerminos.value) {
    alert('Debe marcar la casilla declarando haber leído y aceptado las 14 cláusulas del contrato antes de firmar.')
    return
  }
  if (!hasDrawn.value || !canvasRef.value) {
    alert('Por favor realice su firma en el recuadro antes de confirmar.')
    return
  }
  if (!form.value.nombre || !form.value.rut) {
    alert('Nombre y RUT son campos requeridos.')
    return
  }

  firmando.value = true
  try {
    const firmaBase64 = canvasRef.value.toDataURL('image/png')
    const apiBase = resolveApiBase()
    const res = await axios.post(`${apiBase}/proyectos/contrato/public/${token.value}/firmar`, {
      nombre: form.value.nombre.trim(),
      rut: form.value.rut.trim(),
      cargo: form.value.cargo.trim(),
      firma_base64: firmaBase64
    })

    if (res.data.success) {
      contrato.value = res.data.contrato || {}
      yaFirmado.value = true
    } else {
      alert(res.data.error || 'Error al procesar la firma digital.')
    }
  } catch (err) {
    alert(err.response?.data?.error || 'Error de conexión al firmar el contrato.')
  } finally {
    firmando.value = false
  }
}

onMounted(() => {
  cargarContrato()
})
</script>
