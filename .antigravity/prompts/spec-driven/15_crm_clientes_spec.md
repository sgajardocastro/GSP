# 💼 Especificación de Módulo: Clientes & CRM e Integración Laudus ERP

Este documento define la estructura de datos, lógica de preventa (simulador de cotizaciones) e integración con el ERP chileno **Laudus** para la Consola GSP.

---

## DESCRIPCIÓN CONCEPTUAL

El módulo de **Clientes & CRM** centraliza la relación de preventa comercial y posventa de Grúas San Pablo. Proporciona una perspectiva consolidada sobre la actividad de facturación y cotizaciones de los clientes, permitiendo calificar leads operacionales, cotizar servicios complejos utilizando fórmulas estandarizadas de izaje, y conectar en tiempo real la facturación con el ERP **Laudus**. Esto elimina la duplicidad de digitación y garantiza consistencia entre la contabilidad contable y el devengado operativo diario.

---

## DESCRIPCIÓN FUNCIONAL

El módulo opera como una consola de dos columnas:
1.  **Directorio de Clientes (Panel Izquierdo):** Lista las cuentas corporativas activas y sus métricas acumuladas básicas: RUT, Razón Social, Ofertado, Asignado, Devengado y Facturado.
2.  **Expediente 360° del Cliente (Panel Derecho):** Despliega el detalle del cliente seleccionado en 4 pestañas interactivas:
    *   **Ficha General:** Información corporativa de contacto y bitácora interactiva de gestiones comerciales.
    *   **Cotizaciones (Preventa):** Historial de propuestas emitidas. Permite simular nuevas cotizaciones mediante un cotizador interactivo.
    *   **Servicios:** Listado e historial de órdenes operativas (`#SRV-XXXX`) ejecutadas para la cuenta.
    *   **Integración ERP Laudus:** Panel que simula la conexión en vivo con la API de Laudus ERP, mostrando las últimas OCs leídas y facturas conciliadas.

---

## 1. MODELO DE DATOS REACTIVO LITERAL

```javascript
const crmClientsDatabase = {
  'cmpc-celulosa': {
    id: 'cmpc-celulosa',
    rut: '90.124.000-K',
    name: 'CMPC Celulosa S.A.',
    contactName: 'Ing. Carlos Muñoz',
    contactPhone: '+56 9 8455 2100',
    contactEmail: 'carlos.munoz@cmpc.cl',
    address: 'Av. Alemania 1205, Los Ángeles',
    quotedTotal: 46800000,
    assignedTotal: 34800000,
    devengadoTotal: 36600000,
    facturadoTotal: 20000000,
    interactions: [
      { date: '28 Jun 2026', type: 'Llamada', desc: 'Cliente consulta disponibilidad de grúa de 220T para parada Planta Laja.' },
      { date: '29 Jun 2026', type: 'Reunión', desc: 'Alineación de planes de izaje y coordinación de inducciones de personal.' }
    ],
    quotes: [
      { id: 'COT-2026-009', work: 'Montaje Filtro Planta Laja', crane: 'Liebherr LTM 1120 (120T)', hours: 32, rate: 160000, mobil: 2500000, total: 7620000, status: 'Aprobada' },
      { id: 'COT-2026-012', work: 'Izaje Reactor Auxiliar', crane: 'Liebherr LTM 1220 (220T)', hours: 24, rate: 200000, mobil: 4000000, total: 8800000, status: 'En Negociación' }
    ]
  },
  'arauco-sa': {
    id: 'arauco-sa',
    rut: '93.450.000-3',
    name: 'Celulosa Arauco y Constitución S.A.',
    contactName: 'Patricia Valdés',
    contactPhone: '+56 9 9122 3443',
    contactEmail: 'patricia.valdes@arauco.cl',
    address: 'Ruta 160, Km 42, Arauco',
    quotedTotal: 18500000,
    assignedTotal: 18500000,
    devengadoTotal: 0,
    facturadoTotal: 0,
    interactions: [
      { date: '20 Jun 2026', type: 'Correo', desc: 'Envío de especificaciones técnicas de la grúa LTM 1400.' }
    ],
    quotes: [
      { id: 'COT-2026-010', work: 'Montaje Caldera Horcones', crane: 'Liebherr LTM 1400 (400T)', hours: 40, rate: 402000, mobil: 8000000, total: 24080000, status: 'Aprobada' }
    ]
  }
};
```

---

## 2. REGLAS DE CÁLCULO DE COTIZACIONES (SIMULADOR)

El simulador de cotizaciones calcula el valor total neto de la oferta mediante la siguiente fórmula:

$$\text{Monto Neto Total} = (\text{Horas Estimadas} \times \text{Tarifa Hora}) + \text{Costo de Movilización} + \text{Gastos Operacionales}$$

*   **Variables Configurables:**
    *   `hours`: Horas de operación mínimas o estimadas.
    *   `rate`: Tarifa horaria convenida según capacidad de la grúa.
    *   `mobilization`: Costo fijo de traslado (Cama Baja + Contrapesos + Escolta).
    *   `operationalCosts`: Gastos asociados a Rigger, Ingeniería de Izaje y HSEC.
*   **Margen Comercial Sugerido:** La aplicación sugiere un recargo de seguridad o comercial basado en la disponibilidad de equipos del Kanban, arrojando un semáforo de viabilidad operativa.

---

## 3. PROTOCOLO DE INTEGRACIÓN LAUDUS ERP API

*   **Autenticación:** Token Bearer generado en la configuración del ERP Laudus.
*   **Lectura de OCs:**
    *   *Endpoint:* `GET /api/laudus/purchase-orders`
    *   *Lógica:* GSP lee periódicamente las OCs aprobadas por el RUT del mandante. Si coincide el RUT y el número de cotización, asocia el número de la OC de forma automática al expediente operativo.
*   **Conciliación de Facturas:**
    *   *Endpoint:* `GET /api/laudus/invoices`
    *   *Lógica:* Al estar el EDP en estado aprobado, se genera la factura electrónica en Laudus ERP. El sistema de GSP lee el folio de la factura y su estado tributario ante el SII de manera online para cerrar el ciclo financiero a facturado.
