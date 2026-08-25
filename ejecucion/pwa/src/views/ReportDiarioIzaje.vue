<template>
  <v-container class="pa-3 max-w-lg mx-auto pb-16" style="max-width: 600px;">
    <!-- Top Bar -->
    <div class="d-flex align-center justify-space-between mb-3">
      <v-btn icon="mdi-arrow-left" variant="text" color="grey-lighten-1" @click="volver"></v-btn>
      <div class="text-center flex-grow-1">
        <div class="text-caption font-weight-black text-amber-400 text-uppercase tracking-wider">
          GSP OPERACIONES FAENA
        </div>
        <div class="text-subtitle-1 font-weight-black text-white">
          📋 Report Diario de Izaje
        </div>
      </div>
      <v-chip size="small" color="amber-darken-3" variant="flat" class="font-weight-black">
        DÍA {{ diaCorrelativo }}
      </v-chip>
    </div>

    <!-- Loading State -->
    <v-card v-if="cargando" class="pa-6 text-center rounded-xl bg-slate-900 border border-white/10">
      <v-progress-circular indeterminate color="amber" size="48" class="mb-3"></v-progress-circular>
      <div class="text-subtitle-2 text-grey-lighten-1">Cargando datos de la OT y faena...</div>
    </v-card>

    <div v-else class="space-y-4">
      <!-- BLOQUE 1: TARJETA DE RESUMEN OT (PRECARGADA) -->
      <v-card
        class="pa-4 rounded-xl border border-amber-500/30 text-white"
        style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);"
        elevation="3"
      >
        <div class="d-flex align-center justify-space-between mb-2">
          <span class="text-caption font-mono text-amber-400 font-weight-bold">
            OT: {{ proyecto.codi_proyecto || 'GSP-OT' }}
          </span>
          <v-chip size="x-small" color="success" variant="tonal" class="font-weight-bold">
            EN FAENA
          </v-chip>
        </div>

        <div class="text-subtitle-1 font-weight-black text-white mb-1">
          {{ proyecto.cliente_nombre || 'Cliente GSP' }}
        </div>
        <div class="text-caption text-grey-lighten-1 mb-2">
          📍 <strong>Faena:</strong> {{ proyecto.obra_nombre }} <span v-if="proyecto.obra_direccion">• {{ proyecto.obra_direccion }}</span>
        </div>

        <v-divider class="my-2 border-white/10"></v-divider>

        <div class="row g-2 text-caption">
          <div class="col-6">
            <span class="text-grey-darken-1 d-block text-uppercase text-[10px]">Grúa / Equipo</span>
            <strong class="text-amber-200 font-mono">{{ equipoSeleccionado?.patente || 'N/A' }}</strong>
            <span class="text-grey-lighten-2 d-block text-[11px]">{{ equipoSeleccionado?.modelo || 'Grúa Telescópica' }}</span>
          </div>
          <div class="col-6">
            <span class="text-grey-darken-1 d-block text-uppercase text-[10px]">Operador / Rigger</span>
            <strong class="text-white d-block">{{ operadorNombre }}</strong>
            <span class="text-grey-lighten-2 text-[11px]">{{ riggerNombre }}</span>
          </div>
        </div>
      </v-card>

      <!-- BLOQUE 2: TIEMPOS, COLACIÓN Y HORÓMETROS -->
      <v-card
        class="pa-4 rounded-xl border border-white/10 text-white"
        style="background-color: #0b1120;"
        elevation="2"
      >
        <div class="d-flex align-center ga-2 mb-3">
          <span class="text-h6">⏱️</span>
          <div>
            <div class="text-subtitle-2 font-weight-black text-white">Horarios & Horómetros del Día</div>
            <div class="text-caption text-grey-lighten-1">Registro de jornada y cálculo de horas</div>
          </div>
        </div>

        <!-- Fecha del servicio -->
        <div class="mb-3">
          <label class="text-caption font-weight-bold text-grey-lighten-1 text-uppercase mb-1 d-block">
            📅 Fecha de la Jornada
          </label>
          <input
            v-model="form.fecha_reporte"
            type="date"
            class="w-full bg-slate-900 border border-white/20 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-amber-400 focus:outline-none"
          />
        </div>

        <!-- Hora Inicio y Hora Término -->
        <div class="row g-2 mb-3">
          <div class="col-6">
            <label class="text-caption font-weight-bold text-grey-lighten-1 text-uppercase mb-1 d-block">
              🟢 Hora Inicio
            </label>
            <input
              v-model="form.hora_inicio"
              type="time"
              class="w-full bg-slate-900 border border-white/20 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-amber-400 focus:outline-none text-center"
            />
          </div>
          <div class="col-6">
            <label class="text-caption font-weight-bold text-grey-lighten-1 text-uppercase mb-1 d-block">
              🔴 Hora Término
            </label>
            <input
              v-model="form.hora_termino"
              type="time"
              class="w-full bg-slate-900 border border-white/20 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-amber-400 focus:outline-none text-center"
            />
          </div>
        </div>

        <!-- Tiempo de Colación (Selector Rápido) -->
        <div class="mb-3">
          <div class="d-flex align-center justify-space-between mb-1">
            <label class="text-caption font-weight-bold text-grey-lighten-1 text-uppercase">
              🥪 Tiempo de Colación
            </label>
            <span class="text-caption font-mono font-weight-bold text-amber-400">
              {{ form.minutos_colacion }} min ({{ horasColacionFormateadas }}h)
            </span>
          </div>
          <div class="d-flex ga-2">
            <v-btn
              v-for="opcion in [30, 45, 60, 90]"
              :key="opcion"
              size="small"
              :variant="form.minutos_colacion === opcion ? 'flat' : 'outlined'"
              :color="form.minutos_colacion === opcion ? 'amber' : 'grey'"
              class="flex-grow-1 font-weight-bold"
              @click="form.minutos_colacion = opcion"
            >
              {{ opcion }}m
            </v-btn>
          </div>
        </div>

        <!-- Horómetros -->
        <div class="row g-2 mb-3">
          <div class="col-6">
            <label class="text-caption font-weight-bold text-grey-lighten-1 text-uppercase mb-1 d-block">
              ⚙️ Horómetro Inicio
            </label>
            <input
              v-model.number="form.horometro_inicio"
              type="number"
              step="0.1"
              placeholder="Ej: 3450.5"
              class="w-full bg-slate-900 border border-white/20 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-amber-400 focus:outline-none text-center"
            />
          </div>
          <div class="col-6">
            <label class="text-caption font-weight-bold text-grey-lighten-1 text-uppercase mb-1 d-block">
              ⚙️ Horómetro Término
            </label>
            <input
              v-model.number="form.horometro_termino"
              type="number"
              step="0.1"
              placeholder="Ej: 3459.0"
              class="w-full bg-slate-900 border border-white/20 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-amber-400 focus:outline-none text-center"
            />
          </div>
        </div>

        <!-- PANEL REACTIVO DE CÁLCULO DE HORAS -->
        <div class="pa-3 rounded-lg border border-amber-500/40 bg-slate-950/80 mb-3">
          <div class="d-flex align-center justify-space-between mb-2">
            <span class="text-caption text-grey-lighten-1 text-uppercase font-weight-bold">Cálculo de Jornada</span>
            <span class="text-caption text-grey font-mono">Mínimo pactado: {{ horasMinimas }} hrs</span>
          </div>

          <div class="row text-center g-2">
            <div class="col-4">
              <div class="text-[10px] text-grey-lighten-1 text-uppercase">Horas Efectivas</div>
              <div class="text-subtitle-1 font-mono font-weight-black text-white">
                {{ calculoHoras.efectivas }}h
              </div>
            </div>
            <div class="col-4 border-x border-white/10">
              <div class="text-[10px] text-amber-400 text-uppercase font-weight-bold">A Facturar</div>
              <div class="text-subtitle-1 font-mono font-weight-black text-amber-400">
                {{ calculoHoras.facturables }}h
              </div>
            </div>
            <div class="col-4">
              <div class="text-[10px] text-grey-lighten-1 text-uppercase">Sobretiempo</div>
              <div
                class="text-subtitle-1 font-mono font-weight-black"
                :class="calculoHoras.sobretiempo > 0 ? 'text-yellow-400' : 'text-grey-darken-1'"
              >
                +{{ calculoHoras.sobretiempo }}h
              </div>
            </div>
          </div>

          <div v-if="calculoHoras.sobretiempo > 0" class="mt-2 text-center text-caption text-amber-300 bg-amber-950/50 py-1 px-2 rounded border border-amber-500/30">
            ⚠️ <strong>Sobretiempo detectado:</strong> +{{ calculoHoras.sobretiempo }} hrs sobre la base mínima de {{ horasMinimas }} hrs.
          </div>
        </div>

        <!-- Observaciones -->
        <div>
          <label class="text-caption font-weight-bold text-grey-lighten-1 text-uppercase mb-1 d-block">
            📝 Observaciones / Maniobras Realizadas
          </label>
          <textarea
            v-model="form.observacion_trabajo"
            rows="3"
            placeholder="Detalle de maniobras de izaje, tonelajes, radios, interferencias o condiciones de faena..."
            class="w-full bg-slate-900 border border-white/20 rounded-lg p-2 text-white text-xs focus:border-amber-400 focus:outline-none"
          ></textarea>
        </div>
      </v-card>

      <!-- BLOQUE 3: CONFORMIDAD Y FIRMA MANUAL DEL MANDANTE -->
      <v-card
        class="pa-4 rounded-xl border border-amber-500/40 text-white"
        style="background-color: #0b1120;"
        elevation="3"
      >
        <div class="d-flex align-center ga-2 mb-2">
          <span class="text-h6">✍️</span>
          <div>
            <div class="text-subtitle-2 font-weight-black text-amber-400">Conformidad del Mandante</div>
            <div class="text-caption text-grey-lighten-1">Firma manuscrita del receptor en terreno</div>
          </div>
        </div>

        <div class="mb-2">
          <label class="text-caption font-weight-bold text-grey-lighten-1 text-uppercase mb-1 d-block">
            👤 Nombre Supervisor Mandante *
          </label>
          <input
            v-model="form.cliente_nombre"
            type="text"
            placeholder="Nombre y Apellido del supervisor"
            class="w-full bg-slate-900 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-400 focus:outline-none"
          />
        </div>

        <div class="row g-2 mb-2">
          <div class="col-6">
            <label class="text-caption font-weight-bold text-grey-lighten-1 text-uppercase mb-1 d-block">
              🆔 RUT *
            </label>
            <input
              v-model="form.cliente_rut"
              type="text"
              placeholder="12.345.678-9"
              class="w-full bg-slate-900 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div class="col-6">
            <label class="text-caption font-weight-bold text-grey-lighten-1 text-uppercase mb-1 d-block">
              💼 Cargo en Obra
            </label>
            <input
              v-model="form.cliente_cargo"
              type="text"
              placeholder="Ej: ITO / Jefe de Obra"
              class="w-full bg-slate-900 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>

        <!-- SignatureField (Reutilizado de la PWA) -->
        <SignatureField
          v-model="form.cliente_firma_canvas_base64"
          label="FIRMA MANUSCRITA DEL SUPERVISOR MANDANTE"
        />

        <div class="text-caption text-grey-darken-1 text-center my-2">
          🛰️ Al sellar se capturará geoposición GPS inmutable y timestamp oficial.
        </div>

        <!-- Botón de Transmisión -->
        <v-btn
          block
          size="x-large"
          color="amber-darken-2"
          class="font-weight-black text-uppercase rounded-xl text-black py-4 mt-2"
          :loading="enviando"
          :disabled="!puedeEnviar"
          @click="sellarYTransmitirReport"
        >
          🟢 Sellar y Transmitir Report Día {{ diaCorrelativo }}
        </v-btn>
      </v-card>
    </div>

    <!-- Snackbar de Éxito / Error -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="4000">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import SignatureField from '@/components/SignatureField.vue'

const route = useRoute()
const router = useRouter()

const cargando = ref(true)
const enviando = ref(false)
const idProyecto = ref(route.query.id_proyecto || null)

const proyecto = ref({})
const equipos = ref([])
const personas = ref([])
const reportsPrevios = ref([])
const diaCorrelativo = ref(1)
const horasMinimas = ref(4.0)

const form = reactive({
  fecha_reporte: new Date().toISOString().split('T')[0],
  hora_inicio: '08:00',
  hora_termino: '18:00',
  minutos_colacion: 60,
  horometro_inicio: null,
  horometro_termino: null,
  observacion_trabajo: '',
  cliente_nombre: '',
  cliente_rut: '',
  cliente_cargo: 'Supervisor en Obra',
  cliente_firma_canvas_base64: ''
})

const snackbar = reactive({
  show: false,
  text: '',
  color: 'success'
})

const equipoSeleccionado = computed(() => {
  return equipos.value.length > 0 ? equipos.value[0] : null
})

const operadorNombre = computed(() => {
  const op = personas.value.find(p => (p.rol_asignado || '').toUpperCase().includes('OPERADOR'))
  if (op) return `${op.name_frst || ''} ${op.apellido_pat || ''}`.trim()
  return 'Operador Asignado'
})

const riggerNombre = computed(() => {
  const rig = personas.value.find(p => (p.rol_asignado || '').toUpperCase().includes('RIGGER'))
  if (rig) return `Rigger: ${rig.name_frst || ''} ${rig.apellido_pat || ''}`.trim()
  return 'Rigger en Faena'
})

const horasColacionFormateadas = computed(() => {
  return (form.minutos_colacion / 60).toFixed(1)
})

// Cálculo reactivo en vivo de horas
const calculoHoras = computed(() => {
  if (!form.hora_inicio || !form.hora_termino) {
    return { efectivas: 0, facturables: horasMinimas.value, sobretiempo: 0 }
  }

  const [hIni, mIni] = form.hora_inicio.split(':').map(Number)
  const [hFin, mFin] = form.hora_termino.split(':').map(Number)

  let minutosTotales = (hFin * 60 + mFin) - (hIni * 60 + mIni)
  if (minutosTotales < 0) minutosTotales += 24 * 60 // Por si pasa de medianoche

  const minutosEfectivos = Math.max(0, minutosTotales - form.minutos_colacion)
  const efectivas = Number((minutosEfectivos / 60).toFixed(1))
  const facturables = Number(Math.max(efectivas, horasMinimas.value).toFixed(1))
  const sobretiempo = Number(Math.max(0, efectivas - horasMinimas.value).toFixed(1))

  return { efectivas, facturables, sobretiempo }
})

const puedeEnviar = computed(() => {
  return (
    form.cliente_nombre.trim().length > 2 &&
    form.cliente_firma_canvas_base64 &&
    form.hora_inicio &&
    form.hora_termino &&
    !enviando.value
  )
})

const cargarContexto = async () => {
  try {
    cargando.value = true
    if (!idProyecto.value) {
      // Intentar resolver desde localStorage o query
      const guardado = localStorage.getItem('id_proyecto_activo')
      if (guardado) idProyecto.value = guardado
    }

    if (!idProyecto.value) {
      snackbar.text = 'No se especificó la OT / Proyecto'
      snackbar.color = 'error'
      snackbar.show = true
      cargando.value = false
      return
    }

    const res = await api.get(`/operaciones/report/contexto/${idProyecto.value}`)
    if (res.data && res.data.success) {
      const d = res.data.data
      proyecto.value = d.proyecto || {}
      equipos.value = d.equipos || []
      personas.value = d.personas || []
      reportsPrevios.value = d.reports || []
      diaCorrelativo.value = d.dia_sugerido || 1
      horasMinimas.value = Number(d.horas_minimas) || 4.0

      if (d.horometro_sugerido && !form.horometro_inicio) {
        form.horometro_inicio = Number(d.horometro_sugerido)
      }
    }
  } catch (err) {
    console.error('Error al cargar contexto de report:', err)
    snackbar.text = 'Error al cargar datos de la OT'
    snackbar.color = 'error'
    snackbar.show = true
  } finally {
    cargando.value = false
  }
}

const sellarYTransmitirReport = async () => {
  if (!puedeEnviar.value) return

  try {
    enviando.value = true

    // Capturar GPS si está disponible
    let lat = null
    let lng = null
    let accuracy = null

    try {
      const pos = await new Promise((resolve, reject) => {
        if (!navigator.geolocation) return reject(new Error('No GPS'))
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 5000,
          enableHighAccuracy: true
        })
      })
      lat = pos.coords.latitude
      lng = pos.coords.longitude
      accuracy = pos.coords.accuracy
    } catch (e) {
      console.warn('GPS no disponible al firmar report:', e.message)
    }

    // Resolver ID del operador actual desde perfil
    let idUserOperador = 1
    try {
      const perfilStr = localStorage.getItem('perfil')
      if (perfilStr) {
        const perfil = JSON.parse(perfilStr)
        idUserOperador = perfil.id_user || 1
      }
    } catch (e) {}

    const payload = {
      id_proyecto: idProyecto.value,
      id_equipo: equipoSeleccionado.value?.id_equipo || null,
      id_user_operador: idUserOperador,
      id_user_rigger: personas.value.find(p => (p.rol_asignado || '').toUpperCase().includes('RIGGER'))?.id_user || null,
      dia_correlativo: diaCorrelativo.value,
      fecha_reporte: form.fecha_reporte,
      hora_inicio: form.hora_inicio,
      hora_termino: form.hora_termino,
      horas_colacion: Number((form.minutos_colacion / 60).toFixed(2)),
      horas_operadas: calculoHoras.value.efectivas,
      horas_minimas: horasMinimas.value,
      horas_facturables: calculoHoras.value.facturables,
      horas_sobretiempo: calculoHoras.value.sobretiempo,
      horometro_inicio: form.horometro_inicio,
      horometro_termino: form.horometro_termino,
      observacion_trabajo: form.observacion_trabajo,
      cliente_nombre: form.cliente_nombre,
      cliente_rut: form.cliente_rut,
      cliente_cargo: form.cliente_cargo,
      cliente_firma_canvas_base64: form.cliente_firma_canvas_base64,
      latitud_inicio_servicio: lat,
      longitud_inicio_servicio: lng,
      accuracy_firma: accuracy
    }

    const res = await api.post('/operaciones/report/guardar', payload)
    if (res.data && res.data.success) {
      snackbar.text = `✅ Report Día ${diaCorrelativo.value} transmitido exitosamente.`
      snackbar.color = 'success'
      snackbar.show = true

      setTimeout(() => {
        router.push('/surveys')
      }, 1500)
    } else {
      throw new Error(res.data?.error || 'Error al guardar')
    }
  } catch (err) {
    console.error('Error transmitiendo report:', err)
    snackbar.text = 'Error al transmitir report: ' + (err.response?.data?.error || err.message)
    snackbar.color = 'error'
    snackbar.show = true
  } finally {
    enviando.value = false
  }
}

const volver = () => {
  router.push('/surveys')
}

onMounted(() => {
  cargarContexto()
})
</script>

<style scoped>
.max-w-lg {
  max-width: 32rem;
}
</style>
