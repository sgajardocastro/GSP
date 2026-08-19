# 📐 Especificación y Arquitectura Técnica: Modelo Relacional PostgreSQL para Despacho de Convoy, Manifiesto de Carga y Retorno de Faena

> **Documento:** `.agents/specs/29_analisis_preparacion_salida_y_despacho_convoy_spec.md`  
> **Proyecto:** Grúas San Pablo (GSP) • Plataforma LeanGlobal  
> **Módulo:** Operaciones / Despacho de Convoy, Manifiesto de Carga y Manifiesto Inverso  
> **Audiencia:** Equipo de Desarrollo, Arquitectura de Base de Datos y Backend  
> **Estado:** Especificación Formal de Arquitectura (Spec-Driven)  
> **Fecha:** 18 de Agosto de 2026  

---

## 1. Fundamentación Arquitectónica: Por qué Tablas Relacionales y no `json_field`

Durante el análisis del ciclo logístico de Grúas San Pablo, se evaluó si el manifiesto de aparejos y el convoy debían residir en el `json_field` de `tpry_proyecto` o en un **modelo de tablas relacionales dedicadas en PostgreSQL**.

### 🚨 Limitaciones Críticas del Enfoque JSON:
1. **Imposibilidad de Consultas WMS / Inventario Directas:** Si los aparejos viven dentro de arrays JSON, el módulo de Bodega no puede responder de forma rápida: *"¿Cuántos grilletes de 25T o balancines de viga están actualmente en tránsito a faena vs disponibles en bodega central?"*. Requeriría costosos `jsonb_array_elements` que degradan la performance.
2. **Pérdida de Integridad Referencial (Foreign Keys):** Un JSON no valida si el `id_equipo` asignado existe en `tequ_equipo`, si el conductor está activo en `tsec_users` o si el checklist de patio registrado en `tsrv_survey` fue efectivamente aprobado.
3. **Riesgo de Concurrencia (Lost Updates):** Si el chofer registra su odómetro en la PWA mientras el despachador marca el trincaje en patio y el coordinador edita notas en oficina, la sobreescritura de todo el `json_field` puede eliminar los cambios de los demás actores.

### 🏆 Ventajas del Modelo Relacional Normalizado:
* **Integridad Transaccional:** Cada vehículo, aparejo y evento de salida/retorno es una fila atómica en PostgreSQL con llaves foráneas e índices.
* **Trazabilidad de Pérdidas y Bajas:** Historial SQL directo de aparejos dados de baja por fatiga o extraviados en faenas mineras para reportería gerencial y cobro.
* **Escalabilidad:** Soporte nativo para convoyes de 1 a N vehículos y de 1 a N aparejos por servicio.

---

## 2. Diagrama Entidad-Relación (ERD)

```
┌────────────────────────────────────────────────────────────────────────┐
│ tpry_proyecto (Tabla Maestra de Proyectos / OTs)                       │
│ PK id_proyecto                                                         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ 1 a 1 (o 1 a N por servicio)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 1. topr_despacho_convoy (Cabecera de Despacho y Circuito Logístico)    │
├────────────────────────────────────────────────────────────────────────┤
│ • id_despacho (PK SERIAL)                                              │
│ • id_proyecto (FK tpry_proyecto.id_proyecto)                           │
│ • codi_despacho (VARCHAR: "DSP-2026-0066")                             │
│ • estado_despacho (VARCHAR: BORRADOR, PATIO, EN_RUTA, RETORNADO, ...)  │
│ • fecha_salida_plan / fecha_salida_real (TIMESTAMP)                    │
│ • id_user_despachador (FK tsec_users.id_user)                          │
│ • trincaje_verificado (BOOLEAN)                                        │
│ • obs_despacho_salida (TEXT)                                           │
│ • fecha_retorno_real (TIMESTAMP)                                       │
│ • id_user_receptor (FK tsec_users.id_user)                             │
│ • obs_retorno_recepcion (TEXT)                                         │
│ • created_at / updated_at (TIMESTAMP)                                  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ 1 a N
         ┌──────────────────────────┴──────────────────────────┐
         ▼                                                     ▼
┌──────────────────────────────────────┐   ┌──────────────────────────────────────┐
│ 2. topr_despacho_flota               │   │ 3. topr_despacho_aparejos            │
│ (Vehículos y Máquinas del Convoy)    │   │ (Manifiesto de Carga y Retorno 1a1)  │
├──────────────────────────────────────┤   ├──────────────────────────────────────┤
│ • id_despacho_flota (PK SERIAL)      │   │ • id_despacho_aparejo (PK SERIAL)    │
│ • id_despacho (FK topr_despacho)     │   │ • id_despacho (FK topr_despacho)     │
│ • id_equipo (FK tequ_equipo)         │   │ • codi_aparejo (VARCHAR: estrobos...)│
│ • patente (VARCHAR)                  │   │ • descripcion_aparejo (TEXT)         │
│ • rol_convoy (GRUA, CAMA_BAJA, ESC)  │   │ • cantidad_requerida_ot (VARCHAR)    │
│ • id_user_conductor (FK tsec_users)  │   │ • id_equipo_transporte (FK tequ)     │
│ • id_survey_chk_salida (FK survey 76)│   │ • ubicacion_transporte (VARCHAR)     │
│ • horometro_salida / odometro_salida │   │ • cantidad_embarcada (VARCHAR)       │
│ • id_survey_chk_retorno (FK survey)  │   │ • verificado_embarque (BOOLEAN)      │
│ • horometro_retorno / odomet_retorno │   │ • cantidad_retornada (VARCHAR)       │
│                                      │   │ • estado_retorno (OK, DANADO, PERDID)│
│                                      │   │ • disposicion_retorno (STOCK, BAJA)  │
└──────────────────────────────────────┘   └──────────────────────────────────────┘
```

---

## 3. Definición DDL de Tablas PostgreSQL (Scripts SQL)

```sql
-- 1. TABLA CABECERA: topr_despacho_convoy
CREATE TABLE IF NOT EXISTS topr_despacho_convoy (
    id_despacho SERIAL PRIMARY KEY,
    id_proyecto INTEGER NOT NULL REFERENCES tpry_proyecto(id_proyecto) ON DELETE CASCADE,
    codi_despacho VARCHAR(50) UNIQUE,
    estado_despacho VARCHAR(30) DEFAULT 'BORRADOR' CHECK (estado_despacho IN ('BORRADOR', 'PREPARACION_PATIO', 'AUTORIZADO_RUTA', 'EN_FAENA', 'RETORNADO_EN_REVISION', 'CERRADO_CONFORME', 'CERRADO_CON_OBSERVACIONES')),
    fecha_salida_plan TIMESTAMP,
    fecha_salida_real TIMESTAMP,
    id_user_despachador INTEGER REFERENCES tsec_users(id_user),
    trincaje_verificado BOOLEAN DEFAULT FALSE,
    obs_despacho_salida TEXT,
    fecha_retorno_real TIMESTAMP,
    id_user_receptor INTEGER REFERENCES tsec_users(id_user),
    obs_retorno_recepcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_topr_despacho_proyecto ON topr_despacho_convoy(id_proyecto);
CREATE INDEX IF NOT EXISTS idx_topr_despacho_estado ON topr_despacho_convoy(estado_despacho);

-- 2. TABLA DETALLE: topr_despacho_flota (Vehículos del Convoy)
CREATE TABLE IF NOT EXISTS topr_despacho_flota (
    id_despacho_flota SERIAL PRIMARY KEY,
    id_despacho INTEGER NOT NULL REFERENCES topr_despacho_convoy(id_despacho) ON DELETE CASCADE,
    id_equipo INTEGER REFERENCES tequ_equipo(id_equipo),
    patente VARCHAR(20) NOT NULL,
    tipo_vehiculo VARCHAR(50), -- 'Grúa Telescópica', 'Tracto Cama Baja', 'Camioneta Escolta'
    rol_convoy VARCHAR(30) DEFAULT 'GRUA_PRINCIPAL' CHECK (rol_convoy IN ('GRUA_PRINCIPAL', 'TRANSPORTE_CAMA_BAJA', 'ESCOLTA', 'APOYO_ADICIONAL')),
    id_user_conductor INTEGER REFERENCES tsec_users(id_user),
    id_survey_chk_salida INTEGER REFERENCES tsrv_survey(id_survey),
    horometro_salida NUMERIC(10,2),
    odometro_salida NUMERIC(10,2),
    id_survey_chk_retorno INTEGER REFERENCES tsrv_survey(id_survey),
    horometro_retorno NUMERIC(10,2),
    odometro_retorno NUMERIC(10,2),
    observaciones_equipo TEXT
);

CREATE INDEX IF NOT EXISTS idx_topr_flota_despacho ON topr_despacho_flota(id_despacho);
CREATE INDEX IF NOT EXISTS idx_topr_flota_equipo ON topr_despacho_flota(id_equipo);

-- 3. TABLA DETALLE: topr_despacho_aparejos (Manifiesto de Carga & Retorno 1 a 1)
CREATE TABLE IF NOT EXISTS topr_despacho_aparejos (
    id_despacho_aparejo SERIAL PRIMARY KEY,
    id_despacho INTEGER NOT NULL REFERENCES topr_despacho_convoy(id_despacho) ON DELETE CASCADE,
    codi_aparejo VARCHAR(50) NOT NULL, -- 'estrobos', 'eslingas', 'grilletes', 'pulpos_cadena', 'cadenas', 'balancines', 'canastillos', 'otros_accesorios'
    label_aparejo VARCHAR(100) NOT NULL,
    descripcion_especifica TEXT, -- Capacidad, largo o detalle técnico registrado
    cantidad_requerida_ot VARCHAR(50) NOT NULL, -- '1', '3', '5', 'otrow'
    id_equipo_transporte INTEGER REFERENCES tequ_equipo(id_equipo), -- Camión asignado de carga
    ubicacion_transporte VARCHAR(100), -- 'Cajonera Grúa', 'Cama Baja', 'Camioneta Escolta'
    cantidad_embarcada VARCHAR(50),
    verificado_embarque BOOLEAN DEFAULT FALSE,
    cantidad_retornada VARCHAR(50),
    estado_retorno VARCHAR(30) DEFAULT 'PENDIENTE' CHECK (estado_retorno IN ('PENDIENTE', 'CONFORME', 'DANADO_FATIGA', 'EXTRAVIADO_EN_OBRA', 'RECERTIFICACION')),
    disposicion_retorno VARCHAR(30) DEFAULT 'EN_TRANSITO' CHECK (disposicion_retorno IN ('EN_TRANSITO', 'STOCK_BODEGA', 'TALLER_MANTENCION', 'BAJA_DEFINITIVA', 'COBRO_CLIENTE')),
    obs_retorno TEXT
);

CREATE INDEX IF NOT EXISTS idx_topr_aparejos_despacho ON topr_despacho_aparejos(id_despacho);
CREATE INDEX IF NOT EXISTS idx_topr_aparejos_codi ON topr_despacho_aparejos(codi_aparejo);
```

---

## 4. Flujo de Estados del Despacho (State Machine)

```
[ ASIGNACIÓN OT ] 
       │ (Genera registro en topr_despacho_convoy y topr_despacho_aparejos)
       ▼
[ BORRADOR / PREPARACIÓN_PATIO ]
       │ • Choferes ejecutan Template 76 en PWA (vincula id_survey_chk_salida)
       │ • Despachador marca verificado_embarque en topr_despacho_aparejos
       │ • Despachador valida trincaje_verificado = true
       ▼
[ AUTORIZADO_RUTA ] ➔ Registra fecha_salida_real y horómetros iniciales
       │
       ▼
[ EN_FAENA ] ➔ Ejecución de la maniobra de izaje en obra
       │
       ▼
[ RETORNADO_EN_REVISION ] ➔ Llegada a base, conteo de descarga y registro de Template 76 de entrada
       │
       ├─► Si 100% de aparejos CONFORME ➔ [ CERRADO_CONFORME ] (Reingreso automático a Stock WMS)
       │
       └─► Si hay faltantes o daños    ➔ [ CERRADO_CON_OBSERVACIONES ] (Alerta de cobro / Mantenimiento)
```

---

## 5. Diseño de Endpoints REST API (Node.js / Express)

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/despacho/proyecto/:id_proyecto` | Obtiene el despacho completo de la OT con su flota, checklists y aparejos. |
| `POST` | `/api/despacho/sincronizar-ot/:id_proyecto` | Crea o sincroniza el despacho a partir de la Asignación de la OT (Stowage Plan). |
| `PUT` | `/api/despacho/:id_despacho/embarque-aparejos` | Actualiza la verificación física de carga y trincaje de aparejos en patio. |
| `POST` | `/api/despacho/:id_despacho/autorizar-salida` | Valida que todos los checklists 76 y aparejos estén OK y abre el portón (pasa a `AUTORIZADO_RUTA`). |
| `POST` | `/api/despacho/:id_despacho/cerrar-retorno` | Registra el conteo ciego de retorno, detecta fatiga/extravíos y cierra el ciclo. |

---

## 6. Saneamiento del Template 76 en PostgreSQL (`tsrv_templates`)

El Template 76 (`TMPL-GSP-CHK-EQUIPOS`) se actualiza mediante script SQL para eliminar los campos de aparejos de izaje específicos y consolidar 6 secciones puramente mecánicas:

```sql
UPDATE tsrv_templates 
SET body_seed = '{
  "segmentos": [
    {
      "label": "1. DATOS GENERALES DEL VEHICULO",
      "attributes": [
        { "type": "comboBox", "label": "TIPO DE MOVIMIENTO", "values": { "quest": "TIPO DE MOVIMIENTO", "selected": "", "options": [{ "id": "SALIDA", "label": "SALIDA A FAENA", "value": "SALIDA" }, { "id": "ENTRADA", "label": "ENTRADA A BASE", "value": "ENTRADA" }] } },
        { "type": "textField", "label": "NUMERO DE OT / PROYECTO", "nullable": true },
        { "type": "textField", "label": "NOMBRE DEL CONDUCTOR / OPERADOR", "nullable": false },
        { "type": "textField", "label": "PLACA PATENTE", "nullable": false },
        { "type": "textField", "label": "HOROMETRO / ODOMETRO ACTUAL", "nullable": false }
      ]
    },
    {
      "label": "2. SISTEMA DE LUCES Y SENALIZACION",
      "attributes": [
        { "type": "photoCheck", "label": "Luces Delanteras y Focos", "options": [{"id": "OK", "label": "OK"}, {"id": "FALLA", "label": "FALLA"}, {"id": "NA", "label": "N/A"}] },
        { "type": "photoCheck", "label": "Luces Traseras y Freno", "options": [{"id": "OK", "label": "OK"}, {"id": "FALLA", "label": "FALLA"}, {"id": "NA", "label": "N/A"}] },
        { "type": "photoCheck", "label": "Intermitentes y Baliza", "options": [{"id": "OK", "label": "OK"}, {"id": "FALLA", "label": "FALLA"}, {"id": "NA", "label": "N/A"}] },
        { "type": "photoCheck", "label": "Luz y Alarma de Retroceso", "options": [{"id": "OK", "label": "OK"}, {"id": "FALLA", "label": "FALLA"}, {"id": "NA", "label": "N/A"}] }
      ]
    },
    {
      "label": "3. CABINA Y MANDOS OPERACIONALES",
      "attributes": [
        { "type": "photoCheck", "label": "Cinturon de Seguridad", "options": [{"id": "OK", "label": "OK"}, {"id": "FALLA", "label": "FALLA"}] },
        { "type": "photoCheck", "label": "Espejos y Vidrios", "options": [{"id": "OK", "label": "OK"}, {"id": "FALLA", "label": "FALLA"}] },
        { "type": "photoCheck", "label": "Bocina y Alarma Sonora", "options": [{"id": "OK", "label": "OK"}, {"id": "FALLA", "label": "FALLA"}] },
        { "type": "photoCheck", "label": "Frenos de Servicio y Estacionamiento", "options": [{"id": "OK", "label": "OK"}, {"id": "FALLA", "label": "FALLA"}] }
      ]
    },
    {
      "label": "4. NEUMATICOS, FLUIDOS Y FUGAS",
      "attributes": [
        { "type": "photoCheck", "label": "Estado y Presion de Neumaticos", "options": [{"id": "OK", "label": "OK"}, {"id": "FALLA", "label": "FALLA"}] },
        { "type": "photoCheck", "label": "Neumatico de Repuesto", "options": [{"id": "OK", "label": "OK"}, {"id": "FALLA", "label": "FALLA"}, {"id": "NA", "label": "N/A"}] },
        { "type": "photoCheck", "label": "Niveles de Aceite, Refrigerante e Hidraulico", "options": [{"id": "OK", "label": "OK"}, {"id": "FALLA", "label": "FALLA"}] },
        { "type": "photoCheck", "label": "Sin Fugas Visibles de Fluidos", "options": [{"id": "OK", "label": "OK"}, {"id": "FALLA", "label": "FALLA"}] }
      ]
    },
    {
      "label": "5. ELEMENTOS DE SEGURIDAD Y EMERGENCIA",
      "attributes": [
        { "type": "photoCheck", "label": "Extintor Certificado y Vigente", "options": [{"id": "OK", "label": "OK"}, {"id": "FALLA", "label": "FALLA"}] },
        { "type": "photoCheck", "label": "Cunas de Bloqueo (Par)", "options": [{"id": "OK", "label": "OK"}, {"id": "FALLA", "label": "FALLA"}] },
        { "type": "photoCheck", "label": "Botiquin de Primeros Auxilios", "options": [{"id": "OK", "label": "OK"}, {"id": "FALLA", "label": "FALLA"}] },
        { "type": "photoCheck", "label": "Conos y Triangulos de Emergencia", "options": [{"id": "OK", "label": "OK"}, {"id": "FALLA", "label": "FALLA"}] }
      ]
    },
    {
      "label": "6. CIERRE Y FIRMA DIGITAL",
      "attributes": [
        { "type": "textArea", "label": "OBSERVACIONES MECANICAS", "nullable": true },
        { "type": "signature", "label": "FIRMA DEL CONDUCTOR / OPERADOR", "nullable": false }
      ]
    }
  ]
}'
WHERE id_template = 76;
```

---

## 7. Plan de Implementación por Fases (TI)

1. **Fase 1 (Migración DB):** Crear las tablas `topr_despacho_convoy`, `topr_despacho_flota` y `topr_despacho_aparejos` en PostgreSQL.
2. **Fase 2 (Saneamiento Template 76):** Ejecutar el script SQL de actualización en `tsrv_templates` (id: 76).
3. **Fase 3 (Backend REST API):** Implementar el controlador `despachoConvoyController.js` y sus rutas en Express.
4. **Fase 4 (Frontend Asignación):** Conectar la selección de camión de transporte en la Matriz de Aparejos (`GestorOportunidades.vue`).
5. **Fase 5 (Frontend Despacho y Retorno):** Construir los paneles de despacho de salida y manifiesto inverso de llegada.
