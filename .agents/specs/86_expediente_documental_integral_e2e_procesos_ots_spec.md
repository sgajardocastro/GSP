# 📋 SPEC-086: Expediente Documental Integral E2E de Procesos y OTs en Gestor Documental (7 Etapas)

## 📌 Metadatos y Control de Versión
* **Código de Especificación:** `SPEC-086`
* **Requerimiento Primario:** `REQ-1057`
* **Módulos Afectados:**
  * Frontend Web CRM: `Documentos.vue`.
  * Backend API: `src/controllers/expedienteDocumentalController.js`, `src/routes/expedienteDocumentalRoutes.js`, `src/routes/index.js`.
  * Base de Datos: Vistas / consultas sobre `tpry_proyecto`, `tits_transicion_historial`, `tedp_estado_pago`, `tequ_log_desplazamiento`, `tequ_log_desplazamiento_costo`, `tope_acta_plataforma`, `tedp_reporte_avance`, `tsrv_survey_ticket`.
* **Participantes Reunión de Alineación:** Sergio Gajardo & Antigravity (17-Oct-2026).
* **Estado:** `PROPUESTO PARA APROBACIÓN`

---

## 1. OBJETIVO DEL NEGOCIO
Garantizar la visibilidad, auditoría y trazabilidad documental del 100% de los archivos generados a lo largo del ciclo de vida de un servicio u Orden de Trabajo (OT) de Grúas San Pablo en el **Gestor Documental Dimensional** (`Documentos.vue`).

Actualmente, la Dimensión 4 ("Clientes & Procesos Comerciales OTs") solo expone una porción fragmentada de documentos (contrato y actas relacionales si están cargadas), omitiendo etapas críticas como ITS, EDP, Hojas de Ruta, Vouchers Copec y unificando tardíamente los Reports Diarios.

Esta especificación norma la consolidación del **Expediente Documental Integral E2E**, estructurado en 7 etapas cronológicas obligatorias por cada OT.

---

## 2. ARQUITECTURA DEL EXPEDIENTE DOCUMENTAL (7 ETAPAS OBLIGATORIAS)

Cada OT registrada en el sistema agrupará de manera determinista los documentos en 7 sub-carpetas o categorías lógicas:

```
OT-[ID]: [Nombre del Proyecto / Faena]
│
├── 📁 1. Preventa & Comercial
│   ├── 📄 Cotización Comercial Vigente (PDF)
│   ├── 📄 Cotizaciones Comerciales Históricas (v1, v2, v3... PDF)
│   └── 📄 Ficha Técnica de Visita a Terreno (PDF Survey Template 80)
│
├── 📁 2. Contratación & Formalización
│   ├── 📄 Contrato de Arrendamiento de Maquinaria (Firmado FES / Borrador PDF)
│   ├── 📄 Contratos Históricos / Anexos (PDF)
│   └── 📄 Orden de Trabajo Formal (OT v1, v2... PDF)
│
├── 📁 3. Logística, Despacho y Traslados
│   ├── 📄 Hoja de Despacho / Salida de Base (Odómetro, Horómetro, Combustible y PIN)
│   ├── 📄 Comprobantes / Vouchers Copec en Ruta (Fotos de Vouchers y Rendiciones)
│   └── 📄 Hoja de Retorno / Llegada a Patio Central (Cierre de Trayecto)
│
├── 📁 4. Operaciones Plataformas BSM (Si aplica al servicio)
│   ├── 📄 Acta de Entrega 360° en Obra (PDF con fotos y firma supervisor mandante)
│   └── 📄 Acta de Retiro 360° en Obra (PDF con fotos y checklist devolución)
│
├── 📁 5. Operación en Faena (Izaje)
│   ├── 📄 Report Diario de Izaje - Día 1 (PDF con horómetros, standby y firma táctil)
│   ├── 📄 Report Diario de Izaje - Día 2 (PDF...)
│   └── 📄 ... (Todos los días correlativos de faena)
│
├── 📁 6. Cierre Técnico & Desmovilización
│   └── 📄 Inspección Técnica de Salida (ITS) (PDF emitido desde tits_transicion_historial)
│
└── 📁 7. Liquidación, EDP y Facturación
    ├── 📄 Carátula de Estado de Pago (EDP) (PDF pre-facturación y horas liquidadas)
    ├── 📄 Orden de Compra (OC) Mandante (Archivo adjunto de respaldo)
    └── 📄 Factura Electrónica / DTE (Documento Tributario Electrónico adjunto)
```

---

## 3. ESPECIFICACIÓN DEL BACKEND API

Para mantener una respuesta ultra-rápida en el frontend (< 150ms) sin sobrecargar la memoria de Vite ni requerir 8 llamadas HTTP distintas por cada proyecto, se implementa un endpoint canónico dedicado:

### Endpoint: `GET /api/operaciones/expediente-documental/:id_proyecto`
* **Controlador:** `src/controllers/expedienteDocumentalController.js`
* **Seguridad:** Requiere Bearer Token con rol de visualización documental (`_ADMIN`, `_PROG`, `_EJEC`, `_APROB`).
* **Respuesta JSON:**
```json
{
  "success": true,
  "id_proyecto": 111,
  "codi_proyecto": "OT-111",
  "nombre_proyecto": "Montaje Estructuras Los Bronces",
  "cliente": "ANGLO AMERICAN SUR S.A.",
  "total_documentos": 9,
  "expediente": {
    "etapa_1_preventa": [
      {
        "id_doc": 401,
        "name": "OT-111-Cotizacion-v1.pdf",
        "tipo": "Cotización Comercial",
        "url": "/api/archivo/ver/401",
        "fecha": "2026-10-10",
        "emisor": "Área Comercial GSP",
        "estado_vigencia": "VIGENTE"
      }
    ],
    "etapa_2_contratacion": [
      {
        "id_doc": 405,
        "name": "OT-111-Contrato-Firmado-FES.pdf",
        "tipo": "Contrato de Arrendamiento (Firmado FES)",
        "url": "/api/archivo/ver/405",
        "fecha": "2026-10-12",
        "emisor": "Firmado por: Juan Mandante",
        "estado_vigencia": "VIGENTE"
      }
    ],
    "etapa_3_logistica": [
      {
        "id_doc": null,
        "name": "Comprobante-Salida-Patio.pdf",
        "tipo": "Hoja de Ruta (Salida)",
        "url": "/api/operaciones/viaje/vj-111/pdf",
        "fecha": "2026-10-14",
        "emisor": "Chofer: Carlos Gómez"
      }
    ],
    "etapa_4_plataformas": [],
    "etapa_5_faena": [
      {
        "id_doc": 420,
        "name": "Report-Diario-Dia-1.pdf",
        "tipo": "Report Diario Izaje (Día 1)",
        "url": "/api/archivo/ver/420",
        "fecha": "2026-10-15",
        "emisor": "Operador: Robert"
      }
    ],
    "etapa_6_cierre_tecnico": [
      {
        "id_doc": 435,
        "name": "ITS-OT-111-Informe-Salida.pdf",
        "tipo": "Inspección Técnica de Salida (ITS)",
        "url": "/api/archivo/ver/435",
        "fecha": "2026-10-16",
        "emisor": "Inspector Técnico GSP"
      }
    ],
    "etapa_7_facturacion": [
      {
        "id_doc": null,
        "name": "Caratula-EDP-OT-111.pdf",
        "tipo": "Carátula Estado de Pago (EDP)",
        "url": "/api/operaciones/edp/proyecto/111/pdf",
        "fecha": "2026-10-17",
        "emisor": "PMO / Finanzas GSP"
      }
    ]
  }
}
```

---

## 4. ESPECIFICACIÓN DEL FRONTEND (`Documentos.vue`)

1. **Sub-Árbol Jerárquico por OT:**
   Al expandir una OT en la Dimensión 4 (`dim-procesos`), el nodo no presentará una lista plana y desordenada, sino las subcarpetas temáticas de las 7 etapas que contengan documentos.
2. **Badge Contador de Expediente:**
   Cada OT exhibirá un badge que resume la completitud documental (ej: `📋 8 Docs • 5 Etapas`).
3. **Carga Reactiva Bajo Demanda (Lazy Loading Inteligente):**
   Al hacer clic en la OT, se consulta el endpoint del expediente documental y se almacena en caché en el `Map` reactivo `expedientesCache`, garantizando cero impacto en la carga inicial de la página.
4. **Visualizador Rápido y Descarga Directa:**
   Todos los documentos del expediente contarán con acción de apertura inmediata en el visor modal (`ModalVisorReport` o visor PDF universal) y botón de descarga directa.

---

## 5. PLAN DE VALIDACIÓN DETERMINISTA (QA HARD GATE)

1. **Validación de Integridad de Datos:**
   Comprobar que una OT con ciclo completo (ej. OT 16 o Proyecto 111) devuelva con éxito documentos en sus etapas correspondientes sin generar valores `null` o links rotos.
2. **Smoke Test de Endpoints:**
   Verificar que `GET /api/operaciones/expediente-documental/:id_proyecto` responda con **HTTP 200 OK** y tiempo de respuesta inferior a 250ms.
3. **Verificación de Cero Errores en Build:**
   Ejecutar `npm run build` en Web para verificar 0 fallos de Vite y 0 regresiones.
