<template>
  <div class="p-6 max-w-[1600px] mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-[#0c0c0e]/90 border border-emerald-500/20 p-4 rounded-xl shadow-lg backdrop-blur-md">
      <div>
        <h1 class="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
          <Settings2 class="w-6 h-6 text-emerald-500" />
          Gestión de Nómina
        </h1>
        <div class="flex items-center gap-2 mt-2">
          <label class="text-[9px] font-black text-zinc-500 uppercase">Campaña:</label>
          <select v-model="campaignId" @change="updateUrl" class="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-emerald-500 font-bold focus:outline-none focus:border-emerald-500/50 min-w-[200px]">
            <option v-for="c in campaigns" :key="c.id_campana" :value="c.id_campana">{{ c.nombre }} - {{ c.estado }}</option>
          </select>
        </div>
      </div>
      
      <div class="flex gap-3">
        <button 
          @click="$router.push({ name: 'clima-campanas' })"
          class="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg font-black text-xs uppercase tracking-wider transition-all">
          Volver
        </button>
        <button 
          @click="downloadTemplate"
          class="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 px-4 py-2 rounded-lg font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all">
          <Download class="w-4 h-4" /> Bajar Formato
        </button>
        <button 
          @click="showUploadModal = true"
          class="bg-emerald-500 hover:bg-emerald-600 text-black px-4 py-2 rounded-lg font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <Upload class="w-4 h-4" /> Cargar Nómina Excel
        </button>
      </div>
    </div>

    <!-- Stats Summary -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div v-for="stat in campaignStats" :key="stat.label" class="bg-[#131316] border border-white/5 p-5 rounded-2xl">
        <div class="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">{{ stat.label }}</div>
        <div class="text-3xl font-black tabular-nums" :class="stat.color">{{ stat.value }}</div>
        <div class="w-full h-1 bg-white/5 rounded-full mt-3 overflow-hidden">
          <div class="h-full bg-current opacity-40" :style="{ width: stat.progress + '%', color: stat.hex }"></div>
        </div>
      </div>
    </div>



    <!-- Tracking Table -->
    <div class="bg-[#131316] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
      <div class="p-4 border-b border-white/5 flex justify-between items-center bg-white/2">
        <h3 class="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
          <ListChecks class="w-4 h-4 text-emerald-500" />
          Listado de Participantes
        </h3>
        <div class="flex gap-2">
          <input 
            type="text" 
            placeholder="Buscar por nombre o correo..." 
            class="bg-black/40 border border-white/10 rounded-lg px-4 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500/50 w-64">
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-black/20 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5">
              <th class="px-6 py-4">Participante</th>
              <th class="px-6 py-4">Cargo / Depto</th>
              <th class="px-6 py-4">Sucursal</th>
              <th class="px-6 py-4">Estado</th>
              <th class="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <tr v-for="p in participants" :key="p.email" class="hover:bg-white/[0.02] transition-colors group">
              <td class="px-6 py-4">
                <div class="flex flex-col">
                  <span class="text-sm font-bold text-white">{{ p.nombre }}</span>
                  <span class="text-[10px] text-zinc-500 font-mono">{{ p.email }}</span>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex flex-col">
                  <span class="text-[11px] font-bold text-zinc-300 uppercase">{{ p.cargo }}</span>
                  <span class="text-[9px] text-zinc-500 uppercase tracking-wider">{{ p.departamento }}</span>
                </div>
              </td>
              <td class="px-6 py-4 text-xs font-bold text-zinc-400">
                {{ p.sucursal }}
              </td>
              <td class="px-6 py-4">
                <span 
                  class="px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border"
                  :class="p.completado ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'">
                  {{ p.completado ? 'Completado' : 'Pendiente' }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button title="Copiar Token" class="p-2 hover:bg-emerald-500/10 rounded-lg text-emerald-500 transition-colors">
                    <Copy class="w-4 h-4" />
                  </button>
                  <button title="Re-enviar Invitación" class="p-2 hover:bg-blue-500/10 rounded-lg text-blue-500 transition-colors">
                    <Mail class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Upload Modal -->
    <div v-if="showUploadModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="showUploadModal = false"></div>
      
      <!-- Modal Content -->
      <div class="relative bg-[#131316] border border-white/10 w-full max-w-xl rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 z-10">
        <div class="p-8 space-y-6">
          <div class="flex justify-between items-start">
            <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
              <FileText class="w-6 h-6 text-emerald-500" />
            </div>
            <button @click="showUploadModal = false" class="text-zinc-500 hover:text-white transition-colors" title="Cerrar"><X class="w-6 h-6" /></button>
          </div>
          
          <div class="space-y-2">
            <h2 class="text-2xl font-black text-white uppercase tracking-tight">Cargar Nómina</h2>
            <p class="text-zinc-500 text-sm">Sube el archivo Excel con las columnas: <span class="text-zinc-300">Nombre, Correo, Cargo, Departamento, Sucursal</span>.</p>
          </div>

          <!-- Step 1: Dropzone -->
          <div v-if="uploadStep === 1"
            @dragover.prevent="isDragging = true" 
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
            class="border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center space-y-4 transition-all"
            :class="isDragging ? 'border-emerald-500 bg-emerald-500/5' : 'border-white/10 hover:border-white/20'">
            <div class="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
              <Upload class="w-8 h-8 text-zinc-400" />
            </div>
            <div class="text-center">
              <p class="text-sm font-bold text-white">Haz clic o arrastra tu Excel aquí</p>
              <p class="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Soporta .xlsx, .xls, .csv</p>
            </div>
            <input type="file" ref="fileInput" @click="$event => $event.target.value = ''" @change="handleFileSelect" class="hidden" accept=".xlsx, .xls, .csv">
            <button @click="$refs.fileInput.click()" class="bg-white/5 hover:bg-white/10 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all mb-2">Seleccionar Archivo</button>
            <button @click="downloadTemplate" class="text-[10px] text-blue-400 font-bold uppercase tracking-widest hover:underline flex items-center gap-1">
              <Download class="w-3 h-3" /> Descargar Planilla de Referencia
            </button>
          </div>

          <!-- Step 2: Preview Table -->
          <div v-else class="space-y-4 animate-in fade-in duration-300">
            <div class="flex justify-between items-center px-1">
              <span class="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Previsualización ({{ previewParticipants.length }} filas)</span>
              <button @click="resetUploadState" class="text-[9px] text-zinc-500 hover:text-white uppercase font-black tracking-widest">Cambiar archivo</button>
            </div>
            
            <div class="max-h-[300px] overflow-y-auto rounded-2xl border border-white/5 bg-black/20">
              <table class="w-full text-left text-[11px] border-collapse">
                <thead class="sticky top-0 bg-[#131316] shadow-md">
                  <tr class="text-zinc-500 uppercase font-black tracking-tighter border-b border-white/5">
                    <th class="px-4 py-2">Nombre</th>
                    <th class="px-4 py-2">Correo</th>
                    <th class="px-4 py-2">Cargo/Depto</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5 text-zinc-400">
                  <tr v-for="(p, idx) in previewParticipants" :key="idx" class="hover:bg-white/5" :class="!p.isValid ? 'bg-rose-500/5' : ''">
                    <td class="px-4 py-2 font-bold">{{ p.nombre }}</td>
                    <td class="px-4 py-2">
                      <div class="flex items-center gap-2">
                        <span :class="!p.isValid ? 'text-rose-500' : ''">{{ p.email }}</span>
                        <AlertCircle v-if="!p.isValid" class="w-3 h-3 text-rose-500" />
                      </div>
                    </td>
                    <td class="px-4 py-2 text-zinc-500">{{ p.cargo }} / {{ p.departamento }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-if="hasErrors" class="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-3 animate-pulse">
              <AlertCircle class="w-4 h-4 text-rose-500 mt-0.5" />
              <p class="text-[10px] text-rose-500 font-bold leading-relaxed uppercase">Se detectaron correos inválidos en la lista. Por favor corrige el archivo Excel y vuelve a subirlo para poder continuar.</p>
            </div>

            <div v-else class="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-start gap-3">
              <AlertCircle class="w-4 h-4 text-emerald-500 mt-0.5" />
              <p class="text-[10px] text-zinc-400 leading-relaxed">Al confirmar, se guardarán los registros en la base de datos y se <b>iniciará automáticamente el envío de correos</b> a todos los participantes de la lista.</p>
            </div>

            <button 
              @click="confirmAndUpload" 
              :disabled="isUploading || hasErrors"
              class="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-[0_0_25px_rgba(16,185,129,0.3)]">
              {{ isUploading ? 'Procesando y Enviando...' : 'Confirmar e Iniciar Campaña' }}
            </button>
          </div>

          <div v-if="uploadError" class="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-rose-500 text-xs font-bold flex items-center gap-3">
            <AlertCircle class="w-4 h-4" /> {{ uploadError }}
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as XLSX from 'xlsx'
import { sstAxios } from '@/services/api'
import { 
  Settings2, Upload, FileText, X, AlertCircle, 
  ListChecks, Users, Mail, Copy, CheckCircle2, PieChart, Download
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const campaignId = ref(route.query.campaign)
const campaigns = ref([])

const updateUrl = () => {
  router.replace({ query: { ...route.query, campaign: campaignId.value } })
}

const showUploadModal = ref(false)
const isDragging = ref(false)
const isUploading = ref(false)
const uploadStep = ref(1) // 1: Select, 2: Preview
const uploadError = ref('')
const fileInput = ref(null)

const resetUploadState = () => {
  uploadStep.value = 1
  previewParticipants.value = []
  uploadError.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

watch(showUploadModal, (newVal) => {
  if (!newVal) {
    resetUploadState()
  }
})

const participants = ref([])
const previewParticipants = ref([])
const dashboardData = ref({ kpis: {}, departamentos: [], sucursales: [] })

const validateEmail = (email) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    )
}

const hasErrors = computed(() => previewParticipants.value.some(p => !p.isValid))

const loadNomina = async () => {
  if (!campaignId.value) return
  try {
    const { data } = await sstAxios.get(`/clima/campanas/${campaignId.value}/nomina`)
    participants.value = data
  } catch (err) {
    console.error("Error cargando nómina:", err)
  }
}

const loadDashboard = async () => {
  if (!campaignId.value) return
  try {
    const { data } = await sstAxios.get(`/clima/campanas/${campaignId.value}/stats`)
    dashboardData.value = data
  } catch (err) {
    console.error("Error cargando dashboard:", err)
  }
}

const loadInitialData = async () => {
  try {
    const { data } = await sstAxios.get('/clima/campanas')
    if (data && data.length > 0) {
      campaigns.value = data
      
      const queryId = route.query.campaign
      if (queryId) {
        campaignId.value = queryId
        loadNomina()
        loadDashboard()
      } else {
        const active = data.find(c => c.estado === 'Activa') || data[0]
        campaignId.value = active.id_campana
        updateUrl()
        loadNomina()
        loadDashboard()
      }
    }
  } catch (err) {
    console.error("Error cargando campañas:", err)
  }
}

onMounted(() => {
  loadInitialData()
})

// Keep query param in sync and handle direct clicks
watch(() => route.query.campaign, (newId) => {
  if (newId) {
    if (newId !== campaignId.value) {
      campaignId.value = newId
      loadNomina()
      loadDashboard()
    }
  } else if (campaigns.value.length > 0) {
    const active = campaigns.value.find(c => c.estado === 'Activa') || campaigns.value[0]
    if (active && active.id_campana !== campaignId.value) {
      campaignId.value = active.id_campana
      updateUrl()
      loadNomina()
      loadDashboard()
    }
  }
})

const campaignStats = computed(() => [
  { label: 'Total Invitados', value: participants.value.length, color: 'text-white', hex: '#fff', progress: 100 },
  { label: 'Respuestas', value: participants.value.filter(p => p.completado).length, color: 'text-emerald-500', hex: '#10b981', progress: (participants.value.filter(p => p.completado).length / participants.value.length) * 100 },
  { label: 'Pendientes', value: participants.value.filter(p => !p.completado).length, color: 'text-amber-500', hex: '#f59e0b', progress: (participants.value.filter(p => !p.completado).length / participants.value.length) * 100 },
  { label: 'Participación', value: Math.round((participants.value.filter(p => p.completado).length / participants.value.length) * 100) + '%', color: 'text-blue-500', hex: '#3b82f6', progress: (participants.value.filter(p => p.completado).length / participants.value.length) * 100 }
])

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) processExcel(file)
}

const handleDrop = (event) => {
  isDragging.value = false
  const file = event.dataTransfer.files[0]
  if (file) processExcel(file)
}

const processExcel = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const json = XLSX.utils.sheet_to_json(worksheet)
      
      const newParticipants = json.map(row => {
        const email = row.Correo || row.correo || row.Email || ''
        return {
          nombre: row.Nombre || row.nombre || 'Sin nombre',
          email: email,
          cargo: row.Cargo || row.cargo || 'General',
          departamento: row.Departamento || row.departamento || 'General',
          sucursal: row.Sucursal || row.sucursal || 'Central',
          isValid: !!validateEmail(email)
        }
      })

      if (newParticipants.length > 0) {
        previewParticipants.value = newParticipants
        uploadStep.value = 2
        uploadError.value = ''
      } else {
        uploadError.value = 'El archivo está vacío o no tiene el formato correcto.'
      }
    } catch (err) {
      uploadError.value = 'Error al procesar el archivo Excel.'
      console.error(err)
    }
  }
  reader.readAsArrayBuffer(file)
}

const confirmAndUpload = async () => {
  if (isUploading.value) return
  isUploading.value = true
  
  try {
    await sstAxios.post(`/clima/campanas/${campaignId.value}/nomina`, { 
      participantes: previewParticipants.value 
    })
    
    await loadNomina()
    await loadDashboard()
    showUploadModal.value = false
    uploadStep.value = 1
    previewParticipants.value = []
  } catch (err) {
    uploadError.value = 'Error al subir nómina y enviar correos.'
    console.error(err)
  } finally {
    isUploading.value = false
  }
}

const downloadTemplate = () => {
  const data = [{
    Nombre: 'Ejemplo Perez',
    Correo: 'ejemplo@transmac.cl',
    Cargo: 'Conductor',
    Departamento: 'Operaciones',
    Sucursal: 'Antofagasta'
  }]
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Formato Nomina")
  XLSX.writeFile(workbook, "Formato_Nomina_Clima.xlsx")
}

// Cerrar modal al presionar Escape
const handleKeyDown = (e) => {
  if (e.key === 'Escape' && showUploadModal.value) {
    showUploadModal.value = false
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.glass {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.animate-in {
  animation: zoom-in 0.3s ease-out forwards;
}
@keyframes zoom-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
</style>
