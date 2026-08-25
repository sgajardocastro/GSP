<template>
  <v-container class="pa-3 max-w-xl mx-auto pb-24" style="max-width: 650px;">
    <!-- Top Bar -->
    <div class="d-flex align-center justify-space-between mb-4">
      <v-btn icon="mdi-arrow-left" size="large" variant="flat" color="slate-800" class="border border-white/20" @click="volver"></v-btn>
      <div class="text-center flex-grow-1 px-2">
        <div class="text-xs sm:text-sm font-black text-amber-400 text-uppercase tracking-widest">
          GSP OPERACIONES FAENA
        </div>
        <div class="text-xl sm:text-2xl font-black text-white">
          📋 Report Diario de Izaje
        </div>
      </div>
      <v-chip size="large" color="amber-darken-2" variant="flat" class="text-base font-black px-4 py-2">
        DÍA {{ diaCorrelativo }}
      </v-chip>
    </div>

    <!-- Loading State -->
    <v-card v-if="cargando" class="pa-8 text-center rounded-2xl bg-slate-900 border border-white/10">
      <v-progress-circular indeterminate color="amber" size="64" width="6" class="mb-4"></v-progress-circular>
      <div class="text-lg font-bold text-grey-lighten-1">Cargando datos de la OT y faena...</div>
    </v-card>

    <div v-else class="space-y-5">
      <!-- BLOQUE 1: TARJETA DE RESUMEN OT (PRECARGADA) -->
      <v-card
        class="pa-5 rounded-2xl border-2 border-amber-500/40 text-white"
        style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);"
        elevation="4"
      >
        <div class="d-flex align-center justify-space-between mb-3">
          <span class="text-base sm:text-lg font-mono text-amber-300 font-black">
            OT: {{ proyecto.codi_proyecto || 'GSP-OT' }}
          </span>
          <v-chip size="small" color="success" variant="flat" class="font-black text-xs uppercase px-3">
            EN FAENA
          </v-chip>
        </div>

        <div class="text-xl sm:text-2xl font-black text-white mb-2 leading-tight">
          {{ proyecto.cliente_nombre || 'Cliente GSP' }}
        </div>
        <div class="text-sm sm:text-base text-grey-lighten-1 mb-3">
          📍 <strong class="text-white">Faena:</strong> {{ proyecto.obra_nombre }} <span v-if="proyecto.obra_direccion" class="text-grey-lighten-2">• {{ proyecto.obra_direccion }}</span>
        </div>

        <v-divider class="my-3 border-white/20"></v-divider>

        <div class="row g-3">
          <div class="col-6">
            <span class="text-amber-400 font-bold d-block text-uppercase text-xs tracking-wider mb-1">🚜 Grúa / Equipo</span>
            <strong class="text-amber-200 font-mono text-lg sm:text-xl font-black d-block">{{ equipoSeleccionado?.patente || 'N/A' }}</strong>
            <span class="text-grey-lighten-1 d-block text-xs sm:text-sm font-semibold">{{ equipoSeleccionado?.modelo || 'Grúa Telescópica' }}</span>
          </div>
          <div class="col-6">
            <span class="text-amber-400 font-bold d-block text-uppercase text-xs tracking-wider mb-1">👷 Tripulación</span>
            <strong class="text-white text-sm sm:text-base font-bold d-block">Op: {{ operadorNombre }}</strong>
            <span class="text-grey-lighten-1 text-xs sm:text-sm font-semibold d-block">Rig: {{ riggerNombre }}</span>
          </div>
        </div>
      </v-card>

      <!-- BLOQUE 2: TIEMPOS, COLACIÓN Y HORÓMETROS -->
      <v-card
        class="pa-5 rounded-2xl border-2 border-slate-700 text-white"
        style="background-color: #0b1120;"
        elevation="4"
      >
        <div class="d-flex align-center ga-3 mb-4">
          <span class="text-2xl">⏱️</span>
          <div>
            <div class="text-lg sm:text-xl font-black text-white">Horarios & Horómetros del Día</div>
            <div class="text-xs sm:text-sm text-grey-lighten-1">Registro de jornada y cálculo reactivo en vivo</div>
          </div>
        </div>

        <!-- Fecha del servicio -->
        <div class="mb-4">
          <label class="text-sm font-black text-amber-300 text-uppercase mb-2 d-block tracking-wider">
            📅 Fecha de la Jornada
          </label>
          <input
            v-model="form.fecha_reporte"
            type="date"
            class="w-full bg-slate-900 border-2 border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-base sm:text-lg font-bold focus:border-amber-400 focus:outline-none"
          />
        </div>

        <!-- Hora Inicio y Hora Término -->
        <div class="row g-3 mb-4">
          <div class="col-6">
            <label class="text-sm font-black text-emerald-400 text-uppercase mb-2 d-block tracking-wider">
              🟢 Hora Inicio
            </label>
            <input
              v-model="form.hora_inicio"
              type="time"
              class="w-full bg-slate-950 border-2 border-slate-700 rounded-xl px-3 py-3 text-white font-mono text-xl sm:text-2xl font-black focus:border-emerald-400 focus:outline-none text-center h-16 shadow-inner"
            />
          </div>
          <div class="col-6">
            <label class="text-sm font-black text-red-400 text-uppercase mb-2 d-block tracking-wider">
              🔴 Hora Término
            </label>
            <input
              v-model="form.hora_termino"
              type="time"
              class="w-full bg-slate-950 border-2 border-slate-700 rounded-xl px-3 py-3 text-white font-mono text-xl sm:text-2xl font-black focus:border-red-400 focus:outline-none text-center h-16 shadow-inner"
            />
          </div>
        </div>

        <!-- Tiempo de Colación (Selector Rápido) -->
        <div class="mb-4">
          <div class="d-flex align-center justify-space-between mb-2">
            <label class="text-sm font-black text-amber-300 text-uppercase tracking-wider">
              🥪 Tiempo de Colación
            </label>
            <span class="text-sm sm:text-base font-mono font-black text-amber-400 bg-amber-950/60 px-3 py-1 rounded-lg border border-amber-500/30">
              {{ form.minutos_colacion === 0 ? 'Sin Colación (0h)' : `${form.minutos_colacion} min (${horasColacionFormateadas}h)` }}
            </span>
          </div>
          <div class="d-flex ga-1.5 flex-wrap">
            <v-btn
              v-for="opcion in [0, 30, 45, 60, 90]"
              :key="opcion"
              size="large"
              :variant="form.minutos_colacion === opcion ? 'flat' : 'outlined'"
              :color="form.minutos_colacion === opcion ? 'amber' : 'grey-lighten-2'"
              class="flex-grow-1 font-black text-sm sm:text-base h-12 rounded-xl"
              @click="form.minutos_colacion = opcion"
            >
              {{ opcion === 0 ? '0m (Sin Colac.)' : `${opcion}m` }}
            </v-btn>
          </div>
        </div>

        <!-- Horómetros -->
        <div class="row g-3 mb-4">
          <div class="col-6">
            <label class="text-sm font-black text-amber-300 text-uppercase mb-2 d-block tracking-wider">
              ⚙️ Horómetro Inicio
            </label>
            <input
              v-model.number="form.horometro_inicio"
              type="number"
              step="0.1"
              placeholder="Ej: 3450.5"
              class="w-full bg-slate-950 border-2 border-slate-700 rounded-xl px-3 py-3 text-amber-300 font-mono text-xl sm:text-2xl font-black focus:border-amber-400 focus:outline-none text-center h-16 shadow-inner"
            />
          </div>
          <div class="col-6">
            <label class="text-sm font-black text-amber-300 text-uppercase mb-2 d-block tracking-wider">
              ⚙️ Horómetro Término
            </label>
            <input
              v-model.number="form.horometro_termino"
              type="number"
              step="0.1"
              placeholder="Ej: 3459.0"
              class="w-full bg-slate-950 border-2 border-slate-700 rounded-xl px-3 py-3 text-amber-300 font-mono text-xl sm:text-2xl font-black focus:border-amber-400 focus:outline-none text-center h-16 shadow-inner"
            />
          </div>
        </div>

        <!-- FOTOGRAFÍA DEL TABLERO / HORÓMETRO (OBLIGATORIA) -->
        <div class="mb-4 pa-4 rounded-xl border-2 border-slate-700 bg-slate-950/80">
          <div class="d-flex align-center justify-space-between mb-2">
            <label class="text-sm font-black text-amber-300 text-uppercase tracking-wider d-flex align-center ga-1.5">
              <span>📸 Foto del Tablero / Horómetro</span>
              <span class="text-red-400 font-bold">*</span>
            </label>
            <span v-if="form.foto_horometro" class="text-xs font-bold text-emerald-400 bg-emerald-950/70 px-2.5 py-1 rounded-md border border-emerald-500/40">
              ✅ Foto Cargada
            </span>
            <span v-else class="text-xs font-bold text-amber-400 bg-amber-950/70 px-2.5 py-1 rounded-md border border-amber-500/40">
              ⚠️ Obligatoria
            </span>
          </div>
          <p class="text-xs text-grey-lighten-1 mb-3">
            Captura una fotografía clara del horómetro digital o análogo en el panel de control de la grúa.
          </p>

          <!-- Input oculto para cámara -->
          <input
            ref="inputFotoHorometro"
            type="file"
            accept="image/*"
            capture="environment"
            class="d-none"
            @change="onFotoHorometroSeleccionada"
          />

          <!-- Preview de foto capturada -->
          <div v-if="form.foto_horometro" class="position-relative space-y-2">
            <div class="rounded-xl overflow-hidden border-2 border-amber-400 bg-black flex items-center justify-center max-h-64 shadow-md">
              <img
                :src="form.foto_horometro"
                alt="Foto Horómetro Grúa"
                class="w-full h-auto max-h-64 object-contain"
              />
            </div>
            <div class="d-flex ga-2 mt-2">
              <v-btn
                color="amber"
                variant="flat"
                size="large"
                class="flex-grow-1 font-bold text-sm h-12 rounded-xl"
                @click="abrirCamaraHorometro"
              >
                📸 Tomar otra foto
              </v-btn>
              <v-btn
                color="red-lighten-1"
                variant="outlined"
                size="large"
                class="font-bold text-sm h-12 rounded-xl px-4"
                @click="form.foto_horometro = null"
              >
                🗑️ Borrar
              </v-btn>
            </div>
          </div>

          <!-- Botón grande para tomar foto -->
          <div v-else>
            <v-btn
              color="amber"
              variant="flat"
              size="x-large"
              block
              class="font-black text-base h-14 rounded-xl d-flex align-center ga-2 text-slate-950"
              @click="abrirCamaraHorometro"
            >
              <span class="text-2xl">📸</span>
              <span>Fotografiar Horómetro del Tablero</span>
            </v-btn>
          </div>
        </div>

        <!-- PANEL REACTIVO DE CÁLCULO DE HORAS -->
        <div class="pa-4 rounded-2xl border-2 border-amber-500/50 bg-slate-950/90 mb-4 shadow-lg">
          <div class="d-flex align-center justify-space-between mb-3">
            <span class="text-xs sm:text-sm text-amber-400 text-uppercase font-black tracking-wider">⚡ Cálculo de Jornada</span>
            <span class="text-xs sm:text-sm text-grey-lighten-1 font-mono font-bold">Mínimo pactado: {{ horasMinimas }} hrs</span>
          </div>

          <div class="row text-center g-2">
            <div class="col-4">
              <div class="text-xs sm:text-sm text-grey-lighten-1 text-uppercase font-bold mb-1">Horas Efectivas</div>
              <div class="text-2xl sm:text-3xl font-mono font-black text-white">
                {{ calculoHoras.efectivas }}h
              </div>
            </div>
            <div class="col-4 border-x-2 border-white/20">
              <div class="text-xs sm:text-sm text-amber-400 text-uppercase font-black mb-1">A Facturar</div>
              <div class="text-2xl sm:text-3xl font-mono font-black text-amber-400">
                {{ calculoHoras.facturables }}h
              </div>
            </div>
            <div class="col-4">
              <div class="text-xs sm:text-sm text-grey-lighten-1 text-uppercase font-bold mb-1">Sobretiempo</div>
              <div
                class="text-2xl sm:text-3xl font-mono font-black"
                :class="calculoHoras.sobretiempo > 0 ? 'text-yellow-300' : 'text-slate-600'"
              >
                +{{ calculoHoras.sobretiempo }}h
              </div>
            </div>
          </div>

          <div v-if="calculoHoras.sobretiempo > 0" class="mt-3 text-center text-sm sm:text-base font-black text-amber-300 bg-amber-950/70 py-2 px-3 rounded-xl border border-amber-500/40">
            ⚠️ <strong>Sobretiempo detectado:</strong> +{{ calculoHoras.sobretiempo }} hrs sobre la base mínima de {{ horasMinimas }} hrs.
          </div>
        </div>

        <!-- Observaciones -->
        <div>
          <label class="text-sm font-black text-amber-300 text-uppercase mb-2 d-block tracking-wider">
            📝 Observaciones / Maniobras Realizadas
          </label>
          <textarea
            v-model="form.observacion_trabajo"
            rows="3"
            placeholder="Detalle de maniobras de izaje, tonelajes, radios, interferencias o condiciones de faena..."
            class="w-full bg-slate-900 border-2 border-slate-700 rounded-xl p-3 text-white text-sm sm:text-base focus:border-amber-400 focus:outline-none min-h-[90px]"
          ></textarea>
        </div>
      </v-card>

      <!-- BLOQUE 3: CONFORMIDAD Y FIRMA MANUAL DEL MANDANTE -->
      <v-card
        class="pa-5 rounded-2xl border-2 border-amber-500/50 text-white"
        style="background-color: #0b1120;"
        elevation="4"
      >
        <div class="d-flex align-center ga-3 mb-4">
          <span class="text-2xl">✍️</span>
          <div>
            <div class="text-lg sm:text-xl font-black text-amber-400">Conformidad del Mandante</div>
            <div class="text-xs sm:text-sm text-grey-lighten-1">Firma manuscrita del receptor en terreno</div>
          </div>
        </div>

        <div class="mb-3">
          <label class="text-sm font-black text-grey-lighten-1 text-uppercase mb-2 d-block tracking-wider">
            👤 Nombre Supervisor Mandante *
          </label>
          <input
            v-model="form.cliente_nombre"
            type="text"
            placeholder="Nombre y Apellido del supervisor"
            class="w-full bg-slate-900 border-2 border-slate-700 rounded-xl px-4 py-3 text-white text-base sm:text-lg font-bold focus:border-amber-400 focus:outline-none h-14"
          />
        </div>

        <div class="row g-3 mb-3">
          <div class="col-6">
            <label class="text-sm font-black text-grey-lighten-1 text-uppercase mb-2 d-block tracking-wider">
              🆔 RUT *
            </label>
            <input
              v-model="form.cliente_rut"
              type="text"
              placeholder="12.345.678-9"
              class="w-full bg-slate-900 border-2 border-slate-700 rounded-xl px-4 py-3 text-white text-base sm:text-lg font-bold focus:border-amber-400 focus:outline-none h-14"
            />
          </div>
          <div class="col-6">
            <label class="text-sm font-black text-grey-lighten-1 text-uppercase mb-2 d-block tracking-wider">
              💼 Cargo en Obra
            </label>
            <input
              v-model="form.cliente_cargo"
              type="text"
              placeholder="Ej: ITO / Jefe de Obra"
              class="w-full bg-slate-900 border-2 border-slate-700 rounded-xl px-4 py-3 text-white text-base sm:text-lg font-bold focus:border-amber-400 focus:outline-none h-14"
            />
          </div>
        </div>

        <!-- SignatureField (Reutilizado de la PWA) -->
        <SignatureField
          v-model="form.cliente_firma_canvas_base64"
          label="FIRMA MANUSCRITA DEL SUPERVISOR MANDANTE"
        />

        <div class="text-xs sm:text-sm text-grey-lighten-2 text-center my-3 bg-slate-900/80 py-2 px-3 rounded-xl border border-white/10">
          🛰️ Al sellar se capturará geoposición GPS inmutable y estampa de tiempo oficial.
        </div>

        <!-- Botón de Transmisión -->
        <v-btn
          block
          size="x-large"
          color="amber-darken-2"
          class="font-black text-uppercase rounded-2xl text-black py-5 mt-3 min-h-[64px] text-lg sm:text-xl shadow-xl shadow-amber-500/20 tracking-wider"
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
      <span class="text-base font-bold">{{ snackbar.text }}</span>
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
const inputFotoHorometro = ref(null)

const form = reactive({
  fecha_reporte: new Date().toISOString().split('T')[0],
  hora_inicio: '08:00',
  hora_termino: '18:00',
  minutos_colacion: 60,
  horometro_inicio: null,
  horometro_termino: null,
  foto_horometro: null,
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

// Acciones de cámara y compresión de imagen para el horómetro
const abrirCamaraHorometro = () => {
  if (inputFotoHorometro.value) {
    inputFotoHorometro.value.click()
  }
}

const onFotoHorometroSeleccionada = (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const MAX_WIDTH = 1280
      const MAX_HEIGHT = 1280
      let width = img.width
      let height = img.height

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width
          width = MAX_WIDTH
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height
          height = MAX_HEIGHT
        }
      }

      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      form.foto_horometro = canvas.toDataURL('image/jpeg', 0.82)
    }
    img.src = e.target.result
  }
  reader.readAsDataURL(file)
}

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
    form.foto_horometro &&
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
    } catch (e) {
      console.warn('Error leyendo perfil:', e)
    }

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
      foto_horometro: form.foto_horometro,
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
