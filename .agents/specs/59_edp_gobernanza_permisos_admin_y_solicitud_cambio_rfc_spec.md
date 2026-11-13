# SPEC-059: Gobernanza de EDP — Permisos Globales de Administración (Sergio Gajardo), Solicitud de Cambio (RFC) y Notificaciones Omnicanal con Deep Link

## 1. Contexto y Objetivos del Requerimiento
En el ciclo de liquidación financiera y estados de pago (EDP) de Grúas San Pablo:
1. **Permisos de Administración:** El SuperAdministrador (`sgajardoc@gmail.com`, `id_user: 55`, `id_rol: 1`) debe contar con facultades plenas de auditoría, desbloqueo y modificación de tarifas pactadas, recargos y notas de descuento en el EDP, compartiendo esta facultad de gobernanza con la Gerente de Tesorería (**Pamela Seguel**).
2. **Procedimiento RFC (Request for Change / Solicitud de Modificación):** Cuando un usuario con rol operativo o analítico (Analista PMO, Jefe de Operaciones, Ejecutivo Comercial) detecte una discrepancia o requiera un descuento, no debe quedar bloqueado pasivamente. La plataforma debe ofrecer un flujo formal de **Solicitud de Modificación de EDP** que:
   - Capture el motivo estructurado, detalle del ajuste requerido y monto estimado.
   - Persista la solicitud auditada en la base de datos (`edp_solicitudes_ajuste`).
   - Notifique de inmediato a los usuarios habilitados para edición (Pamela Seguel y Sergio Gajardo) vía **Correo Electrónico Transaccional** y **WhatsApp** (Microservicio Baileys).
   - Inyecte un **Deep Link Contextual** directo hacia la Torre de Control / EDP del proyecto en cumplimiento estricto del skill `leanglobal_notification_standard`.

---

## 2. Arquitectura de Permisos y Roles (Matriz RBAC)

| Perfil / Usuario | Rol / Identificador | Facultad en Carátula EDP | Banner de Gobernanza |
| :--- | :--- | :--- | :--- |
| **Sergio Gajardo (Admin)** | `sgajardoc@gmail.com` / `id_rol: 1` / `es_admin` | **Edición Total Directa** (Tarifas, Descuento, Justificación, Guardar) | ⭐ *Perfil Administrador del Sistema (Sergio Gajardo)* |
| **Pamela Seguel (Tesorería)** | `pamela@arriendosanpablo.cl` / `id_rol: 33` (`GSP_CONTA`) | **Edición Total Directa** (Tarifas, Descuento, Justificación, Guardar) | ⭐ *Perfil Gerencia de Tesorería (Pamela Seguel)* |
| **Analista PMO / Comercial / Operaciones** | Roles `31` (`GSP_PROG`), `32` (`GSP_EJEC`), u otros sin privilegios | **Solo Lectura + Solicitud Formal (RFC)** | 🔒 *Gobernanza de EDP + Botón [ 📝 Solicitar Modificación ]* |

---

## 3. Endpoints de Backend

### 3.1. Corrección en `POST /api/operaciones/edp/ajustes-tesoreria`
- **Controlador:** `backend_remoto/src/controllers/estadoPagoController.js`
- **Modificación:** En lugar de validar únicamente `uRes.rows[0]`, inspecciona **todas** las filas de roles del usuario (`uRes.rows`), concediendo autorización si:
  * El array contiene `id_rol === 1` o rol con subcadena `ADMIN`.
  * El array contiene `id_rol === 33` o rol con subcadena `CONTA` / `TESOR`.
  * El email o nombre coincide con `sgajardo` o `pamela`.

### 3.2. Nuevo Endpoint `POST /api/operaciones/edp/solicitar-modificacion`
- **Parámetros:**
  ```json
  {
    "id_proyecto": 14,
    "id_user": 50,
    "tipo_modificacion": "Tarifa / Precio Unitario",
    "descripcion": "Rebajar 2 horas de sobretiempo flete acordado con cliente en terreno",
    "monto_estimado": 40000
  }
  ```
- **Lógica:**
  1. Inserta el registro en `tpry_proyecto.json_field -> edp_solicitudes_ajuste` con estado `'PENDIENTE'`.
  2. Resuelve la URL canónica mediante `notificacionService.construirDeepLink({ tipoApp: 'WEB', ruta: 'torre', params: { id_proyecto, subtab: 'pendientes_edp' } })`.
  3. Despacha notificación omnicanal (Email y WhatsApp) a Pamela y Sergio Gajardo detallando solicitante, OT, cliente y requerimiento.

### 3.3. Nuevo Endpoint `POST /api/operaciones/edp/resolver-solicitud-modificacion`
- **Parámetros:**
  ```json
  {
    "id_proyecto": 14,
    "id_solicitud": "rfc_1727891234",
    "id_user": 55,
    "accion": "APLICADA",
    "comentario_resolucion": "Tarifa corregida conforme a acuerdo"
  }
  ```
- **Lógica:** Actualiza el estado a `'APLICADA'` o `'DESCARTADA'` con trazabilidad de usuario y fecha.

---

## 4. Frontend y Experiencia de Usuario (UI/UX)

### 4.1. `ModalCaratulaEDP.vue`
1. **Computed de Autorización Robusta:**
   - Detecta si el usuario logueado en `localStorage` o en roles cargados es Admin (`sgajardoc@gmail.com`, `id_rol === 1`, `es_admin`) o Tesorería (Pamela).
2. **Banner Dinámico:**
   - Muestra el rol específico del firmante autorizado.
3. **Acción para Usuarios No Habilitados:**
   - Botón `[ 📝 Solicitar Modificación de EDP ]` en el banner.
   - Abre un submodal accesible con selector de tipo de cambio, justificación obligatoria y monto estimado.
4. **Bandeja de Requerimientos Pendientes:**
   - Bloque visible para Tesorería/Admin si hay solicitudes en estado `'PENDIENTE'`, con botón de aplicación rápida o resolución.

---

## 5. Criterios de Aceptación y Pruebas
1. Con `sgajardoc@gmail.com`, la carátula de EDP muestra inmediatamente el banner dorado de Administrador y el botón `[ ✏️ Ajustar Tarifas / Descuentos ]`.
2. Al guardar ajustes con `sgajardoc@gmail.com`, el backend responde `200 OK` (no `403`).
3. Con un usuario sin privilegios de edición, la carátula muestra el banner de Gobernanza y el botón `[ 📝 Solicitar Modificación ]`.
4. Al enviar una solicitud, se persiste en BD y se dispara la notificación omnicanal con Deep Link directo a la Torre de Control PMO.
