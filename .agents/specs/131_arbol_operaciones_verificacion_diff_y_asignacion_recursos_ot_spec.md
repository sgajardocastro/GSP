# SPEC-131: Unificación de la Arquitectura de Árbol Relacional en Operaciones: Verificación Operativa (Validación & Diff) y Asignación Jerárquica de Recursos OT por `id_linea_servicio`

- **Código de Especificación:** `SPEC-131`
- **Fecha:** 2026-11-13 (Revisión 7.0 Canónica - Matriz de Especialidades Operativas y Filtrado por Cargo)
- **Autor:** Principal Software Architect & Senior Systems Engineer
- **Rama Git:** `feature/spec130-remediacion-estructural`
- **Estado:** ESPECIFICACIÓN TÉCNICA OFICIAL APROBADA
- **Especificaciones Precedentes:** `SPEC-016` (Estructurador Comercial), `SPEC-022` (Modelamiento DB Asignación), `SPEC-023` (Acreditaciones & Semáforos), `SPEC-065` (Matriz Logística, Autopropulsados y Reglas de Flota Core), `SPEC-128`, `SPEC-129`, `SPEC-130`.
- **Dependencia Relacional:** `sch_leangsp.tpry_linea_servicio`, `sch_leangsp.tpry_rel_equipo`, `sch_leangsp.tpry_rel_persona`, `sch_leangsp.tequ_equipo`, `sch_leangsp.tsec_users`.

---

## 1. Diagnóstico, Axiomas y Principios Rectores

### 1.1. Principio Fundamental: Continuidad del Árbol Sin Degradación Plana
En la Preventa Comercial, el requerimiento nace estructurado como un árbol jerárquico (`EstructuradorArbolServicios.vue`), donde un servicio base (Izaje, Rental, Transporte) contiene anidadas sus ramas de apoyo logístico o dotación profesional.
Al pasar a Operaciones (Torre de Control), **la estructura de árbol se conserva intacta**:
- En **Validación & Diff** (Peldaño 2), se audita el árbol técnico contra el snapshot comercial.
- En **Asignación de Recursos OT** (Peldaño 3), la asignación de maquinaria y tripulación se realiza **dentro de la misma estructura de árbol**, vinculando cada recurso físico a su correspondiente `id_linea_servicio`.

### 1.2. Regla Inviolable: CERO PRECIOS y CERO ETIQUETAS TÉCNICAS en Operaciones
1. **Cero Precios:** Queda terminantemente prohibido renderizar cualquier precio, tarifa unitaria, subtotal en pesos o datos monetarios.
2. **Cero Etiquetas Técnicas de Depuración:** Queda estrictamente prohibido mostrar IDs de base de datos o tags de trazabilidad interna en la interfaz de usuario (ej. `Línea #lin_grua_70t`). La cabecera debe ser sobria, limpia y 100% orientada al lenguaje operativo.

### 1.3. Axioma de Aislamiento Operativo y Autopropulsión (SPEC-065 §1 y §4.1)
> **"Un traslado de equipo autopropulsado (Grúa Telescópica Liebherr LTM, Grove, Camión Pluma) es estrictamente un concepto comercial de cobro; no constituye una unidad vehicular de asignación independiente ni admite tripulación paralela, pues la grúa rueda por carretera conducida por su propio operador."**
- **Regla Determinista de Filtrado de Traslados:**
  - Si el servicio base es `GRUAS TELESCOPICAS` o `CAMION PLUMA`, cualquier línea de traslado asociada al traslado de la propia grúa **SE OCULTA DE LA VISTA OPERATIVA DE ASIGNACIÓN**.
  - **Excepción:** Solo se renderiza asignación logística cuando la rama corresponde a un camión auxiliar para transporte de contrapesos/aparejos (ej. grúas $\ge 90$T), transporte de carga de terceros, o cuando Operaciones agregue explícitamente un apoyo logístico o de escolta.

### 1.4. Jerarquía Operativa de Adición: Recursos Subordinados vs. Autónomos
Operaciones gestiona dos niveles de adición de recursos según la realidad de terreno:
1. **Nivel Subordinado (Dependiente de una Máquina):** Se gestiona dentro de la tabla del servicio mediante la fila conectada del árbol (`tree-branch-cell is-last`) con el botón `[ + Agregar ítem... ⌵ ]` y su popover flotante (`+ Traslado`, `+ Apoyo`, `+ Personal`).
2. **Nivel Autónomo (Faena General / Reconfiguración Operativa):** El coordinador de operaciones posee la facultad de incorporar recursos independientes que no cuelgan de una grúa comercial preexistente. En Operaciones esto se limita estrictamente a:
   - **`+ Agregar Equipo`**: Incorpora una máquina o grúa principal adicional para la faena (con su propio operador titular, relevos y árbol de ítems).
   - **`+ Agregar Personal`**: Incorpora dotación profesional autónoma para la faena (Prevencionista de Riesgos, Supervisor de Maniobras, Rigger independiente).
   - *Nota:* Operaciones jamás agrega arriendos o ítems comerciales abstractos.

### 1.5. Matriz de Especialidades Operativas y Filtrado Semántico de Personal
- **Cero Restricciones Artificiales a Rigger:** Queda prohibido encasillar la dotación de personas exclusivamente al cargo de "Rigger".
- **Especialidades Canónicas Reconocidas:**
  1. `RIGGER CERTIFICADO` (Maniobrista / Rigger de Faena)
  2. `PREVENCIONISTA DE RIESGOS (APR)` (Asesor en Prevención de Riesgos de Faena)
  3. `SUPERVISOR DE IZAJE / MANIOBRAS` (Jefe de Maniobra / Supervisor de Terreno)
  4. `OPERADOR DE APOYO / RELEVO` (Operador auxiliar de maquinaria)
  5. `CONDUCTOR / CHOFER DE ESCOLTA` (Chofer de apoyo logístico)
  6. `ESPECIALISTA TÉCNICO GENERAL` (Mecánico, técnico o personal de apoyo)
- **Selector Directo de Cargo en Columna de Requerimiento:**
  En las filas de personal (ramas o servicios autónomos), la columna 1 muestra un selector desplegable de especialidad que permite al coordinador definir y modificar libremente el rol requerido.
- **Priorización Semántica en Selector de Tripulantes:**
  El selector de usuarios agrupa y sugiere en primer lugar a los trabajadores calificados según el cargo activo (`PREV` / `APR` para prevencionistas, `RIGGER` para maniobristas, `SUPERVISOR` para supervisores, `OPERADOR` para operadores), manteniendo el grupo *"Resto de Personal"* para flexibilidad operativa.

---

## 2. Peldaño 3: Asignación Jerárquica de Recursos OT (Estructura Tabular Estilo Preventa)

### 2.1. Arquitectura Visual: Barra Superior de Faena y Tablas de Árbol

```
+--------------------------------------------------------------------------------------------------------------------------------------------------+
| RECURSOS DE OPERACIÓN & TRIPULACIÓN OT                                                        [ + Agregar Equipo ]      [ + Agregar Personal ]   |
+--------------------------------------------------------------------------------------------------------------------------------------------------+
| ÍTEM / REQUERIMIENTO TÉCNICO COMERCIAL  | EQUIPO / VEHÍCULO ASIGNADO           | TRIPULACIÓN / OPERADOR & RIGGER     | VENTANA PLANIFICADA       | ACC |
+--------------------------------------------------------------------------------------------------------------------------------------------------+
| [IZAJE] Grúa Telescópica 70 Toneladas   | [Selector Flota Priorizada]          | OP: [Selector Operador] [+ Relevo]  | [ 11/11/2026 ➔ 11/11/2026 ]|     |
| Subcat: GRUA 70 TON • 1 Día x 8 Hrs     | 🟢 GPT-127 (Liebherr LTM-1070)       | RIG: [Selector Rigger]  [+ Ext]     |                           |     |
|-----------------------------------------+--------------------------------------+-------------------------------------+---------------------------+-----|
| └── [ + Agregar ítem... ⌵ ]            |                                      |                                     |                           |     |
+--------------------------------------------------------------------------------------------------------------------------------------------------+
```

### 2.2. Lógicas Funcionales Obligatorias
1. **Semáforo Documental Inmediato (SPEC-023):** 🟢 VIG, 🟡 VNC, 🔴 VNC. Clic abre el drawer de acreditaciones.
2. **Relevos de Operadores por Tramos de Fechas:** Permite tramos múltiples de fechas para el operador sobre la misma máquina sin duplicar la grúa.
3. **Rigger Opcional y Enrolamiento Externo:** Asignación opcional con botón `+ Rigger Externo`.
4. **Persistencia Relacional en PostgreSQL:** Sincroniza `tpry_rel_equipo` y `tpry_rel_persona` en base de datos.

### 2.3. Purgado Atómico por Supresión de Líneas y Sincronización Pre-OT (REQ-1180 / Fix Incidente Alfonso)
1. **Sincronización Previa Obligatoria en Emisión de OT (`generarPDFOT`):**
   - Queda estrictamente prohibido emitir o regenerar una versión de Orden de Trabajo (`POST /proyectos/:id/generar-ot`) sin antes haber ejecutado la persistencia y sincronización relacional completa de asignaciones (`POST /proyectos/:id/asignaciones/sincronizar`).
   - `generarPDFOT()` debe invocar silenciosamente la sincronización relacional antes de compilar el documento PDF oficial.
2. **Cascada Atómica de Eliminación en Base de Datos Relacional (`_sincronizarLineasServicioRelacional`):**
   - Cuando una línea de servicio es eliminada de `tpry_linea_servicio`, cualquier fila en `tpry_rel_equipo` y `tpry_rel_persona` vinculada a dicha línea debe pasar automáticamente y de forma atómica a `estado_real = 'CANCELADO'` con traza de auditoría, impidiendo su persistencia como recursos activos huérfanos.
3. **Consistencia de Arreglos en Frontend (`eliminarServicioOperativo`):**
   - Al eliminar un servicio o ítem en el árbol operativo, el componente `AsignadorArbolRecursos.vue` debe purgar de forma inmediata las líneas correspondientes del arreglo bidireccional `lines` (`emit('update:lines', ...)`), notificando el estado dirty y sincronizando la asignación activa.
4. **Escudo Anti-Resurrección en Backend (`updateProyecto`):**
   - En proyectos en Operaciones (`estado >= 3`), si se eliminan todas las líneas de una especialidad (ej. no quedan grúas ni equipos de izaje), el backend no debe restaurar `equipo_id` u `operador_id` desde el snapshot previo, permitiendo la supresión legítima de recursos.
5. **Filtro Estricto de Estado en PWA (`getReportContexto`):**
   - La API de contexto operativo para la PWA de terreno debe filtrar explícitamente `AND COALESCE(rp.estado_real, 'PROGRAMADO') NOT IN ('CANCELADO', 'REEMPLAZADO')` para evitar que recursos dados de baja sean visibles en los reportes o checklist.
