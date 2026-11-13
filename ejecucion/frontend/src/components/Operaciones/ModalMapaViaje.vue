<template>
  <div v-if="visible" :class="esMaximizada ? 'fixed inset-0 z-[100] flex flex-col bg-[#0b1021] p-0 w-screen h-screen' : 'fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 animate-fadeIn'">
    <div :class="esMaximizada ? 'w-full h-full flex flex-col overflow-hidden bg-[#0b1021]' : 'bg-[#0b1021] border border-emerald-500/40 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl shadow-black'">
      
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
                :class="viaje?.estado_trayecto === 'LLEGADO' || viaje?.estado_trayecto === 'ARRIBADO' || viaje?.estado_viaje === 'ARRIBADO_FAENA' 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                  : 'bg-blue-500/20 text-blue-300 border-blue-500/40 animate-pulse'" 
                class="text-[9.5px] font-mono font-bold uppercase px-2 py-0.5 rounded border"
              >
                {{ viaje?.estado_trayecto === 'LLEGADO' || viaje?.estado_trayecto === 'ARRIBADO' || viaje?.estado_viaje === 'ARRIBADO_FAENA' ? '🟢 Arribado a Faena' : '🛰️ En Ruta (GPS Live)' }}
              </span>
            </div>
            <p class="text-[11px] text-slate-400">
              {{ viaje?.marca }} {{ viaje?.modelo }} • Conductor: <strong class="text-emerald-400">{{ viaje?.chofer_nombre || 'Asignado' }}</strong> ({{ viaje?.chofer_email || 'Sin correo' }})
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <!-- Botón Maximizar / Pantalla Completa -->
          <button 
            @click="toggleMaximizacion" 
            :title="esMaximizada ? 'Restaurar tamaño normal' : 'Maximizar mapa a pantalla completa'"
            type="button" 
            class="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-white/10"
          >
            <span>{{ esMaximizada ? '🗗' : '⛶' }}</span>
            <span class="hidden sm:inline">{{ esMaximizada ? 'Restaurar' : 'Pantalla Completa' }}</span>
          </button>
          <button @click="cerrar" class="text-slate-400 hover:text-white text-xl p-1 font-bold cursor-pointer transition-colors">✕</button>
        </div>
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
      <div class="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden min-h-[380px] h-full">
        
        <!-- MAPA LEAFLET INTERACTIVO -->
        <div 
          :class="[
            !mostrarBitacora ? 'lg:col-span-12' : (esMaximizada ? 'lg:col-span-9' : 'lg:col-span-7'),
            'relative bg-slate-950 h-72 lg:h-full min-h-[300px]',
            mostrarBitacora ? 'border-r border-white/10' : ''
          ]"
        >
          <div ref="mapContainer" class="w-full h-full z-0"></div>
          
          <!-- Controles Flotantes Superiores en Mapa (Centrar & Toggle Bitácora) -->
          <div class="absolute top-3 left-12 z-[1000] flex items-center gap-1.5">
            <button 
              @click="centrarRutaCompleta" 
              type="button" 
              title="Ajustar y encuadrar toda la ruta"
              class="bg-black/85 hover:bg-slate-800 text-slate-200 hover:text-white backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-white/10 text-[10.5px] font-bold shadow-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>🎯</span>
              <span>Centrar Ruta</span>
            </button>

            <button 
              @click="toggleBitacora" 
              type="button" 
              :title="mostrarBitacora ? 'Ocultar panel de bitácora para ver el mapa al 100%' : 'Mostrar panel de bitácora'"
              class="bg-black/85 hover:bg-slate-800 text-slate-200 hover:text-white backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-white/10 text-[10.5px] font-bold shadow-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>📋</span>
              <span>{{ mostrarBitacora ? 'Ocultar Bitácora' : 'Ver Bitácora' }}</span>
            </button>
          </div>

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

          <!-- Selector de Capas de Mapa (100% Gratuitas, sin API Key) -->
          <div class="absolute bottom-3 right-3 z-[1000] bg-black/85 backdrop-blur-sm p-1 rounded-xl border border-white/10 flex items-center gap-1 shadow-lg font-sans">
            <button 
              @click="cambiarCapa('osm')" 
              type="button" 
              :class="capaActiva === 'osm' ? 'bg-blue-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'"
              class="px-2.5 py-1 rounded-lg text-[10.5px] transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>🗺️</span> Calles (OSM)
            </button>
            <button 
              @click="cambiarCapa('satelite')" 
              type="button" 
              :class="capaActiva === 'satelite' ? 'bg-blue-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'"
              class="px-2.5 py-1 rounded-lg text-[10.5px] transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>🛰️</span> Satélite HD
            </button>
            <button 
              @click="cambiarCapa('topo')" 
              type="button" 
              :class="capaActiva === 'topo' ? 'bg-blue-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'"
              class="px-2.5 py-1 rounded-lg text-[10.5px] transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>⛰️</span> Topográfico
            </button>
          </div>
        </div>

        <!-- TIMELINE DE HITOS Y AUDITORÍA (COLAPSIBLE) -->
        <div 
          v-if="mostrarBitacora"
          :class="esMaximizada ? 'lg:col-span-3' : 'lg:col-span-5'"
          class="p-4 space-y-3.5 bg-[#070b16] overflow-y-auto max-h-[50vh] lg:max-h-full text-xs"
        >
          <div class="flex justify-between items-center border-b border-white/10 pb-2">
            <span class="font-bold text-amber-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <span>📋</span> Bitácora Cronológica de Ruta
            </span>
            <div class="flex items-center gap-1.5">
              <span class="text-[9.5px] text-slate-400 font-mono">Token: {{ viaje?.token_viaje?.substring(0, 10) }}...</span>
              <button 
                @click="toggleBitacora" 
                title="Ocultar panel" 
                class="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
              >✕</button>
            </div>
          </div>

          <!-- Timeline Items -->
          <div class="space-y-3 relative pl-3 before:content-[''] before:absolute before:left-1 before:top-2 before:bottom-2 before:w-[2px] before:bg-white/10">
            
            <!-- 1. Salida de Patio -->
            <div 
              @click="centrarEnPunto(viaje?.latitud_salida_patio, viaje?.longitud_salida_patio, 'salida')"
              title="Hacer clic para enfocar este punto en el mapa"
              class="relative pl-3 space-y-1 cursor-pointer group rounded-xl p-1.5 hover:bg-white/5 transition-colors"
            >
              <div class="absolute -left-[14px] top-2.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-[#070b16]"></div>
              <div class="flex justify-between items-baseline">
                <strong class="text-white text-xs group-hover:text-emerald-400 transition-colors flex items-center gap-1">
                  1. Salida de Patio (Base GSP)
                  <span class="text-[10px] text-emerald-400/80 font-normal">🔍</span>
                </strong>
                <span class="text-[10px] text-slate-400 font-mono">{{ formatearFechaHora(viaje?.fecha_salida_patio) }}</span>
              </div>
              <div class="bg-black/40 p-2 rounded-lg border border-white/5 text-[11px] font-mono text-slate-300 space-y-0.5">
                <div>Odómetro Salida: <strong class="text-amber-400">{{ viaje?.km_inicial || 0 }} KM</strong></div>
                <div>Horómetro Salida: <strong class="text-amber-400">{{ viaje?.horometro_inicial || 0 }} HRS</strong></div>
                <div class="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span>🔐 PIN Validado (SHA-256):</span>
                  <span class="truncate max-w-[120px]" :title="viaje?.pin_hash">{{ viaje?.pin_hash?.substring(0, 10) }}...</span>
                </div>
                <!-- Foto de Odómetro/Horómetro de Salida -->
                <div v-if="viaje?.foto_tablero_salida_path" class="mt-2 pt-2 border-t border-white/10">
                  <span class="text-[10px] text-slate-400 block mb-1">📸 Foto Tablero Salida:</span>
                  <a :href="viaje.foto_tablero_salida_path" target="_blank" class="block" @click.stop>
                    <img :src="viaje.foto_tablero_salida_path" alt="Tablero Salida" class="h-28 w-full object-cover rounded-lg border border-white/15 hover:border-emerald-400 transition-colors" />
                  </a>
                </div>
              </div>
            </div>

            <!-- 2. Carga de Combustible si existe -->
            <div v-if="Number(viaje?.total_litros) > 0" class="relative pl-3 space-y-1">
              <div class="absolute -left-[14px] top-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-[#070b16]"></div>
              <div class="flex justify-between items-baseline">
                <strong class="text-amber-300 text-xs">2. Carga de Combustible (Copec)</strong>
                <span class="text-[10px] text-amber-400 font-mono font-bold">{{ viaje?.total_litros }} L</span>
              </div>
              <div class="bg-black/40 p-2 rounded-lg border border-white/5 text-[11px] font-mono text-slate-300 space-y-0.5">
                <div>Litros Cargados: <strong class="text-white">{{ viaje?.total_litros }} Litros</strong></div>
                <div>Gasto Total: <strong class="text-emerald-400">{{ formatearMoneda(viaje?.total_gasto || 0) }}</strong></div>
              </div>
            </div>

            <!-- 3. Llegada a Faena -->
            <div 
              @click="centrarEnPunto(viaje?.latitud_llegada_faena, viaje?.longitud_llegada_faena, 'llegada')"
              title="Hacer clic para enfocar este punto en el mapa"
              class="relative pl-3 space-y-1 cursor-pointer group rounded-xl p-1.5 hover:bg-white/5 transition-colors"
            >
              <div class="absolute -left-[14px] top-2.5 w-2.5 h-2.5 rounded-full" :class="viaje?.fecha_llegada_faena ? 'bg-emerald-500' : 'bg-slate-600'"></div>
              <div class="flex justify-between items-baseline">
                <strong class="text-white text-xs group-hover:text-red-400 transition-colors flex items-center gap-1">
                  3. Arribo a Faena (Destino)
                  <span class="text-[10px] text-red-400/80 font-normal">🔍</span>
                </strong>
                <span class="text-[10px] text-slate-400 font-mono">{{ formatearFechaHora(viaje?.fecha_llegada_faena) || 'En Tránsito' }}</span>
              </div>
              <div v-if="viaje?.fecha_llegada_faena" class="bg-black/40 p-2 rounded-lg border border-white/5 text-[11px] font-mono text-slate-300 space-y-1">
                <div>Odómetro Llegada: <strong class="text-amber-400">{{ viaje?.km_final || 0 }} KM</strong></div>
                <div>Horómetro Llegada: <strong class="text-amber-400">{{ viaje?.horometro_final || 0 }} HRS</strong></div>
                <div v-if="viaje?.obs_termino" class="text-[10.5px] text-slate-300 font-sans italic border-t border-white/5 pt-1">
                  "{{ viaje.obs_termino }}"
                </div>
                <!-- Foto de Odómetro/Horómetro de Llegada -->
                <div v-if="viaje?.foto_tablero_llegada_path" class="mt-2 pt-2 border-t border-white/10">
                  <span class="text-[10px] text-slate-400 block mb-1">📸 Foto Tablero Llegada:</span>
                  <a :href="viaje.foto_tablero_llegada_path" target="_blank" class="block" @click.stop>
                    <img :src="viaje.foto_tablero_llegada_path" alt="Tablero Llegada" class="h-28 w-full object-cover rounded-lg border border-white/15 hover:border-emerald-400 transition-colors" />
                  </a>
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
          <button 
            @click="toggleMaximizacion" 
            type="button" 
            class="px-3.5 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-white/10 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>{{ esMaximizada ? '🗗' : '⛶' }}</span>
            <span>{{ esMaximizada ? 'Restaurar Ventana' : 'Maximizar Mapa' }}</span>
          </button>
          <a 
            :href="urlHojaConductor" 
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

const esMaximizada = ref(false)
const mostrarBitacora = ref(true)

const cerrar = () => {
  emit('update:visible', false)
  emit('close')
}

// Métricas Computadas
const urlHojaConductor = computed(() => {
  if (!props.viaje?.token_viaje) return '#'
  const isProd = typeof window !== 'undefined' && window.location.pathname.startsWith('/lg-gsp-prod')
  const base = isProd ? 'https://servidor.leanglobal.cl/lg-gsp-prod' : 'https://servidor.leanglobal.cl/lg-gsp-dev'
  return `${base}/viaje/${props.viaje.token_viaje}`
})

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

const calcularDistanciaMetros = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Consultar motor OSRM para ajustar secuencia de waypoints a calles y avenidas reales
const obtenerGeometriaVial = async (puntos) => {
  if (!puntos || puntos.length < 2) return null
  try {
    // Muestrear puntos representativos con separación mínima de 40m para no sobrecargar OSRM
    const sample = []
    sample.push(puntos[0])
    let lastP = puntos[0]
    for (let i = 1; i < puntos.length - 1; i++) {
      const p = puntos[i]
      const dist = calcularDistanciaMetros(lastP[0], lastP[1], p[0], p[1])
      if (dist >= 40) {
        sample.push(p)
        lastP = p
        if (sample.length >= 40) break
      }
    }
    sample.push(puntos[puntos.length - 1])

    const coordStr = sample.map(p => `${p[1].toFixed(6)},${p[0].toFixed(6)}`).join(';')
    const url = `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson`
    
    const resp = await fetch(url)
    if (!resp.ok) return null
    const json = await resp.json()
    if (json.code === 'Ok' && json.routes && json.routes[0]?.geometry?.coordinates) {
      // GeoJSON viene [lng, lat] -> Convertir a Leaflet [lat, lng]
      return json.routes[0].geometry.coordinates.map(c => [c[1], c[0]])
    }
  } catch (e) {
    console.warn('[OSRM Map-Matching] No se pudo ajustar a calles (usando ruta GPS directa):', e)
  }
  return null
}

let routeGlow = null

const capaActiva = ref('osm')
let currentTileLayer = null

const capasDisponibles = {
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }
  },
  satelite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    options: {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri'
    }
  },
  topo: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    options: {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri'
    }
  }
}

const cambiarCapa = (tipo) => {
  if (!map || !capasDisponibles[tipo]) return
  capaActiva.value = tipo
  if (currentTileLayer) {
    map.removeLayer(currentTileLayer)
  }
  const config = capasDisponibles[tipo]
  currentTileLayer = L.tileLayer(config.url, config.options).addTo(map)
}

const toggleMaximizacion = async () => {
  esMaximizada.value = !esMaximizada.value
  await nextTick()
  setTimeout(() => {
    if (map) {
      map.invalidateSize()
      centrarRutaCompleta()
    }
  }, 250)
}

const toggleBitacora = async () => {
  mostrarBitacora.value = !mostrarBitacora.value
  await nextTick()
  setTimeout(() => {
    if (map) {
      map.invalidateSize()
    }
  }, 200)
}

const centrarRutaCompleta = () => {
  if (!map) return
  if (routePolyline) {
    map.fitBounds(routePolyline.getBounds(), { padding: [50, 50] })
  } else if (props.viaje?.latitud_salida_patio && props.viaje?.longitud_salida_patio) {
    map.setView([parseFloat(props.viaje.latitud_salida_patio), parseFloat(props.viaje.longitud_salida_patio)], 14)
  }
}

const centrarEnPunto = (lat, lng, tipo) => {
  if (!map || !lat || !lng) return
  const pLat = parseFloat(lat)
  const pLng = parseFloat(lng)
  if (isNaN(pLat) || isNaN(pLng)) return
  map.flyTo([pLat, pLng], 17, { duration: 1.2 })
  if (tipo === 'salida' && startMarker) {
    startMarker.openPopup()
  } else if (tipo === 'llegada' && endMarker) {
    endMarker.openPopup()
  }
}

// Inicialización de Mapa Leaflet
const inicializarMapa = () => {
  if (!mapContainer.value) return

  // Si el mapa ya existe, destruirlo
  if (map) {
    map.remove()
    map = null
  }

  // Coordenadas por defecto (Base GSP Temuco)
  let initialLat = -38.7614
  let initialLng = -72.7163

  if (props.viaje?.latitud_salida_patio && props.viaje?.longitud_salida_patio) {
    initialLat = parseFloat(props.viaje.latitud_salida_patio)
    initialLng = parseFloat(props.viaje.longitud_salida_patio)
  } else if (props.viaje?.latitud_llegada_faena && props.viaje?.longitud_llegada_faena) {
    initialLat = parseFloat(props.viaje.latitud_llegada_faena)
    initialLng = parseFloat(props.viaje.longitud_llegada_faena)
  }

  map = L.map(mapContainer.value, {
    zoomControl: true,
    attributionControl: false
  }).setView([initialLat, initialLng], 14)

  // Capa base seleccionada (100% gratuita, sin API Key requerida)
  cambiarCapa(capaActiva.value || 'osm')

  dibujarRuta()
}

const dibujarRuta = async () => {
  if (!map || !props.viaje) return

  // Limpiar marcadores y líneas anteriores
  if (routePolyline) map.removeLayer(routePolyline)
  if (routeGlow) map.removeLayer(routeGlow)
  if (startMarker) map.removeLayer(startMarker)
  if (endMarker) map.removeLayer(endMarker)
  pingMarkers.forEach(m => map.removeLayer(m))
  pingMarkers = []

  const rawLatLngs = []

  // 1. Punto de Salida (Patio)
  if (props.viaje.latitud_salida_patio && props.viaje.longitud_salida_patio) {
    const startPt = [parseFloat(props.viaje.latitud_salida_patio), parseFloat(props.viaje.longitud_salida_patio)]
    rawLatLngs.push(startPt)

    const startIcon = L.divIcon({
      className: 'custom-start-marker',
      html: `<div style="background-color: #10b981; width: 20px; height: 20px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 0 12px rgba(16,185,129,0.9); display:flex; align-items:center; justify-content:center; font-size:10px;">🚜</div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
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

  // 2. Waypoints de Telemetría GPS en Ruta (Ordenados estrictamente por Timestamp)
  const rawPings = Array.isArray(props.viaje.pings_ruta) ? [...props.viaje.pings_ruta] : []
  rawPings.sort((a, b) => {
    const tA = new Date(a.timestamp || a.ts || 0).getTime()
    const tB = new Date(b.timestamp || b.ts || 0).getTime()
    return tA - tB
  })

  let prevPt = rawLatLngs[0] || null
  const validPings = []

  rawPings.forEach((p) => {
    const lat = parseFloat(p.latitud || p.lat)
    const lng = parseFloat(p.longitud || p.lng)
    if (!isNaN(lat) && !isNaN(lng)) {
      const curPt = [lat, lng]
      
      // Filtrar pings redundantes demasiado cercanos (< 12 metros)
      if (prevPt) {
        const d = calcularDistanciaMetros(prevPt[0], prevPt[1], lat, lng)
        if (d < 12) return
      }

      validPings.push({ ...p, lat, lng })
      rawLatLngs.push(curPt)
      prevPt = curPt

      const pingCircle = L.circleMarker(curPt, {
        radius: 4.5,
        fillColor: '#38bdf8',
        color: '#0369a1',
        weight: 1.5,
        opacity: 0.9,
        fillOpacity: 0.85
      }).addTo(map)

      pingCircle.bindTooltip(`
        <div style="font-family: sans-serif; font-size: 10px;">
          🛰️ <strong>Waypoint #${validPings.length}</strong><br>
          Velocidad: <strong>${p.velocidad_kmh || p.kmh || 0} km/h</strong><br>
          Precisión: <strong>±${p.accuracy || 10} m</strong><br>
          Hora: ${formatearFechaHora(p.timestamp || p.ts)}
        </div>
      `)
      pingMarkers.push(pingCircle)
    }
  })

  // 3. Punto de Llegada (Faena)
  if (props.viaje.latitud_llegada_faena && props.viaje.longitud_llegada_faena) {
    const endPt = [parseFloat(props.viaje.latitud_llegada_faena), parseFloat(props.viaje.longitud_llegada_faena)]
    rawLatLngs.push(endPt)

    const endIcon = L.divIcon({
      className: 'custom-end-marker',
      html: `<div style="background-color: #ef4444; width: 20px; height: 20px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 0 12px rgba(239,68,68,0.9); display:flex; align-items:center; justify-content:center; font-size:10px;">🏁</div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
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

  // 4. Map-Matching a Calles Viales Reales con OSRM
  let roadGeometry = null
  if (rawLatLngs.length > 1) {
    roadGeometry = await obtenerGeometriaVial(rawLatLngs)
  }

  const finalCoords = roadGeometry || rawLatLngs

  if (finalCoords.length > 1) {
    // Glow exterior de la ruta
    routeGlow = L.polyline(finalCoords, {
      color: '#38bdf8',
      weight: 8,
      opacity: 0.35,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map)

    // Trazo principal continuo ajustado a las calles
    routePolyline = L.polyline(finalCoords, {
      color: '#0284c7',
      weight: 4.5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map)

    map.fitBounds(routePolyline.getBounds(), { padding: [45, 45] })
  } else if (finalCoords.length === 1) {
    map.setView(finalCoords[0], 15)
  }
}

watch(() => props.visible, async (newVal) => {
  if (newVal) {
    esMaximizada.value = false
    mostrarBitacora.value = true
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
