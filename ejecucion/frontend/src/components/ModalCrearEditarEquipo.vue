<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
    <div class="bg-zinc-950 border border-white/10 rounded-[2.5rem] w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden relative text-left">
      
      <!-- HEADER -->
      <div class="px-8 py-6 border-b border-white/5 bg-gradient-to-r from-blue-600/5 via-blue-500/5 to-transparent flex items-center justify-between shrink-0">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-lg">
            <svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
          </div>
          <div>
            <h2 class="text-xl font-black text-white uppercase tracking-widest">
              {{ isEdit ? 'Editar Equipo Flota' : 'Registrar Nuevo Equipo' }}
            </h2>
            <p class="text-xs text-slate-400 mt-0.5 uppercase tracking-tighter opacity-70">
              Clasificación técnica, capacidad y expediente de documentos
            </p>
          </div>
        </div>
        <button @click="$emit('close')" class="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <!-- BODY -->
      <div class="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0">
        
        <!-- COLUMNA IZQUIERDA: DATOS TÉCNICOS -->
        <div class="w-full md:w-1/2 p-8 overflow-y-auto border-r border-white/5 space-y-6">
          <h3 class="text-xs font-black uppercase text-blue-500 tracking-widest border-b border-blue-500/20 pb-2">
            1. Ficha Técnica y Atributos
          </h3>
          
          <div class="grid grid-cols-2 gap-4">
            <!-- Patente -->
            <div class="space-y-1.5">
              <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Patente / Registro</label>
              <input 
                type="text" 
                v-model="form.patente" 
                placeholder="EJ. LFJW-81 O S/P" 
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50 uppercase tracking-wider"
              />
            </div>
            <!-- Código Interno -->
            <div class="space-y-1.5">
              <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Código Interno</label>
              <input 
                type="text" 
                v-model="form.codigo_interno" 
                placeholder="EJ. TRC-105" 
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50 uppercase tracking-wider"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <!-- Número de Serie -->
            <div class="space-y-1.5 col-span-2">
              <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Número de Serie (Único)</label>
              <input 
                type="text" 
                v-model="form.numero_serie" 
                placeholder="INGRESE EL NÚMERO DE SERIE DEL FABRICANTE..." 
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50 uppercase tracking-wider"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <!-- Marca -->
            <div class="space-y-1.5">
              <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Marca</label>
              <input 
                type="text" 
                v-model="form.marca" 
                placeholder="EJ. LIEBHERR" 
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50 uppercase tracking-wider"
              />
            </div>
            <!-- Modelo -->
            <div class="space-y-1.5">
              <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Modelo</label>
              <input 
                type="text" 
                v-model="form.modelo" 
                placeholder="EJ. LTM-1050" 
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50 uppercase tracking-wider"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <!-- Capacidad -->
            <div class="space-y-1.5">
              <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Capacidad Máxima</label>
              <input 
                type="number" 
                v-model="form.capacidad_maxima" 
                placeholder="EJ. 100" 
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <!-- Unidad de Capacidad -->
            <div class="space-y-1.5">
              <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Unidad</label>
              <select 
                v-model="form.unidad_capacidad" 
                class="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50 uppercase"
              >
                <option value="T">Toneladas (T)</option>
                <option value="Kg">Kilogramos (Kg)</option>
                <option value="Lbs">Libras (Lbs)</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <!-- Empresa Propietaria -->
            <div class="space-y-1.5">
              <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Empresa Propietaria</label>
              <select 
                v-model="form.id_empresa" 
                class="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50 uppercase"
              >
                <option :value="9">Grúas San Pablo</option>
                <option :value="7">Bestmaq Arriendos</option>
                <option :value="8">Logística del Sur</option>
                <option :value="11">Royal Holding</option>
              </select>
            </div>
            <!-- Año Fabricación -->
            <div class="space-y-1.5">
              <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Año de Fabricación</label>
              <input 
                type="number" 
                v-model="form.ano_fabricacion" 
                placeholder="EJ. 2020" 
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <!-- Categoría -->
            <div class="space-y-1.5">
              <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Categoría de Izaje</label>
              <select 
                v-model="selectedCategory" 
                @change="onCategoryChange"
                class="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50 uppercase"
              >
                <option :value="null">Seleccione...</option>
                <option 
                  v-for="cat in categories" 
                  :key="cat.id_categoria" 
                  :value="cat"
                >
                  {{ cat.nombre_categoria }}
                </option>
              </select>
            </div>
            <!-- Subcategoría -->
            <div class="space-y-1.5">
              <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Subcategoría</label>
              <select 
                v-model="form.id_subcategoria" 
                :disabled="!selectedCategory"
                class="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50 uppercase disabled:opacity-50"
              >
                <option :value="null">Seleccione...</option>
                <option 
                  v-for="sub in subcategories" 
                  :key="sub.id_subcategoria" 
                  :value="sub.id_subcategoria"
                >
                  {{ sub.nombre_subcategoria }}
                </option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <!-- Estado Operativo -->
            <div class="space-y-1.5">
              <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Estado Operativo</label>
              <select 
                v-model="form.estado" 
                class="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50 uppercase"
              >
                <option value="OPERATIVO">OPERATIVO 🟢</option>
                <option value="MANTENCION">MANTENCIÓN 🟡</option>
                <option value="DETENIDO">DETENIDO 🔴</option>
              </select>
            </div>
            <!-- Tipo de Equipo (Flat Text) -->
            <div class="space-y-1.5">
              <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Clase de Maquinaria</label>
              <input 
                type="text" 
                v-model="form.tipo_equipo" 
                placeholder="EJ. GRÚA MÓVIL" 
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50 uppercase tracking-wider"
              />
            </div>
          </div>

          <!-- Observaciones -->
          <div class="space-y-1.5">
            <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Observaciones Generales</label>
            <textarea 
              v-model="form.observaciones" 
              rows="3" 
              placeholder="INGRESE NOTAS DE INVENTARIO O REQUERIMIENTOS..." 
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50 uppercase"
            ></textarea>
          </div>
        </div>

        <!-- COLUMNA DERECHA: EXPEDIENTE DIGITAL DE DOCUMENTOS -->
        <div class="w-full md:w-1/2 p-8 overflow-y-auto flex flex-col min-h-0 bg-white/[0.01]">
          <h3 class="text-xs font-black uppercase text-emerald-500 tracking-widest border-b border-emerald-500/20 pb-2 shrink-0">
            2. Expediente Digital de Certificados
          </h3>

          <!-- Formulario de Subida de Documento -->
          <div class="mt-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4 shrink-0">
            <h4 class="text-[10px] font-black uppercase text-white tracking-widest">Cargar Nuevo Documento</h4>
            
            <div class="grid grid-cols-2 gap-3">
              <!-- Selector Tipo de Certificado -->
              <div class="space-y-1">
                <label class="text-[8px] font-black text-slate-400 uppercase">Tipo Documento</label>
                <select 
                  v-model="newDoc.id_tipo_certificado" 
                  class="w-full bg-zinc-950 border border-white/10 rounded-lg p-2 text-[10px] font-bold text-white focus:outline-none"
                >
                  <option :value="null">Seleccione...</option>
                  <option 
                    v-for="t in docTypes" 
                    :key="t.id_tipo_certificado" 
                    :value="t.id_tipo_certificado"
                  >
                    {{ t.nombre_tipo }}
                  </option>
                </select>
              </div>
              <!-- Entidad Emisora -->
              <div class="space-y-1">
                <label class="text-[8px] font-black text-slate-400 uppercase">Entidad Emisora</label>
                <input 
                  type="text" 
                  v-model="newDoc.entidad_emisora" 
                  placeholder="EJ. PRT, INDEPENDIENTE" 
                  class="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-[10px] font-bold text-white focus:outline-none uppercase"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <!-- Fecha Emision -->
              <div class="space-y-1">
                <label class="text-[8px] font-black text-slate-400 uppercase">Fecha Emisión</label>
                <input 
                  type="date" 
                  v-model="newDoc.fecha_emision" 
                  class="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-[10px] font-bold text-white focus:outline-none"
                />
              </div>
              <!-- Fecha Vencimiento -->
              <div class="space-y-1">
                <label class="text-[8px] font-black text-slate-400 uppercase">Fecha Vencimiento</label>
                <input 
                  type="date" 
                  v-model="newDoc.fecha_vencimiento" 
                  class="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-[10px] font-bold text-white focus:outline-none"
                />
              </div>
            </div>

            <!-- Upload input file -->
            <div class="flex items-center gap-4 pt-2">
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
                class="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-all"
              >
                <svg class="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                <span>{{ isUploading ? 'Subiendo...' : selectedFile ? selectedFile.name : 'Seleccionar Archivo' }}</span>
              </button>
              <button 
                type="button" 
                @click="addDocumentToList" 
                :disabled="!newDoc.id_tipo_certificado || !newDoc.fecha_vencimiento || !selectedFile || isUploading"
                class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider ml-auto disabled:opacity-50 disabled:hover:bg-emerald-600 transition-all"
              >
                Adjuntar
              </button>
            </div>
          </div>

          <!-- Listado de Certificados -->
          <div class="flex-1 min-h-0 overflow-y-auto mt-6 space-y-3">
            <div 
              v-for="(doc, idx) in documentsList" 
              :key="idx" 
              class="flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors"
            >
              <div class="flex items-start gap-3 text-left">
                <div class="w-8 h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                </div>
                <div>
                  <h4 class="text-xs font-bold text-white uppercase">{{ getDocTypeName(doc.id_tipo_certificado) }}</h4>
                  <p class="text-[9px] text-slate-400 mt-0.5">
                    Expira: <span class="font-bold text-white">{{ formatDate(doc.fecha_vencimiento) }}</span>
                    <span v-if="doc.entidad_emisora"> • {{ doc.entidad_emisora }}</span>
                  </p>
                  <p v-if="doc.name_doc_orig" class="text-[8px] text-blue-400 truncate max-w-[200px] mt-1 font-mono">
                    {{ doc.name_doc_orig }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <button 
                  v-if="doc.id_certificado"
                  @click="removeCertificate(doc, idx)" 
                  class="p-2 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                  title="Eliminar certificado"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
                <button 
                  v-else
                  @click="documentsList.splice(idx, 1)" 
                  class="p-2 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                  title="Quitar"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
            </div>
            
            <div v-if="documentsList.length === 0" class="text-center py-12 text-slate-500 italic text-xs">
              No hay certificados registrados para este equipo.
            </div>
          </div>
        </div>

      </div>

      <!-- FOOTER -->
      <div class="px-8 py-5 border-t border-white/5 bg-zinc-900/50 flex items-center justify-between shrink-0">
        <p class="text-[10px] text-slate-500 font-bold uppercase">
          Todos los cambios impactarán en los semáforos de la Consola de Flota
        </p>
        <div class="flex items-center gap-4">
          <button 
            @click="$emit('close')" 
            class="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-black uppercase tracking-widest border border-white/10 transition-colors"
          >
            Cancelar
          </button>
          <button 
            @click="saveEquipment" 
            :disabled="isSaving || !form.marca || !form.modelo || !form.numero_serie || !form.tipo_equipo"
            class="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors disabled:opacity-50"
          >
            {{ isSaving ? 'Guardando...' : 'Guardar Equipo' }}
          </button>
        </div>
      </div>

    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import apiAxios from '@/services/api'

const props = defineProps({
  isEdit: {
    type: Boolean,
    default: false
  },
  equipmentId: {
    type: [Number, String],
    default: null
  }
})

const emit = defineEmits(['close', 'saved'])

// Form principal
const form = ref({
  patente: '',
  codigo_interno: '',
  numero_serie: '',
  marca: '',
  modelo: '',
  id_empresa: 9,
  ano_fabricacion: new Date().getFullYear(),
  capacidad_maxima: null,
  unidad_capacidad: 'T',
  id_subcategoria: null,
  estado: 'OPERATIVO',
  tipo_equipo: '',
  observaciones: ''
})

// Categorías y Subcategorías
const categories = ref([])
const selectedCategory = ref(null)
const subcategories = ref([])

// Tipos de Documentos
const docTypes = ref([])

// Archivo seleccionado a subir
const selectedFile = ref(null)
const fileInput = ref(null)
const isUploading = ref(false)
const isSaving = ref(false)

// Objeto de nuevo certificado
const newDoc = ref({
  id_tipo_certificado: null,
  fecha_emision: '',
  fecha_vencimiento: '',
  entidad_emisora: '',
  id_doc: null
})

// Listado de certificados cargados/vinculados
const documentsList = ref([])

const loadData = async () => {
  try {
    // 1. Cargar Categorías
    const catRes = await apiAxios.get('/tequ-equipos/categorias')
    categories.value = catRes.data.data || []

    // 2. Cargar Tipos de Certificado
    const typeRes = await apiAxios.get('/tequ-equipos/tipos-certificado')
    docTypes.value = typeRes.data.data || []

    // 3. Si es edición, cargar el equipo
    if (props.isEdit && props.equipmentId) {
      const eqRes = await apiAxios.get(`/tequ-equipos/${props.equipmentId}`)
      const eq = eqRes.data.data
      if (eq) {
        form.value = {
          patente: eq.patente || '',
          codigo_interno: eq.codigo_interno || '',
          numero_serie: eq.numero_serie || '',
          marca: eq.marca || '',
          modelo: eq.modelo || '',
          id_empresa: eq.id_empresa || 9,
          ano_fabricacion: eq.ano_fabricacion || new Date().getFullYear(),
          capacidad_maxima: eq.capacidad_maxima || null,
          unidad_capacidad: eq.unidad_capacidad || 'T',
          id_subcategoria: eq.id_subcategoria || null,
          estado: eq.estado || 'OPERATIVO',
          tipo_equipo: eq.tipo_equipo || '',
          observaciones: eq.observaciones || ''
        }

        // Seleccionar categoría correspondiente
        if (eq.id_categoria) {
          const matchCat = categories.value.find(c => c.id_categoria === eq.id_categoria)
          if (matchCat) {
            selectedCategory.value = matchCat
            subcategories.value = matchCat.subcategories || []
          }
        }
      }

      // Cargar certificados del equipo
      const certRes = await apiAxios.get(`/tequ-equipos/${props.equipmentId}/certificados`)
      documentsList.value = certRes.data.data || []
    }
  } catch (err) {
    console.error('Error al cargar datos del formulario:', err)
  }
}

const onCategoryChange = () => {
  if (selectedCategory.value) {
    subcategories.value = selectedCategory.value.subcategories || []
    form.value.id_subcategoria = null
  } else {
    subcategories.value = []
    form.value.id_subcategoria = null
  }
}

const getDocTypeName = (typeId) => {
  const match = docTypes.value.find(t => t.id_tipo_certificado === typeId)
  return match ? match.nombre_tipo : 'Certificado'
}

const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-CL')
}

// Carga física del archivo en backend (/api/archivo)
const onFileSelected = async (e) => {
  const file = e.target.files[0]
  if (!file) return

  selectedFile.value = file
  isUploading.value = true

  try {
    const formData = new FormData()
    formData.append('archivo', file)
    formData.append('tenant_code', 'gsp')
    formData.append('modulo', 'equipos')
    formData.append('tipo_doc', 'CERTIFICADO')
    formData.append('mimetype', file.type)
    formData.append('name_doc_orig', file.name)
    formData.append('estado', 'A')

    const res = await apiAxios.post('/v1/storage/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    if (res.data?.data?.id_doc) {
      newDoc.value.id_doc = res.data.data.id_doc
    }
  } catch (err) {
    console.error('Error al subir archivo:', err)
    alert('No se pudo cargar el archivo. Inténtelo de nuevo.')
    selectedFile.value = null
  } finally {
    isUploading.value = false
  }
}

// Agregar certificado a la lista local
const addDocumentToList = () => {
  if (!newDoc.value.id_tipo_certificado || !newDoc.value.fecha_vencimiento || !newDoc.value.id_doc) return

  const item = {
    id_tipo_certificado: newDoc.value.id_tipo_certificado,
    fecha_emision: newDoc.value.fecha_emision || null,
    fecha_vencimiento: newDoc.value.fecha_vencimiento,
    entidad_emisora: newDoc.value.entidad_emisora || 'MANUAL',
    id_doc: newDoc.value.id_doc,
    name_doc_orig: selectedFile.value.name
  }

  documentsList.value.push(item)

  // Limpiar
  newDoc.value = {
    id_tipo_certificado: null,
    fecha_emision: '',
    fecha_vencimiento: '',
    entidad_emisora: '',
    id_doc: null
  }
  selectedFile.value = null
  if (fileInput.value) fileInput.value.value = ''
}

// Remover certificado de la lista y base de datos
const removeCertificate = async (doc, idx) => {
  if (confirm('¿Está seguro de eliminar este certificado? Esta acción no se puede deshacer.')) {
    try {
      if (doc.id_certificado) {
        await apiAxios.delete(`/tequ-equipos/${props.equipmentId}/certificados/${doc.id_certificado}`)
      }
      documentsList.value.splice(idx, 1)
    } catch (err) {
      console.error('Error al borrar certificado:', err)
      alert('Error al eliminar certificado de la base de datos.')
    }
  }
}

// Guardar equipo y sus certificados
const saveEquipment = async () => {
  isSaving.value = true
  try {
    let eqId = props.equipmentId
    
    // Si la marca/modelo no están normalizados en la subcategoría, guardamos como texto plano
    const payload = { ...form.value }

    if (props.isEdit) {
      await apiAxios.put(`/tequ-equipos/${eqId}`, payload)
    } else {
      const createRes = await apiAxios.post('/tequ-equipos', payload)
      eqId = createRes.data.data.id_equipo
    }

    // Vincular/guardar los certificados nuevos
    for (const cert of documentsList.value) {
      // Si no tiene id_certificado, es un documento nuevo
      if (!cert.id_certificado) {
        await apiAxios.post(`/tequ-equipos/${eqId}/certificados`, {
          id_tipo_certificado: cert.id_tipo_certificado,
          fecha_emision: cert.fecha_emision,
          fecha_vencimiento: cert.fecha_vencimiento,
          entidad_emisora: cert.entidad_emisora,
          id_doc: cert.id_doc,
          estado_validacion: 'Aprobado',
          observaciones: cert.observaciones || ''
        })
      }
    }

    emit('saved')
  } catch (err) {
    console.error('Error al guardar equipo:', err)
    alert(err.response?.data?.error || err.message || 'Error al guardar el equipo.')
  } finally {
    isSaving.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
/* Transición simple */
.state-ok {
  background-color: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border-color: rgba(16, 185, 129, 0.2);
}
</style>
