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

La interfaz se divide en dos paneles principales: una columna lateral izquierda para la parametrización del cliente y flags operativos, y un panel de pestañas a la derecha para la configuración técnica, estructuración económica y condiciones comerciales.

---

### 📋 3.1. Panel Izquierdo: Datos del Cliente y Flags Combobox Obligatorios

Este bloque unifica y valida los datos de preventa. Todos los campos son obligatorios antes de permitir la generación de cotización o requerimiento:

- **a. Empresa Emisora (Cotizar a nombre de):** Selector obligatorio (`SAN PABLO`, `BESTMAQ`, `LOGISTICA DEL SUR`, `ROYAL RENTAL`).
- **b-e. Datos del Mandante (Buscador & Autocompletado):**
  - Input tipo *Autocomplete* conectado a `tpar_empresas` (búsqueda por Razón Social o RUT).
  - Al seleccionar, autocompleta: Razón Social, RUT Cliente, Dirección Comercial y Giro Comercial.
- **f-g. Contacto Mandante:** Selector desplegable para escoger el Contacto Específico (`contacto_id`), autocompletando Nombre, Teléfono y Correo.
- **h. Tipo de Pago:** Selector obligatorio (Efectivo, Transferencia, Crédito, Débito, Cheque, Otros).
- **i-n. Matriz de 6 Selectores / Flags Obligatorios (Comboboxes SÍ / NO):**
  Todos los flags se implementan como **componentes `<select>` con estado inicial `null`** (*"Seleccionar..."*), exigiendo una decisión consciente del usuario. Mientras un selector permanezca en `null`, se resalta con **borde rojo de advertencia** (`border-red-500 bg-red-500/5`) y bloquea la continuidad del flujo:

  1. **`requiere_oc_hes` (¿Requiere OC / HES?):** `SÍ` / `NO`.
     * Con `SÍ`, bloquea la facturación en EDP hasta la carga del documento formal emitido por el cliente.
  2. **`requiere_acreditacion` (¿Requiere Acreditación?):** `SÍ` / `NO`.
     * Con `SÍ`, habilita el subproceso de carga y validación de matrices documentales (Empresa, Flota, Personas).
  3. **`incluye_flete` (¿Servicio incluye Traslado / Flete?):** `SÍ` / `NO`.
     * Con `SÍ`, inyecta automáticamente una línea de Flete por `$500.000` (Categoría: `TRASLADOS`, Cantidad: `1`, Unidad: `Fijo`) en el estructurador. Con `NO`, elimina dicha línea.
  4. **`requiere_rigger` (¿Requiere Rigger Certificado?):** `SÍ` / `NO`.
     * Sincronización bidireccional con la línea `PERSONAL CERTIFICADO ➔ RIGGER` del estructurador.
  5. **`requiere_prevencionista` (¿Requiere Prevencionista Certificado?):** `SÍ` / `NO`.
     * Sincronización bidireccional con la línea `PERSONAL CERTIFICADO ➔ PREVENCIONISTA` del estructurador.
  6. **`cliente_pone_combustible` (¿Cliente pone el combustible?):** `SÍ` / `NO`.
     * Define contractualmente quién asume el suministro de combustible. Se imprime obligatoriamente en el PDF.

---

### 🏗️ 3.2. Panel Derecho (Tab 1: Site Visit & Viabilidad): Ventana Operativa Obligatoria y Datos del Servicio

Formulario técnico descriptivo para la planificación e ingeniería de izajes:
- **a. Ventana Operativa Exacta (CAMPOS OBLIGATORIOS):**
  - **Fecha y Hora de Inicio:** Input `datetime-local` o par `fecha_inicio_plan` (`YYYY-MM-DD`) + `hora_inicio_plan` (`HH:MM`).
  - **Fecha y Hora de Término:** Input `datetime-local` o par `fecha_fin_plan` (`YYYY-MM-DD`) + `hora_fin_plan` (`HH:MM`).
  - *Regla:* No se permite guardar en preventa ni generar cotización si falta cualquiera de estos 4 valores.
- **b. Datos de Ubicación de la Obra:** Nombre de la Obra, Dirección y Ciudad/Comuna.
- **c. Datos de Maniobra:** Detalle del Servicio, Tipo de Carga, Peso de Carga (Ton/Kg), Volumen de Carga, Radios de Trabajo y Alturas de Trabajo.
- **d. Importación de Inspección en Terreno (Site Visit):**
  - Selector de visitas técnicas concluidas (`tsrv_survey`). Al seleccionar una visita, auto-rellena las especificaciones de maniobra y ubicación.

---

### 💰 3.3. Estructurador de Servicios (`lines`): Obligatoriedad de Categoría y Subcategoría

En la tabla reactiva de líneas de cotización:
1. **Regla de Obligatoriedad:** Al presionar `+ Agregar Servicio / Equipo`, la nueva fila exige de manera mandatoria seleccionar una **Categoría** (`tipo`) y una **Subcategoría** (`subcategoria`) válidas del maestro.
2. **Validación Visual:** Si una fila tiene categoría o subcategoría vacía (`""` o `null`), se resalta con borde rojo y se bloquea el guardado.
3. **Catálogo de Unidades:** `Horas`, `Diario`, `Semanal`, `Mensual`, `Fijo`.

---

### 🏨 3.4. Matriz de Responsabilidad de Gastos de Pensión en Preventa (Tab 2)

En Preventa Comercial se define exclusivamente la responsabilidad de cobertura para los 5 conceptos de faena, **eliminando cualquier campo de monto monetario**:
1. **Alojamiento:** `CLIENTE` / `SAN_PABLO` / `NO_APLICA`
2. **Desayuno:** `CLIENTE` / `SAN_PABLO` / `NO_APLICA`
3. **Almuerzo:** `CLIENTE` / `SAN_PABLO` / `NO_APLICA`
4. **Cena:** `CLIENTE` / `SAN_PABLO` / `NO_APLICA`
5. **Traslado de Personal:** `CLIENTE` / `SAN_PABLO` / `NO_APLICA`

---

### 📄 3.5. Generación y Renderizado del Reporte de Cotización PDF

El documento formal de cotización comercial PDF incorpora de manera visible y estructurada:
1. **Resumen de Flags Contractuales:**
   - `• Requiere OC / HES:` **SÍ** / **NO**
   - `• Requiere Acreditación:` **SÍ** / **NO**
   - `• Incluye Flete / Traslado:` **SÍ** / **NO**
   - `• Requiere Rigger Certificado:` **SÍ** / **NO**
   - `• Requiere Prevencionista Certificado:` **SÍ** / **NO**
   - `• Cliente pone combustible:` **SÍ** / **NO** (Explícito)
2. **Resumen de Responsabilidad de Pensiones:**
   - Tabla compacta o bloque detallando quién asume Alojamiento, Desayuno, Almuerzo, Cena y Traslados (sin desglose de montos).
3. **Ventana de Servicio Planificada:** Fecha y hora exacta de inicio y término.
4. **Condiciones Comerciales y Cláusulas Específicas:** Concatenadas dinámicamente según las categorías de servicio cotizadas (`TRASLADOS`, `GRUA TELESCOPICA`, `PLATAFORMAS`).

---

### 🗺️ 3.6. Flujo de Asignación de Visita a Terreno (Token Web) y Comentarios del Coordinador

1. **Captura en Web de Un Solo Uso (`AsignacionVisita.vue`):**
   - La pantalla pública de asignación por token (`/asignar-visita/:token`) incorpora un campo `<textarea>` obligatorio/opcional: **`Comentarios / Instrucciones del Coordinador`** (`comentarios_coordinador`).
   - Permite al coordinador especificar accesos, precauciones de seguridad o instrucciones puntuales antes de firmar con su PIN FES de 4 dígitos.
2. **Inyección en Encuesta de Terreno (`tsrv_survey` - Template 80):**
   - Al validar la firma FES y asignar el especialista, el controlador backend inyecta automáticamente el texto de `comentarios_coordinador` en el **Segmento 1 (`DATOS GENERALES DEL SERVICIO`)** del `body_exec` de la encuesta.
   - El especialista asignado visualiza estas instrucciones directamente en la PWA en terreno y en el visor/PDF de la visita técnica.

---

### 🚜 3.7. Asignación de Recursos OT: Estándar de Alta Densidad Lineal Unificada (Pestaña 3)

Para evitar la saturación visual, dispersión en múltiples tablas y duplicación de cabeceras, la **Pestaña 3 (Asignación Recursos OT)** implementa una **Tabla Única de Alta Densidad** estructurada en 3 segmentos operacionales mediante separadores de fila compactos (Row Dividers):

1. **Cabecera Global Única (`<thead>`):**
   * `RECURSO / REQUERIMIENTO` (22%): Línea comercial base o concepto de apoyo.
   * `EQUIPO / VEHÍCULO ASIGNADO` (30%): Selector de máquina/patente con insignia de acreditación (🟢/🟡/🔴).
   * `OPERADOR / PERSONAL ASIGNADO` (26%): Selector de operador/chofer/especialista con sugerencias inteligentes por rol + insignia (🟢/🟡/🔴).
   * `VENTANA PLANIFICADA` (18%): Rango de fechas inline `[ YYYY-MM-DD ➔ YYYY-MM-DD ]` sin micro-labels repetitivos.
   * `ACC` (4%): Candado 🔒 (si es línea base comercial) o botón 🗑️ (si es recurso adicional).

2. **Segmentos Operacionales (Separadores de Fila `<tr>` de 1 sola línea):**
   * **🚜 Segmento 1: Flota Principal & Equipos de Servicio:** Une en 1 fila la grúa o camión pluma con su operador asignado. Botón `+ Agregar Equipo de Servicio`.
   * **🚚 Segmento 2: Segmento Equipos Traslado & Choferes (Logística):** Une en 1 fila el camión cama baja, rampla o escolta con su chofer. Botón `+ Equipo Traslado`.
   * **👷 Segmento 3: Especialistas & Personal Técnico en Terreno (Sin Vehículo):** Asigna riggers certificados, prevencionistas y supervisores que operan en tierra. La columna de equipo muestra `— (Personal en Tierra) —`. Botón `+ Añadir Especialista`.

3. **Invariantes de Sincronización y Fechas:**
   * La barra superior contiene la **Ventana Global de Servicio** (`Salida Base` ➔ `Término Faena`) con el botón **`⚡ Propagar Fechas`**, el cual actualiza en cascada las ventanas planificadas de todos los recursos.
   * La tripulación completa (`tripulacionAsignada`) se computa reactivamente de forma lineal uniendo operadores, choferes y especialistas en tierra, alimentando sin fisuras el motor FES, los PDF de Puppeteer y la compuerta de acreditaciones.

---

## 4. Flujo Operativo, Asignación de Recursos y FSM Relacional Canónica

### 4.1. Matriz Canónica de Estados en PostgreSQL (`tpry_proyecto.id_proyecto_estado`)

```
[ Estado 1: OPORTUNIDAD ] ──▶ [ Estado 2: COTIZANDO ] ──▶ [ Estado 3: VALIDACION_DIFF ]
                                                                     │
[ Estado 5: PREPARACION_PATIO ] ◀── [ Estado 4: ASIGNACION_RECURSOS ] ◀┘
             │
             ├──▶ [ Estado 6: DESPLAZAMIENTO ] ──▶ [ Estado 7: EN_FAENA ] ──▶ [ Estado 8: COMPLETADO ]
             │
             └──▶ [ Estado 99: NO_GANADA ] (Desestimación Comercial)
```

| `id_proyecto_estado` | Nombre Oficial | Pestaña en Gestor | Modo de Edición | Columna Kanban |
| :---: | :--- | :--- | :---: | :--- |
| **1** | `OPORTUNIDAD` | `1. Preventa Comercial` | 🟢 Editable | Columna 1: Preventa Comercial |
| **2** | `COTIZANDO` | `1. Preventa Comercial` | 🟢 Editable | Columna 1: Preventa Comercial |
| **3** | `VALIDACION_DIFF` | `2. Validación & Diff` | 🟢 Editable | Columna 2: En Verificación Operaciones |
| **4** | `ASIGNACION_RECURSOS` | `3. Asignación Recursos OT` | 🟢 Editable | Columna 3: En Asignación Recursos |
| **5** | `PREPARACION_PATIO` | `5. Preparación Salida` | 🟢 Editable | Columna 4: En Preparación Operaciones |
| **6** | `DESPLAZAMIENTO` | `Operaciones (Ruta)` | 🟢 Editable | Columna 5: En Faena / Ruta |
| **7** | `EN_FAENA` | `Operaciones (PWA)` | 🟢 Editable | Columna 5: En Faena / Ruta |
| **8** | `COMPLETADO` | `Cierre Operacional` | 🔒 Solo Lectura | Columna 6: Completados |
| **99** | `NO_GANADA` | Histórico / Archivo | 🔒 Solo Lectura | Biblioteca: No Ganadas |

---

### 4.2. Reglas de Divulgación Progresiva y Candados FSM ($N, N+1, < N, > N$)

1. **Hacia Adelante ($> N$) 🔒 BLOQUEADO:**
   - Los botones de etapas futuras en el Stepper muestran candado 🔒 y están inhabilitados (`:disabled="true"`, `opacity-40 cursor-not-allowed`). No se puede saltar etapas sin ejecutar el hito de avance.
2. **Estado Activo ($= N$) 🟢 ÚNICA ETAPA EDITABLE:**
   - Es la única etapa donde los formularios e inputs están activos. La cabecera expone los botones contextuales para promover el proyecto al estado $N+1$.
3. **Hacia Atrás ($< N$) 👁️ SOLO LECTURA INMUTABLE:**
   - Se permite la consulta histórica para auditoría, pero todos los `<fieldset>` están bloqueados (`disabled`) y se despliega un banner de etapa concluida.
   - **Acción de Retorno por Excepción:** Para modificar datos comerciales desde Operaciones se debe presionar **`Devolver a Preventa Comercial`**, lo que transiciona el proyecto al Estado 2 con registro de trazabilidad.

---

### 4.3. Catálogo de Acciones de Transición Formal

1. **`confirmarGenerarRequerimiento` (Estado 2 $\rightarrow$ 3):** Valida que los 6 flags, fechas y líneas estén completos, transiciona a `VALIDACION_DIFF` y activa la subpestaña de Validación.
2. **`aprobarYGenerarOT` (Estado 3 $\rightarrow$ 4):** Convalida el diff técnico, transiciona a `ASIGNACION_RECURSOS` y habilita la asignación de flota y tripulación.
3. **`confirmarAsignacionOT` (Estado 4 $\rightarrow$ 5):** Valida que los recursos mandatorios (ej. Rigger si `requiere_rigger === true`) estén asignados, transiciona a `PREPARACION_PATIO` y sella la OT.
4. **`volverACotizar` (Estado $N \rightarrow$ 2):** Retroceso controlado por excepción. Devuelve el proyecto a Preventa Comercial y reactiva la edición.
5. **`confirmarNoAsignada` (Estado $N \rightarrow$ 99):** Desestimación comercial con captura de motivo y observación.

---

### 4.4. Reglas Canónicas de Dominio Operacional

1. **Rigger (Prohibición de "Señalero"):** La única denominación canónica permitida es **`Rigger`**.
2. **Separación Semántica Flota vs. Tripulación:**
   - **Tabla 1 (`🚜 Flota & Equipos`):** Exclusiva para maquinaria física (`GRUAS TELESCOPICAS`, `CAMIONES PLUMA`, `VEHICULOS LIVIANOS`, `MAQUINARIA`, `TRASLADOS`).
   - **Tabla 2 (`👷 Tripulación & Personal`):** Exclusiva para personas certificadas (`Operador Grúa`, `Operador Camión Pluma`, `Rigger`, `Prevencionista de Riesgos`, `Chofer Cama Baja`, `Escolta`, `Supervisor Faena`).
3. **Inmutabilidad de Compromisos Contractuales (`🔒` vs `🗑️`):**
   - Recursos originados de la cotización comercial quedan protegidos con candado `🔒` y no pueden ser eliminados en Operaciones.
   - Solo los apoyos y tripulantes adicionales agregados ad-hoc en Operaciones cuentan con botón de eliminación `🗑️`.
4. **Matriz de Aparejos Maestro (8 Ítems):**
   - Siempre se presentan las 8 tarjetas maestras (`estrobos`, `eslingas`, `grilletes`, `pulpos_cadena`, `cadenas`, `balancines`, `canastillos`, `otros_accesorios`) precargando requerimientos de terreno y permitiendo ajustes operativos.

---

### 4.5. Filtrado de Flota por Categoría y Subcategoría en Asignación Operativa (Patio) y Vista 360

1. **Estructura de Clasificación de Flota:**
   - Toda maquinaria física (`tequ_equipo`) está asociada a una **Categoría** (`tequ_categoria`: ej. *GRÚA TELESCÓPICA, CAMIÓN PLUMA, TRASLADOS, VEHÍCULO MENOR*) y a una **Subcategoría** (`tequ_subcategoria`: ej. *220 TON, 100 TON, 50 TON, CAMA BAJA, 4X4*).
2. **Filtrado Inteligente en Asignación Operativa (`GestorOportunidades.vue` - Pestaña C):**
   - Cada línea de servicio del DataGrid de asignación ejecuta la función `getEquiposFiltradosPorLinea(line)`.
   - El desplegable lista prioritariamente los activos que coinciden de manera exacta con la **Categoría y Subcategoría requerida en la línea comercial**.
   - En caso de no existir activos de esa subcategoría exacta, relaja el filtro a la Categoría general para permitir contingencias operativas.
   - El equipo actualmente asignado siempre permanece visible en las opciones para evitar pérdida de selección.
   - El texto del `<option>` expone: `[PATENTE] - [NOMBRE / MODELO] [SUBCATEGORÍA / CATEGORÍA]`.
3. **Consola de Inventario de Activos (`Vista360.vue`):**
   - La tabla maestra expone las columnas obligatorias **`Categoría`** (badge ámbar) y **`Subcategoría`**.
   - Se incorporan selectores de filtro reactivo por Categoría y Subcategoría en la barra superior.
   - La exportación a Excel (`exportToExcel`) incluye ambas columnas en el reporte `.xlsx`.

---

### 4.6. Persistencia Relacional y Bidireccional de Asignaciones (`tpry_rel_persona` & `tpry_rel_equipo`)

1. **Contrato de Endpoints Relacionales Backend (`asignacionRecursosController.js`):**
   - `GET /api/proyectos/:id/asignaciones/personas`: Debe proyectar explícitamente **`rp.id_user`**, `rp.id_rel_persona`, `p.nombre_proyecto`, `u.nombre_completo`, `rp.rol_asignado`, `rp.fecha_plan_ini`, `rp.fecha_plan_fin` y `rp.estado_real`.
   - `GET /api/proyectos/:id/asignaciones/equipos`: Debe proyectar explícitamente **`re.id_equipo`**, `re.id_rel_equipo`, `p.nombre_proyecto`, `e.codigo_equipo`, `e.patente`, `re.rol_equipo`, `re.fecha_plan_ini`, `re.fecha_plan_fin` y `re.estado_real`.
2. **Sincronización Dual (JSON + Tablas Relacionales PostgreSQL):**
   - Al ejecutar `guardarCambiosAsignacion`, el sistema guarda el snapshot completo en `tpry_proyecto.json_field.ejecucion_v1.tripulacion_asignada` y simultáneamente sincroniza los registros individuales en `tpry_rel_persona` y `tpry_rel_equipo`.
   - Al cargar el proyecto, el frontend recupera el listado desde `json_field.ejecucion_v1` y complementa las fechas y roles con los datos relacionales, validando siempre `if (perRel.id_user)` para evitar sobrescrituras de IDs con `undefined`.

---

### 4.7. Vinculación Directa Conductor $\leftrightarrow$ Patente y Gestión Multi-Equipo de Traslados

1. **Tratamiento del Ítem Logístico "Traslados":**
   - El ítem de Traslado en el estructurador comercial representa un concepto logístico global que agrupa múltiples vehículos de apoyo (Camas Bajas, Ramplas, Camionetas Escolta).
   - En la Pestaña C (Asignación OT), este ítem se presenta como un grupo dinámico con el botón **`+ Añadir Apoyo / Traslado`**, permitiendo incorporar $N$ vehículos adicionales a la flota del servicio.
   - Al incorporar un vehículo de traslado, el sistema inyecta automáticamente en la tabla de Tripulación la fila de su **Chofer / Conductor**, preconfigurado con las fechas planificadas.
2. **Asociación Directa de Patente en la Fila del Conductor:**
   - Para todo cargo de conducción (*Operador Grúa, Operador Camión Pluma, Chofer Cama Baja, Escolta / Guía*), la tabla de Tripulación expone un selector dedicado: **`Patente / Equipo Asignado`**.
   - Dicho selector lista dinámicamente el 100% de los equipos físicos asignados en la columna izquierda (`[PATENTE] - [NOMBRE / MODELO]`).
   - Si un conductor no tiene patente asignada, el selector resalta en advertencia ámbar (`⚠️ Conduce: Seleccionar Patente`).
3. **Compuerta de Validación Operativa para Confirmación OT:**
   - Antes de realizar la transición al Estado 5 (`PREPARACION_PATIO`), el sistema ejecuta un barrido determinístico sobre `equiposAsignadosTotales`.
   - Si se detecta algún equipo físico sin conductor asociado en la tripulación, se solicita confirmación explícita al usuario listando las patentes sin chofer asignado.

---

## 5. Compuertas Determinísticas de Calidad Comercial (Quality Gates)

### 5.1. Compuerta A: Validación Mandatoria para Generar Cotización (PDF / Versión Formal)
Para ejecutar la acción **"Generar Cotización"** y emitir una versión formal de PDF en el servidor, el sistema exige de forma determinística:
1. **Cliente Mandante:** Selección válida de empresa cliente (`rut_cliente` / `id_empresa_cliente`).
2. **Punto de Contacto:**
   - Nombre de contacto obligatorio (`contacto_nombre` no vacío).
   - Teléfono de contacto obligatorio (`contacto_telefono` no vacío).
3. **Tipo de Pago:** Selección válida de forma de pago (`tipo_pago`).
4. **Requerimientos Comerciales:** Los 6 selectores combobox deben tener un valor definido (`true` o `false`, no `null`):
   - `requiere_oc_hes`
   - `requiere_acreditacion`
   - `incluye_flete`
   - `requiere_rigger`
   - `requiere_prevencionista`
   - `cliente_pone_combustible`
5. **Descripción del Proyecto / Faena:** Texto explicativo obligatorio (`descripcion` no vacía).
6. **Datos de Operación e Ingeniería (Obra y Tiempos):**
   - Nombre de la obra obligatorio (`obra_nombre` no vacío).
   - Dirección de la obra obligatoria (`obra_direccion` no vacía).
   - Ciudad de la obra obligatoria (`obra_ciudad` no vacía).
   - Fecha y Hora de Inicio obligatorias (`fecha_hora_inicio` no vacía).
   - Fecha y Hora de Término obligatorias (`fecha_hora_termino` no vacía).
7. **Estructurador de Servicios:** Al menos 1 línea de servicio registrada, con Categoría (`tipo`) y Subcategoría (`subcategoria`) válidas.

### 5.2. Compuerta B: Validación Mandatoria para Generar Requerimiento (Traspaso a Operaciones)
Para transferir la oportunidad al área de Operaciones (transición de Estado 2 a Estado 3 `VALIDACION_DIFF`):
1. **Cumplimiento Total de la Compuerta A:** Todos los datos comerciales base deben ser válidos.
2. **Generación Previa de Cotización:** Debe existir al menos 1 versión de cotización generada en `cotizaciones_historicas`.
3. **Envío Efectivo al Cliente:** Al menos una de las cotizaciones generadas debe tener registro de envío formal al cliente (`evento_envio`, `eventos_envio` no vacío, `fecha_envio` o `enviada === true`). Si no se ha enviado, el sistema bloquea el traspaso y notifica:
   > *"⚠️ No es posible transferir el requerimiento a Operaciones: Debe generar y enviar previamente la cotización formal al cliente mandante."*

---

## 6. Modelo Asíncrono de Acreditación y Tablero Kanban (`Torre.vue`)

1. **Invariante de Activación Condicional por Estado:**
   - **Regla Canónica de Dominio:** La acreditación de un proyecto **SOLO se activa cuando los recursos específicos (maquinaria y personas de la tripulación) ya han sido asignados** a la Orden de Trabajo.
   - En etapas tempranas (`id_proyecto_estado < 5`: *1 y 2 Preventa Comercial*, *3 En Verificación Operaciones* y *4 En Asignación Recursos*), el porcentaje de acreditación es **estrictamente 0%** y los micro-gauges circulares permanecen ocultos (`v-if="Number(p.id_proyecto_estado) >= 5"`) en las columnas 1, 2 y 3 del Kanban, impidiendo lecturas anómalas o falsos avances documentales sin recursos reales.
   - La auditoría documental y el cálculo de vigencias se inicia formalmente a partir del Estado 5 (**`PREPARACION_PATIO`**).

2. **Desacoplamiento Operativo en Faena:**
   - La gestión de acreditaciones documentales corre en paralelo y no detiene el avance de estados operativos.

3. **Gauge de Cumplimiento Documental (Estado $\ge 5$):**
   $$\% \text{ Acreditación} = \left( \frac{\sum \text{Documentos Vigentes (Empresa + Equipos Asignados + Personal Asignado)}}{\sum \text{Total Documentos Exigidos}} \right) \times 100\%$$
   - `🟢 VERDE (100%)`: Cumplimiento total de carpetas y vigencias.
   - `🔴 ROJO (0% - 99%)`: Advertencia de documentos pendientes o vencidos.

---

## 🧪 7. Suite Completa de Pruebas Integradas E2E (Gherkin/BDD para QA)

```gherkin
Feature: Gestor de Oportunidades y Cotizaciones B2B - Core Pipeline & FSM
  Como Analista Comercial y de Operaciones
  Quiero estructurar oportunidades de izaje con validaciones estrictas y FSM canónica
  Para asegurar cotizaciones transparentes, inmutabilidad y bloqueos deterministas

  Background:
    Given que el usuario está autenticado en la plataforma web DEV
    And se encuentra en la pantalla de "Gestor de Oportunidades"
    And selecciona la Empresa Emisora "SAN PABLO"
    And busca y selecciona al Cliente Mandante "CONSTRUCTORA POCURO SPA"
    And selecciona el contacto y el Tipo de Pago "Transferencia"

  Scenario: Validación de Datos Obligatorios para Generar Cotización (Compuerta A)
    Given que el usuario no ha ingresado el contacto, descripción de faena o datos de obra
    When hace clic en "Generar Cotización"
    Then el sistema bloquea la emisión y resalta en rojo los campos faltantes
    When el usuario completa todos los datos requeridos:
      | Campo                     | Valor                                  |
      | Nombre Contacto           | Juan Pérez                             |
      | Teléfono Contacto         | +56 9 8765 4321                        |
      | Tipo de Pago              | Transferencia                          |
      | Descripción Faena         | Montaje estructura pesada              |
      | Nombre Obra               | Planta Celulosa Laja                   |
      | Dirección Obra            | Av. Los Boldos 1234                    |
      | Ciudad Obra               | Laja                                   |
      | Fecha/Hora Inicio         | 2026-09-01T08:00                       |
      | Fecha/Hora Término        | 2026-09-02T18:00                       |
    And selecciona SÍ o NO en los 6 selectores de requerimientos
    And agrega una línea de servicio con Categoría y Subcategoría
    When presiona nuevamente "Generar Cotización"
    Then el sistema genera exitosamente la versión v1 del PDF

  Scenario: Bloqueo de Generar Requerimiento sin Cotización Generada y Enviada (Compuerta B)
    Given que el usuario completó los datos comerciales pero no ha generado cotización
    When intenta presionar "Generar Requerimiento"
    Then el sistema bloquea el traspaso y alerta: "Debe generar previamente la cotización PDF formal"
    When el usuario genera la cotización pero no la ha enviado por correo
    And intenta presionar "Generar Requerimiento"
    Then el sistema bloquea el traspaso y alerta: "Debe enviar por correo la cotización generada al cliente mandante antes de realizar el traspaso a Operaciones"
    When el usuario despacha la cotización al correo del cliente mediante el modal de envío
    And presiona "Generar Requerimiento"
    Then el sistema habilita la transición y promueve el proyecto al Estado 3 (Validación & Diff)

  Scenario: Asignación Lineal Unificada de Flota, Traslados y Especialistas
    Given que el proyecto se encuentra en Estado 4 (Asignación de Recursos OT)
    When el usuario abre la pestaña "3. Asignación Recursos OT"
    Then el sistema debe renderizar una sola tabla global con 5 columnas sin cabeceras repetidas
    And las grúas deben mostrar a su operador asignado en la misma fila
    And los vehículos de traslado deben mostrar a su chofer en la misma fila
    And los especialistas en tierra (Prevencionista, Rigger) deben ubicarse en el Segmento 3 con la columna de vehículo deshabilitada

  Scenario: Propagación de Fechas Planificadas a toda la Planilla
    When el usuario ajusta la fecha global de Salida Base a "2026-08-20" y Término Faena a "2026-08-26"
    And presiona "⚡ Propagar Fechas"
    Then todas las filas de Flota Principal, Traslados y Especialistas en Terreno deben actualizar su ventana a "2026-08-20 ➔ 2026-08-26"

  Scenario: Validación de Selectores Combobox Obligatorios en Preventa (Marcación Roja)
    Given que los 6 flags comerciales inician con valor null ("Seleccionar...")
    Then los 6 selectores deben renderizarse con borde rojo de advertencia
    When el usuario intenta hacer clic en "Generar Cotización" o "Generar Requerimiento"
    Then el sistema debe bloquear la acción y alertar de los campos faltantes
    When el usuario selecciona explícitamente "SÍ" o "NO" en cada uno de los 6 selectores
    Then la marcación roja debe desaparecer de todos los selectores

  Scenario: Inyección y Limpieza del Flete
    When el usuario selecciona "SÍ" en el selector "Servicio incluye Traslado"
    Then se debe agregar automáticamente una línea en el estructurador con Categoría "TRASLADOS" y Valor Unitario 500000
    When el usuario cambia el selector a "NO"
    Then la línea con Categoría "TRASLADOS" debe eliminarse automáticamente del estructurador

  Scenario: Sincronización Bidireccional de Rigger y Prevencionista
    When el usuario selecciona "SÍ" en "Requiere Rigger"
    Then se debe agregar automáticamente una línea con Categoría "PERSONAL CERTIFICADO" y Subcategoría "RIGGER"
    When el usuario cambia "Requiere Rigger" a "NO"
    Then la línea de Rigger debe eliminarse automáticamente
    When el usuario agrega manualmente una línea con Categoría "PERSONAL CERTIFICADO" y Subcategoría "RIGGER"
    Then el selector "Requiere Rigger" debe cambiar automáticamente a "SÍ"

  Scenario: Validación Obligatoria de Categoría y Subcategoría en Líneas
    When el usuario presiona "+ Agregar Servicio / Equipo"
    And deja vacía la Categoría o la Subcategoría
    Then los selectores vacíos deben mostrar borde rojo
    And el sistema debe bloquear el guardado de la cotización

  Scenario: Visibilidad Completa de Flags y Pensiones en el PDF de Cotización
    Given que el usuario seleccionó los 6 flags con valores:
      | Flag                         | Valor |
      | Requiere OC / HES            | SÍ    |
      | Requiere Acreditación        | NO    |
      | Incluye Traslado / Flete     | SÍ    |
      | Requiere Rigger              | SÍ    |
      | Prevencionista Certificado   | NO    |
      | Cliente pone Combustible     | SÍ    |
    And configuró la matriz de pensiones: Alojamiento (CLIENTE), Almuerzo (SAN_PABLO), Cena (CLIENTE)
    When hace clic en "Generar Cotización"
    Then el PDF generado debe mostrar explícitamente los 6 flags y la sección de Pensiones

  Scenario: Bloqueo de Navegación hacia Adelante (> N) y Candados Progresivos
    Given que el proyecto se encuentra en Estado 1 o 2 (Preventa Comercial)
    Then los botones "2. Validación & Diff", "3. Asignación Recursos OT", "4. Acreditaciones" y "5. Preparación Salida" deben mostrar candado 🔒
    And deben estar deshabilitados impidiendo el clic
    When el usuario presiona "Generar Requerimiento" habiendo cumplido las compuertas
    Then el proyecto avanza a Estado 3 (Validación & Diff)
    And únicamente la pestaña "2. Validación & Diff" se desbloquea; las etapas 3, 4 y 5 continúan con candado 🔒

  Scenario: Edición Exclusiva en Estado Activo (= N) e Inmutabilidad hacia Atrás (< N)
    Given que el proyecto avanza a Estado 4 (Asignación de Recursos OT)
    When el usuario visualiza la pestaña "3. Asignación Recursos OT"
    Then los selectores de Grúa y Tripulación son 100% editables
    When el usuario hace clic en "1. Preventa Comercial" (Etapa < 4)
    Then se muestra el banner "🔒 Etapa Comercial Concluida (Modo Solo Lectura)"
    And todos los inputs y tablas de Preventa están bloqueados en modo solo lectura

  Scenario: Retorno por Excepción ("Devolver a Preventa Comercial")
    Given que el proyecto está en Estado 3 o 4
    When el usuario presiona el botón "Devolver a Preventa"
    Then el proyecto transiciona a Estado 2 (COTIZANDO)
    And la vista se posiciona automáticamente en "1. Preventa Comercial"
    And todos los formularios comerciales se desbloquean quedando 100% editables
    And la tarjeta en la Torre Kanban regresa inmediatamente a la Columna 1

  Scenario: Invariante de Acreditación y Micro-Gauges en Kanban
    Given que el proyecto se encuentra en Estado 1, 2, 3 o 4
    Then la función calcularPorcentajeAcreditacion debe retornar exactamente 0%
    And el micro-gauge circular de acreditación no debe renderizarse en las Columnas 1, 2 ni 3 del Kanban
    When el proyecto es promovido al Estado 5 (PREPARACION_PATIO) tras haber asignado flota y tripulación
    Then el micro-gauge circular se hace visible en la Columna 4
    And el porcentaje de acreditación evalúa la vigencia real de los documentos exigidos
```
