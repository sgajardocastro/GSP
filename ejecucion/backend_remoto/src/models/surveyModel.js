const pool = require("../config/postgresPool");
const MessageModel = require("./messageModel"); // ajusta el path si está en otro lugar
const flujoModel = require('../models/flujoModel');
const messageModel = new MessageModel();

const flujoM = new flujoModel();

class surveyModel {

  constructor(){
    this.pool = pool;
    this.pool.on('error', (err) => console.error(err));
  }

  async postSurvey(data) {
    let {
      id_tipo_srv,
      id_template,
      id_user,
      id_user_creacion,
      id_empresa_cliente,
      estado_srv,
      header_seed,
      body_seed,
      approval_seed,
      header_exec,
      body_exec,
      approval_exec,
      fecha_plan_ini,
      fecha_plan_fin,
      fecha_real_ini,
      fecha_real_fin,
      fecha_upload,
      latitud,
      longitud,
      id_proyecto,
      id_flow_tmpl,
      id_personalizado,
      id_survey_padre
    } = data;

    const query = `
      INSERT INTO tsrv_survey (
        id_tipo_srv,
        id_template,
        id_user,
        id_user_creacion,
        id_empresa_cliente,
        estado_srv,
        header_seed,
        body_seed,
        approval_seed,
        header_exec,
        body_exec,
        approval_exec,
        fecha_plan_ini,
        fecha_plan_fin,
        fecha_real_ini,
        fecha_real_fin,
        fecha_upload,
        latitud,
        longitud,
        id_proyecto,
        id_flow_tmpl,
        id_personalizado,
        id_survey_padre
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22, $23
      )
      RETURNING id_survey;
    `;

    const values = [
      id_tipo_srv,
      id_template,
      id_user,
      id_user_creacion,
      id_empresa_cliente,
      estado_srv,
      header_seed,
      body_seed,
      approval_seed,
      header_exec,
      body_exec,
      approval_exec,
      fecha_plan_ini,
      fecha_plan_fin,
      fecha_real_ini,
      fecha_real_fin,
      fecha_upload,
      latitud,
      longitud,
      id_proyecto,
      id_flow_tmpl,
      id_personalizado,
      id_survey_padre
    ];

    // Si no viene id_flow_tmpl del front, se hereda del template (ej. Template 80)
    if (!id_flow_tmpl && id_template) {
      const tmplRes = await this.pool.query('SELECT id_flow_tmpl FROM tsrv_templates WHERE id_template = $1', [id_template]);
      if (tmplRes.rowCount > 0 && tmplRes.rows[0].id_flow_tmpl) {
        id_flow_tmpl = tmplRes.rows[0].id_flow_tmpl;
        values[20] = id_flow_tmpl; // Actualiza el array de values antes de insertar
      }
    }

    const result = await this.pool.query(query, values);
    
    // 3. Instanciar flujo de aprobación
    if (id_flow_tmpl) {
      console.log('Va a iniciar flujoModel');
      const resultFlujo = await flujoM.instanciarFlujo({ idSurvey: result.rows[0].id_survey,  idDocIn: null }); 

      if (!resultFlujo.success) {
        throw new Error(resultFlujo.error);
      }
    }

    return result.rows[0].id_survey;
  }

  async updateSurveyFields(id_survey, data) {
    const { estado_srv, body_exec, fecha_real_ini, latitud, longitud } = data;

    console.log('updateSurveyFields:======================================>', data);

    const query = `
      UPDATE tsrv_survey
      SET 
        estado_srv = $1,
        body_exec = $2,
        fecha_real_ini = $3,
        latitud = $4,
        longitud = $5
      WHERE id_survey = $6
      RETURNING *;
    `;

    const values = [estado_srv, body_exec, fecha_real_ini, latitud, longitud, id_survey];

    try {
      const result = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error al actualizar survey: ${error.message}`);
    }
  }

  async updateSurveyFieldsFechaEjecFin(id_survey, data) {
    const { estado_srv, body_exec, fecha_real_ini, fecha_ejec_fin, latitud, longitud } = data;

    console.log('updateSurveyFieldsFechaEjecFin:======================================>', data);

    const query = `
      UPDATE tsrv_survey
      SET 
        estado_srv = $1,
        body_exec = $2,
        fecha_real_ini = $3,
        fecha_ejec_fin = $4,
        latitud = $5,
        longitud = $6
      WHERE id_survey = $7
      RETURNING *;
    `;

    console.log('fecha_ejec_fin:======================================>', data);

    const values = [estado_srv, body_exec, fecha_real_ini, fecha_ejec_fin, latitud, longitud, id_survey];

    const surveyQuery = `
      SELECT fs.id_user
          FROM  tflw_flow_steps fs,
                tsrv_survey sv
         WHERE 
            sv.id_survey = $1
            AND sv.id_flow = fs.id_flow
            AND fs.flow_tmpl_step_orden = 1
    `;

    const resSurvey = await this.pool.query(surveyQuery, [id_survey]);
    const firstStepUser = resSurvey.rows?.[0]?.id_user ?? null;

    //await this.updateSurveyEmail(id_survey, { id_user: resSurvey.rows[0].id_user, fecha_plan_ini: null, fecha_plan_fin: null });    
    if (!firstStepUser) {
      console.log(
        `[updateSurveyFieldsFechaEjecFin] Survey ${id_survey}: sin id_user en el paso 1 del flujo, no se enviará correo.`
      );
    } else {
      try {
        await this.updateSurveyEmail(id_survey, {
          id_user: firstStepUser,
          fecha_plan_ini: null,
          fecha_plan_fin: null,
        });
      } catch (e) {
        console.error(
          `[updateSurveyFieldsFechaEjecFin] Error al ejecutar updateSurveyEmail para survey ${id_survey}:`,
          e.message
        );
        // opcional: no relanzamos si quieres que igual continúe
      }
    }

    try {
      const result = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error al actualizar survey: ${error.message}`);
    }
  }
  async updateSurveyEmail(id_survey, data) {
    const { id_user, fecha_plan_ini, fecha_plan_fin } = data;

    /*const updateQuery = `
      UPDATE tsrv_survey
      SET 
        id_user = $1
      WHERE id_survey = $2
      RETURNING *;
    `;

    const updateValues = [id_user, id_survey];*/

    try {
      // 1. Actualizar los datos del protocolo
      /*const result = await this.pool.query(updateQuery, updateValues);
      const updatedSurvey = result.rows[0];

      if (!updatedSurvey) {
        throw new Error(`No se encontró el protocolo con id ${id_survey}`);
      }*/

      // 2. Obtener los datos para el mensaje
      const { rows: [datosProtocolo] } = await this.pool.query(`
        SELECT 
          ts.id_survey AS id_protocolo,
          ts.fecha_plan_fin,
          COALESCE(ec.name_empresa, 'Sin Cliente') AS cliente,
          COALESCE(pr.nombre_proyecto, 'Sin Proyecto') AS proyecto,
          COALESCE(tt.name_tipo_srv, 'Sin Familia') AS familia,
          COALESCE(ar.name_area, 'Sin Área') AS area,
          te.name_template_srv AS protocolo
        FROM tsrv_survey ts
        LEFT JOIN tpar_empresas ec ON ts.id_empresa_cliente = ec.id_empresa
        LEFT JOIN tpry_proyecto pr ON ts.id_proyecto = pr.id_proyecto
        LEFT JOIN tsrv_templates te ON ts.id_template = te.id_template
        LEFT JOIN tsrv_tipo_template tt ON te.id_tipo_srv = tt.id_tipo_srv
        LEFT JOIN tpar_area ar ON tt.id_area = ar.id_area
        WHERE ts.id_survey = $1
        LIMIT 1
      `, [id_survey]);

      // 3. Obtener el correo del usuario asignado
      const { rows: [user] } = await this.pool.query(`
        SELECT email FROM tsec_users WHERE id_user = $1
      `, [id_user]);

      if (!user || !user.email) {
        throw new Error(`No se encontró el email del usuario asignado con id ${id_user}`);
      }

      // 4. Armar el cuerpo del mensaje

      const fechaFin = new Date(datosProtocolo.fecha_plan_fin).toLocaleDateString('es-CL');
          const contenidoHTML = `
      <div class="content-item"><span class="label">Id Protocolo:</span><span class="value">${datosProtocolo.id_protocolo}</span></div>
      <div class="content-item"><span class="label">Cliente:</span><span class="value">Grúas San Pablo</span></div>
      <div class="content-item"><span class="label">Proyecto:</span><span class="value">${datosProtocolo.proyecto}</span></div>
      <div class="content-item"><span class="label">Familia:</span><span class="value">${datosProtocolo.familia}</span></div>
      <div class="content-item"><span class="label">Área:</span><span class="value">${datosProtocolo.area}</span></div>
      <div class="content-item"><span class="label">Protocolo:</span><span class="value">${datosProtocolo.protocolo}</span></div>
      <div class="content-item"><span class="label">Fecha Límite:</span><span class="value">${fechaFin}</span></div>
    `;

    const cuerpoMensaje = messageModel.obtenerPlantillaHTML({
      titulo: '¡Nuevo Protocolo Asignado!',
      subtitulo: `El siguiente protocolo acaba de ser asignado a ti para tu gestión. Por favor considéralo en tu planificación.`,
      contenido: contenidoHTML,
      botonTexto: 'Gestionar en Plataforma',
      botonUrl: 'https://servidor.leanglobal.cl/pwa-gsp-dev/'
    });

    console.log('XXXXXXXXXXXXXXXXXXXXX para: ', user.email);

    try {
      await messageModel.enviarYRegistrarCorreo({
        para: user.email,
        asunto: `Planificación de Protocolos: Id: ${datosProtocolo.id_protocolo} - Grúas San Pablo - ${datosProtocolo.protocolo}`,
        cuerpo: cuerpoMensaje,
        esHtml: true
      });
        console.log(`📧 Correo enviado a ${user.email}`);
      } catch (mailError) {
        console.error(`❌ Error al enviar correo a ${user.email}:`, mailError.message);
      }

      return id_survey;

    } catch (error) {
      throw new Error(`updateSurveyPlanFields Error al actualizar survey: ${error.message}`);
    }
  }

async updateSurveyPlanFields(id_survey, data) {
  const { id_user, fecha_plan_ini, fecha_plan_fin } = data;

  const updateQuery = `
    UPDATE tsrv_survey
    SET 
      id_user = $1,
      fecha_plan_ini = $2,
      fecha_plan_fin = $3
    WHERE id_survey = $4
    RETURNING *;
  `;

  const updateValues = [id_user, fecha_plan_ini, fecha_plan_fin, id_survey];

  try {
    // 1. Actualizar los datos del protocolo
    const result = await this.pool.query(updateQuery, updateValues);
    const updatedSurvey = result.rows[0];

    if (!updatedSurvey) {
      throw new Error(`No se encontró el protocolo con id ${id_survey}`);
    }

    // 2. Obtener los datos para el mensaje
    const { rows: [datosProtocolo] } = await this.pool.query(`
      SELECT 
        ts.id_survey AS id_protocolo,
        COALESCE(ec.name_empresa, 'Sin Cliente') AS cliente,
        COALESCE(pr.nombre_proyecto, 'Sin Proyecto') AS proyecto,
        COALESCE(tt.name_tipo_srv, 'Sin Familia') AS familia,
        COALESCE(ar.name_area, 'Sin Área') AS area,
        te.name_template_srv AS protocolo
      FROM tsrv_survey ts
      LEFT JOIN tpar_empresas ec ON ts.id_empresa_cliente = ec.id_empresa
      LEFT JOIN tpry_proyecto pr ON ts.id_proyecto = pr.id_proyecto
      LEFT JOIN tsrv_templates te ON ts.id_template = te.id_template
      LEFT JOIN tsrv_tipo_template tt ON te.id_tipo_srv = tt.id_tipo_srv
      LEFT JOIN tpar_area ar ON tt.id_area = ar.id_area
      WHERE ts.id_survey = $1
      LIMIT 1
    `, [id_survey]);

    // 3. Obtener el correo del usuario asignado
    const { rows: [user] } = await this.pool.query(`
      SELECT email FROM tsec_users WHERE id_user = $1
    `, [id_user]);

    if (!user || !user.email) {
      throw new Error(`No se encontró el email del usuario asignado con id ${id_user}`);
    }

    // 4. Armar el cuerpo del mensaje

    const fechaFin = new Date(fecha_plan_fin).toLocaleDateString('es-CL');
        const contenidoHTML = `
      <div class="content-item"><span class="label">Id Protocolo:</span><span class="value">${datosProtocolo.id_protocolo}</span></div>
      <div class="content-item"><span class="label">Cliente:</span><span class="value">Transmac Ltda</span></div>
      <div class="content-item"><span class="label">Proyecto:</span><span class="value">${datosProtocolo.proyecto}</span></div>
      <div class="content-item"><span class="label">Familia:</span><span class="value">${datosProtocolo.familia}</span></div>
      <div class="content-item"><span class="label">Área:</span><span class="value">${datosProtocolo.area}</span></div>
      <div class="content-item"><span class="label">Protocolo:</span><span class="value">${datosProtocolo.protocolo}</span></div>
      <div class="content-item"><span class="label">Fecha Límite:</span><span class="value">${fechaFin}</span></div>
    `;

    const cuerpoMensaje = messageModel.obtenerPlantillaHTML({
      titulo: '¡Nuevo Protocolo Asignado!',
      subtitulo: `El siguiente protocolo acaba de ser asignado a ti para tu gestión. Por favor considéralo en tu planificación.`,
      contenido: contenidoHTML,
      botonTexto: 'Gestionar en Plataforma',
      botonUrl: 'https://servidor.leanglobal.cl/pwa-gsp-dev/'
    });

    console.log('XXXXXXXXXXXXXXXXXXXXX para: ', user.email);

    try {
      await messageModel.enviarYRegistrarCorreo({
        para: user.email,
        asunto: `Planificación de Protocolos: Id: ${datosProtocolo.id_protocolo} - Grúas San Pablo - ${datosProtocolo.protocolo}`,
        cuerpo: cuerpoMensaje,
        esHtml: true
      });
      console.log(`📧 Correo enviado a ${user.email}`);
    } catch (mailError) {
      console.error(`❌ Error al enviar correo a ${user.email}:`, mailError.message);
    }

    return updatedSurvey;

  } catch (error) {
    throw new Error(`updateSurveyPlanFields Error al actualizar survey: ${error.message}`);
  }
}

  async updateSurveyUserFlow(data) {
    // ✅ Sanitizar y validar
    const idFlowStp = Number(data?.id_flow_stp);
    const userFlowId = Number(data?.id_user_flujo);

    // Usuario destino
    const destRes = await this.pool.query(`
      SELECT id_flow, flag_equipo
        FROM tflw_flow_steps
      WHERE id_flow_stp = $1
      LIMIT 1
    `, [idFlowStp]);
    let updateQuery = '';

    if (destRes.rows.length) {
      const flag_equipo = destRes.rows[0].flag_equipo;
      console.log('➡️ Usuario destino encontrado:', destRes.rows[0]);

      if (flag_equipo) {
        const destResEquipo = await this.pool.query(`
          select id_user from tpry_equipo_miembro
          where id_equipo_proyecto = $1`, [userFlowId]);

          console.log('➡️ Miembros del equipo encontrados:', destResEquipo.rows);

        if( destResEquipo.rows.length ) {
          const queryDel = `delete from tflw_fes_colectiva where id_flow = $1 and id_flow_step = $2`;
          const valuesDel = [destRes.rows[0].id_flow, idFlowStp];
          const resultDel = await this.pool.query(queryDel, valuesDel);
          console.log(`Eliminadas en tflw_fes_colectiva: ${resultDel.rowCount} fila(s)`);
          for (const row of destResEquipo.rows) {
            const query = `insert into tflw_fes_colectiva (
              id_flow,
              id_flow_step,
              id_equipo_proyecto,
              id_usuario,
              estado_fes,
              fecha_fes
              )
              values ($1, $2, $3, $4, false, null)`;    
            const values = [
              destRes.rows[0].id_flow, idFlowStp, userFlowId, row.id_user
            ];
          const result = await this.pool.query(query, values);
          console.log(`Insertado en tflw_fes_colectiva: ${result.rowCount} fila(s)`);
          }
        }
      }   
      
    }

    updateQuery = `
      UPDATE tflw_flow_steps
      SET id_user = $1
      WHERE id_flow_stp = $2
      RETURNING id_flow_stp, id_user;
   `;

    try {
      const { rows: uRows, rowCount: uCount } = await this.pool.query(updateQuery, [userFlowId, idFlowStp]);
      if (uCount === 0) {
        throw new Error(`No se actualizó ningún step para el flow ${idFlowStp}.`);
      }
      return uRows[0];
    } catch (error) {
      // Deja el detalle original de PG para depurar
      throw new Error(`Error al actualizar survey: ${error.message}`);
    }
  }

  async deleteSurvey(id_survey) {
    const query = `
      DELETE FROM tsrv_survey
      WHERE id_survey = $1
      RETURNING *;
    `;
    const values = [id_survey];

    try {
      const result = await this.pool.query(query, values);
      if (result.rowCount === 0) {
        throw new Error(`No se encontró el survey con id ${id_survey}`);
      }
      return { message: 'Survey eliminado correctamente', deleted: result.rows[0] };
    } catch (error) {
      throw new Error(`Error al eliminar survey: ${error.message}`);
    }
  }

  async updateSurveyEstado(id_survey, estado) {
    const query = `
      UPDATE tsrv_survey
      SET estado_srv = $2
      WHERE id_survey = $1
      RETURNING *;
    `;
    const values = [id_survey, estado];

    try {
      const result = await this.pool.query(query, values);

      if (result.rowCount === 0) {
        throw new Error(`No se encontró el survey con id ${id_survey}`);
      }

      return {
        message: 'Estado del survey actualizado correctamente',
        survey: result.rows[0],
      };
    } catch (error) {
      throw new Error(`Error al actualizar estado de survey: ${error.message}`);
    }
  }

  async marcarSurveyVerificacionSimple(id_survey, { latitud = null, longitud = null } = {}) {
    const ahora = new Date().toISOString(); // fecha/hora en ISO

    const query = `
      UPDATE tsrv_survey
        SET estado_srv     = 'VERIFICACION',
            fecha_real_ini = COALESCE(fecha_real_ini, $2),
            fecha_ejec_fin = COALESCE(fecha_ejec_fin, $2),
            latitud        = COALESCE(latitud,  $3),
            longitud       = COALESCE(longitud, $4)
      WHERE id_survey = $1
      RETURNING *;
    `;
    const values = [id_survey, ahora, latitud, longitud];

    try {
      const { rows, rowCount } = await this.pool.query(query, values);
      if (!rowCount) {
        throw new Error(`No se encontró el survey con id ${id_survey}`);
      }
      return rows[0];
    } catch (err) {
      throw new Error(`marcarSurveyVerificacionSimple Error al actualizar survey: ${err.message}`);
    }
  }
  async getBodyExecBySurveyId(id_survey) {
    const q = `
      SELECT body_exec
        FROM tsrv_survey
      WHERE id_survey = $1
      LIMIT 1
    `;
    const { rows } = await this.pool.query(q, [id_survey]);
    return rows?.[0]?.body_exec ?? null;
  }
  async updateSurveyBodyExecOnly(id_survey, body_exec) {
    const q = `
      UPDATE tsrv_survey
        SET body_exec = $1
      WHERE id_survey = $2
      RETURNING id_survey, body_exec;
    `;
    const { rows, rowCount } = await this.pool.query(q, [body_exec, id_survey]);

    if (!rowCount) throw new Error(`No se encontró el survey con id ${id_survey}`);
    return rows[0];
  }
}

module.exports = surveyModel;