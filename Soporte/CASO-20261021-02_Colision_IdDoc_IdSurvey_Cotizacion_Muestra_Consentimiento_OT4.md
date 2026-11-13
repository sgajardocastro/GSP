# 🛠️ CASO-20261021-02: Cotización Comercial en Producción Muestra Acta de Consentimiento FES por Colisión `id_doc` vs `id_survey` (`GSP-2610-233-004` y otros 3 negocios)

---

## 1. Ficha del Incidente

| Parámetro | Detalle |
| :--- | :--- |
| **ID del Caso** | `CASO-20261021-02` |
| **Fecha / Hora** | 2026-10-21 17:40 CLT (Hora Oficial de Chile) |
| **Usuario / Módulo Afectado** | Módulo Comercial / Operaciones / Gestor Documental (`verArchivoById`) |
| **Negocios / OTs Afectados** | `GSP-2610-233-004` (`ID 4`), `GSP-2610-4851-001` (`ID 1`), `GSP-2610-4671-002` (`ID 2`), `GSP-2610-766-003` (`ID 3`) |
| **Ambiente** | Producción (`PROD` - `sch_leangsp_prod`, endpoint `/lg-gsp-prod/api/archivo/ver/:id`) |
| **Severidad** | **Alta** (Exposición de documento erróneo al abrir enlaces de Cotizaciones y OTs) |
| **Estado** | **RESUELTO Y RESTAURADOS LOS 9 DOCUMENTOS EN PRODUCCIÓN** |

---

## 2. Síntoma Reportado

En Producción, el negocio `GSP-2610-233-004` (`id_proyecto = 4`) tenía asociada la URL de cotización `https://servidor.leanglobal.cl/lg-gsp-prod/api/archivo/ver/21`, pero al abrirla el navegador descargaba/mostraba un **Acta de Consentimiento de Firma Electrónica Simple (FES)** en lugar de la Cotización Comercial.

---

## 3. Diagnóstico Técnico & Evidencia Empírica

### A. Verificación en `sch_leangsp_prod.tfmg_file` y `/u05/LeanDocs`
El registro `id_doc = 21` en `tfmg_file` y su archivo físico en disco **nunca fueron sobrescritos ni eliminados**:
* `id_doc = 21`, `tipo_doc = 'COTIZACION'`, `name_doc_orig = 'GSP-2610-233-004V2-8.pdf'`, `path_doc = 'GSP/prod/cotizaciones/2026/10'`, creado el `2026-10-05 19:04:50`.
* Archivo físico en disco: `/u05/LeanDocs/GSP/prod/cotizaciones/2026/10/GSP-2610-233-004V2-8.pdf` (`49.961 bytes`).

### B. Colisión con `sch_leangsp_prod.tsrv_survey`
El `2026-10-14`, al enrolarse el usuario `id_user = 18`, se insertó en `tsrv_survey` el registro con **`id_survey = 21`** (`id_template = 500`, Consentimiento FES).

### C. Defecto de Precedencia en `archivoController.js` (`verArchivoById`)
En [`ejecucion/backend_remoto/src/controllers/archivoController.js`](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/ejecucion/backend_remoto/src/controllers/archivoController.js#L281-L315), el controlador ejecutaba primero `SELECT id_survey FROM tsrv_survey WHERE id_survey = $1` **antes** de buscar `id_doc` en `tfmg_file`. Cuando la secuencia de `tsrv_survey` alcanzó los IDs `5` al `22`, interceptó 9 documentos de `tfmg_file`:

| ID Doc | Negocio | Tipo en `tfmg_file` | Archivo Físico en Disco | Tamaño | Colisión `tsrv_survey` |
| :---: | :--- | :--- | :--- | :---: | :--- |
| `5` | `GSP-2610-4851-001` | `COTIZACION` | `GSP-2610-4851-001V1-1.pdf` | `47.493 B` | `id_survey = 5` (Tpl `80`) |
| `7` | `GSP-2610-4851-001` | `COTIZACION` | `GSP-2610-4851-001V2-3.pdf` | `47.505 B` | `id_survey = 7` (Tpl `500`) |
| `13` | `GSP-2610-4671-002` | `COTIZACION` | `GSP-2610-4671-002V1-4.pdf` | `46.750 B` | `id_survey = 13` (Tpl `500`) |
| `14` | `GSP-2610-4671-002` | `OT` | `OT-GSP-2610-4671-002V1-1.pdf` | `46.930 B` | `id_survey = 14` (Tpl `76`) |
| `15` | `GSP-2610-766-003` | `COTIZACION` | `GSP-2610-766-003V1-5.pdf` | `47.265 B` | `id_survey = 15` (Tpl `80`) |
| `16` | `GSP-2610-766-003` | `COTIZACION` | `GSP-2610-766-003V2-6.pdf` | `47.264 B` | `id_survey = 16` (Tpl `76`) |
| `20` | `GSP-2610-233-004` | `COTIZACION` | `GSP-2610-233-004V1-7.pdf` | `50.201 B` | `id_survey = 20` (Tpl `500`) |
| `21` | `GSP-2610-233-004` | `COTIZACION` | `GSP-2610-233-004V2-8.pdf` | `49.961 B` | `id_survey = 21` (Tpl `500`) |
| `22` | `GSP-2610-233-004` | `OT` | `OT-GSP-2610-233-004V1-2.pdf` | `48.488 B` | `id_survey = 22` (Tpl `500`) |

---

## 4. Resolución Aplicada y Verificación

1. Se invirtió el orden de resolución en `verArchivoById` (`archivoController.js`): primero se consulta `tfmg_file` (`id_doc`), y únicamente si el registro no existe en `tfmg_file` se recurre al fallback de `tsrv_survey` (`id_survey`).
2. Se desplegó en `DEV` y `PROD` (`pm2 restart 10 && pm2 restart 13`) y se verificó empíricamente que los 9 endpoints (`/lg-gsp-prod/api/archivo/ver/5, 7, 13, 14, 15, 16, 20, 21, 22`) responden `200 OK` entregando exactamente la cantidad de bytes de sus respectivos archivos en `/u05/LeanDocs/GSP/prod/`.
