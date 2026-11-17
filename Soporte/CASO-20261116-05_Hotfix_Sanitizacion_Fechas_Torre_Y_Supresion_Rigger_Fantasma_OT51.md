# 🛠️ CASO-20261116-05: Hotfix Quirúrgico en Producción: Sanitización Determinista de Fechas en Torre/CRM y Supresión de Rigger Fantasma en OT 51

---

## 1. Ficha del Incidente

- **ID del Caso:** `CASO-20261116-05`
- **Requerimiento Backlog:** `REQ-1182`
- **Especificación Asociada:** `SPEC-135`
- **Fecha / Hora:** 2026-11-16 17:50:00 (-03:00)
- **Usuario Afectado / Reportante:** Jorge Ponce (Jefatura de Operaciones) / Alfonso Porperello (Dirección) / Wilson Navarrete (Comercial)
- **Negocio / OT:** `GSP-2611-00051` (Finning Chile S.A. - Oficina Central, `id_proyecto = 101`)
- **Equipo Involucrado:** Grúa Telescópica Liebherr LTM-1055 (`CCCB.38-1`, ID 36)
- **Personal Afectado:** Operador Nicolás Ceballos (`id_user = 45`), Rigger Omar Soffia (`id_user = 64`)
- **Ambiente:** `PROD` (`https://servidor.leanglobal.cl/lg-gsp-prod/`) y `DEV`
- **Severidad:** Crítica (Inconsistencia legal en documento de trabajo PDF, distorsión visual en Torre de Control y bloqueo en sincronización con RRHH)
- **Versión de Liberación:** Web/Backend `v1.0.224` en `main`

---

## 2. Síntoma Reportado por Terreno y Operaciones

1. **Mensaje de Jorge Ponce:**
   > *"estimados, tenemos problemas con las fechas y se asigno un rigger de la nada a la ot. favor revisar urgente eso, esta generando problemas con comercial, operadores y rrhh, favor a nivel de sistema y no correguir de base de datos. ya que volveran a salir casos. ataquemos la causa raiz."*
2. **Evidencias Visuales:**
   - En la tarjeta Kanban de Torre de Control para la OT `GSP-2611-00051`:
     `📅 Ejec: /11/202616 ➔ 16/11/2026`
     `🏷️ Venta: 16/11/2026`
     `🦺 RIGGER: OMAR SOFFIA`
   - En el formulario web de asignación (`GestorOportunidades.vue`), solo figuraba el operador `Nicolás Antonio Ceballos` y ningún rigger. Sin embargo, al emitir la OT PDF oficial (`https://servidor.leanglobal.cl/lg-gsp-prod/api/archivo/ver/2015`), el PDF listaba a `OMAR SOFFIA` como Rigger / Señalero Certificado.

---

## 3. Diagnóstico Técnico & Evidencia Empírica

1. **Inspección del Input en Formulario:**
   - En la interfaz web, el campo **Salida Base** mostraba `11/16/202616`. El navegador web aceptó un año de 6 dígitos (`2026` + `16`).
2. **Deformación en `Torre.vue`:**
   - La función `formatIsoToDdMmYyyy` ejecutaba `String(fStr).slice(0, 10).split('-')`.
   - Con `"202616-11-16"`, `.slice(0, 10)` cortó la cadena en `"202616-11-"`.
   - Al hacer split por `-`, `partes[2]` quedó vacía (`""`), `partes[1]` fue `"11"` y `partes[0]` fue `"202616"`.
   - El resultado generado fue `"" + "/" + "11" + "/" + "202616"` = **`"/11/202616"`**.
3. **Colapso Silencioso en `guardarCambiosAsignacion`:**
   - Al intentar serializar la fecha para sincronizar con PostgreSQL, `new Date("202616-11-16T05:15").toISOString()` arrojó `RangeError: Invalid time value`.
   - El error fue capturado por un bloque defensivo `try/catch` que emitió `console.warn`, interrumpiendo la petición `POST /proyectos/:id/asignaciones/sincronizar`.
   - Por lo tanto, la tabla relacional `tpry_rel_persona` **nunca se actualizó** para remover el rigger residual Omar Soffia.
4. **Reinyección Automática en Backend (`proyectoModel.js`):**
   - En `updateProyecto`, la lógica heredada evaluaba:
     ```javascript
     if ((!inEjec.rigger_id || inEjec.rigger_id === 'RIG-201') && prevEjec.rigger_id && prevEjec.rigger_id !== 'RIG-201') {
       mergedEjec.rigger_id = prevEjec.rigger_id;
     }
     ```
   - Si una cotización se clonó o arrastraba a Omar Soffia de un borrador inicial, el backend **reinyectaba forzosamente** a Omar Soffia aunque el comercial no lo hubiera solicitado.
   - En `generarOTVersion`, el generador de PDF imprimía `ejec.rigger_id` sin validar si la cotización tenía `requiere_rigger === false`.

---

## 4. Causa Raíz de Arquitectura (Nivel Sistema — Cero Parches de BD)

1. **Carencia de Límites en Inputs HTML:** Los elementos `<input type="date">` no tenían `min` ni `max`, permitiendo la digitación accidental de años fuera de rango como `202616`.
2. **Falta de Sanitización Determinista de Fechas en Frontend:** No existía una capa que normalizara cadenas de año de longitud anómala antes de pasarlas al motor de fechas de JavaScript.
3. **Mutilación por `slice(0, 10)` en Formateador Visual:** El formateador de Torre asumía ciegamente que toda fecha comenzaba con un año de 4 dígitos.
4. **Persistencia Forzosa de Riggers en Backend:** El merge profundo de `ejecucion_v1` impedía vaciar un rigger asignado si no venía explícitamente en el payload, reviviendo asignaciones fantasma.

---

## 5. Plan de Mitigación y Resolución Aplicada

El hotfix se estructuró a través de un **Git Worktree aislado desde `main` (`../gsp-hotfix-prod`)**, garantizando no contaminar la rama activa de desarrollo `feature/spec130-remediacion-estructural`:

1. **Frontend (`GestorOportunidades.vue`):**
   - Incorporados atributos `min="2024-01-01"` y `max="2035-12-31"` en inputs de fecha.
   - Implementada función `sanitizarFechaLocal` con regex que extrae los primeros 4 dígitos de año, evitando excepciones `RangeError` al invocar `toISOString()`.
2. **Frontend (`Torre.vue`):**
   - Blindado `formatIsoToDdMmYyyy` con regex `^(\d{4,6})-(\d{2})-(\d{2})` para extraer limpiamente año, mes y día, garantizando el renderizado `DD/MM/YYYY` sin importar deformaciones en el año.
3. **Backend (`proyectoModel.js`):**
   - Modificado el merge de `rigger_id` para que solo restaure riggers previos si la preventa comercial lo exige explícitamente (`requiere_rigger === true`). En caso contrario, se asigna `null`.
   - En `generarOTVersion`, condicionada la inclusión del rigger en la tabla de tripulación del PDF a que `crm.requiere_rigger !== false`.
4. **Compilación y Despliegue:**
   - Elevada versión a `v1.0.224`.
   - Compilación limpia de producción (`vite build` exit code `0`).
   - Transferencia a `/var/www/html/lg-gsp-prod/` y `/home/nodeadmin/proyectos/lean-services-gsp-prod/src/models/proyectoModel.js`.
   - Reinicio de PM2 ID 13 (`lean-services-gsp-prod`) verificado online.
   - Registro en `sch_leangsp_prod.tcfg_releases` (ID 2001).

---

## 6. Protocolo de Respuesta al Usuario y Jefatura de Operaciones

1. **Para Operaciones y Jorge Ponce:**
   - La causa raíz fue erradicada a nivel de código en el sistema: ya no es posible ingresar años inválidos como `202616`, Torre de Control nunca más deformará la visualización de fechas, y el sistema ya no reinyectará riggers no solicitados a nivel de backend ni en los PDFs.
2. **Para la OT 51 (Finning Chile):**
   - Al ingresar a la OT en la web (con la versión `1.0.224`), la fecha se corrige en el selector, se presiona **Guardar Modificaciones** y luego **Generar PDF OT**. La nueva versión de la OT PDF saldrá limpia con únicamente el operador Nicolás Ceballos y cero riggers.

---

## 7. Trazabilidad de Commits y Entregables

- **Commit Canónico en `main`:** `8da56df`
- **Release:** `v1.0.224`
- **Especificación:** [SPEC-135](file:///d:/SGajardo/Google%20Drive/Antigravity/Grúas%20San%20Pablo/Propuesta%20Gestión%20Operación%20Grúas/.agents/specs/135_estrategia_y_gobernanza_git_remediacion_ots_y_convergencia_prod_spec.md)
