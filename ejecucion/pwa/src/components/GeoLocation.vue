<template>
  <div>
    <v-btn 
      color="#2A3C67" 
      style="box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.3);"
      class="w-100"
      :disabled="disabled"
      @click="obtenerUbicacion"
    >
      Obtener ubicación
    </v-btn>

    <!-- Contenedor del Mapa Leaflet -->
    <div v-show="local.lat && local.lng" class="mt-4">
      <div ref="mapContainer" class="map-container"></div>
      
      <div class="mt-2 text-subtitle-2 text-grey-darken-1 d-flex justify-space-between">
        <span><strong>Latitud:</strong> {{ local.lat }}</span>
        <span><strong>Longitud:</strong> {{ local.lng }}</span>
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
    default: 'Ubicación GPS'
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const local = ref({ lat: props.modelValue?.lat || null, lng: props.modelValue?.lng || null })
const mapContainer = ref(null)
let leafletMap = null
let leafletMarker = null
let accuracyCircle = null

let resizeObserver = null
let intersectionObserver = null

function setupVisibilityWatcher() {
  if (!mapContainer.value) return

  if (typeof IntersectionObserver !== 'undefined' && !intersectionObserver) {
    intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && leafletMap) {
          nextTick(() => {
            if (leafletMap) {
              leafletMap.invalidateSize()
              const { lat, lng } = local.value
              if (lat && lng) {
                leafletMap.setView([lat, lng], 16)
              }
            }
          })
        }
      })
    }, { threshold: 0.1 })
    intersectionObserver.observe(mapContainer.value)
  }

  if (typeof ResizeObserver !== 'undefined' && !resizeObserver) {
    resizeObserver = new ResizeObserver(() => {
      if (leafletMap) {
        leafletMap.invalidateSize()
      }
    })
    resizeObserver.observe(mapContainer.value)
  }
}

// Sincronizar props externas (de padre a hijo)
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    const nextLat = newVal.lat || null
    const nextLng = newVal.lng || null
    if (nextLat !== local.value.lat || nextLng !== local.value.lng) {
      local.value = { lat: nextLat, lng: nextLng }
    }
  }
}, { deep: true })

// Reaccionar a cambios locales para emitir y dibujar el mapa
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

function initMap() {
  if (!mapContainer.value) return
  
  const { lat, lng } = local.value
  if (!lat || !lng) return

  // Si el mapa ya está instanciado, simplemente re-centramos y actualizamos marcadores
  if (leafletMap) {
    leafletMap.setView([lat, lng], 16)
    updateMarker(lat, lng)
    // Forzar ajuste de tamaño por si el contenedor cambió de visibilidad
    nextTick(() => {
      if (leafletMap) leafletMap.invalidateSize()
    })
    return
  }

  // Crear la instancia del mapa
  leafletMap = L.map(mapContainer.value, {
    zoomControl: true,
    dragging: true,
    touchZoom: true,
    scrollWheelZoom: false // Evita zoom molesto al hacer scroll sobre la pantalla
  }).setView([lat, lng], 16)

  // Agregar capa base de OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(leafletMap)

  updateMarker(lat, lng)

  // Invalidar tamaño inmediatamente para renderizar correctamente los tiles (evita fondo gris)
  nextTick(() => {
    if (leafletMap) {
      leafletMap.invalidateSize()
    }
  })

  setupVisibilityWatcher()
}

function updateMarker(lat, lng) {
  if (!leafletMap) return

  // Si ya existen el marcador o círculo, los removemos para volverlos a crear
  if (leafletMarker) {
    leafletMarker.remove()
  }
  if (accuracyCircle) {
    accuracyCircle.remove()
  }

  // Círculo concéntrico de precisión visual (estilo GPS móvil)
  accuracyCircle = L.circle([lat, lng], {
    radius: 35, // Radio visual en metros
    color: '#2A3C67',
    fillColor: '#2A3C67',
    fillOpacity: 0.15,
    weight: 1
  }).addTo(leafletMap)

  // Marcador tipo punto de alta definición (evita imágenes 404 en bundles de PWA)
  leafletMarker = L.circleMarker([lat, lng], {
    radius: 7,
    fillColor: '#E1251B', // Color corporativo Terracon/rojo sst
    color: '#FFFFFF',
    weight: 2,
    opacity: 1,
    fillOpacity: 0.95
  }).addTo(leafletMap)
}

function destroyMap() {
  if (leafletMap) {
    leafletMap.remove()
    leafletMap = null
    leafletMarker = null
    accuracyCircle = null
  }
}

function obtenerUbicacion() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        local.value.lat = pos.coords.latitude
        local.value.lng = pos.coords.longitude
      },
      (err) => {
        console.error('Error al obtener ubicación:', err.message)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  } else {
    console.warn('La geolocalización no está soportada en este navegador.')
  }
}

onMounted(() => {
  if (local.value.lat && local.value.lng) {
    nextTick(() => {
      initMap()
    })
  }
})

onBeforeUnmount(() => {
  destroyMap()
  if (intersectionObserver) {
    intersectionObserver.disconnect()
  }
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})
</script>

<style scoped>
@import "~leaflet/dist/leaflet.css";

.map-container {
  width: 100%;
  height: 220px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  z-index: 1;
}
</style>