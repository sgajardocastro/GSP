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
- **Impacto en PDF:** Debe mostrarse explícitamente: **• Requiere Rigger:** `SÍ` / `NO`.
- **Impacto Operativo (Asignación):** Al pasar a la etapa de Asignación, el despachador verá un requerimiento obligatorio en pantalla que dice "Asignar Rigger".

#### 5. Prevencionista Certificado (Sincronización Bidireccional)
- **Concepto:** Especifica si la maniobra exige la presencia de un Prevencionista de Riesgos Certificado.
- **Sincronización Bidireccional (Flag ↔ Estructurador):**
  * **Flag a Estructurador:** Si el flag se marca en `SÍ` (ON), se agrega automáticamente al estructurador la línea (Categoría: `PERSONAL CERTIFICADO`, Subcategoría: `PREVENCIONISTA`, Cantidad: `1`, Unidad: `Diario`, Valor: `$0`).
  * **Estructurador a Flag:** Si el flag está en `NO` (OFF) y el usuario agrega manualmente una línea con subcategoría `PREVENCIONISTA`, el flag se enciende automáticamente (ON).
  * **Limpieza:** Si el flag se desmarca (OFF), la línea de Prevencionista se elimina automáticamente.
- **Impacto en PDF:** Debe mostrarse explícitamente: **• Prevencionista Certificado:** `SÍ` / `NO`.

#### 6. Proyección de Costos de Pensiones (Base para EDP)
Apertura en 5 conceptos independientes (cada uno con selector de pagador: `Costeado por Cliente` / `Costeado por San Pablo` / `No Aplica (N/A)` y campo de valorización monetaria `$CLP`):
1. **Alojamiento**
2. **Alimentación - Desayuno**
3. **Alimentación - Almuerzo**
4. **Alimentación - Cena**
5. **Traslado Personal**

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
    When el usuario activa el switch "Requiere Rigger"
    Then se debe agregar automáticamente una línea en el estructurador con Categoría "PERSONAL CERTIFICADO" y Subcategoría "RIGGER"
    When el usuario desmarca el switch "Requiere Rigger"
    Then la línea con Subcategoría "RIGGER" debe eliminarse automáticamente
    When el usuario agrega manualmente una línea con Categoría "PERSONAL CERTIFICADO" y Subcategoría "RIGGER"
    Then el switch "Requiere Rigger" del panel izquierdo debe activarse (ON) automáticamente

  Scenario: Sincronización Bidireccional de Prevencionista Certificado
    When el usuario activa el switch "Prevencionista Certificado"
    Then se debe agregar automáticamente una línea en el estructurador con Categoría "PERSONAL CERTIFICADO" y Subcategoría "PREVENCIONISTA"
    When el usuario desmarca el switch "Prevencionista Certificado"
    Then la línea con Subcategoría "PREVENCIONISTA" debe eliminarse automáticamente
    When el usuario agrega manualmente una línea con Categoría "PERSONAL CERTIFICADO" y Subcategoría "PREVENCIONISTA"
    Then el switch "Prevencionista Certificado" del panel izquierdo debe activarse (ON) automáticamente

  Scenario: Visibilidad Condicional en el PDF de Cotización
    When el usuario activa el switch "Servicio incluye Traslado" con valor 500000
    And activa el switch "Requiere Rigger"
    And activa el switch "Prevencionista Certificado"
    And hace clic en "Generar Cotización"
    Then el PDF generado debe contener la línea "Servicio de Traslado/Flete: $500.000"
    And debe contener el texto "• Requiere Rigger: SÍ"
    And debe contener el texto "• Prevencionista Certificado: SÍ"
    And debe contener el texto "• Incluye Traslado / Flete: SÍ"
    And debe contener el texto "• Requiere Acreditación: SÍ" (o NO según corresponda)
    When el usuario desmarca el switch "Servicio incluye Traslado"
    And desmarca el switch "Requiere Rigger"
    And hace clic en "Generar Cotización"
    Then la línea "Servicio de Traslado/Flete" debe estar oculta en el PDF
    And el PDF debe mostrar "• Requiere Rigger: NO"

  Scenario: Bloqueo de Confirmación OT en Operaciones por falta de Rigger (Hard-Stop)
    Given que la oportunidad tiene activo el switch "Requiere Rigger"
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

## 3.4. Acuerdos Comerciales Dinámicos y Condiciones para Cotización (Tab 3: Condiciones Comerciales)

Las cláusulas y condiciones comerciales se estructuran de forma modular y reactiva según las categorías de servicios agregadas en el **Estructurador de Servicios** (`lines`).

### A. Reglas de Detección e Inclusión por Categoría Oficial
1. **Categoría `TRASLADOS`:**
   - **Regla de Activación:** Se activa cuando en el estructurador existe al menos una línea con categoría `tipo === 'TRASLADOS'` (ya sea agregada manualmente o detonada automáticamente por el switch *"Servicio incluye Traslado"*), independiente de la subcategoría seleccionada.
   - **Texto Canónico:**
     ```text
     TRASLADOS:
     Observaciones: 
     Traslado incluye seguro de carga Traslado con sobredimensión deben solicitarse con 10 días de anticipación Valor no considera sobreestadía Guías de Traslados son responsabilidad del cliente Todos los Valores son más Iva Carga y descarga de maquinarias y equipos externos son responsabilidad de cliente.
     ```

3. **Categoría `GRUA TELESCOPICA` (o `GRÚA TELESCÓPICA`):**
   - **Regla de Activación:** Se activa cuando en el estructurador existe al menos una línea con categoría de izaje (`GRUA TELESCOPICA`, `GRÚA TELESCÓPICA` o `CAMIÓN PLUMA`).
   - **Texto Canónico:**
     ```text
     GRUA TELESCOPICA:
     Observaciones: 
     a. La hora de la máquina comenzará a regir desde que esta sale de nuestras bodegas; Salvo que se cobre Flete por traslado. 
     b. Las Máquinas se ocuparán en faenas de acuerdo a sus condiciones y capacidad, para lo cual han sido diseñadas. 
     c. Se entenderá por hora Máquina, el tiempo de reloj durante el cual estén disponible para el cliente; solo se considerara 1 hora de colación como máximo 
     d. Será por cuenta del cliente el traslado de contrapesos durante y dentro del recinto de faena. 
     e. Si la maquinaria trabajase menos de las horas mínimas el cliente igual debera cancelar el mínimo de horas pactadas en esta cotización. 
     f. Será responsabilidad del cliente informar sobre la resistencia y condiciones del terreno y/o área de trabajo, en caso contrario ARRIENDO SAN PABLO se desliga de cualquier responsabilidad por daños que la Máquina pueda ocasionar. 
     g. La factura deberá cancelarse a los 30 días de su fecha de emisión, siempre y cuando el cliente tenga un crédito aprobado de 30 días. 
     h. En caso de que el CLIENTE no necesitará la máquina o suspendiera el servicio una vez que esta haya salido desde nuestras instalaciones, el cliente deberá cancelar la tarifa mínima de la máquina en cuestión. 
     i. Si por fuerza mayor, ante algún evento inesperado (maquinarias encerradas en faenas, pannes, congestión del tránsito, etc.) la grúa se ve impedida de llegar en día y hora programada, no corresponderá ningún tipo de descuento ni cobro a ARRIENDO SAN PABLO tampoco corresponderá el endoso de multas o infracciones de cualquier tipo a ARRIENDO SAN PABLO 
     j. La presente cotización tiene una validez de 05 días. 
     k. Maquinaria sujeta a disponibilidad 
     l.Todos los valores son más iva.
     ```

4. **Categoría `PLATAFORMAS`:**
   - **Regla de Activación:** Se activa cuando en el estructurador existe al menos una línea con categoría `PLATAFORMAS` (alzahombres, tijeras, manlifts).
   - **Texto Canónico:**
     ```text
     PLATAFORMAS:
     Observaciones: 
     - Equipo se Arrienda sin Operador - Las máquinas se ocuparan en faenas de acuerdo a sus condiciones y capacidad, para lo cual han sido diseñadas 
     - No utilizar el equipo como arco de soldadura, las baterías pueden explotar y de igual forma pueden generar daños en el sistema electrónico. 
     - Todos los daños a neumáticos, ya sean por cortes laterales, escalonamientos o simplemente pinchaduras, serán con cargo al cliente. - Todos los daños estéticos producto de la aplicación de pinturas, quemaduras por soldaduras, shotcrete o recubrimientos serán con cargo al cliente 
     - Todos los daños producto de choques o golpes por descuido o mala operación, serán con cargo al cliente. 
     - En caso que el equipo no responda de la forma correcta se debe informar de inmediato al servicio técnico San Pablo y no seguir intentando operar este, ya que este tipo de manipulación puede generar mayores daños, los que serán de cargo al cliente. - En caso que la falla del equipo se haya generado por una mala operación, será de cargo al cliente todos los costos de reparación, incluida la visita del mecánico a obra (MO, viático, combustible, traslados, etc). 
     - El cliente debe informar con 48 horas de anticipación el retiro del equipo mediante correo electrónico al vendedor y encargado de logística de empresas San Pablo. - El horario habíl de retiro de equipos será de lunes a sábado desde las 08:00 a 10:00 am, después de ese horario se cobrará otro día, al menos que empresas San Pablo avise retiro programado en otro horario. 
     - Al momento de proceder con el retiro del equipo de faena se ejecutará un levantamiento rápido indicando todos los daños (en caso de existir), este documento debe ser firmado por el supervisor de faena. Si existieran otros daños no visualizados al momento de retirar el equipo, se le informará a la brevedad al cliente y los costos de reparación será de cargo de este. 
     - Plataformas Eléctricas; se aconseja no descargar baterías en su totalidad, dado que esto daña los componentes eléctrico y electrónicos incluido el cargador, si llegara a ocurrir los costos de reparación serán cobrados al cliente. Otro punto importante es que la recarga de baterías no puede ser ejecutada con generadores, debido a que producen daños en las placas de carga. 
     - Plataformas a Combustión; las plataformas que utilicen para su operación combustible diesel serán entregadas con su estanque lleno, por lo que la recepción del equipo en nuestra planta debe ser en la misma condición, de lo contrario se procederá a la recarga de los litros faltantes y el costo por litro será de $1000 más iva. Los motores a combustión no deben quedar sin combustible, ya que los daños por este motivo serán de costo del cliente. 
     - La presente cotización tiene una validez de 5 días. 
     - Maquinarias sujetas a disponibilidad. 
     - Todos los valores son más IVA.
     ```

### B. Comportamiento en UI / UX
1. **Generación Automática:** Al poblar o actualizar las líneas de servicio en la oportunidad, el sistema pre-arma el texto concatenado de las categorías activas en `comercial.condiciones_texto_pdf`.
2. **Libertad Total de Edición:** El usuario tiene total libertad para modificar, agregar o suprimir cláusulas directamente en el textarea. Si la oportunidad ya contiene un texto guardado previamente, este se respeta y no se sobrescribe sin acción del usuario.
3. **Botón de Regeneración Manual:** Se dispone de un botón de acción *"Regenerar Acuerdos según Servicios"* en el Tab 3 para que el ejecutivo pueda reconstruir en cualquier momento el texto oficial de las categorías cotizadas.


---

## 4. Flujo Operativo, Asignación de Recursos y Validaciones (Torre de Control & Pestaña C)

### 4.1. Ciclo de Vida del Expediente Integral (Core Pipeline)
- **Fase 1 (Preventa Comercial):** Búsqueda de cliente, estructurador multi-línea, viabilidad técnica/site visit, condiciones comerciales y despacho de cotización PDF.
- **Fase 2 (Estudio & Validación Técnica):** Análisis de diferencias (*Diff Check*) entre el requerimiento comercial y el levantamiento real de terreno, aprobación técnica por el coordinador.
- **Fase 3 (Asignación de Recursos OT):** DataGrid de Flota & Equipos vs Tripulación & Personal, aparejos e insumos de izaje, ventanas de tiempo planificadas.
- **Fase 4 (Acreditaciones & Dossier B2B):** Validación de matrices de cumplimiento documental y despacho formal del dossier al cliente mandante.
- **Fase 5 (Preparación de Salida / Patio):** Generación inmutable de la OT, checklist de despacho y ejecución de faena.

---

### 4.2. Reglas Canónicas de Negocio y Dominio

#### A. Regla Canónica 1: Terminología Oficial de Rigger
* Queda establecido como regla canónica inviolable en todo el producto que la denominación oficial es **`Rigger`**.
* Queda estrictamente prohibido el uso de los términos `Señalero` o `Rigger / Señalero`.

#### B. Regla Canónica 2: Catálogo de Cargos Operacionales de Tripulación
Los cargos estandarizados para la tripulación son:
1. `Operador Grúa`
2. `Operador Camión Pluma`
3. `Rigger`
4. `Prevencionista de Riesgos`
5. `Chofer Cama Baja`
6. `Escolta / Guía`
7. `Supervisor Faena`

#### C. Regla Canónica 3: Separación Semántica Flota vs. Tripulación
Al procesar las líneas comerciales de la cotización (`lines`):
* **Tabla 1 (`🚜 1. Flota & Equipos`):** Se filtran y muestran exclusivamente líneas que representen maquinaria y equipos físicos (`GRUAS TELESCOPICAS`, `CAMIONES PLUMA`, `VEHICULOS LIVIANOS`, `MAQUINARIA`, `EQUIPOS DE APOYO`, `TRASLADOS`). Ninguna persona o servicio humano puede aparecer en esta tabla.
* **Tabla 2 (`👷 2. Tripulación & Personal Asignado`):** Se sincronizan automáticamente todas las líneas comerciales de personal certificado (`PERSONAL CERTIFICADO`, `Servicio de Rigger Certificado`, `Servicio de Prevencionista Certificado`). Además, el coordinador puede añadir tripulantes adicionales bajo demanda (`+ Añadir Tripulante`).

#### D. Regla Canónica 4: Inmutabilidad de Recursos Contractuales (Línea Base 🔒 vs. Recursos Adicionales 🗑️)
* **Obligación Contractual Inmutable (`🔒`):** Todo equipo o puesto de personal originado de una línea comercial cotizada y aprobada (ej: Grúa Principal, Rigger cotizado, Prevencionista cotizado):
  - Queda protegido con indicador de candado `🔒` y no puede ser eliminado por el coordinador operativo.
  - El cargo operacional permanece fijado al compromiso comercial, permitiendo exclusivamente seleccionar la persona idónea para cumplir el servicio.
* **Recursos Adicionales Operativos (`🗑️`):** Únicamente los recursos extra incorporados ad-hoc en la fase de Operaciones (`+ Añadir Apoyo`, `+ Añadir Tripulante`) disponen del botón de eliminación `🗑️`.

---

### 4.3. Arquitectura de Interfaz DataGrid B2B (Layout 2 Columnas Lado a Lado)

La interfaz de la Pestaña C se estructura en una cuadrícula simétrica de alta densidad para evitar scroll vertical innecesario y aprovechar el 100% del ancho de pantalla en monitores operacionales:

```
+---------------------------------------------------------------------------------------------------+
| TOOLBAR SUPERIOR: [🚜 Asignación de Recursos OT] [APROBADO] | [Salida Base] ➔ [Término Faena] [⚡ Propagar] |
+-----------------------------------------------------------------+---------------------------------+
| COLUMNA IZQUIERDA (50%)                                         | COLUMNA DERECHA (50%)           |
| 🚜 1. Flota & Equipos (Principales y Apoyo)     [+ Añadir Apoyo] | 👷 2. Tripulación & Personal   [+ Añadir]       |
| • Requerimiento | Equipo Asignado (Semáforo) | Ventana Fechas   | • Cargo | Persona (Semáforo) | Ventana Fechas   |
| • Grúa Telescópica ➔ [LTM 1220 - GR-1234 🟢] | [Ini] - [Fin]    | • Operador ➔ [Juan Pérez 🟢] | [Ini] - [Fin]    |
| • Camión Escolta   ➔ [Hilux - BB-CL-99 🟢]   | [Ini] - [Fin]    | • Rigger   ➔ [Pedro Soto 🟢] | [Ini] - [Fin]    |
|                                                                 | • Prevencionista ➔ [C. Varas 🟢] | [Ini] - [Fin]|
+-----------------------------------------------------------------+---------------------------------+
| 📋 Referencia: Levantamiento Visita a Terreno                   | ⛓️ 3. Matriz de Aparejos & Implementos          |
| • Visita #ID [APROBADO] [👁️ Ver Web] [📄 PDF]                   | • [x] Grilletes Lira [ Detalle capacidad ]     |
| 💬 Instrucciones / Observaciones Operativas de Faena            | • [x] Eslingas Sintéticas [ Detalle largo ]     |
| [ Textarea compacto ]                                           | • [x] Balancines [ Detalle toneladas ]          |
+-----------------------------------------------------------------+---------------------------------+
```

---

### 4.4. Tipografía y Estándares de Accesibilidad B2B

* **Inputs de Fecha y Hora (`<input type="date">` / `<input type="time">`):** Tamaño estándar `text-xs` (12px), `font-mono font-bold`, color blanco `#ffffff`, padding `px-2 py-1`.
* **Encabezados de Tabla:** `text-[10px]` a `text-[11px]` font-bold en color `slate-300` con `tracking-wider`.
* **Badges de Semáforo (`🟢 VIG`, `🟡 VNC`, `🔴 VNC`):** `text-[10px]` font-bold con padding `px-1.5 py-0.5`.
* **Controles Select y Textareas:** Fondo `#0a0f1e`, borde `white/10`, focus `amber-500/50`.

---

### 4.5. Protocolo de Persistencia y Máquina de Estados

1. **Estado en Base de Datos:** `tpry_proyecto.id_proyecto_estado = 3` (*Operaciones*).
2. **Subpestaña Activa:** `json_field.ejecucion_v1.subtab_activa = 'asignacion'`.
3. **Persistencia Dual:**
   * **JSON Inmutable:** `json_field.ejecucion_v1` contiene la instantánea de `tripulacion_asignada`, `equipos_extra`, `observaciones` y `aparejos_asignados_json`.
   * **Tablas Relacionales SQL (Spec 22):** Inserción en `tpry_rel_persona` y `tpry_rel_equipo` con claves foráneas e intervalos temporales `fecha_plan_ini` y `fecha_plan_fin`.
4. **Hard-Stop de Validación:** Si `requiere_rigger === true`, la confirmación de la OT exige obligatoriamente la asignación de al menos un `Rigger` con `id_user` válido. De lo contrario, se bloquea la confirmación.

---

### 4.6. Micro-Diálogo / Popover de Acreditaciones de Recursos (Inspect-on-Click)

Para optimizar la agilidad del coordinador sin abandonar la pantalla de Asignación:
* **Trigger:** Al hacer clic sobre cualquier badge semafórico (`🟢 VIG`, `🟡 VNC`, `🔴 VNC`) en la tabla de Flota o Tripulación, se despliega un diálogo modal flotante.
* **Contenido del Diálogo:**
  1. **Encabezado:** Nombre del Recurso, Patente/RUT y Rol Operacional.
  2. **Matriz de Documentos:**
     * **Personal:** Examen Ocupacional, Licencia de Conducir, Certificación Rigger/Operador, Contrato de Trabajo, Inducción Faena.
     * **Equipos:** Revisión Técnica, SOAP, Permiso de Circulación, Certificado de Izaje/Carga, Póliza de Seguro.
  3. **Indicadores de Vencimiento:** Fecha exacta de expiración y badge visual (`🟢 Vigente`, `🟡 Por Vencer (≤30 días)`, `🔴 Vencido`).
  4. **Acceso Rápido:** Enlace directo para visualizar o descargar el archivo PDF del repositorio si existe.

---

### 4.7. Matriz Canónica de Aparejos & Implementos de Izaje (Catálogo Maestro 8 Ítems)

Para garantizar consistencia integral entre la Inspección en Terreno (Survey), el Reporte PDF y la Asignación Operacional de la OT:

1. **Catálogo Maestro Homologado:**
   1. `estrobos`: Estrobos de Acero (Keywords: `ESTROBO`, `ESTROBOS`)
   2. `eslingas`: Eslingas Sintéticas (Keywords: `ESLINGA`, `ESLINGAS`)
   3. `grilletes`: Grilletes Lira / Rectos (Keywords: `GRILLETE`, `GRILLETES`, `GRILLETON`)
   4. `pulpos_cadena`: Pulpos de Cadena (Keywords: `PULPO`, `PULPOS`, `PULPO CADENA`)
   5. `cadenas`: Cadenas de Izaje (Keywords: `CADENA`, `CADENAS`)
   6. `balancines`: Balancines / Vigas de Izaje (Keywords: `BALANCIN`, `BALANCINES`, `VIGA`)
   7. `canastillos`: Canastillo Alza Hombres (Keywords: `CANASTILLO`, `CANASTILLOS`, `CANASTA`)
   8. `otros_accesorios`: Otros / Accesorios Especiales (Keywords: `ACCESORIO`, `ACCESORIOS`, `OTRO`, `OTROS`)

2. **Comportamiento en Asignación (Pestaña C):**
   * Se presentan **siempre las 8 tarjetas maestras**.
   * Los aparejos registrados con cantidad en la visita a terreno se marcan automáticamente como `[x] REQ` con su detalle de capacidad/largo precargado.
   * Los elementos que vinieron en 0 o desmarcados desde terreno aparecen desmarcados `[ ]`, pero **el Coordinador de Operaciones puede activarlos en cualquier momento e ingresar cantidades/especificaciones adicionales** según el plan de maniobra.
   * Persistencia estructurada en `json_field.ejecucion_v1.aparejos_asignados_json`.

---

## 5. Modelo Asíncrono de Acreditación y Visualización en Tablero Kanban

### 5.1. Naturaleza Asíncrona y Paralela de la Acreditación
1. **Desacoplamiento Operativo:** La Acreditación documental (Dossier B2B / FES / Certificados de Equipos y Personas) es un subproceso asíncrono que no detiene el ciclo de vida del servicio en las fases de Operaciones (Preparación de Patio / Despacho / En Faena).
2. **Eliminación de la Columna Artificial "En Acreditación":** Queda formalmente eliminada la columna "En Acreditación" del tablero Kanban y de la Torre de Control. Las oportunidades y OTs se clasifican exclusivamente en las etapas canónicas relacionales (`tpry_proyecto.id_proyecto_estado`):
   - **Cotización / Preventa** (`id_proyecto_estado = 1`)
   - **Validación Comercial-Técnica** (`id_proyecto_estado = 2`)
   - **Preparación de Operaciones / Patio** (`id_proyecto_estado = 3` o `5`)
   - **En Ejecución / Faena** (`id_proyecto_estado = 6` o `7`)
   - **Finalizado / Completado** (`id_proyecto_estado = 8`)

### 5.2. Gauge de Cumplimiento Documental en Tarjetas de Kanban
Cada tarjeta de servicio en el tablero Kanban (independientemente de su columna o estado operativo) incorpora un componente visual de progreso (Gauge / Barra de Porcentaje de Acreditación):

1. **Fórmula Determinista de Cumplimiento:**
   $$\% \text{ Acreditación} = \left( \frac{\sum \text{Documentos Vigentes (Empresa + Equipos Asignados + Personal Asignado)}}{\sum \text{Total Documentos Exigidos por el Cliente}} \right) \times 100\%$$

2. **Regla de Semáforo Binario Estricto:**
   - **`🟢 VERDE (100%)`:** Única y exclusivamente cuando la totalidad de los documentos exigidos estén vigentes y validados (`% Acreditación === 100%`).
   - **`🔴 ROJO (0% - 99%)`:** Si existe al menos un documento pendiente, vencido o no vinculado (`% Acreditación < 100%`), el gauge se renderiza en **color rojo**, advirtiendo que el servicio no cuenta con pase libre de faena.

3. **Interactividad:** Al hacer clic sobre el gauge o badge en la tarjeta del Kanban, se abre directamente el drawer/modal de la oportunidad en la pestaña de **Acreditaciones**, permitiendo la carga, vinculación o despacho inmediato del Dossier.
