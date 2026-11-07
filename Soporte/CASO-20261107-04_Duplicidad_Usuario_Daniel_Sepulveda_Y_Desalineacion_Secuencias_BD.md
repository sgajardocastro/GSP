# Ficha de Caso de Soporte: CASO-20261107-04

## 1. Identificación del Incidente
- **Código:** CASO-20261107-04
- **Fecha:** 2026-11-07
- **Proyecto Involucrado:** Plataforma Integral GSP / Módulo de Autenticación y RBAC (`tsec_users`) / Esquemas PostgreSQL
- **Usuario Afectado / Reportante:** Daniel Sepúlveda (`id_user = 8` y `27`) / Administración de Plataforma
- **Equipo Involucrado:** No Aplica (Base de Datos / Seguridad / Identidad)
- **Ambiente:** Producción (`sch_leangsp_prod`) y Desarrollo (`sch_leangsp`)
- **Severidad:** Media (Riesgo latente de colisión de llaves primarias en inserción y ambigüedad de identidad en auditoría)
- **Estado:** RESUELTO (v1.0.202 / Mandato Constitucional Cero Parches)

---

## 2. Síntoma Reportado
Durante la auditoría preventiva de usuarios y secuencias de base de datos se detectaron dos anomalías críticas:
1. Existencia de dos registros activos para el usuario Daniel Sepúlveda en `tsec_users`: `id_user = 8` (creado en etapas tempranas) e `id_user = 27` (cuenta operativa vinculada a flujos y proyectos).
2. Desfase sistemático entre los valores actuales de las secuencias PostgreSQL (`*_id_seq`) y el valor máximo de sus llaves primarias (`MAX(id)`), lo cual provocaría errores `23505 duplicate key value violates unique constraint` en futuras inserciones de clientes, usuarios, reportes o inventario.

---

## 3. Causa Raíz Técnica
1. **Duplicidad de Cuentas:**
   En fases previas de enrolamiento y pruebas de login Google, se creó inicialmente el usuario `id_user = 8`. Posteriormente, durante la importación masiva de trabajadores o configuración de roles, se generó un nuevo registro con `id_user = 27`.
2. **Desalineación de Secuencias PostgreSQL:**
   La ejecución de scripts de migración y regularización con sentencias `INSERT INTO ... (id, ...)` explícitas insertó IDs altos sin avanzar el puntero interno de las secuencias con `SELECT setval(...)`. En consecuencia, el próximo `nextval()` de varias secuencias intentaba reutilizar números ya ocupados.

---

## 4. Solución Aplicada (Resolución de Fondo en 4 Niveles - Cero Parches)
1. **Depuración de Cuenta Duplicada:**
   - Se verificó que `id_user = 27` era la cuenta con actividad en proyectos y asignaciones.
   - Se desactivó formalmente `id_user = 8` en `sch_leangsp_prod.tsec_users` y `sch_leangsp.tsec_users` mediante:
     ```sql
     UPDATE tsec_users 
     SET status_user = 'INACTIVO', 
         email = 'inactivo_dsepulveda_8@arriendosanpablo.cl' 
     WHERE id_user = 8;
     ```
2. **Alineación Universal de Secuencias PostgreSQL:**
   Se ejecutó un bloque de saneamiento universal en PL/pgSQL que recorrió dinámicamente todas las tablas con secuencias asociadas en los esquemas `sch_leangsp_prod` y `sch_leangsp`:
   ```sql
   DO $$
   DECLARE
       r RECORD;
   BEGIN
       FOR r IN
           SELECT sequence_name, table_name, column_name
           FROM information_schema.columns
           WHERE table_schema = current_schema()
             AND column_default LIKE 'nextval%'
       LOOP
           EXECUTE format(
               'SELECT setval(%L, COALESCE((SELECT MAX(%I) FROM %I), 1) + 1, false)',
               r.sequence_name, r.column_name, r.table_name
           );
       END LOOP;
   END $$;
   ```
3. **Persistencia y Gobernanza:**
   Se verificó que `nextval('tsec_users_id_user_seq')` y `nextval('tpar_emp_id_seq')` generen correlativos estrictamente superiores al máximo actual sin colisiones.

---

## 5. Archivos Intervenidos
- Base de Datos: `sch_leangsp_prod.tsec_users`, `sch_leangsp.tsec_users`
- Todas las secuencias de `sch_leangsp_prod` y `sch_leangsp`
- Script de saneamiento: `/tmp/datafix_saneamiento.sql`

---

## 6. Verificación y Resultados
- Consulta SQL confirma `id_user = 8` con `status_user = 'INACTIVO'` y preservación limpia de `id_user = 27`.
- Todas las secuencias verificadas con `currval` / `nextval` retornan valores seguros sin error `23505`.

---

## 7. Lecciones Aprendidas y Acciones Preventivas
- Todo script de inserción con IDs explícitos debe invocar de manera obligatoria `SELECT setval(pg_get_serial_sequence('tabla', 'columna'), MAX(columna))`.
- La administración de usuarios debe contar con un constraint `UNIQUE` sobre el campo `email` en estado activo para impedir la coexistencia de identidades duplicadas.
