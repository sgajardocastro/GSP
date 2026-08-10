# 📜 Especificación Maestra N° 27: Reportes Diarios, Desplazamiento GPS, Estados de Pago (EDP) y Control de Costos 360°

> **Estado:** ESPECIFICACIÓN MAESTRA OFICIAL Y DISEÑO DE ARQUITECTURA  
> **Proyecto:** Grúas San Pablo (GSP) / Ecosistema LeanGlobal  
> **Ubicación en Repositorio:** `.agents/specs/27_modelo_ppd_devengado_edp_spec.md`  
> **Ámbito:** Preventa Comercial ➔ Unidades de Cobro ➔ Telemetría Desplazamiento GPS ➔ Reportes Diarios (PWA + Firma Manual Cliente) ➔ Imputación Costos 360° ➔ Estados de Pago (EDP) ➔ Anexo Factura ERP

---

## 📐 1. Origen Comercial y Unidades de Cobro (`GestorOportunidades.vue`)

Las **Unidades de Cobro** se definen de forma estricta durante la fase de **Preventa / Cotización Comercial** en el formulario web (`GestorOportunidades.vue`). Viajan inmutables a lo largo del proceso operativo y son consumidas (no editables) por la PWA en terreno.

### 📊 Catálogo de Unidades de Cobro Oficiales:

| Código Interno | Nombre Comercial | Definición y Regla de Negocio | Algoritmo de Devengado en Reporte Diario / EDP |
| :--- | :--- | :--- | :--- |
| `HRS_DIA` | **Hrs día** | Cobra al cliente por un piso mínimo de horas diarias garantizadas por jornada. | $\text{Devengado Día} = \max(\text{Horas Operadas Reales}_i, \text{Horas Mínimas Diarias}) \times \text{Tarifa Hora}$ |
| `HRS_MENSUAL` | **Hrs Mensual** | Cobra al cliente por un piso mínimo acumulado durante el ciclo mensual. | En el corte del EDP: $\text{Devengado} = \max(\sum \text{Horas Reales Mes}, \text{Piso Mínimo Mensual}) \times \text{Tarifa Hora}$ |
| `FIJO` | **Fijo** | Valor cerrado acordado por un servicio o maniobra puntual específica. | Se devenga por hito o al registrar el 100% del avance de la maniobra en terreno ($100\%$ del Valor Fijo). |
| `FLETE` | **Flete** | Valor fijo por concepto de movilización y transporte de grúa, contrapesos y aparejos. | Cargo fijo devengado al registrar el hito de *"Llegada a Faena"* (Día 1) o retorno a base. |

---

## 🚜 2. Reglas de Negocio: Con Flete vs. Sin Flete

| Tipo de Servicio | Condición Flota / Radio | Flete Independiente | Punto de Inicio del Tiempo Facturable (Horas Grúa) |
| :--- | :--- | :--- | :--- |
| 🚛 **Con Flete** | Grúas Mayor Tonelaje ($\ge 75$ Ton) o Requerimiento de Contrapesos. | **SÍ** *(Cobro de Flete Cotizado en Preventa)*. | **Llegada a Faena en Obra:** El tiempo facturable corre estrictamente desde `fecha_inicio_servicio` en terreno del cliente (el traslado de ida/vuelta queda cubierto por el Flete). |
| 🚚 **Sin Flete** | Equipos Menor Tonelaje ($< 75$ Ton) y Radio Urbano $< 30$ km. | **NO** *($0 Flete separado)*. | **Salida de Base (Patio Casa Matriz):** El tiempo facturable comienza a correr en el instante exacto de `fecha_salida_patio` (registrado al presionar *"Iniciar Desplazamiento"* en PWA). |

---

## 🗄️ 3. Modelo de Datos PostgreSQL (`sch_leangsp`)

El esquema de base de datos se estructura bajo 5 tablas relacionales del prefijo unificado `tedp_` y `tequ_`:

```sql
-- 1. Logística y Desplazamiento de Flota (Con 4 Timestamps, Geolocalizaciones GPS y pings JSONB)
CREATE TABLE IF NOT EXISTS sch_leangsp.tequ_log_desplazamiento (
    id_log_desplazamiento BIGSERIAL PRIMARY KEY,
    id_proyecto INT NOT NULL REFERENCES sch_leangsp.tpry_proyecto(id_proyecto),
    id_equipo INT REFERENCES sch_leangsp.tequ_equipo(id_equipo),
    patente VARCHAR(20),
    tipo_trayecto VARCHAR(30) DEFAULT 'IDA', -- 'IDA' (Base ➔ Faena), 'RETORNO' (Faena ➔ Base)
    
    -- 4 Timestamps Logísticos
    fecha_salida_patio TIMESTAMP WITH TIME ZONE,
    fecha_llegada_faena TIMESTAMP WITH TIME ZONE,
    fecha_salida_faena TIMESTAMP WITH TIME ZONE,
    fecha_llegada_patio TIMESTAMP WITH TIME ZONE,
    
    -- Geolocalizaciones GPS del Viaje
    latitud_salida_patio NUMERIC(10, 7),
    longitud_salida_patio NUMERIC(10, 7),
    latitud_llegada_faena NUMERIC(10, 7),
    longitud_llegada_faena NUMERIC(10, 7),
    latitud_salida_faena NUMERIC(10, 7),
    longitud_salida_faena NUMERIC(10, 7),
    latitud_llegada_patio NUMERIC(10, 7),
    longitud_llegada_patio NUMERIC(10, 7),
    
    km_inicial NUMERIC(10, 2),
    km_final NUMERIC(10, 2),
    estado_trayecto VARCHAR(30) DEFAULT 'EN_RUTA', -- 'EN_RUTA', 'LLEGADO'
    pings_ruta JSONB DEFAULT '[]'::jsonb, -- Arreglo de coordenadas GPS de ruta
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Encabezado de Estado de Pago (EDP)
CREATE TABLE IF NOT EXISTS sch_leangsp.tedp_estado_pago (
    id_edp BIGSERIAL PRIMARY KEY,
    id_proyecto INT NOT NULL REFERENCES sch_leangsp.tpry_proyecto(id_proyecto),
    numero_edp VARCHAR(30) NOT NULL, -- ej. 'EDP-01'
    fecha_corte_inicio DATE NOT NULL,
    fecha_corte_fin DATE NOT NULL,
    monto_neto NUMERIC(14, 2) NOT NULL DEFAULT 0,
    monto_iva NUMERIC(14, 2) NOT NULL DEFAULT 0,
    monto_total NUMERIC(14, 2) NOT NULL DEFAULT 0,
    estado_edp VARCHAR(30) DEFAULT 'BORRADOR', -- 'BORRADOR', 'APROBADO_CLIENTE', 'FACTURADO'
    -- Anexo Factura ERP Cliente
    folio_factura_erp VARCHAR(50),
    fecha_facturacion_erp DATE,
    archivo_factura_pdf_path TEXT,
    archivo_factura_xml_path TEXT,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Reporte Diario de Avance (Con 2 Timestamps, Geolocalizaciones de Inicio/Término Servicio y FK id_edp)
CREATE TABLE IF NOT EXISTS sch_leangsp.tedp_reporte_avance (
    id_reporte_avance BIGSERIAL PRIMARY KEY,
    id_proyecto INT NOT NULL REFERENCES sch_leangsp.tpry_proyecto(id_proyecto),
    id_edp BIGINT REFERENCES sch_leangsp.tedp_estado_pago(id_edp) ON DELETE SET NULL, -- NULL mientras no está liquidado
    id_log_desplazamiento BIGINT REFERENCES sch_leangsp.tequ_log_desplazamiento(id_log_desplazamiento),
    id_user_operador INT NOT NULL,
    fecha_reporte DATE NOT NULL,
    unidad_cobro VARCHAR(20) NOT NULL, -- 'HRS_DIA', 'HRS_MENSUAL', 'FIJO', 'FLETE'
    incluye_flete_independiente BOOLEAN DEFAULT TRUE,
    
    -- Timestamps del Turno en Faena
    fecha_inicio_servicio TIMESTAMP WITH TIME ZONE,
    fecha_termino_servicio TIMESTAMP WITH TIME ZONE,
    
    -- Geolocalizaciones GPS del Servicio
    latitud_inicio_servicio NUMERIC(10, 7),
    longitud_inicio_servicio NUMERIC(10, 7),
    latitud_termino_servicio NUMERIC(10, 7),
    longitud_termino_servicio NUMERIC(10, 7),
    
    horas_operadas NUMERIC(5, 2) DEFAULT 0,
    horas_standby NUMERIC(5, 2) DEFAULT 0,
    horas_colacion NUMERIC(5, 2) DEFAULT 0,
    monto_devengado_dia NUMERIC(14, 2) DEFAULT 0,
    observacion_trabajo TEXT,
    
    -- Firma Manual del Cliente en Terreno (Canvas Touch)
    cliente_nombre VARCHAR(150),
    cliente_rut VARCHAR(20),
    cliente_cargo VARCHAR(100),
    cliente_firma_canvas_base64 TEXT,
    
    estado_reporte VARCHAR(30) DEFAULT 'PENDIENTE_EDP', -- 'PENDIENTE_EDP', 'AGRUPADO_EDP'
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Ítems Adicionales del Estado de Pago (Líneas no provenientes de Reportes Diarios: Flete, Ajustes)
CREATE TABLE IF NOT EXISTS sch_leangsp.tedp_estado_pago_detalle (
    id_edp_detalle BIGSERIAL PRIMARY KEY,
    id_edp BIGINT NOT NULL REFERENCES sch_leangsp.tedp_estado_pago(id_edp) ON DELETE CASCADE,
    concepto VARCHAR(255) NOT NULL, -- ej. 'Cobro Fijo de Flete y Movilización Grúa 100T'
    unidad_cobro VARCHAR(20) NOT NULL,
    cantidad NUMERIC(10, 2) NOT NULL DEFAULT 1,
    precio_unitario NUMERIC(14, 2) NOT NULL DEFAULT 0,
    monto_subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0
);

-- 5. Imputación de Costos Reales del Servicio (Combustible, Viáticos)
CREATE TABLE IF NOT EXISTS sch_leangsp.tedp_costos_servicio (
    id_costo BIGSERIAL PRIMARY KEY,
    id_proyecto INT NOT NULL REFERENCES sch_leangsp.tpry_proyecto(id_proyecto),
    id_edp BIGINT REFERENCES sch_leangsp.tedp_estado_pago(id_edp),
    categoria_costo VARCHAR(50) NOT NULL, -- 'COMBUSTIBLE', 'VIATICOS', 'PEAJES', 'ALOJAMIENTO', 'ESCOLTA', 'OTROS'
    monto_costo NUMERIC(14, 2) NOT NULL DEFAULT 0,
    litros_combustible NUMERIC(8, 2),
    kilometraje_odometro NUMERIC(10, 2),
    numero_comprobante VARCHAR(50),
    archivo_comprobante_path TEXT,
    observacion TEXT,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔌 4. Contratos de API REST (Backend Node.js Express)

* `POST /api/telemetria/ping`: Registra pings GPS de ruta del equipo.
* `POST /api/reportes-diarios`: Registra un Reporte Diario en PWA con la firma manual del cliente y timestamps/geolocalizaciones.
* `GET /api/proyectos/:id/reportes-diarios`: Obtiene los reportes diarios de una OT.
* `POST /api/estados-pago`: Consolida $N$ reportes diarios no liquidados en un Estado de Pago (EDP).
* `POST /api/estados-pago/:id/factura-erp`: Anexa el archivo PDF/XML de la Factura emitida por el ERP del cliente y cambia el estado a `FACTURADO`.
* `POST /api/estados-pago/:id/costos`: Imputa gastos reales de combustible (litros/KM), viáticos y peajes.
* `GET /api/proyectos/:id/visor-360`: Devuelve la matriz comparativa 360° ($\text{Cotizado} \text{ vs } \text{Devengado} \text{ vs } \text{Costos} \text{ vs } \text{Margen Real}$).
