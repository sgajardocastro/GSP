# SPEC-116 / REQ-1127: Modo de Revisión Ejecutiva en Aprobación de ITS para Jefaturas (Operaciones y Contabilidad)

---

## 1. Identificación y Estado

- **Código Requerimiento:** `REQ-1127`
- **Código Especificación:** `SPEC-116`
- **Fecha:** 2026-11-07
- **Autor / Arquitectura:** Antigravity / LeanGlobal
- **Ambientes:** Desarrollo (`DEV`) y Producción (`PROD`)
- **Impacto Frontend:** `ejecucion/frontend/src/components/Operaciones/ModalITS.vue`, `ejecucion/frontend/src/views/Torre.vue`
- **Impacto Backend:** `ejecucion/backend_remoto/src/controllers/itsController.js` (Endpoints de flujo FES existentes: `/operaciones/its/flujo/:id`, `/operaciones/its/firmar-paso-fes`, `/operaciones/its/preview-pdf/:id`)
- **Estado:** `PROPUESTA FORMAL / PENDIENTE DE APROBACIÓN DE DIFF`

---

## 2. Definición del Problema & Congruencia Operacional

### 2.1. Síntoma Detectado (Reunión 2026-11-07 con Alfonso Porperrello y Feedback de Jorge Ponce)
Durante la operación real en producción:
1. Una vez que el Analista de Gestión (Yiara / Yara) completa la liquidación técnica del ITS (Paso 1 del Flujo FES) y estampa su firma, el ITS avanza a **Paso 2: V°B° Jefatura de Operaciones** (Jorge Ponce / Alfonso Porperrello) o subsecuentemente a **Paso 3: Recepción Conforme Contabilidad** (Marita / Pamela).
2. Sin embargo, al abrir el modal del ITS desde la plataforma (`ModalITS.vue`), la pantalla presenta exactamente el mismo formulario técnico de formulación:
   - Inputs editables de horas mínimas pactadas, tarifas comerciales, costos de operador, colaciones, etc.
   - Botones de acción "Guardar Avances", "Guardar y Salir", "Guardar y Pasar a EDP".
3. Esto genera tres graves inconsistencias operacionales:
   - **Riesgo Crítico de Mutación Accidental:** Un directivo puede modificar involuntariamente un valor numérico o pisar la liquidación ya cerrada por la analista.
   - **Confusión de UX:** Los directivos sienten que deben llenar o revisar un formulario complejo en vez de revisar el informe final que se despacha al cliente.
   - **Flujo FES Fragmentado:** Para ver el PDF tenían que abrir una pestaña externa o presionar "Firmar ITS" para abrir un segundo modal superpuesto con un iframe reducido y el teclado de PIN.

### 2.2. Mandato Operacional
> *"Se acordó modificar el flujo del ITS para que las jefaturas de operaciones y contabilidad solo puedan aprobar o devolver solicitudes mediante una visualización de PDF. Los cargos directivos no deben poder modificar los documentos, sino únicamente aprobarlos o devolverlos mediante un formato simplificado que muestre solo el PDF con dos botones de acción y comentarios."* (Minuta Ejecutiva 2026-11-07).

---

## 3. Causa Raíz de Arquitectura

1. **Ausencia de Vista Ejecutiva Dedicada en `ModalITS.vue`:**
   El componente renderizaba incondicionalmente las 5 secciones de formulario (`Sección 1: Datos del Servicio`, `Sección 2: Resumen Económico`, `Sección 3: Conciliación de Jornadas`, `Sección 4: Detalle de Costos`, `Sección 5: Observaciones`).
2. **Prop `readonly` desacoplada del Flujo FES:**
   El prop `readonly` solo se activaba al llamar el componente desde el Kanban histórico de Operaciones (`embedded = true`). Desde la Torre de Control (`Torre.vue`), el modal se invocaba con `:embedded="false"` sin pasar `readonly`, por lo que `readonly` era `false` incluso si el ITS estaba en Paso 2 o Paso 3.
3. **Modal FES Secundario vs Experiencia Integrada:**
   La firma FES requería abrir un segundo diálogo flotante (`mostrarModalFes = true`) que duplicaba lógica y sobrecargaba la interfaz.

---

## 4. Especificación Canónica de la Solución

### 4.1. Detección Determinista de "Modo Revisión Ejecutiva" (`esModoRevisionEjecutiva`)
Se define una propiedad computada en `ModalITS.vue`:
```javascript
const esModoRevisionEjecutiva = computed(() => {
  // 1. Si el paso pendiente actual es de supervisión/aprobación (Paso > 1: Jefatura o Contabilidad)
  if (pasoPendienteActual.value && pasoPendienteActual.value.orden > 1) return true;

  // 2. Si el ITS ya no está en estado borrador (está en revisión o concluido)
  const estado = String(its.value?.estado_its || '').toUpperCase();
  if (['EN_REVISION_OPERACIONES', 'EN_REVISION_CONTABILIDAD', 'CONCLUIDO'].includes(estado)) {
    // Si el usuario actual NO es el analista formulador, siempre es modo ejecutivo
    return true;
  }

  // 3. Flag forzada por props
  if (props.readonly) return true;

  return false;
});
```

### 4.2. Arquitectura de Navegación Dual en Modo Revisión
Cuando `esModoRevisionEjecutiva === true`, el modal conmuta a la vista ejecutiva:
1. **Pestaña Predeterminada (Default): `📄 Documento Oficial PDF Firmado por Analista`:**
   - Ocupa el 100% del cuerpo del modal con un visor responsivo del documento PDF oficial que **ya fue elaborado y firmado con PIN FES por Yiara (Paso 1)**.
   - Muestra el documento formal inmutable: sellos criptográficos FES, código de validación, firmas estampadas, balance de margen conciliado y desglose de viáticos.
   - Operaciones y Contabilidad no generan ni compilan un documento nuevo: auditan directamente el documento que Yiara selló en su liquidación técnica.
   - Cuenta con botón de refresco rápido (`🔄 Actualizar Vista`) para sincronizar cambios si hubo una devolución previa.
2. **Pestaña Secundaria Alternativa: `👁️ Inspección Numérica (Solo Lectura)`:**
   - Permite al directivo auditar el desglose de costos de las 5 secciones si necesita ver detalles analíticos.
   - **REGLA DE SEGURIDAD ESTRICTA:** Todos los campos de entrada (`<input>`, `<select>`, `<textarea>`) quedan estrictamente bloqueados en modo `disabled` / `readonly`, eliminando cualquier riesgo de mutación accidental.
   - Banner persistente superior en color azul marino / ámbar:
     `🔒 Vista de Inspección Técnica (Solo Lectura): Los valores fueron conciliados por Control de Gestión en el Paso 1. Para solicitar correcciones, utilice el botón "Devolver con Observaciones".`

### 4.3. Barra Fija de Decisión Ejecutiva (Action Bar)
En la cabecera superior y/o barra inferior fija, se exponen únicamente los dos botones canónicos de decisión:
1. **Botón Principal de Aprobación:**
   - **Etiqueta:** `🔏 Aprobar ITS (Paso X: Nombre Paso)`
   - **Estilo:** Verde esmeralda (`bg-emerald-600 hover:bg-emerald-500 text-white font-bold`).
   - **Comportamiento:** Despliega el diálogo modal FES simplificado enfocado únicamente en la validación de identidad y PIN de 4 dígitos (SHA-256).
2. **Botón de Devolución / Rechazo con Observaciones:**
   - **Etiqueta:** `❌ Devolver con Observaciones`
   - **Estilo:** Rojo / Rose suave (`bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700/50`).
   - **Comportamiento:** Despliega de inmediato el cuadro de devolución donde el directivo selecciona la Causal de Rechazo del catálogo y redacta el comentario obligatorio. Al confirmar, el backend transiciona el flujo de vuelta a Paso 1, notifica por correo al Analista y marca el ITS como `OBSERVADO`.

### 4.4. Supresión Estricta de Acciones de Formulación
Cuando `esModoRevisionEjecutiva === true`:
- Quedan **completamente ocultos** los botones:
  - `💾 Guardar Avances`
  - `✅ Guardar y Salir`
  - `➔ Guardar y Pasar a EDP`
- Se bloquea cualquier llamada automática de autoguardado (`debounceGuardar()`).

---

## 5. Mockup Estructural de la Interfaz (Modo Revisión Ejecutiva)

```
+-------------------------------------------------------------------------------------------------------+
|  📄 ITS-GSP-2611-00001-001  [EN REVISIÓN JEFATURA]          [📄 Vista PDF] [👁️ Desglose Solo Lectura]  [✕]   |
+-------------------------------------------------------------------------------------------------------+
|  Flujo FES:  (✅ 1. Elaboración: Yara) ➔ (⏳ 2. V°B° Jefatura: Jorge Ponce) ➔ (⏸️ 3. Contabilidad)      |
+-------------------------------------------------------------------------------------------------------+
|                                                                                                       |
|                                                                                                       |
|                         [ VISOR PDF OFICIAL FIRMADO POR YIARA (FES PASO 1) ]                          |
|                                                                                                       |
|                          INFORME DE AUDITORÍA Y LIQUIDACIÓN INTERNA (ITS)                             |
|                                     PDF OFICIAL EN ALTA RESOLUCIÓN                                    |
|                                                                                                       |
|                                                                                                       |
+-------------------------------------------------------------------------------------------------------+
|  [❌ Devolver con Observaciones]                                 [🔏 Aprobar con PIN FES (Paso 2)]    |
+-------------------------------------------------------------------------------------------------------+
```

---

## 6. Criterios de Aceptación (QA Determinista)

1. **Cero Confusión en Paso 2 y 3:**
   - Al abrir un ITS que ya tiene el Paso 1 firmado, el directivo ve inmediatamente el PDF oficial renderizado a pantalla completa.
   - No aparece ningún botón de "Guardar Avances" ni inputs editables.
2. **Determinismo en Decisión:**
   - El botón `🔏 Aprobar ITS (Paso 2)` solicita el PIN FES, estampa la firma criptográfica y avanza el ITS a Paso 3 (o `CONCLUIDO` si es el último paso).
   - El botón `❌ Devolver con Observaciones` exige motivo y comentario, devolviendo el estado a `OBSERVADO` / Paso 1 y enviando notificación correspondiente.
3. **Auditoría de Desglose Seguro:**
   - Si el directivo presiona `👁️ Desglose Numérico (Solo Lectura)`, puede auditar las tablas de costos y jornadas, pero ningún campo puede ser modificado ni enviado al backend.
4. **Retrocompatibilidad con Analista (Paso 1):**
   - Cuando el ITS está en borrador o devuelto (Paso 1) y es abierto por el Analista de Gestión, el modal conserva el 100% de sus facultades de edición, guardado y cálculo interactivo.
