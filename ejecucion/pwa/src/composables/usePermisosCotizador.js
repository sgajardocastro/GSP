/* eslint-disable */
/**
 * composables/usePermisosCotizador.js
 * 
 * Verificación centralizada de permisos para el Cotizador Express en PWA Grúas San Pablo.
 * Diseñado bajo el protocolo de Cero Suposiciones y Candado Operacional.
 */

export const ADMIN_EMAILS = [
  'sgajardoc@gmail.com',
  'sgajardo@leanglobal.cl',
  'omar.ghiselini@arriendosanpablo.cl',
  'j.poncenavarrete@gmail.com',
  'controlflota@arriendosanpablo.cl',
  'admin@leanglobal.cl',
  'mauricioocavieresr@gmail.com'
]

export const COMERCIAL_EMAILS = [
  'nghisellini@arriendosanpablo.cl',
  'wnavarrete@arriendosanpablo.cl',
  'lguser@arriendosanpablo.cl'
]

export const ALLOWED_ROLE_IDS = [1, 31, 32, 35, 36, 37]
export const ALLOWED_ROLE_KEYWORDS = [
  'ADMIN',
  'ADM_COM',
  'COMERCIAL',
  'GERENCIA',
  'DIRECTOR',
  'VENTAS',
  'GSP_PROG',
  'GSP_APROB',
  'COORD'
]

/**
 * Función pura que evalúa si un usuario tiene acceso al Cotizador Express.
 * Revisa:
 * 1. Emails autorizados (Dirección, Administración, Comerciales).
 * 2. Roles en localStorage ('perfil' y 'userDetail').
 * 3. Lista de roles cargados dinámicamente si se suministra.
 * 4. Modo DEV (si está autenticado y no es chofer puro de terreno).
 * 
 * Además realiza auto-curación de sesión en localStorage si detecta inconsistencia en 'perfil'.
 */
export function verificarEsAdminOComercial(rolesList = null) {
  let email = ''
  let perfil = {}
  let userDetail = {}

  // 1. Leer localStorage seguro
  try {
    const rawPerfil = localStorage.getItem('perfil')
    if (rawPerfil) perfil = JSON.parse(rawPerfil)
  } catch (_e) {}

  try {
    const rawUd = localStorage.getItem('userDetail')
    if (rawUd) {
      const parsed = JSON.parse(rawUd)
      userDetail = parsed?.userDetail || parsed || {}
    }
  } catch (_e) {}

  email = String(
    perfil.CORREO_USUARIO ||
    perfil.USUARIO ||
    perfil.CORREO ||
    perfil.CODI_USUARIO ||
    userDetail.email ||
    userDetail.correo_user ||
    userDetail.codi_user ||
    ''
  ).trim().toLowerCase()

  // 2. Validación por lista blanca de correos (Dirección / LeanGlobal / Comercial)
  const esAdminPorEmail = ADMIN_EMAILS.some(e => e.toLowerCase() === email) || email.endsWith('@leanglobal.cl')
  const esComercialPorEmail = COMERCIAL_EMAILS.some(e => e.toLowerCase() === email)

  if (esAdminPorEmail || esComercialPorEmail) {
    // Auto-curación de perfil si no tiene rol asignado en localStorage
    if (!perfil.ID_ROL || Number(perfil.ID_ROL) === 0) {
      try {
        perfil.ID_ROL = esAdminPorEmail ? 1 : 36
        perfil.NOMBRE_ROL = esAdminPorEmail ? 'Admin' : 'COMERCIAL'
        perfil.NOMBRE_PERFIL = esAdminPorEmail ? 'ADMIN' : 'COMERCIAL'
        localStorage.setItem('perfil', JSON.stringify(perfil))
      } catch (_e) {}
    }
    return true
  }

  // 3. Validación por ID de rol en perfil o userDetail
  const idRolPerfil = Number(perfil.ID_ROL || 0)
  const idRolUd = Number(userDetail.id_rol || userDetail.ID_ROL || 0)
  if (ALLOWED_ROLE_IDS.includes(idRolPerfil) || ALLOWED_ROLE_IDS.includes(idRolUd)) {
    return true
  }

  // 4. Validación por Nombre de Rol / Perfil
  const rPerfil = String(perfil.NOMBRE_ROL || perfil.NOMBRE_PERFIL || '').toUpperCase()
  const rUd = String(userDetail.nombre_rol || userDetail.name_rol || userDetail.role || '').toUpperCase()
  if (ALLOWED_ROLE_KEYWORDS.some(kw => rPerfil.includes(kw) || rUd.includes(kw))) {
    return true
  }

  // 5. Validación en lista de roles del usuario (si viene en userDetail.usuarioRoles o parámetro rolesList)
  const allRoles = []
  if (Array.isArray(rolesList) && rolesList.length) allRoles.push(...rolesList)
  if (Array.isArray(userDetail.usuarioRoles) && userDetail.usuarioRoles.length) allRoles.push(...userDetail.usuarioRoles)

  if (allRoles.length > 0) {
    const hasAllowed = allRoles.some(r => {
      const id = Number(r?.id_rol || r?.ID_ROL || r)
      if (ALLOWED_ROLE_IDS.includes(id)) return true
      const name = String(r?.name_rol || r?.nombre_rol || '').toUpperCase()
      return ALLOWED_ROLE_KEYWORDS.some(kw => name.includes(kw))
    })
    if (hasAllowed) return true
  }

  // 6. Detección de Operador de Terreno / Chofer Exclusivo (GSP_EJEC / id_rol 34)
  const esExclusivoOperador = (
    idRolPerfil === 34 ||
    idRolUd === 34 ||
    rPerfil.includes('GSP_EJEC') ||
    rUd.includes('GSP_EJEC') ||
    (allRoles.length === 1 && Number(allRoles[0]?.id_rol || allRoles[0]) === 34)
  )

  if (esExclusivoOperador) {
    return false
  }

  // 7. En ambiente DEV (servidor.leanglobal.cl/pwa-gsp-dev/ o localhost), si está logueado y no es chofer, habilitar
  if (typeof window !== 'undefined') {
    const path = window.location.pathname || ''
    const isDev = path.startsWith('/pwa-gsp-dev') || path.startsWith('/lg-gsp-dev') || window.location.hostname === 'localhost'
    const isAuth = !!perfil.auth || !!localStorage.getItem('token') || !!userDetail.id_user
    if (isDev && isAuth) {
      return true
    }
  }

  return false
}
