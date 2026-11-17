<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
    <div class="w-full max-w-md bg-[#050810] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
      
      <!-- Header -->
      <div class="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-black/20">
        <div>
          <h3 class="text-sm font-extrabold text-white uppercase tracking-wider">Programar Visita a Terreno</h3>
          <p class="text-[10px] text-slate-400 mt-0.5">Asigna fecha, ubicación y responsable para generar la inspección.</p>
        </div>
        <button @click="emit('close')" class="text-slate-400 hover:text-white transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Form Body -->
      <form @submit.prevent="guardarVisita" class="p-6 space-y-4 overflow-y-auto flex-1 scrollbar-hide">
        
        <!-- Fecha de Visita -->
        <div>
          <label class="block text-[11px] text-slate-400 font-semibold mb-1.5">Fecha Programada de Visita:</label>
          <input 
            type="date" 
            v-model="form.fecha_visita" 
            required 
            class="w-full bg-[#0a0f1e] border border-white/10 rounded-lg px-3 py-2 text-xs focus:border-amber-500 outline-none text-white font-mono transition-colors"
          />
        </div>

        <!-- Dirección de la Obra -->
        <div>
          <label class="block text-[11px] text-slate-400 font-semibold mb-1.5">Dirección / Obra:</label>
          <input 
            type="text" 
            v-model="form.direccion" 
            placeholder="Ej: Av. Las Condes 10200, Santiago" 
            required 
            class="w-full bg-[#0a0f1e] border border-white/10 rounded-lg px-3 py-2 text-xs focus:border-amber-500 outline-none text-white transition-colors"
          />
        </div>

        <!-- Coordenadas GPS (Latitud & Longitud) -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-[11px] text-slate-400 font-semibold mb-1.5">Latitud:</label>
            <input 
              type="text" 
              v-model="form.latitud" 
              placeholder="Ej: -33.456" 
              class="w-full bg-[#0a0f1e] border border-white/10 rounded-lg px-3 py-2 text-xs focus:border-amber-500 outline-none text-white font-mono transition-colors"
            />
          </div>
          <div>
            <label class="block text-[11px] text-slate-400 font-semibold mb-1.5">Longitud:</label>
            <input 
              type="text" 
              v-model="form.longitud" 
              placeholder="Ej: -70.648" 
              class="w-full bg-[#0a0f1e] border border-white/10 rounded-lg px-3 py-2 text-xs focus:border-amber-500 outline-none text-white font-mono transition-colors"
            />
          </div>
        </div>

        <!-- Responsable Técnico -->
        <div>
          <label class="block text-[11px] text-slate-400 font-semibold mb-1.5">Asignar Responsable Técnico:</label>
          <select 
            v-model="form.id_user_responsable" 
            required 
            class="w-full bg-[#0a0f1e] border border-white/10 rounded-lg px-3 py-2 text-xs focus:border-amber-500 outline-none text-white transition-colors"
          >
            <option value="">-- Seleccionar Técnico --</option>
            <option v-for="u in usuarios" :key="u.id_user" :value="u.id_user">
              {{ u.nombre_user || u.name_user || u.username }} ({{ u.email_user || 'Sin email' }})
            </option>
          </select>
        </div>

        <!-- Costo de Visita Técnica ($ CLP) y Autorizador sin costo (Acuerdo #2) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label class="block text-[11px] text-slate-400 font-semibold mb-1.5">
              Costo Visita Técnica ($ CLP):
            </label>
            <input 
              type="number" 
              v-model.number="form.costo_visita" 
              min="0"
              step="1000"
              placeholder="0"
              required 
              class="w-full bg-[#0a0f1e] border border-white/10 rounded-lg px-3 py-2 text-xs focus:border-amber-500 outline-none text-white font-mono transition-colors"
            />
            <p class="text-[9px] text-slate-500 mt-1">
              {{ Number(form.costo_visita) === 0 ? '⚠️ Visita sin costo ($0) requiere autorización formal.' : 'Tarifa acordada a facturar.' }}
            </p>
          </div>

          <div v-if="Number(form.costo_visita) === 0">
            <label class="block text-[11px] text-amber-400 font-semibold mb-1.5 flex items-center gap-1">
              <span>⚠️</span> Autorizado sin costo por:
            </label>
            <select
              v-model="form.id_user_autorizador"
              @change="alCambiarAutorizador"
              required
              class="w-full bg-[#0a0f1e] border border-amber-500/50 rounded-lg px-3 py-2 text-xs focus:border-amber-400 outline-none text-white transition-colors"
            >
              <option value="">-- Seleccionar Autorizador --</option>
              <option v-for="u in listaAutorizadores" :key="u.id_user" :value="u.id_user">
                {{ u.nombre_user || u.name_user || `${u.name_frst || ''} ${u.apellido_pat || ''}`.trim() || u.username }}
              </option>
            </select>
          </div>
        </div>

        <!-- Botones de Acción -->
        <div class="pt-4 flex justify-end gap-3 border-t border-white/5 mt-6">
          <button 
            type="button" 
            @click="emit('close')" 
            class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs uppercase tracking-wider transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            :disabled="cargando"
            class="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs uppercase tracking-widest transition-colors shadow-lg shadow-amber-500/10 flex items-center gap-1.5"
          >
            <span v-if="cargando">Programando...</span>
            <span v-else>Generar Visita</span>
          </button>
        </div>

      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import apiAxios from '../../services/api'

const props = defineProps({
  idProyecto: {
    type: Number,
    required: true
  },
  idEmpresaCliente: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['close', 'programado'])

const form = ref({
  fecha_visita: '',
  direccion: '',
  latitud: '',
  longitud: '',
  id_user_responsable: '',
  costo_visita: 0,
  id_user_autorizador: '',
  nombre_autorizador: ''
})

const usuarios = ref([])
const cargando = ref(false)

const listaAutorizadores = computed(() => {
  const filtrados = usuarios.value.filter(u => {
    const rol = String(u.name_rol || u.rol || '').toUpperCase()
    const nombre = `${u.nombre_user || ''} ${u.name_frst || ''} ${u.apellido_pat || ''}`.toUpperCase()
    return nombre.includes('OMAR') || nombre.includes('GHISELLINI') || rol.includes('GEREN') || rol.includes('ADMIN') || rol.includes('JEFE') || rol.includes('DIRECT')
  })
  const base = filtrados.length > 0 ? filtrados : usuarios.value
  return base.concat(usuarios.value).filter((u, index, self) => index === self.findIndex(t => t.id_user === u.id_user))
})

const alCambiarAutorizador = () => {
  const aut = usuarios.value.find(u => Number(u.id_user) === Number(form.value.id_user_autorizador))
  if (aut) {
    form.value.nombre_autorizador = (aut.nombre_user || aut.name_user || `${aut.name_frst || ''} ${aut.apellido_pat || ''}`.trim() || aut.username)
  }
}

const fetchUsuarios = async () => {
  try {
    const { data } = await apiAxios.get('/usuarios')
    // Filtramos solo usuarios activos
    usuarios.value = (data || []).filter(u => u.flag_activo !== false)

    // Pre-seleccionar Omar Ghisellini por defecto para visitas sin costo ($0) (Acuerdo #2)
    const omar = usuarios.value.find(u => {
      const nom = `${u.nombre_user || ''} ${u.name_frst || ''} ${u.apellido_pat || ''}`.toUpperCase()
      return nom.includes('OMAR') || nom.includes('GHISELLINI')
    })
    if (omar && !form.value.id_user_autorizador) {
      form.value.id_user_autorizador = omar.id_user
      form.value.nombre_autorizador = omar.nombre_user || omar.name_user || `${omar.name_frst || ''} ${omar.apellido_pat || ''}`.trim() || 'Omar Ghisellini'
    }
  } catch (error) {
    console.error('Error fetching users for scheduling:', error)
  }
}

onMounted(() => {
  fetchUsuarios()
})

const guardarVisita = async () => {
  if (Number(form.value.costo_visita) === 0 && !form.value.id_user_autorizador && !form.value.nombre_autorizador) {
    alert('⚠️ Toda visita técnica valorizada en $0 CLP debe contar obligatoriamente con la autorización de Omar Ghisellini o Gerencia (Acuerdo #2).')
    return
  }

  cargando.value = true
  try {
    // 1. Instanciamos el survey usando el endpoint POST /api/survey
    // Para visitas, buscaremos el id_template 80 ("Inspección de Seguridad" u otro por defecto si no hay uno exclusivo)
    // El id_template 80 está disponible y tiene ID de tipo de servicio correcto.
    const respUser = usuarios.value.find(u => u.id_user === form.value.id_user_responsable)
    const nombre_responsable = respUser ? (respUser.nombre_user || respUser.name_user || respUser.username) : 'Técnico Asignado'

    const autorizadorUser = usuarios.value.find(u => Number(u.id_user) === Number(form.value.id_user_autorizador))
    const nombre_autorizador_resuelto = form.value.nombre_autorizador || (autorizadorUser ? (autorizadorUser.nombre_user || autorizadorUser.name_user || `${autorizadorUser.name_frst || ''} ${autorizadorUser.apellido_pat || ''}`.trim()) : (Number(form.value.costo_visita) === 0 ? 'Omar Ghisellini' : null))

    const payloadSurvey = {
      id_tipo_srv: 2, // Tipo Servicio Terreno / Inspección
      id_template: 80, // Inspección de Seguridad
      id_user: form.value.id_user_responsable,
      id_user_creacion: 1, // Admin o usuario actual
      id_empresa_cliente: props.idEmpresaCliente,
      estado_srv: 'Creado',
      fecha_plan_ini: form.value.fecha_visita,
      fecha_plan_fin: form.value.fecha_visita,
      latitud: form.value.latitud || null,
      longitud: form.value.longitud || null,
      id_proyecto: props.idProyecto,
      costo_visita: Number(form.value.costo_visita) || 0,
      id_user_autorizador: form.value.id_user_autorizador ? Number(form.value.id_user_autorizador) : null,
      nombre_autorizador: nombre_autorizador_resuelto
    }

    const { data } = await apiAxios.post('/survey', payloadSurvey)

    emit('programado', {
      id_survey: data.idSurvey,
      fecha_plan_ini: form.value.fecha_visita,
      nombre_responsable,
      direccion: form.value.direccion,
      latitud: form.value.latitud,
      longitud: form.value.longitud,
      costo_visita: Number(form.value.costo_visita) || 0,
      id_user_autorizador: form.value.id_user_autorizador ? Number(form.value.id_user_autorizador) : null,
      nombre_autorizador: nombre_autorizador_resuelto
    })
    
    alert('Visita técnica en terreno programada y asignada exitosamente.')
    emit('close')
  } catch (error) {
    console.error('Error programando visita:', error)
    alert('Error al programar visita técnica: ' + (error.response?.data?.error || error.message))
  } finally {
    cargando.value = false
  }
}
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>
