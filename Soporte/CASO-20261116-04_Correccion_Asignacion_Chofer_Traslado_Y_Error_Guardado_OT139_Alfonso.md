# CASO-20261116-04: Corrección de Asignación de Chofer en Traslado y Error de Guardado en OT GSP-2611-00139 (Alfonso)

---

## 1. Ficha del Incidente

* **ID del Caso:** `CASO-20261116-04`
* **Fecha / Hora:** 2026-11-16 14:15 CLT (GMT-03:00)
* **Operador / Usuario Afectado:** Alfonso Porperrello (Jefe de Operaciones / Planificador)
* **Negocio / OT:** `GSP-2611-00139` (ID Proyecto 204 — SUM & SERVICE SPA / Obra "Reactor Nuclear")
* **Equipos Involucrados:** 
  - Alza Hombres — Plataforma Articulada Diésel XGA16E (`PAD-33`, ID Equipo 142)
  - Camión Plataforma Freightliner M2 106 (`DRCX. 62- 6`, ID Equipo 75)
* **Personal Asignado:** Manuel Guzmán (`id_user = 42`, Chofer de Transporte)
* **Ambiente:** Desarrollo (`DEV`)
* **Severidad:** Crítica (bloqueo total para guardar, avanzar, retroceder o confirmar la asignación de recursos, y omisión de chofer en OT PDF y base de datos)

---

## 2. Síntoma Reportado por Terreno

1. Al intentar guardar cambios, avanzar, volver a preventa o confirmar la asignación en la pestaña de Asignación de Recursos de la OT (`https://servidor.leanglobal.cl/lg-gsp-dev/crm?id_proyecto=204&subtab=asignacion`), el navegador desplegaba el mensaje de alerta bloqueante:
   > *"servidor.leanglobal.cl dice: Error al guardar cambios de asignación."*
2. En la Orden de Trabajo PDF (Versión 10), el chofer asignado para el traslado (Manuel Guzmán) no aparecía registrado:
   - Tabla 3 (Convoy): Mostraba únicamente el PAD-33 con *"Sin Operador (Arriendo Sin Operador)"*. El camión de traslado DRCX-62 no figuraba.
   - Tabla 4 (Dotación): Mostraba *"Sin tripulación asignada"*.
3. En la PWA móvil del chofer Manuel Guzmán, el proyecto no aparecía listado para gestionar el viaje de entrega ni la bitácora de traslado.

---

## 3. Diagnóstico Técnico & Evidencia Empírica

1. **Error HTTP 500 en Backend al Guardar:**
   - La función `guardarCambiosAsignacion()` en `GestorOportunidades.vue` emite primero un `PUT /api/proyectos/204` para actualizar los datos JSON del proyecto.
   - Al ejecutar `PUT /api/proyectos/204`, el backend remoto arrojaba la excepción en consola de PM2:
     ```text
     ReferenceError: crmV1 is not defined
         at ProyectoModel.updateProyecto (proyectoModel.js:803:52)
     ```
   - La variable `crmV1` no estaba declarada antes de la evaluación de `crmV1.lineas_servicio`, lo que provocaba que el endpoint retornara `HTTP 500` y el frontend cayera inmediatamente en el bloque `catch`, desplegando la alerta al usuario e interrumpiendo el flujo.

2. **Falla de Sincronización de Recursos Relacionales:**
   - Debido al fallo en el `PUT`, la llamada subsecuente a `POST /proyectos/204/asignaciones/sincronizar` nunca se completaba.
   - Además, en `GestorOportunidades.vue`, `personasSync` solo agregaba operadores (`r.operador_asignado_id`), omitiendo `r.chofer_id` de las ramas de transporte.
   - Al invocar la sincronización relacional, la base de datos PostgreSQL arrojaba el error:
     ```text
     error: llave duplicada viola restricción de unicidad «uq_tpry_rel_equipo_linea_activo»
     Detalle: Ya existe la llave (id_proyecto, id_equipo, COALESCE(id_linea_servicio, 0))=(204, 142, 0).
     ```

3. **Cruce Erróneo en Generación de OT PDF (`generarOTVersion`):**
   - En `proyectoModel.js:2180-2210`, al iterar sobre `equiposAsignadosBD`:
     * La plataforma `PAD-33` (línea 379) se evaluaba primero.
     * Como no tenía operador en su línea, el fallback ciego `personaAsociada = personasAsignadasBD.find(p => !personasAsignadasUsadas.has(p.id_rel_persona))` tomaba al chofer Manuel Guzmán (línea 380) y lo asignaba a la plataforma.
     * Manuel Guzmán era agregado a `personasAsignadasUsadas`.
     * Cuando el bucle llegaba al camión `DRCX-62` (línea 380), ya no había ninguna persona disponible, quedando el camión como *"Sin Operador Asignado"*.
     * Adicionalmente, `String(crm.tipo_ot).includes('RENTAL')` evaluaba `true` para todo el convoy en una `OT-RENTAL`, tratando incorrectamente al camión como equipo de arriendo.

---

## 4. Causa Raíz de Arquitectura

1. **Ausencia de Definición de Scope de Variable:** En `proyectoModel.js`, `crmV1` se referenciaba directamente sin haber sido extraído de `parsed.crm_v1` o `prevJson.crm_v1`.
2. **Falta de Deduplicación en Endpoint de Sincronización:** `sincronizarAsignacionesProyecto` intentaba insertar equipos duplicados provenientes de ramas secundarias sin agrupar previamente por `(id_equipo, id_linea_servicio)`.
3. **Omisión de Chofer de Logística en Frontend:** El cliente web no sincronizaba el campo `chofer_id` de las ramas de árbol en el array relacional de personal.
4. **Fallback No Determinista en Generación de Documentos:** El generador de PDF permitía el cruce indiscriminado de roles (un chofer de camión asignado a una plataforma elevadora).

---

## 5. Plan de Mitigación y Resolución

1. **Corrección de `proyectoModel.js`:**
   - Se declaró formalmente `const crmV1 = parsed.crm_v1 || prevJson.crm_v1 || {};` en la línea 800 de `updateProyecto`.
   - En `generarOTVersion`, se aisló el cálculo de `esRentalEq` para verificar estrictamente que el equipo sea una plataforma/alza hombres y no un camión ni equipo de traslado.
   - Se eliminó el fallback ciego que reasignaba choferes a equipos de arriendo. Las plataformas sin operador asignado quedan explícitamente como *"Sin Operador (Arriendo Sin Operador)"*.
   - Se vinculó deterministamente al camión DRCX-62 con el chofer asignado a su línea de servicio (`id_linea_servicio = 380`, Manuel Guzmán).
2. **Corrección de `asignacionRecursosController.js`:**
   - Se incorporó deduplicación en memoria previa al upsert por clave compuesta `(id_equipo, COALESCE(id_linea_servicio, 0))`.
   - Se añadió la condición `AND COALESCE(id_linea_servicio, 0) = COALESCE($3, 0)` en la búsqueda del equipo existente para evitar colisiones con el índice único `uq_tpry_rel_equipo_linea_activo`.
3. **Corrección de `GestorOportunidades.vue`:**
   - Se agregó la sincronización de `r.chofer_id` y `r.equipo_asignado_id` desde `serviciosArbol` hacia `lines` y el array `personasSync`.
4. **Compilación y Despliegue:**
   - Backend sincronizado en servidor remoto y reiniciado el proceso PM2 ID 10 (`lean-services-gsp`).
   - Frontend compilado limpiamente (`npm run build:dev`) y desplegado en `/var/www/html/lg-gsp-dev/`.
5. **Verificación Empírica:**
   - Se emitió la OT Versión 13 (`OT-GSP-2611-00139V13-272.pdf`).
   - Auditoría de texto crudo del PDF con `pdftotext`:
     ```text
     3. FLOTA & CONVOY DE EQUIPOS ASIGNADOS (2 VEHÍCULOS)
     N° | EQUIPO / MODELO | PATENTE (PPU) | SEGMENTO | OPERADOR / CHOFER ASIGNADO
     1 | PLATAFORMAS — XGA16E | PAD-33 | Rental / Arriendo | Sin Operador (Arriendo Sin Operador)
     2 | CAMIONES — M2 106 | DRCX. 62- 6 | Traslado & Logística | MANUEL GUZMAN
     4. DOTACIÓN HUMANA & TRIPULACIÓN DE FAENA (0 PERSONAS)
     Sin tripulación asignada
     ```
   - Verificación en PostgreSQL:
     * `tpry_rel_persona`: Manuel Guzmán registrado con `rol_asignado = 'Chofer Transporte'` y `estado_real = 'PROGRAMADO'`.
     * `tpry_rel_equipo`: PAD-33 y DRCX-62 registrados en `PROGRAMADO`.

---

## 6. Protocolo de Respuesta y Guía al Usuario / Operador

1. **Alfonso Porperrello (Jefe de Operaciones):**
   - Puede ingresar normalmente a la OT `GSP-2611-00139` (`https://servidor.leanglobal.cl/lg-gsp-dev/crm?id_proyecto=204&subtab=asignacion`).
   - El guardado de asignaciones y confirmación de OT funciona limpiamente con HTTP 200 OK sin alertas de error.
   - El botón "Generar PDF OT" genera el documento oficial mostrando correctamente el convoy completo (Plataforma en Rental sin operador + Camión de traslado con Manuel Guzmán).
2. **Manuel Guzmán (Chofer de Terreno):**
   - Al ingresar a la PWA con sus credenciales, el proyecto 204 se encuentra disponible para registrar la salida de patio, odómetro y combustible de inicio de viaje.

---

## 7. Lecciones Aprendidas y Acciones Preventivas

1. **Validación de Tipos en Convoy Mixto:** Nunca evaluar la categoría de un equipo individual basándose en una propiedad global del proyecto (`crm.tipo_ot`). Cada vehículo del convoy debe tipificarse según sus propias características operativas (Grúa vs. Plataforma vs. Camión de Traslado).
2. **Eliminación de Fallbacks Indiscriminados:** En la generación de documentos legales (OT), es preferible declarar *"Sin Operador Asignado"* antes que inventar o mover un recurso a una máquina incorrecta mediante fallbacks ciegos.
3. **Pruebas Integrales de Guardado:** Toda modificación en la estructura del árbol de servicios debe validar el ciclo completo: guardado en JSON (`PUT /api/proyectos/:id`) -> sincronización relacional (`POST /asignaciones/sincronizar`) -> emisión de documento PDF (`POST /generar-ot`).
