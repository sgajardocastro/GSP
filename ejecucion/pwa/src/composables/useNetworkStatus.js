// src/composables/useNetworkStatus.js
import { ref, onMounted, onBeforeUnmount } from 'vue'

// 🔁 Estado compartido entre todos los componentes que usen este composable
const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)

export function useNetworkStatus () {
  const updateStatus = () => {
    isOnline.value = navigator.onLine
  }

  onMounted(() => {
    // Estado inicial
    updateStatus()

    // Escuchar cambios de conexión
    window.addEventListener('online', updateStatus)
    window.addEventListener('offline', updateStatus)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('online', updateStatus)
    window.removeEventListener('offline', updateStatus)
  })

  return {
    isOnline
  }
}
