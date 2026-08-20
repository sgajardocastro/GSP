# 🧪 Especificación QA: Matriz de Casos de Prueba de Estados y Tablero Kanban

**Versión:** 1.1.0  
**Fecha:** 2026-08-19  
**Módulo:** CRM Gestor de Oportunidades & Torre de Control Operativa (`GestorOportunidades.vue`, `Torre.vue`)  
**Estándar:** QA Determinista y Máquina de Estados Finita (FSM Relacional) con Divulgación Progresiva  

---

## 🎯 1. Objetivo y Alcance

Esta especificación formaliza la batería de pruebas de aceptación y regresión para garantizar la consistencia absoluta, inmutabilidad y reactividad en el ciclo de vida de los proyectos (`tpry_proyecto`).

Erradica los estados basura, variables intermedias no sincronizadas en JSON (`subtab_activa`, `asignacionConfirmada`, `patio_programado`) y números mágicos en frontend (`ESTADOS_PROCESO = { COTIZACION: 10, ... }`), fijando la base de datos PostgreSQL (`tpry_proyecto.id_proyecto_estado`) como la **Única Fuente de Verdad**.

---

## 🏛️ 2. Matriz Canónica de Estados y Correspondencia Kanban

| `id_proyecto_estado` | Nombre de Estado Oficial | Columna Kanban (`Torre.vue`) | Pestaña Activa en Gestor | Condición Comercial |
| :---: | :--- | :--- | :--- | :---: |
| **1** | `OPORTUNIDAD` | Columna 1: Requerimiento Registrado | `1. Preventa Comercial` | ✅ 100% Editable |
| **2** | `COTIZANDO` | Columna 1: Requerimiento Registrado | `1. Preventa Comercial` | ✅ 100% Editable |
| **3** | `VALIDACION_DIFF` | Columna 2: En Verificación Operaciones | `2. Validación & Diff` | 🔒 Solo Lectura |
| **4** | `ASIGNACION_RECURSOS` | Columna 3: En Asignación Recursos | `3. Asignación de Recursos OT` | 🔒 Solo Lectura |
| **5** | `PREPARACION_PATIO` | Columna 4: En Preparación Operaciones | `5. Preparación Salida & Patio` | 🔒 Solo Lectura |
| **6** | `DESPLAZAMIENTO` | Columna 5: En Ruta / Desplazamiento | `Operaciones (Ruta)` | 🔒 Solo Lectura |
| **7** | `EN_FAENA` | Columna 5: En Faena / Maniobras | `Operaciones (Faena)` | 🔒 Solo Lectura |
| **8** | `COMPLETADO` | Columna 6: Completados / Cerrados | `Cierre Operacional` | 🔒 Solo Lectura |
| **99** | `NO_GANADA` | Cajón: No Asignadas / Perdidas | Histórico | 🔒 Solo Lectura |

---

## 🧪 3. Protocolo Detallado de Casos de Prueba (CP-01 a CP-07)

### 📌 CP-01: Creación y Edición Comercial en Estados 1 y 2 (Preventa)
* **Objetivo:** Asegurar que los proyectos en estado inicial sean 100% editables y se clasifiquen en la Columna 1.
* **Pre-condición:** Abrir una oportunidad existente en estado 1 o 2 (ej: `GSP-2608-557-032`).
* **Pasos de Ejecución:**
  1. Abrir el proyecto en el Gestor de Oportunidades.
  2. Verificar que la pestaña activa sea **`1. Preventa Comercial`**.
  3. Modificar: agregar/eliminar un equipo cotizado, cambiar una tarifa, modificar pensiones y notas de faena.
  4. Presionar **`💾 Guardar en Preventa`** o **`Generar Cotización`**.
* **Criterios de Aceptación (Aserciones):**
  * `tpry_proyecto.id_proyecto_estado` permanece en `1` o `2`.
  * Ningún `<fieldset>` está bloqueado (`disabled = false`).
  * En `Torre.vue`, la tarjeta se ubica en **Columna 1: Requerimiento Registrado**.
  * Todos los cambios en tarifas y equipos se persisten correctamente en la BD.

---

### 📌 CP-02: Transición Comercial $\rightarrow$ Operaciones (Generar Requerimiento: 2 $\rightarrow$ 3)
* **Objetivo:** Validar el paso formal de Preventa a la etapa de Validación y Auditoría Diff.
* **Pre-condición:** Proyecto en estado 2 con cotización guardada.
* **Pasos de Ejecución:**
  1. En el Gestor, presionar el botón ámbar **`🚀 Generar Requerimiento`**.
  2. Seleccionar exigencias de acreditación en el modal y confirmar.
* **Criterios de Aceptación (Aserciones):**
  * `tpry_proyecto.id_proyecto_estado` se actualiza en BD a `3`.
  * La vista activa automáticamente la pestaña **`2. Validación & Diff`** (`operacionesSubTab = 'validacion'`).
  * El formulario de la pestaña Comercial pasa a **Solo Lectura** (`fieldset :disabled="true"`).
  * En `Torre.vue`, la tarjeta se mueve automáticamente de la Columna 1 a la **Columna 2: En Verificación Operaciones**.

---

### 📌 CP-03: Transición Validación $\rightarrow$ Asignación OT (3 $\rightarrow$ 4)
* **Objetivo:** Validar la aprobación técnica del requerimiento y la habilitación de asignación de flota.
* **Pre-condición:** Proyecto en estado 3 (`operacionesSubTab = 'validacion'`).
* **Pasos de Ejecución:**
  1. El Coordinador de Operaciones revisa el Diff técnico.
  2. Presiona **`✅ Aprobar Requerimiento & Habilitar Asignación OT`**.
* **Criterios de Aceptación (Aserciones):**
  * `tpry_proyecto.id_proyecto_estado` en BD se actualiza a `4`.
  * La vista pasa a **`3. Asignación de Recursos OT`** (`operacionesSubTab = 'asignacion'`).
  * Se habilitan los dropdowns de selección de Grúa Principal, Operadores y Riggers.
  * En `Torre.vue`, la tarjeta se mueve a la **Columna 3: En Asignación Recursos**.

---

### 📌 CP-04: Transición Asignación OT $\rightarrow$ Preparación de Salida / Patio (4 $\rightarrow$ 5)
* **Objetivo:** Validar la confirmación de la asignación y paso a logística de patio y acreditaciones.
* **Pre-condición:** Proyecto en estado 4 con grúa y tripulación seleccionada.
* **Pasos de Ejecución:**
  1. Presionar **`🚀 Confirmar Asignación OT ➔ Preparación Salida`**.
* **Criterios de Aceptación (Aserciones):**
  * `tpry_proyecto.id_proyecto_estado` se actualiza en BD a `5`.
  * La vista avanza a la pestaña **`5. Preparación Salida & Patio`** (`operacionesSubTab = 'preparacion_salida'`).
  * Se habilitan las tarjetas de inspección de patio (Template 76) con los datos precargados.
  * En `Torre.vue`, la tarjeta se mueve a la **Columna 4: En Preparación Operaciones**.

---

### 📌 CP-05: El Caso Crítico: "Devolver a Comercial" (Estados 3, 4 o 5 $\rightarrow$ Estado 2)
* **Objetivo:** Verificar que un proyecto en Operaciones pueda devolverse a Preventa Comercial quedando **100% editable de forma inmediata**.
* **Pre-condición:** Proyecto en estado 3, 4 o 5 (ej: `GSP-2608-557-032`).
* **Pasos de Ejecución:**
  1. En el Gestor, presionar el botón morado **`⏪ Devolver a Comercial`**.
  2. Confirmar el diálogo de retorno.
* **Criterios de Aceptación (Aserciones):**
  * `tpry_proyecto.id_proyecto_estado` en base de datos pasa a `2` (`COTIZANDO`).
  * La pantalla se abre inmediatamente en **`1. Preventa Comercial`** (`topTab = 'comercial'`).
  * Todos los `<fieldset>` comerciales se desbloquean: los inputs de equipos, tarifas y antecedentes son **100% editables**.
  * En `Torre.vue`, la tarjeta regresa inmediatamente a la **Columna 1: Requerimiento Registrado**.

---

### 📌 CP-06: Descarte / No Ganada (Estado 1 o 2 $\rightarrow$ Estado 99)
* **Objetivo:** Comprobar la desestimación limpia de una cotización sin corromper el estado de operaciones.
* **Pre-condición:** Proyecto en estado 1 o 2.
* **Pasos de Ejecución:**
  1. Presionar **`🔴 No Ganada`**, ingresar el motivo de pérdida y guardar.
* **Criterios de Aceptación (Aserciones):**
  * `tpry_proyecto.id_proyecto_estado` pasa a `99` (o estado formal de desestimación).
  * La tarjeta sale de la Columna 1 y se lista en el cajón de **No Asignadas / Perdidas**.

---

### 📌 CP-07: Invarianza y Resiliencia del Tablero Kanban (`Torre.vue`)
* **Objetivo:** Demostrar que el tablero es 100% determinista y no depende de JSONs volátiles.
* **Pre-condición:** Múltiples proyectos en base de datos en estados 1 a 8.
* **Pasos de Ejecución:**
  1. Abrir la Torre de Control y refrescar con `Ctrl + F5`.
  2. Verificar la distribución de tarjetas en las 6 columnas.
* **Criterios de Aceptación (Aserciones):**
  * **Cero duplicados:** Ninguna tarjeta aparece en más de una columna a la vez.
  * **Cero desapariciones:** Ningún proyecto con estado válido queda huérfano o invisible.
  * **Suma exacta:** El contador superior de cada columna coincide con el número real de registros en base de datos (`COUNT(*)` por estado).

---

### 📌 CP-08: Bloqueo de Navegación hacia Adelante ($> N$) y Candados Progresivos
* **Objetivo:** Verificar que un usuario en estado $N$ NO pueda saltar ni acceder a ninguna etapa $> N$.
* **Pre-condición:** Proyecto en Estado 1 o 2 (Preventa).
* **Pasos de Ejecución:**
  1. Abrir el proyecto en el Gestor.
  2. Intentar hacer clic en los botones del Stepper: **`2. Validación & Diff`**, **`3. Asignación Recursos OT`**, **`4. Acreditaciones`** y **`5. Preparación Salida`**.
  3. Ejecutar la acción **`Generar Requerimiento`** para pasar a Estado 3.
  4. Desde Estado 3, intentar hacer clic en **`3. Asignación Recursos OT`** y **`5. Preparación Salida`**.
* **Criterios de Aceptación (Aserciones):**
  * En Estado 1 o 2, todas las pestañas de Operaciones muestran candado 🔒 y están deshabilitadas (`:disabled="true"`, `opacity-40 cursor-not-allowed`). El clic es bloqueado.
  * En Estado 3, únicamente la pestaña **`2. Validación & Diff`** está desbloqueada; **`3. Asignación`** y **`5. Salida`** permanecen bloqueadas con candado 🔒.
  * Cualquier intento de llamada programática a `cambiarYPersistirSubTab('asignacion')` es rechazado con alerta de etapa bloqueada.

---

### 📌 CP-09: Edición Exclusiva en Estado Activo ($= N$) e Inmutabilidad hacia Atrás ($< N$)
* **Objetivo:** Verificar que solo en la etapa $N$ los inputs sean editables, y que al navegar a cualquier etapa $< N$ todos los formularios estén en modo solo lectura con banner informativo.
* **Pre-condición:** Proyecto en Estado 4 (`ASIGNACION_RECURSOS`).
* **Pasos de Ejecución:**
  1. Verificar que en la pestaña **`3. Asignación Recursos OT`** los selectores de Grúa, Operador y Rigger sean editables.
  2. Hacer clic en la pestaña **`1. Preventa Comercial`** (etapa $< 4$).
  3. Verificar el estado de los inputs de cliente, equipos, tarifas y notas en Preventa Comercial.
  4. Hacer clic en la subpestaña **`2. Validación & Diff`** (etapa $< 4$).
  5. Verificar el estado de los campos de auditoría Diff y observaciones.
* **Criterios de Aceptación (Aserciones):**
  * En Preventa Comercial, se despliega el banner superior: `🔒 Etapa Comercial Concluida (Modo Solo Lectura)`.
  * Todos los inputs, selectores y tablas en Preventa Comercial están bloqueados (`disabled`). No se puede guardar ni alterar precios.
  * En Validación & Diff, se despliega el banner: `🔒 Etapa Concluida y Aprobada (Solo Lectura)`.
  * El botón `Aprobar Requerimiento` ya no está visible (la etapa ya fue convalidada).
  * La única forma de alterar Preventa es presionar **`Devolver a Preventa Comercial`** (mutación por excepción con auditoría).

---

## 📋 4. Registro de Ejecución y Trazabilidad

| ID Caso | Estado Inicial | Evento Gatillado | Estado Final Esperado | Regla FSM Validada | Estado QA |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **CP-01** | `1 / 2` | Edición y Guardado Preventa | `1 / 2` (Columna 1) | Edición en Estado Activo ($= N$) | ⏳ PENDIENTE |
| **CP-02** | `2` | Generar Requerimiento | `3` (Columna 2) | Transición Formal $N \rightarrow N+1$ | ⏳ PENDIENTE |
| **CP-03** | `3` | Aprobar Requerimiento | `4` (Columna 3) | Transición Formal $N \rightarrow N+1$ | ⏳ PENDIENTE |
| **CP-04** | `4` | Confirmar Asignación OT | `5` (Columna 4) | Transición Formal $N \rightarrow N+1$ | ⏳ PENDIENTE |
| **CP-05** | `3, 4, 5` | Devolver a Comercial | `2` (Columna 1, Editable) | Retroceso por Excepción ($N \rightarrow 2$) | ⏳ PENDIENTE |
| **CP-06** | `1, 2` | Marcar No Ganada | `99` (No Asignadas) | Desestimación Comercial | ⏳ PENDIENTE |
| **CP-07** | `1..8` | Carga e Invarianza Kanban | Distribución 100% 1 a 1 | Consistencia BD vs Kanban | ⏳ PENDIENTE |
| **CP-08** | `1..5` | Clic en Etapas Posteriores | Acceso Denegado (Candado) | Bloqueo Progresivo ($> N$) | ⏳ PENDIENTE |
| **CP-09** | `3..5` | Navegación a Etapas Anteriores | Modo Solo Lectura + Banner | Inmutabilidad ($< N$) | ⏳ PENDIENTE |
