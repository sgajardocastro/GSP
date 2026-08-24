<template>
  <div v-if="visible" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 animate-fadeIn">
    <div class="bg-[#0b1021] border border-emerald-500/40 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl shadow-black">
      
      <!-- CABECERA -->
      <div class="bg-[#050810] px-5 py-3.5 border-b border-white/10 flex justify-between items-center flex-shrink-0">
        <div class="flex items-center gap-3">
          <span class="text-2xl">🛰️</span>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-sm font-black text-white uppercase tracking-wider font-mono">
                Hoja de Ruta & Telemetría GPS — {{ viaje?.patente || 'S/P' }}
              </h3>
              <span 
                :class="viaje?.estado_trayecto === 'LLEGADO' || viaje?.estado_viaje === 'ARRIBADO_FAENA' 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                  : 'bg-blue-500/20 text-blue-300 border-blue-500/40 animate-pulse'" 
                class="text-[9.5px] font-mono font-bold uppercase px-2 py-0.5 rounded border"
              >
                {{ viaje?.estado_trayecto === 'LLEGADO' || viaje?.estado_viaje === 'ARRIBADO_FAENA' ? '🟢 Arribado a Faena' : '🛰️ En Ruta (GPS Live)' }}
              </span>
            </div>
            <p class="text-[11px] text-slate-400">
              {{ viaje?.marca }} {{ viaje?.modelo }} • Conductor: <strong class="text-emerald-400">{{ viaje?.chofer_nombre || 'Asignado' }}</strong> ({{ viaje?.chofer_email || 'Sin correo' }})
            </p>
          </div>
        </div>
        <button @click="cerrar" class="text-slate-400 hover:text-white text-xl p-1 font-bold cursor-pointer transition-colors">✕</button>
      </div>

      <!-- TARJETAS DE MÉTRICAS OPERATIVAS -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-2.5 p-4 bg-[#080d1a] border-b border-white/5 flex-shrink-0">
        <!-- Distancia -->
        <div class="bg-[#050810] border border-white/10 rounded-xl p-2.5 space-y-0.5">
          <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">📏 Distancia Recorrida</span>
          <div class="text-base font-black text-white font-mono flex items-baseline gap-1">
            <span>{{ distanciaRecorridaKm }}</span>
            <span class="text-xs text-amber-400 font-normal">KM</span>
          </div>
          <span class="text-[9.5px] text-slate-500 font-mono block">
            Salida: {{ viaje?.km_inicial || 0 }} ➔ Arribo: {{ viaje?.km_final || '---' }}
          </span>
        </div>

        <!-- Horas Motor -->
        <div class="bg-[#050810] border border-white/10 rounded-xl p-2.5 space-y-0.5">
          <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">⏱️ Horas de Motor</span>
          <div class="text-base font-black text-emerald-400 font-mono flex items-baseline gap-1">
            <span>{{ horasMotorDelta }}</span>
            <span class="text-xs text-slate-400 font-normal">HRS</span>
          </div>
          <span class="text-[9.5px] text-slate-500 font-mono block">
            Ini: {{ viaje?.horometro_inicial || 0 }} ➔ Fin: {{ viaje?.horometro_final || '---' }}
          </span>
        </div>

        <!-- Telemetría GPS -->
        <div class="bg-[#050810] border border-white/10 rounded-xl p-2.5 space-y-0.5">
          <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">🛰️ Pings de Ruta</span>
          <div class="text-base font-black text-blue-400 font-mono flex items-baseline gap-1">
            <span>{{ totalPings }}</span>
            <span class="text-xs text-slate-400 font-normal">pings</span>
          </div>
          <span class="text-[9.5px] text-slate-500 font-mono block">
            Vel. Máx: <strong class="text-emerald-400">{{ velocidadMaxima }} km/h</strong>
          </span>
        </div>

        <!-- Combustible Copec -->
        <div class="bg-[#050810] border border-white/10 rounded-xl p-2.5 space-y-0.5">
          <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">⛽ Carga Combustible</span>
          <div class="text-base font-black text-amber-400 font-mono flex items-baseline gap-1">
            <span>{{ viaje?.total_litros || 0 }}</span>
            <span class="text-xs text-slate-400 font-normal">Litros</span>
          </div>
          <span class="text-[9.5px] text-slate-500 font-mono block">
            Rendición: {{ formatearMoneda(viaje?.total_gasto || 0) }}
          </span>
        </div>
      </div>

      <!-- CUERPO PRINCIPAL: MAPA + TIMELINE -->
      <div class="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden min-h-[380px]">
        
        <!-- MAPA LEAFLET INTERACTIVO (7 COLUMNAS) -->
        <div class="lg:col-span-7 relative bg-slate-950 border-r border-white/10 h-72 lg:h-full min-h-[300px]">
          <div ref="mapContainer" class="w-full h-full z-0"></div>
          
          <!-- Badge flotante de coordenadas y estado -->
          <div class="absolute bottom-3 left-3 z-[1000] bg-black/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10 text-[10px] font-mono text-slate-300 shadow-lg">
            <span>🛰️ Ruta Georreferenciada</span>
            <span class="mx-1.5 text-slate-600">|</span>
            <span class="text-emerald-400">{{ totalPings }} waypoints GPS</span>
          </div>

          <!-- Leyenda de marcadores -->
          <div class="absolute top-3 right-3 z-[1000] bg-black/85 backdrop-blur-sm p-2 rounded-lg border border-white/10 text-[9.5px] space-y-1 shadow-lg font-sans">
            <div class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span class="text-slate-200">Salida Patio</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span class="text-slate-200">Pings en Ruta</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              <span class="text-slate-200">Llegada a Faena</span>
            </div>
          </div>
        </div>

        <!-- TIMELINE DE HITOS Y AUDITORÍA (5 COLUMNAS) -->
        <div class="lg:col-span-5 p-4 space-y-3.5 bg-[#070b16] overflow-y-auto max-h-[50vh] lg:max-h-full text-xs">
          <div class="flex justify-between items-center border-b border-white/10 pb-2">
            <span class="font-bold text-amber-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <span>📋</span> Bitácora Cronológica de Ruta
            </span>
            <span class="text-[9.5px] text-slate-400 font-mono">Token: {{ viaje?.token_viaje?.substring(0, 14) }}...</span>
          </div>

          <!-- Timeline Items -->
          <div class="space-y-3 relative pl-3 before:content-[''] before:absolute before:left-1 before:top-2 before:bottom-2 before:w-[2px] before:bg-white/10">
            
            <!-- 1. Salida de Patio -->
            <div class="relative pl-3 space-y-1">
              <div class="absolute -left-[14px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-[#070b16]"></div>
              <div class="flex justify-between items-baseline">
                <strong class="text-white text-xs">1. Salida de Patio (Base GSP)</strong>
                <span class="text-[10px] text-slate-400 font-mono">{{ formatearFechaHora(viaje?.fecha_salida_patio) }}</span>
              </div>
              <div class="bg-black/40 p-2 rounded-lg border border-white/5 text-[11px] font-mono text-slate-300 space-y-0.5">
                <div>Odómetro Salida: <strong class="text-amber-400">{{ viaje?.km_inicial || 0 }} KM</strong></div>
                <div>Horómetro Salida: <strong class="text-amber-400">{{ viaje?.horometro_inicial || 0 }} HRS</strong></div>
                <div class="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span>🔐 PIN Validado (SHA-256):</span>
                  <span class="truncate max-w-[120px]" :title="viaje?.pin_hash">{{ viaje?.pin_hash?.substring(0, 10) }}...</span>
                </div>
              </div>
            </div>

            <!-- 2. Pings en Ruta -->
            <div class="relative pl-3 space-y-1">
              <div class="absolute -left-[14px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-[#070b16]"></div>
              <div class="flex justify-between items-baseline">
                <strong class="text-white text-xs">2. Telemetría en Ruta (Convoy)</strong>
                <span class="text-[10px] text-blue-300 font-mono">{{ totalPings }} registros</span>
              </div>
              <div class="bg-black/40 p-2 rounded-lg border border-white/5 text-[11px] font-mono text-slate-300 space-y-0.5">
                <div class="flex justify-between">
                  <span>Velocidad Promedio:</span>
                  <strong class="text-white">{{ velocidadPromedio }} km/h</strong>
                </div>
                <div class="flex justify-between">
                  <span>Velocidad Máxima:</span>
                  <strong class="text-emerald-400">{{ velocidadMaxima }} km/h</strong>
                </div>
              </div>
            </div>

            <!-- 3. Carga de Combustible si existe -->
            <div v-if="Number(viaje?.total_litros) > 0" class="relative pl-3 space-y-1">
              <div class="absolute -left-[14px] top-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-[#070b16]"></div>
              <div class="flex justify-between items-baseline">
                <strong class="text-amber-300 text-xs">3. Carga de Combustible (Copec)</strong>
                <span class="text-[10px] text-amber-400 font-mono font-bold">{{ viaje?.total_litros }} L</span>
              </div>
              <div class="bg-black/40 p-2 rounded-lg border border-white/5 text-[11px] font-mono text-slate-300 space-y-0.5">
                <div>Litros Cargados: <strong class="text-white">{{ viaje?.total_litros }} Litros</strong></div>
                <div>Gasto Total: <strong class="text-emerald-400">{{ formatearMoneda(viaje?.total_gasto || 0) }}</strong></div>
              </div>
            </div>

            <!-- 4. Llegada a Faena -->
            <div class="relative pl-3 space-y-1">
              <div class="absolute -left-[14px] top-1 w-2.5 h-2.5 rounded-full" :class="viaje?.fecha_llegada_faena ? 'bg-emerald-500' : 'bg-slate-600'"></div>
              <div class="flex justify-between items-baseline">
                <strong class="text-white text-xs">4. Arribo a Faena (Destino)</strong>
                <span class="text-[10px] text-slate-400 font-mono">{{ formatearFechaHora(viaje?.fecha_llegada_faena) || 'En Tránsito' }}</span>
              </div>
              <div v-if="viaje?.fecha_llegada_faena" class="bg-black/40 p-2 rounded-lg border border-white/5 text-[11px] font-mono text-slate-300 space-y-1">
                <div>Odómetro Llegada: <strong class="text-amber-400">{{ viaje?.km_final || 0 }} KM</strong></div>
                <div>Horómetro Llegada: <strong class="text-amber-400">{{ viaje?.horometro_final || 0 }} HRS</strong></div>
                <div v-if="viaje?.obs_termino" class="text-[10.5px] text-slate-300 font-sans italic border-t border-white/5 pt-1">
                  "{{ viaje.obs_termino }}"
                </div>
              </div>
              <div v-else class="text-[10px] text-amber-400/80 italic">
                El vehículo se encuentra actualmente en desplazamiento hacia la obra.
              </div>
            </div>

          </div>
        </div>
      </div>

      <!-- FOOTER -->
      <div class="bg-[#050810] px-5 py-3 border-t border-white/10 flex justify-between items-center flex-shrink-0">
        <span class="text-[10.5px] text-slate-400 font-mono">
          Grúas San Pablo • Auditoría Telemetría Offline-First
        </span>
        <div class="flex items-center gap-2.5">
          <a 
            :href="`https://servidor.leanglobal.cl/lg-gsp-dev/viaje/${viaje?.token_viaje}`" 
            target="_blank" 
            class="px-3.5 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors no-underline cursor-pointer"
          >
            <span>📱</span> Abrir Hoja Conductor
          </a>
          <button 
            @click="cerrar" 
            type="button" 
            class="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = defineProps({
  visible: { type: Boolean, default: false },
  viaje: { type: Object, default: () => null }
})

const emit = defineEmits(['update:visible', 'close'])

const mapContainer = ref(null)
let map = null
let routePolyline = null
let startMarker = null
let endMarker = null
let pingMarkers = []

const cerrar = () => {
  emit('update:visible', false)
  emit('close')
}

// Métricas Computadas
const distanciaRecorridaKm = computed(() => {
  if (!props.viaje) return 0
  const ini = parseFloat(props.viaje.km_inicial) || 0
  const fin = parseFloat(props.viaje.km_final) || 0
  if (fin >= ini && ini > 0) return (fin - ini).toFixed(1)
  return 0
})

const horasMotorDelta = computed(() => {
  if (!props.viaje) return 0
  const ini = parseFloat(props.viaje.horometro_inicial) || 0
  const fin = parseFloat(props.viaje.horometro_final) || 0
  if (fin >= ini && ini > 0) return (fin - ini).toFixed(1)
  return 0
})

const totalPings = computed(() => {
  const pings = props.viaje?.pings_ruta
  if (Array.isArray(pings)) return pings.length
  return 0
})

const velocidadMaxima = computed(() => {
  const pings = props.viaje?.pings_ruta
  if (!Array.isArray(pings) || pings.length === 0) return 0
  const speeds = pings.map(p => parseFloat(p.kmh) || 0)
  return Math.max(...speeds, 0)
})

const velocidadPromedio = computed(() => {
  const pings = props.viaje?.pings_ruta
  if (!Array.isArray(pings) || pings.length === 0) return 0
  const speeds = pings.map(p => parseFloat(p.kmh) || 0).filter(s => s > 0)
  if (speeds.length === 0) return 0
  const sum = speeds.reduce((acc, s) => acc + s, 0)
  return Math.round(sum / speeds.length)
})

const formatearFechaHora = (isoStr) => {
  if (!isoStr) return ''
  try {
    const d = new Date(isoStr)
    return d.toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (e) {
    return isoStr
  }
}

const formatearMoneda = (val) => {
  const num = parseFloat(val) || 0
  return '$' + num.toLocaleString('es-CL')
}

// Inicialización de Mapa Leaflet
const inicializarMapa = () => {
  if (!mapContainer.value) return

  // Si el mapa ya existe, destruirlo
  if (map) {
    map.remove()
    map = null
  }

  // Coordenadas por defecto (Chile central / Chillán / San Pablo)
  let initialLat = -36.6172
  let initialLng = -72.1148

  if (props.viaje?.latitud_salida_patio && props.viaje?.longitud_salida_patio) {
    initialLat = parseFloat(props.viaje.latitud_salida_patio)
    initialLng = parseFloat(props.viaje.longitud_salida_patio)
  }

  map = L.map(mapContainer.value, {
    zoomControl: true,
    attributionControl: false
  }).setView([initialLat, initialLng], 14)

  // Capa base CartoDB Voyager / OSM
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 19
  }).addTo(map)

  dibujarRuta()
}

const dibujarRuta = () => {
  if (!map || !props.viaje) return

  // Limpiar marcadores y líneas anteriores
  if (routePolyline) map.removeLayer(routePolyline)
  if (startMarker) map.removeLayer(startMarker)
  if (endMarker) map.removeLayer(endMarker)
  pingMarkers.forEach(m => map.removeLayer(m))
  pingMarkers = []

  const latLngs = []

  // 1. Punto de Salida (Patio)
  if (props.viaje.latitud_salida_patio && props.viaje.longitud_salida_patio) {
    const startPt = [parseFloat(props.viaje.latitud_salida_patio), parseFloat(props.viaje.longitud_salida_patio)]
    latLngs.push(startPt)

    const startIcon = L.divIcon({
      className: 'custom-start-marker',
      html: `<div style="background-color: #10b981; width: 18px; height: 18px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 0 10px rgba(16,185,129,0.8);"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    })

    startMarker = L.marker(startPt, { icon: startIcon }).addTo(map)
    startMarker.bindPopup(`
      <div style="font-family: sans-serif; font-size: 11px;">
        <strong style="color: #10b981;">🚜 Salida de Patio Base</strong><br>
        Odómetro: ${props.viaje.km_inicial || 0} KM<br>
        Hora: ${formatearFechaHora(props.viaje.fecha_salida_patio)}
      </div>
    `)
  }

  // 2. Waypoints de Telemetría GPS en Ruta
  const pings = props.viaje.pings_ruta
  if (Array.isArray(pings) && pings.length > 0) {
    pings.forEach((p, idx) => {
      if (p.lat && p.lng) {
        const pt = [parseFloat(p.lat), parseFloat(p.lng)]
        latLngs.push(pt)

        const pingCircle = L.circleMarker(pt, {
          radius: 4,
          fillColor: '#3b82f6',
          color: '#ffffff',
          weight: 1.5,
          opacity: 0.9,
          fillOpacity: 0.8
        }).addTo(map)

        pingCircle.bindTooltip(`
          <div style="font-family: sans-serif; font-size: 10px;">
            🛰️ Ping #${idx + 1}<br>
            Vel: <strong>${p.kmh || 0} km/h</strong><br>
            Hora: ${formatearFechaHora(p.ts)}
          </div>
        `)
        pingMarkers.push(pingCircle)
      }
    })
  }

  // 3. Punto de Llegada (Faena)
  if (props.viaje.latitud_llegada_faena && props.viaje.longitud_llegada_faena) {
    const endPt = [parseFloat(props.viaje.latitud_llegada_faena), parseFloat(props.viaje.longitud_llegada_faena)]
    latLngs.push(endPt)

    const endIcon = L.divIcon({
      className: 'custom-end-marker',
      html: `<div style="background-color: #ef4444; width: 18px; height: 18px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 0 10px rgba(239,68,68,0.8);"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    })

    endMarker = L.marker(endPt, { icon: endIcon }).addTo(map)
    endMarker.bindPopup(`
      <div style="font-family: sans-serif; font-size: 11px;">
        <strong style="color: #ef4444;">🏁 Arribo a Faena (Destino)</strong><br>
        Odómetro: ${props.viaje.km_final || 0} KM<br>
        Hora: ${formatearFechaHora(props.viaje.fecha_llegada_faena)}
      </div>
    `)
  }

  // 4. Dibujar Polyline conectando todos los puntos
  if (latLngs.length > 1) {
    routePolyline = L.polyline(latLngs, {
      color: '#3b82f6',
      weight: 4,
      opacity: 0.85,
      dashArray: '8, 6',
      lineCap: 'round'
    }).addTo(map)

    map.fitBounds(routePolyline.getBounds(), { padding: [40, 40] })
  } else if (latLngs.length === 1) {
    map.setView(latLngs[0], 15)
  }
}

watch(() => props.visible, async (newVal) => {
  if (newVal) {
    await nextTick()
    setTimeout(() => {
      inicializarMapa()
      if (map) map.invalidateSize()
    }, 150)
  }
})

watch(() => props.viaje, () => {
  if (props.visible && map) {
    dibujarRuta()
  }
}, { deep: true })

onBeforeUnmount(() => {
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
}
.animate-fadeIn {
  animation: fadeIn 0.2s ease-out forwards;
}
:deep(.leaflet-popup-content-wrapper) {
  background: #0f172a !important;
  color: #f8fafc !important;
  border: 1px solid rgba(255,255,255,0.15) !important;
  border-radius: 8px !important;
}
:deep(.leaflet-popup-tip) {
  background: #0f172a !important;
}
:deep(.leaflet-tooltip) {
  background: #050810 !important;
  color: #f8fafc !important;
  border: 1px solid rgba(59,130,246,0.4) !important;
  border-radius: 6px !important;
  box-shadow: 0 4px 10px rgba(0,0,0,0.5) !important;
}
</style>
