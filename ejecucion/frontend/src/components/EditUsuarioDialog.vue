<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-zinc-950/90 backdrop-blur-sm" @click="cerrar"></div>

      <!-- Modal Content (Layout Split 2 Columnas GSP - Sin Scroll) -->
      <div class="relative w-[95vw] max-w-[1380px] bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        
        <!-- Header -->
        <div class="px-6 py-3.5 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-xl bg-emerald-500/20 text-emerald-500">
              <UserEdit class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-lg font-bold text-white leading-tight">Editar Perfil de Usuario</h3>
              <p v-if="localUser" class="text-[11px] text-zinc-400 font-mono">
                ID #{{ localUser.id_user }} — <span class="text-emerald-400 font-semibold">{{ localUser.email }}</span>
              </p>
            </div>
          </div>
          <button @click="cerrar" class="p-2 rounded-xl hover:bg-white/10 text-muted-foreground hover:text-white transition-all">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Body / Form Split: Izquierda (Atributos) | Derecha (Roles RBAC) - Sin Scrollbars -->
        <div class="p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          <!-- COLUMNA IZQUIERDA: ATRIBUTOS EDITABLES (4 COLS) -->
          <div class="lg:col-span-4 space-y-3.5">
            
            <!-- Bloque 1: Identificación y Contacto -->
            <div class="bg-white/[0.02] border border-white/5 p-3.5 rounded-2xl space-y-3">
              <div class="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 border-b border-white/5 pb-1.5">
                <span>Identificación & Contacto</span>
              </div>

              <div class="grid grid-cols-2 gap-2.5">
                <div class="space-y-1">
                  <label class="text-[10px] font-black uppercase text-muted-foreground ml-1">Email</label>
                  <input v-model="localUser.email" type="email" class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:ring-1 focus:ring-emerald-500 outline-none">
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-black uppercase text-muted-foreground ml-1">RUT</label>
                  <input v-model="localUser.rut" placeholder="12.345.678-k" class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:ring-1 focus:ring-emerald-500 outline-none font-mono">
                </div>
              </div>

              <div class="grid grid-cols-2 gap-2.5">
                <div class="space-y-1">
                  <label class="text-[10px] font-black uppercase text-muted-foreground ml-1">Primer Nombre</label>
                  <input v-model="localUser.name_frst" class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:ring-1 focus:ring-emerald-500 outline-none">
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-black uppercase text-muted-foreground ml-1">Segundo Nombre</label>
                  <input v-model="localUser.name_sec" class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:ring-1 focus:ring-emerald-500 outline-none">
                </div>
              </div>

              <div class="grid grid-cols-2 gap-2.5">
                <div class="space-y-1">
                  <label class="text-[10px] font-black uppercase text-muted-foreground ml-1">Apellido Paterno</label>
                  <input v-model="localUser.apellido_pat" class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:ring-1 focus:ring-emerald-500 outline-none">
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-black uppercase text-muted-foreground ml-1">Apellido Materno</label>
                  <input v-model="localUser.apellido_mat" class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:ring-1 focus:ring-emerald-500 outline-none">
                </div>
              </div>

              <div class="grid grid-cols-2 gap-2.5 items-center pt-1">
                <div class="space-y-1">
                  <label class="text-[10px] font-black uppercase text-muted-foreground ml-1">Móvil</label>
                  <input v-model="localUser.movil" class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:ring-1 focus:ring-emerald-500 outline-none font-mono">
                </div>
                <div class="flex items-center gap-3 pt-3">
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" v-model="localUser.activo" class="sr-only peer">
                    <div class="w-10 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                    <span class="ml-2.5 text-[10px] font-black uppercase text-white/70">Usuario Activo</span>
                  </label>
                </div>
              </div>
            </div>

            <!-- Bloque 2: Información RR.HH -->
            <div class="bg-white/[0.02] border border-white/5 p-3.5 rounded-2xl space-y-3">
              <h4 class="text-[10px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-1.5">
                <Building2 class="w-3.5 h-3.5" /> Información RR.HH
              </h4>
              
              <div class="space-y-2.5">
                <div class="space-y-1">
                  <label class="text-[10px] font-black uppercase text-muted-foreground ml-1">Cargo</label>
                  <div class="relative w-full">
                    <input 
                      v-model="jsonData.cargo" 
                      @focus="showCargosDropdown = true"
                      @blur="hideCargosDropdown"
                      placeholder="Seleccionar o escribir..." 
                      autocomplete="off"
                      class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 pr-8 text-xs text-white focus:ring-1 focus:ring-emerald-500 outline-none"
                    >
                    <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg class="w-3.5 h-3.5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                    <ul v-if="showCargosDropdown" class="absolute z-50 w-full mt-1 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl max-h-40 overflow-y-auto">
                      <template v-if="cargosList.length === 0">
                        <li class="px-4 py-3 text-xs text-white/50 italic text-center">
                          No hay cargos registrados. Escriba uno nuevo.
                        </li>
                      </template>
                      <template v-else-if="filteredCargos.length === 0">
                        <li class="px-4 py-2.5 text-xs text-emerald-400 italic font-semibold text-center bg-emerald-500/10">
                          + Se creará "{{ jsonData.cargo }}"
                        </li>
                      </template>
                      <template v-else>
                        <li 
                          v-for="c in filteredCargos" 
                          :key="c" 
                          @mousedown.prevent="selectCargo(c)" 
                          class="px-3.5 py-1.5 text-xs text-white hover:bg-emerald-500/20 cursor-pointer"
                        >
                          {{ c }}
                        </li>
                      </template>
                    </ul>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-2.5">
                  <div class="space-y-1">
                    <label class="text-[10px] font-black uppercase text-muted-foreground ml-1">Género</label>
                    <select v-model="jsonData.genero" class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:ring-1 focus:ring-emerald-500 outline-none">
                      <option value="H" class="bg-zinc-900 text-white">Hombre</option>
                      <option value="M" class="bg-zinc-900 text-white">Mujer</option>
                    </select>
                  </div>
                  <div class="space-y-1">
                    <label class="text-[10px] font-black uppercase text-muted-foreground ml-1">Fec. Nacimiento</label>
                    <input v-model="jsonData.fechaNacimiento" type="date" class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:ring-1 focus:ring-emerald-500 outline-none">
                  </div>
                </div>
              </div>
            </div>

            <!-- Bloque 3: Nómina y Proyectos -->
            <div class="bg-white/[0.02] border border-white/5 p-3.5 rounded-2xl space-y-2.5">
              <div class="flex justify-between items-center border-b border-white/5 pb-1.5">
                <h4 class="text-[10px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers class="w-3.5 h-3.5" /> Nómina y Proyectos
                </h4>
                <button @click="agregarNuevaPertenencia" class="px-2.5 py-1 bg-white/10 hover:bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase transition-all">+ Vincular</button>
              </div>
              
              <div v-if="pertenencias.length" class="border border-white/10 rounded-xl overflow-hidden bg-white/5 max-h-36 overflow-y-auto custom-scrollbar">
                <table class="w-full text-left text-xs">
                  <thead class="bg-white/5 text-[9px] font-black text-muted-foreground uppercase tracking-widest sticky top-0">
                    <tr>
                      <th class="px-3 py-1.5">Proyecto</th>
                      <th class="px-3 py-1.5">Equipo</th>
                      <th class="px-2 py-1.5 text-right"></th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-white/5 text-[11px]">
                    <tr v-for="(p, i) in pertenencias" :key="i" class="hover:bg-white/5">
                      <td class="px-3 py-1">
                        <select v-model="p.id_proyecto" class="w-full bg-transparent border-none text-[11px] text-white focus:ring-0 p-0">
                          <option v-for="pr in proyectos" :key="pr.id_proyecto" :value="pr.id_proyecto" class="bg-zinc-900 text-white">{{ pr.nombre_proyecto }}</option>
                        </select>
                      </td>
                      <td class="px-3 py-1">
                        <select v-model="p.id_equipo_proyecto" class="w-full bg-transparent border-none text-[11px] text-white focus:ring-0 p-0">
                          <option v-for="e in getEquiposDelProyecto(p.id_proyecto)" :key="e.id_equipo_proyecto" :value="e.id_equipo_proyecto" class="bg-zinc-900 text-white">{{ e.nombre_equipo }}</option>
                        </select>
                      </td>
                      <td class="px-2 py-1 text-right">
                        <button @click="pertenencias.splice(i, 1)" class="p-1 text-red-400 hover:text-red-300 hover:bg-white/10 rounded"><Trash2 class="w-3.5 h-3.5" /></button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p v-else class="text-[10px] text-zinc-500 italic py-1">Sin proyectos asignados.</p>
            </div>
          </div>

          <!-- COLUMNA DERECHA: MATRIZ RBAC GSP (8 COLS) -->
          <div class="lg:col-span-8 h-full">
            <RbacMatrixTable 
              v-model="selectedRolesCodes" 
              :roles-catalog="roles" 
              :permissions="permisos" 
            />
          </div>

        </div>

        <!-- Footer Actions -->
        <div class="px-6 py-3.5 border-t border-white/10 bg-white/5 flex items-center justify-end gap-3">
          <button @click="cerrar" class="px-4 py-2 text-xs font-black text-white/50 hover:text-white transition-all uppercase tracking-widest">Cancelar</button>
          <button @click="guardar" class="px-7 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center gap-2 transition-all">
            <Save class="w-4 h-4" /> Guardar Perfil
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import apiAxios from '@/services/api'
import RbacMatrixTable from './mantenedores/RbacMatrixTable.vue'
import { X, UserPlus as UserEdit, Building2, Layers, Trash2, Save } from 'lucide-vue-next'

const props = defineProps({
  show: { type: Boolean, default: false },
  usuario: { type: Object, default: null },
  roles: { type: Array, default: () => [] },
  permisos: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:show', 'guardar'])

const cargosList = ref([])
const showCargosDropdown = ref(false)

const filteredCargos = computed(() => {
  if (!jsonData.value.cargo) return cargosList.value
  const lower = jsonData.value.cargo.toLowerCase()
  return cargosList.value.filter(c => c.toLowerCase().includes(lower))
})

function selectCargo(c) {
  jsonData.value.cargo = c
  showCargosDropdown.value = false
}

function hideCargosDropdown() {
  // Pequeño timeout para permitir que el mousedown del li se dispare antes del blur
  setTimeout(() => { showCargosDropdown.value = false }, 150)
}

const localUser = ref(null)
const selectedRolesCodes = ref([])
const jsonData = ref({ cargo: null, genero: null, fechaNacimiento: null })
const pertenencias = ref([])
const proyectos = ref([])
const equipos = ref([])

function cerrar() { emit('update:show', false) }

async function cargarData() {
  const [{ data: prjs }, { data: eqs }, cargosRes] = await Promise.all([
    apiAxios.get('/servicio/leanglobal/obtenerProyectos'),
    apiAxios.get('/servicio/leanglobal/obtenerEquiposProyectos'),
    apiAxios.get('/servicio/leanglobal/obtenerCargosUnicos').catch(err => {
      console.warn("Fallo al obtener cargos:", err)
      return { data: [] } // El router de servicios devuelve el array directo o wrapped?
    })
  ])
  proyectos.value = prjs; equipos.value = eqs;
  
  // El backend con dbQuery() devuelve un array de filas directamente a veces, o envuelto en data.
  const extracted = cargosRes?.data?.data || cargosRes?.data || [];
  // Como agregamos id_empresa, cada row es { cargo: '...', id_empresa: '...' }
  // Necesitamos mapearlo a un array de strings.
  cargosList.value = Array.isArray(extracted) 
    ? extracted.map(row => typeof row === 'string' ? row : row.cargo).filter(Boolean)
    : [];
}

function getEquiposDelProyecto(idPrj) {
  return equipos.value.filter(e => Number(e.id_proyecto) === Number(idPrj))
}

function agregarNuevaPertenencia() { pertenencias.value.push({ id_proyecto: null, id_equipo_proyecto: null }) }

/* --- MAPS Y LOGICA DE ROLES GSP RBAC --- */
function getRoleCode(r) {
  const raw = r?.codi_rol ?? r?.codigo ?? r?.code ?? r?.name_rol ?? ''
  return String(raw).trim().toUpperCase()
}

watch(() => props.usuario, (val) => {
  if (val) {
    localUser.value = { ...val }
    try {
      const parsed = typeof val.json_data === 'string' ? JSON.parse(val.json_data) : val.json_data
      jsonData.value = { cargo: parsed?.cargo || null, genero: parsed?.genero || null, fechaNacimiento: parsed?.fechaNacimiento || null }
    } catch { jsonData.value = { cargo: null, genero: null, fechaNacimiento: null } }
    
    // Poblar roles seleccionados del usuario directamente desde el catálogo de roles
    const ids = val.rolesIds || []
    selectedRolesCodes.value = ids
      .map(id => {
        const r = props.roles.find(x => Number(x.id_rol) === Number(id))
        return r ? getRoleCode(r) : null
      })
      .filter(Boolean)

    // Poblar pertenencias de proyecto
    pertenencias.value = val.memberships ? JSON.parse(JSON.stringify(val.memberships)) : []
  }
}, { immediate: true })

function guardar() {
  const uid = Number(localUser.value.id_user)
  
  // Convertir los códigos seleccionados en la matriz RBAC GSP a IDs de roles reales
  const selectedCodes = selectedRolesCodes.value.map(c => String(c).trim().toUpperCase())
  const finalRoleIds = selectedCodes.map(code => {
    const r = props.roles.find(x => getRoleCode(x) === code)
    return r ? Number(r.id_rol) : null
  }).filter(Boolean)

  const cleanPertenencias = (pertenencias.value || [])
    .filter(p => p.id_proyecto && p.id_equipo_proyecto)
    .map(p => ({
      id_proyecto: Number(p.id_proyecto),
      id_equipo_proyecto: Number(p.id_equipo_proyecto)
    }))

  emit('guardar', { 
    ...localUser.value, 
    roles: finalRoleIds, 
    json_data: { ...jsonData.value },
    teams: cleanPertenencias
  })
  cerrar()
}

watch(() => props.show, (val) => {
  if (val) {
    cargarData()
  }
})

onMounted(cargarData)
</script>

