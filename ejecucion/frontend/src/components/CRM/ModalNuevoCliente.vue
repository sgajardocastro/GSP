<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
    <div class="bg-slate-900 border border-white/10 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-black/20">
        <h3 class="text-lg font-bold text-amber-500">Nuevo Cliente B2B Rápido</h3>
        <button @click="$emit('close')" class="text-slate-400 hover:text-white transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <!-- Body -->
      <div class="p-6 space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1">RUT Empresa <span class="text-red-500">*</span></label>
          <input type="text" v-model="form.rut_empresa" placeholder="76.000.000-K" class="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none transition-colors" />
        </div>
        
        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1">Razón Social <span class="text-red-500">*</span></label>
          <input type="text" v-model="form.razon_social" placeholder="Ej: Constructora ABC SpA" class="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none transition-colors" />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1">Giro Comercial</label>
          <input type="text" v-model="form.giro" placeholder="Construcción civil..." class="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none transition-colors" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1">Dirección Comercial</label>
            <input type="text" v-model="form.direccion" placeholder="Ej: Av. Vitacura 1234" class="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none transition-colors" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1">Teléfono</label>
            <input type="text" v-model="form.fono_contacto" placeholder="Ej: +569..." class="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none transition-colors" />
          </div>
        </div>

        <div class="border-t border-white/5 pt-3 mt-1">
          <span class="text-[11px] font-bold text-amber-500 uppercase tracking-wider block mb-2">Datos de Facturación</span>
          <div class="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label class="block text-xs font-semibold text-slate-400 mb-1">Región de Facturación</label>
              <input type="text" v-model="form.region_facturacion" placeholder="Ej: Metropolitana" class="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none transition-colors" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-400 mb-1">Ciudad / Comuna</label>
              <input type="text" v-model="form.comuna_facturacion" placeholder="Ej: Las Condes" class="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none transition-colors" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1">Dirección de Facturación</label>
            <input type="text" v-model="form.direccion_facturacion" placeholder="Ej: Av. Andrés Bello 456, Of 12" class="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none transition-colors" />
          </div>
        </div>
        
        <p class="text-[10px] text-slate-500 italic mt-2">
          Este cliente será creado con `flag_externo = true` en la tabla maestra de empresas.
        </p>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-white/10 bg-black/20 flex justify-end gap-3">
        <button @click="$emit('close')" class="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors">
          Cancelar
        </button>
        <button @click="guardarCliente" :disabled="guardando" class="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg text-sm font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
          <span v-if="!guardando">{{ clienteAEditar ? 'Guardar Cambios' : 'Registrar Cliente' }}</span>
          <span v-else>Guardando...</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import apiAxios from '../../services/api'

const props = defineProps({
  clienteAEditar: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'cliente-creado'])

const form = ref({
  rut_empresa: '',
  razon_social: '',
  giro: '',
  direccion: '',
  fono_contacto: '',
  region_facturacion: '',
  comuna_facturacion: '',
  direccion_facturacion: '',
  flag_externo: true
})

onMounted(() => {
  if (props.clienteAEditar) {
    form.value = { ...form.value, ...props.clienteAEditar }
  }
})

const guardando = ref(false)

const guardarCliente = async () => {
  if (!form.value.rut_empresa || !form.value.razon_social) {
    alert('RUT y Razón Social son obligatorios.')
    return
  }

  try {
    guardando.value = true
    const token = localStorage.getItem('token') || ''
    
    if (props.clienteAEditar && props.clienteAEditar.id_empresa) {
      const { data } = await apiAxios.put(`/empresas/${props.clienteAEditar.id_empresa}`, form.value, {
        headers: { Authorization: `Bearer ${token}` }
      })
      emit('cliente-creado', data)
    } else {
      const { data } = await apiAxios.post('/empresas', form.value, {
        headers: { Authorization: `Bearer ${token}` }
      })
      emit('cliente-creado', data)
    }
  } catch (error) {
    console.error('Error guardando cliente:', error)
    alert('No se pudo registrar/actualizar el cliente.')
  } finally {
    guardando.value = false
  }
}
</script>
