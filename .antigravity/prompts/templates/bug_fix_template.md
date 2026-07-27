# Plantilla de Resolución de Bugs (Bug Fix Prompt Template)

Utiliza esta plantilla cuando necesites que la IA resuelva un error o comportamiento inesperado de forma limpia y segura.

---

## Instrucciones de Uso

Copia el siguiente contenido en el chat con la IA, rellenando los campos indicados entre corchetes `[ ]`.

```text
Actúa como un desarrollador senior y experto en QA. Necesito que me ayudes a diagnosticar y resolver el siguiente bug en el sistema de Grúas San Pablo.

## Contexto del Problema
- **Componente afectado**: [Ej. Controlador de servicios en el Backend / Formulario de Nuevo Servicio en Frontend]
- **Comportamiento esperado**: [Describe detalladamente qué debería ocurrir]
- **Comportamiento actual / Error**: [Describe detalladamente qué ocurre o adjunta el stack trace del error]

## Reglas de Arquitectura y Negocio
Debes asegurarte de respetar los siguientes documentos del proyecto:
- Arquitectura Técnica: [architecture.md](../context/architecture.md)
- Reglas del Negocio: [business_rules.md](../context/business_rules.md)

## Tareas requeridas
1. **Análisis**: Explica la causa raíz del problema basándote en el código y el error proporcionado.
2. **Solución propuesta**: Explica los cambios necesarios antes de modificar archivos.
3. **Código de corrección**: Genera el bloque de cambios completo (diff o archivo completo modificado) con las correcciones aplicadas.
4. **Pruebas sugeridas**: Describe un caso de prueba manual paso a paso para verificar que el bug quedó resuelto y no afectó otras áreas.
```
