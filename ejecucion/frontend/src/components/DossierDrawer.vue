<template>
  <div v-if="isOpen" class="fixed inset-0 z-[100] flex justify-end bg-black/80 backdrop-blur-sm">
    <div class="bg-slate-950 w-full max-w-2xl h-full border-l border-white/10 shadow-2xl flex flex-col relative animate-slide-in text-left">
      <button @click="close" class="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>

      <!-- Header -->
      <div class="p-6 border-b border-white/10 bg-[#0a0f1e]/40">
        <h2 class="text-xl font-black text-white uppercase tracking-wider">Gestión de Dossier de Acreditación</h2>
        <p class="text-sm text-slate-400 mt-1">Proyecto: #OP-2034 - Mantención Grúa 50T</p>
        <p class="text-sm text-slate-400">Cliente: Minera Los Pelambres</p>
        
        <div class="mt-4">
          <div class="flex justify-between items-center mb-1">
            <span class="text-xs text-slate-400 font-bold">Resumen: 8/10 Documentos Disponibles</span>
            <span class="text-xs font-bold text-white">80%</span>
          </div>
          <div class="w-full bg-white/5 rounded-full h-2">
            <div class="bg-blue-500 h-2 rounded-full" style="width: 80%"></div>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6 space-y-6">
        <!-- Empresa -->
        <div class="border border-white/10 rounded-xl overflow-hidden">
          <button class="w-full bg-[#0f1629] p-4 flex justify-between items-center hover:bg-white/5 transition-colors">
            <span class="font-bold text-white uppercase text-sm">EMPRESA</span>
            <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
          </button>
          <div class="bg-slate-900/50 p-4 space-y-3">
            <div class="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
              <span class="text-xs text-white">Cert. Laboral (F30)</span>
              <div class="flex items-center gap-3">
                <span class="text-[10px] font-bold px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">VIGENTE / OK</span>
                <button class="text-xs text-blue-400 hover:text-blue-300 font-bold" @click="verDocumento">Ver</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Personal -->
        <div class="border border-white/10 rounded-xl overflow-hidden">
          <button class="w-full bg-[#0f1629] p-4 flex justify-between items-center hover:bg-white/5 transition-colors">
            <span class="font-bold text-white uppercase text-sm">PERSONAL ASIGNADO</span>
            <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
          </button>
          <div class="bg-slate-900/50 p-4 space-y-4">
            <div>
              <h4 class="text-xs font-bold text-slate-300 mb-2">Juan Pérez - Operador</h4>
              <div class="space-y-2">
                <div class="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                  <span class="text-xs text-white">Examen de Altura</span>
                  <div class="flex items-center gap-3">
                    <span class="text-[10px] font-bold px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">VIGENTE / OK</span>
                    <button class="text-xs text-blue-400 hover:text-blue-300 font-bold">Ver</button>
                  </div>
                </div>
                <div class="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                  <span class="text-xs text-white">Licencia Clase D</span>
                  <div class="flex items-center gap-3">
                    <span class="text-[10px] font-bold px-2 py-1 rounded bg-slate-500/20 text-slate-400 border border-slate-500/30">PENDIENTE</span>
                    <button class="text-xs text-blue-400 hover:text-blue-300 font-bold" @click="abrirSubida">Subir</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Equipos -->
        <div class="border border-white/10 rounded-xl overflow-hidden">
          <button class="w-full bg-[#0f1629] p-4 flex justify-between items-center hover:bg-white/5 transition-colors">
            <span class="font-bold text-white uppercase text-sm">EQUIPOS ASIGNADOS</span>
            <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
          </button>
          <div class="bg-slate-900/50 p-4 space-y-4">
            <div>
              <h4 class="text-xs font-bold text-slate-300 mb-2">Grúa Terex RT100 - PPU: ABCD-12</h4>
              <div class="space-y-2">
                <div class="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                  <span class="text-xs text-white">Revisión Técnica</span>
                  <div class="flex items-center gap-3">
                    <span class="text-[10px] font-bold px-2 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/30">VENCIDO (12/05/2026)</span>
                    <button class="text-xs text-red-400 hover:text-red-300 font-bold" @click="abrirSubida">Renovar</button>
                  </div>
                </div>
                <div class="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                  <span class="text-xs text-white">Seguros</span>
                  <div class="flex items-center gap-3">
                    <span class="text-[10px] font-bold px-2 py-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30" title="Alerta Preventiva">POR VENCER (10 días)</span>
                    <button class="text-xs text-blue-400 hover:text-blue-300 font-bold">Ver</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Historial -->
        <div class="border border-white/10 rounded-xl overflow-hidden">
          <div class="bg-[#0f1629] p-4 border-b border-white/10">
            <h3 class="font-bold text-white uppercase text-sm flex items-center gap-2">
              <span>📜 Historial de Envíos del Dossier</span>
            </h3>
          </div>
          <div class="bg-slate-900/50 p-4 space-y-3">
            <div class="p-3 bg-white/5 rounded-lg border border-white/5">
              <div class="flex justify-between items-start mb-2">
                <div>
                  <span class="text-xs font-bold text-blue-400">Versión v1.0</span>
                  <p class="text-[10px] text-slate-400">Enviado: 2026-08-01 10:30</p>
                  <p class="text-[10px] text-slate-400">Por: Ejecutivo Comercial</p>
                </div>
                <button class="text-xs px-2 py-1 bg-white/10 rounded hover:bg-white/20 text-white transition-colors" @click="verCorreo">
                  Ver Correo 👁️
                </button>
              </div>
              <div class="text-[10px] text-slate-300">
                <span class="font-bold">Destinatarios:</span> cliente@minera.cl
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="p-6 border-t border-white/10 bg-[#0f1629]">
        <button 
          @click="despachar"
          disabled
          class="w-full py-3 rounded-lg font-bold text-sm bg-slate-700 text-slate-400 cursor-not-allowed transition-colors"
        >
          DESPACHAR DOSSIER AL CLIENTE
        </button>
        <p class="text-[10px] text-red-400 text-center mt-2">Existen documentos vencidos o pendientes que bloquean el despacho.</p>
      </div>

      <!-- Fake Modals for functionality -->
      <div v-if="showUploadModal" class="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-white/10 p-6 rounded-xl w-full max-w-sm">
          <h3 class="text-white font-bold mb-4">Subir Archivo</h3>
          <input type="file" class="text-sm text-slate-300 w-full mb-4" />
          <div class="flex gap-2 justify-end">
            <button class="text-xs px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600" @click="showUploadModal = false">Cancelar</button>
            <button class="text-xs px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500" @click="showUploadModal = false">Subir y Guardar</button>
          </div>
        </div>
      </div>
      
      <div v-if="showEmailModal" class="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
        <div class="bg-white p-0 rounded-xl w-full max-w-lg overflow-hidden flex flex-col h-[80vh]">
          <div class="bg-slate-900 p-3 flex justify-between items-center text-white">
            <h3 class="font-bold text-sm">Vista Previa del Correo</h3>
            <button @click="showEmailModal = false">X</button>
          </div>
          <div class="p-4 flex-1 overflow-y-auto">
            <div style="font-family: sans-serif; background-color: #f4f4f5; padding: 20px;">
              <div style="background-color: white; padding: 20px; border-radius: 8px;">
                <h2 style="color: #0f172a;">Dossier de Acreditación de Recursos</h2>
                <p>Estimados Cliente,</p>
                <p>Adjuntamos el detalle del personal y equipos acreditados...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  isOpen: Boolean,
  proyectoId: Number
})

const emit = defineEmits(['close'])

const showUploadModal = ref(false)
const showEmailModal = ref(false)

const close = () => {
  emit('close')
}

const abrirSubida = () => {
  showUploadModal.value = true
}

const verDocumento = () => {
  alert('Abre URL: /api/archivo/ver/:id')
}

const verCorreo = () => {
  showEmailModal.value = true
}

const despachar = async () => {
  try {
    // await apiAxios.post(`/proyectos/${props.proyectoId}/dossier/enviar`)
    alert('Dossier despachado exitosamente')
    close()
  } catch(e) {
    console.error(e)
  }
}
</script>

<style scoped>
.animate-slide-in {
  animation: slideIn 0.3s ease-out forwards;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}
</style>
