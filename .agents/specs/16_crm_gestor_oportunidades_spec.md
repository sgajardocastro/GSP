# Especificación Técnica: Gestor de Oportunidades y Cotizaciones B2B (Spec 16)

## 1. Objetivo y Alcance
Transformar el enfoque básico de "simulador de tarifas" en una herramienta **Enterprise (Gestor de Oportunidades & Pipeline Operacional)** capaz de estructurar negocios de alto valor (High-Ticket B2B). Este módulo modela de forma determinística la complejidad operativa, técnica y financiera desde la captación del prospecto comercial hasta la transferencia formal a Operaciones (Asignación de Recursos, Acreditaciones y Preparación de Salida en Patio).

---

## 2. Modelo Canónico de Datos: `Oportunidad Comercial / OT`
El objeto de oportunidad no es solo una tarifa por horas, sino un expediente integral comercial, técnico y relacional respaldado en PostgreSQL (`tpry_proyecto`, `tpry_rel_persona`, `tpry_rel_equipo`):

```javascript
{
  id_proyecto: 69,
  id_empresa_emisora: "9", // SAN PABLO, BESTMAQ, LOGISTICA DEL SUR, ROYAL RENTAL
  id_proyecto_estado: 4,   // FSM Canónica: 1..8, 99
  rut_cliente: "76.123.456-7",
  razon_social: "CONSTRUCTORA POCURO SPA",
  contacto_nombre: "Juan Pérez",
  contacto_telefono: "+56 9 8765 4321",
  contacto_email: "jperez@pocuro.cl",
  tipo_pago: "transferencia", // efectivo, transferencia, credito, debito, cheque, otros
  prioridad: "normal",        // normal, alta
  
  // 1. Matriz de Requerimientos Comerciales Mandatorios (Flags Booleanos y Distancia Vial)
  requiere_oc_hes: true,
  requiere_acreditacion: true,
  distancia_km: 85,             // Distancia vial estimada de IDA desde Casa Matriz (Panamericana Sur Km 678, Temuco)
  regimen_operacional: "RURAL", // Derivado reactivo: "URBANO" (<= 30 km) | "RURAL" (> 30 km)
  requiere_rigger: true,
  requiere_prevencionista: false,
  cliente_pone_combustible: false,

  // 2. Viabilidad y Faena (Site Visit / Maniobra)
  siteVisit: {
    obra_nombre: "Montaje Estructura Parada de Planta 2026",
    obra_direccion: "Ruta 5 Sur Km 450",
    obra_ciudad: "Laja",
    fecha_hora_inicio: "2026-09-01T08:00",
    fecha_hora_termino: "2026-09-02T18:00",
    peso_carga: "45 Ton",
    radios_trabajo: "18 m",
    alturas_trabajo: "24 m",
    tipo_carga: "Vigas de Acero Estructural",
    volumen_carga: "Medio"
  },

  // 3. Estructurador de Servicios (Líneas Comerciales Base Canónicas)
  lines: [
    {
      _uid: "line-base-101",
      id_item: 1,
      tipo: "GRUAS TELESCOPICAS",
      subcategoria: "220 TON",
      descripcion: "Grúa Telescópica 220 Ton",
      unidad: "Horas Diarias Minimas",
      pisoMinimo: 8.0,
      cantidad: 2, // 2 jornadas / días
      valorUnitario: 120000, // $/hora (Subtotal = 2 * 8 * 120.000 = $1.920.000)
      equipo_asignado_id: "HW-8842",
      operador_asignado_id: 101,
      fecha_plan_ini: "2026-09-01",
      fecha_plan_fin: "2026-09-02",
      is_linea_base: true
    },
    {
      _uid: "line-base-102",
      id_item: 2,
      tipo: "TRASLADOS",
      subcategoria: "CAMA BAJA",
      descripcion: "Servicio de Traslado / Flete",
      unidad: "Traslado",
      pisoMinimo: 0,
      cantidad: 1,
      valorUnitario: 500000,
      is_linea_base: true
    }
  ],

  // 4. Asignaciones Operacionales de Recursos (Pestaña C / OT)
  operacionesAssignment: {
    fecha_salida_plan: "2026-09-01",
    hora_salida_plan: "07:00",
    fecha_fin_plan: "2026-09-02",
    hora_fin_plan: "19:00",
    equipos_extra: [
      {
        _uid: "ex-1724205500-12345",
        tipo: "TRASLADOS",
        subcategoria: "CAMA BAJA",
        id_equipo: 5,
        chofer_id: 205,
        rol: "Cama Baja #1",
        fecha_plan_ini: "2026-09-01",
        fecha_plan_fin: "2026-09-02"
      }
    ],
    aparejos: {
      estrobos: true,
      eslingas: true,
      grilletes: true,
      pulpos_cadena: false,
      cadenas: false,
      balancines: false,
      canastillos: false,
      otros_accesorios: false
    }
  }
}
```

---

## 3. UI / UX: Diseño de Interfaz y Reglas Visuales

La pantalla principal (`GestorOportunidades.vue`) se organiza en dos macro-paneles:

---

### 📋 3.1. Panel Izquierdo: Parametrización Comercial y 6 Flags Obligatorios
Valida la información mercantil de preventa antes de permitir la emisión de cotizaciones formales:

1. **Empresa Emisora (`id_empresa_emisora`):** Selector obligatorio (`SAN PABLO`, `BESTMAQ`, `LOGISTICA DEL SUR`, `ROYAL RENTAL`).
2. **Mandante (Autocomplete `tpar_empresas`):**
   - Búsqueda reactiva por Razón Social o RUT.
   - Autocompleta: Razón Social, RUT, Dirección Comercial y Giro.
3. **Contacto Mandante:** Selector (`contacto_id`) que rellena Nombre, Teléfono y Correo.
4. **Tipo de Pago:** Selector (`transferencia`, `credito`, `efectivo`, `debito`, `cheque`, `otros`).
5. **Matriz de Requerimientos Comerciales y Control de Distancia Vial:**
   - **`distancia_km` (Input Numérico de Ida):** Distancia vial estimada de IDA desde Casa Matriz (Panamericana Sur Km 678, Temuco). El sistema determina reactivamente el régimen operacional:
     * **`URBANO (≤ 30 km)`:** Badge verde inline. El cómputo de horas corre desde la salida de Casa Matriz hasta el retorno. Flete de grúa autotransportada = $0.
     * **`RURAL (> 30 km)`:** Badge ámbar inline. El cómputo de horas corre en faena (portón a portón). Exige cobro obligatorio de flete independiente.
   - **`requiere_oc_hes`:** Bloquea facturación final hasta carga de OC formal.
   - **`requiere_acreditacion`:** Habilita matriz documental de faena en Operaciones.
   - **`requiere_rigger`:** Sincronizado bidireccionalmente con `PERSONAL CERTIFICADO ➔ RIGGER`.
   - **`requiere_prevencionista`:** Sincronizado bidireccionalmente con `PERSONAL CERTIFICADO ➔ PREVENCIONISTA`.
   - **`cliente_pone_combustible`:** Exigencia contractual explícita reflejada en el PDF de cotización.

---

### 🏗️ 3.2. Panel Derecho: Pestaña 1 (Site Visit & Viabilidad)
- **Ventana Operativa Obligatoria:** `fecha_inicio_plan` + `hora_inicio_plan` y `fecha_fin_plan` + `hora_fin_plan`. Bloqueante para emitir cotización.
- **Datos de Faena:** Nombre de Obra, Dirección y Comuna/Ciudad.
- **Ingeniería de Maniobra y Dimensiones Explícitas (Feedback Natalia Giselini):**
  - Desglose de cubicación en **3 campos numéricos independientes**: `Largo (m) × Ancho (m) × Alto (m)`.
  - Cálculo reactivo automático en vivo: \( \text{Volumen} = \text{Largo} \times \text{Ancho} \times \text{Alto} \) en \( \text{m}^3 \).
  - Detalle de Servicio, Tipo de Carga, Peso (Ton), Radios y Alturas de Trabajo.
- **Precarga de Contacto en Faena:** Al marcar `[x] Requiere Visita a Terreno`, el sistema precarga por defecto el nombre, teléfono y correo del contacto comercial principal (`contacto_nombre`, `contacto_telefono`, `contacto_email`), permitiendo editarlo únicamente si el receptor en obra es diferente.
- **Auto-Guardado (Upsert) de Contactos:** Al ingresar manualmente un nuevo contacto sin ID en la libreta, se registra automáticamente en `tpar_contactos` asociado a la empresa cliente para su reutilización futura.
- **Gestión de Inspecciones Previas en Preventa:**
  - Despliegue de tarjetas de visita asociadas (`visitasDelProyecto`) respetando estrictamente el ciclo de vida oficial (ver Sección 3.7).
  - Eliminación definitiva de botones legacy de importación arbitraria (`[ Cargar ]`).

---

### 📍 3.7. Gestión Canónica de Visitas Técnicas a Terreno (Pestaña 1 y Pestaña 2)
La gestión de visitas técnicas a terreno (Template 80: `Visita Terreno`) opera de forma determinística bajo los estándares del motor de flujos (`tsrv_survey` / `tflw_*`):

#### 1. Ciclo de Vida y Visibilidad de Acciones por Estado Real:
| Estado Real BD (`estado_srv`) | Badge Visual | Botones Habilitados | Acciones Prohibidas / Ocultas |
| :--- | :---: | :--- | :--- |
| **`PLANIFICADO` / `Creado` / `Asignada`** | 🟡 `PLANIFICADO` | `[ 🔄 Reasignar ]` | ❌ Cero `Ver Web` (no iniciada)<br>❌ Cero `PDF Informe` (no existe) |
| **`En Proceso` / `En Ejecución`** | 🔵 `EN PROCESO` | `[ 🌐 Ver Web ]` | ❌ Cero `Reasignar` (en faena)<br>❌ Cero `PDF Informe` (no concluida) |
| **`VERIFICACION` / `APROBADO`** | 🟢 `APROBADO` / `VERIFICACIÓN` | `[ 🌐 Ver Web ]`<br>`[ 📄 PDF Informe ]` | ❌ **Prohibido Reasignar** (inspección concluida y formalizada) |

#### 2. Reglas de Invarianza y Persistencia:
1. **Invariante de Existencia:** Si existen registros en `tsrv_survey` asociados al proyecto (`visitasDelProyecto.length > 0`), el sistema fuerza reactivamente `siteVisit.visita_terreno = true` e impide de forma absoluta la visualización del banner *"Comercial no requirió visita"*.
2. **Persistencia Transaccional al Asignar:** Al confirmar la asignación de inspector desde la web (`asignarInspectorWeb`), además de emitir `POST /api/survey` con Template 80, se persiste inmediatamente `visita_terreno = true` en `tpry_proyecto.json_field.crm_v1` (`PUT /api/proyectos/:id`) garantizando la permanencia del estado tras cerrar sesión o reingresar.
3. **Reasignación Oficial:** Toda reasignación de técnico inspector se ejecuta mediante el endpoint canónico del core `PUT /survey/UpdPlan/:id` con `{ id_user: nuevo_id }` y registro de traza en `header_exec`.

---

### 🔍 3.8. Pestaña 2: Validación & Diff (Auditoría de Antecedentes y Limpieza de Traza)
Permite al Coordinador de Operaciones auditar la cotización enviada por Comercial frente a las condiciones reales de ejecución:
1. **Limpieza de Traza Visual (Cero Etiquetas Invasivas):**
   - **Líneas Nuevas:** Si la línea fue agregada posteriormente (`!isOriginalLine`), se marca únicamente con un badge sobrio `[ + Nueva Línea ]`, eliminando de raíz cajas tachadas innecesarias.
   - **Campos Modificados:** Se destacan sutilmente con borde de advertencia (`border-amber-500/50`) y tooltip contextual nativo `title="Valor Preventa: ..."` al pasar el cursor, preservando la legibilidad limpia de la celda.
2. **Gestión de Visitas Técnicas Obligatorias:** Si Comercial no solicitó visita pero la criticidad de la maniobra lo amerita, Operaciones dispone del botón directo `[ 📍 Exigir Visita Técnica Obligatoria ]`.

---

### 💰 3.3. Estructurador de Servicios Contextual (`lines`)
El estructurador de servicios opera en dos modalidades idénticas y sincronizadas: en Pestaña 1 (Preventa Comercial) y en Pestaña 2 (Validación Técnica Operaciones). Su diseño obedece al principio de **Inputs Contextuales por Tipo de Cobro**, garantizando que el usuario solo ingrese las magnitudes físicas requeridas por la modalidad de contratación pactada.

#### 1. Cabecera Oficial de la Grilla (Frontend CRM):
| Unidad de Cobro | Cantidad(es) | Valor Unitario | Subtotal |
| :--- | :--- | :---: | :---: |

#### 2. Catálogo de 4 Unidades Canónicas Oficiales y Reglas de Captura:
1. **`Horas Diarias Minimas` (Operación Diaria por Jornada):**
   - **Campos Requeridos:**
     * `Días` (`cantidad_dias`): Número entero entre $1$ y $30$. Default: $1$.
     * `Horas` (`cantidad_horas` / `pisoMinimo`): Horas mínimas diarias garantizadas por jornada, entre $1$ y $24$. Default: $8$.
     * `Valor Unitario` (`valor_unitario`): Tarifa pactada en pesos chilenos por hora de servicio ($\$/\text{hora}$ neto).
   - **Fórmula Matemática Determinística:**
     $$\text{Subtotal} = \text{cantidad\_dias} \times \text{cantidad\_horas} \times \text{valor\_unitario}$$
   - **Restricción de Etiquetas:** Queda estrictamente prohibido abreviar o inventar etiquetas de unidad ("Gl", "Serv"). Se mantiene literal: `Horas Diarias Minimas`.

2. **`Horas Mes Minimas` (Arriendo Mensual de Largo Plazo):**
   - **Campos Requeridos:**
     * `Meses` (`cantidad_meses`): Número entero $\ge 1$. Default: $1$.
     * `Horas` (`cantidad_horas` / `pisoMinimo`): Horas mínimas mensuales pactadas, $> 1$. Default: $180$.
     * `Valor Unitario` (`valor_unitario`): Tarifa pactada por hora de servicio ($\$/\text{hora}$ neto).
   - **Fórmula Matemática Determinística:**
     $$\text{Subtotal} = \text{cantidad\_meses} \times \text{cantidad\_horas} \times \text{valor\_unitario}$$
   - **Restricción de Etiquetas:** Denominación canónica: `Horas Mes Minimas`.

3. **`Traslado` (Transporte, Flete y Movilización):**
   - **Campos Requeridos:**
     * `Cantidad` (`cantidad`): Número de viajes o traslados $\ge 1$. Default: $1$.
     * `Valor Unitario` (`valor_unitario`): Tarifa pactada por viaje completo ($\$$ neto). Piso mínimo: $0$.
   - **Fórmula Matemática Determinística:**
     $$\text{Subtotal} = \text{cantidad} \times \text{valor\_unitario}$$

4. **`Valor Fijo` (Servicio Global Cerrado o Maniobra Específica):**
   - **Campos Requeridos:**
     * `Cantidad` (`cantidad`): Unidades de servicio $\ge 1$. Default: $1$.
     * `Valor Unitario` (`valor_unitario`): Tarifa pactada por el servicio global ($\$$ neto). Piso mínimo: $0$.
   - **Fórmula Matemática Determinística:**
     $$\text{Subtotal} = \text{cantidad} \times \text{valor\_unitario}$$

#### 4. Regla de Asociación Estricta por Categoría:
- **Categoría TRASLADOS:** Si `line.tipo === 'TRASLADOS'`, la unidad de cobro se restringe de forma mandatoria a `Traslado`.
- **Comportamiento Reactivo UI:** Al seleccionar `TRASLADOS`, el sistema fuerza automáticamente `line.unidad = 'Traslado'`, limpia variables de días/horas/meses y deshabilita (`disabled`) el selector de unidad tanto en Pestaña 1 como en Pestaña 2.
- **Desbloqueo:** Si la categoría se cambia a cualquier otra distinta de `TRASLADOS`, el selector de unidad vuelve a habilitarse con las 4 opciones canónicas (inicializándose en `Horas Diarias Minimas`).

#### 3. Estructura y Renderizado en el Documento Oficial PDF (`proyectoModel.js`):
La tabla de servicios del PDF de cotización debe reflejar idéntica consistencia visual y matemática con la grilla del CRM:
- **Cabecera Oficial PDF:**
  `Item | Descripción del Servicio | Unidad de Cobro | Cantidad(es) / Base | Tarifa Unitario | Subtotal (Neto)`
- **Orden Canónico de Columnas (Espejo de la Web):**
  1. `Item`: Correlativo numérico (1, 2, 3...).
  2. `Descripción del Servicio`: Título destacado con `Categoría — Subcategoría` en negrita, seguido de la `Descripción` comercial limpia. Queda estrictamente prohibido imprimir variables de depuración interna o campos vacíos (`FECHA PLAN INI`, `OPERADOR ASIGNADO ID`, etc.).
  3. `Unidad de Cobro`: Nombre formal de la modalidad pactada (`Horas Diarias Mínimas`, `Horas Mes Mínimas`, `Traslado`, `Valor Fijo`).
  4. `Cantidad(es) / Base`:
     * Para `Horas Diarias Minimas`: Imprime exactamente `${dias} ${dias === 1 ? 'Día' : 'Días'} × ${horas} hrs/día`.
     * Para `Horas Mes Minimas`: Imprime exactamente `${meses} ${meses === 1 ? 'Mes' : 'Meses'} × ${horas} hrs/mes`.
     * Para `Traslado`: Imprime `${cant} ${cant === 1 ? 'Viaje' : 'Viajes'}`.
     * Para `Valor Fijo`: Imprime `${cant} ${cant === 1 ? 'Servicio' : 'Servicios'}`.
  5. `Tarifa Unitario`:
     * Para modalidades por hora (`Horas Diarias Minimas` y `Horas Mes Minimas`): Imprime explícitamente el sufijo de tiempo: `$ Tarifa / hr`.
     * Para modalidades fijas (`Traslado` y `Valor Fijo`): Imprime `$ Tarifa`.
  6. `Subtotal (Neto)`: Monto neto final de la fila.
- **Consistencia de Sumatorias:** La suma de los subtotales calculados por línea coincide al $100\%$ con el `Total Neto` del documento, erradicando divergencias entre la grilla del CRM y el PDF impreso.

---

### 🛡️ 3.9. Guardián de Navegación por Estado (Routing Guard) y Normalización Resiliente

#### 1. Regla de Inmutabilidad de Navegación por Estado (State-Based Routing Guard):
- Si el proyecto se encuentra en `id_proyecto_estado < 3` (Estado 1: Oportunidad / Preventa Comercial):
  * El Gestor de Oportunidades se inicializa SIEMPRE y de forma obligatoria en `topTab = 'comercial'`.
  * Queda estrictamente prohibido abrir o renderizar vistas operacionales (`validacion`, `asignacion`, `acreditaciones`, `preparacion_salida`, `reports`, `liquidacion`), aun cuando vengan forzadas por parámetros de consulta en la URL (`?subtab=reports`).
  * El watcher reactivo de la ruta (`route.query.subtab`) evalúa `id_proyecto_estado`: si es menor a $3$, fuerza determinísticamente `topTab.value = 'comercial'` y aborta cualquier redirección operacional.

#### 2. Fallback Determinístico en Torre de Control (`Torre.vue`):
- Al hacer clic sobre cualquier tarjeta de la **Columna 1 (Preventa Comercial / Requerimiento Registrado)**, la llamada a navegación debe ser explícita: `abrirProyecto(p.id_proyecto, 'comercial')`.
- En la función global `abrirProyecto(id, subtab = null)`, el fallback por defecto ante la ausencia de parámetro `subtab` debe ser obligatoriamente `'comercial'`, **quedando terminantemente prohibido usar fallbacks operacionales como `'reports'`**.

#### 3. Protocolo de Carga Resiliente y Normalización de Flota (`cargarDatosCotizacion`):
- Al parsear el array `crm.lineas_servicio` almacenado en `json_field`:
  1. Se debe garantizar la declaración obligatoria en el scope de la variable `let mappedTipo = l.tipo || ''`.
  2. Dicha variable debe normalizarse contra el catálogo maestro de equipos (`GRUAS TELESCOPICAS`, `CAMIONES`, `GRUA HORQUILLA`, `MANIPULADOR TELESCOPICO`, `VEHICULOS LIVIANOS`, `PLATAFORMAS`, `TRASLADOS`, `ACCESORIOS`, `PERSONAL CERTIFICADO`, `OTROS`).
  3. Mapeo transparente de datos legados:
     * Unidades legacy `Horas`, `Diario`, `Jornada` se transforman a `Horas Diarias Minimas` poblando `cantidad_dias` y `cantidad_horas`.
     * Unidades legacy `Mensual`, `Horas Mensuales Minimas` se transforman a `Horas Mes Minimas` poblando `cantidad_meses` y `cantidad_horas`.
     * Unidades legacy `Flete`, `Viaje`, `Traslados` se transforman a `Traslado`.
     * Cualquier otra unidad desconocida se transforma a `Valor Fijo`.
  4. Ninguna inconsistencia de datos legados en la base de datos puede provocar un `ReferenceError` ni abortar la inicialización de la pantalla.

---

---

### 🏨 3.4. Matriz de Responsabilidad de Gastos de Pensión (Pestaña 2)
Define la cobertura institucional sin campos monetarios:
1. `Alojamiento`, `Desayuno`, `Almuerzo`, `Cena`, `Traslado de Personal`.
2. Opciones canónicas: `CLIENTE` | `SAN_PABLO` | `NO_APLICA`.

---

### 🚜 3.5. Pestaña 3: Asignación de Recursos OT (Tabla Única de Alta Densidad)
Implementa el estándar de **alta densidad lineal** con una sola cabecera global y 3 segmentos operacionales perfectamente homologados:

#### 1. Cabecera Global Única (`<thead>`):
- `RECURSO / REQUERIMIENTO` (22%): Línea comercial base o concepto operativo.
- `EQUIPO / VEHÍCULO ASIGNADO` (30%): Selector de máquina con insignia semafórica de acreditación (🟢/🟡/🔴).
- `OPERADOR / PERSONAL ASIGNADO` (26%): Selector de personal agrupado con sugerencias inteligentes por cargo + insignia (🟢/🟡/🔴).
- `VENTANA PLANIFICADA` (18%): Rango inline `[ YYYY-MM-DD ➔ YYYY-MM-DD ]`.
- `ACC` (4%): Candado 🔒 (si es línea base comercial protegida) o 🗑️ (si es recurso adicional).

#### 2. Segmentos Operacionales Homólogos (Row Dividers):
- **🚜 Segmento 1: Flota Principal & Operadores de Servicio:** Grúas telescópicas, camiones pluma, grúas horquilla y maquinaria con su operador en la misma fila. Botón `+ Agregar Equipo`.
- **🚚 Segmento 2: Segmento Equipos Traslado & Choferes (Logística):** Camas bajas, ramplas, tractocamiones y camionetas escolta con su respectivo chofer/escolta. **Estructura idéntica y homóloga al Segmento 1** (línea base muestra título + subtítulo técnico; línea agregada muestra 2 dropdowns apilados de Categoría y Subcategoría sin campos de texto arbitrarios). Botón `+ Equipo Traslado`.
- **👷 Segmento 3: Especialistas & Personal Técnico en Terreno:** Riggers certificados, prevencionistas y supervisores en tierra (columna de equipo deshabilitada como `— (Personal en Tierra) —`). Botón `+ Añadir Especialista`.

#### 3. Propagación Global de Tiempos:
- Toolbar superior con `Salida Base` ➔ `Término Faena` y botón **`⚡ Propagar Fechas`**, actualizando en cascada todas las filas del servicio.

---

### 🚦 3.6. Micro-Diálogo de Inspección de Acreditaciones (Inspect-on-Click)
Al hacer clic sobre cualquier insignia semafórica (🟢 `VIG`, 🟡 `VNC`, 🔴 `VNC`):
- Se abre una modal reactiva de alta resolución con el expediente de documentos del equipo o trabajador.
- Muestra el nombre formal del documento, fecha de expiración, días restantes y estado de vigencia.

---

## 4. Origen de Datos de Categorías, Subcategorías y Reglas de Derivación Semántica

Para garantizar fidelidad absoluta con la Base de Datos PostgreSQL y evitar inconsistencias entre conceptos comerciales y activos físicos:

### 4.1. Catálogo Oficial de Categorías en PostgreSQL (Post-Purga)
Se eliminaron de la base de datos las 5 categorías legacy (`1: Equipo (Grúa)`, `2: Equipo (Apoyo)`, `3: Personal`, `4: Escolta`, `5: Otros`) y sus 14 subcategorías. El catálogo canónico activo en `sch_leangsp.tequ_categoria` queda conformado por:

| ID BD | Nombre Categoría Oficial | Total Subcategorías | Activos Principales |
| :---: | :--- | :---: | :--- |
| **40** | `GRUAS TELESCOPICAS` | 11 | Liebherr, Tadano, Grove, XCMG (40T a 250T) |
| **62** | `CAMIONES` | 5 | Tractocamiones, Camiones Pluma, Plataformas, Semirremolques |
| **65** | `GRUA HORQUILLA` | 1 | Hyster y grúas de horquilla |
| **70** | `MANIPULADOR TELESCOPICO` | 1 | Bobcat y manipuladores |
| **72** | `VEHICULOS LIVIANOS` | 4 | Camionetas (Maxus, Silverado, Poer), Jeeps, Furgones, Cuatrimotos |
| **102** | `PLATAFORMAS` | 6 | Plataformas articuladas y alzacargas (Snorkel, Genie) |
| **150** | `OTROS` | 1 | Equipamiento y accesorios generales |
| **151** | `PERSONAL CERTIFICADO` | 4 | Riggers, Operadores, Prevencionistas, Supervisores |

### 4.2. Categorías Sintéticas / Operacionales Inyectadas en Frontend
Existen 3 conceptos operacionales indispensables para estructurar la cotización y la faena que no representan una máquina individual en `tequ_categoria`:
1. **`TRASLADOS` (Logística de Transporte):**
   - Subcategorías: `CAMA BAJA`, `RAMPLA`, `TRACTO CAMIÓN`, `ESCOLTA / GUÍA`.
   - Gobernado reactivamente por la **Matriz de 4 Casos Canónicos** según la distancia estimada de ida (`distancia_km`) y la configuración de contrapesos.
   - Sincronizado automáticamente hacia el Segmento 2 de Asignación OT como línea base protegida (`is_linea_base: true`).
2. **`PERSONAL CERTIFICADO` (Especialistas en Tierra):**
   - Subcategorías: `RIGGER`, `OPERADOR`, `PREVENCIONISTA`, `OTROS`.
   - Vinculado bidireccionalmente a los flags `requiere_rigger` y `requiere_prevencionista`.
3. **`OTROS` (Conceptos Varios):**
   - Subcategoría: `OTROS`.

---

### 4.3. Regla de Derivación Semántica por Subcategoría (`TRASLADOS`)
En la base de datos física (`tequ_equipo`), las máquinas de apoyo logístico residen en sus categorías mecánicas reales:
* Camas Bajas, Ramplas y Tracto Camiones residen bajo la categoría **`CAMIONES`** (subcategorías `SEMIREMOLQUE`, `TRACTOCAMION`, `CAMION PLATAFORMA`).
* Camionetas Escolta/Guía residen bajo la categoría **`VEHICULOS LIVIANOS`** (subcategorías `CAMIONETA`, `JEEP`).

Por ende, cuando una línea comercial o recurso de traslado posee categoría **`TRASLADOS`**, la función de filtrado de flota `getEquiposFiltradosPorLinea(line)` **omite el filtro estricto por nombre de categoría** y aplica una **resolución semántica directa por subcategoría sobre todo el parque de flota**:

| Subcategoría Seleccionada | Criterio de Búsqueda en Flota (`tequ_equipo`) | Modelos y Patentes Resueltas |
| :--- | :--- | :--- |
| **`CAMA BAJA`** | Subcategoría `SEMIREMOLQUE` con modelos `SR-CB`, `SRTCB`, `NOOTEBOOM`, `TREMAC`, `SCHILGER`, `BATEA` | Camas bajas cuello de cisne y remolques de carga pesada |
| **`RAMPLA`** | Subcategoría `SEMIREMOLQUE` con modelos `SRPL`, `SRBSCO`, `GOREN`, `RANDOM`, `TORMESOL` o `CAMION PLATAFORMA` | Ramplas abiertas y semirremolques planos (14.2m) |
| **`TRACTO CAMIÓN`** | Subcategoría `TRACTOCAMION` | Cabezales Scania G500A, Volvo FH, Sinotruk C7H, Mercedes New Actros |
| **`ESCOLTA / GUÍA`** | Categoría `VEHICULOS LIVIANOS` con subcategoría `CAMIONETA` o `JEEP` | Camionetas 4x4 Maxus T60, Great Wall Poer, Silverado, Jimny (excluye furgones y cuatrimotos) |
| *(Sin subcategoría)* | Categorías logísticas `CAMIONES` (Semirremolques/Tractos) y `VEHICULOS LIVIANOS` (Camionetas) | Todo el parque de transporte y escolta logístico |

---

### 4.4. Matriz Canónica de los 4 Casos de Cobro y Comportamiento del Estructurador (Acuerdo Jorge Ponce - 11-Sep-2026)
A partir de la calibración técnica del 11 de septiembre de 2026 con Gerencia General, se erradica el combobox manual de flete (`incluye_flete`) y se formaliza la siguiente matriz determinística de 4 escenarios según la distancia de ida a faena (`distancia_km`) y la presencia de contrapesos:

| Escenario de Negocio | Condición Operativa | Comportamiento del Estructurador (Líneas Facturables) | Cómputo de Tiempos & Cláusula Legal PDF |
| :--- | :--- | :--- | :--- |
| **Caso 1: Urbano sin Contrapeso** | $\text{distancia\_km} \le 30$ km<br>Grúa liviana / mediana ($< 90\text{T}$) | **1 sola línea:**<br>• `Horas de Arriendo Grúa` ($0 flete adicional). | El tiempo corre desde la salida de Casa Matriz (Km 678) hasta el término de maniobra. |
| **Caso 2: Urbano con Contrapeso** | $\text{distancia\_km} \le 30$ km<br>Grúa pesada ($\ge 90\text{T}$ a $400\text{T}$) | **2 líneas separadas:**<br>1. `Horas de Arriendo Grúa`<br>2. `Traslado Contrapesos` (Fijo \$500.000, unidad `Traslado`). | El tiempo de grúa corre desde salida de base. El traslado de contrapesos se cobra a valor fijo a todo evento. |
| **Caso 3: Rural sin Contrapeso** | $\text{distancia\_km} > 30$ km<br>Grúa liviana / mediana ($< 90\text{T}$) | **2 líneas separadas:**<br>1. `Horas de Arriendo Grúa` (operación en obra)<br>2. `Flete / Traslado Grúa` (ida y vuelta cerrada). | El tiempo de arriendo corre a partir del arribo a portería de faena. El flete carretero se factura independiente. |
| **Caso 4: Rural con Contrapeso** | $\text{distancia\_km} > 30$ km<br>Grúa pesada ($\ge 90\text{T}$ a $400\text{T}$) | **3 LÍNEAS SEPARADAS OBLIGATORIAS:**<br>1. `Horas de Arriendo Grúa` (operación en faena)<br>2. `Flete / Traslado Grúa` (movilización vial grúa)<br>3. `Traslado de Contrapesos` (cama baja / tracto). | Horas efectivas en obra. Flete de grúa y traslado de contrapesos se desglosan en 2 líneas de transporte independientes para trazabilidad de costos de combustible y patentes en el ITS. |

#### Reglas de Gobierno en el Estructurador:
1. **Banner Reactivo Anti-Fuga:** Si $\text{distancia\_km} > 30$ y el estructurador no posee líneas de flete (`tipo === 'TRASLADOS'`), se despliega una alerta roja bloqueante con el botón de inyección automática.
2. **Duplicación Interna de Distancia ($D \times 2$):** El vendedor digita exclusivamente la distancia de IDA (ej. 85 km). El backend y el modelo de costos operacionales del ITS multiplican automáticamente por 2 ($85 \times 2 = 170$ km) para calcular consumo de combustible, desgaste de neumáticos y peajes ida y vuelta.
3. **Compuerta Comercial Estricta:** Queda prohibido generar la cotización o avanzar a requerimiento si se detecta un viaje rural sin sus respectivas partidas de flete estructuradas.

---

### 4.5. Regla de Homologación Absoluta en Segmento 2 (Traslados)
Para mantener consistencia total con el Segmento 1 (Flota Principal):
1. **Línea Base Cotizada (`is_linea_base = true`):**
   - Muestra el título comercial (`Servicio de Traslado / Flete`).
   - Muestra la ficha técnica inline: `[TIPO] • [SUBCATEGORÍA] • [CANTIDAD] [UNIDAD]`.
   - Bloqueo de eliminación con icono `🔒`.
2. **Línea Agregada en Operaciones (`is_linea_base = false`):**
   - Muestra dos selectores apilados full-width:
     1. Dropdown Categoría (`TRASLADOS`, `CAMIONES`, `VEHICULOS LIVIANOS`, etc.).
     2. Dropdown Subcategoría (`CAMA BAJA`, `RAMPLA`, `TRACTO CAMIÓN`, `ESCOLTA / GUÍA`).
   - Queda estrictamente prohibido incluir inputs de texto libre o comentarios arbitrarios (`rol = "Cama Baja #1"`).
   - Botón de eliminación activo `🗑️`.
3. **Columna de Equipo:** Dropdown reactivo filtrado por `getEquiposFiltradosPorLinea` con semáforo de acreditación (🟢/🟡/🔴).
4. **Columna de Personal:** Dropdown reactivo con optgroup `🎯 Choferes Sugeridos` y `👷 Resto de Personal Activo` con semáforo de acreditación (🟢/🟡/🔴).

---

### 4.6. Regla de Segregación para `PERSONAL CERTIFICADO`
Cuando una línea pertenece a `PERSONAL CERTIFICADO` (detectada por `isPersonalLine(line)`):
1. Se segrega automáticamente hacia la **Sección 3 (Especialistas & Personal Técnico en Terreno)**.
2. La columna de equipo físico se **deshabilita** con la etiqueta `— (Personal en Tierra) —`.
3. El selector de personal muestra sugerencias agrupadas según el cargo (`Rigger`, `Prevencionista`, `Supervisor Faena`, `Maniobrista`).
4. Queda excluida de los selectores de vehículos de la Sección 1 y Sección 2.

---

### 4.7. Estándar de Inspección de Salida de Patio (Template 76: `TMPL-GSP-CHK-EQUIPOS`)
1. **Responsable de la Inspección:** Se elimina el campo redundante de texto `NOMBRE OPERADOR` en el Segmento 1 (`DATOS GENERALES`). La trazabilidad y responsabilidad técnica recae directamente en el usuario autenticado en la plataforma que ejecuta el formulario de inspección.
2. **Conformidad y Firma Electrónica:** Se elimina el lienzo de firma manual `FIRMA DEL OPERADOR` en el Segmento 8 (`CIERRE Y FIRMAS`), manteniendo únicamente `OBSERVACIONES GENERALES`. La conformidad técnica y legal se formaliza exclusivamente a través del flujo **FES con PIN (Firma Electrónica Simple)**.

---

## 5. FSM Relacional Canónica y Candados de Etapas (`id_proyecto_estado`)

```
[ 1: OPORTUNIDAD ] ──▶ [ 2: COTIZANDO ] ──▶ [ 3: VALIDACION_DIFF ]
                                                    │
[ 5: PREPARACION_PATIO ] ◀── [ 4: ASIGNACION_RECURSOS ] ◀┘
             │
             ├──▶ [ 6: DESPLAZAMIENTO ] ──▶ [ 7: EN_FAENA ] ──▶ [ 8: COMPLETADO ]
             │
             └──▶ [ 99: NO_GANADA ] (Desestimación Comercial)
```

| Estado | Nombre Oficial | Sub-tab Gestor | Modo | Comportamiento |
| :---: | :--- | :--- | :---: | :--- |
| **1** | `OPORTUNIDAD` | `1. Preventa Comercial` | 🟢 Editable | Edición comercial libre |
| **2** | `COTIZANDO` | `1. Preventa Comercial` | 🟢 Editable | Generación de cotización formal |
| **3** | `VALIDACION_DIFF` | `2. Validación & Diff` | 🟢 Editable | Comparador de requerimientos vs cotización |
| **4** | `ASIGNACION_RECURSOS` | `3. Asignación Recursos OT` | 🟢 Editable | Asignación de flota, tripulación y aparejos |
| **5** | `PREPARACION_PATIO` | `5. Preparación Salida` | 🟢 Editable | Checklist de patio, auditoría de acreditaciones |
| **6** | `DESPLAZAMIENTO` | Operaciones (Ruta) | 🟢 Editable | Convoy en tránsito |
| **7** | `EN_FAENA` | Operaciones (PWA) | 🟢 Editable | Ejecución de maniobra, AST y FES |
| **8** | `COMPLETADO` | Cierre Operacional | 🔒 Solo Lectura | Liquidación y facturación |
| **99** | `NO_GANADA` | Histórico / Archivo | 🔒 Solo Lectura | Motivo de pérdida comercial |

### Reglas de Divulgación Progresiva:
1. **Etapas Futuras ($> N$):** Bloqueadas con candado 🔒 (`disabled`).
2. **Etapa Activa ($= N$):** 100% editable con botones contextuales de avance.
3. **Etapas Previas ($< N$):** Solo lectura inmutable (`disabled`), con banner de etapa concluida.
4. **Excepción de Retorno:** Botón **`Devolver a Preventa Comercial`** devuelve el proyecto al Estado 2 con auditoría.

---

## 6. Compuertas Determinísticas de Calidad (Quality Gates)

### 6.1. Compuerta A: Validación Mandatoria para Generar Cotización PDF
Exige:
- Cliente Mandante seleccionado (`rut_cliente`).
- Nombre y Teléfono de Contacto obligatorios.
- Tipo de Pago definido.
- 6 Flags de requerimientos con valor explícito (`true`/`false`, no `null`).
- Descripción de faena no vacía.
- Datos de Obra (Nombre, Dirección, Ciudad) completos.
- Ventana Operativa exacta (Inicio y Término con fecha y hora).
- Mínimo 1 línea de servicio con Categoría y Subcategoría válidas.

### 6.2. Compuerta B: Validación Mandatoria para Transferir a Operaciones (`VALIDACION_DIFF`)
Exige:
- Cumplimiento 100% de la Compuerta A.
- Existencia de al menos 1 versión de cotización PDF generada.
- Registro fehaciente de despacho por correo al cliente (`evento_envio`, `enviada === true`).

---

## 7. Suite de Pruebas E2E (Gherkin/BDD)

```gherkin
Feature: Gestor de Oportunidades y Pipeline Operacional OT (Spec 16)
  Como Administrador de Operaciones y Comercial de Grúas San Pablo
  Quiero estructurar oportunidades comerciales y asignar recursos de faena
  Para garantizar cotizaciones rigurosas, inmutabilidad y asignación confiable

  Background:
    Given que el usuario está autenticado en la plataforma
    And ingresa al Gestor de Oportunidades para un proyecto nuevo
    And selecciona la Empresa Emisora "SAN PABLO"
    And selecciona el Mandante con RUT y Contacto válido

  Scenario: Bloqueo determinista de flags en null (Marcación Roja)
    Given que los 6 flags de requerimientos inician en estado null
    Then los 6 selectores deben mostrar borde rojo de advertencia
    When el usuario intenta hacer clic en "Generar Cotización"
    Then el sistema bloquea la acción indicando los campos pendientes
    When el usuario responde explícitamente SÍ o NO en los 6 selectores
    Then la marcación roja desaparece en su totalidad

  Scenario: Renderizado de Tabla Única de Alta Densidad en Asignación OT
    Given que el proyecto se encuentra en Estado 4 (ASIGNACION_RECURSOS)
    When el usuario accede a la pestaña "3. Asignación Recursos OT"
    Then se despliega una única cabecera global de 5 columnas
    And el Segmento 1 agrupa la flota principal con sus operadores
    And el Segmento 2 agrupa los transportes de traslado con sus choferes
    And el Segmento 3 agrupa los especialistas en tierra con vehículo deshabilitado

  Scenario: Adición reactiva de equipos con _uid único
    Given que el usuario presiona "+ Agregar Equipo" en la Sección 1
    Then se agrega inmediatamente una nueva fila editable
    And la nueva fila genera un _uid único impidiendo la reutilización de nodos DOM
    And los selectores de Categoría y Subcategoría consumen los maestros dinámicos de la BD

  Scenario: Inspección de acreditación al hacer clic en insignia semafórica
    Given una línea con un equipo asignado y semáforo "🟡 VNC"
    When el usuario hace clic sobre la insignia
    Then se abre el modal de Acreditaciones detallando las vigencias de revisión técnica, seguro y test de carga

  Scenario: Dimensionamiento de Carga en 3 Columnas y Cálculo Reactivo
    Given que el usuario está en la Pestaña "1. Preventa Comercial"
    When el usuario ingresa Largo "12.5", Ancho "2.4" y Alto "3.1"
    Then el sistema calcula automáticamente el volumen como "93.00 m³"
    And persiste la estructura en `json_field.crm_v1.dimensiones` al guardar

  Scenario: Precarga Automática de Contacto al Activar Visita a Terreno
    Given que la cotización tiene definidos "contacto_nombre", "contacto_telefono" y "contacto_email"
    When el usuario marca el checkbox "Requiere Visita a Terreno"
    Then los campos de contacto en obra se inicializan automáticamente con dichos valores
    And el usuario puede editarlos libremente si el receptor en obra es diferente

  Scenario: Auto-guardado (Upsert) de Nuevos Contactos
    Given que el usuario ingresa manualmente un contacto no existente en el dropdown
    When se guarda o actualiza la cotización
    Then el backend ejecuta un upsert en `tpar_contactos` asociándolo a la empresa cliente
    And el nuevo contacto queda disponible en el selector para futuras cotizaciones

  Scenario: Limpieza Visual de Traza Diff en Validación Operacional
    Given que el proyecto se encuentra en Estado 3 (VALIDACION_DIFF)
    When el usuario visualiza la tabla del estructurador
    Then las líneas agregadas muestran únicamente el badge "[ + Nueva Línea ]" sin etiquetas de texto tachado
    And los campos modificados presentan un borde ámbar con tooltip contextual nativo sin obstruir los inputs

  Scenario: Ciclo de Vida y Restricción Estricta de Botones en Visitas a Terreno
    Given una visita técnica en estado "APROBADO" o "VERIFICACION"
    When el usuario visualiza la tarjeta de la visita en Pestaña 1 o Pestaña 2
    Then se muestran los botones "[ 🌐 Ver Web ]" y "[ 📄 PDF Informe ]"
    And el botón "[ 🔄 Reasignar ]" se oculta completamente
    And el botón legacy "[ Cargar ]" no se renderiza en ninguna vista
    When la visita se encuentra en estado "PLANIFICADO" o "Creado"
  Scenario: Estructurador de Servicios con cálculo contextual por tipo de cobro
    Given que el usuario está en la Pestaña "1. Preventa Comercial" o "2. Validación & Diff"
    When selecciona la unidad "Horas Diarias Minimas" e ingresa Días "3", Horas "8" y Valor Unitario "120000"
    Then el subtotal de la fila se calcula reactivamente como "2880000" (3 * 8 * 120.000)
    When selecciona la unidad "Horas Mes Minimas" e ingresa Meses "2", Horas "180" y Valor Unitario "95000"
    Then el subtotal de la fila se calcula reactivamente como "34200000" (2 * 180 * 95.000)
    When selecciona la unidad "Traslado" e ingresa Cantidad "2" y Valor Unitario "500000"
    Then el subtotal de la fila se calcula reactivamente como "1000000" (2 * 500.000)
    When selecciona la unidad "Valor Fijo" e ingresa Cantidad "1" y Valor Unitario "1500000"
    Then el subtotal de la fila se calcula reactivamente como "1500000" (1 * 1.500.000)

  Scenario: Consistencia matemática determinística en PDF de Cotización
    Given una cotización con líneas de servicio configuradas
    When el usuario presiona "Generar Cotización PDF"
    Then el backend compila la tabla con columnas "Item | Descripción del Servicio | Unidad de Cobro | Cantidad(es) / Base | Tarifa Unitario | Subtotal (Neto)"
    And para líneas diarias imprime la unidad, "X Día(s) × Y hrs/día" y tarifa con sufijo "/ hr"
    And para líneas mensuales imprime la unidad, "X Mes(es) × Y hrs/mes" y tarifa con sufijo "/ hr"
    And la sumatoria de subtotales coincide al 100% con el Total Neto de la cotización

  Scenario: Guardián de Estado y Protección de Pestaña Preventa Comercial
    Given una oportunidad con id_proyecto_estado = 1 ("Requerimiento Registrado")
    When el usuario abre la oportunidad desde el Kanban de la Torre de Control
    Then el Gestor de Oportunidades se inicializa en topTab = "comercial" (Pestaña 1. Preventa Comercial)
    And no se renderiza ninguna vista de faena u operaciones aunque la URL contenga subtab="reports"
    And las pestañas 2 a 7 permanecen bloqueadas con candado de solo lectura o inaccesibles

  Scenario: Restricción estricta de Unidad de Cobro para categoría TRASLADOS
    Given que el usuario está en la Pestaña "1. Preventa Comercial" o "2. Validación & Diff"
    When el usuario selecciona la Categoría "TRASLADOS" en una línea de servicio
    Then la Unidad de Cobro se fija automáticamente en "Traslado"
    And el selector de Unidad de Cobro queda bloqueado para edición
    And la columna de Cantidad(es) despliega únicamente el campo numérico de "Cantidad" (>= 1)
    When el usuario cambia la Categoría a "GRUAS TELESCOPICAS"
    Then el selector de Unidad de Cobro se desbloquea
    And se restablece por defecto a "Horas Diarias Minimas" habilitando Días y Horas

---

## 8. Subpestaña 6: Control de Ejecución & Reports Diarios de Izaje en Faena

### 8.1. Propósito y Arquitectura
Una vez que el proyecto se encuentra en ejecución operacional (`id_proyecto_estado >= 5`), el Gestor de Oportunidades habilita la subpestaña **`6. Ejecución & Reports`** (`operacionesSubTab === 'reports'`).

Esta vista centraliza la auditoría técnica y financiera de la faena en tiempo real:
1. **Tarjetas de KPI Acumulado:**
   - **Días Operados:** Total de jornadas emitidas desde la PWA.
   - **Horas a Facturar:** Sumatoria de `horas_facturables` (`max(horas_operadas, horas_minimas)`).
   - **Sobretiempo Acumulado:** Sumatoria de `horas_sobretiempo` acumuladas por sobre la base diaria.
   - **Rango de Horómetro:** Trazabilidad de horómetro motor desde el inicio del Día 1 hasta el cierre del último día reportado.
   - **Conformidad Documental:** Conteo de reports validados vs pendientes por el analista.
2. **Tabla Cronológica Multi-Día (`sch_leangsp.tedp_reporte_avance`):**
   - Columnas: Día correlativo, Fecha, Horario real, Colación, Horas Efectivas, Horas Facturables, Horas Sobretiempo, Horómetros, Supervisor Mandante firmante, Estado (`✅ Validado` / `⏳ Pendiente`) y botón de acción `[ 👁️ VER ]`.
3. **Visor de Documento Digital y Validación (`ModalVisorReport.vue`):**
   - Visualización del documento oficial diario con estampa digital.
   - Renderizado del canvas de firma manuscrita capturada en terreno por el mandante.
   - Panel de aprobación con 1 clic para el Analista de Operaciones (`POST /api/operaciones/report/:id/validar`).
4. **Navegación Reactiva e Integración con Torre de Control:**
   - La vista responde automáticamente a parámetros de URL (`/crm?id_proyecto=XX&subtab=reports`).
   - El tablero Kanban de la Torre de Control (`Torre.vue`) redirige directamente a la subpestaña correspondiente mediante Vue Router.

---

## 9. Subpestaña 7: Valorización, ITS & Facturación (Pipeline de Cierre 4 Pasos — Modo Solo Lectura en Kanban)

### 9.1. Propósito y Arquitectura
Regulado formalmente por la **[Spec 38 (Subpestaña 7)](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/.agents/specs/38_liquidacion_edp_y_facturacion_spec.md)** y la **[Spec 60 (Aislamiento de Control Financiero)](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/.agents/specs/60_aislamiento_control_financiero_kanban_vs_pmo_spec.md)**. Se activa en el Gestor de Oportunidades (`operacionesSubTab === 'liquidacion'`) para proyectos con `id_proyecto_estado >= 5`.

> **Regla de Negocio Crítica:** En el Tablero Kanban y Gestor Comercial (`GestorOportunidades.vue`), **toda la información financiera opera en modo de solo lectura y auditoría visual**. La edición de tarifas, carga documental de OC y registro de Facturación DTE reside y opera **exclusivamente en la Torre de Control PMO (`Torre.vue` - Sub-vista 3)**.

Conecta de punta a punta la conciliación de faena con la facturación final mediante un **Pipeline Secuencial de 4 Pasos (Auditoría Visual en Kanban)**:
1. **Paso 1 - ITS (Informe Término de Servicio):** Control de costos directos (combustible, viáticos, peajes) y cálculo de margen de contribución real post-faena (`ModalITS.vue :readonly="true"`).
2. **Paso 2 - EDP Mandante:** Conciliación automática de jornadas de reports validados contra las tarifas pactadas y cálculo de sobretiempos. Apertura de Carátula Oficial (`ModalCaratulaEDP.vue :solo-lectura="true"`).
3. **Paso 3 - Respaldo OC Mandante:** Repositorio documental de Órdenes de Compra con enlace directo a ver PDF (`📄 Ver PDF`). Inmutable en Kanban: sin botones de carga ni borrado (administrado en PMO).
4. **Paso 4 - Factura DTE:** Ficha ejecutiva de solo lectura que detalla el folio DTE, fecha, montos devengados y observaciones contables, con derivación explícita a la Torre PMO para el ingreso fiscal y cierre contable.

---

## 10. Estructurador de Servicios & Matriz Canónica de los 4 Casos (Urbano vs. Rural)

### 10.1. Propósito y Diagnóstico de UX
El estructurador de cotizaciones en `GestorOportunidades.vue` (`activeTab === 'servicios'`) sustituye las alertas punitivas pos-mortem ("CASO X: falta flete...") por un **Asistente Visual Guiado** que detecta automáticamente el caso canónico aplicable según la distancia de traslado ($\le 30\text{ km}$ vs $> 30\text{ km}$) y el tonelaje de la grúa ($< 90\text{T}$ vs $\ge 90\text{T}$), permitiendo auto-estructurar las líneas de servicio en 1 solo clic.

### 10.2. Matriz Canónica Oficial de los 4 Casos

| Caso | Régimen & Configuración | ¿QUÉ SE COBRA? | ¿DESDE CUÁNDO se cobra? | ¿HASTA CUÁNDO se cobra? | Representación en Estructurador, ITS y EDP |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **CASO 1** | **$\le 30\text{ km}$ (URBANO)**<br>Grúa Normal<br>*(Sin camiones de contrapeso)* | 1. Horas Arriendo Grúa (no hay mín).<br>2. Rigger adicional (si aplica). | Desde la **SALIDA de Casa Matriz GSP** (`hora_salida`). | Hasta el **TÉRMINO de la maniobra** en obra (`hora_termino`). | **\$0 (Sin Flete).**<br>El viaje por la ciudad se paga 100% como horas de arriendo de la grúa.<br>*(1 línea en estructurador)*. |
| **CASO 2** | **$\le 30\text{ km}$ (URBANO)**<br>Grúa con Contrapesos<br>*(Camas Bajas)* | 1. Horas Arriendo Grúa.<br>2. Flete Tracto Camión (por cada camión de contrapesos).<br>3. Escolta (si aplica). | • Grúa: Desde la **SALIDA de Casa Matriz** (`hora_salida`).<br>• Camión Contrapeso: **Flete fijo de ida y vuelta**. | • Grúa: Hasta el **desmontaje final** en obra (`hora_termino`).<br>• Camas: **Retorno y descarga en patio GSP**. | • Grúa: **\$0 de flete** (viaje en horas).<br>• Camas de Contrapeso: **Línea de Flete OBLIGATORIA** por camión cama baja.<br>Ítem canónico: *"Traslado Contrapesos"*. *(2 líneas)*. |
| **CASO 3** | **$> 30\text{ km}$ (RURAL)**<br>Grúa Normal<br>*(Sin camiones de contrapeso)* | 1. Horas Arriendo Grúa (no hay hor mín).<br>2. Flete de la Grúa (**OBLIGATORIO**). | • Grúa: Desde la **LLEGADA a la faena** (`hora_llegada`).<br>• Flete: **Valor cerrado pactado**. | • Grúa: Hasta el **TÉRMINO de la maniobra en faena** (`hora_termino`). | **Línea de Flete OBLIGATORIA.** El viaje por carretera NO corre en las horas de arriendo; se paga como Flete.<br>Al cliente se le presentan **dos líneas**: 1) Horas Grúa, 2) *"Traslado de Grúa"*. |
| **CASO 4** | **$> 30\text{ km}$ (RURAL)**<br>Grúa con Contrapesos<br>*(Camas Bajas)* | 1. Horas Arriendo Grúa (**Piso mín. 8 hrs**).<br>2. Flete de la Grúa (**OBLIGATORIO**).<br>3. Flete Contrapesos (**OBLIGATORIO**). | • Grúa: Desde la **LLEGADA a la faena** (`hora_llegada`).<br>• Fletes: **Valores cerrados pactados**. | • Grúa: Hasta el **desmontaje final en faena** (`hora_termino`). | **Líneas de Flete OBLIGATORIAS para todo el convoy:**<br>• Flete Grúa.<br>• Flete Camión Contrapesos #1, #2...<br>Al cliente se le presentan **tres líneas**: 1) Horas Grúa (mín. 8 hrs), 2) *"Traslado de Grúa desde $origen a $destino con retorno"*, 3) *"Traslado de Contrapesos desde $origen a $destino con retorno"*. |

### 10.3. Reglas Deterministas de Taxímetro y Desacoplamiento de Traslados
1. **Régimen Urbano ($\le 30\text{ km}$):** El taxímetro de la grúa corre desde el portón de salida de Casa Matriz GSP hasta el término de la maniobra. El tiempo de viaje en ciudad se devenga en la tarifa horaria de la máquina.
2. **Régimen Rural ($> 30\text{ km}$):** El taxímetro de la grúa corre **estrictamente en faena** (desde `hora_llegada` hasta `hora_termino`). El viaje de carretera se factura de forma separada como **Flete cerrado de ida y vuelta**, no en las horas de arriendo.
3. **Piso Mínimo en Grúa con Contrapesos Rural (Caso 4):** Exige un piso contractual mínimo de **8 horas por jornada** en arriendo de grúa.

### 10.4. Componente Asistente Visual y Auto-Estructuración en 1 Clic
1. **Cuadrícula de 4 Tarjetas Interactivas:** Ubicada sobre la tabla de servicios, destaca en borde ámbar (`border-amber-500 bg-amber-500/10`) y badge `★ RECOMENDADO` el caso coincidente con la planilla oficial:
   - **CASO 1: URBANO (SIN FLETE)**: $\le 30\text{ km}$, Grúa Normal, taxímetro desde salida Casa Matriz, 1 línea ($0 flete).
   - **CASO 2: URBANO (CON FLETE CONTRAPESOS)**: $\le 30\text{ km}$, Grúa con contrapesos, 2 líneas (Grúa en horas + "Traslado Contrapesos" fijo).
   - **CASO 3: RURAL (CON FLETE GRÚA)**: $> 30\text{ km}$, Grúa Normal, taxímetro en faena, 2 líneas (Horas en faena + "Traslado de Grúa" obligatorio).
   - **CASO 4: RURAL (CON FLETES GRÚA Y CONTRAPESOS)**: $> 30\text{ km}$, Grúa con contrapesos, piso mín. 8 hrs, 3 líneas obligatorias (Horas Grúa + "Traslado de Grúa" + "Traslado Contrapesos").
2. **Activación Condicional de Tarjetas según Umbral 30 km:**
   - Si $\le 30\text{ km}$: Casos 1 y 2 activos y elegibles; Casos 3 y 4 inactivos / atenuados (`opacity-30 cursor-not-allowed`) con badge explicativo `Inactivo (> 30km)`.
   - Si $> 30\text{ km}$: Casos 3 y 4 activos y elegibles; Casos 1 y 2 inactivos / atenuados (`opacity-30 cursor-not-allowed`) con badge explicativo `Inactivo (≤ 30km)`.
3. **Botón Proactivo `[ ⚡ Aplicar Configuración Canónica Caso N ]`:**
   - Inyecta o alinea las líneas de servicio canónicas (grúa y fletes correspondientes) sin borrar tarifas unitarias ya digitadas. Si la estructura está completa, permite re-estructurar con `[ ⚡ Re-Aplicar Configuración Caso N ]`.
4. **Guía Canónica Desplegable (`[ 📋 Ver Tabla Canónica Oficial ]`):**
   - Modal o acordeón con la tabla comparativa oficial de los 4 casos (idéntica a la planilla física de GSP) para consulta inmediata del usuario.

---

## 11. Buscador Omnibox Reactivo en Tablero Kanban de Torre de Control

### 11.1. Propósito y Justificación Operacional
Para optimizar la localización de negocios durante la marcha blanca comercial y operativa, la Torre de Control (`Torre.vue`) incorpora en su cabecera un Buscador Omnibox Reactivo para el Tablero Kanban. Permite a vendedores y coordinadores filtrar en tiempo real las 6 columnas del tablero sin realizar desplazamientos manuales.

### 11.2. Criterios de Búsqueda Concurrente (Multi-Criterio)
El motor de filtrado evalúa concurrentemente los siguientes atributos normalizados (en minúsculas y sin distinción de tildes):
1. **N° de Cotización / Código de Proyecto:** `codi_proyecto` (ej: `GSP-2609-001`), `id_proyecto` numérico, `codigo_maestro` o `n_licitacion`.
2. **Cliente:** `nombre_cliente` (Razón Social), `contacto_nombre`, `contacto_email`.
3. **Vendedor / Ejecutivo Creador:** Identificación del usuario creador mediante el mapeo reactivo de `id_user_creacion` contra el catálogo `tsec_users` (`GET /api/usuarios`), `vendedor`, o `usuario_creacion`.
4. **Obra / Faena / Ubicación:** `nombre_proyecto`, `obra_nombre`, `obra_ciudad`.
5. **Recursos Asignados:** Patente de grúa (`patente_grua`) u operador (`operador_nombre`).

### 11.3. Comportamiento UI y Feedback
1. **Contador Dinámico:** Badge en la cabecera indicando `X de Y proyectos` coincidentes.
2. **Limpieza Inmediata:** Botón `✕` visible al escribir y atajo de teclado mediante tecla `Escape`.
3. **Micro-Etiqueta en Tarjeta:** Despliegue de `👤 [Nombre Vendedor]` en las tarjetas de la Columna 1 (Preventa) para confirmar la asignación comercial del negocio.

---

## 12. Trazabilidad y Visibilidad Universal del Ejecutivo Comercial

### 12.1. Regla de Negocio
Todo requerimiento u oportunidad comercial debe identificar de manera inequívoca y permanente al Ejecutivo Comercial (creador del proceso). Esta identidad debe ser visible en todas las etapas del ciclo de vida del negocio, tanto para el equipo comercial como para Operaciones y Contabilidad.

### 12.2. Presencia en UI
1. **Tarjetas Kanban (Torre.vue):** Las 6 columnas del tablero despliegan obligatoriamente `👤 [Nombre Ejecutivo]` en el cuerpo de cada tarjeta (debajo de la descripción o información de cliente/operación).
2. **Cabecera de Detalle (GestorOportunidades.vue):** La barra superior fija muestra permanentemente un badge identificador con el nombre del ejecutivo y la fecha de creación.
3. **Formulario de Preventa (GestorOportunidades.vue):** Sección 1 incluye el campo visual "Ejecutivo Comercial Responsable", pre-poblado con el usuario conectado en proyectos nuevos o con el creador original en proyectos guardados.

### 12.3. Persistencia
* `tpry_proyecto.id_user_creacion`: ID canónico en PostgreSQL.
* `json_field.crm_v1.vendedor_nombre`: Snapshot textual inmutable del nombre del ejecutivo comercial.
* `json_field.crm_v1.vendedor_email`: Correo electrónico del ejecutivo comercial.

---

## 13. Subpestaña 5: Control de Flota, Despacho y Visor de Telemetría GPS en Tiempo Real

### 13.1. Propósito y Conexión Operativa en el Gestor de Oportunidades
En la Subpestaña 5 **"Control de Flota & Despacho"** (`operacionesSubTab === 'preparacion_salida'`), habilitada para proyectos con `id_proyecto_estado >= 4`, el Gestor de Oportunidades centraliza:
1. **Inspección de Patio & Pre-uso:** Verificación técnica de los equipos asignados mediante Template 81.
2. **Despacho Operacional de Convoy:** Generación de la Hoja de Ruta (`/viaje/:token`), asignación de chofer/operador y despacho omnicanal (Email + WhatsApp).
3. **Monitoreo de Telemetría GPS en Vivo:** Acceso mediante el botón `[ 🛰️ Ver Mapa / Telemetría ]` (`verMapaViaje(viaje)`), que instancia el modal `ModalMapaViaje.vue`.

### 13.2. Arquitectura Cartográfica (Cero API Key)
Se erradica CartoDB (por su marca de agua de API Key requerida) y se adopta un esquema 100% abierto y gratuito mediante Leaflet:
* **Capa Base por Defecto (Calles OSM):** `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`.
* **Capa Satélite HD:** `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}` (Esri World Imagery).
* **Capa Topográfica:** `https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}` (Esri World Topo Map).
* **Conmutador de Capas:** Switcher flotante en la esquina inferior derecha (`[ 🗺️ Calles (OSM) ]`, `[ 🛰️ Satélite HD ]`, `[ ⛰️ Topográfico ]`) con conmutación reactiva inmediata sin reinicializar la instancia de Leaflet.

### 13.3. Ergonomía Visual en Torre de Control: Pantalla Completa & Bitácora Colapsible
Para permitir la inspección profunda de maniobras complejas, trayectos viales y accesos a faena:
1. **Modo Pantalla Completa Inmersivo:** Alternancia mediante botón `[ ⛶ Pantalla Completa ]` / `[ 🗗 Restaurar ]` (`100vw × 100vh`). Se fuerza el redibujado de teselas mediante `map.invalidateSize()` tras la transición.
2. **Panel de Bitácora Colapsible:** Control flotante `[ 📋 Ocultar/Ver Bitácora ]`. Al ocultar la bitácora cronológica, el visor del mapa se expande al 100% del ancho del modal (`col-span-12`), facilitando la vista panorámica de la ruta.
3. **Control de Centrado Rápido:** Botón flotante `[ 🎯 Centrar Ruta ]` que ejecuta `map.fitBounds` encuadrando toda la polilínea del trayecto con padding óptimo.

### 13.4. Navegación Interactiva por Hitos (Waypoints FlyTo)
Cada hito de la bitácora cronológica es interactivo:
* Clic en **1. Salida de Patio (Base GSP)**, **2. Telemetría en Ruta (Pings GPS)** o **4. Arribo a Faena** ejecuta una animación suave `map.flyTo([lat, lng], 17)` con duración de 1.2s.
* Abre automáticamente el popup descriptivo con datos de odómetro, horómetro, velocidad instantánea y estampa de tiempo.

### 13.5. Enrutamiento Canónico y Redirección Nginx
* **Nginx Reverse Proxy (`/etc/nginx/default.d/base.conf`):** Redirección permanente 301 (`/viaje/*` ➔ `/lg-gsp-dev/viaje/*`) resolviendo accesos de enlaces cortos desde dispositivos móviles.
* **PWA (`Surveys.vue`):** El método `abrirViajeNativo` construye la URL canónica `${baseOrigin}/lg-gsp-dev/viaje/${token}`.
* **Microservicio WhatsApp (Puerto 3085):** Panel `/admin` con endpoint `/desvincular` para purga de credenciales Baileys y regeneración inmediata de QR sin intervención manual de servidor.

### 13.6. Desacoplamiento Total entre Despacho de Viaje e Inspección de Pre-Uso
Para evitar cuellos de botella en la operación logística y permitir la salida ágil de la flota desde patio sin supeditar el despacho a la finalización del checklist de inspección:
1. **Despacho Inmediato e Independiente por Equipo:**
   * Cada equipo asignado en la Subpestaña 5 ("Control de Flota & Despacho") incorpora en su cabecera un botón de acción rápida `[ 🚀 Despachar Viaje ]` (o `[ 🗺️ Telemetría ]` si ya fue despachado).
   * Se ejecuta directamente `autorizarSalidaEquipo(eqId, false)` sin requerir la apertura ni ejecución previa de la inspección de pre-uso (Template 81).
2. **Desbloqueo Permanente del Selector de Operador/Conductor:**
   * Se elimina la restricción `:disabled` basada en `patio_programado`, permitiendo asignar o reasignar al chofer en cualquier momento del ciclo operativo.
3. **Pase a Terreno y Transición de Estados Flexibilizados:**
   * El indicador del Stepper "Estado Pase Terreno" se desacopla del requisito estricto de inspección (`statusSegmento2 === 'GREEN'`). Pasa a estado verde (`🟢 PASE LIBERADO 2/2`) cuando el despacho de convoy está completado (`statusSegmento3 === 'GREEN'`) o cuando la inspección está OK.
   * En `finalizarPreparacionSalida()`, se elimina el bloqueo que impedía avanzar el proyecto a faena sin el checklist de patio ejecutado, permitiendo que las operaciones en terreno inicien mientras la documentación técnica se completa de forma asíncrona.

---

## 14. Ajustes Operacionales de Marcha Blanca (REQ-017 / v1.0.62 / Consolidación Spec 56)

Durante las sesiones de validación operativa en vivo con Gerencia General y Operaciones, se incorporaron cuatro ajustes mayores al comportamiento de `GestorOportunidades.vue`:

### 14.1. Regla Anti-Fantasma en Especialistas de Terreno
1. `especialistasTerreno` se inicializa reactivamente como un arreglo vacío (`ref([])`).
2. Al cargar o inicializar una oportunidad comercial, se evalúan exclusivamente los requerimientos reales:
   * Si `opportunity.requiere_prevencionista === true` o existe línea comercial con subcategoría `PREVENCIONISTA` / `APR`, se habilita el slot de Prevencionista.
   * Si `opportunity.requiere_prevencionista === false` o nulo, se purgan de forma absoluta los slots huérfanos de prevencionista sin usuario.
3. Se mantiene el slot de Rigger únicamente si `opportunity.requiere_rigger === true` o si existe línea comercial correspondiente.

### 14.2. Centralización de Reasignación en Sub-tab 2 y Bloqueo en Despacho
1. **Sub-tab 2 (Asignación) — Desbloqueo y Reasignación Formal:**
   * Se elimina la clase `pointer-events-none` de la Sub-tab 2 en OTs confirmadas ($\ge 5$).
   * Presenta un encabezado informativo de estado confirmado con botón explícito: `[🔄 Reasignar Recursos / Actualizar OT]`.
   * El usuario puede modificar operadores, riggers o máquinas directamente desde la matriz de asignación. Al pulsar *"Guardar Reasignación"*, se actualiza la OT, se re-gatilla la verificación de acreditaciones (Sub-tab 3) y se sincronizan los viajes de despacho.
2. **Sub-tab 5 (Despacho) — Modo Solo Lectura de Recursos:**
   * En Despacho los selectores de recursos se inhabilitan (`disabled` o texto formateado tipo badge).
   * Despacho opera estrictamente como compuerta de salida física: confirmación de chofer/operador receptor, número de teléfono, generación de link PWA y despacho de WhatsApp. No se permiten alteraciones de asignación en esta etapa.

### 14.3. Rigger Anidado Bajo Operador / Conductor
1. **Ergonomía de Interfaz:** No se agrega una nueva columna que sature el ancho útil de la tabla.
2. **Ubicación:** Dentro de la celda de *Operador Asignado* de la *Flota Principal*, si la cotización exige Rigger (`opportunity.requiere_rigger === true`), se renderiza un sub-registro anidado inmediatamente bajo el selector del operador con selector de Rigger y semáforo de acreditación.
3. **Regla Multi-Grúa en Servicios Complejos:**
   * En maniobras con múltiples grúas cotizadas, el sub-registro de Rigger se presenta por defecto en la **Grúa Principal** (`linesEquiposPrincipales[0]`).
   * Únicamente si la cotización comercial incluye la venta de 2 o más Riggers, las líneas secundarias de grúa habilitarán también el sub-registro de Rigger correspondiente.
4. **Sincronización:** Al seleccionar el Rigger bajo la grúa, se sincroniza reactivamente con `operacionesAssignment.rigger_id` y con la tripulación de la OT para la emisión del PDF de despacho.

### 14.4. Filtro Inclusivo con Separador y Aviso de Mayor Prestación
1. **Agrupación en Dos Niveles (`getEquiposAgrupados`):**
   * El `<select>` de asignación de equipos se estructura en dos `<optgroup>` semánticos:
     - **Grupo 1 (`🎯 Equipos Sugeridos (Compromiso Comercial)`):** Grúas que cumplen con la subcategoría/tonelaje comercialmente pactado.
     - **Grupo 2 (`🚚 Flota Alternativa / Mayores Prestaciones`):** Toda la flota disponible en el maestro para cubrir indisponibilidades de última hora.
2. **Aviso de Mayor Prestación:**
   * Si el usuario selecciona un equipo perteneciente al Grupo 2 (*Alternativas / Mayores Prestaciones*), el sistema renderiza un banner informativo destacado bajo el selector:
     `[⚠️ Equipo de Mayor Capacidad (Alternativa Operativa — Tarifa Comercial Respaldada)]`.
   * Esto garantiza transparencia operativa sin alterar los montos de la cotización pactados con el cliente.

---

## 15. Formalización Contractual de Arriendos (REQ-1037 / Sustitución de Bitácora & Alertas)

### 15.1. Objetivo y Deprecación de UI
1. **Deprecación de Pestaña Inerte:** Se elimina de forma definitiva la pestaña `Bitácora & Alertas` de `GestorOportunidades.vue`, la cual operaba únicamente como un formulario testimonial sin integración con la base de datos ni con los flujos operativos.
2. **Nueva Pestaña Oficial:** Se implementa en su lugar la pestaña **`CONTRATO & FORMALIZACIÓN`**, activa y accesible dentro del ciclo de preventa comercial.
3. **Criterio de Aplicabilidad:** Aunque está disponible para cualquier oportunidad que requiera formalización jurídica, la pestaña se destaca de forma automática y prioritaria con un indicador visual cuando el servicio corresponde a **Arriendo de Maquinaria** (p. ej. Caso 5: Plataformas de Elevación / Alzahombres, arriendos mensuales o semanales de grúas y camiones pluma).

### 15.2. Estructura Documental y Template Canónico (4 Páginas)
El contrato de arriendo se autocompila a partir del expediente de la oportunidad comercial y se estructura en un estándar formal de 4 páginas:

1. **Páginas 1 a 3 — Condiciones Generales de Arriendo:**
   * **Encabezado Paramétrico:** Incorpora el logo oficial de la empresa emisora del holding (según `id_empresa`: Royal Rental, Grúas San Pablo, Bestmaq o Logística del Sur), el número de contrato correlativo (`CTR-[AÑO]-[FOLIO]`) y la fecha de emisión.
   * **14 Cláusulas Legales Canónicas:**
     1. *Pago de arriendo:* Determinación del valor conforme a cotización aceptada previo al despacho.
     2. *Entrega y Restitución:* Entrega en domicilio/faena, Acta de Entrega y Recepción, inicio del cómputo de cobro y exención de permisos viales para tránsito urbano no solicitado.
     3. *Aplicación y Operación:* Uso estricto en faena declarada, operación con personal calificado y responsabilidad civil por negligencia o dolo.
     4. *Renta, Plazo de Reclamo y Mora:* Pago a 30 días, plazo legal de reclamo de 8 días (Ley 19.983), interés penal máximo convencional y cobro de pisos mínimos contratados.
     5. *Mantenimiento por Arrendador:* Mantención preventiva por pauta/horómetro y obligación del cliente de otorgar pases de faena.
     6. *Mantenimiento por Arrendataria:* Revisión diaria (niveles, lubricación, baterías, neumáticos) y costo de reparaciones por mal uso o descuido.
     7. *Responsabilidad Civil y Siniestros:* Indemnidad de la Arrendadora, obligación de denuncia inmediata en Carabineros y alcoholemia obligatoria ante accidentes.
     8. *Lucro Cesante:* Exclusión explícita de lucro cesante reclamable por el cliente.
     9. *Cesibilidad:* Prohibición absoluta de cesión del contrato sin autorización.
     10. *Dominio y Prohibiciones:* Reconocimiento de dominio exclusivo de la Arrendadora; prohibición de subarriendo, gravámenes o modificaciones estructurales.
     11. *Garantía de Cumplimiento:* Respaldo íntegro de las obligaciones contraídas.
     12. *Vigencia:* Plazo convenido con renovación tácita hasta aviso formal con 10 días de anticipación.
     13. *Término Anticipado:* Causales de resolución ipso facto por no pago o insolvencia/concurso con indemnización de rentas remanentes.
     14. *Restitución de la Máquina:* Devolución conforme al Acta de Entrega y cobro por retraso o partes faltantes.
   * **Pie de Página 3 (Comparecencia y Firmas):**
     * Bloque Arrendador: Razón social, RUT, Representante Legal por defecto (**Luis Omar Ghisellini Jara**, C.I. **12.031.054-2**).
     * Bloque Arrendatario: Razón social del mandante, RUT de la empresa, Representante Legal o Firmante Autorizado (Nombre y C.I.).

2. **Página 4 — Anexo Contrato de Arrendamiento (Condiciones Particulares):**
   * **Identificación Completa de las Partes:** Arrendador (Holding) y Arrendataria (Mandante) con direcciones fiscales y representantes.
   * **Individualización de la Maquinaria:** Marca, Modelo, Año, N° de Serie, N° de Motor y Propietario.
   * **Condiciones Económicas y Operacionales:** Fecha de inicio, fecha de término estimada, tipo de arriendo (Mensual, Semanal o Diario), tarifa pactada, horas mínimas acordadas, lugar físico de uso de la maquinaria y observaciones particulares.
   * **Firma de Aceptación:** Recuadro de firma exclusiva del representante de la Arrendataria.

### 15.3. Modelo de Datos Canónico (`tpry_proyecto.json_field.contrato`)
Los metadatos de formalización se almacenan de forma estructurada en el expediente JSON de la oportunidad:

```javascript
{
  contrato: {
    folio: "CTR-2026-0256",
    estado: "PENDIENTE_FIRMA", // BORRADOR | ENVIADO_FES | FIRMADO_DIGITAL | FIRMADO_FISICO
    id_empresa_arrendador: 11, // 9: San Pablo, 11: Royal Rental, 7: Bestmaq, 8: Logística
    arrendador: {
      razon_social: "ARRIENDO ROYAL RENTAL LIMITADA",
      rut: "78.254.535-3",
      direccion: "Ruta S-30 Km 9.5 Labranza, Temuco",
      representante_nombre: "LUIS OMAR GHISELLINI JARA",
      representante_rut: "12.031.054-2"
    },
    arrendatario: {
      razon_social: "CONSTRUCTORA POCURO SPA",
      rut: "76.123.456-7",
      direccion: "Ruta 5 Sur Km 450, Laja",
      representante_nombre: "Juan Pérez González",
      representante_rut: "15.432.876-5",
      representante_cargo: "Administrador de Contrato",
      email_contacto: "jperez@pocuro.cl",
      telefono_contacto: "+56 9 8765 4321"
    },
    maquinaria: {
      marca: "XCMG",
      modelo: "XGA16E",
      anio: 2026,
      serie: "XUG0147ACSRL0132",
      motor: "7RE8931",
      propietario: "ARRIENDO ROYAL RENTAL LIMITADA"
    },
    condiciones: {
      fecha_inicio: "2026-10-15",
      fecha_termino: "2026-11-15",
      tipo_arriendo: "MENSUAL", // MENSUAL | SEMANAL | DIARIO
      tarifa_pactada: 1800000,
      piso_minimo_horas: 180,
      lugar_uso: "Faena Montaje Planta Laja",
      mantenimiento_acordado: "Preventivo según pauta a cargo de Arrendadora",
      observaciones: "Entrega sujeta a firma previa del presente instrumento"
    },
    // Trazabilidad FES / Firma
    firma_digital: {
      token_seguridad: "uuid-v4-token-de-un-solo-uso",
      token_expiracion: "2026-10-18T12:00:00Z",
      token_utilizado: false,
      firmado_por_nombre: "Juan Pérez González",
      firmado_por_rut: "15.432.876-5",
      firmado_por_cargo: "Administrador de Contrato",
      fecha_hora_firma: "2026-10-15T10:30:15-03:00",
      ip_firmante: "190.161.45.22",
      user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)...",
      firma_png_base64: "data:image/png;base64,iVBORw0KGgo...",
      hash_documento_sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      url_pdf_firmado: "/documentos/contratos/CTR-2026-0256_firmado.pdf"
    },
    firma_fisica: {
      cargado_por: "Wilson Navarrete",
      fecha_carga: null,
      url_pdf_escaneado: null
    }
  }
}
```

### 15.4. Flujo A — Firma Digital Móvil (FES con Web Token de 1 Solo Uso)
1. **Generación del Magic Link:**
   * Desde la pestaña `Contrato & Formalización`, el comercial presiona `[📱 Generar Enlace de Firma Móvil]`.
   * El backend crea un registro de token criptográfico único asociado al contrato con vigencia configurable (72 horas) y flag `token_utilizado: false`.
   * Se proveen dos acciones inmediatas: `[💬 Compartir por WhatsApp]` (redacta mensaje automático con el enlace directo) y `[📋 Copiar Enlace]`.
2. **Experiencia del Cliente (Portal Público Mobile-First):**
   * El cliente accede a la ruta pública `/firmar-contrato?token=[TOKEN]` desde cualquier dispositivo móvil o de escritorio sin requerir autenticación ni cuenta de usuario.
   * El portal valida en tiempo real: (a) que el token exista, (b) que no haya expirado y (c) que no haya sido utilizado previamente. Si no es válido, despliega pantalla de contingencia indicando que el enlace ha caducado o ya fue firmado.
   * El cliente visualiza el contrato íntegro de 4 páginas mediante visor web responsive.
   * **Formulario de Formalización:** El firmante confirma o ingresa:
     - Nombre Completo del Representante.
     - RUT del Representante.
     - Cargo en la Empresa Mandante.
     - Fecha de Firma (autocompletada al día actual).
   * **Pad de Firma Táctil:** Canvas interactivo HTML5 para capturar el trazo de la firma manual con el dedo o puntero táctil (con botón de `[Borrar / Limpiar Trazo]`).
   * **Casilla de Consentimiento:** Checkbox obligatorio: *"Declaro que tengo las facultades para representar a la Arrendataria y acepto íntegramente las Condiciones Generales y Particulares del Arriendo"*.
   * **Botón de Acción:** `[🔒 Firmar y Formalizar Contrato]`.
3. **Procesamiento y Sellado Determinístico:**
   * El backend invalida el token (`token_utilizado: true`).
   * Estampa la imagen de la firma y los metadatos en las coordenadas exactas de las Páginas 3 y 4 del PDF mediante `pdf-lib`.
   * Incorpora al pie de página un sello de tiempo y trazabilidad con hash SHA-256, IP pública y User-Agent del dispositivo.
   * Almacena el PDF final en el repositorio de archivos del proyecto (`contratos/CTR-[AÑO]-[FOLIO]_firmado.pdf`).
   * Actualiza el estado del contrato en `GestorOportunidades.vue` a **`✅ Firmado Digitalmente (FES)`**.
   * El cliente recibe confirmación en pantalla con botón para descargar su copia firmada de inmediato.

### 15.5. Flujo B — Firma Física / Manual Tradicional
1. Para clientes o contratos que requieran trámite presencial o firma en papel físico:
   * Botón `[🖨️ Descargar PDF para Firma Física]`: Genera y descarga el PDF de 4 páginas con todos los campos pre-impresos, dejando vacías únicamente las líneas de firma manual y fecha.
2. Cuando el cliente retorna el documento firmado:
   * Botón `[📤 Subir Contrato Firmado]`: Permite al ejecutivo comercial adjuntar el PDF escaneado o fotografía legible del contrato suscrito.
   * El sistema guarda el documento, registra al usuario interno que efectuó la carga y actualiza el estado a **`📁 Firmado Físico / Cargado Manualmente`**.

### 15.6. Interfaz de Usuario en `GestorOportunidades.vue`
La pestaña `Contrato & Formalización` presenta tres paneles coordinados:
1. **Panel Superior (Control de Estado y Folio):**
   * Folio del contrato, insignia de estado con código de color (Gris: *Borrador*, Ámbar: *Pendiente de Firma*, Verde: *Firmado Digitalmente*, Azul: *Firmado Físico*).
2. **Panel Central (Ficha de las Partes y Maquinaria):**
   * Cuadros comparativos del Arrendador y Arrendatario con opción de edición rápida de los datos del representante comercial.
   * Resumen técnico de la maquinaria asignada (con enlace para previsualizar el PDF antes de despachar).
3. **Panel Inferior (Acciones de Despacho y Auditoría):**
   * Botones primarios de generación de enlace, envío por WhatsApp, descarga física y carga de escaneo.
   * Si el documento ya fue firmado: renderiza la ficha de auditoría jurídica (Fecha/Hora exacta, Nombre del Firmante, RUT, Cargo, IP de origen, Hash SHA-256) y visor integrado del documento final suscrito.
