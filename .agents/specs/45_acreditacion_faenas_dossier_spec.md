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
