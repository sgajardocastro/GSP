# 📐 Reglas Metodológicas: Spec-Driven Development

## 1. El Estándar Spec-Driven
- La especificación técnica es el contrato vinculante del software.
- Todo formulario dinámico en el sistema consume la estructura basada en el estándar `modelo_surveys_leanglobal.md`:
  - Propiedades obligatorias por campo: `type`, `label`, `posicion`, `nullable`.
  - Opciones parametrizadas: `values.options` con formato `{ "value": "KEY", "label": "Label Visual" }`.
  - Posicionamiento secuencial de 1 en adelante tanto para segmentos como para atributos.

## 2. Protocolo de Modificación
1. **Especificar Primero:** Antes de alterar cualquier tabla en BD o componente Vue, se debe redactar o actualizar el JSON Schema en la especificación correspondiente (`.agents/specs/`).
2. **Revisión del Usuario:** Presentar la especificación y obtener validación.
3. **Ejecución Fiel:** Codificar respetando exactamente los nombres de llaves, tipos de datos y estructuras definidas en la especificación.

## 3. Prohibición de Alucinación
- No inventar campos o tipos de datos no documentados.
- Si falta información técnica, consultar al usuario antes de asumir una definición.
