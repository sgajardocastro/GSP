# 📐 Especificación Técnica: Dossier PDF Oficial de Estados de Pago (Spec 40)

**Documento:** `40_dossier_pdf_estado_de_pago_spec.md`  
**Ecosistema:** Grúas San Pablo (GSP) / LeanGlobal Platform  
**Fase de Dominio:** Fase 6 & 7 - Cierre Operacional, Liquidación y Facturación (`id_proyecto_estado = 6` y `7`)  
**Estado:** `ESPECIFICACIÓN FORMAL - PROPUESTA PARA APROBACIÓN`  
**Fecha:** 31 de Agosto de 2026  

---

## 1. 📌 Resumen Ejecutivo y Objetivo

El presente documento especifica la generación del **Dossier PDF Oficial de Estados de Pago (EDP)** para Grúas San Pablo.

Este documento actúa como el instrumento contractual definitivo que se entrega al mandante para la aprobación del cobro, emisión de la **Hoja de Entrada de Servicios (HES)** o liberación de la **Orden de Compra (OC)**. 

### 🎯 Principios Rectores:
1. **Documento Único y Auto-contenido:** En un solo PDF se consolida la carátula ejecutiva, el cuadro financiero de tarifas/sobretiempos/fletes, la conciliación cronológica diaria y las fichas de los Reports Diarios con las firmas manuscritas del cliente capturadas en terreno.
2. **Periodicidad Flexible a Criterio del Responsable:** El sistema soporta múltiples EDPs secuenciales por proyecto (`EDP-01`, `EDP-02`... `EDP-N`), permitiendo agrupar subconjuntos de reports validados por períodos o hitos.
3. **Cero Objeciones Contables:** Al incorporar el comprobante diario firmado con geolocalización GPS, el mandante cuenta con el respaldo inmutable de cada hora liquidada.

---

## 2. 🗄️ Modelo de Datos en PostgreSQL (`sch_leangsp`)

```sql
-- 1. Tabla de Estados de Pago Periódicos
CREATE TABLE IF NOT EXISTS sch_leangsp.tedp_estado_pago (
    id_edp BIGSERIAL PRIMARY KEY,
    id_proyecto BIGINT NOT NULL REFERENCES sch_leangsp.tpry_proyecto(id_proyecto) ON DELETE CASCADE,
    numero_edp VARCHAR(30) NOT NULL, -- ej. 'EDP-01', 'EDP-02'
    fecha_emision DATE DEFAULT CURRENT_DATE,
    fecha_corte_inicio DATE NOT NULL,
    fecha_corte_fin DATE NOT NULL,
    monto_neto NUMERIC(14, 2) NOT NULL DEFAULT 0,
    monto_iva NUMERIC(14, 2) NOT NULL DEFAULT 0,
    monto_total NUMERIC(14, 2) NOT NULL DEFAULT 0,
    estado_edp VARCHAR(30) DEFAULT 'BORRADOR', -- 'BORRADOR', 'EMITIDO_CLIENTE', 'APROBADO_HES', 'FACTURADO'
    hes_oc_numero VARCHAR(60),
    factura_numero VARCHAR(60),
    fecha_facturacion DATE,
    observaciones TEXT,
    id_user_creador INT REFERENCES sch_leangsp.tsec_users(id_user),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enlace en Reportes Diarios de Avance
-- sch_leangsp.tedp_reporte_avance.id_edp -> REFERENCES sch_leangsp.tedp_estado_pago(id_edp)
```

---

## 3. 📄 Estructura del Documento PDF A4

El PDF se genera en tamaño **A4 vertical** con márgenes de 12mm, tipografía industrial limpia (*Inter / Roboto*), y membrete corporativo:

### 3.1. Sección 1: Encabezado y Datos Generales (Página 1)
* **Membrete:** Logo Grúas San Pablo, RUT 76.849.230-1, Casa Matriz en Temuco, Teléfono comercial.
* **Título:** `ESTADO DE PAGO N° [XX] — PERÍODO [DD/MM/AAAA] AL [DD/MM/AAAA]`.
* **Identificación del Proyecto:** Código OT (`GSP-XXXX`), Nombre de Faena / Obra, Ubicación geográfica.
* **Identificación del Cliente:** Razón Social, RUT, Contacto Mandante / ITO.

### 3.2. Sección 2: Resumen Financiero Consolidado (Página 1)
* **Tabla de Cobro:**
  * Línea(s) de Grúa / Maquinaria: Horas Base Facturables × Tarifa $/hr.
  * Línea(s) de Sobretiempo: Horas Extra × Tarifa $/hr Sobretiempo.
  * Línea de Movilización / Flete (si aplica al corte).
  * Subtotal Neto, IVA (19%) y Total Bruto a Facturar.
* **Cuadro de Firmas:**
  * Firma Responsable GSP (Administrador / Operaciones).
  * Recuadro de Recepción y Conformidad Mandante (Firma / Timbre ITO).

### 3.3. Sección 3: Cuadro Cronológico de Conciliación (Página 2)
* Tabla detallada día a día con:
  * N° Día | Fecha | Equipo (Patente/Modelo) | Operador & Rigger | Horario (Inicio - Fin - Colación) | Horas Efectivas | Horas Facturables | Sobretiempo | Horómetros | Receptor Mandante.

### 3.4. Sección 4: Anexo de Respaldos de Terreno (Páginas 3+)
* Mini-fichas de cada Report Diario liquidado con:
  * Fecha y N° de Día correlativo.
  * Estampa de la Firma Canvas del Supervisor Cliente.
  * Datos del receptor (Nombre, RUT, Cargo).
  * Coordenadas GPS y timestamp de sellado.

---

## 4. 🔌 Endpoints de la API Backend

**Rutas:** `/api/operaciones/edp/*`

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/operaciones/edp/proyecto/:id_proyecto` | Lista todos los EDPs emitidos para una OT y los reports disponibles. |
| `POST` | `/api/operaciones/edp/crear` | Crea un nuevo corte de EDP vinculando los reports seleccionados. |
| `GET` | `/api/operaciones/edp/:id_edp/pdf` | Genera y descarga el Dossier PDF oficial consolidado. |
| `POST` | `/api/operaciones/edp/:id_edp/estado` | Actualiza estado (ej. `APROBADO_HES`, `FACTURADO`) con N° HES y Factura. |

---

## 5. 🧪 Criterios de Aceptación (QA)

1. **QA-40-01:** El PDF se emite en un solo archivo descargable con código HTTP 200 y `Content-Type: application/pdf`.
2. **QA-40-02:** Los cálculos matemáticos (Horas × Tarifa + Sobretiempos + Flete + IVA) son 100% exactos y coinciden con la cotización pactada.
3. **QA-40-03:** Cada report diario incluido muestra visiblemente su firma manuscrita capturada en terreno.
4. **QA-40-04:** La creación de un `EDP-01` descuenta los reports liquidados, permitiendo generar un `EDP-02` con las jornadas siguientes.
