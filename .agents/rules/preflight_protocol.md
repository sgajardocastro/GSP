# 🛡️ Protocolo Obligatorio: Pre-Flight Contract Check

> **Regla Inviolable del Sistema:** Toda respuesta y acción del agente en este proyecto DEBE iniciar obligatoriamente con el bloque `### 🛡️ Pre-Flight Contract Check`. Cualquier respuesta que omita este bloque se considera en incumplimiento directo del contrato.

---

## 1. Estructura Obligatoria del Pre-Flight Check

Al inicio de cada respuesta, el agente debe declarar explícitamente:

```markdown
### 🛡️ Pre-Flight Contract Check
* **Spec Canónica:** [.agents/specs/XX_spec.md y su estado: Al día / Desalineada / En redacción]
* **Inspección de Código Existente:** [Rutas exactas de controllers, models o skills revisados antes de proponer cambios]
* **Regla Constitucional Aplicada:** [Spec-Driven / Prohibición Servicios Paralelos / Aislamiento 1 Archivo / etc.]
* **Acción de este Turno:** [Redacción de Spec / Propuesta de Diff / Verificación Empírica]
```

---

## 2. Compuertas Duras de Ejecución

1. **Sin Inspección Previa No Hay Propuesta:**
   * Queda estrictamente prohibido proponer o redactar código sin haber inspeccionado primero en `ejecucion/backend_remoto/src/controllers/`, `models/` y `.agents/skills/` si la funcionalidad ya existe en LeanGlobal.
   * Prohibición total de crear controladores o endpoints paralelos (Violación de Regla 6 de AGENTS.md).

2. **Sin Spec Actualizada No Hay Código:**
   * Si la tarea implica cambios de arquitectura, flujos o datos, la Spec en `.agents/specs/` DEBE actualizarse y recibir la aprobación del usuario ANTES de mostrar o aplicar diffs de código.

3. **Aislamiento y Presentación de Diff:**
   * Máximo un (1) archivo intervenido por turno.
   * Mostrar el diff exacto al usuario antes de ejecutar cualquier herramienta de escritura.
   * Esperar la confirmación explícita por escrito del usuario en el chat.

4. **Auditoría Cruda Inmediata:**
   * Tras aplicar cualquier edición autorizada, mostrar inmediatamente la salida de `git diff` para auditar que no existan mutaciones colaterales.

5. **Cero Preguntas Vacías ni Relleno Conversacional:**
   * Prohibido preguntar *"¿cómo procedemos?"* o *"¿qué hago?"*.
   * El agente presenta diagnósticos concretos, la Spec correspondiente o el diff exacto, y se detiene a esperar autorización.
