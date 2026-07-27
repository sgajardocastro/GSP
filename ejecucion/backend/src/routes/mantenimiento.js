import { Router } from 'express';

const router = Router();

// Mock in-memory database for demo/dev verification
const otsStore = [
  {
    folio: 'OT-10045',
    id_equipo: 142,
    patente: 'PAD-33-SN',
    tipo_mantenimiento: 'PREVENTIVO',
    estado: 'EN_PROCESO',
    falla_reportada: 'Revisión de frenos y cambio de filtros 10.000km',
    id_supervisor: 5,
    fecha_apertura: '2026-07-25T10:00:00Z',
    horometro_inicio: 1450.5,
    actividades: [
      { id: 1, descripcion: 'Desmontar ruedas delanteras', horas_estimadas: 1.5, estado: 'COMPLETADA', orden: 1 },
      { id: 2, descripcion: 'Revisión pastillas de freno', horas_estimadas: 0.5, estado: 'EN_PROCESO', orden: 2 }
    ],
    repuestos_planificados: [
      { id: 1, id_producto: 101, cantidad_requerida: 2, despachado: true },
      { id: 2, id_producto: 102, cantidad_requerida: 1, despachado: false }
    ],
    mano_obra: [
      { id: 1, id_tecnico: 12, horas_reales: 2.0, tarifa_hora: 15000, costo_calculado: 30000, descripcion_trabajo: 'Inspección de frenos' }
    ],
    servicios_externos: []
  }
];

// --- 1. OTs ---
router.get('/ots', async (req, res, next) => {
  try {
    const { estado, patente } = req.query;
    let result = otsStore;
    if (estado) result = result.filter(o => o.estado === estado);
    if (patente) result = result.filter(o => o.patente.toLowerCase().includes(patente.toLowerCase()));
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/ots', async (req, res, next) => {
  try {
    const { patente, descripcion, tipo_mantenimiento, id_equipo, id_supervisor } = req.body;
    if (!patente) {
      return res.status(400).json({ error_code: 'CAMPOS_INVALIDOS', message: 'Patente es obligatoria' });
    }

    // Regla de negocio: No abrir OT si ya hay una activa en el mismo equipo
    const otActiva = otsStore.find(o => o.patente === patente && o.estado !== 'CERRADA');
    if (otActiva) {
      return res.status(422).json({
        error_code: 'EQUIPO_CON_OT_ACTIVA',
        message: `El equipo con patente ${patente} ya tiene una OT abierta (${otActiva.folio}).`
      });
    }

    const nuevoFolio = `OT-${10000 + otsStore.length + 1}`;
    const nuevaOt = {
      folio: nuevoFolio,
      id_equipo: id_equipo || 100,
      patente,
      tipo_mantenimiento: tipo_mantenimiento || 'CORRECTIVO',
      estado: 'ABIERTA',
      falla_reportada: descripcion || 'Mantención solicitada',
      id_supervisor: id_supervisor || 1,
      fecha_apertura: new Date().toISOString(),
      actividades: [],
      repuestos_planificados: [],
      mano_obra: [],
      servicios_externos: []
    };

    otsStore.push(nuevaOt);
    res.status(201).json(nuevaOt);
  } catch (err) {
    next(err);
  }
});

router.get('/ots/:folio', async (req, res, next) => {
  try {
    const { folio } = req.params;
    const ot = otsStore.find(o => o.folio === folio);
    if (!ot) {
      return res.status(404).json({ error_code: 'OT_NO_ENCONTRADA', message: `No se encontró la OT con folio ${folio}` });
    }
    res.json(ot);
  } catch (err) {
    next(err);
  }
});

router.put('/ots/:folio/estado', async (req, res, next) => {
  try {
    const { folio } = req.params;
    const { estado } = req.body;
    const ot = otsStore.find(o => o.folio === folio);
    if (!ot) return res.status(404).json({ message: 'OT no encontrada' });
    ot.estado = estado;
    res.json({ folio, estado: ot.estado });
  } catch (err) {
    next(err);
  }
});

router.post('/ots/:folio/cerrar', async (req, res, next) => {
  try {
    const { folio } = req.params;
    const { pin_supervisor } = req.body;

    const ot = otsStore.find(o => o.folio === folio);
    if (!ot) return res.status(404).json({ message: 'OT no encontrada' });

    // Validar PIN
    if (!pin_supervisor || pin_supervisor !== '1234') {
      return res.status(422).json({
        error_code: 'PIN_INVALIDO',
        message: 'PIN de supervisor incorrecto para autorizar el cierre de OT.'
      });
    }

    // Validar Actividades incompletas
    const pendientesAct = ot.actividades.filter(a => a.estado !== 'COMPLETADA');
    if (pendientesAct.length > 0) {
      return res.status(422).json({
        error_code: 'OT_CON_ACTIVIDADES_PENDIENTES',
        message: `No se puede cerrar la OT porque tiene ${pendientesAct.length} actividades sin completar.`
      });
    }

    // Validar Repuestos pendientes de despachar
    const pendientesRep = ot.repuestos_planificados.filter(r => !r.despachado);
    if (pendientesRep.length > 0) {
      return res.status(422).json({
        error_code: 'OT_CON_REPUESTOS_PENDIENTES',
        message: `No se puede cerrar la OT porque tiene ${pendientesRep.length} repuestos sin despachar.`
      });
    }

    ot.estado = 'CERRADA';
    ot.fecha_cierre_real = new Date().toISOString();

    res.json({
      status: 'CERRADA',
      folio,
      fecha_cierre: ot.fecha_cierre_real,
      costo_total: 30000
    });
  } catch (err) {
    next(err);
  }
});

// --- 2. Actividades ---
router.post('/ots/:folio/actividades', async (req, res, next) => {
  try {
    const { folio } = req.params;
    const { descripcion, horas_estimadas } = req.body;
    const ot = otsStore.find(o => o.folio === folio);
    if (!ot) return res.status(404).json({ message: 'OT no encontrada' });

    const nuevaActividad = {
      id: Date.now(),
      descripcion,
      horas_estimadas: horas_estimadas || 1.0,
      estado: 'PENDIENTE',
      orden: ot.actividades.length + 1
    };
    ot.actividades.push(nuevaActividad);
    res.status(201).json(nuevaActividad);
  } catch (err) {
    next(err);
  }
});

router.put('/ots/:folio/actividades/:id', async (req, res, next) => {
  try {
    const { folio, id } = req.params;
    const { estado } = req.body;
    const ot = otsStore.find(o => o.folio === folio);
    if (!ot) return res.status(404).json({ message: 'OT no encontrada' });

    const act = ot.actividades.find(a => a.id === Number(id));
    if (!act) return res.status(404).json({ message: 'Actividad no encontrada' });

    act.estado = estado;
    res.json(act);
  } catch (err) {
    next(err);
  }
});

// --- 3. Repuestos Planificados ---
router.post('/ots/:folio/repuestos', async (req, res, next) => {
  try {
    const { folio } = req.params;
    const { id_producto, cantidad } = req.body;
    const ot = otsStore.find(o => o.folio === folio);
    if (!ot) return res.status(404).json({ message: 'OT no encontrada' });

    const nuevoRep = {
      id: Date.now(),
      id_producto,
      cantidad_requerida: cantidad || 1,
      despachado: false
    };
    ot.repuestos_planificados.push(nuevoRep);
    res.status(201).json(nuevoRep);
  } catch (err) {
    next(err);
  }
});

// --- 4. HH ---
router.post('/ots/:folio/hh', async (req, res, next) => {
  try {
    const { folio } = req.params;
    const { id_tecnico, horas, tarifa_hora, descripcion_trabajo } = req.body;
    const ot = otsStore.find(o => o.folio === folio);
    if (!ot) return res.status(404).json({ message: 'OT no encontrada' });

    const hrs = Number(horas) || 1.0;
    const tar = Number(tarifa_hora) || 15000;

    const nuevaHH = {
      id: Date.now(),
      id_tecnico,
      horas_reales: hrs,
      tarifa_hora: tar,
      costo_calculado: hrs * tar,
      descripcion_trabajo: descripcion_trabajo || 'Mano de obra'
    };
    ot.mano_obra.push(nuevaHH);
    res.status(201).json(nuevaHH);
  } catch (err) {
    next(err);
  }
});

// --- 5. Servicios Externos ---
router.post('/ots/:folio/servicios', async (req, res, next) => {
  try {
    const { folio } = req.params;
    const { proveedor, numero_documento_compra, costo } = req.body;
    const ot = otsStore.find(o => o.folio === folio);
    if (!ot) return res.status(404).json({ message: 'OT no encontrada' });

    const nuevoServ = {
      id: Date.now(),
      proveedor,
      numero_documento_compra,
      costo: Number(costo) || 0
    };
    ot.servicios_externos.push(nuevoServ);
    res.status(201).json(nuevoServ);
  } catch (err) {
    next(err);
  }
});

export default router;
