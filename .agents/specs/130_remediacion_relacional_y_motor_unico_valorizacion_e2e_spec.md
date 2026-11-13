# SPEC-130: Remediación Estructural Relacional, Normalización de Asignaciones y Motor Único Canónico de Valorización E2E (Cotización -> OT -> Terreno -> ITS -> EDP)

- **Código de Especificación:** `SPEC-130`
- **Fecha:** 2026-11-13
- **Autor:** Staff Backend & Database Engineer
- **Rama:** `feature/spec130-remediacion-estructural`
- **Estado:** Implementado / Listo para Migración
- **Especificaciones Precedentes:** `SPEC-016`, `SPEC-065`, `SPEC-081`, `SPEC-082`, `SPEC-115`, `SPEC-117`, `SPEC-125`, `SPEC-127`, `SPEC-128`, `SPEC-129`
- **Acuerdo Fundacional:** Minuta de Reunión Técnica 11-Nov-2026 (Jorge Ponce, Alfonso Porperrello, Staff Engineering)

---

## 1. Diagnóstico Estructural y Problema de Fondo

### 1.1. La Brecha Relacional Histórica
Históricamente, la plataforma almacenó la estructura de servicios y tarifas pactadas dentro de columnas semiestructuradas `JSONB` (`tpry_proyecto.json_field->'servicios'` o `'crm'->'lineas_servicio'`). Si bien esta decisión confirió flexibilidad inicial, introdujo fallas sistémicas a medida que el negocio escaló:
1. **Pérdida de Integridad Referencial:** No existía clave foránea que garantizara que una asignación de maquinaria (`tpry_rel_equipo`) o de personal (`tpry_rel_persona`) estuviese atada a la línea comercial que financia su movilización o devengo.
2. **Proliferación de Recursos Zombi:** Al no contar con restricciones de unicidad sobre asignaciones activas, se generaron asignaciones duplicadas de una misma grúa o chofer en un mismo proyecto tras sucesivas reprogramaciones.
3. **Dispersión de Reglas de Cálculo (Inconsistencia Multicapa):** Existían hasta 4 implementaciones paralelas de cálculo de subtotales: en el frontend Vue (`cotizacion.js`), en la compilación HTML de propuestas (`proyectoModel.js`), en el generador de ITS (`itsPdfService.js`) y en el EDP (`edpPdfService.js`). Cada una interpretaba de manera discrepante las cadenas de texto correspondientes a la unidad de cobro ('Por Hora', 'hrs', 'Horas Diarias Minimas', 'FIJO', 'Suma Alzada').
4. **Distorsión en Cobros Únicos (SPEC-128):** Las modalidades de suma alzada y fletes sufrían multiplicaciones accidentales por días u horas mínimas al ser procesadas por algoritmos diseñados exclusivamente para grúas por hora.

### 1.2. Mandato Constitucional de Resolución de Fondo
Esta especificación resuelve la arquitectura en sus capas relacional, lógica y de presentación, eliminando de forma definitiva cualquier parche superficial mediante:
- Creación de la tabla canónica normalizada `tpry_linea_servicio` en `sch_leangsp`.
- Saneamiento y restricción parcial en `tpry_rel_equipo` y `tpry_rel_persona`.
- Migración determinista e idempotente del histórico desde `tpry_proyecto.json_field`.
- Unificación matemática absoluta en el servicio `motorValorizacionService.js`.

---

## 2. Clasificación Canónica de las 4 Líneas de Negocio (Acuerdo 11-Nov-2026)

Conforme a la resolución unánime con la Dirección de Operaciones (Jorge Ponce) del 11-Nov-2026, el universo operativo y comercial se estructura en 4 líneas de negocio disjuntas:

```
                                    +------------------------------------------+
                                    |         LÍNEAS DE NEGOCIO GSP            |
                                    +------------------------------------------+
                                                         |
         +------------------------+----------------------+-----------------------+------------------------+
         |                        |                                              |                        |
         v                        v                                              v                        v
+------------------+    +-------------------+                          +-------------------+    +-------------------+
|      IZAJE       |    |      RENTAL       |                          |    TRANSPORTE     |    |    PROFESIONAL    |
|  (OT-MANIOBRA)   |    |    (OT-RENTAL)    |                          |    (OT-FLETE)     |    |    (OT-STAFF)     |
+------------------+    +-------------------+                          +-------------------+    +-------------------+
| - Telescópicas   |    | - Tijeras         |                          | - Cama Baja       |    | - Solo Rigger     |
| - Camiones Pluma |    | - Brazos Artic.   |                          | - Rampla Carga    |    | - Supervisor APR  |
| - Grúas Horquilla|    | - Alza Hombres    |                          | - Tracto Remolque |    | - Ing. Rigging    |
| - Manipuladores  |    | - Dry Lease       |                          | - Flete Puro      |    | - Plan de Izaje   |
| (Con Operador)   |    | (Sin Operador)    |                          | (Sin Report Izaje)|    | (Sin Maquinaria)  |
+------------------+    +-------------------+                          +-------------------+    +-------------------+
```

### 2.1. Reglas Canónicas por Línea
1. **`IZAJE` (`OT-MANIOBRA`):**
   - **Regla Jorge Ponce (11-Nov):** Grúas Horquilla y Manipuladores Telescópicos se gestionan bajo la misma lógica de Izaje (operador dedicado, report diario de maniobra, cómputo de horas con régimen Urbano/Rural).
   - Genera obligatoriamente: Desplazamiento (`tequ_log_desplazamiento`) + Report Diario de Avance (`tedp_reporte_avance`).
2. **`RENTAL` (`OT-RENTAL`):**
   - Equipos en arriendo sin operador (`sin_operador = true`).
   - Cero Reportes Diarios de Izaje. Gobernado estrictamente por **Contrato de Arriendo + Acta de Entrega y Retiro 360° en 2 Instancias** (`ENTREGA` y `RETIRO`).
3. **`TRANSPORTE` (`OT-FLETE`):**
   - Logística de carga pesada, cama baja, traslado de contrapesos y fletes a terceros.
   - Sin Report Diario de Izaje (`piso_minimo_horas = 0`). Gobernado por **Registro de Desplazamiento (`tequ_log_desplazamiento`) + Guía de Despacho / Comprobante de Viaje**.
4. **`PROFESIONAL` (`OT-STAFF`):**
   - Personal técnico certificado y consultoría de ingeniería sin equipo pesado.
   - Cero maquinaria asociada (`id_equipo = NULL`). Habilita asignación en `tpry_rel_persona`. Sus reportes registran asistencia física (`horas_facturables = 0` si es a Valor Fijo, sirviendo de respaldo de terreno).

---

## 3. Catálogo Canónico de las 10 Unidades de Cobro Limpias

Para erradicar la dispersión de strings arbitrarios ('Por Hora', 'hrs', 'dia', 'Suma Alzada'), se establece un enum canónico cerrado de 10 modalidades divididas en 2 grupos:

### Grupo A: Cobro Único (Invariante SPEC-128: `cantidad = 1` fijo, `piso_minimo_horas = 0`)
1. **`Valor Fijo`**: Suma alzada por hito o evento completo (ej. maniobra cerrada, estudio de rigging).
2. **`Traslado Ida`**: Flete de entrega en un solo sentido (Base -> Faena).
3. **`Traslado Vuelta`**: Flete de retorno en un solo sentido (Faena -> Base).
4. **`Traslado Ida/Vuelta`**: Flete redondo consolidado en una sola tarifa indivisible.

### Grupo B: Medición por Tiempo / Período
5. **`Hora Efectiva`**: Tarifa horaria pura sin piso mínimo diario. `Subtotal = horas_reales × valor_unitario`.
6. **`Horas Diarias Minimas`**: Tarifa horaria garantizada con piso diario (típicamente 8h o 9h). `Subtotal = max(horas_reales, piso_minimo) × valor_unitario`.
7. **`Horas Mes Minimas`**: Tarifa horaria mensual garantizada con bolsa base (típicamente 180h). `Subtotal = max(bolsa_mes, total_horas_reales) × valor_unitario`.
8. **`Valor Fijo Diario`**: Tarifa por jornada diaria de disposición. `Subtotal = dias_ejecutados × valor_unitario`.
9. **`Valor Fijo Semanal`**: Tarifa plana por período de 7 días. `Subtotal = semanas_ejecutadas × valor_unitario`.
10. **`Valor Fijo Mensual`**: Tarifa plana por mes calendario (30 días). `Subtotal = meses_ejecutados × valor_unitario` (+ cobro de exceso horométrico si aplica).

### Matriz Comparativa y Fórmulas Matemáticas

| Unidad Canónica | Grupo | Cantidad en Cotización | Subtotal Cotización | Devengo Terreno (ITS) | Liquidación EDP |
| :--- | :---: | :---: | :--- | :--- | :--- |
| **`Valor Fijo`** | A | `1` (Inmutable) | `1 × valor_unitario` | `100% valor_unitario` | `100% valor_unitario` |
| **`Traslado Ida`** | A | `1` (Inmutable) | `1 × valor_unitario` | `100%` al cumplir Ida | `100%` en 1er corte |
| **`Traslado Vuelta`** | A | `1` (Inmutable) | `1 × valor_unitario` | `100%` al cumplir Retorno | `100%` en corte final |
| **`Traslado Ida/Vuelta`** | A | `1` (Inmutable) | `1 × valor_unitario` | `100%` al ejecutar tramos | `100%` en corte acordado |
| **`Hora Efectiva`** | B | Estimada | `horas_est × valor_unitario` | `sum(horas_reales) × $/hr` | `horas_aprobadas × $/hr` |
| **`Horas Diarias Minimas`** | B | Días + Piso | `dias × piso_hrs × $/hr` | `sum(max(hrs_dia, piso)) × $/hr` | `horas_validadas × $/hr` |
| **`Horas Mes Minimas`** | B | Meses + Bolsa | `meses × bolsa_hrs × $/hr` | `max(bolsa, sum(hrs)) × $/hr` | `corte_mensual × $/hr` |
| **`Valor Fijo Diario`** | B | Días | `dias × valor_unitario` | `dias_efectivos × $/dia` | `dias_validados × $/dia` |
| **`Valor Fijo Semanal`** | B | Semanas | `semanas × valor_unitario` | `semanas_cumplidas × $/sem` | `semanas_validadas × $/sem` |
| **`Valor Fijo Mensual`** | B | Meses | `meses × valor_unitario` | `(dias / 30) × $/mes` | `canon_mensual + excesos` |

---

## 4. DDL Relacional de `tpry_linea_servicio` y Normalización de Asignaciones

### 4.1. Tabla Maestra de Líneas de Servicio (`sch_leangsp.tpry_linea_servicio`)
Permite representar la jerarquía completa en árbol de la cotización comercial (nodos raíz, hijos comerciales) y de la asignación operativa (apoyos logísticos):

```sql
CREATE TABLE IF NOT EXISTS sch_leangsp.tpry_linea_servicio (
    id_linea_servicio BIGSERIAL PRIMARY KEY,
    id_proyecto INT NOT NULL REFERENCES sch_leangsp.tpry_proyecto(id_proyecto) ON DELETE CASCADE,
    id_linea_servicio_padre BIGINT REFERENCES sch_leangsp.tpry_linea_servicio(id_linea_servicio) ON DELETE CASCADE,
    
    -- Clasificación de Negocio y Rol en el Árbol
    linea_negocio VARCHAR(30) NOT NULL CHECK (linea_negocio IN ('IZAJE', 'RENTAL', 'TRANSPORTE', 'PROFESIONAL')),
    tipo_ot VARCHAR(30) NOT NULL CHECK (tipo_ot IN ('OT-MANIOBRA', 'OT-RENTAL', 'OT-FLETE', 'OT-STAFF')),
    rol_nodo VARCHAR(30) NOT NULL CHECK (rol_nodo IN ('RAIZ', 'HIJO_COMERCIAL', 'APOYO_OPERATIVO', 'ACCESORIO', 'PERSONAL', 'TRASLADO')),
    
    -- Descripción y Metadatos
    descripcion TEXT NOT NULL,
    subcategoria VARCHAR(100),
    id_equipo_sugerido INT REFERENCES sch_leangsp.tequ_equipo(id_equipo) ON DELETE SET NULL,
    
    -- Modalidad de Cobro Canónica (10 Unidades Limpias)
    unidad VARCHAR(50) NOT NULL CHECK (unidad IN (
        'Valor Fijo', 
        'Traslado Ida', 
        'Traslado Vuelta', 
        'Traslado Ida/Vuelta', 
        'Hora Efectiva', 
        'Horas Diarias Minimas', 
        'Horas Mes Minimas', 
        'Valor Fijo Diario', 
        'Valor Fijo Semanal', 
        'Valor Fijo Mensual'
    )),
    
    -- Magnitudes Cuantitativas
    cantidad NUMERIC(10, 2) NOT NULL DEFAULT 1.00 CHECK (cantidad >= 0),
    cantidad_dias NUMERIC(10, 2),
    cantidad_horas NUMERIC(10, 2),
    cantidad_meses NUMERIC(10, 2),
    piso_minimo_horas NUMERIC(10, 2) DEFAULT 0.00 CHECK (piso_minimo_horas >= 0),
    
    -- Valores Financieros (Moneda Nacional CLP)
    valor_unitario NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (valor_unitario >= 0),
    subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
    
    -- Banderas Operativas
    incluido_en_tarifa BOOLEAN NOT NULL DEFAULT FALSE,
    es_apoyo_operativo BOOLEAN NOT NULL DEFAULT FALSE,
    metadata_json JSONB DEFAULT '{}'::jsonb,
    
    -- Auditoría
    id_user_creacion INT REFERENCES sch_leangsp.tsec_users(id_user) ON DELETE SET NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint Constitucional 1: No auto-dependencia directa
    CONSTRAINT chk_no_auto_dependencia CHECK (
        id_linea_servicio_padre IS NULL OR id_linea_servicio_padre <> id_linea_servicio
    ),
    
    -- Constraint Constitucional 2: Invariante Grupo A (Cobro Único)
    CONSTRAINT chk_invariante_cobro_unico CHECK (
        unidad NOT IN ('Valor Fijo', 'Traslado Ida', 'Traslado Vuelta', 'Traslado Ida/Vuelta') OR (
            cantidad = 1.00 AND COALESCE(piso_minimo_horas, 0.00) = 0.00
        )
    )
);
```

### 4.2. Normalización de Asignaciones y Eliminación de Recursos Zombi
Se modifican las tablas de asignación física de equipos y personas para enlazarlas formalmente a la línea de servicio y garantizar que un recurso no pueda estar duplicado en estado activo en el mismo proyecto/línea:

```sql
-- Normalización de Asignación de Equipos (tpry_rel_equipo)
ALTER TABLE sch_leangsp.tpry_rel_equipo 
    ADD COLUMN IF NOT EXISTS id_linea_servicio BIGINT REFERENCES sch_leangsp.tpry_linea_servicio(id_linea_servicio) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;

-- Índice Parcial de Unicidad: Un equipo solo puede tener una asignación activa por proyecto y línea
CREATE UNIQUE INDEX IF NOT EXISTS uq_tpry_rel_equipo_linea_activo 
    ON sch_leangsp.tpry_rel_equipo (id_proyecto, id_equipo, COALESCE(id_linea_servicio, 0)) 
    WHERE estado_real NOT IN ('CANCELADO', 'FINALIZADO', 'REEMPLAZADO') AND activo = TRUE;

-- Normalización de Asignación de Personas (tpry_rel_persona)
ALTER TABLE sch_leangsp.tpry_rel_persona 
    ADD COLUMN IF NOT EXISTS id_linea_servicio BIGINT REFERENCES sch_leangsp.tpry_linea_servicio(id_linea_servicio) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;

-- Índice Parcial de Unicidad: Un usuario solo puede tener una asignación activa por proyecto, rol y línea
CREATE UNIQUE INDEX IF NOT EXISTS uq_tpry_rel_persona_linea_activo 
    ON sch_leangsp.tpry_rel_persona (id_proyecto, id_user, rol_asignado, COALESCE(id_linea_servicio, 0)) 
    WHERE estado_real NOT IN ('CANCELADO', 'FINALIZADO', 'REEMPLAZADO') AND activo = TRUE;
```

---

## 5. Arquitectura del Motor Único de Valorización (`motorValorizacionService.js`)

Para asegurar cuadratura matemática perfecta (0 centavos de desviación) en toda la cadena de valor, se centraliza la lógica en `ejecucion/backend_remoto/src/services/motorValorizacionService.js`.

### 5.1. Firmas de Funciones Puras Canónicas

```typescript
// 1. Normalización estricta de cadenas de texto legacy a las 10 unidades oficiales
function normalizarUnidad(u: string): string;

// 2. Cálculo puro del subtotal de un nodo individual
function calcularSubtotalNodo(nodo: {
    unidad: string;
    valor_unitario: number;
    cantidad?: number;
    cantidad_dias?: number;
    cantidad_horas?: number;
    cantidad_meses?: number;
    piso_minimo_horas?: number;
    incluido_en_tarifa?: boolean;
}): number;

// 3. Valorización completa de un árbol de cotización comercial
function valorizarArbolCotizacion(servicios: Array<any>): {
    totalNeto: number;
    resumenPorLinea: Record<string, number>;
    nodosNormalizados: Array<any>;
    esValido: boolean;
    errores: Array<string>;
};

// 4. Conciliación E2E entre lo pactado comercialmente y lo ejecutado en faena
function conciliarDevengadoProyectoE2E(idProyecto: number, params: {
    lineasServicio: Array<any>;
    reportesAvance?: Array<any>;
    registrosViaje?: Array<any>;
    actasRental?: Array<any>;
    contexto?: 'URBANO' | 'RURAL';
}): {
    idProyecto: number;
    totalPresupuestadoNeto: number;
    totalDevengadoNeto: number;
    desviacionNeto: number;
    lineasConciliadas: Array<any>;
};

// 5. Liquidación formal de Estado de Pago (EDP) bajo el flujo de 2 Hitos
function liquidarEstadoPago2Hitos(params: {
    lineasConciliadas: Array<any>;
    hito1OperacionesAprobado: boolean;
    hito2ContabilidadAprobado: boolean;
    tasaIva?: number; // Default 0.19 (19%)
    retencionGarantiaPorcentaje?: number;
}): {
    montoNetoValidado: number;
    montoIva: number;
    montoRetencion: number;
    montoTotalFacturable: number;
    estadoHitos: {
        hito1: { aprobado: boolean; etiqueta: string };
        hito2: { aprobado: boolean; etiqueta: string };
    };
    lineasFacturables: Array<any>;
};
```

---

## 6. Matriz de Pruebas QA E2E

| Caso de Negocio | Proyecto Testigo | Línea / Rol | Unidad Canónica | Entradas de Prueba | Resultado Esperado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **QA-130-01** | FEPASA (`GSP-2611-00001`) | IZAJE (Grúa 70T) | `Horas Diarias Minimas` | 2 días, 9h mín, $120.000/hr | Subtotal = $2.160.000. Si en terreno hace 10h y 7h -> devenga (10 + 9) × $120.000 = $2.280.000. |
| **QA-130-02** | Plaenge (`GSP-2611-00002`) | PROFESIONAL (Rigger) | `Valor Fijo` | Cant=1, $300.000 neto | Subtotal = $300.000 fijo inmutable. Reports de terreno con 0h no reducen el devengo. |
| **QA-130-03** | Barthou (`GSP-2611-00003`) | IZAJE (Grúa 100T) + Contrapesos | `Valor Fijo` (Grúa) + `APOYO_OPERATIVO` | Grúa $1.000.000. Tracto contrapesos asignado como apoyo $0. | Subtotal Comercial = $1.000.000. Tracto no suma al cliente en EDP pero sí costea viaje en ITS. |
| **QA-130-04** | Besalco (`GSP-2611-00005`) | IZAJE (Horquilla) + Traslado | `Horas Diarias Minimas` + `Traslado Ida/Vuelta` | Horquilla 8h @ $45.000/hr ($360.000). Flete $160.000. | Subtotal = $520.000. Traslado no se divide por 2 ni multiplica por horas. |
| **QA-130-05** | Royal Rental (`RYL-2611-00001`)| RENTAL (Tijera 12m) | `Valor Fijo Mensual` | 1 mes @ $650.000. Retiro a los 15 días. | Subtotal = $650.000. Pro-rata por retiro anticipado = 15/30 × $650.000 = $325.000. |
| **QA-130-06** | Inarco (`GSP-2611-00006`) | IZAJE (Grúa 80T) | `Horas Mes Minimas` | 1 mes, bolsa 180h @ $95.000/hr | Subtotal = $17.100.000. Si acumula 195h -> devenga 195 × $95.000 = $18.525.000. |
| **QA-130-07** | Logística del Sur (`OT-FLETE-10`)| TRANSPORTE (Cama Baja) | `Traslado Ida` + `Traslado Vuelta` | Ida $450.000, Vuelta $400.000 | Subtotal = $850.000. Ambos con cantidad = 1 y piso_minimo = 0. |
| **QA-130-08** | Mettco (`GSP-2611-00007`) | IZAJE (Grúa 50T) + Rigger Inc. | `Horas Diarias Minimas` + `Incluido en Tarifa` | Grúa 8h @ $80.000. Rigger marcado incluido ($0). | Subtotal = $640.000. Rigger no genera línea comercial en EDP pero sí genera viático en Sección 3 ITS. |
| **QA-130-09** | Prevención Faena | PROFESIONAL (APR) | `Valor Fijo Diario` | 4 días @ $150.000/día | Subtotal = $600.000. No se contamina por cómputo de horas. |
| **QA-130-10** | Asistencia Técnica | PROFESIONAL (Ingeniería) | `Hora Efectiva` | 15 horas @ $50.000/hr | Subtotal = $750.000. Cobra horas netas sin piso mínimo. |
| **QA-130-11** | Liquidación EDP 2 Hitos | General | Mixto ($10.000.000 Neto) | Hito 1 Aprobado (Yiara), Hito 2 Aprobado (Maritza) | Neto $10.000.000, IVA 19% $1.900.000, Total $11.900.000. Cuadratura perfecta. |

---

## 7. Plan de Despliegue y Gobernanza

1. **Fase 1 (Local):** Creación de especificación, scripts de migración DDL y backfill, e implementación del servicio `motorValorizacionService.js`.
2. **Fase 2 (Pruebas Unitarias):** Certificación matemática de las 10 unidades mediante `scripts/test_motor_valorizacion.cjs`.
3. **Fase 3 (Autorización de Usuario):** Presentación del reporte formal de resultados al coordinador para su posterior ejecución en ambientes controlados.
