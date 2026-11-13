/**
 * Módulo de Persistencia Offline-First & Sync Engine para Viaje del Conductor (GSP)
 * Implementa almacenamiento en IndexedDB, compresión de fotos y cola de sincronización transaccional.
 */

const DB_NAME = 'GSP_VIAJE_OFFLINE_DB';
const DB_VERSION = 1;

/**
 * Inicializa y devuelve la instancia de IndexedDB
 */
export function openViajeDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('store_sesion')) {
        db.createObjectStore('store_sesion', { keyPath: 'token_viaje' });
      }
      if (!db.objectStoreNames.contains('store_mutaciones')) {
        const outboxStore = db.createObjectStore('store_mutaciones', { keyPath: 'id' });
        outboxStore.createIndex('token_viaje', 'token_viaje', { unique: false });
        outboxStore.createIndex('estado_sync', 'estado_sync', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Guarda o actualiza la sesión del viaje localmente
 */
export async function guardarSesionLocal(token, sesionData) {
  try {
    const db = await openViajeDB();
    const cleanData = JSON.parse(JSON.stringify(sesionData || {}));
    return new Promise((resolve) => {
      const tx = db.transaction('store_sesion', 'readwrite');
      const store = tx.objectStore('store_sesion');
      const record = {
        token_viaje: token,
        ...cleanData,
        updated_at_local: new Date().toISOString()
      };
      const req = store.put(record);
      req.onsuccess = () => resolve(record);
      req.onerror = (e) => {
        console.warn('[OfflineDB] Error en put:', e);
        resolve(record);
      };
    });
  } catch (err) {
    console.warn('[OfflineDB] Excepción guardando sesión local:', err);
    return sesionData;
  }
}

/**
 * Recupera la sesión del viaje guardada localmente
 */
export async function obtenerSesionLocal(token) {
  try {
    const db = await openViajeDB();
    return new Promise((resolve) => {
      const tx = db.transaction('store_sesion', 'readonly');
      const store = tx.objectStore('store_sesion');
      const req = store.get(token);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('[OfflineDB] Error obteniendo sesión local:', err);
    return null;
  }
}

/**
 * Agrega una mutación a la cola Outbox
 */
export async function encolarMutacion(token, tipo, payload, gps = null) {
  try {
    const db = await openViajeDB();
    const cleanPayload = JSON.parse(JSON.stringify(payload || {}));
    const cleanGps = gps ? JSON.parse(JSON.stringify(gps)) : null;
    const mutacion = {
      id: `mut_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      token_viaje: token,
      tipo,
      payload: cleanPayload,
      gps: cleanGps,
      t_device: new Date().toISOString(),
      estado_sync: 'PENDIENTE',
      reintentos: 0,
      created_at: Date.now()
    };

    return new Promise((resolve) => {
      const tx = db.transaction('store_mutaciones', 'readwrite');
      const store = tx.objectStore('store_mutaciones');
      const req = store.add(mutacion);
      req.onsuccess = () => resolve(mutacion);
      req.onerror = () => resolve(mutacion);
    });
  } catch (err) {
    console.warn('[OfflineDB] Error encolando mutación:', err);
    return null;
  }
}

/**
 * Obtiene todas las mutaciones pendientes para un token
 */
export async function obtenerMutacionesPendientes(token) {
  const db = await openViajeDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('store_mutaciones', 'readonly');
    const store = tx.objectStore('store_mutaciones');
    const req = store.getAll();
    req.onsuccess = () => {
      const all = req.result || [];
      const pendientes = all.filter(m => m.token_viaje === token && m.estado_sync === 'PENDIENTE');
      resolve(pendientes);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Marca una mutación como sincronizada (o la elimina)
 */
export async function marcarMutacionSincronizada(id) {
  const db = await openViajeDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('store_mutaciones', 'readwrite');
    const store = tx.objectStore('store_mutaciones');
    const req = store.delete(id);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Sync Engine: Procesa y sube las mutaciones pendientes al backend PostgreSQL
 */
export async function sincronizarMutacionesConBackend(token, apiInstance) {
  if (!navigator.onLine || !token || token.includes('demo')) return 0;
  
  const pendientes = await obtenerMutacionesPendientes(token);
  if (pendientes.length === 0) return 0;

  let sincronizadas = 0;
  for (const m of pendientes) {
    try {
      if (m.tipo === 'INICIO_VIAJE') {
        await apiInstance.post(`/operaciones/viaje/${token}/salida`, m.payload);
        await marcarMutacionSincronizada(m.id);
        sincronizadas++;
      } else if (m.tipo === 'CARGA_COMBUSTIBLE') {
        await apiInstance.post(`/operaciones/viaje/${token}/combustible`, m.payload);
        await marcarMutacionSincronizada(m.id);
        sincronizadas++;
      } else if (m.tipo === 'FIN_VIAJE') {
        await apiInstance.post(`/operaciones/viaje/${token}/llegada`, m.payload);
        await marcarMutacionSincronizada(m.id);
        sincronizadas++;
      } else if (m.tipo === 'PING_GPS') {
        await apiInstance.post(`/operaciones/viaje/${token}/ping`, m.payload);
        await marcarMutacionSincronizada(m.id);
        sincronizadas++;
      } else if (m.tipo === 'CREAR_REPORTE_DIARIO') {
        const p = m.payload || {};
        let id_proyecto = p.id_proyecto;
        let id_equipo = p.id_equipo;
        let id_user_operador = p.id_user_operador;

        if (!id_proyecto || !id_user_operador) {
          try {
            const sesion = await obtenerSesionLocal(token);
            if (sesion) {
              id_proyecto = id_proyecto || sesion.id_proyecto;
              id_equipo = id_equipo || sesion.id_equipo;
              id_user_operador = id_user_operador || sesion.id_user_chofer;
            }
          } catch (e) {
            console.warn('[SyncEngine] No se pudo leer sesion local:', e);
          }
        }

        const payloadNorm = {
          id_proyecto: id_proyecto,
          id_equipo: id_equipo || null,
          id_user_operador: id_user_operador || 55,
          dia_correlativo: Number(p.dia_correlativo || p.dia || 1),
          fecha_reporte: p.fecha_reporte || p.fecha || new Date().toISOString().split('T')[0],
          hora_inicio: p.hora_inicio || '08:00',
          hora_termino: p.hora_termino || '18:00',
          horas_colacion: p.horas_colacion !== undefined ? p.horas_colacion : Number((Number(p.colacion_minutos || 60) / 60).toFixed(2)),
          horas_operadas: p.horas_operadas !== undefined ? p.horas_operadas : Number(p.horas_efectivas || 0),
          horas_minimas: 4.0,
          horas_facturables: Number(p.horas_facturables || 0),
          horometro_inicio: p.horometro_inicio !== undefined ? Number(p.horometro_inicio) : null,
          horometro_termino: p.horometro_termino !== undefined ? Number(p.horometro_termino) : (p.horometro_final !== undefined ? Number(p.horometro_final) : null),
          odometro_inicio: p.odometro_inicio || null,
          odometro_termino: p.odometro_termino || null,
          observacion_trabajo: p.observacion_trabajo || p.maniobra_detalle || '',
          cliente_nombre: p.cliente_nombre || p.mandante_nombre || 'Supervisor Mandante',
          cliente_rut: p.cliente_rut || p.mandante_rut || '',
          cliente_cargo: p.cliente_cargo || p.mandante_cargo || 'ITO Mandante',
          cliente_firma_canvas_base64: p.cliente_firma_canvas_base64 || p.firma_mandante || null,
          latitud_inicio_servicio: p.latitud_inicio_servicio || p.gps_sellado?.latitud || null,
          longitud_inicio_servicio: p.longitud_inicio_servicio || p.gps_sellado?.longitud || null,
          accuracy_firma: p.accuracy_firma || p.gps_sellado?.accuracy || null,
          token_viaje: token,
          device_timestamp: p.device_timestamp || new Date().toISOString()
        };

        await apiInstance.post('/operaciones/report/guardar', payloadNorm);
        await marcarMutacionSincronizada(m.id);
        sincronizadas++;
      }
    } catch (err) {
      if (err?.response?.status === 403 && (err?.response?.data?.code === 'SERVICIO_CONCLUIDO' || err?.response?.data?.error?.includes('concluido') || err?.response?.data?.error?.includes('completó'))) {
        console.warn(`[SyncEngine] Mutación ${m.id} rechazada con 403 Candado Operativo (Servicio Concluido). Descartando de la cola.`);
        await marcarMutacionSincronizada(m.id);
      } else {
        console.warn(`[SyncEngine] No se pudo enviar mutación ${m.id}:`, err?.message || err);
        // Mantener en cola para siguiente reintento
      }
    }
  }

  return sincronizadas;
}

/**
 * Comprime una imagen en el cliente antes de guardarla localmente
 */
export function comprimirFoto(file, maxDimension = 1280, quality = 0.75) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve('');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = () => reject(new Error('Error al decodificar la imagen'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Criptografía: Calcula el hash SHA-256 de un PIN de 4 dígitos
 */
export async function hashPin(pin, salt = 'GSP-SALT-2026') {
  if (!pin) return '';
  const msgUint8 = new TextEncoder().encode(`${salt}:${pin}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

let currentGpsState = {
  latitud: null,
  longitud: null,
  velocidad_kmh: 0,
  accuracy: null,
  timestamp: null,
  fuente: 'INIT'
};

let watchId = null;

/**
 * Inicia el monitoreo continuo de GPS mediante watchPosition del navegador
 */
export function iniciarWatcherGPS(onPosicionCallback) {
  if (watchId != null) return;
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    console.warn('[GPS] Geolocation no soportado en este entorno');
    return;
  }

  try {
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = pos.coords;
        const velKmh = (coords.speed != null && coords.speed >= 0)
          ? Math.round(coords.speed * 3.6)
          : 0;
        currentGpsState = {
          latitud: coords.latitude,
          longitud: coords.longitude,
          velocidad_kmh: velKmh,
          accuracy: coords.accuracy || 10,
          timestamp: new Date(pos.timestamp || Date.now()).toISOString(),
          fuente: 'GPS_REAL'
        };
        if (typeof onPosicionCallback === 'function') {
          onPosicionCallback(currentGpsState);
        }
      },
      (err) => {
        console.warn('[GPS] Error en watchPosition:', err.code, err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 10000
      }
    );
  } catch (e) {
    console.warn('[GPS] Excepción al iniciar watchPosition:', e);
  }
}

/**
 * Detiene el monitoreo continuo de GPS
 */
export function detenerWatcherGPS() {
  if (watchId != null && typeof navigator !== 'undefined' && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
}

/**
 * Retorna la última posición GPS conocida de forma instantánea (0ms)
 */
export function getUltimaPosicionGPS() {
  return {
    ...currentGpsState,
    timestamp: new Date().toISOString()
  };
}

/**
 * Captura la geolocalización actual del dispositivo (GPS)
 * - Pide permiso al navegador si no está inicializado
 * - Si el GPS responde, actualiza la posición
 * - Si demora o falla, retorna la última posición conocida sin bloquear el flujo
 */
export function obtenerCoordenadasGPS(timeoutMs = 4000) {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(getUltimaPosicionGPS());
      return;
    }

    let resolved = false;
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(getUltimaPosicionGPS());
      }
    }, timeoutMs);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          const coords = pos.coords;
          const velKmh = coords.speed != null && coords.speed >= 0
            ? Math.round(coords.speed * 3.6)
            : 0;
          currentGpsState = {
            latitud: coords.latitude,
            longitud: coords.longitude,
            velocidad_kmh: velKmh,
            accuracy: coords.accuracy,
            timestamp: new Date(pos.timestamp || Date.now()).toISOString(),
            fuente: 'GPS_REAL'
          };
          resolve(currentGpsState);
        }
      },
      (err) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          console.warn('[GPS] Error en getCurrentPosition:', err.code, err.message);
          resolve(getUltimaPosicionGPS());
        }
      },
      {
        enableHighAccuracy: true,
        timeout: timeoutMs,
        maximumAge: 5000
      }
    );
  });
}

