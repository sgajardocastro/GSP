# 📋 Caso de Soporte: CASO-20261007-02
## Rechazo de Acceso con Cuenta Google Corporativa (`jponce@arriendosanpablo.cl`) por Desalineación de Entornos (DEV vs PROD)

---

### 1. Ficha del Incidente
* **ID Caso:** `CASO-20261007-02`
* **Fecha / Hora de Registro:** 2026-10-07 22:45:00 (-03:00)
* **Usuario Afectado:** Jorge Ponce (`id_user: 3` en PROD / `id_user: 19` en DEV)
* **Casilla Corporativa Reclamada:** `jponce@arriendosanpablo.cl`
* **Casilla Histórica Personal:** `j.poncenavarrete@gmail.com`
* **Ambiente donde se intentó el acceso:** Desarrollo / Pruebas (**DEV** - PWA `v1.0.33`, URL: `https://servidor.leanglobal.cl/pwa-gsp-dev/`)
* **Ambiente donde se realizó el nuevo enrolamiento:** Producción (**PROD** - Base de datos `sch_leangsp_prod`)
* **Severidad:** **ALTA (Bloqueo de Acceso a Plataforma Operativa)**
* **Estado:** `DIAGNOSTICADO - EN ESPERA DE REGULARIZACIÓN Y COMUNICACIÓN`

---

### 2. Síntoma Reportado
Jorge Ponce, quien operaba habitualmente con su cuenta Gmail (`j.poncenavarrete@gmail.com`), completó su enrolamiento con la cuenta corporativa del dominio de la empresa (`jponce@arriendosanpablo.cl`).
Al intentar acceder a la aplicación desde su teléfono iPhone pulsando el botón **"Acceder con Google"**, la interfaz despliega una alerta roja bloqueante:
> *"Usuario no registrado en la plataforma. Verifica que tu correo esté registrado."*

La administración revisó el enrolamiento y constató que el usuario figura enrolado, manifestando la duda de por qué el sistema deniega el acceso.

---

### 3. Diagnóstico Técnico & Evidencia Empírica en Base de Datos

Se ejecutaron consultas SQL de auditoría profunda en el motor PostgreSQL de la plataforma (`138.255.103.18`), comparando los esquemas `sch_leangsp` (DEV) y `sch_leangsp_prod` (PROD):

#### 3.1. Estado de Cuentas en Ambiente DEV (`sch_leangsp.tsec_users`):
```sql
SELECT id_user, codi_user, email, name_frst, apellido_pat, rut, activo, flag_proc_enrol, email_alternativo 
FROM sch_leangsp.tsec_users 
WHERE LOWER(email) LIKE '%ponce%' OR LOWER(codi_user) LIKE '%ponce%';
```
* **Resultado:**
  * `id_user`: **19**
  * `codi_user`: `j.poncenavarrete@gmail.com`
  * `email`: `j.poncenavarrete@gmail.com`
  * `email_alternativo`: `jponce@arriendosanpablo.cl`
  * `activo`: `true`
  * **Hallazgo Crítico:** En DEV **NO EXISTE** ningún registro cuyo campo `email` o `codi_user` sea `jponce@arriendosanpablo.cl`. Solo figura guardado como correo alternativo de su usuario personal.

#### 3.2. Estado de Cuentas en Ambiente PRODUCCIÓN (`sch_leangsp_prod.tsec_users`):
```sql
SELECT id_user, codi_user, email, name_frst, apellido_pat, rut, id_empresa, activo, flag_proc_enrol 
FROM sch_leangsp_prod.tsec_users 
WHERE LOWER(email) LIKE '%ponce%' OR LOWER(codi_user) LIKE '%ponce%';
```
* **Resultado:**
  * **Cuenta Corporativa (ID `3`):**
    * `codi_user`: `jponce@arriendosanpablo.cl`
    * `email`: `jponce@arriendosanpablo.cl`
    * `name_frst`: Jorge, `apellido_pat`: Navarrete, `apellido_mat`: Ponce
    * `rut`: `9-2`
    * `id_empresa`: `NULL`
    * `activo`: **`true`**
    * `flag_proc_enrol`: `false` (Enrolado y firmado)
    * `fecha_creacion`: `2026-10-05 10:49:00`
  * **Cuenta Personal Legacy (ID `19`):**
    * `codi_user`: `j.poncenavarrete@gmail.com`
    * `email`: `j.poncenavarrete@gmail.com`
    * `activo`: **`false` (Desactivada)**

---

### 4. Causa Raíz de Arquitectura (Software & Ambientes)

El bloqueo responde a la conjunción de dos factores operacionales:

1. **Ingreso a URL Errónea / Caché de Marcha Blanca (DEV):**
   - La captura de pantalla remitida por el usuario muestra explícitamente en el encabezado superior izquierdo:  
     👉 **`GSP Operaciones v1.0.33`**.
   - Dicha versión corresponde al bundle compilado para **DEV** (`https://servidor.leanglobal.cl/pwa-gsp-dev/`).
   - El endpoint de autenticación `/api/auth/login-google` en DEV ejecuta:
     ```sql
     SELECT * FROM sch_leangsp.tsec_users 
     WHERE LOWER(codi_user) = LOWER($1) OR LOWER(email) = LOWER($1);
     ```
   - Al buscar `jponce@arriendosanpablo.cl` en la base de datos de DEV, el query retorna 0 filas (porque en DEV solo existe `j.poncenavarrete@gmail.com`).
   - En consecuencia, el backend DEV emite HTTP 404, disparando el mensaje *"Usuario no registrado en la plataforma"*.

2. **Asignación de Empresa en Producción:**
   - En Producción (`sch_leangsp_prod.tsec_users`), el usuario `id_user = 3` (`jponce@arriendosanpablo.cl`) tiene `id_empresa = NULL`. Debe regularizarse a `id_empresa = 9` (Grúas San Pablo) para garantizar que herede correctamente el contexto multi-tenant tras loguearse.

---

### 5. Plan de Acción y Solución Definitiva

#### Paso 1: Regularización en Base de Datos de Producción (`sch_leangsp_prod`)
Asegurar que la cuenta corporativa `id_user = 3` tenga asignada su empresa:
```sql
UPDATE sch_leangsp_prod.tsec_users 
SET id_empresa = 9 
WHERE id_user = 3;
```

#### Paso 2: Homologación en Base de Datos de Desarrollo (`sch_leangsp`)
Para evitar que Jorge quede bloqueado si en el futuro vuelve a abrir el entorno de pruebas, actualizar su registro en DEV:
```sql
UPDATE sch_leangsp.tsec_users 
SET codi_user = 'jponce@arriendosanpablo.cl', 
    email = 'jponce@arriendosanpablo.cl' 
WHERE id_user = 19;
```

#### Paso 3: Indicación de Soporte al Usuario Final (Jorge Ponce)
Transmitir la instrucción al usuario para que ingrese a la aplicación oficial de Producción y no al entorno de pruebas:
1. Cerrar o desinstalar la versión de pruebas (`v1.0.33`).
2. Abrir en Safari o Chrome la URL oficial de Producción:  
   👉 **`https://servidor.leanglobal.cl/pwa-gsp-prod/`** (Versión `v1.0.36`).
3. Pulsar **"Acceder con Google"** y seleccionar su cuenta corporativa **`jponce@arriendosanpablo.cl`**.

---

### 6. Procedimiento Preventivo para Mesa de Ayuda
* Cuando un usuario reporte *"Usuario no registrado"*, lo primero que debe verificar el operador de soporte en la pantalla del usuario es la versión en la esquina superior izquierda:
  * Si dice **`v1.0.33`**, el usuario está en la app de pruebas (**DEV**).
  * Si dice **`v1.0.36`**, el usuario está en la app oficial (**PROD**).
* Reenviar inmediatamente el acceso directo a Producción: `https://servidor.leanglobal.cl/pwa-gsp-prod/`.
