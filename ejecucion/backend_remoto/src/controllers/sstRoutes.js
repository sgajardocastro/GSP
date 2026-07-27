const express = require("express");
const router = express.Router();
const sstController = require("../controllers/sstController");

// Informe
router.post("/get-or-create", sstController.getOrCreateInforme);
router.post("/informe/:id_informe", sstController.updateInforme);

// Accidentabilidad
router.get("/accidentabilidad/:id_informe", sstController.getAccidentabilidad);
router.post("/accidentabilidad", sstController.saveAccidentabilidad);
router.delete("/accidentabilidad/:id_accidentabilidad", sstController.deleteAccidentabilidad);

// Incidentes
router.get("/incidentes/:id_informe", sstController.getIncidentes);
router.post("/incidentes", sstController.saveIncidente);
router.delete("/incidentes/:id_incidente", sstController.deleteIncidente);

module.exports = router;
