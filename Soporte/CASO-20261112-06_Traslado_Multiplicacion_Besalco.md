# CASO-20261112-06: Multiplicación Indebida y Partición de Traslados en EDP e ITS (Negocio 005 Besalco)

## 1. Ficha del Incidente
- **ID del Caso:** `CASO-20261112-06`
- **Fecha / Hora:** `2026-11-12 16:30 CLT` (Resuelto y certificado a las `18:40 CLT`)
- **Operador / Usuario Afectado:** Sergio Gajardo (`id_user = 55`) / Control de Gestión (Yiara Mendoza, `id_user = 65`) / Comercial (Jorge Ponce)
- **Negocio / OT:** Negocio `005` — Besalco (`GSP-2611-00005`, `id_proyecto = 34`)
- **Equipo Involucrado:** Grúa Telescópica y Servicios de Apoyo (Cama Baja / Traslados)
- **Ambiente:** Producción (`PROD` — `sch_leangsp_prod`) y Desarrollo (`DEV` — `sch_leangsp`)
- **Severidad:** **Alta** (distorsión de montos de flete en cotización, partición anómala en ITS y sobrecobro en Carátula EDP)

---

## 2. Síntoma Reportado por Terreno / Administración
En el negocio 005 de Besalco, se cotizó un traslado de equipo por una tarifa fija de \$160.000. Sin embargo, en el estructurador comercial se ingresó una cantidad de 6, lo que multiplicó indebidamente el valor del traslado en la Carátula EDP a \$960.000 (6 traslados × \$160.000). Además, al inspeccionar el Informe de Término de Servicio (ITS 10), el flete se presentaba desglosado y particionado de forma errónea, alterando el total facturable y el margen del servicio.

---

## 3. Diagnóstico Técnico & Evidencia Empírica
1. **Inspección de Base de Datos (`sch_leangsp_prod.tpry_proyecto`, `id_proyecto = 34`):**
   - En `json_field.crm_v1.lineas_servicio`, la línea de traslado permitía ingresar y persistir un atributo `cantidad = 6`, multiplicando el subtotal por 6.
2. **Inspección de ITS 10 (`tits_informe_termino` y `tits_jornada_detalle`):**
   - La cabecera del ITS 10 registraba `valor_flete_pactado = 960000` y `total_ingresos_fletes = 960000`.
   - En el detalle de jornadas, el traslado se intentaba particionar artificialmente a la mitad (ida por separado de la vuelta), generando filas inconsistentes y violaciones de restricciones check en la base de datos (`tits_jornada_detalle_tipo_servicio_check`).
3. **Comportamiento en UI Comercial (`EstructuradorArbolServicios.vue` y `GestorOportunidades.vue`):**
   - La interfaz permitía al usuario comercial editar libremente el campo `cantidad` en ramas de la categoría `TRASLADOS`, cuando el traslado es una prestación de cobro único y precio alzado ("o se cobra o no se cobra").

---

## 4. Causa Raíz de Arquitectura (Software / State Machine / Datos)
1. **Permisividad en el Estructurador Comercial:**
   El componente del árbol de cotización no restringía el campo de cantidad para líneas de tipo `TRASLADOS`, permitiendo valores mayores a 1.
2. **Ausencia de Invariante de Cobro Único:**
   No existía un invariante a nivel de backend que forzara `cantidad = 1` y `subtotal = valorUnitario` en toda línea clasificada como `TRASLADOS`.
3. **Lógica de Partición Frágil en el ITS:**
   El controlador del ITS dividía arbitrariamente el valor del flete en dos componentes cuando la unidad de cobro era `TRASLADO IDA/VUELTA`, en vez de tratar el flete pactado como una suma única contractualmente exigible.

---

## 5. Plan de Mitigación y Resolución
1. **Normalización Canónica (`lineaCobroUnico.js`):**
   Definición estricta de que todo servicio de tipo `TRASLADOS` es clasificado como línea de cobro único, fijando `cantidad = 1` y `subtotal = valorUnitario`.
2. **Bloqueo Visual en Interfaz Comercial:**
   - En `EstructuradorArbolServicios.vue` y `GestorOportunidades.vue`, se ocultó el input de cantidad para traslados, mostrando la etiqueta "Cobro Único" y fijando por omisión `cantidad = 1`.
3. **Normalización del ITS y Carátula EDP:**
   - En `itsController.js`, el flete pactado se reconoce como una suma única (`160.000`), sin particiones espurias.
   - En `ModalCaratulaEDP.vue`, `estadoPagoController.js` y `reportDiarioController.js`, se asegura que el traslado compute únicamente por su valor unitario neto (\$160.000).
4. **Saneamiento en Base de Datos de Producción y Desarrollo:**
   - Actualización atómica en `sch_leangsp_prod.tits_informe_termino` (ITS 10): `valor_flete_pactado = 160000`, `total_ingresos_fletes = 160000`, `total_ingresos_facturables = 1600000`.
   - Regularización en `tits_jornada_detalle` (fila 89) a `tipo_servicio = 'Flete Ida y Retorno'`, `subtotal = 160000`.
   - Normalización de las líneas de traslado en `tpry_proyecto` en DEV (`id_proyecto = 34`) a `cantidad = 1` y `subtotal = 160000`.

---

## 6. Verificación & Certificación
- Cuadratura exacta de ITS 10: Total Ingresos Horas \$1.440.000 + Total Ingresos Fletes \$160.000 = Total Facturable \$1.600.000.
- Carátula EDP verificada mostrando 1 Traslado por \$160.000 neto.
- Estructurador comercial verificado sin posibilidad de alterar la cantidad en traslados.

---

## 7. Referencias & Trazabilidad
- **Especificación Técnica:** [SPEC-128 (`.agents/specs/128_lineas_cobro_unico_valor_fijo_y_traslados_spec.md`)](file:///d:/SGajardo/Google%20Drive/Antigravity/Grúas%20San%20Pablo/Propuesta%20Gestión%20Operación%20Grúas/.agents/specs/128_lineas_cobro_unico_valor_fijo_y_traslados_spec.md)
- **Requerimiento Asociado:** `REQ-1166`
- **Versión de Liberación:** `v1.0.223`
- **Tabla de Auditoría:** `sch_leangsp_prod._backup_spec128_proyectos`
