const express = require('express');
const router = express.Router();
const surveyController = require('../controllers/surveyController');

router.post('/', surveyController.postSurvey);
router.get('/visitas-terreno', surveyController.getVisitasTerreno);
router.get('/visitas-terreno/:id_survey', surveyController.getVisitaDetails);
router.post('/DelSurvey', surveyController.postDelSurvey);
router.post('/UpdSurveyEstado', surveyController.postUpdSurveyEstado);
router.post(
  "/consentimiento-enrolamiento",
  surveyController.postConsentimientoEnrolamiento
);

router.post('/UpdSurveyAsignaciones', surveyController.postUpdSurveyAsignaciones);

router.put('/UpdUserFlow', surveyController.putSurveyUserFlow);
// rutas más específicas primero
router.put('/UpdPlan/:id_survey', surveyController.putSurveyPlan);
router.put('/UpdFechaEjecFin/:id_survey', surveyController.putSurveyFechaEjecFin);


// la genérica al final
router.put('/:id_survey', surveyController.putSurvey);

module.exports = router;