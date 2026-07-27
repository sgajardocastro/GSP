# Documentación Visual de Flujos y Navegación

## Estilo Visual (Guía Frontend)
- **Fondo General**: `#030712` (dark)
- **Tarjetas/Contenedores**: `bg-darkcard`
- **Acentos**:
  - Inventario (WMS-Lite): Indigo (`#6366f1`)
  - Mantenimiento: Emerald (`#10b981`)
- **Componentes**: Tablas con hover effect y paginación; formularios presentados en modales deslizantes (slide-over) o drawers.
- **Estados de OT (Semáforo)**:
  - `ABIERTA`: Azul
  - `EN_PROCESO`: Amarillo
  - `ESPERA_REPUESTOS`: Rojo
  - `CERRADA`: Verde

---

## 1. Mapa de Módulos

```mermaid
graph TD
    A[Global Manager - Transmac] --> B(Inventario WMS-Lite)
    A --> C(Mantenimiento)

    %% Navegación Inventario
    B --> B1[Gestión de Bodegas]
    B --> B2[Catálogo de Productos]
    B --> B3[Existencias y Bajas]
    B --> B4[Recepción e Ingreso]
    B --> B5[Traspasos]
    B --> B6[Despacho a OT]
    B --> B7[Stock de Seguridad]

    %% Navegación Mantenimiento
    C --> C1[Listado de OTs]
    C --> C2[Creación de OT]
    C1 --> C3[Detalle OT]
    
    %% Detalle OT subsecciones
    C3 --> C3A[Planificación Actividades]
    C3 --> C3B[Planificación Materiales]
    C3 --> C3C[Mano de Obra / HH]
    C3 --> C3D[Servicios Externos]
    C3 --> C3E[Cierre de OT]

    %% Enlaces cruzados
    C3B -.->|Solicitud Repuestos| B6
```

---

## 2. Flujo de Usuario: Recepción de Material

```mermaid
sequenceDiagram
    actor E as Encargado Bodega
    participant UI as PWA Móvil / Desktop
    participant API as Inventario API

    E->>UI: Seleccionar Bodega
    E->>UI: Buscar producto en catálogo
    UI->>API: GET /inventario/productos?q=...
    API-->>UI: Lista de productos
    E->>UI: Ingresar Cantidad, Costo, OC/Factura
    E->>UI: Confirmar Recepción
    UI->>API: POST /inventario/existencias/ingresar
    API-->>UI: 200 OK (Códigos generados)
    UI->>E: Mostrar confirmación visual
    E->>UI: Generar e Imprimir Barcode
```

---

## 3. Flujo de Usuario: Despacho a OT

```mermaid
sequenceDiagram
    actor E as Encargado Bodega
    participant UI as PWA Móvil / Desktop
    participant API as Inventario/Mantenimiento API

    E->>UI: Ingresar Nº OT o escanear
    UI->>API: GET /mantenimiento/ots/{folio}
    API-->>UI: Retorna OT completa con patente y repuestos planificados
    UI-->>E: Muestra lista requerida pre-llenada
    E->>UI: Escanear barcodes físicos
    UI->>UI: Validar correspondencia escaneo vs requerido
    E->>UI: Confirmar Despacho
    UI->>API: POST /inventario/despacho
    API-->>UI: 200 OK (Despacho registrado, descuenta stock)
    UI-->>E: Pantalla de éxito
```

---

## 4. Flujo de Usuario: Ciclo Completo de OT

```mermaid
stateDiagram-v2
    [*] --> ABIERTA : Creación de OT
    
    ABIERTA --> EN_PROCESO : Asignar Técnico y Actividades
    EN_PROCESO --> ESPERA_REPUESTOS : Falta stock o solicitud a bodega
    ESPERA_REPUESTOS --> EN_PROCESO : Material recepcionado/despachado
    EN_PROCESO --> CERRADA : Todas tareas terminadas e ingreso PIN
    
    CERRADA --> [*]
```

---

## 5. Flujo de Usuario: Traspaso Inter-Bodega

```mermaid
sequenceDiagram
    actor BO as Bodega Origen
    participant UI_O as PWA Origen
    participant API as Inventario API
    participant UI_D as PWA Destino
    actor BD as Bodega Destino

    BO->>UI_O: Crear Traspaso (Selecciona Destino y Productos)
    UI_O->>API: POST /inventario/traspasos
    API-->>UI_O: 200 OK (Estado: EN_TRANSITO)
    
    note over API: Stock descontado en Origen temporalmente
    
    BD->>UI_D: Ver Traspasos Entrantes
    UI_D->>API: GET /inventario/traspasos?estado=EN_TRANSITO
    API-->>UI_D: Lista de Traspasos
    BD->>UI_D: Confirmar Recepción Traspaso
    UI_D->>API: POST /inventario/traspasos/{id}/recibir
    API-->>UI_D: 200 OK (Stock suma en Destino, Estado: COMPLETADO)
```

---

## 6. Tabla de Pantallas → Endpoints

| Pantalla | Rol | Dispositivo | Endpoints que consume |
|----------|-----|-------------|------------------------|
| **Gestión Bodegas** | `ADMIN_INVENTARIO` | Desktop | `GET /inventario/bodegas`, `POST /inventario/bodegas`, `PUT /inventario/bodegas/{id}` |
| **Catálogo Productos** | `ADMIN_INVENTARIO` | Desktop | `GET /inventario/productos`, `POST /inventario/productos`, `PUT /inventario/productos/{id}` |
| **Stock Seguridad** | `ADMIN_INVENTARIO` | Desktop | `GET /inventario/bodegas/{id}/stock-seguridad`, `POST /inventario/bodegas/{id}/stock-seguridad` |
| **Existencias y Bajas** | `ADMIN_INVENTARIO`, `ENCARGADO_BODEGA` | Desktop/PWA | `GET /inventario/existencias`, `POST /inventario/existencias/baja` |
| **Recepción Ingreso** | `ENCARGADO_BODEGA` | PWA / Desktop | `GET /inventario/productos`, `POST /inventario/existencias/ingresar` |
| **Despacho a OT** | `ENCARGADO_BODEGA` | PWA | `GET /mantenimiento/ots/{folio}`, `POST /inventario/despacho` |
| **Traspasos** | `ENCARGADO_BODEGA` | PWA / Desktop | `GET /inventario/traspasos`, `POST /inventario/traspasos`, `POST /inventario/traspasos/{id}/recibir` |
| **Listado OTs** | `JEFE_TALLER`, `SUPERVISOR`, `TECNICO` | Desktop/PWA | `GET /mantenimiento/ot` |
| **Creación OT** | `JEFE_TALLER`, `SUPERVISOR` | Desktop | `POST /mantenimiento/ot` |
| **Detalle OT** | `JEFE_TALLER`, `TECNICO` | Desktop/PWA | `GET /mantenimiento/ot/{id}`, `PUT /mantenimiento/ot/{id}` |
| **Planif. Actividades** | `JEFE_TALLER` | Desktop | `GET /mantenimiento/ot/{id}/actividades`, `POST /mantenimiento/ot/{id}/actividades` |
| **Planif. Materiales** | `JEFE_TALLER` | Desktop | `GET /mantenimiento/ot/{id}/materiales`, `POST /mantenimiento/ot/{id}/materiales` |
| **Mano de Obra / HH** | `TECNICO` | PWA | `GET /mantenimiento/ot/{id}/hh`, `POST /mantenimiento/ot/{id}/hh` |
| **Cierre OT** | `JEFE_TALLER` | Desktop | `POST /mantenimiento/ot/{id}/cierre` (Requiere PIN) |

---

## 7. Wireframes Textuales

### A. Recepción de Material (PWA / Modal Desktop)
```text
+-----------------------------------------------------------+
| [<-] Recepción de Materiales                       [ x ]  |
+-----------------------------------------------------------+
| Bodega: [ Selector: Bodega Principal ▼ ]                  |
|                                                           |
| +-------------------------------------------------------+ |
| | Búsqueda de Producto: [ 🔍 Escriba código o nombre..] | |
| +-------------------------------------------------------+ |
|                                                           |
| Producto Seleccionado:                                    |
| [ Filtro Aceite FL-400S ] [ Marca: Motorcraft ]           |
|                                                           |
| Ubicación Física:    [ Ej: Pasillo 3, Estante B ]         |
| Cantidad a Ingresar: [ 50 ] Unidades                      |
| Costo Adquisición:   [ $ 4.500 ] Neto                     |
|                                                           |
| Documentos Respaldo:                                      |
| [ Selector: Factura ▼ ] Nº Doc: [ 993821 ]                |
|                                                           |
| +-------------------------------------------------------+ |
| |                 [ INGRESAR STOCK ]                    | |
| +-------------------------------------------------------+ |
| * Acento de botón: bg-indigo-600                          |
+-----------------------------------------------------------+
```

### B. Detalle de OT - Vista Jefe de Taller (Desktop)
```text
+-----------------------------------------------------------------------------------+
|  OT #10045 - Mantenimiento Preventivo  |  Estado: [ EN_PROCESO ] (bg-yellow-500)  |
+-----------------------------------------------------------------------------------+
| Equipo/Patente: AB-CD-12          Supervisor: Juan Pérez                          |
| Falla: Revisión de frenos 10.000km                                                |
+-----------------------------------------------------------------------------------+
| [ Actividades ]  [ Materiales ]  [ Mano de Obra (HH) ]  [ Servicios Externos ]    |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  | Tarea                       | Hrs Est. | Estado        | Acciones           |  |
|  +-----------------------------------------------------------------------------+  |
|  | 1. Desmontar ruedas         | 1.5      | [ Completada ]| [✏️] [🗑️]           |  |
|  | 2. Revisión pastillas       | 0.5      | [ En Proceso ]| [✏️] [🗑️]           |  |
|  | 3. Armado y prueba ruta     | 1.0      | [ Pendiente  ]| [✏️] [🗑️]           |  |
|  +-----------------------------------------------------------------------------+  |
|  [ + Agregar Tarea ]                                                              |
|                                                                                   |
+-----------------------------------------------------------------------------------+
|                                                     [ CIERRE DE OT (PIN) 🔒 ]     |
+-----------------------------------------------------------------------------------+
```
