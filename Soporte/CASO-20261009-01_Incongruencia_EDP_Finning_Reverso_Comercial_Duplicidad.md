# 🛠️ CASO-20261009-01: Incongruencia en EDP Finning (OT-3), Reverso a Preventa Comercial y Duplicidad en Kanban

---

## 1. Ficha del Incidente

| Parámetro | Detalle |
| :--- | :--- |
| **ID del Caso** | `CASO-20261009-01` |
| **Fecha / Hora** | 2026-10-09 13:54 CLT (Hora Oficial de Chile) |
| **Operador / Usuario Afectado** | Maritza Seguel (Facturación/Tesorería) / Yiara Mendoza (Jefe Operaciones) |
| **Negocio / OT** | `GSP-2610-766-003` (ID Proyecto: 3, Negocio: NEG-3) |
| **Cliente / Faena** | FINNING CHILE S.A. / Sucursal Puerto Montt |
| **Equipo Involucrado** | Grúa Telescópica Liebherr LTM-1090 (`DZXL.25-3`) |
| **Ambiente** | Producción (`PROD` - Base de datos `sch_leangsp_prod`) |
| **Severidad** | **Alta** (Inconsistencia de cálculo financiero en EDP, desvío de flujo de aprobación y duplicación de tarjetas en Kanban) |
| **Estado** | **RESUELTO OPERACIONALMENTE (REGULARIZACIÓN SQL + NOTIFICACIÓN OMNICANAL A YIARA MENDOZA)** |

---

## 2. Síntoma Reportado por Facturación / Jefatura

A través de mensaje de voz de WhatsApp recibido a las 13:54 CLT, se reportó el siguiente incidente en el cierre de la OT de Finning:
1. **Maritza Seguel (Facturación)** procedió a revisar la OT para emitir la factura.
2. Al auditar la liquidación, detectó una incongruencia en los montos: el Estado de Pago (EDP) mostraba un valor menor (**\$748.450**), mientras que el Informe de Término (ITS) y los Reports Diarios aprobados totalizaban un monto mayor (**\$800.000**).
3. Ante la discrepancia, Maritza quiso devolver el caso a **Yiara Mendoza (Operaciones)** para que cuadraran la cifra.
4. Sin embargo, en la pantalla donde se encontraba Maritza, el único botón disponible de devolución era **"Devolver a Preventa Comercial"**.
5. Al presionarlo:
   * El sistema retrocedió el proyecto directamente hasta la **Etapa 1 (Preventa Comercial)** y bloqueó los campos.
   * La tarjeta de Finning se **duplicó** en el Tablero Kanban: continuó visible en el módulo de Facturación (Columna 6) y apareció simultáneamente en el módulo Comercial (Columna 1).

---

## 3. Diagnóstico Técnico & Evidencia Empírica

### A. Auditoría Financiera en Base de Datos (`sch_leangsp_prod`)
Consulta a la tabla `sch_leangsp_prod.tits_informe_termino` (registro `id_its = 2`):
* `horas_minimas_pactadas`: **8.00 hrs**
* `valor_hora_pactado`: **\$100.000 / hr**
* `total_ingresos_facturables`: **\$800.000** (8 hrs $\times$ \$100.000)
* `total_costos_operacionales`: **\$51.550** (Combustible faena)
* `utilidad_bruta`: **\$748.450** (`800.000 - 51.550`)

**Origen de la Confusión:**
Maritza en la pantalla de liquidación visualizó el campo de **Utilidad Bruta (\$748.450)** con los costos operacionales ya deducidos, confundiéndolo con el **Total Facturable al Mandante (\$800.000)**. La carátula no diferenciaba con suficiente claridad el margen interno del monto a facturar al cliente.

### B. Causa de la Duplicación de Tarjetas en el Tablero Kanban (`Torre.vue`)
1. El botón "Devolver a Preventa Comercial" ejecutó `id_proyecto_estado = 2` en `tpry_proyecto`.
2. Sin embargo, el registro en `tits_informe_termino` permaneció en `estado_its = 'EN_REVISION_CONTABILIDAD'`.
3. En `Torre.vue`:
   * **Columna 1 (Preventa Comercial):** Filtraba por `Number(p.id_proyecto_estado) === 2`. Calificaba como `true`.
   * **Columna 6 (Finalizado / Contabilidad):** Evaluaba `esFinalizadoOperacional(p)`:
     ```javascript
     if (['EN_REVISION_CONTABILIDAD', 'CONCLUIDO'].includes(p.estado_its)) return true
     ```
     Como `estado_its` era `'EN_REVISION_CONTABILIDAD'`, también calificaba como `true`.
4. **Resultado:** La tarjeta de Finning se renderizaba en dos columnas a la vez.

---

## 4. Regularización Ejecutada en Producción

### A. Transacción SQL en PostgreSQL (`sch_leangsp_prod`)
```sql
BEGIN;
-- 1. Restituir proyecto a Operaciones (estado 5) y remover reverso indebido a comercial
UPDATE sch_leangsp_prod.tpry_proyecto
SET id_proyecto_estado = 5,
    json_field = json_field - 'reverso_cotizacion'
WHERE id_proyecto = 3;

-- 2. Devolver ITS a Operaciones (Yiara) y registrar observación formal de Maritza
UPDATE sch_leangsp_prod.tits_informe_termino
SET estado_its = 'EN_REVISION_OPERACIONES',
    observaciones = COALESCE(observaciones, '') || E'\n[09-10-2026 14:25] DEVUELTO POR CONTABILIDAD (Maritza Seguel): Revisar diferencia entre Monto Facturable ($800.000) y Utilidad Bruta ($748.450) en liquidación EDP.'
WHERE id_proyecto = 3;
COMMIT;
```

**Resultado de la Regularización:**
* La OT `GSP-2610-766-003` desapareció inmediatamente de Columna 1 (Preventa Comercial).
* Desapareció de Columna 6 (Facturación).
* Quedó formalmente posicionada en la bandeja de **Operaciones / PMO (Yiara Mendoza)** en estado `EN_REVISION_OPERACIONES` para su revisión.

### B. Despacho Inmediato de Notificación Omnicanal (Email + WhatsApp)
Se invocó el microservicio de notificaciones canónico (`notificacionService.js`):
* **WhatsApp a Yiara Mendoza (+56968320225):** Entregado conforme (ID: `3EB0A4FFD5043CAED941FE`).
* **Correo Electrónico a Yiara Mendoza (`controlflota@arriendosanpablo.cl`):** Enviado conforme vía SMTP (MessageId: `<27e7d224-1833-2c94-1bbf-4b9b495b4a19@leanglobal.cl>`).
* **Deep Link generado:** `https://servidor.leanglobal.cl/lg-gsp-prod/torre?ot=GSP-2610-766-003&subvista=pendientes_its`.

---

## 5. Medidas Preventivas y Correcciones de Software Requeridas

1. **Botón Canónico `[ ↩️ Devolver a Operaciones (Yara) ]`:**
   En la Carátula de EDP (`ModalCaratulaEDP.vue`) y en la Pestaña de Liquidación, habilitar un botón dedicado de reverso hacia Operaciones con captura obligatoria de observaciones y despacho omnicanal automático.
2. **Desacoplamiento Estricto en Kanban (`Torre.vue`):**
   Si `id_proyecto_estado === 2`, no puede evaluar positivamente en `esFinalizadoOperacional`, impidiendo la duplicación de tarjetas bajo cualquier escenario de reverso.
3. **Claridad Visual en Carátula EDP:**
   Separar con etiquetas visuales prominentes:
   * **Monto Neto a Facturar:** \$800.000 (Cifra contractual para el cliente)
   * **Costos Operacionales:** -\$51.550 (Gasto interno GSP)
   * **Utilidad Bruta Estimada:** \$748.450 (Margen interno no facturable)

---

## 6. Cierre Formal del Incidente

* **Fecha de Cierre:** 2026-10-09 14:27 CLT
* **Responsable Técnico:** Agente Antigravity / LeanGlobal QA
* **Estado:** Operacionalmente saneado en Producción, notificaciones recibidas por Yiara Mendoza. Mejoras transferidas a `Gestión/tareas.md`.
