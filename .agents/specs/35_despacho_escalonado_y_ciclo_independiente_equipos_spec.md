# 📐 Especificación Técnica: Despacho Escalonado y Ciclo de Vida Independiente por Equipo en Faenas Multi-Recurso (Spec 35)

**Documento:** `35_despacho_escalonado_y_ciclo_independiente_equipos_spec.md`  
**Ecosistema:** Grúas San Pablo (GSP) / LeanGlobal Platform  
**Fase de Dominio:** Fase 4 (Preparación & Despacho) y Fase 5 (Ejecución en Faena)  
**Estado:** `ESPECIFICACIÓN FORMAL - APROBADA PARA IMPLEMENTACIÓN`  
**Fecha:** 25 de Agosto de 2026  

---

## 1. 📌 Resumen Ejecutivo y Justificación de Negocio

En la operación real de izaje industrial de **Grúas San Pablo (GSP)**, una Orden de Trabajo (OT) frecuentemente involucra una **flota combinada de múltiples equipos** (por ejemplo: una grúa telescópica principal de 200T, un camión pluma de apoyo auxiliar y dos camiones cama baja para transporte de contrapesos y aparejos).

### 🚨 El Problema de los Estados Monolíticos
En un modelo donde el estado del servicio es único y monolítico a nivel de proyecto:
1. **Bloqueo Operacional:** Si la Grúa Principal debe salir el lunes y el Camión Pluma de apoyo se requiere recién el jueves, obligar a que toda la flota esté lista para pasar a "Ejecución" impide que el primer equipo inicie su viaje y emita sus registros.
2. **Pérdida de Trazabilidad:** Si se fuerza el proyecto a "Ejecución" globalmente, el equipo que permanece en patio pierde su estado real de preparación y control de odómetros.
3. **Disputas de Devengado:** La contabilidad y facturación necesitan saber con precisión qué días y horas operó cada máquina individualmente para conformar los Estados de Pago (EDP).

### 🎯 Principios de la Solución (Doble Nivel de Estados)
1. **Desacoplamiento Macro vs Micro:** El **Proyecto/OT** posee un macro-estado comercial/administrativo, mientras que **cada Equipo asignado** posee su propio micro-estado operacional y de telemetría.
2. **Despacho Asíncrono y Escalonado:** Cada conductor/operador inicia su viaje con Checklist de Salida, odómetro y PIN de forma 100% independiente.
3. **Elevación Automática del Macro-Estado:** En el instante en que **el primer equipo** inicia viaje o arriba a faena, el proyecto pasa automáticamente a `5 (En Operación / Ejecución)`, habilitando el devengado diario.
4. **Continuidad Aislada de Horómetros y Días:** El correlativo de días (Día 1, Día 2, ...) y la lectura de horómetros en el **Report Diario de Izaje** se gestionan y calculan **por cada equipo de forma aislada**.

---

## 2. 🔄 Arquitectura de Estados de Doble Nivel

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│  NIVEL 1: MACRO-ESTADO DEL PROYECTO / OT (`tpry_proyecto.id_proyecto_estado`)                    │
│  [ 1: Cotización ] ──> [ 2: Validación ] ──> [ 3: Acreditación ] ──> [ 4: Prep/Salida ]         │
│                                                                            │                     │
│                                            (Primer equipo inicia viaje)    │                     │
│                                                                            ▼                     │
│                                                 [ 5: En Operación / Ejecución ]                  │
│                                                                            │                     │
│                                            (Todos los equipos liberados)   │                     │
│                                                                            ▼                     │
│                                                 [ 6: Liquidación & Cierre EDP ]                  │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
                                             │
                   ┌─────────────────────────┴─────────────────────────┐
                   ▼                                                   ▼
┌───────────────────────────────────────────┐       ┌───────────────────────────────────────────┐
│  NIVEL 2: MICRO-ESTADO EQUIPO A (Grúa)    │       │  NIVEL 2: MICRO-ESTADO EQUIPO B (Apoyo)   │
│  Liebherr LTM-1200 (GZBC-58)              │       │  Camión Pluma Mercedes (KJ-8821)          │
│  ───────────────────────────────────────  │       │  ───────────────────────────────────────  │
│  1. `ASIGNADO_PATIO`                      │       │  1. `ASIGNADO_PATIO`                      │
│  2. `CHECKLIST_SALIDA_OK`                 │       │  2. `CHECKLIST_SALIDA_OK` (Pendiente)     │
│  3. `EN_RUTA` (Odómetro + PIN Chofer)     │       │  3. `EN_RUTA` (Programado +2 días)        │
│  4. `EN_FAENA` (Arribado a Obra)          │       │  4. `EN_FAENA` (Bloqueado)                │
│  5. `REPORT_DIARIO_ACTIVO` (Día 1, 2, 3)  │       │  5. `REPORT_DIARIO_ACTIVO` (Inactivo)     │
│  6. `RETORNADO_PATIO` / `LIBERADO`        │       │  6. `RETORNADO_PATIO` / `LIBERADO`        │
└───────────────────────────────────────────┘       └───────────────────────────────────────────┘
```

---

## 3. 🗄️ Modelo de Datos y Transiciones PostgreSQL

### 3.1. Micro-Estado en `sch_leangsp.tequ_log_desplazamiento`
Cada equipo asignado a una OT posee un registro de desplazamiento activo con las siguientes transiciones de `estado_trayecto`:

```sql
-- Valores permitidos para estado_trayecto por equipo:
-- 'ASIGNADO'          -> Asignado en OT, en patio esperando fecha de salida.
-- 'CHECKLIST_OK'      -> Checklist de salida de patio completado.
-- 'EN_RUTA'           -> Chofer ingresó PIN y Odómetro de salida; telemetría activa.
-- 'ARRIBADO'          -> Llegó a faena; ingresó PIN y Odómetro de llegada (Estado EN_FAENA).
-- 'RETORNO_EN_RUTA'   -> Viaje de regreso a patio iniciado.
-- 'FINALIZADO'        -> Llegó a patio central de GSP; equipo liberado.
```

### 3.2. Disparadores Lógicos de Negocio (Triggers de Transición)

1. **Trigger de Inicio de Operación (Macro $\rightarrow$ 5):**
   ```javascript
   // Al ejecutar viajeController.iniciarViaje(token_viaje):
   // 1. tequ_log_desplazamiento.estado_trayecto = 'EN_RUTA'
   // 2. Si tpry_proyecto.id_proyecto_estado == 4:
   //      UPDATE sch_leangsp.tpry_proyecto 
   //      SET id_proyecto_estado = 5 
   //      WHERE id_proyecto = $id_proyecto;
   ```

2. **Trigger de Arribo a Faena (Habilitación de Reports):**
   ```javascript
   // Al ejecutar viajeController.finalizarViaje(token_viaje):
   // 1. tequ_log_desplazamiento.estado_trayecto = 'ARRIBADO'
   // 2. El equipo queda inmediatamente habilitado en la PWA para emitir Report Diario.
   ```

3. **Trigger de Cierre de Servicio (Macro $\rightarrow$ 6):**
   ```javascript
   // Solo cuando TODOS los equipos asignados a la OT tienen estado_trayecto = 'FINALIZADO'
   // y todos los reports diarios están validados por el Analista:
   // El Analista puede mover la OT a Estado 6 (Liquidación & EDP).
   ```

---

## 4. ⚙️ Reglas de Aislamiento en el Backend Node.js

### 4.1. `reportDiarioController.js` - Contexto Aislado por Equipo
El endpoint `GET /api/operaciones/report/contexto/:id_proyecto` soporta el parámetro opcional `?id_equipo=X`.

```javascript
// Cálculo de correlativo y horómetro sugerido por equipo individual:
const lastReportQuery = `
  SELECT dia_correlativo, horometro_termino 
  FROM sch_leangsp.tedp_reporte_avance 
  WHERE id_proyecto = $1 AND id_equipo = $2
  ORDER BY dia_correlativo DESC, fecha_reporte DESC 
  LIMIT 1;
`;

// Si es el primer report de este equipo en particular:
// dia_sugerido = 1
// horometro_sugerido = horometro_actual_equipo (desde tequ_equipo)

// Si ya tiene reports previos de días anteriores:
// dia_sugerido = lastReport.dia_correlativo + 1
// horometro_sugerido = lastReport.horometro_termino
```

### 4.2. Matriz de Consulta Multi-Equipo
El endpoint `GET /api/operaciones/report/proyecto/:id_proyecto` entrega la lista de todos los reportes agrupados o filtrables por equipo:
```json
{
  "success": true,
  "data": {
    "resumen_equipos": [
      {
        "id_equipo": 35,
        "patente": "GZBC-58",
        "modelo": "Liebherr LTM-1200",
        "estado_operativo": "EN_FAENA",
        "total_dias_operados": 3,
        "total_horas_efectivas": 27.5,
        "total_horas_sobretiempo": 3.5,
        "ultimo_horometro": 4890.5
      },
      {
        "id_equipo": 42,
        "patente": "KJ-8821",
        "modelo": "Mercedes Actros Pluma",
        "estado_operativo": "EN_PATIO",
        "total_dias_operados": 0,
        "total_horas_efectivas": 0,
        "total_horas_sobretiempo": 0,
        "ultimo_horometro": 1210.0
      }
    ],
    "reportes": [ ... ]
  }
}
```

---

## 5. 📱 Experiencia de Usuario PWA (Operador en Terreno)

1. **Reconocimiento Automático del Equipo:**
   * Si el usuario logueado en la PWA está asignado a un equipo específico como operador en la OT, el formulario de **Report Diario** preselecciona automáticamente su máquina (`id_equipo`).
2. **Selector de Máquina en Faenas Complejas:**
   * Si un operador maniobra más de una máquina o si hay relevo de tripulación, la PWA presenta pestañas superiores de selección rápida:
     `[ 🚜 Grúa 200T (GZBC-58) - Día 3 ]` `[ 🏗️ Camión Pluma (KJ-8821) - Día 1 ]`.
3. **Validación de Bloqueo:**
   * Un equipo que aún no sale de patio (`ASIGNADO_PATIO`) no permite emitir reports diarios hasta que complete su salida de patio y arribo a faena.

---

## 6. 🖥️ Experiencia Torre de Control CRM (Gestor de Oportunidades)

### 6.1. Pestaña C: Asignación de Recursos Técnicos
En la tabla de asignación de equipos, cada fila incorpora un indicador visual de estado en tiempo real:

| Equipo / Modelo | Patente | Operador | Fecha Salida | Estado Operacional | Acción |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Liebherr LTM 1200 | `GZBC-58` | Juan Pérez | 25/08/2026 | `🟢 EN FAENA (Día 3)` | `[ Ver Telemetría ]` |
| Mercedes Pluma 28T | `KJ-8821` | Pedro Soto | 28/08/2026 | `⚪ EN PATIO (Prog: Jue 28)` | `[ Habilitar Salida ]` |
| Cama Baja 40T | `TR-4410` | Mario Lagos | 25/08/2026 | `🟢 EN FAENA (Liberado)` | `[ Retorno Patio ]` |

### 6.2. Subpestaña 6: Ejecución & Reports Diarios
* Permite ver la grilla completa de reportes o filtrar por equipo mediante pestañas (`Todas las Máquinas` / `GZBC-58` / `KJ-8821`).
* Muestra tarjetas de devengado acumulado individuales y consolidadas para el Estado de Pago (EDP).

---

## 7. 🧪 Matriz de Casos de Prueba y Aceptación QA

| ID | Escenario de Prueba | Acción Ejecutada | Resultado Esperado |
| :--- | :--- | :--- | :--- |
| **CP-35.1** | Despacho del Equipo 1 | Chofer 1 ingresa PIN y odómetro de salida. | `tpry_rel_equipo[1].estado = EN_RUTA`. Macro-estado de OT cambia a `5 (Ejecución)`. Equipo 2 sigue en Patio. |
| **CP-35.2** | Primer Report de Equipo 1 | Operador 1 abre Report Diario en PWA. | Sugiere `dia_correlativo = 1` y horómetro base de Equipo 1. Permite firma del cliente. |
| **CP-35.3** | Salida Diferida Equipo 2 (+2 días) | Chofer 2 inicia viaje 2 días después. | Equipo 2 pasa a `EN_RUTA` sin alterar el historial ni los reports ya emitidos por Equipo 1. |
| **CP-35.4** | Primer Report de Equipo 2 | Operador 2 abre Report Diario en PWA. | Sugiere `dia_correlativo = 1` para Equipo 2, mientras Equipo 1 emite simultáneamente su `Día 3`. |
| **CP-35.5** | Consolidación de EDP | Analista valida reports de ambos equipos. | EDP suma $3 \text{ días (Equipo 1)} + 1 \text{ día (Equipo 2)}$ con sus tarifas independientes exactas. |

---

## 8. 📜 Invariantes de Seguridad y Negocio

1. **Invariante de Horómetros:** Los horómetros de un equipo jamás pueden cruzarse o heredarse entre máquinas distintas. Cada horómetro pertenece estrictamente a su `id_equipo`.
2. **Invariante de Fechas de Salida:** Un equipo no puede registrar horas de faena antes de su respectiva fecha y hora de salida de patio (`tequ_log_desplazamiento.t_device_salida`).
3. **Invariante de Cierre de OT:** Ninguna OT puede cerrarse (`id_proyecto_estado = 6 / 7`) si existe algún equipo con estado `EN_RUTA` o `EN_FAENA` sin retornar formalmente a patio.
