# Ficha de Incidente Crítico: `CASO-20261104-01`

## 1. Ficha del Incidente
- **ID del Caso:** `CASO-20261104-01`
- **Fecha / Hora:** `2026-11-04 09:30:00 CLST`
- **Operador / Usuario Afectado:**
  - **Dominique Ayleen Torres Sánchez** (`id_user = 90`, `email = alogistica@arriendosanpablo.cl`, RUT `19006141-8`, Cargo: Coordinador)
  - **Alfonso Ernesto Porperello Campos** (`id_user = 10`, `email = alfonsoporperello@gmail.com`, RUT `19795912-6`, Cargo: Operador)
- **Negocio / OT:** Plataforma Web Global (`Consola de Control de Maquinarias GSP` — Autenticación Google OAuth y RBAC)
- **Equipo Involucrado:** No Aplica (Autenticación, `tsec_users`, `tsec_rel_usr_rol` y `Sidebar.vue`)
- **Ambiente:** Producción (`PROD` — `sch_leangsp_prod`) y Desarrollo (`DEV` — `sch_leangsp`)
- **Severidad:** Crítica (Imposibilidad de visualizar el menú lateral de consola al iniciar sesión en `https://servidor.leanglobal.cl/lg-gsp-prod`)

---

## 2. Síntoma Reportado por Terreno
- Al ingresar a la URL de Producción (`https://servidor.leanglobal.cl/lg-gsp-prod`) con la cuenta `alogistica@arriendosanpablo.cl` (**Dominique Torres**, quien en el Mantenedor de Usuarios figura con roles `ADMIN`, `COORD`, `GSP_PROG` y `USR-CONSENT`), el sistema redirige automáticamente a `/documentacion` (**Centro Documentación**), ocultando todos los menús de la Consola de Control y mostrando en la esquina superior derecha el nombre **`Alfonso Porperello` (`USR-CONSENT`)**.
- Asimismo, **Alfonso Porperello** (`alfonsoporperello@gmail.com`), al ingresar a la URL de consola web con solo el rol `GSP_EJEC` + `USR-CONSENT`, también era redirigido a `/documentacion` sin menús de consola.

---

## 3. Diagnóstico Técnico & Evidencia Empírica
Al consultar `sch_leangsp_prod.tsec_users` para el correo `alogistica@arriendosanpablo.cl` y `alfonsoporperello@gmail.com`:

```sql
SELECT id_user, codi_user, email, name_frst, apellido_pat, activo
FROM sch_leangsp_prod.tsec_users
WHERE id_user IN (10, 90);
```

Resultado obtenido antes de la corrección:
| `id_user` | `codi_user` | `email` | `name_frst` | `apellido_pat` | Roles en `tsec_rel_usr_rol` |
| :---: | :--- | :--- | :--- | :--- | :--- |
| `10` | `alogistica@arriendosanpablo.cl` | `alfonsoporperello@gmail.com` | `Alfonso` | `Porperello` | `GSP_EJEC`, `USR-CONSENT` |
| `90` | `alogistica@arriendosanpablo.cl` | `alogistica@arriendosanpablo.cl` | `DOMINIQUE` | `TORRES` | `ADMIN`, `COORD`, `GSP_PROG`, `USR-CONSENT` |

---

## 4. Causa Raíz de Arquitectura (Software / State Machine / Datos)
1. **Falta de sincronización de `codi_user` al actualizar el correo en `MantenedorUsuarios` (`usuarioModel.updUsuarioDatos`):**
   Originalmente el registro `id_user = 10` (`Alfonso Porperello`) fue creado con el correo `alogistica@arriendosanpablo.cl` tanto en `email` como en `codi_user`. Posteriormente, desde el Mantenedor de Usuarios se modificó el correo de Alfonso (`id_user = 10`) a `alfonsoporperello@gmail.com` y se creó a **Dominique Torres** (`id_user = 90`) con `alogistica@arriendosanpablo.cl`. Sin embargo, `usuarioModel.updUsuarioDatos` actualizaba únicamente la columna `email` y **no actualizaba `codi_user`**, dejando a `id_user = 10` con `codi_user = 'alogistica@arriendosanpablo.cl'`.
2. **Colisión en `authModel.getUserByEmail` durante Login Google OAuth:**
   La consulta `SELECT * FROM tsec_users WHERE LOWER(codi_user) = LOWER($1) OR LOWER(email) = LOWER($1)` sin `ORDER BY` de prioridad devolvía la primera fila física encontrada en la tabla (`id_user = 10`, **Alfonso Porperello**) cuando **Dominique Torres** iniciaba sesión con Google usando `alogistica@arriendosanpablo.cl`.
3. **Redirección por guardia de ruta `isOnlyEjec` (`router/index.js`):**
   Como la sesión quedaba autenticada bajo `id_user = 10` (que solo poseía `GSP_EJEC` y `USR-CONSENT`), el router evaluaba `isOnlyEjec === true` y redirigía forzosamente a `/documentacion`, ocultando todos los módulos del menú lateral.

---

## 5. Plan de Mitigación y Resolución
1. **Normalización en Base de Datos (`sch_leangsp_prod` y `sch_leangsp`):**
   - Se ejecutó `UPDATE tsec_users SET codi_user = LOWER(TRIM(email))` para alinear `codi_user` con `email` en todos los registros desfasados (`id_user = 10` ahora tiene `codi_user = 'alfonsoporperello@gmail.com'`).
   - Se habilitaron los roles de consola (`ADMIN`, `COORD`, `GSP_PROG`) tanto en `id_user = 90` (**Dominique Torres**) como en `id_user = 10` (**Alfonso Porperello**).
2. **Corrección en Backend (`usuarioModel.js` y `authModel.js`):**
   - En `usuarioModel.updUsuarioDatos`: al actualizar el `email` de un usuario, se actualiza atómicamente `codi_user = COALESCE($3, email, codi_user)`.
   - En `authModel.getUserByEmail`: se prioriza la coincidencia exacta por `LOWER(email) = LOWER($1)` sobre `LOWER(codi_user) = LOWER($1)` y usuarios activos (`ORDER BY CASE WHEN LOWER(email) = LOWER($1) THEN 0 ELSE 1 END, activo DESC NULLS LAST, id_user DESC`).
3. **Sincronización reactiva en Frontend (`Sidebar.vue` — `v1.0.191` / `REQ-1091`):**
   - `loadUserRoles` sincroniza los roles frescos obtenidos desde `/api/usuarios/:id/roles` de vuelta en `localStorage.user.roles` y emite `auth-change` para que el router y la barra lateral reflejen cambios de perfil sin requerir relogin manual cuando el `id_user` es el mismo.

---

## 6. Protocolo de Respuesta y Guía al Usuario / Operador
- **Para Dominique Torres (`alogistica@arriendosanpablo.cl`):** Hacer clic en **Cerrar Sesión** (esquina inferior izquierda o perfil superior derecho) y volver a ingresar con Google (`alogistica@arriendosanpablo.cl`). Al hacerlo, el sistema cargará su perfil real (**Dominique Torres**, `id_user = 90`) con todos los menús de consola habilitados.
- **Para Alfonso Porperello (`alfonsoporperello@gmail.com`):** Recargar la página (`F5`) o volver a iniciar sesión para visualizar el menú completo de la consola.

---

## 7. Lecciones Aprendidas y Acciones Preventivas
- Todo cambio de `email` en `tsec_users` debe mantener sincronizado `codi_user` para evitar colisiones de identidad cuando un correo corporativo genérico (`alogistica@...`) es reasignado de un funcionario a otro.
- La búsqueda de identidad por correo en OAuth (`getUserByEmail`) debe priorizar determinísticamente la columna `email` por sobre `codi_user`.
