# 🛠️ Base de Conocimiento de Soporte Operacional & Incidentes Críticos (GSP)

Bienvenido a la Base de Conocimiento (Knowledge Base) del Centro de Soporte Operacional y Resolución de Incidentes Críticos de **Grúas San Pablo (GSP)**.

Este repositorio documenta formalmente los casos atendidos en terreno, fallas operativas, bloqueos de interfaz en la APP PWA, inconsistencias de base de datos y la trazabilidad técnica completa de causa raíz, resolución y protocolo de respuesta al usuario.

---

## 📐 Estructura de Documentación por Caso

Cada incidente registrado en esta carpeta debe cumplir con la siguiente estructura canónica:

1. **Ficha del Incidente:**
   - **ID del Caso:** `CASO-YYYYMMDD-XX`
   - **Fecha / Hora:** Timestamp oficial
   - **Operador / Usuario Afectado:** Nombre, RUT, ID de usuario
   - **Negocio / OT:** Código de proyecto y ID de base de datos
   - **Equipo Involucrado:** Patente, modelo, categoría (Grúa Móvil / Camión Pluma)
   - **Ambiente:** Producción (`PROD`) o Desarrollo (`DEV`)
   - **Severidad:** Crítica (bloqueo operativo en faena), Alta, Media, Baja

2. **Síntoma Reportado por Terreno:**
   - Descripción textual exacta de lo manifestado por el operador o jefatura de operaciones.
   - Pantalla o componente donde se experimenta el comportamiento anómalo.

3. **Diagnóstico Técnico & Evidencia Empírica:**
   - Consultas SQL ejecutadas y registros exactos obtenidos en PostgreSQL (`sch_leangsp` / `sch_leangsp_prod`).
   - Inspección de logs de servidor (PM2 procesos 10 y 13, Nginx).
   - Datos capturados por telemetría GPS o estados de jornada en curso.

4. **Causa Raíz de Arquitectura (Software / State Machine / Datos):**
   - Explicación técnica determinista de por qué ocurrió la falla en el frontend (Vue 3 / PWA) o backend (Node.js / Express).
   - Relación entre tablas maestras (`tequ_log_desplazamiento`, `tedp_reporte_avance`, `tpry_proyecto`, `tpry_rel_persona`).

5. **Plan de Mitigación y Resolución:**
   - Sentencias SQL exactas de regularización de datos.
   - Cambios de código o hotfixes requeridos.

6. **Protocolo de Respuesta y Guía al Usuario / Operador:**
   - Mensaje claro, sin tecnicismos innecesarios, para transmitir al operador en obra para que complete su acción.

7. **Lecciones Aprendidas y Acciones Preventivas:**
   - Medidas correctivas en el software para evitar la recurrencia sistemática del problema.

---

## 🗂️ Registro y Catálogo de Casos Atendidos

| ID Caso | Fecha | OT / Proyecto | Operador / Usuario | Equipo | Tipo de Incidente | Estado | Documento |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **CASO-20261007-01** | 2026-10-07 | `GSP-2610-233-004` (ID 4) | Robert Rodríguez | LIEBHERR LTM-1090 (`PJYY.20-1`) | Bloqueo en cierre de Report Día 2 por viaje no cerrado y validación de foto | `RESUELTO Y CERRADO (v1.0.109 / REQ-1011)` | [CASO-20261007-01](file:///D:/SGajardo/Google%20Drive/Antigravity/Grúas%20San%20Pablo/Propuesta%20Gestión%20Operación%20Grúas/Soporte/CASO-20261007-01_Bloqueo_Report_Dia2_Robert_Rodriguez_OT_GSP-2610-233-004.md) |
| **CASO-20261007-02** | 2026-10-07 | Plataforma Global / PWA | Jorge Ponce | No Aplica (Autenticación) | Rechazo de acceso con cuenta Google corporativa (@arriendosanpablo.cl) por ingreso a app DEV | `RESUELTO Y CERRADO` | [CASO-20261007-02](file:///D:/SGajardo/Google%20Drive/Antigravity/Grúas%20San%20Pablo/Propuesta%20Gestión%20Operación%20Grúas/Soporte/CASO-20261007-02_Rechazo_Login_Google_Jorge_Ponce_Dominio_Corporativo.md) |
| **CASO-20261008-01** | 2026-10-08 | `GSP-2610-233-004` (ID 4) | Robert Rodríguez | LIEBHERR LTM-1090 (`PJYY.20-1`) | Inconsistencia en fechas de reportes multi-día (D1, D2, D3 simultáneos) en Control en Vivo PMO | `RESUELTO EN BD / REQ-1004` | [CASO-20261008-01](file:///D:/SGajardo/Google%20Drive/Antigravity/Grúas%20San%20Pablo/Propuesta%20Gestión%20Operación%20Grúas/Soporte/CASO-20261008-01_Inconsistencia_Fechas_Reportes_Multidia_Tensacon_Control_Vivo.md) |
| **CASO-20261009-01** | 2026-10-09 | `GSP-2610-766-003` (ID 3) | Maritza Seguel / Yiara Mendoza | LIEBHERR LTM-1090 (`DZXL.25-3`) | Incongruencia en montos de EDP Finning ($748k vs $800k), reverso a comercial y duplicidad en Kanban | `RESUELTO EN BD Y NOTIFICADO` | [CASO-20261009-01](file:///D:/SGajardo/Google%20Drive/Antigravity/Grúas%20San%20Pablo/Propuesta%20Gestión%20Operación%20Grúas/Soporte/CASO-20261009-01_Incongruencia_EDP_Finning_Reverso_Comercial_Duplicidad.md) |
| **CASO-20261013-01** | 2026-10-13 | Transición Operacional (ITS) | Lady Morales (`lmorales@arriendosanpablo.cl`) | No Aplica (Liquidación) | Violación de clave foránea `tits_transicion_historial_id_doc_fkey` (`id_doc = 1452` huérfano) al guardar borrador | `RESUELTO Y DESPLEGADO EN PROD` | [CASO-20261013-01](file:///D:/SGajardo/Google%20Drive/Antigravity/Grúas%20San%20Pablo/Propuesta%20Gestión%20Operación%20Grúas/Soporte/CASO-20261013-01_Violacion_FK_Doc_Al_Guardar_Borrador_ITS_Transicion_Lady_Morales.md) |
| **CASO-20261020-01** | 2026-10-20 | `GSP-2610-233-016` (ID 16) | Robert Rodríguez (`id_user = 49`) | LIEBHERR LTM-1090 (`PJYY.20-1`, ID 33) vs Viaje (`ID 45`) | Reingreso en la tarde abre Momento 1 en blanco tras iniciar jornada por desalineación de `id_equipo` (viaje `45` vs grúa OT `33`) y reciclaje de huérfano (`ID 22`) | `RESUELTO E2E (PWA v1.0.53 / REQ-1060 / SPEC-088)` | [CASO-20261020-01](file:///D:/SGajardo/Google%20Drive/Antigravity/Grúas%20San%20Pablo/Propuesta%20Gestión%20Operación%20Grúas/Soporte/CASO-20261020-01_Reingreso_Momento1_Blanco_Desalineacion_Equipo_Reciclaje_Huerfano_OT16.md) |
| **CASO-20261021-01** | 2026-10-21 | `GSP-2610-233-016` (ID 16) | Robert Rodríguez (`id_user = 49`) | LIEBHERR LTM-1040 (`DZXL.21-0`, ID 33) | Error SQL `no existe la columna «horometro_final»` al iniciar Día 7 (`dia_correlativo > 1`) y regularización de correlativos Días 3–6 | `RESUELTO Y SIMULADO E2E EN PROD` | [CASO-20261021-01](file:///D:/SGajardo/Google%20Drive/Antigravity/Grúas%20San%20Pablo/Propuesta%20Gestión%20Operación%20Grúas/Soporte/CASO-20261021-01_Error_Columna_Horometro_Final_Inicio_Dia7_Robert_Rodriguez_OT16.md) |
| **CASO-20261021-02** | 2026-10-21 | `GSP-2610-233-004` (ID 4) + IDs 1, 2, 3 | Módulo Comercial / Documentos | No Aplica (Storage / PDF) | Enlace de cotización `/api/archivo/ver/21` (y otros 8 docs) devolvía Consentimiento FES / Survey por precedencia invertida `tsrv_survey` vs `tfmg_file` en `verArchivoById` | `RESUELTO Y RESTAURADOS 9 DOCS EN PROD` | [CASO-20261021-02](file:///D:/SGajardo/Google%20Drive/Antigravity/Grúas%20San%20Pablo/Propuesta%20Gestión%20Operación%20Grúas/Soporte/CASO-20261021-02_Colision_IdDoc_IdSurvey_Cotizacion_Muestra_Consentimiento_OT4.md) |
| **CASO-20261021-03** | 2026-10-21 | OTs `#1, #2, #3, #4, #7, #11, #12` | Maritza Seguel (`id_user = 61`, `GSP_CONTA`) / Sergio Gajardo | Múltiples Equipos (Kanban `Torre.vue`) | Invisibilidad de 5 OTs finalizadas en Columna 6 (Contabilidad) por falta de `JOIN` a `tits_informe_termino` y transición `5 -> 6` en `getProyectos`, más caché de bundle previo | `RESUELTO Y DESPLEGADO EN PROD Y DEV` | [CASO-20261021-03](file:///D:/SGajardo/Google%20Drive/Antigravity/Grúas%20San%20Pablo/Propuesta%20Gestión%20Operación%20Grúas/Soporte/CASO-20261021-03_Invisibilidad_Procesos_Finalizados_Kanban_Columna6_Contabilidad_Maritza.md) |
| **CASO-20261022-01** | 2026-10-22 | Cotización `#2086` (`ITS-2086`, ID 46) — `ASTILLERO PANITAO SPA` | Yiara Mendoza / Karen Carrasco (`id_user = 15`) | `VSFK11` (`ItsTransicionView.vue`) | Pantalla en negro al pulsar `Continuar` sobre ITS en `PENDIENTE_VERIFICACION` por llamada a `formatDateCL()` no definida en `<script setup>` al renderizar sello FES de elaborador | `RESUELTO Y DESPLEGADO EN PROD Y DEV` | [CASO-20261022-01](file:///D:/SGajardo/Google%20Drive/Antigravity/Grúas%20San%20Pablo/Propuesta%20Gestión%20Operación%20Grúas/Soporte/CASO-20261022-01_Pantalla_Negra_Editar_ITS_Transicion_2086_Pendiente_Verificacion_Yiara.md) |
| **CASO-20261022-02** | 2026-10-22 | OT `#8` (`MNT-2610-004`) — Taller Temuco | Sergio Gajardo / Leonel Vergara (`id_user = 18`) | LIEBHERR LTM-1400 (`CHGC.99-4`) | Desfase en mapeo de insumos, costo acumulado en cabecera OT, contraste en PWA móvil, Kardex y carga de nómina de 9 técnicos de taller | `RESUELTO Y DESPLEGADO EN PROD Y DEV` | [CASO-20261022-02](file:///D:/SGajardo/Google%20Drive/Antigravity/Grúas%20San%20Pablo/Propuesta%20Gestión%20Operación%20Grúas/Soporte/CASO-20261022-02_Desfase_Mapeo_Insumos_Kardex_Y_Contraste_PWA_Taller_Temuco.md) |
| **CASO-20261022-03** | 2026-10-22 | OT `#8` / `#10` (`MNT-2610-004` / `006`) | Leonel Vergara (`id_user = 18`) / Eduardo Aguirre (`id_user = 19`) / Alan Sarpi | Flota GSP (LIEBHERR LTM-1400 `CHGC.99-4`, 70 Ton `TLXF.37-9`) | Desacople de Segregación de Funciones (SoD): Insumos figuraban auto-entregados al abrir pañol; duplicidad de OTs por doble clic | `RESUELTO Y DESPLEGADO EN PROD Y DEV (SPEC-095)` | [CASO-20261022-03](file:///D:/SGajardo/Google%20Drive/Antigravity/Grúas%20San%20Pablo/Propuesta%20Gestión%20Operación%20Grúas/Soporte/CASO-20261022-03_Segregacion_Funciones_SoD_Solicitud_Taller_Despacho_Bodega.md) |
| **CASO-20261022-04** | 2026-10-22 | `GSP-2610-233-016` (ID 16) — Planta Ferrero (Tensacon S.A.) | Robert Rodríguez (`id_user = 49`) | Liebherr LTM-1040 (`DZXL.21-0`, ID 33) | Orden de trabajo no visible al ingresar a la PWA hasta pulsar pestaña «Firmas» y volver a «Operación» por cascada secuencial bloqueante en `onMounted`, falta de listener `visibilitychange` y fallback `ID_USUARIO` en `Surveys.vue` | `RESUELTO Y DESPLEGADO EN PROD Y DEV` | [CASO-20261022-04](file:///D:/SGajardo/Google%20Drive/Antigravity/Grúas%20San%20Pablo/Propuesta%20Gestión%20Operación%20Grúas/Soporte/CASO-20261022-04_Orden_No_Visible_Al_Ingreso_PWA_Hasta_Navegar_Firmas_Robert_Rodriguez_OT16.md) |
| **CASO-20261026-01** | 2026-10-26 | Taller Temuco (Creación de OTM / Averías) | Leonel Vergara (`id_user = 18`) | Flota Camionetas / Vehículos Livianos (`CTA-214` a `CTA-226`) y 52 activos multi-empresa | Camionetas no visibles en selector de Taller por filtro restrictivo `WHERE e.id_empresa = 9` (que excluía `CERRO DOROTEA LTDA` `4852`, `LOGISTICA DEL SUR` `8`, `BESTMAQ` `7`, `ROYAL RENTAL` `11`) y falta de subcategoría `CAMIONETA` en `equipo_nombre` | `RESUELTO Y DESPLEGADO EN PROD Y DEV` | [CASO-20261026-01](file:///D:/SGajardo/Google%20Drive/Antigravity/Grúas%20San%20Pablo/Propuesta%20Gestión%20Operación%20Grúas/Soporte/CASO-20261026-01_Invisibilidad_Camionetas_Y_Activos_MultiEmpresa_Radar_Taller_Leonel_Vergara.md) |
| **RECLAMO-20261026-01** | 2026-10-26 | Gobernanza General del Proyecto / Agente IA | Sergio Gajardo (`sgajardoc@gmail.com`) | Ecosistema Completo (Web, Backend, PDF, BD) | DESASTRE TOTAL: Incumplimiento sistemático y crónico de la constitución `.agents`, protocolo Spec-Driven y aprobación previa de diff | `ABIERTO / SEVERIDAD CRÍTICA MÁXIMA` | [RECLAMO-20261026-01](file:///D:/SGajardo/Google%20Drive/Antigravity/Grúas%20San%20Pablo/Propuesta%20Gestión%20Operación%20Grúas/Soporte/RECLAMO-20261026-01_DESASTRE_TOTAL_INCUMPLIMIENTO_REITERADO_CONSTITUCION_AGENTS.md) |


