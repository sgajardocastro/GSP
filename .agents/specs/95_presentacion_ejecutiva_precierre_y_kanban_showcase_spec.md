# SPEC-095: Presentación Ejecutiva de Precierre de Proyecto & Kanban Showcase Interactivo con Documentos Reales de Producción

> **Spec N°**: 95  
> **Módulos**: Showcase Ejecutivo Web (`ejecucion/frontend/public/presentacion_precierre_ejecutivo_gsp.html`), Centro de Documentación (`centro_documentacion_gsp.html`)  
> **Sistema**: Grúas San Pablo (GSP) / LeanGlobal Platform  
> **Esquemas DB**: `sch_leangsp_prod` (PROD) & `sch_leangsp` (DEV)  
> **Estado**: APROBADO PARA IMPLEMENTACIÓN  
> **Fecha**: 2026-10-22  

---

## 1. Propósito y Contexto Ejecutivo

Con motivo de la reunión directiva de precierre de proyecto de hoy **22 de octubre de 2026 a las 18:00 hrs** con **Omar Ghiselini** (Dueño de Grúas San Pablo) y **Jorge Ponce** (Gerente General), se requiere una pieza visual e interactiva de estándar **Broadcast / Keynote / LinkedIn Marketing Grade** que cumpla tres objetivos estratégicos:

1. **Contextualizar el Alcance Original vs. Lo Ejecutado y Adelantado:**
   - Demostrar que el **100% del Ciclo Core de Operación de Grúas y Plataformas** (Comercial, Verificación/Gerencia, Asignación OT y Acreditación 4D, Despacho/Telemetría, Ejecución en Terreno con Reports Diarios FES, e Informe de Término ITS + Estado de Pago EDP) se encuentra **operativo en Producción**.
   - Evidenciar que los módulos originalmente planificados para el **Mes 5** (**Inventario WMS Enterprise, Mantenimiento de Taller y Compras/OCs Multi-Empresa con visación móvil**) fueron **adelantados y ya están desplegados y operando en Producción** (incluyendo el cierre real en vivo de la OT `#8` `MNT-2610-004` en Taller Temuco y las `2.854` existencias sincronizadas por `$83,5M+ CLP`).
   - Establecer con nitidez la **Frontera de Cierre Final**:
     * **Pendiente de Última Milla:** Integración de Facturación DTE utilizando **Odoo** (conectando el cierre `ITS + EDP + OC` con la emisión y almacenamiento automático de la factura) y el ajuste final de comentarios de Prevención (Dayana) sobre los templates de AST Simple y Plan de Izaje.
     * **Fuera de Alcance / Desacoplado:** No movilizar al área de Contabilidad General (Libro Diario, Mayor, Balance 8 Columnas) hacia la plataforma, manteniendo la frontera en la integración de facturación con **Odoo**.

2. **Presentar un Tablero Kanban Operativo de Diseño Artístico ("Broadcast / Marketing Grade"):**
   - Un tablero Kanban interactivo con estética **Industrial Luxury Dark UI**, animaciones fluidas, iluminación ambiental, indicadores en tiempo real y tarjetas de negocios reales de Producción (`GSP-2610-233-004` Tensacon / Planta Ferrero, `GSP-2610-766-003` Finning Chile S.A., `GSP-2610-4671-002` Altumaq, `BMQ-2610-4851-001` Plataformas).
   - Al hacer clic en cada etapa del Kanban, se despliega un **Visor Cinematográfico de Evidencia Real** que muestra y abre **los PDFs y registros reales emitidos en Producción**:
     1. **Etapa 1 · Comercial & Preventa:** Abre el PDF real de la **Cotización Comercial** (`GSP-2610-233-004V2-8.pdf`, `GSP-2610-766-003V2-6.pdf`, `GSP-2610-4671-002V1-4.pdf`) y el PDF real del **Contrato Legal de Arriendo de Plataforma (3 Páginas)**.
     2. **Etapa 2 · Verificación & V°B° Gerencia:** Paso ejecutivo ágil (mención rápida del comparador comercial-operativo y Web Token móvil estilo *RindeGastos* para Omar).
     3. **Etapa 3 · Asignación de Recursos (Orden de Trabajo):** Abre el PDF oficial real de la **Orden de Trabajo (OT)** (`OT-GSP-2610-233-004V1-2.pdf` / `OT-GSP-2610-4671-002V1-1.pdf`) con la grúa Liebherr, patente, operador y rigger asignados.
     4. **Etapa 4 · Despacho & Registro de Viaje:** Muestra la **Hoja de Ruta y Telemetría Real de Desplazamiento** (Salida de Base Temuco, Odómetro/Horómetro, nivel de combustible, fotografías reales de tablero y ruta GPS) + **Actas 360° de Entrega/Retiro de Plataformas (PDF)**.
     5. **Etapa 5 · Ejecución en Faena (Reports Diarios):** Muestra y abre los **Reports Diarios Digitales Reales** firmados en terreno (jornadas de Robert Rodríguez en Planta Ferrero / Finning con horómetros, horas efectivas, standby y firma táctil FES del supervisor mandante).
     6. **Etapa 6 · Control de Gestión (ITS ➔ Estado de Pago EDP ➔ Facturación Odoo):** Abre el PDF real del **Informe de Término de Servicio (ITS)** (cruce de Ingresos vs. Costos Reales y Utilidad Bruta) y la **Carátula Oficial del Estado de Pago (EDP)** lista para disparar la facturación en **Odoo**.

3. **Exhibir en 30 Segundos el Hito Adelantado del Mes 5 (Taller Temuco, Inventario WMS y Compras OC):**
   - Vista ejecutiva con la evidencia real de la **OT `#8` (`MNT-2610-004` — Grúa Liebherr LTM-1400 `CHGC.99-4`)** cerrada en Producción con Leonel Vergara y los 9 técnicos de foso, el descuento atómico en Pañol Temuco (`Kardex #10`) y el circuito de Órdenes de Compra por las 4 Razones Sociales con aprobación móvil de Omar.

---

## 2. Arquitectura Visual y Técnica

* **Archivo Fuente:** `ejecucion/frontend/public/presentacion_precierre_ejecutivo_gsp.html`
* **Rutas Públicas Desplegadas:**
  * Producción: `https://servidor.leanglobal.cl/lg-gsp-prod/presentacion_precierre_ejecutivo_gsp.html`
  * Desarrollo: `https://servidor.leanglobal.cl/lg-gsp-dev/presentacion_precierre_ejecutivo_gsp.html`
* **Repositorio Estático de PDFs Reales (`showcase_docs/`):**
  * Se copian los archivos PDF reales desde `/u05/LeanDocs/GSP/` hacia `/var/www/html/lg-gsp-prod/showcase_docs/` y `/var/www/html/lg-gsp-dev/showcase_docs/` para garantizar carga instantánea (`< 50ms`) dentro del visor `<iframe>` integrado y en pestaña nueva, sin depender de sesiones de login durante la presentación.
