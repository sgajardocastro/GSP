<template>
  <div class="flex flex-col items-center justify-center h-full text-muted-foreground">
    <div class="p-8 rounded-full bg-muted/20 mb-4">
      <component :is="icon" class="w-12 h-12" />
    </div>
    <h2 class="text-2xl font-semibold text-foreground">{{ title }}</h2>
    <p>Este módulo está en proceso de diseño e implementación.</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { LayoutDashboard, ClipboardList, ShieldAlert, CheckCircle2, BarChart3, Database, Users } from 'lucide-vue-next'

const route = useRoute()

const title = computed(() => {
  const titles = {
    'inspecciones': 'Gestión de Inspección de Equipos',
    'observaciones': 'Gestión de Observación Conductual',
    'supervision': 'Workflow de Supervisión y Cierre',
    'sst-dashboard': 'Gestión SST, Salud y SGI',
    'datos': 'Infraestructura de Datos',
    'seguridad-nomina': 'Seguridad, Acceso y Nómina'
  }
  return titles[route.name] || 'Módulo'
})

const icon = computed(() => {
  const icons = {
    'inspecciones': ClipboardList,
    'observaciones': ShieldAlert,
    'supervision': CheckCircle2,
    'sst-dashboard': BarChart3,
    'datos': Database,
    'seguridad-nomina': Users
  }
  return icons[route.name] || LayoutDashboard
})
</script>
