<template>
  <div class="p-6 max-w-[1600px] mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-[#0c0c0e]/90 border border-emerald-500/20 p-4 rounded-xl shadow-lg backdrop-blur-md">
      <div>
        <h1 class="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
          <CalendarDays class="w-6 h-6 text-emerald-500" />
          Mantenedor de Campañas de Clima
        </h1>
        <p class="text-[10px] text-emerald-500/70 mt-1 font-mono tracking-[0.2em] uppercase">Configuración de Periodos y Empresas</p>
      </div>
      
      <button 
        @click="openNewCampaignModal"
        class="bg-emerald-500 hover:bg-emerald-600 text-black px-4 py-2 rounded-lg font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]">
        <Plus class="w-4 h-4" /> Nueva Campaña
      </button>
    </div>

    <!-- Campaigns List -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="c in campaigns" :key="c.id" class="bg-[#131316] border border-white/5 rounded-[2rem] p-6 hover:border-emerald-500/30 transition-all group relative overflow-hidden">
        <!-- Status Badge -->
        <div class="absolute top-6 right-6 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border"
          :class="statusClasses(c.estado)">
          {{ c.estado }}
        </div>

        <div class="space-y-4">
          <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
            <LayoutGrid class="w-6 h-6 text-emerald-500" />
          </div>
          
          <div>
            <h3 class="text-xl font-black text-white uppercase tracking-tight">{{ c.nombre }}</h3>
            <p class="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{{ c.empresa }}</p>
          </div>

          <div class="flex gap-4 pt-2">
            <div>
              <p class="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-1">Inicio</p>
              <p class="text-xs font-bold text-zinc-300">{{ c.fecha_inicio }}</p>
            </div>
            <div class="w-px h-8 bg-white/5"></div>
            <div>
              <p class="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-1">Término</p>
              <p class="text-xs font-bold text-zinc-300">{{ c.fecha_fin }}</p>
            </div>
          </div>

          <!-- Stats Grid -->
          <div class="grid grid-cols-2 gap-3 mt-4 bg-black/20 p-3 rounded-xl border border-white/5">
            <div>
              <p class="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-1">Invitados</p>
              <p class="text-lg font-black text-white tabular-nums">{{ c.total_invitados || 0 }}</p>
            </div>
            <div>
              <p class="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-1">Respondidos</p>
              <p class="text-lg font-black text-emerald-500 tabular-nums">{{ c.respuestas || 0 }}</p>
            </div>
          </div>

          <div class="pt-4 flex flex-wrap gap-2">
            <button class="flex-1 min-w-[80px] bg-white/5 hover:bg-white/10 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Editar</button>
            <button 
              @click="$router.push({ name: 'clima-gestion', query: { campaign: c.id } })"
              class="flex-1 min-w-[80px] bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Nómina</button>
            <button 
              @click="$router.push({ name: 'clima-dashboard', query: { campaign: c.id } })"
              class="flex-1 min-w-[80px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Resultados</button>
          </div>
        </div>
      </div>
    </div>

    <!-- New Campaign Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div class="bg-[#131316] border border-white/10 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden">
        <div class="p-8 space-y-6">
          <h2 class="text-2xl font-black text-white uppercase tracking-tight">Nueva Campaña</h2>
          
          <div class="space-y-4">
            <div class="space-y-1">
              <label class="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Nombre de la Campaña</label>
              <input v-model="newCampaign.nombre" type="text" placeholder="Ej: Clima Laboral 2026" class="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50">
            </div>

            <div class="space-y-1">
              <label class="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Empresa</label>
              <select v-model="newCampaign.empresa" class="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50">
                <option>Transmac</option>
                <option>Empresa 2</option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Fecha Inicio</label>
                <input v-model="newCampaign.fecha_inicio" type="date" class="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50">
              </div>
              <div class="space-y-1">
                <label class="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Fecha Término</label>
                <input v-model="newCampaign.fecha_termino" type="date" class="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50">
              </div>
            </div>
          </div>

          <div class="flex gap-3 pt-4">
            <button @click="showModal = false" class="flex-1 py-3 text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all">Cancelar</button>
            <button @click="saveCampaign" class="flex-[2] bg-emerald-500 hover:bg-emerald-600 text-black py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all">Guardar Campaña</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { CalendarDays, Plus, LayoutGrid, X } from 'lucide-vue-next'
import { sstAxios } from '@/services/api'

const showModal = ref(false)
const campaigns = ref([])

const newCampaign = ref({
  nombre: '',
  empresa: 'Transmac',
  fecha_inicio: '',
  fecha_termino: '',
  descripcion: ''
})

const loadCampanas = async () => {
  try {
    const { data } = await sstAxios.get('/clima/campanas')
    // Mapear los datos de BD a las props esperadas por la UI si es necesario
    campaigns.value = data.map(c => ({
      id: c.id_campana,
      nombre: c.nombre,
      empresa: c.id_empresa === 1 ? 'Transmac' : 'Otra',
      fecha_inicio: c.fecha_inicio ? c.fecha_inicio.split('T')[0] : '',
      fecha_fin: c.fecha_termino ? c.fecha_termino.split('T')[0] : '',
      estado: c.estado,
      total_invitados: c.total_invitados,
      respuestas: c.respuestas
    }))
  } catch (err) {
    console.error("Error al cargar campañas", err)
  }
}

onMounted(() => {
  loadCampanas()
})

const saveCampaign = async () => {
  try {
    await sstAxios.post('/clima/campanas', newCampaign.value)
    showModal.value = false
    newCampaign.value = { nombre: '', empresa: 'Transmac', fecha_inicio: '', fecha_termino: '', descripcion: '' }
    await loadCampanas()
  } catch (err) {
    console.error("Error guardando campaña", err)
  }
}

const openNewCampaignModal = () => {
  showModal.value = true
}

const statusClasses = (estado) => {
  if (estado === 'Activa') return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
  if (estado === 'Cerrada') return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
  return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
}
</script>

<style scoped>
select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1.25rem;
}
</style>
