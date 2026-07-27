<template>
  <div class="flex flex-col xl:flex-row items-start gap-6 relative p-4 lg:p-6 bg-[#0a0a0a] min-h-screen text-white">
    
    <!-- SIDEBAR: HISTORIAL -->
    <div class="w-full xl:w-80 xl:sticky top-6 shrink-0 bg-[#141414] border border-white/10 rounded-2xl flex flex-col shadow-2xl xl:max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-hide no-print">
      <div class="p-5 border-b border-white/5 sticky top-0 bg-[#141414]/95 backdrop-blur-sm z-10 flex items-center justify-between">
        <h2 class="text-xs font-bold uppercase tracking-widest text-emerald-500 flex items-center gap-2">
          <History class="w-4 h-4" /> Historial RECSS
        </h2>
        <span class="bg-white/5 text-white/50 text-[10px] font-bold px-2 py-0.5 rounded-full">{{ pastEvaluations.length }}</span>
      </div>
      <div class="px-4 pb-4 overflow-y-auto flex-1 text-center mt-4">
        <button @click="showSelectorModal = true" class="w-full border border-dashed border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-500 rounded-xl p-3 text-[11px] font-black uppercase mb-4 transition-all">
          + Nueva Auditoría
        </button>
        <div class="flex flex-col gap-1">
          <div v-for="informe in pastEvaluations" :key="informe.id" @click="loadInforme(informe)" 
               :class="activeInformeId === informe.id ? 'bg-emerald-500/10 border-emerald-500/30' : 'border-transparent'" 
               class="flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer hover:bg-white/5 transition-all">
            <FileText :class="informe.id % 2 === 0 ? 'text-amber-500' : 'text-emerald-500'" class="w-4 h-4 shadow-sm" />
            <div class="flex-1 min-w-0 flex flex-col text-left">
              <span class="text-[11px] font-bold truncate uppercase tracking-tight text-white/90">{{ informe.month }}</span>
              <span class="text-[9px] font-black opacity-40 uppercase tracking-widest">{{ informe.status }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MAIN CONTENT -->
    <div class="flex-1 min-w-0 space-y-6 w-full no-print">
      
      <!-- Header Adaptive -->
      <div :class="isScrolled ? 'py-2 bg-zinc-950 border-emerald-500/30' : 'py-6 bg-background border-white/5'" class="flex flex-col gap-1 sticky top-0 z-50 transition-all duration-300 border-b shadow-2xl -mx-2 px-2">
        <div class="flex items-center justify-between px-6">
          <div class="flex items-center gap-4">
            <div :class="isScrolled ? 'w-8 h-8' : 'w-12 h-12'" class="bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center justify-center transition-all duration-300">
              <FileCheck :class="isScrolled ? 'w-4 h-4' : 'w-6 h-6'" class="text-emerald-500 transition-all" />
            </div>
            <div>
              <h1 :class="isScrolled ? 'text-sm' : 'text-2xl'" class="font-black tracking-tighter text-white uppercase italic transition-all duration-300">Auditoría RECSS</h1>
              <p v-if="!isScrolled" class="text-muted-foreground mt-1 text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 italic">Evaluación de Cumplimiento de Estándares de Seguridad</p>
            </div>
          </div>
          
          <div class="flex gap-3">
            <template v-if="!isReadOnly">
              <button @click="handleSave('Borrador')" class="bg-zinc-900 border border-emerald-500/20 text-emerald-500/60 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/10 hover:text-emerald-500 transition-all flex items-center gap-2">
                <ClipboardList class="w-3 h-3" /> Guardar
              </button>
              <button @click="prepararFirma" class="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all flex items-center gap-2">
                <Zap class="w-3 h-3 text-black" /> <span class="text-black text-xs font-black">Finalizar y Firmar</span>
              </button>
            </template>
            <template v-else>
              <button v-if="urlStoredPdf" @click="openStoredPdf" class="bg-zinc-900 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/10 transition-all flex items-center gap-2">
                <FileText class="w-3 h-3" /> Ver PDF Oficial
              </button>
              <button @click="reabrirInforme" class="bg-amber-500 hover:bg-amber-600 text-black px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
                <Plus class="w-3 h-3 text-black rotate-45" /> <span class="text-black text-xs font-black">Reabrir Edición</span>
              </button>
            </template>
          </div>
        </div>
      </div>

      <!-- ANTECEDENTES -->
      <div class="bg-[#141414] border border-white/10 rounded-2xl shadow-2xl overflow-hidden transition-all duration-500">
        <button @click="toggle('antecedentes')" class="w-full bg-white/5 px-6 py-4 flex items-center gap-3 border-b border-white/5 outline-none hover:bg-white/10 transition-colors text-left uppercase">
          <ChevronUp v-if="!collapsed.antecedentes" class="w-4 h-4 text-emerald-400" />
          <ChevronDown v-else class="w-4 h-4 text-emerald-400" />
          <h2 class="text-[11px] font-black text-emerald-500 tracking-widest italic flex-1">Antecedentes Generales</h2>
        </button>

        <div v-show="!collapsed.antecedentes" class="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-6 animate-in fade-in duration-300">
           <div v-for="(field, label) in { 'Versión': 'version', 'División': 'division', 'N° Contrato': 'numero_contrato', 'Fecha': 'fecha', 'Empresa': 'empresa', 'Admin EECC': 'admin_eecc', 'APR EECC': 'apr_eecc' }" :key="label" class="border-b border-white/10 pb-1.5 group transition-all">
             <span class="text-[9px] font-black uppercase text-white/30 tracking-widest block mb-1 group-hover:text-emerald-500/50 transition-colors">{{ label }}</span>
             <input type="text" v-model="formInfo[field]" :disabled="isReadOnly" class="w-full bg-transparent text-xs font-bold text-white/90 outline-none uppercase">
           </div>
           <div class="lg:col-span-2 border-b border-white/10 pb-1.5 group">
             <span class="text-[9px] font-black uppercase text-white/30 tracking-widest block mb-1 group-hover:text-emerald-500/50 transition-colors">Servicio / Contrato</span>
             <input type="text" v-model="formInfo.servicio_contrato" :disabled="isReadOnly" class="w-full bg-transparent text-xs font-bold text-white/90 outline-none uppercase">
           </div>
        </div>
      </div>

      <!-- TABS SELECTOR -->
      <div class="flex gap-3 p-1.5 bg-[#141414] border border-white/10 rounded-2xl w-fit shadow-lg px-3">
        <button v-for="tab in [{id:'terreno', name:'Fase Terreno', icon:TrendingUp}, {id:'documental', name:'Fase Documental', icon:FileText}, {id:'accidentabilidad', name:'Accidentabilidad', icon:AlertTriangle}]" :key="tab.id"
          @click="activeTab = tab.id" 
          :class="activeTab === tab.id ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'border-transparent text-white/40 hover:bg-white/5 hover:text-white/60'" 
          class="py-3 px-6 rounded-xl border transition-all duration-300 flex items-center gap-3 group">
          <component :is="tab.icon" class="w-4 h-4" />
          <span class="text-[10px] font-black uppercase tracking-widest leading-none">{{ tab.name }}</span>
          <div class="ml-auto text-[9px] font-black px-2 py-0.5 rounded border-2 transition-colors tabular-nums min-w-[35px] text-center"
               :class="activeTab === tab.id ? 'text-emerald-500 border-emerald-500/30' : 'text-white/20 border-white/10'">
            {{ getTabStats(tab.id).answered }}/{{ getTabStats(tab.id).total }}
          </div>
        </button>
      </div>

      <!-- VIEW RENDERER -->
      <div class="relative min-h-[600px] space-y-6">
        
        <!-- RESUMEN CHART -->
        <div class="bg-[#141414] border border-white/10 rounded-2xl shadow-xl overflow-hidden">
          <button @click="toggle('resumen')" class="w-full bg-white/5 px-6 py-4 flex items-center gap-4 transition-colors border-b border-white/5 outline-none hover:bg-white/10">
            <BarChart3 class="w-4 h-4 text-emerald-500" />
            <h2 class="text-sm font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2"> Cumplimiento RECSS</h2>
            <ChevronUp v-if="!collapsed.resumen" class="w-5 h-5 text-emerald-400 ml-auto" />
            <ChevronDown v-else class="w-5 h-5 text-emerald-400 ml-auto" />
          </button>
          <div v-show="!collapsed.resumen" class="px-8 py-8 space-y-5 animate-in fade-in duration-300">
            <div v-for="dim in recssDimensions" :key="dim.id" class="flex items-center gap-10 group">
              <div class="w-72 flex items-center gap-5 shrink-0">
                <div class="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[11px] font-black text-emerald-500">{{ dim.id }}</div>
                <p class="text-[10px] font-bold text-white/80 uppercase tracking-tight">{{ dim.name }}</p>
              </div>
              <div class="flex-1 h-2 bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
                <div class="h-full rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(16,185,129,0.4)]" :style="{ width: `${dim.value}%`, background: dim.color }"></div>
              </div>
              <span class="text-sm font-black text-emerald-400 w-14 text-right italic tabular-nums">{{ dim.value }}%</span>
            </div>
          </div>
        </div>

        <!-- CHECKLIST ITEMS -->
        <div class="bg-[#141414] border border-white/10 rounded-2xl shadow-xl overflow-hidden">
          <div class="divide-y divide-white/5">
            <div v-for="(item, idx) in checklistData[activeTab]" :key="idx" 
                 :class="item.type === 'header' ? 'bg-blue-500/10 border-y border-blue-500/20 py-4' : 'px-6 py-6'" 
                 class="w-full flex flex-col gap-4 hover:bg-white/5 transition-colors">
              
              <template v-if="item.type === 'header'">
                <div class="flex items-center gap-4 px-6">
                   <div class="bg-blue-500 text-white text-[10px] font-black px-2 py-1 rounded min-w-[35px] text-center shadow-lg">{{ item.pct }}</div>
                   <h3 class="text-xs font-black text-blue-400 uppercase tracking-[0.1em] italic">{{ item.text }}</h3>
                </div>
              </template>
              
              <template v-else>
                <div class="flex items-start justify-between gap-8">
                  <div class="flex-1 flex gap-4">
                    <span class="text-emerald-500 font-black italic underline decoration-emerald-500/30 text-xs shrink-0">{{ item.id }}</span>
                    <div class="flex flex-col gap-2">
                      <p class="text-[12.5px] font-bold text-white/90 leading-relaxed">{{ item.text }}</p>
                      <p class="text-[10px] text-white/40 italic leading-relaxed whitespace-pre-line">{{ item.verif || '-' }}</p>
                    </div>
                  </div>

                  <div class="flex items-center gap-6 shrink-0 self-start">
                    <div v-if="item.pct && item.pct.includes('%')" class="flex flex-col items-end">
                      <span class="text-[8px] font-black uppercase text-white/20 tracking-widest mb-1">Peso</span>
                      <span class="text-[10px] font-black text-emerald-500/60 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{{ item.pct }}</span>
                    </div>

                    <div class="flex flex-col items-end">
                      <span class="text-[8px] font-black uppercase text-white/20 tracking-widest mb-1">
                        {{ activeTab === 'accidentabilidad' ? (item.opc === 'N' ? 'Cantidad' : 'Estado') : 'Estado' }}
                      </span>
                      
                      <!-- Numeric Input for Accident Count -->
                      <input v-if="activeTab === 'accidentabilidad' && item.opc === 'N'" 
                             type="number" v-model.number="item.val" min="0" :disabled="isReadOnly"
                             class="w-20 bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-center text-[11px] font-black text-red-400 outline-none focus:border-red-500/50 appearance-none shadow-inner">
                      
                      <!-- Select for Si/No questions -->
                      <select v-else v-model="item.val" :disabled="isReadOnly" class="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-center text-[11px] font-black text-emerald-400 outline-none focus:border-emerald-500/50 appearance-none min-w-[80px]">
                        <option value="-">-</option>
                        <option value="Si">SI</option>
                        <option value="No">NO</option>
                        <option value="N.A">N/A</option>
                      </select>
                    </div>
                  </div>
                </div>

                <!-- Observations and Photos -->
                <div v-if="activeTab !== 'accidentabilidad'" class="flex gap-4 items-end mt-2">
                   <div class="flex-1">
                      <textarea v-model="item.obs" :disabled="isReadOnly" placeholder="Observación específica..." rows="1" class="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-[11px] font-medium text-white/80 outline-none focus:border-emerald-500/30 transition-all resize-none shadow-inner h-11"></textarea>
                   </div>
                   <div class="flex items-center gap-3 mb-1">
                      <button @click="triggerPhoto(item)" :disabled="isReadOnly" class="p-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl text-emerald-500 transition-all shadow-inner disabled:opacity-50">
                        <Camera class="w-4 h-4" />
                      </button>
                      <div v-if="item.photos && item.photos.length > 0" class="flex -space-x-2">
                        <img v-for="p in item.photos" :key="p" :src="getPhotoUrl(p)" class="w-9 h-9 rounded-xl border border-white/20 object-cover cursor-pointer hover:z-10 hover:scale-125 transition-all shadow-xl" @click="previewPhotoUrl = getPhotoUrl(p)">
                      </div>
                   </div>
                </div>
              </template>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- PHOTO PREVIEW -->
    <Teleport to="body">
      <div v-if="previewPhotoUrl" class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md" @click="previewPhotoUrl = null">
        <div class="relative max-w-5xl" @click.stop>
          <img :src="previewPhotoUrl" class="max-w-full max-h-[85vh] rounded-2xl shadow-2xl">
          <button @click="previewPhotoUrl = null" class="absolute -top-4 -right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white border border-white/20 transition-all hover:bg-white/20">
            <X class="w-6 h-6" />
          </button>
        </div>
      </div>
    </Teleport>

    <!-- REPORTE COMPLETO PRINT -->
    <div class="print-only p-8 bg-white text-black">
      <div class="mb-8 border-b-2 border-emerald-500 pb-4">
        <h1 class="text-2xl font-black uppercase">Auditoría RECSS</h1>
        <p class="text-sm font-bold text-gray-600">Empresa: {{ formInfo.empresa }} | División: {{ formInfo.division }} | Período: {{ formInfo.periodo }}</p>
      </div>

      <div v-for="tab in [{id:'terreno', name:'Fase Terreno'}, {id:'documental', name:'Fase Documental'}, {id:'accidentabilidad', name:'Accidentabilidad'}]" :key="tab.id" class="mb-8">
        <h2 class="text-xl font-black bg-gray-100 p-2 mb-4 uppercase">{{ tab.name }}</h2>
        <table class="w-full text-xs border-collapse mb-4">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-300">
              <th class="p-2 text-left w-12">N°</th>
              <th class="p-2 text-left">Criterio / Pregunta</th>
              <th class="p-2 text-left w-1/3">Observación</th>
              <th class="p-2 text-center w-16">Valor</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <template v-for="(item, idx) in checklistData[tab.id]" :key="idx">
              <tr v-if="item.type !== 'header'" class="break-inside-avoid">
                <td class="p-2 font-bold align-top">{{ item.id }}</td>
                <td class="p-2 align-top">{{ item.text }}</td>
                <td class="p-2 align-top italic text-gray-600">{{ item.obs || '-' }}</td>
                <td class="p-2 text-center font-bold align-top" :class="{ 'text-emerald-600': item.val === 'Si', 'text-rose-600': item.val === 'No' }">{{ item.val }}</td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <SelectorAuditoriaModal v-model="showSelectorModal" auditType="RECSS" @confirm="onSelectionConfirm" />
    <input type="file" ref="photoInput" style="display: none" accept="image/*" capture="environment" @change="handlePhotoUpload">

    <!-- Modal de Firma FES -->
    <FirmaFesModal 
      v-model="showSignatureModal"
      :pdf-url="signaturePdfUrl"
      :id-doc="signatureIdDoc"
      :origen-path="signatureOrigenPath"
      :destino-folder="signatureDestinoFolder"
      :user="loggedInUser"
      rol-nombre="Auditor RECSS"
      @firmado="ejecutarCierreReporte"
    />

  </div>
</template>

<script setup>
import { reactive, ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { apiAxios, sstAxios } from '@/services/api'
import { 
  ChevronDown, ChevronUp, History, X, FileCheck, FileText, 
  Activity, AlertTriangle, BarChart3, ClipboardList, Zap, TrendingUp, Plus, Camera, Loader2
} from 'lucide-vue-next'
import SelectorAuditoriaModal from '@/components/SelectorAuditoriaModal.vue'
import FirmaFesModal from '@/components/FirmaFesModal.vue'

// Ciclo de Vida y Estados
const estadoInforme = ref('Borrador')
const urlStoredPdf = ref(null)
const isReadOnly = computed(() => estadoInforme.value === 'Finalizado' || estadoInforme.value === 'TERMINADO')

// Diálogo de Firma FES
const showSignatureModal = ref(false)
const signaturePdfUrl = ref('')
const signatureIdDoc = ref(null)
const signatureOrigenPath = ref('')
const signatureDestinoFolder = ref('/u05/LeanDocs/transmac/sst/recss_informes/')
const loggedInUser = ref(JSON.parse(localStorage.getItem('user') || '{}'))

// Helpers for PostgreSQL array columns
const formatPostgresArray = (arr) => {
  if (!arr || !Array.isArray(arr) || arr.length === 0) return "{}"
  return `{${arr.map(item => `"${item.replace(/"/g, '\\"')}"`).join(',')}}`
}

const parsePostgresArray = (val) => {
  if (!val) return []
  if (Array.isArray(val)) return val
  if (typeof val === 'string') {
    if (val.startsWith('{') && val.endsWith('}')) {
      const content = val.slice(1, -1).trim()
      if (!content) return []
      return content.split(',').map(item => {
        let clean = item.trim()
        if (clean.startsWith('"') && clean.endsWith('"')) {
          clean = clean.slice(1, -1)
        }
        return clean.replace(/\\"/g, '"')
      }).filter(Boolean)
    }
    try {
      const parsed = JSON.parse(val)
      if (Array.isArray(parsed)) return parsed
    } catch(e) {}
  }
  return []
}

const activeTab = ref('terreno')
const activeInformeId = ref('new')
const showSelectorModal = ref(false)
const isScrolled = ref(false)
const photoInput = ref(null)
const activePhotoItem = ref(null)
const previewPhotoUrl = ref(null)
const loading = ref(false)

const collapsed = reactive({ antecedentes: false, resumen: false })

const checklistData = reactive({
  terreno: [
    { id: 'normativa', pct: '10%', text: 'normativa legal nacional e interna', type: 'header' },
    { id: 'P1', text: 'P1 ¿Todos los hallazgos, recomendaciones del OAL, acciones preventivas o correctivas derivadas de las fiscalizaciones, revisiones del CPHS, auditorías y/o verificaciones internas o externas y de las visitas por el AdC de la compañía, se encuentran cerrados o gestiondas? [AdC debe contar de manera previa con los hallazgos levantados a la EECC]', verif: 'AdC debe verificar cierre efectivo de los hallazgos realizados a EECC por parte de:\n- Organismo Administrador del Seguro Laboral (Mutualidades) revisar informes de visita de OAL para conocer las prescripciones realizadas a EECC.\n- Revisar Actas de fiscalizaciones para verificar las medidas solicitadas.\n- Auditorías internas o externas, indicaciones de CPHS, otras visitas de AdC, etc.-', val: '-', obs: '', photos: [] },
    
    { id: 'gestion', pct: '60%', text: 'Gestión de controles', type: 'header' },
    { id: 'P2', text: 'P2 ¿Los trabajadores demuestran haber realizado el ART/P, según corresponda? [AdC debe revisar ARTP para actividades criticas rutinarias o no rutinarias]', verif: 'AdC debe verificar la realización de ARTP por parte de los trabajadores de EECC, solicitar ARTP y en conjunto a trabajadores revisar como se completó y como verificaron los controles establecidos para la tarea en ARTP. Ej. Control ¿Dispositivo de hombre muerto? Respuesta: Sí , consultar a trabajador donde se encuentra el dispositivo y como se comprueba su operatividad.', val: '-', obs: '', photos: [] },
    { id: 'P3', text: 'P3 ¿Los CC declarados se encuentran implementados? [Tomar muestra considerando como foco los riesgos tendencia]', verif: 'AdC debe verificar que los controles críticos establecidos en EdC que aplican a la tarea se encuentren implementados por EECC. Se recomienda utilizar la GCC disponibles para verificar la implementación de los controles en terreno.', val: '-', obs: '', photos: [] },
    { id: 'P4', text: 'P4 ¿La empresa evidencia que ha verificado en terreno la implementación de los CC?', verif: 'AdC debe verificar que los controles críticos se encuentren ejecutados en la tarea y los respaldo de EECC de su implementación.', val: '-', obs: '', photos: [] },
    { id: 'P5', text: 'P5 ¿Se evidencia en terreno avances o cierre de los planes de acción, de acuerdo al plazo comprometido, para brechas detectadas en las EdC? [el auditor debe contar con los planes de acción para poder verificar su implementación en terreno]', verif: 'Adc debe contar con los planes de cierre levantados por EECC para el cierre de brechas detectadas en evaluaciones anteriores de las EdC que apliquen al contrato.', val: '-', obs: '', photos: [] },
    { id: 'P6', text: 'P6 ¿Se evidencia la aplicación de las herramientas de programa de liderazgo? (AdC debe realizar confirmacion de Rol a cambio de turno seguro.)', verif: 'Realizar una confirmación de Rol a EECC en cambio de turno seguro para identificar la aplicación de las herramientas de Liderazgo, CdP CdR, Yo Digo No, etc.-', val: '-', obs: '', photos: [] },
    { id: 'P7', text: 'P7 ¿En la ART se identifica el paso a paso de la tarea, considerando la totalidad de los riesgos y controles aplicables a las ejecución de la tarea, el entorno de trabajo del momento y la interacción con otros trabajos?', verif: 'AdC debe verificar en ART/ARTP que se encuentren identificados el paso a paso de la tarea y los controles efectivos, además de las condiciones de entorno como otros trabajos, riesgos geotécnicos, riesgos a la salud, etc.', val: '-', obs: '', photos: [] },
    { id: 'P8', text: 'P8 ¿Se verifica en terreno que esté implementada la infraestructura y logística (recursos) necesaria definida en el plan de emergencia y se evidencia conocimiento y uso del sistema por parte de los trabajadores?', verif: 'AdC debe verificar que los elementos definidos para respuesta en caso de emergencia estén disponibles y entrevistar a trabajadores para determinar el grado de conocimiento de estos del plan de respuesta a emergencias. Ej: verificar sistemas de comunicación para emergencias, zonas de seguridad, extintores, a los trabajadores consultar por los canales de comunicación para emergencias, ubicación de zonas seguras etc.-', val: '-', obs: '', photos: [] },
    { id: 'P9', text: 'P9 ¿Los trabajadores conocen los agentes de riesgo de salud y sus niveles de riesgo presentes en el área donde se desarrollará la actividad?', verif: 'AdC debe entrevistar a trabajadores de EECC para verificar si conocen los agentes de salud presentes en el área de trabajo, su nivel de riesgos y medidas de protección para el riesgo. \n¿ Porque utiliza protección respiratoria/auditiva? ¿Conoce porque se encuentra ese dispositivo de extracción funcionando? ¿Dónde verifica que elementos de protección personal debe utilizar?', val: '-', obs: '', photos: [] },
    { id: 'P10', text: 'P10 ¿Los trabajadores conocen y utilizan de forma correcta las medidas de protección para los agentes de riesgo de salud presentes en el área donde se desarrollará la actividad?', verif: 'Verificar la utilización de forma correcta por los trabajadores de las medidas de protección definidas para los agentes de salud presentes en el área de trabajo. El AdC debe conocer previamente los agentes, niveles de riesgo y medidas de prevención del área.', val: '-', obs: '', photos: [] },
    { id: 'P11', text: 'P11 ¿Los trabajadores conocen la vigencia y los resultados de su evaluación de salud?', verif: 'Entrevistar a trabajadores para verificar si cuenta con sus exámenes de salud, conocen sus resultados y la vigencia de su examen.\n¿Cómo resultaron sus últimos exámenes ocupacionales? ¿Hace cuanto que se tomó su examen?', val: '-', obs: '', photos: [] },

    { id: 'perfiles', pct: '10%', text: 'Perfiles y Competencias', type: 'header' },
    { id: 'P12', text: 'P12 ¿Se encuentran los procedimiento de trabajo actualizados y disponible en terreno para consultas de parte de los trabajadores?', verif: 'AdC debe verificar los procedimientos de trabajo estén actualizados y su disponibilidad en el área de trabajo. Poner especial atención en aquellos que deberían ser actualizados producto de accidentes, enfermedades profesionales o riesgos graves que se hayan presentado en el área', val: '-', obs: '', photos: [] },
    { id: 'P13', text: 'P13 ¿El personal conoce y entiende el/los controles críticos aplicables a la tarea que se realiza? (entrevista o consulta a trabajadores)', verif: 'AdC debe entrevistar a trabajadores de EECC para verificar si conocen los controles críticos y el objetivo de su implementación.\nEj.: ¿Por qué su área de trabajo se encuentra segregada? ¿Cómo realiza el bloqueo de energías? Etc.-', val: '-', obs: '', photos: [] },
    { id: 'P14', text: 'P14 ¿El personal conoce y entiende el ARTP? (entrevista o consulta a trabajadores)', verif: 'Entrevistar a trabajadores consultando por el objetivo de ARTP y como debería ejecutarse en terreno. Ej.: ¿ Porque es ARTP y no ART? ¿Cuál es la importancia de los controles establecidos en ARTP?', val: '-', obs: '', photos: [] },
    { id: 'P15', text: 'P15 ¿El equipo ejecutor de la tarea comprende que ante un control crítico ausente o fallido,o ante la falta de análisis de riesgo de la tarea (ARTP) debe aplicar el YO DIGO NO hasta que se aseguren las condiciones de trabajo? (entrevista a trabajadores conocen y utiliza)', verif: 'Entrevistar a trabajadores con el objetivo de determinar si conocen YO DIGO NO, si lo han utilizado alguna vez. Ej.: ¿Qué podría hacer si identifica controles indicados en ARTP ausentes? ', val: '-', obs: '', photos: [] },
    { id: 'P16', text: 'P16 ¿El personal conoce la respuesta ante la emergencia de las áreas donde ejecutarán sus tareas?', verif: 'Entrevistar a trabajadores para determinar el grado de conocimiento de plan de respuesta ante emergencias.', val: '-', obs: '', photos: [] },

    { id: 'aprendizaje', pct: '20%', text: 'Aprendizaje', type: 'header' },
    { id: 'P17', text: 'P17 ¿Los trabajadores y supervisores de terreno conocen los AAP, top 4 y/o aprendizajes de Antofagasta Plc del último mes, en especial los que apliquen a su servicio?', verif: 'Adc debe entrevistar y verificar respaldos de revisión de AAP/TOP4 y/o aprendizajes con sus trabajadores y el análisis de aplicabilidad de las medidas de control.', val: '-', obs: '', photos: [] },
    { id: 'P18', text: 'P18 ¿Se verifica en terreno evidencia de la implementación de las lecciones aprendidas, que les aplique?', verif: 'Si se determinan medidas de control del análisis de aplicabilidad de los incidentes, se debe verificar su implementación en terreno.', val: '-', obs: '', photos: [] },
    { id: 'P19', text: 'P19 ¿Se encuentran implementadas en terreno las medidas correctivas y preventivas de los acccidentes del contrato (AAP, CTP o STP) en el plazo correspondiente, según apliquen?', verif: 'Adc debe verificar que las medidas correctivas derivadas de las investigaciones de los accidentes se encuentren implementadas, y en el plazo correspondiente.', val: '-', obs: '', photos: [] },
    { id: 'P20', text: 'P20 ¿Se evidencia mantención, en el tiempo, de las medidas correctivas o preventivas de los aprendizaje que aplican al contrato ?', verif: 'Adc debe verificar que las medidas correctivas se mantengan implementadas en el tiempo que apliquen según la etapa del contrato.', val: '-', obs: '', photos: [] }
  ],
  documental: [
    { id: 'normativa_d', pct: '10%', text: 'normativa legal nacional e interna', type: 'header' },
    { id: 'D1', text: 'P1 ¿El CPHS cuenta y cumple con los requerimientos para la constitución y funcionamiento establecidos en el Decreto 44?', verif: 'Acta de constitución, programa mensual y acuerdos cumplidos.', val: '-', obs: '', photos: [] },
    { id: 'D2', text: 'P2 ¿El Experto o Encargado de Seguridad cumple con las funciones señaladas en el artículo 66 Decreto 44?', verif: 'Seguimiento a matrices, evaluaciones ambientales y programa preventivo.', val: '-', obs: '', photos: [] },
    { id: 'D3', text: 'P3 ¿Cuenta con el registro de asistencia al Comite Paritario de Faena?', verif: 'Participación en reuniones y actividades programadas.', val: '-', obs: '', photos: [] },
    { id: 'D4', text: 'P4 ¿Cuenta con las evaluaciones de RECSS mensuales de sus subcontratos?', verif: 'Evidencia de evaluaciones y cierre de brechas.', val: '-', obs: '', photos: [] },
    { id: 'D5', text: 'P5 ¿La empresa cuenta con Protocolo de Prevención de acoso laboral, sexual y violencia en el trabajo?', verif: 'Protocolo, canal de denuncias y procedimiento de sanción.', val: '-', obs: '', photos: [] },
    
    { id: 'gestion_d', pct: '60%', text: 'Gestión de controles', type: 'header' },
    { id: 'D6', text: 'P6 ¿Cumple con el PGSSO en el ámbito de Salud Ocupacional?', verif: 'Evaluaciones cualitativas/cuantitativas, psicosocial, fatiga, etc.', val: '-', obs: '', photos: [] },
    { id: 'D7', text: 'P7 ¿Tienen identificado, evaluado y documentado los niveles de cumplimientos de los controles de las estrategias?', verif: 'Evaluación EdC y plan de cierre de brechas.', val: '-', obs: '', photos: [] },
    { id: 'D8', text: 'P8 ¿Cumple con el plan de liderazgo y dispone de la totalidad de las evidencias?', verif: 'Confirmación de procesos, rol y cambio de turno.', val: '-', obs: '', photos: [] },
    { id: 'D9', text: 'P9 ¿Declara formalmente sus indicadores mediante el formulario E-200 y Certificado siniestralidad?', verif: 'E-200 mensual y Certificado OAL por faena.', val: '-', obs: '', photos: [] },
    { id: 'D10', text: 'P10 ¿Se informa formalmente al mandante, dentro de las 24 horas, los resultados de fiscalizaciones?', verif: 'Reporte en libro de obra y plan de gestión de hallazgos.', val: '-', obs: '', photos: [] },

    { id: 'perfiles_d', pct: '10%', text: 'Perfiles y Competencias', type: 'header' },
    { id: 'D11', text: 'P11 ¿Se encuentran actualizados los perfiles de cargo y cumplimiento de competencias?', verif: '100% de perfiles actualizados y bases cumplidas.', val: '-', obs: '', photos: [] },
    { id: 'D12', text: 'P12 ¿Se cuenta y cumple con un programa de capacitación integral?', verif: 'Programa, registros informativos (ODI) y aprobación 100%.', val: '-', obs: '', photos: [] },

    { id: 'aprendizaje_d', pct: '20%', text: 'Aprendizaje', type: 'header' },
    { id: 'D13', text: 'P13 ¿Se difunden los reportes de AAP, top 4 y/o aprendizajes de Antofagasta Plc, en especial los que apliquen a su servicio?¿ La empresa realiza una evaluación de la aplicabilidad?', verif: '1. Los trabajadores conocen los accidentes de AAP y los aprendizajes de los eventos que se han difundido, y\n2. Los trabajadores conocen los Top 4 y alertas, del grupo antofagasta, que se han publicado, y\n3. Se evidencia evaluación de aplicabilidad.', val: '-', obs: '', photos: [] },
    { id: 'D14', text: 'P14 ¿Cuenta con los registros y análisis estadísticos de los reportes de seguridad y salud generados, en sus contratos, por sus trabajadores?', verif: '1. Se evidencia registro (ID, fecha nombre y descripción del evento)\n2. Se evidencia analisis de los reportes realizado por sus trabajadores', val: '-', obs: '', photos: [] },
    { id: 'D16_inv', text: 'P16 ¿Se ha realizado la investigación de los accidentes definidos por la legislación vigente o por la gerencia de SSO de la Compañía?', verif: '1. Se evidencia designación del equipo de investigación, que consideré el CPHS en caso de accidentes graves según normativa, y\n2. Se evidencia la realización de la investigación, y\n3. En las investigaciones realizadas, se evidencia identificación y plan de acción para las de medidas correctivas y/o preventivas y lecciones aprendidas.\nNota: Verificar el cumplimiento de acuerdo la etapa y plazo de la investigación', val: '-', obs: '', photos: [] },
    { id: 'D15', text: 'P15 ¿Se encuentran cerradas las medidas correctivas y preventivas de los accidentes del contrato (AAP, CTP o STP) en el plazo correspondiente?', verif: '1. Se evidencia cerradas las medidas correctivas y preventivas comprometidas, en plazo y calidad.\n2. Se evidencia análisis de repetitividad de los accidentes del servicio', val: '-', obs: '', photos: [] },
    { id: 'D16_haz', text: 'P16 ¿Se ha actualizado el inventario de riesgos de los accidentes del contrato (AAP, CTP, STP, EPP, EPT y PIAPP)?', verif: '1. La matriz de identificación de peligros y evaluación de riesgos debe tener menos de un año de su última revisión, y\n2. Actualizada con las medidas de control identificadas en la investigaciónes, aprendizajes, cambios en los procesos y\n3. Se evidencia difusión de las medidas de control que eviten la repetitividad de los accidentes.', val: '-', obs: '', photos: [] }
  ],
  accidentabilidad: [
    { id: 'A1', text: '¿La empresa tuvo Accidente Fatal?', opc: 'N', mult: 0.5, val: 0 },
    { id: 'A2', text: '¿La empresa tuvo Accidentes de Alto Potencial (AAP)?', opc: 'N', mult: 0.1, val: 0 },
    { id: 'A3', text: '¿La empresa tuvo repeticiones de AAP?', opc: 'N', mult: 0.15, val: 0 },
    { id: 'A4', text: '¿La empresa tuvo un evento que afecto el indicador TRIFR?', opc: 'Si/No', mult: 0.08, val: 'No' }
  ]
})

const formInfo = reactive({
  version: '01', division: 'Chuquicamata', empresa: '', servicio_contrato: '',
  numero_contrato: '', admin_eecc: '-', apr_eecc: '-', fecha: new Date().toISOString().split('T')[0],
  periodo: ''
})

const getPhotoUrl = (n) => n ? (n.startsWith('http') ? n : `${import.meta.env.VITE_API_BASE_URL_CORE || 'https://servidor.leanglobal.cl/lean-services-transmac-dev/api'}/archivo/transmac/sst/${n}`) : ''
const triggerPhoto = (i) => { activePhotoItem.value = i; photoInput.value?.click() }

const resolveCurrentUserId = () => {
  try { return JSON.parse(localStorage.getItem('user'))?.id_user || '1' } catch(e) { return '1' }
}

const handlePhotoUpload = async (e) => {
  const file = e.target.files[0]; if (!file) return;
  loading.value = true
  try {
    const formData = new FormData()
    formData.append('archivo', file); formData.append('path_doc', 'transmac/sst')
    formData.append('tipo_doc', 'SST_EVIDENCIA'); formData.append('id_user', resolveCurrentUserId())
    const { data } = await apiAxios.post('/archivo/imagen', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    const name = data.archivo?.name_doc_interno || data.name_doc_interno || data.filename
    if (name) { 
      if(!activePhotoItem.value.photos) activePhotoItem.value.photos = [];
      activePhotoItem.value.photos.push(name) 
    }
  } catch (err) { alert("Error al subir") }
  finally { loading.value = false; e.target.value = '' }
}

const getScore = (tab) => {
  if (tab === 'accidentabilidad') return getAccidentScore()
  let finalScore = 0
  const groups = []
  let currentGroup = null
  
  checklistData[tab].forEach(item => {
    if (item.type === 'header') {
      currentGroup = { pct: parseInt(item.pct), items: [] }
      groups.push(currentGroup)
    } else if (currentGroup) {
      currentGroup.items.push(item)
    }
  })

  groups.forEach(g => {
    if (g.items.length === 0) return
    const compliant = g.items.filter(i => i.val === 'Si' || i.val === 'N.A').length
    const groupWeight = g.pct / 100
    finalScore += (compliant / g.items.length) * groupWeight * 100
  })

  return Math.round(finalScore)
}

const getAccidentScore = () => {
  let discount = 0
  checklistData.accidentabilidad.forEach(item => {
    if (item.val === 'Si' || (item.opc === 'N' && parseInt(item.val) > 0)) {
      const multiplier = item.opc === 'N' ? parseInt(item.val) : 1
      discount += item.mult * 100 * multiplier
    }
  })
  return Math.max(0, 100 - discount)
}

const recssDimensions = computed(() => [
  { id: 'T', name: 'Fase Terreno', value: getScore('terreno'), color: '#3b82f6' },
  { id: 'D', name: 'Fase Documental', value: getScore('documental'), color: '#10b981' },
  { id: 'A', name: 'Accidentabilidad', value: getAccidentScore(), color: '#ef4444' }
])

const pastEvaluations = ref([])
const fetchAudits = async () => {
  try {
    const { data } = await sstAxios.get(`/audits?type=RECSS&_t=${Date.now()}`)
    if (Array.isArray(data)) pastEvaluations.value = data.map(a => ({ id: a.id, month: a.periodo || 'S/F', score: `${Math.round(a.total_score || 0)}%`, status: a.status || 'Borrador', fullData: a }))
  } catch (err) { console.error(err) }
}

const toggle = (s) => collapsed[s] = !collapsed[s]

const getTabStats = (t) => {
  let total = 0; let answered = 0;
  checklistData[t].forEach(i => { if(i.type !== 'header') { total++; if(i.val && i.val !== '-') answered++ } })
  return { total, answered }
}

const loadInforme = async (inf) => {
  activeInformeId.value = inf.id
  try {
    const { data } = await sstAxios.get(`/audits/${inf.id}`)
    if (data) {
      formInfo.version = data.version; formInfo.division = data.division; formInfo.empresa = data.company_name || data.empresa;
      formInfo.servicio_contrato = data.service_name || data.servicio; formInfo.numero_contrato = data.contract_number || data.num_contrato;
      formInfo.admin_eecc = data.admin_eecc; formInfo.apr_eecc = data.apr_eecc; formInfo.fecha = data.audit_date || data.fecha; formInfo.periodo = data.periodo;
      
      // Cargar estado y PDF de base de datos
      estadoInforme.value = data.status || 'Borrador'
      urlStoredPdf.value = data.url_pdf || null

      // Resetear
      Object.keys(checklistData).forEach(k => {
        checklistData[k].forEach(i => {
          if (i.type === 'header') return
          i.val = (k === 'accidentabilidad' ? 0 : '-')
          i.obs = ""
          i.photos = []
        })
      })
      
      if (data.results) {
        data.results.forEach(res => {
          Object.keys(checklistData).forEach(k => {
            const item = checklistData[k].find(i => i.id === res.item_internal_id)
            if (item) {
              if (k === 'accidentabilidad') item.val = res.score
              else {
                if (res.score === 100) item.val = 'Si'
                else if (res.score === 0) item.val = 'No'
                else if (res.observation === 'NA') item.val = 'N.A'
              }
              item.obs = res.observation === 'NA' ? "" : (res.observation || "")
              item.photos = parsePostgresArray(res.photos)
            }
          })
        })
      }
    }
  } catch (err) { console.error(err) }
}

const onSelectionConfirm = async (sel) => {
  const payload = {
    header: { type: 'RECSS', version: '01', division: 'Chuquicamata', empresa: sel.clienteName, company_name: sel.clienteName, servicio: sel.proyectoName, service_name: sel.proyectoName, num_contrato: sel.proyecto, contract_number: sel.proyecto, fecha: new Date().toISOString().split('T')[0], periodo: sel.periodo, status: 'Borrador', total_score: 0 },
    results: []
  }
  try {
    const { data } = await sstAxios.post('/audits', payload)
    const newId = data.id || data.auditId || data.insertId || (data.data && data.data.id)
    if (newId) activeInformeId.value = newId
    formInfo.empresa = sel.clienteName; formInfo.periodo = sel.periodo; formInfo.servicio_contrato = sel.proyectoName; formInfo.numero_contrato = sel.proyecto
    estadoInforme.value = 'Borrador'
    urlStoredPdf.value = null
    fetchAudits(); showSelectorModal.value = false
  } catch (err) { alert('Error al crear') }
}

const handleSave = async (status) => {
  const payload = {
    header: { id: activeInformeId.value === 'new' ? null : activeInformeId.value, type: 'RECSS', version: formInfo.version, division: formInfo.division, empresa: formInfo.empresa, company_name: formInfo.empresa, servicio: formInfo.servicio_contrato, service_name: formInfo.servicio_contrato, num_contrato: formInfo.numero_contrato, contract_number: formInfo.numero_contrato, fecha: formInfo.fecha, periodo: formInfo.periodo, status: status || 'Borrador', total_score: 0, admin_eecc: formInfo.admin_eecc, apr_eecc: formInfo.apr_eecc },
    results: []
  }
  
  Object.keys(checklistData).forEach(k => {
    checklistData[k].forEach(i => {
      if (i.type === 'header') return;
      let score = 0;
      if (k === 'accidentabilidad') score = parseFloat(i.val || 0);
      else {
        if (i.val === 'Si') score = 100;
        else if (i.val === 'No') score = 0;
        else if (i.val === 'N.A') score = 100;
      }
      payload.results.push({ item_internal_id: i.id, category_name: k.toUpperCase(), question_text: i.text, score: score, observation: i.val === 'N.A' ? 'NA' : (i.obs || ""), photos: formatPostgresArray(i.photos) })
    })
  })

  payload.header.total_score = Math.round(recssDimensions.value.reduce((a, b) => a + b.value, 0) / 3)
  
  try {
    if (activeInformeId.value && activeInformeId.value !== 'new') {
      await sstAxios.put(`/audits/${activeInformeId.value}`, payload)
    } else {
      const { data } = await sstAxios.post('/audits', payload)
      const newId = data.id || data.auditId || data.insertId || (data.data && data.data.id)
      if (newId) activeInformeId.value = newId
    }
    if (status !== 'Finalizado') {
      alert('Guardado exitosamente')
    }
    fetchAudits()
  } catch (err) { 
    alert('Error al guardar') 
    throw err
  }
}

// Compilador HTML dinámico para el PDF
const getReportHtml = () => {
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Auditoría RECSS - ${formInfo.empresa}</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 40px; line-height: 1.4; }
        .header { border-bottom: 3px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { font-size: 28px; margin: 0; text-transform: uppercase; font-weight: 900; letter-spacing: -0.5px; }
        .header p { font-size: 13px; color: #666; margin: 8px 0 0 0; font-weight: bold; }
        .meta-grid { display: grid; grid-template-cols: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
        .meta-card { background: #f9fafb; border: 1px solid #e5e7eb; padding: 12px; border-radius: 8px; }
        .meta-label { font-size: 9px; text-transform: uppercase; color: #9ca3af; font-weight: 800; letter-spacing: 0.5px; }
        .meta-value { font-size: 13px; font-weight: bold; margin-top: 4px; color: #111827; }
        .section-title { font-size: 18px; font-weight: 900; background: #f3f4f6; padding: 8px 12px; margin: 30px 0 15px 0; text-transform: uppercase; border-left: 4px solid #10b981; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th { background: #f9fafb; border-bottom: 2px solid #e5e7eb; padding: 10px; text-align: left; font-size: 11px; text-transform: uppercase; color: #4b5563; font-weight: 800; }
        td { padding: 10px; border-bottom: 1px solid #f3f4f6; font-size: 11px; vertical-align: top; }
        .col-num { width: 40px; font-weight: bold; }
        .col-val { width: 60px; text-align: center; font-weight: bold; }
        .badge-si { color: #10b981; font-weight: bold; }
        .badge-no { color: #ef4444; font-weight: bold; }
        .badge-na { color: #6b7280; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Auditoría RECSS</h1>
        <p>Evaluación de Cumplimiento de Estándares de Seguridad</p>
      </div>

      <div class="meta-grid">
        <div class="meta-card"><div class="meta-label">Empresa</div><div class="meta-value">${formInfo.empresa || '-'}</div></div>
        <div class="meta-card"><div class="meta-label">División</div><div class="meta-value">${formInfo.division || '-'}</div></div>
        <div class="meta-card"><div class="meta-label">N° Contrato</div><div class="meta-value">${formInfo.numero_contrato || '-'}</div></div>
        <div class="meta-card"><div class="meta-label">Fecha</div><div class="meta-value">${formInfo.fecha || '-'}</div></div>
        <div class="meta-card"><div class="meta-label">Período</div><div class="meta-value">${formInfo.periodo || '-'}</div></div>
        <div class="meta-card"><div class="meta-label">Admin EECC</div><div class="meta-value">${formInfo.admin_eecc || '-'}</div></div>
        <div class="meta-card"><div class="meta-label">APR EECC</div><div class="meta-value">${formInfo.apr_eecc || '-'}</div></div>
        <div class="meta-card"><div class="meta-label">Resultado Final</div><div class="meta-value">${Math.round(recssDimensions.value.reduce((a, b) => a + b.value, 0) / 3)}%</div></div>
      </div>
  `;

  ['terreno', 'documental'].forEach(tabId => {
    html += `<div class="section-title">${tabId === 'terreno' ? 'Fase Terreno' : 'Fase Documental'}</div>`;
    html += `
      <table>
        <thead>
          <tr>
            <th class="col-num">N°</th>
            <th>Criterio / Pregunta</th>
            <th>Observación</th>
            <th class="col-val">Valor</th>
          </tr>
        </thead>
        <tbody>
    `;

    checklistData[tabId].forEach(item => {
      if (item.type === 'header') {
        html += `
          <tr style="background: #f9fafb;">
            <td colspan="4" style="font-weight: bold; color: #2563eb; font-size: 10px; text-transform: uppercase; padding: 8px 10px;">
              ${item.text}
            </td>
          </tr>
        `;
      } else {
        const valClass = item.val === 'Si' ? 'badge-si' : (item.val === 'No' ? 'badge-no' : 'badge-na');
        html += `
          <tr>
            <td class="col-num">${item.id}</td>
            <td><strong>${item.text}</strong><br><span style="color: #6b7280; font-size: 10px; white-space: pre-line;">${item.verif || ''}</span></td>
            <td>${item.obs || '-'}</td>
            <td class="col-val"><span class="${valClass}">${item.val || '-'}</span></td>
          </tr>
        `;
      }
    });

    html += `</tbody></table>`;
  });

  html += `<div class="section-title">Accidentabilidad</div>`;
  html += `
    <table>
      <thead>
        <tr>
          <th class="col-num">N°</th>
          <th>Criterio</th>
          <th class="col-val">Valor</th>
        </tr>
      </thead>
      <tbody>
  `;
  checklistData.accidentabilidad.forEach(item => {
    html += `
      <tr>
        <td class="col-num">${item.id}</td>
        <td>${item.text}</td>
        <td class="col-val">${item.val}</td>
      </tr>
    `;
  });
  html += `</tbody></table>`;

  html += `
    </body>
    </html>
  `;
  return html;
}

// Iniciar Proceso de Firma
const prepararFirma = async () => {
  if (activeInformeId.value === 'new') {
    alert('⚠️ Por favor guarda el informe como Borrador primero.')
    return
  }
  loading.value = true
  try {
    // 1) Guardar cambios actuales silenciosamente
    await handleSave('Borrador')

    // 2) Compilar HTML
    const fullHtml = getReportHtml()

    // 3) Generar PDF en el backend
    const { data } = await apiAxios.post(`/sst/generate-pdf-html/${activeInformeId.value}`, { htmlContent: fullHtml })

    if (data.url_pdf) {
      urlStoredPdf.value = data.url_pdf
      signatureIdDoc.value = data.id_doc || activeInformeId.value
      signatureOrigenPath.value = data.origenPath || (data.url_pdf ? data.url_pdf.replace('/archivo/', '/u05/LeanDocs/') : '')
      signatureDestinoFolder.value = data.destinoFolder || '/u05/LeanDocs/transmac/sst/recss_informes/'
      
      const BASE_URL = import.meta.env.VITE_API_BASE_URL_CORE || import.meta.env.VITE_API_BASE_URL || ''
      signaturePdfUrl.value = BASE_URL.includes('/api') ? BASE_URL + data.url_pdf : BASE_URL + '/api' + data.url_pdf
      
      showSignatureModal.value = true
    } else {
      alert('Error: El backend no retornó la URL del PDF.')
    }
  } catch (err) {
    console.error('Error preparando firma:', err)
    alert('Error al generar el PDF para firmar. Verifique los endpoints.')
  } finally {
    loading.value = false
  }
}

// Cierre Definitivo del Informe
const ejecutarCierreReporte = async (signedData) => {
  try {
    loading.value = true
    
    let finalPdfUrl = urlStoredPdf.value
    if (signedData && signedData.origenPathFirmado) {
      finalPdfUrl = signedData.origenPathFirmado.replace('/u05/LeanDocs/', '/archivo/').replace(/\\/g, '/')
      urlStoredPdf.value = finalPdfUrl
    }
    
    // Payload para actualizar estados y guardar JSON
    const payload = {
      estado: 'Finalizado',
      fecha_finalizacion: new Date().toISOString(),
      url_pdf: finalPdfUrl,
      data_json: {
        secciones: checklistData,
        antecedentes: formInfo,
        recssDimensions: recssDimensions.value,
        total_score: Math.round(recssDimensions.value.reduce((a, b) => a + b.value, 0) / 3)
      }
    }

    // Actualizar columnas en Postgres
    await apiAxios.post(`/sst/informe/${activeInformeId.value}`, payload)

    // Sincronizar en SST
    const sstPayload = {
      header: { 
        id: activeInformeId.value, 
        type: 'RECSS', 
        version: formInfo.version, 
        division: formInfo.division, 
        empresa: formInfo.empresa, 
        company_name: formInfo.empresa, 
        servicio: formInfo.servicio_contrato, 
        service_name: formInfo.servicio_contrato, 
        num_contrato: formInfo.numero_contrato, 
        contract_number: formInfo.numero_contrato, 
        fecha: formInfo.fecha, 
        periodo: formInfo.periodo, 
        status: 'Finalizado', 
        total_score: Math.round(recssDimensions.value.reduce((a, b) => a + b.value, 0) / 3),
        admin_eecc: formInfo.admin_eecc, 
        apr_eecc: formInfo.apr_eecc 
      },
      results: []
    }
    
    Object.keys(checklistData).forEach(k => {
      checklistData[k].forEach(i => {
        if (i.type === 'header') return;
        let score = 0;
        if (k === 'accidentabilidad') score = parseFloat(i.val || 0);
        else {
          if (i.val === 'Si') score = 100;
          else if (i.val === 'No') score = 0;
          else if (i.val === 'N.A') score = 100;
        }
        sstPayload.results.push({ item_internal_id: i.id, category_name: k.toUpperCase(), question_text: i.text, score: score, observation: i.val === 'N.A' ? 'NA' : (i.obs || ""), photos: formatPostgresArray(i.photos) })
      })
    })

    await sstAxios.put(`/audits/${activeInformeId.value}`, sstPayload)

    estadoInforme.value = 'Finalizado'
    
    window.dispatchEvent(new CustomEvent('report-status-updated'))
    
    alert('El informe ha sido firmado y cerrado con éxito.')
    fetchAudits()
  } catch (err) {
    console.error('Error al cerrar informe:', err)
    alert('Error al cerrar el informe.')
  } finally {
    loading.value = false
  }
}

// Reapertura de Edición
const reabrirInforme = async () => {
  if (!confirm('¿Seguro de re-abrir el informe? Esto permitirá editar y se invalidará el PDF consolidado.')) return
  loading.value = true
  try {
    await apiAxios.post(`/sst/informe/${activeInformeId.value}`, {
      estado: 'Borrador',
      url_pdf: null
    })

    const sstPayload = {
      header: { 
        id: activeInformeId.value, 
        type: 'RECSS', 
        version: formInfo.version, 
        division: formInfo.division, 
        empresa: formInfo.empresa, 
        company_name: formInfo.empresa, 
        servicio: formInfo.servicio_contrato, 
        service_name: formInfo.servicio_contrato, 
        num_contrato: formInfo.numero_contrato, 
        contract_number: formInfo.numero_contrato, 
        fecha: formInfo.fecha, 
        periodo: formInfo.periodo, 
        status: 'Borrador', 
        total_score: Math.round(recssDimensions.value.reduce((a, b) => a + b.value, 0) / 3),
        admin_eecc: formInfo.admin_eecc, 
        apr_eecc: formInfo.apr_eecc 
      },
      results: []
    }
    
    Object.keys(checklistData).forEach(k => {
      checklistData[k].forEach(i => {
        if (i.type === 'header') return;
        let score = 0;
        if (k === 'accidentabilidad') score = parseFloat(i.val || 0);
        else {
          if (i.val === 'Si') score = 100;
          else if (i.val === 'No') score = 0;
          else if (i.val === 'N.A') score = 100;
        }
        sstPayload.results.push({ item_internal_id: i.id, category_name: k.toUpperCase(), question_text: i.text, score: score, observation: i.val === 'N.A' ? 'NA' : (i.obs || ""), photos: formatPostgresArray(i.photos) })
      })
    })

    await sstAxios.put(`/audits/${activeInformeId.value}`, sstPayload)

    estadoInforme.value = 'Borrador'
    urlStoredPdf.value = null

    window.dispatchEvent(new CustomEvent('report-status-updated'))
    
    alert('Edición habilitada con éxito.')
    fetchAudits()
  } catch (err) {
    console.error('Error reabriendo informe:', err)
    alert('No se pudo re-abrir el informe.')
  } finally {
    loading.value = false
  }
}

// Descargar/Ver PDF Oficial
const openStoredPdf = () => {
  if (urlStoredPdf.value) {
    const BASE_URL = import.meta.env.VITE_API_BASE_URL_CORE || import.meta.env.VITE_API_BASE_URL || ''
    const fullUrl = BASE_URL.includes('/api') ? BASE_URL + urlStoredPdf.value : BASE_URL + '/api' + urlStoredPdf.value
    window.open(fullUrl, '_blank')
  } else {
    alert('El PDF oficial aún no ha sido generado.')
  }
}

onMounted(() => { window.onscroll = () => { isScrolled.value = window.scrollY > 50 }; fetchAudits() })
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.print-only { display: none !important; }
@media print {
  .print-only { display: block !important; }
  .no-print { display: none !important; }
  body { background: white !important; color: black !important; }
  @page { margin: 10mm; }
}
</style>
