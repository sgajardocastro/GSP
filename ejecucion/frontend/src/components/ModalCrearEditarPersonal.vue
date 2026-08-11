<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
    <div class="bg-[#0b0f19] border border-white/10 rounded-[2.5rem] w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden relative text-left">
      
      <!-- HEADER -->
      <div class="px-8 py-6 border-b border-white/5 bg-gradient-to-r from-emerald-600/5 via-emerald-500/5 to-transparent flex items-center justify-between shrink-0">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-lg">
            <svg class="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
          </div>
          <div>
            <h2 class="text-xl font-black text-white uppercase tracking-widest">
              Expediente Digital de Personal
            </h2>
            <p class="text-xs text-slate-400 mt-0.5 uppercase tracking-tighter opacity-70">
              Ficha laboral, cargo y control de acreditación de certificados
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button v-if="props.userId && form.rut" @click="showQR = true" class="text-emerald-500 hover:text-white hover:bg-emerald-500 transition-colors px-3 py-1.5 rounded-xl border border-emerald-500/30 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
            Ficha QR
          </button>
          <button @click="$emit('close')" class="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
      </div>

      <!-- BODY -->
      <div class="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0">
        
        <!-- COLUMNA IZQUIERDA: DATOS TRABAJADOR -->
        <div class="w-full md:w-1/2 p-8 overflow-y-auto border-r border-white/5 space-y-6">
          <h3 class="text-xs font-black uppercase text-emerald-500 tracking-widest border-b border-emerald-500/20 pb-2">
            1. Ficha del Trabajador
          </h3>
          
          <div class="grid grid-cols-2 gap-4">
            <!-- Primer Nombre -->
            <div class="space-y-1.5">
              <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Primer Nombre</label>
              <input 
                type="text" 
                v-model="form.name_frst" 
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-500/50 uppercase tracking-wider"
              />
            </div>
            <!-- Segundo Nombre -->
            <div class="space-y-1.5">
              <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Segundo Nombre</label>
              <input 
                type="text" 
                v-model="form.name_sec" 
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-500/50 uppercase tracking-wider"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <!-- Apellido Paterno -->
            <div class="space-y-1.5">
              <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Apellido Paterno</label>
              <input 
                type="text" 
                v-model="form.apellido_pat" 
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-500/50 uppercase tracking-wider"
              />
            </div>
            <!-- Apellido Materno -->
            <div class="space-y-1.5">
              <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Apellido Materno</label>
              <input 
                type="text" 
                v-model="form.apellido_mat" 
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-500/50 uppercase tracking-wider"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <!-- RUT -->
            <div class="space-y-1.5">
              <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest block">RUT</label>
              <input 
                type="text" 
                v-model="form.rut" 
                placeholder="12345678-K"
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-500/50 uppercase tracking-wider"
              />
            </div>
            <!-- Movil -->
            <div class="space-y-1.5">
              <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Móvil</label>
              <input 
                type="text" 
                v-model="form.movil" 
                placeholder="+56 9 XXXX XXXX"
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-500/50 uppercase tracking-wider"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 gap-4">
            <!-- Email -->
            <div class="space-y-1.5">
              <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Correo Electrónico</label>
              <input 
                type="email" 
                v-model="form.email" 
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-500/50 tracking-wider"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <!-- Cargo / Funcion -->
            <div class="space-y-1.5">
              <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Cargo / Función</label>
              <select 
                v-model="form.cargo" 
                class="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-500/50 uppercase"
              >
                <option value="Operador">Operador Grúa Móvil</option>
                <option value="Rigger">Rigger Especialista</option>
                <option value="Operador Cama Baja">Operador Cama Baja</option>
                <option value="Operador Camión Pluma">Operador Camión Pluma</option>
                <option value="Supervisor">Supervisor de Terreno</option>
                <option value="Prevencionista">Encargado Prevención de Riesgos</option>
                <option value="Administrativo">Asistente Administrativo</option>
              </select>
            </div>
            <!-- Activo -->
            <div class="space-y-1.5 flex flex-col justify-end pb-3">
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="form.activo" class="sr-only peer" />
                <div class="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                <span class="ml-3 text-[10px] font-black uppercase text-white/75">Trabajador Activo</span>
              </label>
            </div>
          </div>

          <!-- BOTÓN GUARDAR FICHA -->
          <div class="pt-4">
            <button 
              @click="saveFicha"
              class="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 border border-emerald-400/30 transition-all"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Guardar Datos Ficha
            </button>
          </div>
        </div>

        <!-- COLUMNA DERECHA: CERTIFICADOS -->
        <div class="w-full md:w-1/2 p-8 overflow-y-auto flex flex-col min-h-0 bg-white/[0.01]">
          <div class="flex items-center justify-between border-b border-emerald-500/20 pb-2.5 shrink-0">
            <h3 class="text-xs font-black uppercase text-emerald-500 tracking-widest">
              2. Expediente de Certificados
            </h3>
            <button 
              @click="showAddDocModal = true"
              class="px-3.5 py-2 bg-emerald-600/10 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 text-emerald-400 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Vincular Certificado
            </button>
          </div>

          <!-- Listado de certificados del usuario -->
          <div class="mt-4 flex-1 min-h-0 flex flex-col">
            <div class="flex-1 overflow-y-auto border border-white/5 rounded-2xl bg-black/25">
              <table class="w-full text-left text-xs">
                <thead class="bg-black/35 sticky top-0 border-b border-white/10 text-[9px] font-black text-slate-400 uppercase tracking-widest z-10">
                  <tr>
                    <th class="p-3">Certificado</th>
                    <th class="p-3 text-center">Vencimiento</th>
                    <th class="p-3 text-center">Vigencia</th>
                    <th class="p-3 text-center"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                  <tr v-for="cert in certificados" :key="cert.id_certificado_persona" class="hover:bg-white/[0.01]">
                    <td class="p-3">
                      <p class="font-bold text-white uppercase">{{ cert.nombre_tipo }}</p>
                      <p class="text-[9px] text-slate-500 mt-0.5 truncate max-w-[200px]" :title="cert.observaciones">{{ cert.observaciones || 'Sin observaciones' }}</p>
                    </td>
                    <td class="p-3 text-center font-mono text-[10px] text-slate-300">
                      {{ cert.fecha_vencimiento ? formatDate(cert.fecha_vencimiento) : 'PERMANENTE' }}
                    </td>
                    <td class="p-3 text-center">
                      <span :class="getBadgeClass(cert.estado_vigencia)">{{ cert.estado_vigencia }}</span>
                    </td>
                    <td class="p-3 text-center">
                      <div class="flex items-center justify-center gap-1.5">
                        <!-- Descargar -->
                        <a 
                          v-if="cert.id_doc"
                          :href="getDownloadUrl(cert.id_doc)"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all inline-flex items-center"
                          title="Descargar documento"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </a>

                        <!-- Eliminar -->
                        <button 
                          @click="deleteCertificado(cert.id_certificado_persona)"
                          class="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Eliminar certificado"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="certificados.length === 0">
                    <td colspan="4" class="p-8 text-center text-slate-500 italic">
                      No hay certificados registrados para este usuario.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- SUB-MODAL FLOTANTE: Cargar Nuevo Certificado -->
    <transition name="fade">
      <div v-if="showAddDocModal" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div @click="showAddDocModal = false" class="absolute inset-0 bg-zinc-950/80 backdrop-blur-md"></div>
        
        <!-- Contenedor del Formulario -->
        <div class="relative bg-[#0b0f19] border border-white/10 rounded-3xl shadow-2xl p-8 max-w-md w-full flex flex-col gap-5 animate-in zoom-in-95">
          <div class="flex items-center justify-between border-b border-white/10 pb-4">
            <h3 class="text-sm font-black text-white uppercase tracking-widest">Cargar Nuevo Certificado</h3>
            <button @click="showAddDocModal = false" class="text-slate-400 hover:text-white transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="space-y-4">
            <!-- Selector Tipo -->
            <div class="space-y-1">
              <label class="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tipo Certificado</label>
              <select 
                v-model="newCert.id_tipo_certificado_persona" 
                class="w-full bg-zinc-950 border border-white/10 rounded-lg p-2.5 text-[10px] font-bold text-white focus:outline-none"
              >
                <option :value="null">Seleccione...</option>
                <option 
                  v-for="t in docTypes" 
                  :key="t.id_tipo_certificado_persona" 
                  :value="t.id_tipo_certificado_persona"
                >
                  {{ t.nombre_tipo }} {{ t.obligatorio ? '(Obligatorio)' : '' }}
                </option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <!-- Emisión -->
              <div class="space-y-1">
                <label class="text-[8px] font-black text-slate-400 uppercase tracking-widest">Fec. Emisión</label>
                <input 
                  type="date" 
                  v-model="newCert.fecha_emision"
                  class="w-full bg-zinc-950 border border-white/10 rounded-lg p-2 text-[10px] text-white focus:outline-none"
                />
              </div>
              <!-- Vencimiento / Permanente -->
              <div class="space-y-1">
                <div class="flex items-center justify-between">
                  <label class="text-[8px] font-black text-slate-400 uppercase tracking-widest">Fec. Vencimiento</label>
                  <label class="inline-flex items-center cursor-pointer gap-1">
                    <input type="checkbox" v-model="isPermanente" @change="onPermanenteChange" class="rounded text-emerald-500 bg-zinc-900 border-white/10 text-xs" />
                    <span class="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Permanente</span>
                  </label>
                </div>
                <input 
                  type="date" 
                  v-model="newCert.fecha_vencimiento"
                  :disabled="isPermanente"
                  class="w-full bg-zinc-950 border border-white/10 rounded-lg p-2 text-[10px] text-white focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <!-- Selector de Archivo Físico -->
            <div class="space-y-1">
              <label class="text-[8px] font-black text-slate-400 uppercase tracking-widest">Archivo PDF/Imagen</label>
              <input 
                type="file" 
                ref="fileInput" 
                @change="onFileSelected" 
                class="hidden" 
                accept="application/pdf,image/*" 
              />
              <button 
                type="button" 
                @click="$refs.fileInput.click()" 
                class="px-4 py-2.5 bg-zinc-950 hover:bg-white/5 border border-white/10 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all w-full"
              >
                <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                <span>{{ isUploading ? 'Subiendo...' : selectedFile ? selectedFile.name : 'Seleccionar Archivo' }}</span>
              </button>
            </div>

            <!-- Observaciones -->
            <div class="space-y-1">
              <label class="text-[8px] font-black text-slate-400 uppercase tracking-widest">Observaciones / Glosa</label>
              <input 
                type="text" 
                v-model="newCert.observaciones"
                placeholder="Ej. Carga de Licencia"
                class="w-full bg-zinc-950 border border-white/10 rounded-lg p-2 text-[10px] text-white focus:outline-none"
              />
            </div>
          </div>

          <!-- Botones de Acción -->
          <div class="flex items-center gap-3 pt-2">
            <button 
              @click="showAddDocModal = false"
              class="w-1/2 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
            >
              Cancelar
            </button>
            <button 
              @click="addCertificado"
              :disabled="isUploading || !newCert.id_tipo_certificado_persona || (!isPermanente && !newCert.fecha_vencimiento)"
              class="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
            >
              {{ isUploading ? 'Subiendo...' : 'Vincular' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Modal para mostrar el QR -->
    <transition name="fade">
      <div v-if="showQR" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div @click="showQR = false" class="absolute inset-0 bg-zinc-950/80 backdrop-blur-md"></div>
        
        <div class="relative bg-[#0b0f19] border border-white/10 rounded-3xl shadow-2xl p-8 max-w-sm w-full flex flex-col gap-5 animate-in zoom-in-95 items-center">
          <div class="flex items-center justify-between border-b border-white/10 pb-4 w-full">
            <h3 class="text-sm font-black text-white uppercase tracking-widest text-center w-full">
              Ficha QR Pública
            </h3>
            <button @click="showQR = false" class="text-slate-400 hover:text-white transition-colors absolute right-8">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p class="text-xs text-slate-400 text-center uppercase tracking-widest mt-2">
            Escanea para ver la ficha
          </p>

          <div class="bg-white p-4 rounded-xl shadow-inner mt-2">
            <QRCode :value="qrValue" :size="200" level="H" />
          </div>

          <p class="text-[10px] font-bold text-emerald-500 uppercase tracking-widest text-center mt-2 border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 rounded-lg w-full">
            TRABAJADOR:<br />
            <span class="text-white text-xs mt-1 block">{{ form.name_frst }} {{ form.apellido_pat }}</span>
          </p>
        </div>
      </div>
    </transition>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import apiAxios from '@/services/api'
import QRCode from 'qrcode.vue'

const props = defineProps({
  userId: { type: Number, required: true }
})

const emit = defineEmits(['close', 'saved'])

// Formularios
const form = reactive({
  name_frst: '',
  name_sec: '',
  apellido_pat: '',
  apellido_mat: '',
  rut: '',
  email: '',
  movil: '',
  cargo: 'Operador',
  activo: true
})

const showQR = ref(false)
const qrValue = computed(() => {
  if (!form.rut) return ''
  const cleanRut = form.rut.replace(/[^0-9kK]/g, '').toUpperCase()
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '')
  return `${window.location.origin}${basePath}/trabajador/${cleanRut}`
})

const certificados = ref([])
const docTypes = ref([])
const isPermanente = ref(false)

const onPermanenteChange = () => {
  if (isPermanente.value) {
    newCert.fecha_vencimiento = ''
  }
}

const selectedFile = ref(null)
const fileInput = ref(null)
const isUploading = ref(false)
const showAddDocModal = ref(false)

const newCert = reactive({
  id_tipo_certificado_persona: null,
  fecha_emision: '',
  fecha_vencimiento: '',
  observaciones: '',
  id_doc: null
})

const onFileSelected = (event) => {
  const file = event.target.files[0]
  if (file) {
    selectedFile.value = file
    if (!newCert.observaciones) {
      newCert.observaciones = file.name
    }
  }
}

const uploadFile = async () => {
  if (!selectedFile.value) return null
  isUploading.value = true
  try {
    const formData = new FormData()
    formData.append('archivo', selectedFile.value)
    formData.append('tipo_doc', 'CERTIFICADO_PERSONA')
    formData.append('tenant_code', 'gsp')
    formData.append('modulo', 'personal')
    formData.append('id_user', props.userId)
    formData.append('estado', 'ACTIVO')

    const res = await apiAxios.post('/v1/storage/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return res.data.data?.id_doc || null
  } catch (err) {
    console.error("Error al subir archivo:", err)
    alert("Error al subir archivo físico al servidor.")
    return null
  } finally {
    isUploading.value = false
  }
}

// Cargar catálogo de tipos e info de usuario
onMounted(async () => {
  await fetchDocTypes()
  await fetchUserDetail()
})

const fetchDocTypes = async () => {
  try {
    const res = await apiAxios.get('/acreditacion/tipos')
    docTypes.value = res.data.data || []
  } catch (err) {
    console.error("Error al obtener tipos de certificados:", err)
  }

  // Fallback garantizado si la API retorna vacio o falla
  if (!docTypes.value || docTypes.value.length === 0) {
    docTypes.value = [
      { id_tipo_certificado_persona: 1, nombre_tipo: 'Licencia de Conducir (A-5 / B / A-2)', obligatorio: true },
      { id_tipo_certificado_persona: 2, nombre_tipo: 'Certificación Rigger Especialista', obligatorio: true },
      { id_tipo_certificado_persona: 3, nombre_tipo: 'Examen de Salud Ocupacional (Grandes Alturas)', obligatorio: true },
      { id_tipo_certificado_persona: 4, nombre_tipo: 'Pase de Ingreso Minero / Censo HSEC', obligatorio: false },
      { id_tipo_certificado_persona: 5, nombre_tipo: 'Cédula de Identidad Vigente', obligatorio: true },
      { id_tipo_certificado_persona: 6, nombre_tipo: 'Contrato de Trabajo GSP / Anexos', obligatorio: true },
      { id_tipo_certificado_persona: 7, nombre_tipo: 'Inducción de Seguridad HSEC', obligatorio: false }
    ]
  }
}

const fetchUserDetail = async () => {
  try {
    const res = await apiAxios.get(`/acreditacion/personal/${props.userId}`)
    const user = res.data.data
    
    form.name_frst = user.name_frst || ''
    form.name_sec = user.name_sec || ''
    form.apellido_pat = user.apellido_pat || ''
    form.apellido_mat = user.apellido_mat || ''
    form.rut = user.rut || ''
    form.email = user.email || ''
    form.movil = user.movil || ''
    form.cargo = user.cargo || 'Operador'
    form.activo = user.activo !== false

    certificados.value = user.certificados || []
  } catch (err) {
    console.error("Error al obtener detalle de usuario:", err)
  }
}

// Guardar datos básicos
const saveFicha = async () => {
  try {
    await apiAxios.put(`/acreditacion/personal/${props.userId}`, { ...form })
    alert("Datos de la ficha guardados correctamente.")
    emit('saved')
  } catch (err) {
    console.error("Error al guardar datos de la ficha:", err)
    alert("Error al guardar datos de la ficha.")
  }
}

// Vincular nuevo certificado
const addCertificado = async () => {
  if (!newCert.id_tipo_certificado_persona) {
    alert("Por favor seleccione un tipo de certificado.")
    return
  }
  if (!isPermanente.value && !newCert.fecha_vencimiento) {
    alert("Por favor ingrese la fecha de vencimiento o marque Permanente.")
    return
  }

  try {
    let idDoc = null
    if (selectedFile.value) {
      idDoc = await uploadFile()
      if (!idDoc) return // Falló la subida
    }

    const payload = {
      ...newCert,
      id_doc: idDoc
    }

    await apiAxios.post(`/acreditacion/personal/${props.userId}/certificados`, payload)
    
    // Resetear formulario
    newCert.id_tipo_certificado_persona = null
    newCert.fecha_emision = ''
    newCert.fecha_vencimiento = ''
    newCert.observaciones = ''
    selectedFile.value = null
    if (fileInput.value) fileInput.value.value = ''
    
    // Recargar expediente
    await fetchUserDetail()
    emit('saved')
    showAddDocModal.value = false
  } catch (err) {
    console.error("Error al agregar certificado:", err)
    alert("Error al guardar el certificado.")
  }
}

// Eliminar certificado
const deleteCertificado = async (idCert) => {
  if (!confirm("¿Está seguro de que desea eliminar este certificado del expediente?")) return

  try {
    await apiAxios.delete(`/acreditacion/personal/${props.userId}/certificados/${idCert}`)
    await fetchUserDetail()
    emit('saved')
  } catch (err) {
    console.error("Error al eliminar certificado:", err)
    alert("Error al eliminar certificado.")
  }
}

// Formateadores
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
  return dateStr
}

const getBadgeClass = (status) => {
  const base = 'text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border'
  switch (status) {
    case 'Vigente':
      return `${base} bg-emerald-500/10 border-emerald-500/20 text-emerald-400`
    case 'Por Vencer':
      return `${base} bg-amber-500/10 border-amber-500/20 text-amber-400`
    case 'Vencido':
      return `${base} bg-red-500/10 border-red-500/20 text-red-400`
    default:
      return `${base} bg-white/5 border-white/10 text-slate-500`
  }
}

const getDownloadUrl = (idDoc) => {
  const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
  return `${base}/archivo/ver/${idDoc}`
}
</script>
