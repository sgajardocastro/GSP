# CASO-20261115-09: Relevo de Maquinaria en Faena (Sustitución de Grúa Titular por Avería o Logística) en Proyecto 203 (Besalco Bypass Puerto Montt)

## 1. Ficha del Incidente
- **ID del Caso:** `CASO-20261115-09` (Asociado a `REQ-1120` y `REQ-1176`)
- **Fecha / Hora:** `2026-11-15 22:30 CLT` (Certificado el `2026-11-16 00:15 CLT`)
- **Usuario Mandante / Solicitante:** Jorge Ponce (Gerente General) y Alfonso Porperrello (Key User / Operaciones)
- **Negocio / OT:** `GSP-2611-00138` (`id_proyecto = 203`) — Proyecto Faena Bypass Puerto Montt (Cliente: Besalco S.A.)
- **Equipos Involucrados:**
  - Grúa Titular: `STDD.68-4` (Liebherr LTM-1070-4.1 70 Ton, ID `42`)
  - Grúa Relevo: `CCCB.38-1` (Liebherr LTM-1055-3.1 55 Ton, ID `41`)
- **Personal Involucrado:** Claudio Gallardo (`id_user = 62`, Operador Grúa)
- **Ambiente:** DEV (`sch_leangsp` / `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Severidad:** **Crítica** (impedía operar sustituciones de maquinaria en faenas activas sin desvirtuar la cotización comercial o crear líneas paralelas no autorizadas)

---

## 2. Síntoma Reportado por Terreno / Administración
Cuando una grúa en terreno sufría un desperfecto o requería ser sustituida por otra máquina de la flota durante el transcurso del servicio:
1. El sistema no permitía registrar el reemplazo de la máquina dentro de la misma línea de servicio.
2. Si el usuario intentaba editar la asignación en el CRM una vez que el proyecto estaba en estado operacional ($\ge 5$), el componente `AsignadorArbolRecursos.vue` se encontraba completamente bloqueado (`disabled = true`) debido a una condición prematura vinculada a la confirmación de la asignación inicial.
3. Al recargar la página, cualquier intento de persistencia de múltiples turnos de equipo (`turnos_equipos`) se perdía por una colisión entre el identificador temporal de la fila de servicio (`lin_root_...`) y el ID numérico de base de datos (`374`), sobrescribiendo el selector con una sola grúa.
4. En el PWA móvil del operador, no existía indicación visual de relevo de maquinaria, provocando confusión en el llenado de reportes diarios de terreno.

---

## 3. Diagnóstico Técnico y Causa Raíz
Una auditoría integral del flujo reveló 3 fallas estructurales:
1. **Bloqueo Prematuro de Edición en CRM (`GestorOportunidades.vue`):**
   - El prop `:disabled` de `AsignadorArbolRecursos.vue` evaluaba `isAsignacionConfirmada`. Una vez confirmada la primera asignación, el árbol quedaba congelado de forma irreversible, impidiendo relevar recursos durante las etapas 5 (En Ejecución), 6 y 7.
2. **Desajuste de Hidratación en `fetchOpportunity` (`GestorOportunidades.vue`):**
   - La reconstrucción de `srv.turnos_equipos` filtraba `String(r.id_linea_servicio) === String(srvLineId)`. Al guardarse en BD, `id_linea_servicio` pasaba a ser entero (`374`), mientras que el árbol local usaba `lin_root_...`. La discordancia provocaba que la hidratación descartara el segundo turno y devolviera un array unitario.
3. **Carencia de Mecanismo Nativo de Relevo de Equipos (`AsignadorArbolRecursos.vue`):**
   - La columna Equipo estaba diseñada como un `<select>` simple estático sin soporte de turnos (`EQ:`, `R1:`, etc.), a diferencia de la columna Chofer que ya disponía de soporte multi-turno.

---

## 4. Solución Implementada (Cero Parches)
Se aplicó una solución estructural en 4 capas de acuerdo a los estándares canónicos:
1. **Regla de Bloqueo Operacional (`GestorOportunidades.vue`):**
   - Se reemplazó `:disabled="isAsignacionConfirmada"` por `:disabled="isAsignacionBloqueada"`, donde `isAsignacionBloqueada = computed(() => Number(estadoDbActual.value) >= 8)`. Esto garantiza que los recursos sigan siendo editables por Jefatura durante los estados 3 a 7 (incluyendo reasignaciones y relevos de emergencia).
2. **Componente de Relevo Multi-Equipo (`AsignadorArbolRecursos.vue`):**
   - Se integró el botón nativo `+ Relevo` en la celda de Equipo, renderizando cada turno con etiquetas `EQ:` (titular) y `R1:`, `R2:` (relevos), selector de fechas operativas y badge `RELEVO` color ámbar.
3. **Preservación de Hidratación FK-Safe (`GestorOportunidades.vue`):**
   - Se blindó la carga de datos para respetar `srv.turnos_equipos` cuando ya contiene múltiples turnos en `json_field.crm_v1.servicios`, y reconstruir a partir de `tpry_rel_equipo` con fallback inteligente cuando coinciden o cuando hay registros de relevo.
4. **Sincronización PWA y Consolidación Financiera EDP:**
   - La tarjeta de servicios de la PWA detecta la grúa activa vigente e ilustra el badge `RELEVO` con banner informativo del relevo de máquina.
   - El motor relacional de Estado de Pago (`estadoPagoController.js` y `edpPdfService.js`) consolida la línea única de cobro ($3.450.000 + IVA) manteniendo un descuadre matemático de **$0 CLP**.

---

## 5. Verificación y Evidencia Empírica
- **Prueba End-to-End en DEV:**
  - Proyecto Testigo: `ID 203` (`GSP-2611-00138`)
  - Grúa Titular: `STDD.68-4` (Liebherr 70T)
  - Grúa Relevo: `CCCB.38-1` (Liebherr 55T)
  - Operador: Claudio Gallardo
  - Recarga completa de página web y verificación en PostgreSQL: Ambos equipos persisten correctamente asociados a la línea 374.
- **Evidencia Gráfica y Documental:**
  - `QA/REQ-1120_Relevo_Equipos_PWA_DEV/evidencia/03_web_operaciones_relevo_asignado.png`: Visualización de ambas máquinas asignadas en CRM Web.
  - `QA/REQ-1120_Relevo_Equipos_PWA_DEV/evidencia/04_pwa_surveys_tarjeta_con_banner_relevo.png`: Bandeja de encuestas de Claudio Gallardo en PWA con banner de relevo.
  - `QA/REQ-1120_Relevo_Equipos_PWA_DEV/evidencia/08_EDP_Proyecto_203_Besalco_Relevo_Maquinaria.pdf`: Estado de pago oficial generado con HTTP 200 y $0 de descuadre.
  - Publicado en la Web Oficial de Análisis y QA: `https://servidor.leanglobal.cl/pptas/GSP/estructurador/analisis.html` (Caso 9 en Tabla 1).

---

## 6. Reglas de Invarianza y Prevención Futura
1. **Invarianza de Estados Operacionales:** Las asignaciones de recursos solo se bloquean de forma definitiva a partir del estado 8 (Facturado / Cerrado). Durante los estados operacionales (3 a 7), el cambio de maquinaria o conductor debe ser siempre permitido bajo auditoría.
2. **Invarianza de Suma Financiera:** Un relevo de maquinaria en faena jamás duplica el valor neto cotizado al cliente; se prorratea o absorbe según las condiciones contractuales pactadas sin alterar el monto convenido.
3. **Inviolabilidad de Proyectos Históricos:** El Proyecto 47 (`Surlat Pitrufquén`) permaneció 100% inalterado en estado 1 durante toda la certificación.

---

## 7. Estado Final y Trazabilidad
- **Estado:** `RESUELTO, CERTIFICADO Y PUBLICADO EN WEB DE ANÁLISIS Y QA (Cero Parches)`
- **Versión Frontend / Backend:** `v1.0.224`
- **Registro en Matriz:** Caso 9 en `01_Matriz_Maestra_46_Casos` y Tabla 1 de `analisis.html`.
