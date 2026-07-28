# Especificación de Requerimientos de Software (SRS)

## Proyecto: Sistema de Gestión de Operación y Control Financiero - Grúas San Pablo (GSP)

---

## 1. Introducción y Objetivos de Negocio

El propósito de este documento es definir formalmente el alcance técnico, operativo y financiero del ecosistema digital desarrollado bajo el estándar de **LeanGlobal** para **Grúas San Pablo (GSP)**.

### Objetivos Principales
*   **0% Papel en Terreno:** Reemplazar los reportes de servicio físicos en triplicado, check-lists pre-operacionales y Análisis de Seguridad en el Trabajo (AST) por una App móvil parametrizada.
*   **Control del Devengado en Tiempo Real:** Registrar de manera continua los ingresos y costos en el período real en el que se ejecuta el trabajo en faena, independientemente del ciclo de facturación administrativa de los clientes corporativos.
*   **Matching Operacional Financiero:** Vincular directamente la facturación con los costos directos asociados a cada servicio (subcontratos, operarios, combustibles, peajes) para medir la rentabilidad marginal real por maniobra.
*   **Integración y Transición ERP:** Resguardar la contabilidad de la empresa mediante una integración inicial con Laudus ERP, permitiendo posteriormente una migración desasistida hacia el módulo contable nativo de LeanGlobal.

---

## 2. Alcance Detallado del Módulo de Facturación y Compras (SII)

### A. Módulo de Facturación SII (DTE Integrado)
El sistema gestionará el ciclo completo de ingresos operativos desde la valorización del servicio hasta la emisión del documento tributario:
*   **Gatillador de Facturación (Cierre de EDP):** Una vez que el Estado de Pago (EDP) de una maniobra es aprobado por el cliente y validado en la Torre de Control, el sistema habilitará el botón de facturación.
*   **Emisión de DTE (SII):** Conexión directa y desatendida mediante API con el Servicio de Impuestos Internos (SII) de Chile para emitir Facturas Electrónicas Afectas y Exentas de arriendo de maquinaria.
*   **Actualización Contable de Venta:** La emisión de la factura genera un asiento automático que reversa la cuenta puente de *Ingresos por Facturar (Activo)*, imputa a *Clientes (Activo)* e integra el *Débito Fiscal IVA (Pasivo)*.

### B. Módulo de Adquisiciones, Compras y Egresos Directos
Gestión integral de todos los gastos que impactan la rentabilidad marginal de cada servicio y la caja de la organización:
*   **Orden de Compra de Proveedores (OC):** Flujo de solicitud, aprobación jerárquica y emisión de OCs a proveedores y subcontratistas directos (ej. camas bajas para traslado de grúas y contrapesos).
*   **Registro y Control de Facturas de Compra (FTE):** Carga y sincronización online de facturas recibidas (proveedores y acreedores) desde el portal del SII. Cada factura recibida debe ser asociada obligatoriamente a una OC aprobada o imputada como gasto directo de un servicio/OT específico.
*   **Gestión de Egresos por Operación (Gastos de Faena):**
    *   **Rendiciones de Caja Chica / Viáticos:** Registro móvil por parte del supervisor o rigger de viáticos, compras de insumos menores, peajes y romana.
    *   **Control de Combustible:** Integración manual o vía API (Copec/Esmax) para registrar las cargas de combustible por patente y horómetro del equipo, calculando el rendimiento específico ($/hora operada).

---

## 3. Módulo de Contabilidad Simple Nativa (Fase 2 - Mes 6+)

Este módulo permitirá a GSP independizarse de Laudus ERP, manteniendo un control tributario y administrative completo en un solo sistema unificado:

### A. Plan de Cuentas Parametrizable
*   Estructura jerárquica de cuentas adaptada a la legislación contable chilena (Activos, Pasivos, Patrimonio, Pérdidas y Ganancias).
*   Consola dedicada para el contador de GSP con control de cuentas corrientes bancarias, conciliación de egresos e ingresos y manejo de activos fijos (grúas, camiones).

### B. Libro Diario y Asientos Contables Automatizados
El sistema autogenera los registros en el Libro Diario a partir de los hechos económicos que ocurren en los módulos operativos, sin requerir digitación manual del contador:
1.  **Asiento de Venta (DTE):**
    *   *Debe:* Clientes (Activo Circulante).
    *   *Haber:* Ventas / Ingresos por Arriendo (Resultado/Ingreso) + Débito Fiscal IVA (Pasivo Circulante).
2.  **Asiento de Costo/Compra (Factura Proveedor o Adquisición vinculada a OC):**
    *   *Debe:* Costo Operacional Directo / Gasto del Proyecto (Resultado/Gasto) + Crédito Fiscal IVA (Activo).
    *   *Haber:* Proveedores por Pagar (Pasivo Circulante).
3.  **Asiento de Egreso de Caja/Banco (Conciliación bancaria):**
    *   *Debe:* Proveedores por Pagar (Pasivo Circulante).
    *   *Haber:* Banco / Caja Chica (Activo Circulante).

### C. Libro Mayor, Balances y Reportabilidad Tributaria
*   **Libro Mayor:** Desglose transaccional cronológico por cada cuenta contable del plan de cuentas, exportable en formato Excel y PDF.
*   **Balance Tributario de 8 Columnas:** Generación automática del balance chileno al cierre del ejercicio o períodos mensuales (Debe, Haber, Saldo Deudor, Saldo Acreedor, Activo, Pasivo, Pérdida, Ganancia).
*   **Estado de Resultados (P&L):** Reporte dinámico de rentabilidad consolidado y desglosado por centros de costo (cada grúa o servicio se comportará como un centro de costo independiente).

---

## 4. Estrategia de Integración y Transición Contable (Laudus ERP)

Para resguardar la operatividad de GSP sin interrumpir su contabilidad actual, se establece una estrategia de migración en dos fases:

### Fase 1: Integración Bidireccional (Semanas 1-7)
*   **Clientes y Productos:** Los clientes y tarifas se consultan y sincronizan desde Laudus.
*   **Facturación:** El sistema envía los Estados de Pago valorizados aprobados a la base de datos de Laudus para que el personal contable emita la factura.
*   **Actualización de Estados:** Una vez que Laudus genera la factura, la API de LeanGlobal la captura online, actualiza la cuenta puente del devengado y cierra el ciclo.

### Fase 2: Migración Contable y Desconexión (Mes 6+)
*   Tras consolidar la Torre de Control y la marcha blanca operativa, se iniciará el plan de transición hacia el Módulo de Contabilidad Simple Nativa de LeanGlobal (duración estimada de **3 semanas** de marcha blanca en paralelo):
    1.  **Carga del Plan de Cuentas (Días 1-4):** Migración y cuadre inicial de saldos contables desde Laudus.
    2.  **Activación de Triggers (Días 5-10):** Habilitación de la auto-imputación de asientos (DTEs, compras de proveedores y viáticos de faena).
    3.  **Cuadre y Balances (Días 11-15):** Pruebas del Balance de 8 Columnas y P&L.
    4.  **Auditoría Paralela (Días 16-21):** Auditoría fina de consistencia de saldos entre Laudus y LeanGlobal. Al concluir la semana 3, se realiza la desconexión definitiva de Laudus ERP, operando de forma 100% nativa y eliminando costos de licenciamiento del ERP de terceros.

---

## 5. Requerimientos Funcionales Generales (Backlog de la Plataforma)

### Módulo 1: Torre de Control Operacional (Despacho y Kanban)
*   **RF-1.1:** Planificación mensualizada de maniobras de izaje, asociando grúa, contrapeso, camión de apoyo, operador y rigger.
*   **RF-1.2:** Acreditación de seguridad de grúas y personal con alertas de semáforo antes de despachar un equipo a faena.
*   **RF-1.3:** Panel Kanban interactivo de OTs (Planificadas, En Tránsito, En Faena, Ejecutadas, EDP Listo, Facturadas).
*   **RF-1.4:** Control de vigencia y almacenamiento digital de Permisos de Vialidad (Dirección de Vialidad - MOP) requeridos para el transporte y traslado de maquinaria pesada sobredimensionada/sobrepesada.

### Módulo 2: App del Operador en Terreno
*   **RF-2.1:** Registro digital de orómetro inicial y final por servicio de grúa.
*   **RF-2.2:** Realización obligatoria de AST (Análisis de Seguridad en el Trabajo) y Checklist Pre-operacional del equipo antes de iniciar la maniobra.
*   **RF-2.3:** Habilitación de Firma Electrónica Simple (FES) con código PIN para que el supervisor del cliente firme la conformidad del servicio (OT) a pie de grúa al terminar la maniobra.
*   **RF-2.4:** Registro obligatorio de inicio y fin de desplazamiento en ruta. La App móvil capturará y enviará coordenadas de geolocalización GPS (trazabilidad satelital) de manera automática cada 5 minutos a la Torre de Control hasta el término del trayecto.

### Módulo 3: Dashboard Financiero de Devengado
*   **RF-3.1:** Gráficos dinámicos de balance de facturación:
    *   *Monto Devengado en Faena* (OTs firmadas por el cliente pendientes de EDP/Facturación).
    *   *Monto Facturado* (Facturas emitidas y devengadas).
    *   *Monto Recibido en Caja* (Facturas cobradas y conciliadas).
*   **RF-3.2:** Indicadores de desviación presupuestaria y costos operacionales en tiempo real asociados a cada OT.

### Módulo 4: Arquitectura Multi-Empresa y Módulo Comercial (Sprint 1)
*   **RF-4.1 [Aislamiento Multi-Tenant]:** El sistema debe garantizar que los usuarios solo accedan a datos (proyectos, encuestas) pertenecientes a la empresa que tienen asignada (`id_empresa`). El backend debe interceptar el JWT y forzar este filtrado a nivel de base de datos en todas las consultas del Módulo de Operaciones.
*   **RF-4.2 [Rol de Vista Global]:** Los usuarios con perfil "Gerencia Global" deben poder bypassear el aislamiento por empresa. El frontend habilitará un selector de contexto para visualizar datos de una empresa específica o un consolidado de las 4 hermanas.
*   **RF-4.3 [Nacimiento Comercial - Preventa]:** Todo nuevo proyecto o cotización originada desde el área comercial debe insertarse obligatoriamente con el estado paramétrico de "Preventa", amarrado a la empresa originadora, usando un endpoint API especializado (`createProyectoPreventa`).
*   **RF-4.4 [Maestro de Empresas]:** El sistema debe proveer una interfaz de administración (CRUD) para visualizar y gestionar las 4 razones sociales que conforman el holding (tabla `tpar_empresas`).
*   **RF-4.5 [Maestro Único B2B]:** El sistema compartirá el catálogo maestro (`tpar_empresas`) para proveedores internos y clientes. Las 4 empresas del holding operarán con `flag_externo = false`, mientras que los clientes finales operarán con `flag_externo = true`. En la creación de servicios (`tpry_proyecto`), se trazará la relación exacta vinculando la empresa operadora (`id_empresa`) y la empresa receptora (`id_empresa_cliente`).

### Módulo 5: Gestor de Oportunidades y Cotizaciones (CRM Frontend)
*   **RF-5.1 [Estructurador de Oportunidad (Datos del Cliente y Servicio)]:** Interfaz principal (CRM) que debe mapear estrictamente los siguientes puntos clave del diagrama:
    *   **Datos del Cliente:** Empresa con la que se cotiza (San Pablo, Bestmaq, Logística, Royal), Razón Social, RUT, Dirección, Giro, Nombre de contacto, Número de contacto, Tipo de pago (efectivo, transferencia, crédito, débito, cheque, otros), Indicador de requerimiento OC/HES, Indicador de requerimiento de acreditación y qué documentos.
    *   **Datos Generales del Servicio:** Nombre de la obra, Dirección de la obra (con link de ubicación), Ciudad, Detalle del servicio a realizar, Tipo de carga, Peso de carga, Volumen de carga (largo/alto/ancho), Radios de trabajo, Alturas de trabajo, y un indicador de si se ejecutó visita a terreno.
    *   **Puntos Relevantes en Cotización:** Condición comercial del servicio: Programado (reserva de equipo y el cliente paga a todo evento) o A Disponibilidad (no asegura servicio, depende de disponibilidad).
*   **RF-5.2 [Creación Rápida de Clientes]:** Modal para capturar los datos esenciales del cliente (RUT, Razón Social, Giro, Dirección, Contactos) alineado con los requerimientos de RF-5.1 y guardarlos en `tpar_empresas` con `flag_externo = true`.
*   **RF-5.3 [Líneas de Servicio a Cotizar (Familias)]:** Pestaña interactiva que permite seleccionar de la lista estricta de Familias de Servicios: 1. Grúas Telescópicas, 2. Camiones Pluma, 3. Grúas Horquillas, 4. Camiones con rampla, 5. Manipuladores Telescópicos, 6. Plataformas articuladas, 7. Plataformas Tijeras, 8. Plataformas Telescópicas, 9. Servicios de personal acreditado. Generará un subtotal automático (Neto Cotizado).
*   **RF-5.4 [Transición Preventa y Cierre]:** El botón `GUARDAR EN PREVENTA` envía el payload al backend (disparando el RF-4.3). El botón `REGISTRAR Y GANAR (ASIGNAR)` hace transicionar la oportunidad comercial a un proyecto operativo formal, habilitando la asignación de recursos.
*   **RF-5.5 [Ciclo de Vida Comercial - Estados]:** Todo proyecto/cotización debe mantener estricta integridad referencial hacia una tabla paramétrica de estados (`tpry_estado`). El ciclo de vida de nacimiento comercial contempla 4 fases obligatorias: 1. "Oportunidad Registrada" (Nacimiento de la ficha sin líneas), 2. "Preparación de Cotización" (Ingreso de equipos y valores), 3. "Cotización Asignada" (Aprobación del cliente, salto a operación) y 4. "Cotización no Asignada" (Rechazo/Pérdida).
*   **RF-5.6 [Control de Versiones y Nomenclatura de Cotizaciones]:** Cada cotización generada tendrá un identificador correlativo único (`id_cotizacion`) obtenido de una secuencia de base de datos (`seq_id_cotizacion`). El nombre del archivo PDF generado debe seguir estrictamente el formato: `[CODI_PROYECTO]V[VERSION]-[ID_COTIZACION].pdf` (donde VERSION es la iteración del proceso y ID_COTIZACION es el valor de la secuencia). El historial del CRM debe desplegar al lado del link al PDF la fecha de generación y el monto neto cotizado real de esa versión sin simular datos.

---

### Módulo 6: Inventario WMS-Lite (RF-WMS)
*   **RF-WMS-01 [Maestro de Bodegas]:** Registro y control de bodegas por empresa (`id_empresa`) y sucursal.
*   **RF-WMS-02 [Catálogo de Productos]:** Maestro de repuestos e insumos con prefijo de SKU de 4 letras mayúsculas por empresa.
*   **RF-WMS-03 [Existencias y Lotes]:** Control de existencias físicas serializadas o por lotes con registro de `costo_adquisicion > 0` y `numero_oc` obligatorios (validaciones HTTP 422 `COSTO_CERO_NO_PERMITIDO` y `OC_REQUERIDA`).
*   **RF-WMS-04 [Movimientos de Stock]:** Bitácora transaccional de ingresos, despachos, traspasos y bajas.
*   **RF-WMS-05 [Traspaso entre Bodegas]:** Transferencia de existencias con estado "En Tránsito" y confirmación de recepción en destino.
*   **RF-WMS-06 [Despacho a Orden de Trabajo]:** Descuento directo de stock mediante escaneo de código de barras físico validando correspondencia con repuestos planificados (`REPUESTO_NO_CORRESPONDE`).
*   **RF-WMS-07 [Alertas de Stock Crítico]:** Alerta automática cuando el nivel disponible cae por debajo del `nivel_minimo`.

---

### Módulo 7: Mantenimiento y Gestión de Flota OTs (RF-MNT)
*   **RF-MNT-01 [Apertura de OT]:** Registro y apertura de Órdenes de Trabajo vinculadas a equipos activos (`tequ_equipo`), validando que el equipo no posea otra OT abierta (`EQUIPO_CON_OT_ACTIVA`).
*   **RF-MNT-02 [Checklist de Actividades]:** Definición y seguimiento de tareas/actividades planificadas por OT.
*   **RF-MNT-03 [Planificación e Imputación de Repuestos]:** Requerimientos de repuestos despachados desde el módulo WMS-Lite.
*   **RF-MNT-04 [Imputación de Mano de Obra HH]:** Registro de Horas Hombre por técnico con cálculo automático de costo (`horas * tarifa`).
*   **RF-MNT-05 [Servicios Externos]:** Imputación de trabajos contratados a terceros con número de documento de compra obligatorio.
*   **RF-MNT-06 [Cierre Autorizado con PIN]:** Cierre definitivo de OT que valida mediante Trigger en BD (`trg_chk_cierre_ot`) e Invariant API que no existan tareas ni repuestos pendientes, requiriendo el PIN de 4 dígitos del supervisor (`PIN_INVALIDO`).
