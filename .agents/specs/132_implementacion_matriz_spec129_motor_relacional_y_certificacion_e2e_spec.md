# SPEC-132: Plan Maestro de Implementación Estructural de la Matriz de Negocio (`SPEC-129`), Conexión E2E del Motor Relacional (`SPEC-130`) y Certificación Automatizada Cero-Trampa (10 Arquetipos de Producción)

- **Código de Especificación:** `SPEC-132`
- **Fecha:** 2026-11-14
- **Estado:** APROBADO PARA EJECUCIÓN (Ventana Go-Live 48h — Lunes 16-Nov-2026)
- **Especificaciones Base:** `SPEC-125`, `SPEC-127`, `SPEC-128`, `SPEC-129`, `SPEC-130`, `SPEC-131`
- **Decisiones Ejecutivas de Alcance (14-Nov-2026):**
  1. **Estrategia de Ejecución:** Implementación modular en **4 Oleadas** guiada desde el minuto 1 por una arquitectura de validación automatizada en **3 Capas** (Capa 1: Oráculo Matemático Puro; Capa 2: Integración API + SQL `READ ONLY` + Auditoría Binaria PDF; Capa 3: Certificación Visual Playwright Web + PWA sobre los 10 Arquetipos Reales).
  2. **Acuerdo #9 (`Cortes Parciales Multi-EDP 1:N en Servicios Mensuales`):** **DIFERIDO POST-GOLIVE (Fase 2)** por decisión ejecutiva para proteger al 100% la estabilidad transaccional del cierre estándar de EDPs en la salida a producción del lunes. Se mantiene plenamente activo el **Acuerdo #6** (edición directa de horas, cantidades, glosas, totales e ítems `'Otros'` en `ModalCaratulaEDP.vue`).
  3. **Jerarquía `Tracto -> Ramplas Hijas` (`1.11.M` / `3.1.M`):** Aprobada sobre la estructura jerárquica padre-hijo existente (`tpry_linea_servicio` / `tpry_rel_equipo` con ventanas de fechas y exención de bitácora de viaje para equipos sin motor), sin introducir nuevas tablas de flota.

---

## 1. Diagnóstico Forense de Brechas Resueltas por esta Especificación

1. **`BUG-01` — Desconexión Total del Motor y Tabla Relacional:** `motorValorizacionService.js` y `tpry_linea_servicio` existen en el repositorio pero no tienen invocaciones en controladores (`proyectoModel.js`, `reportDiarioController.js`, `itsController.js`, `estadoPagoController.js`), y `GestorOportunidades.vue` convierte IDs temporales `'lin_root_...'` con `parseInt()` produciendo `NaN -> NULL`.
2. **`BUG-02` — Colapso de Modalidades Periódicas en `lineaCobroUnico.js` y `ModalCaratulaEDP.vue`:** La expresión `unidad.includes('FIJO')` captura `'Valor Fijo Diario'` y `'Valor Fijo Mensual'`, forzando `cantidad = 1` y destruyendo `cantidad_dias` y `cantidad_meses`; adicionalmente, la rama mensual de `lineaCobroUnico.js` multiplicaba erróneamente cánones mensuales fijos por `180` horas.
3. **`BUG-03` — Aplanamiento Escalar en Proyectos Compuestos y Multi-Equipo (`CASO-20261113-01` Pocuro):** La reducción del proyecto a banderas escalares globales (`esValorFijoComercial`, `valorHoraPactado`, `valorFletePactado`) provoca que un ítem hijo a Valor Fijo anule las horas facturables de la máquina principal o que múltiples equipos dupliquen horas globales en EDP.
4. **`BUG-04` — Doble Cómputo / Omisión de Flete en `itsController.js`:** Las líneas `'TRASLADO IDA/VUELTA'` nacen en `$0` en el borrador y se suman por duplicado al recargar el ITS.
5. **`BUG-05` — Registros Zombi en Reasignaciones y Descuadre PDF OT (`REQ-1160` Surlat / `REQ-1172` OT `00049`):** `asignacionRecursosController.js` realiza `UPSERT` aditivo sin desactivar recursos reemplazados; `generarOTVersion` en `proyectoModel.js` solo sincroniza personal cuando `COUNT(*) === 0`, contiene un `ReferenceError: jf` latente y mezcla Riggers/APRs en la tabla de conductores.
6. **`BUG-06` — Fallbacks Ficticios en Contratos Rental (`REQ-1171` / `2.1.M` / `2.3.M`):** `obtenerHtmlContratoArriendo` conserva series hardcodeadas (`XUG0147ACSRL0132`, `XCMG`), permite emitir contrato antes de asignar serie real y rotula horas máximas en lugar de `"Horas libres de uso"`.
7. **`BUG-07` — Brechas de Reglas RRHH y Terreno (`SPEC-129`):**
   - `tarifasOperadorService.js` en régimen `URBANO` contabiliza desde `hora_salida` de base (violando `1.7.M`: `0h` traslado en urbano), fuerza `minPactado = 8` cuando `horas_minimas = 0`, y asigna tarifa fallback de `$5.000/h` a tractocamiones/camas bajas/camionetas (violando `1.8.M`, `1.11.M`, `3.1.M` y Acuerdo #8: `$0` bono variable para choferes).
   - `reportDiarioController.js` exige `id_equipo` obligatorio bloqueando servicios `PROFESIONAL` sin máquina (`4.1`/`4.2` Plaenge), permite report diario al Rigger dentro de `IZAJE` (violando `1.9.M`), y `viajeController.js` referencia la tabla inexistente `tits_cabecera`.

---

## 2. Arquitectura de Implementación en 4 Oleadas

### 2.1. Oleada 1 — Núcleo Matemático, Reglas RRHH y Conexión Relacional (`tpry_linea_servicio`)
1. **`ejecucion/backend_remoto/src/utils/lineaCobroUnico.js`:**
   - Restringir `isLineaCobroUnico(linea)` exclusivamente al **Grupo A** (`Valor Fijo` / `Suma Alzada` plana y `Traslado Ida`, `Traslado Vuelta`, `Traslado Ida/Vuelta`), excluyendo explícitamente `Valor Fijo Diario`, `Valor Fijo Semanal` y `Valor Fijo Mensual`.
   - Corregir `calcularSubtotalLinea(linea, ctx)` para:
     - `Valor Fijo Diario`: `dias * valorUnitario` (jamás multiplicado por `cantidad_horas`).
     - `Valor Fijo Mensual`: `meses * valorUnitario` (jamás multiplicado por `180` horas).
     - `Horas Mes Minimas`: `meses * bolsaHoras * valorUnitario` (soportando bolsa flexible `1.5.M`).
     - `Horas Diarias Minimas`: `dias * pisoHoras * valorUnitario` (soportando piso flexible `1.1.M`).
2. **`ejecucion/backend_remoto/src/services/motorValorizacionService.js`:**
   - Incorporar la 5ª línea de negocio `'INTERNAS'` (`OT-INTERNA`, Caso `5.0`, ingreso y EDP `$0`).
   - Exportar `validarReglaMatrizSpec129(nodo)` rechazando deterministamente las **9 combinaciones descartadas** (`1.4`, `1.6`, `2.2`, `2.4`, `3.2`, `3.5`, `4.3`, `4.5`, `4.7`) y validando las combinaciones activas (`1.1.M` piso flexible, `1.5.M` bolsa flexible, `1.9.M` Rigger incluido `$0` o facturable, `1.10.M` `ACCESORIO` en `$0`/Fijo/Diario/Horas, `2.1.M` Rental Diario gobernado por Acta 360° sin reports diarios, `4.8.M` `'Otros'`).
   - En `conciliarDevengadoProyectoE2E`:
     - Resolver `RENTAL` + `Valor Fijo Diario` (`2.1.M`) mediante `actasParaLinea` (`dias_arriendo_reales` o `fecha_retiro - fecha_entrega + 1`), nunca exigiendo `tedp_reporte_avance`.
     - Resolver ramas `ACCESORIO` (`1.10.M`) heredando jornadas/horas ejecutadas del nodo padre cuando el accesorio no genera report propio, sin contaminar la modalidad horaria de la máquina raíz.
     - Soportar consolidación `RENTAL` (`2.5.M` + `2.6.M` + Acuerdo #5) en **1 línea única editable `"Flete / Traslado"`** para EDP (ignorando OCs subcontratadas de ITS que son solo costo interno) e inyección de liquidación de Acta de Retiro (`2.7.M`: litros diésel faltantes × `$/L` editable + daños con evidencia fotográfica obligatoria).
   - En `liquidarEstadoPago2Hitos`: soportar overrides manuales de Control de Gestión (Acuerdo #6: horas editadas, subtotal/total editado, glosa editada e ítems manuales `'Otros'` `4.8.M`) y candado `$0` para `'INTERNAS'` (`5.0`).
3. **`ejecucion/backend_remoto/src/services/tarifasOperadorService.js`:**
   - `1.7.M` **Urbano:** `inicioUrbano = hora_inicio || hora_llegada` (nunca `hora_salida` salvo ausencia total de marcas de obra) y `terminoUrbano = hora_termino` -> `0h` traslado pagado al operador.
   - `1.7.M` **Rural:** pago desde `hora_salida` hasta `hora_retorno` descontando colación, respetando `horas_minimas === 0` en servicios a `Valor Fijo` (`minPactado = Number.isFinite(Number(horas_minimas)) ? Number(horas_minimas) : 8`).
   - `1.8.M`, `1.11.M`, `3.1.M`, Acuerdo #8 **Choferes de Transporte/Apoyo:** `resolverTarifaOperador` retorna `0` para `TRACTO`, `CAMA BAJA`, `RAMPLA`, `CAMION PLATAFORMA` (de flete), `CAMIONETA` y `FURGON`. Se exporta `calcularLiquidacionChoferTraslado` que retorna `bono_hora = 0` y `monto_viatico = 0` por defecto, habilitando cálculo solo cuando `excepcion_autorizada === true`.
4. **Persistencia y Lectura Relacional `tpry_linea_servicio` (`proyectoModel.js`, `reportDiarioController.js`, `itsController.js`, `estadoPagoController.js`, `GestorOportunidades.vue`):**
   - Persistir y sincronizar `tpry_linea_servicio` al guardar/actualizar cotización y asignación operativa, mapeando IDs temporales de UI (`client_uid`) al `id_linea_servicio` numérico real en `tpry_rel_equipo` y `tpry_rel_persona`.
   - Eliminar el aplanamiento escalar global (`esValorFijoComercial`) y el doble flete en `itsController.js`, delegando la conciliación por línea a `motorValorizacionService`.

### 2.2. Oleada 2 — Estructurador Comercial, Asignación Atómica, OT y Contratos Rental
1. **`EstructuradorArbolServicios.vue` y `ModalCaratulaEDP.vue`:**
   - Ocultar/bloquear las **9 modalidades descartadas** en nuevos negocios.
   - Habilitar rama `ACCESORIO` (`1.10.M`: `$0`, `Valor Fijo`, `Valor Fijo Diario`, `Hora Efectiva`), Rigger `"Incluido en Tarifa ($0)"` vs. facturable (`1.9.M`), Horquilla/Manipulador en `RENTAL` sin operador (`2.1.M`), traslado por defecto `$0` (`2.5.M`/`2.6.M`/Acuerdo #5) y pestaña/sección `'Otros'` (`4.8.M`/Acuerdo #6).
   - Alinear `ModalCaratulaEDP.vue` con `lineaCobroUnico.js` para no aplastar `Valor Fijo Diario` ni `Valor Fijo Mensual`.
2. **`asignacionRecursosController.js` y `proyectoModel.js` (`generarOTVersion` — `REQ-1160` + `REQ-1172` + Acuerdo #4):**
   - Reemplazo transaccional limpio: desactivar (`activo = FALSE`, `estado_real = 'REEMPLAZADO'`) equipos y personas removidos de la asignación actual y purgar desplazamientos pendientes huérfanos, preservando turnos por ventana de fechas (`fecha_plan_ini` / `fecha_plan_fin`).
   - En `generarOTVersion`: lectura relacional directa desde `tpry_rel_equipo` y `tpry_rel_persona` activos, eliminación de `ReferenceError: jf`, separación exacta entre Conductores (Tabla 3) y Tripulación Técnica/Riggers/APRs (Tabla 4), soporte `Tracto -> Rampla hija` (`1.11.M`/`3.1.M`) e impresión obligatoria de ficha técnica de maniobra (`radio`, `altura`, `peso`, `volumen`, `tipo_carga` — Acuerdo #4).
3. **`proyectoModel.js` (`obtenerHtmlContratoArriendo` — `2.1.M` + `2.3.M` + `REQ-1171`):**
   - Bloquear generación de contrato `CTR-*` mientras no exista equipo físico con serie/patente asignado en `tpry_rel_equipo`.
   - Consultar `tequ_equipo` directamente (erradicando strings hardcodeados `XUG0147ACSRL0132` / `XCMG`) e imprimir `"Horas libres de uso"` en modalidad mensual (`2.3.M`).

### 2.3. Oleada 3 — Terreno PWA, Exenciones Operativas y Visitas Técnicas
1. **`reportDiarioController.js` y `ReportDiarioIzaje.vue`:**
   - Permitir inicio y cierre de Report Diario con `id_equipo = NULL` en línea `'PROFESIONAL'` (`4.1`, `4.2`, `4.4` — Caso Plaenge).
   - Excluir al rol `RIGGER` de generar Report Diario independiente dentro de servicios `'IZAJE'` (`1.9.M`).
   - Bloquear apertura de un 2° servicio simultáneo en curso para el mismo operador en PWA (Acuerdo #3).
   - Permitir cierre de Report Diario sin firma física del cliente exigiendo `motivo_sin_firma_cliente` obligatorio y auditable (Acuerdo #7 / `REQ-1146`).
2. **`viajeController.js`, `ViajeConductor.vue` y `GestorOportunidades.vue`:**
   - Corregir consulta SQL de `tits_cabecera` -> `tits_informe_termino` y suprimir generación de bonos horarios para choferes (`Acuerdo #8`).
   - Eximir a `CAMIONETA` en régimen urbano (`1.11.M`/`4.7.M`) y a semirremolques/ramplas sin motor (`1.11.M`/`3.1.M`) de bitácora de viaje obligatoria para cierre operativo.
   - Incorporar registro de carguíos de combustible (`litros`, `hora` cronológica, `valor`) en hitos de desplazamiento (Acuerdo #1).
3. **`ModalProgramarVisita.vue`, `visitaTerrenoController.js` e `itsController.js`:**
   - Capturar `costo_visita` y `id_user_autorizador` (obligatorio si `costo_visita == 0`, ej. Omar Ghisellini) y arrastrarlo a costos/resumen del ITS (Acuerdo #2).

### 2.4. Oleada 4 — Consolidación Rental -> EDP, Control de Gestión y Sincronía Kanban
1. **`actaPlataformaController.js` y `estadoPagoController.js`:**
   - No transicionar proyectos `RENTAL` a liquidación ITS al firmar la entrega en `T0`; mantener en ejecución activa hasta firma de `RETIRO` en `T1`.
   - Consolidar traslados `ENTREGA` + `RETIRO` en **1 sola línea editable `"Flete / Traslado"`** en EDP (`2.5.M`, `2.6.M`, Acuerdo #5) e inyectar liquidación de diésel (`$/L` editable) y daños con respaldo fotográfico desde Acta 360° (`2.7.M`).
2. **`Torre.vue` y `GestorOportunidades.vue`:**
   - Alinear condición de Columna 6 (`esFinalizadoOperacional`) y apertura de sub-tab `liquidacion` con `id_proyecto_estado IN (6, 7, 8)` para impedir desincronización visual.
3. **Auditoría SQL Histórica ("Cero Parches" — Regla 15):**
   - Ejecutar auditoría de lectura y saneamiento respaldado en `sch_leangsp` sobre registros zombi históricos o subtotales distorsionados previos a la certificación.

---

## 3. Arquitectura de Certificación Automatizada en 3 Capas y 8 Candados Cero-Trampa

### 3.1. Las 3 Capas de Verificación
- **Capa 1 (`ejecucion/qa/oraculo_capa1_matriz_spec129.test.js`):** Suite determinista pura (`node:test`) sin red ni mocks que valida todas las funciones matemáticas y de RRHH contra las 24 reglas activas, las 9 reglas descartadas y los 15 casos reales de producción con tolerancia `$0 CLP`.
- **Capa 2 (`ejecucion/qa/certificador_capa2_api_pdf_readonly.js`):** Runner HTTP contra backend remoto `DEV` con cliente PostgreSQL bloqueado en `SET default_transaction_read_only = on` y extracción binaria de texto (`pdf-parse` / `pdftotext`) sobre los 6 documentos PDF oficiales.
- **Capa 3 (`ejecucion/qa/certificador_capa3_e2e_browser_pwa.spec.js`):** Suite Playwright E2E sobre Web (`CRM -> Torre -> Asignación -> ITS -> EDP -> Contabilidad`) y PWA (`ViajeConductor -> ReportDiarioIzaje`) ejecutada por subagente independiente `qa-business-specialist`, dejando los **10 Arquetipos Testigo (`ARQ-01`..`ARQ-10`)** vivos en `DEV` (Cero Teardown) con triple evidencia en `QA/REQ-1173_Certificacion_Matriz_SPEC129_DEV/`.

### 3.2. Los 8 Candados Deterministas (`G1`–`G8`)
1. **`G1` (`SQL Read-Only`):** Prohibición física de `INSERT/UPDATE/DELETE` desde los tests mediante `default_transaction_read_only = on`.
2. **`G2` (`Kanban Click Parity`):** Clic real en tarjeta de `Torre.vue` verificando `id_proyecto_estado` y apertura directa de `operacionesSubTab === 'liquidacion'`.
3. **`G3` (`Binary PDF Text Audit`):** Inspección del texto extraído de Cotización, Contrato `CTR-*`, OT, Report Diario, ITS y Carátula EDP.
4. **`G4` (`Real FES Signatures`):** Firma real en enlace público de contrato, Hito 1 Control de Gestión (Yiara) e Hito 2 Contabilidad (Maritza + DTE Laudus).
5. **`G5` (`Zero-Peso Math Exactness`):** Tolerancia `$0 CLP` entre Cotización + Ajustes, Ingreso ITS, Neto EDP y PDF EDP.
6. **`G6` (`RRHH Exactness`):** Verificación exacta de bono operador urbano (`0h` traslado), rural (`con traslado`), Rigger (`$0/h` + viático) y chofer (`$0` bono variable).
7. **`G7` (`Zero Console/Network Errors`):** `0` respuestas `HTTP >= 500` y `0` excepciones JS (`pageerror`).
8. **`G8` (`Zero Teardown`):** Persistencia íntegra de los 10 proyectos testigo en `sch_leangsp` para inspección humana.
