<template>
  <div class="space-y-6">
    <!-- Selector de Proyecto Activo (Exacto Terracon) -->
    <div class="glass-card p-4 rounded-2xl border border-white/10 flex flex-wrap items-center gap-4 bg-white/[0.03]">
      <div class="flex items-center gap-3 flex-1 min-w-[300px]">
        <span class="text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">Proyecto Activo</span>
        <select 
          v-model="selectedProjectIdLocal"
          @change="onSelectProject"
          class="flex-1 bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option :value="null">Seleccione un proyecto...</option>
          <option v-for="p in projects" :key="p.id_proyecto" :value="p.id_proyecto">
            {{ p.nombre_proyecto }}
          </option>
        </select>
        <span v-if="selectedProject" :class="['px-2 py-1 rounded text-[10px] font-black uppercase', getStatusStyle(selectedProject.id_proyecto_estado)]">
          {{ getStatusName(selectedProject.id_proyecto_estado) }}
        </span>
      </div>
      <button 
        @click="reloadEquipos" 
        :disabled="!selectedProjectIdLocal || cargando"
        class="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl text-xs font-bold uppercase tracking-widest border border-emerald-500/20 disabled:opacity-30"
      >
        <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': cargando }" />
        Recargar
      </button>
    </div>

    <!-- Mensaje sin selección (Exacto Terracon) -->
    <div v-if="!selectedProjectIdLocal" class="p-8 rounded-2xl border border-dashed border-white/10 text-center">
      <UsersRound class="w-12 h-12 text-white/10 mx-auto mb-4" />
      <p class="text-sm text-muted-foreground">Seleccione un proyecto para ver sus equipos.</p>
    </div>

    <!-- Listado de Equipos (Exacto Terracon) -->
    <div v-else class="space-y-4">
      <div v-if="equiposUnicos.length === 0 && !cargando" class="p-8 rounded-2xl border border-dashed border-white/10 text-center">
        <p class="text-sm text-muted-foreground">Este proyecto no tiene equipos registrados.</p>
      </div>

      <div v-for="team in equiposUnicos" :key="team.id_equipo_proyecto" class="glass-card rounded-2xl p-6 border border-white/10 hover:border-emerald-500/30 transition-all group">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-1">
              <h4 class="text-lg font-bold text-white">{{ team.nombre_equipo || ('Equipo #' + team.id_equipo_proyecto) }}</h4>
              <span class="text-[10px] font-mono text-muted-foreground">ID: {{ team.id_equipo_proyecto }}</span>
            </div>
            <p class="text-xs text-muted-foreground">
              {{ team.cantidad }} integrantes 
              <span v-if="team.descripcion_equipo" class="text-white/30 ml-2">— {{ team.descripcion_equipo }}</span>
            </p>
          </div>
          
          <MantenedorIntegrantesEquipo 
            :id-equipo="team.id_equipo_proyecto"
            :nombre-equipo="team.nombre_equipo"
            :descripcion-equipo="team.descripcion_equipo"
            :usuarios="users"
            @actualizado="reloadEquipos"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import apiAxios from '@/services/api'
import { RefreshCw, UsersRound } from 'lucide-vue-next'
import MantenedorIntegrantesEquipo from '@/components/MantenedorIntegrantesEquipo.vue'

const props = defineProps({
  refreshKey: { type: Number, default: 0 }
})

const projects = ref([])
const users = ref([])
const selectedProjectIdLocal = ref(null)
const cargando = ref(false)
const filas = ref([])

const selectedProject = computed(() => 
  projects.value.find(p => Number(p.id_proyecto) === Number(selectedProjectIdLocal.value)) || null
)

const equiposUnicos = computed(() => {
  const map = new Map()
  for (const f of filas.value) {
    const id = Number(f?.id_equipo_proyecto)
    if (!id) continue
    if (!map.has(id)) {
      map.set(id, { id_equipo_proyecto: id, cantidad: 0, nombre_equipo: f?.nombre_equipo, descripcion_equipo: f?.descripcion_equipo })
    }
    map.get(id).cantidad++
  }
  return Array.from(map.values()).sort((a, b) => a.id_equipo_proyecto - b.id_equipo_proyecto)
})

async function getProyectos() {
  const { data } = await apiAxios.get('/servicio/leanglobal/obtenerProyectos')
  projects.value = Array.isArray(data) ? data : []
}

async function obtenerUsuarios() {
  const { data } = await apiAxios.get('/servicio/leanglobal/obtenerUsuarios')
  users.value = (Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []))
    .map(u => ({
      ...u,
      nombre_user: u.nombre_user || `${u.name_frst} ${u.apellido_pat}`,
      email_user: u.email
    }))
}

async function cargarEquipos(pid) {
  if (!pid) return
  cargando.value = true
  try {
    const { data } = await apiAxios.get('/servicio/leanglobal/obtenerEquiposProyectosMiembros', { params: { id_proyecto: pid } })
    filas.value = Array.isArray(data) ? data : []
  } finally { cargando.value = false }
}

function onSelectProject() {
  if (selectedProjectIdLocal.value) cargarEquipos(selectedProjectIdLocal.value)
  else filas.value = []
}

function reloadEquipos() { cargarEquipos(selectedProjectIdLocal.value) }

function getStatusName(id) { return id === 1 ? 'En Ejecución' : 'Planificación' }
function getStatusStyle(id) { return id === 1 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-500/10 text-zinc-500' }

onMounted(async () => {
  await getProyectos()
  await obtenerUsuarios()
})
</script>
