# Arquitectura Técnica - Sistema de Gestión de Operación de Grúas

Este documento define la base tecnológica, patrones de diseño y estándares de desarrollo para el proyecto de **Gestión de Operación de Grúas (Grúas San Pablo)**. Sirve como contexto permanente para que la IA genere código consistente.

## 1. Stack Tecnológico Propuesto

Para garantizar velocidad, escalabilidad y una experiencia de usuario premium, utilizaremos:

*   **Frontend**: React (TypeScript) + Vite + Tailwind CSS + Shadcn UI / Lucide React.
*   **Backend**: Node.js (TypeScript) + Express.js.
*   **ORM**: Prisma ORM (PostgreSQL).
*   **Monitoreo y Logger**: Winston / Morgan.
*   **Autenticación**: JSON Web Tokens (JWT) + bcryptjs.

---

## 2. Estructura del Proyecto

El repositorio se organizará como un monorepositorio ligero (o dos carpetas raíz):

```text
/
├── frontend/             # Código de la aplicación web (React)
│   ├── src/
│   │   ├── components/   # Componentes UI reutilizables
│   │   ├── views/        # Páginas / Vistas principales
│   │   ├── services/     # Clientes de API y peticiones
│   │   ├── context/      # Estados globales (Autenticación, Ajustes)
│   │   └── hooks/        # Custom hooks de React
├── backend/              # API REST (Node.js + Express)
│   ├── src/
│   │   ├── controllers/  # Controladores de solicitudes HTTP
│   │   ├── routes/       # Definición de rutas API
│   │   ├── middleware/   # Validadores y seguridad (JWT, CORS)
│   │   ├── services/     # Lógica de negocio
│   │   └── config/       # Conexiones y variables de entorno
│   ├── prisma/           # Esquemas y migraciones de BD
└── .antigravity/         # Configuración y prompts de desarrollo IA
```

---

## 3. Patrones y Reglas de Código (Para la IA)

*   **Tipado Estricto**: Todo componente, servicio o controlador debe tener tipos de TypeScript explícitos. Evitar el uso de `any`.
*   **Componentes UI**: Utilizar componentes funcionales en React. Estilizar usando Tailwind CSS con un enfoque móvil-primero.
*   **Control de Errores**: 
    *   En Backend: Usar bloques `try/catch` en controladores que deleguen a un middleware centralizado de manejo de errores.
    *   En Frontend: Implementar `ErrorBoundary` para fallos de renderizado y notificaciones toast para errores de API.
*   **Seguridad**: Todos los endpoints de operación y administración deben requerir el middleware `authenticateJWT`.

---

## 4. Conexión a Base de Datos (Ambiente de Ejecución)

*   **Server Type**: PostgreSQL
*   **Name**: lean_gsp
*   **Host**: `servidor.leanglobal.cl`
*   **Port**: `5432`
*   **Username**: `usr_leangsp`
*   **Password**: `usr_gsp_123`
*   **Database**: `postgres`
*   **Schema por defecto (search_path)**: `sch_leangsp` (Establecido vía `ALTER USER usr_leangsp SET search_path TO sch_leangsp, public;` en la BD)
*   **DATABASE_URL (Prisma)**: `postgresql://usr_leangsp:usr_gsp_123@servidor.leanglobal.cl:5432/postgres?schema=sch_leangsp`

---

## 5. Acceso SSH al Servidor (Ambiente de Ejecución)

*   **Host Name / IP**: `servidor.leanglobal.cl` (ó `138.255.103.18`)
*   **Port**: `1295` (No usar puerto 22)
*   **Connection Type**: SSH
*   **Username**: `root`
*   **Password**: `lgbl2025.`
*   **Debes trabajar con el usuario nodeadmin**, no puedes matar todo nodejs, solo el backend de esta instancia.
*   **PM2 Process Name**: `lean-services-gsp` (Ejecutándose bajo el usuario `nodeadmin`)
*   **Puerto Local**: `3006`
*   **Dirección Base del API**: `https://servidor.leanglobal.cl/lg-gsp/api`
*   **Ruta del Backend**: `/home/nodeadmin/proyectos/lean-services-gsp/`
*   **Configuración de Proxy Nginx**: Ubicada en `/etc/nginx/sites-enabled/https_le.conf` (Mapea la locación `/lg-gsp/` al puerto `3006` de localhost)

---

## 6. Puntos Relevantes en la Cotización

1.  **Documentos de Facturación (OC/HES)**: Indicar si el cliente requiere que la factura final lleve asociada una Orden de Compra (OC), Hoja de Entrada de Servicios (HES) u otro documento de respaldo (`requiere_oc_hes`).
2.  **Acreditación del Servicio**: Indicar de forma obligatoria si el servicio requiere acreditación (`requiere_acreditacion`), detallando los documentos solicitados por el cliente (ej: F30, F30-1, inducción, exámenes de altura, etc.) en `acreditacion_docs`.
3.  **Condición del Servicio**:
    *   **Programado**: Se reserva el equipo a todo evento. El cliente paga el servicio comprometido de forma garantizada.
    *   **A Disponibilidad**: No se asegura el servicio de forma anticipada. Queda sujeto a la disponibilidad real de equipos y operadores al momento de la ejecución.

