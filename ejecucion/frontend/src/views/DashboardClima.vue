<template>
  <div class="p-6 max-w-[1600px] mx-auto space-y-6">
    <!-- Header with Campaign Selection -->
    <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-[#0c0c0e]/90 border border-emerald-500/20 p-4 rounded-xl shadow-lg backdrop-blur-md">
      <div>
        <h1 class="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
          <Activity class="w-6 h-6 text-emerald-500" />
          Dashboard Clima Organizacional
        </h1>
        <p class="text-[10px] text-emerald-500/70 mt-1 font-mono tracking-[0.2em] uppercase">Análisis de Tendencias y Comparativa Histórica</p>
      </div>
      
      <div class="flex flex-wrap gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-[9px] font-black text-zinc-500 uppercase px-1">Campaña Actual</label>
          <select v-model="primaryCampaign" class="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50 min-w-[180px]">
            <option v-for="c in campaigns" :key="c.id_campana" :value="c.id_campana">{{ c.nombre }}</option>
          </select>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-[9px] font-black text-zinc-500 uppercase px-1">Comparar con (Opcional)</label>
          <select v-model="secondaryCampaign" class="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50 min-w-[180px]">
            <option :value="null">Sin Comparación</option>
            <option v-for="c in campaigns" :key="c.id" :value="c.id" :disabled="c.id === primaryCampaign">{{ c.nombre }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- N+5 Warning Overlay (Si aplica) -->
    <div v-if="sampleSize < 5" class="glass p-12 rounded-[2rem] flex flex-col items-center justify-center text-center space-y-4 border-amber-500/20">
      <div class="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center">
        <ShieldAlert class="w-8 h-8 text-amber-500" />
      </div>
      <h2 class="text-2xl font-black uppercase text-amber-500">Datos Insuficientes</h2>
      <p class="text-white/60 max-w-md text-sm">
        Para proteger el anonimato, los resultados solo se muestran cuando hay al menos 5 respuestas.
        <br>
        <span class="text-white/40 text-[10px] mt-2 block">Muestra actual: {{ sampleSize }} respuestas.</span>
      </p>
    </div>

    <template v-else>
      <!-- Main KPIs -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div v-for="kpi in kpis" :key="kpi.label" class="bg-[#131316] border border-white/5 p-5 rounded-2xl relative overflow-hidden group">
          <div class="absolute -right-2 -bottom-2 opacity-5 group-hover:opacity-10 transition-opacity">
            <component :is="kpi.icon" class="w-20 h-20" />
          </div>
          <div class="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">{{ kpi.label }}</div>
          <div class="flex items-baseline gap-3">
            <div class="text-3xl font-black text-white tabular-nums">{{ kpi.value }}</div>
            <div v-if="secondaryCampaign && kpi.delta" :class="kpi.delta >= 0 ? 'text-emerald-500' : 'text-rose-500'" class="text-[10px] font-black flex items-center gap-0.5">
              <TrendingUp v-if="kpi.delta >= 0" class="w-3 h-3" />
              <TrendingDown v-else class="w-3 h-3" />
              {{ Math.abs(kpi.delta) }}%
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Radar/Spider Chart -->
        <div class="lg:col-span-2 bg-[#131316] border border-white/5 p-6 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
          <div class="flex justify-between items-center mb-6">
            <div>
              <h3 class="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Compass class="w-4 h-4 text-emerald-500" />
                Dimensiones de Clima (Spider Chart)
              </h3>
              <p class="text-[9px] text-zinc-600 uppercase font-black mt-1">Comparativa de Desempeño por Dimensión</p>
            </div>
            <div v-if="secondaryCampaign" class="flex gap-4">
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span class="text-[9px] font-black text-zinc-500 uppercase">Actual</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full bg-blue-500/50"></div>
                <span class="text-[9px] font-black text-zinc-500 uppercase">Histórico</span>
              </div>
            </div>
          </div>
          <div id="spider-container" class="h-[450px]"></div>
        </div>

        <!-- Participation & Segment Details -->
        <div class="bg-[#131316] border border-white/5 p-6 rounded-[2.5rem] flex flex-col justify-between space-y-8">
          <div class="space-y-6">
            <h3 class="text-xs font-black text-zinc-400 uppercase tracking-widest">Participación por Sede</h3>
            <div class="space-y-4">
              <div v-for="segment in participationData" :key="segment.name" class="space-y-1">
                <div class="flex justify-between text-[10px] font-black uppercase">
                  <span class="text-zinc-400">{{ segment.name }}</span>
                  <span :class="segment.count < 5 ? 'text-rose-500' : 'text-emerald-500'">{{ segment.count }} Rptas.</span>
                </div>
                <div class="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div class="h-full bg-emerald-500/40" :style="{ width: segment.percentage + '%' }"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl">
            <p class="text-[9px] text-emerald-500/70 leading-relaxed font-bold italic">
              "Los resultados mostrados cumplen con la regla N+5. Grupos con participación inferior a 5 personas se ocultan automáticamente para garantizar el anonimato."
            </p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import Highcharts from 'highcharts'
import { sstAxios } from '@/services/api'
import { Activity, Compass, TrendingUp, TrendingDown, Users, CheckCircle2, AlertCircle, BarChart3, ShieldAlert } from 'lucide-vue-next'

import HighchartsMore from 'highcharts/highcharts-more'
import { useRoute } from 'vue-router'

const route = useRoute()

// Inicialización de módulos de forma robusta
if (typeof HighchartsMore === 'function') {
  HighchartsMore(Highcharts)
} else if (HighchartsMore && HighchartsMore.default) {
  HighchartsMore.default(Highcharts)
}
const highchartsReady = ref(true)
const primaryCampaign = ref(route.query.campaign || null)
const secondaryCampaign = ref(null)
const sampleSize = ref(0)
const kpisData = ref([])
const chartDataPrimary = ref([])
const chartDataSecondary = ref(null)

const campaigns = ref([])

const participationData = ref([])

const loadDashboardData = async () => {
  try {
    // 1. Obtener listado de campañas para los combos
    const campanasRes = await sstAxios.get('/clima/campanas')
    campaigns.value = campanasRes.data
    
    if (campaigns.value.length > 0 && !primaryCampaign.value) {
      primaryCampaign.value = campaigns.value[0].id_campana
    }

    // 2. Obtener data real del dashboard (KPIs, Sedes y Spider Data)
    const { data } = await sstAxios.get(`/clima/campanas/${primaryCampaign.value}/stats`)
    
    // Mapeo de KPIs
    const icons = [Users, CheckCircle2, AlertCircle, BarChart3]
    kpisData.value = [
      { label: 'Participación Global', value: Math.round((data.kpis.respondidos / data.kpis.total) * 100) + '%', delta: null, icon: Users },
      { label: 'Índice Satisfacción', value: data.kpis.avgScore, delta: null, icon: CheckCircle2 },
      { label: 'Total Invitados', value: data.kpis.total, delta: null, icon: Activity },
      { label: 'Net Promo Score', value: data.kpis.nps, delta: null, icon: BarChart3 }
    ]
    
    // Mapeo de Spider Chart (Solo valores)
    chartDataPrimary.value = data.spiderData.map(d => d.value)
    sampleSize.value = data.kpis.respondidos
    
    // Mapeo de Sedes/Sucursales
    participationData.value = data.sedes.map(s => ({
      name: s.label,
      count: s.value,
      percentage: Math.round((s.value / (s.total || 1)) * 100)
    }))
    
    if (highchartsReady.value) {
      console.log("📊 Datos recibidos para el gráfico:", chartDataPrimary.value);
      nextTick(() => renderChart())
    }
  } catch (err) {
    console.error("❌ Error cargando dashboard data", err)
  }
}

const kpis = computed(() => kpisData.value)

const chartOptions = computed(() => ({
  chart: { polar: true, type: 'area', backgroundColor: 'transparent' },
  title: { text: null },
  pane: { size: '80%' },
  xAxis: {
    categories: ['Adm. Contrato', 'Compromiso', 'Orientación Cliente', 'Desarrollo Prof.', 'Satisfacción Gral.', 'Organización', 'Comunicación'],
    tickmarkPlacement: 'on',
    lineWidth: 0,
    labels: { style: { color: '#71717a', fontSize: '9px', fontWeight: '900', textTransform: 'uppercase' } }
  },
  yAxis: { gridLineInterpolation: 'polygon', lineWidth: 0, min: 0, max: 5, labels: { style: { color: '#3f3f46' } } },
  tooltip: { shared: true, pointFormat: '<span style="color:{series.color}">{series.name}: <b>{point.y:,.1f}</b><br/>' },
  legend: { enabled: false },
  series: [
    {
      name: 'Comparativa',
      data: chartDataSecondary.value || [],
      pointPlacement: 'on',
      color: 'rgba(59, 130, 246, 0.3)',
      lineColor: '#3b82f6',
      fillOpacity: 0.1,
      visible: !!secondaryCampaign.value && !!chartDataSecondary.value
    },
    {
      name: 'Campaña Actual',
      data: chartDataPrimary.value || [],
      pointPlacement: 'on',
      color: 'rgba(16, 185, 129, 0.5)',
      lineColor: '#10b981',
      fillOpacity: 0.3
    }
  ]
}))

const renderChart = () => {
  const container = document.getElementById('spider-container')
  if (!container || !highchartsReady.value || chartDataPrimary.value.length === 0) return
  
  console.log("🎨 Renderizando Spider Chart con:", chartDataPrimary.value)
  Highcharts.chart('spider-container', chartOptions.value)
}

watch([primaryCampaign, secondaryCampaign], () => {
  loadDashboardData()
})

onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
.glass {
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(10px);
}
.animate-in {
  animation: fade-in 0.7s ease-out;
}
@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
