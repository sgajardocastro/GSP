<template>
  <div v-if="visible" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 animate-fadeIn">
    <div class="bg-[#0b1021] border border-amber-500/40 rounded-2xl w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden shadow-2xl shadow-black">
      
      <!-- CABECERA -->
      <div class="bg-[#050810] px-5 py-3.5 border-b border-white/10 flex justify-between items-center flex-shrink-0">
        <div class="flex items-center gap-3">
          <span class="text-2xl">📋</span>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-sm font-black text-white uppercase tracking-wider font-mono">
                Report Diario Digital — Día {{ report?.dia_correlativo || 1 }}
              </h3>
              <span 
                :class="esValidado 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'" 
                class="text-[9.5px] font-mono font-bold uppercase px-2 py-0.5 rounded border"
              >
                {{ esValidado ? '✅ Validado por Analista' : '⏳ Pendiente Validación' }}
              </span>
            </div>
            <p class="text-[11px] text-slate-400">
              OT: <strong class="text-amber-400 font-mono">{{ report?.codi_proyecto || 'GSP-OT' }}</strong> • 
              Faena: <span class="text-slate-200">{{ report?.obra_nombre }}</span> • 
              Fecha: <span class="text-slate-200">{{ formatearFecha(report?.fecha_reporte) }}</span>
            </p>
          </div>
        </div>
        <button @click="cerrar" class="text-slate-400 hover:text-white text-xl p-1 font-bold cursor-pointer transition-colors">✕</button>
      </div>

      <!-- CONTENIDO CON SCROLL -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4 text-slate-200">
        
        <!-- RESUMEN DE EQUIPO Y PERSONAL -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-[#080d1a] border border-white/10 rounded-xl p-3">
          <div>
            <span class="text-[10px] text-slate-400 font-bold uppercase block">Grúa / Maquinaria</span>
            <strong class="text-amber-300 font-mono text-xs">{{ report?.equipo_patente || 'N/A' }}</strong>
            <span class="text-[11px] text-slate-400 block">{{ report?.equipo_modelo }}</span>
          </div>
          <div>
            <span class="text-[10px] text-slate-400 font-bold uppercase block">Operador Asignado</span>
            <strong class="text-white text-xs block">{{ report?.operador_nombre || 'N/A' }}</strong>
            <span class="text-[11px] text-slate-400">GSP Operaciones</span>
          </div>
          <div>
            <span class="text-[10px] text-slate-400 font-bold uppercase block">Rigger / Asistente</span>
            <strong class="text-white text-xs block">{{ report?.rigger_nombre || 'N/A' }}</strong>
            <span class="text-[11px] text-slate-400">En Terreno</span>
          </div>
          <div>
            <span class="text-[10px] text-slate-400 font-bold uppercase block">Base Mínima OT</span>
            <strong class="text-emerald-400 font-mono text-xs">{{ report?.horas_minimas || 4.0 }} hrs</strong>
            <span class="text-[11px] text-slate-400 block">Cobro mínimo día</span>
          </div>
        </div>

        <!-- TABLA DE TIEMPOS, HORÓMETROS Y HORAS -->
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <!-- Horario Faena -->
          <div class="bg-[#050810] border border-white/10 rounded-xl p-3 space-y-0.5">
            <span class="text-[10px] text-slate-400 font-bold uppercase block">⏱️ Horario Faena</span>
            <div class="text-xs font-mono font-bold text-white">
              {{ formatHora(report?.fecha_inicio_servicio) }} ➔ {{ formatHora(report?.fecha_termino_servicio) }}
            </div>
            <span class="text-[10px] text-slate-500 block">Colación: {{ report?.horas_colacion || 1.0 }}h</span>
          </div>

          <!-- Horómetro Delta -->
          <div class="bg-[#050810] border border-white/10 rounded-xl p-3 space-y-0.5">
            <span class="text-[10px] text-slate-400 font-bold uppercase block">⚙️ Horómetro Motor</span>
            <div class="text-xs font-mono font-bold text-amber-400">
              {{ report?.horometro_inicio || 0 }} ➔ {{ report?.horometro_termino || '---' }}
            </div>
            <span class="text-[10px] text-slate-500 block">
              Δ {{ deltaHorometro }} hrs motor
            </span>
          </div>

          <!-- Horas Efectivas -->
          <div class="bg-[#050810] border border-white/10 rounded-xl p-3 space-y-0.5">
            <span class="text-[10px] text-slate-400 font-bold uppercase block">🏗️ Horas Efectivas</span>
            <div class="text-base font-black font-mono text-white">
              {{ report?.horas_operadas || 0 }} <span class="text-xs text-slate-400 font-normal">HRS</span>
            </div>
            <span class="text-[10px] text-slate-500 block">Tiempo neto izaje</span>
          </div>

          <!-- Horas a Facturar -->
          <div class="bg-[#050810] border border-amber-500/40 rounded-xl p-3 space-y-0.5 bg-amber-950/20">
            <span class="text-[10px] text-amber-400 font-bold uppercase block">💰 A Facturar</span>
            <div class="text-base font-black font-mono text-amber-400">
              {{ report?.horas_facturables || 0 }} <span class="text-xs text-amber-300 font-normal">HRS</span>
            </div>
            <span class="text-[10px] text-amber-500/70 block">max(Efectivas, Mín)</span>
          </div>

          <!-- Sobretiempo -->
          <div class="bg-[#050810] border border-white/10 rounded-xl p-3 space-y-0.5" :class="Number(report?.horas_sobretiempo) > 0 ? 'border-yellow-500/50 bg-yellow-950/20' : ''">
            <span class="text-[10px] text-slate-400 font-bold uppercase block">⚡ Sobretiempo</span>
            <div class="text-base font-black font-mono" :class="Number(report?.horas_sobretiempo) > 0 ? 'text-yellow-400' : 'text-slate-500'">
              +{{ report?.horas_sobretiempo || 0 }} <span class="text-xs font-normal">HRS</span>
            </div>
            <span class="text-[10px] text-slate-500 block">Horas excedentes</span>
          </div>
        </div>

        <!-- OBSERVACIONES DE MANIOBRA -->
        <div class="bg-[#080d1a] border border-white/10 rounded-xl p-3 space-y-1.5">
          <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">📝 Maniobras / Observaciones Registradas</span>
          <p class="text-xs text-slate-300 italic bg-black/40 p-2.5 rounded-lg border border-white/5 whitespace-pre-wrap">
            {{ report?.observacion_trabajo || 'Sin observaciones adicionales registradas para este día.' }}
          </p>
        </div>

        <!-- CONFORMIDAD Y FIRMA MANDANTE (CANVAS) -->
        <div class="bg-[#080d1a] border border-amber-500/30 rounded-xl p-3.5 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              ✍️ Firma Manuscrita de Conformidad del Mandante
            </span>
            <span class="text-[11px] text-slate-400 font-mono">
              Sello: {{ formatDateTime(report?.fecha_registro) }}
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-black/40 p-3 rounded-lg border border-white/5 text-xs">
            <div>
              <span class="text-slate-400 text-[10px] uppercase block">Supervisor Cliente</span>
              <strong class="text-white">{{ report?.cliente_nombre || 'Supervisor Mandante' }}</strong>
            </div>
            <div>
              <span class="text-slate-400 text-[10px] uppercase block">RUT Mandante</span>
              <strong class="text-slate-200 font-mono">{{ report?.cliente_rut || 'No especificado' }}</strong>
            </div>
            <div>
              <span class="text-slate-400 text-[10px] uppercase block">Cargo en Obra</span>
              <strong class="text-slate-200">{{ report?.cliente_cargo || 'Supervisor de Obra' }}</strong>
            </div>
          </div>

          <!-- LIENZO DE LA FIRMA -->
          <div class="bg-white rounded-xl p-2 flex items-center justify-center border border-slate-300 min-h-[140px] shadow-inner">
            <img 
              v-if="report?.cliente_firma_canvas_base64" 
              :src="report?.cliente_firma_canvas_base64" 
              alt="Firma del Mandante" 
              class="max-h-[130px] max-w-full object-contain"
            />
            <div v-else class="text-slate-400 text-xs italic">
              Sin imagen de firma disponible
            </div>
          </div>

          <!-- ESTAMPA GPS -->
          <div v-if="report?.latitud_inicio_servicio" class="flex items-center justify-between text-[11px] text-slate-400 bg-black/30 px-3 py-1.5 rounded-lg border border-white/5 font-mono">
            <span>📍 <strong>GPS Sello:</strong> Lat {{ report?.latitud_inicio_servicio }}, Lng {{ report?.longitud_inicio_servicio }}</span>
            <span v-if="report?.accuracy_firma">Precisión: ±{{ Number(report?.accuracy_firma).toFixed(0) }}m</span>
          </div>
        </div>

        <!-- SECCIÓN DE VALIDACIÓN DEL ANALISTA -->
        <div class="border rounded-xl p-3.5 space-y-2.5" :class="esValidado ? 'bg-emerald-950/20 border-emerald-500/40' : 'bg-slate-900/60 border-white/10'">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" :class="esValidado ? 'text-emerald-400' : 'text-slate-300'">
              🛡️ Validación del Analista de Operaciones
            </span>
            <span v-if="esValidado" class="text-[11px] text-emerald-300 font-mono">
              Validado el {{ formatDateTime(report?.fecha_validacion) }}
            </span>
          </div>

          <div v-if="esValidado" class="text-xs text-slate-300 space-y-1">
            <div>Validador: <strong class="text-white">{{ report?.validador_nombre || 'Analista GSP' }}</strong></div>
            <p class="text-slate-400 italic bg-black/30 p-2 rounded border border-white/5">
              "{{ report?.obs_validador || 'Report validado conforme.' }}"
            </p>
          </div>

          <div v-else class="space-y-2">
            <label class="text-[11px] text-slate-400 block">Observaciones de Validación / Cuadratura con OT:</label>
            <input 
              v-model="obsValidacion" 
              type="text" 
              placeholder="Ej: Cuadratura horaria conforme con la OT y parte de terreno..." 
              class="w-full bg-[#050810] border border-white/20 rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none"
            />
            <div class="flex justify-end pt-1">
              <button
                @click="validarReport"
                :disabled="validando"
                class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-900/30"
              >
                <span v-if="validando">⏳ Validando...</span>
                <span v-else>✅ Validar y Aprobar Report Digital</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      <!-- FOOTER -->
      <div class="bg-[#050810] px-5 py-3 border-t border-white/10 flex justify-end items-center flex-shrink-0">
        <button 
          @click="cerrar" 
          class="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
        >
          Cerrar Visor
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import axios from 'axios'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  report: {
    type: Object,
    default: () => ({})
  },
  apiUrl: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close', 'report-validado'])

const obsValidacion = ref('')
const validando = ref(false)

const esValidado = computed(() => {
  return props.report?.estado_reporte === 'VALIDADO_ANALISTA'
})

const deltaHorometro = computed(() => {
  const ini = Number(props.report?.horometro_inicio) || 0
  const fin = Number(props.report?.horometro_termino) || 0
  if (fin >= ini && ini > 0) {
    return (fin - ini).toFixed(1)
  }
  return '0.0'
})

const formatearFecha = (fechaStr) => {
  if (!fechaStr) return '---'
  try {
    const d = new Date(fechaStr)
    return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
  } catch (e) {
    return fechaStr
  }
}

const formatHora = (timestampStr) => {
  if (!timestampStr) return '08:00'
  try {
    const d = new Date(timestampStr)
    return d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
  } catch (e) {
    return String(timestampStr).slice(11, 16)
  }
}

const formatDateTime = (dtStr) => {
  if (!dtStr) return '---'
  try {
    const d = new Date(dtStr)
    return d.toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch (e) {
    return dtStr
  }
}

const validarReport = async () => {
  if (!props.report?.id_reporte_avance) return

  try {
    validando.value = true
    const base = props.apiUrl || ''
    
    // Resolver usuario actual desde localStorage
    let idUser = 1
    try {
      const uStr = localStorage.getItem('usuario') || localStorage.getItem('perfil')
      if (uStr) {
        const u = JSON.parse(uStr)
        idUser = u.id_user || 1
      }
    } catch (e) {}

    const res = await axios.post(`${base}/api/operaciones/report/${props.report.id_reporte_avance}/validar`, {
      id_user_validador: idUser,
      obs_validador: obsValidacion.value || 'Report diario validado conforme por el Analista de Operaciones'
    })

    if (res.data?.success) {
      emit('report-validado', res.data.data)
      cerrar()
    }
  } catch (err) {
    console.error('Error al validar report:', err)
    alert('Error al validar report: ' + (err.response?.data?.error || err.message))
  } finally {
    validando.value = false
  }
}

const cerrar = () => {
  emit('close')
}
</script>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
}
.animate-fadeIn {
  animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
