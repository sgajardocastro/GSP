# 📄 Especificación Técnica: Autenticación e Identidad Google Workspace OAuth 2.0 (GSP Core)

## 📌 1. Visión General y Arquitectura de Identidad

Esta especificación norma el protocolo oficial de autenticación de usuarios para el ecosistema **Grúas San Pablo (GSP)** y la plataforma **LeanGlobal**.

### Principios Fundamentales:
1. **Google Workspace OAuth 2.0 (Federado):** Todos los usuarios del dominio corporativo `@arriendosanpablo.cl` y correos autorizados (`@gmail.com`) se autentican mediante el botón **"Continuar con Google"**.
2. **Autenticación en Cualquier Dispositivo:** En dispositivos o navegadores donde la cuenta corporativa no esté iniciada previamente, el popup oficial de Google ([accounts.google.com](https://accounts.google.com)) solicitará las credenciales directamente al usuario. **Jamás se capturan ni almacenan contraseñas de Google en formularios locales o tablas de la base de datos.**
3. **Cero Dependencia Legacy:** Queda estrictamente eliminada toda verificación basada en POP3 socket o conectores con el dominio `transmac.cl`.

---

## 🛠️ 2. Especificación de Componentes

### 2.1 Frontend (`Login.vue`)
- **Botón Google OAuth:** Prominente, invocando Google Identity Services (GIS).
- **Flujo Popup:** Google se encarga de resolver la identidad independientemente del estado de sesión del navegador.
- **Formulario Local:** Reservado únicamente para usuarios internos que posean credenciales asignadas en la plataforma.

### 2.2 Backend (`authController.js`)
- **Endpoint `POST /api/auth/loginGoogle`:**
  - Recibe `id_token` emitiendo la verificación a `https://oauth2.googleapis.com/tokeninfo`.
  - Valida dominios autorizados: `endsWith('@arriendosanpablo.cl')` o `endsWith('@gmail.com')`.
  - Emite token JWT firmado con expiración de 24h conteniendo `flag_proc_enrol`, `id_user`, `id_empresa`, `email` y `rut`.

---

## 🔒 3. Matriz de Seguridad y Excepciones

| Dominio | Método de Autenticación | Proveedor Identity |
| :--- | :--- | :--- |
| **`@arriendosanpablo.cl`** | Google OAuth 2.0 | Google Workspace |
| **`@gmail.com` (Autorizados)** | Google OAuth 2.0 | Google Account |
| **`@transmac.cl` (Legacy)** | **DEPRECADO / DESACTIVADO** | Ninguno |
