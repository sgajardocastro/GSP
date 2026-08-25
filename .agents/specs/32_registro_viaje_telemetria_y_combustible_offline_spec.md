# 📐 Especificación Técnica: Módulo de Registro de Viaje, Telemetría, Combustible Copec y Torre de Control (Spec 32)

**Documento:** `32_registro_viaje_telemetria_y_combustible_offline_spec.md`  
**Ecosistema:** Grúas San Pablo (GSP) / LeanGlobal Platform  
**Fase de Dominio:** Fase 4 - Preparación de Salida & Desplazamiento en Ruta (`id_proyecto_estado = 5` y `6`)  
**Estado:** `ESPECIFICACIÓN FORMAL DE IMPLEMENTACIÓN V1.0 (CONCLUIDA)`  
**Última Actualización:** 25 de Agosto de 2026  

---

## 1. 📌 Resumen Ejecutivo y Alcance Funcional

El presente documento especifica formalmente la arquitectura técnica, modelo de persistencia relacional/JSONB, máquina de estados móviles y motor de visualización cartográfica implementados para el flujo de **Salida de Patio, Desplazamiento de Convoy, Telemetría GPS en Ruta, Carga de Combustible Copec y Arribo a Faena** en el ecosistema Grúas San Pablo (GSP).

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               FLUJO OPERATIVO END-TO-END IMPLEMENTADO                           │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                 │
 1. TORRE DE CONTROL (CRM / Kanban)              ▼
    • Checklist de Inspección de Salida Aprobado (Survey PWA con firma FES)
    • Coordinador presiona: [🚀 AUTORIZAR SALIDA & NOTIFICAR VIAJE]
    • Generación de Token Único Criptográfico (`vj-{id_proyecto}-{id_equipo}-{hash}`)
    • Despacho automático de correo B2B con Magic Link HTTPS al Conductor
                                                 │
                                                 ▼
 2. WEB APP MÓVIL DEL CONDUCTOR (Offline-First / PWA / Token Web)
    • [FASE 1: SALIDA PATIO] ➔ Odómetro inicial, Horómetro inicial, Foto tablero, PIN (SHA-256)
    • [FASE 2: EN RUTA] ➔ Telemetría activa (Tick 1s / Ping 10s con Filtro Deadband Haversine)
    • [FASE 2.1: COPEC] ➔ Solicitud de tarjeta, Aprobación remota, Litros, Estanque y Voucher
    • [FASE 3: ARRIBO FAENA] ➔ Odómetro final, Horómetro final, Foto tablero, Obs y PIN cierre
                                                 │
                                                 ▼
 3. AUDITORÍA Y MONITOREO EN TORRE DE CONTROL (Gestor de Oportunidades & Modal Leaflet)
    • Tarjeta de Patio reactiva (prioridad #1 a telemetría real persistida en BD)
    • Panel de Telemetría: Odómetros (KM), Horómetros (HRS), Pings GPS, Litros Copec
    • Modal de Mapa Leaflet con Map-Matching vial OSRM (calce sobre calzadas reales)
    • Bitácora cronológica inmutable con 4 hitos sellados con PIN SHA-256
```

---

## 2. 🏛️ Arquitectura de Software & Resiliencia Offline-First

### 2.1. Almacenamiento Local en Cliente Móvil (`IndexedDB`)
La aplicación móvil (`ViajeConductor.vue`) implementa almacenamiento local resiliente en IndexedDB (`DB_NAME = 'GSP_VIAJE_OFFLINE_DB'`) para operar sin interrupciones ante pérdida de cobertura celular, reinicios o apagones de batería:

* **`store_sesion_viaje`:** Almacena el snapshot completo del viaje, estado actual (`ASIGNADO`, `EN_RUTA`, `ARRIBADO_FAENA`), datos de la máquina, conductor, odómetros y timestamps.
* **`store_mutaciones_outbox`:** Cola transaccional FIFO de eventos pendientes de sincronización hacia el servidor remoto:

```typescript
interface MutacionOutbox {
  id: string;                // UUID v4 único generado en el cliente
  token_viaje: string;       // Token del viaje
  tipo: 'INICIO_VIAJE' | 'PING_GPS' | 'SOLICITUD_COPEC' | 'CARGA_COMBUSTIBLE' | 'FIN_VIAJE';
  payload: Record<string, any>; // Payload JSON serializado
  t_device: string;          // Timestamp ISO del evento en el dispositivo
  lat?: number;
  lng?: number;
  estado_sync: 'PENDIENTE' | 'ENVIANDO' | 'SINCRONIZADO' | 'ERROR';
  reintentos: number;
  created_at: number;
}
```

### 2.2. Motor de Telemetría y Filtro de Ruido (Deadband Haversine)
Para evitar la distorsión del trazado y pings duplicados cuando el vehículo está detenido (semáforos o paradas), el motor de telemetría implementa:

1. **Captura Nativa GPS:** `navigator.geolocation.watchPosition` con `enableHighAccuracy: true`, `maximumAge: 3000ms`, `timeout: 10000ms`.
2. **Filtro de Precisión:** Descarte automático de lecturas con error de precisión `accuracy > 45m` (antenas celulares).
3. **Filtro Deadband Haversine:**
   $$\Delta d = 2 R \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \text{lat}}{2}\right) + \cos(\text{lat}_1)\cos(\text{lat}_2)\sin^2\left(\frac{\Delta \text{lon}}{2}\right)}\right)$$
   * Si $\Delta d < 12 \text{ metros}$ y $\Delta t < 60 \text{ segundos}$, se omite la creación de un nuevo vértice en el array para evitar nidos de jitter.
4. **Velocidad:** Se toma la velocidad real del chip GPS `speed * 3.6` (km/h) o $0\text{ km/h}$ si está estacionado.

### 2.3. Criptografía PIN (Firma de Salida y Cierre)
* Autenticación sin contraseña compleja para cabina de camión mediante **PIN de 4 dígitos**.
* Algoritmo de Hashing en cliente:
  $$\text{Hash} = \text{SHA-256}(\text{"GSP-SALT-2026:"} + \text{PIN})$$
* El PIN en texto plano nunca se transmite por la red ni se almacena en base de datos.

### 2.4. Compresión Local de Fotografías (Canvas Client-Side)
* Las fotos de odómetros y vouchers se procesan en memoria en un elemento `<canvas>`:
  * Redimensionamiento proporcional: `max_width = 1280px`, `max_height = 1280px`.
  * Formato de salida: `image/jpeg` con factor de calidad `0.75`.
  * Reducción de peso: desde ~4.5 MB a ~160 KB por imagen, permitiendo transmisión ultrarrápida incluso con conectividad 2G/3G intermitente.

---

## 3. 🗄️ Modelo de Datos en PostgreSQL

### Tabla Principal: `tequ_log_desplazamiento`

```sql
CREATE TABLE public.tequ_log_desplazamiento (
    id_log_desplazamiento SERIAL PRIMARY KEY,
    id_proyecto INTEGER NOT NULL REFERENCES public.tpry_proyecto(id_proyecto),
    id_equipo INTEGER NOT NULL REFERENCES public.tequ_equipo(id_equipo),
    id_user_chofer INTEGER REFERENCES public.tusr_usuarios(id_user),
    token_viaje VARCHAR(100) UNIQUE NOT NULL,
    km_inicial NUMERIC(10,2),
    km_final NUMERIC(10,2),
    horometro_inicial NUMERIC(10,2),
    horometro_final NUMERIC(10,2),
    foto_tablero_salida TEXT,
    foto_tablero_llegada TEXT,
    latitud_salida_patio NUMERIC(12,8),
    longitud_salida_patio NUMERIC(12,8),
    latitud_llegada_faena NUMERIC(12,8),
    longitud_llegada_faena NUMERIC(12,8),
    fecha_salida_patio TIMESTAMP WITH TIME ZONE,
    fecha_llegada_faena TIMESTAMP WITH TIME ZONE,
    pings_ruta JSONB DEFAULT '[]'::jsonb,
    cargas_combustible JSONB DEFAULT '[]'::jsonb,
    total_litros NUMERIC(10,2) DEFAULT 0,
    total_gasto NUMERIC(12,2) DEFAULT 0,
    pin_hash VARCHAR(64),
    estado_trayecto VARCHAR(30) DEFAULT 'ASIGNADO', -- ASIGNADO, EN_RUTA, LLEGADO, CANCELADO
    obs_termino TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices de alto rendimiento
CREATE INDEX idx_tequ_log_desp_token ON public.tequ_log_desplazamiento(token_viaje);
CREATE INDEX idx_tequ_log_desp_proy ON public.tequ_log_desplazamiento(id_proyecto);
CREATE INDEX idx_tequ_log_desp_eq ON public.tequ_log_desplazamiento(id_equipo);
```

### Estructura de Objetos JSONB

#### Objeto `pings_ruta` (Array de Waypoints):
```json
[
  {
    "lat": -36.617205,
    "lng": -72.114812,
    "kmh": 48,
    "accuracy": 8,
    "ts": "2026-08-24T19:51:11.917Z"
  }
]
```

#### Objeto `cargas_combustible` (Array de Cargas Copec):
```json
[
  {
    "id_carga": "copec-178760",
    "odometro": 145920.0,
    "horometro": 3245.0,
    "foto_tablero": "data:image/jpeg;base64,...",
    "id_autorizacion_copec": "#COPEC-8492",
    "estanque": "Principal (Chasis)",
    "litros": 12.0,
    "monto_total": 32.0,
    "foto_voucher": "data:image/jpeg;base64,...",
    "timestamp": "2026-08-24T20:12:00.000Z"
  }
]
```

---

## 4. 🔌 Especificación de Endpoints API Backend

| Método | Endpoint | Parámetros / Body | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/viajes/proyecto/:id_proyecto` | `id_proyecto` (URL) | Retorna todos los viajes asociados a un proyecto, con datos consolidados del equipo y conductor. |
| `GET` | `/api/operaciones/viaje/:token` | `token` (URL) | Retorna el estado actual del viaje, equipo asignado, odómetros, pings acumulados y cargas Copec. |
| `POST` | `/api/operaciones/viaje/:token/salida` | `km_inicial`, `horometro_inicial`, `foto_tablero`, `latitud`, `longitud`, `pin_hash` | Registra la salida física de base/patio, estampa coordenadas de inicio y pasa a `EN_RUTA`. |
| `POST` | `/api/operaciones/viaje/:token/ping` | `latitud`, `longitud`, `velocidad_kmh`, `accuracy`, `timestamp` | Añade un waypoint de telemetría al array `pings_ruta` en PostgreSQL. |
| `POST` | `/api/operaciones/viaje/:token/combustible` | `odometro`, `horometro`, `litros`, `monto_total`, `estanque`, `id_autorizacion_copec`, `foto_voucher` | Registra una rendición de carga Copec e incrementa `total_litros` y `total_gasto`. |
| `POST` | `/api/operaciones/viaje/:token/llegada` | `km_final`, `horometro_final`, `foto_tablero`, `latitud`, `longitud`, `pin_hash`, `obs_termino` | Registra el arribo a faena, calcula delta de odómetro/horómetro y sella el viaje como `LLEGADO`. |

---

## 5. 🗺️ Motor de Map-Matching Vial (OSRM & Leaflet)

En el componente `ModalMapaViaje.vue`:

1. **Ordenamiento Temporal:** Se ordenan los pings en secuencia cronológica estricta ($t_1 < t_2 < \dots < t_n$).
2. **Muestreo Inteligente:** Se extraen waypoints clave con separación $\ge 40\text{ m}$ para optimizar la petición HTTP.
3. **Consulta de Enrutamiento Vial (OSRM):**
   $$\text{URL} = \text{https://router.project-osrm.org/route/v1/driving/}\{\text{lng}_1,\text{lat}_1;\dots;\text{lng}_n,\text{lat}_n\}?\text{overview=full\&geometries=geojson}$$
4. **Renderizado en Capas Leaflet:**
   * **Capa Glow:** Polilínea azul celeste (`#38bdf8`, grosor 8px, opacidad 0.35).
   * **Capa Calzada Principal:** Polilínea azul cobalto (`#0284c7`, grosor 4.5px, opacidad 0.95).
   * **Marcadores Especiales:**
     * 🚜 Salida de Patio Base (Verde esmeralda `#10b981`).
     * 🛰️ Waypoints GPS con tooltip de velocidad en km/h y fecha/hora.
     * 🏁 Arribo a Faena / Destino (Rojo `#ef4444`).
5. **Fallback:** Si no hay conexión o falla el servicio OSRM, se realiza fallback automático a la polilínea directa suavizada.

---

## 6. 🖥️ Interfaz en Torre de Control (CRM / Kanban / Gestor de Oportunidades)

### 6.1. Tarjeta de Patio en Subpestaña "Preparación de Salida"
La tarjeta de cada equipo asignado implementa una jerarquía reactiva estricta:

1. **Caso 1 (Viaje en BD - `LLEGADO` o `EN_RUTA`):**
   * Badge: `🟢 ARRIBADO A FAENA` o `🔵 EN RUTA`.
   * Odómetro: `13.00 ➔ 123.00 KM` (delta calculado).
   * Horómetro: `123.00 ➔ 234.00 HRS`.
   * Telemetría: Total de pings GPS recibidos, litros Copec cargados y estado de PIN.
   * Acciones: Botón **`🗺️ Ver Mapa & Telemetría`**, Botón **`📱 Ver Hoja`**, Botón **`🔁 Reenviar Correo`**.
2. **Caso 2 (Salida Autorizada pero sin inicio en terreno):**
   * Badge: `✅ Salida Autorizada • [Hora]`.
   * Acciones: Botón `📲 Ver Registro de Viaje` y `🔁 Reenviar`.
3. **Caso 3 (Inspección Conforme, esperando autorización):**
   * Botón de acción principal: **`🚀 AUTORIZAR SALIDA & NOTIFICAR VIAJE`**.

### 6.2. Panel de Convoy de Operaciones (Columna Inferior)
* Lista reactiva consolidada de todos los equipos del convoy (`viajesConvoyLista`).
* Visualización en tiempo real del conductor, vehículo, estado (`ASIGNADO / EN_RUTA / ARRIBADO_FAENA`), botón para copiar enlace WhatsApp y apertura de mapa.
* Panel de Autorizaciones Copec pendientes con input de código y botón de aprobación rápida.

---

## 7. 📁 Archivos Fuente del Módulo

| Capa | Archivo | Responsabilidad |
| :--- | :--- | :--- |
| **Frontend Web App Conductor** | `ejecucion/frontend/src/views/Operaciones/ViajeConductor.vue` | Vista móvil táctil Dark Mode para el chofer (Paso 1, 2, Copec y Paso 3). |
| **Frontend Engine Offline** | `ejecucion/frontend/src/utils/viajeOfflineSync.js` | Motor IndexedDB, sincronizador outbox, compresión de fotos, hash SHA-256 y watcher GPS. |
| **Frontend Componente Mapa** | `ejecucion/frontend/src/components/Operaciones/ModalMapaViaje.vue` | Modal interactivo con Leaflet, OSRM Map-Matching, métricas operacionales y bitácora. |
| **Frontend CRM / Torre** | `ejecucion/frontend/src/views/CRM/GestorOportunidades.vue` | Tarjetas de inspección de patio, autorización de salida, despacho de correos y monitoreo de convoy. |
| **Frontend Rutas** | `ejecucion/frontend/src/router/index.js` | Definición de ruta pública `/viaje/:token` hacia `ViajeConductor.vue`. |
| **Backend Controlador Viajes** | `ejecucion/backend_remoto/src/controllers/viajesController.js` | Controlador API REST para salida, pings, combustible, llegada y consultas por proyecto. |
| **Backend Despacho Correo** | `ejecucion/backend_remoto/src/controllers/notificacionesController.js` | Despacho de correo HTML con Magic Link a `lguser@arriendosanpablo.cl`. |

---

## 8. ✅ Matriz de Verificación y Pruebas Empíricas

| ID | Caso de Prueba | Criterio de Aceptación | Resultado |
| :--- | :--- | :--- | :--- |
| **QA-32-01** | Autorización y Notificación | Al presionar autorizar en CRM, se genera el token y se envía correo a `lguser@arriendosanpablo.cl` con URL HTTPS. | ✅ APROBADO |
| **QA-32-02** | Carga Móvil por Token | Al abrir `/viaje/:token` en móvil, carga datos de equipo, destino y formulario táctil de salida. | ✅ APROBADO |
| **QA-32-03** | Firma PIN SHA-256 | El inicio y cierre requieren PIN de 4 dígitos, validado criptográficamente. | ✅ APROBADO |
| **QA-32-04** | Telemetría GPS con Deadband | Los pings capturan ubicación real; si el camión está detenido (<12m), se filtran vértices repetidos. | ✅ APROBADO |
| **QA-32-05** | Carga de Combustible Copec | Se registra odómetro, horómetro, selección de estanque, litros, foto voucher y código de autorización. | ✅ APROBADO |
| **QA-32-06** | Arribo a Faena y Cierre | Se valida odómetro final > inicial, foto de llegada y transición a `LLEGADO`. | ✅ APROBADO |
| **QA-32-07** | Reflejo Inmediato en Tarjeta CRM | Al refrescar el CRM, la tarjeta muestra badge `🟢 ARRIBADO A FAENA`, odómetros y botón de mapa. | ✅ APROBADO |
| **QA-32-08** | Visualizador de Mapa Leaflet & OSRM | El modal abre el mapa centrado, traza la ruta ajustada a las calles con OSRM y muestra la bitácora de 4 hitos. | ✅ APROBADO |

