# 🏗️ Arquitectura y Dominio del Sistema: LeanGlobal / GSP

## 1. Backend & Infraestructura
- **Entorno de Servidor Remoto:** Servidor Linux bajo la cuenta `nodeadmin`.
- **Backend Node.js:** Ubicado en `/home/nodeadmin/proyectos/lean-services-gsp/` (`backend_remoto`).
- **Gestor de Procesos:** PM2 con el nombre `lean-services-gsp`.
- **Puerto Local Backend:** `3006`.
- **Base URL API:** `https://servidor.leanglobal.cl/lg-gsp/api`.
- **Proxy Nginx:** `/etc/nginx/sites-enabled/https_le.conf` (mapea `/lg-gsp/` al puerto `3006`).

## 2. Base de Datos & Aislamiento (Multi-Tenant)
- **Motor:** PostgreSQL (`pg` pool).
- **Tablas Parámetro (`tpar_*`):**
  - `tpar_empresas`: Registro maestro de clientes y empresas del grupo GSP.
- **Tablas Proyecto (`tpry_*`):**
  - `tpry_proyecto`: Cabecera de proyectos/cotizaciones.
  - `tpry_orden_trabajo`: Órdenes de trabajo operativas.
  - `tpry_recurso_asignado`: Asignación de tripulación y flota a OTs.
- **Tablas Inventario & Mantenimiento (`tinv_*`, `tmnt_*`):**
  - `tinv_bodega`, `tinv_producto`, `tinv_movimiento`.
  - `tmnt_orden_trabajo`, `tmnt_historial`.
- **Aislamiento Multi-Empresa:** Inyección obligatoria de `id_empresa` mediante middleware JWT en todas las consultas.

## 3. Seguridad de Despliegue
- Nunca matar procesos globales de Node.js en el servidor remoto.
- Manipular únicamente el proceso `lean-services-gsp` bajo el usuario `nodeadmin`.

## 4. Servicios de Mensajería y Correo Enriquecido B2B
- **Estándar Único de Correo:** Todos los documentos comerciales (cotizaciones, acuerdos, enrolamiento) deben ser despachados mediante plantillas HTML Enriquecidas corporativas con diseño responsivo, marcas de agua, resumen y botones CTA.
- **Regla Técnica de la API (`POST /message`):** En el backend de LeanGlobal (`messageModel.js`), el servidor asigna el valor recibido en el parámetro `cuerpo` directamente al campo `html` de Nodemailer (`html: req.body.cuerpo`).
- **Formato Obligatorio del Payload:** Todo cliente frontend o llamador de API DEBE enviar el string completo del marcado HTML enriquecido en el campo `cuerpo` (`{ para, asunto, cuerpo: htmlContent }`). Queda prohibido enviar texto plano plano o enviar la maqueta HTML en un atributo secundario `html:`, ya que causará que Nodemailer interprete el mensaje como texto sin formato.

