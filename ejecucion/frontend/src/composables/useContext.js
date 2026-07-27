import { ref, watch } from 'vue'

// Estado global reactivo para el cliente seleccionado
const selectedClient = ref(null) // null significa "Vista Global Transmac"

const clients = [
  { id: 1, name: 'Codelco DMH', op: 'Minera Norte', code: 'CD-DMH' },
  { id: 2, name: 'BHP Spence', op: 'Cobre', code: 'BHP-SP' },
  { id: 3, name: 'AMS Centinela', op: 'Antofagasta Minerals', code: 'AMS-CT' },
  { id: 4, name: 'Collahuasi', op: 'Pica', code: 'CL-PC' },
]

export function useContext() {
  const setClient = (client) => {
    selectedClient.value = client
  }

  const resetContext = () => {
    selectedClient.value = null
  }

  return {
    selectedClient,
    clients,
    setClient,
    resetContext
  }
}
