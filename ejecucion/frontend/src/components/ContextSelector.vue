<template>
  <div class="relative group" v-click-outside="() => open = false">
    <!-- Trigger -->
    <button 
      @click="open = !open"
      class="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-emerald-500/30 transition-all group/btn"
    >
      <div v-if="!selectedClient" class="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-500 group-hover/btn:scale-110 transition-transform">
        <Globe class="w-4 h-4" />
      </div>
      <div v-else class="p-1.5 rounded-lg bg-amber-500/20 text-amber-500 group-hover/btn:scale-110 transition-transform">
        <Building2 class="w-4 h-4" />
      </div>

      <div class="text-left">
        <p class="text-[9px] font-black uppercase tracking-widest text-muted-foreground leading-none">Contexto de Gestión</p>
        <p class="text-xs font-bold text-white mt-1">{{ selectedClient ? selectedClient.name : 'VISTA GLOBAL TRANSMAC' }}</p>
      </div>

      <ChevronDown class="w-4 h-4 text-muted-foreground transition-transform ml-2" :class="{ 'rotate-180': open }" />
    </button>

    <!-- Dropdown -->
    <transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div 
        v-if="open" 
        class="absolute top-full left-0 mt-2 w-72 glass-card rounded-2xl border border-white/10 shadow-2xl p-2 z-50 overflow-hidden"
      >
        <div class="px-3 py-2 border-b border-white/5 mb-2">
          <span class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Seleccionar Mandante</span>
        </div>

        <button 
          @click="select(null)"
          class="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group/item mb-1"
          :class="[!selectedClient ? 'bg-emerald-500/20 border border-emerald-500/30' : 'hover:bg-white/5 border border-transparent']"
        >
          <div class="p-2 rounded-lg bg-emerald-500/20 text-emerald-500">
            <Globe class="w-4 h-4" />
          </div>
          <div>
            <p class="text-[10px] font-bold text-white uppercase tracking-tight">Ecosistema Global</p>
            <p class="text-[9px] text-muted-foreground uppercase">Concentrado General de Transmac</p>
          </div>
        </button>

        <div class="h-[1px] bg-white/5 my-2"></div>

        <button 
          v-for="client in clients" 
          :key="client.id"
          @click="select(client)"
          class="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group/item"
          :class="[selectedClient?.id === client.id ? 'bg-amber-500/20 border border-amber-500/30' : 'hover:bg-white/5 border border-transparent']"
        >
          <div class="p-2 rounded-lg bg-zinc-800 text-amber-500">
            <Building2 class="w-4 h-4" />
          </div>
          <div>
            <p class="text-[10px] font-bold text-white uppercase tracking-tight">{{ client.name }}</p>
            <p class="text-[9px] text-muted-foreground uppercase">{{ client.op }}</p>
          </div>
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useContext } from '@/composables/useContext'
import { Globe, Building2, ChevronDown } from 'lucide-vue-next'

const open = ref(false)
const { selectedClient, clients, setClient } = useContext()

function select(client) {
  setClient(client)
  open.value = false
}

// Simple click outside directive logic
const vClickOutside = {
  mounted(el, binding) {
    el.clickOutsideEvent = function(event) {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event)
      }
    }
    document.body.addEventListener('click', el.clickOutsideEvent)
  },
  unmounted(el) {
    document.body.removeEventListener('click', el.clickOutsideEvent)
  }
}
</script>
