import { reactive } from 'vue'

const initialCollapsed = typeof window !== 'undefined' && localStorage.getItem('gsp_sidebar_collapsed') === 'true'

export const navStore = reactive({
  activeTab: 'planificacion', // 'planificacion' | 'dashboard'
  isCollapsed: initialCollapsed,
  activeEmpresa: 9, // ID Empresa por defecto (San Pablo = 9) (RF-4.1)
  setActiveTab(tab) {
    this.activeTab = tab
  },
  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed
    if (typeof window !== 'undefined') {
      localStorage.setItem('gsp_sidebar_collapsed', String(this.isCollapsed))
    }
  },
  setActiveEmpresa(id) {
    this.activeEmpresa = Number(id)
  }
})

