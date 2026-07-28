<template>
  <router-view v-if="isPrintLayout" />
  <router-view v-slot="{ Component }" v-else-if="isAuthLayout">
    <component :is="Component" />
  </router-view>
  <router-view v-else-if="isPublicLayout" />

  <div v-else class="flex h-screen bg-[#050810] text-slate-100 overflow-hidden font-sans">
    <!-- Sidebar GSP -->
    <Sidebar />

    <!-- Main Content -->
    <main class="flex-1 flex flex-col min-w-0 overflow-hidden relative">
      <!-- Top Bar -->
      <header class="h-16 border-b border-border/40 flex items-center justify-between px-6 bg-[#0a0f1e]/80 backdrop-blur-sm z-10">
        <div class="flex items-center gap-6">
          <h1 class="text-xs font-black uppercase tracking-widest" :class="[activeTheme.textClass]">
            {{ currentPathTitle }}
          </h1>
        </div>

        <div class="flex items-center gap-4">
          <!-- Context Switcher Multi-Empresa (RF-4.1) -->
          <div class="relative hidden sm:flex items-center mr-2">
            <select 
              v-model="navStore.activeEmpresa" 
              class="appearance-none bg-[#050810] border border-white/10 text-[10px] font-bold px-3 py-1.5 pr-7 rounded-lg outline-none transition-colors uppercase tracking-wider cursor-pointer"
              :class="[activeTheme.textClass, activeTheme.focusBorderClass]"
            >
              <option :value="0">Todas las empresas</option>
              <option :value="9">Grúas San Pablo</option>
              <option :value="7">Bestmaq Arriendos</option>
              <option :value="8">Logística del Sur</option>
              <option :value="11">Royal Holding</option>
            </select>
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
              <svg class="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>


          <button class="p-2 rounded-lg hover:bg-white/5 transition-colors relative">
            <Bell class="w-5 h-5 text-slate-400 hover:text-white" />
            <span class="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <div class="h-8 w-[1px] bg-white/10"></div>
          
          <div class="flex items-center gap-3 pl-2">
            <div class="text-right hidden sm:block">
              <p class="text-xs font-bold leading-none text-white">{{ userName }}</p>
              <p class="text-[9px] font-medium uppercase tracking-wider mt-1" :class="[activeTheme.textClass]">{{ userRole }}</p>
            </div>
            <div class="w-9 h-9 rounded-full flex items-center justify-center text-slate-950 font-black border border-white/10" :class="[activeTheme.bgClass]">
              {{ userInitials }}
            </div>
          </div>
        </div>
      </header>

      <!-- Viewport Area -->
      <div class="flex-1 overflow-y-auto p-6 scrollbar-hide">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { Bell } from 'lucide-vue-next'
import Sidebar from './components/Sidebar.vue'
import { navStore } from './stores/navStore'

const route = useRoute()

const isPrintLayout = computed(() => route.meta.layout === 'print')
const isAuthLayout = computed(() => route.meta.layout === 'auth')
const isPublicLayout = computed(() => route.meta.layout === 'public')

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
    focusBorderClass: 'focus:border-amber-500',
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
    focusBorderClass: 'focus:border-blue-500',
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
    focusBorderClass: 'focus:border-red-500',
    avatarBg: 'bg-red-500/20 text-red-500'
  },
  11: {
    id: 11,
    name: 'Royal Holding',
    brand: 'ROYAL CONSOLE',
    colorName: 'emerald',
    primary: '#10b981',
    glow: 'rgba(16, 185, 129, 0.15)',
    textClass: 'text-emerald-500',
    bgClass: 'bg-emerald-500',
    borderClass: 'border-emerald-500',
    focusBorderClass: 'focus:border-emerald-500',
    avatarBg: 'bg-emerald-500/20 text-emerald-500'
  },
  0: {
    id: 0,
    name: 'Todas las Empresas',
    brand: 'SST CONSOLE',
    colorName: 'slate',
    primary: '#64748b',
    glow: 'rgba(100, 116, 139, 0.15)',
    textClass: 'text-slate-400',
    bgClass: 'bg-slate-500',
    borderClass: 'border-slate-500',
    focusBorderClass: 'focus:border-slate-500',
    avatarBg: 'bg-slate-500/20 text-slate-400'
  }
}

const activeTheme = computed(() => companyThemes[navStore.activeEmpresa] || companyThemes[9])

watchEffect(() => {
  const theme = activeTheme.value
  document.documentElement.style.setProperty('--brand-primary', theme.primary)
  document.documentElement.style.setProperty('--brand-glow', theme.glow)
})

const currentPathTitle = computed(() => {
  const titles = {
    'dashboard': 'Dashboard General & HSEC',
    'clientes': 'CRM & Gestión de Clientes',
    'torre': 'Torre de Control de Flota',
    'cruce': 'Cruce Contable y Estados de Pago (EDP)',
    'mantencion': 'Mantención de Maquinaria y Certificaciones',
    'acreditacion': 'Acreditación y Control de Pases',
    'documentos': 'Gestor Documental Centralizado'
  }
  return titles[route.name] || 'Consola de Control de Maquinarias GSP'
})

const getLoggedUser = () => {
  try {
    const raw = localStorage.getItem('user')
    if (raw) return JSON.parse(raw)
  } catch (e) {}
  return { name_frst: 'Sergio', apellido_pat: 'Gajardo', role: 'Consultor Operacional' }
}

const userName = computed(() => {
  const u = getLoggedUser()
  if (u.name_frst || u.apellido_pat) {
    return `${u.name_frst ?? ''} ${u.apellido_pat ?? ''}`.trim()
  }
  return u.name || 'Sergio Gajardo'
})

const userInitials = computed(() => {
  const u = getLoggedUser()
  const first = u.name_frst || u.name || ''
  const last = u.apellido_pat || ''
  if (first && last) {
    return (first.charAt(0) + last.charAt(0)).toUpperCase()
  }
  if (first) {
    return first.substring(0, 2).toUpperCase()
  }
  return 'SG'
})

const userRole = computed(() => {
  const u = getLoggedUser()
  return u.role || 'Consultor'
})
</script>

<style>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>
