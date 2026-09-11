# 📐 Especificación Técnica 45: Acreditación de Faenas, Dossier B2B & Gestión Documental Multi-Empresa

> **Identificador:** SPEC-45  
> **Módulo:** Acreditaciones, Gestor Documental & Dossier B2B  
> **Aplica a:** Ecosistema Grúas San Pablo (Consola Web CRM & Biblioteca Documental `/documentos`)  
> **Estado:** 🟡 Especificación Técnica Detallada — Lista para Aprobación de Implementación  
> **Fecha:** 2026-09-07  
> **Origen:** Punto 1 de los 6 Puntos Estratégicos con Jorge Ponce (Gerente General) & Definiciones de Sergio Gajardo  
> **Supersede:** Spec 23 (Acreditaciones Post-Asignación UX), Spec 24 (Flujo Operativo OT & Acreditaciones), Spec 26 (Acreditaciones Asíncronas & Analista de Gestión)  
> **Operadora Principal:** Dayana Riquelme (Prevencionista de Riesgos / APR)

---

## 📌 1. Visión y Requerimientos de Negocio

Dayana (Encargada de Prevención y Acreditaciones) gestiona la documentación de seguridad, laboral y técnica para las **4 razones sociales del Grupo San Pablo**:
1. **Grúas San Pablo SpA** (`id_empresa = 9`, RUT: `76.495.120-1`)
2. **Bestmaq Arriendos SpA** (`id_empresa = 7`, RUT: `77.108.433-2`)
3. **Logística del Sur SpA** (`id_empresa = 8`, RUT: `76.882.140-5`)
4. **Royal Rental SpA** (`id_empresa = 11`, RUT: `77.521.908-9`)

### Objetivos Clave de Operación
1. **Compilación del Dossier en < 60 segundos:** Reunir las 3 carpetas (Empresa, Equipos, Personas) listas para despachar al mandante.
2. **Regla Persona-Empresa (Movilidad Inter-Empresa):** Los trabajadores rotan de empresa por razones normativas, límites de accidentabilidad (DS 67) o vetos comerciales de mandantes.
3. **Validación Cruzada Automática:** Bloquear el despacho del dossier si los documentos empresa-dependientes de un operador o rigger no pertenecen a la razón social que factura y ejecuta la OT.
4. **Bidireccionalidad Transaccional:** Toda subida in-situ en la OT impacta de inmediato en la Biblioteca Central del trabajador, equipo o empresa.
5. **Despacho B2B Real:** Generación de correo HTML corporativo con tabla de links directos más empaquetado descargable en formato **ZIP**.

---

## 🗄️ 2. Especificación Detallada de Base de Datos (PostgreSQL)

### 2.1 Esquema Activo
* **Schema:** `sch_leangsp`
* **Base de Datos:** `postgres` en `servidor.leanglobal.cl`

---

### 2.2 Script de Migración DDL (Idempotente)

```sql
-- ============================================================================
-- MIGRACIÓN DDL: SPEC-45 ACREDITACIÓN DE FAENAS MULTI-EMPRESA
-- Archivo: 20260907_alter_acreditacion_multi_empresa.sql
-- ============================================================================

-- 1. Agregar columna id_empresa a la tabla tsec_certificados_persona
ALTER TABLE sch_leangsp.tsec_certificados_persona
ADD COLUMN IF NOT EXISTS id_empresa INT NULL
    REFERENCES sch_leangsp.tpar_empresas(id_empresa);

COMMENT ON COLUMN sch_leangsp.tsec_certificados_persona.id_empresa IS 
'NULL = Documento Universal/Agnóstico (Cédula, Licencia, Examen de Altura). 
ID_EMPRESA = Documento Subyugado a la Razón Social Emisora (Contrato, EPP, ODI, RIOHS).';

CREATE INDEX IF NOT EXISTS idx_cert_persona_empresa 
ON sch_leangsp.tsec_certificados_persona(id_empresa);

-- 2. Agregar flag es_empresa_dependiente a tsec_tipos_certificado_persona
ALTER TABLE sch_leangsp.tsec_tipos_certificado_persona
ADD COLUMN IF NOT EXISTS es_empresa_dependiente BOOLEAN DEFAULT false;

COMMENT ON COLUMN sch_leangsp.tsec_tipos_certificado_persona.es_empresa_dependiente IS 
'True si el tipo de documento debe asociarse obligatoriamente a una razón social del grupo.';

-- 3. Marcar tipos de certificados que son intrínsecamente empresa-dependientes
UPDATE sch_leangsp.tsec_tipos_certificado_persona
SET es_empresa_dependiente = true
WHERE UPPER(nombre_tipo) LIKE '%CONTRATO%'
   OR UPPER(nombre_tipo) LIKE '%ODI%'
   OR UPPER(nombre_tipo) LIKE '%INDUCCI%'
   OR UPPER(nombre_tipo) LIKE '%EPP%'
   OR UPPER(nombre_tipo) LIKE '%REGLAMENTO%'
   OR UPPER(nombre_tipo) LIKE '%LIQUIDACI%'
   OR UPPER(nombre_tipo) LIKE '%ANEXO%';

-- 4. Migración Retroactiva Determinística:
-- Asignar id_empresa = 9 (Grúas San Pablo SpA) a los certificados empresa-dependientes existentes
UPDATE sch_leangsp.tsec_certificados_persona
SET id_empresa = 9
WHERE id_empresa IS NULL
  AND id_tipo_certificado_persona IN (
    SELECT id_tipo_certificado_persona 
    FROM sch_leangsp.tsec_tipos_certificado_persona 
    WHERE es_empresa_dependiente = true
  );

-- 5. Convención Opción A en tfmg_file para Documentos Institucionales de Empresa:
-- tipo_doc = 'DOC_EMPRESA'
-- id_proceso = id_empresa (FK conceptual a tpar_empresas)
-- name_doc_orig = Nombre legible del documento (ej. 'Certificado F30 Septiembre 2026.pdf')
CREATE INDEX IF NOT EXISTS idx_tfmg_file_empresa_doc
ON sch_leangsp.tfmg_file(tipo_doc, id_proceso)
WHERE tipo_doc = 'DOC_EMPRESA';

-- 6. Agregar columna id_empresa a tpry_acreditacion_doc para trazabilidad de requisitos ad-hoc
ALTER TABLE sch_leangsp.tpry_acreditacion_doc
ADD COLUMN IF NOT EXISTS id_empresa INT NULL
    REFERENCES sch_leangsp.tpar_empresas(id_empresa);

ALTER TABLE sch_leangsp.tpry_acreditacion_doc
ADD COLUMN IF NOT EXISTS id_entidad_asignada INT NULL; 
-- Guarda id_equipo si categoria_doc = 'EQUIPOS', id_user si categoria_doc = 'PERSONAL'
```

---

### 2.3 Queries SQL Determinísticas del Motor

#### Query 1: Obtención de Documentos de Persona en Contexto de una OT
Consulta los certificados del trabajador, discriminando si son universales o pertenecen a la empresa ejecutora de la OT (`$2`):
```sql
SELECT 
    cp.id_certificado_persona,
    cp.id_user,
    cp.id_tipo_certificado_persona,
    tp.nombre_tipo,
    tp.es_empresa_dependiente,
    cp.id_empresa,
    emp.name_empresa AS empresa_emisora,
    cp.fecha_emision,
    cp.fecha_vencimiento,
    cp.id_doc,
    f.name_doc_orig,
    CASE 
        WHEN cp.fecha_vencimiento IS NULL THEN 'Vigente'
        WHEN cp.fecha_vencimiento < CURRENT_DATE THEN 'Vencido'
        WHEN cp.fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days' THEN 'Por Vencer'
        ELSE 'Vigente'
    END AS estado_vigencia,
    -- Validación cruzada: Si es empresa-dependiente y no coincide con la OT, es inválido
    CASE 
        WHEN tp.es_empresa_dependiente = true AND (cp.id_empresa IS NULL OR cp.id_empresa != $2) THEN false
        WHEN cp.fecha_vencimiento < CURRENT_DATE THEN false
        ELSE true
    END AS es_valido_para_ot
FROM sch_leangsp.tsec_certificados_persona cp
JOIN sch_leangsp.tsec_tipos_certificado_persona tp ON cp.id_tipo_certificado_persona = tp.id_tipo_certificado_persona
LEFT JOIN sch_leangsp.tpar_empresas emp ON cp.id_empresa = emp.id_empresa
LEFT JOIN sch_leangsp.tfmg_file f ON cp.id_doc = f.id_doc
WHERE cp.id_user = $1
  AND (
      tp.es_empresa_dependiente = false 
      OR cp.id_empresa = $2 
      OR cp.id_empresa IS NULL
  )
ORDER BY tp.obligatorio DESC, cp.fecha_vencimiento ASC;
```

#### Query 2: Obtención de Documentos Institucionales de la Empresa Ejecutora
```sql
SELECT 
    f.id_doc,
    f.name_doc_orig,
    f.name_doc_interno,
    f.mimetype,
    f.fecha_creacion,
    f.id_proceso AS id_empresa,
    emp.name_empresa,
    emp.rut_empresa
FROM sch_leangsp.tfmg_file f
JOIN sch_leangsp.tpar_empresas emp ON f.id_proceso = emp.id_empresa
WHERE f.tipo_doc = 'DOC_EMPRESA' 
  AND f.id_proceso = $1
  AND (f.estado IS NULL OR f.estado != 'ELIMINADO')
ORDER BY f.fecha_creacion DESC;
```

---

## 🔌 3. Especificación Detallada de Backend (Node.js / Express)

### 3.1 Rutas API a Registrar (`acreditacionRoutes.js`)

```javascript
// Base path: /api/acreditacion

// 1. Gestión Documental Institucional de Empresas (Biblioteca /documentos)
router.get('/empresa/:id_empresa/documentos', acreditacionController.getDocumentosEmpresa);
router.post('/empresa/:id_empresa/documentos', acreditacionController.subirDocumentoEmpresa);
router.delete('/empresa/:id_empresa/documentos/:id_doc', acreditacionController.eliminarDocumentoEmpresa);

// 2. Contexto Completo y Árbol de Dossier para la OT (Pestaña 4 CRM)
router.get('/ot/:id_proyecto/dossier-contexto', acreditacionController.getDossierContextoOT);

// 3. Subida In-Situ con Doble Efecto Transaccional
router.post('/ot/:id_proyecto/subir-in-situ', acreditacionController.subirDocumentoInSitu);

// 4. Despacho y Empaquetado de Dossier
router.post('/ot/:id_proyecto/despachar-dossier', acreditacionController.despacharDossierB2B);
router.get('/ot/:id_proyecto/descargar-zip', acreditacionController.descargarDossierZip);
```

---

### 3.2 Contratos JSON y Especificación de Endpoints

#### Endpoint 1: `GET /api/acreditacion/ot/:id_proyecto/dossier-contexto`
* **Propósito:** Retorna en una sola llamada atómica todo el estado del dossier para la OT, calculando vigencias y validación cruzada.
* **Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "data": {
    "proyecto": {
      "id_proyecto": 2608,
      "codi_proyecto": "GSP-2608-2856-042",
      "nombre_proyecto": "Montaje Cartulinas CMPC",
      "id_empresa_ejecutora": 9,
      "nombre_empresa_ejecutora": "Grúas San Pablo SpA",
      "rut_empresa_ejecutora": "76.495.120-1",
      "cliente": {
        "id_empresa": 154,
        "razon_social": "CARTULINAS CMPC S.A.",
        "rut": "96.512.340-K"
      }
    },
    "resumen_semaforo": {
      "total_requisitos": 14,
      "vigentes": 12,
      "por_vencer": 2,
      "vencidos": 0,
      "pendientes": 0,
      "puede_despachar": true
    },
    "carpeta_empresa": {
      "id_empresa": 9,
      "nombre": "Grúas San Pablo SpA",
      "documentos": [
        {
          "id_doc": 882,
          "nombre_requisito": "Certificado Laboral F30-1",
          "name_doc_orig": "F30_GSP_Septiembre_2026.pdf",
          "fecha_vencimiento": "2026-10-15",
          "estado_vigencia": "Vigente",
          "url_visor": "/api/archivo/ver/882"
        }
      ]
    },
    "carpeta_equipos": [
      {
        "id_equipo": 42,
        "patente": "BGDF.90",
        "marca_modelo": "LIEBHERR LTM-1220",
        "documentos": [
          {
            "id_certificado": 115,
            "nombre_requisito": "Revisión Técnica y Gases PRT",
            "fecha_vencimiento": "2026-09-28",
            "estado_vigencia": "Por Vencer",
            "dias_restantes": 21,
            "id_doc": 745,
            "url_visor": "/api/archivo/ver/745"
          }
        ]
      }
    ],
    "carpeta_personal": [
      {
        "id_user": 88,
        "nombre_completo": "Juan Carlos Pérez Valenzuela",
        "rut": "15.421.890-4",
        "cargo": "Operador Grúa Móvil",
        "documentos": [
          {
            "id_certificado_persona": 302,
            "nombre_tipo": "Licencia Municipal Clase D",
            "es_empresa_dependiente": false,
            "id_empresa": null,
            "empresa_emisora": "Agnóstico / Universal",
            "fecha_vencimiento": "2028-04-12",
            "estado_vigencia": "Vigente",
            "es_valido_para_ot": true,
            "id_doc": 901
          },
          {
            "id_certificado_persona": 305,
            "nombre_tipo": "Contrato de Trabajo",
            "es_empresa_dependiente": true,
            "id_empresa": 9,
            "empresa_emisora": "Grúas San Pablo SpA",
            "fecha_vencimiento": null,
            "estado_vigencia": "Vigente",
            "es_valido_para_ot": true,
            "id_doc": 904
          }
        ]
      }
    ]
  }
}
```

---

#### Endpoint 2: `POST /api/acreditacion/ot/:id_proyecto/subir-in-situ`
* **Propósito:** Sube un archivo directamente desde la fila de la Pestaña 4 y lo inserta con transacción tanto en la tabla de acreditación de la OT como en el expediente maestro correspondiente.
* **Payload (Multipart/form-data):**
  - `archivo`: Binario (PDF/JPG/PNG)
  - `categoria`: `'EMPRESA'` | `'EQUIPOS'` | `'PERSONAL'`
  - `id_entidad`: `id_empresa` (si empresa), `id_equipo` (si equipo), `id_user` (si personal)
  - `id_tipo_requisito`: ID del tipo de certificado o string descriptivo
  - `fecha_emision`: `'YYYY-MM-DD'`
  - `fecha_vencimiento`: `'YYYY-MM-DD'` (opcional)
  - `id_empresa_emisora`: `id_empresa` (obligatorio si el tipo es empresa-dependiente)
* **Lógica Transaccional:**
  ```javascript
  // 1. Guardar archivo físico en STORAGE_ROOT/acreditaciones/
  // 2. INSERT INTO tfmg_file (...) RETURNING id_doc
  // 3. SI categoria === 'PERSONAL':
  //      INSERT INTO tsec_certificados_persona (id_user, id_tipo_certificado_persona, id_empresa, id_doc, fecha_vencimiento)
  //    SI categoria === 'EQUIPOS':
  //      INSERT INTO tequ_certificados_equipo (id_equipo, id_tipo_certificado, id_doc, fecha_vencimiento)
  //    SI categoria === 'EMPRESA':
  //      UPDATE tfmg_file SET tipo_doc = 'DOC_EMPRESA', id_proceso = id_empresa WHERE id_doc = id_doc
  // 4. UPSERT en tpry_acreditacion_doc para vincularlo a la OT
  // 5. Retornar semáforo actualizado
  ```

---

#### Endpoint 3: `POST /api/acreditacion/ot/:id_proyecto/despachar-dossier`
* **Propósito:** Valida compuerta estricta, compila el correo corporativo B2B y empaqueta el archivo ZIP del dossier.
* **Payload (JSON):**
```json
{
  "destinatarios": ["prevencion@cmpc.cl", "jefeobra@cmpc.cl"],
  "copia": ["dayana.riquelme@gruassanpablo.cl", "operaciones@gruassanpablo.cl"],
  "asunto": "Dossier de Acreditación - Grúas San Pablo - Servicio GSP-2608-2856-042",
  "mensaje_personalizado": "Estimados, adjuntamos la documentación de acreditación de equipos y personal para el servicio programado."
}
```
* **Validación de Compuerta (Backend):**
  - Si existen documentos con `estado_vigencia === 'Vencido'` o documentos obligatorios sin `id_doc`:
    * Retorna HTTP 400:
    ```json
    {
      "success": false,
      "code": "BLOQUEO_ACREDITACION",
      "message": "Despacho rechazado: Existen 1 documentos vencidos y 2 documentos pendientes de carga.",
      "errores": [
        "Operador Juan Pérez: Contrato de Trabajo no corresponde a la empresa de la OT (Bestmaq SpA)",
        "Grúa BGDF.90: Revisión Técnica vencida el 2026-08-30"
      ]
    }
    ```
* **Acción de Éxito:**
  1. Genera ZIP en memoria/disco con la estructura de 3 carpetas:
     ```
     Dossier_GSP-2608-2856-042.zip
     ├── 1_Empresa_Gruas_San_Pablo/
     │   └── F30_1_Septiembre_2026.pdf
     ├── 2_Equipos/
     │   └── BGDF90_Liebherr/
     │       └── Revision_Tecnica.pdf
     └── 3_Personal/
         └── Juan_Perez_Operador/
             ├── Cedula_Identidad.pdf
             └── Contrato_Trabajo.pdf
     ```
  2. Envía correo vía `nodemailer` (`notificaciones.gsp@leanglobal.cl`) con el botón de descarga del ZIP y la tabla de enlaces individuales.
  3. Registra el envío en `tpry_proyecto.json_field.operaciones_v1.historial_dossier` con timestamp, usuario emisor, destinatarios y versión (`v1.0`, `v1.1`).

---

## 🖥️ 4. Especificación Detallada de Frontend (Vue 3 / Tailwind)

### 4.1 Componente: `Documentos.vue` (Biblioteca Central — `/documentos`)

#### Cambios Estructurales en Dimensión 1 (Empresas del Holding):
* **Comportamiento Actual:** Muestra solo 4 tarjetas estáticas con RUT y razón social.
* **Nuevo Comportamiento:**
  * Cada empresa se convierte en un nodo colapsable/expandible del árbol.
  * Al expandir, consulta `GET /api/acreditacion/empresa/:id_empresa/documentos`.
  * Despliega la lista de documentos legales y laborales con badge de vigencia:
    - 🟢 E-RUT / Iniciación de Actividades (Permanente)
    - 🟢 Escritura de Constitución (Permanente)
    - 🟢 Certificado F30 / F30-1 (Vence el 15 de cada mes)
    - 🟢 Tasa de Siniestralidad Mutual DS 67 (Vence semestral/anual)
    - 🟢 Reglamento Interno RIOHS (Anual)
  * Botones por fila: `[ 👁️ Ver ]` (abre nueva pestaña) y `[ 🗑️ Dar de Baja ]`.
  * Botón en cabecera: `[ + 📤 Subir Documento Empresa ]` abre modal con selector de tipo de documento tributario.

#### Cambios Estructurales en Dimensión 3 (Personas y Tripulación):
* En cada fila de certificado:
  * Si `es_empresa_dependiente === false`: Muestra badge neutro `🌐 Universal / Todas las Empresas`.
  * Si `es_empresa_dependiente === true`: Muestra badge de color según la razón social:
    - `[ 🏢 GSP SpA ]` (Azul)
    - `[ 🏢 Bestmaq ]` (Ámbar)
    - `[ 🏢 Logística del Sur ]` (Verde)
    - `[ 🏢 Royal Rental ]` (Púrpura)
* En el modal `[ + Agregar Certificado ]`:
  * Dropdown reactivo: Al elegir un tipo (ej. Contrato), si `es_empresa_dependiente` es true, se activa obligatoriamente el selector `Empresa Emisora` con las 4 sociedades del grupo.

---

### 4.2 Componente: `GestorOportunidades.vue` (Pestaña 4 — Acreditaciones & Dossier)

#### 4.2.0 Erradicación del "Árbol Navideño" y Principio de Sobriedad Visual (B2B Industrial)
* **Problema Identificado:** Cada fila de documento repetía simultáneamente hasta 4 botones con colores discordantes (verde neón, púrpura, celeste/azul y cruz roja), generando saturación visual ("árbol navideño") y fatiga cognitiva.
* **Solución de Alta Densidad B2B:**
  1. **Documentos Vigentes (`checkDocVigente === true`):**
     - Indicador: Semáforo `✅` verde sutil.
     - Nombre del documento en texto claro con truncado seguro.
     - Acción primaria directa: Botón minimalista de previsualización `[ 👁️ ]` (gris slate, hover blanco/esmeralda).
     - Menú kebab `[ ••• ]`: Botón compacto de 3 puntos que despliega popover flotante oscuro:
       * `🔗 Re-vincular desde Biblioteca Central`
       * `📤 Reemplazar archivo (Subir nuevo)`
       * `────────────────────────────────`
       * `🗑️ Quitar exigencia`
  2. **Documentos Pendientes / Faltantes (`checkDocVigente === false`):**
     - Indicador: Cruz roja `❌` (o advertencia `⚠️` si hay incompatibilidad de empresa contratista).
     - Nombre del documento en texto atenuado o de advertencia.
     - Acción rápida directa: Botón sobrio unificado `[ 📤 Subir ]` en dark mode grafito (`bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-[10px] px-2.5 py-1 rounded-lg font-bold`).
     - Menú kebab `[ ••• ]`: Botón contiguo para acciones alternativas:
       * `🔗 Vincular desde Biblioteca Central`
       * `🗑️ Quitar exigencia`
  3. **Comportamiento del Menú Popover Kebab:**
     - Estado reactivo único `activeKebabMenuKey = ref(null)` (clave compuesta `tipo-entidad-idx`).
     - Auto-cierre al seleccionar cualquier opción o al hacer clic fuera del menú (*click outside*).
     - Posicionamiento `absolute right-0 top-full mt-1 z-30` con sombra profunda `shadow-2xl` y fondo `bg-[#0f172a] border border-white/10 rounded-lg`.

#### 4.2.1 Arquitectura Canónica de Pareo Determinístico por Tipo (`id_tipo === id_tipo`)
* **Prohibición de Comparación Heurística por Texto:** Queda terminantemente prohibido el uso de métodos basados en búsqueda de subcadenas sueltas (`.includes('ci')`, `.includes('rt')`, `.includes('rc')`) para determinar la correspondencia entre una exigencia de la OT y un certificado.
* **Modelo Canónico de Contraste:**
  1. Cada requisito documental exigido en la OT debe resolverse a un identificador numérico canónico (`id_tipo_certificado_persona` para personal o `id_tipo_certificado` para equipos) o conjunto acotado de IDs equivalentes.
  2. Para proyectos preexistentes donde las exigencias fueron guardadas como cadenas de texto (`crm_v1.acreditacion_docs`), el sistema aplica un Diccionario Canónico de Homologación de Tipos:
     - **Personal (`tsec_tipos_certificado_persona`):**
       - `"Cédula identidad"`, `"Cédula de Identidad"` ➡️ `id_tipo = 1`
       - `"Licencia conducir"`, `"Licencia de Conducir"` ➡️ `id_tipo = 2`
       - `"Contrato de trabajo"`, `"Contrato"` ➡️ `id_tipo = 3`
       - `"Examen psicosensotécnico"`, `"Examen Psicotécnico PST"` ➡️ `id_tipo = 4`
       - `"Examen ocupacional"` ➡️ `id_tipo = 5`
       - `"Examen preocupacional"` ➡️ `id_tipo = 6`
       - `"Certificación de Competencias"`, `"Certificación"` ➡️ `id_tipo = 7`
       - `"Credencial de Operador/Rigger"` ➡️ `id_tipo = 8`
       - `"Reglamento Interno (RIOHS)"`, `"RIOHS"` ➡️ `id_tipo = 9`
       - `"Inducción y Entrega de EPP"`, `"EPP"` ➡️ `id_tipo = [10, 49]`
       - `"Obligación de Informar (ODI) / PTS"`, `"ODI"`, `"PTS"` ➡️ `id_tipo = 11`
     - **Equipos (`tequ_tipos_certificado`):**
       - `"Permiso de circulación"`, `"Permiso"` ➡️ `id_tipo = 1`
       - `"Revisión técnica"`, `"Revisión Técnica"` ➡️ `id_tipo = 2`
       - `"SOAP"` ➡️ `id_tipo = 3`
       - `"Certificado de Inspección de Gancho"` ➡️ `id_tipo = 4`
       - `"Certificación Anual Izaje"`, `"Inspección de Equipo"`, `"Prueba de Carga"`, `"Certificación"` ➡️ `id_tipo = [5, 6]` (Inspección o Prueba de Carga)
  3. La condición de coincidencia (*match*) en tiempo de ejecución se evalúa estrictamente como:
     - En Personal: `c.id_tipo_certificado_persona === idTipoExigido || (Array.isArray(idTipoExigido) && idTipoExigido.includes(c.id_tipo_certificado_persona))`
     - En Equipos: `c.id_tipo_certificado === idTipoExigido || (Array.isArray(idTipoExigido) && idTipoExigido.includes(c.id_tipo_certificado))`
  4. Ningún certificado podrá vincularse si no coincide su clave foránea de tipo, garantizando inmunidad a colisiones lingüísticas y falsos positivos.

#### 1. Identificación Automática de la Empresa de la OT:
* Lee `id_empresa` ejecutora desde `opportunity.id_empresa` o `antecedentes.id_empresa_cotizante` (por defecto `9` si no está especificada).
* Muestra en la cabecera:
  `Empresa Ejecutora de este Servicio: [ Grúas San Pablo SpA • RUT 76.495.120-1 ]`

#### 2. Columna 1 — Requisitos de Empresa:
* Renombrar título a: `🏢 1. Empresa Contratista (${nombreEmpresaEjecutora})`.
* Muestra automáticamente los documentos institucionales vigentes de esa empresa.

#### 3. Columna 2 — Equipos Asignados:
* Para cada grúa o camión pluma asignado en Pestaña 3:
  * Despliega los certificados obligatorios: Padrón, Revisión Técnica, SOAP, Permiso de Circulación, Certificación de Carga y Tabla de Carga.
  * Semáforo reactivo instantáneo.

#### 4. Columna 3 — Tripulación y Validación Cruzada Persona-Empresa:
* Para cada trabajador asignado (Operador, Rigger, Conductor):
  * **Documentos Universales:** Cédula, Licencia, Examen de Altura Física. Valida solo vigencia por fecha.
  * **Documentos Empresa-Dependientes:** Contrato, EPP, ODI.
    * Si el trabajador **TIENE** contrato con la empresa ejecutora de la OT → ✅ 🟢 Vigente.
    * Si el trabajador **NO TIENE** contrato con esa empresa (aunque tenga contrato con otra empresa del grupo) → ❌ 🔴 **PENDIENTE CON ${nombreEmpresaEjecutora}**.
    * Al lado, botón rápido `[ 📤 Subir In-Situ ]` para que Dayana cargue el anexo o contrato de esa empresa sin tener que salir a la biblioteca central.

#### 5. Barra de Acción y Despacho B2B:
* Computada `tieneDocumentosVencidosOPendientes`:
  ```javascript
  const tieneDocumentosVencidosOPendientes = computed(() => {
    return totalVencidos.value > 0 || totalPendientes.value > 0;
  });
  ```
* Si está bloqueado:
  * Muestra panel rojo de alerta indicando la lista exacta de documentos que impiden el despacho.
  * Botón `[ Despachar Dossier al Cliente ]` en estado `:disabled`.
* Si está 100% conforme:
  * Botón verde brillante con sombra `bg-emerald-500`.
  * Al hacer clic, abre `ModalDespachoDossierB2B.vue` con:
    - Previsualización del correo formal.
    - Checkbox `[x] Adjuntar paquete ZIP consolidado`.
    - Lista de destinatarios mandantes precargados del cliente.
    - Botón `[ 🚀 Confirmar y Enviar Correo B2B ]`.

---

## 📊 5. Matriz de Requisitos Documentales por Categoría

| Categoría | Nombre Documento | Ámbito | Vencimiento Típico | Bloquea Despacho |
|:---|:---|:---|:---|:---:|
| **Empresa** | E-RUT / Iniciación de Actividades | Institucional | Permanente | Sí |
| **Empresa** | Certificado F30 / F30-1 | Institucional | Mensual (día 15) | Sí |
| **Empresa** | Tasa Accidentabilidad Mutual DS 67 | Institucional | Anual | Sí |
| **Empresa** | Reglamento Interno RIOHS | Institucional | Anual | No (Alerta) |
| **Equipo** | Padrón de Propiedad RVM | Máquina | Permanente | Sí |
| **Equipo** | Permiso de Circulación | Máquina | Anual (Marzo/Mayo) | Sí |
| **Equipo** | Seguro Obligatorio SOAP | Máquina | Anual (Marzo) | Sí |
| **Equipo** | Revisión Técnica PRT y Gases | Máquina | Semestral/Anual | Sí |
| **Equipo** | Certificado Técnico de Izaje | Máquina | Anual | Sí |
| **Equipo** | Tabla de Carga del Fabricante | Máquina | Permanente | No (Alerta) |
| **Persona** | Cédula de Identidad | Universal | 5 a 10 años | Sí |
| **Persona** | Licencia de Conducir (D/A4/A5) | Universal | 2 a 6 años | Sí |
| **Persona** | Examen Médico Preocupacional | Universal | 1 año | Sí |
| **Persona** | Certificado Competencias Laborales | Universal | 2 a 3 años | No (Alerta) |
| **Persona** | Contrato de Trabajo | **Empresa-Dependiente** | Permanente / Anual | Sí |
| **Persona** | Entrega de EPP | **Empresa-Dependiente** | Semestral / Anual | Sí |
| **Persona** | Inducción / ODI Faena | **Empresa-Dependiente** | Por Faena / Anual | Sí |

---

## ⚙️ 6. Plan de Verificación Determinística (QA)

1. **Prueba DDL en BD:**
   - Ejecución del script DDL idempotente.
   - Auditoría de índices creados con query a `pg_indexes`.
   - Verificación de que los 286 registros existentes tienen `id_empresa = 9` para los tipos empresa-dependientes y `NULL` para universales.
2. **Prueba de API Backend (HTTP):**
   - Invocación de `GET /api/acreditacion/ot/2608/dossier-contexto` verificando semáforo precalculado.
   - Prueba de validación cruzada: Simular un trabajador asignado a una OT de Bestmaq que solo tiene contrato en GSP SpA, comprobando que retorne `es_valido_para_ot: false`.
   - Prueba de compuerta: Intentar despachar con documento vencido y verificar código HTTP 400.
3. **Prueba de Frontend:**
   - Compilación con `npm run build` en `ejecucion/frontend` asegurando **0 errores de Vite**.
   - Navegación visual en `/documentos` verificando el despliegue del árbol institucional de empresas.
   - Apertura de Pestaña 4 en `GestorOportunidades.vue` verificando el bloqueo/desbloqueo del botón según vigencias reales.

---

## 🧪 7. BDD Gherkin Test Scenarios (QA Determinístico)

### Característica: Renderizado Sobrio de Filas de Acreditación y Menú Kebab en Pestaña 4

#### Escenario 1: Despliegue sobrio de documento vigente (Sin botones redundantes de Vincular/Subir)
  Dado que el usuario se encuentra en la Pestaña 4 (Acreditaciones & Dossier) de una OT
  Y el documento "Revisión Técnica" del equipo "STDD.68-4" se encuentra cargado y vigente
  Cuando se renderiza la fila del documento
  Entonces debe mostrarse el indicador verde "✅"
  Y debe mostrarse el nombre del documento "Revisión Técnica"
  Y debe mostrarse un único botón minimalista de visualización "👁️"
  Y debe mostrarse un botón discreto de tres puntos "•••"
  Y NO deben mostrarse botones explícitos de "Vincular" ni "Subir" en la fila.

#### Escenario 2: Despliegue de opciones contextuales al presionar el menú Kebab en documento vigente
  Dado que el documento "SOAP" se encuentra en estado vigente
  Cuando el usuario hace clic en el botón de tres puntos "•••" de dicha fila
  Entonces se debe desplegar el menú flotante contextual
  Y el menú debe contener las opciones:
    | Opción | Acción |
    | 🔗 Re-vincular de Biblioteca | Abre el modal de vinculación desde la biblioteca central |
    | 📤 Reemplazar archivo        | Abre el selector de archivos local para subir nueva versión |
    | 🗑️ Quitar exigencia         | Elimina el documento de la lista de exigencias de esta OT |

#### Escenario 3: Despliegue sobrio de documento faltante o pendiente
  Dado que el documento "Examen de Altura Física" del operador está pendiente o no cargado
  Cuando se renderiza la fila del documento
  Entonces debe mostrarse el indicador rojo "❌"
  Y debe mostrarse el nombre del documento
  Y debe mostrarse un botón sobrio "📤 Subir" con estilo grafito oscuro
  Y debe mostrarse el botón discreto de tres puntos "•••"
  Y NO debe mostrarse ningún botón en colores neón chillones (morado o cyan brillante).

#### Escenario 4: Auto-cierre del menú Kebab al hacer clic fuera (Click Outside)
  Dado que el menú contextual Kebab de una fila de documento se encuentra abierto
  Cuando el usuario hace clic en cualquier otra área de la pantalla o fuera del menú
  Entonces el menú contextual debe cerrarse inmediatamente
  Y la variable `activeKebabMenuKey` debe volver a ser `null`.

#### Escenario 5: Cierre del menú Kebab tras seleccionar una acción
  Dado que el menú contextual Kebab de una fila se encuentra abierto
  Cuando el usuario hace clic en "🔗 Re-vincular de Biblioteca" o "🗑️ Quitar exigencia"
  Entonces se debe ejecutar la acción correspondiente
  Y el menú contextual debe cerrarse automáticamente.

#### Escenario 6: Apertura del visor de documento al presionar el botón de ojo
  Dado que un documento se encuentra vigente
  Cuando el usuario hace clic en el botón minimalista "👁️"
  Entonces se debe disparar la función `verDocumentoDossier` abriendo el archivo PDF o modal de visualización.

#### Escenario 7: Validación cruzada empresa-persona con advertencia sobria
  Dado que el operador asignado tiene contrato con "Grúas San Pablo SpA"
  Pero la OT es ejecutada y facturada por "Bestmaq Arriendos SpA"
  Cuando se evalúa el documento "Contrato de Trabajo" en la Columna 3
  Entonces debe mostrarse el indicador de advertencia "⚠️"
  Y debe desplegarse el texto monoespaciado indicando la incompatibilidad de razón social
  Y debe mostrarse el botón sobrio "📤 Subir" junto al menú "•••" para adjuntar el anexo o contrato correspondiente.

#### Escenario 8: Bloqueo inmutable del botón de despacho B2B si existen documentos pendientes
  Dado que existen 1 o más documentos con estado "❌" o "⚠️" en cualquiera de las 3 columnas
  Cuando se evalúa la computada `tieneDocumentosVencidosOPendientes`
  Entonces su valor debe ser `true`
  Y el botón "Despachar Dossier al Cliente (Email B2B)" debe estar deshabilitado (`:disabled="true"`)
  Y debe desplegarse el banner de alerta de bloqueo.

#### Escenario 9: Pareo determinístico estricto por ID de tipo en Personal (Inmunidad a colisión ODI/Licencia/Cédula)
  Dado que el operador asignado tiene cargado en su expediente un documento de tipo "Obligación de Informar (ODI) / PTS" con id_tipo_certificado_persona = 11
  Y el operador NO tiene cargada su "Cédula de Identidad" (id_tipo = 1) ni su "Licencia de Conducir" (id_tipo = 2)
  Cuando el sistema evalúa la exigencia de "Cédula identidad" y "Licencia conducir" para dicho trabajador
  Entonces el sistema compara id_tipo_certificado_persona contra 1 y 2 respectivamente
  Y el documento de tipo ODI (id_tipo = 11) NO coincide con ninguna de las dos exigencias
  Y ambas exigencias deben mostrarse con indicador "❌" y estado PENDIENTE
  Y debe mostrarse el botón sobrio "📤 Subir" para permitir la carga de los documentos faltantes
  Y bajo ninguna circunstancia debe enlazarse el archivo del ODI (Doc 1016) a la Cédula o a la Licencia.

#### Escenario 10: Pareo determinístico estricto por ID de tipo en Equipos (Inmunidad a colisión Revisión Técnica / Certificación Izaje)
  Dado que la grúa asignada tiene registrada una "Revisión Técnica" con id_tipo_certificado = 2
  Y tiene registrado un "Certificado de Inspección de Equipo" con id_tipo_certificado = 5
  Y la OT exige tanto "Revisión Técnica" como "Certificación Anual Izaje"
  Cuando el sistema evalúa la coincidencia de certificados
  Entonces la exigencia "Revisión Técnica" (id_tipo = 2) vincula exclusivamente al certificado con id_tipo = 2
  Y la exigencia "Certificación Anual Izaje" (id_tipo in [5, 6]) vincula exclusivamente al certificado con id_tipo = 5
  Y bajo ninguna circunstancia la "Certificación Anual Izaje" debe vincularse al archivo de la Revisión Técnica.
