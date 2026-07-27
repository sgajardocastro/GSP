# 📐 Análisis Técnico & Modelo Data Spec: Arquitectura de Proyectos, Órdenes de Trabajo y Asignación de Recursos

**Fecha de Registro:** 24 de Julio, 2026  
**Proyecto:** Ecosistema Grúas San Pablo (GSP)  
**Estándar:** LeanGlobal Spec-Driven (`tpry_*`)

---

## 📌 1. Visión General de la Jerarquía Operativa

El modelo de datos y flujo operativo adopta la jerarquía estricta normalizada:

```text
[Cliente] (tcli_cliente)
   │
[Proyecto / Obra] (tpry_proyecto)
   │
   └── [Orden de Trabajo - OT] (tpry_orden_trabajo)
          │
          └── [Recursos Asignados] (tpry_recurso_asignado)
                 ├── Equipos (Grúas / Camiones / Alza-hombres)
                 ├── Personal (Operadores / Riggers / Supervisores)
                 └── Aparejos / Implementos (JSONB de Challa Tecnológica)
```

---

## 🗄️ 2. Modelo de Base de Datos PostgreSQL (`tpry_*`)

### A. Proyecto / Obra (`tpry_proyecto`)
```sql
CREATE TABLE tpry_proyecto (
    id_proyecto SERIAL PRIMARY KEY,
    id_empresa INT NOT NULL DEFAULT 9,                           -- Multi-tenant GSP
    id_cotizacion INT REFERENCES tcot_cotizacion(id_cotizacion),  -- Cotización Origen de Comercial
    id_cliente INT NOT NULL REFERENCES tcli_cliente(id_cliente),
    nombre_proyecto VARCHAR(255) NOT NULL,
    codigo_proyecto VARCHAR(50) UNIQUE NOT NULL,                  -- Ej: PRY-2026-042
    estado_proyecto VARCHAR(30) DEFAULT 'EN_PLANIFICACION',       -- 'EN_PLANIFICACION', 'EN_EJECUCION', 'FINALIZADO', 'CANCELADO'
    creado_por INT REFERENCES tseg_usuario(id_usuario),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### B. Orden de Trabajo (`tpry_orden_trabajo`)
Almacena la planificación operativa, la trazabilidad de tiempos reales de ejecución y el JSONB de aparejos/herramientas complementarias.

```sql
CREATE TABLE tpry_orden_trabajo (
    id_ot SERIAL PRIMARY KEY,
    id_empresa INT NOT NULL DEFAULT 9,
    id_proyecto INT NOT NULL REFERENCES tpry_proyecto(id_proyecto) ON DELETE CASCADE,
    codigo_ot VARCHAR(50) UNIQUE NOT NULL,                        -- Identificador Maestro / Ej: OT-2026-089
    
    -- ⏱️ Bloque 1: Tiempos Planificados / Programados (Despacho)
    fecha_plan_desde DATE NOT NULL,
    fecha_plan_hasta DATE NOT NULL,
    hora_salida_plan TIME NULL,
    hora_llegada_plan TIME NULL,
    
    -- ⏱️ Bloque 2: Tiempos Reales / Efectivos (Registrados por PWA / Parte Diario)
    fecha_real_desde DATE NULL,
    fecha_real_hasta DATE NULL,
    hora_salida_real TIME NULL,          -- Marcación de salida de Base San Pablo
    hora_llegada_obra_real TIME NULL,    -- Arribo a la obra del cliente
    hora_inicio_faena_real TIME NULL,    -- Inicio efectivo del trabajo/izaje
    hora_liberacion_real TIME NULL,      -- Término y firma de conformidad en terreno
    hora_retorno_base_real TIME NULL,    -- Llegada de vuelta a la base
    
    -- 🛠️ Bloque 3: Aparejos y Equipamiento Adicional (JSONB Dinámico)
    aparejos_solicitados_json JSONB DEFAULT '{}'::jsonb, -- Levantamiento original desde Visita a Terreno
    aparejos_asignados_json JSONB DEFAULT '{}'::jsonb,   -- Asignación real ajustada por Operaciones
    
    -- Estados y Auditoría
    estado_ot VARCHAR(30) DEFAULT 'PROGRAMADA',           -- 'PROGRAMADA', 'EN_TRANSITO', 'EN_FAENA', 'FINALIZADA', 'CANCELADA'
    observaciones_operaciones TEXT,
    creado_por INT REFERENCES tseg_usuario(id_usuario),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### C. Recursos Asignados (`tpry_recurso_asignado`)
Vincular el detalle de personal y maquinaria asignados a la OT específica.

```sql
CREATE TABLE tpry_recurso_asignado (
    id_recurso_asignado SERIAL PRIMARY KEY,
    id_ot INT NOT NULL REFERENCES tpry_orden_trabajo(id_ot) ON DELETE CASCADE,
    
    tipo_recurso VARCHAR(20) NOT NULL, -- 'EQUIPO', 'PERSONAL'
    id_equipo INT NULL REFERENCES tequ_equipo(id_equipo),
    id_personal INT NULL REFERENCES tper_personal(id_personal),
    rol_desempenado VARCHAR(50) NULL,  -- 'OPERADOR_PRINCIPAL', 'RIGGER', 'CHOFER_TRANSPORTE'
    
    -- Fechas de reserva de recurso
    fecha_hora_desde TIMESTAMP NOT NULL,
    fecha_hora_hasta TIMESTAMP NOT NULL,
    estado_recurso VARCHAR(30) DEFAULT 'ASIGNADO' -- 'ASIGNADO', 'EN_TRANSITO', 'OPERATIVO', 'LIBERADO'
);
```

---

## 🛠️ 3. Estrategia del Manejo de Aparejos en JSONB ("La Challa")

En lugar de crear tablas relacionales rígidas para cada implemento (eslingas, cadenas, grilletes), se utiliza **`JSONB`** en `aparejos_solicitados_json` y `aparejos_asignados_json`.

### Estructura del Objeto JSONB:
```json
{
  "eslingas": [
    { "capacidad": "10 Ton", "largo": "6m", "cantidad": 4, "origen": "VISITA_TERRENO" },
    { "capacidad": "5 Ton", "largo": "4m", "cantidad": 2, "origen": "OPERACIONES" }
  ],
  "pulpos_cadena": [
    { "ramales": 4, "capacidad": "15 Ton", "cantidad": 1 }
  ],
  "grilletes": [
    { "capacidad": "12 Ton", "cantidad": 4 }
  ],
  "accesorios": [
    { "tipo": "Balancín de Izaje", "capacidad": "20 Ton", "cantidad": 1 }
  ]
}
```

### Ventajas de este Enfoque:
1. **Diff Inmediato en Frontend (Vue / PWA):** Permite comparar lo pedido en el levantamiento de terreno vs. lo despachado por Operaciones en un componente visual intuitivo.
2. **Escalabilidad:** Permite agregar nuevos implementos sin alterar esquemas de la base de datos.

---

## ⏱️ 4. Matriz de Control de Tiempos (Planificado vs. Real)

| Métrica de Tiempo | Campo Base de Datos | Origen del Dato | Propósito de Negocio |
| :--- | :--- | :--- | :--- |
| **Salida Programada** | `hora_salida_plan` | Coordinador (Operaciones) | Programación de despacho en Base |
| **Salida Real** | `hora_salida_real` | Marcación PWA Operador | Control de puntualidad de salida |
| **Arribo a Obra** | `hora_llegada_obra_real` | GPS / PWA Operador | Medición de tiempos de tránsito |
| **Inicio Faena** | `hora_inicio_faena_real` | PWA Operador | Control de tiempos muertos pre-izaje |
| **Liberación Obra** | `hora_liberacion_real` | Firma Digital Cliente en PWA | **Base imponible para cálculo de EDP** |
| **Retorno Base** | `hora_retorno_base_real` | Marcación PWA Operador | Cierre del ciclo operativo del equipo |

---

## 📋 5. Próximas Acciones de Desarrollo

1. **Migración en Prisma / Postgres:** Aplicar los esquemas `tpry_proyecto`, `tpry_orden_trabajo` y `tpry_recurso_asignado` en `schema.prisma`.
2. **Endpoint API Node.js (`lean-services-gsp`):** Crear los controladores `/api/operaciones/ot` para generación y aprobación con observaciones (Diff).
3. **PWA / App Móvil:** Actualizar la vista del operador para capturar las marcas de tiempo reales (`hora_salida_real`, `hora_llegada_obra_real`, etc.) y la firma del cliente.
