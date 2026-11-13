# 🛠️ Ficha de Incidente Operacional: Invisibilidad de Camionetas y Activos Multi-Empresa en Radar de Taller

---

## 1. Ficha del Incidente

| Campo | Detalle |
| :--- | :--- |
| **ID del Caso** | `CASO-20261026-01` |
| **Fecha / Hora** | `2026-10-26 11:39:00 -03:00` |
| **Operador / Usuario Afectado** | Leonel Vergara (`id_user = 18` — Jefe de Taller / Supervisor de Mantenimiento) |
| **Negocio / OT** | Módulo de Mantenimiento y Confiabilidad de Flota (Taller Temuco — Creación de OTM y Avisos de Avería) |
| **Equipo Involucrado** | Flota de Vehículos Livianos / Camionetas (`CTA-214` a `CTA-226`: Maxus T60, Great Wall Poer, Chevrolet Silverado, Citroën Berlingo, Suzuki Jimny) y activos multi-empresa del Holding GSP (`52 de 110 equipos`) |
| **Ambiente** | Producción (`PROD` — `sch_leangsp_prod`) y Desarrollo (`DEV` — `sch_leangsp`) |
| **Severidad** | **Alta** (Imposibilidad de seleccionar camionetas y vehículos de empresas relacionadas en la PWA y consola Web de Taller para abrir Orden de Trabajo de Mantenimiento) |
| **Estado** | `RESUELTO Y DESPLEGADO EN PROD Y DEV` |

---

## 2. Síntoma Reportado por Terreno

Leonel Vergara (Jefe de Taller) informa desde terreno que necesita ingresar el mantenimiento de una camioneta del grupo en la aplicación de Taller (PWA / Web), pero **la camioneta no aparece en el selector de equipos** al crear una Nueva Orden de Trabajo (OTM) ni al reportar un Aviso de Avería.

---

## 3. Diagnóstico Técnico & Evidencia Empírica

Se inspeccionó la tabla maestra de activos `sch_leangsp_prod.tequ_equipo` cruzada con `tpar_empresas`, `tequ_categoria` y `tequ_subcategoria`, obteniendo la distribución real de los **110 equipos** del holding Grúas San Pablo:

| `id_empresa` | Razón Social / Empresa (`tpar_empresas`) | Total Activos en `tequ_equipo` | Visibilidad previa en Taller (`WHERE id_empresa = 9`) |
| :---: | :--- | :---: | :---: |
| `7` | `BESTMAQ` | `13` | Ocultos (`0`) |
| `8` | `LOGISTICA DEL SUR` | `25` (incluye Camioneta `CTA-222`) | Ocultos (`0`) |
| `9` | `SAN PABLO` | `58` (incluye solo Camioneta `CTA-223`) | Visibles (`58`) |
| `11` | `ROYAL RENTAL` | `4` | Ocultos (`0`) |
| `4852` | `CERRO DOROTEA LTDA` | `10` (incluye 6 Camionetas Maxus T60, 3 Furgones Berlingo, 1 Jeep Jimny) | Ocultos (`0`) |
| **Total** | **Holding GSP** | **110 equipos** | **Solo 58 visibles (52 ocultos)** |

### Detalle de Camionetas y Vehículos Livianos en `sch_leangsp_prod.tequ_equipo`

| `id_equipo` | `id_empresa` | Empresa | Código Interno | Patente | Subcategoría | Marca / Modelo |
| :---: | :---: | :--- | :---: | :---: | :--- | :--- |
| `84` | `4852` | `CERRO DOROTEA LTDA` | `CTA-216` | `RKVZ-59-9` | `CAMIONETA` | `MAXUS T60 4X2 DX` |
| `85` | `4852` | `CERRO DOROTEA LTDA` | `CTA-217` | `RKVZ-60-2` | `CAMIONETA` | `MAXUS T60 4X2 DX` |
| `86` | `4852` | `CERRO DOROTEA LTDA` | `CTA-218` | `RKVZ-61-0` | `CAMIONETA` | `MAXUS T60 4X2 DX` |
| `87` | `4852` | `CERRO DOROTEA LTDA` | `CTA-219` | `RKVZ-62-9` | `CAMIONETA` | `MAXUS T60 4X2 DX` |
| `88` | `4852` | `CERRO DOROTEA LTDA` | `CTA-220` | `RSPP.57-5` | `CAMIONETA` | `MAXUS T60 SC 4X2 DX` |
| `89` | `4852` | `CERRO DOROTEA LTDA` | `CTA-221` | `RSPP.56-7` | `CAMIONETA` | `MAXUS T60 SC 4X2 DX` |
| `90` | `8` | `LOGISTICA DEL SUR` | `CTA-222` | `SDXD93-2` | `CAMIONETA` | `GREAT WALL POER PLUS AT 2.0 TD` |
| `91` | `9` | `SAN PABLO` | `CTA-223` | `SZTX.49-1` | `CAMIONETA` | `CHEVROLET SILVERADO 4X4` |
| `83` | `4852` | `CERRO DOROTEA LTDA` | `CTA-214` | `KFZR - 47-6` | `FURGON` | `CITROEN BERLINGO` |
| `93` | `4852` | `CERRO DOROTEA LTDA` | `CTA-225` | `VKDK.12-6` | `FURGON` | `CITROEN BERLINGO MCA M DIESEL` |
| `94` | `4852` | `CERRO DOROTEA LTDA` | `CTA-226` | `TJVB.14-0` | `FURGON` | `CITROEN BERLINGO L1 1.5 BLUHDI` |
| `92` | `4852` | `CERRO DOROTEA LTDA` | `CTA-224` | `SZGW55-5` | `JEEP` | `SUZUKI JIMNY 1.5 GL WINCHE` |

---

## 4. Causa Raíz de Arquitectura (Software / State Machine / Datos)

Existían **dos causas acopladas** en [`mantenimientoModel.js`](file:///d:/SGajardo/Google%20Drive/Antigravity/Grúas%20San%20Pablo/Propuesta%20Gestión%20Operación%20Grúas/ejecucion/backend_remoto/src/models/mantenimientoModel.js):

1. **Filtro restrictivo `WHERE e.id_empresa = $1` (`9`) en `getRadarFlota()`, `getHojaVidaEquipo()` y `getKpis()`:**
   - Mientras el Mantenedor de Equipos ([`Vista360.vue`](file:///d:/SGajardo/Google%20Drive/Antigravity/Grúas%20San%20Pablo/Propuesta%20Gestión%20Operación%20Grúas/ejecucion/frontend/src/views/Vista360.vue) → [`tequEquipoModel.getEquipos()`](file:///d:/SGajardo/Google%20Drive/Antigravity/Grúas%20San%20Pablo/Propuesta%20Gestión%20Operación%20Grúas/ejecucion/backend_remoto/src/models/tequEquipoModel.js#L9-L58)) consulta la totalidad de activos del holding sin filtrar por `e.id_empresa`, el endpoint `GET /api/mantenimiento/flota/radar` filtraba únicamente `WHERE e.id_empresa = 9`.
   - Como **7 de las 8 camionetas** (6 Maxus T60 en `CERRO DOROTEA LTDA` `id_empresa = 4852` y 1 Great Wall Poer en `LOGISTICA DEL SUR` `id_empresa = 8`), además de los 3 furgones Berlingo y 1 Jeep Jimny, pertenecen a razones sociales hermanas del holding, quedaban completamente excluidas del Radar de Taller y de los selectores de Nueva OTM / Aviso de Avería.

2. **Omisión de `LEFT JOIN` a `tequ_subcategoria`, `tequ_categoria`, `tequ_modelo` y `tequ_marca` en `equipo_nombre`:**
   - Incluso para la única camioneta con `id_empresa = 9` (`SZTX.49-1` / `CTA-223`), `equipo_nombre` solo proyectaba `SILVERADO 4X4`, sin incluir su código interno (`CTA-223`) ni la subcategoría (`CAMIONETA`). Por ende, al buscar la palabra `"camioneta"` o `"CTA"` en el buscador `<v-autocomplete>` de la PWA, no se obtenía ningún resultado.

---

## 5. Plan de Mitigación y Resolución

1. **Homologación Multi-Empresa en [`mantenimientoModel.js`](file:///d:/SGajardo/Google%20Drive/Antigravity/Grúas%20San%20Pablo/Propuesta%20Gestión%20Operación%20Grúas/ejecucion/backend_remoto/src/models/mantenimientoModel.js):**
   - Se eliminó la restricción `WHERE e.id_empresa = $1` en `getRadarFlota()`, `getHojaVidaEquipo()` y `getKpis()`, alineando el alcance de Taller con `tequEquipoModel.getEquipos()` (**110 equipos** del holding).
   - Se incorporaron los `LEFT JOIN` a `tequ_subcategoria`, `tequ_categoria`, `tequ_modelo`, `tequ_marca` y `tpar_empresas`, construyendo `equipo_nombre` con el formato enriquecido:
     `{codigo_interno} · {nombre_subcategoria} · {marca} {modelo}` (ej. `RSPP.57-5 — CTA-220 · CAMIONETA · MAXUS T60 SC 4X2 DX`).
2. **Despliegue y Verificación Empírica en `PROD` y `DEV`:**
   - Se desplegó `mantenimientoModel.js` en `/home/nodeadmin/proyectos/lean-services-gsp-prod` (`PM2 13`) y `/home/nodeadmin/proyectos/lean-services-gsp` (`PM2 10`).
   - Se verificó `HTTP 200 OK` en `GET /api/mantenimiento/flota/radar` tanto en `PROD` como en `DEV`, retornando los **110 activos** de la flota (incluyendo las **8 camionetas**, **3 furgones**, **1 jeep** y **3 cuatrimotos**).

---

## 6. Protocolo de Respuesta y Guía al Usuario / Operador

> **Mensaje para Leonel Vergara:**
> *"Leonel, ya está habilitada la totalidad de las camionetas y vehículos livianos en el selector de Taller (tanto en la App móvil como en Web). Ahora puedes buscar cualquiera de las camionetas escribiendo **`camioneta`**, su código interno (**`CTA-216`** a **`CTA-226`**), su marca/modelo (**`Maxus`**, **`T60`**, **`Poer`**, **`Silverado`**, **`Berlingo`**) o su patente (**`RKVZ`**, **`RSPP`**, **`SDXD`**, **`SZTX`**). Solo recarga o vuelve a abrir el formulario de Nueva OTM."*

---

## 7. Lecciones Aprendidas y Acciones Preventivas

- **Flota Unificada de Holding en Taller:** En grupos empresariales multi-razón social donde un único Taller Central atiende los activos de todas las sociedades (`SAN PABLO`, `CERRO DOROTEA LTDA`, `LOGISTICA DEL SUR`, `BESTMAQ`, `ROYAL RENTAL`), las consultas sobre `tequ_equipo` nunca deben restringirse por `e.id_empresa = 9`, sino exponer la flota completa con su etiqueta `name_empresa` e indexación por código interno, subcategoría, marca, modelo y patente.
