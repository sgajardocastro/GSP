<template>
  <div>
    <!-- Botón que abre el mantenedor -->
    <button 
      @click="abrirDialog"
      class="px-4 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-2"
    >
      <Users class="w-4 h-4" />
      Integrantes
    </button>

    <!-- Dialog Mantenedor de Integrantes (Custom Modal) -->
    <Transition name="fade">
      <div v-if="open" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div class="glass-card w-full max-w-3xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          
          <!-- Header -->
          <div class="px-6 py-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <Users class="w-5 h-5 text-emerald-500" />
              <h2 class="text-xl font-bold text-white tracking-tight">
                Integrantes de <span class="text-emerald-500">{{ nombreEquipo || ('Equipo #' + idEquipo) }}</span>
              </h2>
            </div>
            <button @click="open = false" class="p-2 rounded-xl hover:bg-white/10 text-muted-foreground hover:text-white transition-all">
              <X class="w-5 h-5" />
            </button>
          </div>

          <div class="p-6 overflow-y-auto space-y-6">
            <!-- Formulario de Edición/Alta -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Nombre del equipo</label>
                <input 
                  v-model="localNombre"
                  type="text"
                  class="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Descripción</label>
                <textarea 
                  v-model="localDescripcion"
                  rows="1"
                  class="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                ></textarea>
              </div>
            </div>

            <!-- Selector de Miembros (Multi-select simplificado) -->
            <div class="space-y-3">
              <label class="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Agregar Integrantes</label>
              <div class="flex flex-wrap gap-2 p-4 bg-white/5 border border-white/10 rounded-2xl min-h-[100px]">
                <div v-for="id in miembrosSeleccionados" :key="id" class="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 rounded-full text-xs font-bold">
                  {{ getUserName(id) }}
                  <button @click="toggleMiembro(id)" class="hover:text-white transition-colors"><X class="w-3 h-3" /></button>
                </div>
                <div v-if="miembrosSeleccionados.length === 0" class="text-xs text-muted-foreground italic self-center mx-auto">Seleccione miembros de la lista inferior...</div>
              </div>
              
              <div class="relative">
                <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  v-model="qMiembro" 
                  type="text" 
                  placeholder="Filtrar usuarios por nombre, rut o email..."
                  class="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
              </div>

              <div class="max-h-40 overflow-y-auto border border-white/10 rounded-xl divide-y divide-white/5">
                <div 
                  v-for="u in usuariosNoSeleccionados" 
                  :key="u.id_user"
                  @click="toggleMiembro(u.id_user)"
                  class="px-4 py-2 text-xs text-white/70 hover:bg-white/10 cursor-pointer transition-all flex justify-between items-center"
                >
                  <span>{{ u.nombre_user }} <span class="text-[9px] text-muted-foreground ml-2">({{ u.email_user }})</span></span>
                  <Plus class="w-3 h-3 text-emerald-500" />
                </div>
              </div>
            </div>

            <div class="flex justify-end pt-4">
              <button 
                @click="guardarIntegrantes"
                :disabled="guardando"
                class="px-6 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold uppercase tracking-widest flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.4)] disabled:opacity-50"
              >
                <Save class="w-4 h-4" />
                {{ guardando ? 'Guardando...' : 'Guardar Integrantes' }}
              </button>
            </div>

            <div class="border-t border-white/10 pt-6">
              <h3 class="text-xs font-black uppercase text-white/50 tracking-widest mb-4">Integrantes Actuales</h3>
              <div class="overflow-hidden border border-white/10 rounded-2xl">
                <table class="w-full text-left">
                  <thead class="bg-white/5 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                    <tr>
                      <th class="px-4 py-3">Nombre</th>
                      <th class="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-white/5">
                    <tr v-for="i in integrantes" :key="i.id_user" class="text-xs text-white/80 hover:bg-white/[0.02]">
                      <td class="px-4 py-3 font-bold">{{ i.nombre_user }}</td>
                      <td class="px-4 py-3 text-right">
                        <button @click="eliminarIntegrante(i)" class="p-2 text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 class="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Users, X, Plus, Save, Trash2, Search } from 'lucide-vue-next'
import apiAxios from '@/services/api'

const props = defineProps({
  idEquipo: { type: [Number, String], required: true },
  nombreEquipo: { type: String, default: '' },
  descripcionEquipo: { type: String, default: '' },
  usuarios: { type: Array, default: () => [] }
})

const emit = defineEmits(['actualizado'])

const open = ref(false)
const integrantes = ref([])
const miembrosSeleccionados = ref([])
const localNombre = ref('')
const localDescripcion = ref('')
const guardando = ref(false)
const qMiembro = ref('')

const usuariosNoSeleccionados = computed(() => {
  const selIds = new Set(miembrosSeleccionados.value)
  const q = qMiembro.value.toLowerCase()
  return props.usuarios.filter(u => {
    if (selIds.has(Number(u.id_user))) return false
    const match = `${u.nombre_user} ${u.email_user} ${u.rut}`.toLowerCase()
    return match.includes(q)
  }).slice(0, 50) // Limit to 50 for performance
})

function getUserName(id) {
  return props.usuarios.find(u => Number(u.id_user) === Number(id))?.nombre_user || `ID: ${id}`
}

function toggleMiembro(id) {
  const nid = Number(id)
  const idx = miembrosSeleccionados.value.indexOf(nid)
  if (idx > -1) miembrosSeleccionados.value.splice(idx, 1)
  else miembrosSeleccionados.value.push(nid)
}

async function abrirDialog() {
  localNombre.value = props.nombreEquipo
  localDescripcion.value = props.descripcionEquipo
  open.value = true
  await cargarIntegrantes()
}

async function cargarIntegrantes() {
  try {
    const { data } = await apiAxios.get('/servicio/leanglobal/obtenerEquiposProyectosMiembros?id_equipo_proyecto=' + props.idEquipo)
    const lista = Array.isArray(data) ? data : (Array.isArray(data?.datos) ? data.datos : [])
    
    // Solo activos
    const activos = lista.filter(i => i.activo === true || i.activo === 1 || i.activo === 't' || i.activo === 'true')
    
    integrantes.value = activos.map(i => ({
      id_user: Number(i.id_user),
      nombre_user: i.nombre_user,
      email_user: i.email_user
    }))
    
    miembrosSeleccionados.value = integrantes.value.map(i => i.id_user)
  } catch (err) {
    console.error('Error cargarIntegrantes', err)
  }
}

async function guardarIntegrantes() {
  guardando.value = true
  try {
    await apiAxios.put('/equipos/updEquipos', {
      id_equipo_proyecto: Number(props.idEquipo),
      nombre_equipo: localNombre.value?.trim() || props.nombreEquipo,
      descripcion_equipo: localDescripcion.value?.trim() || null,
      ids_usuarios: miembrosSeleccionados.value.map(Number)
    })
    await cargarIntegrantes()
    emit('actualizado')
  } catch (err) {
    console.error('Error guardarIntegrantes', err)
  } finally {
    guardando.value = false
  }
}

async function eliminarIntegrante(item) {
  if (!confirm(`¿Quitar a ${item.nombre_user} del equipo?`)) return
  try {
    await apiAxios.put('/equipos/delEquiposMiembro', {
      id_equipo_proyecto: Number(props.idEquipo),
      id_user: item.id_user
    })
    await cargarIntegrantes()
    emit('actualizado')
  } catch (err) {
    console.error('Error eliminarIntegrante', err)
  }
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
