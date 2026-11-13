# SPEC-082: Perspectiva Web de Plataformas: Control Contractual, Versionado, Legibilidad de PDF y Visibilidad de Actas 360°

**Fecha:** 16 de Octubre de 2026  
**Empresas Alcance:** Bestmaq (BSM), Royal Rental, Grúas San Pablo (GSP), Logística del Sur  
**Módulos Afectados:**  
- `ejecucion/backend_remoto/src/models/proyectoModel.js` (Generación de PDF Contrato de Arrendamiento - Legibilidad a 10px)  
- `ejecucion/backend_remoto/src/controllers/actaPlataformaController.js` y `proyectosController.js` (Indexación en `tfmg_file`)  
- `ejecucion/frontend/src/views/CRM/GestorOportunidades.vue` (Pestaña Unificada "Contrato & Formalización", Estados, Versionado y Bloque B Actas 360°)  
- `ejecucion/frontend/src/views/Documentos.vue` (Indexación dimensional de contratos y actas por Equipo y Proyecto)  
- `Gestión/tareas.md` (Registro de Tarea Pendiente: Migración de Viajes a PWA Offline-First)

---

## 1. Contexto y Diagnóstico del Requerimiento

1. **Ilegibilidad Móvil del Contrato PDF:**
   - Para encajar 14 extensas cláusulas legales en 1 carilla, se forzó `font-size: 6.85px; line-height: 1.16;`. Al visualizar el contrato desde smartphones, los textos resultan diminutos e ilegibles.
   - **Instrucción Explícita del Usuario:** Elevar la tipografía a **10px** con espaciado natural y estructurar el documento en 3 carillas limpias (Páginas 1 y 2 para las 14 Cláusulas y comparecencia, Página 3 para el Anexo Técnico y Condiciones Particulares).

2. **Invisibilidad del Estado Contractual y Falta de Versionado:**
   - La pestaña `Contrato & Formalización` actualmente solo está expuesta en la fase de Preventa Comercial (`topTab === 'comercial'`). Al pasar a Operaciones, el usuario no dispone de acceso directo a la documentación legal.
   - No se muestra de manera visible si el contrato está `BORRADOR`, `PENDIENTE_FIRMA`, `FIRMADO_DIGITAL` o `FIRMADO_FISICO`.
   - Si el cliente solicita renegociar plazos, tarifas o equipos, no existe control de versiones históricas (`v1`, `v2`, `v3`).

3. **Invisibilidad de las Actas 360° de Entrega y Retiro:**
   - El chofer suscribe el Acta de Entrega (`IDA`) y el Acta de Recuperación (`RETORNO`) en terreno, pero el equipo de Operaciones y Comercial no tiene estas actas a la vista en el módulo de formalización.
   - Las actas deben estar incorporadas en la pestaña `Contrato & Formalización` como el **Bloque B (Actas Operativas 360°)**, con visor de fotos, horómetros, firmas y descarga de PDF.

4. **Ausencia en el Gestor Documental Dimensional (`Documentos.vue`):**
   - Los contratos firmados y actas de terreno no están indexados en la biblioteca documental, impidiendo su auditoría por equipo o mandante.

---

## 2. Arquitectura de Solución por Ejes

### 2.1 Eje 1: Legibilidad y Diagramación del Contrato PDF (10px)

- **Archivo Backend:** `ejecucion/backend_remoto/src/models/proyectoModel.js` (`generarPdfContrato`)
- **Reglas Tipográficas y de Diagramación:**
  ```css
  @page { size: A4 portrait; margin: 10mm 12mm; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 10px;
    line-height: 1.4;
    color: #111;
  }
  .clausula-titulo {
    font-size: 10.5px;
    font-weight: bold;
    text-transform: uppercase;
    margin-top: 8px;
    margin-bottom: 2px;
  }
  .clausula-cuerpo {
    text-align: justify;
    margin-bottom: 6px;
    font-size: 10px;
    line-height: 1.38;
  }
  ```
- **Paginación Natural:**
  - **Página 1:** Membrete y logo de la Empresa Emisora + Título `CONDICIONES GENERALES DE ARRIENDO (PLATAFORMA)` + Cláusulas 1 a 7.
  - **Página 2:** Cláusulas 8 a 14 + Cuadro de comparecencia y firmas Arrendatario / Arrendador (con estampado FES).
  - **Página 3:** Anexo de Condiciones Particulares (Individualización de maquinaria, duración, tarifas de arriendo y flete, lugar de uso, mantenimiento, observaciones y firmas de anexo).

---

### 2.2 Eje 2: Visibilidad del Estado Contractual y Control de Versiones

- **Modelo de Datos en Base de Datos (`tpry_proyecto.json_field`):**
  ```json
  "crm_v1": {
    "contrato": {
      "version_actual": 1,
      "estado": "PENDIENTE_FIRMA", // BORRADOR | PENDIENTE_FIRMA | FIRMADO_DIGITAL | FIRMADO_FISICO
      "folio": "CTR-2026-0109",
      "url_pdf": "...",
      "firma_digital": { ... }
    },
    "contratos_historicos": [
      {
        "version": 1,
        "folio": "CTR-2026-0109-V1",
        "estado": "FIRMADO_DIGITAL",
        "fecha_emision": "2026-10-15T10:30:00Z",
        "url_pdf": "...",
        "datos": { ... }
      }
    ]
  }
  ```

- **Insignias Visuales de Estado en CRM:**
  - 🟡 **`Pendiente de Firma (Enviado FES / WhatsApp)`**
  - 🟢 **`Firmado Digitalmente (FES Verificado)`**
  - 🔵 **`Firmado Físico (Manual / Escaneado)`**
  - ⚪ **`Borrador (Sin Emitir)`**

- **Control de Versiones en Interfaz:**
  - Selector desplegable `[ Versión Actual: v1 (15-Oct-2026) ▾ ]` permitiendo inspeccionar versiones previas.
  - Botón `[ ➕ Nueva Versión de Contrato ]` para generar addendums o modificaciones tarifarias sin destruir la trazabilidad histórica.

---

### 2.3 Eje 3: Unificación en Tab "Contrato & Formalización" (Bloque A y Bloque B)

- **Accesibilidad Universal:**
  - La pestaña `Contrato & Formalización` se hace visible tanto en Preventa Comercial como en la etapa de Operaciones (accesible desde el header o en la barra de navegación transversal para servicios de arriendo Caso 5).
- **Estructura del Tab:**
  - **Bloque A: Contrato de Arrendamiento (Jurídico)**
    - Selector de empresa emisora, datos de comparecencia, selector de versiones, botones de previsualización en 3 páginas, despacho FES / WhatsApp y carga de contrato físico.
  - **Bloque B: Actas Operativas 360° de Terreno (Operacional)**
    - **Tarjeta 1: Acta de Entrega en Obra (Flete IDA):**
      - Estado: `RECIBIDA_CONFORME` / `PENDIENTE`.
      - Horómetro de entrada (`HOROM. IN`).
      - Checklist 19 ítems (resumen de conformidades).
      - Nivel de batería / combustible.
      - Galería de fotos 360° de entrega en obra.
      - Datos y firma táctil del receptor mandante.
      - Botón `[ 📄 Descargar PDF Acta Entrega ]`.
    - **Tarjeta 2: Acta de Retiro y Recuperación (Flete RETORNO):**
      - Estado: `CERRADA_FINAL` / `PENDIENTE_RETIRO`.
      - Horómetro final de salida (`HOROM. OUT`).
      - Registro de daños, averías o faltantes.
      - Galería de fotos 360° del estado de retiro.
      - Firma de entrega del cliente mandante.
      - Botón `[ 📄 Descargar PDF Acta Retiro ]`.

---

### 2.4 Eje 4: Indexación Automática en Biblioteca Documental (`Documentos.vue`)

- **Persistencia en `sch_leangsp.tfmg_file`:**
  - Al sellarse el contrato o generarse el acta de entrega/retiro, el backend registra el archivo en `tfmg_file` asignando:
    - `id_proyecto`: ID del proyecto/OT.
    - `id_equipo`: ID de la plataforma asignada.
    - `id_cliente`: ID del cliente mandante.
    - `tipo_doc`: `'CONTRATO_ARRIENDO'`, `'ACTA_ENTREGA_PLATAFORMA'`, `'ACTA_RETIRO_PLATAFORMA'`.
- **Visualización en `Documentos.vue`:**
  - En la dimensión **Equipos**, bajo la plataforma respectiva, se renderiza la carpeta *"Contratos & Actas 360° de Terreno"* con acceso directo a visualización y descarga.
  - En la dimensión **Clientes / Proyectos**, se listan los documentos formalizados correspondientes.

---

### 2.5 Eje 5: Tarea Pendiente en Backlog

- **Registro en `Gestión/tareas.md`:**
  - **Tarea:** *Migración de Hoja de Ruta de Conductor hacia la PWA con Persistencia Offline-First (IndexedDB), manteniendo enlace ligero WhatsApp (`/viaje/:token`) para choferes subcontratados.*

---

## 3. Plan de Trabajo Aprobado

1. **Paso 1 (Backend):** Ajuste de legibilidad a `10px` en `proyectoModel.js`, reorganizando el HTML en 3 páginas limpias para visualización móvil y de escritorio.
2. **Paso 2 (Frontend):** Incorporación del Bloque B de Actas 360° de Plataformas en `GestorOportunidades.vue` dentro del tab *Contrato & Formalización*, habilitando su acceso en Comercial y Operaciones.
3. **Paso 3 (Frontend & Backend):** Incorporación de insignias de estado y selector de versiones (`contratos_historicos`).
4. **Paso 4 (Frontend & Backend):** Indexación y despliegue de contratos y actas en `Documentos.vue`.
5. **Paso 5 (Gobernanza):** Registro de la tarea pendiente en `Gestión/tareas.md`, SemVer y sincronización de release.
