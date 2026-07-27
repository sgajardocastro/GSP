# Script de Generación de Base de Datos - Paso 1

Este script de desarrollo guía a la IA en la creación física de la base de datos del proyecto de Grúas San Pablo, siguiendo la especificación oficial.

---

## Instrucciones para ejecutar en el Chat de IA

Copia y pega el siguiente bloque de texto en el asistente de IA para iniciar el desarrollo del módulo de base de datos:

```text
Actúa como un desarrollador backend senior con experiencia en PostgreSQL y Prisma ORM.

Tu objetivo es inicializar la base de datos del proyecto "Gestión Operación Grúas". Para ello, debes basarte estrictamente en los siguientes documentos de contexto y especificación:
1. Arquitectura Técnica: [architecture.md](../context/architecture.md)
2. Especificación de Base de Datos: [01_database_spec.md](../spec-driven/01_database_spec.md)

Realiza los siguientes pasos de forma secuencial:

Paso 1.1: Generación del esquema de Prisma
- Crea el archivo `backend/prisma/schema.prisma` utilizando el contenido exacto de `01_database_spec.md`.
- Asegúrate de incluir el bloque de datasource configurado para PostgreSQL y el generador cliente de JS.

Paso 1.2: Inicialización de dependencias
- Genera el archivo `backend/package.json` si no existe.
- Agrega Prisma CLI y el cliente como dependencias de desarrollo y producción respectivamente:
  - npm install @prisma/client
  - npm install prisma --save-dev

Paso 1.3: Script de Seed de Base de Datos
- Crea un script de seed en `backend/prisma/seed.ts` que inserte:
  - 1 Usuario Administrador, 1 Despachador, y 2 Operadores (con contraseñas hasheadas usando bcryptjs).
  - 2 Grúas (1 Pluma y 1 Cama) con estado "DISPONIBLE" asociadas a los operadores correspondientes.
  - Al menos 1 solicitud de servicio de prueba en estado "SOLICITADO".

Paso 1.4: Script de migración y arranque
- Agrega un script en `package.json` llamado `db:migrate` que ejecute `npx prisma migrate dev --name init`.
- Agrega un script llamado `db:seed` que ejecute `npx prisma db seed`.

Por favor, proporciona el código completo de cada archivo creado. No uses marcadores de posición.
```
