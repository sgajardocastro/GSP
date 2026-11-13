# SPEC-126: Hotfix Crítico de Columna `id_usuario_creacion` y Normalización SHA-256 en Firma FES de Estado de Pago (`REQ-1164`)

## 1. Contexto e Incidente de Producción
Durante la operación real en Producción (`PROD` — `sch_leangsp_prod`), al ejecutar el **Hito 1: Control de Gestión (Yara) — Validar Reports y Emitir EDP** desde `ModalCaratulaEDP.vue` (`POST /api/operaciones/edp/firmar-paso`), el servidor respondió `HTTP 500 Internal Server Error` con el mensaje:
> `Error al procesar firma: Error al procesar paso de firma del EDP`

Este bloqueo impedía emitir el Estado de Pago (EDP) y habilitar la facturación DTE en Contabilidad.

## 2. Causa Raíz Determinista
En `ejecucion/backend_remoto/src/controllers/estadoPagoController.js` (`exports.firmarPasoEdp`, línea `1044`), la consulta SQL de obtención de la Orden de Trabajo (`tpry_proyecto`) ejecutaba:
```sql
LEFT JOIN tsec_users u_crea ON p.id_user_crea = u_crea.id_user
```
En el modelo físico de PostgreSQL (`sch_leangsp_prod.tpry_proyecto` y `sch_leangsp.tpry_proyecto`), la columna `id_user_crea` **no existe** (error SQLSTATE `42703: column p.id_user_crea does not exist`). La columna canónica real de la tabla `tpry_proyecto` es **`id_usuario_creacion`**.

Un barrido exhaustivo sobre el 100% de `ejecucion/backend_remoto/src/**/*.js` confirmó que `estadoPagoController.js:1044` era la única ocurrencia de `id_user_crea` en todo el backend.

Adicionalmente, en `firmarComercialEdp` (`L853`) y `firmarPasoEdp` (`L1025`), la comparación del hash hexadecimal SHA-256 del PIN FES (`pass_fes !== usuario.pass_hash_fes`) era sensible a mayúsculas/minúsculas.

## 3. Especificación de la Solución ("Cero Parches")
1. **Corrección Relacional en `estadoPagoController.js` (`L1044`):**
   - Sustituir `LEFT JOIN tsec_users u_crea ON p.id_user_crea = u_crea.id_user` por `LEFT JOIN tsec_users u_crea ON p.id_usuario_creacion = u_crea.id_user`.
2. **Normalización Criptográfica Hexadecimal en `estadoPagoController.js` (`L853` y `L1025`):**
   - Normalizar ambos operandos con `String(...).trim().toLowerCase()` al validar el hash SHA-256 del PIN FES.
3. **Aislamiento de Despliegue (`PROD` -> `DEV`):**
   - Desplegar quirúrgicamente `estadoPagoController.js` en `PROD` (`/home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/estadoPagoController.js`, PM2 ID `13`) sin arrastrar cambios en evaluación de `DEV`, y a continuación sincronizar en `DEV` (`/home/nodeadmin/proyectos/lean-services-gsp/src/controllers/estadoPagoController.js`, PM2 ID `10`).

## 4. Criterios de Certificación Empírica
- `node --check` sin errores de sintaxis (`exit code 0`).
- Verificación SQL y HTTP contra `POST /api/operaciones/edp/firmar-paso` en `PROD` y `DEV` comprobando ausencia total de error `42703` y respuesta `HTTP 200 OK` al firmar en `DEV`.
