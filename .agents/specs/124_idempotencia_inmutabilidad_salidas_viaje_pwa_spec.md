# Especificación Técnica: SPEC-124
## Protección de Idempotencia e Inmutabilidad en Salidas de Patio de Viajes PWA y Saneamiento Histórico OT 17 (REQ-1140)

---

### 1. Contexto y Justificación
Durante la auditoría forense del CASO-20261109-04 (OT 17, operada por Nicolás Ceballos, Equipo 35), se demostró empíricamente en los registros de acceso HTTP de Nginx que el operador ejecutó el envío de salida de patio a las **07:23:33 CLT** (HTTP 200 OK, 309 KB de payload). Sin embargo, al arribar a la obra a las 08:20 CLT y reabrir la aplicación, la interfaz de la PWA no bloqueó la fase de salida, permitiendo que el operador reenviara la salida a las **08:20:36 CLT**. 

El backend ejecutó un `UPDATE` destructivo ciego (`fecha_salida_patio = CURRENT_TIMESTAMP`), sobrescribiendo la marca de tiempo de las 07:23:33 CLT y dejando en la base de datos una salida a las 08:20:35 CLT y una llegada a las 08:21:09 CLT (34 segundos de diferencia).

Este comportamiento vulnera el principio constitucional de [Inmutabilidad de Etapas Concluidas y Mutación por Excepción](file:///d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/.agents/rules/inmutabilidad_etapas_concluidas_y_mutacion_por_excepcion.md), induce a errores graves en auditorías operacionales e impacta la liquidación de kilometrajes y horas de traslado.

---

### 2. Principio Rector: Resolución de Fondo en 4 Niveles ("Cero Parches")

```
[Nivel 1: Frontend PWA]
  Skeleton mientras consulta API
  + Bloqueo estricto del botón y formulario de Salida si viaje ya inició/arribó
       │
       ▼
[Nivel 2: Backend API / Lógica Intermedia]
  Idempotencia en registrarSalida:
  COALESCE(fecha_salida_patio, CURRENT_TIMESTAMP)
  + Blindaje de estado_trayecto (no retroceder estados concluidos)
       │
       ▼
[Nivel 3: Base de Datos PostgreSQL]
  Saneamiento puntual auditable del Log #53 (OT 17):
  fecha_salida_patio = 2026-11-09 10:23:33 UTC (07:23:33 CLT)
       │
       ▼
[Nivel 4: Consolidación y Vistas]
  Torre de Control, Ficha de Viaje e ITS reflejan el tiempo de traslado fáctico
  (57 min 36 seg de viaje real)
```

---

### 3. Especificación Detallada de Cambios

#### 3.1. Backend (`ejecucion/backend_remoto/src/models/viajeModel.js`)
En el método `registrarSalida`:
1. **Preservación Inmutable de Marcas Temporales:**
   - Para trayecto de `IDA`:
     `fecha_salida_patio = COALESCE(fecha_salida_patio, CURRENT_TIMESTAMP)`
   - Para trayecto de `RETORNO`:
     `fecha_salida_faena = COALESCE(fecha_salida_faena, CURRENT_TIMESTAMP)`
   - Para timestamp del dispositivo:
     `device_timestamp_salida = COALESCE(device_timestamp_salida, $5, CURRENT_TIMESTAMP)`
2. **Preservación de Evidencias Fotográficas:**
   - `foto_tablero_salida_path = COALESCE(foto_tablero_salida_path, $3, $10)`
   - `foto_odometro_salida_path = COALESCE(foto_odometro_salida_path, $10, $3)`
   - `foto_horometro_salida_path = COALESCE(foto_horometro_salida_path, $11)`
3. **Protección de Máquina de Estados:**
   - Si el viaje ya se encuentra en `ARRIBADO`, `LLEGADO` o `CONCLUIDO`, la llamada a `registrarSalida` no debe retroceder el estado a `EN_RUTA`:
     ```sql
     estado_trayecto = CASE 
       WHEN estado_trayecto IN ('ARRIBADO', 'LLEGADO', 'CONCLUIDO') THEN estado_trayecto 
       ELSE 'EN_RUTA' 
     END
     ```

#### 3.2. Frontend PWA (`ejecucion/pwa/src/views/ViajeConductor.vue`)
1. **Estado de Carga Inicial Silencioso (`cargandoViaje`):**
   - No asumir `estado_viaje = 'ASIGNADO'` por omisión mientras la petición a la API `/operaciones/viaje/:token` esté en vuelo.
   - Mostrar un estado de sincronización visual mientras se verifica el estado en base de datos.
2. **Deshabilitación Anti-Doble Clic:**
   - El botón "Iniciar Convoy / Confirmar Salida de Patio" debe deshabilitarse reactivamente apenas se pulse (`enviandoSalida = true`), evitando envíos concurrentes o reintentos impacientes.
3. **Transición Inmediata a Pantalla de En Ruta / Arribo:**
   - Una vez confirmada la salida o si `dbViaje.fecha_salida_patio` ya existe, la UI pasa directamente al bloque de viaje en tránsito con el botón de Llegada disponible.

#### 3.3. Base de Datos de Producción (`sch_leangsp_prod.tequ_log_desplazamiento`)
- Actualizar el registro histórico del Log #53 (OT 17 / Equipo 35 / Nicolás Ceballos):
  ```sql
  UPDATE sch_leangsp_prod.tequ_log_desplazamiento
  SET fecha_salida_patio = '2026-11-09 10:23:33.000Z',
      device_timestamp_salida = '2026-11-09 10:23:33.000Z'
  WHERE id_log_desplazamiento = 53;
  ```

---

### 4. Matriz de Pruebas QA Deterministas
1. **Prueba de Primera Salida:** Un viaje en estado `ASIGNADO` registra salida; se establece `fecha_salida_patio` con la hora actual.
2. **Prueba de Reintento / Idempotencia:** Se envía una segunda llamada a `POST .../salida` con 5 minutos de diferencia; el backend retorna `HTTP 200 OK`, pero `fecha_salida_patio` se mantiene idéntica a la primera llamada.
3. **Prueba de Protección de Viaje Concluido:** Se envía `POST .../salida` sobre un viaje que ya tiene estado `ARRIBADO`; el estado se mantiene `ARRIBADO` y no retrocede a `EN_RUTA`.
4. **Verificación de Caso Testigo OT 17:** Se consulta `id_log_desplazamiento = 53` y se verifica que la hora de salida corresponda a las 07:23:33 CLT y la llegada a las 08:21:09 CLT (duración 57m 36s).
