# 🛠️ Ficha de Incidente Operacional: CASO-20261103-05

## 1. Ficha del Incidente
- **ID del Caso:** `CASO-20261103-05`
- **Requerimiento Asociado:** `REQ-1101` (`SPEC-016 v4.3.0`)
- **Fecha / Hora de Detección:** 2026-11-03 22:00:00 (-03:00)
- **Ejecutivo / Usuarios Afectados:**
  - **Natalia Ghisellini** (`nghisellini@arriendosanpablo.cl`, Ejecutivo Comercial)
  - **Jonathan Castillo** (`id_user = 17`, Jefatura de Operaciones)
  - **Ernesto Israel Ríos** (`id_user = 9`, Operador Camión Pluma)
- **Negocio / OT Afectada:** `GSP-2611-00007` (`id_proyecto = 36` en `sch_leangsp_prod`) — Cliente: **METTCO SPA** (`PLANTA FERRERO- FUNDO CARACAS`), Monto Neto: **`$10.640.000`**
- **Equipo Involucrado:** Camión Pluma Palfinger PK 60002 `SINOTRUK C7H8X4 440 EV FORESTAL` — Patente **`RSPL.82-3`** (`id_equipo = 56`, Código Interno `CPA-97`)
- **Ambiente:** Producción (`PROD` — `sch_leangsp_prod`)
- **Severidad:** **Alta** (Ocultamiento del ítem principal de maquinaria en `1. FLOTA PRINCIPAL & OPERADORES DE SERVICIO` por coincidencia de texto libre en la descripción comercial y omisión del operador y patente en la tarjeta de `Kanban + Filtros`).

---

## 2. Síntoma Reportado por Terreno
1. **Tarjeta en `Kanban + Filtros` (`Torre.vue`) sin Operador ni Equipo:**
   - En el tablero `Kanban + Filtros`, la tarjeta del negocio `GSP-2611-00007` (`METTCO SPA — PLANTA FERRERO- FUNDO CARACAS`) mostraba:
     - `EQUIPO: Req: Grúas Telescópicas`
     - `OPERADOR: ⚠️ Sin Operador`
     - `RIGGER: No requerido`
   - Sin embargo, en la pestaña `5. Control de Flota & Despacho`, el equipo `RSPL.82-3 - SINOTRUK C7H8X4 440 EV FORESTAL` y su operador `Ernesto Israel Rios` sí aparecían asignados y vigentes.
2. **Desaparición del Camión Pluma de la Sección 1 (`1. FLOTA PRINCIPAL & OPERADORES DE SERVICIO`) en `3. Asignación Recursos OT` (`GestorOportunidades.vue`):**
   - Aunque el **Estructurador de Servicios** y el PDF de la cotización tenían explícitamente **2 ítems**:
     - **Ítem 1:** `CAMIONES — CAMION PLUMA` | `Horas Mes Minimas` (`1 Mes x 180 hrs/mes`, `$58.000/hr`, Subtotal `$10.440.000`) — Descripción: *"HORAS MINIMAS MENSUALES ARRIENDO DE CAMION PLUMA CON OPERADOR. INCLUYE COMBUSTIBLE."*
     - **Ítem 2:** `TRASLADOS — CAMIÓN PLATAFORMA` | `TRASLADO IDA/VUELTA` (`1 Servicio`, `$200.000`) — Descripción: *"TRASLADO DE IDA Y VUELTA DE CAMION PLUMA A OBRA"*
   - En la pestaña `3. Asignación Recursos OT`, la **Sección 1 (`1. FLOTA PRINCIPAL & OPERADORES DE SERVICIO`)** aparecía vacía (`0 EQUIPOS`), obligando a Operaciones a asignar el Camión Pluma `RSPL.82-3` y al operador `Ernesto Israel Rios` en la **Sección 2 (`2. EQUIPOS DE TRASLADO & CHOFERES (LOGÍSTICA)`)**.

---

## 3. Diagnóstico Técnico & Evidencia Empírica

### 3.1. Estado en Base de Datos (`sch_leangsp_prod.tpry_proyecto`, `id_proyecto = 36`)
La inspección directa en PostgreSQL reveló:
- En `json_field.crm_v1.lineas_servicio`:
  - **Línea 0:** `tipo: "CAMIONES"`, `subcategoria: "CAMION PLUMA"`, `unidad: "Horas Mes Minimas"`, `descripcion: "HORAS MINIMAS MENSUALES ARRIENDO DE CAMION PLUMA CON OPERADOR. INCLUYE COMBUSTIBLE."`, `valorUnitario: 58000`, `cantidad_horas: 180`. Tenía `equipo_asignado_id: ""` y `operador_asignado_id: ""`.
  - **Línea 1:** `tipo: "TRASLADOS"`, `subcategoria: "CAMIÓN PLATAFORMA"`, `unidad: "TRASLADO IDA/VUELTA"`, `descripcion: "TRASLADO DE IDA Y VUELTA DE CAMION PLUMA A OBRA "`, `valorUnitario: 200000`.
- En `json_field.ejecucion_v1`:
  - `equipo_id: null`, `operador_id: null`.
  - `equipos_extra[0]`: `id_equipo: 56` (`RSPL.82-3`), `chofer_id: 9` (`Ernesto Israel Rios`).
  - `tripulacion_asignada[0]`: `id_user: 9`, `cargo: "Chofer Cama Baja"`, `equipo_asignado_id: 56`.

---

## 4. Causa Raíz de Arquitectura (Software / State Machine / Datos)

1. **Antipatrón de Clasificación por Descripción Libre (`l.descripcion`) en `GestorOportunidades.vue`:**
   - La función `isPersonalLine(l)` evaluaba `desc.includes('OPERADOR') || desc.includes('RIGGER') || desc.includes('PREVENCIONISTA') || desc.includes('SUPERVISOR')` sin verificar primero la categoría estructurada (`l.tipo`).
   - Como el ejecutivo comercial redactó en la descripción de la Línea 0 (`CAMIONES — CAMION PLUMA`): *"HORAS MINIMAS MENSUALES ARRIENDO DE CAMION PLUMA **CON OPERADOR**. INCLUYE COMBUSTIBLE."*, `isPersonalLine(l)` retornó `true`.
   - En consecuencia, `linesValidas` (`!isPersonalLine(l)`) y `linesEquiposPrincipales` excluyeron la Línea 0 del Camión Pluma, dejando `1. FLOTA PRINCIPAL & OPERADORES DE SERVICIO` con `(0 EQUIPOS)`.
   - De igual forma, `isTrasladoLine(l)` y `esLineaPlataforma(l)` inspeccionaban texto libre en `l.descripcion`, exponiendo al sistema a falsos positivos cuando una glosa de grúa o camión mencionaba las palabras `"TRASLADO"` o `"PLATAFORMA"`.
2. **Omisión de `equipos_extra` y Roles de Conductor/Camión Pluma en `Torre.vue` (`getFichaOperativa` y `getHitoAsignacion`):**
   - `getFichaOperativa(p)` en `Torre.vue` solo buscaba `ej.equipo_id` o `lineas.find(l => l.equipo_asignado_id)` y para el operador solo buscaba `ej.operador_id`, `lineas.find(l => l.operador_asignado_id)` o `/operador/i.test(t.cargo)` en `tripulacion_asignada`, ignorando `ej.equipos_extra` y cargos `'Chofer Cama Baja'` / `'Conductor'`.

---

## 5. Plan de Mitigación y Resolución

### 5.1. Refactorización Estructural a Taxonomía Estricta (`Categoría` + `Subcategoría` + `Unidad`)
1. **[`GestorOportunidades.vue`](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/ejecucion/frontend/src/views/CRM/GestorOportunidades.vue):**
   - **`isPersonalLine(l)`:** Eliminada toda evaluación de `l.descripcion`. Solo clasifica como línea de personal cuando `l.tipo` es `'PERSONAL CERTIFICADO'` / `'PERSONAL'`. Si `l.tipo !== ''` (cualquier categoría de maquinaria, camión o traslado), retorna `false` de forma determinista.
   - **`isTrasladoLine(l)`:** Eliminada toda evaluación de `l.descripcion`. Clasifica exclusivamente por `l.tipo` (`TRASLADOS` / `FLETE`) o `l.unidad` (`TRASLADO*` / `FLETE` / `VIAJE`).
   - **`esLineaPlataforma(line)` y `esProyectoPlataforma`:** Eliminada la inspección de `l.descripcion` y excluidas explícitamente las categorías `TRASLADOS`, `CAMIONES` y `CAMION PLATAFORMA`.
   - **`sincronizarTrasladosComerciales()`:** Eliminada toda lectura de `l.descripcion` (`CONTRAPESO`, `CLIENTE`, `TERCERO`, `MAQUINARIA`) y la dependencia de `opportunity.value?.tipo_caso === 5`. Implementada la matriz de 5 reglas (`SPEC-065 §4.1` / `SPEC-016 §20.3`): cuando en Sección 1 solo hay `CAMIONES` autopropulsados (ej. `CAMION PLUMA`) sin Plataformas/Horquillas, o cuando la subcategoría de `TRASLADOS` es de Grúa/Pluma, la línea comercial de traslado se oculta de la Sección 2 (`0 VEHÍCULOS`).
   - **Rol de Operador para `CAMIONES — CAMION PLUMA`:** `tripulacionAsignada` y `getOperadorAsignadoAEquipo` evalúan `line.tipo` y `line.subcategoria` para asignar el rol `'Operador Camión Pluma'`.
2. **[`Torre.vue`](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/ejecucion/frontend/src/views/Torre.vue):**
   - **`getFichaOperativa(p)` y `getHitoAsignacion(p)`:**
     - Restricción de `esSoloRigger` a categorías de personal (`if (t !== '' && !t.includes('PERSONAL')) return false`).
     - Fallback a `ej.equipos_extra` (`id_equipo` y `chofer_id`) y expresión `/operador|chofer|conductor/i` sobre `tripulacion_asignada`.
     - Resolución de `reqEquipoComercial` desde la primera línea de maquinaria cuando aún no hay patente asignada.

### 5.2. Datafix en Base de Datos (`sch_leangsp_prod`)
- **`GSP-2611-00007` (`id_proyecto = 36`):**
  - `json_field.crm_v1.lineas_servicio[0]`: `equipo_asignado_id = 56`, `operador_asignado_id = 9`, `rigger_asignado_id = ""`.
  - `json_field.ejecucion_v1`: `equipo_id = 56`, `operador_id = 9`, `equipos_extra = []` (vaciado según Regla 1 de `SPEC-065 §4.1`, ya que el Camión Pluma es autopropulsado y su traslado es cobro comercial), `tripulacion_asignada` con 1 único registro (`cargo = 'Operador Camión Pluma'`, `id_user = 9`, `equipo_asignado_id = 56`, `is_linea_base = true`).
  - `tpry_rel_equipo` (`id_rel_equipo = 13`): `rol_equipo = 'CAMIONES - CAMION PLUMA'`.
  - `tpry_rel_persona` (`id_rel_persona = 19`): `rol_asignado = 'Operador Camión Pluma'`.
- **`GSP-2611-00005` (`id_proyecto = 34`):**
  - Eliminada la línea sintética duplicada `_uid = 'op-1793650280870-6739'` que se había creado cuando la Línea 0 (`GRUA HORQUILLA CON OPERADOR`) estuvo oculta por el mismo bug.

---

## 6. Protocolo de Respuesta y Guía al Usuario / Operador
> **Mensaje para Jefatura de Operaciones y Comercial:**
> Se ha corregido y desplegado la visualización del negocio **`GSP-2611-00007` (`METTCO SPA — PLANTA FERRERO- FUNDO CARACAS`)**.
> 1. En **`3. Asignación Recursos OT`**, el ítem **`CAMIONES — CAMION PLUMA`** (`180 hrs mínimas mensuales`) aparece ahora en **`1. FLOTA PRINCIPAL & OPERADORES DE SERVICIO (1 EQUIPO)`** con el camión pluma **`RSPL.82-3 - SINOTRUK C7H8X4 440 EV FORESTAL`** y el operador **`Ernesto Israel Rios`** asignados en su posición titular, mientras que la **Sección 2 (`2. EQUIPOS DE TRASLADO & CHOFERES`)** queda en **`0 VEHÍCULOS`** (porque el traslado del propio Camión Pluma autopropulsado es un concepto comercial de cobro y no requiere un segundo camión).
> 2. En el tablero **`Kanban + Filtros`** y **`Cardex 3D`**, la tarjeta de `GSP-2611-00007` muestra ahora **`EQUIPO: [RSPL.82-3] SINOTRUK C7H8X4 440 EV FORESTAL`** y **`OPERADOR: Ernesto Israel Rios`**, permitiendo filtrar por dicho operador y equipo.

---

## 7. Lecciones Aprendidas y Acciones Preventivas
- **Prohibición Absoluta de Inferencia de Taxonomía por Descripción Libre:** Ninguna función del sistema puede clasificar una línea del Estructurador (`Maquinaria Principal`, `Traslado Logístico`, `Personal Certificado` o `Plataforma Dry Lease`) inspeccionando palabras dentro del campo de texto libre `l.descripcion`. Toda clasificación debe regirse única y exclusivamente por los campos estructurados `l.tipo` (`Categoría`), `l.subcategoria` (`Subcategoría`) y `l.unidad` (`Unidad de Cobro`).
