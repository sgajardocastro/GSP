# Core Entities - Estructura de Datos y Contratos JSON

## Propósito de este documento
Este archivo es el **diccionario de arquitectura de datos** del sistema GSP. Define, para cada entidad central (tabla), qué campos van en columnas relacionales reales y qué datos se persisten en `json_field`. Debe ser leído **antes de implementar cualquier INSERT, UPDATE o payload** que involucre estas entidades.

---

## Reglas Globales

1. **Nunca pasar RUTs como FK.** Siempre resolver el `rut_empresa` → `id_empresa` antes de persistir. Los `id_*` son los identificadores relacionales del sistema.
2. **json_field es extensible, no es una papelera.** Solo van en JSON los datos que no tienen columna propia y que son datos de negocio legítimos (no metadatos temporales de UI).
3. **El campo `id_proyecto_estado` es la variable más importante del ciclo de vida.** Define la fase del proyecto. Nunca crear un proyecto sin definir su estado inicial.
4. **Los surveys (visitas a terreno, checklists) son entidades propias**, gestionadas mediante `tsrv_survey` y `tsrv_templates`. No deben persistirse dentro del `json_field` de `tpry_proyecto`.

---

## Entidad: `tpry_proyecto`

### DDL de referencia
```sql
CREATE TABLE tpry_proyecto(
    id_proyecto              SERIAL NOT NULL,
    id_proyecto_padre        integer,
    nombre_proyecto          varchar(500),
    objetivo_proyecto        varchar(4000),
    observacion_proyecto     varchar(4000),
    fecha_plan_ini           date,
    fecha_plan_fin           date,
    fecha_real_ini           timestamp,
    fecha_real_fin           timestamp,
    fecha_creacion           date,
    fecha_modificacion       timestamp,
    duracion_plan            integer,
    duracion_real            integer,
    id_usuario_jefe_proyecto integer,
    id_usuario_creacion      integer,
    id_usuario_modificacion  integer,
    id_usuario_cliente       integer,
    id_proyecto_tipo         integer,
    id_proyecto_estado       integer,
    id_empresa               integer,   -- empresa emisora (San Pablo, Bestmaq, etc.)
    id_empresa_cliente       integer,   -- empresa cliente/mandante
    centro_costo             varchar(50),
    codi_proyecto            varchar(50),
    avance_real_proyecto     integer,
    avance_plan_proyecto     integer,
    json_field               jsonb
);
```

### Ciclo de vida (`id_proyecto_estado`)
| Valor | Estado | Descripcion |
|---|---|---|
| 1 | Oportunidad | Registrada desde CRM, sin adjudicacion |
| 2 | En Cotizacion | Cotizacion activa enviada al cliente |
| 3 | Adjudicado | Cliente aprobo la propuesta |
| 4 | En Ejecucion | Servicio en terreno activo |
| 5 | Cerrado | Servicio finalizado |
| 6 | Perdido | Licitacion o cotizacion rechazada |

IMPORTANTE: El estado `1 = Oportunidad` es el unico que debe usarse cuando se registra desde el CRM (boton "Guardar en Preventa").

---

### Mapeo de Campos: Formulario CRM → `tpry_proyecto`

#### Columnas relacionales (deben ir en el payload raiz, NO en json_field)

| Campo del Formulario CRM | Columna en BD | Notas |
|---|---|---|
| `opportunity.id_empresa_emisora` | `id_empresa` | FK a tpar_empresas. San Pablo=9, Bestmaq=7, Logistica Sur=8, Royal Rental=11 |
| `selectedClient.id_empresa` | `id_empresa_cliente` | FK a tpar_empresas. Usar id_empresa, NO el RUT. Resolver desde autocomplete. |
| `siteVisit.obra_nombre` o `opportunity.descripcion` | `nombre_proyecto` | Preferir nombre de la obra si existe |
| `antecedentes.identificador` | `codi_proyecto` | Codigo del proceso licitatorio. Si no existe, generar COT-{timestamp} |
| `opportunity.descripcion` | `objetivo_proyecto` | Descripcion general del requerimiento |
| `siteVisit.detalle_servicio` | `observacion_proyecto` | Detalle tecnico-operativo del servicio |
| `opportunity.fecha_tentativa` | `fecha_plan_ini` | Fecha planificada de inicio del servicio |
| Hardcoded `1` | `id_proyecto_estado` | Estado inicial siempre = 1 (Oportunidad) |
| JWT `req.user.id_user` | `id_usuario_creacion` | Inyectado por el backend desde el token |

---

#### Contrato del `json_field` para fase Oportunidad/Preventa

Los siguientes datos no tienen columna propia y deben persistirse en `json_field`.
Esta estructura debe mantenerse estable y solo crecer hacia adelante (nunca eliminar llaves ya usadas).

```json
{
  "crm_v1": {
    "prioridad":             "normal | alta | baja",
    "familia_servicio":      "Gruas Telescopicas | Gruas Pluma | Logistica",
    "contacto_nombre":       "Nombre del contacto en empresa cliente",
    "contacto_telefono":     "+569XXXXXXXX",
    "tipo_pago":             "transferencia | cheque | credito_30 | credito_60",
    "requiere_oc_hes":       true,
    "requiere_acreditacion": false,
    "acreditacion_docs":     "Lista de documentos requeridos",
    "tipo_proceso":          "Licitacion Privada | Licitacion Publica | Trato Directo",
    "condiciones_pdf":       "Texto adicional de cláusulas comerciales",
    "coordenadas_mapa":      { "lat": -33.4489, "lng": -70.6693 },
    "archivos_licitacion":   [
      { 
        "nombre": "plano.pdf", 
        "tamano": 102450, 
        "fecha_subida": "2026-07-15", 
        "comentario": "Plano revisado por operaciones" 
      }
    ],
    "cotizaciones_historicas": [
      { 
        "id_cotizacion": 45,
        "version": 1,
        "nombre_archivo": "GSP-2607-042V1-45.pdf",
        "monto": 25300000,
        "fecha": "2026-07-15T12:00:00Z",
        "url": "/api/archivo/cotizaciones/GSP-2607-042V1-45.pdf" 
      }
    ],
    "lineas_servicio": [
      {
        "tipo":          "Equipo (Grua) | Mano de Obra | Transporte | Materiales",
        "descripcion":   "Descripcion del item",
        "cantidad":      1,
        "unidad":        "Hrs | Dias | Semanas | Meses | Gl | Un",
        "valorUnitario": 500000
      }
    ]
  }
}
```

CONVENCION DE VERSIONADO: El json_field usa una llave raiz `crm_v1` para encapsular los datos del CRM.
Si en el futuro se agregan datos de otros modulos, se crean llaves paralelas:
- `crm_v1`: datos de oportunidad/preventa desde el CRM
- `ejecucion_v1`: datos post-adjudicacion cuando el proyecto pasa a estado 3 o 4
- `facturacion_v1`: datos de facturacion y condiciones comerciales al cierre
Esto evita colisiones y permite saber que modulo genero cada dato.

---

#### Datos que NUNCA deben ir en `json_field` de `tpry_proyecto`

| Dato | Razon |
|---|---|
| Datos de visita a terreno (coordenadas, fotos, checklist tecnico) | Se gestionan como Survey en tsrv_survey, vinculados por id_proyecto. |
| Informacion de faena post-adjudicacion | Corresponde a estado 3 o 4. Se agrega en ejecucion_v1. |
| Archivos binarios o imagenes | Se almacenan en sistema de archivos y se referencia solo el path/URL. |

---

### Payload canonico: `POST /api/proyectos/preventa`

Este es el payload canonico para crear una oportunidad desde el CRM.
El backend inyecta `id_usuario_creacion` desde el JWT automaticamente.

```javascript
const payload = {
  // Columnas reales de la tabla
  id_empresa:           opportunity.id_empresa_emisora,        // ej: 9 (San Pablo)
  id_empresa_cliente:   selectedClient.id_empresa,             // resolver desde autocomplete
  nombre_proyecto:      siteVisit.obra_nombre || opportunity.descripcion,
  codi_proyecto:        antecedentes.identificador || 'COT-' + Date.now(),
  objetivo_proyecto:    opportunity.descripcion,
  observacion_proyecto: siteVisit.detalle_servicio,
  fecha_plan_ini:       opportunity.fecha_tentativa || null,
  id_proyecto_estado:   1, // Oportunidad

  // JSON field estructurado bajo convencion crm_v1
  json_field: {
    crm_v1: {
      prioridad:             opportunity.prioridad,
      familia_servicio:      opportunity.familia_servicio,
      contacto_nombre:       opportunity.contacto_nombre,
      contacto_telefono:     opportunity.contacto_telefono,
      tipo_pago:             opportunity.tipo_pago,
      requiere_oc_hes:       opportunity.requiere_oc_hes,
      requiere_acreditacion: opportunity.requiere_acreditacion,
      acreditacion_docs:     opportunity.acreditacion_docs,
      tipo_proceso:          antecedentes.tipo_proceso,
      archivos_licitacion:   antecedentes.archivos,
      lineas_servicio:       lines,
    }
  }
}
```

---

## Entidad: `tsrv_survey` (Visitas a Terreno y Checklists)

Ver documento: modelo_surveys_leanglobal.md en esta misma carpeta.

Los surveys se vinculan a un proyecto mediante `id_proyecto`.
Son entidades independientes con su propio ciclo de vida.
El `json_field` de `tpry_proyecto` no debe duplicar datos que ya existen en un survey vinculado.

---

## Pendiente de documentar (proximas entidades)
- `tpar_empresas` → estructura de clientes y mandantes, como resolver RUT → id_empresa
- `tpry_equipo_proyecto` → miembros del equipo por proyecto
- `tpry_estado` / `tpry_tipo` → catalogos de estados y tipos de proyecto
