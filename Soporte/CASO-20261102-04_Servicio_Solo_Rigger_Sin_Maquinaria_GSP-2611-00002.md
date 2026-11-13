# 🛠️ Ficha de Incidente Operacional: CASO-20261102-04

## 1. Ficha del Incidente
- **ID del Caso:** `CASO-20261102-04`
- **Requerimiento Asociado:** `REQ-1090` (`SPEC-016 v4.0.0`)
- **Fecha / Hora del Reporte:** `2026-11-02 18:14:26 (-03:00)`
- **Usuario Reportante:** Jorge Ponce (`jponce@arriendosanpablo.cl`, Gerente de Operaciones) / Jonathan Castillo (`id_user = 17`)
- **Personal Asignado al Servicio:** José Arriagada Salamanca (`id_user = 38`, `jose.arriagada@arriendosanpablo.cl`, `Rigger Certificado`)
- **Negocio / OT:** `GSP-2611-00002` (`id_proyecto = 31`) — **INVERSIONES E INMOBILIARIA PLAENGE CHILE LTDA** (`OPERA -PT014-2 OPERA`)
- **Equipo Involucrado:** **Sin Maquinaria (Servicio Exclusivo de Rigger Certificado en Terreno — Valor Fijo `$450.000`)**
- **Ambiente:** Producción (`PROD` — `sch_leangsp_prod`) y Desarrollo (`DEV` — `sch_leangsp`)
- **Severidad:** **Alta** (Bloqueo de flujo operativo en etapa `PREPARACION_PATIO` para negocios de solo personal certificado)
- **Estado:** **RESUELTO, NORMALIZADO EN BD Y DESPLEGADO (`v1.0.182`)**

---

## 2. Síntoma Reportado por Terreno
Jorge Ponce reportó mediante nota de voz (`Caso Solo rigger  - WhatsApp Ptt 2026-11-02 at 18.14.26.ogg`) y captura del Kanban en **Control Operativo**:
> *"Oye Sergio, consulta: tenemos un servicio para mañana que es solamente de Rigger, arrendamos el puro Rigger, sin grúa ni camión. Lo pasamos a preparación operaciones (`GSP-2611-00002`, Plaenge Chile, `$450.000`), le asignamos al Rigger, pero queda pegado en `PATIO / SALIDA` al `0%` porque pide equipo y checklist de salida de patio de grúa, y como no lleva equipo no sabemos cómo avanzarlo a ejecución y después al cierre."*

Para intentar destrabar el flujo a las `18:46:24`, un usuario operativo (`id_user = 10`) agregó artificialmente un camión plataforma (`id_equipo = 75`, `chofer_id = 93`) como equipo extra de apoyo.

---

## 3. Diagnóstico Técnico & Evidencia Empírica en Base de Datos (`sch_leangsp_prod`)

1. **Inspección de `tpry_proyecto` (`id_proyecto = 31`, `codi_proyecto = 'GSP-2611-00002'`):**
   - `id_proyecto_estado = 5` (`PREPARACION_PATIO`).
   - Línea comercial (`json_field->'crm_v1'->'lineas_servicio'`):
     ```json
     [
       {
         "tipo": "PERSONAL CERTIFICADO",
         "unidad": "Valor Fijo",
         "cantidad": 1,
         "descripcion": "Servicio de Rigger Certificado",
         "subcategoria": "RIGGER",
         "valorUnitario": 450000,
         "fecha_plan_ini": "2026-11-03",
         "fecha_plan_fin": "2026-11-03"
       }
     ]
     ```
   - `json_field->'ejecucion_v1'` contenía placeholders legacy (`"equipo_id": "CRN-DEFAULT"`, `"operador_id": "OP-101"`, `"rigger_id": "RIG-201"`) y el equipo extra ficticio agregado a las `18:46:24`.
2. **Inspección de tablas relacionales (`tpry_rel_persona`, `tpry_rel_equipo`, `tequ_log_desplazamiento`):**
   - En `tpry_rel_persona` (`id_rel_persona = 10`): a las `18:07:22` Jonathan Castillo (`id_user = 17`) había asignado correctamente al Rigger **JOSE ARRIAGADA SALAMANCA (`id_user = 38`, `rol_asignado = 'Rigger'`)**.
   - A las `18:46:24` se habían insertado registros artificiales (`tpry_rel_equipo.id_rel_equipo = 7` con `id_equipo = 75`, `tpry_rel_persona.id_rel_persona = 11` con `id_user = 93`, y `tequ_log_desplazamiento.id_log_desplazamiento = 13`) producto del intento de destrabar la pantalla de patio.

---

## 4. Causa Raíz de Arquitectura (Software / State Machine / Datos)

1. **Acoplamiento de Flota en `GestorOportunidades.vue`:**
   - En `cargarDatosCotizacion`, la Sección 3 (`Especialistas & Personal Técnico en Terreno`) filtraba explícitamente las líneas con `subcategoria === 'RIGGER'` asumiendo que el Rigger siempre iba adosado a una grúa principal en la Sección 2 (`Tripulación Operativa`). Cuando la cotización no tenía grúas (`linesEquiposPrincipales.length === 0`), el Rigger quedaba sin tarjeta de equipo en Sección 2.
   - En la pestaña `5. Control de Flota & Despacho`, `equiposAsignadosLista` resultaba vacío (`[]`), dejando el botón `Avanzar a Ejecución y Reportes Diarios` bloqueado por `:disabled="!preparacionSalidaState.validacion_estricta"` y los semáforos `statusSegmento2` / `statusSegmento3` en `'GRAY'`.
2. **Fallback a Equipo `35` en `reportDiarioController.js`:**
   - Al regularizar manualmente un Report Diario (`regularizarReporteManual`) sin `id_equipo`, el controlador aplicaba un fallback `relEq.rows[0]?.id_equipo || 35`, vinculando erróneamente una grúa inexistente en el negocio en vez de mantener `id_equipo = NULL` y asociar `id_user_rigger`.
3. **Cálculo por Hora vs. Valor Fijo en `itsController.js`:**
   - En `obtenerDetalleITS`, las jornadas se calculaban multiplicando `hrsFact * valorHoraPactado` (`8 hrs * $450.000 = $3.600.000`) sin distinguir cuando la línea comercial de personal está pactada a **`Valor Fijo`** (`1.0 jornada * $450.000 = $450.000`), y además `construirPropuestaPersonalDiaria` duplicaba al Rigger como `OPERADOR` y como `RIGGER` cuando `id_user_operador === id_user_rigger`.

---

## 5. Plan de Mitigación y Resolución Aplicado

1. **Actualización de Especificación Canónica (`.agents/specs/16_crm_gestor_oportunidades_spec.md` `v4.0.0`):**
   - Incorporación de la **Sección 17: Modalidad de Servicio Exclusivo de Personal Certificado / Solo Rigger (Sin Maquinaria) (`REQ-1090` / `CASO-20261102-04`)**.
2. **Mejoras en Frontend ([GestorOportunidades.vue](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/ejecucion/frontend/src/views/CRM/GestorOportunidades.vue)):**
   - Eliminación de placeholders `'CRN-DEFAULT'`, `'OP-101'`, `'RIG-201'`.
   - Habilitación de `Rigger` interno y externo (`➕ Ext`) en Sección 3 cuando `linesEquiposPrincipales.length === 0`.
   - Tarjeta informativa de exención de flota en `5. Control de Flota & Despacho` y botón habilitado para avanzar directamente a `6. Reportes Diarios de Izaje` (`finalizarPreparacionSalida()`).
   - Etiqueta `PERSONAL` y nombre del especialista en la tabla de `6. Reportes Diarios de Izaje` cuando `rep.id_equipo` es `null`.
3. **Mejoras en Backend (`reportDiarioController.js`, `controlVivoController.js`, `itsController.js`):**
   - `reportDiarioController.js`: Preservación de `id_equipo = NULL` y asignación de `id_user_rigger` desde `tpry_rel_persona` en `regularizarReporteManual`.
   - `controlVivoController.js`: Renderizado de `patente: 'PERSONAL'`, `tipo_equipo: 'SERVICIO RIGGER / ESPECIALISTA'` y datos del Rigger asignado en Control Operativo en Vivo.
   - `itsController.js`: Valorización `esValorFijoComercial` (`horas_report = 1.0`, `tipo_servicio = 'Valor Fijo / Jornada'`, `subtotal = $450.000`) y no duplicación de `OPERADOR` cuando `id_user_operador === id_user_rigger`.
4. **Normalización de Datos en Producción (`sch_leangsp_prod`, `id_proyecto = 31`):**
   - Purga del equipo extra ficticio (`id_rel_equipo = 7`, `id_rel_persona = 11`, `id_log_desplazamiento = 13` e `inspecciones_patio["75"]`).
   - Normalización de `json_field.ejecucion_v1` dejando únicamente al Rigger Certificado **JOSE ARRIAGADA SALAMANCA (`id_user = 38`)** en `especialistas_terreno`, `tripulacion_asignada` y `rigger_id = 38`.

---

## 6. Protocolo de Respuesta y Guía al Usuario / Operador
1. Al abrir el negocio **`GSP-2611-00002`** (**INVERSIONES E INMOBILIARIA PLAENGE CHILE LTDA**), en **Asignación de Recursos** verá asignado a **JOSE ARRIAGADA SALAMANCA** como **Rigger Certificado** sin exigir grúa ni camión.
2. En **Control de Flota & Despacho**, el sistema muestra el recuadro **"Servicio Exclusivo de Personal Certificado en Terreno — Exento de Flota"** y permite pulsar directamente **"Confirmar Personal y Avanzar a Reportes Diarios"**.
3. Al finalizar la faena, se registra o regulariza el Report Diario del Rigger (con voucher físico o digital) y se emite el **ITS** por el valor fijo comercial de **`$450.000`** más el incentivo de día Rigger (`$15.000`) y viático de alimentación (`$10.000`).

---

## 7. Lecciones Aprendidas y Acciones Preventivas
- **Desacoplamiento Estructural Personal vs. Maquinaria:** Los servicios de personal certificado (`RIGGER`, `SUPERVISOR DE IZAJE`, `ASESOR APR`) pueden comercializarse tanto como complemento de una grúa como en modalidad de servicio independiente sin maquinaria, por lo que las compuertas de Patio, Report Diario e ITS deben evaluar `equiposAsignadosLista.length === 0` como un caso de negocio válido de primera clase.
