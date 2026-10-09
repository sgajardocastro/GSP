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

