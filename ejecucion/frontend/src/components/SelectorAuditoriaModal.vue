<template>
  <transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0 scale-95"
    enter-to-class="opacity-100 scale-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="opacity-100 scale-100"
    leave-to-class="opacity-0 scale-95"
  >
    <div v-if="modelValue" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div class="bg-[#0d0e11] border border-white/10 rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <!-- Header -->
        <div class="px-10 pt-10 pb-6 border-b border-white/5 bg-gradient-to-b from-emerald-500/10 to-transparent">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <Plus class="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h3 class="text-xl font-black text-white uppercase tracking-tight italic">Nueva Auditoría / Autoevaluación</h3>
                <p class="text-[10px] font-black text-emerald-500/60 uppercase tracking-[0.2em] mt-1 italic">Configuración de contexto inicial</p>
              </div>
            </div>
            <button @click="$emit('update:modelValue', false)" class="p-3 rounded-xl hover:bg-white/5 text-white/30 hover:text-white transition-all">
              <X class="w-6 h-6" />
            </button>
          </div>
        </div>

        <!-- Form -->
        <div class="p-10 space-y-8">
          <!-- Cliente -->
          <div class="space-y-3">
            <label class="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] italic ml-1">Seleccionar Mandante / Cliente</label>
            <div class="relative group">
              <select 
                v-model="selection.cliente" 
                class="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-sm font-bold text-white outline-none focus:border-emerald-500/50 appearance-none transition-all group-hover:bg-white/[0.08]"
                @change="onClienteChange"
              >
                <option value="" disabled hidden>Seleccionar cliente...</option>
                <option v-for="c in clientes" :key="c.id_empresa" :value="c.id_empresa">
                  {{ getClienteLabel(c) }}
                </option>
              </select>
              <ChevronDown class="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
            </div>
          </div>

          <!-- Proyecto -->
          <div class="space-y-3" :class="{ 'opacity-40 pointer-events-none': !selection.cliente || isTransmac }">
            <label class="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] italic ml-1">Contrato / Proyecto</label>
            <div class="relative group">
              <select 
                v-model="selection.proyecto" 
                class="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-sm font-bold text-white outline-none focus:border-emerald-500/50 appearance-none transition-all group-hover:bg-white/[0.08]"
                :disabled="!selection.cliente || loadingProyectos || isTransmac"
              >
                <option v-if="isTransmac" value="NA">NO APLICA (TRANSMAC INTERNO)</option>
                <option v-else value="" disabled hidden>Seleccionar proyecto...</option>
                <option v-for="p in proyectos" :key="p.id_proyecto" :value="p.id_proyecto">{{ p.nombre_proyecto }}</option>
              </select>
              <ChevronDown v-if="!loadingProyectos && !isTransmac" class="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
              <Loader2 v-if="loadingProyectos" class="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 animate-spin" />
            </div>
          </div>

          <!-- Mes/Periodo -->
          <div class="space-y-3">
            <label class="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] italic ml-1">Periodo de Evaluación</label>
            <div class="grid grid-cols-2 gap-4">
              <div class="relative group">
                <select v-model="selection.mes" class="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-sm font-bold text-white outline-none focus:border-emerald-500/50 appearance-none transition-all group-hover:bg-white/[0.08]">
                  <option v-for="m in meses" :key="m.val" :value="m.val">{{ m.label }}</option>
                </select>
                <ChevronDown class="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
              </div>
              <div class="relative group">
                <select v-model="selection.ano" class="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-sm font-bold text-white outline-none focus:border-emerald-500/50 appearance-none transition-all group-hover:bg-white/[0.08]">
                  <option v-for="a in anos" :key="a" :value="a">{{ a }}</option>
                </select>
                <ChevronDown class="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="p-10 bg-white/[0.02] border-t border-white/5 flex gap-4">
          <button @click="$emit('update:modelValue', false)" class="flex-1 h-14 rounded-2xl border border-white/10 text-[11px] font-black uppercase tracking-widest text-white/40 hover:bg-white/5 hover:text-white transition-all">
            Cancelar
          </button>
          <button 
            @click="handleConfirm" 
            :disabled="!selection.cliente || !selection.proyecto"
            class="flex-[2] h-14 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed text-black rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_8px_30px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-3"
          >
            Comenzar Evaluación <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { reactive, ref, onMounted, watch, computed } from 'vue'
import { X, Plus, ChevronDown, ChevronRight, Loader2 } from 'lucide-vue-next'
import apiAxios from '@/services/api'

const props = defineProps({
  modelValue: Boolean,
  auditType: {
    type: String,
    default: 'GENERAL' // RESSO, RECSS, MINSAL
  }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const selection = reactive({
  cliente: '',
  proyecto: '',
  mes: new Date().getMonth() + 1,
  ano: new Date().getFullYear()
})

const isTransmac = computed(() => {
  const c = clientes.value.find(cl => cl.id_empresa === selection.cliente)
  return (c?.name_empresa || '').toUpperCase().includes('TRANSMAC')
})

const clientes = ref([])
const proyectos = ref([])
const loadingProyectos = ref(false)

const meses = [
  { val: 1, label: 'Enero' }, { val: 2, label: 'Febrero' }, { val: 3, label: 'Marzo' },
  { val: 4, label: 'Abril' }, { val: 5, label: 'Mayo' }, { val: 6, label: 'Junio' },
  { val: 7, label: 'Julio' }, { val: 8, label: 'Agosto' }, { val: 9, label: 'Septiembre' },
  { val: 10, label: 'Octubre' }, { val: 11, label: 'Noviembre' }, { val: 12, label: 'Diciembre' }
]

const anos = [new Date().getFullYear(), new Date().getFullYear() - 1]

async function fetchClientes() {
  try {
    const { data } = await apiAxios.get('/servicio/leanglobal/obtenerEmpresas')
    const raw = Array.isArray(data) ? data : []
    
    // Configuración de filtros según tipo de auditoría
    let allowedNames = ['TRANSMAC', 'CODELCO', 'AMSA', 'ANTOFAGASTA MINERALS', 'PELAMBRES', 'CENTINELA']
    
    if (props.auditType === 'MINSAL') {
      allowedNames = ['TRANSMAC'] // Solo Transmac (Spa y Ltda se filtran por nombre)
    }

    clientes.value = raw.filter(e => {
      const name = (e.name_empresa || '').toUpperCase()
      const matches = allowedNames.some(a => name.includes(a))
      
      // Regla específica para MINSAL: Solo Transmac Spa/Ltda
      if (props.auditType === 'MINSAL') {
        const isTransmac = name.includes('TRANSMAC')
        const isSpaOrLtda = name.includes('SPA') || name.includes('LTDA') || name.includes('LIMITADA')
        return isTransmac && isSpaOrLtda
      }

      const isNotExt = !(e.flag_externo === true || e.flag_externo === 1 || e.flag_externo === '1' || e.flag_externo === 't' || e.flag_externo === 'true')
      return matches && isNotExt
    })
  } catch (err) {
    console.error('Error fetching clients:', err)
  }
}

function getClienteLabel(cliente) {
  const nombre = String(cliente?.name_empresa || '').trim()
  if (nombre) return nombre
  
  const respaldo = String(cliente?.razon_social || cliente?.rut_empresa || '').trim()
  if (respaldo) return respaldo
  
  return `ID: ${cliente?.id_empresa}`
}

async function fetchProyectos(idCliente) {
  if (!idCliente) return
  loadingProyectos.value = true
  try {
    const { data } = await apiAxios.get(`/servicio/leanglobal/obtenerProyectos?id_empresa_cliente=${idCliente}`)
    proyectos.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error('Error fetching projects:', err)
  } finally {
    loadingProyectos.value = false
  }
}

function onClienteChange() {
  if (isTransmac.value) {
    selection.proyecto = 'NA'
    proyectos.value = []
  } else {
    selection.proyecto = ''
    fetchProyectos(selection.cliente)
  }
}

function handleConfirm() {
  const clienteData = clientes.value.find(c => c.id_empresa === selection.cliente)
  const proyectoData = isTransmac.value ? { nombre_proyecto: 'NO APLICA (GESTIÓN INTERNA)' } : proyectos.value.find(p => p.id_proyecto === selection.proyecto)
  const mesLabel = meses.find(m => m.val === selection.mes).label

  emit('confirm', {
    ...selection,
    clienteName: clienteData?.name_empresa,
    proyectoName: proyectoData?.nombre_proyecto,
    periodo: `${mesLabel.toUpperCase()} ${selection.ano}`
  })
  emit('update:modelValue', false)
}

onMounted(() => {
  fetchClientes()
})
</script>

<style scoped>
select option {
  background-color: #1a1c22;
  color: white;
  padding: 10px;
}
</style>
