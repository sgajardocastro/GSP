# Modelo de Surveys (Plantillas) - LeanGlobal Product

## Contexto General
LeanGlobal Product modela los formularios (surveys, checklists, inspecciones, visitas a terreno) a través de una arquitectura basada en un árbol JSON. Este JSON se inyecta en la base de datos (generalmente en el campo `body_seed` de la tabla `tsrv_templates`) y luego es renderizado e interpretado dinámicamente por las aplicaciones cliente (ej. PWA móvil).

## Estructura Base del JSON (`body_seed`)
La estructura se define por un nodo raíz que contiene un arreglo de **`segmentos`**. 

```json
{
  "segmentos": [
    // Lista de objetos de segmento
  ]
}
```

### 1. Segmentos (Secciones o "Páginas")
Cada segmento representa una agrupación lógica de campos. 

Propiedades principales de un segmento:
- `label` (String): El título o encabezado del segmento.
- `posicion` (Number): El orden de aparición (1, 2, 3...).
- `touch` (Boolean): Indica si el segmento ha sido interactuado (generalmente arranca en `false`).
- `collapsible` (Boolean): Si la interfaz debe permitir colapsar/ocultar el segmento.
- `attributes` (Array): La lista de preguntas o campos que pertenecen a esta sección.

### 2. Attributes (Campos y Preguntas)
Cada objeto dentro del array `attributes` representa un input específico. Las propiedades base que todo atributo debe tener son:

- `type` (String): Define el tipo de control en la UI. Tipos soportados:
  - `textField`: Texto corto de una línea.
  - `textArea`: Texto largo o área de observaciones.
  - `number`: Ingreso numérico.
  - `comboBox`: Selector desplegable de opciones.
  - `radioButton`: Selección única visible.
  - `geoLocation`: Captura de coordenadas GPS.
  - `photo`: Captura o subida de imágenes/fotografías.
  - `signature`: Panel de firma digital.
- `label` (String): La pregunta o texto visible para el usuario.
- `posicion` (Number): El orden de este campo dentro del segmento.
- `nullable` (Boolean): Regla de obligatoriedad (`false` significa que el campo es **obligatorio**).
- `default` (Any): Valor inicial por defecto (ej. `""`, o `{ "lat": null, "lng": null }` para GPS).

### 3. Opciones Múltiples (`comboBox` y `radioButton`)
Para los tipos de datos que requieren una lista de opciones, se anida un objeto `values` dentro del atributo.

Estructura de `values`:
- `quest` (String): Frecuentemente repite el label de la pregunta.
- `selected` (Any): Guarda la respuesta del usuario (arranca en `null`).
- `options` (Array): Lista de objetos con `{ "value": "ID", "label": "Texto Visible" }`.

**Ejemplo de Atributo ComboBox:**
```json
{
  "type": "comboBox",
  "label": "TIPO DE CONDUCTA",
  "posicion": 2,
  "nullable": false,
  "values": {
    "quest": "TIPO DE CONDUCTA",
    "selected": null,
    "options": [
      { "value": "RIESGOSA", "label": "Riesgosa" },
      { "value": "SEGURA", "label": "Segura" }
    ]
  }
}
```

### 4. Directrices de Implementación
- Al solicitar al agente la creación de un nuevo *Template de Survey*, el agente **NO DEBE ALUCINAR** esquemas de datos. Debe ceñirse estrictamente a las llaves: `type`, `label`, `posicion`, `nullable`, y `values.options` (si aplica).
- Los índices de `posicion` deben ser secuenciales y empezar en 1 tanto para los segmentos como para los atributos de cada segmento.
- Esta base de conocimiento elimina la necesidad de buscar scripts de inserción (`insert_templates.js`) cada vez que se deba integrar o diseñar un formulario dinámico para LeanGlobal.
