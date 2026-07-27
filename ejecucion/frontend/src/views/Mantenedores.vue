<template>
  <div class="h-full flex flex-col space-y-4">
    <!-- Main Container (Clon de DashboardMantenedores.vue) -->
    <div class="glass-card flex-1 flex flex-col rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
      
      <!-- Header (Exacto Terracon) -->
      <div class="px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-white/5">
        <div class="flex items-center gap-3">
          <Settings class="w-5 h-5 text-emerald-500" />
          <h2 class="text-xl font-bold text-white tracking-tight text-shadow-glow">Mantenedores</h2>
        </div>

        <div class="relative w-full md:w-80">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            v-model="search" 
            type="text" 
            placeholder="Buscar (global)..."
            class="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-white"
          >
        </div>
      </div>

      <!-- Tabs Navigation (Orden Exacto Terracon: Usuarios, Proyectos, Equipos, Roles, Enrolamiento) -->
      <div class="px-4 bg-white/[0.02] border-b border-white/5 overflow-x-auto no-scrollbar">
        <div class="flex">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            @click="activeTab = tab.id"
            class="px-6 py-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all relative group"
            :class="activeTab === tab.id ? 'text-emerald-500' : 'text-muted-foreground hover:text-white'"
          >
            <component :is="tab.icon" class="w-4 h-4" />
            {{ tab.label }}
            <div v-if="activeTab === tab.id" class="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
          </button>
        </div>
      </div>

      <!-- Content (Igual funcionalidad que v-window) -->
      <div class="flex-1 overflow-y-auto p-6 scroll-smooth">
        <transition mode="out-in" enter-active-class="duration-200" leave-active-class="duration-150">
          <div :key="activeTab">
            <component 
              :is="currentTabComponent" 
              :search="search"
              :refresh-key="refreshKey[activeTab]"
              @refresh="doRefresh"
              @go-equipos="goEquipos"
            />
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { 
  Settings, Search, Users, Briefcase, 
  UsersRound, ShieldHalf, QrCode 
} from 'lucide-vue-next'

// Componentes Reales Portados
import MantenedorUsuarios from '../components/mantenedores/MantenedorUsuarios.vue'
import MantenedorProyectos from '../components/mantenedores/MantenedorProyectos.vue'
import MantenedorEquipos from '../components/mantenedores/MantenedorEquipos.vue'
import MantenedorRoles from '../components/mantenedores/MantenedorRoles.vue'
import MantenedorEnrolamiento from '../components/mantenedores/MantenedorEnrolamiento.vue'

const activeTab = ref('usuarios')
const search = ref('')
const refreshKey = reactive({
  usuarios: 0,
  proyectos: 0,
  equipos: 0,
  roles: 0,
  enrolamiento: 0,
})

const tabs = [
  { id: 'usuarios', label: 'Usuarios', icon: Users },
  { id: 'proyectos', label: 'Proyectos', icon: Briefcase },
  { id: 'equipos', label: 'Equipos', icon: UsersRound },
  { id: 'roles', label: 'Roles', icon: ShieldHalf },
  { id: 'enrolamiento', label: 'Enrolamiento', icon: QrCode },
]

const tabComponents = {
  usuarios: MantenedorUsuarios,
  proyectos: MantenedorProyectos,
  equipos: MantenedorEquipos,
  roles: MantenedorRoles,
  enrolamiento: MantenedorEnrolamiento
}

const currentTabComponent = computed(() => tabComponents[activeTab.value])

function doRefresh(tabId) {
  if (refreshKey[tabId] !== undefined) refreshKey[tabId]++
}

function goEquipos(prj) {
  // Lógica exacta de Terracon para saltar a equipos desde un proyecto
  activeTab.value = 'equipos'
  doRefresh('equipos')
}
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
.text-shadow-glow { text-shadow: 0 0 10px rgba(16, 185, 129, 0.3); }
</style>
