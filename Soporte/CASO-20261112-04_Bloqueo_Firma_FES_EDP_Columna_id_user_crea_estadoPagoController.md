# CASO-20261112-04: Bloqueo Crítico en Firma FES de Estado de Pago (EDP) por Columna Inexistente `id_user_crea` en `estadoPagoController.js`

## 1. Ficha del Incidente
- **ID del Caso:** `CASO-20261112-04`
- **Fecha / Hora:** `2026-11-12 14:09 CLT` (Resuelto y desplegado a las `14:36 CLT`)
- **Operador / Usuario Afectado:** Yiara Mendoza (`id_user = 65`, Control de Gestión) / Maritza Seguel (`id_user = 61`, Contabilidad y Facturación) / Sergio Gajardo (`id_user = 55`, Dirección)
- **Negocio / OT:** Circuito Transversal de Estados de Pago (`ModalCaratulaEDP.vue` — Hito 1 Control de Gestión)
- **Equipo Involucrado:** No Aplica (Módulo Financiero / Emisión de EDP y Habilitación DTE)
- **Ambiente:** Producción (`PROD` — `sch_leangsp_prod`) y Desarrollo (`DEV` — `sch_leangsp`)
- **Severidad:** **Crítica** (bloqueo total de emisión de Estados de Pago y facturación electrónica DTE)

---

## 2. Síntoma Reportado por Terreno / Administración
Al ingresar al modal **`FIRMA ELECTRÓNICA SIMPLE (FES) — Hito 1: Control de Gestión (Yara) — Validar Reports y Emitir EDP`** dentro de `ModalCaratulaEDP.vue`, digitar el PIN FES de 4 dígitos e ingresar la glosa de despacho (*"8 horas mínimas por $85.000. Se valida sin observación."*), al presionar **`CONFIRMAR FIRMA`** la interfaz rechazaba la operación mostrando en rojo:

> `Error al procesar firma: Error al procesar paso de firma del EDP`

Como consecuencia directa, los Estados de Pago no podían firmarse ni transicionar a estado `LIBERADO_FACTURAR`, impidiendo a Contabilidad emitir y asociar las facturas DTE correspondientes.

---

## 3. Diagnóstico Técnico & Evidencia Empírica
1. **Trazabilidad de Red y Controlador:**
   - El componente `ejecucion/frontend/src/components/operaciones/ModalCaratulaEDP.vue` (`L1732-L1753`) calcula el hash SHA-256 del PIN de 4 dígitos e invoca `POST /api/operaciones/edp/firmar-paso` -> `estadoPagoController.firmarPasoEdp` (`ejecucion/backend_remoto/src/controllers/estadoPagoController.js`, `L982-L1316`).
2. **Evidencia Cruda en Logs de Producción (`PM2 ID 13 — lean-services-gsp-prod`):**
   ```text
   [EDP_FIRMAR_PASO] Error: error: no existe la columna p.id_user_crea
       at /home/nodeadmin/proyectos/lean-services-gsp-prod/node_modules/pg-pool/index.js:45:11
       at processTicksAndRejections (node:internal/process/task_queues:96:5)
       at async exports.firmarPasoEdp (/home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/estadoPagoController.js:1035:21) {
     severity: 'ERROR',
     code: '42703',
     position: '643',
     file: 'parse_relation.c',
     line: '3675',
     routine: 'errorMissingColumn'
   }
   ```
3. **Verificación de Esquema Físico PostgreSQL (`sch_leangsp_prod` y `sch_leangsp`):**
   - En `tpry_proyecto` (`ejecucion/bd/prisma/schema.prisma`, `L543-L570`), la columna de auditoría del creador del proyecto se denomina **`id_usuario_creacion`** (jamás existió `id_user_crea`).
   - Barrido estático completo sobre `ejecucion/backend_remoto/src/**/*.js`: se comprobó que `estadoPagoController.js:1044` era la única referencia errónea a `id_user_crea` en todo el backend.

---

## 4. Causa Raíz de Arquitectura (Software / State Machine / Datos)
1. **Defecto SQL Latente en `firmarPasoEdp` (`estadoPagoController.js:1044`):**
   Al construirse originalmente el endpoint `firmarPasoEdp`, se escribió el `LEFT JOIN` hacia `tsec_users` utilizando un nombre de columna inexistente (`ON p.id_user_crea = u_crea.id_user`) en lugar de la columna canónica de `tpry_proyecto` (`ON p.id_usuario_creacion = u_crea.id_user`). El defecto permaneció latente tanto en `DEV` como en `PROD` hasta el primer uso productivo del Hito 1 de firma de Carátula EDP.
2. **Comparación Sensible a Mayúsculas en Hash SHA-256 (`L853` y `L1025`):**
   La validación `pass_fes !== usuario.pass_hash_fes` no normalizaba el case hexadecimal (`toLowerCase()`), exponiendo a potenciales rechazos `HTTP 401` si un hash enrolado estuviera almacenado en mayúsculas.

---

## 5. Plan de Mitigación y Resolución
1. **Corrección Estructural en Backend (`ejecucion/backend_remoto/src/controllers/estadoPagoController.js` — `REQ-1164` / `SPEC-126` / `v1.0.221`):**
   - **Línea `1044`:** Sustitución de `LEFT JOIN tsec_users u_crea ON p.id_user_crea = u_crea.id_user` por `LEFT JOIN tsec_users u_crea ON p.id_usuario_creacion = u_crea.id_user`.
   - **Líneas `853` y `1025`:** Normalización `String(pass_fes).trim().toLowerCase() !== String(usuario.pass_hash_fes).trim().toLowerCase()`.
2. **Despliegue Quirúrgico Aislado en `PROD` y Sincronización en `DEV`:**
   - Verificación previa línea por línea contra la copia activa en `PROD` (confirmando exactamente 3 líneas de diferencia y cero arrastre de cambios en evaluación de `DEV`), generación de respaldo en `/var/www/html/backups/`, validación `node --check` (`exit 0`) y reinicio limpio de `PM2 ID 13` (`lean-services-gsp-prod`).
   - Despliegue homologado y compilación `v1.0.221` en `DEV` (`PM2 ID 10` — `lean-services-gsp` y `/var/www/html/lg-gsp-dev`).
   - Certificación empírica en `PROD` (ausencia total de error `42703` en ejecución SQL real y HTTP probe) y prueba E2E completa `HTTP 200 OK` en `DEV`.

---

## 6. Protocolo de Respuesta y Guía al Usuario / Operador
> *"Yiara / Equipo de Contabilidad: Ya quedó resuelto y desplegado en Producción el incidente que impedía confirmar la firma FES del Estado de Pago. Pueden ingresar normalmente a la Carátula del EDP, digitar su PIN de 4 dígitos y presionar **Confirmar Firma** (no requiere borrar caché ni cerrar sesión). Al firmar, el EDP quedará inmediatamente liberado para facturación."*

---

## 7. Lecciones Aprendidas y Acciones Preventivas
1. **Verificación Contra Esquema Real (`schema.prisma` / `information_schema.columns`):** Ninguna consulta SQL sobre `tpry_proyecto` puede escribirse asumiendo alias de otras tablas (`tsrv_survey.id_user_creacion` o `tmnt_ot.id_user_creador`); en `tpry_proyecto` el identificador canónico es `id_usuario_creacion`.
2. **Pruebas E2E de Ciclo Completo hasta Firma de EDP y DTE (`leanglobal_qa_e2e_business_certification`):** Todo flujo financiero debe incluir prueba real `HTTP 200 OK` sobre `POST /api/operaciones/edp/firmar-paso` en `DEV` antes de promoverse a `PROD`.
