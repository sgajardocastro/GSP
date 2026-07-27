import { createRouter, createWebHashHistory } from 'vue-router'
import useProfileStore from '@/store/profile.js'

// TRANSAMAC_REMOVE_CONEXION_20260428: rutas CNX/vehiculos desactivadas temporalmente.
// Para volver atras, reponer las rutas marcadas en el bloque comentado al final de este archivo.
const DISABLED_CNX_PATHS = new Set(['/asignaciones', '/reclamos', '/vehiculos', '/equipamiento'])

const routes = [
  /*{
    path: '/',
    component: () => import('@/layouts/default/Default.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        // route level code-splitting
        // this generates a separate chunk (about.[hash].js) for this route
        // which is lazy-loaded when the route is visited.
        component: () => import('@/views/Home.vue'),
      },
    ],
    meta: {
      requireAuth: true
    }
  },*/
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/inspeccion',
    name: 'inspeccion',
    component: () => import('@/views/Inspeccion.vue'),
    meta: {
      requireAuth: true
    }
  },
  {
    path: '/checklist/:idInspeccion',
    name: 'checklist',
    component: () => import('@/views/Checklist.vue'),
    meta: {
      requireAuth: true
    }
  },
  {
    path: '/surveys',
    name: 'surveys',
    component: () => import('@/views/Surveys.vue'),
    meta: {
      templateFilter: 'exclude153',
      requireAuth: true
    }
  },
  {
    path: '/firmas',
    name: 'firmas',
    component: () => import('@/views/FirmaElectronica.vue'),
    meta: {
      requireAuth: true
    }
  },
  {
    path: '/proyectosProduccion',
    name: 'ProyectosProduccion',
    component: () => import('@/views/ProyectosProduccion.vue'),
    meta: {
      requireAuth: true
    }
  },
  {
    path: '/parteProduccionDiaria',
    name: 'Parte Produccion Diaria',
    component: () => import('@/views/ParteProduccionDiaria.vue'),
    meta: {
      requireAuth: true
    }
  },

  {
    path: '/logout',
    name: 'logout',
    component: () => import('@/views/Logout.vue'),
    meta: {
      requireAuth: true
    }
  }
]

const router = createRouter({
  history: createWebHashHistory(process.env.BASE_URL),
  routes,
})

router.beforeEach((to, from, next) => {
  //console.log(to)
  //console.log(from)
  //console.log(next)
  var auth = false
  const profileStore = useProfileStore();
  if(localStorage.getItem('perfil') != null){
    if(JSON.parse(localStorage.getItem('perfil')).auth){
      profileStore.auth = true;
      auth = JSON.parse(localStorage.getItem('perfil')).auth
    }
  }
  const needAuth = to.meta.requireAuth
  //var auth = profileStore.auth;

  if (DISABLED_CNX_PATHS.has(to.path)) {
    next({ path: '/surveys' })
    return
  }

  if (needAuth && !auth) {
    router.push({
      path: "/login",
    })
  } else {
    
    next()
  }
})

export default router

/*
TRANSAMAC_REMOVE_CONEXION_20260428: rutas removidas de la app visible.
Para restaurar CNX/vehiculos, mover estos objetos de vuelta al arreglo routes:

{
  path: '/asignaciones',
  name: 'asignaciones',
  component: () => import('@/views/Asignaciones.vue')
},
{
  path: '/reclamos',
  name: 'reclamos',
  component: () => import('@/views/Surveys.vue'),
  meta: {
    templateFilter: 'only153'
  }
},
{
  path: '/vehiculos',
  name: 'EquiposMoviles',
  component: () => import('@/views/EquiposMoviles.vue')
},
{
  path: '/equipamiento',
  name: 'Equipamiento',
  component: () => import('@/views/EquipamientoView.vue')
}
*/
