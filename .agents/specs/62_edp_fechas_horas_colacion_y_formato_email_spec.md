# Especificación Técnica REQ-040: Corrección Integral Dossier EDP (Horarios de Faena, Rango de Colación y Contraste de Email RFC)

## 1. Contexto y Objetivos del Requerimiento
A raíz de la revisión operacional de la reunión de marcha blanca, se identificaron 3 inconsistencias que impactaban la validez probatoria de los Estados de Pago (EDP) y la experiencia de usuario:
1. **Fechas y Horarios en Blanco en Dossier EDP (Anexo 1):**
   - En la columna "Horario" de las jornadas operadas se desplegaba `-- : -- - -- : --` con salto de línea indeseado debido a la ausencia de columnas horarias nativas en la tabla `tedp_reporte_avance` y falta de reglas `whitespace-nowrap`.
   - Adicionalmente, el rango de fechas del período de corte en la Carátula aparecía vacío si el EDP no tenía fechas explícitas de corte.
2. **Horario de Colación Vacío en el Anexo 2 del EDP:**
   - En el Anexo 2 de detalle de jornadas solo se indicaba la duración (`1m colación` o `1 hr`), sin registrar la franja horaria real en que se efectuó la pausa de colación.
   - El operador en terreno carecía de inputs para especificar las horas de inicio y término de la colación, y el visor de analista en la Torre PMO no permitía auditar dicho intervalo.
3. **Contraste Ilegible en Correo de Solicitud de Modificación de EDP (RFC):**
   - El correo HTML transaccional enviado a Tesorería y Administración (`sgajardoc@gmail.com`, `mseguel@arriendosanpablo.cl`) presentaba texto oscuro sobre fondo oscuro en clientes webmail como Gmail y Outlook, impidiendo su lectura en dispositivos móviles y de escritorio.

---

## 2. Arquitectura de Datos y Solución Técnica

### 2.1. Modelo de Datos PostgreSQL (`sch_leangsp.tedp_reporte_avance`)
Se ejecutó la migración DDL `20261003_alter_tedp_reporte_avance_colacion_horarios.sql` incorporando 4 nuevas columnas:
- `hora_inicio VARCHAR(10)`: Hora de inicio de la jornada en faena (ej. `'08:00'`).
- `hora_termino VARCHAR(10)`: Hora de término de la jornada en faena (ej. `'18:00'`).
- `hora_inicio_colacion VARCHAR(10) DEFAULT '13:00'`: Hora de inicio de la colación.
- `hora_termino_colacion VARCHAR(10) DEFAULT '14:00'`: Hora de término de la colación.
Se realizó backfill sobre las filas históricas existentes (proyecto 103 / OT GSP-2609-1933-014) para asegurar que los reportes ya aprobados cuenten con valores válidos (`08:00`, `18:00`, `13:00`, `14:00`).

### 2.2. Capa Backend y Generación de Dossier PDF
- **`src/services/edpPdfService.js`:**
  - `formatDateCL()`: Robustece el análisis de cadenas `YYYY-MM-DD` evitando el desfase de 1 día provocado por conversión UTC.
  - `formatTimeCL()`: Helper especializado con fallback y zona horaria `America/Santiago`.
  - Derivación automática de período en Carátula: si `edp.fecha_corte_inicio` o `fin` son nulos, se extrae la primera y última fecha de los reportes adjuntos.
  - Anexo 1: celda de horario con clase `whitespace-nowrap font-mono text-xs` mostrando `${horaIni} - ${horaFin}`.
  - Anexo 2: bloque `Horario Faena & Colación` formateado como `Faena: HH:MM a HH:MM | Colación: HH:MM a HH:MM (X.X hrs)` o `Sin colación (0 hrs)`.
- **`src/services/reportDiarioPdfService.js`:**
  - Inclusión del intervalo de colación en la tabla de liquidación y en el resumen de métricas del report diario.
- **`src/controllers/estadoPagoController.js`:**
  - Selección de `hora_inicio`, `hora_termino`, `hora_inicio_colacion`, `hora_termino_colacion` con fallback determinista `to_char(fecha AT TIME ZONE 'America/Santiago', 'HH24:MI')` en `getEstadosPagoPorProyecto` y `getEdpPdf`.
- **`src/controllers/reportDiarioController.js`:**
  - Persistencia de las 4 columnas horarias en `guardarReportDiario`.
  - Soporte de auditoría y comparación de ajustes en `actualizarAjustesAnalista` (`valores_originales` vs `valores_ajustados`).

### 2.3. Capa Frontend y App Móvil
- **`ViajeConductor.vue`:**
  - Inputs reactivos tipo `time` para `hora_inicio_colacion` y `hora_termino_colacion` cuando `colacion_minutos > 0`.
  - Recálculo bidireccional automático entre los botones rápidos de duración (30, 45, 60 min) y los campos horarios.
  - Transmisión en payload de sellado y firma FES hacia `/api/operaciones/report-diario`.
- **`ModalVisorReport.vue`:**
  - Inclusión de `hora_inicio_colacion` y `hora_termino_colacion` en el formulario reactivo `formAjustes`.
  - Detección de modificaciones de colación (`esColacionModificada`) que compara duración e intervalo de horas.
  - Transmisión de ajustes al backend en `/api/operaciones/report-diario/ajustes-analista`.

### 2.4. Garantía de Contraste en Correos Transaccionales (RFC EDP)
- **`src/models/messageModel.js`:**
  - Modificación del contenedor `.content-box` y `.wrapper` con estilos inline prioritarios (`!important`): fondo `#14171f !important`, texto `#f8fafc !important`, bordes `rgba(255, 255, 255, 0.12) !important`.
- **`src/controllers/estadoPagoController.js` (`solicitarModificacionEdp`):**
  - Aplicación de estilos inline explícitos a cada nodo del cuerpo HTML: etiquetas en cian brillante (`#38bdf8`), valores de texto en blanco puro (`#ffffff`), valores monetarios en verde esmeralda (`#34d399`), tipo de cambio en ámbar (`#fbbf24`), logrando legibilidad perfecta en cualquier cliente de correo.

---

## 3. Matriz de Componentes Modificados

| Componente / Archivo | Capa | Cambio Realizado |
| :--- | :--- | :--- |
| `20261003_alter_tedp_reporte_avance_colacion_horarios.sql` | Base de Datos | Columnas `hora_inicio`, `hora_termino`, `hora_inicio_colacion`, `hora_termino_colacion`. |
| `edpPdfService.js` | Backend Service | Formato `whitespace-nowrap`, fallback `America/Santiago`, rango de colación en Anexo 2. |
| `reportDiarioPdfService.js` | Backend Service | Despliegue de franja de colación en liquidación y métricas. |
| `estadoPagoController.js` | Backend Controller | Inclusión de columnas horarias en queries EDP y reescritura de correo RFC con alto contraste inline. |
| `reportDiarioController.js` | Backend Controller | Persistencia y ajuste de analista para horarios de jornada y colación. |
| `messageModel.js` | Backend Model | Reglas CSS inline reforzadas con `!important` para `.content-box`. |
| `ViajeConductor.vue` | Frontend / Terreno | Inputs de horario de colación condicionados a duración, sincronización bidireccional y payload FES. |
| `ModalVisorReport.vue` | Frontend / PMO | Edición y visualización de horario de colación en ajustes de analista. |
| `package.json` | Frontend / Config | Incremento de versión a `1.0.76`. |
| `RELEASE_LOG.md` | Documentación | Entrada de versión `1.0.76` asociada a `REQ-040`. |
| `Gestión/tareas.md` | Gobernanza | Requerimiento `REQ-040` registrado y marcado como `[x]`. |
