# 🛠️ Caso de Soporte: Falla en Botón Basurero al Eliminar Costos Directos en Sección 3 de ModalITS

## 1. Ficha del Incidente
- **ID del Caso:** `CASO-20261109-03`
- **Fecha / Hora:** `2026-11-09T10:35:00-03:00`
- **Usuario Afectado / Reportante:** Analista de Control de Gestión / Administración GSP
- **Módulo Afectado:** Módulo de Operaciones & Cockpit PMO — Editor de ITS (`ModalITS.vue`)
- **Sección:** Sección 3: Planilla de Costos Operacionales Directos de Terreno (10 Categorías)
- **Ambiente:** `PROD` y `DEV`
- **Severidad:** Alta (Imposibilidad de suprimir o corregir líneas de costos operacionales directos imputados a un proyecto)
- **Estado:** `RESUELTO Y DESPLEGADO EN PROD Y DEV`

---

## 2. Síntoma Reportado por el Usuario
> "El botón basurero del editor de ITS no funciona en 'Sección 3: Costos Operacionales Directos de Terreno (10 Categorías)'"

Al presionar el botón con el ícono de papelera/basurero (`🗑️`) en las filas de costos operacionales de la tabla compartida de categorías (tales como Peajes, Personal Externo, Feriados, Subcontratación de Flete y Gastos Extraordinarios), la interfaz de usuario no realizaba ninguna acción: no eliminaba la fila, no recalculaba los subtotales ni alteraba el estado reactivo del componente.

---

## 3. Diagnóstico Técnico & Evidencia Empírica

1. **Inspección de Template en `ModalITS.vue`:**
   En la Sección 3, las categorías cuentan con dos modalidades de visualización:
   - Tablas especializadas con template propio (`combustible`, `movilizacion`, `pensiones`, `costo_hora_operador`, `alimentacion`): en ellas se invoca `eliminarItemCosto('categoria_literal', idx)`.
   - Tabla dinámica genérica compartida para el resto de categorías (Líneas 1280-1348):
     ```html
     <button type="button" @click="eliminarItemCosto(tabCostoActiva, idx)" class="text-rose-400 hover:text-rose-200 cursor-pointer">🗑️</button>
     ```

2. **Análisis de Compilación Vue 3 SFC (`@vue/compiler-sfc`):**
   Al analizar la salida generada por el compilador para expresiones inline en el template:
   ```javascript
   $event => ($setup.eliminarItemCosto($setup.tabCostoActiva, idx))
   ```
   `$setup.tabCostoActiva` pasa el objeto reactivo `RefImpl` en lugar de una cadena primitiva `String`.

3. **Ejecución en JavaScript Runtime:**
   La función original en `ModalITS.vue`:
   ```javascript
   const eliminarItemCosto = (cat, idx) => {
     if (costos.value[cat]) {
       costos.value[cat].splice(idx, 1);
       recalcularTotales();
     }
   };
   ```
   Al evaluar `costos.value[cat]`, JavaScript realiza la conversión implícita a string del objeto `RefImpl`, evaluando a `costos.value["[object Object]"]`, el cual retorna `undefined`. En consecuencia:
   - `if (costos.value[cat])` evalúa a `false`.
   - La llamada a `.splice(idx, 1)` nunca se ejecuta.
   - El recálculo de totales nunca se dispara y la interfaz permanece congelada con el ítem en pantalla.

4. **Hallazgo Colateral de Resiliencia de Claves (Backend vs Frontend):**
   En el backend (`itsController.js`), las categorías de flete y gastos extraordinarios se denominan `subcontrato_flete` y `gastos_extra`, mientras que en el frontend se declaran como `subcontratacion_flete` y `gastos_extraordinarios`. Si los ítems venían con las claves del backend sin mapeo bidireccional, las funciones de agregación, cálculo de subtotal y visibilidad de órdenes de compra (`necesitaColumnaOC`) fallaban silenciosamente.

---

## 4. Causa Raíz de Arquitectura
1. **Falta de Desenvolvimiento (`unref`) en Métodos Consumidores de Claves Dinámicas:** La reactividad en `<script setup>` expone refs en `$setup`. Si un método espera un string literal (`catKey`) pero recibe el identificador `tabCostoActiva` directamente en el manejador inline `@click`, debe asegurarse contractualmente que el argumento sea normalizado a un string antes de indexar diccionarios de datos (`costos.value[catKey]`).
2. **Duplicidad de Nomenclatura Semántica:** Ausencia de una función centralizadora de normalización (`normalizarCatKey`) que homogenice `subcontrato_flete` <-> `subcontratacion_flete` y `gastos_extra` <-> `gastos_extraordinarios`.

---

## 5. Plan de Mitigación y Resolución Estructural ("Cero Parches")

1. **Creación de Función Pura de Normalización en `ModalITS.vue`:**
   ```javascript
   const normalizarCatKey = (cat) => {
     const raw = (typeof cat === 'object' && cat !== null && 'value' in cat) ? cat.value : cat;
     const str = String(raw || '').trim();
     if (str === 'subcontrato_flete') return 'subcontratacion_flete';
     if (str === 'gastos_extra') return 'gastos_extraordinarios';
     return str;
   };
   ```

2. **Blindaje de Todos los Métodos Operativos de la Sección 3:**
   - `eliminarItemCosto`: Resuelve `catKey` con `normalizarCatKey(cat)`, valida que sea array y aplica `.splice(idx, 1)` recalculando totales inmediatamente.
   - `agregarItemCosto`: Garantiza la inserción en la clave canónica normalizada.
   - `toggleDeclararSinCosto`: Modifica el flag de confirmación bajo la clave normalizada.
   - `getEstadoCategoria`: Evalúa correctamente el conteo de ítems con `normalizarCatKey`.
   - `getSubtotalCategoria`: Suma montos de la categoría correcta sin desbordar ni retornar 0.
   - `necesitaColumnaOC`: Determina visibilidad de la columna N° OC aceptando ambas variantes de clave.

3. **Hidratación Resiliente en `cargarITS`:**
   ```javascript
   subcontratacion_flete: formatearItems(rawCostos.subcontratacion_flete || rawCostos.subcontrato_flete),
   gastos_extraordinarios: formatearItems(rawCostos.gastos_extraordinarios || rawCostos.gastos_extra),
   ```

4. **Compilación y Despliegue E2E:**
   Compilación limpia de bundles de frontend en producción (`dist_prod`) y desarrollo (`dist_dev`), sincronizados a los directorios web del servidor Nginx.

---

## 6. Protocolo de Respuesta y Guía al Usuario
> "El botón de eliminar ítem (basurero 🗑️) en la Sección 3 de Costos Operacionales del ITS ha sido completamente normalizado. Ahora al presionar el basurero en cualquiera de las 10 categorías (incluyendo Peajes, Personal Externo, Feriados, Subcontrato de Flete y Gastos Extra), el ítem se elimina de forma inmediata y se actualizan los subtotales y margen del proyecto automáticamente. Se recomienda refrescar la página con `Ctrl + F5`."

---

## 7. Lecciones Aprendidas y Acciones Preventivas
- **Contratos de Tipos en Componentes de Vue 3:** Siempre que una función de lógica de negocio o mutación de estado reciba identificadores de categoría desde templates, debe aplicar una función de desenvolvimiento (`unref` o inspección de `.value`) defensiva para evitar desacoples causados por la optimización del AST del compilador SFC.
- **Homologación de Diccionarios Frontend-Backend:** Mantener una constante compartida o mapeo bidireccional estricto entre los enums de base de datos (`dbCat`) y los nombres de propiedades en el cliente.
