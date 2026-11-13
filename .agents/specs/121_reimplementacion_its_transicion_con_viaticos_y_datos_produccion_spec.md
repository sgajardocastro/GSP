# SPEC-121 / REQ-1135: Reimplementación Integral Formato Oficial de Transición ITS con Datos de Producción, 10 Puntos de Costos, Historial de Rechazos y Editabilidad Operacional

---

## 1. Identificación y Estado

- **Código Requerimiento:** `REQ-1135`
- **Código Especificación:** `SPEC-121`
- **Fecha:** 2026-11-09
- **Fuente de Entrada:** Minuta Oficial y Transcripción Reunión Jorge Ponce & Sergio Gajardo (09-Nov-2026 11:00 CLT — [Ver Transcripción](https://docs.google.com/document/d/1cVumipDG7XlQ117mWDhJIwrrKifqO-5dZFhfSUqMY24/edit?tab=t.r526nmlp2ks2))
- **Autor / Arquitectura:** Sergio Gajardo / LeanGlobal Platform
- **Stakeholders Clave:** Jorge Ponce (Gerente General), Yiara Mendoza (Analista PMO), Jonathan Castillo (Operaciones), Marita (Contabilidad)
- **Ambientes:** Desarrollo (`DEV`) y Producción (`PROD`)
- **Impacto Backend:** `ejecucion/backend_remoto/src/services/itsPdfService.js`, `ejecucion/backend_remoto/src/controllers/itsController.js`
- **Impacto Frontend Web:** `ejecucion/frontend/src/components/Operaciones/ModalITS.vue`, `ejecucion/frontend/src/views/ItsTransicionView.vue`
- **Estado:** `ESPECIFICACIÓN FORMAL INTEGRAL APROBADA`

---

## 2. Antecedentes y Casos de Negocio

1. **Urgencia de Facturación (Caso Ferrocarriles / Marita):**
   Contabilidad requiere emitir la facturación de forma urgente. El documento revisado en Temuco (San Pablo) presentó faltantes de datos comerciales y discrepancias de criterios en el resumen de costos y control horario.

2. **Revisión del Rechazo Operacional (Jonathan Castillo a Yiara Mendoza):**
   Jonathan Castillo rechazó y devolvió el documento a Yiara debido a que el sistema registró un tiempo de colación incorrecto de 60 minutos (cuando en realidad era 0 o menor). Yiara fue notificada por correo y corrigió el registro. El documento requiere evidenciar de forma transparente el historial cronológico de este rechazo y su posterior reproceso sin perder los sellos de aprobación finales.

3. **Aclaración Canónica del Resumen de Costos (Los 10 Puntos Conceptuales):**
   *Jorge Ponce aclaró formalmente la regla de visualización en la reunión:*
   - En las tablas de detalle específico (anexos o partidas de egresos), solo se desglosan las transacciones reales.
   - **En el Cuadro Resumen Consolidado de Costos Operacionales (Apartado B / Resumen Ejecutivo): DEBEN MOSTRARSE OBLIGATORIAMENTE LOS 10 PUNTOS CONCEPTUALES**, incluso si su valor es **\$0**, garantizando que Contabilidad y Gerencia verifiquen que todas las partidas fueron auditadas y ninguna quedó fuera.

---

## 3. Matriz de Requerimientos Técnicos y Operacionales

### 3.1. Cuadro Resumen de Costos Operacionales (Los 10 Puntos Conceptuales en PDF y Web)
El resumen ejecutivo de costos del ITS debe desplegar invariablemente la lista completa de las 10 categorías maestras:
1. `1. Viáticos de Alimentación Terreno`
2. `2. Peajes y TAG de Ruta`
3. `3. Combustibles (Grúa / Vehículos Apoyo)`
4. `4. Pensiones y Alojamiento Faena`
5. `5. Movilización y Traslados Terreno`
6. `6. Personal Externo y Riggers`
7. `7. Feriados y Domingos Operados`
8. `8. Subcontratación Flete Externo (Ramplas / Camas Bajas)`
9. `9. Gastos Extraordinarios de Faena`
10. `10. Costo Valor Hora Operador (Horas Report)`

* **Regla de Cero:** Si un concepto tiene \$0 devengado, se muestra con `$0` (o `0% s/ Venta`), manteniendo la integridad estructural del cuadro de 10 líneas para revisión contable.

---

### 3.2. Diferenciación de Lógica Urbana vs. Rural y Columna `HRS VIÁTICOS`
En la Sección 2 (Control de Flota y Conciliación de Horas):
1. **Régimen Comercial:**
   - Si `tipo_contexto === 'URBANO'`: `HRS SERVICIO` se calcula desde **Salida de Planta** hasta **Término en Obra** menos **Colación**.
   - Si `tipo_contexto === 'RURAL'`: `HRS SERVICIO` se calcula desde **Llegada a Obra** hasta **Término en Obra** menos **Colación**.
2. **Nueva Columna Obligatoria `HRS VIÁTICOS`:**
   - Independiente del régimen urbano o rural, computa el tiempo universal puerta a puerta:
     $$\text{HRS VIÁTICOS} = (\text{Retorno a Planta} - \text{Salida de Planta}) - \text{Colación}$$
   - Se despliega entre `HRS SERVICIO` y `HRS REPORT`.
3. **Escala Tabular de Viático:**
   - Menos de 8 hrs efectivas: **\$0**.
   - 8 hrs: **\$7.000**.
   - Horas adicionales: **+\$1.000** por hora extra (Tope \$18.000). Aplica a Operador y Rigger.

---

### 3.3. Trazabilidad de Firmas e Historial de Rechazos (FES)
En la Sección 5 del documento y en la vista web:
1. **Sellos Superiores de Cierre Oficial:**
   - Se mantienen los 3 sellos institucionales de aprobación: Elaborado por Analista (Yiara), Verificado por Administrador de Operaciones (Jonathan / Jorge) y Aprobado por Contabilidad (Marita).
2. **Bloque Inferior de Trazabilidad e Historial de Rechazos:**
   - Debajo de los sellos de aprobación, se incorpora la tabla de auditoría cronológica:
     - `Fecha y Hora`
     - `Usuario y Rol` (ej. "Jonathan Castillo — Administrador de Operaciones")
     - `Acción` (ej. "❌ Rechazo y Devolución a Elaboración" / "✍️ Firma Aprobatoria FES")
     - `Motivo / Observación Registrada` (ej. *"Se devuelve documento por tiempo de colación incorrecto registrado en 60 minutos. Corregir según report real."*)
     - `IP / Hash FES`

---

### 3.4. Editabilidad Total en Cockpit PMO (`ModalITS.vue`)
Para evitar bloqueos y trabas operativas a Yiara Mendoza durante la creación y ajuste de un ITS:
1. **Campos Editables en Caliente:**
   - Habilitar edición de texto libre (glosas, conceptos, descripciones, detalles de ruta, proveedores) en todas las pestañas de egresos:
     - **Viáticos de Alimentación:** glosa y monto editable.
     - **Hora Operador:** edición de horas a pagar, horas flete y valor hora.
     - **Movilización y Traslados:** vehículo, chofer, ruta y monto.
     - **Peajes y TAG:** patente, caseta/concesionaria, detalle y monto.
     - **Pensiones y Alojamiento:** establecimiento, personal alojado, número de noches y valor.
2. **Preservación de Cambios:** Todo cambio manual en el modal se persiste con indicador `modificado_por: 'Yara'` y recálculo dinámico automático de totales sin bloquear la interfaz.

---

### 3.5. Completitud de Datos Comerciales e Identidad
En la Ficha del Servicio Integral (Sección 1) y Encabezado del PDF:
- **Logo San Pablo:** En esquina superior izquierda en Base64.
- **Ejecutivo Comercial:** Nombre completo del vendedor (Wilson Navarrete / Ejecutivo asignado).
- **Fechas de Servicio:** Rango claro `Desde DD/MM/AAAA Hasta DD/MM/AAAA`.
- **Horas Mínimas y Tarifa:** Identificación explícita en tabla de equipos (ej. `9 HORAS DIARIAS` a `$120.000/hr` o tarifa contratada).
- **Tipo de Servicio:** Arriendo por Hora / Jornada / Mensual claramente especificado.

---

## 4. Plan de Implementación por Fases

| Fase | Componente | Alcance Técnico |
| :---: | :--- | :--- |
| **Fase 1** | `itsPdfService.js` | Incorporar cuadro de los 10 puntos con $0, columnas `HRS VIÁTICOS` y tabla de historial de rechazos en Sección 5. |
| **Fase 2** | `itsController.js` | Exponer historial de rechazos (`tflw_movimiento` / `tits_log_rechazo`) y soporte de lógica urbana vs rural. |
| **Fase 3** | `ModalITS.vue` | Desbloquear edición en caliente de glosas y montos de las 5 categorías de costos para Yiara. |
| **Fase 4** | QA & Verificación | Validación con Caso OT 30 y Caso Ferrocarriles (Marita/Contabilidad). |
