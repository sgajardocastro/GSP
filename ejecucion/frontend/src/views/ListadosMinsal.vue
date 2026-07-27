<template>
  <div class="flex flex-col xl:flex-row items-start gap-6 relative p-4 lg:p-6 bg-[#0a0a0a] min-h-screen text-white">
    
    <!-- SIDEBAR: HISTORIAL -->
    <div class="w-full xl:w-80 xl:sticky top-6 shrink-0 bg-[#0d0d0d] border border-white/10 rounded-[2rem] flex flex-col shadow-2xl xl:max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-hide no-print">
      <div class="px-8 py-7 border-b border-white/5 flex items-center justify-between">
        <h2 class="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 flex items-center gap-3">
          <History class="w-4 h-4" /> Historial
        </h2>
        <span class="bg-emerald-500/10 text-emerald-500 text-[10px] font-black px-2.5 py-1 rounded-lg border border-emerald-500/20">{{ pastEvaluations.length }}</span>
      </div>
      
      <div class="p-4 space-y-4">
        <button @click="showSelectorModal = true" 
          class="w-full border border-dashed border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 rounded-2xl p-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3">
          <Plus class="w-4 h-4" /> Nuevo Informe
        </button>

        <div class="space-y-2">
          <div v-for="informe in pastEvaluations" :key="informe.id" @click="loadInforme(informe)" 
               :class="activeInformeId === informe.id ? 'bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'border-white/5 hover:bg-white/[0.04]'" 
               class="p-5 rounded-2xl border transition-all cursor-pointer group flex items-center gap-4 relative overflow-hidden">
            <div :class="informe.status.includes('Borrador') ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'" class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
              <FileText class="w-5 h-5" />
            </div>
            <div class="flex-1 min-w-0 flex flex-col">
              <span class="text-[13px] font-black text-white uppercase tracking-wider group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                {{ informe.month }}
              </span>
              <div class="flex items-center gap-2 mt-1">
                <span :class="informe.status.includes('Borrador') ? 'text-amber-500/60' : 'text-emerald-500/60'" class="text-[9px] font-black uppercase tracking-widest">{{ informe.status }}</span>
                <span v-if="informe.score" class="text-[10px] font-bold text-white/40 bg-white/5 px-2 py-0.5 rounded ml-auto">{{ informe.score }}</span>
              </div>
            </div>
            <ChevronRight class="w-4 h-4 text-white/10 group-hover:text-emerald-500/40" />
          </div>
        </div>
      </div>
    </div>

    <!-- RIGHT MAIN CONTENT -->
    <div class="flex-1 flex flex-col gap-6 min-w-0 no-print">
      <!-- HEADER -->
      <div class="bg-card border border-border/50 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 class="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3 italic">
          Autoevaluación HSO
          <span v-if="formInfo.periodo" class="text-xs bg-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded-full font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(16,185,129,0.1)] border border-emerald-500/20">
            MES: {{ formInfo.periodo }}
          </span>
        </h1>
        <div class="flex gap-3">
          <template v-if="!isReadOnly">
            <button @click="handleSave('Borrador')" class="px-4 py-2 bg-zinc-900 border border-emerald-500/20 text-emerald-500/60 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/10 hover:text-emerald-500 transition-all flex items-center gap-2">
              <ClipboardList class="w-3 h-3" /> Guardar
            </button>
            <button @click="prepararFirma" class="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all flex items-center gap-2">
              <Zap class="w-3 h-3 text-black" /> <span class="text-black text-xs font-black">Finalizar y Firmar</span>
            </button>
          </template>
          <template v-else>
            <button v-if="urlStoredPdf" @click="openStoredPdf" class="px-4 py-2 bg-zinc-900 border border-emerald-500/20 text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/10 transition-all flex items-center gap-2">
              <FileText class="w-3 h-3" /> Ver PDF Oficial
            </button>
            <button @click="reabrirInforme" class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
              <Plus class="w-3 h-3 text-black rotate-45" /> <span class="text-black text-xs font-black">Reabrir Edición</span>
            </button>
          </template>
        </div>
      </div>

      <!-- ANTECEDENTES -->
      <div class="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
        <button @click="toggle('antecedentes')" class="w-full bg-muted/30 px-6 py-4 flex items-center gap-3 hover:bg-muted/40 outline-none text-left uppercase">
          <div class="p-1 rounded-lg bg-white/5 border border-white/10">
            <ChevronUp v-if="!collapsed.antecedentes" class="w-4 h-4 text-emerald-500" />
            <ChevronDown v-else class="w-4 h-4 text-emerald-500" />
          </div>
          <h2 class="text-[11px] font-black text-emerald-500 tracking-widest italic flex-1">Antecedentes Generales</h2>
        </button>
        <div v-show="!collapsed.antecedentes" class="p-6 border-t border-border/50 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="space-y-1.5">
            <label class="text-[10px] font-bold text-muted-foreground uppercase">Versión</label>
            <input type="text" v-model="formInfo.version" :disabled="isReadOnly" class="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none">
          </div>
          <div class="space-y-1.5">
            <label class="text-[10px] font-bold text-muted-foreground uppercase">División</label>
            <input type="text" v-model="formInfo.division" :disabled="isReadOnly" class="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none">
          </div>
          <div class="space-y-1.5">
            <label class="text-[10px] font-bold text-muted-foreground uppercase">Empresa</label>
            <input type="text" v-model="formInfo.empresa" :disabled="isReadOnly" class="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none">
          </div>
        </div>
      </div>

      <!-- RESUMEN -->
      <div class="bg-[#141414] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <button @click="collapsed.resumen = !collapsed.resumen" class="w-full bg-white/5 px-6 py-4 flex items-center gap-3 border-b border-white/5 outline-none hover:bg-white/10 text-left uppercase">
          <div class="p-1 rounded-lg bg-white/5 border border-white/10">
            <BarChart3 class="w-4 h-4 text-emerald-400" />
          </div>
          <h2 class="text-[11px] font-black text-emerald-500 tracking-widest italic flex-1">Resumen de Avance Protocolos MINSAL</h2>
        </button>
        <div v-show="!collapsed.resumen" class="p-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
          <div v-for="tab in minsalTabs" :key="tab.id" class="space-y-2">
            <div class="flex justify-between items-end">
              <span class="text-[9px] font-black text-emerald-500/70 uppercase truncate">{{ tab.name }}</span>
              <span class="text-sm font-black text-white tabular-nums">{{ getTabStats(tab.id).pct }}%</span>
            </div>
            <div class="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div class="h-full bg-emerald-500 transition-all duration-1000" :style="{ width: getTabStats(tab.id).pct + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- CHECKLIST -->
      <div class="bg-[#141414] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col min-h-[600px]">
        <div class="flex border-b border-white/10 bg-black/40 p-1 gap-1 overflow-x-auto scrollbar-hide">
          <button v-for="tab in minsalTabs" :key="tab.id" @click="activeTab = tab.id"
            :class="activeTab === tab.id ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'border-white/5 text-white/40 hover:bg-white/5'"
            class="flex-1 py-3.5 px-4 rounded-xl border transition-all flex items-center justify-center gap-3 group">
            <component :is="tab.icon" :class="activeTab === tab.id ? 'text-emerald-500' : 'text-white/20'" class="w-4 h-4" />
            <span class="text-[10px] font-black uppercase tracking-widest">{{ tab.name }}</span>
            <div v-if="getTabStats(tab.id).total > 0" 
                  :class="getTabStats(tab.id).isComplete ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' : 'text-rose-400 bg-rose-500/10 border-rose-500/30'"
                  class="ml-auto text-[9px] font-black px-2 py-0.5 rounded border-2 tabular-nums">
              {{ getTabStats(tab.id).answered }}/{{ getTabStats(tab.id).total }}
            </div>
          </button>
        </div>

        <div class="flex-1 overflow-hidden flex flex-col">
          <div class="bg-muted/20 px-6 py-2 border-b border-border/50 flex">
            <span class="text-[10px] uppercase font-bold text-muted-foreground w-10 shrink-0">N°</span>
            <span class="text-[10px] uppercase font-bold text-muted-foreground w-[32%] pr-4 border-r border-border/30">Criterio</span>
            <span class="text-[10px] uppercase font-bold text-muted-foreground flex-1 px-4 border-r border-border/30">Evidencia / Obs</span>
            <span class="text-[10px] uppercase font-bold text-muted-foreground w-20 px-2 border-r border-border/30 text-center">Fotos</span>
            <span class="text-[10px] uppercase font-bold text-muted-foreground w-[14%] px-3 border-r border-border/30 text-center">Estado</span>
            <span class="text-[10px] uppercase font-bold text-muted-foreground w-12 text-center shrink-0">KPI</span>
          </div>

          <div class="divide-y divide-border/30 overflow-y-auto max-h-[600px] scrollbar-hide">
            <div v-for="(segment, sIdx) in checklistData[activeTab]" :key="sIdx" class="w-full flex flex-col">
              <button @click="segment.collapsed = !segment.collapsed" class="w-full bg-muted/40 px-6 py-4 flex items-center gap-4 transition-colors hover:bg-muted/60 outline-none border-b border-border/30">
                <ChevronUp v-if="!segment.collapsed" class="w-3.5 h-3.5 text-emerald-500" />
                <ChevronDown v-else class="w-3.5 h-3.5 text-emerald-500" />
                <h3 class="text-[11px] font-extrabold text-emerald-500 uppercase tracking-widest italic">{{ segment.title }}</h3>
              </button>
              
              <div v-show="!segment.collapsed" class="divide-y divide-border/20">
                <div v-for="(item, idx) in segment.questions" :key="idx" class="w-full px-6 py-3 flex items-stretch hover:bg-muted/10 transition-colors bg-card border-b border-border/10 last:border-0 min-h-[70px]">
                  <div class="w-10 shrink-0 pt-2">
                    <span class="text-emerald-500 font-black italic text-[10px]">{{ item.id }}</span>
                  </div>
                  <div class="w-[32%] pr-4 border-r border-border/30 flex flex-col justify-center">
                    <p class="text-[11px] font-medium text-foreground/90 leading-snug">{{ item.text }}</p>
                    <p v-if="item.ref" class="text-[9px] text-muted-foreground mt-1.5 italic border-l-2 border-emerald-500/40 pl-2">{{ item.ref }}</p>
                  </div>
                  <div class="flex-1 px-4 border-r border-border/30 flex items-center">
                    <textarea v-model="item.obs" :disabled="isReadOnly" placeholder="..." rows="2" class="w-full bg-background border border-border/40 rounded-lg px-2.5 py-1.5 text-[10px] text-white focus:border-emerald-500 outline-none resize-none h-full disabled:opacity-50"></textarea>
                  </div>
                  <div class="w-20 px-2 border-r border-border/30 flex flex-col gap-2 items-center justify-center">
                    <button @click="triggerPhoto(item)" :disabled="isReadOnly" class="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 border-dashed rounded px-1 py-1.5 text-[8px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 disabled:opacity-50">
                      <Camera class="w-3 h-3" />
                    </button>
                    <div v-if="item.photos && item.photos.length > 0" class="flex gap-1 flex-wrap justify-center">
                      <div v-for="(photo, pIdx) in item.photos" :key="pIdx" @click="previewPhotoUrl = getPhotoUrl(photo)" class="w-7 h-7 rounded bg-muted border border-white/10 overflow-hidden relative cursor-pointer group">
                        <img :src="getPhotoUrl(photo)" class="w-full h-full object-cover">
                        <button @click.stop="removePhoto(item, pIdx)" :disabled="isReadOnly" class="absolute top-0 right-0 p-0.5 bg-rose-500 rounded-bl-md opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0">
                          <X class="w-2.5 h-2.5 text-white" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div class="w-[14%] px-3 border-r border-border/30 flex items-center">
                    <select v-model="item.val" :disabled="isReadOnly" class="w-full bg-background border border-border/50 rounded-lg px-2 py-1.5 text-center text-[10px] font-semibold text-emerald-400 outline-none">
                      <option value="0">P (0)</option>
                      <option value="0.25">0.25</option>
                      <option value="0.5">0.5</option>
                      <option value="1">1</option>
                      <option value="NA">NA</option>
                    </select>
                  </div>
                  <div class="w-12 shrink-0 flex justify-center items-center">
                    <span class="text-[12px] font-black" :class="getKpiColor(item.val)">{{ item.val === 'NA' ? 'N/A' : (item.val || '0') }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODALS -->
    <SelectorAuditoriaModal v-model="showSelectorModal" auditType="MINSAL" @confirm="onSelectionConfirm" />
    <input type="file" ref="photoInput" style="display: none" accept="image/*" capture="environment" @change="handleMinsalPhotoUpload">

    <!-- PREVIEW -->
    <Teleport to="body">
      <div v-if="previewPhotoUrl" class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md" @click="previewPhotoUrl = null">
        <div class="relative max-w-5xl" @click.stop>
          <img :src="previewPhotoUrl" class="max-w-full max-h-[85vh] rounded-2xl shadow-2xl">
          <button @click="previewPhotoUrl = null" class="absolute -top-4 -right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white border border-white/20 transition-colors">
            <X class="w-6 h-6" />
          </button>
        </div>
      </div>
    </Teleport>

    <!-- REPORTE COMPLETO PRINT -->
    <div class="print-only p-8 bg-white text-black">
      <div class="mb-8 border-b-2 border-emerald-500 pb-4">
        <h1 class="text-2xl font-black uppercase">Autoevaluación HSO - MINSAL</h1>
        <p class="text-sm font-bold text-gray-600">Empresa: {{ formInfo.empresa }} | División: {{ formInfo.division }} | Período: {{ formInfo.periodo }}</p>
      </div>

      <div v-for="tab in minsalTabs" :key="tab.id" class="mb-8">
        <h2 class="text-xl font-black bg-gray-100 p-2 mb-4 uppercase flex justify-between">
          <span>{{ tab.name }}</span>
          <span>{{ getTabStats(tab.id).pct }}%</span>
        </h2>
        <div v-for="(segment, sIdx) in checklistData[tab.id]" :key="sIdx" class="mb-4 break-inside-avoid">
          <h3 class="text-sm font-bold text-emerald-600 mb-2">{{ segment.title }}</h3>
          <table class="w-full text-xs border-collapse mb-4">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-300">
                <th class="p-2 text-left w-12">N°</th>
                <th class="p-2 text-left">Criterio</th>
                <th class="p-2 text-left w-1/3">Observación</th>
                <th class="p-2 text-center w-16">Valor</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="item in segment.questions" :key="item.id" class="break-inside-avoid">
                <td class="p-2 font-bold align-top">{{ item.id }}</td>
                <td class="p-2 align-top">{{ item.text }}</td>
                <td class="p-2 align-top italic text-gray-600">{{ item.obs || '-' }}</td>
                <td class="p-2 text-center font-bold align-top" :class="{ 'text-emerald-600': item.val === '1', 'text-rose-600': item.val === '0', 'text-amber-600': item.val === '0.5' || item.val === '0.25' }">{{ item.val === 'NA' ? 'N/A' : (item.val || '0') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ANEXO PRINT -->
    <div class="print-only page-break-before mt-12 p-8 bg-white text-black">
      <h2 class="text-3xl font-black uppercase italic border-b-4 border-emerald-500 mb-8">Anexo de Evidencias</h2>
      <div class="grid grid-cols-2 gap-10">
        <div v-for="(photoObj, idx) in allPhotos" :key="idx" class="break-inside-avoid border-2 border-zinc-100 rounded-3xl overflow-hidden shadow-sm">
          <div class="h-80 bg-zinc-50 flex items-center justify-center p-2">
            <img :src="getPhotoUrl(photoObj.name)" class="max-w-full max-h-full object-contain">
          </div>
          <div class="p-6 bg-white border-t border-zinc-100">
            <p class="text-[10px] font-black text-emerald-600 mb-2">{{ photoObj.id }} - {{ photoObj.tab }}</p>
            <p class="text-sm font-bold text-zinc-800 leading-snug">{{ photoObj.text }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Selector Modal -->
    <SelectorAuditoriaModal v-model="showSelectorModal" auditType="MINSAL" @confirm="onSelectionConfirm" />

    <!-- Modal de Firma FES -->
    <FirmaFesModal 
      v-model="showSignatureModal"
      :pdf-url="signaturePdfUrl"
      :id-doc="signatureIdDoc"
      :origen-path="signatureOrigenPath"
      :destino-folder="signatureDestinoFolder"
      :user="loggedInUser"
      rol-nombre="Auditor MINSAL"
      @firmado="ejecutarCierreReporte"
    />

  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { apiAxios, sstAxios } from '@/services/api'
import { 
  ChevronDown, ChevronUp, History, FileCheck, FileText, Camera, X, BarChart3, 
  ClipboardList, Zap, Volume2, Sun, Mountain, Wind, Activity, MessageSquareText, 
  Plus, ChevronRight, Loader2
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
const signatureDestinoFolder = ref('/u05/LeanDocs/transmac/sst/minsal_informes/')
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

// --- CONFIGURACIÓN TABS ---
const minsalTabs = [
  { id: 'prexor', name: 'Pauta PREXOR', icon: Volume2 },
  { id: 'uv', name: 'Pauta UV', icon: Sun },
  { id: 'tmert', name: 'Pauta TMERT', icon: Activity },
  { id: 'psicosocial', name: 'Protoc. Psicosocial', icon: MessageSquareText },
  { id: 'silice', name: 'Pauta Sílice', icon: Wind },
  { id: 'hipobaria', name: 'Pauta Hipobaria', icon: Mountain }
]

// --- DATOS REACTIVOS (TOP LEVEL) ---
const formInfo = reactive({
  version: '01',
  division: 'Chuquicamata',
  empresa: 'TRANSMAC LTDA',
  periodo: ''
})

const checklistData = reactive({
  prexor: [
    { title: '1.- GESTIÓN ADMINISTRATIVA EN MATERIA DE SSO -HSO', collapsed: false, questions: [
        { id: '1.1', text: 'El experto profesional y/o encargado de la implementación del protocolo cuenta con el curso de su OAL -PREXOR .', ref: 'Protocolo PREXOR | Ley N° 16.744', val: '0' },
        { id: '1.2', text: 'La Empresa tiene identificado en su Matriz IPER , agente riesgo Ruido.', ref: '', val: '0' },
        { id: '1.3', text: 'La Empresa en su reglamento Interno tiene incorporado el agente de riesgo Ruido', ref: '', val: '0' },
        { id: '1.4', text: '¿La Empresa cuenta con el registro de la difusión del Manual sobre Normas Mínimas para el Desarrollo de Programas de Vigilancia de la Pérdida Auditiva?', ref: '', val: '0' },
        { id: '1.5', text: 'La empresa realizó la difusion del Protocolos de Exposición Ocupacional a Ruido PREXOR por medio de cartas.', ref: 'Protocolo PREXOR', val: '0' },
        { id: '1.6', text: 'La empresa realizó la difusion a todos los trabajadores sobre el SGSST para el control a Ruido - PREXOR', ref: '', val: '0' },
        { id: '1.7', text: 'La empresa cuenta con un cronograma o cart gantt de la implementacion del Protocolo PREXOR.', ref: '', val: '0' },
    ]},
    { title: '2.- GESTIÓN DE COMITES PARITARIOS', collapsed: false, questions: [
        { id: '2.1', text: 'El CPHS cuenta con un programa de trabajo sobre prevención de la Hipoacusia laboral.', ref: 'Protocolo PREXOR | D.S N° 44', val: '0' },
        { id: '2.2', text: 'Los integrantes del CPHS se encuentran capacitados en el Protocolo PREXOR', ref: '', val: '0' },
        { id: '2.3', text: 'El CPHS participa en reuniones e inspecciones de SSO referente a Ruido.', ref: '', val: '0' },
        { id: '2.4', text: 'Los integrantes del CPHS se encuentran capacitados en uso, mantención y almacenamiento de EPA.', ref: '', val: '0' },
    ]},
    { title: '3.- GESTIÓN DE CAPACITACIÓN', collapsed: false, questions: [
        { id: '3.1', text: 'Los trabajadores y linea de mando capacitados sobre PREXOR.', ref: 'Protocolo PREXOR | D.S N° 594', val: '0' },
        { id: '3.2', text: 'Los trabajadores se encuentran capacitados en uso y limpieza de EPA', ref: '', val: '0' },
        { id: '3.3', text: 'Programa de trabajo teórico y práctico de capacitación PREXOR', ref: '', val: '0' },
        { id: '3.4', text: 'Empresa informó a trabajadores obligación de informar riesgos laborales (Ruido)', ref: '', val: '0' },
    ]},
    { title: '4.- GESTION EMPRESA Y OAL', collapsed: false, questions: [
        { id: '4.1', text: 'Encargado de implementar el Protocolo PREXOR cuenta con curso/taller OAL', ref: 'Requerimientos OAL', val: '0' },
        { id: '4.2', text: 'Se realizó estudio Previo en conjunto con OAL', ref: '', val: '0' },
        { id: '4.3', text: 'Evaluación cualitativa vigente del agentes de riesgos higiénicos por su OAL', ref: '', val: '0' },
        { id: '4.4', text: 'Envío de Matriz de ruido a OAL para revisión y coordinación de evaluaciones', ref: '', val: '0' },
    ]},
    { title: '5.- GESTION DE VIGILANCIA AMBIENTAL Y SALUD', collapsed: false, questions: [
        { id: '5.1', text: 'Evaluaciones cuantitativas de exposición ocupacional a Ruido efectuadas por OAL', ref: 'Ley N° 16.744', val: '0' },
        { id: '5.2', text: 'Difusión de resultados a trabajadores evaluados en áreas que superan criterios de acción', ref: '', val: '0' },
        { id: '5.3', text: 'Informar ingreso a Programa de Vigilancia Auditiva según resultados técnicos', ref: '', val: '0' },
        { id: '5.4', text: 'Listado de trabajadores expuestos a Ruido Ocupacional', ref: '', val: '0' },
        { id: '5.5', text: 'Historial de trabajadores con Hipoacusia o afecciones auditivas', ref: '', val: '0' },
        { id: '5.6', text: 'Examen de Post-ocupacional al cese de funciones o salida de vigilancia', ref: '', val: '0' },
    ]},
    { title: '6.- MEDIDAS PRESCRITAS OAL', collapsed: false, questions: [
        { id: '6.1', text: 'Programa o carta gantt para ejecución de medidas prescritas por OAL', ref: 'Requerimientos OAL', val: '0' },
        { id: '6.2', text: 'Seguimiento y cierre de medidas prescritas informando a OAL y mandante', ref: '', val: '0' },
        { id: '6.3', text: 'Re-evaluaciones de ruido en fuentes sonoras o GES según plazos PREXOR', ref: '', val: '0' },
    ]},
    { title: '7.- GESTIÓN DE RUIDO EN EQUIPOS', collapsed: false, questions: [
        { id: '7.1', text: 'Identificación y encierro/aislamiento de fuentes de mayor emisión sonora', ref: 'D.S N° 594', val: '0' },
        { id: '7.2', text: 'Herramientas con tecnología para disminuir niveles de ruido', ref: '', val: '0' },
        { id: '7.3', text: 'Programa de mantención de maquinaria y herramientas para disminuir exposición', ref: '', val: '0' },
        { id: '7.4', text: 'Señalizaciones de advertencia de ruido visibles en el área de trabajo', ref: '', val: '0' },
    ]},
    { title: '8.- PROGRAMA PROTECCIÓN AUDITIVA', collapsed: false, questions: [
        { id: '8.1', text: 'SGSST contempla control de actividades para disminuir exposición a ruido', ref: 'Protocolo PREXOR', val: '0' },
        { id: '8.2', text: 'Programa de selección y protección auditiva según Guia Técnica ISP', ref: '', val: '0' },
        { id: '8.3', text: 'Difusión del Programa de selección y protección auditiva a trabajadores', ref: '', val: '0' },
        { id: '8.4', text: 'Cálculo teórico de Selección Auditiva EPA realizado', ref: '', val: '0' },
        { id: '8.5', text: 'EPA entregados cuentan con resolución ISP / Certificación Nacional', ref: 'D.S N° 18', val: '0' },
        { id: '8.6', text: 'Supervisión de uso de EPA en áreas con presencia de ruido', ref: '', val: '0' },
        { id: '8.7', text: 'Registro de re-cambio de EPA de los trabajadores', ref: '', val: '0' },
        { id: '8.8', text: 'Stock mínimo del 10% de EPA para trabajadores expuestos', ref: '', val: '0' },
    ]},
    { title: '9.- MEJORA CONTINUA', collapsed: false, questions: [
        { id: '9.1', text: 'Propuestas o proyectos para disminuir exposición (Control ambiental/personal)', ref: '', val: '0' },
    ]}
  ],
  uv: [
    { title: '1.- GESTIÓN ADMINISTRATIVA UV', collapsed: false, questions: [
        { id: '1.1', text: 'Encargado cuenta con curso de Radiación UV de su OAL', ref: 'Guia Técnica UV', val: '0' },
        { id: '1.2', text: 'Agente RUV incluido en Matriz IPER', ref: '', val: '0' },
        { id: '1.3', text: 'Difusión de Guia Técnica RUV a trabajadores y sindicatos', ref: '', val: '0' },
        { id: '1.4', text: 'Reglamento Interno incorpora riesgos por RUV', ref: '', val: '0' },
        { id: '1.5', text: 'Difusión de Guia RUV informada a autoridades fiscalizadoras', ref: '', val: '0' },
        { id: '1.6', text: 'Carta gantt de implementación de Guia Técnica RUV', ref: '', val: '0' },
    ]},
    { title: '2.- COMITES PARITARIOS UV', collapsed: false, questions: [
        { id: '2.1', text: 'CPHS cuenta con programa para prevención de cáncer de piel', ref: 'D.S N° 44', val: '0' },
        { id: '2.2', text: 'Integrantes CPHS capacitados en Guia Técnica UV', ref: '', val: '0' },
        { id: '2.3', text: 'CPHS verifica medidas de control (técnicas/administrativas/EPP) de RUV', ref: '', val: '0' },
    ]},
    { title: '3.- CAPACITACIÓN UV', collapsed: false, questions: [
        { id: '3.1', text: 'Capacitación sobre Guia RUV a todos los trabajadores (Solicitar registros)', ref: 'D.S N° 594', val: '0' },
        { id: '3.2', text: 'Capacitación en uso y aplicación de Protector Solar FPS', ref: '', val: '0' },
        { id: '3.3', text: 'Programa teórico/práctico de entrenamiento trabajadores expuestos', ref: '', val: '0' },
        { id: '3.4', text: 'Informar riesgos y métodos correctos de trabajo ante RUV', ref: '', val: '0' },
    ]},
    { title: '4.- GESTIÓN EMPRESA Y OAL UV', collapsed: false, questions: [
        { id: '4.1', text: 'Evaluación cualitativa vigente de agentes higiénicos por OAL', ref: 'Requerimiento OAL', val: '0' },
    ]},
    { title: '5.- VIGILANCIA AMBIENTAL Y SALUD UV', collapsed: false, questions: [
        { id: '5.1', text: 'Identificación de GES y nivel de riesgo de exposición', ref: 'Guia Técnica UV', val: '0' },
        { id: '5.2', text: 'Medidas de control específicas para GES con exposición continua', ref: '', val: '0' },
        { id: '5.3', text: 'Personal libre de signos de exposición (enrojecimiento, ampollas, etc.)', ref: '', val: '0' },
        { id: '5.4', text: 'Historial de trabajadores con afecciones de salud a la piel', ref: '', val: '0' },
    ]},
    { title: '6.- MEDIDAS DE CONTROL UV', collapsed: false, questions: [
        { id: '6.1', text: 'Cumplimiento de medidas prescritas por OAL ante RUV', ref: 'Requerimiento OAL', val: '0' },
        { id: '6.2', text: 'Presencia de techumbres o elementos que generen sombra en áreas de trabajo', ref: '', val: '0' },
        { id: '6.3', text: 'Vehículos con láminas o elementos para disminuir exposición RUV', ref: '', val: '0' },
        { id: '6.4', text: 'Procedimientos establecen medidas para disminuir exposición RUV', ref: '', val: '0' },
        { id: '6.5', text: 'Publicación diaria del Índice UV y medidas correspondientes', ref: '', val: '0' },
    ]},
    { title: '7.- PROGRAMA PROTECCIÓN SOLAR', collapsed: false, questions: [
        { id: '7.1', text: 'SGSST contempla control de actividades para disminuir RUV', ref: 'D.S N° 594', val: '0' },
        { id: '7.2', text: 'Programa de Prevención y Protección Solar implementado', ref: '', val: '0' },
        { id: '7.3', text: 'Difusión del Programa de protección solar a trabajadores', ref: '', val: '0' },
        { id: '7.4', text: 'Listado de trabajadores/GES expuestos actualizado', ref: '', val: '0' },
        { id: '7.5', text: 'Protector solar cuenta con resolución ISP', ref: 'D.S N° 18', val: '0' },
        { id: '7.6', text: 'Supervisión de aplicación de FPS por parte de trabajadores', ref: '', val: '0' },
        { id: '7.7', text: 'Registro de entrega/re-cambio de protector solar', ref: '', val: '0' },
        { id: '7.8', text: 'Stock mínimo del 10% de EPP para RUV', ref: '', val: '0' },
    ]},
    { title: '8.- MEJORA CONTINUA UV', collapsed: false, questions: [
        { id: '8.1', text: 'Proyectos para disminuir exposición RUV (ambiental/personal)', ref: '', val: '0' },
    ]}
  ],
  tmert: [
    { title: '1.- ETAPA 0: INICIO PROTOCOLO TMERT', collapsed: false, questions: [
        { id: '1.1', text: 'Difusión del Programa de Vigilancia TME a trabajadores y sindicatos', ref: 'R.E. N°327', val: '0' },
        { id: '1.2', text: 'Capacitación sobre factores de riesgo TME realizada', ref: '', val: '0' },
        { id: '1.3', text: 'Programa de capacitación (8 hrs) implementado para trabajadores/CPHS', ref: '', val: '0' },
        { id: '1.4', text: 'Implementadores cuentan con curso de 20 hrs para aplicación de pautas', ref: '', val: '0' },
        { id: '1.5', text: 'Carta Gantt para implementación de TMERT vigente', ref: '', val: '0' },
        { id: '1.6', text: 'Programa de Gestión de Riesgos de TMERT formalizado', ref: '', val: '0' },
    ]},
    { title: '2.- ETAPA I: CARACTERIZACIÓN E IDENTIFICACIÓN', collapsed: false, questions: [
        { id: '2.1', text: 'Identificación de peligro en las áreas de la empresa', ref: 'Protocolo TMERT', val: '0' },
        { id: '2.2', text: 'Ficha de caracterización por puesto de trabajo realizada', ref: '', val: '0' },
        { id: '2.3', text: 'Aplicación de Tabla I: Identificación Inicial de factores de riesgo', ref: '', val: '0' },
        { id: '2.4', text: 'Aplicación de tablas de identificación avanzada (Repetitividad, Carga, etc.)', ref: '', val: '0' },
        { id: '2.5', text: 'Notificación al OAL cuando nivel de riesgo es Medio/Alto/No Aceptable', ref: '', val: '0' },
        { id: '2.6', text: 'Evaluaciones de riesgo TMERT en puestos con peligro identificado', ref: '', val: '0' },
        { id: '2.7', text: 'Informe de seguimiento en empresas con tareas críticas (Rojo)', ref: '', val: '0' },
        { id: '2.8', text: 'Plan de Acción correctivo para mitigación del riesgo implementado', ref: '', val: '0' },
        { id: '2.9', text: 'Ejecución de acciones para eliminación de riesgos evaluados', ref: 'D.S. N°594', val: '0' },
        { id: '2.10', text: 'Medidas ejecutadas dentro de los plazos establecidos', ref: 'R.E. Nº503', val: '0' },
        { id: '2.11', text: 'Re-evaluación del riesgo realizada según corresponda', ref: '', val: '0' },
        { id: '2.12', text: 'Empresa comunica nivel de riesgo a los trabajadores', ref: '', val: '0' },
        { id: '2.13', text: 'Notificación de EGRESO al OAL cuando riesgo es Bajo/Aceptable', ref: '', val: '0' },
    ]}
  ],
  psicosocial: [
    { title: '1.- ETAPA 1: INICIO IMPLEMENTACIÓN', collapsed: false, questions: [
        { id: '1.1', text: 'Implementador cuenta con curso establecido por OAL', ref: 'CEAL-SM/SUSESO', val: '0' },
        { id: '1.2', text: 'Conformación de Comité de Aplicación formalizada', ref: '', val: '0' },
        { id: '1.3', text: 'Comité de Aplicación cuenta con representantes del CPHS', ref: '', val: '0' },
        { id: '1.4', text: 'Representantes de sindicatos o elegidos por trabajadores integran comité', ref: '', val: '0' },
        { id: '1.5', text: 'Representantes del empleador (RRHH / Prevención) integran comité', ref: '', val: '0' },
        { id: '1.6', text: 'Comité conformado de manera igualitaria (Empresa/Trabajadores)', ref: '', val: '0' },
        { id: '1.7', text: 'Archivador/Bitácora (física/online) para control del proceso', ref: '', val: '0' },
    ]},
    { title: '2.- ETAPA 2: DIFUSIÓN Y SENSIBILIZACIÓN', collapsed: false, questions: [
        { id: '2.1', text: 'Capacitación de difusión recibida por parte del OAL', ref: 'CEAL-SM/SUSESO', val: '0' },
        { id: '2.2', text: 'Resguardo de anonimato y confidencialidad en unidades de análisis', ref: '', val: '0' },
        { id: '2.3', text: 'Sensibilización realizada a todos los trabajadores (Registros/Folletos)', ref: '', val: '0' },
        { id: '2.4', text: 'Cronograma de trabajo para etapas iniciales definido', ref: '', val: '0' },
        { id: '2.5', text: 'Cumplimiento de plazos (2 meses) para primeras etapas', ref: '', val: '0' },
    ]},
    { title: '3.- APLICACIÓN CUESTIONARIO', collapsed: false, questions: [
        { id: '3.1', text: 'Solicitud de apertura plataforma SUSESO enviada al OAL', ref: 'CEAL-SM/SUSESO', val: '0' },
        { id: '3.2', text: 'Comunicado de fechas de inicio y término de aplicación del cuestionario', ref: '', val: '0' },
        { id: '3.3', text: 'Definición de modalidad (Papel / Electrónico)', ref: '', val: '0' },
        { id: '3.4', text: 'Cronograma de aplicación por unidades de análisis identificado', ref: '', val: '0' },
        { id: '3.5', text: 'Cumplimiento de plazo de aplicación (30 días)', ref: '', val: '0' },
    ]},
    { title: '4.- RESULTADOS Y ANÁLISIS', collapsed: false, questions: [
        { id: '4.1', text: 'Notificación de resultados al OAL en plazo < 30 días', ref: 'CEAL-SM/SUSESO', val: '0' },
        { id: '4.2', text: 'Análisis y discusión de resultados con asesor OAL (Mesas de trabajo)', ref: '', val: '0' },
        { id: '4.3', text: 'Resultados informados a todos los trabajadores', ref: '', val: '0' },
        { id: '4.4', text: 'Participación de trabajadores en propuestas de intervención (Focus Group)', ref: '', val: '0' },
        { id: '4.5', text: 'Prescripción de medidas según estado de riesgo calificado', ref: '', val: '0' },
        { id: '4.6', text: 'Informar a trabajadores sobre medidas de intervención tomadas', ref: '', val: '0' },
    ]},
    { title: '5.- EJECUCIÓN DE MEDIDAS PS', collapsed: false, questions: [
        { id: '5.1', text: 'Programa o carta gantt para ejecución de medidas prescritas', ref: 'Ley N° 16.744', val: '0' },
        { id: '5.2', text: 'Definición de prioridades (Corto/Mediano/Largo plazo)', ref: '', val: '0' },
        { id: '5.3', text: 'Inicio de primera medida dentro de los 3 meses posteriores', ref: '', val: '0' },
    ]},
    { title: '6.- MONITOREO PS', collapsed: false, questions: [
        { id: '6.1', text: 'Prescripción de medidas para dimensiones en Riesgo Medio/Alto', ref: 'CEAL-SM/SUSESO', val: '0' },
        { id: '6.2', text: 'Acciones específicas para Grupos de Exposición Similar (GES)', ref: '', val: '0' },
        { id: '6.3', text: 'Vigilancia ambiental establecida según protocolo para Riesgo Alto', ref: '', val: '0' },
        { id: '6.4', text: 'Verificación de cumplimiento de medidas (Registros)', ref: '', val: '0' },
    ]},
    { title: '7.- REEVALUACIÓN', collapsed: false, questions: [
        { id: '7.1', text: 'Reevaluación cada 2 años con encuesta CEAL-SM SUSESO', ref: 'CEAL-SM/SUSESO', val: '0' },
    ]}
  ],
  silice: [
    { title: '1.- GESTIÓN ADMINISTRATIVA SÍLICE', collapsed: false, questions: [
        { id: '1.1', text: 'Encargado cuenta con curso del Protocolo Sílice OAL', ref: 'Ley N° 16.744', val: '0' },
        { id: '1.2', text: 'Agente Sílice incluido en Matriz IPER', ref: '', val: '0' },
        { id: '1.3', text: 'Difusión de Manual de Normas Mínimas sobre Silicosis realizada', ref: '', val: '0' },
        { id: '1.4', text: 'Reglamento Interno incorpora riesgos por Sílice Libre Cristalizada', ref: '', val: '0' },
        { id: '1.5', text: 'Difusión de Protocolo Sílice informada a autoridades fiscalizadoras', ref: '', val: '0' },
        { id: '1.6', text: 'Carta gantt de implementación de Protocolo Sílice', ref: '', val: '0' },
    ]},
    { title: '2.- COMITES PARITARIOS SÍLICE', collapsed: false, questions: [
        { id: '2.1', text: 'CPHS cuenta con programa para prevención de Silicosis', ref: 'D.S N° 44', val: '0' },
        { id: '2.2', text: 'Integrantes CPHS capacitados en Protocolo Sílice', ref: '', val: '0' },
        { id: '2.3', text: 'CPHS participa en inspecciones sobre medidas de control Sílice', ref: '', val: '0' },
        { id: '2.4', text: 'Integrantes CPHS capacitados en uso y almacenamiento de EPR', ref: '', val: '0' },
    ]},
    { title: '3.- CAPACITACIÓN SÍLICE', collapsed: false, questions: [
        { id: '3.1', text: 'Capacitación sobre Protocolo Sílice a trabajadores y línea de mando', ref: 'D.S N° 594', val: '0' },
        { id: '3.2', text: 'Capacitación en uso y mantención de EPR (Respiradores)', ref: '', val: '0' },
        { id: '3.3', text: 'Programa teórico/práctico de entrenamiento Sílice', ref: '', val: '0' },
        { id: '3.4', text: 'Informar riesgos y métodos correctos ante exposición a Sílice', ref: '', val: '0' },
    ]},
    { title: '4.- GESTIÓN EMPRESA Y OAL SÍLICE', collapsed: false, questions: [
        { id: '4.1', text: 'Evaluación cualitativa aprobada por el OAL', ref: 'Requerimiento OAL', val: '0' },
    ]},
    { title: '5.- VIGILANCIA DE SALUD SÍLICE', collapsed: false, questions: [
        { id: '5.1', text: 'Evaluaciones cuantitativas vigentes de agentes higiénicos', ref: 'Ley N° 16.744', val: '0' },
        { id: '5.2', text: 'Difusión a trabajadores en áreas que superan el 50% del nivel de exposición', ref: '', val: '0' },
        { id: '5.3', text: 'Incorporación a Programa de Vigilancia de Salud (NR3)', ref: '', val: '0' },
        { id: '5.4', text: 'Listado actualizado de trabajadores expuestos a Sílice', ref: '', val: '0' },
        { id: '5.5', text: 'Historial de trabajadores con afecciones respiratorias o Silicosis', ref: '', val: '0' },
        { id: '5.6', text: 'Examen de Egreso realizado al término de relación contractual', ref: '', val: '0' },
    ]},
    { title: '6.- MEDIDAS PRESCRITAS SÍLICE', collapsed: false, questions: [
        { id: '6.1', text: 'Programa para ejecución de medidas prescritas por OAL', ref: 'D.S N° 40', val: '0' },
        { id: '6.2', text: 'Re-evaluaciones de Sílice realizadas según tiempos del protocolo', ref: '', val: '0' },
        { id: '6.3', text: 'Seguimiento y cierre de medidas informando a OAL y mandante', ref: '', val: '0' },
        { id: '6.4', text: 'Prohibición de comer/beber/fumar en lugares con presencia de Polvo', ref: '', val: '0' },
    ]},
    { title: '7.- MEDIDAS DE CONTROL SÍLICE', collapsed: false, questions: [
        { id: '7.1', text: 'Encierro o sistemas de reducción de polvo en maquinarias críticas', ref: 'Protocolo Sílice', val: '0' },
        { id: '7.2', text: 'Programa de mantenimiento periódico a sistemas de ventilación', ref: '', val: '0' },
        { id: '7.3', text: 'Sistemas de limpieza al término de turno que minimizan exposición', ref: '', val: '0' },
        { id: '7.4', text: 'Limpieza de ropa de trabajo para minimizar polvo remanente', ref: '', val: '0' },
        { id: '7.5', text: 'Eliminación controlada de residuos generados por limpieza/filtros', ref: '', val: '0' },
        { id: '7.6', text: 'Humectación de vías de tránsito para evitar polvo en suspensión', ref: '', val: '0' },
        { id: '7.7', text: 'Uso de filtros colectores de polvo autolimpiantes', ref: '', val: '0' },
        { id: '7.8', text: 'Señalizaciones de advertencia de Sílice visibles', ref: '', val: '0' },
    ]},
    { title: '8.- PROGRAMA PROTECCIÓN RESPIRATORIA', collapsed: false, questions: [
        { id: '8.1', text: 'SGSST contempla control de actividades ante Sílice', ref: 'Guia Técnica ISP', val: '0' },
        { id: '8.2', text: 'Programa de selección y protección respiratoria según Guia ISP', ref: '', val: '0' },
        { id: '8.3', text: 'Difusión del Programa de protección respiratoria a trabajadores', ref: '', val: '0' },
        { id: '8.4', text: 'Cálculo teórico de Selección Respiratoria realizado', ref: '', val: '0' },
        { id: '8.5', text: 'Pruebas de ajuste respiratorias cuantitativas realizadas', ref: '', val: '0' },
        { id: '8.6', text: 'EPR entregado cuenta con resolución ISP', ref: 'D.S N° 18', val: '0' },
        { id: '8.7', text: 'Supervisión de uso de EPR en áreas con presencia de Sílice', ref: '', val: '0' },
        { id: '8.8', text: 'Registro de entrega y re-cambio de filtros de respiradores', ref: '', val: '0' },
        { id: '8.9', text: 'Stock mínimo del 10% de EPR disponible', ref: '', val: '0' },
    ]},
    { title: '9.- MEJORA CONTINUA SÍLICE', collapsed: false, questions: [
        { id: '9.1', text: 'Proyectos de control personal/ambiental para disminuir Sílice', ref: '', val: '0' },
    ]}
  ],
  hipobaria: [
    { title: '1.- CAPACITACIÓN HIC', collapsed: false, questions: [
        { id: '1.1', text: 'Programa de capacitación anual trabajadores expuestos a HIC', ref: 'Guia Técnica HIC', val: '0' },
        { id: '1.2', text: 'Instrucción Teórico-Práctica (3 hrs) sobre consecuencias salud', ref: '', val: '0' },
    ]},
    { title: '2.- PROGRAMA PREVENTIVO HIC', collapsed: false, questions: [
        { id: '2.1', text: 'Programa Preventivo realizado por médico/enfermera SO', ref: 'Protocolo HIC', val: '0' },
    ]},
    { title: '3.- EVALUACIONES DE SALUD HIC', collapsed: false, questions: [
        { id: '3.1', text: 'Autorización sanitaria para trabajos sobre 5.500 msnm', ref: 'Protocolo HIC', val: '0' },
        { id: '3.2', text: 'Evaluaciones Pre Ocupacionales realizadas para pesquisar contraindicaciones', ref: '', val: '0' },
        { id: '3.3', text: 'Evaluación ocupacional vigente según edad del trabajador', ref: '', val: '0' },
        { id: '3.4', text: 'Trabajadores expuestos ingresados a Programa de Vigilancia', ref: '', val: '0' },
        { id: '3.5', text: 'Evaluación de Egreso al término de relación contractual', ref: '', val: '0' },
        { id: '3.6', text: 'Chequeo anual preventivo (EMPA) según sistema previsional', ref: '', val: '0' },
    ]},
    { title: '4.- MEDIDAS PREVENCIÓN/MITIGACIÓN HIC', collapsed: false, questions: [
        { id: '4.1', text: 'Oxigenación individual/ambiental en dormitorios ante apnea central', ref: 'Protocolo HIC', val: '0' },
        { id: '4.2', text: 'Monitoreo de presión parcial de O2 y CO2 en dormitorios', ref: '', val: '0' },
        { id: '4.3', text: 'Oxigenación individual mantiene saturación >= 85%', ref: '', val: '0' },
        { id: '4.4', text: 'Dormitorios cumplen estándares habitabilidad (Humedad/Temp/Ruido)', ref: '', val: '0' },
    ]},
    { title: '5.- ACLIMATACIÓN', collapsed: false, questions: [
        { id: '5.1', text: 'Seguimiento aclimatación llegada a faena por primera vez', ref: 'Protocolo HIC', val: '0' },
        { id: '5.2', text: 'Seguimiento aclimatación tras > 6 meses sin subir a gran altitud', ref: '', val: '0' },
    ]},
    { title: '6.- POLICLINICOS HIC', collapsed: false, questions: [
        { id: '6.1', text: 'Autorización Sanitaria vigente', ref: 'Protocolo HIC', val: '0' },
        { id: '6.2', text: 'Atención Diurna y Nocturna garantizada', ref: '', val: '0' },
        { id: '6.3', text: 'Personal de salud según criterios D.S. 594', ref: '', val: '0' },
        { id: '6.4', text: 'Arsenal terapéutico para seguimiento aclimatación y emergencias', ref: '', val: '0' },
        { id: '6.5', text: 'Ambulancia Básica disponible las 24 horas', ref: '', val: '0' },
    ]},
    { title: '7.- BRIGADA DE EMERGENCIA HIC', collapsed: false, questions: [
        { id: '7.1', text: 'Faena cuenta con Brigada de Emergencia', ref: 'Protocolo HIC', val: '0' },
        { id: '7.2', text: 'Integrantes capacitados en BLS y Auxilio alta montaña', ref: '', val: '0' },
        { id: '7.3', text: 'Instrucción anual en primeros auxilios y extricación', ref: '', val: '0' },
    ]}
  ]
})

// --- ESTADOS AUXILIARES ---
const collapsed = reactive({ antecedentes: false, resumen: false })
const activeInformeId = ref('new')
const activeTab = ref('prexor')
const showSelectorModal = ref(false)
const photoInput = ref(null)
const activePhotoItem = ref(null)
const previewPhotoUrl = ref(null)
const loading = ref(false)
const pastEvaluations = ref([])
const lastPayload = ref(null)

const resolveCurrentUserId = () => {
  try { return JSON.parse(localStorage.getItem('user') || '{}').id_user || 1 } 
  catch { return 1 }
}

onMounted(() => { fetchAudits() })

const fetchAudits = async () => {
  try {
    const { data } = await sstAxios.get(`/audits?type=MINSAL&_t=${Date.now()}`)
    if (Array.isArray(data)) {
      pastEvaluations.value = data.map(a => ({
        id: a.id, month: a.periodo || 'S/F', 
        score: a.total_score ? `${Math.round(a.total_score)}%` : '-',
        status: a.status || 'Borrador', fullData: a
      }))
    }
  } catch (err) { console.error(err) }
}

const getTabStats = (tabId) => {
  let total = 0, answered = 0, totalScore = 0
  if (!checklistData[tabId]) return { total, answered, pct: 0, isComplete: false }
  checklistData[tabId].forEach(seg => {
    seg.questions.forEach(q => {
      if (q.val !== 'NA') {
        total++; const v = parseFloat(q.val || 0)
        if (v > 0) answered++; totalScore += v
      }
    })
  })
  const pct = total > 0 ? Math.round((totalScore / total) * 100) : 0
  return { total, answered, pct, isComplete: (answered === total && total > 0) }
}

const getSegmentStats = (s) => ({
  total: s.questions.length,
  answered: s.questions.filter(q => q.val !== '0').length,
  isComplete: s.questions.every(q => q.val !== '0')
})

const getPhotoUrl = (n) => {
  if (!n) return ''
  if (n.startsWith('http')) return n
  return `${import.meta.env.VITE_API_BASE_URL_CORE || 'https://servidor.leanglobal.cl/lean-services-transmac-dev/api'}/archivo/transmac/sst/${n}`
}

const triggerPhoto = (i) => { activePhotoItem.value = i; photoInput.value?.click() }

const handleMinsalPhotoUpload = async (e) => {
  const file = e.target.files[0]; if (!file) return;
  loading.value = true
  try {
    const formData = new FormData()
    formData.append('archivo', file)
    formData.append('path_doc', 'transmac/sst')
    formData.append('tipo_doc', 'SST_EVIDENCIA')
    formData.append('id_user', resolveCurrentUserId())
    formData.append('estado', 'ACTIVO')

    const { data } = await apiAxios.post('/archivo/imagen', formData, {
      headers: { 
        'Content-Type': 'multipart/form-data'
      }
    })

    // El servidor puede responder con name_doc_interno directamente o dentro de un objeto archivo
    const name = data?.archivo?.name_doc_interno || data?.name_doc_interno || data?.filename
    
    if (name) { 
      if (!activePhotoItem.value.photos) activePhotoItem.value.photos = []
      activePhotoItem.value.photos.push(name) 
    } else {
      console.error('Respuesta de servidor sin nombre de archivo:', data)
      alert("Error: El servidor no devolvió el nombre del archivo.")
    }
  } catch (err) { 
    console.error('Error en upload:', err)
    alert("Error al subir foto: " + (err.response?.data?.message || err.message)) 
  }
  finally { loading.value = false; e.target.value = '' }
}

const removePhoto = (item, idx) => { item.photos.splice(idx, 1) }

const loadInforme = async (inf) => {
  activeInformeId.value = inf.id
  try {
    const { data } = await sstAxios.get(`/audits/${inf.id}`)
    if (data) {
      formInfo.version = data.version; formInfo.division = data.division
      formInfo.empresa = data.company_name; formInfo.periodo = data.periodo

      // Cargar estado y PDF de base de datos
      estadoInforme.value = data.status || 'Borrador'
      urlStoredPdf.value = data.url_pdf || null

      data.results.forEach(res => {
        Object.keys(checklistData).forEach(tk => {
          checklistData[tk].forEach(seg => {
            const q = seg.questions.find(q => q.id === res.item_internal_id)
            if (q) {
              q.val = res.observation === 'NA' ? 'NA' : String(res.score || 0)
              q.obs = res.observation === 'NA' ? '' : (res.observation || '')
              q.photos = parsePostgresArray(res.photos)
            }
          })
        })
      })
    }
  } catch (err) { console.error(err) }
}

const onSelectionConfirm = async (sel) => {
  const exists = pastEvaluations.value.find(a => a.month === sel.periodo && a.fullData?.company_name === sel.clienteName)
  if (exists) { loadInforme(exists); showSelectorModal.value = false; return }
  
  const payload = {
    header: { type: 'MINSAL', version: '01', division: 'Chuquicamata', empresa: sel.clienteName, company_name: sel.clienteName, fecha: new Date().toISOString().split('T')[0], periodo: sel.periodo, status: 'Borrador', total_score: 0 },
    results: []
  }
  try {
    const { data } = await sstAxios.post('/audits', payload)
    const newId = data.id || data.auditId || data.insertId || (data.data && data.data.id)
    if (newId) activeInformeId.value = newId
    formInfo.empresa = sel.clienteName; formInfo.periodo = sel.periodo
    
    estadoInforme.value = 'Borrador'
    urlStoredPdf.value = null
    fetchAudits(); showSelectorModal.value = false
  } catch (err) { alert('Error al crear') }
}

const handleSave = async (status) => {
  const payload = {
    header: { id: activeInformeId.value === 'new' ? null : activeInformeId.value, type: 'MINSAL', version: formInfo.version, division: formInfo.division, empresa: formInfo.empresa, fecha: new Date().toISOString().split('T')[0], periodo: formInfo.periodo, status: status || 'Borrador', total_score: 0 },
    results: []
  }
  Object.keys(checklistData).forEach(tk => {
    checklistData[tk].forEach(seg => {
      seg.questions.forEach(q => {
        payload.results.push({ item_internal_id: q.id, category_name: seg.title, question_text: q.text, score: q.val === 'NA' ? null : parseFloat(q.val), observation: q.val === 'NA' ? 'NA' : q.obs, photos: formatPostgresArray(q.photos) })
      })
    })
  })
  const stats = minsalTabs.map(t => getTabStats(t.id))
  payload.header.total_score = Math.round(stats.reduce((a, s) => a + s.pct, 0) / stats.length)
  lastPayload.value = payload
  
  try {
    if (activeInformeId.value && activeInformeId.value !== 'new') {
      await sstAxios.put(`/audits/${activeInformeId.value}`, lastPayload.value)
    } else {
      const { data } = await sstAxios.post('/audits', lastPayload.value)
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

// Compilador HTML dinámico para el PDF MINSAL
const getReportHtml = () => {
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Autoevaluación HSO - MINSAL - ${formInfo.empresa}</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 40px; line-height: 1.4; }
        .header { border-bottom: 3px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { font-size: 24px; margin: 0; text-transform: uppercase; font-weight: 900; letter-spacing: -0.5px; }
        .header p { font-size: 12px; color: #666; margin: 8px 0 0 0; font-weight: bold; }
        .meta-grid { display: grid; grid-template-cols: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
        .meta-card { background: #f9fafb; border: 1px solid #e5e7eb; padding: 12px; border-radius: 8px; }
        .meta-label { font-size: 9px; text-transform: uppercase; color: #9ca3af; font-weight: 800; letter-spacing: 0.5px; }
        .meta-value { font-size: 13px; font-weight: bold; margin-top: 4px; color: #111827; }
        .section-title { font-size: 16px; font-weight: 900; background: #f3f4f6; padding: 8px 12px; margin: 30px 0 15px 0; text-transform: uppercase; border-left: 4px solid #10b981; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #f9fafb; border-bottom: 2px solid #e5e7eb; padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; color: #4b5563; font-weight: 800; }
        td { padding: 8px 10px; border-bottom: 1px solid #f3f4f6; font-size: 11px; vertical-align: top; }
        .col-num { width: 40px; font-weight: bold; }
        .col-val { width: 80px; text-align: right; font-weight: bold; color: #10b981; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Autoevaluación HSO - MINSAL</h1>
        <p>Reporte de Cumplimiento General</p>
      </div>

      <div class="meta-grid">
        <div class="meta-card"><div class="meta-label">Empresa</div><div class="meta-value">${formInfo.empresa || '-'}</div></div>
        <div class="meta-card"><div class="meta-label">División</div><div class="meta-value">${formInfo.division || '-'}</div></div>
        <div class="meta-card"><div class="meta-label">Versión</div><div class="meta-value">${formInfo.version || '-'}</div></div>
        <div class="meta-card"><div class="meta-label">Período</div><div class="meta-value">${formInfo.periodo || '-'}</div></div>
        <div class="meta-card"><div class="meta-label">Resultado Final</div><div class="meta-value">${Math.round(minsalTabs.map(t => getTabStats(t.id)).reduce((a, s) => a + s.pct, 0) / minsalTabs.length)}%</div></div>
      </div>
  `;

  minsalTabs.forEach(tab => {
    html += `<div class="section-title">${tab.name} (${getTabStats(tab.id).pct}%)</div>`;
    checklistData[tab.id].forEach(segment => {
      html += `<h3 style="margin-top: 15px; font-size: 12px; color: #059669; font-weight: bold;">${segment.title}</h3>`;
      html += `
        <table>
          <thead>
            <tr>
              <th class="col-num">N°</th>
              <th>Criterio</th>
              <th>Observación</th>
              <th class="col-val">Valor</th>
            </tr>
          </thead>
          <tbody>
      `;
      segment.questions.forEach(q => {
        html += `
          <tr>
            <td class="col-num">${q.id}</td>
            <td><strong>${q.text}</strong>${q.ref ? `<br><span style="color: #6b7280; font-size: 9px; font-style: italic;">${q.ref}</span>` : ''}</td>
            <td>${q.obs || '-'}</td>
            <td class="col-val">${q.val === 'NA' ? 'N/A' : (q.val || '0')}</td>
          </tr>
        `;
      });
      html += `</tbody></table>`;
    });
  });

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
      signatureDestinoFolder.value = data.destinoFolder || '/u05/LeanDocs/transmac/sst/minsal_informes/'
      
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
        checklistData: checklistData,
        antecedentes: formInfo,
        minsalTabsStats: minsalTabs.map(t => ({ id: t.id, stats: getTabStats(t.id) })),
        total_score: Math.round(minsalTabs.map(t => getTabStats(t.id)).reduce((a, s) => a + s.pct, 0) / minsalTabs.length)
      }
    }

    // Actualizar columnas en Postgres
    await apiAxios.post(`/sst/informe/${activeInformeId.value}`, payload)

    // Sincronizar en SST
    const sstPayload = {
      header: { 
        id: activeInformeId.value, 
        type: 'MINSAL', 
        version: formInfo.version, 
        division: formInfo.division, 
        empresa: formInfo.empresa, 
        company_name: formInfo.empresa, 
        fecha: new Date().toISOString().split('T')[0], 
        periodo: formInfo.periodo, 
        status: 'Finalizado', 
        total_score: Math.round(minsalTabs.map(t => getTabStats(t.id)).reduce((a, s) => a + s.pct, 0) / minsalTabs.length)
      },
      results: []
    }
    
    Object.keys(checklistData).forEach(tk => {
      checklistData[tk].forEach(seg => {
        seg.questions.forEach(q => {
          sstPayload.results.push({ item_internal_id: q.id, category_name: seg.title, question_text: q.text, score: q.val === 'NA' ? null : parseFloat(q.val), observation: q.val === 'NA' ? 'NA' : q.obs, photos: formatPostgresArray(q.photos) })
        })
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
        type: 'MINSAL', 
        version: formInfo.version, 
        division: formInfo.division, 
        empresa: formInfo.empresa, 
        company_name: formInfo.empresa, 
        fecha: new Date().toISOString().split('T')[0], 
        periodo: formInfo.periodo, 
        status: 'Borrador', 
        total_score: Math.round(minsalTabs.map(t => getTabStats(t.id)).reduce((a, s) => a + s.pct, 0) / minsalTabs.length)
      },
      results: []
    }
    
    Object.keys(checklistData).forEach(tk => {
      checklistData[tk].forEach(seg => {
        seg.questions.forEach(q => {
          sstPayload.results.push({ item_internal_id: q.id, category_name: seg.title, question_text: q.text, score: q.val === 'NA' ? null : parseFloat(q.val), observation: q.val === 'NA' ? 'NA' : q.obs, photos: formatPostgresArray(q.photos) })
        })
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

const allPhotos = computed(() => {
  const ph = []
  Object.keys(checklistData).forEach(tk => {
    checklistData[tk].forEach(seg => {
      seg.questions.forEach(q => {
        (q.photos || []).forEach(p => ph.push({ id: q.id, text: q.text, tab: tk.toUpperCase(), name: p }))
      })
    })
  })
  return ph
})

const getKpiColor = (v) => v === '1' ? 'text-emerald-400' : (v === '0.5' ? 'text-yellow-400' : (v === 'NA' ? 'text-zinc-500' : 'text-rose-500'))
const toggle = (s) => collapsed[s] = !collapsed[s]
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
