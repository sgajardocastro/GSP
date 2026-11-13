const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const routerApi = require('./src/routes');

const app = express();
const fileUpload = require('express-fileupload');
//const port = 3002;

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(fileUpload());
app.use(cors(/*{
    origin: 'http://localhost:3000' 
}*/));

routerApi(app);

const PORT = process.env.PORT || 3006;
app.listen(PORT, ()=> {
    console.log("Servidor iniciado en http://localhost:" + PORT);

    const isProd = process.env.APP_ENV === 'prod' || process.env.NODE_ENV === 'production' || process.env.DB_SCHEMA === 'sch_leangsp_prod';
    const enableWorkers = isProd || process.env.ENABLE_BACKGROUND_WORKERS === 'true';

    if (!enableWorkers) {
        console.log("[WORKERS] Ambiente DEV detectado: Workers automáticos de alertas (SLA 13:00 hrs y Mantenimiento) desactivados para evitar envíos programados de prueba a usuarios reales.");
        return;
    }

    // Iniciar Worker Auditor de SLA PMO 13:00 hrs (Spec 57 / REQ-026)
    const slaAuditorService = require('./src/services/slaAuditorService');
    const INTERVALO_SLA_MS = 15 * 60 * 1000; // cada 15 minutos
    setInterval(async () => {
        try {
            const res = await slaAuditorService.ejecutarAlertasSLA();
            if (res.total_alertadas > 0) {
                console.log(`[WORKER-SLA] Alertas enviadas para ${res.total_alertadas} OT(s) a Yiara y Jorge.`);
            }
        } catch (e) {
            console.warn('[WORKER-SLA] Error en ejecución periódica:', e.message);
        }
    }, INTERVALO_SLA_MS);
    console.log("[WORKER-SLA] Worker auditor de SLA PMO iniciado (intervalo: 15 min).");

    // Iniciar Worker Auditor de Mantenimiento Flota (Spec 67)
    const mantenimientoAlertasService = require('./src/services/mantenimientoAlertasService');
    const INTERVALO_MNT_MS = 30 * 60 * 1000; // cada 30 minutos
    setInterval(async () => {
        try {
            await mantenimientoAlertasService.ejecutarAlertasMantenimiento(9);
        } catch (e) {
            console.warn('[WORKER-MNT] Error en ejecución periódica:', e.message);
        }
    }, INTERVALO_MNT_MS);
    console.log("[WORKER-MNT] Worker auditor de Mantenimiento Flota iniciado (intervalo: 30 min).");
});