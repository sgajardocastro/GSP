import { reactive } from 'vue'

export const navStore = reactive({
  activeTab: 'planificacion', // 'planificacion' | 'dashboard'
  isCollapsed: false,
  activeEmpresa: 9, // ID Empresa por defecto (San Pablo = 9) (RF-4.1)
  setActiveTab(tab) {
    this.activeTab = tab
  },
  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed
  },
  setActiveEmpresa(id) {
    this.activeEmpresa = Number(id)
  }
})
