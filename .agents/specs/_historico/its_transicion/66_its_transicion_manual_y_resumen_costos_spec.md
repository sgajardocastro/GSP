# 📋 SPEC-066: ITS Transición Manual, Persistencia Relacional y Resumen Financiero de Costos

> **Código:** `SPEC-066`  
> **Módulo:** Informe de Término de Servicio (ITS) — Modalidad Transición Manual V1  
> **Sistema:** Grúas San Pablo (GSP) / LeanGlobal Platform  
> **Fecha de Emisión:** 08 de Octubre de 2026  
> **Estado:** **APROBADA PARA IMPLEMENTACIÓN INMEDIATA**  
> **Responsables de Negocio:** Yiara Mendoza (Control de Flota), Jorge Ponce (Gerencia General), Omar Ghisellini (Dirección General), Maritza Seguel (Contabilidad y Finanzas).  
> **Responsable de Arquitectura:** Sergio Gajardo (LeanGlobal)  
> **Documentos de Referencia:**  
> - [Prompt y Especificación Original de Jorge](file:///d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/Gestión/ITS Transición/Prompt_y_Especificacion_Informe_Termino_Servicio.docx)  
> - [Minuta de Reunión 08-Oct-2026](file:///d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/antecedentes_reuniones/reuniones/20261008-Reunión-ITS-Transición-Manual-Geralsoft.md)  
> - [PDF Muestra 1: ITS CHINA FIRST #3259](file:///d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/Gestión/ITS Transición/ITS CHINA FIRST_COT_3259 21-24.09.pdf)  
> - [PDF Muestra 2: ITS CONSTRUCTORA NUALART #11439](file:///d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/Gestión/ITS Transición/ITS CONSTRUCTORA NUALART _COT_11439 01.10.pdf)  
> - [Planilla GeraldSoft 1: CONTROLES OCTUBRE 2026.XLS](file:///d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/Gestión/ITS Transición/CONTROLES OCTUBRE 2026.XLS)  
> - [Planilla GeraldSoft 2: OT OCTUBRE 2026.xlsx](file:///d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/Gestión/ITS Transición/OT OCTUBRE 2026.xlsx)  

---

## 🎯 1. Propósito y Diagnóstico Operativo

El **Informe de Término de Servicio (ITS)** es el instrumento administrativo, financiero y legal de Grúas San Pablo que consolida:
1. La validación de horas reales y horas reportadas de faena por equipo y tripulación.
2. La liquidación de los costos directos operacionales incurridos en terreno (alimentación, peajes, pensiones, personal externo, feriados, subcontratación de fletes, gastos extraordinarios y valor hora de operadores).
3. El balance de rentabilidad neta (Ingresos Facturables vs. Costos Operacionales = Margen de Contribución).

### Diagnóstico de Fallas del Sistema Actual (Geralsoft / App Web Preliminar):
* **Lentitud Crítica:** La operación remota con Geralsoft reduce el procesamiento a solo 2-3 informes en 4 horas.
* **Destrucción de Datos:** La aplicación web preliminar almacena el estado en más de 25 llaves fragmentadas de `localStorage` del navegador cliente. Al reabrir un informe, colisionan los prefijos de las órdenes (`safeId`, `cot_`, `ot_`) y **se borran automáticamente todas las observaciones y montos digitados**, forzando a repetir todo el documento.
* **Sin Registro en Base de Datos:** La herramienta anterior solo generaba un archivo PDF descargable; no existía persistencia en PostgreSQL, imposibilitando guardar avances de faenas multi-día ni colaborar en tiempo real.

---

## 🏗️ 2. Arquitectura de Tres Fases (Hoja de Ruta)

| Fase | Alcance Técnico | Plazo de Entrega | Estado |
| :--- | :--- | :--- | :--- |
| **Fase 1 (V1 Manual Hoy)** | Interfaz web de captura manual completa, blindaje de observaciones, cálculo reactivo de márgenes y exportación a PDF oficial idéntico al estándar San Pablo. | **Mismo día (08-Oct)** | **Objetivo Actual** |
| **Fase 2 (Persistencia BD)** | Integración con base de datos PostgreSQL (`tits_*`), guardado incremental multi-día (D1, D2, D3) y supervisión en vivo mediante folio compartido por WhatsApp. | **En 2 días (10-Oct)** | Programado |
| **Fase 3 (Automatización Total)** | Generación automática desde el core de LeanGlobal a partir de la PWA móvil y Torre de Control. | **En 2 semanas (22-Oct)** | Programado |

---

## 📑 3. Estructura y Especificación de Campos del Formulario

El formulario se compone de **4 secciones maestras** que mapean 1:1 con el documento PDF oficial:

```
+-----------------------------------------------------------------------------------+
| SECCIÓN 1: DATOS DEL SERVICIO INTEGRAL                                            |
| Folio: [ ITS-0209 ] | Cotización: [ #3259 ] | Fecha Emisión: [ 08/10/2026 ]       |
| Cliente: [ CHINA FIRST HIGHWAY... ] | RUT: [ 59.233.410-0 ]                       |
| Empresa Facturación: [ BESTMAQ ▼ ] | Ejecutivo: [ MARCELO REYES ▼ ]               |
| Fechas: [ 21/09/2026 ] al [ 24/09/2026 ] (4 Días) | Ciudad: [ SANTA BÁRBARA ]    |
| Tipo Servicio: [ HORA / FLETE ▼ ]                                                 |
| [ Valor Fijo: $ 0 ] | [ Valor Flete / Traslado: $ 4.400.000 ]                     |
| Grilla de Equipos Asignados:                                                      |
| Equipo/Subcat | Hrs Mínimas | Valor Hora ($) | OTs Asociadas | Personal y Cargo   |
+-----------------------------------------------------------------------------------+
| SECCIÓN 2: CONTROL DE FLOTA Y VALIDACIÓN DE HORAS                                 |
| Grilla Multi-Día:                                                                 |
| Fecha | N° OT | Tipo Serv | Patente | Salida | Llegada | Término | Retorno | Col  |
| Hrs Reales (calc) | Hrs Report (input) | N° Report | Subtotales x Patente        |
+-----------------------------------------------------------------------------------+
| SECCIÓN 3: PLANILLA DE COSTOS OPERACIONALES A PAGAR (8 CATEGORÍAS)                |
| 1. Alimentación      | Fecha | Personal | Concepto | Monto ($)                    |
| 2. Peajes y TAG      | Fecha | Patente | Personal | Ruta/Detalle | Monto / NO REEM|
| 3. Pensiones Faena   | Fecha | Personal | Desayuno | Almuerzo | Cena | Alojam...  |
| 4. Movilización      | Fecha | Personal | Detalle (Uber/Bus/Transfer) | Monto ($) |
| 5. Personal Externo  | Fecha | Personal | Tipo Pago | Detalle | Monto ($)         |
| 6. Feriados y Bonos  | Fecha | Personal | Detalle | Monto ($)                     |
| 7. Subcontrato Flete | Fecha | Descripción | N° OC | Monto ($)                    |
| 8. Gastos Extraord.  | Fecha | Detalle (Vulcanización/Repuestos) | Monto ($)      |
| Costo Valor Hora Op. | Patente | Categoría | Valor Hora Op ($) | Hrs Rep | Total  |
+-----------------------------------------------------------------------------------+
| SECCIÓN 4: RESULTADO DEL SERVICIO & OBSERVACIONES PROTEGIDAS                      |
| A. Ingresos Totales (Venta): Horas + Fijos + Fletes = Total Ingresos (100%)       |
| B. Costos Operacionales (Egresos): Suma de las 8 categorías ($ y % s/ venta)      |
| C. Resultado Neto: Utilidad Bruta ($) y Margen de Contribución (%) [🟢 Óptimo]    |
| D. Observación del Servicio: Textarea protegido contra borrados                   |
| E. Firmas: Elaborado (Secretaria/Analista), Aprobado (Jorge), Recibido (Conta)    |
+-----------------------------------------------------------------------------------+
```

---

## 🧩 4. Especificación Detallada por Sección

### 4.1. Sección 1: Datos del Servicio Integral
* **Folio ITS:** Formato `ITS-XXXX` incremental único.
* **Empresas de Facturación (Dropdown):**
  1. `ARRIENDOS SAN PABLO SpA` (RUT: 76.123.456-7)
  2. `BESTMAQ`
  3. `LOGÍSTICA DEL SUR`
  4. `ROYAL RENTAL` / `LUIS OMAR GHISELLINI JARA E.I.R.L.`
* **Cliente:** Nombre / Razón Social y RUT con formato chileno (`XX.XXX.XXX-X`).
* **Ejecutivo Comercial (Dropdown):** Marcelo Reyes, Natalia Ghisellini, Wilson Navarrete, Richard Jara, Sergio Gajardo.
* **Régimen / Tipo de Negocio:** Selector `SERVICIO URBANO` ($\le 30\text{ km}$) o `SERVICIO RURAL` ($> 30\text{ km}$).
* **Fechas del Servicio:** Fecha de inicio y fecha de término. El sistema calcula automáticamente la cantidad de días:
  $$\text{Días} = (\text{Fecha Término} - \text{Fecha Inicio}) + 1$$
* **Valores de Cabecera:**
  * `valor_fijo`: Monto numérico en CLP (Default: `$ 0`).
  * `valor_flete`: Monto numérico en CLP correspondiente al traslado consolidado pactado en la cotización.
* **Tabla de Equipos Asignados:**
  * Múltiples filas donde cada una define:
    * `patente`: Patente del equipo (ej. `TYGC45`).
    * `subcategoria`: Tonelaje / Tipo (ej. `GRUA 75 TON`, `GRUA 250 TON`, `CAMION PLUMA`, `TRACTOCAMION`).
    * `horas_minimas_dia`: Texto libre o estándar (ej. `11 HORAS DIARIAS`, `8 HORAS DIARIAS`, `SUBCONTRATO`, `N/A`).
    * `valor_hora`: Tarifa pactada en CLP/hr (ej. `$85.000 / HR`).
    * `ots_asociadas`: Listado de OTs vinculadas a esa máquina con su modalidad (ej. `OT 64717 (HORA)`, `OT 64718 (FLETE SOLO IDA)`, `OT 64770 (FLETE SOLO RETORNO)`).
    * `personal_asignado`: Operador principal, chofer de transporte y rigger asignado.

---

### 4.2. Sección 2: Control de Flota y Validación de Horas
* Grilla editable por jornada/fila para cada máquina:
  * `fecha`: Fecha de la jornada (`DD/MM/AAAA`).
  * `numero_ot`: Número de OT correspondiente a esa jornada.
  * `tipo_servicio`: Modalidad (`Hora`, `Flete Solo Ida`, `Flete Solo Retorno`, `Fijo`).
  * `patente`: Patente del equipo.
  * `hora_salida`: Hora en formato `HH:mm` (ej. `07:25`).
  * `hora_llegada`: Hora en formato `HH:mm` (ej. `07:25`).
  * `hora_termino`: Hora en formato `HH:mm` (ej. `19:00`).
  * `hora_retorno`: Hora en formato `HH:mm` (ej. `19:00`).
  * `colacion`: Tiempo de colación en formato `HH:mm` (ej. `01:00`) o minutos.
  * `horas_reales`: Cálculo automático de jornada efectiva:
    $$\text{Hrs Reales} = (\text{hora\_termino} - \text{hora\_llegada}) - \text{colacion}$$
  * `horas_report`: **Input numérico editable** con las horas reconocidas y firmadas en el report diario de papel/móvil (ej. `11.0` hrs).
  * `numero_report`: Folio físico del report de faena (ej. `135509`).
* **Subtotales de Horas por Equipo:**
  * Agrupación visual por patente con subtotal de horas report y cálculo de horas facturables:
    $$\text{Horas Facturables por Equipo} = \sum \text{horas\_report}$$
* **Total Horas Report Facturables General:** Suma global de horas de todos los equipos del servicio.

---

### 4.3. Sección 3: Planilla de Costos Operacionales (8 Categorías a Pagar)

Cada sección permite agregar filas dinámicas con botón `[ + Agregar Fila ]` y eliminar filas con `[ 🗑️ ]`:

#### 1. Viáticos de Alimentación Personal
* Columnas: `Fecha`, `Personal` (Nombre del trabajador), `Concepto` (ej. *Alimentación Operador por 12 hrs de servicio*), `Monto ($)`.
* Subtotal automático: `Total Alimentación ($)`.

#### 2. Peajes y TAG de Ruta
* Columnas: `Fecha`, `Patente`, `Personal`, `Detalle / Ruta / Tag / Vehículo`, `Monto ($)`.
* **Regla Especial de Texto:** Si el peaje no debe ser devuelto al operador (por ejemplo pagado con tarjeta Copec corporativa o asumido por cliente), el campo de monto acepta la cadena `"NO REEMBOLSAR"`.
  * La aplicación preserva el texto literal `"NO REEMBOLSAR"` en pantalla y en el PDF.
  * Para el total financiero, `"NO REEMBOLSAR"` se computa como `$0` en los reembolsos directos a caja pero se suma en los costos globales si corresponde a un gasto de la empresa.
* Subtotal automático: `Total Peajes ($)`.

#### 3. Pensiones y Alojamiento Faena
* Encabezado incluye input opcional para `N° OC: [ 645-646 ]`.
* Columnas por fila:
  * `Fecha`
  * `Personal`
  * `Desayuno ($)` (ej. `$4.000`)
  * `Almuerzo ($)` (ej. `$ -` si es provisto por cliente)
  * `Cena ($)` (ej. `$4.000` o `$10.000`)
  * `Alojamiento ($)` (ej. `$14.000` o `$17.500`)
  * `Traslado ($)` (ej. `$ -`)
  * `Total ($)`: Suma reactiva horizontal de los 5 conceptos diarios por trabajador.
* Subtotal automático: `Total Pensiones ($)`.

#### 4. Movilización Personal (Pasajes, Uber, Taxi, Transfer)
* Columnas: `Fecha`, `Personal`, `Detalle / Medio Transporte`, `Monto ($)`.
* Subtotal automático: `Total Movilización ($)`.

#### 5. Personal Externo / Riggers de Apoyo
* Columnas: `Fecha`, `Personal`, `Tipo Pago` (Factura, Boleta de Honorarios, Transferencia), `Detalle`, `Monto ($)`.
* Subtotal automático: `Total Personal Externo ($)`.

#### 6. Pago Feriados y Bonos
* Columnas: `Fecha`, `Personal`, `Detalle / Justificación`, `Monto ($)`.
* Subtotal automático: `Total Feriados ($)`.

#### 7. Subcontratación Flete Externo
* Encabezado incluye input para `N° OC: [ 6338 ]`.
* Columnas: `Fecha`, `Descripción / Servicio Flete Subcontratado`, `Monto ($)` (ej. *Subcontrato flete externo traslado contrapesos $150.000*).
* Subtotal automático: `Total Subcontratación Flete ($)`.

#### 8. Gastos Extraordinarios
* Columnas: `Fecha`, `Detalle / Proveedor` (Vulcanización, compra de repuestos en faena, mangueras), `Monto ($)`.
* Subtotal automático: `Total Gastos Extraordinarios ($)`.

#### 9. Costo Valor Hora Operador (Cálculo Automático)
* Tabla de costo interno de mano de obra por máquina:
  * `Equipo (Patente / Subcat)`
  * `Categoría Equipo / Maestra` (ej. `GRÚAS TELESCÓPICAS 75 TON`, `GRÚAS TELESCÓPICAS 50 TON`)
  * `Valor Hora Operador ($)`: Tarifa de mano de obra por hora (ej. `$6.000/hr`, `$5.000/hr`, `$10.000/hr`)
  * `Horas Report`: Horas reconocidas vinculadas de la Sección 2.
  * `Total Costo Operador ($)`:
    $$\text{Costo Operador} = \text{Valor Hora Operador} \times \text{Horas Report}$$
* Subtotal automático: `Total Costo Valor Hora Operador ($)`.

---

### 4.4. Sección 4: Resultado del Servicio & Observaciones

#### A. Resumen de Ingresos Totales (Venta Facturable)
1. **Ingresos Horas Trabajadas ($):**
   $$\text{Ingreso Horas} = \sum (\text{Tarifa Hora Equipo} \times \text{Horas Facturables Equipo})$$
   Exhibe el porcentaje sobre el total de la venta ($\% = (\text{Ingreso Horas} / \text{Venta Total}) \times 100$).
2. **Ingreso por Servicio Fijo ($):** Monto fijo convenido ($\%$ s/ venta).
3. **Ingreso por Fletes / Traslados ($):** Monto flete convenido ($\%$ s/ venta).
* **TOTAL INGRESOS FACTURABLES (NETO):** Suma de los 3 ítems anteriores ($100\%$).

#### B. Resumen de Costos Operacionales (Egresos Directos)
Consolidación de las 8 categorías:
1. Viáticos Alimentación
2. Peajes y TAG
3. Pensiones y Alojamiento
4. Movilización Personal
5. Personal Externo y Feriados
6. Subcontratación Flete Externo
7. Gastos Extraordinarios
8. Costo Valor Hora Operador
* Cada ítem exhibe su **Monto ($)** y su **Porcentaje de Impacto sobre la Venta**:
  $$\% \text{ Impacto} = \left( \frac{\text{Monto Ítem}}{\text{Total Ingresos Facturables}} \right) \times 100$$
* **TOTAL COSTOS OPERACIONALES:** Suma neta de egresos y porcentaje total consumido.

#### C. Resultado del Servicio (Margen Operacional)
* **Utilidad Bruta Operacional ($):**
  $$\text{Utilidad Bruta} = \text{Total Ingresos Facturables} - \text{Total Costos Operacionales}$$
* **Margen Operacional Neto (%):**
  $$\text{Margen} = \left( \frac{\text{Utilidad Bruta}}{\text{Total Ingresos Facturables}} \right) \times 100$$
* **Semáforo Cromático:**
  * Si Margen $\ge 0\%$: Banner en verde esmeralda (`#059669` / `bg-emerald-950/80 text-emerald-100`) con etiqueta `Rentable`.
  * Si Margen $< 0\%$: Banner en rojo carmesí (`#e11d48` / `bg-rose-950/80 text-rose-100`) con etiqueta `Pérdida / Alerta Operativa`.

#### D. Observación del Servicio (Campo Protegido)
* Textarea de alta visibilidad y edición fluida.
* **Regla Inmutable:** El texto de observaciones **NUNCA se borra ni se reinicia**. Se preserva en memoria activa, en base de datos PostgreSQL y en almacenamiento de sesión para que las secretarias y Yiara puedan registrar crónicas operacionales extensas (ej. acuerdos de almuerzo provisto por cliente, traslados de contrapesos compartidos, notas de peajes sin comprobante, etc.).

#### E. Cuadro de Firmas Oficiales
* Tres bloques de validación formal:
  1. `ELABORADO POR:` Nombre de la Secretaria / Analista de Operaciones (ej. `YIARA MENDOZA`).
  2. `APROBADO POR:` Nombre del Gerente de Operaciones (ej. `JORGE PONCE`).
  3. `RECIBIDO POR:` Nombre del Responsable Contable (ej. `CONTABILIDAD Y FINANZAS` / `MARITZA SEGUEL`).

---

## 🗄️ 5. Modelo de Persistencia en Base de Datos PostgreSQL (`sch_leangsp`)

Para resolver de raíz el bug del `localStorage`, el ITS se persiste en la base de datos de LeanGlobal mediante las tablas existentes:

1. **`sch_leangsp.tits_informe_termino` (Cabecera):**
   * `id_its` (PK, SERIAL)
   * `folio_its` (VARCHAR, ej. `ITS-0209`)
   * `id_proyecto` (FK hacia `tpry_proyecto`)
   * `id_empresa_facturacion` (FK hacia `tpar_empresas`)
   * `cliente_nombre`, `cliente_rut`, `obra_ciudad`, `ejecutivo_comercial`
   * `fecha_inicio_servicio`, `fecha_termino_servicio`, `total_dias`
   * `tipo_servicio` (`HORA`, `DIARIO`, `MENSUAL`, `FIJO`, `FLETE`)
   * `regimen_operacional` (`URBANO`, `RURAL`)
   * `valor_fijo`, `valor_flete`, `total_ingresos_facturables`
   * `total_costos_operacionales`, `utilidad_bruta`, `margen_porcentaje`
   * `observaciones` (TEXT, preservado inmutable)
   * `estado_its` (`BORRADOR`, `EN_REVISION`, `APROBADO_OPS`, `CONCLUIDO`)
   * `firmante_elaborado`, `firmante_aprobado`, `firmante_recibido`

2. **`sch_leangsp.tits_jornada_detalle` (Jornadas / Sección 2):**
   * `id_jornada_detalle` (PK, SERIAL)
   * `id_its` (FK)
   * `fecha`, `numero_ot`, `tipo_servicio`, `patente`
   * `hora_salida`, `hora_llegada`, `hora_termino`, `hora_retorno`, `colacion_minutos`
   * `horas_reales`, `horas_report`, `numero_report`

3. **`sch_leangsp.tits_costo_operacional` (Costos / Sección 3):**
   * `id_costo` (PK, SERIAL)
   * `id_its` (FK)
   * `categoria` (`ALIMENTACION`, `PEAJES`, `PENSIONES`, `MOVILIZACION`, `PERSONAL_EXTERNO`, `FERIADOS`, `SUBCONTRATO_FLETE`, `GASTOS_EXTRA`, `VALOR_HORA_OPERADOR`)
   * `fecha`, `patente`, `personal_nombre`, `concepto_detalle`, `monto`, `es_no_reembolsar` (BOOLEAN), `numero_oc`

---

## 📄 6. Especificación del Motor de Generación PDF

El generador debe compilar un PDF vectorial en formato A4 que replique con exactitud matemática el diseño de `ITS CHINA FIRST` e `ITS CONSTRUCTORA NUALART`:

* **Logotipo Superior:** Inyección dinámica del logo según la empresa emisora seleccionada (San Pablo, Bestmaq, Logística del Sur, Royal Rental).
* **Tipografía:** Inter / Sans-serif con jerarquía contrastada (encabezados en negro/azul oscuro, cifras monospace, etiquetas en mayúsculas).
* **Márgenes y Estilos:**
  * Márgenes superior/inferior: 8mm.
  * Regla CSS estricta `page-break-inside: avoid` en cada una de las 4 secciones para evitar que las tablas se corten entre páginas.
* **Soporte de Filas "NO REEMBOLSAR":** Las filas con esta marca se imprimen con el texto en la columna de monto y el subtotal excluye dicho valor.

---

## 🚀 7. Plan de Implementación de la Versión 1 Manual (Hito Hoy)

1. **Creación del Componente Frontend V1:**
   * Archivo: `ejecucion/frontend/src/views/Operaciones/ItsTransicionManualView.vue` (o accesible desde la Torre de Control y ruta `/its-transicion`).
   * Carga manual libre de campos con autoguardado en sesión.
2. **Cálculo Reactivo en Tiempo Real:**
   * Fórmulas automáticas de horas reales, subtotales por equipo, suma de costos en las 8 categorías, utilidad bruta y margen porcentual.
3. **Generador de PDF Vectorial A4:**
   * Botón `[ 📄 Generar PDF Oficial ]` que descarga o abre el PDF listo para despacho.
4. **Despacho Omnicanal:**
   * Botón `[ ✉️ Enviar a Contabilidad y Gerencia ]` conectado con Nodemailer y microservicio WhatsApp.
