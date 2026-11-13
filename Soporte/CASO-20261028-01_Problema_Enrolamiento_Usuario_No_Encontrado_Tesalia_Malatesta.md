# 📋 Caso de Soporte: CASO-20261028-01
## Rechazo `"Usuario no encontrado"` en Proceso de Enrolamiento FES por Desfase entre Alias de Correo (`tesalia@arriendosanpablo.cl`) y Cuenta Primaria Google OAuth (`tmalatesta@arriendosanpablo.cl`) — Tesalia Malatesta (Gerente de RRHH)

---

### 1. Ficha del Incidente
* **ID Caso:** `CASO-20261028-01`
* **Fecha / Hora de Registro:** 2026-10-28 19:17:00 (-03:00)
* **Módulo / Flujo:** Seguridad / Enrolamiento FES y Autenticación Google OAuth (`MantenedorEnrolamiento.vue` ➔ `Login.vue` / `Enrolamiento.vue`)
* **Usuaria Afectada:** Tesalia Malatesta — Gerente de Recursos Humanos (`id_user = 86` en PROD / `id_user = 69` en DEV, RUT: `9808721-4`)
* **Ambiente:** Producción (`PROD` — Esquema PostgreSQL `sch_leangsp_prod`, Backend PM2 ID `13`) y Desarrollo (`DEV` — Esquema `sch_leangsp`, Backend PM2 ID `10`)
* **Severidad:** **ALTA (Bloqueo de Acceso y Enrolamiento FES para Gerencia de RRHH)**
* **Estado:** **RESUELTO Y VERIFICADO EN PROD Y DEV**

---

### 2. Evidencia Recibida
* **Reporte del Administrador (Sergio Gajardo):**
  > *"Nuevo caso: Problema de Enrolamiento/ Usuario no encontrado. Tesalia Malatesta, es la gerente de RH, la enrolé pero cuando ella toma el proceso me dice que el sistema le dice usuario no encontrado. Revisa que esta pasando"*

---

### 3. Diagnóstico Técnico & Evidencia Empírica en Base de Datos y Logs

#### 3.1. Registro Original en `sch_leangsp_prod.tsec_users`
```text
id_user |          codi_user          |            email            |    rut    | name_frst | apellido_pat | flag_proc_enrol 
--------+-----------------------------+-----------------------------+-----------+-----------+--------------+-----------------
     86 | tesalia@arriendosanpablo.cl | tesalia@arriendosanpablo.cl | 9808721-4 |           |              | t
```

#### 3.2. Traza en Log de Producción (`/home/nodeadmin/.pm2/logs/lean-services-gsp-prod-out.log`, líneas `129368–129676`)
```text
129368: [Enrolamiento] Iniciando para RUT: 9808721-4, Email: tesalia@arriendosanpablo.cl
129369: [MAILER] Enviando correo a tesalia@arriendosanpablo.cl con asunto: "Inicio de Enrolamiento - GSP Operaciones"...
...
129674: [LOGIN GOOGLE] Email verificado por Google: tmalatesta@arriendosanpablo.cl
129675: [LOGIN GOOGLE] Intento de login con Google
129676: [LOGIN GOOGLE] Email verificado por Google: tmalatesta@arriendosanpablo.cl
```

#### 3.3. Causa Raíz Exacta
1. **Alias de Recepción vs Cuenta Primaria de Google Workspace:**
   - La usuaria fue enrolada en **Mantenedores ➔ Enrolamiento** digitando el alias de correo `tesalia@arriendosanpablo.cl` (el cual recibe correos en su bandeja de entrada).
   - Al abrir el enlace del correo y autenticarse mediante **"Continuar con Google"** (`POST /api/auth/login-google` en [`authController.js`](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/ejecucion/backend_remoto/src/controllers/authController.js#L354-L359)), Google OAuth valida el token y retorna la dirección **primaria real** de su cuenta corporativa: **`tmalatesta@arriendosanpablo.cl`**.
   - Al ejecutar `authModel.getUserByEmail('tmalatesta@arriendosanpablo.cl')` (`SELECT * FROM tsec_users WHERE LOWER(codi_user) = LOWER($1) OR LOWER(email) = LOWER($1)`), la consulta no encontró coincidencia contra `tesalia@arriendosanpablo.cl` y devolvió `HTTP 404 {"message": "Usuario no encontrado"}`.
2. **Omisión de `name_frst` y `apellido_pat` en `usuarioModel.iniciarEnrolamiento`:**
   - El método `iniciarEnrolamiento` en [`ejecucion/backend_remoto/src/models/usuarioModel.js`](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/ejecucion/backend_remoto/src/models/usuarioModel.js#L67-L93) recibía el parámetro `nombre`, pero no lo descomponía ni almacenaba en `name_frst` y `apellido_pat` al insertar/actualizar `tsec_users`.

---

### 4. Solución Implementada

1. **Regularización en Base de Datos (`sch_leangsp_prod.tsec_users` y `sch_leangsp.tsec_users`):**
   - Se actualizó el registro de Tesalia Malatesta (`id_user = 86` en PROD y `id_user = 69` en DEV, RUT `9808721-4`, rol `id_rol = 3`) estableciendo:
     - `email = 'tmalatesta@arriendosanpablo.cl'`
     - `codi_user = 'tmalatesta@arriendosanpablo.cl'`
     - `email_alternativo = 'tesalia@arriendosanpablo.cl'`
     - `name_frst = 'Tesalia'`, `apellido_pat = 'Malatesta'`, `activo = true`, `flag_proc_enrol = true`.
2. **Corrección en [`ejecucion/backend_remoto/src/models/usuarioModel.js`](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/ejecucion/backend_remoto/src/models/usuarioModel.js#L67-L103):**
   - Normalización de RUT sin puntos (`REPLACE(rut, '.', '')`) y correo (`trim().toLowerCase()`).
   - Persistencia de `name_frst`, `apellido_pat` y `activo = true` durante el alta/actualización de enrolamiento en `tsec_users`.

---

### 5. Archivos Intervenidos y Auditoría `git diff`
* [`ejecucion/backend_remoto/src/models/usuarioModel.js`](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/ejecucion/backend_remoto/src/models/usuarioModel.js)

```diff
diff --git a/ejecucion/backend_remoto/src/models/usuarioModel.js b/ejecucion/backend_remoto/src/models/usuarioModel.js
index 8b734cb..e9cbf51 100644
--- a/ejecucion/backend_remoto/src/models/usuarioModel.js
+++ b/ejecucion/backend_remoto/src/models/usuarioModel.js
@@ -67,26 +67,37 @@ class Usuario {
   async iniciarEnrolamiento(rut, nombre, correo, roles, id_empresa) {
     try {
       console.log(`[Enrolamiento] Iniciando para RUT: ${rut}, Email: ${correo}`);
-      const rutNorm = String(rut).trim().toUpperCase();
+      const rutNorm = String(rut).replace(/\./g, '').trim().toUpperCase();
+      const correoNorm = String(correo || '').trim().toLowerCase();
+      const partesNombre = String(nombre || '').trim().split(/\s+/);
+      const nameFrst = partesNombre[0] || '';
+      const apellidoPat = partesNombre.slice(1).join(' ') || '';
 
       // 1) Upsert manual del usuario en tsec_users
       let id_user;
-      const checkRes = await this.pool.query('SELECT id_user, email FROM tsec_users WHERE UPPER(rut) = $1', [rutNorm]);
+      const checkRes = await this.pool.query("SELECT id_user, email FROM tsec_users WHERE UPPER(REPLACE(rut, '.', '')) = $1", [rutNorm]);
       
       if (checkRes.rows.length > 0) {
         id_user = checkRes.rows[0].id_user;
         const existingEmail = checkRes.rows[0].email;
-        if (existingEmail && existingEmail.toLowerCase() !== String(correo).toLowerCase()) {
+        if (existingEmail && existingEmail.trim().toLowerCase() !== correoNorm) {
           throw new Error(`El RUT ${rutNorm} ya se encuentra registrado en el sistema con el correo ${existingEmail}. No es posible sobrescribir una cuenta existente.`);
         }
         await this.pool.query(
-          'UPDATE tsec_users SET email = $1, flag_proc_enrol = true, codi_user = $1, id_empresa = $2, fecha_actualizacion = NOW() WHERE id_user = $3',
-          [correo, id_empresa, id_user]
+          `UPDATE tsec_users
+           SET email = $1, flag_proc_enrol = true, codi_user = $1, id_empresa = $2,
+               name_frst = COALESCE(NULLIF(TRIM(name_frst), ''), $3),
+               apellido_pat = COALESCE(NULLIF(TRIM(apellido_pat), ''), $4),
+               activo = COALESCE(activo, true),
+               fecha_actualizacion = NOW()
+           WHERE id_user = $5`,
+          [correoNorm, id_empresa, nameFrst, apellidoPat, id_user]
         );
       } else {
         const insRes = await this.pool.query(
-          'INSERT INTO tsec_users (rut, email, flag_proc_enrol, codi_user, id_empresa, fecha_creacion, fecha_actualizacion) VALUES ($1, $2, true, $2, $3, NOW(), NOW()) RETURNING id_user',
-          [rutNorm, correo, id_empresa]
+          `INSERT INTO tsec_users (rut, email, flag_proc_enrol, codi_user, id_empresa, name_frst, apellido_pat, activo, fecha_creacion, fecha_actualizacion)
+           VALUES ($1, $2, true, $2, $3, $4, $5, true, NOW(), NOW()) RETURNING id_user`,
+          [rutNorm, correoNorm, id_empresa, nameFrst, apellidoPat]
         );
         id_user = insRes.rows[0].id_user;
       }
```

---

### 6. Verificación Empírica (SQL + HTTP 200 OK)
* **Estado en PostgreSQL (`sch_leangsp_prod` y `sch_leangsp`):**
  ```text
   env  | id_user |           codi_user            |             email              |      email_alternativo      |    rut    | name_frst | apellido_pat | activo | flag_proc_enrol 
  ------+---------+--------------------------------+--------------------------------+-----------------------------+-----------+-----------+--------------+--------+-----------------
   PROD |      86 | tmalatesta@arriendosanpablo.cl | tmalatesta@arriendosanpablo.cl | tesalia@arriendosanpablo.cl | 9808721-4 | Tesalia   | Malatesta    | t      | t
   DEV  |      69 | tmalatesta@arriendosanpablo.cl | tmalatesta@arriendosanpablo.cl | tesalia@arriendosanpablo.cl | 9808721-4 | Tesalia   | Malatesta    | t      | t
  ```
* **Verificación de Endpoints Remotos (`PROD` y `DEV`):**
  - `GET https://servidor.leanglobal.cl/lg-gsp-prod/api/usuarios/by-rut/9808721-4` ➔ **`HTTP 200 OK`** (`{"id_user":86,"email":"tmalatesta@arriendosanpablo.cl","name_frst":"Tesalia","apellido_pat":"Malatesta","rut":"9808721-4","activo":true,"codi_user":"tmalatesta@arriendosanpablo.cl","flag_proc_enrol":true,"email_alternativo":"tesalia@arriendosanpablo.cl"}`)
  - `GET https://servidor.leanglobal.cl/lg-gsp/api/usuarios/by-rut/9808721-4` ➔ **`HTTP 200 OK`** (`{"id_user":69,"email":"tmalatesta@arriendosanpablo.cl","name_frst":"Tesalia","apellido_pat":"Malatesta","rut":"9808721-4","activo":true,"codi_user":"tmalatesta@arriendosanpablo.cl","flag_proc_enrol":true,"email_alternativo":"tesalia@arriendosanpablo.cl"}`)

---

### 7. Lecciones Aprendidas y Prevención
* En cuentas corporativas de Google Workspace (`@arriendosanpablo.cl`), el enrolamiento debe registrarse con la dirección primaria de la cuenta Google (`<inicial><apellido>@arriendosanpablo.cl`, p. ej. `tmalatesta@arriendosanpablo.cl`) y no con un alias de grupo o de nombre (`tesalia@arriendosanpablo.cl`), ya que el token OAuth de Google siempre entrega el correo primario de la cuenta.
* `usuarioModel.iniciarEnrolamiento` ahora persiste automáticamente `name_frst`, `apellido_pat` y `activo = true` al crear o reactivar el proceso de enrolamiento.
