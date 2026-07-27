// stores/userDetail.js
import { defineStore } from 'pinia'

export const useUserDetailStore = defineStore('userDetail', {
  state: () => ({
    userDetail: null,   // ✅ null cuando no hay sesión
  }),
  persist: true,        // ✅ el plugin se encarga de guardar/cargar
})
