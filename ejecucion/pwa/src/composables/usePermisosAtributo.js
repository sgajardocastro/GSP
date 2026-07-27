
import { ref, computed } from 'vue'
import { useUserDetailStore } from '@/store/userDetail'
import apiAxios from '@/services/api'

// Cache global simple para evitar múltiples llamadas si se usa en varios componentes
// (Se reinicia al recargar la página, lo cual está bien)
const rolesCache = ref(null)
const usuariosRolesCache = ref(null)

export function usePermisosAtributo() {
  const userStore = useUserDetailStore()

  /**
   * Carga los datos maestros de roles si no están en caché.
   * Se recomienda llamar esto en onMounted.
   */
  async function cargarRoles() {
    // Si ya tenemos datos, no hacemos nada
    if (rolesCache.value && usuariosRolesCache.value) return

    try {
      const [resRoles, resUsuRoles] = await Promise.all([
        apiAxios.get('/servicio/leanglobal/obtenerRoles'),
        apiAxios.get('/servicio/leanglobal/obtenerUsuariosRoles')
      ])
      
      console.log('[usePermisosAtributo] Raw Roles API:', resRoles.data)
      console.log('[usePermisosAtributo] Raw UserRoles API:', resUsuRoles.data)

      rolesCache.value = resRoles.data || []
      usuariosRolesCache.value = resUsuRoles.data || []
    } catch (error) {
      console.error('[usePermisosAtributo] Error cargando roles:', error)
    }
  }

  /**
   * Computed que devuelve los códigos/nombres de roles del usuario actual.
   * Devuelve un array de strings en mayúsculas.
   */
  const misRoles = computed(() => {
    const idUser = userStore.userDetail?.id_user
    // 1. Intenta obtener roles directos del store (inyectados en LoginBHP.vue)
    const rolesDelUsuario = userStore.userDetail?.usuarioRoles || []
    
    // console.log('[usePermisosAtributo] Computed misRoles - idUser:', idUser)

    if (!idUser) {
      // console.warn('[usePermisosAtributo] No idUser found in store')
      return []
    }
    
    // Si no tenemos cache de definiciones de roles, no podemos resolver nombres
    if (!rolesCache.value) {
      // console.warn('[usePermisosAtributo] Roles Cache (definiciones) not ready')
      return []
    }

    let misIds = []

    // A) Si tenemos los roles guardados en el usuario (preferido)
    if (rolesDelUsuario.length > 0) {
      // Filtramos explícitamente por si el cache trajera basura de otros
      misIds = rolesDelUsuario
        .filter(ur => String(ur.id_user) === String(idUser))
        .map(ur => ur.id_rol)
    } 
    // B) Fallback: buscar en la cache global de usuarios_roles si existe
    else if (usuariosRolesCache.value) {
       const misRels = usuariosRolesCache.value.filter(ur => String(ur.id_user) === String(idUser))
       misIds = misRels.map(ur => ur.id_rol)
    }

    // 2. Buscar definiciones de roles (cruce por ID)

    const rolesObjs = rolesCache.value.filter(r => misIds.some(mId => String(mId) === String(r.id_rol)))
    console.log('[usePermisosAtributo] Objetos Rol encontrados:', rolesObjs)
    
    // DEBUG CRÍTICO: Ver estructura real del objeto
    if (rolesObjs.length > 0) {
      console.log('[DEBUG STRUCTURE] Primer rol completo:', JSON.stringify(rolesObjs[0]))
    }
    
    const result = rolesObjs
      .map(r => {
        const val = r.name_rol || r.nombre_rol || r.codigo_rol || r.role_name || r.nombre || r.descripcion || r.desc_rol || r.cod || r.name || r.label || ''
        
        // LOG RESALTADO QUE SE SOLICITÓ
        console.log(`%c[ROL DETECTADO] ID: ${r.id_rol} | NOMBRE: ${val}`, 'background: #222; color: #bada55; font-size: 12px; font-weight: bold;')

        return String(val).trim().toUpperCase()
      })
      .filter(Boolean)
      
    console.log('[usePermisosAtributo] Final misRoles array:', result)
    return result
  })

  /**
   * Verifica si el atributo es editable por el usuario actual.
   * @param {Object} attr Objeto atributo (debe tener attr.roles opcionalmente)
   * @returns {Boolean} true si puede editar (o no hay restricción), false si está restringido
   */
  function puedeEditar(attr) {
    // 1. Si no existe la propiedad roles o está vacía, es público/editable por todos
    if (!attr || !attr.roles || !Array.isArray(attr.roles) || attr.roles.length === 0) {
      return true
    }

    // 2. Extraer los roles permitidos del atributo
    // Soporta formato: [{ rol1: "XXX"}, { rol2: "YYY" }] O ["XXX", "YYY"]
    const permitidos = attr.roles
      .map(item => {
        if (typeof item === 'string') return item.trim().toUpperCase()
        if (item && typeof item === 'object') {
           // Obtenemos el primer valor del objeto (ej: "CNX-TRC-PLAN")
           const val = Object.values(item)[0]
           return String(val || '').trim().toUpperCase()
        }
        return ''
      })
      .filter(Boolean)

    // Si el array de roles existía pero no tenía valores válidos, asumimos sin restricción
    // (O podrías asumir restricción total, depende de la lógica. Aquí asumo "sin restricción" si está vacío tras filtrar)
    if (permitidos.length === 0) return true

    // 3. Verificar si el usuario tiene alguno de los roles permitidos
    const tiene = permitidos.some(p => misRoles.value.includes(p))
    return tiene
  }

  return {
    cargarRoles,
    puedeEditar,
    misRoles
  }
}
