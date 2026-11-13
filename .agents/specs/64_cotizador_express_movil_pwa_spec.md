# 📱 Especificación Técnica 64: Cotizador Express Móvil en PWA (Mobile Quotation Generator)

**Código de Requerimiento:** `REQ-994`  
**Estado:** `CANÓNICO VIGENTE`  
**Autor:** Sergio Gajardo / Antigravity Agent  
**Fecha:** 06 de Octubre de 2026  
**Versión:** 1.1.0  
**Impacto Arquitectónico:** PWA (`ejecucion/pwa`), Backend GSP (`ejecucion/backend_remoto`), Base de Datos PostgreSQL (`sch_leangsp` / `sch_leangsp_prod`).

---

## 1. 📌 Resumen Ejecutivo y Caso de Uso de Terreno

Actualmente, la plataforma cuenta con un robusto motor comercial y estructurador de tarifas en la consola de escritorio ([GestorOportunidades.vue](file:///D:/SGajardo/Google%20Drive/Antigravity/Grúas%20San%20Pablo/Propuesta%20Gestión%20Operación%20Grúas/ejecucion/frontend/src/views/Comercial/GestorOportunidades.vue)). No obstante, cuando los ejecutivos comerciales, supervisores de maniobra o el Director se encuentran en terreno (visitando obras mineras, puertos, o reuniones imprevistas con mandantes), la experiencia de escritorio es impráctica en pantallas móviles.

El objetivo de esta especificación es crear el módulo **Cotizador Express Móvil** dentro de la PWA que permita cotizar un servicio de grúa móvil telescópica o camión pluma en **60 segundos** y despacharlo de inmediato al WhatsApp del cliente mandante como un documento PDF formal con la validez estricta de 5 días hábiles.

---

## 2. 🏛️ Invariante de Simetría Estructural (tpry_proyecto + json_field.crm_v1)

> **Regla de Oro Arquitectónica:** La cotización creada desde la aplicación móvil **DEBE ser 100% simétrica y compatible** con la base de datos relacional y el motor web de escritorio. No se permiten esquemas aislados o simplistas en la base de datos.
>
> Al ingresar una cotización express desde el teléfono:
> 1. Se crea un registro en `tpry_proyecto` con correlativo formal generado vía `generarCodigoTransaccional()` (ej: `GSP-2610-4671-003`).
> 2. Se inyecta `json_field.crm_v1` conteniendo el arreglo canónico `lineas_servicio` idéntico al generado por el Gestor Web.
> 3. Se compila el documento PDF oficial mediante el generador canónico de GSP (`generarCotizacionVersion`), registrando el archivo en el storage engine y en `crm_v1.cotizaciones_historicas`.
> 4. La oportunidad queda en `id_proyecto_estado = 2` (Cotización Enviada), haciéndose inmediatamente visible en la Torre de Control ([Torre.vue](file:///D:/SGajardo/Google%20Drive/Antigravity/Grúas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/ejecucion/frontend/src/views/Torre.vue)) y completamente editable en el CRM de escritorio ([GestorOportunidades.vue](file:///D:/SGajardo/Google%20Drive/Antigravity/Grúas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/ejecucion/frontend/src/views/CRM/GestorOportunidades.vue)).

---

## 3. 🔄 Diagrama del Flujo E2E (Patrón Fachada y Normalizador Canónico)

```
  ┌────────────────────────────────────────────────────────┐
  │         📱 APP MÓVIL PWA (CotizadorExpress.vue)         │
  │  Paso 1: Mandante & Faena (20 seg)                     │
  │  Paso 2: Equipo, Días, Horas mínimas & Flete (25 seg)  │
  │  Paso 3: Total Neto, IVA & Despacho (15 seg)           │
  └───────────────────────────┬────────────────────────────┘
                              │
                              │ POST /api/comercial/express/cotizar
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │         ⚙️ BACKEND NORMALIZADOR CANÓNICO                │
  │  1. Resuelve cliente o crea prospecto provisional       │
  │  2. Genera codi_proyecto (GSP-YYMM-CLIENT-XXX)         │
  │  3. Ensambla crm_v1.lineas_servicio formal             │
  │  4. Inyecta 6 condiciones comerciales + 5 días validez  │
  │  5. Compila PDF oficial (generarCotizacionVersion)     │
  │  6. Persiste en tpry_proyecto con id_proyecto_estado = 2│
  │  7. Construye enlace de WhatsApp (https://wa.me/...)   │
  └───────────────────────────┬────────────────────────────┘
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
  ┌─────────────────────────┐   ┌─────────────────────────┐
  │  📱 PWA SALIDA ÉXITO    │   │  🖥️ GESTOR WEB CRM      │
  │  • [ 💬 Enviar WhatsApp]│   │  • Visible en Kanban    │
  │  • [ 📄 Ver PDF Oficial]│   │  • Grilla lineas lista  │
  │  • Tarjeta Resumen      │   │  • PDF V1 en Historial  │
  └─────────────────────────┘   └─────────────────────────┘
```

---

## 4. 🚜 Catálogo Canónico Rápido de Equipos y Tarifas de Referencia

Para permitir cotizaciones en 60 segundos sin latencia, el backend expone un catálogo agrupado de flota con tarifas diarias de referencia (piso estándar de 9 horas):

### 4.1. Grúas Telescópicas (Móviles Industriales AT/RT)
| Tonelaje / Modelo | Capacidad | Horas Mínimas | Tarifa Diaria Ref. (CLP) |
| :--- | :--- | :--- | :--- |
| **Grúa 40 TON** (Liebherr LTM 1040) | 40 Ton | 9 hrs | \$950.000 |
| **Grúa 50 TON** (Liebherr LTM 1050 / Tadano ATF 50) | 50 Ton | 9 hrs | \$1.200.000 |
| **Grúa 70 TON** (Liebherr LTM 1070 / XCMG XCT70) | 70 Ton | 9 hrs | \$1.650.000 |
| **Grúa 100 TON** (Liebherr LTM 1100 / Tadano ATF 100 / XCMG) | 100 Ton | 9 hrs | \$2.400.000 |
| **Grúa 150 TON** (Liebherr LTM 1150) | 150 Ton | 9 hrs | \$3.400.000 |
| **Grúa 220 TON** (Liebherr LTM 1220) | 220 Ton | 9 hrs | \$4.800.000 |
| **Grúa 250 TON** (XCMG XCA250) | 250 Ton | 9 hrs | \$5.500.000 |

### 4.2. Camiones Pluma
| Capacidad | Horas Mínimas | Tarifa Diaria Ref. (CLP) |
| :--- | :--- | :--- |
| **Camión Pluma 10-12 TON** (Tremac / Internacional) | 9 hrs | \$420.000 |
| **Camión Pluma 15-18 TON** (Mercedes / VW Constellation) | 9 hrs | \$540.000 |
| **Camión Pluma 20-25 TON** (Volvo FH / Scania) | 9 hrs | \$680.000 |

### 4.3. Traslados (Movilización / Desmovilización)
- **Flete Estándar Ida y Vuelta:** \$450.000 (editable en UI).

*Nota: Todas las tarifas sugeridas son auto-pobladas pero 100% editables por el comercial antes de confirmar.*

---

## 5. 🖥️ Experiencia de Usuario Móvil (Componente CotizadorExpress.vue)

### Paso 1: Mandante y Localización (20 segundos)
- **Selector Predictivo de Cliente:**
  - Input con búsqueda en tiempo real sobre `/api/empresas?search=...`.
  - Al seleccionar, auto-completa Razón Social, RUT y Contacto habitual.
- **Acceso `+ Prospecto Rápido`:**
  - Si el cliente no está en la base, permite digitar Nombre/Razón Social, Nombre Contacto y Celular WhatsApp en 3 campos.
- **Faena / Obra:** Nombre de la Faena o Comuna (ej. "Minera Centinela", "Planta Celulosa Arauco", "Temuco").

### Paso 2: Configuración del Servicio (25 segundos)
- **Selector de Familia:** Segmented control táctil `[ Grúas Telescópicas ]` `[ Camiones Pluma ]`.
- **Chips de Capacidad:** Botonera táctil de selección rápida (40t, 50t, 70t, 100t, 150t, 220t, 250t).
- **Parámetros de Turno:**
  - **Días de Servicio:** Stepper numérico táctil grande `[-] 1 [+]` días.
  - **Piso Mínimo:** Botones `[ 8 hrs ]` `[ 9 hrs (Estándar) ]` `[ 10 hrs ]`.
  - **Tarifa Diaria:** Campo numérico con valor sugerido editable.
- **Traslado:** Switch `[X] Incluye Traslado (Movilización Ida/Vuelta)` con valor estimado \$450.000 editable.

### Paso 3: Resumen Financiero y Emisión (15 segundos)
- **Tarjeta de Desglose en Vivo:**
  - Subtotal Equipos: \$ X.XXX.XXX
  - Subtotal Traslado: \$ XXX.XXX
  - **Total Neto:** \$ X.XXX.XXX
  - IVA (19%): \$ XXX.XXX
  - **Total General:** \$ X.XXX.XXX
- **Condición Inviolable:** Badge informativo `Validez de la oferta: 5 días hábiles`.
- **Botón Maestro:** `[ ⚡ Emitir Cotización Oficial GSP ]`.

### Pantalla de Éxito y Despacho Inmediato
- Indicador verde de éxito: `✅ Cotización GSP-2610-XXXX-003 Generada`.
- Botón principal de ancho completo verde WhatsApp:
  `[ 💬 Enviar Cotización por WhatsApp al Mandante ]`
  (Abre WhatsApp con mensaje pre-redactado y enlace directo de descarga al PDF oficial).
- Botón secundario: `[ 📄 Previsualizar PDF Oficial ]`.
- Enlace: `[ ➕ Nueva Cotización ]` y `[ 🏠 Volver al Inicio ]`.

---

## 6. 🔌 Endpoints Backend Requeridos

### 6.1. `GET /api/comercial/express/catalogo`
Retorna la matriz de equipos y tarifas sugeridas para alimentar los selectores móviles.

### 6.2. `POST /api/comercial/express/cotizar`
* **Payload de Entrada:**
```json
{
  "id_empresa_emisora": 9,
  "cliente": {
    "id_empresa": 42,
    "nombre": "Constructora Besalco S.A.",
    "rut": "96.543.210-K",
    "contacto_nombre": "Carlos Ruiz",
    "telefono": "+56912345678",
    "email": "cruiz@besalco.cl",
    "obra_nombre": "Parque Eólico San Gabriel",
    "obra_comuna": "Renaico"
  },
  "servicio": {
    "tipo_equipo": "GRUA_TELESCOPICA",
    "tonelaje": "100 TON",
    "dias_servicio": 3,
    "horas_minimas_dia": 9,
    "tarifa_dia": 2400000,
    "incluye_traslado": true,
    "valor_traslado": 450000,
    "fecha_estimada_inicio": "2026-10-10"
  },
  "condiciones": {
    "moneda": "CLP",
    "validez_dias": 5,
    "cliente_pone_combustible": false,
    "condicion_servicio": "programado"
  }
}
```

* **Respuesta Exitosa (201 Created):**
```json
{
  "success": true,
  "id_proyecto": 105,
  "codi_proyecto": "GSP-2610-0042-005",
  "pdf_url": "/api/archivo/ver/892",
  "whatsapp_share_link": "https://wa.me/56912345678?text=Estimado%2Fa...",
  "cotizacion": {
    "id_cotizacion": 892,
    "version": 1,
    "nombre_archivo": "GSP-2610-0042-005V1-892.pdf",
    "monto": 7650000,
    "url": "/api/archivo/ver/892"
  }
}
```

---

## 7. 🧪 Criterios de Aceptación (QA & BDD)

| ID | Escenario de Prueba | Criterio de Aceptación |
| :--- | :--- | :--- |
| **QA-64-01** | Búsqueda predictiva de cliente | Al teclear 3 letras en el selector de mandante, sugiere clientes de `tpar_empresas` con su contacto. |
| **QA-64-02** | Registro de prospecto rápido | Si el cliente no existe, permite ingresarlo con nombre y WhatsApp sin exigir RUT obligatorio de inmediato. |
| **QA-64-03** | Cálculo reactivo de totales | Al cambiar el stepper de días o alternar el switch de traslado, el Neto, IVA y Total se actualizan instantáneamente en pantalla. |
| **QA-64-04** | Simetría estructural con Gestor Web | La cotización creada en móvil se abre en `GestorOportunidades.vue` mostrando `lineas_servicio` pobladas, contacto y totales sin arrojar errores en consola. |
| **QA-64-05** | Emisión y almacenamiento de PDF oficial | El archivo PDF se compila con membrete oficial de GSP (Omar Ghisellini E.I.R.L.), tabla de ítems, 6 cláusulas legales y queda visible en `cotizaciones_historicas`. |
| **QA-64-06** | Despacho por WhatsApp | El botón de WhatsApp abre la aplicación de mensajería con el número del contacto y el enlace directo al PDF generado. |
