
// services/enrolamientoService.js
const pool = require("../config/postgresPool");
const surveyModel = require("../models/surveyModel");
const survey = new surveyModel();
const flujoModel = require("../models/flujoModel");
const flujoM = new flujoModel();

// usamos la función core, NO el endpoint HTTP
const { generarYGuardarPDFCore } = require('../controllers/exportarController');

async function crearConsentimientoEnrolamiento({ id_user, rut }) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1) Buscar template de consentimiento (En Transmac es el 500)
    const { rows: tmplRows } = await client.query(`
      SELECT 
        id_template,
        id_tipo_srv,
        header_seed,
        body_seed,
        approval_seed,
        id_flow_tmpl,
        id_empresa_cliente
      FROM tsrv_templates
      WHERE id_template = 500
      LIMIT 1
    `);

    if (!tmplRows.length) {
      throw new Error("No se encontró template CONSENTIMIENTO (id_template=500)");
    }

    const tmpl = tmplRows[0];

    // 1.1) Formatear fecha DD/MM/YYYY y reemplazar dentro del body_seed
    const hoy = new Date();
    const dia = String(hoy.getDate()).padStart(2, "0");
    const mes = String(hoy.getMonth() + 1).padStart(2, "0");
    const anio = hoy.getFullYear();
    const fechaStr = `${dia}/${mes}/${anio}`; // 05/12/2025

    let bodySeedObj = tmpl.body_seed;

    // si viene como string JSON, parseamos
    if (typeof bodySeedObj === "string") {
      try {
        bodySeedObj = JSON.parse(bodySeedObj);
      } catch (e) {
        // si no se puede parsear, lo dejamos como está
      }
    }

    const reemplazarFechaRec = (nodo) => {
      if (!nodo) return;
      if (Array.isArray(nodo)) {
        nodo.forEach(reemplazarFechaRec);
      } else if (typeof nodo === "object") {
        for (const k of Object.keys(nodo)) {
          const v = nodo[k];
          if (typeof v === "string") {
            nodo[k] = v
              .replace("{{DD/MM/YYYY}}", fechaStr)
              .replace("DD/MM/YYYY", fechaStr);
          } else {
            reemplazarFechaRec(v);
          }
        }
      }
    };

    if (bodySeedObj && typeof bodySeedObj === "object") {
      reemplazarFechaRec(bodySeedObj);
    }

    const bodySeedFinal =
      typeof bodySeedObj === "string"
        ? bodySeedObj
        : JSON.stringify(bodySeedObj);

    const fechaISO = hoy.toISOString().split("T")[0]; // 2025-12-05

    // 2) Crear survey (postSurvey ya arma el flujo base via flujoModel.instanciarFlujo)
    const nuevoIdSurvey = await survey.postSurvey({
      id_tipo_srv: tmpl.id_tipo_srv,
      id_template: tmpl.id_template,
      id_user: id_user,              // dueño = mismo usuario
      id_user_creacion: id_user,
      id_empresa_cliente: tmpl.id_empresa_cliente || 1, // Transmac
      estado_srv: "Creado",
      header_seed: tmpl.header_seed,
      body_seed: bodySeedFinal,
      approval_seed: tmpl.approval_seed,
      header_exec: tmpl.header_seed,
      body_exec: bodySeedFinal,
      approval_exec: tmpl.approval_seed,
      fecha_plan_ini: fechaISO,
      fecha_plan_fin: fechaISO,
      fecha_real_ini: null,
      fecha_real_fin: null,
      fecha_upload: null,
      latitud: null,
      longitud: null,
      id_proyecto: 1, // Default Chuquicamata
      id_flow_tmpl: tmpl.id_flow_tmpl,
      id_personalizado: null,
    });

    const id_survey =
      typeof nuevoIdSurvey === "object"
        ? nuevoIdSurvey.id_survey
        : nuevoIdSurvey;

    // 3) Generar PDF y guardar archivo (uuid, tfmg_file, etc.)
    const pdfInfo = await generarYGuardarPDFCore(id_survey);
    // pdfInfo = { id_doc, path_doc, name_doc_interno, name_doc_orig }

    // 4) Instanciar flujo de aprobación usando ese documento como idDocIn
    const resultFlujo = await flujoM.instanciarFlujo({
      idSurvey: id_survey,
      idDocIn: pdfInfo.id_doc,
    });

    const id_flow = resultFlujo.idFlow || resultFlujo.id_flow;

    // 4.1) Obtener el PRIMER paso del flujo
    const { rows: pasos } = await client.query(
      `
      SELECT id_flow_stp, id_rol, flag_equipo
        FROM tflw_flow_steps
       WHERE id_flow = $1
       ORDER BY flow_tmpl_step_orden ASC
       LIMIT 1
      `,
      [id_flow]
    );

    if (!pasos.length) {
      throw new Error("No se encontró el primer paso del flujo para el consentimiento");
    }

    const paso = pasos[0];

    // 4.2) Asignar ese paso al MISMO usuario (para que él firme)
    await survey.updateSurveyUserFlow({
      id_flow_stp: paso.id_flow_stp,
      id_user_flujo: id_user,
      flag_equipo: paso.flag_equipo,
    });

    console.log('✅ Paso de flujo asignado al usuario enrolado:', {
      id_flow_stp: paso.id_flow_stp,
      id_flow,
      id_user
    });

    // 5) Opcional: dejar el survey en VERIFICACION (similar a terminarSurveyYExportar pero simple)
    if (typeof survey.marcarSurveyVerificacionSimple === "function") {
      await survey.marcarSurveyVerificacionSimple(id_survey, {
        latitud: null,
        longitud: null,
      });
      console.log("✅ Consentimiento actualizado a estado VERIFICACION (simple)");
    }

    await client.query("COMMIT");

    // 6) Devolver detalle compatible con FirmaDialog
    return {
      id_survey,
      id_flow,
      detalles: [
        {
          id_flow_stp: paso.id_flow_stp,                    // 👈 AHORA DEFINIDO
          id_flow,
          id_doc_in: pdfInfo.id_doc,
          name_doc_interno_in: pdfInfo.name_doc_interno,
          name_doc_orig_in: pdfInfo.name_doc_orig,
          id_rol: paso.id_rol,
          flag_equipo: paso.flag_equipo,
          estado: "PENDIENTE",
        },
      ],
    };
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error en crearConsentimientoEnrolamiento:", err);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  crearConsentimientoEnrolamiento,
};

