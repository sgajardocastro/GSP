# Script de Generación de Interfaz (Frontend) - Paso 3

Este script de desarrollo guía a la IA en la creación de los componentes interactivos y páginas del frontend, basándose en la especificación UI/UX y la paleta de colores corporativa.

---

## Instrucciones para ejecutar en el Chat de IA

Copia y pega el siguiente bloque de texto en el asistente de IA para iniciar el desarrollo del frontend:

```text
Actúa como un desarrollador frontend senior especializado en React, TypeScript y Tailwind CSS.

Tu objetivo es construir la interfaz de usuario para el sistema de Grúas San Pablo, asegurando una estética premium y un diseño responsive. Debes basarte en:
1. Arquitectura Técnica: [architecture.md](../context/architecture.md)
2. Especificación de Frontend: [03_frontend_spec.md](../spec-driven/03_frontend_spec.md)
3. Reglas de Negocio: [business_rules.md](../context/business_rules.md)

Realiza los siguientes pasos de forma secuencial:

Paso 3.1: Configuración del Sistema de Diseño (CSS y Tailwind)
- Crea `frontend/src/index.css` e implementa la paleta de colores base con variables CSS (Amber para primario, Slate para fondo y secundario).
- Asegúrate de configurar los estilos de botones globales y tarjetas viales con esquinas redondeadas y sombras sutiles.

Paso 3.2: Clientes de Servicios de API
- Crea un módulo en `frontend/src/services/api.ts` utilizando Fetch o Axios para interactuar con la API backend.
- Debe incluir métodos para iniciar sesión (`login`), crear servicio (`createService`), listar servicios (`getServices`), y actualizar estado (`updateServiceStatus`).
- Configura un interceptor para adjuntar el token JWT de forma automática en cada petición.

Paso 3.3: Dashboard del Despachador (Desktop)
- Diseña `frontend/src/views/DispatcherDashboard.tsx`.
- Incluye un layout de rejilla (Grid):
  - Izquierda: Formulario de creación de nuevos servicios de grúa con campos validados.
  - Derecha: Un panel de mapa interactivo simulado o integrado (usando Leaflet o un placeholder premium con CSS dinámico y pines coloreados).
  - Inferior: Lista de solicitudes pendientes y activas agrupadas por su estado actual en el ciclo de vida.

Paso 3.4: App Móvil del Operador (Mobile-First)
- Diseña `frontend/src/views/OperatorView.tsx`.
- Debe contar con un estilo totalmente optimizado para pantallas pequeñas y controles táctiles grandes.
- Implementa la tarjeta de servicio activo con un botón central de acción grande y animado que permita transicionar el estado del servicio actual (de Asignado a En Ruta, En Sitio, Traslado, y Completado).

Entrega el código de los componentes estructurados y con diseño premium.
```
