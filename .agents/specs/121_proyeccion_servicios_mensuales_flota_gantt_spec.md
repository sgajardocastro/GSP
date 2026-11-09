# 📐 Especificación Técnica: SPEC-121
## Proyección de Servicios Mensuales y Multiequipo en Flota Gantt (Torre PMO)

* **Identificador:** `SPEC-121`
* **Requerimiento Asociado:** `REQ-1135`
* **Caso de Soporte:** `CASO-20261109-05`
* **Componente:** `ejecucion/frontend/src/views/Torre.vue`
* **Versión de Implementación:** `v1.0.205`
* **Fecha:** 2026-11-09
* **Autor:** Sergio Gajardo / Antigravity

---

## 1. Contexto y Problema del Negocio
En la vista **Flota Gantt** de la Torre de Control PMO (`Torre.vue`), el equipo de Operaciones supervisa la asignación y disponibilidad cronológica de toda la flota de grúas y camiones pluma.

Se detectó que servicios contratados bajo régimen mensual (como las OTs `GSP-2611-00006` y `GSP-2611-1830-001` de Constructora Inarco S.A., con ventana del `01/11/2026` al `30/11/2026`):
1. **No proyectan barras operativas** en los días correspondientes del mes.
2. Si el usuario activa el filtro por defecto *"Ocultar sin movimiento"*, las grúas asignadas (ej. `[VPSR.26-1]` XCMG XCT70SA y `[STDD.68-4]` LIEBHERR LTM-1070) **desaparecen completamente de la grilla temporal**.

---

## 2. Diagnóstico de Causa Raíz Técnica
En `Torre.vue`, la función `getEventoEquipoEnDia(eq, fechaStr)` evalúa la presencia de un equipo en cada celda diaria:

1. **Desfase de Ventana Temporal (Cabecera vs Ejecución Operativa Real):**
   ```javascript
   const rawIni = p.fecha_plan_ini || p.fecha_real_ini || p.fecha_creacion
   const rawFin = p.fecha_plan_fin || p.fecha_real_fin || rawIni
   ```
   En servicios mensuales estructurados a inicio de mes, las columnas planas de cabecera (`p.fecha_plan_ini`) contienen la fecha puntual de emisión comercial (`2026-11-02`), mientras que el rango de ejecución contractual pactado (`2026-11-01` a `2026-11-30`) reside en `ejecucion_v1.fecha_salida_plan / fecha_fin_plan` y `crm_v1.lineas_servicio`.
   Al evaluar días como el 9 de noviembre, la condición `targetDate >= ini && targetDate <= fin` evaluaba a `false`.

2. **Resolución Incompleta de Equipos del Proyecto:**
   `getEventoEquipoEnDia` comprobaba únicamente:
   - `ej.patente_grua`
   - `crm.lineas_servicio`
   - `ej.recursos_asignados?.equipos`
   - `ej.preparacion_salida?.inspecciones_patio`
   Omitiendo las asignaciones registradas en `ej.equipo_id`, `ej.equipos_ids`, `ej.flota_traslado_ids`, `ej.equipos_detalle` o `ej.equipos_extra`.
   En contraste, la función `getFichaOperativa(p)` ya computa la totalidad de `allEqIds` y los rangos `fechaEjecIniIso` y `fechaEjecFinIso`.

3. **Ocultamiento por Cero Movimiento:**
   Al retornar `null` para todos los días visibles, `tieneEventoEnVentana` evalúa a `false`, provocando que el equipo sea filtrado cuando *"Ocultar sin movimiento"* está encendido.

---

## 3. Solución de Arquitectura ("Cero Parches")

### 3.1. Enriquecimiento de `getFichaOperativa(p)`
Exponer dentro del objeto retornado por `getFichaOperativa(p)` la lista consolidada de identificadores de equipos:
```javascript
equiposIds: Array.from(allEqIds)
```

### 3.2. Refactorización de `getEventoEquipoEnDia(eq, fechaStr)`
1. **Consumo Determinista del Rango de Ejecución:**
   Consumir `f = getFichaOperativa(p)`:
   - `iniIso = f.fechaEjecIniIso || toLocalIsoDate(p.fecha_plan_ini || p.fecha_real_ini || p.fecha_creacion)`
   - `finIso = f.fechaEjecFinIso || iniIso`
   - Comparación léxica de fechas ISO pura (`fechaStr >= iniIso && fechaStr <= finIso`) evitando desfases de huso horario (`new Date()`).
2. **Evaluación Exhaustiva de Pertenencia del Equipo:**
   Evaluar match positivo si:
   - `f.equiposIds?.includes(idEq)`
   - `f.equipoNombre?.toUpperCase().includes(patEq)`
   - `f.equiposNombres?.some(en => en.toUpperCase().includes(patEq))`
   - `esGrua` (`(ej.patente_grua || '').toUpperCase().trim() === patEq`)
   - `enLineas` (`crm.lineas_servicio`)
   - `enRecursos` (`ej.recursos_asignados?.equipos`)
   - `enPatio` (`ej.preparacion_salida?.inspecciones_patio`)
3. **Preservación de Estados y Colisiones:**
   Mantener intacta la lógica de colisión (múltiples OTs activas), estados de faena (`st === 5`), completados (`st >= 7`) y cancelados (`st === 6 && motivo_desestimacion`).

---

## 4. Criterios de Aceptación y Pruebas
1. Los equipos `[VPSR.26-1]` (OT 35 / `GSP-2611-00006`) y `[STDD.68-4]` (OT 27 / `GSP-2611-1830-001`) deben proyectar su barra de faena (Cian o Verde según estado) en todos los días del mes de noviembre de 2026.
2. Al activar *"Ocultar sin movimiento"*, dichos equipos deben mantenerse visibles.
3. El clic sobre la barra proyectada debe abrir la ficha de la OT correspondiente.
4. `npm run build` en frontend debe compilar con 0 errores.
