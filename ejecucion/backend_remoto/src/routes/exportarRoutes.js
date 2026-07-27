const express = require('express');
const router = express.Router();
const { generarPDF } = require('../services/exportService');
const exportarController = require('../controllers/exportarController');

router.post('/', async (req, res) => {
  try {
    const idInspeccion = req.query.idInspeccion;
    const nombreArchivo = await generarPDF(idInspeccion);
    res.json({ success: true, archivo: nombreArchivo });
  } catch (error) {
    console.error('❌ Error al generar PDF:', error);
    res.status(500).json({ error: 'Error al generar PDF' });
  }
});

router.post('/generar', exportarController.generarYGuardarPDF);

module.exports = router;
