# Ficha de Caso de Soporte: CASO-20261105-02

## 1. Identificación del Incidente
- **Código:** CASO-20261105-02
- **Fecha:** 2026-11-05
- **Módulo Afectado:** CRM / Comercial (`ModalNuevoCliente.vue`)
- **Usuario Afectado / Reportante:** Ejecutivo Comercial
- **Entidad Involucrada:** Nuevo Cliente `DP WORLD LIRQUEN S.A`
- **Ambiente:** Producción (`PROD`)
- **Severidad:** Alta (Bloqueo en el registro de nuevos clientes mandantes en plataforma)
- **Estado:** RESUELTO

---

## 2. Síntoma Reportado por el Usuario
Al intentar registrar una nueva empresa cliente (`DP WORLD LIRQUEN S.A`) desde el Gestor de Oportunidades (`/crm`), al presionar "Guardar Cliente", el sistema arrojaba una alerta de navegador:
> *"servidor.leanglobal.cl dice: No se pudo registrar/actualizar el cliente."*
El botón quedaba en estado `GUARDANDO...` sin persistir la información.

---

## 3. Causa Raíz Técnica
1. **Desfase en la Secuencia PostgreSQL:**
   En la tabla maestra `sch_leangsp_prod.tpar_empresas`, la columna de clave primaria `id_empresa` utiliza la secuencia `sch_leangsp_prod.tpar_emp_id_seq`.
2. **Violación de Llave Primaria Unicidad:**
   La tabla contenía registros históricos con IDs de empresa de hasta `4857`, pero la secuencia `tpar_emp_id_seq` tenía como `last_value` el valor `20`.
   Al ejecutar `createEmpresa` (`INSERT INTO tpar_empresas ...`), PostgreSQL intentaba asignar `id_empresa = 21`, el cual ya se encontraba registrado, arrojando el error interno:
   ```text
   error: llave duplicada viola restricción de unicidad «tpar_empresas_pkey» (id_empresa)=(20/21)
   ```

---

## 4. Solución Aplicada
1. **Sincronización de Secuencia en Base de Datos:**
   Se ejecutó de forma determinista la sentencia de ajuste de correlativo en `sch_leangsp_prod`:
   ```sql
   SELECT setval('sch_leangsp_prod.tpar_emp_id_seq', (SELECT MAX(id_empresa) FROM sch_leangsp_prod.tpar_empresas) + 1);
   ```
   El correlativo quedó actualizado en `4858` (`is_called = true`), garantizando identificadores limpios y sin colisión para las próximas altas comerciales.

---

## 5. Archivos / Entidades Intervenidas
- Base de datos PostgreSQL: `sch_leangsp_prod.tpar_emp_id_seq`

---

## 6. Verificación y Resultados
- Consulta SQL posterior confirmó `last_value: 4858` y disponibilidad para el siguiente registro.
- El usuario puede presionar inmediatamente "Guardar Cliente" para persistir a **DP WORLD LIRQUEN S.A**.

---

## 7. Lecciones Aprendidas y Acciones Preventivas
- En procesos de migración o inserción de datos históricos con IDs explícitos, siempre debe ejecutarse un checklist de reindexación y alineación de secuencias (`setval`) en todas las tablas maestras (`tpar_empresas`, `tpar_contactos`, etc.).
