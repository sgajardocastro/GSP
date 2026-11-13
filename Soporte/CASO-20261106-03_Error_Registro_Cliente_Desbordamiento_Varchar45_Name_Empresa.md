# CASO-20261106-03: Error al Registrar Cliente por Desbordamiento de Longitud en Columna `name_empresa` (`varchar(45)`)

---

## 1. Ficha del Incidente

- **ID del Caso:** `CASO-20261106-03`
- **Fecha / Hora:** 2026-11-06 16:30:00 (Hora Chile)
- **Usuario Afectado:** Jorge (Gestor de Clientes / Operaciones)
- **Entidad / Empresa Afectada:** Mandante `COMERCIAL Y SERVICIOS JOSE OSVALDO VASQUEZ E.I.R.L` (Razón Social: 50 caracteres)
- **Ambientes Afectados:** Producción (`sch_leangsp_prod`) y Desarrollo (`sch_leangsp`).
- **Severidad:** Alta / Bloqueante Comercial (Imposibilidad de dar de alta clientes con razón social > 45 caracteres para cotizaciones y OTs).
- **Estado:** `RESUELTO Y NORMALIZADO EN PRODUCCIÓN Y DEV`

---

## 2. Síntoma Reportado por Terreno / Usuario

Al intentar dar de alta al nuevo cliente desde el formulario web de Gestión de Clientes:
- **Razón Social:** `COMERCIAL Y SERVICIOS JOSE OSVALDO VASQUEZ E.I.R.L`
- **Giro:** `OBRAS MENORES`
- **Dirección Comercial:** `QUIÑIPEIUMO 912 LINARES`
- **Teléfono:** `+56977061109`
- **Facturación:** Maule / Linares / Quiñpeumo 912

El sistema desplegó una alerta emergente en pantalla:
> `servidor.leanglobal.cl dice: No se pudo registrar/actualizar el cliente.`

---

## 3. Diagnóstico Técnico & Evidencia Empírica

1. **Inspección de Logs de Producción PM2 (`lean-services-gsp-prod-error.log`):**
   ```text
   Error createEmpresa: error: el valor es demasiado largo para el tipo character varying(45)
       at async exports.createEmpresa (/home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/empresasController.js:80:22) {
     length: 115,
     severity: 'ERROR',
     code: '22001',
     routine: 'varchar'
   }
   ```
2. **Diferenciación con Caso Anterior (Secuencia vs Longitud):**
   - El caso previo (`DP WORLD LIRQUEN S.A.`): Falló debido a una desincronización de la secuencia de clave primaria `tpar_emp_id_seq` con IDs preinsertados manualmente. Dicha secuencia quedó normalizada.
   - En este incidente: La razón social `COMERCIAL Y SERVICIOS JOSE OSVALDO VASQUEZ E.I.R.L` posee exactamente **50 caracteres**.
   - En `empresasController.js`:
     ```javascript
     const finalName = name_empresa || razon_social;
     ```
     Al no ingresar un nombre de fantasía corto, `finalName` heredó la razón social completa (50 caracteres), sobrepasando el límite físico de `character varying(45)` de la columna `name_empresa` en `tpar_empresas`.
3. **Bloqueo DDL en PostgreSQL:**
   Al intentar alterar el tipo de columna directamente vía DDL, PostgreSQL abortó por dependencias de vistas:
   ```text
   ERROR: no se puede alterar el tipo de una columna usada en una regla o vista
   DETALLE: regla _RETURN en vista sch_leangsp_prod.vw_procesossurvey depende de la columna «name_empresa»
   ```
   Se auditaron las dependencias con `pg_depend` y se identificaron dos vistas acopladas: `vw_procesossurvey` y `vw_proyectos_full`.

---

## 4. Causa Raíz de Arquitectura

- La tabla `tpar_empresas` mantenía un límite legado de 45 caracteres en `name_empresa` (creado para nombres cortos de fantasía), mientras que `razon_social` admitía hasta 255 caracteres.
- El controlador del backend rellenaba `name_empresa` con la `razon_social` cuando el usuario no especificaba un alias corto, generando una excepción PostgreSQL `22001 (string data right truncation)` en toda empresa con razón social mayor a 45 caracteres.

---

## 5. Plan de Mitigación y Resolución

Se ejecutó una transacción DDL integral en el motor PostgreSQL como superusuario `postgres`, replicada en **PROD** (`sch_leangsp_prod`) y **DEV** (`sch_leangsp`):

```sql
BEGIN;

-- PROD
DROP VIEW IF EXISTS sch_leangsp_prod.vw_procesossurvey CASCADE;
DROP VIEW IF EXISTS sch_leangsp_prod.vw_proyectos_full CASCADE;

ALTER TABLE sch_leangsp_prod.tpar_empresas
  ALTER COLUMN name_empresa TYPE character varying(255),
  ALTER COLUMN giro TYPE character varying(255),
  ALTER COLUMN direccion TYPE character varying(255);

CREATE OR REPLACE VIEW sch_leangsp_prod.vw_procesossurvey AS ...;
GRANT ALL ON sch_leangsp_prod.vw_procesossurvey TO usr_leangsp_prod;

CREATE OR REPLACE VIEW sch_leangsp_prod.vw_proyectos_full AS ...;
GRANT ALL ON sch_leangsp_prod.vw_proyectos_full TO usr_leangsp_prod;

-- DEV
DROP VIEW IF EXISTS sch_leangsp.vw_procesossurvey CASCADE;
DROP VIEW IF EXISTS sch_leangsp.vw_proyectos_full CASCADE;

ALTER TABLE sch_leangsp.tpar_empresas
  ALTER COLUMN name_empresa TYPE character varying(255),
  ALTER COLUMN giro TYPE character varying(255),
  ALTER COLUMN direccion TYPE character varying(255);

CREATE OR REPLACE VIEW sch_leangsp.vw_procesossurvey AS ...;
GRANT ALL ON sch_leangsp.vw_procesossurvey TO usr_leangsp;

CREATE OR REPLACE VIEW sch_leangsp.vw_proyectos_full AS ...;
GRANT ALL ON sch_leangsp.vw_proyectos_full TO usr_leangsp;

COMMIT;
```

### Verificación Empírica Real:
1. **Inspección de Esquema:**
   `name_empresa`, `giro` y `direccion` verificados en `character varying(255)` en ambos esquemas.
2. **Prueba de Inserción Atómica:**
   Inserción de prueba del cliente con nombre de 50 caracteres:
   ```text
   TEST INSERT SUCCESSFUL! Created id_empresa: 4860
   name_empresa length: 50
   ```
3. **Comprobación de Integridad de Vistas:**
   - `sch_leangsp_prod.vw_procesossurvey`: 38 registros (OK).
   - `sch_leangsp_prod.vw_proyectos_full`: 36 registros (OK).
   - `sch_leangsp.vw_procesossurvey`: 115 registros (OK).
   - `sch_leangsp.vw_proyectos_full`: 60 registros (OK).

---

## 6. Protocolo de Respuesta y Guía al Usuario / Operaciones

> **Instrucción para Jorge / Usuario:**
> "El límite de caracteres para nombres y razones sociales largas de empresas ya fue ampliado a 255 caracteres en la base de datos de producción.
> Jorge solo debe presionar **Aceptar** en la ventana de aviso y presionar nuevamente el botón **Guardar** en el formulario donde ya tiene ingresados los datos. La empresa se guardará inmediatamente con éxito."

---

## 7. Acciones Preventivas / Lecciones Aprendidas

1. **Homogeneización de Longitudes:** Se homologó no solo `name_empresa` sino también `giro` y `direccion` a `varchar(255)` para prevenir fallas análogas en giros comerciales complejos o direcciones rurales extensas.
2. **Sincronización Total de Entornos:** Ambas bases de datos (DEV y PROD) quedaron en absoluta paridad técnica.
