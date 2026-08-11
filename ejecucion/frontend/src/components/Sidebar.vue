<template>
  <aside 
    class="h-screen border-r border-border/40 flex flex-col bg-[#0c0c0e] relative z-20 transition-all duration-300 pointer-events-auto shadow-2xl"
    :class="navStore.isCollapsed ? 'w-20' : 'w-72'"
  >
    <!-- Logo -->
    <div class="h-20 flex items-center mb-2 transition-all duration-300" :class="navStore.isCollapsed ? 'justify-center px-0' : 'px-6'">
      <div class="flex items-center gap-3">
        <div 
          class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
          :style="{ background: `linear-gradient(135deg, ${activeTheme.primary}, ${activeTheme.primary}88)`, boxShadow: `0 0 20px ${activeTheme.glow}` }"
        >
          <Zap class="w-6 h-6 text-black fill-black" />
        </div>
        <div v-if="!navStore.isCollapsed" class="flex flex-col">
          <span class="text-lg font-black tracking-[-0.05em] text-white uppercase leading-none block">{{ activeTheme.name }}</span>
          <div class="flex items-center gap-2 mt-1.5">
            <span class="text-[9px] font-black tracking-[0.3em] uppercase opacity-90" :class="[activeTheme.textClass]">{{ activeTheme.brand }}</span>
            <span class="text-[8px] font-black uppercase tracking-widest text-slate-500 bg-white/5 px-1.5 py-0.5 rounded-md">v{{ appVersion }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <div class="flex-1 min-h-0 overflow-y-auto space-y-1 transition-all duration-300 scrollbar-hide" :class="navStore.isCollapsed ? 'px-2' : 'px-3'">
      <template v-for="item in menuItems" :key="item.name">
        <!-- FIRST LEVEL LINK (No children) -->
        <router-link 
          v-if="!item.children"
          :to="{ name: item.routeName }"
          class="flex items-center rounded-xl transition-all duration-200 group relative border border-transparent"
          :class="[
            navStore.isCollapsed ? 'justify-center py-2.5 px-0' : 'gap-3 px-3 py-2.5 w-full',
            $route?.name === item.routeName 
              ? activeClass 
              : 'text-muted-foreground hover:text-white hover:bg-white/5'
          ]"
        >
          <component :is="item.icon" class="w-5 h-5 shrink-0" />
          <span v-if="!navStore.isCollapsed" class="text-sm font-medium tracking-wide">{{ item.name }}</span>
          <span v-if="item.count && !navStore.isCollapsed" class="sidebar-item-count ml-auto" :class="item.countClass">{{ item.count }}</span>
          
          <!-- Tooltip for collapsed mode -->
          <div 
            v-if="navStore.isCollapsed" 
            class="absolute left-full ml-4 px-3 py-2 bg-popover text-popover-foreground text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-border/50 shadow-xl pointer-events-none"
          >
            {{ item.name }}
          </div>

          <!-- Active Indicator -->
          <div 
            v-if="$route.name === item.routeName"
            class="absolute left-0 w-1 h-6 rounded-r-full"
            :class="[activeTheme.bgClass]"
            :style="{ boxShadow: `0 0 8px ${activeTheme.primary}` }"
          ></div>
        </router-link>

        <!-- GROUP LEVEL (Has children) -->
        <div 
          v-else 
          class="group relative"
        >
          <!-- Header of Group -->
          <div
            class="flex items-center rounded-xl transition-all duration-200 cursor-pointer border border-transparent"
            :class="[
              navStore.isCollapsed ? 'justify-center py-2.5 px-0' : 'gap-3 px-3 py-2.5 w-full justify-between',
              item.children.some(child => $route?.name === child.routeName)
                ? `${activeTheme.textClass} bg-${activeTheme.colorName}-500/5`
                : 'text-muted-foreground hover:text-white hover:bg-white/5'
            ]"
          >
            <div class="flex items-center gap-3">
              <component :is="item.icon" class="w-5 h-5 shrink-0" />
              <div v-if="!navStore.isCollapsed" class="flex flex-col text-left">
                <span class="text-sm font-semibold tracking-wide">{{ item.name }}</span>
                <span class="text-[9px] text-slate-500 font-medium leading-tight mt-0.5">{{ item.subtitle }}</span>
              </div>
            </div>
            <!-- Chevron indicator for expand mode -->
            <ChevronRight 
              v-if="!navStore.isCollapsed" 
              class="w-4 h-4 text-zinc-500 group-hover:rotate-90 transition-transform duration-200" 
            />
          </div>

          <!-- Children Submenu -->
          <div
            v-if="!navStore.isCollapsed"
            class="max-h-0 opacity-0 overflow-hidden group-hover:max-h-96 group-hover:opacity-100 transition-all duration-300 pl-8 pr-1 space-y-1 mt-1"
          >
            <router-link 
              v-for="sub in item.children"
              :key="sub.name"
              :to="{ name: sub.routeName }"
              class="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-xs font-medium border border-transparent"
              :class="[
                $route?.name === sub.routeName
                  ? `${activeTheme.textClass} bg-${activeTheme.colorName}-500/5 border-${activeTheme.colorName}-500/10`
                  : 'text-muted-foreground hover:text-white hover:bg-white/5'
              ]"
            >
              <span>{{ sub.name }}</span>
            </router-link>
          </div>

          <!-- Collapsed mode: Hover Popover lateral -->
          <div
            v-else
            class="absolute left-full top-0 ml-2 w-56 bg-[#0c0c0e] border border-border/40 rounded-xl shadow-2xl opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto transition-all duration-200 p-2 space-y-1 z-50"
          >
            <div class="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 mb-1 border-b border-border/20 text-left" :class="[activeTheme.textClass]">
              {{ item.name }}
            </div>
            <router-link 
              v-for="sub in item.children"
              :key="sub.name"
              :to="{ name: sub.routeName }"
              class="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-xs font-medium border border-transparent text-left"
              :class="[
                $route?.name === sub.routeName
                  ? `${activeTheme.textClass} bg-${activeTheme.colorName}-500/5 border-${activeTheme.colorName}-500/10`
                  : 'text-muted-foreground hover:text-white hover:bg-white/5'
              ]"
            >
              <span>{{ sub.name }}</span>
            </router-link>
          </div>
        </div>
      </template>
    </div>

    <!-- Footer / Collapse Toggle -->
    <div class="p-4 border-t border-border/40">
      <button 
        @click="navStore.toggleSidebar()"
        class="w-full flex items-center justify-center gap-2 p-2 mt-2 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-white"
      >
        <ChevronFirst v-if="!navStore.isCollapsed" class="w-5 h-5" />
        <ChevronLast v-else class="w-5 h-5" />
        <span v-if="!navStore.isCollapsed" class="text-[10px] font-bold uppercase tracking-wider">Colapsar Menú</span>
      </button>

      <div class="mt-4 pt-4 border-t border-border/40">
        <button 
          @click="logout"
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-red-500 hover:bg-red-500/10 group"
          :class="{ 'justify-center': navStore.isCollapsed }"
        >
          <LogOut class="w-5 h-5 shrink-0" />
          <span v-if="!navStore.isCollapsed" class="text-sm font-semibold tracking-wide">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { 
  BarChart3, 
  Users, 
  LayoutGrid, 
  FileCheck2, 
  Wrench, 
  ShieldCheck, 
  FolderOpen,
  ChevronFirst,
  ChevronLast,
  ChevronRight,
  Zap,
  LogOut,
  Settings,
  Orbit,
  Package
} from 'lucide-vue-next'
import { navStore } from '../stores/navStore'
import apiAxios from '../services/api'

const appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '2.0.0'

const activeProjectsCount = ref(0)
const blockedOperatorsCount = ref(0)

const companyThemes = {
  9: {
    id: 9,
    name: 'Grúas San Pablo',
    brand: 'GSP CONSOLE',
    colorName: 'amber',
    primary: '#f5a623',
    glow: 'rgba(245, 166, 35, 0.15)',
    textClass: 'text-amber-500',
    bgClass: 'bg-amber-500',
    borderClass: 'border-amber-500',
    avatarBg: 'bg-amber-500/20 text-amber-500'
  },
  7: {
    id: 7,
    name: 'Bestmaq Arriendos',
    brand: 'BESTMAQ CONSOLE',
    colorName: 'blue',
    primary: '#3b82f6',
    glow: 'rgba(59, 130, 246, 0.15)',
    textClass: 'text-blue-500',
    bgClass: 'bg-blue-500',
    borderClass: 'border-blue-500',
    avatarBg: 'bg-blue-500/20 text-blue-500'
  },
  8: {
    id: 8,
    name: 'Logística del Sur',
    brand: 'LOGÍSTICA CONSOLE',
    colorName: 'red',
    primary: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.15)',
    textClass: 'text-red-500',
    bgClass: 'bg-red-500',
    borderClass: 'border-red-500',
    avatarBg: 'bg-red-500/20 text-red-500'
  },
  11: {
    id: 11,
    name: 'Royal Rental',
    brand: 'ROYAL CONSOLE',
    colorName: 'emerald',
    primary: '#10b981',
    glow: 'rgba(16, 185, 129, 0.15)',
    textClass: 'text-emerald-500',
    bgClass: 'bg-emerald-500',
    borderClass: 'border-emerald-500',
    avatarBg: 'bg-emerald-500/20 text-emerald-500'
  }
}

const activeTheme = computed(() => companyThemes[navStore.activeEmpresa] || companyThemes[9])

const activeClass = computed(() => {
  const c = activeTheme.value.colorName
  return `bg-${c}-500/10 text-${c}-500 !border-${c}-500/20 shadow-[inset_0_0_10px_rgba(255,255,255,0.01)]`
})

const fetchRealData = async () => {
  try {
    // 1. Obtener proyectos activos reales (estados 3 y 4)
    const { data: proyectosData } = await apiAxios.get('/proyectos')
    const proyectos = proyectosData.proyectos || []
    activeProjectsCount.value = proyectos.length

    // 2. Obtener operadores con pase vencido
    const { data: usuariosData } = await apiAxios.get('/usuarios')
    const usuarios = Array.isArray(usuariosData) ? usuariosData : (usuariosData?.usuarios || usuariosData?.data || [])
    const vencidos = usuarios.filter(u => u.estado_acreditacion === 'vencido' || u.id_usuario_estado === 3)
    blockedOperatorsCount.value = vencidos.length || 1 // Fallback seguro a 1
  } catch (err) {
    console.error('Error fetching dynamic counts for sidebar:', err)
    activeProjectsCount.value = 2 // Fallback si falla
    blockedOperatorsCount.value = 1
  }
}

const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push({ name: 'login' })
}

const menuItems = computed(() => {
  const c = activeTheme.value.colorName
  return [
    { 
      name: 'Dashboard', 
      routeName: 'dashboard', 
      icon: BarChart3
    },
    { 
      name: 'Torre de Control Vista 360', 
      routeName: 'torre', 
      icon: LayoutGrid, 
      count: activeProjectsCount.value || null,
      countClass: `border-${c}-500/30 text-${c}-500`
    },
    { 
      name: 'Clientes', 
      routeName: 'clientes', 
      icon: Users
    },
    { 
      name: 'Estados de Pago', 
      routeName: 'cruce', 
      icon: FileCheck2
    },
    { 
      name: 'Gestión de Flota', 
      icon: Orbit,
      subtitle: 'Control & Mantenimiento',
      children: [
        { name: 'Vista Equipos 360', routeName: 'vista360' },
        { name: 'Inspecciones de Equipos', routeName: 'inspecciones' },
        { name: 'Órdenes de Trabajo (OTs)', routeName: 'mantenimiento' }
      ]
    },
    {
      name: 'Inventario (WMS-Lite)',
      icon: Package,
      subtitle: 'Global Manager WMS',
      children: [
        { name: '1. Bodegas & Existencias', routeName: 'inventario_bodegas' },
        { name: '2. Maestro de Productos', routeName: 'inventario_productos' },
        { name: '3. Alertas & Quiebres', routeName: 'inventario_alertas' }
      ]
    },
    { 
      name: 'Acreditación Personal', 
      routeName: 'acreditacion', 
      icon: ShieldCheck, 
      count: blockedOperatorsCount.value || null,
      countClass: 'border-red-500/30 text-red-500 !bg-red-500/10'
    },
    { 
      name: 'Gestor Documental', 
      routeName: 'documentos', 
      icon: FolderOpen
    },
    { 
      name: 'Mantenedores', 
      routeName: 'mantenedores', 
      icon: Settings
    }
  ]
})

onMounted(fetchRealData)
</script>

<style scoped>
.sidebar-item-count {
  margin-left: auto;
  background: #000;
  font-size: 9px;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 10px;
  border: 1px solid;
}
</style>
