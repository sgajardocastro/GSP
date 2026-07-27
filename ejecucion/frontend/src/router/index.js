import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import Clientes from '../views/Clientes.vue'
import Torre from '../views/Torre.vue'
import Cruce from '../views/Cruce.vue'
import Mantencion from '../views/Mantencion.vue'
import Acreditacion from '../views/Acreditacion.vue'
import Documentos from '../views/Documentos.vue'
import Login from '../views/Login.vue'
import GestorOportunidades from '../views/CRM/GestorOportunidades.vue'
import Mantenedores from '../views/Mantenedores.vue'
import Enrolamiento from '../views/Enrolamiento.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: Dashboard,
      meta: { requireAuth: true }
    },
    {
      path: '/clientes',
      name: 'clientes',
      component: Clientes,
      meta: { requireAuth: true }
    },
    {
      path: '/torre',
      name: 'torre',
      component: Torre,
      meta: { requireAuth: true }
    },
    {
      path: '/cruce',
      name: 'cruce',
      component: Cruce,
      meta: { requireAuth: true }
    },
    {
      path: '/mantencion',
      name: 'mantencion',
      component: Mantencion,
      meta: { requireAuth: true }
    },
    {
      path: '/acreditacion',
      name: 'acreditacion',
      component: Acreditacion,
      meta: { requireAuth: true }
    },
    {
      path: '/documentos',
      name: 'documentos',
      component: Documentos,
      meta: { requireAuth: true }
    },
    {
      path: '/crm',
      name: 'crm',
      component: GestorOportunidades,
      meta: { requireAuth: true }
    },
    {
      path: '/mantenedores',
      name: 'mantenedores',
      component: Mantenedores,
      meta: { requireAuth: true }
    },
    {
      path: '/enrolamiento',
      name: 'enrolamiento',
      component: Enrolamiento,
      meta: { layout: 'auth', requireAuth: true }
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
      meta: { layout: 'auth' }
    },
    {
      path: '/versurveyprint',
      name: 'verSurveyPrint',
      component: () => import('../pages/verSurveyPrint.vue'),
      meta: { layout: 'print' }
    },
    {
      path: '/verSurveyPrint',
      redirect: '/versurveyprint'
    },
    {
      path: '/vista360',
      name: 'vista360',
      component: () => import('../views/Vista360.vue'),
      meta: { requireAuth: true }
    },
    {
      path: '/vista360-otras',
      name: 'vista360-otras',
      component: () => import('../views/Vista360Otras.vue'),
      meta: { requireAuth: true }
    },
    {
      path: '/inspecciones',
      name: 'inspecciones',
      component: () => import('../views/InspeccionEquipos.vue'),
      meta: { requireAuth: true }
    },
    {
      path: '/otras-inspecciones',
      name: 'otras-inspecciones',
      component: () => import('../views/OtrasInspecciones.vue'),
      meta: { requireAuth: true }
    },
    {
      path: '/equipo/:patente',
      name: 'equipo-publico',
      component: () => import('../views/FichaEquipoPublica.vue'),
      meta: { layout: 'public' }
    }
  ]
})

// Middleware de verificación de sesión
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  
  if (to.meta.requireAuth) {
    if (!token || token === 'dummy_jwt_token_for_preventa_tests') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      return next({ name: 'login' })
    }
    
    if (user.flag_proc_enrol && to.name !== 'enrolamiento') {
      return next({ name: 'enrolamiento' })
    }
  }

  if (token && token !== 'dummy_jwt_token_for_preventa_tests' && to.name === 'login') {
    return next({ name: 'dashboard' })
  }

  next()
})

export default router
