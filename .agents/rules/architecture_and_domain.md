## 1. Backend & Infraestructura
- **Entorno de Servidor Remoto:** Servidor Linux CentOS (`servidor.leanglobal.cl`).
- **Conexión SSH:**
  - **Host / IP:** `servidor.leanglobal.cl` (138.255.103.18)
  - **Puerto SSH:** `1295` (Protocolo SSHv2)
  - **Usuario Root:** `root`
  - **Password Root:** `lgbl2025.`
  - **Cuenta de Administración Backend:** `su - nodeadmin` (Ejecución de `git pull` y `pm2 restart 10` / `lean-services-gsp`).
- **Restricción Estricta de Ámbito:** Queda estrictamente prohibido modificar, detener o reiniciar cualquier otro backend o proceso distinto a `lean-services-gsp` (PID / PM2 ID: 10).
- **Ruta Backend Node.js:** Ubicado en `/home/nodeadmin/proyectos/lean-services-gsp/`.
- **Gestor de Procesos:** PM2 con el nombre `lean-services-gsp` (ID: 10).
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
- **Formato Obligatorio del Payload:** Todo cliente frontend o llamador de API DEBE enviar el string completo del marcado HTML enriquecido en el campo `cuerpo` (`{ para, asunto, cuerpo: htmlContent }`). Queda prohibido enviar texto plano o enviar la maqueta HTML en un atributo secundario `html:`, ya que causará que Nodemailer interprete el mensaje como texto sin formato.

## 5. Terminología de Dominio & Separación de Recursos
- **Terminología Oficial de Rigger:** Queda establecido como regla canónica del dominio que SIEMPRE se habla de **`Rigger`** (nunca de `Señalero` ni `Rigger / Señalero`).
- **Separación Semántica Estricta de Recursos:**
  - **Tabla 1 (Flota & Equipos):** Reservada ÚNICA Y EXCLUSIVAMENTE para maquinaria, grúas telescópicas, camiones pluma, vehículos livianos y equipos físicos de izaje/transporte.
  - **Tabla 2 (Tripulación & Personal Asignado):** Matriz donde se gestionan y asignan todos los recursos humanos (Operador de Grúa, Rigger, Prevencionista de Riesgos, Chofer, Supervisor de Faena). Las líneas comerciales de personal cotizado se sincronizan directamente a esta matriz.
- **Umbrales Semafóricos de Acreditación (Regla 30 Días):**
  - `🟢 VIG (Vigente):` El documento tiene más de 30 días de vigencia antes de su expiración.
  - `🟡 VNC (Por Vencer):` El documento expira en 30 días o menos (ventana de alerta preventiva).
  - `🔴 VNC (Vencido / Bloqueado):` La fecha de expiración ya fue superada (días < 0) o el documento no existe. Impide el despacho de la OT.

