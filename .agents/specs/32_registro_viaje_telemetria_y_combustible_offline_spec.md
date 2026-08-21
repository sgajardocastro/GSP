# 📐 Especificación Técnica: Módulo de Registro de Viaje, Telemetría y Carga de Combustible Offline-First (Spec 32)

**Documento:** `32_registro_viaje_telemetria_y_combustible_offline_spec.md`  
**Ecosistema:** Grúas San Pablo (GSP) / LeanGlobal Platform  
**Fase de Dominio:** Fase 4 - Desplazamiento & Ruta (`id_proyecto_estado = 6` / En Tránsito)  
**Estado:** `ESPECIFICACIÓN FORMAL APROBADA`  
**Fecha:** 20 de Agosto de 2026  

---

## 1. 📌 Resumen Ejecutivo y Propósito

El presente documento define la arquitectura técnica, modelo de datos, diseño de interacción móvil y protocolo de comunicación para el **Módulo de Registro de Viaje, Telemetría y Carga de Combustible Offline-First** de Grúas San Pablo.

### 🎯 Objetivos Clave:
1. **Resiliencia Offline-First Absoluta:** La aplicación del conductor opera de forma 100% autónoma en el navegador móvil sin depender de red celular activa, persistiendo datos y fotografías en `IndexedDB` a prueba de reinicios, apagones y descargas de batería durante horas o días.
2. **Firma Criptográfica con PIN (4 Dígitos):** Validación de identidad del chofer al iniciar el viaje (salida de patio) y al confirmar la llegada a faena, con hashing seguro `SHA-256`.
3. **Protocolo de Carga de Combustible (Tarjeta Copec):** Handshake asíncrono entre conductor y coordinador de operaciones:
   - Solicitud de habilitación con envío de odómetro/horómetro y foto de tableros.
   - Aprobación del coordinador con asignación de `ID de Autorización Copec`.
   - Rendición de carga con selector de estanque (`Principal / Superestructura Grúa / Auxiliar`), volumen en litros y fotografía obligatoria del voucher Copec.
4. **Telemetría y Trayectoria GPS:** Pings periódicos de ubicación (`lat`, `lng`, `speed`, `timestamp`) guardados localmente y transmitidos en background oportunista al servidor.
5. **Ergonomía UI Industrial:** Modo oscuro de alto contraste (`#050810`), tipografía nítida para luz solar directa, zonas táctiles de gran tamaño (`min-h-[58px]`) y feedback visual/háptico.

---

## 2. 🏛️ Arquitectura de Software & Resiliencia Offline-First

### 2.1. Capa de Almacenamiento Local (IndexedDB)
Se implementa una base de datos local en el navegador del dispositivo móvil (`DB_NAME = 'GSP_VIAJE_OFFLINE_DB'`) con dos almacenes de objetos principales:

1. **`store_sesion_viaje`:** Almacena el estado actual del viaje, datos del equipo, conductor, tokens, odómetros iniciales/finales y timestamps.
2. **`store_mutaciones_outbox`:** Cola transaccional FIFO de eventos pendientes de sincronización hacia el backend:
   ```typescript
   interface MutacionOutbox {
     id: string;                // UUID v4 único generado localmente
     token_viaje: string;       // Token criptográfico del equipo/viaje
     tipo: 'INICIO_VIAJE' | 'PING_GPS' | 'SOLICITUD_COPEC' | 'CARGA_COMBUSTIBLE' | 'FIN_VIAJE';
     payload: any;              // Datos del evento (números, strings, strings Base64 de fotos)
     t_device: string;          // ISO Timestamp del momento exacto del hecho
     lat?: number;
     lng?: number;
     estado_sync: 'PENDIENTE' | 'ENVIANDO' | 'SINCRONIZADO' | 'ERROR';
     reintentos: number;
     created_at: number;
   }
   ```

### 2.2. Motor de Sincronización (Sync Engine)
- Detecta cambios en la conectividad del dispositivo (`window.addEventListener('online')` y `navigator.onLine`).
- Ejecuta barridos periódicos (cada 30 segundos si hay conexión) procesando la cola `outbox` en orden cronológico estricto.
- Implementa reintentos con **Backoff Exponencial** en caso de caídas transitorias de red o respuestas HTTP 5xx.

### 2.3. Compresión Local de Fotografías (Web Client Canvas)
- Antes de almacenar cualquier fotografía en IndexedDB, el archivo capturado por la cámara se procesa en el cliente mediante un `<canvas>` off-screen:
  - Redimensionamiento proporcional: `max_width = 1280px`, `max_height = 1280px`.
  - Compresión de calidad: `image/jpeg` al 75%.
  - Tamaño resultante: ~150 KB - 220 KB (reducción de 95% frente al original de 5 MB), asegurando almacenamiento local ligero y despacho ultrarrápido al recuperar señal.

---

## 3. ⛽ Protocolo de Carga de Combustible con Tarjeta Copec

```
┌─────────────────────────────────────────────────────────────┐
│ 1. CONDUCTOR: Llega a Copec y presiona "Solicitar Carga"    │
│    • Ingresa Odómetro & Horómetro actuales                  │
│    • Captura Foto obligatoria del tablero del camión/grúa   │
└──────────────────────────┬──────────────────────────────────┘
                           │ Mutación outbox: SOLICITUD_COPEC
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. COORDINADOR (Torre de Control): Recibe Alerta en Tiempo  │
│    Real con Odómetro y Foto para validación de coherencia   │
│    • Habilita tarjeta en plataforma Copec                   │
│    • Digita "ID / Código de Autorización Copec" y aprueba   │
└──────────────────────────┬──────────────────────────────────┘
                           │ Respuesta Backend ➔ App Móvil
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. CONDUCTOR: Pantalla se actualiza mostrando:              │
│    "🟢 TARJETA HABILITADA - ID AUTORIZACIÓN: #84920"        │
│    • Procede a cargar combustible en surtidor               │
└──────────────────────────┬──────────────────────────────────┘
                           │ Carga finalizada en surtidor
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. CONDUCTOR: Rendición de Carga                            │
│    • Selecciona Estanque: Principal / Grúa / Auxiliar       │
│    • Digita Litros Cargados & Monto ($)                     │
│    • Captura Foto obligatoria del Voucher / Boleta Copec    │
│    • Presiona "Confirmar Carga y Continuar Viaje"           │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. 📱 Estados Visuales de la Web App Móvil (`/viaje/:token`)

### Estado 1: Salida de Patio & PIN Inicial (`estado_viaje = 'ASIGNADO'`)
- Muestra datos del servicio: Patente, Modelo de Equipo, Obra de Destino y Conductor.
- Inputs obligatorios:
  - Odómetro de Salida (km).
  - Horómetro de Salida (hrs).
  - Foto del Tablero de Salida.
  - PIN del Conductor (4 dígitos).
- Botón Principal: `🟢 INICIAR VIAJE (SALIDA DE BASE)`.

### Estado 2: En Ruta con Telemetría Activa (`estado_viaje = 'EN_RUTA'`)
- Indicador pulsante: `🛰️ En Trayecto hacia la Faena`.
- Contador de tiempo transcurrido en viaje.
- Botón Secundario de Alta Visibilidad: `⛽ SOLICITAR CARGA DE COMBUSTIBLE (COPEC)`.
- Botón Principal: `🏁 CONFIRMAR LLEGADA A FAENA`.

### Estado 3: Subflujo de Carga de Combustible (`estado_viaje = 'SOLICITANDO_COMBUSTIBLE' | 'CARGA_HABILITADA'`)
- Pantalla modal dedicada con pasos guiados.
- Paso 3.1: Registro de Odómetro/Horómetro previo + Foto Tablero.
- Paso 3.2: Esperando Aprobación del Coordinador (Spinner de estado en vivo con badge de ID Copec).
- Paso 3.3: Registro de Litros, Estanque y Foto de Voucher.

### Estado 4: Arribo a Faena & PIN de Cierre (`estado_viaje = 'ARRIBADO_FAENA'`)
- Inputs obligatorios:
  - Odómetro de Llegada (km).
  - Horómetro de Llegada (hrs).
  - Foto del Tablero de Llegada.
  - PIN del Conductor (4 dígitos).
- Pantalla final de éxito: `✅ ¡Llegada a Faena Confirmada!`.

---

## 5. 🔌 Contrato de Endpoints API Backend

| Método | Endpoint | Autenticación | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/viaje/consultar/:token` | Token URL | Consulta el estado actual y datos del viaje |
| `POST` | `/api/viaje/iniciar` | Token URL | Registra inicio de viaje, odómetro/horómetro de salida y PIN |
| `POST` | `/api/viaje/ping` | Token URL | Registra punto de telemetría GPS |
| `POST` | `/api/viaje/combustible/solicitar` | Token URL | Solicita habilitación de tarjeta Copec con fotos de tablero |
| `POST` | `/api/viaje/combustible/rendir` | Token URL | Rinde la carga de combustible con litros, estanque y voucher |
| `POST` | `/api/viaje/combustible/autorizar` | JWT Operaciones | Coordinador aprueba solicitud ingresando ID Copec |
| `POST` | `/api/viaje/finalizar` | Token URL | Registra llegada a faena, odómetro final y PIN de cierre |
| `POST` | `/api/viaje/sincronizar-outbox` | Token URL | Procesa lote de mutaciones acumuladas en modo offline |

---

## 6. 📋 Log Maestro de Cierre de Desplazamiento y Bitácora de Auditoría

Al concluir el viaje en faena (`estado_viaje = 'ARRIBADO_FAENA'`), el sistema compila y sella una **Bitácora Maestra Inmutable** con 7 dimensiones operacionales:

### 6.1. Dimensiones del Log de Auditoría:
1. **Telemetría & Geocerca:**
   - `total_pings_gps`: Conteo total de coordenadas registradas durante el viaje.
   - `gps_origen` & `gps_destino`: Coordenadas `[Lat, Lng]` de salida de base y llegada a obra.
   - `cumplimiento_geocerca`: Flag booleano (`true` si el arribo ocurrió dentro del radio configurado de la obra).
2. **Cronometría y Tasa de Marcha:**
   - `fecha_hora_salida` vs `fecha_hora_llegada`.
   - `duracion_total_viaje`: Formato `HH:MM:SS`.
   - `tiempo_movimiento_min` vs `tiempo_detenido_min`.
3. **Odometría & Horometría:**
   - `odometro_salida_km`, `odometro_llegada_km`, `distancia_recorrida_km`.
   - `delta_vs_ruta_teorica_km`: Desviación frente a la distancia óptima planificada en mapa.
   - `horometro_salida_hrs`, `horometro_llegada_hrs`, `horas_motor_transito`.
4. **Seguridad Vial & Velocidades:**
   - `velocidad_maxima_kmh` y `velocidad_promedio_kmh`.
   - `alerta_exceso_velocidad`: Flag de advertencia si superó el umbral reglamentario de grúas pesadas.
5. **Balance de Combustible en Ruta:**
   - `total_litros_cargados_copec`, `monto_total_combustible_pesos`.
   - `desglose_estanques`: Litros cargados por estanque (`Chasis`, `Superestructura Grúa`, `Auxiliar`).
   - `id_autorizaciones_copec`: Lista de códigos autorizados por el coordinador.
6. **Expediente de Evidencias Digitales:**
   - URLs de fotos de tableros (Salida y Llegada) y vouchers Copec.
7. **Firmas y Trazabilidad FES:**
   - `pin_hash_salida`, `pin_hash_llegada`, `id_user_conductor`.
   - `observaciones_cierre_conductor`: Observaciones finales registradas por el chofer al arribar.

