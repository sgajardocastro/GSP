# Especificación Técnica: Fichas Públicas QR (Equipos y Personal)

## 1. Objetivo y Alcance
Proveer acceso público, rápido y seguro a la documentación vital y estado de acreditación de activos (grúas/equipos) y personal (operadores/riggers) mediante el escaneo de un código QR. 
El caso de uso principal es para prevencionistas de riesgo o guardias de acceso en faenas mineras/industriales que necesitan validar si la máquina o la persona está autorizada para operar, sin necesidad de tener un usuario y contraseña en LeanGlobal.

## 2. Arquitectura de Rutas Públicas (Frontend)
El sistema requiere aislar completamente estas vistas del motor de sesión (JWT) y del enrutador privado.

- **Layout Público:** Las rutas de acceso QR deben tener la configuración `meta: { layout: 'public' }` en `router/index.js` para forzar a Vue a usar un cascarón vacío sin Sidebar, sin Navbar y sin validación del Store de autenticación.
- **Ruta Equipos:** `/equipo/:patente` (Apunta a `FichaEquipoPublica.vue`).
- **Ruta Personal:** `/trabajador/:rut` (Apunta a `FichaTrabajadorPublica.vue`).

> [!WARNING]
> La omisión de la meta `layout: 'public'` causa que NGINX y el enrutador intenten montar componentes protegidos que buscan un token, desencadenando crashes en blanco o redirects a login que rompen el caso de uso del QR.

## 3. Resolución de APIs y Modelo de Datos (Backend)
Al montar el componente público, se dispara una petición asíncrona al backend para obtener los datos.

### 3.1 Ficha de Equipo
- **Endpoint:** `GET /api/tequ-equipos/:patente`
- **Datos Renderizados:** Fotografía de la máquina, estado operativo, marca, modelo, año, y el listado de documentos asociados (SOAP, Revisión Técnica, Póliza).
- **Gestión Documental:** Los documentos listados deben apuntar a la URL pública de resolución del nuevo Storage Engine (`/api/v1/storage/view/:id_doc`).

### 3.2 Ficha de Trabajador
- **Endpoint:** `GET /api/acreditacion/personal/:rut`
- **Seguridad en Entrada (Validación de RUT):** El frontend DEBE higienizar agresivamente el parámetro de entrada antes de enviarlo al backend, para asegurar consistencia contra la base de datos (donde el RUT podría estar guardado sin guión o con k minúscula).
  - Algoritmo de normalización: Eliminar puntos, guiones y espacios. Convertir "k" a mayúscula.
  - Regex base: `str.replace(/[^0-9kK]/g, '')`
- **Datos Renderizados:** Fotografía del trabajador, nombre completo, cargo, estado de inducción, y certificados críticos (Examen psicosensotécnico, EPP, Contrato).

## 4. Manejo de Errores y Edge Cases
- **404 - No Encontrado:** Si el backend responde 404 (patente o RUT inexistente), la vista debe mostrar un componente visual claro de "Acceso Denegado / Registro no encontrado" con el logo de la empresa. No debe mostrar una página en blanco.
- **500 - Falla de Backend:** Mensaje amigable instando a re-escanear o contactar al administrador de turno.
