# Análisis de Brechas (Gap Analysis) - Grúas San Pablo (GSP)

Este documento centraliza el análisis técnico y funcional entre el **Producto Existente** (Backend Node.js extraído del servidor y Frontend Transmac) y los **Requerimientos de Negocio GSP** (Holding de 4 empresas, flujos comerciales de preventa y roles con vista global).

## 1. Arquitectura Multi-Empresa (Multi-Tenant)

| Requerimiento GSP | Estado Actual del Producto | Brecha (Gap) Identificada | Severidad |
| :--- | :--- | :--- | :--- |
| **Aislamiento de Datos:** Los usuarios de cada una de las 4 empresas solo deben ver la información de su propia empresa (ej. proyectos, contratos). | En la base de datos existe el campo `id_empresa` en tablas críticas (ej. `tpry_proyecto`, `tsec_users`). Sin embargo, el **backend Node.js no filtra** las consultas. Por ejemplo, `proyectoModel.getProyectos()` ejecuta un `SELECT * FROM tpry_proyecto`, retornando la data de *todas* las empresas. | Falla de aislamiento de datos en la capa de acceso (Modelos). Se requiere inyectar lógica de filtrado (Middleware) basada en el JWT del usuario autenticado. | 🔴 CRÍTICA |
| **Rol de Vista Global:** Ciertos usuarios (Gerentes/Directores) necesitan ver un consolidado global de las 4 empresas. | El modelo de roles (`tsec_roles`) soporta permisos, pero **no existe la lógica en el backend ni en el frontend** para habilitar un "modo global" o un selector de contexto. | Falta desarrollo del "Conmutador de Contexto" (Context Switcher) en el Frontend y lógica de bypass en el Backend para usuarios globales. | 🟠 ALTA |
| **Gestión de Empresas:** Registrar y administrar el maestro de las 4 empresas hermanas. | La tabla `tpar_empresas` existe y ahora tiene Primary Key, pero el backend **carece de Rutas y Controladores** (API) para hacer un CRUD sobre esta entidad. | Se debe construir el módulo de administración de Empresas (API + Vistas Front). | 🟡 MEDIA |

## 2. Flujo Comercial y Operativo (Preventa)

| Requerimiento GSP | Estado Actual del Producto | Brecha (Gap) Identificada | Severidad |
| :--- | :--- | :--- | :--- |
| **Nacimiento del Proyecto (Preventa):** Todo proceso comercial debe generar un proyecto (tabla `tpry_proyecto`) forzando un estado inicial de "Preventa". | El controlador `createProyecto` recibe datos libres. No hay validación de estado inicial ni una ruta especializada para el nacimiento comercial de un servicio. | Falta especializar el endpoint de creación para el módulo comercial, amarrando el estado paramétrico de "Preventa" (`tpry_estado`). | 🟠 ALTA |
| **Ciclo de Vida del Servicio:** Aprobación de la cotización y paso a fase de preparación. | El producto actual permite hacer un `UPDATE` al proyecto, pero no orquesta reglas estrictas de transición de estado. | Falta una máquina de estados o validaciones de negocio en `proyectosController` para evitar saltos de fase inválidos. | 🟡 MEDIA |

## 3. Seguridad y Backend (Node.js + PostgreSQL)

| Componente | Hallazgo Técnico | Acción Requerida |
| :--- | :--- | :--- |
| **Autenticación (JWT)** | `authController.js` genera un token, pero no inyecta métricas clave como el `id_empresa` del usuario ni si es usuario global. | Modificar la generación del JWT para embeber el `id_empresa` y atributos del rol. |
| **Consultas Crudas (Servicios)** | Existen queries SQL hardcodeadas extensas en `config/servicios.json` que no discriminan por empresa. | Reescribir dinámicamente el `WHERE` de estas consultas o pasarlas a Modelos formales interceptados por el contexto de usuario. |
| **Base de Datos** | La falta de llaves primarias en las tablas principales (`tpar_empresas`, `tpry_proyecto`) **ya fue subsanada** por el administrador de base de datos. | Brecha cerrada. Listo para interacción segura. |

---

## Próximos Pasos Sugeridos (Para el Plan de Trabajo)

Este Gap Analysis indica que **no es necesario reescribir el backend**, sino aplicar el patrón de *Multi-Tenancy a nivel de aplicación*:
1.  **Interceptores (Middlewares):** Crear una capa en Express que lea el token y obligue a que todos los modelos filtren por `id_empresa`.
2.  **Módulos Faltantes:** Desarrollar los endpoints API para el módulo "Comercial/Preventa" y el maestro "Empresas".
3.  **Frontend Adaptativo:** Integrar el selector de empresas (Context Switcher) en el Topbar para roles globales.
