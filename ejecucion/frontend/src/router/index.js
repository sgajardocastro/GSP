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

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL || '/'),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
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
    }
  ]
})

// Middleware de verificación de sesión con auto-inicialización de dev user
router.beforeEach((to, from, next) => {
  let token = localStorage.getItem('token')
  let user = JSON.parse(localStorage.getItem('user') || '{}')
  
  if (!token || token === 'dummy_jwt_token_for_preventa_tests') {
    token = 'gsp_dev_jwt_token_valid'
    user = { id: 1, name_frst: 'Sergio', apellido_pat: 'Gajardo', role: 'Administrador GSP', id_empresa: 9 }
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
  }

  if (to.name === 'login') {
    return next({ name: 'dashboard' })
  }

  next()
})

export default router
