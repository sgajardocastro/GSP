# Script de Generación de API Backend - Paso 2

Este script de desarrollo guía a la IA en la creación de los controladores, rutas y middlewares de la API REST del proyecto, basándose en la especificación de negocio y arquitectura.

---

## Instrucciones para ejecutar en el Chat de IA

Copia y pega el siguiente bloque de texto en el asistente de IA para iniciar el desarrollo del backend:

```text
Actúa como un desarrollador backend senior con experiencia en Node.js, Express, TypeScript y Prisma ORM.

Tu objetivo es implementar la API REST para el sistema de Grúas San Pablo, siguiendo las especificaciones de:
1. Arquitectura Técnica: [architecture.md](../context/architecture.md)
2. Reglas del Negocio: [business_rules.md](../context/business_rules.md)
3. Especificación de Backend (API): [02_backend_spec.md](../spec-driven/02_backend_spec.md)
4. Base de Datos: [01_database_spec.md](../spec-driven/01_database_spec.md) (para interactuar con el cliente Prisma)

Realiza los siguientes pasos de forma secuencial:

Paso 2.1: Servidor base y Middlewares comunes
- Crea el servidor en `backend/src/server.ts` con Express y TypeScript.
- Configura middlewares de seguridad: `cors`, `helmet`, y parseo de JSON (`express.json()`).
- Implementa el middleware de manejo global de errores en `backend/src/middleware/errorHandler.ts` que capture excepciones y retorne un JSON estructurado con status de error.

Paso 2.2: Middleware de Autenticación JWT
- Crea `backend/src/middleware/auth.ts`.
- Implementa la función `authenticateJWT` que verifique la firma de un token JWT en la cabecera `Authorization`.
- Si el token es válido, inyecta la información del usuario en el objeto `req.user`.

Paso 2.3: Rutas y Controlador de Autenticación
- Implementa `backend/src/controllers/authController.ts` y `backend/src/routes/authRoutes.ts`.
- Agrega el endpoint `/api/auth/login`. Valida el email, verifica el password hash contra la BD, y genera un token JWT con vigencia de 24 horas.

Paso 2.4: Rutas y Controlador de Servicios
- Implementa `backend/src/controllers/serviceController.ts` y `backend/src/routes/serviceRoutes.ts`.
- Desarrolla el endpoint POST `/api/services` para crear servicios.
- Desarrolla PATCH `/api/services/:id/status` para la transición de estados.
- Recuerda la regla de negocio: toda transición debe registrarse en la tabla `ServiceLog` y cumplir la regla de ciclo de vida (no regresar a estados anteriores).

Proporciona el código TypeScript limpio, estructurado y documentado para cada archivo.
```
