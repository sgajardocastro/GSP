# Especificación Técnica REQ-041: Corrección Integral Dossier EDP (Horarios de Faena, Duración de Colación dentro de Alcance y Contraste de Email RFC)

## 1. Contexto y Objetivos del Requerimiento
A raíz de la revisión operacional de la reunión de marcha blanca, se establecieron las siguientes directrices y correcciones:
1. **Fechas y Horarios de Faena en Dossier EDP (Anexo 1):**
   - En la columna "Horario" de las jornadas operadas se desplegaba `-- : -- - -- : --` con salto de línea indeseado.
   - Solución: Extraer las horas de inicio y fin de faena directamente de los campos timestamp existentes en la base de datos (`fecha_inicio_servicio` y `fecha_termino_servicio`) formateados en hora chilena continental (`America/Santiago`, UTC-3) con estilo `whitespace-nowrap font-mono` (`08:00 - 18:00`), garantizando que no se quiebre ni aparezcan valores en blanco.
   - Adicionalmente, el rango de fechas del período de corte en la Carátula toma fallback automático de la fecha inicial y final de los reportes adjuntos.
2. **Duración de Colación en Anexo 2 del EDP y Respeto al Alcance Contractual:**
   - La plataforma registra exclusivamente la duración de la colación (tiempo en minutos u horas: 0, 30, 45, 60 min) como parte del alcance pactado con el cliente.
   - No se registra ni se registrará a qué hora exacta ocurrió la colación (fuera de scope).
   - En el Anexo 2 del EDP y en el PDF del Report Diario se despliega formalmente solo la duración registrada: `Colación: 1.0 hr` (o `Sin colación (0 hrs)` si es 0), suprimiendo cualquier intento de mostrar un rango horario inexistente o campos vacíos.
   - La base de datos PostgreSQL (`sch_leangsp.tedp_reporte_avance`) mantiene su esquema original sin columnas inventadas.
3. **Contraste Ilegible en Correo de Solicitud de Modificación de EDP (RFC):**
   - El correo HTML transaccional enviado a Tesorería y Administración (`sgajardoc@gmail.com`, `mseguel@arriendosanpablo.cl`) presentaba texto oscuro sobre fondo oscuro en clientes webmail como Gmail y Outlook.
   - Se aplicaron estilos inline obligatorios con `!important` garantizando etiquetas en cian brillante (`#38bdf8`), texto en blanco puro (`#ffffff`), valores destacados en verde esmeralda (`#34d399`) y justificación en bloque contrastado (`#14171f`).

---

## 2. Matriz de Componentes Modificados

| Componente / Archivo | Capa | Cambio Realizado |
| :--- | :--- | :--- |
| `sch_leangsp.tedp_reporte_avance` | Base de Datos | Reversión y eliminación (`DROP COLUMN`) de columnas fuera de scope. |
| `ViajeConductor.vue` | Frontend / Terreno | Eliminación de inputs de hora de colación. Se conserva únicamente el selector de duración de colación (0, 30, 45, 60 min). |
| `ModalVisorReport.vue` | Frontend / PMO | Eliminación de campos de hora de colación. Se conserva únicamente el ajuste de duración (`horas_colacion`). |
| `edpPdfService.js` | Backend Service | Anexo 1: Horarios de faena con `whitespace-nowrap` extraídos de `fecha_inicio_servicio` y `fecha_termino_servicio`. Anexo 2: Despliegue de duración de colación (`Colación: 1.0 hr`). |
| `reportDiarioPdfService.js` | Backend Service | Despliegue de duración de colación (`1.0 hrs` o `0 hrs`). |
| `estadoPagoController.js` | Backend Controller | Consultas SQL limpias sin columnas inexistentes; correo RFC con alto contraste inline. |
| `reportDiarioController.js` | Backend Controller | Operaciones de guardado y ajuste analista sobre campos originales de la tabla. |
| `messageModel.js` | Backend Model | Reglas CSS inline reforzadas con `!important` para `.content-box`. |
| `package.json` | Frontend / Config | Versión `1.0.77`. |
| `RELEASE_LOG.md` | Documentación | Registro de versión `1.0.77` asociada a `REQ-041`. |
| `Gestión/tareas.md` | Gobernanza | Requerimiento `REQ-041` registrado y marcado como `[x]`. |
