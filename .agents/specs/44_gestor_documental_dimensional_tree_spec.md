# 📐 Especificación Spec-Driven: Gestor Documental Dimensional Multi-Eje (GSP)

> **Identificador:** SPEC-44  
> **Módulo:** Core / Consola Web Frontend (`ejecucion/frontend/src/views/Documentos.vue`)  
> **Aplica a:** Ecosistema Grúas San Pablo (Consola Web B2B & PWA)  
> **Estado:** 🟢 Implementado y Verificado (100% Datos y Documentos Reales en BD)  
> **Fecha de Actualización:** 2026-09-07  

---

## 📌 1. Visión y Propósito

El **Gestor Documental Dimensional Multi-Eje** de Grúas San Pablo (`/documentos`) unifica todo el patrimonio documental de la compañía en una sola vista jerárquica de árbol sin fragmentación.

El principio fundacional del diseño es:
1. **Un documento físico (`tfmg_file`) vive una sola vez** en el servidor de almacenamiento, pero el usuario puede acceder a él desde la dimensión de negocio en la que esté operando.
2. **Cero Mocks y Cero Documentos Inventados:** Todos los archivos mostrados provienen de registros reales con sus llaves foráneas (`id_doc`) apuntando al endpoint oficial de entrega de archivos binarios `https://servidor.leanglobal.cl/lg-gsp/api/archivo/ver/:id_doc`.
3. **Árbol Unificado en 1 Sola Columna:** Sin divisiones artificiales de 2 columnas ni grillas laterales desproporcionadas. La jerarquía completa se despliega verticalmente ocupando el 100% del ancho útil.

---

## 🏛️ 2. Arquitectura de Navegación y Jerarquía Visual

La interfaz se estructura en un árbol colapsable de 3 a 4 niveles con semáforos compactos inmediatos:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  GESTOR DOCUMENTAL DIMENSIONAL — GRÚAS SAN PABLO                                                       │
│  [ 🏛️ TODAS ]  [ 🏛️ EMPRESA ]  [ 🚜 FLOTA Y EQUIPOS ]  [ 👷 PERSONAS ]  [ 🏢 CLIENTES Y PROCESOS ]     │
│  [ 🔍 Filtrar por equipo, persona, OT o documento... ]  [ 🟢 Vigentes | 🟡 Por Vencer | 🔴 Vencidos ▾ ]  │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ ▾ 🚜 2. Dimensión Flota y Equipos                                      🟢 280  🟡 6  🔴 3  [110 Equipos]│
│   ▾ 🚛 GRÚAS TELESCÓPICAS                                               🟢 145  🟡 2  🔴 1  [24 unidades]│
│     ▾ 🚚 BGDF.90-4 • LIEBHERR LTM-1220                                  🟢 6   🟡 1  🔴 0   [7 docs]     │
│       ├── 📕 Permiso de Circulación 2026.pdf       (Municipal)   🟢 Vigente (2027-03-31)    [ Abrir ↗ ]│
│       ├── 📕 Seguro Obligatorio SOAP 2026.pdf      (BCI)         🟢 Vigente (2027-03-31)    [ Abrir ↗ ]│
│       ├── 📕 Revisión Técnica y Gases PRT.pdf      (Movicenter)  🟡 Por Vencer (14d)        [ Abrir ↗ ]│
│       └── 📕 Certificado Inspección de Gancho.pdf  (Cesmec)      🟢 Permanente              [ Abrir ↗ ]│
│                                                                                                        │
│ ▾ 🏢 4. Dimensión Clientes & Procesos Comerciales OTs                  🟢 47   🟡 0  🔴 0   [26 OTs]    │
│   ▾ 🏭 CARTULINAS CMPC S.A.                                             🟢 9   🟡 0  🔴 0   [1 servicio] │
│     ▾ 📋 GSP-2608-2856-042: Montaje Cartulinas CMPC                     🟢 9   🟡 0  🔴 0   [9 docs]     │
│       ├── 📕 GSP-2608-2856-042V3-147.pdf (Cotización Comercial v3)       🟢 Permanente      [ Abrir ↗ ]│
│       ├── 📕 GSP-2608-2856-042V2-146.pdf (Cotización Comercial v2)       🟢 Permanente      [ Abrir ↗ ]│
│       ├── 📕 OT-GSP-2608-2856-042V2-7.pdf (Orden de Trabajo Formal v2)  🟢 Permanente      [ Abrir ↗ ]│
│       ├── 📕 Informe Visita Técnica #261 (Template 80).pdf               🟢 Permanente      [ Abrir ↗ ]│
│       └── 📋 Report Diario Izaje - Día 1 (VPSR.26-1).pdf (Jornada PWA)   🟢 Firmado         [ Abrir ↗ ]│
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🌳 3. Especificación de las 4 Dimensiones Canónicas

### 3.1 Dimensión 1: Empresa & Holding (`dim-empresa`)
* **Fuente de Datos:** Sociedades del grupo San Pablo registradas en la plataforma (`id_empresa`: 9: Grúas San Pablo SpA, 7: Bestmaq Arriendos, 8: Logística del Sur, 11: Royal Rental).
* **Nivel 1:** Razón Social y RUT de la sociedad.
* **Archivos:** Expediente legal y tributario (E-RUT, Constitución, F-29, Accidentabilidad Mutual).

### 3.2 Dimensión 2: Flota y Equipos (`dim-equipos`)
* **Fuente de Datos:** Endpoint `GET /tequ-equipos` (110 equipos reales) y carga concurrente masiva con `GET /tequ-equipos/:id/certificados`.
* **Nivel 1 (Categoría):** Agrupación por categoría técnica (`nombre_categoria` o `tipo_equipo`): Grúas Telescópicas, Camiones Pluma, Plataformas, Tractocamiones, Cama Bajas, Alza Hombres, etc.
* **Nivel 2 (Equipo por Patente):** Nodo individual `{patente} • {marca} {modelo}`.
* **Hojas (Archivos Reales):** 289 certificados reales vinculados en `sch_leangsp.tequ_certificados_equipo` y `tfmg_file` (Permiso de Circulación, SOAP, Revisión Técnica PRT, Certificación de Izaje y Carga, Inspección de Gancho/Pasteca, Cables de Acero).

### 3.3 Dimensión 3: Personas y Tripulación (`dim-personas`)
* **Fuente de Datos:** Endpoint `GET /servicio/leanglobal/obtenerUsuarios` (colaboradores registrados) y carga concurrente con `GET /acreditacion/personal/:id`.
* **Nivel 1 (Cargo / Especialidad):** Agrupación por rol operativo (Operadores de Grúa Móvil, Riggers / Señaleros, Conductores Cama Baja, Supervisores de Maniobra, Prevencionistas de Riesgos HSEC).
* **Nivel 2 (Colaborador):** Nodo individual `{nombre} {apellido_pat} — RUT: {rut}`.
* **Hojas (Archivos Reales):** 286 certificados reales vinculados en `sch_leangsp.tsec_certificados_persona` y `tfmg_file` (Licencia Municipal A4/D, Exámenes Ocupacionales de Altura Física, Certificación de Competencias Laborales, Contrato de Trabajo, Registro de Inducción ODI, Entrega de EPP).

### 3.4 Dimensión 4: Clientes & Procesos Comerciales OTs (`dim-procesos`)
* **Fuente de Datos:** Endpoint `GET /proyectos` (26 OTs reales), `GET /survey/visitas-terreno` (66 visitas técnicas) y `GET /operaciones/report/proyecto/:id_proyecto`.
* **Nivel 1 (Cliente Mandante):** Empresa Mandante (Constructora Pocuro, Cartulinas CMPC, Inmobiliaria Nueva Italia, Constructora Worner, Besalco, LeanGlobal, etc.).
* **Nivel 2 (Proceso Comercial / OT):** Nodo individual `{codi_proyecto}: {nombre_proyecto}`.
* **Hojas (Archivos Reales Integrados):**
  1. **📄 Cotizaciones Comerciales Históricas:** Extraídas de `json_field.crm_v1.cotizaciones_historicas` (v1, v2, v3) con vínculo directo al PDF binario (`/api/archivo/ver/:id_doc`).
  2. **📋 Órdenes de Trabajo Formales:** Extraídas de `json_field.ejecucion_v1.ot_versiones` con su PDF oficial emitido.
  3. **📍 Informes de Visitas Técnicas a Terreno:** Informes formalizados en PDF provenientes de `tsrv_survey` (Template 80) asociados a la OT.
  4. **📝 Reportes Diarios Digitales de Izaje:** Jornadas reportadas desde la PWA móvil con horas efectivas, horómetros y estampa de firma Canvas del supervisor mandante.

---

## 🚦 4. Motor Determinístico de Vigencias y Semáforos Inline

En cada nodo del árbol (Dimensión Raíz, Grupo/Categoría, Entidad y Archivo) se calculan recursivamente los conteos en tres estados:
* 🟢 **Vigentes:** Documento con fecha de caducidad superior a 30 días o documento permanente / inmutable (`fecha_vencimiento = 'Permanente'`).
* 🟡 **Por Vencer (Alerta Temprana):** Vence en los próximos 30 días (`0 <= dias <= 30`).
* 🔴 **Vencidos:** Fecha de vencimiento anterior al día de hoy (`dias < 0`).

**Regla Visual Inviolable:**
Los semáforos se presentan como badges compactos en fuente monoespaciada (`🟢 N  🟡 N  🔴 N`) a la derecha inmediata del nombre del ítem, sin bordes pesados ni fondos invasivos.

---

## 👁️ 5. Protocolo de Apertura y Visualización de Archivos

1. **Documentos PDF Oficiales (Certificados, Cotizaciones, OTs, Visitas a Terreno):**
   * Se invocan con `window.open('https://servidor.leanglobal.cl/lg-gsp/api/archivo/ver/' + id_doc, '_blank')`.
   * Apertura nativa en nueva pestaña para auditoría rápida y descarga sin perder la posición en el árbol.
2. **Reportes Diarios Digitales de Izaje:**
   * Al hacer clic en `[ Abrir ↗ ]`, el sistema levanta el componente interactivo `<ModalVisorReport />`.
   * Permite inspeccionar en pantalla la carátula formal, tiempos de faena, colación, sobretiempos, geolocalización GPS y la estampa con la firma Canvas del supervisor cliente.

---

## ⚙️ 6. Trazabilidad y Verificación Técnica

* **Componente Fuente:** `ejecucion/frontend/src/views/Documentos.vue`
* **Compilación:** `npx vite build` — **0 errores** (Bundle de producción certificado).
* **Ruta Activa Local:** `http://localhost:5174/lg-gsp-dev/documentos`
* **Ruta Activa Remota:** `https://servidor.leanglobal.cl/lg-gsp-dev/documentos`
