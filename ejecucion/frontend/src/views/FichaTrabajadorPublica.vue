<template>
  <div class="min-h-screen bg-[#0a0a0a] text-foreground flex flex-col font-sans relative overflow-hidden">
    <!-- Decoración de fondo -->
    <div class="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
    <div class="fixed bottom-[-10%] right-[-10%] w-[60%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

    <main class="flex-1 w-full max-w-md mx-auto p-4 sm:p-6 relative z-10 flex flex-col gap-6" v-if="!loading && valid">
      
      <!-- Cabecera de la Ficha -->
      <header class="flex flex-col items-center pt-8 pb-4">
        <div class="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-zinc-800/50 flex items-center justify-center border border-emerald-500/20 mb-4 shadow-[0_0_30px_rgba(16,185,129,0.15)] relative overflow-hidden">
          <img v-if="trabajador.foto" :src="trabajador.foto" alt="Foto Trabajador" class="w-full h-full object-cover" />
          <User v-else class="w-10 h-10 text-emerald-400" />
          <div class="absolute -bottom-2 -right-2 bg-emerald-500 w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#0a0a0a] z-10">
            <Check class="w-3.5 h-3.5 text-black" />
          </div>
        </div>
        
        <div class="bg-white/10 px-4 py-1.5 rounded-lg border border-white/20 mb-3 backdrop-blur-sm text-center">
          <h1 class="text-2xl font-black text-white tracking-widest">{{ trabajador.nombre }}</h1>
          <p class="text-sm font-semibold text-zinc-300 mt-1">{{ trabajador.rut }}</p>
        </div>
        
        <!-- Lista de Especificaciones Técnicas (1 por línea) -->
        <div class="w-full flex flex-col gap-2 mb-2">
          <div v-for="(spec, idx) in trabajador.specs" :key="idx" class="bg-white/5 rounded-xl border border-white/10 p-3 flex justify-between items-center">
            <span class="text-[10px] uppercase font-bold tracking-widest text-zinc-500">{{ spec.label }}</span>
            <span class="text-sm font-semibold text-white text-right">{{ spec.value }}</span>
          </div>
        </div>
      </header>

      <!-- Lista de Documentos -->
      <section class="flex-1 flex flex-col gap-3">
        <h2 class="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 px-1">Certificados / Documentos</h2>
        
        <div v-if="documentos.length === 0" class="text-center text-zinc-500 text-sm mt-4">
          No hay documentos registrados.
        </div>

        <div 
          v-for="(doc, index) in documentos" 
          :key="index"
          class="bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-white/5 p-4 flex items-center gap-4 transition-all duration-300 hover:bg-zinc-800/50 group"
        >
          <!-- Icono tipo de documento -->
          <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" 
               :class="doc.estado === 'Vigente' ? 'bg-emerald-500/10 text-emerald-400' : (doc.estado === 'Por Vencer' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400')">
            <FileText class="w-5 h-5" />
          </div>
          
          <!-- Info -->
          <div class="flex-1 min-w-0">
            <h3 class="text-sm font-semibold text-white truncate">{{ doc.nombre }}</h3>
            <div class="flex items-center gap-2 mt-1">
              <span class="w-1.5 h-1.5 rounded-full" 
                    :class="doc.estado === 'Vigente' ? 'bg-emerald-500' : (doc.estado === 'Por Vencer' ? 'bg-amber-500' : 'bg-red-500')"></span>
              <p class="text-xs text-zinc-400 truncate">Vence: {{ doc.fechaVencimiento }}</p>
            </div>
          </div>
          
          <!-- Botón de descarga/ver -->
          <button 
            @click="abrirDocumento(doc)"
            class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-300 hover:bg-white/10 hover:text-white transition-colors shrink-0 border border-white/5"
          >
            <Download class="w-4 h-4" />
          </button>
        </div>
      </section>

      <!-- Footer Corporativo -->
      <footer class="mt-8 pb-6 flex flex-col items-center justify-center gap-2 opacity-60">
        <div class="flex items-center gap-2">
          <div class="w-5 h-5 rounded-md bg-emerald-500 flex items-center justify-center">
            <Zap class="w-3 h-3 text-black fill-black" />
          </div>
          <span class="text-xs font-black tracking-widest text-white uppercase">GRÚAS SAN PABLO</span>
        </div>
        <p class="text-[9px] font-bold text-zinc-500 tracking-[0.2em] uppercase">Plataforma SST Verificada</p>
      </footer>
    </main>

    <!-- Estado de Carga -->
    <div v-else-if="loading" class="flex-1 flex flex-col items-center justify-center">
      <div class="relative w-16 h-16 flex items-center justify-center mb-6">
        <div class="absolute inset-0 rounded-full border-2 border-emerald-500/20"></div>
        <div class="absolute inset-0 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>
        <User class="w-6 h-6 text-emerald-500" />
      </div>
      <p class="text-sm font-medium text-zinc-400 animate-pulse tracking-wide">Validando trabajador...</p>
    </div>

    <!-- Error / Denegado -->
    <div v-else class="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div class="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
        <ShieldAlert class="w-10 h-10 text-red-500" />
      </div>
      <h2 class="text-xl font-bold text-white mb-2">Acceso Denegado</h2>
      <p class="text-sm text-zinc-400 max-w-xs mb-8">El código QR escaneado es inválido o ha expirado. Por favor solicite un nuevo código.</p>
      <button 
        @click="reintentar"
        class="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors"
      >
        Reintentar
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import apiAxios from '@/services/api'
import { User, Check, FileText, Download, Zap, ShieldAlert } from 'lucide-vue-next'

const route = useRoute()
const loading = ref(true)
const valid = ref(false)

const trabajador = ref({})
const documentos = ref([])

onMounted(async () => {
  let rut = route.params.rut
  
  // Format RUT string if necessary, removing spaces or dots if we want strict matching, 
  // but let's try direct matching or loose matching depending on how it's saved.
  if (!rut) {
    valid.value = false
    loading.value = false
    return
  }
  rut = rut.trim()

  try {
    // 1. Obtener lista de personal
    const res = await apiAxios.get('/acreditacion/personal')
    const personalItems = res.data.data || []
    
    // Buscar el trabajador por rut (removiendo puntos, guiones y espacios)
    const normalizeRut = (r) => (r || '').replace(/[^0-9kK]/g, '').toLowerCase()
    
    const item = personalItems.find(i => normalizeRut(i.rut) === normalizeRut(rut))
    
    if (!item) {
      valid.value = false
      loading.value = false
      return
    }

    valid.value = true
    const pId = item.id_user

    // 2. Obtener certificados y detalles
    const detRes = await apiAxios.get(`/acreditacion/personal/${pId}`)
    const det = detRes.data.data
    const certs = det?.certificados || []

    trabajador.value = {
      rut: det.rut || item.rut,
      nombre: `${det.name_frst || ''} ${det.apellido_pat || ''} ${det.apellido_mat || ''}`.trim().replace(/\s+/g, ' ') || item.nombre || 'Sin Nombre',
      foto: null,
      specs: [
        { label: 'Cargo', value: det.cargo || item.rol || 'S/I' },
        { label: 'Empresa', value: 'Grúas San Pablo' },
        { label: 'Estado', value: item.estado || (det.activo ? 'Activo' : 'Inactivo') }
      ]
    }

    const getStatusText = (dateStr) => {
      if (!dateStr) return 'Vencido'
      try {
        const [y, m, d] = dateStr.split('T')[0].split('-').map(Number)
        const expiry = new Date(y, m - 1, d)
        const now = new Date()
        now.setHours(0,0,0,0)
        const diffDays = Math.floor((expiry - now) / (1000 * 60 * 60 * 24))
        if (diffDays < 0) return 'Vencido'
        if (diffDays <= 30) return 'Por Vencer'
        return 'Vigente'
      } catch { return 'Vencido' }
    }

    const docs = certs.map(doc => {
      let displayDate = doc.fecha_vencimiento
      if (displayDate) {
        const parts = displayDate.split('T')[0].split('-')
        if (parts.length === 3) displayDate = `${parts[2]}/${parts[1]}/${parts[0]}`
      }
      return {
        id: doc.id_certificado,
        nombre: doc.nombre_tipo || doc.nombre || 'Certificado',
        fechaVencimiento: displayDate || 'S/I',
        estado: getStatusText(doc.fecha_vencimiento),
        url: doc.id_doc ? `https://servidor.leanglobal.cl/lg-gsp/api/archivo/ver/${doc.id_doc}` : '#'
      }
    })

    documentos.value = docs

  } catch (error) {
    console.error("Error al cargar la ficha del trabajador:", error)
    valid.value = false
  } finally {
    loading.value = false
  }
})

const abrirDocumento = (doc) => {
  if (doc.url && doc.url !== '#') {
    window.open(doc.url, '_blank')
  }
}

const reintentar = () => {
  window.location.reload()
}
</script>
