<template>
  <div class="flex flex-col gap-2">
    <!-- Search Bar -->
    <div class="flex items-center gap-2 relative z-[1001]">
      <input 
        v-model="searchQuery" 
        @keyup.enter="buscarDireccion"
        type="text" 
        placeholder="Buscar dirección..." 
        class="flex-1 bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
      />
      <button 
        @click="buscarDireccion"
        class="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all disabled:opacity-50 border border-emerald-400/30"
        :disabled="isSearching"
      >
        <span v-if="isSearching">Buscando...</span>
        <span v-else>Buscar</span>
      </button>
    </div>

    <div class="w-full h-96 bg-slate-900 rounded-lg overflow-hidden border border-white/10 relative z-0">
      <div ref="mapContainer" class="w-full h-full z-0"></div>
      <div class="absolute top-2 right-2 z-[1000] bg-black/60 backdrop-blur-sm p-2 rounded text-[9px] text-slate-300 font-mono">
        Lat: {{ lat?.toFixed(5) || '---' }} | Lng: {{ lng?.toFixed(5) || '---' }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = defineProps({
  lat: { type: Number, default: null },
  lng: { type: Number, default: null }
})
const emit = defineEmits(['update:lat', 'update:lng'])

const mapContainer = ref(null)
let map = null
let marker = null

const searchQuery = ref('')
const isSearching = ref(false)

async function buscarDireccion() {
  if (!searchQuery.value.trim()) return
  isSearching.value = true
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery.value)}`)
    const data = await res.json()
    if (data && data.length > 0) {
      const { lat, lon } = data[0]
      const newLat = parseFloat(lat)
      const newLng = parseFloat(lon)
      map.setView([newLat, newLng], 15)
      marker.setLatLng([newLat, newLng])
      emit('update:lat', newLat)
      emit('update:lng', newLng)
    } else {
      alert('Dirección no encontrada')
    }
  } catch (error) {
    console.error('Error buscando dirección:', error)
  } finally {
    isSearching.value = false
  }
}

onMounted(() => {
  // Fix Leaflet icons issue in Vite
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });

  const defaultLat = -38.7396
  const defaultLng = -72.5901
  const initialLat = props.lat || defaultLat
  const initialLng = props.lng || defaultLng

  map = L.map(mapContainer.value).setView([initialLat, initialLng], 13)

  const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  })

  const satLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri'
  })

  // Añadir capa satélite por defecto
  satLayer.addTo(map)

  const baseMaps = {
    "Vista Satélite": satLayer,
    "Vista Mapa": osmLayer
  }

  L.control.layers(baseMaps).addTo(map)

  marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map)

  // Geolocation solo si no vienen coordenadas guardadas (es decir, son null)
  if (navigator.geolocation && !props.lat && !props.lng) {
    navigator.geolocation.getCurrentPosition((position) => {
      const currentLat = position.coords.latitude
      const currentLng = position.coords.longitude
      emit('update:lat', currentLat)
      emit('update:lng', currentLng)
      if (map) {
        map.setView([currentLat, currentLng], 13)
      }
      if (marker) {
        marker.setLatLng([currentLat, currentLng])
      }
    }, (err) => {
      console.warn("Geolocation warning (usando Temuco por defecto):", err)
    })
  }

  marker.on('dragend', () => {
    const position = marker.getLatLng()
    emit('update:lat', position.lat)
    emit('update:lng', position.lng)
  })

  map.on('click', (e) => {
    marker.setLatLng(e.latlng)
    emit('update:lat', e.latlng.lat)
    emit('update:lng', e.latlng.lng)
  })
  
  // Timeout para forzar redibujado cuando está dentro de un tab (Vue)
  setTimeout(() => {
    map.invalidateSize()
  }, 300)
})

onBeforeUnmount(() => {
  if (map) {
    map.remove()
  }
})

watch(() => [props.lat, props.lng], ([newLat, newLng]) => {
  if (marker && newLat && newLng) {
    const current = marker.getLatLng()
    if (current.lat !== newLat || current.lng !== newLng) {
      marker.setLatLng([newLat, newLng])
      map.setView([newLat, newLng])
    }
  }
})
</script>

<style>
.leaflet-container {
  z-index: 0 !important;
}
.leaflet-pane {
  z-index: 0 !important;
}
.leaflet-top, .leaflet-bottom {
  z-index: 10 !important;
}
</style>
