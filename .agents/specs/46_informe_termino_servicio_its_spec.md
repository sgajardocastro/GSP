# 📐 Especificación Canónica: Informe de Término de Servicio (ITS) (Spec 46)

**Documento:** `46_informe_termino_servicio_its_spec.md`  
**Ecosistema:** Grúas San Pablo (GSP) / LeanGlobal Platform  
**Módulo:** Torre de Control CRM / Liquidación de Operaciones (`GestorOportunidades.vue` & `ModalITS.vue`)  
**Subpestaña Asociada:** Subpestaña 7: `7. Valorización, ITS & Facturación` (Paso 1 del Pipeline Canónico)  
**Fase de Dominio:** Fases 5 & 6 - Cierre Técnico, Liquidación Interna de Costos y Determinación de Margen (`id_proyecto_estado = 6`)  
**Estado:** `CANÓNICO VIGENTE`  
**Última Actualización:** 8 de Septiembre de 2026 (Creación e integración del análisis de maqueta Jorge Ponce)  

---

## 0. 🏛️ Antecedente de Análisis Inicial: Maqueta Jorge Ponce vs. Sistema GSP

Este documento nace del análisis funcional y técnico realizado sobre la maqueta conceptual desarrollada por **Jorge Ponce** (Gerente General) en `index ITS.html` y su especificación por prompt (7 de Septiembre de 2026), contrastada con el sistema oficial de Grúas San Pablo en `sch_leangsp` y Vue 3.

### 0.1. Matriz de Contraste y Diagnóstico de Brechas (Gaps)

| Dimensión / Módulo | Maqueta de Jorge Ponce (`index ITS.html` / Prompt) | Sistema GSP / LeanGlobal Actual (`sch_leangsp` / Vue 3) | Brecha Identificada (Gap) y Resolución |
| :--- | :--- | :--- | :--- |
| **Rol en el Flujo** | Documento **interno de liquidación técnico-económica** previa a facturar. Contrasta horas pactadas/reales vs. costos de terreno para obtener margen. | El sistema saltaba directo desde los Reports Diarios (Pestaña 6) a la Carátula de EDP Mandante (Paso 2), omitiendo el análisis de costos internos. | **Brecha 1 Resuelta:** Se formaliza el ITS como el **Paso 1 indispensable** del pipeline. El ITS es la auditoría interna; el EDP es la cuenta de cobro mandante. |
| **Identificación & Header** | • `FOLIO N° ITS-XXXX (v1.0)` con versionamiento.<br>• Selector de contexto: `[ Servicio Urbano / Servicio Rural ]`.<br>• Badge referencial: `Cotización #XXXX` / `OT XXXX`.<br>• Acciones: `Guardar Avances`, `Guardar y Volver`, `Descargar PDF`. | Solo existe el código general `GSP-XXXX-XXXX-XXX`. No existía folio correlativo ni selector de contexto. | **Brecha 2 Resuelta:** Se incorpora generación de `FOLIO ITS-XXXX` correlativo y selector de contexto operativo (`Urbano` vs `Rural`). |
| **Datos Generales & Asignación** | • Metadatos comerciales editables en vivo (Valor hora pactado, valor flete pactado).<br>• Subtabla de asignación con Pills de rol: `OPERADOR` vs `OPERADOR EXTERNO`, `RIGGER` vs `RIGGER EXTERNO`.<br>• Botones de V°B° por campo. | Los datos comerciales y de recursos existen en `tpry_proyecto` y `tpry_rel_*`, pero dispersos entre Pestaña 1 y Pestaña C. | **Brecha 3 Resuelta:** Se consolida una tarjeta resumen en cabecera del ITS con toggle rápido para recursos propios vs. subcontratados/externos. |
| **Control de Flota y Horas** | • Tabla cronológica multi-día.<br>• Selector `TIPO SERVICIO` (8 opciones).<br>• Salida, Llegada, Término, Retorno.<br>• Paso rápido de Colación (`▼ 01:00 ▲`).<br>• `HRS REALES` vs `HRS REPORT` (editable en ámbar).<br>• **Ocultar/Tachar fila** (descarte para no facturar sin borrar registro).<br>• Subtotales por patente. | Los datos reales existen en `tedp_reporte_avance` (PWA con firmas Canvas y GPS), pero no se volcaban en una grilla de liquidación editable. | **Gran Ventaja GSP:** No se digita a mano; **se auto-puebla desde los Reports validados en terreno**, permitiendo al analista ajustar `HRS REPORT` o tachar/ocultar filas con 1 clic. |
| **Costos Operacionales (Contabilidad)** | **8 categorías dinámicas independientes:**<br>1. Viático Alimentación<br>2. Peajes y TAG<br>3. Pensiones y Alojamiento (desglose: Desayuno, Almuerzo, Cena, Cama, Traslado)<br>4. Personal Externo (con N° OC)<br>5. Pago Feriados y Bonos<br>6. Subcontratación Flete (con N° OC)<br>7. Gastos Extraordinarios<br>8. Costo Valor Hora Operador ($\text{Tarifa Maestra} \times \text{Hrs}$). | Spec 27 (`tedp_costos_servicio`) solo contemplaba 6 categorías genéricas (`COMBUSTIBLE`, `VIATICOS`, etc.). | **Brecha 4 Resuelta:** Se adopta el modelo contable completo de **8 categorías de Jorge**, incluyendo el desglose pormenorizado de pensiones y el costo de horas de operador. |
| **Balance Económico (P&L)** | Consola en 2 paneles:<br>• Financiero: Venta vs Costos, Utilidad Bruta ($) y Margen % reactivos.<br>• Observaciones: Textarea con botones de 1-clic `[ Urbano ]` y `[ Rural ]` + modal de edición. | No existía cálculo de utilidad interna ni margen real en tiempo real ni plantillas de observación. | **Brecha 5 Resuelta:** Se implementa la consola con tarjetas reactivas de P&L y el inyector de plantillas de texto `[ Urbano ]` / `[ Rural ]`. |
| **Firmas y Trazabilidad** | Triple firma interna en pie de documento:<br>1. `ELABORADO POR`<br>2. `APROBADO POR`<br>3. `RECIBIDO POR (CONTABILIDAD)` | Solo existía `usuario_cierre_id` al momento de facturar. | **Brecha 6 Resuelta:** Se incorpora el bloque de triple visto bueno interno (Daniela / Richard / Maritza). |
| **Salida Documental** | Generación de informe PDF de auditoría interna (`ITS-XXXX.pdf`). | Solo generaba PDF de Cotización, Carátula EDP y Dossier. | **Brecha 7 Resuelta:** Se implementa la plantilla PDF oficial de ITS para control de gestión de Gerencia. |

---

## 1. 📌 Resumen Ejecutivo y Propósito de Negocio

El **Informe de Término de Servicio (ITS)** es el instrumento oficial interno de Grúas San Pablo para:
1. **Auditar el cumplimiento operativo:** Cotejar los reportes de terreno (PWA) contra lo cotizado y programado.
2. **Imputar todos los costos directos reales:** Registrar gastos de viáticos, peajes, pensiones, personal externo, feriados, subcontrataciones y costo de horas operador asignadas a la OT.
3. **Calcular la rentabilidad real inmediata:** Producir el balance de **Utilidad Bruta ($)** y **Margen Operacional (%)** del servicio antes de emitir cobro alguno.
4. **Alimentar el Paso 2 (EDP Mandante):** Una vez aprobado internamente el ITS, los datos de horas facturables y fletes fluyen automáticamente hacia la Carátula de Estado de Pago (Spec 38).

---

## 2. 🔄 Flujo Operativo y Ubicación en el Pipeline

El ITS corresponde al **Paso 1** de la Subpestaña 7 (`GestorOportunidades.vue`):

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│               PIPELINE DE VALORIZACIÓN, LIQUIDACIÓN Y FACTURACIÓN (SUBPESTAÑA 7)       │
└────────────────────────────────────────────────────────────────────────────────────────┘
                                             │
  PASO ①: ITS (INFORME DE TÉRMINO DE SERVICIO - SPEC 46) ◄── [ESTE MÓDULO]
  ┌──────────────────────────────────────────────────────────────────────────────────────┐
  │  • Auto-población de jornadas desde reports validados PWA (Spec 34).                 │
  │  • Ajuste de Hrs Report facturables y opción de tachar/ocultar filas.                │
  │  • Imputación de Costos Directos en 8 tablas dinámicas.                              │
  │  • Balance Financiero en vivo: Venta Neta vs Costo Directo ➔ Utilidad Bruta & Margen.│
  │  • Plantillas de Observación de 1-clic: [ Urbano ] / [ Rural ].                      │
  │  • Triple V°B° interno: Elaborado ➔ Aprobado ➔ Recibido Contabilidad.                │
  │  • Salida: PDF Oficial ITS para Gerencia y pase expedito al Paso 2.                  │
  └─────────────────────────────────────────┬────────────────────────────────────────────┘
                                             │ (Datos Validados)
                                             ▼
  PASO ②: EDP MANDANTE (SPEC 38) ──► PASO ③: RESPALDO OC ──► PASO ④: FACTURACIÓN DTE
```

---

## 3. 🖥️ Especificación Detallada de la Interfaz (`ModalITS.vue`)

El componente modal se despliega al presionar el botón `[ 📄 Generar / Editar Informe Término de Servicio (ITS) ]` en el Paso 1 de la Subpestaña 7.

### 3.1. Cabecera (Header) y Acciones Globales
- **Identificadores:**
  - Logotipo institucional de Grúas San Pablo / Arriendos San Pablo.
  - Título central: `INFORME TÉRMINO DE SERVICIO`.
  - Selector de Contexto: Dropdown con opciones `[ Servicio Urbano ]` y `[ Servicio Rural ]`.
  - Folio y Versión: Badge `FOLIO N° ITS-{ID_PROYECTO}-{CORRELATIVO} (v1.0)` (formato monoespaciado).
  - Referencia de Origen: Badges interactivos vinculados `Cotización #{COD_COTIZACION}` y `OT #{CODI_PROYECTO}`.
- **Barra de Acciones Globales:**
  - `[ 💾 Guardar Avances ]`: Guarda los cambios en `json_field->'its_v1'` sin cerrar la vista.
  - `[ 💾 Guardar y Volver ]`: Guarda y cierra el modal retornando a la Subpestaña 7.
  - `[ 🖨️ Descargar PDF ITS ]`: Genera y abre el informe oficial formateado para impresión o archivo.
  - `[ ✕ ]`: Cierre de la vista modal (advierte si hay cambios sin guardar).

### 3.2. Sección 1: Datos del Servicio Integral (Metadatos & Asignación)
- **Bloque A - Parámetros Comerciales:**
  - `Cliente` y `RUT Cliente` (solo lectura).
  - `Empresa Facturadora` (ej. Grúas San Pablo SpA / Bestmaq SpA) y `Ejecutivo Comercial`.
  - `Fechas del Servicio` (Inicio y Término real) y `Comuna / Ciudad de la Obra`.
  - `Horas Mínimas Pactadas` (extraídas de las líneas de la cotización comercial).
  - `Valor Hora Pactado ($/hr)`: Input editable en vivo con formato moneda CLP.
  - `Valor Flete / Traslado ($)`: Input editable en vivo con formato moneda CLP.
- **Bloque B - Subtabla de Asignación de Recursos:**
  - Lista los equipos involucrados (Patente, Modelo, Capacidad Tonelaje).
  - Muestra tripulación asignada con selector de tipo Pill:
    - Operador: `[ OPERADOR PROPIO ]` (Azul) vs `[ OPERADOR EXTERNO ]` (Púrpura).
    - Rigger: `[ RIGGER PROPIO ]` (Azul) vs `[ RIGGER EXTERNO ]` (Púrpura).
  - Checkmarks individuales de `V°B°` para auditoría visual.

### 3.3. Sección 2: Control de Flota y Validación de Horas (Jornadas de Terreno)
Grilla cronológica multi-día alimentada automáticamente desde `sch_leangsp.tedp_reporte_avance`:
- **Columnas:**
  1. `FECHA`: Fecha de la faena (`DD/MM/YYYY`).
  2. `N° OT`: Código de la orden de trabajo.
  3. `TIPO SERVICIO`: Selector desplegable con 8 categorías canónicas:
     - `Hora`
     - `Mensual`
     - `Fijo`
     - `Flete Ida y Retorno`
     - `Flete Solo Ida`
     - `Flete Solo Retorno`
     - `Visita Terreno`
     - `Interno`
  4. `PATENTE`: Equipo que operó la jornada.
  5. `SALIDA`, `LLEGADA`, `TÉRMINO`, `RETORNO`: Inputs de tiempo militar (`HH:MM`).
  6. `COLACIÓN`: Selector de paso rápido en bloques de 30 minutos (`▼ 01:00 ▲` / `30m`, `45m`, `60m`, `90m`).
  7. `HRS REALES`: Cálculo automático neto:
     $$\text{Hrs Reales} = (\text{Hora Término} - \text{Hora Llegada}) - \text{Colación}$$
  8. `HRS REPORT`: Horas facturables efectivas. Precargadas desde el report firmado del cliente. Si el analista edita este valor, se resalta con fondo ámbar (`bg-amber-500/20 text-amber-300`).
  9. `N° REPORT`: Correlativo del reporte físico o token del report digital.
  10. `V°B°`: Checkbox de conciliación del analista.
  11. `ACCIONES`:
      - `[ + Fila ]`: Inserta una jornada o ajuste extraordinario.
      - `[ 👁️ Ocultar / Mostrar ]`: Permite **tachar/ocultar la fila** (`class="row-oculta line-through opacity-55"`). Las filas ocultas se excluyen del cálculo de horas facturables sin perder el registro histórico de faena.
- **Totales de Sección:**
  - Subtotales agrupados por patente (`TOTAL PATENTE: XX.X hrs`).
  - Badge general destacado: `Total Horas Report Facturables: XX.X hrs`.

### 3.4. Sección 3: Planilla de Costos Operacionales Directos (Las 9 Categorías Canónicas)
Compuesta por 9 categorías dinámicas con auditoría individual, soporte de comprobantes fotográficos y persistencia en `sch_leangsp.tits_costo_operacional`:

1. **Combustible en Ruta y Faena:**
   - **Traza Multiestanque Independiente:** Cada estanque se gestiona por separado sin ocultamiento, permitiendo trazabilidad física exacta:
     * *Estanque Chasis (Traslado):* Consumo de motor de desplazamiento en ruta.
     * *Estanque Superestructura (Grúa Telescópica):* Consumo del motor superior o toma de fuerza en maniobras de izaje.
     * *Auxiliar / Bidón Faena:* Cargas de bidón o equipos menores de apoyo.
   - **Restricción Estricta de Patentes:** El selector desplegable de patentes muestra **única y exclusivamente las patentes y equipos asignados a la OT**. Queda prohibido imputar combustible a patentes ajenas.
   - **Comprobante Fotográfico / Voucher Copec:** Cada registro permite adjuntar imagen de la boleta/voucher Copec, desplegando de inmediato una miniatura visible en la celda con zoom interactivo (lightbox).
   - **Sincronización PWA Offline-First:** Las cargas ejecutadas en ruta mediante la PWA de conductores se sincronizan automáticamente con origen `🛰️ PWA`, odómetro de carga y voucher respaldado.
   - **Costo Único:** El costo total de combustible se audita como una sola cifra consolidada en el balance.

2. **Gastos de Movilización (Pasajes / Uber / Taxi / Transfer):**
   - **Restricción Estricta de Personal:** Solo pueden imputarse gastos al **personal y tripulación asignada a la OT** (Operador, Rigger, Conductor escolta).
   - **Desplegable de Tipo de Movilización:** `Uber / Taxi`, `Pasaje Bus Interurbano`, `Pasaje Aéreo`, `Transfer Aeropuerto/Terminal`, `Otro Gasto de Traslado`.
   - **Comprobante Fotográfico:** Soporte de miniatura y visor ampliado de boletas y vouchers de transporte.

3. **Peajes y TAG de Ruta:**
   - Columnas: `Fecha`, `Patente` (restringida a equipos asignados), `N° Comprobante`, `Personal`, `Detalle / Ruta`, `Comprobante Fotográfico`, `Monto ($)`.

4. **Pensiones y Alojamiento Faena (Alimentación Consolidada):**
   - **Eliminación de la Categoría "Alimentación":** Los viáticos de alimentación quedan extirpados como categoría independiente y se gestionan íntegramente dentro de Pensiones (Desayuno, Almuerzo, Cena).
   - **Condiciones Comerciales CRM Predefinidas e Inmutables:** Los ítems de pensión se precargan directamente desde las condiciones comerciales pactadas en la cotización comercial (`crm_v1` / `tits_informe_termino.crm_pensiones`):
     * Desayuno: `[ A cargo GSP ]` o `[ A cargo Mandante ]`
     * Almuerzo: `[ A cargo GSP ]` o `[ A cargo Mandante ]`
     * Cena: `[ A cargo GSP ]` o `[ A cargo Mandante ]`
     * Alojamiento: `[ A cargo GSP ]` o `[ A cargo Mandante ]`
     * Traslado Interno: `[ A cargo GSP ]` o `[ A cargo Mandante ]`
   - **Inmutabilidad en ITS:** No son seleccionables ni alterables por el analista en la fila del ITS; vienen predefinidos contractualmente.
   - **Regla Financiera en el Balance P&L:** Los montos marcados como *A cargo del Mandante* se auditan y documentan en la tabla y en el reporte final, pero **NO se restan de la Utilidad Bruta de GSP** (no merman la rentabilidad del servicio).

5. **Personal Externo / Riggers de Apoyo:**
   - Columnas: `Fecha`, `N° OC Cabecera`, `Personal`, `Detalle / Función`, `Monto ($)`.

6. **Pago Feriados y Bonos:**
   - Columnas: `Fecha`, `Personal Asignado`, `Detalle / Concepto`, `Monto ($)`.

7. **Subcontratación Flete Externo:**
   - Columnas: `Fecha`, `N° OC Cabecera`, `Proveedor / Detalle Flete`, `Monto ($)`.

8. **Gastos Extraordinarios:**
   - Columnas: `Fecha`, `Detalle del Gasto` (Vulcanización, Insumos menores, Faena), `Monto ($)`.

9. **Costo Valor Hora Operador:**
   - Columnas: `Fecha`, `Patente`, `Operador`, `Valor Hora ($)`, `Horas Report`, `Total Costo Operador ($)`.
   - Cálculo multiplicativo: $\text{Valor Hora} \times \text{Horas Report}$.

---

### 3.5. Sección 4: Consola de Resultado Económico (P&L) y Observaciones

#### Panel Izquierdo: Balance Financiero (Venta vs. Costos)
- **Ingresos Facturables (Venta Neta):**
  - Subtotal Horas Trabajadas ($\text{Valor Hora} \times \text{Horas Report}$).
  - Subtotal Fletes Pactados.
  - Total Venta Neta (Base 100%).
- **Costos Directos de Terreno:**
  - Desglose consolidado de las 9 categorías oficiales.
  - Total Costos Operacionales Directos.
- **Resultado Operacional:**
  - **Utilidad Bruta ($):** $\text{Venta Neta} - \text{Total Costos Directos GSP}$.
  - **Margen Operacional (%):** $(\text{Utilidad Bruta} / \text{Venta Neta}) \times 100$.

#### Panel Derecho: Observaciones con Inyección de Plantillas
- Botones de 1-clic: `[ 🏢 Urbano ]` y `[ 🚜 Rural ]`.
- Textarea amplio para auditoría final y observaciones de liquidación.

#### Regla de Interfaz Web (`ModalITS.vue`): Exclusión de Widget de Triple Firma
- **La vista web del ITS NO contiene botones interactivos ni cajas de Triple Firma FES.**
- El modal es una **consola operativa de auditoría y cálculo**. La validación y aprobación formal se rige mediante el documento PDF oficial emitido y el flujo de estados gobernado por Spec 47.

#### Regla Terminológica e Iconográfica Inviolable:
- **PROHIBICIÓN TOTAL DE ICONOS DE GRÚAS TORRE / CONSTRUCCIÓN (`🏗️`):** Grúas San Pablo opera única y exclusivamente con **Grúas Telescópicas Móviles de Alto Tonelaje**. Queda prohibido el uso de emojis, figuras o terminología asociada a grúas pluma de edificación habitacional. Toda referencia en UI y reportes utiliza denominación industrial precisa (*Grúa Telescópica*, *Superestructura*, *Chasis*).

---

## 4. 🧮 Motor de Cálculo Reactivo y Fórmulas Matemáticas

Cualquier cambio en la grilla de horas, tarifas o tablas de costos dispara reactivamente el recálculo sin latencia:

$$\text{Ingreso Horas} = \text{Tarifa Hora Pactada} \times \sum \text{Hrs Report}_{\text{filas activas}}$$

$$\text{Ingreso Fletes} = \sum \text{Valores Flete Pactados}$$

$$\text{Total Ingresos Facturables} = \text{Ingreso Horas} + \text{Ingreso Fletes}$$

$$\text{Total Costos} = \sum_{k=1}^{9} \text{Subtotal Categoría}_k$$

$$\text{Utilidad Bruta} = \text{Total Ingresos Facturables} - \text{Total Costos}$$

$$\text{Margen \%} = \begin{cases} \left( \dfrac{\text{Utilidad Bruta}}{\text{Total Ingresos Facturables}} \right) \times 100 & \text{si Total Ingresos} > 0 \\ 0.0 & \text{si Total Ingresos} \le 0 \end{cases}$$

### Persistencia Debounced (Guardado Fluido)
Las modificaciones en inputs de texto o montos utilizan un temporizador diferido (`debounce` de 400ms) para persistir en backend y `localStorage`, evitando congelamiento del cursor y llamadas HTTP redundantes.

---

## 5. 🗄️ Modelo de Datos y Persistencia Relacional PostgreSQL (sch_leangsp)

Para asegurar integridad referencial, consistencia contable y auditoría estricta de costos y utilidades, toda la persistencia del ITS se estructura en **3 tablas relacionales normalizadas** en el esquema `sch_leangsp`:

### 5.1. Cabecera del ITS: `sch_leangsp.tits_informe_termino`
```sql
CREATE TABLE IF NOT EXISTS sch_leangsp.tits_informe_termino (
    id_its BIGSERIAL PRIMARY KEY,
    id_proyecto INT NOT NULL REFERENCES sch_leangsp.tpry_proyecto(id_proyecto) ON DELETE RESTRICT,
    folio_its VARCHAR(50) NOT NULL UNIQUE, -- ej: 'ITS-2608-001'
    version INT NOT NULL DEFAULT 1,
    tipo_contexto VARCHAR(20) NOT NULL CHECK (tipo_contexto IN ('URBANO', 'RURAL')),
    
    -- Tarifas comerciales pactadas de liquidación
    horas_minimas_pactadas NUMERIC(6, 2) NOT NULL DEFAULT 8.00,
    valor_hora_pactado NUMERIC(14, 2) NOT NULL DEFAULT 0,
    valor_flete_pactado NUMERIC(14, 2) NOT NULL DEFAULT 0,
    
    -- Balance Económico Consolidado (Auditoría Financiera)
    total_horas_report NUMERIC(8, 2) NOT NULL DEFAULT 0,
    total_ingresos_horas NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_ingresos_fletes NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_ingresos_facturables NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_costos_operacionales NUMERIC(14, 2) NOT NULL DEFAULT 0,
    utilidad_bruta NUMERIC(14, 2) NOT NULL DEFAULT 0,
    margen_porcentaje NUMERIC(6, 2) NOT NULL DEFAULT 0,
    
    -- Observaciones y Plantilla
    plantilla_tipo VARCHAR(20) DEFAULT 'URBANO' CHECK (plantilla_tipo IN ('URBANO', 'RURAL', 'PERSONALIZADA')),
    observaciones TEXT,
    
    -- Máquina de Estados & Triple Firma Interna
    estado_its VARCHAR(30) NOT NULL DEFAULT 'BORRADOR' 
        CHECK (estado_its IN ('BORRADOR', 'ELABORADO', 'APROBADO_OPERACIONES', 'RECIBIDO_CONTABILIDAD')),
    
    id_user_elaborado INT REFERENCES sch_leangsp.tsec_users(id_user),
    fecha_elaborado TIMESTAMP WITH TIME ZONE,
    
    id_user_aprobado INT REFERENCES sch_leangsp.tsec_users(id_user),
    fecha_aprobado TIMESTAMP WITH TIME ZONE,
    
    id_user_recibido INT REFERENCES sch_leangsp.tsec_users(id_user),
    fecha_recibido TIMESTAMP WITH TIME ZONE,
    
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tits_informe_proy ON sch_leangsp.tits_informe_termino(id_proyecto);
CREATE INDEX IF NOT EXISTS idx_tits_informe_folio ON sch_leangsp.tits_informe_termino(folio_its);
CREATE INDEX IF NOT EXISTS idx_tits_informe_estado ON sch_leangsp.tits_informe_termino(estado_its);
```

### 5.2. Control de Flota y Detalle de Jornadas: `sch_leangsp.tits_jornada_detalle`
```sql
CREATE TABLE IF NOT EXISTS sch_leangsp.tits_jornada_detalle (
    id_jornada BIGSERIAL PRIMARY KEY,
    id_its BIGINT NOT NULL REFERENCES sch_leangsp.tits_informe_termino(id_its) ON DELETE CASCADE,
    id_reporte_avance BIGINT REFERENCES sch_leangsp.tedp_reporte_avance(id_reporte_avance) ON DELETE SET NULL,
    
    fecha DATE NOT NULL,
    numero_ot VARCHAR(50) NOT NULL,
    id_equipo INT REFERENCES sch_leangsp.tequ_equipo(id_equipo),
    patente VARCHAR(20) NOT NULL,
    
    tipo_servicio VARCHAR(30) NOT NULL CHECK (
        tipo_servicio IN ('Hora', 'Mensual', 'Fijo', 'Flete Ida y Retorno', 'Flete Solo Ida', 'Flete Solo Retorno', 'Visita Terreno', 'Interno')
    ),
    
    hora_salida TIME,
    hora_llegada TIME,
    hora_termino TIME,
    hora_retorno TIME,
    colacion_minutos INT NOT NULL DEFAULT 60,
    
    horas_reales NUMERIC(5, 2) NOT NULL DEFAULT 0,
    horas_report NUMERIC(5, 2) NOT NULL DEFAULT 0, -- Horas facturables aprobadas
    numero_report VARCHAR(50),                     -- Token digital o correlativo físico
    
    es_oculta BOOLEAN NOT NULL DEFAULT FALSE,       -- TRUE si se tachó/excluyó del cobro
    vb_conciliado BOOLEAN NOT NULL DEFAULT FALSE,
    orden INT NOT NULL DEFAULT 0,
    
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tits_jornada_its ON sch_leangsp.tits_jornada_detalle(id_its);
CREATE INDEX IF NOT EXISTS idx_tits_jornada_rep ON sch_leangsp.tits_jornada_detalle(id_reporte_avance);
CREATE INDEX IF NOT EXISTS idx_tits_jornada_fec ON sch_leangsp.tits_jornada_detalle(fecha, patente);
```

### 5.3. Costos Operacionales Directos (Las 9 Categorías Canónicas): `sch_leangsp.tits_costo_operacional`
```sql
CREATE TABLE IF NOT EXISTS sch_leangsp.tits_costo_operacional (
    id_costo_item BIGSERIAL PRIMARY KEY,
    id_its BIGINT NOT NULL REFERENCES sch_leangsp.tits_informe_termino(id_its) ON DELETE CASCADE,
    
    categoria VARCHAR(30) NOT NULL CHECK (
        categoria IN (
            'COMBUSTIBLE',
            'MOVILIZACION',
            'PEAJES', 
            'PENSIONES', 
            'PERSONAL_EXTERNO', 
            'FERIADOS', 
            'SUBCONTRATO_FLETE', 
            'GASTOS_EXTRA', 
            'COSTO_HORA_OPERADOR'
        )
    ),
    
    fecha DATE NOT NULL,
    id_personal INT REFERENCES sch_leangsp.tsec_users(id_user),
    nombre_personal VARCHAR(150),
    id_equipo INT REFERENCES sch_leangsp.tequ_equipo(id_equipo),
    patente VARCHAR(20),
    
    -- Combustible Multi-Estanque (Grúas Telescópicas)
    tipo_estanque VARCHAR(50) CHECK (tipo_estanque IN ('PRINCIPAL_CHASIS', 'SUPERESTRUCTURA_GRUA', 'AUXILIAR_BIDON')),
    
    -- Trazabilidad Contable y Respaldo OC
    numero_oc VARCHAR(50),
    concepto_detalle TEXT NOT NULL,
    ruta_detalle VARCHAR(255),
    
    -- Tipo de liquidación y montos
    tipo_calculo VARCHAR(20) DEFAULT 'MONTO_DIRECTO' CHECK (tipo_calculo IN ('MONTO_DIRECTO', 'HORA_OPERADOR', 'DESGLOSE_PENSION')),
    cantidad_unidades NUMERIC(8, 2) NOT NULL DEFAULT 1,
    precio_unitario NUMERIC(14, 2) NOT NULL DEFAULT 0,
    monto_total NUMERIC(14, 2) NOT NULL DEFAULT 0,            -- Costo imputable a GSP (afecta P&L)
    monto_total_cliente NUMERIC(14, 2) NOT NULL DEFAULT 0,    -- Costo a cargo de Mandante (auditable, no afecta P&L GSP)
    
    -- Desglose Específico para Categoría PENSIONES
    monto_desayuno NUMERIC(12, 2) DEFAULT 0,
    monto_almuerzo NUMERIC(12, 2) DEFAULT 0,
    monto_cena NUMERIC(12, 2) DEFAULT 0,
    monto_alojamiento NUMERIC(12, 2) DEFAULT 0,
    monto_traslado NUMERIC(12, 2) DEFAULT 0,
    
    -- Respaldo de Comprobante / Voucher / Fotografía
    archivo_comprobante_url TEXT,
    id_archivo_comprobante INT REFERENCES sch_leangsp.tfmg_archivo(id_archivo),
    origen_registro VARCHAR(30) DEFAULT 'MANUAL',             -- 'MANUAL' o 'PWA_CONVOY'
    
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tits_costo_its ON sch_leangsp.tits_costo_operacional(id_its);
CREATE INDEX IF NOT EXISTS idx_tits_costo_cat ON sch_leangsp.tits_costo_operacional(id_its, categoria);
CREATE INDEX IF NOT EXISTS idx_tits_costo_fecha ON sch_leangsp.tits_costo_operacional(fecha);
CREATE INDEX IF NOT EXISTS idx_tits_costo_oc ON sch_leangsp.tits_costo_operacional(numero_oc);
CREATE INDEX IF NOT EXISTS idx_tits_costo_pat ON sch_leangsp.tits_costo_operacional(patente);
```

---

## 6. 🔌 Especificación de Endpoints Backend

### 6.1. `GET /api/operaciones/its/:id_proyecto`
- **Propósito:** Consulta relacional de la cabecera `tits_informe_termino`, sus jornadas `tits_jornada_detalle` y costos `tits_costo_operacional`. Si no existe ITS previo, auto-inicializa la cabecera e importa las jornadas desde `tedp_reporte_avance`.
- **Respuesta:**
```json
{
  "success": true,
  "data": {
    "its": { "id_its": 1, "folio_its": "ITS-2608-001", "tipo_contexto": "RURAL", "utilidad_bruta": 1100000, "margen_porcentaje": 73.33 },
    "jornadas": [ ... ],
    "costos": {
      "alimentacion": [ ... ],
      "peajes": [ ... ],
      "pensiones": [ ... ],
      "personal_externo": [ ... ],
      "feriados": [ ... ],
      "subcontratacion_flete": [ ... ],
      "gastos_extraordinarios": [ ... ],
      "costo_hora_operador": [ ... ]
    }
  }
}
```

### 6.2. `POST /api/operaciones/its/guardar`
- **Propósito:** Actualiza de forma transaccional (`BEGIN ... COMMIT`) la cabecera, sincroniza las filas de jornadas y las 8 categorías de costos.
- **Body:** `{ id_proyecto, cabecera, jornadas, costos }`.
- **Respuesta:** `{ success: true, message: 'ITS guardado exitosamente en base de datos relacional', folio_its }`.

### 6.3. `POST /api/operaciones/its/firmar-paso`
- **Propósito:** Registra relacionalmente el paso de firma (`ELABORADO`, `APROBADO_OPERACIONES`, `RECIBIDO_CONTABILIDAD`) actualizando `estado_its`, el `id_user_*` correspondiente y su timestamp.

### 6.4. `GET /api/operaciones/its/:id_proyecto/pdf`
- **Propósito:** Genera y transmite el PDF oficial del ITS utilizando Puppeteer con el layout institucional de Grúas San Pablo, consultando directamente las tablas relacionales.

---

## 7. 🧪 Matriz de Verificación y Criterios de Aceptación QA (Gherkin)

```gherkin
Feature: Liquidación Técnico-Económica del Servicio (Informe de Término de Servicio - ITS)
  Como Analista de Operaciones y Jefa de Contabilidad
  Quiero liquidar las horas reales trabajadas y contrastarlas contra los costos directos de faena
  Para conocer la utilidad real del servicio antes de emitir el Estado de Pago al mandante

  Scenario: QA-ITS-01 Auto-población de jornadas desde reports validados
    Given que la OT "GSP-2608-4851-030" tiene 2 reports diarios validados en terreno en Pestaña 6
    When el Analista abre el modal "Informe Término de Servicio (ITS)"
    Then la tabla de jornadas debe mostrar automáticamente 2 filas con fecha, patente, horarios y horas report
    And el subtotal de horas facturables debe ser la suma de los reports activos

  Scenario: QA-ITS-02 Ocultamiento/Tachado de jornada sin eliminar historial
    Given que una jornada de grúa no pudo operar por lluvia y se acordó no cobrar al cliente
    When el Analista presiona el botón "Ocultar Fila" en dicha jornada
    Then la fila debe mostrarse tachada con badge "OCULTA" y estilo atenuado
    And las horas de esa fila deben restarse de inmediato del "Total Horas Report Facturables"
    And los datos originales no deben borrarse de la base de datos

  Scenario: QA-ITS-03 Cálculo reactivo en vivo de Utilidad Bruta y Margen %
    Given que el total de ingresos facturables es $1.500.000
    When el Analista ingresa $150.000 en Peajes y $250.000 en Pensiones
    Then el Total de Costos Operacionales debe actualizarse a $400.000 en tiempo real
    And la Utilidad Bruta debe reflejar exactamente $1.100.000 en color verde esmeralda
    And el Margen % debe mostrar 73.33% sin recargar la página

  Scenario: QA-ITS-04 Inyección de plantillas de observación de 1-clic
    Given que el campo de observaciones se encuentra vacío
    When el usuario presiona el botón "[ Urbano ]"
    Then el textarea debe poblarse instantáneamente con la estructura de observaciones urbanas
    And el sistema debe auto-guardar en diferido (debounce 400ms)

  Scenario: QA-ITS-05 Flujo de triple firma interna
    Given que el ITS ha sido completado por Daniela Soto
    When Richard Sepúlveda presiona "Aprobar ITS"
    Then el estado de firma del ITS pasa a "APROBADO_OPERACIONES"
    And se habilita la recepción formal para Maritza Seguel en Contabilidad
    And el Paso 2 (EDP Mandante) recibe el balance de horas para generar la Carátula Oficial
```
