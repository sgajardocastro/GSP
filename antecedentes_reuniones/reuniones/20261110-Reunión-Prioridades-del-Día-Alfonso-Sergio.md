# 📝 Minuta de Reunión: Prioridades del Día, Deshabilitación Temporal de Odómetro Incremental, Caso Operador Reasignado GSP 261007, Cierre sin Firma y Filtro de Documentos PDF

- **Fecha y Hora:** Martes 10 de noviembre de 2026 (`CLT / GMT-03:00`).
- **Proyecto:** Plataforma de Gestión Operativa y Liquidación de Servicios — **Grúas San Pablo (GSP)**.
- **Participantes Asistentes:**
  - **Alfonso Porperrello** — Product Manager / Coordinación Operativa GSP (`alfonsoporperello@gmail.com`).
  - **Sergio Gajardo** — Director de Proyecto y Arquitecto Principal, LeanGlobal (`sgajardoc@gmail.com` / `sgajardo@leanglobal.cl`).
  - **Jorge Ponce** — Jefe de Operaciones, Grúas San Pablo (`jponce@arriendosanpablo.cl`).
- **Stakeholders / Personal Clave Mencionados:**
  - **Yiara Mendoza** — Control de Gestión y Facturación GSP.
  - **José Soto** — Operador de Grúa GSP.
  - **Nicolás Ceballos** — Operador de Grúa GSP.
  - **Contabilidad, Recursos Humanos y Facturación GSP**.
- **Enlaces y Registros Oficiales:**
  - **Evento de Calendario:** [Prioridades del día](https://calendar.google.com/calendar/event?eid=MWpiZTczMGswZGZmcXRiam5vcGhsbmlnMzEgc2dhamFyZG9jQG0)
  - **Transcripción Oficial Google Docs:** [Transcripción Oficial Sesión 10-Nov-2026](https://docs.google.com/document/d/1TD6AcWw5lLm47PX9gDLKkSEsjcxk4h_X_9n11pV3Szc/edit?usp=drive_web&tab=t.qhs3h7auewkg)

---

## 🎯 1. Resumen Ejecutivo y Contexto 360°

Durante la mañana del 10 de noviembre de 2026 se llevó a cabo la sesión de prioridades operativas entre la coordinación de Grúas San Pablo (Alfonso Porperrello, Jorge Ponce) y LeanGlobal (Sergio Gajardo). La reunión tuvo como objetivo destrabar fricciones operativas críticas experimentadas por los operadores en terreno (PWA), revisar órdenes con cambio de tripulación, establecer mecanismos de excepción para cierre de reportes cuando el cliente no se encuentra disponible para firmar y parametrizar la privacidad de los reportes PDF comerciales enviados a clientes.

Los ejes estructurales abordados fueron:
1. **Regla de Odómetro Incremental:** Deshabilitación temporal de la restricción de odómetro estrictamente incremental en la PWA y saneamiento de odómetros inconsistentes en base de datos (`REQ-1143`).
2. **Caso Crítico GSP 261007 (Operador Reasignado):** Diagnóstico y desacople del operador anterior que continuaba vinculado al servicio e impedía la correcta asignación y reporte del nuevo operador (`REQ-1145`).
3. **Cierre de Reportes sin Firma y Doble Configuración de Usuarios (Caso José Soto):** Habilitación de flujo de cierre de reporte diario con justificación/motivo de excepción auditable para evitar bloqueo del día siguiente, más saneamiento de usuarios con doble configuración (`REQ-1146`).
4. **Validación y Cierre de Incidencias Previas:** Ratificación de la resolución de fondo del caso Nicolás Ceballos (`REQ-1139`) y verificación del Reporte 0020 sin horas mínimas en valores fijos (`REQ-1144`).
5. **Control de Privacidad en PDF de Reportes Diarios:** Filtro selectivo para que Control de Gestión (Yara) elija qué fotografías y anexos se incorporan en el PDF enviado al cliente (`REQ-1147`).

---

## 📌 2. Acuerdos, Decisiones de Negocio y Reglas de Arquitectura

### Matriz de Estado de Decisiones

- **✅ Decisiones Acordadas (En Firme):**
  1. **Deshabilitación Temporal del Odómetro Incremental (`REQ-1143`):** Relajar en la PWA la validación estricta que impide guardar kilometrajes menores o iguales al acumulado anterior, permitiendo que la operación fluya mientras se sanean los datos históricos de odómetro en la base de datos.
  2. **Desacople de Operador en OT `GSP-2610-00007` (`REQ-1145`):** Investigar por qué el sistema retuvo al operador anterior tras una reasignación de tripulación y corregir la vinculación tanto en la base de datos como en la lógica de asignaciones de la PWA.
  3. **Cierre de Reporte sin Firma Digital con Cuadro Explicativo (`REQ-1146`):** Cuando no sea posible obtener la firma presencial del cliente, permitir el cierre del reporte registrando obligatoriamente un motivo justificado de excepción para fines de auditoría, evitando que el operador quede bloqueado para iniciar su jornada al día siguiente.
  4. **Cierre Formal de `REQ-1139` y `REQ-1144`:** Alfonso confirmó que el incidente de Nicolás Ceballos quedó resuelto y que el Reporte 0020 ya no aplica horas mínimas ficticias en montos fijos.
  5. **Filtro de Documentos y Fotos para PDF de Cliente (`REQ-1147`):** Proporcionar a Control de Gestión (Yara) una casilla de selección por cada adjunto/foto para determinar si es visible o no en el PDF exportado al cliente.

---

### Detalle Técnico y Trazabilidad a Transcripciones

#### 2.1. Deshabilitación Temporal de la Regla de Kilometrajes Incrementales ([00:02:07](https://docs.google.com/document/d/1TD6AcWw5lLm47PX9gDLKkSEsjcxk4h_X_9n11pV3Szc/edit?tab=t.qhs3h7auewkg#heading=h.8qqkv2hfya6w) - [00:03:55](https://docs.google.com/document/d/1TD6AcWw5lLm47PX9gDLKkSEsjcxk4h_X_9n11pV3Szc/edit?tab=t.qhs3h7auewkg#heading=h.yzigj788kldn))
- **Problema:** Múltiples operadores han experimentado bloqueos al enviar el reporte o viaje debido a inconsistencias en `odometro_acumulado` en la tabla `tequ_equipo`.
- **Decisión:** Deshabilitar temporalmente la regla de kilometraje incremental en la PWA (permitiendo guardar cualquier cifra positiva válida) y sanear los odómetros de la flota en PostgreSQL.

#### 2.2. Caso Crítico GSP 261007 — Cambio de Operador ([00:03:55](https://docs.google.com/document/d/1TD6AcWw5lLm47PX9gDLKkSEsjcxk4h_X_9n11pV3Szc/edit?tab=t.qhs3h7auewkg#heading=h.yzigj788kldn))
- **Problema:** En el servicio `GSP 261007` (`GSP-2610-00007`), se efectuó un cambio de operador en la planificación, pero la PWA continuó mostrando la orden al operador anterior, impidiéndole tomar nuevos servicios y generando desorden de reportes.
- **Decisión:** Analizar el modelo de asignación (`tpry_rel_equipo`, `lineas_servicio`, `ejecucion_v1` y `tedp_reporte_avance`) para desvincular al operador antiguo y asegurar que la reasignación desactive la visibilidad para el personal reemplazado.

#### 2.3. Cierre de Reportes sin Firma y Usuarios con Doble Configuración ([00:04:54](https://docs.google.com/document/d/1TD6AcWw5lLm47PX9gDLKkSEsjcxk4h_X_9n11pV3Szc/edit?tab=t.qhs3h7auewkg#heading=h.thwy422i6yzb) - [00:06:05](https://docs.google.com/document/d/1TD6AcWw5lLm47PX9gDLKkSEsjcxk4h_X_9n11pV3Szc/edit?tab=t.qhs3h7auewkg#heading=h.leztwtf1gppb))
- **Problema:** El operador José Soto no pudo cerrar su reporte del viernes 6 de noviembre por falta de firma del cliente en faena. El lunes, la PWA le bloqueó el inicio de su nueva jornada exigiendo cerrar el día previo.
- **Decisión:** Habilitar la opción de cerrar reporte sin firma digital del cliente exigiendo un cuadro de texto explicativo (motivo de excepción) con registro de auditoría. Además, auditar y resolver la duplicidad técnica en perfiles/configuraciones de ciertos usuarios.

#### 2.4. Ratificación de Cierres de Nicolás Ceballos y Reporte 0020 ([00:06:53](https://docs.google.com/document/d/1TD6AcWw5lLm47PX9gDLKkSEsjcxk4h_X_9n11pV3Szc/edit?tab=t.qhs3h7auewkg#heading=h.ie7q5kpns6n7) - [00:09:02](https://docs.google.com/document/d/1TD6AcWw5lLm47PX9gDLKkSEsjcxk4h_X_9n11pV3Szc/edit?tab=t.qhs3h7auewkg#heading=h.qbyf23j91e41))
- **Verificación:** Alfonso comprobó que el reporte 0020 ya toma correctamente el valor fijo sin piso mínimo de 8 horas (`REQ-1144`), y que el incidente de Nicolás Ceballos (`REQ-1139`) quedó completamente superado con el blindaje de idempotencia desplegado.

#### 2.5. Privacidad y Filtro de Fotos/Documentos en PDF de Reportes ([00:09:56](https://docs.google.com/document/d/1TD6AcWw5lLm47PX9gDLKkSEsjcxk4h_X_9n11pV3Szc/edit?tab=t.qhs3h7auewkg#heading=h.wtb2odl92xtw) - [00:11:03](https://docs.google.com/document/d/1TD6AcWw5lLm47PX9gDLKkSEsjcxk4h_X_9n11pV3Szc/edit?tab=t.qhs3h7auewkg#heading=h.to8bbid9o8s9))
- **Problema:** Actualmente el PDF del report incluye automáticamente todas las fotos (ej. odómetro, tacógrafo) y documentos subidos, exponiendo información interna no pertinente hacia el cliente mandante.
- **Decisión:** Habilitar un selector interactivo para que Yara (Control de Gestión) marque cuáles fotografías/documentos se exportan en el PDF oficial y cuáles se mantienen de consumo exclusivamente interno.

---

## 🤝 3. Compromisos y Próximos Pasos (Plan de Acción / TODOs)

| # | Tarea / Entregable | Responsable | Organización | Hito / Prioridad | Estado |
| :---: | :--- | :---: | :---: | :---: | :---: |
| 1 | **`[REQ-1143]` Deshabilitación temporal regla odómetro incremental:** Relajar validación en PWA y sanear inconsistencias en BD. | Sergio Gajardo | LeanGlobal | Prioridad 1 | Pendiente |
| 2 | **`[REQ-1145]` Análisis y desacople caso GSP 261007:** Desvincular operador anterior y corregir lógica de reasignación. | Sergio Gajardo | LeanGlobal | Prioridad 2 | Pendiente |
| 3 | **`[REQ-1146]` Cierre de reporte sin firma + Doble configuración:** Cuadro explicativo de excepción y revisión de cuentas. | Sergio Gajardo | LeanGlobal | Prioridad 3 | Pendiente |
| 4 | **`[REQ-1147]` Filtro de fotos y documentos en PDF de report:** Selector de privacidad para Yara en consola web. | Sergio Gajardo | LeanGlobal | Prioridad 4 | Pendiente |
| 5 | **Actualización de Backlog:** Mantener sincronizada la base de datos PostgreSQL (`tcfg_backlog`) con el registro diario. | Sergio Gajardo | LeanGlobal | Continuo | En curso |

---

## 📅 4. Siguiente Reunión e Hito de Gobernanza

- **Fecha y Hora Propuesta:** Miércoles 11 de noviembre de 2026 — 11:00 CLT.
- **Participantes Convocados:** Alfonso Porperrello, Sergio Gajardo, Jorge Ponce.
- **Foco Principal de la Sesión:** Validación del desacople de operador en OT 261007, verificación de reportes cerrados sin firma con justificación y revisión del filtro de adjuntos en PDF.
