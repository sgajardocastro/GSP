# ⚙️ Workflow: Desarrollo de Características Spec-Driven (`spec_to_feature`)

## Descripción
Flujo procedimental en 3 pasos para la construcción e integración de cualquier nuevo módulo o característica en el sistema GSP.

---

## 🎯 Paso 1: Definición de la Especificación (Spec)
1. **Crear o actualizar la Spec:** Redactar el documento `.md` en `.agents/specs/` describiendo:
   - Esquema JSON / Modelo de Datos.
   - Reglas de negocio duras (validaciones HTTP, triggers).
   - Comportamiento de la UI y endpoints requeridos.
2. **Revisión con el Usuario:** Presentar la especificación y esperar confirmación.

---

## 🗄️ Paso 2: Generación de Base de Datos y API
1. **Base de Datos:** Crear/Modificar scripts SQL o migraciones en `ejecucion/bd/` o `ejecucion/backend/src/`.
2. **Controladores y Rutas Express:**
   - Crear controlador en `ejecucion/backend/src/controllers/`.
   - Exponer rutas REST en `ejecucion/backend/src/routes/`.
   - Aplicar middleware de autenticación y multi-tenant (`id_empresa`).
3. **Verificación Backend:** Probar que los endpoints respondan con los códigos HTTP adecuados (200, 201, 400, 422, 404, 500).

---

## 🖥️ Paso 3: Construcción de la Interfaz (Frontend Vue 3)
1. **Vistas / Componentes:** Crear o actualizar vistas en `ejecucion/frontend/src/views/` usando Vue 3 Composition API (`<script setup>`).
2. **Integración API:** Consumir endpoints mediante `apiAxios` desde `@/services/api`.
3. **Manejo de Estados Visuales:** Asegurar feedback visual claro (spinners de carga, notificaciones de éxito/error, modales de confirmación).
4. **Verificación de Navegación:** Registrar la ruta en `ejecucion/frontend/src/router/index.js` y vincular en `Sidebar.vue` si corresponde.
