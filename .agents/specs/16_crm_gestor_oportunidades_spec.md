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
  
  // 1. Matriz de 6 Requerimientos Comerciales Mandatorios (Flags Booleanos)
  requiere_oc_hes: true,
  requiere_acreditacion: true,
  incluye_flete: true,
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
5. **Matriz de 6 Selectores / Flags Combobox Obligatorios (`null` inicial):**
   Todos los flags inician en estado `null` (*"Seleccionar..."*). Mientras un selector esté en `null`, se marca con **borde rojo de advertencia** (`border-red-500 bg-red-500/5`):
   - **`requiere_oc_hes`:** Bloquea facturación hasta carga de OC formal.
   - **`requiere_acreditacion`:** Habilita matriz documental de faena.
   - **`incluye_flete`:** Con `SÍ`, inyecta automáticamente una línea de Flete ($500.000, `TRASLADOS`, `Fijo`) en el estructurador. Con `NO`, la remueve.
   - **`requiere_rigger`:** Sincronizado bidireccionalmente con `PERSONAL CERTIFICADO ➔ RIGGER`.
   - **`requiere_prevencionista`:** Sincronizado con `PERSONAL CERTIFICADO ➔ PREVENCIONISTA`.
   - **`cliente_pone_combustible`:** Exigencia contractual explícita reflejada en PDF.

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
   - Vinculado al flag de preventa `incluye_flete = SÍ/NO` ($500.000, unidad `Fijo` o `Viaje`).
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

### 4.4. Regla de Homologación Absoluta en Segmento 2 (Traslados)
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

### 4.5. Regla de Segregación para `PERSONAL CERTIFICADO`
Cuando una línea pertenece a `PERSONAL CERTIFICADO` (detectada por `isPersonalLine(line)`):
1. Se segrega automáticamente hacia la **Sección 3 (Especialistas & Personal Técnico en Terreno)**.
2. La columna de equipo físico se **deshabilita** con la etiqueta `— (Personal en Tierra) —`.
3. El selector de personal muestra sugerencias agrupadas según el cargo (`Rigger`, `Prevencionista`, `Supervisor Faena`, `Maniobrista`).
4. Queda excluida de los selectores de vehículos de la Sección 1 y Sección 2.

---

### 4.6. Estándar de Inspección de Salida de Patio (Template 76: `TMPL-GSP-CHK-EQUIPOS`)
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

## 9. Subpestaña 7: Valorización, ITS & Facturación (Pipeline de Cierre 4 Pasos)

### 9.1. Propósito y Arquitectura
Regulado formalmente por la **[Spec 38 (Subpestaña 7)](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/.agents/specs/38_liquidacion_edp_y_facturacion_spec.md)**. Se activa en el Gestor de Oportunidades (`operacionesSubTab === 'liquidacion'`) para proyectos con `id_proyecto_estado >= 5`.

Conecta de punta a punta la conciliación de faena con la facturación final mediante un **Pipeline Secuencial de 4 Pasos**:
1. **Paso 1 - ITS (Informe Término de Servicio):** Control de costos directos (combustible, viáticos, peajes) y cálculo de margen de contribución real post-faena.
2. **Paso 2 - EDP Mandante:** Conciliación automática de jornadas de reports validados contra las tarifas pactadas y cálculo de sobretiempos. Emisión de Carátula Oficial (`ModalCaratulaEDP.vue`).
3. **Paso 3 - Respaldo OC Mandante:** Repositorio documental persistente de Órdenes de Compra (`json_field.crm_v1.ordenes_compra`) con subida de archivo PDF y validación de cobertura financiera ($\sum \text{Monto OCs} \ge \text{Total Neto EDP}$).
4. **Paso 4 - Factura DTE:** Integración con ERP Laudus, selector de OC en 1 clic (chips del Paso 3), registro de Folio DTE y transición automática a `id_proyecto_estado = 7` (Facturado y Concluido).
