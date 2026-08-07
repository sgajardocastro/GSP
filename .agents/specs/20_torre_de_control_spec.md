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
