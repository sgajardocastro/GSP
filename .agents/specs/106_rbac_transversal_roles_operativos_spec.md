# SPEC-106: Arquitectura RBAC Transversal, Segregación de Roles Operativos y Despliegue Gradual Cero Caídas (`REQ-1093`)

**Estado:** En Implementación (Etapa A Autorizada)  
**Fecha:** 03 de Noviembre de 2026  
**Referencia Documental:** `DOC-RBAC-GSP-2026-V2` ([Propuesta_Estructura_Permisos_RBAC_GSP.pdf](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/Gesti%C3%B3n/Propuesta_Estructura_Permisos_RBAC_GSP.pdf)) y [Minuta 03-Nov-2026](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/antecedentes_reuniones/reuniones/20261103-Reuni%C3%B3n-Matriz-RBAC-Acreditaciones-Calendario-Flota-y-Filtros-Kanban.md)  
**Estándar Base:** `leanglobal_rbac_standard`

---

## 1. Objetivo y Contexto de Negocio

Implementar el modelo **RBAC (Control de Acceso Basado en Roles)** en la Consola Web y APP Móvil (PWA) de **Grúas San Pablo (GSP)** bajo un esquema de **Segregación de Funciones (SoD)** y **Mínimo Privilegio**, garantizando:
1. **Aislamiento Comercial Estricto de Mantenimiento e Inventario:** Los perfiles de Mantenimiento (`GSP_TALLER_APROB`, `GSP_TALLER_PROG`, `GSP_TALLER_EJEC`) e Inventario/Bodega (`GSP_BODEGA`) no tienen acceso al módulo Comercial (`/crm`), ni a cotizaciones, tarifas o Estados de Pago (`/edp`).
2. **Acceso de Mantenimiento a la OT Operativa exclusivamente como PDF:** El personal de Mantenimiento consulta la Orden de Trabajo (OT) únicamente como documento PDF oficial de solo lectura para conocer grúa asignada, accesorios, configuración de pluma/contrapesos, cliente, faena y fechas, sin edición comercial ni acceso a montos.
3. **Separación de Control de Gestión (`GSP_PROG` — Yiara) vs. Secretaría (`SECRETARIA` — Domi / Lady):** Conforme a lo acordado en sesión del 03-Nov-2026 entre Jorge Ponce y Sergio Gajardo, el rol de Control de Gestión y Análisis de Operaciones (`GSP_PROG`) posee alcance estratégico sobre Control Operativo PMO (`/control-vivo`), validación de Reportes Diarios, costos operativos en ITS (`/its`) y 1ra firma FES de EDP (`/edp`), separándose formalmente del perfil administrativo de Secretaría (`SECRETARIA`).
4. **Acreditación Personal y Documentación de Equipos (`GSP_PREV` — Dayana / Alfonso):** Habilita la carga y descarga en Acreditación Personal (`/acreditacion`), el Dossier de Acreditaciones por OT y la actualización documental de equipos en Vista Flota 360° (`/flota`) y Gestor Documental (`/documentos`).

---

## 2. Catálogo Oficial de 12 Perfiles RBAC (`tsec_roles`)

| # | Código Rol (`codi_rol`) | Nombre del Perfil | Usuarios Tipo | Ruta Home | Alcance Operativo y Restricciones |
| :- | :--- | :--- | :--- | :--- | :--- |
| **1** | `ADMIN` | Dirección / Admin Global | Omar, Jorge, Tesalia, Sergio | `/` | Acceso irrestricto a los 12 módulos Web, Mantenedores, Backlog, BI y APP. |
| **2** | `ADM_COM` | Gerencia / Admin Comercial | Supervisión Comercial | `/crm` | Visibilidad global de cotizaciones de todos los vendedores (`scope = ALL`), clientes y tableros. |
| **3** | `COMERCIAL` | Ejecutivo Comercial | Carlos, Cristóbal, Guillermo | `/crm` | Filtro estricto `misNegocios` (`id_vendedor = id_user`). OTs/EDP solo lectura de su cartera. |
| **4** | `COORD` / `GSP_APROB` | Jefe / Coordinador Operaciones | Richard (Operaciones) | `/proyectos` | Torre de Control Kanban, Flota, Despacho, Acreditación, 2da Firma FES de EDP y Pizarra TV. |
| **5** | `GSP_PROG` | Control de Gestión & Análisis Op. | Yiara Mendoza | `/control-vivo` | Control Operativo PMO (validación horas/viáticos SLA 13:00), costos ITS, 1ra firma FES EDP. |
| **6** | `SECRETARIA` | Secretaría Operativa / Admin | Domi, Lady Morales | `/proyectos` | Apoyo administrativo en seguimiento de OTs, recepción de OC cliente, guías y documentos. |
| **7** | `GSP_CONTA` | Contabilidad & Facturación | Maritza Seguel | `/edp` | Bandeja Financiera de EDPs visados, ingreso N° Factura SII, Hito 17 y Compras/OC. |
| **8** | `GSP_PREV` | Prevención & Documentación | Dayana (Personal), Alfonso (Equipos) | `/acreditacion` | Acreditación Personal (Dayana), actualización documental de equipos en Flota 360° (Alfonso) y Gestor Documental. |
| **9** | `GSP_TALLER_APROB` | Jefe de Taller / Aprobador Mant. | Leonel Vergara | `/mantenimiento` | Flota 360°, Radar Horómetros, OTM y cierre FES. **Cero acceso Comercial; OT solo PDF.** |
| **10** | `GSP_TALLER_PROG` | Planificador de Mantenimiento | Planificador Taller | `/mantenimiento` | Programación de pautas preventivas, apertura OTM y seguimiento de flota. **OT solo PDF.** |
| **11** | `GSP_TALLER_EJEC` | Mecánico / Técnico de Taller | Mecánicos de Patio/Terreno | `/mantenimiento` | Ejecución OTM en APP Móvil, fotos 360°, medidores, avisos de falla y Pauta/OT en PDF. |
| **12** | `GSP_BODEGA` | Inventario WMS & Adquisiciones | Eduardo Aguirre, Alan Sarpi | `/inventario` | Bodegas WMS, recepción OC, despacho a OTM con costos unitarios CLP. **Cero acceso Comercial.** |
| **13** | `GSP_EJEC` | Operador / Rigger / Chofer | Operadores y Riggers | APP Móvil | **Sin Consola Web.** Exclusivo APP Móvil: Hoja de Viaje, Report Diario con firma y AST. |

---

## 3. Estrategia de Despliegue Gradual "Cero Caídas" (3 Etapas)

Para evitar bloqueos de usuarios activos durante la operación en producción (`Go-Live`):

### Etapa A: Catálogo de Roles en Mantenedor y Diagnóstico Nominal (100% Inofensiva)
- **Archivo intervenido:** `ejecucion/frontend/src/components/mantenedores/RbacMatrixTable.vue`.
- **Acción:** Incorporar las tarjetas interactivas de todos los roles operativos (`SECRETARIA`, `GSP_PREV`, `GSP_TALLER_APROB`, `GSP_TALLER_PROG`, `GSP_TALLER_EJEC`, `GSP_BODEGA`) y actualizar la descripción estratégica de `GSP_PROG` (*Control de Gestión & Análisis de Operaciones — Yiara*) en el diálogo de edición de usuarios (`EditUsuarioDialog.vue`), sin ocultar aún menús ni bloquear rutas.
- **Auditoría Nominal:** Consultar en modo solo lectura las tablas `tsec_roles`, `tsec_users` y `tsec_user_roles` para verificar qué roles tiene asignados hoy cada usuario operativo antes de activar cualquier filtro visual.

### Etapa B: Homologación de Mantenedor de Roles y Filtrado Aditivo en `Sidebar.vue`
- **Regla Multi-Rol Aditiva:** Un usuario con múltiples roles obtiene la **unión (suma)** de los módulos permitidos por cada uno de sus roles activos.
- **Refresco en Caliente:** `Sidebar.vue` consultará los roles vigentes del usuario autenticado para no depender únicamente de un `localStorage.user` antiguo.
- **Fallback Seguro:** Si un usuario administrativo aún no tiene roles específicos distintos de `USR-CONSENT`, se preserva un comportamiento controlado o se asignan previamente sus roles en BD.

### Etapa C: Guardias de Navegación (`router/index.js`) y Acceso OT Solo PDF para Mantenimiento
- Redirección automática al `homePath` de cada perfil operativo al ingresar a `/` o intentar acceder por URL directa a una ruta restringida (respetando siempre las rutas públicas y Magic Links `/viaje/:token`, `/aprobacion-gerencia/:token`, `/firmar`).
- Habilitación del visor/descarga directa del PDF oficial de la OT para los perfiles `GSP_TALLER_*` sin exponer el formulario comercial.
