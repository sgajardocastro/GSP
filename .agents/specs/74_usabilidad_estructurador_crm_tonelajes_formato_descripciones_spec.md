# SPEC-074: Mejoras de Usabilidad en Estructurador CRM: Selector de Tonelaje (10T), Formato Monetario y Descripciones Limpias

## 📌 Contexto & Motivación
Durante el uso operativo del módulo Comercial / Preventa CRM (`GestorOportunidades.vue`), el equipo comercial liderado por Jorge Ponce detectó tres fricciones recurrentes al confeccionar cotizaciones:
1. **REQ-633 (ID 703):** El selector de subcategorías de grúas sólo ofrecía las capacidades físicas cargadas en la BD de forma desordenada (alfabética: 100T antes de 40T) y carecía de tramos comerciales estándar (ej: 60T, 80T, 110T, 120T, 160T, etc.), impidiendo cotizar requerimientos donde el cliente exige un tonelaje nominal específico mientras que en operaciones se asigna un equipo de capacidad mayor.
2. **REQ-704 (ID 734):** Los valores monetarios en los campos de valor unitario del estructurador se visualizaban en texto plano sin separador de miles (`60000` en vez de `$ 60.000`), generando fatiga visual y alto riesgo de errores por dígitos sobrantes o faltantes.
3. **REQ-735 (ID 795):** El campo descripción venía prellenado con textos por defecto ("Servicio Grúa Telescópica en Faena") que obligaban al vendedor a borrarlos manualmente, la celda era visualmente angosta (`min-w-[160px]`), y no existía validación que exigiera completarlo antes de guardar.

---

## 🎯 Objetivos de la Especificación

1. **Selector de Tonelaje Paramétrico (REQ-633):**
   - Para la categoría `GRUAS TELESCOPICAS`, desplegar un listado continuo y ordenado numéricamente de 10 en 10 toneladas, desde **40 TON hasta 400 TON**, preservando las capacidades propias existentes (55 TON y 75 TON).
   - Mantener la compatibilidad total con la asignación en Operaciones (Pestaña B / Asignación de Recursos), donde se activa el badge de *"Equipo Mayor Capacidad (Alternativa Operativa — Tarifa Comercial Respaldada)"*.

2. **Formato Monetario con Separador de Miles (REQ-704):**
   - Implementar un input reactivo con adornador de moneda (`$`) y formateo dinámico con separador de miles (`es-CL`: `.` como miles).
   - Sanitizar la entrada en tiempo real (extrayendo únicamente dígitos numéricos) y almacenar el valor entero en `line.valorUnitario` y `line.valor_unitario`.
   - Aplicar el mismo formateo en modo solo-lectura en la Pestaña B de Operaciones.

3. **Descripciones Limpias, Espaciosas y Obligatorias (REQ-735):**
   - Inicializar el campo `descripcion` en blanco (`''`) al agregar nuevas líneas o al crear la línea de grúa base en el estructurador, permitiendo un placeholder intuitivo: `"Describa el trabajo o equipo a cotizar (Obligatorio)..."`.
   - Ampliar el ancho mínimo de la columna y celda de descripción a `min-w-[280px]` para permitir la lectura fluida del texto sin truncamiento.
   - Incorporar validación bloqueante en `guardarEnPreventa()` y en `validarDatosPreventaParaCotizar()` que alerte si alguna fila tiene la descripción vacía.

---

## 📐 Diseño Técnico & Contratos

### 1. Generador de Subcategorías Numéricas (`getSubcategoriesForType`)
```javascript
// Rango canónico ordenado de 40 TON a 400 TON en incrementos de 10T + capacidades especiales GSP
const TONELAJES_CANONICOS = [
  40, 50, 55, 60, 70, 75, 80, 90, 100, 110, 120, 130, 140, 
  150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250, 
  260, 270, 280, 290, 300, 320, 350, 400
]
```
Si el tipo corresponde a `GRUAS TELESCOPICAS`, se generan objetos `{ id_subcategoria, nombre_subcategoria: 'GRUA X TON' }` ordenados estrictamente por `X` ascendente.

### 2. Helpers de Formato Monetario en Tiempo de Edición
```javascript
const formatInputMiles = (val) => {
  if (val === null || val === undefined || val === '') return ''
  const num = parseInt(String(val).replace(/\D/g, ''), 10)
  if (isNaN(num) || num === 0) return ''
  return new Intl.NumberFormat('es-CL').format(num)
}

const onValorUnitarioInput = (e, line) => {
  const raw = e.target.value.replace(/\D/g, '')
  const num = raw ? parseInt(raw, 10) : 0
  line.valorUnitario = num
  line.valor_unitario = num
  e.target.value = num > 0 ? new Intl.NumberFormat('es-CL').format(num) : ''
}
```

### 3. Validación de Descripción Obligatoria
```javascript
for (let i = 0; i < lines.value.length; i++) {
  const l = lines.value[i]
  if (l.tipo && (!l.descripcion || String(l.descripcion).trim() === '')) {
    alert(`⚠️ Fila #${i + 1} del Estructurador: Debe ingresar la Descripción del Servicio antes de guardar.`)
    activeTab.value = 'servicios'
    return false
  }
}
```

---

## 🛡️ Criterios de Aceptación (DoD)
1. Al seleccionar categoría `GRUAS TELESCOPICAS`, el selector de subcategoría muestra `GRUA 40 TON`, `GRUA 50 TON`, `GRUA 55 TON`, `GRUA 60 TON`, ..., `GRUA 400 TON` en estricto orden ascendente numérico.
2. Al ingresar valores en el campo Valor Unitario, se formatea automáticamente con puntos de miles (ej: digitando `60000` se muestra `60.000` con símbolo `$`).
3. Al agregar líneas nuevas o inicializar la grúa base, el campo descripción aparece limpio (vacío) con placeholder instructivo.
4. La columna de descripción dispone de al menos 280px de ancho y no corta el texto escrito por el vendedor.
5. Si el vendedor intenta guardar o cotizar con alguna fila sin descripción, el sistema emite una alerta puntual y enfoca la pestaña de servicios.
6. Build de Vite compila con 0 errores (`npm run build`).
