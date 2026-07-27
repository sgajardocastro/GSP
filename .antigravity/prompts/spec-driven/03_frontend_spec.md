# 🧭 Especificación General de Navegación (Sidebar & Layout)

Este documento define la estructura de navegación de la aplicación GSP Console, la jerarquía del menú lateral (Sidebar) y las rutas correspondientes en el frontend.

---

## 1. ESTRUCTURA Y ORDEN DEL MENÚ LATERAL (SIDEBAR)

El menú de navegación lateral debe mantener un diseño limpio de **una sola línea** (sin subtítulos explicativos de goma), alineándose directamente con el estándar visual establecido en Transmac.

El orden, nombres y rutas correspondientes son:

| Orden | Nombre del Menú | Ruta Vue (routeName) | Componente Vista (View) | Indicadores / Badges (Dinámicos) |
| :---: | :--- | :---: | :---: | :---: |
| 1 | **Dashboard** | `dashboard` | `Dashboard.vue` | — |
| 2 | **Torre de Control Vista 360** | `torre` | `Torre.vue` | Cantidad real de OTs en ejecución/activas |
| 3 | **Clientes** | `clientes` | `Clientes.vue` | — |
| 4 | **Estados de Pago** | `cruce` | `Cruce.vue` | — |
| 5 | **Gestión de Flota** | `mantencion` | `Mantencion.vue` | — |
| 6 | **Acreditación Personal** | `acreditacion` | `Acreditacion.vue` | Cantidad real de operadores/riggers con pases bloqueados |
| 7 | **Gestor Documental** | `documentos` | `Documentos.vue` | — |

---

## 2. REGLAS DE COMPORTAMIENTO Y DINAMISMO (EJECUCIÓN REAL)

- **Contador Torre de Control:** 
  * Se elimina el valor estático `12`.
  * La aplicación realiza un fetch asíncrono al endpoint `/api/proyectos` al montarse.
  * Filtra y cuenta de manera reactiva los proyectos activos cuyo estado operativo corresponda a la ejecución o asignación (`id_proyecto_estado` igual a 3 o 4).
- **Contador Acreditación Personal:**
  * Se elimina el valor estático `2`.
  * La aplicación realiza un fetch para contar los operadores y riggers que tengan acreditaciones vencidas o bloqueadas.
- **Diseño Visual de una línea:**
  * El link del menú no debe contener el bloque descriptivo `<span class="text-[9px] text-slate-500 ...">`.
  * Utiliza `font-medium` y `tracking-wide` en una sola línea de texto de tamaño `text-sm`.
