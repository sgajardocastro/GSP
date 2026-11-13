# Spec 51: Módulo de Backlog de Mejoras y Evolución de Marcha Blanca

## 1. Visión y Objetivo
Proveer un módulo centralizado dentro de la plataforma Grúas San Pablo (**GSP Console**) que registre, clasifique y visibilice de forma ejecutiva todas las mejoras, requerimientos y ajustes técnicos realizados durante la etapa de implementación y marcha blanca con los mandantes.

El objetivo estratégico es **tangibilizar el valor y la atención continua de ingeniería ante los clientes**, permitiendo que cualquier usuario (incluyendo contrapartes y supervisores mandantes) audite el progreso y la velocidad de resolución del equipo técnico, restringiendo la creación y modificación de requerimientos exclusivamente a la autoridad administradora (**Sergio Gajardo** y rol **ADMIN**).

---

## 2. Modelo de Datos (PostgreSQL `sch_leangsp`)

### Tabla: `sch_leangsp.tcfg_backlog`

| Campo | Tipo | Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id_backlog` | `SERIAL` | `PRIMARY KEY` | Identificador autoincremental |
| `codigo_req` | `VARCHAR(20)` | `NOT NULL UNIQUE` | Correlativo formal (ej: `REQ-001`, `REQ-002`) |
| `nombre_requerimiento` | `VARCHAR(255)` | `NOT NULL` | Título conciso del requerimiento |
| `descripcion` | `TEXT` | `NULL` | Detalle, contexto técnico e impacto operacional |
| `prioridad` | `VARCHAR(20)` | `NOT NULL DEFAULT 'MEDIA'` | `CRITICA`, `ALTA`, `MEDIA`, `BAJA` |
| `fecha_registro` | `DATE` | `NOT NULL DEFAULT CURRENT_DATE` | Fecha en que se levantó la solicitud |
| `fecha_implementacion` | `DATE` | `NULL` | Fecha de pase a producción o estimada |
| `solicitado_por` | `VARCHAR(150)` | `NOT NULL` | Persona, cliente o rol solicitante |
| `estado` | `VARCHAR(30)` | `NOT NULL DEFAULT 'PENDIENTE'` | `PENDIENTE`, `EN_EJECUCION`, `IMPLEMENTADO` |
| `creado_por` | `VARCHAR(100)` | `NULL` | Usuario que registró el item en sistema |
| `fecha_creacion` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Timestamp de auditoría |
| `fecha_actualizacion` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Timestamp de última modificación |

---

## 3. Matriz RBAC y Reglas de Negocio (Spec 51)

1. **Permiso de Lectura (Visor Público/Clientes):**
   - Todos los usuarios autenticados de la consola (Clientes, ITOs, Coordinadores, Analistas) tienen acceso a la vista `/backlog`.
   - Visualizan KPIs, filtros y la tabla completa de requerimientos resueltos y en curso.

2. **Permiso de Escritura / Mutación (Exclusivo Sergio Gajardo / ADMIN):**
   - El botón `+ Nuevo Requerimiento`, el modal de creación y la edición rápida de estado están **estrictamente condicionados**:
     ```javascript
     const esAdmin = computed(() => {
       const u = JSON.parse(localStorage.getItem('user') || '{}');
       const email = (u.email || '').toLowerCase();
       const nombre = (u.nombre || u.name_frst || '').toLowerCase();
       const rol = (u.role || u.rol || u.id_perfil || '').toString().toUpperCase();
       
       if (u.id_user === 55 || email.includes('sgajardo') || nombre.includes('sergio gajardo')) return true;
       if (rol.includes('ADMIN') || rol.includes('GERENCIA') || rol === '1') return true;
       return false;
     });
     ```
   - Si `esAdmin === false`, los controles de edición quedan ocultos y deshabilitados tanto a nivel de UI como en los endpoints backend mediante verificación de sesión.

---

## 4. Endpoints de la API (`/api/backlog`)

- `GET /api/backlog`: Retorna lista ordenada por prioridad y fecha de registro descendente.
- `POST /api/backlog`: Crea un nuevo requerimiento. Genera código correlativo automático (`REQ-001`, `REQ-002`...).
- `PUT /api/backlog/:id`: Actualiza datos y estado (`PENDIENTE` ➔ `EN_EJECUCION` ➔ `IMPLEMENTADO`).
- `DELETE /api/backlog/:id`: Eliminación física/lógica solo para ADMIN.

---

## 5. Componentes Frontend

1. **Ruta:** `/backlog` en `src/router/index.js` apuntando a `src/views/BacklogView.vue`.
2. **Navegación:** Entrada `Backlog` en `src/components/Sidebar.vue` con icono `ListTodo` o `CheckSquare`.
3. **Vista `BacklogView.vue`:**
   - 4 Tarjetas de Métricas (Total, Pendientes, En Ejecución, Implementados con tasa % de éxito).
   - Filtros por Estado, Prioridad y Búsqueda textual.
   - Tabla de alto contraste corporativo (modo oscuro con paleta temática GSP ámbar/esmeralda).
   - Modal de Creación/Edición con validaciones reactivas.
