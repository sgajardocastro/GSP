# 📋 Especificación Técnica Oficial: Gestión Avanzada de Visitas a Terreno (Spec 41)

## 📌 1. Visión General y Objetivos de Negocio

Esta especificación formaliza el **rediseño y ampliación del ciclo de vida de las Visitas Técnicas a Terreno (Site Visits)** en el ecosistema Grúas San Pablo (GSP), resolviendo las 4 limitaciones operativas críticas identificadas en faena:

1. **Eliminación de la dependencia del correo:** El Coordinador de Operaciones puede asignar inspectores técnicos directamente desde la consola Web (Pestaña 2: *Validación & Diff*), sin requerir el Magic Link por email.
2. **Reasignación por imprevistos:** Posibilidad de cambiar el técnico asignado en caso de licencias, retrasos en otras faenas o emergencias operativas, transfiriendo de inmediato el acceso al Survey móvil.
3. **Soporte de Visitas Múltiples (Modelo 1:N):** Capacidad de registrar un historial de visitas para una misma OT (Visita #1 Inicial, Visita #2 Replanteo de Maniobra, etc.), manteniendo independientes sus informes técnicos y trazabilidad.
4. **Creación Autónoma por Operaciones:** Si el área Comercial no solicitó visita en Pestaña 1, el Coordinador de Operaciones puede activar de manera obligatoria una inspección de maniobra en Pestaña 2 por criterios de criticidad de izaje.

---

## 👥 2. Segregación Estricta de Roles y Pestañas

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ PESTAÑA 1: PREVENTA COMERCIAL (Ejecutivo de Ventas)                                    │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ • Rol: Ejecutivo Comercial (Natalia Giselini, etc.).                                   │
│ • Responsabilidad: Captura y solicitud de requerimiento.                               │
│ • Acciones:                                                                            │
│   - Checkbox: [x] Requiere Visita a Terreno.                                          │
│   - Fecha y ventana horaria sugerida.                                                 │
│   - Contacto en obra: PRECARGADO POR DEFECTO desde los datos de la cotización.        │
│ • Restricción: El comercial NO asigna técnicos ni gestiona inspectores.               │
│ • Estado resultante: `VISITA_SOLICITADA` (pendiente de asignación en Operaciones).    │
└────────────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ PESTAÑA 2: VALIDACIÓN & DIFF (Coordinador de Operaciones)                              │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ • Rol: Coordinador de Operaciones / Logística (Richard Jara, etc.).                   │
│ • Responsabilidad: Gobernanza y ejecución técnica de la visita.                        │
│ • Acciones:                                                                            │
│   1. Asignación directa en Web: Selecciona técnico y fecha formal con 1 clic.          │
│   2. Reasignación: Cambia el técnico asignado por imprevistos antes de la ejecución.   │
│   3. Visitas Múltiples: Solicita revisiones adicionales (Visita #2, #3...) con timeline│
│   4. Creación Autónoma: Exige visita obligatoria si comercial no la solicitó.          │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ 3. Modelo de Datos Relacional (PostgreSQL)

### 3.1 Estructura en `sch_leangsp.tsrv_survey` y `tpry_proyecto`
Para soportar el modelo 1:N sin romper compatibilidad con el Template 80 existente:

1. **Identificación de Múltiples Visitas en `tsrv_survey`:**
   * `id_proyecto`: Clave foránea al proyecto.
   * `id_template = 80`: Identificador del Template de Visita a Terreno.
   * `id_user`: ID del técnico inspector asignado actualmente.
   * `estado_srv`: `PLANIFICADO` (Asignada), `EN_EJECUCION` (Técnico en faena), `EJECUTADO` (Completada), `CANCELADO`.
   * `header_exec`: JSONB con metadatos de la visita:
     ```json
     {
       "nro_visita": 1,
       "tipo_visita": "INICIAL",
       "origen": "COMERCIAL_PREVENTA",
       "contacto_obra": {
         "nombre": "Carlos Soto",
         "telefono": "+56 9 8765 4321",
         "email": "csoto@constructora.cl"
       },
       "historial_asignaciones": [
         {
           "id_user": 14,
           "fecha_asignacion": "2026-09-02T14:00:00Z",
           "asignado_por": "Richard Jara"
         }
       ]
     }
     ```

2. **Snapshot Operativo en `tpry_proyecto.json_field.operaciones_v1.visitas`:**
   Arreglo de visitas vinculadas al proyecto:
   ```json
   [
     {
       "id_survey": 105,
       "nro_visita": 1,
       "estado": "EJECUTADO",
       "tecnico_nombre": "Juan Pérez",
       "fecha_programada": "2026-09-03",
       "pdf_url": "/api/servicio/exportar/105"
     }
   ]
   ```

---

## 🌐 4. Especificación de Endpoints (REST API)

### 4.1 Obtener Visitas Técnicas de la OT
* **Ruta:** `GET /api/operaciones/visita/proyecto/:id_proyecto`
* **Descripción:** Retorna el historial de visitas a terreno (1:N) asociadas a la OT, con datos del técnico, estado, contacto y enlaces a los reportes.
* **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "visita_solicitada_comercial": true,
      "contacto_sugerido": {
        "nombre": "Carlos Soto",
        "telefono": "+56 9 8765 4321",
        "email": "csoto@constructora.cl"
      },
      "visitas": [
        {
          "id_survey": 105,
          "nro_visita": 1,
          "estado_srv": "PLANIFICADO",
          "id_user": 14,
          "tecnico_nombre": "Pedro Morales",
          "fecha_plan_ini": "2026-09-04T10:00:00Z",
          "contacto_nombre": "Carlos Soto"
        }
      ]
    }
  }
  ```

### 4.2 Asignación Directa desde la Web
* **Ruta:** `POST /api/operaciones/visita/asignar-web`
* **Body:**
  ```json
  {
    "id_proyecto": 74,
    "id_survey": 105,
    "id_user_tecnico": 14,
    "fecha_programada": "2026-09-04T10:00:00Z",
    "contacto_nombre": "Carlos Soto",
    "contacto_telefono": "+56 9 8765 4321",
    "contacto_email": "csoto@constructora.cl",
    "observaciones": "Verificar radio de giro en zona de galpones"
  }
  ```
* **Lógica Backend:**
  1. Si `id_survey` no existe, crea el registro en `tsrv_survey` con `id_template = 80`.
  2. Asigna `id_user = id_user_tecnico` y `estado_srv = 'PLANIFICADO'`.
  3. Pre-siembra los datos del cliente, obra y contacto en `body_exec`.
  4. Despacha notificación por correo al técnico con el acceso directo a la PWA.

### 4.3 Reasignación de Técnico (Cambio por Imprevisto)
* **Ruta:** `POST /api/operaciones/visita/:id_survey/reasignar`
* **Body:**
  ```json
  {
    "id_user_nuevo": 22,
    "motivo": "Técnico original con licencia médica",
    "fecha_programada": "2026-09-04T11:00:00Z"
  }
  ```
* **Lógica Backend:**
  1. Valida que `estado_srv` sea `PLANIFICADO` o `EN_EJECUCION` (no completado).
  2. Actualiza `id_user` en `tsrv_survey`.
  3. Agrega entrada al `historial_asignaciones` en `header_exec`.
  4. Envía notificación al nuevo técnico y revoca la asignación anterior.

### 4.4 Creación Autónoma de Visita por Operaciones (o Visita Subsecuente)
* **Ruta:** `POST /api/operaciones/visita/crear-operaciones`
* **Body:**
  ```json
  {
    "id_proyecto": 74,
    "tipo_visita": "REPLANTEO_MANIOBRA",
    "id_user_tecnico": 14,
    "fecha_programada": "2026-09-06T09:00:00Z",
    "justificacion": "Cliente cambió ubicación de la carga a zona de terreno no consolidado"
  }
  ```
* **Lógica Backend:**
  1. Incrementa `nro_visita = max(nro_visita) + 1`.
  2. Crea un nuevo registro en `tsrv_survey` vinculado al proyecto.
  3. Deja registro en la bitácora del proyecto (`json_field.bitacora`).

---

## 🎨 5. Diseño UX/UI en Frontend (`GestorOportunidades.vue` - Pestaña 2)

### 5.1 Componente: `PanelVisitasTerreno.vue`
Embebido en la parte superior de la **Pestaña 2: Validación & Diff**, con tarjeta en Dark Mode industrial:

1. **Estado "Pendiente de Asignación" (Solicitada por Comercial):**
   * Muestra resumen de obra, fecha sugerida y contacto precargado.
   * Dropdown con lista de técnicos e inspectores de terreno sugeridos (`tsec_users` con rol inspector/operador).
   * Input de fecha y hora programada.
   * Botón de acción: `[ 👷 Confirmar y Asignar Técnico a Terreno ]`.
2. **Estado "Asignada" (Con opción de Reasignar):**
   * Badge ámbar `🟡 Visita #1 Programada: Pedro Morales (04/09/2026 10:00)`.
   * Botón secundario: `[ 🔄 Cambiar / Reasignar Técnico ]` (abre modal para seleccionar nuevo técnico e ingresar motivo).
   * Botón para ver encuesta móvil o enlace de prueba.
3. **Estado "Ejecutada / Completada":**
   * Badge esmeralda `🟢 Visita #1 Completada`.
   * Botón `[ 📄 Ver Informe Técnico de Visita (PDF) ]`.
   * Botón `[ + Programar Visita Adicional (Replanteo) ]`.
4. **Estado "No Solicitada en Preventa":**
   * Mensaje informativo: *"Comercial no requirió visita técnica para esta cotización."*
   * Botón destacado de Operaciones: `[ 📍 Exigir Visita Técnica Obligatoria (Operaciones) ]`.

---

## 🧪 6. Plan de Verificación Empírica (Criterios de Aceptación)

| # | Prueba | Acción | Resultado Esperado |
| :-: | :--- | :--- | :--- |
| **1** | **Precarga Contacto (Pestaña 1)** | Activar checkbox de visita en Preventa. | Nombre, teléfono y correo del cliente se precargan solos. |
| **2** | **Asignación Web (Pestaña 2)** | Asignar técnico desde la consola web sin abrir correo. | `tsrv_survey` se crea, estado pasa a `PLANIFICADO`, técnico recibe notificación. |
| **3** | **Reasignación** | Presionar `[ 🔄 Cambiar Técnico ]` y elegir otro usuario. | El survey pasa al nuevo usuario y se registra el motivo en la traza. |
| **4** | **Visitas Múltiples (1:N)** | Crear una segunda visita para la misma OT. | El proyecto muestra Visita #1 y Visita #2 sin colisión de datos. |
| **5** | **Creación Autónoma** | Crear visita en OT que no tenía visita solicitada. | Operaciones crea la inspección directamente desde Pestaña 2. |
