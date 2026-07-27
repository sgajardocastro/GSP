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
            <h3 class="text-xl font-bold text-white">Configuración de Acceso RBAC</h3>
            <p class="text-xs text-muted-foreground">
              Editando permisos para <span class="text-emerald-500 font-bold uppercase">{{ userLabel }}</span>
            </p>
          </div>
          <button @click="cerrar" class="p-2 rounded-xl hover:bg-white/10 text-muted-foreground transition-all">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Body / Matrix (Funcionalidad Espejo) -->
        <div class="flex-1 overflow-auto p-6 scroll-smooth">
          <div class="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl mb-6 flex gap-3">
            <Info class="w-5 h-5 text-blue-400 shrink-0" />
            <p class="text-[11px] text-blue-200 leading-relaxed">
              <span class="font-bold text-white uppercase block mb-1">Sistema RBAC Transmac:</span>
              Seleccione la intersección entre Cliente y Función. Esto generará automáticamente el código de rol (ej. <code class="bg-black/30 px-1 rounded text-emerald-400">TMAC_PROG</code>) en la base de datos.
            </p>
          </div>

          <!-- Matrix Table -->
          <div class="border border-white/10 rounded-2xl overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr class="bg-white/5 border-b border-white/10">
                    <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-r border-white/5 sticky left-0 bg-zinc-900 z-10 w-[260px]">
                      Clientes (Filas)
                    </th>
                    <th v-for="fn in functionsList" :key="fn.code" class="px-4 py-4 text-center border-r border-white/5 last:border-r-0">
                      <p class="text-[10px] font-bold text-white leading-none mb-1">{{ fn.name }}</p>
                      <span class="text-[8px] font-black text-muted-foreground opacity-50 uppercase tracking-tighter">{{ fn.code }}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="mod in modulesList" :key="mod.code" class="border-b border-white/5 last:border-b-0 hover:bg-white/[0.02] transition-colors">
                    <td class="px-6 py-4 border-r border-white/5 sticky left-0 bg-zinc-900 z-10">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                           <Layers class="w-4 h-4" />
                        </div>
                        <div>
                          <p class="text-xs font-bold text-white">{{ mod.name }}</p>
                          <p class="text-[8px] font-black text-muted-foreground uppercase opacity-50">{{ mod.code }}</p>
                        </div>
                      </div>
                    </td>
                    <td v-for="fn in functionsList" :key="fn.code" class="px-4 py-4 text-center border-r border-white/5 last:border-r-0">
                      <div class="flex justify-center">
                        <label class="relative flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            :checked="hasPermission(mod.code, fn.code)" 
                            @change="togglePermission(mod.code, fn.code)"
                            class="sr-only peer"
                          >
                          <div class="w-5 h-5 bg-white/5 border border-white/10 rounded-md peer-checked:bg-emerald-500 peer-checked:border-emerald-400 transition-all flex items-center justify-center">
                            <Check v-if="hasPermission(mod.code, fn.code)" class="w-3 h-3 text-white" />
                          </div>
                        </label>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
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
import { X, Info, Layers, Check } from 'lucide-vue-next'

const props = defineProps({
  show: { type: Boolean, default: false },
  usuario: { type: Object, default: null },
  rolesCodes: { type: Array, default: () => [] },
  rolesCatalog: { type: Array, default: () => [] },
  permissions: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:show', 'guardar'])

const tempRoles = ref(new Set())

watch(() => props.show, (val) => {
  if (val) tempRoles.value = new Set(props.rolesCodes.map(c => c.toUpperCase()))
})

const userLabel = computed(() => {
  const u = props.usuario || {}
  return u.nombre_user || `${u.name_frst} ${u.apellido_pat}` || 'Usuario'
})

const modulesList = [
  { code: 'TMAC', name: 'Transmac' },
  { code: 'CDLC_DMH', name: 'Codelco DMH' },
  { code: 'CDLC_DCH', name: 'Codelco División Chuqui' },
  { code: 'CDLC_SPOT', name: 'Codelco Spot' },
  { code: 'AMSA_MLP', name: 'Minera Los Pelambres (AMSA MLP)' }
]

const functionsList = [
  { code: 'ADMIN', name: 'Admin' },
  { code: 'PROG', name: 'Programador' },
  { code: 'EJEC', name: 'Ejecutor' },
  { code: 'APROB', name: 'Aprobador' }
]

const tempCount = computed(() => tempRoles.value.size)

function makeCode(mod, fn) {
  return fn === 'ADMIN' ? 'ADMIN' : `${mod}_${fn}`
}

function hasPermission(mod, fn) {
  return tempRoles.value.has(makeCode(mod, fn))
}

function togglePermission(mod, fn) {
  const code = makeCode(mod, fn)
  const next = new Set(tempRoles.value)
  if (next.has(code)) {
    next.delete(code)
  } else {
    next.add(code)
  }
  tempRoles.value = next
}

function cerrar() { emit('update:show', false) }

function guardar() {
  emit('guardar', { 
    id_user: props.usuario.id_user, 
    rolesCodes: Array.from(tempRoles.value) 
  })
  cerrar()
}
</script>
