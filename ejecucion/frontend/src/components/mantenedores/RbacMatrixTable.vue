<template>
  <div class="border border-white/10 rounded-2xl overflow-hidden bg-white/5 h-full flex flex-col">
    <!-- Header -->
    <div class="px-4 py-2.5 bg-white/5 border-b border-white/10 flex justify-between items-center text-xs font-black uppercase tracking-wider text-emerald-400 flex-shrink-0">
      <div class="flex items-center gap-2">
        <ShieldCheck class="w-4 h-4 text-emerald-400" />
        <span>Permisos y Roles de Aplicación (GSP RBAC)</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2.5 py-0.5 rounded-full">
          {{ selectedCount }} Seleccionados
        </span>
      </div>
    </div>
    
    <!-- Body con Grupos de Roles - 100% visible sin scrollbars -->
    <div class="p-3.5 space-y-3">
      <div v-for="grupo in roleGroups" :key="grupo.name" class="space-y-1.5">
        <div class="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-zinc-300 border-b border-white/5 pb-1">
          <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>{{ grupo.name }}</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div
            v-for="rol in grupo.roles"
            :key="rol.code"
            @click="toggleRole(rol.code)"
            :class="[
              'px-3 py-2 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between gap-2.5',
              hasRole(rol.code)
                ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                : 'bg-zinc-900/60 border-white/5 hover:border-white/20 hover:bg-white/[0.03]'
            ]"
          >
            <div class="flex items-center gap-2.5 min-w-0 flex-1">
              <div
                :class="[
                  'w-4 h-4 rounded border flex items-center justify-center transition-all flex-shrink-0',
                  hasRole(rol.code)
                    ? 'bg-emerald-500 border-emerald-400'
                    : 'bg-white/5 border-white/20'
                ]"
              >
                <Check v-if="hasRole(rol.code)" class="w-3 h-3 text-zinc-950 stroke-[4]" />
              </div>

              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold text-white tracking-wide truncate">{{ rol.name }}</span>
                  <code class="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                    {{ rol.code }}
                  </code>
                </div>
                <p class="text-[10px] text-zinc-400 truncate leading-tight mt-0.5">{{ rol.desc }}</p>
              </div>
            </div>

            <span :class="['text-[8px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider flex-shrink-0', rol.badgeColor]">
              {{ rol.badge }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Check, ShieldCheck } from 'lucide-vue-next'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  rolesCatalog: { type: Array, default: () => [] },
  permissions: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:modelValue'])

const roleGroups = [
  {
    name: 'Gestión Comercial & Alcance (Scope)',
    roles: [
      {
        code: 'ADMIN',
        name: 'Administrador de Plataforma',
        desc: 'Acceso total e irrestricto a todos los módulos, empresas, configuraciones y mantenedores del sistema.',
        badge: 'TOTAL / GLOBAL',
        badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30'
      },
      {
        code: 'ADM_COM',
        name: 'Administrador Comercial',
        desc: 'Visibilidad global total de todas las cotizaciones, fichas y clientes de todas las empresas.',
        badge: 'COMERCIAL GLOBAL',
        badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
      },
      {
        code: 'COMERCIAL',
        name: 'Ejecutivo Comercial',
        desc: 'Visibilidad restringida exclusivamente a sus propias oportunidades y cotizaciones creadas.',
        badge: 'MIS COTIZACIONES',
        badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
      },
      {
        code: 'COORD',
        name: 'Coordinador de Operaciones',
        desc: 'Gestión y coordinación de solicitudes de visitas a terreno, asignación de equipos y logística.',
        badge: 'COORDINACIÓN',
        badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30'
      }
    ]
  },
  {
    name: 'Operaciones, Control de Gestión & Prevención (GSP)',
    roles: [
      {
        code: 'GSP_APROB',
        name: 'Jefe de Operaciones / Aprobador',
        desc: 'Torre de Control Kanban, asignación de flota/personal, aprobación operativa y 2da firma FES de EDP.',
        badge: 'APROBACIÓN OP.',
        badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
      },
      {
        code: 'GSP_PROG',
        name: 'Control de Gestión & Análisis de Operaciones',
        desc: 'Control Operativo PMO (validación horas/viáticos), costos operativos ITS y 1ra firma FES de EDP.',
        badge: 'CONTROL GESTIÓN',
        badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/30'
      },
      {
        code: 'SECRETARIA',
        name: 'Secretaría Operativa / Administrativa',
        desc: 'Apoyo administrativo en seguimiento de OTs, recepción de OC cliente, guías y repositorio documental.',
        badge: 'SECRETARÍA',
        badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
      },
      {
        code: 'GSP_PREV',
        name: 'Prevención de Riesgos & Documentación',
        desc: 'Acreditación Personal (Dayana), actualización documental de equipos en Flota 360° (Alfonso) y Gestor Documental.',
        badge: 'ACRED. / DOCS',
        badgeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/30'
      },
      {
        code: 'GSP_CONTA',
        name: 'Contabilidad & Facturación',
        desc: 'Bandeja financiera de EDPs visados, ingreso de N° Factura SII, Hito 17 y Compras/OC.',
        badge: 'FINANZAS',
        badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
      },
      {
        code: 'GSP_EJEC',
        name: 'Operador / Rigger / Chofer (Terreno)',
        desc: 'Exclusivo APP Móvil: Hoja de Viaje, Report Diario de Izaje con firma mandante y Visitas/AST.',
        badge: 'TERRENO / PWA',
        badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
      }
    ]
  },
  {
    name: 'Mantenimiento de Flota, Taller & Bodega WMS',
    roles: [
      {
        code: 'GSP_TALLER_APROB',
        name: 'Jefe de Taller / Aprobador Mantenimiento',
        desc: 'Gestión de Flota 360°, Radar Horómetros, OTM y cierre FES. Sin acceso comercial; OT solo en PDF.',
        badge: 'JEFE TALLER',
        badgeColor: 'bg-orange-500/10 text-orange-400 border-orange-500/30'
      },
      {
        code: 'GSP_TALLER_PROG',
        name: 'Planificador de Mantenimiento',
        desc: 'Programación de pautas preventivas, apertura de OTM y seguimiento de flota. OT solo en PDF.',
        badge: 'PLANIF. TALLER',
        badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
      },
      {
        code: 'GSP_TALLER_EJEC',
        name: 'Mecánico / Técnico de Taller',
        desc: 'Ejecución de OTM en APP Móvil, fotos 360°, medidores, avisos de falla y Pauta/OT en PDF.',
        badge: 'MECÁNICO APP',
        badgeColor: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
      },
      {
        code: 'GSP_BODEGA',
        name: 'Inventario WMS & Adquisiciones',
        desc: 'Gestión de bodegas, recepción OC, despacho a OTM y compras con valorización CLP. Sin acceso comercial.',
        badge: 'BODEGA / WMS',
        badgeColor: 'bg-lime-500/10 text-lime-400 border-lime-500/30'
      }
    ]
  },
  {
    name: 'Sistema & Enrolamiento',
    roles: [
      {
        code: 'USR-CONSENT',
        name: 'Consentimiento Legal',
        desc: 'Consentimiento de privacidad y firma legal durante el enrolamiento de usuarios móviles.',
        badge: 'LEGAL',
        badgeColor: 'bg-slate-500/10 text-slate-400 border-slate-500/30'
      }
    ]
  }
]

const selectedCount = computed(() => {
  return (props.modelValue || []).length
})

function hasRole(code) {
  const norm = String(code || '').trim().toUpperCase()
  return (props.modelValue || []).some(c => String(c || '').trim().toUpperCase() === norm)
}

function toggleRole(code) {
  const norm = String(code || '').trim().toUpperCase()
  const next = [...(props.modelValue || [])]
  const idx = next.findIndex(c => String(c || '').trim().toUpperCase() === norm)
  if (idx > -1) {
    next.splice(idx, 1)
  } else {
    next.push(norm)
  }
  emit('update:modelValue', next)
}
</script>

