# Especificación Técnica: Replicación, Aprovisionamiento y Despliegue de Ambiente Producción (Spec 42)

## 1. 📌 Objetivo y Alcance
Esta especificación formaliza el estándar determinístico para la creación, aislamiento, despliegue y mantenimiento del **Ambiente de Producción (`PROD`)** para Grúas San Pablo (GSP) en el servidor de infraestructura (`servidor.leanglobal.cl` / `138.255.103.18`).

Garantiza la coexistencia pacífica e independiente entre el entorno de **Desarrollo / QA (`DEV`)** y el entorno de **Producción (`PROD`)**, eliminando cualquier riesgo de colisión de base de datos, mezcla de archivos documentales (PDFs/firmas) o interrupción de servicios por reinicios concurrentes.

---

## 2. 🏛️ Matriz Canónica de Aislamiento de Ambientes

| Pilar Arquitectónico | 🧪 Ambiente DEV / QA | 🚀 Ambiente PRODUCCIÓN (PROD) | Aislamiento / Mecanismo |
| :--- | :--- | :--- | :--- |
| **URL Web Console CRM** | `https://servidor.leanglobal.cl/lg-gsp-dev/` | `https://servidor.leanglobal.cl/lg-gsp-prod/` | Alias NGINX independiente |
| **Directorio Físico Web** | `/var/www/html/lg-gsp-dev/` | `/var/www/html/lg-gsp-prod/` | Directorio web aislado |
| **URL PWA Móvil** | `https://servidor.leanglobal.cl/pwa-gsp-dev/` | `https://servidor.leanglobal.cl/pwa-gsp-prod/` | Alias NGINX independiente |
| **Directorio Físico PWA** | `/var/www/html/pwa-gsp-dev/` | `/var/www/html/pwa-gsp-prod/` | Directorio web aislado |
| **URL Base API Backend** | `https://servidor.leanglobal.cl/lg-gsp/api` | `https://servidor.leanglobal.cl/lg-gsp-prod/api` | Proxy inverso dedicado |
| **Proceso PM2** | `lean-services-gsp` (ID 10) | `lean-services-gsp-prod` | Proceso Node.js aislado |
| **Puerto Interno Backend** | `3006` | `3016` (o puerto libre asignado) | Socket TCP independiente |
| **Directorio Backend** | `/var/www/backend/lean-services-gsp/` | `/var/www/backend/lean-services-gsp-prod/` | Árbol de código versionado |
| **Schema PostgreSQL** | `sch_leangsp` | `sch_leangsp_prod` | Esquema relacional segregado |
| **Gestor Documental (Storage)**| `/u05/LeanDocs/GSP/dev/` | `/u05/LeanDocs/GSP/prod/` | Sistema de archivos particionado |

---

## 3. 🌐 Configuración NGINX Oficial (`/etc/nginx/default.d/base.conf`)

El servidor web NGINX canaliza el tráfico público mediante bloques determinísticos con soporte para HTML5 History Mode (`try_files`) y proxy inverso seguro:

```nginx
# ==============================================================================
# 🚀 GRUAS SAN PABLO (GSP) - AMBIENTE DE PRODUCCION (PROD)
# ==============================================================================

# 1. Redirección canónica de trailing slash Web Console
location = /lg-gsp-prod {
    return 301 $scheme://$http_host/lg-gsp-prod/;
}

# 2. Proxy Inverso API Backend Producción (Máxima precedencia de URI)
location /lg-gsp-prod/api/ {
    proxy_pass http://127.0.0.1:3016/api/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}

# 3. Web Console CRM & Torre de Control Producción
location /lg-gsp-prod/ {
    alias /var/www/html/lg-gsp-prod/;
    try_files $uri $uri/ /lg-gsp-prod/index.html;
    autoindex off;
}

# 4. Redirección canónica de trailing slash PWA Móvil
location = /pwa-gsp-prod {
    return 301 $scheme://$http_host/pwa-gsp-prod/;
}

# 5. PWA Móvil de Terreno Producción
location /pwa-gsp-prod/ {
    alias /var/www/html/pwa-gsp-prod/;
    try_files $uri $uri/ /pwa-gsp-prod/index.html;
    autoindex off;
}
```

---

## 4. 🗄️ Base de Datos: Schema `sch_leangsp_prod`

### 4.1. Reglas de Aislamiento e Invarianza de Datos
1. **Zero Colisiones:** Toda tabla, vista, función, secuencia y tipo enum de producción reside estrictamente en el esquema **`sch_leangsp_prod`**.
2. **Clonación Estructural:** Se genera un script DDL idempotente que replica la estructura exacta de `sch_leangsp` hacia `sch_leangsp_prod`.
3. **Carga Limpia de Maestros (Cero Basura de Pruebas):**
   * Se migran exclusivamente los catálogos base activos:
     * Categorías de Flota: `tequ_categoria` (Categorías 40, 62, 65, 70, 72, 102, 150, 151).
     * Parque de Máquinas y Equipos: `tequ_equipo`.
     * Templates de Formularios y Encuestas: `tsrv_template` (Template 80: Visita Terreno, 76: Checklist Patio, etc.).
     * Roles y Permisos RBAC: `tsec_roles`, `tsec_user_roles`.
     * Nómina de Usuarios Reales y Operativos: `tsec_users`.
     * Empresas Emisoras: `tpar_empresas` (San Pablo, Bestmaq, Logística del Sur, Royal Rental).
   * **Prohibido:** No se migran proyectos de prueba (`tpry_proyecto`), inspecciones dummy (`tsrv_survey`) ni reportes temporales.

---

## 5. ⚙️ Backend API Dedicado (`lean-services-gsp-prod`)

### 5.1. Variables de Entorno del Backend (`.env`)
```env
PORT=3016
NODE_ENV=production
DB_SCHEMA=sch_leangsp_prod
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=usr_leangsp
DB_NAME=db_leanglobal
STORAGE_PATH=/u05/LeanDocs/GSP/prod
JWT_SECRET=lg_prod_secret_gsp_2026_secure
BASE_URL_PUBLIC=https://servidor.leanglobal.cl/lg-gsp-prod/api
```

### 5.2. Erradicación de Schemas Hardcodeados (Auditoría Cero Confianza)
* **Regla:** Ningún modelo o controlador debe contener la cadena literal `'sch_leangsp.'`.
* **Mecanismo Dinámico:**
  1. En `db.js` / pool de PostgreSQL:
     ```javascript
     const schema = process.env.DB_SCHEMA || 'sch_leangsp_prod';
     pool.on('connect', (client) => {
       client.query(`SET search_path TO ${schema}, public`);
     });
     ```
  2. En consultas con schema calificado:
     ```javascript
     const schema = process.env.DB_SCHEMA || 'sch_leangsp_prod';
     const query = `SELECT * FROM ${schema}.tpry_proyecto WHERE id_proyecto = $1`;
     ```

---

## 6. 📁 Gestor Documental y Almacenamiento de Archivos (`STORAGE_PATH`)

Siguiendo el estándar [**`00_file_storage_standard_spec.md`**](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/.agents/specs/00_file_storage_standard_spec.md):

1. **Ruta Física en Servidor:** `/u05/LeanDocs/GSP/prod/`
2. **Estructura Interna de Carpetas:**
   ```
   /u05/LeanDocs/GSP/prod/
   ├── cotizaciones/     # PDFs generados de Cotizaciones Comerciales
   ├── ots/              # PDFs de Órdenes de Trabajo
   ├── edp/              # Dossiers PDF de Estados de Pago
   ├── surveys/          # Informes PDF de Visitas a Terreno y Checklists
   ├── firmas/           # Firmas FES y estampas digitales
   └── acreditaciones/   # Documentos y certificados de flota/personal
   ```
3. **Permisos de Servidor:** `chown -R nodeadmin:nodeadmin /u05/LeanDocs/GSP/prod/` y permisos `775`.

---

## 7. 🧪 Protocolo de Certificación y Pase a Producción (Healthcheck)

Para certificar el ambiente de Producción antes de la entrega final a usuarios de negocio:

1. **Gate A - Web Console:**
   * `curl -I https://servidor.leanglobal.cl/lg-gsp-prod/` ➔ **HTTP 200 OK**.
   * Login Google Workspace funcional con redirección correcta.
2. **Gate B - PWA Móvil:**
   * `curl -I https://servidor.leanglobal.cl/pwa-gsp-prod/` ➔ **HTTP 200 OK**.
   * Carga de Service Workers y modo offline funcional.
3. **Gate C - Backend API & Base de Datos:**
   * `curl -I https://servidor.leanglobal.cl/lg-gsp-prod/api/health` ➔ **HTTP 200 OK**.
   * Consulta a tabla `sch_leangsp_prod.tequ_categoria` retorna 8 categorías activas.
4. **Gate D - Gestor Documental:**
   * Prueba de escritura/lectura en `/u05/LeanDocs/GSP/prod/` validada exitosamente.

---
*Especificación oficial aprobada para la gobernanza del ciclo de vida de infraestructura GSP.*
