# Plantilla de Nueva Funcionalidad (Feature Prompt Template)

Utiliza esta plantilla cuando requieras implementar una nueva característica o requerimiento en el software, asegurando consistencia con el diseño y la arquitectura preestablecida.

---

## Instrucciones de Uso

Copia el siguiente contenido en el chat con la IA, rellenando los campos indicados entre corchetes `[ ]`.

```text
Actúa como un arquitecto de software y desarrollador Full-Stack senior. Necesito agregar una nueva funcionalidad al sistema de Grúas San Pablo.

## Descripción del Requerimiento
- **Nombre de la funcionalidad**: [Ej. Notificación SMS al cliente cuando la grúa está En Ruta]
- **Objetivo comercial**: [Ej. Mejorar la transparencia y reducir la ansiedad del cliente final]
- **Flujo de Usuario esperado**: [Describe el paso a paso de cómo interactúa el usuario o el sistema con esta funcionalidad]

## Entorno y Guías
Debes alinear la implementación con:
- Arquitectura Técnica: [architecture.md](../context/architecture.md)
- Reglas del Negocio: [business_rules.md](../context/business_rules.md)

## Pasos requeridos para la IA
1. **Diseño de Integración/Base de Datos**: Si esta funcionalidad requiere nuevas tablas, columnas o credenciales de servicios externos, define primero el impacto y los cambios en el esquema.
2. **Desarrollo Backend**: Escribe los endpoints, controladores y lógica de negocio necesarios. Documenta los parámetros de entrada y respuestas de API.
3. **Desarrollo Frontend**: Desarrolla los componentes de interfaz de usuario necesarios siguiendo los colores corporativos y animaciones descritos en el sistema de diseño.
4. **Verificación**: Escribe un plan de pruebas para validar el correcto funcionamiento tanto en frontend como en backend.
```
