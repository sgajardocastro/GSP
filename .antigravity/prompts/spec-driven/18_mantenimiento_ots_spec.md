# 🛠️ ESPECIFICACIÓN TÉCNICA: MÓDULO MANTENIMIENTO Y ORDENES DE TRABAJO (OTs)

> **Módulo**: Mantenimiento & Flotas  
> **Sistema**: Grúas San Pablo (GSP) / LeanGlobal  
> **Código Requerimiento**: RF-MNT-01 a RF-MNT-06  
> **Esquema DB**: `sch_leangsp`  

---

## 1. Alcance Funcional Explicito

El módulo de Mantenimiento controla la gestión operativa y el costeo consolidado de mantenciones preventivas, correctivas y predictivas sobre los activos de la flota (`tequ_equipo`), integrando:
1. Registro y apertura de Órdenes de Trabajo (OT) por equipo y empresa.
2. Checklist de tareas/actividades planificadas con control de estado.
3. Planificación e imputación de repuestos despachados desde bodega.
4. Imputación de Mano de Obra (Horas Hombre HH) con tarifa por hora y costeo automático.
5. Imputación de Servicios Externos contratados a terceros.
6. Proceso de Cierre de OT con firma y PIN de 4 dígitos del supervisor.

---

## 2. Definición Detallada de Campos y Restricciones

### A. Tabla: `tmnt_ot`
- `id_ot` (BIGSERIAL PRIMARY KEY)
- `id_empresa` (BIGINT NOT NULL — Tenant Scope)
- `numero_folio` (VARCHAR(50) NOT NULL — UNIQUE(id_empresa, numero_folio))
- `id_equipo` (BIGINT NOT NULL FK `tequ_equipo.id_equipo`)
- `tipo_mantenimiento` (VARCHAR(30) NOT NULL CHECK (PREVENTIVO, CORRECTIVO, PREDICTIVO, ESPECIAL))
- `estado` (VARCHAR(30) DEFAULT 'ABIERTA' CHECK (ABIERTA, EN_PROCESO, ESPERA_REPUESTOS, CERRADA))
- `falla_reportada` (TEXT NOT NULL)
- `id_supervisor` (BIGINT NOT NULL)
- `fecha_apertura` (TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP)
- `fecha_cierre_real` (TIMESTAMPTZ NULL)
- `horometro_inicio` (NUMERIC(10,2) NOT NULL)
- `costo_total_calculado` (NUMERIC(15,2) DEFAULT 0)

### B. Tabla: `tmnt_ot_actividad`
- `id_ot_actividad` (BIGSERIAL PRIMARY KEY)
- `id_ot` (BIGINT NOT NULL FK `tmnt_ot` ON DELETE CASCADE)
- `descripcion_actividad` (TEXT NOT NULL)
- `horas_estimadas` (NUMERIC(5,2) NOT NULL DEFAULT 1.0)
- `estado` (VARCHAR(30) DEFAULT 'PENDIENTE' CHECK (PENDIENTE, EN_PROCESO, COMPLETADA))
- `orden` (INTEGER NOT NULL)

### C. Tabla: `tmnt_ot_hh`
- `id_ot_hh` (BIGSERIAL PRIMARY KEY)
- `id_ot` (BIGINT NOT NULL FK `tmnt_ot` ON DELETE CASCADE)
- `id_tecnico` (BIGINT NOT NULL)
- `horas_reales` (NUMERIC(6,2) NOT NULL CHECK >= 0)
- `tarifa_hora` (NUMERIC(10,2) NOT NULL CHECK >= 0)
- `descripcion_trabajo` (TEXT NOT NULL)
- `costo_calculado` (NUMERIC(15,2) GENERATED ALWAYS AS (horas_reales * tarifa_hora) STORED)

### D. Tabla: `tmnt_ot_cierre`
- `id_ot_cierre` (BIGSERIAL PRIMARY KEY)
- `id_ot` (BIGINT NOT NULL UNIQUE FK `tmnt_ot`)
- `pin_hash` (VARCHAR(255) NOT NULL — Hash del PIN de 4 dígitos)
- `fecha_cierre` (TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP)
- `costo_repuestos` (NUMERIC(15,2) NOT NULL DEFAULT 0)
- `costo_hh` (NUMERIC(15,2) NOT NULL DEFAULT 0)
- `costo_servicios_ext` (NUMERIC(15,2) NOT NULL DEFAULT 0)
- `costo_total` (NUMERIC(15,2) NOT NULL DEFAULT 0)

---

## 3. Reglas de Negocio Duras (Backend & Database Triggers)

1. **`EQUIPO_CON_OT_ACTIVA`**: No se puede abrir una nueva OT para un equipo que ya posee una OT en estado distinto de `CERRADA`.
2. **`OT_CON_ACTIVIDADES_PENDIENTES`**: Trigger BD `trg_chk_cierre_ot` e Invariant API impiden cambiar el estado de la OT a `CERRADA` si existen tareas sin estado `COMPLETADA`.
3. **`OT_CON_REPUESTOS_PENDIENTES`**: Bloquea el cierre si existen repuestos planificados no despachados desde bodega.
4. **`PIN_INVALIDO`**: El cierre de OT requiere la validación exitosa del PIN de 4 dígitos del supervisor asignado.

---

## 4. Endpoints REST API (`/api/mantenimiento`)

- `GET /api/mantenimiento/ots` — Listado de OTs filtradas por `id_empresa`, estado y patente.
- `POST /api/mantenimiento/ots` — Apertura de OT (Valida `EQUIPO_CON_OT_ACTIVA`).
- `GET /api/mantenimiento/ots/:folio` — Ficha completa de OT con actividades, HH, repuestos y servicios.
- `PUT /api/mantenimiento/ots/:folio/estado` — Transición de estado.
- `POST /api/mantenimiento/ots/:folio/cerrar` — Cierre autorizado por PIN (Valida tareas y repuestos completados).
- `POST /api/mantenimiento/ots/:folio/actividades` — Creación de tarea de checklist.
- `PUT /api/mantenimiento/ots/:folio/actividades/:id` — Actualización de estado de tarea.
- `POST /api/mantenimiento/ots/:folio/hh` — Imputación de Horas Hombre.
- `POST /api/mantenimiento/ots/:folio/servicios` — Registro de servicios externos.
