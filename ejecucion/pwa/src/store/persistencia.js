// Utilities
import { defineStore } from 'pinia'

export const usePersistenciaStore = defineStore('persistencia', {
  state: () => ({
    id: 1000
  }),
  persist: true,
})
