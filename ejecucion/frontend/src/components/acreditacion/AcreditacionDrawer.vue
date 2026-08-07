<template>
  <transition enter-active-class="transition duration-300 ease-out" enter-from-class="translate-x-full opacity-0" enter-to-class="translate-x-0 opacity-100" leave-active-class="transition duration-200 ease-in" leave-from-class="translate-x-0 opacity-100" leave-to-class="translate-x-full opacity-0">
    <div v-if="isOpen" class="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm select-none">
      <div class="w-full max-w-2xl bg-[#0c1220] border-l border-white/10 text-slate-100 flex flex-col h-full shadow-2xl">
        
        <!-- Header -->
        <div class="p-5 bg-[#0f1629] border-b border-white/10 flex justify-between items-center">
          <div>
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                AUDITORÍA DE ACREDITACIÓN
              </span>
              <span class="text-xs text-slate-400 font-mono">{{ detalle?.encabezado?.codi_proyecto }}</span>
            </div>
            <h3 class="text-lg font-bold text-white mt-1">{{ detalle?.encabezado?.nombre_cliente || 'Proyecto GSP' }}</h3>
            <p class="text-xs text-slate-400">{{ detalle?.encabezado?.name_proyecto }}</p>
          </div>
          <button @click="close" class="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Body / Expediente List -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          
          <!-- Progress & Status Banner -->
          <div class="p-4 bg-[#151d35] border border-white/5 rounded-2xl flex items-center justify-between">
            <div class="space-y-1">
              <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">Avance del Expediente</div>
              <div class="flex items-center gap-3">
                <div class="text-2xl font-black font-mono text-emerald-400">{{ detalle?.encabezado?.porcentaje_avance || 0 }}%</div>
                <span :class="getStatusBadgeClass(detalle?.encabezado?.estado_acreditacion)" class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border">
                  {{ detalle?.encabezado?.estado_acreditacion }}
                </span>
              </div>
            </div>

            <!-- Role Selector Simulator -->
            <div class="flex items-center gap-2 bg-black/30 p-1.5 rounded-xl border border-white/5">
              <span class="text-[10px] font-bold text-slate-400 px-2 uppercase">Modo:</span>
              <button 
                @click="modoAnalista = false" 
                :class="!modoAnalista ? 'bg-amber-500 text-black font-bold' : 'text-slate-400 hover:text-white'"
                class="px-2.5 py-1 rounded-lg text-xs transition-all"
              >
                Comercial (Carga)
              </button>
              <button 
                @click="modoAnalista = true" 
                :class="modoAnalista ? 'bg-emerald-500 text-black font-bold' : 'text-slate-400 hover:text-white'"
                class="px-2.5 py-1 rounded-lg text-xs transition-all"
              >
                Analista (Auditoría)
              </button>
            </div>
          </div>

          <!-- Document List Table -->
          <div class="space-y-4">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <FileCheck class="w-4 h-4 text-emerald-400" />
              Requisitos Documentales Obligatorios ({{ detalle?.documentos?.length || 0 }})
            </h4>

            <div v-for="doc in detalle?.documentos" :key="doc.id_acreditacion_doc" class="p-4 bg-[#11192e] border border-white/5 rounded-2xl space-y-3 hover:border-white/10 transition-all">
              <div class="flex justify-between items-start">
                <div>
                  <div class="text-xs font-bold text-white">{{ doc.nombre_requisito }}</div>
                  <div class="text-[10px] text-slate-400 mt-0.5">Categoría: <span class="text-slate-300 font-medium">{{ doc.categoria_doc }}</span></div>
                </div>
                <span :class="getDocStatusClass(doc.estado_doc)" class="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border">
                  {{ doc.estado_doc }}
                </span>
              </div>

              <!-- Observations if rejected -->
              <div v-if="doc.observacion_analista" class="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300">
                <span class="font-bold">Observación Analista:</span> {{ doc.observacion_analista }}
              </div>

              <!-- Action Area -->
              <div class="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                <!-- File link or mock upload -->
                <div class="flex items-center gap-2">
                  <FileText class="w-4 h-4 text-slate-400" />
                  <span v-if="doc.name_file_original" class="text-emerald-400 font-medium truncate max-w-[200px]">{{ doc.name_file_original }}</span>
                  <span v-else class="text-slate-500 italic">Sin documento adjunto</span>
                </div>

                <!-- Mode Commercial: Upload Button -->
                <div v-if="!modoAnalista" class="flex gap-2">
                  <label class="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg cursor-pointer text-xs transition-all flex items-center gap-1">
                    <Upload class="w-3.5 h-3.5" /> Subir PDF
                    <input type="file" accept="application/pdf" class="hidden" @change="simularSubida(doc)" />
                  </label>
                </div>

                <!-- Mode Analyst: Approve / Reject Buttons -->
                <div v-else-if="modoAnalista && doc.estado_doc === 'SUBIDO'" class="flex gap-2">
                  <button @click="auditar(doc, 'APROBADO')" class="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg text-xs transition-all flex items-center gap-1">
                    <Check class="w-3.5 h-3.5" /> Aprobar
                  </button>
                  <button @click="abrirModalRechazo(doc)" class="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 font-bold rounded-lg text-xs transition-all flex items-center gap-1">
                    <XCircle class="w-3.5 h-3.5" /> Observar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-4 bg-[#0f1629] border-t border-white/10 flex justify-between items-center text-xs">
          <div class="text-slate-400">Analista Asignado: <span class="text-white font-semibold">{{ detalle?.encabezado?.nombre_analista || 'Por Asignar' }}</span></div>
          <button @click="descargarDossier" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20">
            <Download class="w-4 h-4" /> Descargar Dossier PDF Unificado
          </button>
        </div>

      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, watch } from 'vue'
import { X, FileCheck, FileText, Upload, Check, XCircle, Download } from 'lucide-vue-next'

const props = defineProps({
  isOpen: Boolean,
  acreditacionId: Number
})

const emit = defineEmits(['close', 'updated'])

const modoAnalista = ref(false)
const detalle = ref(null)

watch(() => props.acreditacionId, (newId) => {
  if (newId) cargarDetalle(newId)
})

const cargarDetalle = async (id) => {
  try {
    const res = await fetch(`https://servidor.leanglobal.cl/lg-gsp/api/acreditaciones/${id}`)
    if (res.ok) {
      detalle.value = await res.json()
    }
  } catch(e) {
    console.error("Error cargando detalle acreditacion:", e)
  }
}

const close = () => emit('close')

const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'ACREDITADO_OK': return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
    case 'OBSERVADO': return 'bg-red-500/10 border-red-500/30 text-red-400'
    default: return 'bg-amber-500/10 border-amber-500/30 text-amber-400'
  }
}

const getDocStatusClass = (status) => {
  switch (status) {
    case 'APROBADO': return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
    case 'RECHAZADO': return 'bg-red-500/10 border-red-500/30 text-red-400'
    case 'SUBIDO': return 'bg-blue-500/10 border-blue-500/30 text-blue-400'
    default: return 'bg-slate-500/10 border-slate-500/30 text-slate-400'
  }
}

const simularSubida = async (doc) => {
  doc.estado_doc = 'SUBIDO'
  doc.name_file_original = 'Documento_Acreditado_' + doc.id_acreditacion_doc + '.pdf'
}

const auditar = async (doc, estado, obs = '') => {
  try {
    const res = await fetch(`https://servidor.leanglobal.cl/lg-gsp/api/acreditaciones/documento/${doc.id_acreditacion_doc}/auditar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado_doc: estado, observacion_analista: obs })
    })
    if (res.ok) {
      await cargarDetalle(props.acreditacionId)
      emit('updated')
    }
  } catch(e) {
    console.error("Error al auditar:", e)
  }
}

const abrirModalRechazo = (doc) => {
  const obs = prompt("Ingrese la observación o motivo de rechazo:")
  if (obs) auditar(doc, 'RECHAZADO', obs)
}

const descargarDossier = () => {
  alert("Generando Dossier Unificado de Acreditación en PDF...")
}
</script>
