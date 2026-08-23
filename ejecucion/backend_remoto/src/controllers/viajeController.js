const viajeModel = require('../models/viajeModel');
const estadoPagoModel = require('../models/estadoPagoModel');

const viajeController = {
  // 1. Obtener datos del viaje por token (Público / PWA)
  async getViajePorToken(req, res) {
    try {
      const { token } = req.params;
      const viaje = await viajeModel.getViajePorToken(token);
      if (!viaje) {
        return res.status(404).json({ error: 'Viaje no encontrado o token inválido' });
      }
      res.json(viaje);
    } catch (err) {
      console.error('Error al obtener viaje por token:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // 2. Registrar Salida de Patio (Paso 1)
  async registrarSalida(req, res) {
    try {
      const { token } = req.params;
      const { km_inicial, horometro_inicial, foto_salida, pin_hash, latitud, longitud } = req.body;

      if (!km_inicial || !pin_hash) {
        return res.status(400).json({ error: 'Odómetro y PIN son requeridos para iniciar salida' });
      }

      const actualizado = await viajeModel.registrarSalida({
        token_viaje: token,
        km_inicial,
        horometro_inicial,
        foto_salida,
        pin_hash,
        latitud,
        longitud
      });

      res.json({ success: true, message: 'Salida de patio registrada exitosamente', data: actualizado });
    } catch (err) {
      console.error('Error registrando salida:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // 3. Registrar Carga de Combustible (Copec)
  async registrarCombustible(req, res) {
    try {
      const { token } = req.params;
      const {
        tipo_estanque,
        litros,
        monto,
        foto_voucher,
        foto_tablero,
        id_autorizacion_copec,
        odometro,
        horometro,
        observacion
      } = req.body;

      const costoRegistrado = await viajeModel.registrarCombustible({
        token_viaje: token,
        tipo_estanque,
        litros,
        monto,
        foto_voucher,
        foto_tablero,
        id_autorizacion_copec,
        odometro,
        horometro,
        observacion
      });

      res.status(201).json({ success: true, message: 'Carga de combustible registrada exitosamente', data: costoRegistrado });
    } catch (err) {
      console.error('Error registrando combustible:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // 4. Registrar Llegada a Faena (Paso 3)
  async registrarLlegada(req, res) {
    try {
      const { token } = req.params;
      const { km_final, horometro_final, foto_llegada, pin_hash, latitud, longitud, obs_termino } = req.body;

      if (!km_final || !pin_hash) {
        return res.status(400).json({ error: 'Odómetro de llegada y PIN son requeridos' });
      }

      const actualizado = await viajeModel.registrarLlegada({
        token_viaje: token,
        km_final,
        horometro_final,
        foto_llegada,
        pin_hash,
        latitud,
        longitud,
        obs_termino
      });

      res.json({ success: true, message: 'Llegada a faena registrada exitosamente', data: actualizado });
    } catch (err) {
      console.error('Error registrando llegada:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // 5. Ping de Telemetría GPS
  async registrarPing(req, res) {
    try {
      const { token } = req.params;
      const { latitud, longitud, velocidad_kmh, evento, km_inicial, km_final } = req.body;

      const viaje = await viajeModel.getViajePorToken(token);
      if (!viaje) return res.status(404).json({ error: 'Viaje no encontrado' });

      const data = await estadoPagoModel.registrarPingDesplazamiento({
        id_proyecto: viaje.id_proyecto,
        id_equipo: viaje.id_equipo,
        patente: viaje.patente,
        tipo_trayecto: viaje.tipo_trayecto,
        latitud,
        longitud,
        velocidad_kmh,
        evento,
        km_inicial,
        km_final
      });

      res.json({ success: true, data });
    } catch (err) {
      console.error('Error registrando ping de viaje:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // 6. Crear o Asignar Viaje desde el CRM
  async crearOAsignarViaje(req, res) {
    try {
      const { id_proyecto, id_equipo, id_user_chofer, patente, tipo_trayecto } = req.body;
      if (!id_proyecto || !id_equipo) {
        return res.status(400).json({ error: 'id_proyecto e id_equipo son requeridos' });
      }

      const viaje = await viajeModel.crearOObtenerViaje({
        id_proyecto,
        id_equipo,
        id_user_chofer,
        patente,
        tipo_trayecto
      });

      res.status(201).json({ success: true, data: viaje });
    } catch (err) {
      console.error('Error al crear o asignar viaje:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // 7. Listar Viajes de un Proyecto (CRM)
  async getViajesPorProyecto(req, res) {
    try {
      const { id_proyecto } = req.params;
      const viajes = await viajeModel.getViajesPorProyecto(id_proyecto);
      res.json(viajes);
    } catch (err) {
      console.error('Error al listar viajes por proyecto:', err);
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = viajeController;
