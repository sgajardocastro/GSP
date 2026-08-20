<template>
  <div class="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans relative overflow-hidden items-center justify-center p-4">
    <!-- Decoración de fondo -->
    <div class="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
    <div class="fixed bottom-[-10%] right-[-10%] w-[60%] h-[40%] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none"></div>

    <div v-if="loading" class="z-10 flex flex-col items-center gap-4">
      <div class="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      <p class="text-zinc-400 font-medium tracking-wider animate-pulse">Cargando datos de la solicitud...</p>
    </div>

    <div v-else-if="error" class="z-10 bg-zinc-900/80 p-8 rounded-2xl border border-red-500/30 text-center max-w-md w-full backdrop-blur-md">
      <div class="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
      </div>
      <h2 class="text-xl font-bold text-white mb-2">Enlace inválido o expirado</h2>
      <p class="text-sm text-zinc-400">{{ errorMsg }}</p>
    </div>

    <div v-else-if="success" class="z-10 bg-zinc-900/80 p-8 rounded-2xl border border-emerald-500/30 text-center max-w-md w-full backdrop-blur-md">
      <div class="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
      </div>
      <h2 class="text-xl font-bold text-white mb-2">¡Asignación Exitosa!</h2>
      <p class="text-sm text-zinc-400">El especialista ha sido asignado y la visita ha sido firmada digitalmente.</p>
    </div>

    <div v-else class="z-10 bg-zinc-900/80 p-6 sm:p-8 rounded-2xl border border-white/10 w-full max-w-lg backdrop-blur-md shadow-2xl">
      <div class="mb-6 border-b border-white/5 pb-4">
        <h1 class="text-xl font-black text-white tracking-wide uppercase">Asignación de Visita</h1>
        <p class="text-xs text-amber-500 font-mono mt-1">Proyecto: {{ proyectoData.nombre_proyecto }}</p>
      </div>

      <div class="bg-black/30 border border-white/5 rounded-xl p-4 mb-6 space-y-3">
        <div class="flex justify-between items-center border-b border-white/5 pb-2">
          <span class="text-xs text-zinc-400">Cliente Mandante</span>
          <span class="text-sm font-bold text-white">{{ proyectoData.cliente_nombre || 'No especificado' }}</span>
        </div>
        <div class="flex justify-between items-center border-b border-white/5 pb-2">
          <span class="text-xs text-zinc-400">Cód. Cotización</span>
          <span class="text-xs font-mono text-white">{{ proyectoData.codi_proyecto || 'N/A' }}</span>
        </div>
        <div class="flex flex-col pt-1">
          <span class="text-xs text-zinc-400 mb-1">Descripción del Servicio</span>
          <span class="text-xs text-slate-300 italic">{{ proyectoData.descripcion || 'Sin descripción detallada' }}</span>
        </div>
        <div v-if="proyectoData.coordenadas_mapa?.lat" class="pt-2 border-t border-white/5 mt-2">
          <a :href="`https://www.google.com/maps?q=${proyectoData.coordenadas_mapa.lat},${proyectoData.coordenadas_mapa.lng}`" target="_blank" class="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 font-bold transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            Ver Ubicación en Google Maps
          </a>
        </div>
        <div v-else-if="proyectoData.obra_direccion" class="flex justify-between items-center pt-2 border-t border-white/5 mt-2">
          <span class="text-xs text-zinc-400">Dirección</span>
          <span class="text-xs font-bold text-white">{{ proyectoData.obra_direccion }}</span>
        </div>

        <div v-if="proyectoData.contacto_nombre" class="flex justify-between items-center pt-2 border-t border-white/5 mt-2">
          <span class="text-xs text-zinc-400">Contacto Terreno</span>
          <span class="text-xs font-bold text-amber-400">{{ proyectoData.contacto_nombre }}</span>
        </div>
        <div v-if="proyectoData.contacto_telefono" class="flex justify-between items-center pt-1">
          <span class="text-xs text-zinc-400">Teléfono Contacto</span>
          <span class="text-xs font-mono text-white">{{ proyectoData.contacto_telefono }}</span>
        </div>
        <div v-if="proyectoData.contacto_email" class="flex justify-between items-center pt-1">
          <span class="text-xs text-zinc-400">Correo Contacto</span>
          <span class="text-xs text-slate-300">{{ proyectoData.contacto_email }}</span>
        </div>
      </div>

      <form @submit.prevent="solicitarFirma" class="space-y-5">
        <div>
          <label class="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Especialista / Técnico a Terreno</label>
          <select 
            v-model="form.id_ejecutor" 
            required
            class="w-full bg-[#050810] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500 transition-colors"
          >
            <option value="" disabled>-- Seleccione un especialista --</option>
            <option v-for="user in especialistas" :key="user.id_user" :value="user.id_user">
              {{ user.nombre_user || user.name_user || user.username }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Fecha Programada</label>
          <input 
            type="date" 
            v-model="form.fecha_visita" 
            required
            class="w-full bg-[#050810] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500 transition-colors [color-scheme:dark]" 
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Comentarios / Instrucciones del Coordinador</label>
          <textarea 
            v-model="form.comentarios_coordinador" 
            rows="3" 
            placeholder="Instrucciones especiales, accesos o precauciones para el técnico en terreno..." 
            class="w-full bg-[#050810] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500 transition-colors resize-none"
          ></textarea>
        </div>

        <button 
          type="submit" 
          :disabled="!form.id_ejecutor || !form.fecha_visita"
          class="w-full mt-4 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-sm uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
          <span>Firmar y Asignar</span>
        </button>
      </form>
    </div>

    <!-- Modal Firma FES -->
    <div v-if="showPinModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div class="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
        <button @click="showPinModal = false" class="absolute top-4 right-4 text-slate-500 hover:text-white">✕</button>
        <div class="text-center mb-6">
          <div class="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          </div>
          <h3 class="text-lg font-bold text-white">Firma Electrónica Simple</h3>
          <p class="text-xs text-slate-400 mt-1">
            Hola <strong class="text-emerald-400">{{ proyectoData.coordinador?.nombre || 'Coordinador' }}</strong>,<br/>
            ingresa tu PIN de 4 dígitos para autorizar.
          </p>
        </div>
        
        <div class="space-y-4">
          <input 
            type="password" 
            v-model="fesPin" 
            maxlength="4" 
            placeholder="••••"
            class="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-center text-2xl tracking-widest text-white outline-none focus:border-emerald-500 transition-colors"
            @keyup.enter="confirmarConPin"
            ref="pinInput"
          />
          <button 
            @click="confirmarConPin" 
            :disabled="fesPin.length < 4 || submitting"
            class="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50"
          >
            <svg v-if="submitting" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ submitting ? 'Validando Firma...' : 'Confirmar' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import apiAxios from '@/services/api'

const route = useRoute()
const token = route.params.token

const loading = ref(true)
const error = ref(false)
const errorMsg = ref('')
const success = ref(false)
const submitting = ref(false)

const proyectoData = ref({})
const especialistas = ref([])

const form = ref({
  id_ejecutor: '',
  fecha_visita: '',
  comentarios_coordinador: ''
})

const showPinModal = ref(false)
const fesPin = ref('')
const pinInput = ref(null)

const hashSHA256 = async (text) => {
  const msgUint8 = new TextEncoder().encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

onMounted(async () => {
  if (!token) {
    error.value = true
    errorMsg.value = 'No se proporcionó un token válido.'
    loading.value = false
    return
  }

  try {
    // Cargar datos de la visita (token)
    const res = await apiAxios.get(`/visitas/token/${token}`)
    proyectoData.value = res.data.proyecto || res.data.data || res.data || {}
    
    // Cargar usuarios / especialistas
    try {
      const usersRes = await apiAxios.get('/servicio/leanglobal/obtenerUsuarios')
      especialistas.value = Array.isArray(usersRes.data) ? usersRes.data : []
    } catch (e) {
      console.warn("No se pudo cargar especialistas", e)
      especialistas.value = []
    }

    loading.value = false
  } catch (err) {
    console.error('Error al cargar token:', err)
    error.value = true
    errorMsg.value = err.response?.data?.error || err.response?.data?.message || 'El enlace ha expirado o no es válido.'
    loading.value = false
  }
})

const solicitarFirma = () => {
  if (!form.value.id_ejecutor || !form.value.fecha_visita) return
  fesPin.value = ''
  showPinModal.value = true
  nextTick(() => {
    if (pinInput.value) pinInput.value.focus()
  })
}

const confirmarConPin = async () => {
  if (fesPin.value.length < 4 || submitting.value) return

  submitting.value = true
  try {
    const pinHash = await hashSHA256(fesPin.value)
    
    // 1. Obtener Template 80 desde la API de templates del producto y pre-llenar metadata
    let bodySeed = { segmentos: [] }
    let headerSeed = {}
    let approvalSeed = {}
    let idFlowTmpl = 1

    try {
      const tmplRes = await apiAxios.get('/servicio/leanglobal/obtenerTemplates')
      const templates = Array.isArray(tmplRes.data) ? tmplRes.data : []
      const template = templates.find(t => Number(t.id_template) === 80)
      if (template) {
        bodySeed = typeof template.body_seed === 'string' ? JSON.parse(template.body_seed) : (template.body_seed || { segmentos: [] })
        headerSeed = typeof template.header_seed === 'string' ? JSON.parse(template.header_seed) : (template.header_seed || {})
        approvalSeed = typeof template.approval_seed === 'string' ? JSON.parse(template.approval_seed) : (template.approval_seed || {})
        idFlowTmpl = Number(template.id_flow_tmpl) || 1
      }
    } catch (e) {
      console.warn("No se pudo obtener el template 80 directamente, usando estructura limpia", e)
    }

    // Pre-llenar datos del proyecto en el bodySeed
    if (Array.isArray(bodySeed.segmentos)) {
      bodySeed.segmentos.forEach(seg => {
        if (Array.isArray(seg.attributes)) {
          // Eliminar permanentemente REFERENCIA DE LA DIRECCION
          seg.attributes = seg.attributes.filter(attr => {
            const label = (attr.label || '').toUpperCase()
            return !label.includes('REFERENCIA')
          })

          seg.attributes.forEach(attr => {
            const label = (attr.label || '').toUpperCase()
            const dirObra = proyectoData.value.obra_direccion || proyectoData.value.direccion || proyectoData.value.observacion_proyecto || ''
            if (label.includes('RAZON') || label.includes('SOCIAL')) attr.default = proyectoData.value.cliente_nombre || ''
            if (label.includes('RUT')) attr.default = proyectoData.value.cliente_rut || ''
            if (label.includes('NOMBRE DE LA OBRA')) attr.default = proyectoData.value.obra_nombre || proyectoData.value.nombre_proyecto || ''
            if (label.includes('DIRECCION')) attr.default = dirObra
            if (label.includes('COMENTARIOS DEL COORDINADOR') || label.includes('INSTRUCCIONES DEL COORDINADOR') || label.includes('COMENTARIO')) {
              attr.default = form.value.comentarios_coordinador || 'No especificado'
            }
            if (attr.type === 'geoLocation' && proyectoData.value.coordenadas_mapa) {
              attr.default = proyectoData.value.coordenadas_mapa
            }
          })
        }
      })
    }

    // 2. Crear e instanciar survey de Visita a Terreno vía API oficial POST /api/survey con body_exec poblado
    const payloadSurvey = {
      id_tipo_srv: 2,
      id_template: 80,
      id_user: form.value.id_ejecutor,
      id_user_creacion: proyectoData.value.coordinador?.id_user || 1,
      id_empresa_cliente: proyectoData.value.id_empresa_cliente,
      estado_srv: 'Creado',
      header_seed: JSON.stringify(headerSeed),
      body_seed: JSON.stringify(bodySeed),
      approval_seed: JSON.stringify(approvalSeed),
      header_exec: JSON.stringify(headerSeed),
      body_exec: JSON.stringify(bodySeed),
      approval_exec: JSON.stringify(approvalSeed),
      fecha_plan_ini: form.value.fecha_visita,
      fecha_plan_fin: form.value.fecha_visita,
      latitud: proyectoData.value.coordenadas_mapa?.lat || null,
      longitud: proyectoData.value.coordenadas_mapa?.lng || null,
      id_proyecto: proyectoData.value.id_proyecto,
      id_flow_tmpl: idFlowTmpl
    }

    try {
      await apiAxios.post('/survey', payloadSurvey)
    } catch (surveyErr) {
      console.warn("Survey base pre-creado o delegado al backend:", surveyErr)
    }

    // 3. Firmar con FES y actualizar estado de la solicitud
    await apiAxios.post(`/visitas/token/${token}/asignar`, {
      id_ejecutor: form.value.id_ejecutor,
      fecha_visita: form.value.fecha_visita,
      id_coordinador: proyectoData.value.coordinador?.id_user || null,
      comentarios_coordinador: form.value.comentarios_coordinador || '',
      fes_pin_hash: pinHash
    })
    
    showPinModal.value = false
    success.value = true
  } catch (err) {
    console.error('Error al asignar:', err)
    alert(err.response?.data?.error || err.response?.data?.message || 'Ocurrió un error al validar la firma o confirmar la asignación.')
    fesPin.value = ''
    if (pinInput.value) pinInput.value.focus()
  } finally {
    submitting.value = false
  }
}
</script>
