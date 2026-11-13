<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" @click="cerrar"></div>

      <!-- Modal Content (Exacto Terracon Logic) -->
      <div class="relative w-full max-w-5xl bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        <!-- Header -->
        <div class="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div>
            <h3 class="text-xl font-bold text-white">Configuración de Roles y Permisos RBAC — GSP</h3>
            <p class="text-xs text-muted-foreground">
              Editando permisos para <span class="text-emerald-500 font-bold uppercase">{{ userLabel }}</span>
              <span v-if="usuario?.email" class="text-zinc-400 font-mono ml-2">({{ usuario.email }})</span>
            </p>
          </div>
          <button @click="cerrar" class="p-2 rounded-xl hover:bg-white/10 text-muted-foreground transition-all">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Body / Matriz de Roles GSP -->
        <div class="flex-1 overflow-auto p-5 scroll-smooth space-y-4">
          <RbacMatrixTable
            v-model="selectedCodesList"
            :roles-catalog="rolesCatalog"
            :permissions="permissions"
          />
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-white/10 bg-white/5 flex items-center justify-between">
          <p class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Roles seleccionados: <span class="text-emerald-500 ml-1">{{ tempCount }}</span>
          </p>
          <div class="flex gap-3">
            <button @click="cerrar" class="px-4 py-2 text-xs font-bold text-white/70 hover:text-white transition-all uppercase tracking-widest">Cancelar</button>
            <button @click="guardar" class="px-6 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center gap-2">
              <Check class="w-4 h-4" /> Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { X, Check } from 'lucide-vue-next'
import RbacMatrixTable from './RbacMatrixTable.vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  usuario: { type: Object, default: null },
  rolesCodes: { type: Array, default: () => [] },
  rolesCatalog: { type: Array, default: () => [] },
  permissions: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:show', 'guardar'])

const selectedCodesList = ref([])

watch(() => props.show, (val) => {
  if (val) {
    selectedCodesList.value = (props.rolesCodes || []).map(c => String(c || '').trim().toUpperCase()).filter(Boolean)
  }
})

const userLabel = computed(() => {
  const u = props.usuario || {}
  return u.nombre_user || `${u.name_frst || ''} ${u.apellido_pat || ''}`.trim() || 'Usuario'
})

const tempCount = computed(() => selectedCodesList.value.length)

function cerrar() { emit('update:show', false) }

function guardar() {
  emit('guardar', { 
    id_user: props.usuario.id_user, 
    rolesCodes: [...selectedCodesList.value] 
  })
  cerrar()
}
</script>
