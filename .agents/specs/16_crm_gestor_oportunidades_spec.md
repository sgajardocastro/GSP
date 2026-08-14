# Especificación Técnica: Gestor de Oportunidades y Cotizaciones B2B

## 1. Objetivo y Alcance
Transformar el enfoque básico de "simulador de tarifas" en una herramienta **Enterprise (Gestor de Oportunidades)** capaz de estructurar negocios de alto valor (High-Ticket B2B). Este módulo permitirá modelar la complejidad operativa y financiera antes de que un proyecto pase a fase de ejecución.

## 2. Modelo de Datos: `Oportunidad Comercial`
Una oportunidad no es solo una "tarifa por horas", es un expediente comercial y técnico completo.

```javascript
{
  id: "OPP-2026-105",
  clienteId: "cmpc-celulosa",
  tituloProyecto: "Montaje Parada de Planta 2026 - Área Reactores",
  estado: "Evaluación Técnica", // Etapas: Calificación, Site Visit, Cotizado, Negociación, Ganado, Perdido
  prioridad: "Alta", // Normal, Alta (Fuego)
  
  // 1. Viabilidad y Terreno (Site Visit)
  siteVisit: {
    fechaVisita: "2026-06-28",
    ingenieroAsignado: "Ricardo Soto",
    restricciones: "Radio de giro limitado, cables de alta tensión a 15m.",
    documentos: ["plano_base_v1.pdf", "matriz_riesgos_prev.pdf"]
  },

  // 2. Líneas de Servicio (Multi-item)
  servicios: [
    { tipo: "Grúa Principal", equipo: "LTM 1220", cantidad: 1, unidad: "Horas", valorUnitario: 200000, subtotal: 16000000 },
    { tipo: "Grúa Apoyo (Tail-ing)", equipo: "LTM 1100", cantidad: 1, unidad: "Horas", valorUnitario: 130000, subtotal: 5200000 },
    { tipo: "Transporte Especial", equipo: "Cama Baja 4 Ejes", cantidad: 2, unidad: "Viaje", valorUnitario: 800000, subtotal: 1600000 },
    { tipo: "Personal", equipo: "Supervisor Rigger Alta Tonelaje", cantidad: 1, unidad: "Turno", valorUnitario: 250000, subtotal: 2500000 }
  ],

  // 3. Condiciones Comerciales
  comercial: {
    moneda: "CLP", // o USD, UF
    validezOfertaDias: 15,
    hitosFacturacion: [
      { hito: "Firma Orden de Compra", porcentaje: 30 },
      { hito: "Movilización de Equipos", porcentaje: 20 },
      { hito: "Cierre de Faena", porcentaje: 50 }
    ],
    montoNetoTotal: 25300000
  },

  // 4. Control de Versiones
  versionActual: "v2.1",
  historialVersiones: [ ... ]
}
```

## 3. UI / UX: Diseño de Interfaz y Campos de Oportunidad

La interfaz se divide en dos paneles principales: una columna lateral izquierda estática para la parametrización comercial del cliente/oportunidad, y un panel de pestañas a la derecha para la configuración técnica y estructuración.

### 📋 3.1. Panel Izquierdo: Datos del Cliente
Este bloque unifica y valida los datos de preventa, permitiendo el switch de contexto multi-tenant y la búsqueda inteligente conectada al backend:
- **a. Empresa Emisora (Cotizar a nombre de):** Selector obligatorio para definir qué empresa del grupo emite el cobro (SAN PABLO, BESTMAQ, LOGISTICA DEL SUR, ROYAL RENTAL).
- **b-e. Datos del Mandante (Buscador & Autocompletado):**
  - Input tipo *Autocomplete* conectado a la base de datos (con debounce de 300ms y mínimo 3 caracteres de input).
  - Permite buscar de forma dual por **Razón Social / Nombre** o por **RUT del Cliente** (sin puntos ni guiones).
  - Al seleccionar, auto-completa en la ficha: Razón Social, RUT Cliente, Dirección Comercial y Giro Comercial.
- **f-g. Puntos de Contacto Múltiples:** La entidad permite registrar un array de contactos asociados a la empresa (`json_field.puntos_contacto`). Cada contacto posee: Nombre, Correo, Teléfono y Observaciones. Al seleccionar un cliente, se despliega un selector para escoger el Contacto Específico para esta oportunidad, almacenando su referencia en `opportunity.value.json_field.crm_v1.contacto_id`.
- **h. Tipo de Pago:** Selector con opciones: Efectivo, Transferencia, Crédito, Débito, Cheque, Otros.
- **i. Requiere OC / HES:** Toggle/Checkbox para indicar si la facturación exige Orden de Compra u HES obligatoria.
- **j. Requiere Acreditación (Checklist Avanzado):** 
  - Toggle que habilita el panel de requerimientos documentales.
  - Se presenta una grilla visual de 3 columnas (Empresa, Equipos, Personas).
  - Cada columna lista las exigencias estáticas del mandante (ej. Empresa: F30, F30-1, Matriz de Riesgo; Equipos: SOAP, Revisión Técnica; Personas: Examen Ocupacional, Contrato).
  - El estado de cumplimiento se serializa y guarda en `opportunity.acreditacion_docs` (o `json_field.operaciones_v1.cumplimiento_acreditaciones`) permitiendo a Operaciones validar los documentos físicos con botones Toggle (OK / NO OK) en la vista de Validación (Diff).

### 🏗️ 3.2. Panel Derecho (Tab: Site Visit & Viabilidad): Datos Generales del Servicio
Formulario técnico descriptivo para la planificación e ingeniería de izajes:
- **a. Nombre de la Obra:** Nombre descriptivo del proyecto o parada de planta.
- **b. Dirección de la Obra:** Dirección física de destino y campo URL para enlace a Google Maps / GPS de ubicación.
- **c. Ciudad de la Obra:** Comuna/Ciudad del servicio.
- **d. Detalle del Servicio a realizar:** Área de texto extendido para describir la maniobra física.
- **e. Tipo de Carga:** Estructura, caldera, contrapesos, etc.
- **f. Peso de Carga:** Valor numérico en toneladas o kilogramos.
- **g. Volumen de Carga (Largo/Alto/Ancho):** Dimensiones físicas.
- **h. Radios de Trabajo:** Rango mínimo y máximo proyectados para la pluma.
- **i. Alturas de Trabajo:** Altura física proyectada para el gancho.
- **j. Visita a Terreno & Importación de Datos (Site Visit):**
  - Checkbox para indicar si se ejecutó visita a terreno técnica.
  - **Mecanismo de Conexión de Datos:** Al activarse, habilita un selector desplegable de inspecciones/visitas ya completadas y aprobadas en terreno (`tsrv_survey`).
  - Al seleccionar una visita, el sistema realiza una consulta asíncrona a la base de datos y **rellena automáticamente** todos los datos generales de la obra y maniobra (campos a a i anteriores) reduciendo el reingreso de información.

## 3.3. Estructurador de Servicios, Catálogo de Unidades y Reglas Comerciales de Flete / Fijo

### A. Catálogo Estandarizado de Unidades de Cobro (`line.unidad`)
En la grilla del estructurador de cotización (`lines`), la columna **Unidad de Cobro** expone los valores limpios y estandarizados:

* `Horas`: Cobro por hora de servicio efectivo.
* `Diario`: Cobro por jornada / mínima diaria.
* `Semanal`: Cobro por semana de servicio.
* `Mensual`: Cobro por mes / mínima mensual.
* `Fijo`: Monto global cerrado (Suma Alzada).

---

### B. Reglas de Negocio de los Flags y Comportamientos Detallados

A continuación, se detalla el comportamiento exacto de los 5 *Flags* operativos y comerciales de la Oportunidad, acompañados de sus casos de uso, impacto en el PDF y el flujo de operaciones:

#### 1. Requiere OC / HES (Orden de Compra / Hoja de Entrada de Servicios)
- **Concepto:** Indica si el mandante exige estrictamente la emisión de una OC o HES formal para poder aceptar facturas por los servicios prestados.
- **Caso de Uso:** Arriendo de Grúa para CMPC. Con el flag en `ON`, al finalizar la faena y pasar el expediente a **Facturación (EDP)**, el sistema bloquea al analista de cobranzas impidiéndole emitir y enviar la factura hasta que suba a la plataforma el documento oficial (OC o HES) enviado por CMPC.
- **Impacto en PDF:** No altera la visualización del PDF de la cotización comercial.

#### 2. Requiere Acreditación
- **Concepto:** Determina si el cliente o la faena específica exige que tanto la maquinaria como el personal pasen por un proceso formal de acreditación (subida de documentos, certificaciones, pases, etc.) antes de ingresar a faena.
- **Caso de Uso:** Al marcar la oportunidad como "Ganada" con el flag en `ON`, el sistema detona en paralelo (de manera asincrónica) una fase exclusiva de **Acreditación**. Operaciones puede ir armando la tripulación, pero el sistema generará advertencias de seguridad y bloqueos si se intenta despachar a terreno a un operador o grúa que aún no tenga la acreditación aprobada (luz verde).

#### 3. Servicio Incluye Traslado (Flete)
- **Concepto:** Define cómo se presenta y gestiona comercialmente el costo de movilización de los equipos.
- **Caso de Uso:** Al encender el flag (ON), el sistema agrega automáticamente al Estructurador Económico una línea de Flete por un monto unitario predefinido de `$500.000` (Categoría: `TRASLADOS`, Cantidad: `1`, Unidad: `Fijo`).
- **Comportamiento en UI:** Si el flag se desmarca (OFF), la línea de Flete asociada se elimina de forma automática de la tabla de servicios.
- **Impacto en PDF:** 
  * Si el valor de la línea de flete en el estructurador es mayor a `$0`, aparece una línea explícita detallando "Servicio de Traslado/Flete: $500.000" (o el monto modificado).
  * Si la línea es eliminada (o su valor unitario se modifica a `$0`), la fila se oculta del PDF de la Cotización.

#### 4. Requiere Rigger (Sincronización Bidireccional)
- **Concepto:** Especifica si la maniobra exige normativamente la presencia de un Rigger certificado.
- **Sincronización Bidireccional (Flag ↔ Estructurador):**
  * **Flag a Estructurador:** Si el flag se marca en `SÍ` (ON), se agrega automáticamente al estructurador la línea de Rigger (Categoría: `PERSONAL CERTIFICADO`, Subcategoría: `RIGGER`, Cantidad: `1`, Unidad: `Diario`, Valor: `$0`).
  * **Estructurador a Flag:** Si el flag está en `NO` (OFF) y el usuario agrega manualmente una línea con la subcategoría `RIGGER`, el flag de la columna izquierda se enciende automáticamente (ON) por sí solo.
  * **Limpieza:** Si el flag de Rigger se desmarca (OFF), la línea de Rigger del estructurador se elimina automáticamente.
- **Impacto en PDF:** Debe mostrarse explícitamente si el servicio incluye Rigger o no, mostrando una línea fija con: **REQUIERE RIGGER: SÍ** (en negrita) o **REQUIERE RIGGER: NO** (en gris).
- **Impacto Operativo (Asignación):** Al pasar a la etapa de Asignación, el despachador verá un requerimiento obligatorio en pantalla que dice "Asignar Rigger".

#### 5. Combustible a Cargo del Cliente
- **Concepto:** Aclara legal y operativamente quién asume el suministro y costo del petróleo (Diésel) que consumirá la grúa durante la operación.
- **Caso de Uso:** Arriendo mensual "Dry" (operación en seco). Con el flag en `ON`:
  * **Impacto Comercial (PDF):** En la cotización, sección *“2. DATOS DE OPERACIÓN E INGENIERÍA”*, se plasma de forma explícita que el combustible corre por cuenta y responsabilidad del cliente.
  * **Impacto en Facturación:** No interviene en la matriz de asignación, pero en el EDP de facturación del cierre de mes, el sistema le recordará visualmente este acuerdo al analista para evitar cobrar un recargo erróneo o facilitar la facturación de cobros por combustible de emergencia.

---

### C. Escenarios de Pruebas Integradas E2E (Gherkin/BDD para QA)

Para asegurar la correcta operación del Gestor de Oportunidades y el ciclo de vida de los flags, la suite de pruebas del QA (Juan Manuel) debe validar los siguientes escenarios:

```gherkin
Feature: Gestor de Oportunidades y Cotizaciones B2B
  Como Analista Comercial y de Operaciones
  Quiero estructurar oportunidades de izaje con flags comerciales integrados
  Para asegurar cotizaciones transparentes y bloqueos operativos deterministas

  Background:
    Given que el usuario está autenticado en la plataforma web DEV
    And se encuentra en la pantalla de "Gestor de Oportunidades"
    And selecciona la Empresa Emisora "SAN PABLO"
    And busca y selecciona al Cliente Mandante "CONSTRUCTORA POCURO SPA"
    And selecciona el contacto y el Tipo de Pago "Transferencia"

  Scenario: Inyección y Limpieza del Flete
    When el usuario activa el switch "Servicio incluye Traslado"
    Then se debe agregar automáticamente una línea en el estructurador con Categoría "TRASLADOS" y Valor Unitario 500000
    When el usuario desmarca el switch "Servicio incluye Traslado"
    Then la línea con Categoría "TRASLADOS" debe eliminarse automáticamente del estructurador

  Scenario: Sincronización Bidireccional de Rigger
    When el usuario activa el switch "Requiere Rigger / Señalero"
    Then se debe agregar automáticamente una línea en el estructurador con Categoría "PERSONAL CERTIFICADO" y Subcategoría "RIGGER"
    When el usuario desmarca el switch "Requiere Rigger / Señalero"
    Then la línea con Subcategoría "RIGGER" debe eliminarse automáticamente
    When el usuario agrega manualmente una línea con Categoría "PERSONAL CERTIFICADO" y Subcategoría "RIGGER"
    Then el switch "Requiere Rigger / Señalero" del panel izquierdo debe activarse (ON) automáticamente

  Scenario: Visibilidad Condicional en el PDF de Cotización
    When el usuario activa el switch "Servicio incluye Traslado" con valor 500000
    And activa el switch "Requiere Rigger / Señalero"
    And activa el switch "Combustible a Cargo del Cliente"
    And hace clic en "Generar Cotización"
    Then el PDF generado debe contener la línea "Servicio de Traslado/Flete: $500.000"
    And debe contener el texto "REQUIERE RIGGER: SÍ"
    And debe contener el texto "Combustible a Cargo del Cliente: SÍ" (o equivalente)
    When el usuario desmarca el switch "Servicio incluye Traslado"
    And desmarca el switch "Requiere Rigger / Señalero"
    And hace clic en "Generar Cotización"
    Then la línea "Servicio de Traslado/Flete" debe estar oculta en el PDF
    And el PDF debe mostrar "REQUIERE RIGGER: NO"

  Scenario: Bloqueo de Confirmación OT en Operaciones por falta de Rigger (Hard-Stop)
    Given que la oportunidad tiene activo el switch "Requiere Rigger / Señalero"
    And el usuario hace clic en "Generar Requerimiento" para pasar el proyecto a operaciones
    When el usuario ingresa a la pestaña de "Asignación de Recursos" (Torre de Control)
    And deja vacío el campo de asignación de Rigger en la Tripulación
    And hace clic en el botón de confirmación "Confirmar OT"
    Then el sistema debe bloquear el guardado de la asignación
    And debe desplegar una alerta nativa: "⚠️ Requerimiento Obligatorio: La Oportunidad exige un Rigger certificado. Debes Asignar Rigger"
    When el usuario selecciona un Rigger certificado válido
    And hace clic en "Confirmar OT"
    Then el sistema debe guardar la asignación exitosamente y cambiar el estado del proyecto
```

---

### D. ⚠️ Puntos Críticos Aún Pendientes a Clarificar con el Cliente

> [!IMPORTANT]
> **PUNTO DE AUDITORÍA COMERCIAL: IMPACTO DE LA UNIDAD "FIJO" (SUMA ALZADA)**
> 1. **Naturaleza de "Fijo":** La unidad `Fijo` debe incluirse en el catálogo para representar montos cerrados por maniobra o servicio puntual.
> 2. **📌 PENDIENTE ESENCIAL CON EL CLIENTE:** Clarificar la lógica del calculador:
>    - ¿Seleccionar la unidad `Fijo` otorga un precio cerrado independiente de la composición detallada de cantidad/valor unitario de las líneas en el estructurador?
>    - ¿O aplica únicamente como etiqueta de cobro por línea sin alterar la suma del estructurador?

---

## 4. Flujo Operativo, Asignación de Recursos y Validaciones

### 4.1. Ciclo de Vida de la Oportunidad
- **Inicio:** Se crea la oportunidad desde el Kanban de Preventa o desde la Ficha 360 del Cliente, usando el botón "Nueva Oportunidad".
- **Desarrollo:** El equipo comercial busca al cliente (RUT o Nombre), se auto-completan los campos del mandante y se ingresan las condiciones de pago.
- **Carga Técnica:** El usuario puede digitalizar a mano la viabilidad del servicio o importar un reporte de *Site Visit* previo (trayendo los datos generales e izaje directo desde las respuestas de la base de datos).
- **Cierre (Win):** Al marcar el estado como **"Ganado / Aprobado"** (o presionar "Generar Requerimiento"), el sistema cierra el expediente de preventa en `tpry_proyecto` e inyecta la orden en la Torre de Control (`sch_leangsp`).

### 4.2. Validación Operativa en Asignación (Torre de Control)
El sistema impone una regla dura en caliente (hard-stop) al momento de asignar los recursos físicos para las Órdenes de Trabajo (OT) originadas de oportunidades con requerimientos específicos:

- **Validación de Rigger:** Si el registro del proyecto tiene el flag `requiere_rigger === true`, el controlador backend y el validador frontend en la función `confirmarAsignacionOT` exigen obligatoriamente la presencia de al menos un recurso con perfil de **Rigger** asignado en la grilla de tripulación. En caso de ausencia, se cancela la confirmación de la OT para mitigar riesgos normativos y de seguridad en terreno.
