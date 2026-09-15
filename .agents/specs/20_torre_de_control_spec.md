# Especificación Técnica Integral: Torre de Control Operativa y Comercial

## 1. Objetivo y Alcance
La Torre de Control no es un simple Kanban de operaciones; es el cerebro de ejecución End-to-End del ecosistema Grúas San Pablo. Gobierna todo el ciclo de vida de un requerimiento: desde el modelamiento técnico, la cotización formal con control de versiones, el despacho al cliente con traza de auditoría, hasta la ejecución física y cierre en terreno.

---

## 2. Ciclo de Vida y Estructura Kanban de 7 Columnas

El tablero de la Torre de Control se compone de **7 columnas**, incluyendo el carril concurrente de Acreditación Documental B2B:

1. **Columna 1: Requerimiento Registrado** (`id_proyecto_estado = 1 / 2` - Oportunidad / Cotización Preventa)
2. **Columna 2: En Verificación Operaciones** (`id_proyecto_estado = 3` & `subtab_activa === 'validacion'` - Auditoría Diff Cotizado vs Real)
3. **Columna 3: En Asignación Recursos** (`id_proyecto_estado = 3` & `subtab_activa === 'asignacion'` - Asignación de OT, Tripulación y Patentes)
4. **Columna 4: En Preparación Operaciones** (`id_proyecto_estado = 4 / 5` o `subtab_activa === 'preparacion_salida'` - Logística de Patio y Salida de Flota)
5. 🟢 **Columna 5: En Acreditación (Carril Concurrente Documental)**  
   - **Simultaneidad:** Transcurre de forma **concurrente y paralela** con la Columna 4 (*En Preparación Operaciones*) y la Columna 6 (*En Ejecución / Faena*). Un mismo proyecto figura en su carril operativo Y en la Columna 5 hasta que el Analista de Gestión apruebe el 100% del dossier FES.
   - **Micro-Gauge Porcentual:** Cada tarjeta despliega un indicador gráfico SVG circular de avance porcentual (`0% - 100%`).
   - **Modal Central Estándar:** Al presionar la tarjeta o el botón *🔎 Auditar Dossier FES*, se abre directamente el **Modal Central Oscuro (`GestorOportunidades.vue`)** en la sub-pestaña `acreditaciones`.
   - **Efecto Espejo (Mirror Hover Glow):** Al posar el mouse sobre una tarjeta concurrente (ej. `GSP-2608-557-002`), su tarjeta gemela en la otra columna resplandece simultáneamente en pantalla con el distintivo `🔗 Hilo Concurrente`.
6. **Columna 6: En Ejecución / Faena** (`id_proyecto_estado = 7` o `fase === 'maniobra'` - Maniobras e Izajes en Terreno)
7. **Columna 7: Finalizado / Devengado** (`id_proyecto_estado = 8` - Cierre del Servicio y Devengado)

---

## 3. Renderizado y Navegación
- **Modal Central Estándar:** Todo flujo de auditoría, edición y asignación utiliza la ventana modal central única (`GestorOportunidades.vue`), evitando bisecciones con paneles laterales o drawers desfasados.
- **Renderizado Optimizado:** Las consultas a `/api/proyectos` categorizan los arreglos reactivos (`preventa`, `verificacion`, `asignados`, `desplazamiento`, `acreditaciones`, `maniobra`, `completados`) para garantizar 0 parpadeos en el renderizado.

---

## 4. Matriz PMO de Control de Gestión & Excepciones Temporales

### 4.1 Propósito
Proporcionar al rol de **Analista de Operaciones / Control de Gestión** una vista tipo DataGrid tabular de alta densidad orientada al cumplimiento cronológico estricto de cada negocio. Audita la ocurrencia vs. no-ocurrencia de hitos operacionales críticos, alertando de forma proactiva desviaciones temporales antes de que impacten la faena o la facturación.

### 4.2 Los 7 Hitos Operacionales Obligatorios
Para cada negocio (OT) activo, la matriz audita en columnas secuenciales:
1. **OC Mandante / HES:** Existencia y registro del documento comercial vinculante.
2. **Validación Operaciones:** Check de viabilidad técnica y cuadratura del diff cotizado vs. real.
3. **Asignación de Recursos:** Designación de patentes de grúa, equipos de soporte, operador y rigger.
4. **Acreditación B2B:** Cumplimiento del 100% de la carpeta documental requerida por mandante.
5. **Salida de Patio:** Registro del portón de salida y check de inspección pre-uso.
6. **Report Diario en Terreno:** Emisión y firma digital o manuscrita del reporte de faena PWA.
7. **Liquidación & Facturación:** Cierre de horas operadas vs. mínimas y emisión de DTE.

### 4.3 Motor de Alertas por Excepción Temporal (Infracción al Estándar)
El sistema evalúa el reloj en tiempo real frente a las fechas programadas:
- 🔴 **Alerta OC Mandante:** Si `requiere_oc_hes === true` y la fecha de inicio es $\le 48\text{h}$ sin OC cargada $\rightarrow$ `🔴 FALTA OC MANDANTE`.
- 🔴 **Alerta Desfase Salida:** Si `NOW() > fecha_hora_salida_programada` y el portón de salida no registra inicio de viaje $\rightarrow$ `🔴 RETRASO SALIDA (+X hrs)`.
- 🔴 **Alerta Acreditación Crítica:** Si `requiere_acreditacion === true` y la fecha de inicio es $\le 24\text{h}$ con avance $< 100\%$ $\rightarrow$ `🚨 BLOQUEANTE ACREDITACIÓN`.
- 🟡 **Alerta Report Pendiente:** Si el convoy está en faena activa (Estado 7) y son más de las 19:00 hrs sin reporte emitido $\rightarrow$ `🟡 REPORT DIARIO PENDIENTE`.
- 🟡 **Alerta Liquidación Pendiente:** Si la faena culminó (Estado 8) hace más de 48 hrs sin aprobación de liquidación $\rightarrow$ `⏳ PENDIENTE FACTURACIÓN`.

### 4.4 KPIs de Control PMO
La cabecera de la matriz totaliza:
- Total Servicios en Gestión.
- Alertas Críticas Activas (Intervención urgente requerida).
- OTs sin OC de Mandante.
- Convoyes en Faena con Report al Día vs. Pendiente.
- Negocios Concluidos en Espera de Facturación.

---

## 5. Perspectiva Temporal de Flota (Gantt Operacional & Productividad)

### 5.1 Propósito
Cumplir el compromiso de propuesta formal de visualización integral de maquinaria en una línea de tiempo horizontal interactiva, permitiendo al Analista y Programador monitorear la disponibilidad, asignaciones, mantenciones y el índice de productividad de cada equipo de la flota.

### 5.2 Estructura del Cronograma (Gantt)
- **Flota de Equipos (Eje Y):** 110 activos maestros obtenidos desde `/api/tequ-equipos`, agrupados por categoría técnica (Grúas Telescópicas, Camiones Pluma, Camas Bajas de Transporte, Escoltas y Apoyo).
- **Ventana Temporal (Eje X):** Selector reactivo:
  * `[ 7 Días ]`: Detalle operativo semanal.
  * `[ 15 Días (Canónico / Por Defecto) ]`: Visión quincenal de programación y logística.
  * `[ 30 Días ]`: Perspectiva mensual de capacidad y ocupación.
- **Marcadores Temporales:** Columna del día actual destacada (`Hoy`), fines de semana atenuados visualmente y cuadrícula temporal alineada.

### 5.3 Código Cromático Oficial de Bloques
- 🟦 **Azul (`bg-blue-600/80`):** OT Asignada / Programada (Muestra Código OT y Nombre Cliente).
- 🟩 **Verde (`bg-emerald-600/80`):** En Faena Activa / En Ruta (Servicio en ejecución con telemetría/PPD).
- 🟧 **Naranja (`bg-amber-600/80`):** Mantención de Taller (Preventiva programada o Correctiva).
- 🟨 **Amarillo (`bg-yellow-500/80`):** Inspección Técnica de Patio / Certificación vigente.
- ⬜ **Gris Vacío:** Disponible en Patio.

### 5.4 Detección Automática de Colisiones
Si un mismo equipo registra dos eventos solapados en el mismo rango de fechas (ej. Asignado a OT-1 y OT-2, o Asignado y con Mantención de Taller programada), el bloque se renderiza con borde rojo palpitante y la etiqueta `⚠️ Colisión Horaria`.

### 5.5 Métrica de Productividad Operacional (% OEE / Utilización)
Cada fila de equipo incluye una columna dedicada de productividad calculada sobre la ventana activa:
$$\text{Productividad} = \frac{\text{Días Comprometidos en Faena o Servicio}}{\text{Días Hábiles del Período}} \times 100\%$$
Visualizada mediante un badge de porcentaje y mini barra de avance:
- **$\ge 75\%$:** Verde esmeralda (Alta rentabilidad / Alta demanda).
- **$40\% - 74\%$:** Azul / Ámbar (Utilización balanceada).
- **$< 40\%$:** Pizarra / Gris (Activo subutilizado - Alerta para área Comercial).

---

## 6. Navegación Tri-Modal en Torre de Control

La interfaz principal `Torre.vue` incorpora una barra de navegación conmutadora superior:
```html
<div class="flex items-center gap-1 bg-[#0a0f1e] p-1 rounded-xl border border-white/10">
  <button :class="activeView === 'kanban' ? 'bg-blue-600 text-white' : 'text-slate-400'">
    🗂️ Tablero Kanban
  </button>
  <button :class="activeView === 'pmo' ? 'bg-blue-600 text-white' : 'text-slate-400'">
    📊 Matriz PMO (Control de Gestión)
  </button>
  <button :class="activeView === 'gantt' ? 'bg-blue-600 text-white' : 'text-slate-400'">
    📅 Perspectiva Temporal (Flota Gantt)
  </button>
</div>
```
Todo clic en una OT o equipo dentro de la Matriz PMO o del Gantt abre fluidamente el modal central unificado `GestorOportunidades.vue` en la pestaña correspondiente.

