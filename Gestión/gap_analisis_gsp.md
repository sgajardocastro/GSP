# Gap Analysis Técnico: Proyecto Grúas San Pablo (GSP)

Este documento detalla la matriz de mapeo y brechas para implementar el **Sistema de Gestión de Operación y Control Financiero para Grúas San Pablo (GSP)**, estructurado sobre el núcleo del producto **LeanGlobal** (Node.js/PostgreSQL).

---

## 📌 1. Estrategia de Mapeo del Producto

Para asegurar la escalabilidad del sistema y la coherencia del desarrollo, utilizaremos los siguientes criterios de catalogación respecto a la plataforma base de LeanGlobal:

*   **`[PRD]` (Nativo / Producción):** Funcionalidad ya soportada en el núcleo del sistema base de LeanGlobal (módulos probados en Transmac/Terracon).
*   **`[CONF]` (Configuración):** Habilitación mediante siembra de datos (seeders), creación de registros en tablas paramétricas (roles, empresas, proyectos) o diseño de estructuras JSON en plantillas (`body_seed`).
*   **`[DEV]` (Desarrollo):** Requerimiento a medida que exige migraciones de base de datos (PostgreSQL), creación de endpoints y controladores (Node.js) o lógica frontend personalizada.

---

## 📊 2. Matriz de Gap Analysis (Requerimientos vs. Producto Core)

### A. Estructura de Negocio y Multi-Empresa
*GSP requiere la implementación del sistema para 4 empresas hermanas, con segregación de datos pero visualización global para la gerencia.*

| Requerimiento GSP | Mapeo en Producto Core (LeanGlobal) | Clasificación | Tarea Técnica de Ingeniería |
| :--- | :--- | :--- | :--- |
| **Multi-Empresa** | Tabla `temp_empresas` (id_empresa_cliente). | `[CONF]` | Configurar 4 registros en `temp_empresas`. Las grúas, camiones y personal se vincularán al ID de la empresa dueña del activo. |
| **Servicio como Proyecto** | Tabla `tpro_proyectos` (id_proyecto). | `[CONF]` | Cada maniobra/servicio comercial cotizado se creará como un registro en `tpro_proyectos` para aislar sus reportes y costos asociados. |
| **RBAC Multi-Contrato** | Matriz de permisos en `spec_roles_permisos.md` (RBAC Clientes x Funciones). | `[PRD]` | Cargar roles de "Gerente GSP" con herencia transversal sobre las 4 empresas, y roles de "Operador/Rigger" limitados a sus OTs asignadas. |
| **RF-4.5: Maestro Único B2B** | La tabla `tpar_empresas` incluye nativamente el campo `flag_externo`. | `[PRD]` | Cargar clientes finales marcando `flag_externo = true`. Al crear OTs en `tpry_proyecto`, vincular id_empresa (GSP) y id_empresa_cliente (Cliente). |
| **Permisos de Vialidad MOP** | Tabla `tequ_equipos_documentos` (vigencias). | `[CONF]` | Configurar el tipo de documento "Permiso de Vialidad MOP" en la biblioteca de vigencias por patente de grúa/camión de alto tonelaje. |

---

### B. Captura Operacional y App del Operador
*Digitalización de la maniobra de izaje en terreno, incluyendo orómetros, firmas FES y geolocalización.*

| Requerimiento GSP | Mapeo en Producto Core (LeanGlobal) | Clasificación | Tarea Técnica de Ingeniería |
| :--- | :--- | :--- | :--- |
| **Reportes como Surveys** | Tablas `tsrv_templates` y `tsrv_survey`. | `[CONF]` | Crear e inyectar el JSON de la plantilla (`body_seed`) para los formularios de AST, Checklist de Izaje y Reporte Diario de Horas. |
| **Firma FES de Conformidad** | Firma electrónica OTP de 4 dígitos (`tfes_signatures` / `spec_pwa_navigation_states.md`). | `[PRD]` | El flujo de firma del cliente a pie de grúa usa el motor FES nativo con PIN cifrado SHA-256 en cliente y time-stamp criptográfico. |
| **Persistencia Offline** | IndexedDB en la PWA (`SurveysSnapshot` en BD `'TransmacSST'`). | `[PRD]` | Uso del motor de sincronización offline de la PWA para registrar orómetros y AST en zonas sin cobertura de red. |
| **Trazabilidad Desplazamientos** | Servicio de telemetría PWA (`spec_gps_tracking.md`). | **`[DEV]`** | Desarrollar servicio PWA que capture coordenadas GPS en segundo plano cada 5 minutos desde el inicio del viaje hasta la llegada a faena. |

---

### C. Integración Laudus ERP (Fase 1 - Semanas 1-7)
*Sincronización bidireccional para resguardar la contabilidad de transición actual.*

| Requerimiento GSP | Mapeo en Producto Core (LeanGlobal) | Clasificación | Tarea Técnica de Ingeniería |
| :--- | :--- | :--- | :--- |
| **Lectura de Clientes/OCs** | Endpoint Laudus `/sales/purchaseorders` y `/sales/customers`. | **`[DEV]`** | Servicio cron en Node.js que realiza polling a Laudus ERP, importando clientes nuevos y OCs aprobadas hacia `tpro_proyectos`. |
| **Sincronización de Facturas** | Endpoint Laudus `/sales/invoices`. | **`[DEV]`** | Al cerrar un EDP en la Torre de Control, el backend envía la valorización a Laudus. Captura el número de folio retornado para actualizar el balance. |

---

### D. Módulo de Facturación y Compras SII (Fase 2 - Mes 4-6)
*Emisión de DTEs y control de egresos directos.*

| Requerimiento GSP | Mapeo en Producto Core (LeanGlobal) | Clasificación | Tarea Técnica de Ingeniería |
| :--- | :--- | :--- | :--- |
| **Emisión DTE (Factura)** | Integración API de facturación SII. | **`[DEV]`** | Crear controlador de facturación en Node.js que conecte con el SII para emitir y validar folios de facturas exentas y afectas. |
| **Registro de Compras (OC)** | Tabla `tsst_compras_proveedores` (o nueva `tsrv_compras`). | **`[DEV]`** | CRUD de Órdenes de Compra a proveedores (subcontratos) y emparejamiento con el xml cargado del SII. |
| **Egresos y Caja Chica** | Atributos en surveys de rendición. | `[CONF]` | Crear plantilla de rendición de viáticos y combustibles, guardando datos estructurados en `body_exec` de encuestas tipo ruteadas. |

---

## 3. Módulo de Contabilidad Simple Nativa (Fase 2 - Mes 6+)
*Libro Diario, Mayor, Balances y P&L integrados sin Laudus ERP.*

| Requerimiento GSP | Mapeo en Producto Core (LeanGlobal) | Clasificación | Tarea Técnica de Ingeniería |
| :--- | :--- | :--- | :--- |
| **Plan de Cuentas** | Nueva tabla `tsec_plan_cuentas`. | **`[DEV]`** | Crear estructura relacional para el plan de cuentas chileno, y vista de administración de cuentas para el contador de GSP. |
| **Asientos Automáticos** | Triggers PostgreSQL (`sch_leantransmac_dev`). | **`[DEV]`** | **Desarrollo Crítico de Base de Datos:** Escribir funciones (triggers PL/pgSQL) que intercepten la inserción/cierre de encuestas de compra (combustible, peajes) y facturas de venta (DTEs) para registrar automáticamente los asientos de cargo y abono en la tabla `tsec_libro_diario`. |
| **Libro Mayor & Balances** | Consultas SQL de agregación y vistas. | **`[DEV]`** | Diseñar queries optimizadas de suma y saldo para generar el Balance Tributario de 8 Columnas y el Estado de Resultados (P&L) por grúa/centro de costo. |

---

### E. Arquitectura Backend y Filtro Multi-Tenant (Sprint 1)
*Adaptaciones críticas necesarias en el código Node.js heredado de LeanServices para soportar a GSP.*

| Requerimiento GSP | Mapeo en Producto Core (LeanGlobal) | Clasificación | Tarea Técnica de Ingeniería |
| :--- | :--- | :--- | :--- |
| **RF-4.1: Aislamiento Multi-Empresa** | Consultas crudas (ej. en `proyectoModel.js` y `servicios.json`) sin filtro `id_empresa`. | **`[DEV]`** | Desarrollar middleware en Express para interceptar JWT, inyectar el `id_empresa` y obligar al filtrado en los endpoints de proyectos/servicios. |
| **RF-4.2: Rol de Vista Global** | JWT actual no inyecta roles globales. | **`[DEV]`** | Modificar generador JWT para marcar usuarios globales y añadir un Context Switcher (Selector) en Vue3. |
| **RF-4.3: Endpoint "Preventa"** | `createProyecto` no fuerza estado. | **`[DEV]`** | Crear nuevo controlador/ruta comercial que inicialice el proyecto en fase "Preventa" atado al `id_empresa`. |
| **RF-4.4: Maestro de Empresas** | `tpar_empresas` no tiene CRUD. | **`[DEV]`** | Desarrollar endpoint backend y vista frontend para administrar `tpar_empresas`. |

---

### F. Gestor de Oportunidades y Cotizaciones (Sprint 2 - Frontend CRM)
*Construcción de la interfaz visual base (Vue3) para el arranque del ciclo comercial.*

| Requerimiento GSP | Mapeo en Producto Core (LeanGlobal) | Clasificación | Tarea Técnica de Ingeniería |
| :--- | :--- | :--- | :--- |
| **RF-5.1: Estructurador Base** | Transmac no posee un CRM comercial idéntico. | **`[DEV]`** | Maquetar Layout en Vue 3 que capture estrictamente los "Datos del Cliente" y "Datos Generales del Servicio" definidos en el diagrama, más la condición de "Programado/A Disponibilidad". |
| **RF-5.2: Creación Rápida Clientes** | Inexistente en interfaz. | **`[DEV]`** | Construir modal flotante B2B para capturar todos los atributos de contacto del diagrama (RUT, Razón social, giro, dirección, contactos). |
| **RF-5.3: Líneas de Servicio (Familias)** | Tabla `tpry_proyecto` (`json_field`). | **`[DEV]`** | Construir componente de grilla obligando a usar las 9 Familias de Servicios: 1. Grúas Telescópicas, 2. Camiones Pluma, 3. Grúas Horquillas, 4. Camiones con rampla, 5. Manipuladores Telescópicos, 6. Plataformas articuladas, 7. Plataformas Tijeras, 8. Plataformas Telescópicas, 9. Servicios de personal acreditado. |
| **RF-5.4: Transición Preventa** | Lógica de estados ausente. | **`[DEV]`** | Conectar botones de la UI (Preventa y Ganar) con el endpoint desarrollado en RF-4.3. |
| **RF-5.5: Ciclo de Vida (Estados)** | Tabla `tpry_proyecto` no tiene FK a `tpry_estado`. | **`[DEV]`** | Corregir esquema en BD (crear FK estricta) y poblar paramétrica con los 4 estados comerciales iniciales. |

---

### G. Gestión de Flota y Tripulación (Modelamiento Pendiente)
*Análisis y modelamiento de la matriz de activos físicos (grúas/vehículos) y capital humano especializado.*

| Requerimiento GSP | Mapeo en Producto Core (LeanGlobal) | Clasificación | Tarea Técnica de Ingeniería |
| :--- | :--- | :--- | :--- |
| **Modelamiento de Equipos** | Tablas `tequ_equipo` y `tequ_documentacion_equipo`. | **`[GAP]`** | Pendiente levantar y modelar catálogo técnico de grúas, camiones y camionetas, con sus respectivas hojas de vida y certificados de tonelaje. |
| **Modelamiento de Tripulación** | Tablas `tsec_users` y `tsec_documentacion_persona`. | **`[GAP]`** | Pendiente levantar roles operativos (Riggers, Operadores) y modelar la matriz de acreditaciones/certificaciones vigentes exigidas por minería/obras. |
| **Exclusividad de Flota** | Relación Equipo -> Empresa. | **`[GAP]`** | Pendiente definir si `tequ_equipo` llevará llave foránea estricta a `id_empresa` o si operará como un "Pool Global" para las 4 hermanas. |

