const controlVivoController = require('../src/controllers/controlVivoController');

const req = {
  query: {}
};

const res = {
  json(data) {
    console.log("TEST SUCCESSFUL!");
    console.log("Fecha:", data.fecha, "Hora:", data.hora_actual, "Ventana:", data.ventana_activa);
    console.log("KPIs:", data.kpis);
    console.log("Total servicios devueltos:", data.servicios.length);
    if (data.servicios.length > 0) {
      console.log("Primer servicio ejemplo:", JSON.stringify(data.servicios[0], null, 2));
    }
    process.exit(0);
  },
  status(code) {
    return {
      json(err) {
        console.error("TEST FAILED WITH STATUS", code, err);
        process.exit(1);
      }
    };
  }
};

controlVivoController.getControlVivo(req, res);
