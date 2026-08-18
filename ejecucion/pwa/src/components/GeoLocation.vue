<template>
  <div class="geolocation-wrapper py-2 px-1 mb-2">
    <!-- ==========================================
         1. MAPA 1: UBICACIÓN DE LA OBRA (REFERENCIA)
         ========================================== -->
    <div class="mb-4">
      <div class="d-flex align-center justify-space-between mb-2">
        <span class="text-caption font-weight-bold uppercase tracking-wider text-slate-300">
          📍 Ubicación de la Obra
        </span>
        <span v-if="local.lat && local.lng" class="text-caption text-emerald-400 font-mono">
          Destino / Faena
        </span>
      </div>

      <!-- Contenedor del Mapa 1 (Destino) -->
      <div v-show="local.lat && local.lng" class="mb-3">
        <div ref="mapContainer" class="map-container"></div>
        
        <div class="mt-2 text-caption text-slate-400 d-flex justify-space-between font-mono">
          <span><strong>Lat:</strong> {{ Number(local.lat).toFixed(6) }}</span>
          <span><strong>Lng:</strong> {{ Number(local.lng).toFixed(6) }}</span>
        </div>

        <!-- Botones de Navegación GPS (Google Maps & Waze) DEBAJO del Mapa 1 -->
        <div class="mt-3 d-flex gap-2">
          <a 
            :href="`https://www.google.com/maps/dir/?api=1&destination=${local.lat},${local.lng}`" 
            target="_blank" 
            class="v-btn nav-btn-gmaps"
          >
            🗺️ Navegar con Google Maps
          </a>
          <a 
            :href="`https://waze.com/ul?ll=${local.lat},${local.lng}&navigate=yes`" 
            target="_blank" 
            class="v-btn nav-btn-waze"
          >
            🚙 Navegar con Waze
          </a>
        </div>
      </div>

      <!-- Aviso si la obra no tiene coordenadas registradas -->
      <div v-if="!local.lat || !local.lng" class="p-3 mb-3 bg-slate-900/60 border border-white/5 rounded-lg text-center">
        <p class="text-caption text-slate-400 mb-0">Sin coordenadas geográficas fijadas para esta obra.</p>
      </div>
    </div>

    <!-- ==========================================
         2. BOTÓN: REGISTRO GEOLOCALIZACIÓN VISITA
         ========================================== -->
    <div class="mb-4">
      <button 
        type="button"
        class="geo-capture-btn w-100"
        :disabled="capturandoGeo"
        @click="obtenerUbicacionVisita"
      >
        <span v-if="capturandoGeo" class="d-flex align-center justify-center gap-2">
          <v-icon size="18" class="animate-spin">mdi-loading</v-icon>
          <span>Obteniendo ubicación GPS en tiempo real...</span>
        </span>
        <span v-else class="d-flex align-center justify-center gap-2">
          <v-icon size="18" color="#10b981">mdi-crosshairs-gps</v-icon>
          <span>{{ geoVisitaRegistrada ? 'Actualizar Geolocalización Visita' : '📍 Registro Geolocalización Visita' }}</span>
        </span>
      </button>
    </div>

    <!-- ==========================================
         3. MAPA 2: UBICACIÓN ACTUAL DEL TÉCNICO
         ========================================== -->
    <div v-show="geoVisitaRegistrada" class="actual-location-card p-3 rounded-xl bg-[#090f1d] border border-emerald-500/30">
      <div class="d-flex align-center justify-space-between mb-2">
        <span class="text-caption font-weight-bold uppercase tracking-wider text-emerald-400 d-flex align-center gap-1.5">
          <v-icon size="16" color="#10b981">mdi-map-marker-check</v-icon>
          Ubicación Actual del Técnico
        </span>
        <span class="text-[11px] text-slate-400 font-mono">
          {{ geoVisitaRegistrada?.hora || '' }}
        </span>
      </div>

      <!-- Contenedor del Mapa 2 (Ubicación Actual) -->
      <div ref="mapActualContainer" class="map-container actual-map mb-2"></div>

      <div class="text-caption text-slate-300 font-mono d-flex justify-space-between pt-1">
        <span><strong>Lat Actual:</strong> {{ Number(geoVisitaRegistrada?.lat || 0).toFixed(6) }}</span>
        <span><strong>Lng Actual:</strong> {{ Number(geoVisitaRegistrada?.lng || 0).toFixed(6) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import L from 'leaflet'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ lat: null, lng: null })
  },
  label: {
    type: String,
    default: 'Ubicación de la Obra'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  geoVisita: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'update:geoVisita'])

const local = ref({ lat: props.modelValue?.lat || null, lng: props.modelValue?.lng || null })
const capturandoGeo = ref(false)
const geoVisitaRegistrada = ref(props.geoVisita || null)

// Referencias de elementos DOM
const mapContainer = ref(null)
const mapActualContainer = ref(null)

// Instancias Leaflet
let leafletMap = null
let leafletMarker = null
let accuracyCircle = null

let leafletMapActual = null
let leafletMarkerActual = null
let accuracyCircleActual = null

let resizeObserver = null
let intersectionObserver = null

function setupVisibilityWatcher() {
  if (!mapContainer.value) return

  if (typeof IntersectionObserver !== 'undefined' && !intersectionObserver) {
    intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          nextTick(() => {
            if (leafletMap) {
              leafletMap.invalidateSize()
              if (local.value.lat && local.value.lng) {
                leafletMap.setView([local.value.lat, local.value.lng], 16)
              }
            }
            if (leafletMapActual && geoVisitaRegistrada.value) {
              leafletMapActual.invalidateSize()
              leafletMapActual.setView([geoVisitaRegistrada.value.lat, geoVisitaRegistrada.value.lng], 16)
            }
          })
        }
      })
    }, { threshold: 0.1 })
    intersectionObserver.observe(mapContainer.value)
  }

  if (typeof ResizeObserver !== 'undefined' && !resizeObserver) {
    resizeObserver = new ResizeObserver(() => {
      if (leafletMap) leafletMap.invalidateSize()
      if (leafletMapActual) leafletMapActual.invalidateSize()
    })
    resizeObserver.observe(mapContainer.value)
  }
}

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    const nextLat = newVal.lat || null
    const nextLng = newVal.lng || null
    if (nextLat !== local.value.lat || nextLng !== local.value.lng) {
      local.value = { lat: nextLat, lng: nextLng }
    }
    if (newVal.geoVisita && (!geoVisitaRegistrada.value || geoVisitaRegistrada.value.lat !== newVal.geoVisita.lat)) {
      geoVisitaRegistrada.value = newVal.geoVisita
      nextTick(() => initActualMap())
    }
  }
}, { deep: true })

watch(() => props.geoVisita, (newVal) => {
  if (newVal && newVal.lat && newVal.lng) {
    geoVisitaRegistrada.value = newVal
    nextTick(() => initActualMap())
  }
}, { deep: true, immediate: true })

watch(local, (val) => {
  emit('update:modelValue', val)
  if (val.lat && val.lng) {
    nextTick(() => {
      initMap()
    })
  } else {
    destroyMap()
  }
}, { deep: true })

// ==========================================
// MAPA 1: OBRA DE REFERENCIA
// ==========================================
function initMap() {
  if (!mapContainer.value) return
  
  const { lat, lng } = local.value
  if (!lat || !lng) return

  if (leafletMap) {
    leafletMap.setView([lat, lng], 16)
    updateMarker(lat, lng)
    nextTick(() => {
      if (leafletMap) leafletMap.invalidateSize()
    })
    return
  }

  leafletMap = L.map(mapContainer.value, {
    zoomControl: true,
    dragging: true,
    touchZoom: true,
    scrollWheelZoom: false
  }).setView([lat, lng], 16)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(leafletMap)

  updateMarker(lat, lng)

  nextTick(() => {
    if (leafletMap) {
      leafletMap.invalidateSize()
    }
  })

  setupVisibilityWatcher()
}

function updateMarker(lat, lng) {
  if (!leafletMap) return

  if (leafletMarker) leafletMarker.remove()
  if (accuracyCircle) accuracyCircle.remove()

  accuracyCircle = L.circle([lat, lng], {
    radius: 35,
    color: '#0284c7',
    fillColor: '#0284c7',
    fillOpacity: 0.15,
    weight: 1
  }).addTo(leafletMap)

  leafletMarker = L.circleMarker([lat, lng], {
    radius: 8,
    fillColor: '#ef4444',
    color: '#FFFFFF',
    weight: 2,
    opacity: 1,
    fillOpacity: 0.95
  }).addTo(leafletMap)
}

function destroyMap() {
  if (leafletMarker) leafletMarker.remove()
  if (accuracyCircle) accuracyCircle.remove()
  if (leafletMap) {
    leafletMap.remove()
    leafletMap = null
  }
}

// ==========================================
// MAPA 2: UBICACIÓN ACTUAL DEL TÉCNICO
// ==========================================
function initActualMap() {
  if (!mapActualContainer.value || !geoVisitaRegistrada.value) return

  const { lat, lng } = geoVisitaRegistrada.value
  if (!lat || !lng) return

  if (leafletMapActual) {
    leafletMapActual.setView([lat, lng], 16)
    updateActualMarker(lat, lng)
    nextTick(() => {
      if (leafletMapActual) leafletMapActual.invalidateSize()
    })
    return
  }

  leafletMapActual = L.map(mapActualContainer.value, {
    zoomControl: true,
    dragging: true,
    touchZoom: true,
    scrollWheelZoom: false
  }).setView([lat, lng], 16)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(leafletMapActual)

  updateActualMarker(lat, lng)

  nextTick(() => {
    if (leafletMapActual) {
      leafletMapActual.invalidateSize()
    }
  })
}

function updateActualMarker(lat, lng) {
  if (!leafletMapActual) return

  if (leafletMarkerActual) leafletMarkerActual.remove()
  if (accuracyCircleActual) accuracyCircleActual.remove()

  accuracyCircleActual = L.circle([lat, lng], {
    radius: 25,
    color: '#10b981',
    fillColor: '#10b981',
    fillOpacity: 0.2,
    weight: 1
  }).addTo(leafletMapActual)

  leafletMarkerActual = L.circleMarker([lat, lng], {
    radius: 9,
    fillColor: '#10b981',
    color: '#FFFFFF',
    weight: 2,
    opacity: 1,
    fillOpacity: 0.95
  }).addTo(leafletMapActual)
}

function destroyActualMap() {
  if (leafletMarkerActual) leafletMarkerActual.remove()
  if (accuracyCircleActual) accuracyCircleActual.remove()
  if (leafletMapActual) {
    leafletMapActual.remove()
    leafletMapActual = null
  }
}

// ==========================================
// CAPTURA GPS EN VIVO
// ==========================================
function obtenerUbicacionVisita() {
  if (navigator.geolocation) {
    capturandoGeo.value = true
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        capturandoGeo.value = false
        const latVisita = pos.coords.latitude
        const lngVisita = pos.coords.longitude
        const now = new Date()
        const horaStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

        const payload = {
          lat: latVisita,
          lng: lngVisita,
          hora: horaStr,
          timestamp: now.toISOString()
        }

        geoVisitaRegistrada.value = payload

        emit('update:geoVisita', payload)
        emit('update:modelValue', {
          ...(typeof props.modelValue === 'object' ? props.modelValue : {}),
          lat: local.value.lat,
          lng: local.value.lng,
          geoVisita: payload
        })
        console.log('[GeoLocation] Registro Geolocalización Visita exitoso:', payload)

        nextTick(() => {
          initActualMap()
        })
      },
      (err) => {
        capturandoGeo.value = false
        console.error('Error al capturar geolocalización:', err.message)
        alert('No se pudo obtener la geolocalización del dispositivo. Verifique los permisos de GPS.')
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0
      }
    )
  } else {
    alert('La geolocalización no está soportada en este navegador.')
  }
}

onMounted(() => {
  if (local.value.lat && local.value.lng) {
    nextTick(() => {
      initMap()
    })
  }
  if (geoVisitaRegistrada.value?.lat && geoVisitaRegistrada.value?.lng) {
    nextTick(() => {
      initActualMap()
    })
  }
})

onBeforeUnmount(() => {
  destroyMap()
  destroyActualMap()
  if (intersectionObserver) {
    intersectionObserver.disconnect()
    intersectionObserver = null
  }
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})
</script>

<style scoped>
@import "~leaflet/dist/leaflet.css";

.map-container {
  width: 100%;
  height: 200px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
  z-index: 1;
}

.actual-map {
  border: 1px solid rgba(16, 185, 129, 0.3);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
}

.nav-btn-gmaps {
  background-color: #1a73e8 !important;
  color: #ffffff !important;
  font-weight: 700 !important;
  font-size: 0.75rem !important;
  text-decoration: none;
  flex: 1;
  text-align: center;
  padding: 8px 12px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.nav-btn-waze {
  background-color: #33ccff !important;
  color: #000000 !important;
  font-weight: 900 !important;
  font-size: 0.75rem !important;
  text-decoration: none;
  flex: 1;
  text-align: center;
  padding: 8px 12px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.geo-capture-btn {
  background: linear-gradient(135deg, #065f46 0%, #047857 100%);
  color: #ffffff;
  border: 1px solid #10b981;
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 0.825rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
  transition: all 0.15s ease-in-out;
}

.geo-capture-btn:hover {
  background: linear-gradient(135deg, #047857 0%, #059669 100%);
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.35);
}

.geo-capture-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.actual-location-card {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}
</style>