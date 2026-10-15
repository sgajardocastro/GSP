# 📋 Caso de Soporte: CASO-20261014-01
## Bloqueo en Cierre de Report Día 2, Desincronización de Equipo Asignado y Rigidez en Hora de Entrada (Robert Rodríguez / OT 16)

---

### 1. Ficha del Incidente
* **ID Caso:** `CASO-20261014-01`
* **Fecha / Hora de Registro:** 2026-10-14 21:12:52 (-03:00)
* **Operador / Usuario Afectado:** Robert Rodríguez (`id_user: 49`, RUT: `15654251-2`, Email: `triarrodriguez2@gmail.com`)
* **Negocio / OT:** `GSP-2610-233-016` (ID Proyecto BD: `16`)
* **Cliente / Faena:** Sociedad de Constructores Tensacon S.A. / Planta Ferrero (Fundo Caracas s/n)
* **Equipo Operativo en Faena:** Grúa Móvil Telescópica Liebherr LTM-1040 (`id_equipo: 33`, Patente: `DZXL.21-0`)
* **Ambiente:** Producción (`PROD` - Esquema PostgreSQL `sch_leangsp_prod`, Backend PM2 ID `13`, Puerto `3016`)
* **Severidad:** **ALTA (Bloqueo Operativo en Terreno para Firma FES con Mandante)**
* **Estado:** **RESUELTO Y REGULARIZADO (PWA v1.0.43 / REQ-1044)**

---

### 2. Evidencia Recibida desde Terreno
1. **Audio de WhatsApp (`WhatsApp Audio 2026-10-14 at 21.12.52.ogg`):**
   - El operador Robert Rodríguez explica que registró el inicio de jornada a las 12:31 hrs. Al finalizar la tarde (18:00 hrs) para hacer firmar al supervisor mandante Antonio Cartes, la aplicación le volvió a abrir en blanco pidiendo "Inicio de Faena", sin permitirle pasar al Momento 2 ni rectificar la hora de llegada que la app le mostraba como 08:30 hrs por defecto.
2. **Captura de Pantalla Móvil (`media_1792024543842_4e306f8f.jpg`):**
   - Muestra la PWA en Momento 2.
   - Hora Entrada fija en `08:30 hrs`.
   - Tripulación mostrando genéricamente *"Op: Operador Asignado"* sin individualizar a Robert Rodríguez.
   - Firma del cliente Antonio Cartes realizada bajo protesta por no poder ajustar la hora de entrada a la hora real de llegada convenida.

---

### 3. Diagnóstico Técnico & Evidencia Empírica en Base de Datos

#### 3.1. Estado de Reportes en `tedp_reporte_avance` (`sch_leangsp_prod`):
```sql
SELECT id_reporte_avance, id_proyecto, id_equipo, id_user_operador, dia_correlativo, 
       fecha_reporte, estado_reporte, hora_inicio, hora_termino, horometro_inicio, horometro_termino,
       device_timestamp, firma_mandante_nombre
FROM sch_leangsp_prod.tedp_reporte_avance 
WHERE id_proyecto = 16 
ORDER BY id_reporte_avance;
```
* **Hallazgos:**
  - **ID 16 (Día 1 - 2026-10-13):** `dia_correlativo = 1`, `PENDIENTE_VALIDACION`, horómetro 10362.00, firmado por Antonio Cartes a las 18:35 hrs.
  - **ID 15 (Día 2 - 2026-10-14):** `dia_correlativo = 1`, `JORNADA_EN_CURSO`, horómetro 10362.00, `hora_inicio = 08:00`, `device_timestamp = 12:31:51`. (Registro huérfano generado al inicio).
  - **ID 17 (Día 2 - 2026-10-14):** `dia_correlativo = 1`, `PENDIENTE_VALIDACION`, horómetro 10362.10, `hora_inicio = 08:00`, `hora_termino = 18:00`, firmado por Antonio Cartes a las 18:07:42.

#### 3.2. Causa Raíz (Root Cause):
1. **Desalineación de Equipo en Log de Desplazamiento:**
   - La tabla `tequ_log_desplazamiento` contenía un viaje asociado a la grúa ID `45` (`PJYY.20-1`), pero en terreno Robert Rodríguez operaba la grúa ID `33` (`DZXL.21-0`). Al abrir `Surveys.vue` con la grúa 45 seleccionada, no encontraba jornada activa para ese equipo y abría el Momento 1 en blanco.
2. **Rigidez de Validación en Momento 2 (`ReportDiarioIzaje.vue`):**
   - La función `irAMomento2()` requería obligatoriamente ingresar el horómetro de inicio y tomar foto. Si el operador volvía a abrir la vista sin persistencia local, la app le bloqueaba el paso a Momento 2 con snackbar de advertencia.
3. **Hora de Inicio No Editable en Pantalla:**
   - En Momento 2, la `hora_inicio` se renderizaba como texto estático plano (`<span>{{ form.hora_inicio }} hrs</span>`), impidiendo al operador corregir en terreno su hora real de llegada (08:30 o 12:31 hrs).
4. **Falta de Asignación Formal en OT 16:**
   - Ni el equipo 33 ni Robert Rodríguez estaban registrados en `tpry_rel_equipo` y `tpry_rel_persona` para el proyecto 16, por lo que la UI mostraba "Operador Asignado".

---

### 4. Acciones de Mitigación y Resolución Implementadas

#### 4.1. Regularización Inmediata en Base de Datos Producción (`scripts/regularizar_ot16_prod.cjs`):
* Se eliminó el registro huérfano en curso ID 15.
* Se actualizó el reporte ID 17 a `dia_correlativo = 2` y `id_user_operador = 49`.
* Se formalizó la asignación del equipo 33 (`DZXL.21-0`) en `tpry_rel_equipo` y del operador 49 (`Robert Rodríguez`) en `tpry_rel_persona`.
* La OT 16 quedó en estado coherente con Día 1 y Día 2 concluidos, lista para emitir el Día 3 de faena.

#### 4.2. Mejoras de Software en PWA (`ReportDiarioIzaje.vue` - v1.0.43):
1. **Campo Interactivo de Hora de Llegada/Inicio:**
   - Sustitución del `<span>` estático por un control `<input type="time">` con badge `✏️ Hora Rectificable`. El operador puede modificar la hora de inicio directamente antes de solicitar la firma del mandante.
2. **Navegación Flexible a Momento 2:**
   - En `irAMomento2()`, si el horómetro de inicio no está en memoria pero el equipo tiene `horometro_base`, el sistema lo adopta automáticamente sin bloquear ni abortar la navegación.

---

### 5. Verificación & Cierre
* **Compilación:** PWA compilada limpiamente para DEV (`dist_dev`) y PROD (`dist_prod`) bajo SemVer `v1.0.43`.
* **Despliegue:** Desplegado en `/var/www/html/pwa-gsp-dev/` y `/var/www/html/pwa-gsp-prod/`.
* **Gobernanza:** Registrado en `tcfg_releases` y `tcfg_backlog` (`REQ-1044`), `RELEASE_LOG.md` y `Gestión/tareas.md`.
* **Certificación:** HTTP 200 OK verificado en ambos portales.
