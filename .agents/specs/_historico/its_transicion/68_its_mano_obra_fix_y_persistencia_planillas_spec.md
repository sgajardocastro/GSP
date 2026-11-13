# SPEC-068: Corrección Cálculo Mano de Obra Operador y Persistencia Servidor de Planillas GeraldSoft

**Versión:** 1.0.116  
**Fecha:** 2026-10-09  
**Estado:** APROBADO POR USUARIO  
**Requerimiento Relacionado:** REQ-1018 (Corrección cálculo $111.000 vs $222.000 y persistencia de fuentes GeraldSoft)

---

## 1. Contexto y Problemas Detectados

1. **Discrepancia en Total Costo Mano de Obra ($222.000 vs $111.000):**
   - Para equipos de categoría Grúa Horquilla (ej. patente `KKFG50`), con `37.0 hrs` reportadas y valor hora `$3.000/hr`, el sistema mostraba `$222.000` en lugar de `$111.000`.
   - Causa raíz:
     - El valor base por defecto para categorías sin match era `$6.000/hr` ($6.000 \times 37 = \$222.000$).
     - En el frontend, `op.valor_hora` no estaba bindeado bidireccionalmente a `costos.tarifas_operadores_override[op.patente]`, provocando que el input mostrara un valor mientras el subtotal continuaba calculando con el valor anterior.
   - Solución:
     - Mapear explícitamente categoría `HORQUILLA` con valor sugerido `$3.000/hr`.
     - Garantizar reactividad estricta e inmediata entre `costos.tarifas_operadores_override` y el subtotal de fila y general.
     - Asegurar que el PDF oficial replique idéntica fórmula.

2. **Falta de Persistencia de Planillas GeraldSoft:**
   - Actualmente, las planillas Excel (`CONTROLES` y `Órdenes de Trabajo OT`) residen únicamente en la memoria volátil del navegador (`serviciosRaw`, `ordenesRaw`), obligando a los usuarios a volver a cargar los archivos cada vez que acceden a la vista de ITS Transición.
   - Solución:
     - Crear tabla `tits_geraldsoft_planillas` en `sch_leangsp` (DEV) y `sch_leangsp_prod` (PROD).
     - Endpoints:
       - `GET /api/operaciones/its/transicion/planillas/activas`
       - `POST /api/operaciones/its/transicion/planillas/subir`
     - En el frontend, invocar la precarga en `onMounted`, auto-poblando el selector de cotizaciones al ingresar.
     - Guardar en el backend de forma automática cuando el usuario cargue un archivo nuevo.

---

## 2. Modelo de Base de Datos

```sql
CREATE TABLE IF NOT EXISTS tits_geraldsoft_planillas (
    id_planilla SERIAL PRIMARY KEY,
    tipo_planilla VARCHAR(50) NOT NULL, -- 'CONTROLES' o 'ORDENES'
    nombre_archivo VARCHAR(255) NOT NULL,
    total_registros INTEGER DEFAULT 0,
    data_json JSONB NOT NULL,
    id_usuario INTEGER REFERENCES tsec_users(id_user),
    fecha_carga TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_tits_geraldsoft_tipo ON tits_geraldsoft_planillas(tipo_planilla, activo);
```

---

## 3. Endpoints Backend

1. `GET /api/operaciones/its/transicion/planillas/activas`:
   - Retorna las últimas planillas activas de `CONTROLES` y `ORDENES` con `data_json` y metadatos.
2. `POST /api/operaciones/its/transicion/planillas/subir`:
   - Marca anteriores `activo = false` para el `tipo_planilla`.
   - Inserta nuevo registro con `activo = true`.

---

## 4. Criterios de Aceptación

- [x] Patente `KKFG50` con `37.0 hrs` a `$3.000/hr` calcula exactamente `$111.000` en la fila y en el total de mano de obra.
- [x] Toda edición en el input de valor hora o en las horas del operador recalcula inmediatamente el subtotal.
- [x] Al entrar a la vista de ITS Transición, si ya existen planillas en el servidor, se cargan automáticamente sin pedir subir archivos.
- [x] Al subir un Excel de Controles u Órdenes, queda persistido en PostgreSQL tanto en DEV como en PROD.
- [x] Release `v1.0.116` registrado en gobernanza (`RELEASE_LOG.md`, `tareas.md`, `tcfg_releases`, `tcfg_backlog`).
