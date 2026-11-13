# 📑 ESPECIFICACIÓN TÉCNICA Y FUNCIONAL CANÓNICA: REPORTES OPERATIVO-CONTABLES EN PERSPECTIVA CONTABILIDAD (HORAS OPERADORES CON REPORT VALIDADO Y FILTRO DESDE-HASTA, COMBUSTIBLE Y SALIDAS DE BODEGA)

- **ID Especificación:** `SPEC-105`
- **Requerimiento Backlog:** `REQ-1080`, `REQ-1081`, `REQ-1094`
- **Versión Objetivo:** Portal Web & Backend GSP `v1.0.184`
- **Ambientes de Despliegue:** `DEV` (`sch_leangsp`) y `PROD` (`sch_leangsp_prod`)
- **Fecha:** 2026-11-03
- **Estado:** APROBADO E IMPLEMENTADO EN PRODUCCIÓN (`v1.0.184`)

---

## 1. Propósito y Contexto de Negocio

Integrar en el módulo **`Perspectiva Contabilidad`** (`PerspectivaContabilidad.vue` y `estadoPagoController.js`) los **3 reportes operativo-contables de costos e insumos** que utiliza Contabilidad y RRHH (excluyendo el libro histórico de Ventas Facturadas), homologando sus columnas y hojas de exportación Excel (`.xlsx`) a las planillas reales de trabajo de Contabilidad (`Horas Operadores.xlsx`, `Combustible Enero 2026.xlsx` y `Salidas bodega enero - marzo 2026.xlsx`), e incorporando alertas visibles sobre las brechas actuales de datos (`Litros / Guía` en Combustible y parametrización de `Centros de Costos / Cuentas Contables` en Salidas de Bodega).

Adicionalmente (`REQ-1081` — Reunión RRHH Tesalia Malatesta & Jorge Ponce, 28-Oct-2026):
1. **Cierre Mensual de Remuneraciones Independiente del Estado del ITS y Filtro `Desde - Hasta`:**
   - El cierre mensual de remuneraciones se realiza el último día calendario de cada mes (o en cualquier corte intermedio por salida de trabajador o fiscalización de la Dirección del Trabajo), independientemente de si el ITS del servicio continúa abierto.
   - Se incorpora en `PerspectivaContabilidad.vue` y `GET /api/operaciones/edp/perspectiva-contabilidad` el filtro explícito por rango de fechas **`Desde` (`fecha_desde`) — `Hasta` (`fecha_hasta`)**, filtrando las jornadas de `horas_personal` directamente por la fecha del Report Diario (`tedp_reporte_avance.fecha_reporte`).
2. **Columna `Report Validado` (Reemplazo de `ITS Validado` en Submenú 2):**
   - Dado que Yiara verifica los costos de personal y viáticos directamente al validar cada Report Diario con su PIN FES, la última columna a la derecha de cada trabajador en el Submenú **`2. Horas Operadores / Riggers`** (tanto en el resumen consolidado por trabajador como en el desglose diario y en el archivo Excel `.xlsx`) pasa a ser **`Report Validado`** (`SÍ` / `NO`), indicando a Tesalia si existen reports pendientes de validación por parte de Control de Gestión antes de liquidar sueldos.

---

## 2. Detalle de los 3 Reportes Contables

### 2.1. Reporte 1 (Submenú 2): Liquidación de Horas de Operadores y Riggers (`Horas Operadores.xlsx` + `Report Validado` + Filtro `Desde - Hasta`)
- **Fuente Primaria:** `tedp_reporte_avance` (`ajustes_analista.liquidacion_personal_dia` verificado en el Report Diario, sin bloquearse a la espera del ITS), cruzado con `tpry_proyecto`, `tits_informe_termino`, `tequ_equipo` y `tpar_tarifa_operador`.
- **Filtro de Fechas (`Desde - Hasta`):** Permite consultar cualquier rango `YYYY-MM-DD` (con botón rápido `Mes Actual`) filtrando directamente por fecha del Report Diario.
- **Regla de Valor Hora Operador:** Se resuelve según la línea comercial comprometida en la cotización/OT (`tpar_tarifa_operador`). Para el rol `RIGGER`, el valor hora es `$0` (sueldo fijo mensual, exponiendo sus horas y viático para auditoría de RRHH/Contabilidad).
- **Columnas de Detalle Diario (Pantalla y Hoja Excel `Detalle_Jornadas`):**
  1. `Orden` (`codi_proyecto`)
  2. `Fecha` (`YYYY-MM-DD`)
  3. `Trabajador` y `Rol` (`OPERADOR` / `RIGGER`)
  4. `Vehículo` (`tipo_equipo`)
  5. `Patente` (`equipo_patente`)
  6. `Valor Hrs Operador ($)`
  7. `Nombre Cliente` (`cliente_nombre`)
  8. `Report` (`folio_correlativo` / `id_reporte_avance`)
  9. `Valor Hora Servicio ($)`
  10. `Horas` (Horas a pagar verificadas en el Report Diario)
  11. `Horas Maq` (Horas operadas efectivas)
  12. `Total Servicio ($)` (`Horas * Valor Hora Servicio`)
  13. `Total Operador ($)` (`Horas * Valor Hrs Operador`)
  14. `Viático ($)` (Viático de alimentación verificado en el Report Diario)
  15. `Factura Nro` (`folio_dte`)
  16. **`Report Validado`** (`SÍ` si el Report Diario está validado por el Analista con PIN FES (`validado_analista === true` o `validado_rrhh === true`), `NO` en caso contrario)

### 2.2. Reporte 2 (Submenú 4): Control de Combustible y Rendimientos (`Combustible.xlsx`)
- **Fuente Primaria:** Cruce de ítems `COMBUSTIBLE` en `tits_costo_item`, lecturas de medidores en `tedp_reporte_avance` / `tequ_log_desplazamiento` y maestro `tequ_equipo`.
- **Transparencia de Brecha de Datos:** Banner informativo en pantalla advirtiendo que el sistema dispone de `Patente`, `Tipo Vehículo`, `Modelo`, `Marca`, `Operador`, `Horómetro Chasis (Hrs)`, `Odómetro (Km)`, `Horómetro Grúa (Hrs G)` y `Total $` (desde ITS), pero que la captura de **`N° Guía`**, **`Litros`** y **`Precio $/L`** se encuentra pendiente de incorporación en el formulario de carga de combustible para habilitar el cálculo físico de rendimientos (`Rendi Km`, `Rendi Hrs`, `Rendi Hrs G`).
- **Estructura Dual (Pantalla y Excel de 2 Hojas):**
  - `Hoja2`: Resumen agrupado por `Tipo de Vehículo` y `Patente` con `Suma de Litros` y `Suma de Total $`.
  - `sistema`: Las 28 columnas canónicas (`Fecha`, `Guia`, `Llenado Con`, `Litros`, `Precio`, `Hrs. Inicial`, `Hrs. Final`, `Total Horas.`, `Km. Inicial`, `Km. Final`, `Total Km`, `Hrs G Inicial`, `Hrs G Final`, `Total Hrs G`, `Total $`, `Rendi Km.`, `Rendi Hrs.`, `Rendi Hrs G.`, `Patente`, `Tipo Vehiculo`, `Modelo`, `Marca`, `Año`, `Operador`, `Nro Interno`, `Sucursal`, `Fecha y hora Ingreso Sistema`, `Rut Empresa`).

### 2.3. Reporte 3 (Submenú 5): Salidas de Bodega y Centros de Costo (`Salidas bodega.xlsx`)
- **Fuente Primaria:** Kardex WMS (`tinv_movimiento` con `SALIDA_OT`, `CONSUMO`) e imputaciones de repuestos a órdenes de trabajo de taller (`tmnt_ot_repuesto`), cruzado con `tinv_producto`, `tmnt_ot`, `tequ_equipo` y `tsec_users`.
- **Transparencia sobre Centros de Costo y Plan de Cuentas:** Banner informativo explícito señalando que aún falta el mantenedor formal de **Centros de Costos y Cuentas Contables**, por lo que la columna `CENTRO DE COSTO` utiliza preliminarmente la `Patente / OTM` y la columna `CUENTA CONTABLE` aplica una pre-clasificación sugerida según tipo de activo/familia (`Mant. Maquinarias`, `Mant. Vehiculos`, `Implementos Seguridad`, `Gastos de Oficina`).
- **Estructura Dual (Pantalla y Excel de 2 Hojas):**
  - `Hoja2`: Matriz mensual `Cuenta Contable × Mes = Suma de TOTAL ($)`.
  - `Sistema`: Las 13 columnas canónicas (`CODIGO`, `PRODUCTO`, `FECHA`, `MES`, `DETALLE`, `NRO DCTO`, `CANTIDAD`, `PRECIO UNITARIO`, `TOTAL`, `CENTRO DE COSTO`, `EMPRESA`, `CUENTA CONTABLE`, `RETIRA`).

---

## 3. Submenú `6. RH`: Generador de Anexo de Contrato de Trabajo por Cambio de Obra y Registro en Biblioteca de Personas (`REQ-1094`)

### 3.1. Objetivo y Alcance
Habilitar en `PerspectivaContabilidad.vue` el submenú **`6. RH`** para emitir e imprimir el documento legal **`ANEXO CONTRATO DE TRABAJO — CAMBIO DE OBRA`** (Artículos 11 y 12 del Código del Trabajo, homologado desde `Contabilidad/ANEXO CONTRATO.Pdf`) con el estándar gráfico corporativo de GSP en **1 página A4 (`Página 1 de 1`)**, soportando cualquiera de las **4 empresas hermanas del holding** como empleadora y persistiendo cada anexo generado tanto en el historial del segmento **`6. RH`** como en la **Biblioteca Documental de la Persona (`tsec_certificados_persona` + `tfmg_file`)**.

### 3.2. Empresas Empleadoras del Holding Soportadas
1. **Grúas San Pablo (`id_empresa = 9`):** `LUIS OMAR GHISELLINI JARA EIRL` — RUT `52.004.162-1` — Logo `logo-sanpablo.png` — Domicilio: `Lugar Botrolhue KM. 9,5 camino Labranza, ciudad de Temuco`.
2. **Bestmaq (`id_empresa = 7`):** `SOCIEDAD COMERCIALIZADORA BESTMAQ LIMITADA` — RUT `76.209.534-3` — Logo `logo-bestmaq.png` — Domicilio: `Lugar Botrolhue KM. 9,5 camino Labranza, ciudad de Temuco`.
3. **Logística del Sur (`id_empresa = 8`):** `SOCIEDAD DE TRANSPORTES LOGISTICA DEL SUR LIMITADA` — RUT `76.218.576-8` — Logo `logo-logistica.png` — Domicilio: `Lugar Botrolhue KM. 9,5 camino Labranza, ciudad de Temuco`.
4. **Royal Rental (`id_empresa = 11`):** `ARRIENDO ROYAL RENTAL LIMITADA` — RUT `78.254.535-3` — Logo `logo-royal.png` — Domicilio: `Lugar Botrolhue KM. 9,5 camino Labranza, ciudad de Temuco`.

### 3.3. Estructura del Formulario, PDF Oficial y Persistencia Dual
1. **Campos Editables con Autocompletado desde Maestro de Personal (`tsec_users`) y Proyectos (`tpry_proyecto`):**
   - `id_empresa_empleadora`, `empresa_razon_social`, `empresa_rut`, `empresa_domicilio`, `ciudad_emision` (`Temuco`), `fecha_emision` (`DD-MM-YYYY`).
   - `id_user` (trabajador vinculado), `trabajador_nombre`, `trabajador_rut`, `trabajador_cargo`.
   - `id_proyecto` (opcional), `proyecto_nombre` (Obra), `cliente_razon_social` (Empresa mandante), `cliente_rut`, `ubicacion_obra`, `fecha_hasta` (`DD-MM-YYYY`).
2. **Compilación PDF (`POST /api/estado-pago/anexos-contrato`):**
   - Compila el PDF A4 de 1 página vía `xvfb-run -a wkhtmltopdf` con el logo en Base64 de la sociedad empleadora, las 4 cláusulas jurídicas íntegras (`PRIMERO`, `SEGUNDO`, `TERCERO`, `CUARTO`) y los pies de firma (`TRABAJADOR` y `EMPRESA`).
   - Registra el archivo en `tfmg_file` (`tipo_doc = 'ANEXO_CONTRATO_RH'`) y lo asocia al trabajador en `tsec_certificados_persona` bajo el tipo documental `'Anexo de Contrato de Trabajo (Cambio de Obra)'`, quedando inmediatamente visible tanto en la tabla histórica del submenú **`6. RH`** como en la **Biblioteca Documental (`Documentos.vue` $\rightarrow$ `3. Dimensión Personas & Tripulación`)**.
