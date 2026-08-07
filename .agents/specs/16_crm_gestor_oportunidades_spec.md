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

## 4. Flujo Operativo y Gatillos (Triggers)
- **Inicio:** Se crea la oportunidad desde el Kanban de Preventa o desde la Ficha 360 del Cliente, usando el botón "Nueva Oportunidad".
- **Desarrollo:** El equipo comercial busca al cliente (RUT o Nombre), se auto-completan los campos del mandante y se ingresan las condiciones de pago.
- **Carga Técnica:** El usuario puede digitalizar a mano la viabilidad del servicio o importar un reporte de *Site Visit* previo (trayendo los datos generales e izaje directo desde las respuestas de la base de datos).
- **Cierre (Win):** Al marcar el estado como **"Ganado / Aprobado"**, el sistema cierra el expediente de preventa en `tpry_proyecto` e inyecta la orden en la Torre de Control (`sch_leangsp`).
