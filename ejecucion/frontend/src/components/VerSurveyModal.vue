<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 p-2 md:p-6 backdrop-blur-sm isolation-auto"
    style="z-index: 99999 !important;"
    @click.self="cerrar"
  >
    <div class="relative w-full max-w-7xl h-[95vh] overflow-hidden rounded-[2rem] border border-white/10 bg-[#101114] shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
      
      <!-- HEADER -->
      <header class="flex items-center justify-between border-b border-white/10 bg-zinc-900/50 px-6 py-4 shrink-0">
        <div class="flex items-center gap-4">
          <div class="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Eye class="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h2 class="text-lg font-black text-white uppercase tracking-tight">Visor de Inspección Web</h2>
            <p class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">ID Encuesta: #{{ idSurvey }}</p>
          </div>
        </div>
        
        <button type="button" class="icon-close group" title="Cerrar" @click="cerrar">
          <X class="h-6 w-6 text-white/50 group-hover:text-white transition-colors" />
        </button>
      </header>

      <!-- BODY (IFRAME) -->
      <div class="flex-1 w-full bg-zinc-950 overflow-hidden relative rounded-b-[2rem]">
        <div v-if="loading" class="absolute inset-0 flex flex-col items-center justify-center bg-[#101114] z-10 space-y-4">
          <div class="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
          <p class="text-[11px] font-black uppercase tracking-widest text-amber-500/70 animate-pulse">Cargando reporte...</p>
        </div>
        
        <iframe
          v-if="idSurvey"
          :src="iframeUrl"
          class="w-full h-full border-none bg-white"
          @load="onIframeLoad"
        ></iframe>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Eye, X } from 'lucide-vue-next'

const router = useRouter()

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  idSurvey: {
    type: [String, Number],
    default: null
  }
})

const emit = defineEmits(['update:modelValue'])

const loading = ref(true)

const iframeUrl = computed(() => {
  // Resolvemos la ruta usando Vue Router para que respete el BASE_URL y el modo history
  const route = router.resolve({
    path: '/versurveyprint',
    query: { idInspeccion: props.idSurvey, modal: 'true' }
  })
  // Retornamos la URL completa basada en el origin actual + el href resuelto por el router
  return window.location.origin + route.href
})

function cerrar() {
  emit('update:modelValue', false)
  loading.value = true
}

function onIframeLoad() {
  loading.value = false
}
</script>

<style scoped>
.icon-close {
  display: inline-flex;
  height: 40px;
  width: 40px;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
}

.icon-close:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.5);
  transform: rotate(90deg);
}
</style>
