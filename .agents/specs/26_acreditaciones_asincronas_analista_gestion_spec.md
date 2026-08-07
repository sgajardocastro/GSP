# 📄 Especificación Técnica: Módulo Asíncrono de Acreditaciones & Analista de Gestión (GSP Core)

## 📌 1. Visión General y Objetivos de Negocio

El módulo de **Acreditaciones Post-Venta Ganada** gestiona de forma asíncrona y no bloqueante la documentación laboral, técnica y de seguridad requerida por los clientes mandantes para la movilización e ingreso de grúas y personal a faenas industriales.

### Objetivos Principales:
1. **Desacoplamiento Operacional:** La acreditación se activa automáticamente al pasar una cotización a estado **`GANADA`**, permitiendo que los trabajos operacionales avancen mientras la acreditación se completa en paralelo.
2. **Rol Analista de Gestión:** Introduce el rol de control y auditoría **`USR-ANALISTA-GESTION`**, responsable de revisar, aprobar u observar el expediente documental cargado por el Ejecutivo Comercial.
3. **Visibilidad en Primer Nivel:** Añade la columna dedicada **"En Acreditación"** en la Torre de Control (Kanban principal) con semáforos de avance.
4. **Resguardo Fiscal & Auditoría:** Garantiza la disponibilidad inmediata del Dossier Digital Unificado de Acreditación frente a fiscalizaciones de la Dirección del Trabajo, SERNAGEOMIN o inspectores de faena.

---

## 🛠️ 2. Especificación del Modelo de Datos (PostgreSQL `sch_leangsp`)

### 2.1 Tabla `sch_leangsp.tpry_acreditacion` (Encabezado de Acreditación)
- `id_acreditacion` (SERIAL PRIMARY KEY)
- `id_proyecto` (INT NOT NULL, FK ➔ `tpry_proyecto`)
- `estado_acreditacion` (VARCHAR(50) DEFAULT 'EN_TRAMITE') -- `EN_TRAMITE`, `OBSERVADO`, `ACREDITADO_OK`, `ALERTA_CRITICA`
- `id_user_comercial` (INT, FK ➔ `tsec_users`) -- Comercial a cargo de subir documentos
- `id_user_analista` (INT, FK ➔ `tsec_users`) -- Analista de Gestión que audita
- `porcentaje_avance` (INT DEFAULT 0) -- 0 a 100%
- `fecha_inicio` (TIMESTAMP DEFAULT NOW())
- `fecha_aprobacion_final` (TIMESTAMP NULL)
- `created_at` (TIMESTAMP DEFAULT NOW())
- `updated_at` (TIMESTAMP DEFAULT NOW())

### 2.2 Tabla `sch_leangsp.tpry_acreditacion_doc` (Detalle de Documentos del Expediente)
- `id_acreditacion_doc` (SERIAL PRIMARY KEY)
- `id_acreditacion` (INT NOT NULL, FK ➔ `tpry_acreditacion` ON DELETE CASCADE)
- `nombre_requisito` (VARCHAR(255) NOT NULL) -- Ej: 'Póliza de Izaje Seguros', 'Certificado Rigger', 'Examen de Salud Operador'
- `categoria_doc` (VARCHAR(100) DEFAULT 'EQUIPOS') -- `EQUIPOS`, `PERSONAL`, `EMPRESA`
- `id_doc` (INT NULL, FK ➔ `tfmg_file`) -- Archivo PDF cargado
- `estado_doc` (VARCHAR(50) DEFAULT 'PENDIENTE') -- `PENDIENTE`, `SUBIDO`, `APROBADO`, `RECHAZADO`
- `observacion_analista` (TEXT NULL) -- Comentario si el Analista rechaza u observa
- `fecha_vencimiento_doc` (DATE NULL)
- `created_at` (TIMESTAMP DEFAULT NOW())
- `updated_at` (TIMESTAMP DEFAULT NOW())

---

## 🚦 3. Matriz de Estados y Reglas de Negocio

| Estado | Badge Visual | Regla de Tránsito |
| :--- | :--- | :--- |
| **`EN_TRAMITE`** | 🟡 En Trámite | Cotización recién ganada. Comercial subiendo documentos. |
| **`OBSERVADO`** | 🟠 Observado | Analista de Gestión rechazó al menos 1 documento con comentario. |
| **`ACREDITADO_OK`** | 🟢 Acreditado Conforme | 100% de documentos aprobados por el Analista de Gestión. |
| **`ALERTA_CRITICA`** | 🔴 Alerta Crítica | Documento vencido o faltante a menos de 24h de ingreso a faena. |

---

## 💻 4. Endpoints REST API (`/api/acreditaciones`)

- `GET /api/acreditaciones` -> Listado de acreditaciones activas con avance y semáforos para el Kanban.
- `GET /api/acreditaciones/:id_acreditacion` -> Detalle completo del expediente y documentos.
- `POST /api/acreditaciones/:id_acreditacion/documentos` -> Subida de documento PDF por el Comercial.
- `PUT /api/acreditaciones/documentos/:id_acreditacion_doc/auditar` -> Aprobación/Rechazo con observación por el Analista de Gestión.
- `GET /api/acreditaciones/:id_acreditacion/dossier` -> Generación y descarga del Dossier PDF/ZIP unificado.
