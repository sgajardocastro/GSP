<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
    <div class="bg-[#0b0f19] border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
      <!-- Header (Sticky) -->
      <div class="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-black/40 shrink-0">
        <h3 class="text-base font-black text-amber-400 uppercase tracking-wider">Nuevo Cliente B2B Rápido</h3>
        <button @click="$emit('close')" class="text-slate-400 hover:text-white transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <!-- Body (Scrollable) -->
      <div class="p-6 space-y-4 overflow-y-auto flex-1 text-left">
        <div>
          <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">RUT Empresa <span class="text-red-400">*</span></label>
          <input type="text" v-model="form.rut_empresa" placeholder="76.000.000-K" class="w-full bg-black/50 border border-white/15 rounded-xl px-3.5 py-2 text-xs font-bold text-white placeholder:text-slate-500 focus:border-amber-400 outline-none transition-colors uppercase tracking-wider" />
        </div>
        
        <div>
          <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Razón Social <span class="text-red-400">*</span></label>
          <input type="text" v-model="form.razon_social" placeholder="Ej: Constructora ABC SpA" class="w-full bg-black/50 border border-white/15 rounded-xl px-3.5 py-2 text-xs font-bold text-white placeholder:text-slate-500 focus:border-amber-400 outline-none transition-colors" />
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Giro Comercial</label>
          <input type="text" v-model="form.giro" placeholder="Construcción civil..." class="w-full bg-black/50 border border-white/15 rounded-xl px-3.5 py-2 text-xs font-bold text-white placeholder:text-slate-500 focus:border-amber-400 outline-none transition-colors" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Dirección Comercial <span class="text-red-400">*</span></label>
            <input type="text" v-model="form.direccion" placeholder="Ej: Av. Vitacura 1234" class="w-full bg-black/50 border border-white/15 rounded-xl px-3.5 py-2 text-xs font-bold text-white placeholder:text-slate-500 focus:border-amber-400 outline-none transition-colors" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Teléfono</label>
            <input type="text" v-model="form.fono_contacto" placeholder="Ej: +569..." class="w-full bg-black/50 border border-white/15 rounded-xl px-3.5 py-2 text-xs font-bold text-white placeholder:text-slate-500 focus:border-amber-400 outline-none transition-colors" />
          </div>
        </div>

        <div class="border-t border-white/10 pt-3 mt-1">
          <span class="text-[11px] font-black text-amber-400 uppercase tracking-widest block mb-2">Datos de Facturación</span>
          <div class="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Región de Facturación <span class="text-red-400">*</span></label>
              <input type="text" v-model="form.region_facturacion" placeholder="Ej: Metropolitana" class="w-full bg-black/50 border border-white/15 rounded-xl px-3.5 py-2 text-xs font-bold text-white placeholder:text-slate-500 focus:border-amber-400 outline-none transition-colors" />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Ciudad / Comuna <span class="text-red-400">*</span></label>
              <input type="text" v-model="form.comuna_facturacion" placeholder="Ej: Las Condes" class="w-full bg-black/50 border border-white/15 rounded-xl px-3.5 py-2 text-xs font-bold text-white placeholder:text-slate-500 focus:border-amber-400 outline-none transition-colors" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Dirección de Facturación <span class="text-red-400">*</span></label>
            <input type="text" v-model="form.direccion_facturacion" placeholder="Ej: Av. Andrés Bello 456, Of 12" class="w-full bg-black/50 border border-white/15 rounded-xl px-3.5 py-2 text-xs font-bold text-white placeholder:text-slate-500 focus:border-amber-400 outline-none transition-colors" />
          </div>
        </div>

        <div class="border-t border-white/10 pt-3 mt-1">
          <div class="flex justify-between items-center mb-2">
            <span class="text-[11px] font-black text-amber-400 uppercase tracking-widest block">Puntos de Contacto</span>
            <button type="button" @click="agregarContacto" class="px-2.5 py-1 bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-white rounded-lg text-xs font-bold transition-all border border-amber-500/30">+ Añadir Contacto</button>
          </div>
          <div v-if="!form.json_field.puntos_contacto || form.json_field.puntos_contacto.length === 0" class="text-xs text-slate-500 italic mb-2">
            Sin contactos registrados.
          </div>
          <div v-for="(contacto, index) in form.json_field.puntos_contacto" :key="index" class="bg-white/5 border border-white/10 p-3 rounded-xl mb-2 relative">
            <button @click="eliminarContacto(index)" class="absolute top-2 right-2 text-red-400 hover:text-red-300 p-1" title="Eliminar contacto">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <div class="grid grid-cols-2 gap-3 mb-2 pr-6">
              <div>
                <label class="block text-[10px] font-bold text-slate-400 uppercase">Nombre</label>
                <input type="text" v-model="contacto.nombre" class="w-full bg-black/50 border border-white/15 rounded-lg px-2.5 py-1 text-xs text-white placeholder:text-slate-500 focus:border-amber-400 outline-none" />
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-400 uppercase">Correo</label>
                <input type="email" v-model="contacto.correo" class="w-full bg-black/50 border border-white/15 rounded-lg px-2.5 py-1 text-xs text-white placeholder:text-slate-500 focus:border-amber-400 outline-none" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3 pr-6">
              <div>
                <label class="block text-[10px] font-bold text-slate-400 uppercase">Teléfono</label>
                <input type="text" v-model="contacto.telefono" class="w-full bg-black/50 border border-white/15 rounded-lg px-2.5 py-1 text-xs text-white placeholder:text-slate-500 focus:border-amber-400 outline-none" />
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-400 uppercase">Observaciones</label>
                <input type="text" v-model="contacto.observaciones" class="w-full bg-black/50 border border-white/15 rounded-lg px-2.5 py-1 text-xs text-white placeholder:text-slate-500 focus:border-amber-400 outline-none" />
              </div>
            </div>
          </div>
        </div>
        
        <p class="text-[10px] text-slate-400 italic mt-2">
          Este cliente será creado con <span class="font-mono text-amber-400">flag_externo = true</span> en la tabla maestra de empresas.
        </p>
      </div>

      <!-- Footer (Sticky) -->
      <div class="px-6 py-4 border-t border-white/10 bg-black/40 flex justify-end gap-3 shrink-0">
        <button @click="$emit('close')" class="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white transition-colors">
          Cancelar
        </button>
        <button @click="guardarCliente" :disabled="guardando" class="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center border border-amber-400/40">
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
  flag_externo: true,
  json_field: {
    puntos_contacto: []
  }
})

onMounted(() => {
  if (props.clienteAEditar) {
    form.value = { ...form.value, ...props.clienteAEditar }
    if (!form.value.json_field) {
      form.value.json_field = { puntos_contacto: [] }
    } else if (!form.value.json_field.puntos_contacto) {
      form.value.json_field.puntos_contacto = []
    }
  }
})

const guardando = ref(false)

const agregarContacto = () => {
  form.value.json_field.puntos_contacto.push({ nombre: '', correo: '', telefono: '', observaciones: '' })
}

const eliminarContacto = (index) => {
  form.value.json_field.puntos_contacto.splice(index, 1)
}

const guardarCliente = async () => {
  if (!form.value.rut_empresa || !form.value.razon_social || !form.value.direccion || !form.value.region_facturacion || !form.value.comuna_facturacion) {
    alert('RUT, Razón Social, Dirección Comercial, Región y Ciudad/Comuna son obligatorios.')
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
