# Especificación Técnica: Gestor de Oportunidades y Cotizaciones B2B (Spec 16)
**Versión:** 5.0.0 (Consolidación SDD — REQ-1109: Rediseño Estructural en Árbol por Líneas de Servicio — Arquitectura de 2 Capas Servicio/Recurso, Proyección Dual-Write Retrocompatible y Feature Flag de Desacople en DEV — 05-Nov-2026)

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
  distancia_km: 85,             // Antecedente comercial de distancia vial de IDA desde Casa Matriz (Panamericana Sur Km 678, Temuco)
  regimen_operacional: "RURAL", // Definido en Verificación de Operaciones (Pestaña 2): "URBANO" | "RURAL"
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
   - **`distancia_km` (Input Numérico de Ida — Antecedente para Operaciones):** Distancia vial estimada de IDA desde Casa Matriz (Panamericana Sur Km 678, Temuco). En Preventa Comercial se registra como antecedente obligatorio sin imponer bloqueos de casos sobre el estructurador.
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
1. **Definición Obligatoria de Política Operacional (`URBANO` / `RURAL`) y Facultad de Devolución a Comercial:**
   - **Respuesta Obligatoria de Operaciones (Cero Preselección Automática en `id_proyecto_estado = 3`):** El Coordinador de Operaciones revisa el antecedente `distancia_km` registrado por Comercial y debe seleccionar **obligatoriamente** en el sistema si al servicio se le aplica la **Política Urbana (`URBANO`)** o la **Política Rural (`RURAL`)** (`operacionesAssignment.regimen_operacional`, con flag `regimen_operacional_confirmado = true` persistido en `json_field.ejecucion_v1` y `json_field.crm_v1`). No se permite preseleccionar automáticamente por distancia ni autorizar el requerimiento hacia `3. Asignación de Recursos` sin esta respuesta explícita.
   - **Devolución a Comercial con Motivo de Rechazo y Fecha de Devolución:** Si al revisar los antecedentes el Coordinador detecta que la estructura cotizada no se ajusta a la realidad operativa del servicio (ej. omisión de un flete, equipo de apoyo o condición necesaria), dispone del botón directo **`[ ↩️ Devolver a Preventa Comercial ]`** (`volverACotizar`), registrando obligatoriamente el **Motivo de Rechazo (`motivo_reverso_verificacion`)**, la **Fecha de Devolución (`fecha_reverso_verificacion`)** y el **Usuario (`usuario_reverso_verificacion`)**, visibles en alerta destacada tanto en `1. Preventa Comercial` como en `2. Validación & Diff`.
2. **Limpieza de Traza Visual (Cero Etiquetas Invasivas):**
   - **Líneas Nuevas:** Si la línea fue agregada posteriormente (`!isOriginalLine`), se marca únicamente con un badge sobrio `[ + Nueva Línea ]`, eliminando de raíz cajas tachadas innecesarias.
   - **Campos Modificados:** Se destacan sutilmente con borde de advertencia (`border-amber-500/50`) y tooltip contextual nativo `title="Valor Preventa: ..."` al pasar el cursor, preservando la legibilidad limpia de la celda.
3. **Gestión de Visitas Técnicas Obligatorias:** Si Comercial no solicitó visita pero la criticidad de la maniobra lo amerita, Operaciones dispone del botón directo `[ 📍 Exigir Visita Técnica Obligatoria ]`.

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

### 4.4. Estructuración Comercial Libre y Diferimiento de Política Urbana / Rural a Operaciones (Acuerdo Jorge Ponce - 30-Oct-2026)
1. **Estructuración Libre en Preventa:** En `1. Preventa Comercial`, se eliminan los 4 casos guiados y sus bloqueos estructurales. El ejecutivo comercial configura con total autonomía las líneas de servicio que requiere la operación (horas de grúa, fletes de contrapesos o equipos, camiones complementarios, valor fijo, etc.).
2. **Duplicación Interna de Distancia ($D \times 2$):** El vendedor digita la distancia de IDA (`distancia_km`) como antecedente para Operaciones. El backend y el ITS multiplican por 2 para el costeo logístico de ida y vuelta.
3. **Definición en Operaciones:** El régimen operacional (`URBANO` o `RURAL`) se determina en la etapa `2. Validación & Diff` por el Coordinador de Operaciones.

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

## 10. Reglas de Cobro al Cliente (EDP) y Liquidación de Horas de Operadores (RRHH) según Política Definida en Operaciones

### 10.1. Impacto en el Cobro al Cliente y Facturación (Report Diario / EDP)
Al cierre del servicio, las horas efectivas a cobrar al cliente en el Estado de Pago (multiplicadas por la tarifa cotizada y respetando las horas mínimas pactadas) se contabilizan según la política definida por el Coordinador de Operaciones:
1. **Servicios Urbanos (`URBANO`):** Se cobra al cliente **desde la salida de la base de GSP (`hora_salida_patio` / `hora_salida`) hasta el término del servicio en obra (`hora_termino`)**, descontando colación y standby GSP, respetando las horas mínimas pactadas más los fletes o ítems adicionales cotizados.
2. **Servicios Rurales (`RURAL`):** Se cobra al cliente **desde el inicio del servicio en obra (`hora_inicio`) hasta el término del servicio en obra (`hora_termino`)**, descontando colación y standby GSP, respetando las horas mínimas pactadas más los fletes o ítems adicionales cotizados.

### 10.2. Impacto en el Costeo de Incentivos de los Trabajadores (RRHH — `tarifasOperadorService.js`)
La liquidación de horas de los operadores se calcula automáticamente según la política definida por Operaciones:
1. **Servicios Urbanos (`URBANO`):**
   - **No se paga traslado de equipo** (`horas_flete_pagar = 0`).
   - Únicamente se consideran las **horas de servicio reportadas** (`horas_faena_pagar = horasRealesEquipo`).
2. **Servicios Rurales (`RURAL`):**
   - **Si las horas reales de servicio en obra son menores a las horas mínimas (`horasRealesEquipo < horas_minimas`):** Las horas de traslado cubren primero el tramo faltante para enterar el mínimo, y **solo se paga la diferencia positiva** por sobre las horas mínimas:
     * `horas_faena_pagar = horas_minimas`
     * `horas_flete_pagar = max(0, (horasRealesEquipo + horasTraslado) - horas_minimas)`
   - **Si las horas reales de servicio en obra son iguales o mayores a las horas mínimas (`horasRealesEquipo >= horas_minimas`):** Se pagan las horas reales trabajadas en obra más las horas de traslado reportadas (`horas_faena_pagar = horasRealesEquipo`, `horas_flete_pagar = horasTraslado`).

---

## 11. Buscador Omnibox Reactivo en Tablero Kanban de Torre de Control

### 11.1. Propósito y Justificación Operacional
Para optimizar la localización de negocios durante la marcha blanca comercial y operativa, la Torre de Control (`Torre.vue`) incorpora en su cabecera un Buscador Omnibox Reactivo para el Tablero Kanban. Permite a vendedores y coordinadores filtrar en tiempo real las 6 columnas del tablero sin realizar desplazamientos manuales.

### 11.2. Criterios de Búsqueda Concurrente (Multi-Criterio)
El motor de filtrado evalúa concurrentemente los siguientes atributos normalizados (en minúsculas y sin distinción de tildes):
1. **N° de Cotización / Código de Proyecto:** `codi_proyecto` (formato canónico `[PREFIJO]-[YYMM]-[SECUENCIAL_5_DIGITOS]`, ej: `GSP-2611-00001`, con soporte retrocompatible para códigos históricos de 3 dígitos), `id_proyecto` numérico, `codigo_maestro` o `n_licitacion`.
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

## 15. Formalización Contractual de Arriendos de Plataformas (REQ-1036 / REQ-1037 / REQ-1038)

### 15.1. Objetivo y Deprecación de UI
1. **Deprecación de Pestaña Inerte:** Se elimina de forma definitiva la pestaña `Bitácora & Alertas` de `GestorOportunidades.vue`, la cual operaba únicamente como un formulario testimonial sin integración con la base de datos ni con los flujos operativos.
2. **Nueva Pestaña Oficial:** Se implementa en su lugar la pestaña **`CONTRATO & FORMALIZACIÓN`**, activa y accesible dentro del ciclo de preventa comercial.
3. **Criterio de Aplicabilidad y Parametrización Multi-Empresa (`REQ-1036`):**
   * El contrato está diseñado específicamente para servicios de arriendo de **Plataformas**, pero sin bloquear por empresa emisora: permite seleccionar libremente como **Arrendador** a cualquiera de las 4 sociedades del holding (`11: Royal Rental`, `9: Grúas San Pablo`, `7: Bestmaq`, `8: Logística del Sur`). Esto resuelve los casos comerciales en que un cliente arrienda una plataforma pero solo posee línea de crédito o registro de proveedor activo con Grúas San Pablo o Bestmaq.
   * El contrato adapta dinámicamente el Logo, Razón Social, RUT y Domicilio Legal de la sociedad Arrendadora elegida, así como todos los datos del Cliente Mandante (Arrendatario).
4. **Identificación Explícita `(Plataforma)` en el Título (`REQ-1037`):**
   * Tanto en la interfaz CRM, el portal público de firma digital FES, las notificaciones B2B como en el encabezado de las Páginas 1 y 2 del PDF, el título del instrumento debe explicitar entre paréntesis **`(Plataforma)`**: `CONTRATO DE ARRENDAMIENTO DE MAQUINARIA (PLATAFORMA)` / `CONDICIONES GENERALES DE ARRIENDO (PLATAFORMA)` y `ANEXO CONTRATO DE ARRENDAMIENTO (PLATAFORMA)`.

### 15.2. Estructura Documental y Template Canónico (Texto Legal 100% Literal en 2 Páginas Continuas)
El contrato de arriendo se autocompila a partir del expediente de la oportunidad comercial en 2 páginas exactas, manteniendo **100% intacto y literal (palabra por palabra, sin resumir ni parafrasear)** el texto validado por los abogados (`contrato ejemplo arriendo plataformas.Pdf`), comprimiendo únicamente los espacios vacíos mediante CSS (`font-size: 6.85px`, `line-height: 1.16`, márgenes `7mm 9mm` en 1 sola columna a ancho completo):

1. **Página 1 — Condiciones Generales de Arriendo (Plataforma) y Comparecencia:**
   * **Encabezado Paramétrico:** Incorpora el logo oficial de la empresa emisora del holding (según `id_empresa_arrendador`: Royal Rental, Grúas San Pablo, Bestmaq o Logística del Sur), el título `CONDICIONES GENERALES DE ARRIENDO (PLATAFORMA)`, `CONTRATO NUMERO` (`CTR-[AÑO]-[FOLIO]`) y `FECHA` (`DD-MM-YYYY`).
   * **14 Cláusulas Legales Canónicas (100% Literales e Íntegras en 1 Sola Columna):**
     1. *1.- Pago arriendo:* Texto literal íntegro sobre valor establecido en cotización aceptada antes del despacho.
     2. *2.- Entrega de la máquina:* Texto literal íntegro sobre entrega en domicilio señalado en Cotización, transporte de cargo de la Arrendataria, firma del “Acta de Entrega y Recepción de Maquinaria” o por dos testigos, aceptación tácita a la sola firma del Acta y despacho, inicio de cobros y responsabilidad por permiso de circulación, multas y daños a terceros.
     3. *3.- Aplicación:* Texto literal íntegro sobre uso exclusivo en lugar indicado en la Cotización, exención de garantía de aptitud, operación con personal idóneo y calificado, responsabilidad civil y penal por negligencia o dolo y autorización escrita para mover la máquina.
     4. *4.- Renta y otros pagos:* Texto literal íntegro sobre pago a 30 días en domicilio de la Arrendadora, plazo de 08 días corridos para reclamar factura (artículo 3 N° 2 Ley 19.983), interés máximo convencional por mora, mera tolerancia, pago total aún por caso fortuito o fuerza mayor, prevalencia de Condiciones Generales y cobro mínimo de 1 mes (tarifa mensual) o 2 semanas mínimas (tarifa semanal).
     5. *5.- Mantenimiento y reparaciones de cargo de la Arrendadora:* Texto literal íntegro sobre pautas de mantención, aviso de horas de operación, facilidades en terreno, cobro de traslados por falta de pases de ingreso a faena y pago de reparaciones por falta de aviso.
     6. *6.- Mantenimiento y reparaciones de cargo de la Arrendataria:* Texto literal íntegro sobre mantención diaria, prohibición de terceros no autorizados, costo total de reparaciones (mano de obra, traslado y repuestos aún por caso fortuito o fuerza mayor), pinchazos/cortes/elementos de desgaste, visación en estado de pago y pago de renta completa durante reparación por mal uso.
     7. *7- Responsabilidad:* Texto literal íntegro sobre responsabilidad civil desde la entrega hasta la restitución, prohibición absoluta de retención de la máquina, cobro de renta en caso de retención por autoridad o tercero, aviso de siniestro al día siguiente hábil, constancia en Carabineros o declaración jurada en notaría y obligación de alcoholemia.
     8. *8.- Lucro cesante:* Texto literal íntegro sobre exclusión absoluta de responsabilidad de la Arrendadora por lucro cesante aún por caso fortuito o fuerza mayor.
     9. *9.- Cesibilidad:* Texto literal íntegro sobre prohibición de ceder, enajenar o transferir los derechos del contrato.
     10. *10.- Propiedad:* Texto literal íntegro sobre reconocimiento de dominio, obligaciones `1.` y `2.` (conservación, aviso de embargos/medidas precautorias y oposición judicial) y prohibiciones `A.`, `B.` y `C.` (modificaciones, subarriendo/comodato, gravámenes).
     11. *11.- Garantía:* Texto literal íntegro sobre garantía del cumplimiento total y oportuno de todas y cada una de las obligaciones de la Arrendataria.
     12. *12.- Vigencia:* Texto literal íntegro sobre vigencia por el plazo de las Condiciones Particulares, paso a indefinido hasta aviso escrito con 10 días de anticipación y cobro del período total en caso de devolución anticipada.
     13. *13.- Término anticipado:* Texto literal íntegro sobre plazo de 10 días para subsanar incumplimiento, término unilateral de pleno derecho, causales `1.`, `2.` y `3.` (`A.`, `B.`, `C.`, `D.`), indemnización igual al total de rentas remanentes y costos de devolución.
     14. *14.- Restitución de la máquina:* Texto literal íntegro sobre entrega a la fecha de término conforme al “Acta de Entrega y Recepción de Maquinaria”, firma por dos testigos, pago de partes/piezas/accesorios faltantes o dañados más instalación y cómputo del tiempo de mora como tiempo arrendado.
   * **Pie de Página 1 (Comparecencia Original):**
     * Columna Izquierda (`ARRENDATARIO`): `EMPRESA`, `RUT`, `Representada Por: Sr(a)` y `C.I.`.
     * Columna Derecha (`ARRENDADOR`): `EMPRESA`, `RUT`, `Representada Por: Sr(a): LUIS OMAR GHISELLINI JARA` y `C.I.: 12.031.054-2`.

2. **Página 2 — Anexo Contrato de Arrendamiento de Maquinaria (Plataforma) — Condiciones Particulares (Formato Original):**
   * **Barra Negra Superior:** `ANEXO CONTRATO DE ARRIENDAMIENTO DE MAQUINARIA (PLATAFORMA)` seguida de los recuadros `FECHA` (izquierda) y `CONTRATO NUMERO` (derecha).
   * **Recuadros `ARRENDADOR` y `ARRENDATARIA`:** Cada uno con las 5 filas originales (`RAZON SOCIAL`, `RUT`, `DIRECCION`, `REPRESENTADA POR SR.`, `RUT`).
   * **Barra Negra Central:** `CONDICIONES PARTICULARES`.
   * **Recuadro Contenedor de Condiciones Particulares:**
     * `1.- INDIVIDUALIZACION DE LA MAQUINARIA`: 3 cajas con borde (`NRO DE SERIE` / `NRO DE MOTOR`, `MODELO` / `AÑO`, `MARCA` / `PROPIETARIO`).
     * `B.- DURACION DEL CONTRATO`: 2 cajas con borde (`FECHA DE INICIO` y `FECHA DE TERMINO` exacta conforme a `REQ-1038`).
     * `C.- RENTA DEL ARRENDAMIENTO`: 2 cajas con borde (`TARIFA NORMAL` / `MAXIMO DE HORAS` y `TIPO DE ARRIENDO`).
     * `D.- LUGAR DE USO DE LA MAQUINARIA :` con línea punteada.
     * `E.- MANTENIMIENTO POR ARRENDADOR :` con línea punteada.
     * `F.- OBSERVACIONES 1 :` con línea punteada.
     * **Firma de Aceptación al Pie Izquierdo:** Línea punteada única con `FIRMA REPRESENTANTE` (e imagen de firma digital FES cuando ha sido suscrito electrónicamente).

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
1. **Despacho Automático Omnicanal (Correo + WhatsApp):**
   * Desde la pestaña `Contrato & Formalización`, el comercial presiona `[🚀 Enviar Contrato para Firma (Correo & WhatsApp)]`.
   * El sistema genera el token criptográfico de 72 horas y ejecuta de forma simultánea:
     a) **Correo Electrónico al Cliente:** Envío transaccional vía Nodemailer (MessageModel) a la dirección del representante (`contrato.representante_email`), con plantilla oficial B2B, individualización del equipo, empresa emisora y botón de llamada a la acción: `[ 📝 REVISAR Y FIRMAR CONTRATO DIGITAL ]`.
     b) **Copia al Ejecutivo Comercial (CC):** Notificación automática a la casilla del vendedor responsable (`crm.vendedor_email` o usuario en sesión) para resguardo y trazabilidad operativa.
     c) **Notificación WhatsApp:** Despacho directo al teléfono móvil del cliente (`contrato.representante_telefono`) vía microservicio Baileys con mensaje personalizado y enlace directo.
     d) **Respaldos Interactivos:** Disponibilidad de botones secundarios `[📱 Abrir WhatsApp Web]` y `[📋 Copiar Enlace Directo]` para contingencias.

2. **Experiencia del Cliente (Portal Público Mobile-First con Lectura Completa):**
   * El cliente accede a la ruta pública `/firmar-contrato?token=[TOKEN]` desde cualquier dispositivo móvil o de escritorio sin login.
   * **Visor del Contrato Completo (4 Páginas Reales):** Antes de cualquier interacción de firma, el cliente visualiza el texto íntegro del contrato en alta legibilidad:
     - Páginas 1 a 3: Encabezado institucional con logo del holding emisor, N° de contrato, fecha y las **14 cláusulas legales completas**.
     - Página 4: Anexo de Condiciones Particulares con la individualización técnica de la máquina (Serie, Motor, Modelo, Marca, Año), faena de destino, tarifa y plazos.
   * **Descarga de Borrador:** Botón visible `[📥 Descargar Borrador en PDF]` para revisión legal externa previa.
   * **Casilla de Aceptación Obligatoria:** Checkbox interactivo: *"He leído atentamente y acepto íntegramente las 14 cláusulas del contrato de arrendamiento y sus condiciones particulares"*.
   * **Formulario de Identificación y Firma:** Campos para confirmar o corregir Nombre, RUT y Cargo del compareciente, junto a un canvas táctil HTML5 para estampar la firma manuscrita con el dedo o mouse.
   * **Botón de Formalización:** `[🔒 Confirmar y Firmar Contrato Digitalmente]`.

3. **Procesamiento y Sellado Determinístico:**
   * El backend invalida el token (`token_utilizado: true`).
   * Compila el PDF final oficial de 4 páginas mediante `xvfb-run wkhtmltopdf` estampando la firma gráfica y la leyenda "FIRMADO DIGITALMENTE (FES)".
   * Registra los metadatos de auditoría legal (IP pública, User-Agent, fecha/hora y hash).
   * Almacena el documento en el repositorio de archivos del proyecto (`contratos/CTR-[AÑO]-[FOLIO].pdf`).
   * Actualiza el estado del contrato en `GestorOportunidades.vue` a **`✅ Firmado Digitalmente (FES)`**.
   * El cliente recibe confirmación en pantalla con botón para descargar su copia suscrita en PDF inmediatamente.

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
   * Cuadros comparativos del Arrendador y Arrendatario con campos obligatorios para: Nombre Representante, RUT, Cargo, ✉️ Correo Electrónico y 📱 Teléfono Móvil (auto-sincronizados desde el contacto de preventa y editables).
   * Resumen técnico de la maquinaria asignada (con botón de previsualización en PDF).
3. **Panel Inferior (Centro de Despacho Omnicanal y Auditoría):**
   * Botón primario: `[🚀 Enviar Contrato para Firma (Correo & WhatsApp)]`.
   * Resumen de trazabilidad indicando el estado del despacho por canal (Correo cliente, Copia ejecutivo, WhatsApp).
   * Botones de contingencia para abrir WhatsApp Web y copiar enlace.
   * Ficha de auditoría legal post-firma con visor del documento final suscrito.

---

## 16. Nuevo Formato de Serial del Negocio (`codi_proyecto`) con Secuencia Continua de 5 Dígitos (REQ-1083 — 01-Nov-2026)

### 16.1. Regla de Negocio y Estructura Canónica
1. **Estructura Oficial (`[PREFIJO]-[YYMM]-[SECUENCIAL_5_DIGITOS]`):**
   - Se elimina el `id_cliente` intermedio del identificador del negocio (`codi_proyecto`) y se amplía el correlativo numérico de 3 a **5 dígitos con relleno de ceros a la izquierda (`00001` a `99999`)**.
   - Ejemplo canónico: **`GSP-2611-00001`** (`BMQ-2611-00001`, `LDS-2611-00001`, `RYL-2611-00001`, `INT-2611-00001`).
2. **Secuencia Continua Histórica por Prefijo (Sin Reinicio Mensual):**
   - El correlativo atómico en `tpry_correlativos` se almacena e incrementa bajo la clave continua `anio_mes = '0000'` por `prefijo`, garantizando que la numeración `00001..99999` sea estrictamente correlativa e ininterrumpida a lo largo del tiempo (sin reiniciarse al cambiar de mes o año).
   - El segmento visual `[YYMM]` impreso en `codi_proyecto` continúa reflejando el año y mes real de creación del negocio (`${yy}${mm}`).
3. **Validación Regex Retrocompatible (`proyectosController.js`):**
   - El patrón de reconocimiento de códigos formales se actualiza a `/^(GSP|BMQ|LDS|RYL|PRY|INT)-\d{4}(?:-\d+)?-\d{3,5}$/`, validando nativamente el nuevo estándar de 5 dígitos sin segmento de cliente y preservando compatibilidad con cualquier registro histórico de 3 dígitos.
4. **Propagación Automática en Cotizaciones PDF y Documentos:**
   - Las versiones de cotización (`${codi_proyecto}-V1`, `${codi_proyecto}-V2`) y las órdenes de trabajo (`OT-${codi_proyecto}`) adoptan automáticamente el nuevo serial (`GSP-2611-00001-V1`, `OT-GSP-2611-00001`).

---

## 17. Modalidad de Servicio Exclusivo de Personal Certificado / Solo Rigger (Sin Maquinaria) (REQ-1090 / CASO-20261102-04 — 02-Nov-2026)

### 17.1. Naturaleza del Negocio y Alcance
El ecosistema soporta órdenes de trabajo (OT) cuyo alcance comercial consiste exclusivamente en la provisión de **Personal Certificado en Terreno** (`tipo === 'PERSONAL CERTIFICADO'`, subcategorías `RIGGER`, `OPERADOR EXTERNO`, `PREVENCIONISTA DE RIESGOS`, `SUPERVISOR DE IZAJE`) sin arriendo de grúas ni camiones pluma (`linesEquiposPrincipales.length === 0`).

### 17.2. Asignación e Hidratación en Sub-Pestaña `3. Asignación` (Sección 3 — Especialistas & Personal Técnico en Terreno)
1. **Erradicación de Placeholders Ficticios (`CRN-DEFAULT`, `OP-101`, `RIG-201`):**
   - El objeto reactivo `operacionesAssignment` y el método `buildPayload()` nunca deben inyectar ni persistir strings ficticios (`'CRN-DEFAULT'`, `'OP-101'`, `'RIG-201'`). Cuando no existe recurso asignado, el valor canónico es `null`.
2. **Hidratación Determinística de Rigger en Servicios Sin Maquinaria:**
   - En servicios con grúas (`linesEquiposPrincipales.length > 0`), el Rigger se asigna en la tarjeta del equipo principal (Sección 1) y se excluye de `especialistasTerreno` (Sección 3) para evitar duplicidad.
   - En cambio, cuando `linesEquiposPrincipales.length === 0` (Servicio Solo Personal / Solo Rigger), `cargarDatosCotizacion()` **habilita y pobla automáticamente el cargo `Rigger` dentro de `especialistasTerreno` (Sección 3)** a partir de las líneas comerciales `PERSONAL CERTIFICADO` o del flag `requiere_rigger`, hidratando su `id_user` desde `ejecucion_v1.especialistas_terreno`, `ejecucion_v1.tripulacion_asignada`, `ejecucion_v1.rigger_id` o `tpry_rel_persona`.
3. **Enrolamiento Rápido de Rigger Externo (`+ Ext`) en Sección 3:**
   - La fila de `Rigger` en la Sección 3 incorpora el botón `[+ Ext]` (`abrirModalRiggerExterno(esp)`), permitiendo enrolar y asignar un Rigger externo en caliente aun cuando la OT no contenga maquinaria.
4. **Confirmación de Asignación (`confirmarAsignacionOT`):**
   - Resuelve `rigger_id` tanto desde `linesEquiposPrincipales[0]?.rigger_asignado_id` como desde el especialista con cargo `Rigger` en `especialistasTerreno`, sincronizándolo en `tpry_rel_persona` y `ejecucion_v1.tripulacion_asignada` sin exigir `id_equipo`.

### 17.3. Exención de Inspección de Flota y Pase Directo en `5. Control de Flota & Despacho` (`preparacion_salida`)
1. **Tarjeta de Exención de Flota en Columna 1:**
   - Cuando `equiposAsignadosLista.length === 0`, la Columna 1 (`1. Inspección Patio & Flota`) despliega una tarjeta informativa dedicada (**"Servicio Exclusivo de Personal Certificado en Terreno — Sin Maquinaria"**) que lista al Rigger/Especialista asignado e informa que la OT está exenta de Checklist de Salida de Patio (Template 76) y de Hoja de Ruta GPS de flota.
   - Los indicadores `statusSegmento2` y `statusSegmento3` evalúan automáticamente en `'GREEN'` siempre que exista al menos un integrante con `id_user` en `tripulacionAsignada`.
2. **Desbloqueo y Persistencia Determinística del Botón `finalizarPreparacionSalida`:**
   - El botón primario `[FINALIZAR PREPARACIÓN & LIBERAR FLOTA A EJECUCIÓN TERRENO]` solo se deshabilita cuando `preparacionSalidaState.preparacion_finalizada === true`.
   - Al ejecutar `finalizarPreparacionSalida()`, el sistema marca automáticamente `validacion_estricta = true`, `analista_revision_360 = true`, `analista_geocerca_activa = true` y `preparacion_finalizada = true`, actualiza `subtab_activa = 'reports'` y `subtab_actual_view = 'reports'` en `rawEjecucionJson` y `opportunity.json_field.ejecucion_v1` **antes** de invocar `buildPayload()` y `PUT /proyectos/:id`, navega a la sub-pestaña `6. Reportes Diarios de Izaje`, carga los reportes del proyecto y emite `emit('creada')` para que `Torre.vue` traslade de inmediato la tarjeta desde la Columna 4 (`EN PREPARACIÓN OPERACIONES`) hacia la Columna 5 (`EN EJECUCIÓN / FAENA`).

### 17.4. Soporte en Ejecución (`reports`), Control Operativo en Vivo e ITS
1. **Regularización y Reportes Diarios sin Equipo (`reportDiarioController.js`):**
   - En `regularizarReporteManual`, si el proyecto no registra equipos en `tpry_rel_equipo`, `id_equipo` se mantiene en `NULL` (queda prohibido asignar el fallback `id_equipo = 35`). El especialista/Rigger asignado en `tpry_rel_persona` se vincula en `id_user_rigger` e `id_user_operador`.
2. **Control Operativo en Vivo (`controlVivoController.js`):**
   - Cuando un proyecto en ejecución carece de maquinaria en `tpry_rel_equipo` pero posee personal asignado (`Rigger` / `Especialista`), la tarjeta viva expone `patente: 'PERSONAL'`, `tipo_equipo: 'SERVICIO RIGGER / ESPECIALISTA'` y el nombre real del especialista asignado.
3. **Liquidación Comercial y de Personal en ITS (`itsController.js`):**
   - Cuando la línea comercial está pactada bajo unidad `Valor Fijo` / `Jornada`, la jornada en el ITS se valoriza con `horas_report = 1.0`, `tipo_servicio = 'Valor Fijo / Jornada'` y `subtotal = valorUnitario` (evitando multiplicar la tarifa fija por las horas de presencia en obra).
   - Cuando en un reporte sin maquinaria el mismo especialista figura en `id_user_operador` e `id_user_rigger`, `itsController.js` lo consolida una única vez bajo `rol_personal = 'RIGGER'` para el cálculo de horas y viático de alimentación.

---

## 18. Triple Vista Comparativa de Tablero Kanban en Torre de Control (`Torre.vue` — REQ-1096 — 02-Nov-2026)

### 18.1. Objetivo de Usabilidad y Evaluación Comparativa ("Full Sucursal")
Con el propósito de resolver la búsqueda y contención visual cuando una sucursal opera a máxima capacidad ("Full Sucursal") y permitir evaluar en vivo las alternativas de experiencia de usuario, `Torre.vue` dispone en su selector principal de vistas de **3 modalidades de tablero Kanban contiguas**:

1. **`🗂️ Tablero Kanban` (`activeView = 'kanban'` — Vista Base Original):**
   - Conserva 100% intacta la estructura original de 6 columnas y sus tarjetas clásicas sin alteraciones.
2. **`⚡ Kanban + Filtros` (`activeView = 'kanban_filtros'` — Propuesta UX de Alta Densidad y Tarjetas Contextuales):**
   - Incorpora una **Barra de Comando y Filtros Multicriterio** que permite filtrar simultáneamente por:
     - **Tipo de Fecha (`FECHA_EJECUCION` vs. `FECHA_VENTA`)** con Presets rápidos (`Todos`, `Hoy`, `Mañana`, `Esta Semana`, `Este Mes`) y rango `Desde` / `Hasta`.
     - **Operador Asignado** (incluyendo filtro rápido `Sin Operador`).
     - **Rigger Asignado** (incluyendo filtros rápidos `Falta Rigger` y `Servicio Solo Rigger`).
     - **Equipo / Patente**, **Cliente Mandante** y **Ejecutivo Comercial**.
     - **Selector de Densidad (`Expandida` vs. `Compacta`)** y **Agrupación Intra-Columna por Horizonte de Fecha**.
   - En las columnas de **Fase Operativa (Columnas 3, 4 y 5)**, las tarjetas muestran explícitamente:
     - **Folio (`codi_proyecto`)** y **Cliente (`nombre_cliente`)** + **Obra**.
     - **Fechas Duales:** Ventana de Ejecución (`Inicio ➔ Término`) y Fecha de Venta/Cotización.
     - **Operador Asignado**, **Rigger Asignado** y **Equipo / Patente** (o insignia `SOLO RIGGER`).
3. **`🗄️ Cardex 3D` (`activeView = 'kardex'` — Mueble Tarjetero 3D con Elevación Dinámica de Fichas):**
   - Representa cada una de las 6 columnas operativas como un **cajón tarjetero indexado en perspectiva 3D (`CSS3 perspective / preserve-3d`)**.
   - **Estado Plegado en Cajón (Reposo):** Las tarjetas apiladas muestran en su ceja superior biselada únicamente el **Número del Negocio (`codi_proyecto`)** y el **Nombre del Cliente (`nombre_cliente`)**, permitiendo contener decenas de fichas por columna en una sola vista.
   - **Elevación 3D por Criterio (`Pop-Up 3D`):** En la medida en que el usuario selecciona un criterio en la barra superior (por **Fecha de Ejecución**, **Fecha de Venta**, **Píldora de Fecha específica del carrusel temporal**, **Operador**, **Rigger**, **Cliente** o búsqueda de texto) o interactúa con una ceja, las tarjetas que cumplen el criterio **se levantan físicamente en 3D fuera del cajón**, desplegando el detalle completo del servicio (**Fechas de Ejecución y Venta, Operador, Rigger, Equipo/Patente, Obra, Monto y acceso directo al expediente**).

---

## 19. Gobernanza del Estructurador Comercial, Ciclo de Vida de Rigger/Prevencionista, Vigencia de Versiones de Cotización en Operación y Herencia de Piso Mínimo (`REQ-1100` — 03-Nov-2026)

### 19.1. Ciclo de Vida de Rigger y Prevencionista en el Estructurador de Servicios
1. **Inyección Inicial en Preventa al Marcar el Check/Selector:**
   - Cuando el ejecutivo comercial marca manualmente `Requiere Rigger = SÍ` (`opportunity.requiere_rigger = true`) o `Prevencionista = SÍ` (`opportunity.requiere_prevencionista = true`) durante la estructuración comercial (`!isHydrating.value`), el **Estructurador de Servicios** agrega inmediatamente la fila comercial correspondiente (`PERSONAL CERTIFICADO — RIGGER` con descripción `"Servicio de Rigger Certificado"` o `PERSONAL CERTIFICADO — PREVENCIONISTA` con descripción `"Servicio de Prevencionista Certificado"`), siempre que no exista ya en `lines.value`.
2. **Eliminación Comercial Respetada y Desacoplada del Requerimiento Operativo:**
   - El ejecutivo comercial **puede eliminar libremente** la fila de `RIGGER` o `PREVENCIONISTA` desde el Estructurador de Servicios (mediante `eliminarLinea(idx)`) cuando, por motivos comerciales, dicho recurso está incluido en la tarifa de la grúa o no se cobra como ítem separado en la cotización PDF.
   - **Regla de No-Regresión Operativa:** Eliminar la fila comercial del Estructurador **NO desmarca** `opportunity.requiere_rigger = true` ni `opportunity.requiere_prevencionista = true`, de modo que Operaciones conserva intacta la instrucción de asignar un Rigger/Prevencionista a la maniobra.
   - **Prohibición de Re-Inyección Automática en Hidratación (`isHydrating` Guard):** Ambos `watch` (`opportunity.value.requiere_rigger` y `opportunity.value.requiere_prevencionista`) deben evaluar obligatoriamente `if (isHydrating.value) return;` en su primera línea. Queda estrictamente prohibido que al abrir un negocio existente, cambiar de pestaña o recargar `cargarDatosCotizacion()` el sistema vuelva a inyectar automáticamente la fila de Rigger o Prevencionista que el ejecutivo comercial decidió eliminar o excluir del itemizado.

### 19.2. Limpieza y Sugerencia Automática de Descripción al Cambiar Categoría o Subcategoría (`onTipoChange` / `onSubcategoriaChange`)
1. **Saneamiento al Cambiar `Categoría` (`onTipoChange`):**
   - Cuando el usuario cambia la categoría (`line.tipo`) de una fila existente en el Estructurador (por ejemplo, cambiando una fila de `PERSONAL CERTIFICADO` a `GRUAS TELESCOPICAS`), si `line.descripcion` contiene una glosa por defecto de otra categoría (`"Servicio de Rigger Certificado"`, `"Servicio de Prevencionista Certificado"`, `"Flete / Traslado "` o `"HORAS MINIMAS DIARIAS "`), el sistema **limpia automáticamente `line.descripcion`** para impedir que una grúa conserve por arrastre la glosa `"Servicio de Rigger Certificado"`.
2. **Sugerencia Automática al Seleccionar `Subcategoría` (`onSubcategoriaChange`):**
   - Al seleccionar una `Subcategoría` (`line.subcategoria`):
     - Si `line.tipo === 'GRUAS TELESCOPICAS'` o `'CAMIONES PLUMA'` y `line.descripcion` está vacía o contiene una plantilla previa (`"Servicio de Rigger Certificado"`, `"Servicio de Prevencionista Certificado"`, `"HORAS MINIMAS DIARIAS ..."`), se sugiere automáticamente `HORAS MINIMAS DIARIAS ${line.subcategoria}` (cuando la unidad es `Horas Diarias Minimas`) o `SERVICIO ${line.subcategoria}`.
     - Si `line.tipo === 'PERSONAL CERTIFICADO'` y `line.subcategoria === 'RIGGER'`, se sugiere `"Servicio de Rigger Certificado"`. Si `line.subcategoria === 'PREVENCIONISTA'`, se sugiere `"Servicio de Prevencionista Certificado"`.

### 19.3. Gobernanza de Versiones de Cotización para Servicios en Operación (`id_proyecto_estado >= 3`)
1. **Edición Comercial Controlada sin Regresión de Estado Operativo:**
   - Cuando un negocio ya se encuentra en fase operativa (`id_proyecto_estado >= 3`: Asignación, Preparación, En Ejecución o Cierre Técnico), la pestaña `1. Preventa Comercial` dispone del botón explícito **`[✏️ Modificar Cotización / Nueva Versión]`** (`modoEdicionComercialOperaciones`).
   - Al activarlo, se habilita la edición del Estructurador de Servicios y el botón **`[📄 Generar Nueva Versión Cotización]`** (`generarPDF`), manteniendo **oculto y bloqueado el botón `[Generar Requerimiento]`** (`estadoDbActual <= 2`).
   - **Invariante de Continuidad Operacional:** Generar o enviar una nueva versión de cotización sobre un servicio en operación **NUNCA retrocede `id_proyecto_estado` a `1` o `2`**, **NUNCA exige volver a pasar por `"Generar Requerimiento"`**, **NUNCA bloquea los registros de viaje (`tequ_log_desplazamiento`) de los operadores en la PWA** y **NUNCA elimina las asignaciones operativas (`tpry_rel_equipo`, `tpry_rel_persona`, `equipo_asignado_id`, `operador_asignado_id`, `rigger_asignado_id`)**.
2. **Snapshot por Versión y Condición de Vigencia Operativa (`BORRADOR_NO_ENVIADO` vs. `ENVIADA_VIGENTE`):**
   - Al invocar `generarCotizacionVersion` (`POST /api/proyectos/:id/generar-cotizacion`), cada versión registrada en `crm_v1.cotizaciones_historicas` almacena su propio `lineas_snapshot` (copia inmutable de las líneas comerciales de esa versión) y nace con `estado_vigencia: 'BORRADOR_NO_ENVIADO'`.
   - **Regla de Vigencia en Operación:** Si el proyecto ya está en Operación (`id_proyecto_estado >= 3`), mientras la nueva versión (`v2`, `v3`, etc.) **NO haya sido enviada formalmente al cliente** mediante **`[ENVIAR COTIZACIÓN]`**:
     - El sistema despliega una alerta explícita al ejecutivo comercial:
       > *"⚠️ Atención Comercial: Ha generado una nueva versión de cotización (vX) sobre un servicio que ya está en Operación. Mientras NO envíe formalmente esta cotización al cliente ([ENVIAR COTIZACIÓN]), esta versión NO tiene validez operativa y el Report Diario seguirá rigiéndose por la última cotización enviada."*
     - En `2. Control de Versiones & Envíos`, la versión no enviada exhibe la insignia **`🟠 BORRADOR SIN VALIDEZ OPERATIVA (PENDIENTE DE ENVÍO)`**, mientras la última versión enviada mantiene la insignia **`🟢 VIGENTE EN OPERACIONES (ENVIADA)`**.
     - El backend conserva en `crm_v1.lineas_operativas_vigentes` (y en la resolución de `horas_minimas` del Report Diario) la estructura de la **última cotización enviada formalmente**, de modo que un borrador no enviado jamás altera la operación en curso.
3. **Activación Automática en Caliente (`Hot-Sync`) al Enviar Formalmente la Nueva Cotización (`[ENVIAR COTIZACIÓN]`):**
   - El bloque `2. Control de Versiones & Envíos` y su botón **`[ENVIAR COTIZACIÓN]`** permanecen siempre habilitados, incluso cuando `isModoOperaciones` es `true`.
   - En el instante en que el ejecutivo comercial envía formalmente la nueva versión al cliente (`ModalEnviarCotizacion.vue` ➔ `onEmailSent` ➔ `PUT /api/proyectos/:id`):
     - La versión enviada pasa a `estado_vigencia = 'ENVIADA_VIGENTE'`.
     - El backend (`proyectoModel.updateProyecto`) actualiza `crm_v1.lineas_operativas_vigentes` con el `lineas_snapshot` de la versión recién enviada y sincroniza en caliente (`hot-sync`) los atributos comerciales (`descripcion`, `unidad`, `cantidad`, `cantidad_dias`, `cantidad_horas`, `pisoMinimo`, `valorUnitario`) en `crm_v1.lineas_servicio`, **preservando intactos** `equipo_asignado_id`, `operador_asignado_id`, `rigger_asignado_id`, `fecha_plan_ini` y `fecha_plan_fin`.
     - Asimismo, actualiza automáticamente `horas_minimas` y recalcula `horas_facturables = GREATEST(COALESCE(horas_operadas, 0), nuevo_piso_minimo)` en los registros abiertos/no validados de `tedp_reporte_avance` pertenecientes al proyecto.

### 19.4. Resolución Unificada de Horas Mínimas Contractuales (`pisoMinimo`) en Todas las Vías de Creación de Report Diario
1. Tanto `controlVivoController.overrideHitoActividad` (al crear o actualizar un reporte desde la Matriz PMO / Control en Vivo) como `reportDiarioController.regularizarReporteManual` y `reportDiarioController.getReportContexto` deben resolver `horas_minimas` dinámicamente desde la línea comercial vigente del equipo (priorizando `crm_v1.lineas_operativas_vigentes` o el `lineas_snapshot` de la última versión en `cotizaciones_historicas` con `eventos_envio` / `evento_envio`, y en su defecto `crm_v1.lineas_servicio`), extrayendo `Number(linea.pisoMinimo || linea.cantidad_horas)` y utilizando `8.0` únicamente como fallback de último recurso cuando no exista piso mínimo definido (`> 0 && <= 24`).

---

## 20. Taxonomía Determinista de Líneas por Categoría y Subcategoría — Prohibición de Inferencia por Descripción Libre (`REQ-1101` / `CASO-20261103-05` — 03-Nov-2026)

### 20.1. Regla Inviolable de Clasificación de Líneas Comerciales (`GestorOportunidades.vue` & `Torre.vue`)
1. **Prohibición de Evaluar `l.descripcion` para Clasificar el Tipo de Recurso:**
   - El campo `l.descripcion` en el Estructurador de Servicios es un texto comercial libre donde el ejecutivo redacta glosas como *"HORAS MÍNIMAS MENSUALES ARRIENDO DE CAMIÓN PLUMA CON OPERADOR"*, *"CON RIGGER CERTIFICADO"* o *"INCLUYE TRASLADO"*.
   - Queda **estrictamente prohibido** utilizar `l.descripcion` para determinar si una línea pertenece a:
     - **Sección 1 (`1. FLOTA PRINCIPAL & OPERADORES DE SERVICIO` — `linesEquiposPrincipales`)**
     - **Sección 2 (`2. EQUIPOS DE TRASLADO & CHOFERES (LOGÍSTICA)` — `isTrasladoLine`)**
     - **Sección 3 (`3. ESPECIALISTAS & PERSONAL TÉCNICO EN TERRENO` — `isPersonalLine`)**
     - **Modalidad Dry Lease (`PLATAFORMAS` — `esLineaPlataforma`)**
2. **Reglas Deterministas por Atributos Estructurados (`l.tipo`, `l.subcategoria`, `l.unidad`):**
   - **`isPersonalLine(l)`:** Retorna `true` única y exclusivamente cuando `l.tipo` es `'PERSONAL CERTIFICADO'` / `'PERSONAL'` (o cuando `l.tipo === ''` en registros legacy y `l.subcategoria` es `'RIGGER'`, `'PREVENCIONISTA'`, `'OPERADOR'` o `'SUPERVISOR'`). Si `l.tipo !== ''` (por ejemplo `'GRUAS TELESCOPICAS'`, `'CAMIONES'`, `'GRUA HORQUILLA'`, `'PLATAFORMAS'`, `'TRASLADOS'`), retorna siempre `false`.
   - **`isTrasladoLine(l)`:** Retorna `true` única y exclusivamente cuando `l.tipo` es `'TRASLADOS'` / `'TRASLADO'` / `'FLETE'` o cuando `l.unidad` corresponde a una unidad de traslado (`'TRASLADO IDA/VUELTA'`, `'TRASLADO SOLO IDA'`, `'TRASLADO SOLO RETORNO'`, `'TRASLADO'`, `'FLETE'`, `'VIAJE'`).
   - **`esLineaPlataforma(l)`:** Retorna `false` de inmediato si `l.tipo === 'TRASLADOS'`, `l.tipo === 'CAMIONES'` o `l.subcategoria.includes('CAMION PLATAFORMA')`, impidiendo confundir un camión plataforma logístico con una plataforma elevadora (manlift / tijera) Dry Lease.
   - **Rol de Operador para `CAMIONES — CAMION PLUMA`:** `tripulacionAsignada` y `getOperadorAsignadoAEquipo` evalúan `${line.tipo} ${line.subcategoria}` para asignar el cargo `'Operador Camión Pluma'` cuando corresponde a `CAMIONES` / `PLUMA`.

### 20.2. Resolución Integral de Equipo y Operador en `Torre.vue` (`getFichaOperativa` y `getHitoAsignacion`)
1. **Resolución de Equipo / Patente (`equipoNombre` / `equipoLabel`):**
   - Evalúa en orden de precedencia: `ej.equipo_id` ➔ `lineas.find(l => l.equipo_asignado_id)?.equipo_asignado_id` ➔ `ej.equipos_extra.find(ex => ex?.id_equipo)?.id_equipo` ➔ `ej.recursos_asignados?.equipos?.[0]`.
   - Si aún no existe patente asignada, resuelve la subcategoría de la primera línea comercial de maquinaria (`reqEquipoComercial`) antes de recurrir al valor por defecto de `crm.familia_servicio`.
2. **Resolución de Operador / Conductor (`operadorNombre` / `operadorLabel`):**
   - Evalúa en orden de precedencia: `ej.operador_id` ➔ `lineas.find(l => l.operador_asignado_id)?.operador_asignado_id` ➔ `ej.equipos_extra.find(ex => ex?.chofer_id)?.chofer_id` ➔ `ej.chofer_id` ➔ `ej.tripulacion_asignada.find(t => /operador|chofer|conductor/i.test(t.rol || t.cargo))?.id_user`.

### 20.3. Matriz Determinista de Visibilidad de Líneas `TRASLADOS` en Sección 2 (`sincronizarTrasladosComerciales`) — Cero Lectura de `descripcion`
Queda **estrictamente prohibido** evaluar el texto libre `l.descripcion` o depender de `opportunity.value?.tipo_caso === 5` para decidir si una línea de `Categoría = TRASLADOS` se muestra en la **Sección 2 (`2. EQUIPOS DE TRASLADO & CHOFERES`)**. La decisión se gobierna **100% por `Categoría (l.tipo)` y `Subcategoría (l.subcategoria)`**:

| # | Composición de Equipos Principales (Sección 1) | Línea en `Categoría = TRASLADOS` | ¿Se muestra en Sección 2 (Asignación de Vehículo + Chofer)? | Razón de Negocio |
| :--- | :--- | :--- | :---: | :--- |
| **1** | **Solo Camión (`Categoría = CAMIONES`, ej. `CAMION PLUMA`)** (sin Plataformas/Horquillas) | Cualquier subcategoría | **NO (`false`)** | El Camión Pluma es autopropulsado (viaja con su propio operador) y no lleva camión auxiliar de contrapesos. Su línea de traslado es solo cobro comercial. |
| **2** | **Grúa Telescópica (`Categoría = GRUAS TELESCOPICAS`)** | `Subcategoría` de Grúa (`GRUA ... TON`) | **NO (`false`)** | Es el cobro de movilización de la propia Grúa Telescópica (autopropulsada, viaja con su operador de Sección 1). |
| **3** | **Grúa Telescópica (`Categoría = GRUAS TELESCOPICAS`)** | `Subcategoría` de Camión Auxiliar (`CAMA BAJA`, `CAMIÓN PLATAFORMA`, `RAMPLA`, `TRACTOCAMIÓN`) | **SÍ (`true`)** | Cuando una Grúa Telescópica lleva además una línea de `TRASLADOS` con subcategoría `CAMA BAJA` / `CAMIÓN PLATAFORMA`, corresponde al camión auxiliar que transporta sus contrapesos/aparejos y requiere asignar vehículo + chofer. |
| **4** | **Equipos No Autopropulsados (`Categoría = PLATAFORMAS`, Alza Hombre, Horquilla)** | `Subcategoría` de Camión (`CAMA BAJA`, `CAMIÓN PLATAFORMA`) | **SÍ (`true`)** | Las plataformas/horquillas no se desplazan solas por carretera; requieren asignar el camión de traslado y su chofer en Sección 2. |
| **5** | **Ningún equipo en Sección 1** (`linesEquiposPrincipales.length === 0`, solo venta de `TRASLADOS`) | Cualquier subcategoría | **SÍ (`true`)** | Es un servicio de Flete/Transporte puro; requiere asignar en Sección 2 el camión y el chofer que hará el viaje. |

---

## 21. Eliminación de Prellenados en Condición del Servicio y Alimentación/Pensiones (`REQ-1103`) y Obligatoriedad de Descripción del Servicio con Herencia a la Orden de Trabajo (`REQ-1104` — 04-Nov-2026)

### 21.1. Condición del Servicio y Responsabilidad de Alimentación / Pensiones Sin Prellenado ni Opción `"No Aplica"` (`REQ-1103`)
1. **Inicialización en Blanco (`''`) por Defecto:**
   - El estado reactivo `comercial.value.condicion_servicio` debe inicializarse en blanco (`''`, nunca prellenado en `'programado'`).
   - Los 5 campos de `comercial.value.pensiones` (`alojamiento_costeado`, `desayuno_costeado`, `almuerzo_costeado`, `cena_costeado`, `traslado_costeado`) deben inicializarse en blanco (`''`, nunca prellenados en `'CLIENTE'` ni `'SAN_PABLO'`).
2. **Eliminación de la Opción `"No Aplica (N/A)"` y Alerta Visual en Rojo:**
   - Se elimina de los 5 selectores de pensiones la opción `<option value="NA">No Aplica (N/A)</option>` y el badge `"⚠️ NO APLICA (Servicio de 1 Día)"`.
   - Cada selector ofrece únicamente el placeholder `<option value="" disabled>-- Seleccionar (Obligatorio) --</option>`, `<option value="CLIENTE">Costeado por Cliente</option>` y `<option value="SAN_PABLO">Costeado por San Pablo</option>`.
   - Tanto `Condición del Servicio *` (`Programado` vs. `A Disponibilidad`) como cada uno de los 5 selectores de `Pensiones *` se marcan visualmente en rojo (`border-red-500/80 bg-red-500/10`) mientras permanezcan vacíos (`''`).
   - Además de la sub-pestaña `Condiciones Comerciales`, el bloque de `Condición del Servicio *` y `Alimentación, Estadía y Traslado Personal *` se expone directamente en el formulario principal de `1. Preventa Comercial` para que el vendedor lo complete sin omisiones antes de cotizar.
3. **Hidratación Estricta sin Fallbacks Prellenados (`cargarDatosCotizacion`):**
   - Al cargar un negocio existente, `comercial.value.condicion_servicio = crm.condicion_servicio || ''` y `comercial.value.moneda = crm.moneda || 'CLP'`.
   - Cada campo de `comercial.value.pensiones` se hidrata exclusivamente si su valor guardado es `'CLIENTE'` o `'SAN_PABLO'`; si está vacío o era `'NA'`, se mantiene en `''` para obligar al usuario a definirlo conscientemente.
4. **Compuerta de Validación Obligatoria (`validarDatosPreventaParaCotizar`):**
   - Antes de permitir `Generar Cotización PDF` o `Generar Requerimiento` hacia Operaciones, el sistema verifica obligatoriamente que `comercial.value.condicion_servicio` (`'programado'` o `'disponibilidad'`) y los 5 campos de `comercial.value.pensiones` (`'CLIENTE'` o `'SAN_PABLO'`) estén seleccionados.

### 21.2. Obligatoriedad de Descripción del Servicio en Preventa y Herencia Automática a la Orden de Trabajo (`REQ-1104`)
1. **Sincronización Unificada y Obligatoriedad en Preventa (`GestorOportunidades.vue`):**
   - Los campos `opportunity.value.descripcion` (`Descripción del Servicio / Faena *`) y `siteVisit.value.detalle_servicio` (`Detalle del Servicio a realizar *`) operan sincronizados bidireccionalmente, hidratándose desde `crm.descripcion || crm.detalle_servicio || p.objetivo_proyecto || p.observacion_proyecto || ''` y persistiendo ambos en `crm_v1` (`descripcion` y `detalle_servicio`) además de `objetivo_proyecto` y `observacion_proyecto`.
   - Se incorpora bajo el área de texto una advertencia visible:
     > *"⚠️ Campo obligatorio: Esta descripción e instrucciones comerciales (detalle maniobra, viáticos, autorización Uber, horas dobles, etc.) se reflejarán directamente en la Orden de Trabajo (OT) para el operador."*
   - Tanto `guardarEnPreventa()` como `validarDatosPreventaParaCotizar()` exigen que la descripción del servicio no esté vacía.
2. **Herencia Automática en Pantalla (`3. Asignación Recursos OT`) y en el PDF Oficial de la OT (`proyectoModel.js`):**
   - En la sub-pestaña `3. Asignación Recursos OT` (`operacionesSubTab === 'asignacion'`), se despliega una tarjeta destacada con la **`Descripción Comercial del Servicio & Instrucciones para el Operador`** heredada directamente de Preventa.
### 21.3. Regla de Visualización de Horas Mínimas y Políticas de Cobro por Equipo/Patente en la Orden de Trabajo (`REQ-1105`)
1. **Exclusión Estricta de `Personal Certificado` y `Traslados` (`esLineaPersonalOT` / `esLineaTrasladoOT`):**
   - Al construir la Orden de Trabajo (`generarOTVersion` en `proyectoModel.js`), el sistema clasifica las líneas exclusivamente por `l.tipo` (`Categoría`) y `l.subcategoria` (`Subcategoría`), excluyendo de forma absoluta las categorías `PERSONAL CERTIFICADO` (`PERSONAL`, `RIGGER`, `PREVENCIONISTA`, `SUPERVISOR`) y `TRASLADOS` (`TRASLADO`, `FLETE`) y prohibiendo evaluar `l.descripcion`.
2. **Despliegue de Todos los Equipos con su Política de Cobro por Patente y Deduplicación Física:**
   - Para cada línea perteneciente a categorías de **Equipos** (`lineasEquiposOT`), se priorizan las líneas base comerciales (`is_linea_base !== false`) y se deduplica por patente (`_resolved_patente`), garantizando la regla **`1 Patente Física = 1 Política de Cobro Contractual`** (`Horas Mes Minimas` -> `X hrs mensuales mínimas (N Meses)`, `Horas Diarias Minimas` -> `X hrs diarias mínimas (N Días)`, `Valor Fijo` -> `Servicio a Valor Fijo Convenido`).
   - En la **Sección 2 (`Piso Mínimo Contractual`)** del PDF de la OT se imprimen todos los equipos principales distintos con su respectiva patente y política de cobro.
   - En la **Sección 3 (`3. Flota & Convoy de Equipos Asignados`)** del PDF de la OT (manteniendo sus 5 columnas canónicas: `N°`, `Equipo / Modelo`, `Patente (PPU)`, `Segmento`, `Operador / Chofer Asignado`), cada equipo principal se lista como `<Categoría> — <Subcategoría>` con segmento `Izaje Principal` y rol `(Operador)`, impidiendo que una patente de `Izaje Principal` (ej. Camión Pluma autopropulsado) se duplique o clasifique como `Traslado & Logística`.





---

## 22. Relevos de Operador por Fecha en un Mismo Equipo, Tramo de Traslado (`Solo Ida`), Nuevo Estándar de 3 Indicadores de Viáticos (`V2_3_INDICADORES`) y Limpieza de Glosa Copec (`REQ-1106`, `REQ-1110`, `REQ-1111` — 04-Nov-2026)

### 22.1. Relevos de Operador por Fecha en un Único Equipo (`turnos_operadores` — `REQ-1110`)
1. **Unicidad de Patente en Flota Principal y Arreglo `turnos_operadores`:**
   - Queda prohibido duplicar la misma máquina física (`id_equipo`) en dos filas distintas de `1. Flota Principal & Operadores de Servicio` para asignar un relevo de operador.
   - Cada línea de equipo principal admite el arreglo estructurado `turnos_operadores: [{ operador_id, fecha_ini, fecha_fin }]`, gestionable desde el botón **`+ Relevo`** en `3. Asignación Recursos OT`.
   - En el PDF de la Orden de Trabajo (`proyectoModel.generarOTVersion`), la tabla `3. Flota & Convoy de Equipos Asignados` consolida una única fila por patente y lista en la columna `Operador / Chofer Asignado` a cada operador con su ventana de fechas (`DD-MM-YYYY al DD-MM-YYYY`), mientras que `4. Dotación Humana & Tripulación de Faena` incorpora a todos los operadores de relevo.

### 22.2. Especificación de Tramo en Equipos de Traslado (`modalidad_traslado` — `REQ-1110`)
1. Cada vehículo en `2. Equipos de Traslado & Choferes (Logística)` dispone del selector `modalidad_traslado`:
   - `IDA_VUELTA`: **`Ida y Vuelta`**
   - `SOLO_IDA`: **`SOLO IDA — Entrega en Obra (Retiro Pendiente)`**
   - `SOLO_RETORNO`: **`SOLO RETORNO — Retiro desde Obra`**
2. Dicha glosa se imprime explícitamente en la columna `Segmento` de la Orden de Trabajo PDF (`Traslado (SOLO IDA — Entrega en Obra (Retiro Pendiente))`).

### 22.3. Nuevo Formato de 3 Indicadores de Viáticos (`Traslado`, `Alimentación`, `Alojamiento`) y Convivencia `V1` / `V2` (`REQ-1111`)
1. **Reemplazo del Desglose de 5 Ítems por 3 Indicadores Consolidados:**
   - El desglose heredado (`Desayuno`, `Almuerzo`, `Cena`, `Alojamiento`, `Traslado`) se reemplaza en Preventa, Operaciones y PDFs de Cotización y OT por **3 indicadores obligatorios**:
     1. **`Traslado`** (`traslado_costeado`: `'CLIENTE'` | `'SAN_PABLO'`)
     2. **`Alimentación`** (`alimentacion_costeado`: `'CLIENTE'` | `'SAN_PABLO'`)
     3. **`Alojamiento`** (`alojamiento_costeado`: `'CLIENTE'` | `'SAN_PABLO'`)
2. **Estrategia de Convivencia sin Migración Destructiva (`V2_3_INDICADORES` vs. `V1_5_ITEMS`):**
   - Todo registro nuevo o editado persiste `formato_viaticos: 'V2_3_INDICADORES'` y ejecuta escritura espejo (`Dual-Write`) copiando `alimentacion_costeado` hacia `desayuno_costeado`, `almuerzo_costeado` y `cena_costeado` para mantener compatibilidad total con ITS y RRHH.
   - Los servicios históricos con `formato_viaticos === 'V1_5_ITEMS'` que posean valores diferenciados entre desayuno, almuerzo y cena continúan renderizando su desglose original en los PDFs sin alteración.

### 22.4. Eliminación de Referencia Estática a Carlos Mendoza / Tarjeta Copec (`REQ-1106`)
1. Se elimina de `GestorOportunidades.vue` cualquier placeholder estático de solicitudes Copec (`Carlos Mendoza`, `HW-8842`, `#COPEC-8492`).
2. En la Sección `5. Elementos de Izaje, Logística & Suministros` del PDF de la Orden de Trabajo (`proyectoModel.generarOTVersion`), cuando el combustible es suministrado por Grúas San Pablo, se imprime exclusivamente:
   > **`Suministrado por Grúas San Pablo (Incluido en tarifa del servicio).`** (prohibida toda mención a `"Carga con Tarjeta Copec en ruta"`).

---

## 23. Blindaje Anti-Regresión de Estado Operativo, Preservación de `ejecucion_v1` ante Pestañas Obsoletas y Verificador Reactivo de Versión Web (`REQ-1112` / `CASO-20261104-02` — 04-Nov-2026)

### 23.1. Candado Anti-Regresión en `proyectoModel.updateProyecto`
1. **Prohibición de Retroceso de `id_proyecto_estado` por Payloads Obsoletos:**
   - Si el estado actual en base de datos es `estadoDB > 1` y un `PUT /api/proyectos/:id` envía un `id_proyecto_estado < estadoDB` (sin flag explícito de reversión administrativa `allow_state_rollback: true`), `updateProyecto` **bloquea el retroceso y conserva `estadoDB`**.
2. **Preservación Profunda de `ejecucion_v1` y Fusión No Destructiva de `cotizaciones_historicas`:**
   - Si un payload entrante desde una pestaña en modo Preventa envía `ejecucion_v1` vacío o sin `ot_versiones` / `equipo_id` cuando la base de datos ya los posee, el backend preserva íntegramente `currentJson.ejecucion_v1` y las claves raíz (`dossier_documentos`, `control_vivo_overrides`, `dias_laborales_override`, `contrato_arriendo`).
   - El arreglo `crm_v1.cotizaciones_historicas` se fusiona por `version` (`Map`), conservando los `eventos_envio` e `id_doc` existentes para que ninguna pestaña desactualizada pueda borrar versiones previas.
3. **Pre-Sincronización antes de Registrar Envío de Correo (`onEmailSent`):**
   - En `GestorOportunidades.vue`, antes de ejecutar `PUT /proyectos/:id` al enviar una cotización por correo, `onEmailSent` consulta `GET /proyectos/:id` para hidratar el `id_proyecto_estado` y `ejecucion_v1` vigentes en el servidor.

### 23.2. Verificador Automático de Versión Web vs. Servidor (`App.vue` & `GET /api/backlog/version`)
1. El endpoint público `GET /api/backlog/version` responde con cabeceras `Cache-Control: no-store, no-cache, must-revalidate` y expone la versión vigente de `package.json`.
2. `App.vue` verifica la versión al iniciar, en cada cambio de ruta (`router.afterEach`), al recuperar el foco/visibilidad de la pestaña (`visibilitychange` / `focus`) y cada 3 minutos, ejecutando `window.location.reload()` cuando detecta una versión nueva desplegada en el servidor.

---

## 24. Estándar Tipográfico de Alta Legibilidad en PDF de Orden de Trabajo (`REQ-1114`) e Ingreso/Reasignación de Ejecutivo Comercial Responsable (`REQ-1115` — 04-Nov-2026)

### 24.1. Tipografía Aumentada y `--disable-smart-shrinking` en PDF de Orden de Trabajo (`REQ-1114`)
1. En `proyectoModel.generarOTVersion`, la plantilla HTML A4 de la Orden de Trabajo aplica obligatoriamente la siguiente escala tipográfica de alta legibilidad para lectura en terreno e impresión física:
   - `body`: `font-size: 14px; line-height: 1.45;`
   - `.ot-title`: `font-size: 24px; font-weight: 900;`
   - `.ot-code`: `font-size: 16px;` y `.ot-version`: `font-size: 13px;`
   - `.section-title`: `font-size: 14px;`
   - Tablas `.info-grid` y `table.data-table`: `font-size: 13.5px;` (encabezados `th`: `12.5px`, etiquetas `.info-lbl`: `13px`)
   - Filas **`Descripción del Servicio (Preventa)`** e **`Instrucciones & Observaciones`**: `font-size: 15px; line-height: 1.5; font-weight: 700 / 600;`
2. El comando `wkhtmltopdf` incluye obligatoriamente el flag `--disable-smart-shrinking` para impedir que el motor reduzca proporcionalmente las fuentes al renderizar el documento A4.

### 24.2. Ingreso de Cotización por Usuario A a Nombre de Usuario B y Reasignación de Ejecutivo Responsable por Administrador (`REQ-1115`)
1. **Selección de Ejecutivo en Creación de Cotización (Usuario A $\rightarrow$ Usuario B):**
   - Al crear una nueva oportunidad/cotización (`!opportunity.id_proyecto`), el selector **`Ejecutivo Comercial Responsable`** (disponible tanto en el badge superior del header como en la sección `1. Datos de la Oportunidad`) está habilitado para cualquier usuario autenticado, permitiendo que un usuario A ingrese la cotización asignándola directamente a un ejecutivo B (`opportunity.id_usuario_creacion`).
2. **Reasignación de Ejecutivo Responsable en Procesos en Curso por Perfil Administrador (`esUsuarioAdministrador`):**
   - Para usuarios con rol Administrador (`ADMIN`, `SUPERADMIN`, `GSP_ADMIN`, `GERENCIA`, `GERENTE`, `DIRECTOR`), el selector **`Ejecutivo Comercial Responsable`** permanece habilitado en todo momento (ubicado fuera de `<fieldset :disabled="isBloqueadoComercial">`) sobre cualquier proceso comercial existente.
   - Al cambiar el ejecutivo responsable (`onCambiarEjecutivoResponsable`), el sistema actualiza de inmediato en PostgreSQL (`PUT /api/proyectos/:id` vía `proyectosController.js` y `proyectoModel.js`) tanto la columna `tpry_proyecto.id_usuario_creacion` como los atributos `id_vendedor`, `vendedor_nombre`, `vendedor_email` y `vendedor_telefono` en `json_field.crm_v1` y `snapshot_comercial`.
   - Asimismo, `proyectoModel.generarCotizacionVersion` resuelve el emisor comercial del PDF priorizando `crm.id_vendedor || p.id_usuario_creacion`.

---

## 25. Visualización Resaltada de `Programado / A Disponibilidad` en Preventa y Edición de `Condición del Servicio` + `Alimentación / Viáticos` en `2. Validación & Diff` de Operaciones (`REQ-1116` — Servicio `0012` — 04-Nov-2026)

### 25.1. Visibilidad Inequívoca de `Programado / A Disponibilidad` en Preventa (`GestorOportunidades.vue`)
1. En la sección `1. Condición del Servicio *` de Preventa, las opciones **`Programado`** (`'programado'`) y **`A Disponibilidad`** (`'disponibilidad'`) aplican clases reactivas de alto contraste (`border-amber-400 bg-amber-500/20 text-amber-200 font-bold shadow-sm` y badge **`✓`**) sobre la opción seleccionada.
2. Esto garantiza que, incluso cuando la oportunidad ya fue enviada como requerimiento a Operaciones y el `<fieldset :disabled="isBloqueadoComercial">` deshabilita los inputs nativos, el usuario vea de forma inmediata y clara qué opción marcó Preventa.
3. En `cargarDatosCotizacion`, la hidratación de `comercial.value.condicion_servicio` normaliza cualquier variante (`'programado'` / `'disponibilidad'` / `'disponible'`) leyendo en cascada desde `crm.condicion_servicio`, `crm.snapshot_comercial?.condicion_servicio` y el último snapshot de `crm.cotizaciones_historicas`.

### 25.2. Edición de `Programado / A Disponibilidad` y Asignación de `Alimentación / Viáticos` en `2. Validación & Diff` de Operaciones
1. En la sub-pestaña **`2. Validación & Diff`** de Operaciones (`operacionesSubTab === 'validacion'`), inmediatamente debajo de `Pestaña B: Estructurador de Servicios`, se dispone del panel interactivo **`Condición del Servicio & Asignación de Viáticos (Validación Operaciones)`** dividido en dos bloques editables:
   - **`1. Condición del Servicio (Validación Operaciones)`:** Permite a Operaciones corregir directamente entre **`Programado`** (`'programado'`) y **`A Disponibilidad`** (`'disponibilidad'`), mostrando en un badge superior lo que marcó originalmente Preventa (`Preventa marcó: Programado / A Disponibilidad`).
   - **`2. Indicadores de Traslado, Alimentación y Alojamiento`:** Permite a Operaciones asignar o modificar el responsable (`Costeado por Cliente` vs. `Costeado por San Pablo`) de **`Traslado`**, **`Alimentación`** (con sincronización automática `onChangeAlimentacionUnificada()` hacia `desayuno_costeado`, `almuerzo_costeado` y `cena_costeado`) y **`Alojamiento`**.
2. **Detección Reactiva de Diferencias (`hasDiff`):**
   - El computed `hasDiff` compara `comercial.value.condicion_servicio` y `comercial.value.pensiones` (`traslado_costeado`, `alimentacion_costeado`, `alojamiento_costeado`) contra `snapshotComercial.value`. Si Operaciones corrige la condición del servicio o modifica la alimentación/viáticos respecto a lo enviado por Preventa, se activa el indicador de diferencia (`Diff`) para habilitar el flujo de solicitud de `V°B° Comercial` o confirmación de validación operativa.

---

## 26. Rediseño Estructural del Cotizador Comercial: Vista de Árbol Liviana por Líneas de Servicio (`REQ-1109` — 05-Nov-2026)

### 26.1. Fundamento Arquitectónico: Separación entre "Línea de Servicio" (Capa 1) y "Recurso Físico" (Capa 2)
1. **Diagnóstico del Modelo Plano Anterior:**
   - El estructurador clásico (`lines: []`) modelaba la cotización únicamente a partir del catálogo físico de inventario (`tpar_categoria`: `GRUAS TELESCOPICAS`, `CAMIONES`, `GRUA HORQUILLA`, `TRASLADOS`, `PERSONAL CERTIFICADO`, `ACCESORIOS`).
   - Este enfoque confundía el **Sustantivo (el activo físico)** con el **Verbo (la solución de negocio contratada)**, impidiendo distinguir cuándo un mismo activo (ej. un `CAMION PLUMA` o una `CAMA BAJA`) se vendía como maniobra de izaje, como servicio de transporte de carga de un cliente, o como arriendo mensual en faena, y dejando huérfanos los fletes, equipos de apoyo y personal respecto del equipo primario al que asistían.
2. **Arquitectura Canónica de 2 Capas:**
   - **Capa 1 — La Línea de Servicio (Unidad de Trabajo / Solución Comercial):** Entidad ordenadora de primer nivel que define qué solución contrata el cliente, cuál es su naturaleza operativa (`tipo_ot`) y qué ramas contextuales habilita.
   - **Capa 2 — Los Recursos y Activos (`tpar_categoria` / `tpar_subcategoria`):** El nodo raíz (Equipo o Recurso Primario) y sus ramas subordinadas (`APOYO`, `TRASLADO`, `PERSONAL`, `ACCESORIO`) que materializan la ejecución de esa Unidad de Trabajo.

### 26.2. Catálogo Oficial de las 4 Líneas de Servicio y sus Recetas Contextuales

| Código Línea (`linea_servicio`) | Nombre Comercial | Tipo OT Handoff (`tipo_ot`) | Recurso Primario Típico (Nodo Raíz) | Política de Cobro Natural | Botones de Ramas Contextuales Directas (`├──` / `└──`) |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **`TRANSPORTE`** | **Servicio de Transporte / Flete** | `OT-FLETE` | Cama Baja, Camión Rampa, Camión Pluma de Autocarga o Tractocamión (traslado de activo del cliente de Origen A $\rightarrow$ Destino B). | `Valor Fijo` (Suma Alzada por viaje) o `Traslado` | `[ + Camioneta Escolta ]`<br>`[ + Conductor Adicional ]`<br>`[ + Rampla / Flete Extra ]` |
| **`RENTAL`** | **Arriendo de Equipos (Rental)** | `OT-RENTAL` | Grúa Horquilla, Manipulador Telescópico, Plataforma o Grúa cedida en obra por período continuo. | `Horas Mes Minimas` (ej. $180\text{ hrs/mes}$ sin mínimo diario, `REQ-1113`) o `Horas Diarias Minimas` | `[ + Flete de Entrega ]` (Día 1)<br>`[ + Flete de Retiro ]` (Pendiente aviso término)<br>`[ + Operador en Faena ]` |
| **`PROFESIONAL`** | **Servicios Profesionales** | `OT-STAFF` | Rigger Acreditado, Asesor en Prevención de Riesgos (APR / Sernageomin) o Supervisor Técnico. | `Horas Diarias Minimas` (Jornada) o `Valor Fijo` (Estudio) | `[ + Viático Alojamiento ]`<br>`[ + Viático Alimentación ]`<br>`[ + Traslado de Personal ]`<br>`[ + Plan de Rigging / Memoria ]` |
| **`IZAJE`** | **Servicio de Grúa / Izaje** | `OT-MANIOBRA` | Grúa Telescópica, Grúa Hidráulica o Camión Pluma en maniobra de levante y montaje. | `Horas Diarias Minimas` (con piso garantizado por jornada, ej. $8\text{ hrs}$) | `[ + Equipo de Apoyo (Contrapesos) ]`<br>`[ + Traslado Grúa ]`<br>`[ + Personal / Rigger ]`<br>`[ + Balancín / Canastillo ]` |

### 26.3. Diseño Visual y Experiencia de Usuario: Tree Table Liviana
1. **Principio de Ligereza Visual (Cero Saturación de Cajas):**
   - Queda prohibido anidar tarjetas pesadas o múltiples contenedores con bordes gruesos y fondos saturados.
   - Cada Unidad de Trabajo se presenta como una **Tabla Tipo Árbol (Tree Table)** sobria y continua:
     - **Cabecera Compacta de la Unidad:** Muestra el correlativo (`1`, `2`...), el badge de la Línea de Servicio (`TRANSPORTE`, `RENTAL`, `PROFESIONAL`, `IZAJE`), el título editable del servicio, el código de traspaso (`OT-FLETE`, `OT-RENTAL`, `OT-STAFF`, `OT-MANIOBRA`) y el `Subtotal Servicio`.
     - **Fila Raíz (Recurso Primario):** Destacada con indicador circular y etiqueta `Primario`. Permite seleccionar Categoría/Subcategoría desde `dbCategories`, definir la modalidad (`Horas Diarias Minimas`, `Horas Mes Minimas`, `Valor Fijo`, `Traslado`), ingresar las magnitudes físicas (Días/Meses $\times$ Horas o Cantidad) y la Tarifa Unitaria.
     - **Filas Hijas (Ramas Subordinadas):** Sangradas bajo el equipo primario con conectores tipográficos de árbol (`├──` para ramas intermedias y `└──` para la última rama), etiqueta de rol (`[Apoyo]`, `[Traslado]`, `[Personal]`, `[Accesorio]`), selectores o descripción editable, modalidad/unidad, cantidad, tarifa unitaria, subtotal calculado en vivo y botón `[✕]` para podar la rama.
     - **Barra de Ramas Directas:** Ubicada inmediatamente al pie de las ramas del equipo primario, exponiendo los botones contextuales livianos (`+ Equipo de Apoyo`, `+ Traslado`, `+ Personal`, `+ Accesorio`) según la Línea de Servicio.

### 26.4. Modelo de Datos Canónico: `crm_v1.servicios` y Proyección Dual-Write hacia `crm_v1.lineas_servicio`
Para garantizar **compatibilidad 100% hacia atrás (Zero Breaking Changes)** con todos los controladores backend, reportes financieros, ITS, Torre de Control y la PWA móvil (sin requerir migraciones DDL en PostgreSQL), se establece el patrón de **Persistencia Dual Sincronizada**:

1. **Estructura Jerárquica Canónica (`json_field.crm_v1.servicios`):**
```json
[
  {
    "id_servicio": "srv_1762350001_1",
    "linea_servicio": "IZAJE",
    "tipo_ot": "OT-MANIOBRA",
    "nombre_servicio": "Maniobra de Izaje Industrial con Grúa 70 Ton",
    "origen": "Casa Matriz Temuco",
    "destino": "Planta Celulosa Ránquil",
    "primario": {
      "id_linea": "lin_1762350001_root",
      "rol_arbol": "PRIMARIO",
      "tipo": "GRUAS TELESCOPICAS",
      "subcategoria": "70 TONELADAS",
      "descripcion": "Servicio de izaje con Grúa Telescópica 70 Ton",
      "unidad": "Horas Diarias Minimas",
      "cantidad_dias": 1,
      "cantidad_horas": 8,
      "cantidad_meses": 1,
      "cantidad": 1,
      "pisoMinimo": 8,
      "valor_unitario": 150000,
      "subtotal": 1200000
    },
    "ramas": [
      {
        "id_linea": "lin_1762350001_r1",
        "id_padre": "lin_1762350001_root",
        "rol_arbol": "TRASLADO",
        "tipo": "TRASLADOS",
        "subcategoria": "MOVILIZACIÓN GRÚA",
        "descripcion": "Movilización Grúa 70T (Temuco -> Ránquil)",
        "unidad": "TRASLADO IDA/VUELTA",
        "cantidad": 2,
        "valor_unitario": 120000,
        "subtotal": 240000
      },
      {
        "id_linea": "lin_1762350001_r2",
        "id_padre": "lin_1762350001_root",
        "rol_arbol": "APOYO",
        "tipo": "CAMIONES",
        "subcategoria": "CAMION RAMPLA",
        "descripcion": "Camión Rampla para 20 Ton de Contrapesos",
        "unidad": "Traslado",
        "cantidad": 1,
        "valor_unitario": 180000,
        "subtotal": 180000
      },
      {
        "id_linea": "lin_1762350001_r3",
        "id_padre": "lin_1762350001_root",
        "rol_arbol": "PERSONAL",
        "tipo": "PERSONAL CERTIFICADO",
        "subcategoria": "RIGGER",
        "descripcion": "Rigger Certificado de Maniobra",
        "unidad": "Horas Diarias Minimas",
        "cantidad_dias": 1,
        "cantidad_horas": 8,
        "cantidad": 1,
        "pisoMinimo": 8,
        "valor_unitario": 15000,
        "subtotal": 120000
      }
    ],
    "subtotal_servicio": 1740000
  }
]
```

2. **Proyección Aplanada Sincronizada (`json_field.crm_v1.lineas_servicio`):**
   - Toda modificación en el árbol `servicios` actualiza reactivamente `lines.value` (`crm_v1.lineas_servicio`) aplanando en orden determinista cada nodo `primario` seguido de sus `ramas`.
   - Cada elemento del arreglo plano conserva el 100% de las propiedades clásicas (`tipo`, `subcategoria`, `descripcion`, `unidad`, `cantidad_dias`, `cantidad_horas`, `cantidad_meses`, `cantidad`, `pisoMinimo`, `valor_unitario`, `subtotal`, `equipo_asignado_id`, `operador_asignado_id`) e incluye los metadatos de trazabilidad:
     - `id_linea`: Identificador único de la fila.
     - `id_servicio`: Identificador de la Unidad de Trabajo a la que pertenece.
     - `id_padre`: `null` para el nodo primario; `id_linea` del primario para las ramas hijas.
     - `rol_arbol`: `'PRIMARIO'` | `'APOYO'` | `'TRASLADO'` | `'PERSONAL'` | `'ACCESORIO'`.
     - `linea_servicio`: `'TRANSPORTE'` | `'RENTAL'` | `'PROFESIONAL'` | `'IZAJE'`.
     - `tipo_ot`: `'OT-FLETE'` | `'OT-RENTAL'` | `'OT-STAFF'` | `'OT-MANIOBRA'`.
   - Asimismo, `crm_v1.lineas_servicio_activas` almacena la lista de líneas presentes (ej. `["IZAJE", "TRANSPORTE"]`), manteniendo `crm_v1.familia_servicio` poblado con el equipo principal para compatibilidad con vistas legacy.

### 26.5. Clasificador Heurístico de Hidratación para Cotizaciones Históricas (Retrocompatibilidad)
Cuando se abre un proyecto histórico (ej. `GSP-2611-00001` a `00012`) o una cotización editada desde la vista clásica que posee `crm_v1.lineas_servicio` pero aún no cuenta con `crm_v1.servicios` (o cuyos ítems carecen de `id_servicio`):
1. El hidratador (`hidratarArbolDesdeLineasPlanas(lines)`) reconstruye automáticamente el árbol sin pérdida de información:
   - **Paso 1:** Si las filas ya traen `id_servicio` e `id_padre`, las agrupa directamente respetando su jerarquía exacta.
   - **Paso 2 (Legado puro sin `id_servicio`):**
     - Identifica como nodos `PRIMARIO` todas las filas de maquinaria principal (`!isPersonalLine(l) && !isTrasladoLine(l) && l.tipo !== 'ACCESORIOS'`).
     - Clasifica la `linea_servicio` del nodo primario según su naturaleza:
       - Si `l.unidad` contiene `'Mes'` $\rightarrow$ `'RENTAL'` (`OT-RENTAL`).
       - Si `l.tipo === 'CAMIONES'` y (`l.subcategoria` incluye `'CAMA BAJA'` o `'RAMPLA'` o `l.unidad === 'Traslado'`) $\rightarrow$ `'TRANSPORTE'` (`OT-FLETE`).
       - En cualquier otro caso de maquinaria $\rightarrow$ `'IZAJE'` (`OT-MANIOBRA`).
     - Si la cotización solo contiene filas de `TRASLADOS` (sin máquina), la primera fila de traslado se promueve como raíz de `'TRANSPORTE'` (`OT-FLETE`).
     - Si la cotización solo contiene filas de `PERSONAL CERTIFICADO`, la primera fila se promueve como raíz de `'PROFESIONAL'` (`OT-STAFF`).
     - Las filas secundarias de `TRASLADOS`, `PERSONAL CERTIFICADO` y `ACCESORIOS` se cuelgan como ramas hijas del primer equipo primario compatible.

### 26.6. Estrategia de Desacople y Convivencia en DEV (`Feature Flag` / Switch Dual)
Para permitir la validación operativa en el ambiente de desarrollo (`DEV`) junto a Gerencia de Operaciones sin alterar la operación diaria de los usuarios que continúan utilizando la tabla clásica:
1. **Interruptor de Modo (`modoEstructurador`: `'clasico'` | `'arbol'`):**
   - En la barra superior de la pestaña *"Estructurador de Servicios"* (Pestaña 1: Preventa Comercial) de `GestorOportunidades.vue`, se incorpora el conmutador visual:
     `Vista: [ 📋 Clásica (Plana) ] | [ 🌳 Árbol por Servicios ]`
2. **Guardia de Visibilidad (`puedeUsarEstructuradorArbol`):**
   - El conmutador y la vista en árbol se habilitan cuando se cumple cualquiera de las siguientes condiciones:
     - El sistema corre en ambiente de desarrollo (`import.meta.env.DEV`, `window.location.pathname.includes('/lg-gsp-dev')` o `localStorage.getItem('gsp_enable_tree_cotizador') === 'true'`).
     - El usuario autenticado corresponde a Gerencia / Dirección autorizada (`jponce@arriendosanpablo.cl`, `sgajardoc@gmail.com`) o posee rol de Administrador (`esUsuarioAdministrador`).
   - Para el resto de los usuarios en Producción, la interfaz inicia por defecto en `'clasico'` sin exponer el cambio hasta el cierre de la marcha blanca.
3. **Conmutación Instantánea Sin Pérdida (Round-Trip Safe):**
   - Cambiar de `'arbol'` a `'clasico'` o viceversa en cualquier momento sincroniza en memoria `serviciosArbol.value` $\leftrightarrow$ `lines.value`.
   - Todas las validaciones de guardado (`guardarOportunidad`), emisión de PDF (`generarPDF`) y paso a Operaciones (`generarRequerimiento`) operan indistintamente desde ambas vistas gracias a la proyección sincronizada en `lines.value`.
