const pool = require("../config/postgresPool");
const MessageModel = require("./messageModel");
const notfqueueModel = require("./notfqueueModel");
const messageModel = new MessageModel();
const notfModel = new notfqueueModel();
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

class SignatureModel {
  constructor() {
    this.pool = pool;
    this.pool.on("error", (err) => console.error('❌ Error en el pool de Postgres:', err));
  }

  async insertarFirma({
    id_flow_stp,
    id_flow,
    id_user,
    id_doc,
    hash_pdf,
    codigo_validacion,
    observaciones,
    aprueba_rechaza,
    id_motivo_rechazo,
    ip_firma,
    user_agent,
    geo_latitude,
    geo_longitude,
    metodo_autenticacion
  }) {
    console.log('🔵 [SignatureModel] Iniciando insertarFirma');
    console.log('📥 Datos recibidos para insertar:', {
      id_flow_stp,
      id_flow,
      id_user,
      id_doc,
      hash_pdf,
      codigo_validacion,
      observaciones,
      aprueba_rechaza,
      id_motivo_rechazo,
      ip_firma,
      user_agent,
      geo_latitude,
      geo_longitude,
      metodo_autenticacion
    });

    const query = `
      INSERT INTO tfes_signatures (
        id_flow_stp,
        id_flow,
        id_user,
        id_doc,
        hash_pdf,
        codigo_validacion,
        observaciones,
        aprueba_rechaza,
        id_motivo_rechazo,
        ip_firma,
        user_agent,
        geo_latitude,
        geo_longitude,
        metodo_autenticacion
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
      )
      RETURNING id_fes
    `;

    const values = [
      id_flow_stp,
      id_flow,
      id_user,
      id_doc,
      hash_pdf,
      codigo_validacion,
      observaciones,
      aprueba_rechaza,
      id_motivo_rechazo,
      ip_firma,
      user_agent,
      geo_latitude,
      geo_longitude,
      metodo_autenticacion
    ];

    console.log('⚙️ Query preparada para ejecución:\n', query);
    console.log('⚙️ Valores:', values);

    try {
      const result = await this.pool.query(query, values);
      console.log('✅ Inserción exitosa. Resultado:', result.rows[0]);
      return result.rows[0];
    } catch (err) {
      console.error('❌ Error al ejecutar INSERT en tfes_signatures:', err);
      throw err;
    }
  }

  async verificarPassFes ({ id_user, pass_fes }) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      if (!pass_fes || !pass_fes.trim()) {
        throw new Error('Falta la clave FES (pass_fes).');
      }

      const { rows } = await client.query(
        'SELECT pass_hash_fes FROM tsec_users WHERE id_user = $1 LIMIT 1',
        [id_user]
      );

      if (!rows.length || !rows[0].pass_hash_fes) {
        throw new Error('El usuario no tiene clave FES registrada.');
      }

      if (pass_fes != rows[0].pass_hash_fes) {
        throw new Error('Clave FES incorrecta.');
      }

      return true;
    } catch (err) {
      console.error('❌ insertarFirma2 error:', err);
      throw err;
    } finally {
      client.release();
    }
  }

  // =========================================================
  // insertarFirma2: ahora con tsa_token
  // =========================================================
  async insertarFirma2({
    id_flow_stp,
    id_flow,
    id_user,
    id_doc,
    hash_pdf,
    codigo_validacion,
    observaciones,
    aprueba_rechaza,
    id_motivo_rechazo,
    ip_firma,
    user_agent,
    geo_latitude,
    geo_longitude,
    metodo_autenticacion,
    pass_fes,
    tsa_token = null // 👈 NUEVO
  }) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      console.log('🔵 [SignatureModel] Iniciando insertarFirma2');
      console.log('📥 Datos recibidos:', {
        id_flow_stp, id_flow, id_user, id_doc, hash_pdf, codigo_validacion,
        observaciones, aprueba_rechaza, id_motivo_rechazo, ip_firma, user_agent,
        geo_latitude, geo_longitude, metodo_autenticacion,
        tiene_tsa: !!tsa_token
      });
      let id_fes_inserted = null;

      if (id_flow_stp) {
        // --- Con flujo de aprobación ---
        // 1) Paso actual (bloqueado) para evitar doble firma por concurrencia/reintento
        const stepRes = await client.query(
          `SELECT id_flow, id_user, id_fes, estado, flow_tmpl_step_orden, flag_flow_fin, flag_equipo
             FROM tflw_flow_steps
            WHERE id_flow_stp = $1
            FOR UPDATE`, [id_flow_stp]
        );
        if (stepRes.rows.length === 0) {
          throw new Error('No se encontró el paso de flujo con el id_flow_stp proporcionado');
        }
        const {
          id_flow: id_flow_from_db,
          id_user: id_user_step,
          id_fes: id_fes_existente,
          estado: estado_step,
          flow_tmpl_step_orden,
          flag_flow_fin,
          flag_equipo
        } = stepRes.rows[0];

        if (!flag_equipo && id_user_step != null) {
          const stepNum = Number(id_user_step);
          const reqNum = Number(id_user);
          const bothNumeric = Number.isFinite(stepNum) && Number.isFinite(reqNum);
          const sameUser = bothNumeric
            ? stepNum === reqNum
            : String(id_user_step).trim().toUpperCase() === String(id_user).trim().toUpperCase();

          if (!sameUser && !is_autonomo) {
            throw new Error(
              `El usuario que firma no coincide con el usuario asignado al paso de flujo. (paso=${id_user_step}, request=${id_user})`
            );
          }
        }

        if (id_fes_existente) {
          console.log('ℹ️ Firma ya registrada en este paso. Se evita doble inserción.', {
            id_flow_stp,
            id_fes_existente
          });
          await client.query('COMMIT');
          return { id_fes: id_fes_existente, deduplicated: true };
        }

        if (estado_step === 'APROBADO' && aprueba_rechaza === 'APRUEBA') {
          throw new Error('El paso de flujo ya fue aprobado anteriormente.');
        }

        // 2) Insertar firma (agregando tsa_token)
        const insertQuery = `
          INSERT INTO tfes_signatures (
            id_flow_stp, id_flow, id_user, id_doc, hash_pdf, codigo_validacion,
            observaciones, aprueba_rechaza, id_motivo_rechazo, ip_firma, user_agent,
            geo_latitude, geo_longitude, metodo_autenticacion, tsa_token
          ) VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15
          ) RETURNING id_fes
        `;
        const insertValues = [
          id_flow_stp, id_flow, id_user, id_doc, hash_pdf, codigo_validacion,
          observaciones, aprueba_rechaza, id_motivo_rechazo, ip_firma, user_agent,
          geo_latitude, geo_longitude, metodo_autenticacion, tsa_token
        ];
        const insertResult = await client.query(insertQuery, insertValues);
        const { id_fes } = insertResult.rows[0];
        id_fes_inserted = id_fes;

        let estado = 'RECHAZADO';
        if (aprueba_rechaza === 'CON_OBSERVACIONES' || aprueba_rechaza === 'CON OBSERVACIONES') {
          estado = 'CON_OBSERVACIONES';
        } else if (aprueba_rechaza === 'APRUEBA') {
          estado = 'APROBADO';
        }
        console.log('➡️ Paso actual:', { id_flow_from_db, flow_tmpl_step_orden, flag_flow_fin, flag_equipo, estado });

        if (flag_equipo) {
          await client.query(`
            UPDATE tflw_fes_colectiva SET
              estado_fes = true,
              fecha_fes = now()
            WHERE id_flow = $1
              AND id_flow_step = $2
              AND id_usuario = $3
          `, [id_flow_from_db, id_flow_stp, id_user]);
          await client.query(`
            UPDATE tflw_flow_steps SET
              id_fes = $1,
              flow_step_obs = $2,
              id_doc_in = $3
            WHERE id_flow_stp = $4
          `, [id_fes, observaciones, id_doc, id_flow_stp]);
        } else {
          console.log('➡️➡️➡️ Usuario individual, no es equipo', id_doc);
          await client.query(`
            UPDATE tflw_flow_steps SET
              estado = $1,
              id_motivo_rechazo = $2,
              id_fes = $3,
              flow_step_obs = $4,
              id_doc_out = $6,
              id_user = COALESCE(id_user, $7)
            WHERE id_flow_stp = $5
          `, [estado, id_motivo_rechazo, id_fes, observaciones, id_flow_stp, id_doc, id_user]);

          await client.query(`
            UPDATE tflw_flows
              SET fecha_inicio = COALESCE(fecha_inicio, now()),
                  fecha_cierre = now()
             WHERE id_flow = $1
          `, [id_flow_from_db]);
        }

        // ------------------------------------------------------
        // 4) Lógica de flujo + correos
        // ------------------------------------------------------
        let correos = [];
        let nombreUsuario = '';

        const prevUserRes = await client.query(`
          SELECT COALESCE(u.name_frst || ' ' || u.name_sec || ' ' || u.apellido_pat, '') AS nom
            FROM tsec_users u
           WHERE u.id_user = $1
        `, [id_user]);
        nombreUsuario = prevUserRes.rows?.[0]?.nom || '';

        let id_user_dest_aprob = 0;

        if ((estado === 'APROBADO' || estado === 'CON_OBSERVACIONES') && flag_flow_fin !== true) {
          let ordenDestino = flow_tmpl_step_orden + 1;
          let flujoFinalizado = false;

          // Si es Paso 1 de Inspecciones SST (templates 70/80), verificar si requiere Paso 2 (derivación a superior)
          if (flow_tmpl_step_orden === 1) {
            let superiorId = null;
            try {
              const surveyRes = await client.query(
                'SELECT id_survey, body_exec, id_template FROM tsrv_survey WHERE id_flow = $1 LIMIT 1',
                [id_flow_from_db]
              );
              if (surveyRes.rows.length > 0) {
                const s = surveyRes.rows[0];
                const idTemplate = Number(s.id_template);
                if ([70, 80].includes(idTemplate)) {
                  const bodyExec = typeof s.body_exec === 'string' ? JSON.parse(s.body_exec) : (s.body_exec || {});
                  const segmentos = Array.isArray(bodyExec.segmentos) ? bodyExec.segmentos : [];
                  
                  for (const seg of segmentos) {
                    const attrs = Array.isArray(seg.attributes) ? seg.attributes : [];
                    for (const a of attrs) {
                      if (a.type === 'checkListObservacionConductual') {
                        superiorId = a.datos?.superiorDerivado;
                      } else if (a.type === 'condicionesSeguridadTrabajo') {
                        superiorId = a.superiorDerivado;
                      }
                      if (superiorId) break;
                    }
                    if (superiorId) break;
                  }

                  // Si no hay superior derivado (Cierre In Situ o sin desviaciones)
                  if (!superiorId) {
                    console.log(`⚡ [SignatureModel] Flujo de Cierre Autónomo o sin desviaciones para survey ${s.id_survey}. Finalizando flujo en Paso 1.`);
                    flujoFinalizado = true;
                  }
                }
              }
            } catch (errSup) {
              console.error('❌ Error al verificar derivación de superior en Paso 1:', errSup);
            }
          }

          console.log('➡️ Próximo orden destino:', ordenDestino);

          while (true) {
            if (flujoFinalizado) {
              break;
            }
            const destRes = await client.query(`
              SELECT id_flow_stp, id_user, flag_equipo, flag_flow_fin
                FROM tflw_flow_steps
               WHERE id_flow = $1
                 AND flow_tmpl_step_orden = $2
               LIMIT 1
            `, [id_flow_from_db, ordenDestino]);

            if (!destRes.rows.length) {
              flujoFinalizado = true;
              break;
            }

            console.log('➡️ Usuario destino encontrado:', destRes.rows[0]);
            id_user_dest_aprob = destRes.rows[0].id_user;

            // Asignación física del superior derivado al Paso 2 si id_user es nulo en base de datos
            if (Number(ordenDestino) === 2 && !id_user_dest_aprob) {
              try {
                // Buscamos el id_survey correspondiente al id_flow
                const surveyRes = await client.query(
                  'SELECT id_survey, body_exec FROM tsrv_survey WHERE id_flow = $1 LIMIT 1',
                  [id_flow_from_db]
                );
                if (surveyRes.rows.length > 0) {
                  const s = surveyRes.rows[0];
                  const bodyExec = typeof s.body_exec === 'string' ? JSON.parse(s.body_exec) : (s.body_exec || {});
                  const segmentos = Array.isArray(bodyExec.segmentos) ? bodyExec.segmentos : [];
                  
                  let superiorId = null;
                  for (const seg of segmentos) {
                    const attrs = Array.isArray(seg.attributes) ? seg.attributes : [];
                    for (const a of attrs) {
                      if (a.type === 'checkListObservacionConductual') {
                        superiorId = a.datos?.superiorDerivado;
                      } else if (a.type === 'condicionesSeguridadTrabajo') {
                        superiorId = a.superiorDerivado;
                      }
                      if (superiorId) break;
                    }
                    if (superiorId) break;
                  }
                  
                  if (superiorId) {
                    console.log(`⚡ [SignatureModel] Asignando superior derivado ${superiorId} al Paso 2 en tflw_flow_steps.`);
                    await client.query(
                      'UPDATE tflw_flow_steps SET id_user = $1 WHERE id_flow_stp = $2',
                      [superiorId, destRes.rows[0].id_flow_stp]
                    );
                    id_user_dest_aprob = superiorId;
                  }
                }
              } catch (errSup) {
                console.error('❌ Error al mapear superior derivado al Paso 2:', errSup);
              }
            }

            const flag_equipo_dest = destRes.rows[0].flag_equipo;
            const flag_flow_fin_dest = destRes.rows[0].flag_flow_fin === true;
            const mismoUsuarioConsecutivo =
              !flag_equipo_dest &&
              id_user_dest_aprob &&
              Number(id_user_dest_aprob) === Number(id_user);

            if (mismoUsuarioConsecutivo) {
              await client.query(`
                UPDATE tflw_flow_steps
                   SET estado = 'APROBADO',
                       id_motivo_rechazo = NULL,
                       flow_step_obs = COALESCE(flow_step_obs, 'Autoaprobado por continuidad de rol (mismo usuario).'),
                       id_doc_in = COALESCE(id_doc_in, $2),
                       id_doc_out = $2
                 WHERE id_flow_stp = $1
              `, [destRes.rows[0].id_flow_stp, id_doc]);

              if (flag_flow_fin_dest) {
                flujoFinalizado = true;
                break;
              }

              ordenDestino += 1;
              continue;
            }

            if (flag_equipo_dest) {
              const corrRes = await client.query(`
                SELECT DISTINCT us.email,
                  COALESCE(us.name_frst || ' ' || us.name_sec || ' ' || us.apellido_pat, 'SIN USUARIO') AS nombre_user
                FROM tsec_users us,
                     tpry_equipo_miembro m
               WHERE us.id_user = m.id_user
                 AND m.id_equipo_proyecto = $1
              `, [id_user_dest_aprob]);
              correos = corrRes.rows;
            } else {
              const corrRes = await client.query(`
                SELECT DISTINCT us.email,
                       COALESCE(us.name_frst || ' ' || us.name_sec || ' ' || us.apellido_pat, 'SIN USUARIO') AS nombre_user
                  FROM tsec_users us
                 WHERE us.id_user = $1
              `, [id_user_dest_aprob]);
              correos = corrRes.rows;
            }
            console.log('➡️ Correos próximos destinatarios:', correos);

            await client.query(`
              UPDATE tflw_flow_steps
                 SET estado = 'PENDIENTE',
                     id_doc_in = $3
               WHERE id_flow = $1
                 AND flow_tmpl_step_orden = $2
                 AND estado IN ('EN ESPERA','RECHAZADO')
            `, [id_flow_from_db, ordenDestino, id_doc]);

            break;
          }

          if (flujoFinalizado) {
            await client.query(`
              UPDATE tsrv_survey SET estado_srv = 'APROBADO', fecha_verif_fin = NOW() WHERE id_flow = $1
            `, [id_flow_from_db]);
            await client.query(`
              DELETE FROM tflw_flow_steps WHERE id_flow = $1 AND flow_tmpl_step_orden > 1
            `, [id_flow_from_db]);
            console.log(`🧹 [SignatureModel] Pasos redundantes > 1 eliminados para id_flow = ${id_flow_from_db} por finalización en Paso 1.`);

            const corrRes = await client.query(`
              SELECT DISTINCT us.email,
                     COALESCE(us.name_frst || ' ' || us.name_sec || ' ' || us.apellido_pat, 'SIN USUARIO') AS nombre_user
                FROM tsec_users us
                JOIN tflw_flow_steps st ON st.id_user = us.id_user
               WHERE st.id_flow = $1
                 AND st.id_user IS NOT NULL
            `, [id_flow_from_db]);
            correos = corrRes.rows;

            const ownerRes = await client.query(`
              SELECT DISTINCT us.email,
                    COALESCE(us.name_frst || ' ' || us.name_sec || ' ' || us.apellido_pat, 'SIN USUARIO') AS nombre_user
                FROM tsrv_survey ts
                JOIN tsec_users us ON ts.id_user = us.id_user
               WHERE ts.id_flow = $1
                 AND us.id_user IS NOT NULL
            `, [id_flow_from_db]);
            correos.push(...ownerRes.rows);
          }

        } else if ((estado === 'APROBADO' || estado === 'CON_OBSERVACIONES') && flag_flow_fin === true) {
          await client.query(`
            UPDATE tsrv_survey SET estado_srv = 'APROBADO', fecha_verif_fin = NOW() WHERE id_flow = $1
          `, [id_flow_from_db]);

          const corrRes = await client.query(`
            SELECT DISTINCT us.email,
                   COALESCE(us.name_frst || ' ' || us.name_sec || ' ' || us.apellido_pat, 'SIN USUARIO') AS nombre_user
              FROM tsec_users us
              JOIN tflw_flow_steps st ON st.id_user = us.id_user
             WHERE st.id_flow = $1
               AND st.id_user IS NOT NULL
          `, [id_flow_from_db]);
          correos = corrRes.rows;

          const ownerRes = await client.query(`
            SELECT DISTINCT us.email,
                  COALESCE(us.name_frst || ' ' || us.name_sec || ' ' || us.apellido_pat, 'SIN USUARIO') AS nombre_user
              FROM tsrv_survey ts
              JOIN tsec_users us ON ts.id_user = us.id_user
             WHERE ts.id_flow = $1
               AND us.id_user IS NOT NULL
          `, [id_flow_from_db]);
          correos.push(...ownerRes.rows);

        } else if (estado === 'RECHAZADO') {
          await client.query(`
            UPDATE tsrv_survey SET estado_srv = 'Ejecución' WHERE id_flow = $1
          `, [id_flow_from_db]);

          await client.query(`
            UPDATE tflw_flow_steps
               SET estado = 'EN ESPERA'
             WHERE id_flow = $1
               AND id_flow_stp <> $2
          `, [id_flow_from_db, id_flow_stp]);

          const corrRes = await client.query(`
            SELECT DISTINCT us.email,
                   COALESCE(us.name_frst || ' ' || us.name_sec || ' ' || us.apellido_pat, 'SIN USUARIO') AS nombre_user
              FROM tsec_users us
              JOIN tflw_flow_steps st ON st.id_user = us.id_user
             WHERE st.id_flow = $1
               AND st.id_user IS NOT NULL
          `, [id_flow_from_db]);
          correos = corrRes.rows;
          
          const ownerRes = await client.query(`
            SELECT DISTINCT us.email,
                   COALESCE(us.name_frst || ' ' || us.name_sec || ' ' || us.apellido_pat, 'SIN USUARIO') AS nombre_user
              FROM tsrv_survey ts
              JOIN tsec_users us ON ts.id_user = us.id_user
             WHERE ts.id_flow = $1
               AND us.id_user IS NOT NULL
          `, [id_flow_from_db]);
          correos.push(...ownerRes.rows);
        }

        const protoRes = await client.query(`
          SELECT 
            ts.id_survey AS id_protocolo,
            ec.name_empresa AS cliente,
            pr.nombre_proyecto AS proyecto,
            tt.name_tipo_srv AS familia,
            ar.name_area AS area,
            te.name_template_srv AS protocolo,
            ts.id_user AS id_user_owner,
            ts.id_flow AS id_flow
          FROM tsrv_survey ts,
               tpar_empresas ec,
               tpry_proyecto pr,
               tsrv_templates te,
               tsrv_tipo_template tt,
               tpar_area ar 
          WHERE ts.id_empresa_cliente = ec.id_empresa
            AND ts.id_proyecto = pr.id_proyecto
            AND ts.id_template = te.id_template
            AND te.id_tipo_srv = tt.id_tipo_srv
            AND tt.id_area = ar.id_area
            AND ts.id_flow = $1
          LIMIT 1
        `, [id_flow_from_db]);
        const datosProtocolo = protoRes.rows?.[0];

        let motivoTexto = 'No especificado';
        if (id_motivo_rechazo) {
          const motRes = await client.query(`
            SELECT motivo_rechazo
              FROM tflw_motivo_rechazo
             WHERE id_motivo_rechazo = $1
          `, [id_motivo_rechazo]);
          motivoTexto = motRes.rows?.[0]?.motivo_rechazo || 'No especificado';
        }

        const seen = new Set();
        correos = (correos || [])
          .filter(c => c && c.email)
          .filter(c => {
            if (seen.has(c.email)) return false;
            seen.add(c.email);
            return true;
          });

        let mensajeEstado = '';

        if (estado === 'RECHAZADO') {
          mensajeEstado = 'El siguiente protocolo fue RECHAZADO. Por favor accede a la plataforma para verificar el motivo y realizar las correcciones necesarias:';
          await notfModel.insertNotfqueue({
            id_user_target: datosProtocolo?.id_user_owner,
            id_template: null,
            json_data: { 'id_survey': datosProtocolo?.id_protocolo, 'id_flow': datosProtocolo?.id_flow, 'id_area': 1, 'tipo_notf': 'asignacion_protocolo', 'obs_notf': 'reasignacion por rechazo' },
            channels: {'channel': 'WEB'},
            estado: 'PENDING' 
          });
        } else if ((estado === 'APROBADO' || estado === 'CON_OBSERVACIONES') && flag_flow_fin === true) {
          mensajeEstado = 'El siguiente protocolo ha sido APROBADO y el flujo ha finalizado correctamente. Ya no se requieren más acciones.';
        } else if (estado === 'APROBADO') {
          mensajeEstado = 'El siguiente protocolo está a la espera de tu revisión. Por favor accede a la plataforma para continuar con el flujo:';
          await notfModel.insertNotfqueue({
            id_user_target: id_user_dest_aprob,
            id_template: null,
            json_data: { 'id_survey': datosProtocolo?.id_protocolo, 'id_flow': datosProtocolo?.id_flow, 'id_area': 6, 'tipo_notf': 'asignacion_firma', 'obs_notf': 'avance en el flujo' },
            channels: {'channel': 'WEB'},
            estado: 'PENDING' 
          });
        }

        let asuntoFinal = `Flujo de Aprobación/Verificación de Protocolos: Id: ${datosProtocolo?.id_protocolo ?? '-'} - Grúas San Pablo - ${datosProtocolo?.protocolo ?? '-'}`;
        let cuerpoMensaje = '';

        if (datosProtocolo?.id_template === 500) {
          asuntoFinal = "Enrolamiento Completado Exitosamente - GSP Operaciones";
          const contenidoEnrol = `
            <p style="margin: 0; color: #94a3b8; font-size: 14px; line-height: 1.6;">
              Te informamos que has completado correctamente tu proceso de enrolamiento en la <strong>Plataforma de Gestión de Operaciones de Grúas San Pablo</strong>.
            </p>
            <p style="margin: 15px 0 0 0; color: #94a3b8; font-size: 14px; line-height: 1.6;">
              A partir de ahora, estás habilitado/a para firmar de manera electrónica simple (FES) todos tus documentos laborales y de seguridad, utilizando tu clave personal FES de 4 dígitos.
            </p>
            <p style="margin: 15px 0 0 0; color: #94a3b8; font-size: 14px; line-height: 1.6;">
              Puedes ingresar a la plataforma en cualquier momento desde el siguiente enlace:
            </p>
          `;
          cuerpoMensaje = messageModel.obtenerPlantillaHTML({
            titulo: `¡Enrolamiento Exitoso, ${nombreUsuario}!`,
            subtitulo: 'Tu proceso de enrolamiento y registro de firma ha sido completado.',
            contenido: contenidoEnrol,
            botonTexto: 'Acceder a la Plataforma',
            botonUrl: 'https://servidor.leanglobal.cl/lg-gsp-dev/'
          });
        } else {
          const contenidoHTML = `
            <div class="content-item"><span class="label">Id Protocolo:</span><span class="value">${datosProtocolo?.id_protocolo ?? '-'}</span></div>
            <div class="content-item"><span class="label">Cliente:</span><span class="value">Grúas San Pablo</span></div>
            <div class="content-item"><span class="label">Proyecto:</span><span class="value">${datosProtocolo?.proyecto ?? '-'}</span></div>
            <div class="content-item"><span class="label">Familia:</span><span class="value">${datosProtocolo?.familia ?? '-'}</span></div>
            <div class="content-item"><span class="label">Área:</span><span class="value">${datosProtocolo?.area ?? '-'}</span></div>
            <div class="content-item"><span class="label">Protocolo:</span><span class="value">${datosProtocolo?.protocolo ?? '-'}</span></div>
            <div class="content-item"><span class="label">Estado:</span><span class="value" style="font-weight: bold; color: ${estado === 'RECHAZADO' ? '#ef4444' : '#10b981' }">${estado}</span></div>
            ${estado === 'RECHAZADO' ? `<div class="content-item"><span class="label">Motivo Rechazo:</span><span class="value" style="color: #ef4444">${motivoTexto}</span></div>` : '' }
            <div class="content-item"><span class="label">Usuario Anterior:</span><span class="value">${nombreUsuario}</span></div>
          `;
          cuerpoMensaje = messageModel.obtenerPlantillaHTML({
            titulo: `¡Actualización de Protocolo!`,
            subtitulo: mensajeEstado,
            contenido: contenidoHTML,
            botonTexto: 'Acceder a la Plataforma',
            botonUrl: 'https://servidor.leanglobal.cl/lg-transmac-dev/'
          });
        }

        if (correos.length) {
          for (const c of correos) {
            try {
              await messageModel.enviarYRegistrarCorreo({
                para: c.email,
                asunto: asuntoFinal,
                cuerpo: cuerpoMensaje,
                esHtml: true
              });
              console.log(`📧 Correo enviado a ${c.email}`);
            } catch (mailError) {
              console.error(`❌ Error al enviar correo a ${c.email}: ${mailError.message}`);
            }
          }
        } else {
          console.log('ℹ️ No hay destinatarios para notificar.');
        }

        await client.query('COMMIT');
        return { id_fes };
      } else {
        // --- Sin flujo de aprobación (Firma directa de PDF independiente) ---
        const insertQuery = `
          INSERT INTO tfes_signatures (
            id_flow_stp, id_flow, id_user, id_doc, hash_pdf, codigo_validacion,
            observaciones, aprueba_rechaza, id_motivo_rechazo, ip_firma, user_agent,
            geo_latitude, geo_longitude, metodo_autenticacion, tsa_token
          ) VALUES (
            null, null, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
          ) RETURNING id_fes
        `;
        const insertValues = [
          id_user, id_doc, hash_pdf, codigo_validacion,
          observaciones, aprueba_rechaza, id_motivo_rechazo, ip_firma, user_agent,
          geo_latitude, geo_longitude, metodo_autenticacion, tsa_token
        ];
        const insertResult = await client.query(insertQuery, insertValues);
        id_fes_inserted = insertResult.rows[0].id_fes;
      }

      await client.query('COMMIT');
      return { id_fes: id_fes_inserted };
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('❌ insertarFirma2 error:', err);
      throw err;
    } finally {
      client.release();
    }
  }

  verifyPassFes(plain, stored) {
    if (!stored) return false;

    if (stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')) {
      if (!bcrypt) return false;
      return bcrypt.compareSync(plain, stored);
    }

    const [salt, hashHex] = String(stored).split(':');
    if (!salt || !hashHex) return false;

    const derivedHex = crypto
      .pbkdf2Sync(plain, salt, 100000, 64, 'sha512')
      toString('hex');

    const a = Buffer.from(derivedHex, 'hex');
    const b = Buffer.from(hashHex, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  }

  async actualizarApprovalExec({
    id_survey,
    nuevaFirma
  }) {
    console.log('🔵 [SignatureModel] Iniciando actualizarApprovalExec');
    console.log('📥 Datos recibidos para actualizar approval_exec:', { id_survey, nuevaFirma });

    const querySelect = `
      SELECT approval_exec FROM tsrv_survey WHERE id_survey = $1
    `;
    const resultSelect = await this.pool.query(querySelect, [id_survey]);

    let approval_exec = resultSelect.rows[0]?.approval_exec || [];

    if (!Array.isArray(approval_exec)) {
      approval_exec = [];
    }

    approval_exec.push(nuevaFirma);

    const queryUpdate = `
      UPDATE tsrv_survey
         SET approval_exec = $1
       WHERE id_survey = $2
       RETURNING *;
    `;
    
    const values = [JSON.stringify(approval_exec), id_survey];
    try {
      const resultUpdate = await this.pool.query(queryUpdate, values);
      console.log('✅ approval_exec actualizado con la nueva firma:', resultUpdate.rows[0]);
      return resultUpdate.rows[0];
    } catch (err) {
      console.error("❌ Error al actualizar approval_exec:", err);
      throw err;
    }
  }

  /**
   * Obtiene tsa_token y ruta del PDF a partir de id_fes
   */
  async obtenerTsaYPdfPorFes(id_fes) {
    const query = `
      SELECT 
        s.tsa_token,
        a.path_doc,
        a.name_doc_interno,
        CASE
          WHEN right(a.path_doc, 1) IN ('/', '\\')
            THEN a.path_doc || a.name_doc_interno
          ELSE a.path_doc || '/' || a.name_doc_interno
        END AS full_path
      FROM tfes_signatures s
      JOIN tfmg_file a ON a.id_doc = s.id_doc
      WHERE s.id_fes = $1
      LIMIT 1
    `;
    const values = [id_fes];

    try {
      const { rows } = await this.pool.query(query, values);
      if (!rows.length) return null;
      return rows[0]; // { tsa_token, path_doc, name_doc_interno, full_path }
    } catch (err) {
      console.error('❌ Error en obtenerTsaYPdfPorFes:', err);
      throw err;
    }
  }

  /**
   * Busca una firma por código de verificación (el que va en el PDF).
   * Acepta el código corto del PDF (sin guiones, 10 chars) o el UUID completo.
   */
  async obtenerFirmaPorCodigo(codigo) {
    // Ej: desde el PDF viene "AB12CD34EF"
    const clean = String(codigo || '')
      .replace(/[^A-Za-z0-9]/g, '')  // quita espacios, guiones, etc.
      .toUpperCase();

    if (!clean) return null;

    const query = `
      SELECT
        id_fes,
        id_flow,
        id_doc,
        id_user,
        codigo_validacion
      FROM tfes_signatures
      WHERE UPPER(
              SUBSTRING(
                REPLACE(codigo_validacion::text, '-', '' )  -- 👈 casteo a text
                FROM 1 FOR 10
              )
            ) = $1
      ORDER BY id_fes DESC
      LIMIT 1
    `;

    try {
      const { rows } = await this.pool.query(query, [clean]);
      return rows[0] || null;
    } catch (err) {
      console.error('❌ Error en obtenerFirmaPorCodigo:', err);
      throw err;
    }
  }

  /**
   * Devuelve info resumen del protocolo a partir del id_flow.
   * (Mismo SELECT que usas en insertarFirma2, pero reutilizable.)
   */
  async obtenerResumenProtocoloPorFlow(id_flow) {
    const query = `
      SELECT 
        ts.id_survey AS id_protocolo,
        ec.name_empresa   AS cliente,
        pr.nombre_proyecto AS proyecto,
        tt.name_tipo_srv  AS familia,
        ar.name_area      AS area,
        te.name_template_srv AS protocolo,
        ts.id_user        AS id_user_owner
      FROM tsrv_survey ts
      JOIN tpar_empresas   ec ON ts.id_empresa_cliente = ec.id_empresa
      JOIN tpry_proyecto   pr ON ts.id_proyecto        = pr.id_proyecto
      JOIN tsrv_templates  te ON ts.id_template        = te.id_template
      JOIN tsrv_tipo_template tt ON te.id_tipo_srv     = tt.id_tipo_srv
      JOIN tpar_area       ar ON tt.id_area            = ar.id_area
      WHERE ts.id_flow = $1
      LIMIT 1
    `;

    try {
      const { rows } = await this.pool.query(query, [id_flow]);
      return rows[0] || null;
    } catch (err) {
      console.error('❌ Error en obtenerResumenProtocoloPorFlow:', err);
      throw err;
    }
  }

  // Dejo tu insertarFirma2bak igual (sin TSA) por compatibilidad
  async insertarFirma2bak(params) {
    // ... tu versión anterior, la puedes dejar como está si no se usa ...
  }


  async actualizarFirmaYDocPostFirma({ id_flow_stp, id_fes, id_doc, hash_pdf, tsa_token }) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // 1) Actualizar paso actual
      await client.query(
        `UPDATE sch_leangsp.tflw_flow_steps SET id_doc_out = $1, id_fes = $2 WHERE id_flow_stp = $3`,
        [id_doc, id_fes, id_flow_stp]
      );

      // 2) Obtener id_flow y orden del paso actual
      const stepRes = await client.query(
        `SELECT id_flow, flow_tmpl_step_orden FROM sch_leangsp.tflw_flow_steps WHERE id_flow_stp = $1`,
        [id_flow_stp]
      );
      if (stepRes.rows.length > 0) {
        const { id_flow, flow_tmpl_step_orden } = stepRes.rows[0];
        const ordenDestino = Number(flow_tmpl_step_orden) + 1;
        
        // 3) Propagar el id_doc generado al id_doc_in del paso siguiente
        await client.query(
          `UPDATE sch_leangsp.tflw_flow_steps 
              SET id_doc_in = $1 
            WHERE id_flow = $2 
              AND flow_tmpl_step_orden = $3`,
          [id_doc, id_flow, ordenDestino]
        );
        console.log(`✅ [actualizarFirmaYDocPostFirma] Propagado id_doc_in = ${id_doc} al paso siguiente (orden ${ordenDestino}) para id_flow ${id_flow}`);
      }

      // 4) Actualizar firma
      await client.query(
        `UPDATE sch_leangsp.tfes_signatures SET hash_pdf = $1, id_doc = $2, tsa_token = $3 WHERE id_fes = $4`,
        [hash_pdf, id_doc, tsa_token, id_fes]
      );

      await client.query('COMMIT');
      return { success: true };
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error al actualizar firma post firma:', err);
      throw err;
    } finally {
      client.release();
    }
  }

}

module.exports = SignatureModel;