const fs = require('fs');
const filePath = 'ejecucion/frontend/src/views/BacklogView.vue';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add Paperclip to imports
const targetImport = `  Edit3, 
  Trash2, 
  X 
} from 'lucide-vue-next'`;

const replaceImport = `  Edit3, 
  Trash2, 
  X,
  Paperclip 
} from 'lucide-vue-next'`;

if (!content.includes(targetImport)) {
  console.error('Target 1 (import) not found!');
  process.exit(1);
}
content = content.replace(targetImport, replaceImport);

// 2. Table row attachments display (after req.descripcion)
const targetDesc = `                <div v-if="req.descripcion" class="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  {{ req.descripcion }}
                </div>`;

const replaceDesc = `                <div v-if="req.descripcion" class="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  {{ req.descripcion }}
                </div>
                <!-- Miniaturas de Capturas Adjuntas (SPEC-118 / REQ-1129) -->
                <div v-if="req.adjuntos && req.adjuntos.length > 0" class="flex flex-wrap gap-1.5 mt-2">
                  <button 
                    v-for="(adj, aIdx) in req.adjuntos" 
                    :key="aIdx"
                    type="button"
                    @click.stop="verImagenLightbox(adj)"
                    class="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 border border-white/10 hover:border-amber-500/50 text-[10px] text-amber-300 hover:text-white transition-all"
                    title="Ver captura adjunta"
                  >
                    <Paperclip class="w-3 h-3 text-amber-400" />
                    <span class="max-w-[140px] truncate">{{ adj.nombre || adj.name_doc_orig || 'Captura ' + (aIdx + 1) }}</span>
                  </button>
                </div>`;

if (!content.includes(targetDesc)) {
  console.error('Target 2 (desc) not found!');
  process.exit(1);
}
content = content.replace(targetDesc, replaceDesc);

// 3. Dropzone & Paste block in modal form (before buttons)
const targetButtons = `          <div class="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button 
              type="button" 
              @click="mostrarModalReq = false"`;

const replaceButtons = `          <!-- Zona de Capturas Adjuntas (SPEC-118 / REQ-1129) -->
          <div class="border border-white/10 rounded-xl p-3 bg-white/[0.02]">
            <div class="flex items-center justify-between mb-2">
              <label class="text-slate-300 uppercase font-black text-[10px] flex items-center gap-1.5">
                <Paperclip class="w-3.5 h-3.5 text-amber-400" />
                Capturas de Pantalla & Evidencia Visual (Ctrl+V para Pegar)
              </label>
              <button 
                type="button"
                @click="fileInputRef?.click()"
                class="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-amber-400 text-[10px] font-semibold transition-all flex items-center gap-1"
              >
                <span>📎 Adjuntar Imagen</span>
              </button>
              <input 
                ref="fileInputRef" 
                type="file" 
                accept="image/*" 
                multiple 
                class="hidden" 
                @change="onArchivosSeleccionados" 
              />
            </div>

            <!-- Miniaturas -->
            <div v-if="formReq.adjuntos && formReq.adjuntos.length > 0" class="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
              <div 
                v-for="(adj, idx) in formReq.adjuntos" 
                :key="idx" 
                class="relative group rounded-lg overflow-hidden border border-white/10 bg-black/40 aspect-video flex items-center justify-center"
              >
                <img 
                  :src="adj.url_view || adj.url" 
                  :alt="adj.nombre || adj.name_doc_orig" 
                  class="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform" 
                  @click="verImagenLightbox(adj)" 
                />
                <button 
                  type="button" 
                  @click.stop="eliminarAdjunto(idx)" 
                  class="absolute top-1 right-1 p-1 bg-rose-600/80 hover:bg-rose-500 rounded text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Eliminar captura"
                >
                  <Trash2 class="w-3 h-3" />
                </button>
              </div>
            </div>

            <div 
              @paste="onPegarImagen"
              tabindex="0"
              class="border border-dashed border-white/10 hover:border-amber-500/50 rounded-lg p-3 text-center text-slate-400 text-[11px] cursor-pointer hover:bg-white/[0.02] transition-colors focus:border-amber-500 focus:outline-none"
              @click="fileInputRef?.click()"
            >
              <div v-if="subiendoCaptura" class="flex items-center justify-center gap-2 text-amber-400">
                <span class="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></span>
                <span>Subiendo captura...</span>
              </div>
              <div v-else>
                Haz clic o arrastra imágenes aquí, o presiona <kbd class="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px] text-amber-300">Ctrl + V</kbd> para pegar directamente una captura copiada.
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button 
              type="button" 
              @click="mostrarModalReq = false"`;

if (!content.includes(targetButtons)) {
  console.error('Target 3 (buttons) not found!');
  process.exit(1);
}
content = content.replace(targetButtons, replaceButtons);

// 4. Lightbox Modal before </template>
const targetEndTemplate = `    <!-- ================= MODAL NUEVO RELEASE ================= -->`;
const replaceEndTemplate = `    <!-- ================= LIGHTBOX VISOR IMAGEN ================= -->
    <Teleport to="body">
    <div 
      v-if="lightboxImagen" 
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      @click="lightboxImagen = null"
    >
      <div class="relative max-w-4xl max-h-[90vh] flex flex-col items-center" @click.stop>
        <button 
          @click="lightboxImagen = null" 
          class="absolute -top-10 right-0 p-2 text-white hover:text-amber-400 transition-colors"
        >
          <X class="w-6 h-6" />
        </button>
        <img 
          :src="lightboxImagen.url_view || lightboxImagen.url" 
          :alt="lightboxImagen.nombre || lightboxImagen.name_doc_orig" 
          class="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-white/20"
        />
        <div class="text-slate-300 text-xs mt-2 text-center font-mono">
          {{ lightboxImagen.nombre || lightboxImagen.name_doc_orig }}
        </div>
      </div>
    </div>
    </Teleport>

    <!-- ================= MODAL NUEVO RELEASE ================= -->`;

if (!content.includes(targetEndTemplate)) {
  console.error('Target 4 (endTemplate) not found!');
  process.exit(1);
}
content = content.replace(targetEndTemplate, replaceEndTemplate);

// 5. In script setup: formReq defaults & helpers
const targetFormReq = `const formReq = ref({
  nombre_requerimiento: '',
  descripcion: '',
  prioridad: 'Media',
  solicitado_por: '',
  estado: 'Pendiente',
  fecha_registro: new Date().toISOString().split('T')[0],
  fecha_implementacion: ''
})`;

const replaceFormReq = `const formReq = ref({
  nombre_requerimiento: '',
  descripcion: '',
  prioridad: 'Media',
  solicitado_por: '',
  estado: 'Pendiente',
  fecha_registro: new Date().toISOString().split('T')[0],
  fecha_implementacion: '',
  adjuntos: []
})
const subiendoCaptura = ref(false)
const lightboxImagen = ref(null)
const fileInputRef = ref(null)`;

if (!content.includes(targetFormReq)) {
  console.error('Target 5 (formReq ref) not found!');
  process.exit(1);
}
content = content.replace(targetFormReq, replaceFormReq);

// 6. abrirModalNuevo and abrirModalEditar
const targetAbrir = `function abrirModalNuevo() {
  editandoReq.value = null
  formReq.value = {
    nombre_requerimiento: '',
    descripcion: '',
    prioridad: 'Media',
    solicitado_por: currentUser.value?.name || currentUser.value?.name_frst || 'Sergio Gajardo',
    estado: 'Pendiente',
    fecha_registro: new Date().toISOString().split('T')[0],
    fecha_implementacion: ''
  }
  mostrarModalReq.value = true
}

function abrirModalEditar(req) {
  editandoReq.value = req
  formReq.value = {
    nombre_requerimiento: req.nombre_requerimiento,
    descripcion: req.descripcion || '',
    prioridad: req.prioridad || 'Media',
    solicitado_por: req.solicitado_por || '',
    estado: req.estado || 'Pendiente',
    fecha_registro: normalizarFechaInput(req.fecha_registro),
    fecha_implementacion: normalizarFechaInput(req.fecha_implementacion)
  }
  mostrarModalReq.value = true
}`;

const replaceAbrir = `function abrirModalNuevo() {
  editandoReq.value = null
  formReq.value = {
    nombre_requerimiento: '',
    descripcion: '',
    prioridad: 'Media',
    solicitado_por: currentUser.value?.name || currentUser.value?.name_frst || 'Sergio Gajardo',
    estado: 'Pendiente',
    fecha_registro: new Date().toISOString().split('T')[0],
    fecha_implementacion: '',
    adjuntos: []
  }
  mostrarModalReq.value = true
}

function abrirModalEditar(req) {
  editandoReq.value = req
  formReq.value = {
    nombre_requerimiento: req.nombre_requerimiento,
    descripcion: req.descripcion || '',
    prioridad: req.prioridad || 'Media',
    solicitado_por: req.solicitado_por || '',
    estado: req.estado || 'Pendiente',
    fecha_registro: normalizarFechaInput(req.fecha_registro),
    fecha_implementacion: normalizarFechaInput(req.fecha_implementacion),
    adjuntos: Array.isArray(req.adjuntos) ? [...req.adjuntos] : []
  }
  mostrarModalReq.value = true
}

function verImagenLightbox(adj) {
  lightboxImagen.value = adj
}

function eliminarAdjunto(idx) {
  formReq.value.adjuntos.splice(idx, 1)
}

async function subirImagenBlob(file, customName) {
  if (!file) return
  subiendoCaptura.value = true
  try {
    const fd = new FormData()
    const fileName = customName || file.name || ('captura_' + Date.now() + '.png')
    fd.append('file', file, fileName)
    fd.append('tenant_code', 'gsp')
    fd.append('modulo', 'backlog')
    fd.append('tipo_doc', 'CAPTURA_ERROR')
    fd.append('mimetype', file.type || 'image/png')
    fd.append('name_doc_orig', fileName)

    const res = await apiAxios.post('/v1/storage/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    if (res.data?.data) {
      const fileData = res.data.data
      if (!Array.isArray(formReq.value.adjuntos)) {
        formReq.value.adjuntos = []
      }
      formReq.value.adjuntos.push({
        id_doc: fileData.id_doc,
        nombre: fileName,
        name_doc_orig: fileName,
        url_view: fileData.url_view,
        url_download: fileData.url_download,
        fecha_subida: new Date().toISOString()
      })
    }
  } catch (err) {
    console.error('Error subiendo imagen al storage:', err)
    alert('Error al subir la captura de pantalla: ' + (err.response?.data?.message || err.message))
  } finally {
    subiendoCaptura.value = false
  }
}

function onArchivosSeleccionados(event) {
  const files = event.target.files
  if (!files || files.length === 0) return
  for (let i = 0; i < files.length; i++) {
    subirImagenBlob(files[i])
  }
  event.target.value = ''
}

function onPegarImagen(event) {
  const clipboardItems = event.clipboardData?.items
  if (!clipboardItems) return
  for (let i = 0; i < clipboardItems.length; i++) {
    const item = clipboardItems[i]
    if (item.type.indexOf('image') !== -1) {
      const blob = item.getAsFile()
      if (blob) {
        event.preventDefault()
        subirImagenBlob(blob, 'captura_' + Date.now() + '.png')
        break
      }
    }
  }
}`;

if (!content.includes(targetAbrir)) {
  console.error('Target 6 (abrir modals) not found!');
  process.exit(1);
}
content = content.replace(targetAbrir, replaceAbrir);

fs.writeFileSync(filePath, content, 'utf8');
console.log('SUCCESS: BacklogView.vue updated cleanly!');
