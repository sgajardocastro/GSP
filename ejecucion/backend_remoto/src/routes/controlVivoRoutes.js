const express = require('express');
const router = express.Router();
const controlVivoController = require('../controllers/controlVivoController');

// 1. Monitor Consolidado del Día (Opción 3 Híbrida / Spec 63)
router.get('/', controlVivoController.getControlVivo);

// 2. Notificaciones In-Web del Día
router.get('/notificaciones', controlVivoController.getNotificacionesWeb);
router.post('/notificaciones/:id/leida', controlVivoController.marcarNotificacionLeida);
router.post('/notificaciones/marcar-todas', controlVivoController.marcarTodasLeidas);

// 3. REQ-997 / Caso 2: Carga Manual / Corrección de Horas de Hitos por Control de Gestión (Yiara / Adm)
router.post('/override-hito', controlVivoController.overrideHitoActividad);

// 4. REQ-1099: Adjuntar cualquier documento o fotografía asociada a un día de servicio (PMO / Report Día X)
router.post('/adjuntar-documento-dia', controlVivoController.adjuntarDocumentoDia);
router.delete('/documento-dia/:id_doc', controlVivoController.eliminarDocumentoDia);

module.exports = router;

