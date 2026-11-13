# Ficha de Incidente de Soporte Operacional — CASO-20261102-03

## 1. Ficha del Incidente
- **ID del Caso:** `CASO-20261102-03`
- **Fecha / Hora:** 2026-11-02 15:42 CLT (UTC-3)
- **Operador / Usuario Afectado:** Equipo Comercial / Administración GSP (`GSP-2611-00006` — Constructora Inarco S.A.)
- **Negocio / OT:** `GSP-2611-00006` (Envío de Cotización por Email y Notificación de Requerimiento a Operaciones)
- **Equipo Involucrado:** No Aplica (RBAC `tsec_user_roles` / CRM `ModalEnviarCotizacion.vue` y `GestorOportunidades.vue`)
- **Ambiente:** Producción (`PROD` — `sch_leangsp_prod`) y Desarrollo (`DEV` — `sch_leangsp`)
- **Severidad:** Alta (Exposición de cotizaciones comerciales en Copia Conforme CC a riggers externos y operadores)

---

## 2. Síntoma Reportado por Terreno
- Al iniciar un negocio en Producción y abrir el modal **Enviar Cotización por Email** (`GSP-2611-00006`), en la lista **Copia Conforme (CC) — Parametrizada (Emisor Comercial + Rol COORD + Rol Admin)** aparecían preseleccionados con etiqueta `ADMIN`:
  1. **Carlos alberto acuña sandoval** (`rigger.ext.1791492971302@arriendosanpablo.cl` — Rigger Externo)
  2. **Alfonso Ernesto Porperello** (`alfonsoporperello@gmail.com` — Operador)
  3. **MATIAS BARRALES** (`rigger.ext.1791899424612@arriendosanpablo.cl` — Rigger Externo)
- Adicionalmente, en los selectores de destinatarios de gestión (`usuariosNotificablesGestion` en `GestorOportunidades.vue`), aparecían técnicos de taller y operadores con `cargo` nulo o no filtrado.

---

## 3. Diagnóstico Técnico & Evidencia Empírica
- **Inspección en `sch_leangsp_prod.tsec_user_roles` (`id_rol = 1` — `Admin`):**
  - Los usuarios `id_user = 10` (`Alfonso Porperello`), `id_user = 11` (`Carlos alberto acuña sandoval`, `is_externo = true`, `cargo = 'Rigger'`) e `id_user = 13` (`MATIAS BARRALES`, `is_externo = true`, `cargo = 'Rigger'`) tenían registros asociados a `id_rol = 1` (`Admin`) en `tsec_user_roles` (además de `id_rol = 31` `GSP_PROG` en `id_user = 10` y `id_user = 46` `OMAR SOFFIA` en `DEV`).
- **Inspección en `acreditacionModel.js` (`crearPersonalExterno`) y `ModalEnviarCotizacion.vue` / `GestorOportunidades.vue`:**
  - `crearPersonalExterno` insertaba en `tsec_users` sin purgar posibles registros huérfanos previos en `tsec_user_roles` para ese `id_user` ni asignar explícitamente `GSP_EJEC`.
  - `ModalEnviarCotizacion.vue` incluía en Copia Conforme a todo `u` en `adminUserIds` / `coordUserIds` sin excluir `is_externo === true`, correos `rigger.ext.*` ni cargos operativos (`Operador`, `Rigger`, `Chofer`, `Técnico`).
  - `usuariosNotificablesGestion` en `GestorOportunidades.vue` solo excluía `operador`, `rigger` y `chofer`, dejando pasar `Técnico Taller Mantenimiento` y usuarios con `is_externo`.

---

## 4. Causa Raíz de Arquitectura (Software / State Machine / Datos)
1. **Registros residuales en `tsec_user_roles` (`id_rol = 1` / `id_rol = 31`):** Al reciclarse IDs en `tsec_users` o asignarse roles en pruebas previas, las filas `id_user IN (10, 11, 13)` conservaron `id_rol = 1` (`Admin`) en `sch_leangsp_prod.tsec_user_roles`.
2. **Falta de filtro defensivo de personal externo/terreno en `ModalEnviarCotizacion.vue` y `GestorOportunidades.vue`:** Los selectores de notificaciones administrativas no descartaban cuentas `rigger.ext.*`, `is_externo = true` ni cargos de taller/mantenimiento.

---

## 5. Plan de Mitigación y Resolución
1. **Saneamiento en Base de Datos (`sch_leangsp_prod` y `sch_leangsp`):**
   - Eliminación de `id_rol = 1` (`Admin`) e `id_rol = 31` (`GSP_PROG`) para `id_user IN (10, 11, 13)` en `sch_leangsp_prod.tsec_user_roles` y `id_user = 46` en `sch_leangsp.tsec_user_roles`, asignándoles exclusivamente `GSP_EJEC` (`id_rol = 34`) y `USR-CONSENT` (`id_rol = 3`).
   - Normalización de `json_data.cargo = "Operador"` para `id_user IN (8, 10)` y eliminación de registros huérfanos en `tsec_user_roles`.
   - Usuarios activos con rol **`Admin`** en Producción acotados estrictamente a:
     - **Omar Ghiselini** (`omar.ghiselini@arriendosanpablo.cl`)
     - **Jorge Ponce** (`jponce@arriendosanpablo.cl`)
     - **Sergio Gajardo** (`sgajardoc@gmail.com`)
2. **Backend (`ejecucion/backend_remoto/src/models/acreditacionModel.js`):**
   - En `crearPersonalExterno`, limpieza explícita de `tsec_user_roles` para el `id_user` creado e inserción exclusiva del rol `GSP_EJEC`.
3. **Frontend (`ModalEnviarCotizacion.vue` y `GestorOportunidades.vue` — `v1.0.178`):**
   - Incorporación de `esElegibleCC` en `ModalEnviarCotizacion.vue` y refuerzo de `usuariosNotificablesGestion` en `GestorOportunidades.vue` para excluir cuentas `rigger.ext.*`, `is_externo === true` y cargos operativos/taller (`operador`, `rigger`, `chofer`, `técnico`, `mecanico`, `mantencion`).

---

## 6. Protocolo de Respuesta y Guía al Usuario / Operador
- Los roles administrativos en Producción y Desarrollo fueron depurados: los riggers externos (**Carlos Alberto Acuña**, **Matías Barrales**) y operadores (**Alfonso Porperello**, **Daniel Sepúlveda**) ya no poseen rol `Admin` ni aparecen en la Copia Conforme (CC) de cotizaciones ni en los selectores de gestión.
- Actualmente solo **Omar Ghiselini**, **Jorge Ponce** y **Sergio Gajardo** figuran como `Admin` activos, junto con los coordinadores de operaciones en `COORD`.

---

## 7. Lecciones Aprendidas y Acciones Preventivas
- Todo alta de personal externo de faena (`crearPersonalExterno`) debe limpiar e inicializar determinísticamente su rol en `tsec_user_roles` como `GSP_EJEC`.
- Los selectores de notificaciones comerciales y operacionales deben aplicar doble candado: validación positiva de rol RBAC y exclusión explícita de cuentas externas (`is_externo` / `rigger.ext.*`) y cargos de terreno/taller.
