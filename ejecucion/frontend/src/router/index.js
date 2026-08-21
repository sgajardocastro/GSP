import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import Clientes from '../views/Clientes.vue'
import Torre from '../views/Torre.vue'
import Cruce from '../views/Cruce.vue'
import Acreditacion from '../views/Acreditacion.vue'
import Documentos from '../views/Documentos.vue'
import Login from '../views/Login.vue'
import GestorOportunidades from '../views/CRM/GestorOportunidades.vue'
import Mantenedores from '../views/Mantenedores.vue'
import Enrolamiento from '../views/Enrolamiento.vue'
import BodegasView from '../views/inventario/BodegasView.vue'
import ProductosView from '../views/inventario/ProductosView.vue'
import AlertasQuiebresView from '../views/inventario/AlertasQuiebresView.vue'
import MantenimientoView from '../views/MantenimientoView.vue'
import Vista360 from '../views/Vista360.vue'
import InspeccionEquipos from '../views/InspeccionEquipos.vue'
import verSurveyPrint from '../pages/verSurveyPrint.vue'
import FichaEquipoPublica from '../views/FichaEquipoPublica.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL || '/'),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/versurveyprint',
      name: 'versurveyprint',
      component: verSurveyPrint,
      meta: { layout: 'auth' }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: Dashboard
    },
    {
      path: '/clientes',
      name: 'clientes',
      component: Clientes
    },
    {
      path: '/torre',
      name: 'torre',
      component: Torre
    },
    {
      path: '/cruce',
      name: 'cruce',
      component: Cruce
    },
    {
      path: '/inventario',
      name: 'inventario',
      redirect: '/inventario/bodegas'
    },
    {
      path: '/inventario/bodegas',
      name: 'inventario_bodegas',
      component: BodegasView
    },
    {
      path: '/inventario/productos',
      name: 'inventario_productos',
      component: ProductosView
    },
    {
      path: '/inventario/alertas',
      name: 'inventario_alertas',
      component: AlertasQuiebresView
    },
    {
      path: '/mantenimiento',
      name: 'mantenimiento',
      component: MantenimientoView
    },
    {
      path: '/crm',
      name: 'crm',
      component: GestorOportunidades
    },
    {
      path: '/mantenedores',
      name: 'mantenedores',
      component: Mantenedores
    },
    {
      path: '/acreditacion',
      name: 'acreditacion',
      component: Acreditacion
    },
    {
      path: '/documentos',
      name: 'documentos',
      component: Documentos
    },
    {
      path: '/vista360',
      name: 'vista360',
      component: Vista360
    },
    {
      path: '/inspecciones',
      name: 'inspecciones',
      component: InspeccionEquipos
    },
    {
      path: '/enrolamiento',
      name: 'enrolamiento',
      component: Enrolamiento,
      meta: { layout: 'auth' }
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
      meta: { layout: 'auth' }
    },
    {
      path: '/equipo/:patente',
      name: 'ficha_equipo',
      component: FichaEquipoPublica,
      meta: { layout: 'public' }
    },
    {
      path: '/lg-gsp-dev/equipo/:patente',
      name: 'ficha_equipo_dev',
      component: FichaEquipoPublica,
      meta: { layout: 'public' }
    },
    {
      path: '/lg-gsp-qa/equipo/:patente',
      name: 'ficha_equipo_qa',
      component: FichaEquipoPublica,
      meta: { layout: 'public' }
    },
    {
      path: '/lg-gsp-prod/equipo/:patente',
      name: 'ficha_equipo_prod',
      component: FichaEquipoPublica,
      meta: { layout: 'public' }
    },
    {
      path: '/asignar-visita/:token(.*)',
      name: 'asignar_visita',
      component: () => import('../views/AsignacionVisita.vue'),
      meta: { layout: 'public' }
    },
    {
      path: '/lg-gsp-dev/asignar-visita/:token(.*)',
      name: 'asignar_visita_dev',
      component: () => import('../views/AsignacionVisita.vue'),
      meta: { layout: 'public' }
    },
    {
      path: '/lg-gsp-qa/asignar-visita/:token(.*)',
      name: 'asignar_visita_qa',
      component: () => import('../views/AsignacionVisita.vue'),
      meta: { layout: 'public' }
    },
    {
      path: '/lg-gsp-prod/asignar-visita/:token(.*)',
      name: 'asignar_visita_prod',
      component: () => import('../views/AsignacionVisita.vue'),
      meta: { layout: 'public' }
    },
    {
      path: '/viaje/:token(.*)',
      name: 'viaje_conductor',
      component: () => import('../views/Operaciones/ViajeConductor.vue'),
      meta: { layout: 'public' }
    },
    {
      path: '/lg-gsp-dev/viaje/:token(.*)',
      name: 'viaje_conductor_dev',
      component: () => import('../views/Operaciones/ViajeConductor.vue'),
      meta: { layout: 'public' }
    },
    {
      path: '/lg-gsp-qa/viaje/:token(.*)',
      name: 'viaje_conductor_qa',
      component: () => import('../views/Operaciones/ViajeConductor.vue'),
      meta: { layout: 'public' }
    },
    {
      path: '/lg-gsp-prod/viaje/:token(.*)',
      name: 'viaje_conductor_prod',
      component: () => import('../views/Operaciones/ViajeConductor.vue'),
      meta: { layout: 'public' }
    },
    {
      path: '/trabajador/:rut(.*)',
      name: 'ficha_trabajador',
      component: () => import('../views/FichaTrabajadorPublica.vue'),
      meta: { layout: 'public' }
    },
    {
      path: '/lg-gsp-dev/trabajador/:rut(.*)',
      name: 'ficha_trabajador_dev',
      component: () => import('../views/FichaTrabajadorPublica.vue'),
      meta: { layout: 'public' }
    },
    {
      path: '/lg-gsp-qa/trabajador/:rut(.*)',
      name: 'ficha_trabajador_qa',
      component: () => import('../views/FichaTrabajadorPublica.vue'),
      meta: { layout: 'public' }
    },
    {
      path: '/lg-gsp-prod/trabajador/:rut(.*)',
      name: 'ficha_trabajador_prod',
      component: () => import('../views/FichaTrabajadorPublica.vue'),
      meta: { layout: 'public' }
    }
  ]
})

// Middleware de verificación de sesión
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null

  if (to.name === 'login') {
    return next()
  }

  if (!token && to.name !== 'login' && to.name !== 'versurveyprint' && to.meta?.layout !== 'public') {
    return next({ name: 'login' })
  }

  // Regla de Arquitectura FES: Si flag_proc_enrol está activo, exige completar el enrolamiento
  const isEnrolPending = user && (user.flag_proc_enrol === true || user.flag_proc_enrol === 't' || user.flag_proc_enrol === 1)
  if (isEnrolPending && to.name !== 'enrolamiento' && to.meta?.layout !== 'public') {
    return next({ name: 'enrolamiento' })
  }

  next()
})

export default router
