# 📐 Especificación Técnica: SPEC-120
## Normalización de Claves de Costos Operacionales y Eliminación Reactiva en Sección 3 de ModalITS

* **Identificador:** `SPEC-120`
* **Requerimiento Asociado:** `REQ-1134`
* **Caso de Soporte:** `CASO-20261109-03`
* **Componente:** `ejecucion/frontend/src/components/Operaciones/ModalITS.vue`
* **Versión de Implementación:** `v1.0.204`
* **Fecha:** 2026-11-09
* **Autor:** Sergio Gajardo / Antigravity

---

## 1. Contexto y Problema del Negocio
En el Cockpit PMO (Torre de Control), el Analista de Control de Gestión formula, revisa y edita los Informes de Término de Servicio (ITS). En la **Sección 3: Planilla de Costos Operacionales Directos de Terreno (10 Categorías)**, se imputan gastos de faena:
1. Viático Alimentación (`alimentacion`)
2. Combustible (`combustible`)
3. Movilización (`movilizacion`)
4. Peajes (`peajes`)
5. Pensiones (`pensiones`)
6. Personal Externo (`personal_externo`)
7. Feriados (`feriados`)
8. Subcontratación de Flete (`subcontratacion_flete`)
9. Gastos Extraordinarios (`gastos_extraordinarios`)
10. Hora Operador (`costo_hora_operador`)

Al utilizar la tabla dinámica compartida (para peajes, personal externo, feriados, subcontratación de flete y gastos extraordinarios), los botones con ícono de papelera (`🗑️`) no respondían al clic del usuario.

---

## 2. Diagnóstico de Causa Raíz Técnica
1. **Paso de Objeto Reactivo (`RefImpl`) a Métodos del Setup:**
   En el template de Vue 3 (`<script setup>`), la variable reactiva `tabCostoActiva = ref('combustible')` era suministrada directamente en el atributo inline:
   ```html
   <button type="button" @click="eliminarItemCosto(tabCostoActiva, idx)">🗑️</button>
   ```
   Al compilarse con `@vue/compiler-sfc`, el argumento entregado en tiempo de ejecución corresponde a la referencia reactiva (`$setup.tabCostoActiva`). Al indexar `costos.value[cat]`, JavaScript evalúa `costos.value["[object Object]"]`, retornando `undefined`. La condición `if (costos.value[cat])` fallaba y `.splice(idx, 1)` nunca se ejecutaba.
2. **Divergencia de Nombres de Categorías (Backend vs Frontend):**
   - En backend (`tits_costo_operacional`, `itsController.js`): `subcontrato_flete` y `gastos_extra`.
   - En frontend (`ModalITS.vue`): `subcontratacion_flete` y `gastos_extraordinarios`.
   Faltaba un mecanismo bidireccional puro de normalización para asegurar la persistencia e hidratación determinista.

---

## 3. Solución de Arquitectura ("Cero Parches")

### 3.1. Función Pura Centralizadora de Normalización
```javascript
const normalizarCatKey = (cat) => {
  const raw = (typeof cat === 'object' && cat !== null && 'value' in cat) ? cat.value : cat;
  const str = String(raw || '').trim();
  if (str === 'subcontrato_flete') return 'subcontratacion_flete';
  if (str === 'gastos_extra') return 'gastos_extraordinarios';
  return str;
};
```

### 3.2. Contratos Defensivos en Métodos de Manipulación
- **`eliminarItemCosto(cat, idx)`:** Resuelve `catKey = normalizarCatKey(cat)`, valida existencia de arreglo y ejecuta `costos.value[catKey].splice(idx, 1)` seguido de `recalcularTotales()`.
- **`agregarItemCosto(cat)`:** Utiliza `catKey` para insertar nuevos objetos de costo en la categoría correcta.
- **`toggleDeclararSinCosto(catKey)`:** Normaliza la clave antes de alternar el flag en `categoriasSinCosto.value`.
- **`getEstadoCategoria(catKey)`:** Consulta longitud del arreglo bajo la clave normalizada.
- **`getSubtotalCategoria(cat)`:** Realiza el `.reduce()` bajo `costos.value[catKey]`.
- **`necesitaColumnaOC(cat)`:** Verifica `['pensiones', 'personal_externo', 'subcontratacion_flete', 'subcontrato_flete'].includes(catKey)`.

### 3.3. Hidratación Resiliente en `cargarITS`
```javascript
subcontratacion_flete: formatearItems(rawCostos.subcontratacion_flete || rawCostos.subcontrato_flete),
gastos_extraordinarios: formatearItems(rawCostos.gastos_extraordinarios || rawCostos.gastos_extra),
```

---

## 4. Matriz de Verificación y Criterios de Aceptación
1. **CA-01:** Clic en basurero `🗑️` en cualquiera de las 10 categorías debe remover inmediatamente la fila del DOM.
2. **CA-02:** Recálculo inmediato de subtotales por categoría y costo operacional total en cabecera.
3. **CA-03:** Sin errores en consola del navegador (`TypeError: cannot read property of undefined`).
4. **CA-04:** Persistencia correcta al presionar `Guardar Avances` enviando `costos.value` saneado.
