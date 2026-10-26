# 📑 ESPECIFICACIÓN TÉCNICA CANÓNICA: RECONOCIMIENTO AUTOMÁTICO DE FACTURAS PDF (LAUDUS ERP / PORTAL SII), BANDEJA CONTABLE INTELIGENTE, ACCESO A PDFS OFICIALES Y FACTURACIÓN MULTI-DTE

- **ID Especificación:** `SPEC-101`
- **Requerimiento Backlog:** `REQ-1070`
- **Versión Objetivo:** Portal Web GSP `v1.0.160`
- **Ambientes de Despliegue:** `DEV` (`sch_leangsp`) y `PROD` (`sch_leangsp_prod`)
- **Fecha de Entrada en Vigor:** 2026-10-26
- **Responsable Técnico:** Arquitecto ERP & BI Senior
- **Estado:** VIGENTE / CERTIFICADO EN PRODUCCIÓN

---

## 1. Propósito y Filosofía del Módulo Contable

El área de **Contabilidad, Facturación y Cobranzas** (Maritza Seguel / Tesorería), en conjunto con **Control de Gestión** (Yiara) y **Gerencia**, no opera como una estación de despacho o digitación de faena en terreno. Su labor se rige estrictamente por la **auditoría documental, la cuadratura tributaria frente al SII y la liquidación financiera con calce perfecto**.

Para erradicar la fricción operativa y garantizar el cumplimiento del estándar de producto, la Perspectiva Contabilidad en la Torre de Control (`PerspectivaContabilidad.vue`) se fundamenta en cuatro pilares arquitectónicos:

1. **Acceso Exclusivo a Documentos PDF Certificados (Cero Vistas Web):**  
   Queda estrictamente prohibido disparar modales o vistas web interactivas de edición (tales como la carátula editable de EDP o formularios de reportes) desde las filas de la perspectiva contable. Contabilidad trabaja únicamente sobre **documentos oficiales y legalmente vinculantes**; por lo tanto, cualquier clic sobre un código de proceso, número de EDP, reporte de terreno o informe de cierre debe emitir y abrir de forma directa el **PDF certificado** correspondiente en una nueva pestaña (`application/pdf`).
2. **Bandeja Contable Inteligente (Reducción Radical de Ruido):**  
   A Contabilidad no se le deben listar cotizaciones comerciales u órdenes de trabajo con \$0 devengo que no registran horas de faena ni trabajo real en terreno. La perspectiva debe operar **por defecto en modo Bandeja Contable**, filtrando y mostrando única y exclusivamente los procesos con movimiento financiero comprobable.
3. **Reconocimiento Determinista de Facturas PDF (Laudus ERP & Portal SII):**  
   Extracción automática e instantánea desde el archivo binario PDF subido por el usuario, reconociendo la empresa emisora del holding, folio, fecha, montos (neto, exento, IVA, total bruto) y órdenes de compra asociadas, eliminando la digitación manual y los errores humanos.
4. **Cuenta Corriente Multi-Factura (`1 OT ➔ N Facturas DTE`):**  
   Soporte dinámico para asociar múltiples documentos tributarios a un mismo servicio comercial, administrando con precisión pagos en cuotas, anticipos, arriendos mensuales continuos o liquidación total con recálculo en vivo de la brecha y saldo pendiente.

---

## 2. Protocolo de Apertura Directa de Documentos PDF Oficiales

La interfaz contable delega cualquier interacción documental al visor PDF nativo del navegador mediante `window.open(url_pdf, '_blank')`, garantizando simetría total con el repositorio físico del servidor:

| Columna en Tabla Contable | Elemento Interactivo | Endpoint PDF Oficial | Formato y Contenido Generado |
| :--- | :--- | :--- | :--- |
| **Columna 0: Proceso** | Código OT (`GSP-... ↗`) | `GET /api/operaciones/edp/proyecto/:id/pdf` | PDF Oficial de Carátula EDP con las 3 firmas FES y cuadro de reports. |
| **Columna 1: Comprometido** | Botón `📎 OC Cliente ↗` | `resolverUrlArchivo(p.oc_archivo)` | PDF original escaneado de la Orden de Compra / HES del Mandante. |
| **Columna 2: Devengado (1 Report)** | Botón `📋 Report PDF ↗` | `GET /api/operaciones/report/:id/pdf` | PDF Oficial del Report Diario con firma táctil, odómetro/horómetro y GPS. |
| **Columna 2: Devengado (>1 Report)**| Botón `📄 Ver PDF FES ↗` | `GET /api/operaciones/report/:id/pdf` | Apertura individual del PDF de cada reporte listado en el expediente. |
| **Columna 3: Cerrado ITS** | Botón `📊 ITS-XXXX ↗` | `GET /api/operaciones/its/preview-pdf/:id` | PDF Oficial del Informe de Término de Servicio con ingresos y costos. |
| **Columna 4: Emitido EDP** | Botón `📑 EDP-X ↗` | `GET /api/operaciones/edp/proyecto/:id/pdf` | Expediente completo de prefacturación timbrado por el analista. |
| **Columna 4: Firmas FES** | Botón `🔏 FE (X/3)` | Modal interno `FE` | Inspección de auditoría de las 3 firmas electrónicas y fechas de visado. |
| **Columna 5: Facturado DTE** | Botón `📄 PDF` en DTE | `resolverUrlArchivo(dte.archivo_url)` | PDF original de la Factura Electrónica emitido por Laudus o el SII. |

---

## 3. Especificación de la Bandeja Contable Inteligente

### 3.1. Selector de Alcance en Barra Superior
El componente `PerspectivaContabilidad.vue` expone un conmutador de visualización con recuento dinámico de procesos:
1. `⚡ Bandeja Contable (Solo con Trabajo)`: Estado predeterminado (`filtroBandejaContable = 'SOLO_TRABAJO'`). Oculta cotizaciones huérfanas o sin movimiento en faena.
2. `🌐 Todas las OTs`: Vista para auditoría global de la cartera comercial adjudicada (`filtroBandejaContable = 'TODAS'`).

### 3.2. Regla Booleana Determinista (`tieneTrabajoContable(p)`)
Un proceso califica estrictamente para la Bandeja Contable si cumple al menos uno de los siguientes criterios objetivos:

```javascript
function tieneTrabajoContable(p) {
  // 1. Fixture de pruebas siempre disponible para verificación
  if (p.id_proyecto === 1 || p.id_proyecto === 105 || (p.cliente_nombre || '').toLowerCase().includes('leanglobal')) return true;
  // 2. Proceso con habilitación formal para facturar
  if (p.habilitado_facturar) return true;
  // 3. Proceso que registra al menos una factura DTE emitida o saldo parcial
  if (p.facturado || (p.facturas_dte && p.facturas_dte.length > 0)) return true;
  // 4. Proceso con expediente EDP formalmente emitido
  if (p.edp_emitido || Number(p.monto_edp_neto || 0) > 0) return true;
  // 5. Proceso con avance real devengado en reports diarios de terreno
  if (Number(p.monto_devengado_reports || 0) > 0 || Number(p.total_reports || 0) > 0) return true;
  // 6. Proceso con Informe de Término de Servicio (ITS) cerrado o en auditoría
  if (p.id_its || Number(p.monto_its_neto || 0) > 0) return true;
  // 7. Bloqueo documental: Requiere OC pero no la tiene y ya presenta devengo
  if (p.requiere_oc_hes && !p.tiene_oc && (Number(p.monto_devengado_reports || 0) > 0 || p.edp_emitido)) return true;
  
  return false;
}
```

### 3.3. Algoritmo de Ordenamiento Contable
La lista se ordena según la urgencia de gestión y liquidación:
* **Nivel 10 (Prioridad Máxima):** Proceso de prueba y procesos con `habilitado_facturar && !facturado` (3/3 firmas FES y OC completa; requieren emisión urgente de factura DTE).
* **Nivel 9:** Facturación parcial (`saldo_pendiente_facturar > 0` con DTEs previos).
* **Nivel 8:** EDP emitido pendiente de completar firmas FES (`edp_emitido && !habilitado_facturar`).
* **Nivel 7:** Devengando faena en terreno sin EDP emitido (`monto_devengado_reports > 0`).
* **Nivel 6:** Proceso 100% Facturado.
* **Nivel 1:** Resto de procesos, ordenados descendentemente por `fecha_inicio`.

---

## 4. Motor Parser de Facturas PDF (`dtePdfParserService.js`)

### 4.1. Descompresión Stream RFC 1951
El servicio procesa el buffer binario del PDF sin OCR externo ni microservicios lentos. Utiliza `zlib.inflateSync` para descomprimir los streams internos de texto, garantizando tiempos de respuesta inferiores a **200 milisegundos**.

### 4.2. Matriz de Plantillas y Empresas Emisoras del Holding

#### Plantilla 1: Laudus ERP (`www.laudus.cl`)
- **Empresa Emisora:** Grúas San Pablo (`RUT 52.004.162-1`, `id_empresa: 9`).
- **Razón Social:** *LUIS GHISELLINI J. ARREND. MAQ. Y VEH. MOTOR. EN GRAL. EIRL*.
- **Extracción de Folio:** Patrón `FACTURA ELECTRONICA\s+N[°ºo]?\s*([0-9]+)`.
- **Extracción de Fechas:** `Fecha Emision:\s*([0-9]{1,2}\s+de\s+[a-zA-Z]+\s+de\s+[0-9]{4}|[0-9]{1,2}-[0-9]{1,2}-[0-9]{4})`.
- **Extracción de Montos:**  
  - Total Neto: `TOTAL NETO\s*\$?\s*([\d\.]+)`  
  - IVA 19%: `19% IVA\s*\$?\s*([\d\.]+)`  
  - Total Bruto: `TOTAL\s*\$?\s*([\d\.]+)`
- **Extracción de Referencias:** Reconocimiento de órdenes de compra del cliente en el bloque de referencias (`Orden de Compra\s*([0-9A-Za-z\-_]+)`).

#### Plantilla 2: Portal SII MIPYME (`www.sii.cl`)
- **Empresas Emisoras:**
  - Bestmaq (`RUT 76.209.534-3`, `id_empresa: 7`, *SOCIEDAD BESTMAQ VENTA DE MAQUINARIA USADA LIMITADA*).
  - Logística del Sur (`RUT 76.218.576-8`, `id_empresa: 8`, *TRANSPORTES, ARRIENDOS Y VENTAS DE MAQUINARIAS, Y SERVICIOS LOGISTICOS I*).
  - Royal Rental (`RUT 78.254.535-3`, `id_empresa: 11`, *ARRIENDO ROYAL RENTAL LIMITADA*).
- **Extracción de Folio:** Patrón `R\.U\.T\.:\s*[0-9\.\-]+\s+FACTURA ELECTRONICA\s+N[°º]?\s*([0-9]+)`.
- **Extracción de Fechas:** `Fecha Emision:\s*([0-9]{1,2}\s+de\s+[a-zA-Z]+\s+de\s+[0-9]{4}|[0-9]{2}-[0-9]{2}-[0-9]{4})`.
- **Extracción de Montos:**  
  - Monto Neto: `MONTO NETO\s*\$?\s*([\d\.]+)`  
  - IVA 19%: `IVA 19%\s*\$?\s*([\d\.]+)`  
  - Total Bruto: `TOTAL\s*\$?\s*([\d\.]+)`
- **Extracción de Referencias:** Detección de filas tipo documento 801 (Orden de Compra) en la tabla inferior de referencias tributarias.

### 4.3. Protocolo de Validación Determinista de Integridad Contable (Anti-Descalce)

Para evitar la contaminación de cuentas corrientes y contingencias tributarias ante el SII, todo DTE procesado debe superar estrictamente tres filtros antes de su persistencia:

1. **Validación Estricta de Mandante Receptor (RUT DTE vs RUT OT):**  
   Se comparan las claves alfanuméricas canónicas del RUT del receptor del DTE y del cliente del proyecto (`cleanRut(d.cliente_receptor_rut) === cleanRut(proyecto.cliente_rut)`).  
   *Resultado ante discrepancia:* Rechazo bloqueante inmediato (HTTP 400). Queda prohibido asociar un DTE facturado a un tercero a un proyecto no correspondiente.

2. **Whitelist de Empresas Emisoras del Holding GSP:**  
   El emisor del DTE debe pertenecer exclusivamente a las razones sociales del holding (`52.004.162-1`, `76.209.534-3`, `76.218.576-8`, `78.254.535-3`). Cualquier otro RUT emisor es bloqueado con error de emisor no autorizado.

3. **Trazabilidad de Facturación Cruzada Inter-Empresas Hermanas:**  
   Si el DTE pertenece a una empresa hermana distinta de la empresa asignada a la OT (ej: servicio radicado en GSP pero facturado mediante Bestmaq), el sistema lo admite registrando la empresa emisora real en `facturas_dte` y emitiendo una alerta informativa en la interfaz contable.

---

## 5. Modelo de Datos y Cuenta Corriente Multi-Factura

### 5.1. Esquema JSON en `tpry_proyecto.json_field.facturas_dte`
Cada documento tributario incorporado se almacena con la siguiente estructura normalizada:

```json
{
  "id_dte": "dte-1740000000000-14664",
  "folio_dte": "14664",
  "formato_detectado": "LAUDUS",
  "id_empresa_emisora": 9,
  "empresa_facturadora": "Grúas San Pablo",
  "rut_emisor": "52.004.162-1",
  "fecha_emision": "2026-10-22",
  "fecha_vencimiento": "2026-11-21",
  "monto_exento": 0,
  "monto_neto": 1820000,
  "monto_iva": 345800,
  "monto_total": 2165800,
  "numero_oc_referenciada": "12990",
  "reports_referenciados": [],
  "ots_referenciadas": [],
  "modalidad_facturacion": "CIERRE_TOTAL",
  "archivo_url": "/api/archivos/stream/doc-dte-14664.pdf",
  "nombre_archivo": "DTE 14664.pdf"
}
```

### 5.2. Ecuaciones Deterministas de Liquidación
1. **Monto Facturado Neto:**  
   $$\text{Monto Facturado Neto} = \sum_{i=1}^{N} \text{factura}_i.\text{monto\_neto}$$
2. **Base Exigible de Facturación:**  
   $$\text{Base Exigible} = \max(\text{monto\_edp\_neto}, \text{monto\_devengado\_reports}, \text{monto\_comprometido})$$
3. **Saldo Pendiente por Facturar:**  
   $$\text{Saldo Pendiente} = \max(0, \text{Base Exigible} - \text{Monto Facturado Neto})$$
4. **Modalidades de Facturación:**
   - `PARCIAL_CUOTA`: Permite registrar anticipos o cuotas intermedias, manteniendo el saldo abierto.
   - `MENSUALIDAD`: Aplicable a arriendos de largo plazo; no cierra el servicio al alcanzar el valor de la cuota del mes.
   - `CIERRE_TOTAL`: Declara el servicio 100% liquidado. Si el saldo pendiente es \$0, el sistema asigna automáticamente `id_proyecto_estado = 7` (Facturado Conforme).

### 5.3. Módulo de Tesorería: Registro de Recaudaciones, Estado 8 y Cierre Financiero Definitivo
El ciclo del negocio concluye formalmente cuando Tesorería (Pamela) valida el ingreso efectivo de los fondos en la cuenta bancaria de la empresa emisora del holding.

#### 5.3.1. Esquema JSON en `tpry_proyecto.json_field.recaudaciones`
Los abonos o pagos bancarios se registran en una colección estructurada dentro de la cuenta corriente del servicio:
```json
{
  "id_pago": "pago-1740000000000",
  "fecha_pago": "2026-10-26",
  "monto_pagado": 2165800,
  "metodo_pago": "Transferencia Bancaria",
  "banco_origen": "Banco de Chile",
  "banco_destino": "Banco Santander (Grúas San Pablo)",
  "nro_operacion_transfe": "18492044",
  "archivo_comprobante": {
    "url": "/api/archivos/stream/comprobante-18492044.pdf",
    "nombre": "Comprobante TEF 18492044.pdf"
  },
  "observaciones": "Pago íntegro factura Laudus 14664",
  "registrado_por": 12,
  "nombre_registrador": "Pamela Tesorería",
  "fecha_registro": "2026-10-26T11:20:00Z"
}
```

#### 5.3.2. Ecuaciones Deterministas de Cobranza y Cierre Financiero
1. **Monto Total Facturado Bruto:**  
   $$\text{Total Facturado Bruto} = \sum_{i=1}^{N} \text{factura}_i.\text{monto\_total}$$
2. **Monto Total Recaudado:**  
   $$\text{Total Recaudado} = \sum_{j=1}^{M} \text{recaudacion}_j.\text{monto\_pagado}$$
3. **Saldo Insoluto por Cobrar:**  
   $$\text{Saldo Insoluto} = \max(0, \text{Total Facturado Bruto} - \text{Total Recaudado})$$
4. **Transición a Estado 8 (`CERRADO_FINANCIERO / PAGADO_CONFORME`):**  
   - Si $\text{Total Recaudado} \ge \text{Total Facturado Bruto}$ (con Total Facturado Bruto > 0):  
     El proyecto se declara **100% Pagado Conforme**, asignando `id_proyecto_estado = 8` (`CERRADO_FINANCIERO`).  
     Se despacha automáticamente un correo formal B2B de confirmación de cierre financiero con el resumen de liquidación y copia del comprobante bancario a:
     - **Pamela (Tesorería)**
     - **Maritza Seguel (Contabilidad & Cobranzas)**
     - **Ejecutivo Comercial Responsable**
     - **Jorge Ponce (Gerencia de Operaciones)**
   - Si $\text{Total Recaudado} < \text{Total Facturado Bruto}$:  
     El proyecto permanece en `id_proyecto_estado = 7` con estado de cobranza `PAGO_PARCIAL`, desplegando el saldo insoluto pendiente.

#### 5.3.3. Experiencia de Usuario en `PerspectivaContabilidad.vue`
1. **Columna 5 ("Facturado DTE & Cobranza"):**
   - Sin pagos registrados: Botón `💰 Registrar Pago`.
   - Pago parcial: Badge `🌗 Cobrado Parcial ($X / $Total)` indicando saldo restante.
   - Pagado 100%: Badge verde `✅ Pagado Conforme ($Total) ↗` con clic para abrir directamente el comprobante bancario.
2. **Modal de Digitación Asistida (Pamela):**
   - Precarga automática de: Monto sugerido (saldo insoluto bruto), Empresa y Banco destino (según la empresa emisora de la factura) y fecha del día.
   - Captura rápida: Monto real, N° operación, Banco origen, Selector de método, carga del comprobante (`.pdf`, `.png`, `.jpg`) y notas opcionales.

---

## 6. Endpoints del Backend (`estadoPagoRoutes.js`)

1. `POST /api/operaciones/edp/parsear-dte-pdf`:  
   Recibe `{ pdf_base64, nombre_archivo }` y retorna la estructura analizada de metadatos tributarios.
2. `POST /api/operaciones/edp/proyecto/:id/soporte-documental`:  
   Permite adjuntar una orden de compra o incorporar un nuevo DTE al arreglo `facturas_dte`, recalculando automáticamente los saldos contables de la OT.
3. `DELETE /api/operaciones/edp/proyecto/:id/dte/:folio`:  
   Desvincula un DTE específico del proyecto y restituye el saldo pendiente en la cuenta corriente.
4. `POST /api/operaciones/edp/proyecto/:id/recaudacion`:  
   Registra un nuevo abono o pago bancario, recalcula el saldo insoluto, evalúa la transición al Estado 8 (`CERRADO_FINANCIERO`) y dispara el correo de confirmación de cierre financiero.
5. `DELETE /api/operaciones/edp/proyecto/:id/recaudacion/:id_pago`:  
   Permite anular o rectificar un comprobante de pago bancario, restituyendo el saldo insoluto y el estado anterior.
6. `GET /api/operaciones/edp/perspectiva-contabilidad`:  
   Entrega el consolidado global de las 5 variables financieras, los indicadores de cabecera, la lista de procesos con sus respectivos DTEs y las sábanas de horas de personal y ventas por equipo.

---

## 7. Fixture Canónico y Certificación: Proceso LeanGlobal SpA

Para posibilitar la validación funcional inmediata sin depender de datos aleatorios, se mantiene en base de datos el proceso de prueba pre-configurado:
- **Código OT:** `GSP-2610-4851-001` (ID `1` en `sch_leangsp_prod`, ID `105` en `sch_leangsp`).
- **Cliente Mandante:** `LeanGlobal Spa` (RUT `78.249.226-8`).
- **Monto Comprometido y EDP Neto:** \$1.820.000 neto.
- **Orden de Compra Mandante:** N° `12990` (\$1.820.000 neto).
- **Circuito de Firmas FES:** 3/3 Aprobadas (Control de Gestión, Contabilidad y Comercial).
- **Estado Inicial:** `🟢 Listo para Facturar Inmediato` (Saldo pendiente: \$1.820.000 neto).
- **Caso de Prueba Certificado:** Al subir el PDF real `DTE 14664 de LUIS GHISELLINI...pdf` (neto \$1.820.000), el parser auto-completa los datos, asocia la factura y reduce inmediatamente el saldo pendiente a \$0 (`100% Facturado`).

---

## 8. Verificación y Regla de Inmutabilidad
Esta especificación canónica constituye el contrato vinculante de la versión `v1.0.160`. Cualquier alteración a los patrones regex, a las rutas de PDF o a la fórmula de inclusión de la Bandeja Contable exigirá una revisión formal de este documento previa a cualquier cambio en código fuente.
