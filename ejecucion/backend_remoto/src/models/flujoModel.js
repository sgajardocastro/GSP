const pool = require("../config/postgresPool");

class Flujo {
  constructor() {
    this.pool = pool;
    this.pool.on("error", (err) => console.error(err));
  }

  async instanciarFlujo({ idSurvey, idDocIn }) {
    try {
      console.log('Se inicia instanciarFlujo idSurvey:', idSurvey);

      const obtenerFlowQuery = `
        SELECT id_flow 
        FROM tsrv_survey 
        WHERE id_survey = $1 AND id_flow IS NOT NULL
      `;
      const resObtenerFlow = await this.pool.query(obtenerFlowQuery, [idSurvey]);

      if (resObtenerFlow.rowCount > 0) {
        console.log('✅ Ya existe un flujo asociado a este survey:', resObtenerFlow.rows[0].id_flow);

        // Obtener el id_user asignado a la encuesta para mantenerlo en el Paso 1
        const surveyUserQuery = `
          SELECT id_user 
          FROM tsrv_survey 
          WHERE id_survey = $1
        `;
        const resUserSurvey = await this.pool.query(surveyUserQuery, [idSurvey]);
        const idUserSurvey = resUserSurvey.rows[0]?.id_user || null;

        await this.pool.query(`
          UPDATE tflw_flow_steps
          SET estado = 'PENDIENTE',
          id_user = $3,
          id_doc_in = $2,
          id_doc_out = NULL
          WHERE id_flow = $1 AND flow_tmpl_step_orden = 1;
        `, [resObtenerFlow.rows[0].id_flow, idDocIn, idUserSurvey]);

        await this.pool.query(`
          UPDATE tflw_flow_steps
          SET
          id_doc_in = NULL,
          id_doc_out = NULL
          WHERE id_flow = $1 AND flow_tmpl_step_orden > 1;
        `, [resObtenerFlow.rows[0].id_flow]);

        return { success: true, idFlow: resObtenerFlow.rows[0].id_flow };
      }

      // ✅ PASO 1 - Tomar id_flow_tmpl e id_user directamente desde tsrv_survey
      const surveyQuery = `
        SELECT id_flow_tmpl, id_user
        FROM tsrv_survey
        WHERE id_survey = $1
      `;

      const resSurvey = await this.pool.query(surveyQuery, [idSurvey]);

      console.log('Id Template Flujo:', resSurvey.rows[0].id_flow_tmpl);

      if (resSurvey.rowCount === 0 || !resSurvey.rows[0].id_flow_tmpl) {
        throw new Error(`El survey ${idSurvey} no tiene asignado id_flow_tmpl.`);
      }

      const idFlowTmpl = resSurvey.rows[0].id_flow_tmpl;
      const idUserSurvey = resSurvey.rows[0].id_user || null;

      // ✅ PASO 2 - Insertar tflw_flows
      const insertFlowSQL = `
        INSERT INTO tflw_flows (
          id_survey,
          id_flow_tmpl,
          flow_tmpl_fase,
          fecha_creacion
        )
        VALUES ($1, $2, 'VERIFICACION', now())
        RETURNING id_flow;
      `;

      const resFlow = await this.pool.query(insertFlowSQL, [idSurvey, idFlowTmpl]);
      const idFlow = resFlow.rows[0].id_flow;

      // ✅ PASO 3 - Obtener steps del template
      const stepsSQL = `
        SELECT
          id_flow_tmpl_step,
          flow_tmpl_step_orden,
          flow_tmpl_step_fase,
          id_rol,
          flag_flow_fin, 
          flag_equipo
        FROM tflw_template_steps
        WHERE id_flow_tmpl = $1
        ORDER BY flow_tmpl_step_orden;
      `;

      console.log('SQL SELECT ---------------', stepsSQL );

      const resSteps = await this.pool.query(stepsSQL, [idFlowTmpl]);

      let stepIndex = 0;
      for (const step of resSteps.rows) {
        const idDocInToUse = stepIndex === 0 ? idDocIn : null;
        // Asignar dinámicamente el id_user del creador/ejecutor si es el Paso 1 de firmas
        const idUserToUse = Number(step.flow_tmpl_step_orden) === 1 ? idUserSurvey : null;

        await this.pool.query(`
          INSERT INTO tflw_flow_steps (
            id_flow,
            id_flow_tmpl_step,
            flow_tmpl_step_orden,
            estado,
            id_user,
            id_rol,
            id_doc_in, 
            flow_step_event,
            flag_flow_fin,
            flag_equipo
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'CREADO', $8, $9);
        `, [
          idFlow,
          step.id_flow_tmpl_step,
          step.flow_tmpl_step_orden,
          (stepIndex === 0 && idDocIn) ? 'PENDIENTE' : step.flow_tmpl_step_fase,
          idUserToUse,
          step.id_rol,
          idDocInToUse,
          step.flag_flow_fin,
          step.flag_equipo
        ]);

        stepIndex++;
      }

      // ✅ PASO 4 - Actualizar survey con id_flow
      await this.pool.query(`
        UPDATE tsrv_survey
        SET id_flow = $1
        WHERE id_survey = $2;
      `, [idFlow, idSurvey]);

      return { success: true, idFlow };

    } catch (error) {
      console.error('❌ Error en instanciarFlujo:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = Flujo;