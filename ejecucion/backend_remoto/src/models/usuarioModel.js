const bcrypt = require("bcryptjs");
const pool = require("../config/postgresPool");
const MessageModel = require("./messageModel");
const messageModel = new MessageModel();
const { crearConsentimientoEnrolamiento } = require("../services/enrolamientoService");

class Usuario {
  constructor() {
    this.pool = pool;
    this.pool.on("error", (err) => console.error("Pool error:", err));
  }

  async getUsuarios() {
    try {
      const sql = "SELECT * FROM tsec_users";
      const respuesta = await this.pool.query(sql);
      return respuesta.rows;
    } catch (err) {
      console.error("Error en getUsuarios:", err);
      throw new Error("Error al obtener usuarios");
    }
  }

  async getUsuarioById(id) {
    try {
      const sql = "SELECT * FROM tsec_users WHERE id_user = $1";
      const respuesta = await this.pool.query(sql, [id]);
      return respuesta.rows[0] || null;
    } catch (err) {
      console.error("Error en getUsuarioById:", err);
      throw new Error("Error al obtener usuario");
    }
  }

  async getUserByRut(rut) {
    try {
      const sql = "SELECT * FROM tsec_users WHERE UPPER(rut) = $1";
      const respuesta = await this.pool.query(sql, [rut.toUpperCase()]);
      return respuesta.rows[0] || null;
    } catch (err) {
      console.error("Error en getUserByRut:", err);
      throw new Error("Error al obtener usuario por RUT");
    }
  }

  async postAuth(username, password, is_deleted) {
    // Para conservar compatibilidad en endpoints heredados
    return null;
  }

  async postUsuario(auth_id, empresa_id, nombre, correo, edad, altura, peso, is_deleted) {
    // Para conservar compatibilidad en endpoints heredados
    return null;
  }

  async createUsuario(username, password, is_deleted, empresa_id, nombre, correo, edad, altura, peso, callback) {
    // Para conservar compatibilidad en endpoints heredados
    callback(null, { authId: null, userId: null });
  }

  async putUsuario(id, empresa_id, nombre, correo, edad, altura, peso, is_deleted) {
    // Para conservar compatibilidad en endpoints heredados
    return id;
  }

  async iniciarEnrolamiento(rut, nombre, correo, roles, id_empresa) {
    try {
      console.log(`[Enrolamiento] Iniciando para RUT: ${rut}, Email: ${correo}`);
      const rutNorm = String(rut).trim().toUpperCase();

      // 1) Upsert manual del usuario en tsec_users
      let id_user;
      const checkRes = await this.pool.query('SELECT id_user, email FROM tsec_users WHERE UPPER(rut) = $1', [rutNorm]);
      
      if (checkRes.rows.length > 0) {
        id_user = checkRes.rows[0].id_user;
        const existingEmail = checkRes.rows[0].email;
        if (existingEmail && existingEmail.toLowerCase() !== String(correo).toLowerCase()) {
          throw new Error(`El RUT ${rutNorm} ya se encuentra registrado en el sistema con el correo ${existingEmail}. No es posible sobrescribir una cuenta existente.`);
        }
        await this.pool.query(
          'UPDATE tsec_users SET email = $1, flag_proc_enrol = true, codi_user = $1, id_empresa = $2, fecha_actualizacion = NOW() WHERE id_user = $3',
          [correo, id_empresa, id_user]
        );
      } else {
        const insRes = await this.pool.query(
          'INSERT INTO tsec_users (rut, email, flag_proc_enrol, codi_user, id_empresa, fecha_creacion, fecha_actualizacion) VALUES ($1, $2, true, $2, $3, NOW(), NOW()) RETURNING id_user',
          [rutNorm, correo, id_empresa]
        );
        id_user = insRes.rows[0].id_user;
      }

      // 2) Asignar roles (limpiar y re-insertar)
      await this.pool.query('DELETE FROM tsec_user_roles WHERE id_user = $1', [id_user]);
      if (Array.isArray(roles)) {
        for (const id_rol of roles) {
          await this.pool.query('INSERT INTO tsec_user_roles (id_user, id_rol) VALUES ($1, $2)', [id_user, id_rol]);
        }
      }

      // 3) Enviar correo en formato HTML Premium (Aesthetic tipo Clima Laboral)
      const contenidoHTML = `
        <p style="margin: 0; color: #94a3b8; font-size: 14px; line-height: 1.6;">
          Has sido invitado/a a enrolarte en la <strong>Plataforma de Gestión de Protocolos de Grúas San Pablo</strong>. Este sistema permite la firma electrónica simple (FES) de documentos laborales y de seguridad, cumpliendo estrictamente con la normativa legal vigente.
        </p>
        <p style="margin: 20px 0 10px 0; color: #ffffff; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
          Pasos requeridos para completar el proceso:
        </p>
        <div style="background: #101217; padding: 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.03); margin-bottom: 20px;">
          <ol style="margin: 0; padding-left: 20px; color: #94a3b8; font-size: 13.5px; line-height: 1.6;">
            <li style="margin-bottom: 8px;">Haz clic en el botón <strong>"Completar Enrolamiento"</strong> abajo.</li>
            <li style="margin-bottom: 8px;">Valida y completa tu información básica de contacto.</li>
            <li>Crea tu clave secreta de firma electrónica (PIN de 4 dígitos) para firmar tu acta de consentimiento.</li>
          </ol>
        </div>
        <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.5;">
          Una vez finalizado, recibirás un correo de confirmación de tu activación oficial.
        </p>
      `;

      const cuerpoMensaje = messageModel.obtenerPlantillaHTML({
        titulo: `¡Bienvenido/a, ${nombre}!`,
        subtitulo: 'Se ha iniciado tu proceso de enrolamiento oficial en Grúas San Pablo.',
        contenido: contenidoHTML,
        botonTexto: 'Completar Enrolamiento',
        botonUrl: 'https://servidor.leanglobal.cl/lg-gsp-dev/enrolamiento'
      });

      try {
        await messageModel.enviarYRegistrarCorreo({
          para: correo,
          asunto: "Inicio de Enrolamiento - GSP Operaciones",
          cuerpo: cuerpoMensaje,
          esHtml: true
        });
      } catch (e) { 
        console.error("Error al enviar correo de enrolamiento:", e.message); 
      }

      return { id_user, status: "success" };
    } catch (err) {
      console.error("Error iniciarEnrolamiento:", err);
      throw err;
    }
  }

  async enrolamiento(id_user, name_frst, name_sec, apellido_pat, apellido_mat, email_alternativo, movil, pass_hash_fes) {
     const client = await this.pool.connect();
     try {
       await client.query('BEGIN');
       
       // 1. Actualizar datos del usuario
       const queryUpd = `UPDATE tsec_users SET name_frst = $2, name_sec = $3, apellido_pat = $4, apellido_mat = $5, email_alternativo = $6, movil = $7, pass_hash_fes = $8, flag_proc_enrol = false, fecha_actualizacion = NOW() WHERE id_user = $1 RETURNING id_user, email, rut`;
       const resUpd = await client.query(queryUpd, [id_user, name_frst, name_sec, apellido_pat, apellido_mat, email_alternativo, movil, pass_hash_fes]);
       const user = resUpd.rows[0];

       if (!user) throw new Error("Usuario no encontrado");

       // 1.5. Asignar automáticamente el rol de enrolamiento USR-CONSENT (id_rol = 3)
       await client.query(
         `INSERT INTO tsec_user_roles (id_user, id_rol, id_empresa) VALUES ($1, 3, 1) ON CONFLICT DO NOTHING`,
         [user.id_user]
       );

       // 2. Crear Consentimiento usando el servicio
       await crearConsentimientoEnrolamiento({ id_user: user.id_user, rut: user.rut });

       await client.query('COMMIT');

       // 3. Correo de Enrolamiento Exitoso (Clima Laboral style)
       const contenidoHTML = `
         <p style="margin: 0; color: #94a3b8; font-size: 14px; line-height: 1.6;">
           Te confirmamos que tu proceso de enrolamiento en la <strong>Plataforma de Gestión de Operaciones de Grúas San Pablo</strong> ha finalizado de forma exitosa.
         </p>
         <p style="margin: 15px 0 0 0; color: #94a3b8; font-size: 14px; line-height: 1.6;">
           A partir de este momento, estás habilitado/a para firmar digitalmente documentos laborales y actas de seguridad mediante tu clave FES personal (PIN de 4 dígitos) creada durante tu registro.
         </p>
         <div style="background: #101217; padding: 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.03); margin: 20px 0;">
           <p style="margin: 0 0 10px 0; font-size: 13px; color: #38bdf8; font-weight: 700; text-transform: uppercase;">Canales Disponibles:</p>
           <ul style="margin: 0; padding-left: 20px; color: #94a3b8; font-size: 13px; line-height: 1.6;">
             <li style="margin-bottom: 6px;"><strong>Acceso Web</strong>: Ingresa directamente en tu navegador de escritorio.</li>
             <li><strong>App Móvil PWA</strong>: Instálala directamente en tu smartphone Android o iOS para gestionar firmas en terreno.</li>
           </ul>
         </div>
       `;

       const cuerpoMensaje = messageModel.obtenerPlantillaHTML({
         titulo: '¡Enrolamiento Exitoso!',
         subtitulo: `Hola ${name_frst} ${apellido_pat}, tu firma electrónica simple ha sido activada.`,
         contenido: contenidoHTML,
         botonTexto: 'Acceder a la Plataforma',
         botonUrl: 'https://servidor.leanglobal.cl/lg-gsp-dev/'
       });

       try {
         await messageModel.enviarYRegistrarCorreo({
           para: user.email || email_alternativo,
           asunto: "Confirmación de Enrolamiento - GSP Operaciones",
           cuerpo: cuerpoMensaje,
           esHtml: true
         });
       } catch (mailError) {
         console.error("Error al enviar correo de confirmación de enrolamiento:", mailError.message);
       }

       return user;
     } catch (err) {
       await client.query('ROLLBACK');
       console.error("Error en enrolamiento:", err);
       throw err;
     } finally {
       client.release();
     }
  }

  async UpdPassFes(id_user, pass_hash_fes) {
    try {
      const query = `
        UPDATE tsec_users
        SET pass_hash_fes = $2
        WHERE id_user = $1
        RETURNING id_user, email, name_frst, apellido_pat
      `;

      const result = await this.pool.query(query, [id_user, pass_hash_fes]);

      if (result.rowCount === 0) {
        throw new Error('Usuario no encontrado');
      }

      const updatedUser = result.rows[0];

      const contenidoHTML = `
        <p style="margin: 0; color: #94a3b8; font-size: 14px; line-height: 1.6;">
          Te informamos que tu firma electrónica simple (FES) ha registrado una <strong>actualización de contraseña</strong> exitosa.
        </p>
        <p style="margin: 20px 0 0 0; color: #f43f5e; font-size: 13.5px; font-weight: 600; line-height: 1.6;">
          ⚠️ IMPORTANTE: Si tú no solicitaste este cambio de PIN, por favor contacta de forma urgente al área de administración o TI para resguardar la seguridad de tu firma.
        </p>
      `;

      const cuerpoMensaje = messageModel.obtenerPlantillaHTML({
        titulo: 'Actualización de Clave FES',
        subtitulo: `Hola ${updatedUser.name_frst} ${updatedUser.apellido_pat}, tu clave PIN de firma ha sido modificada.`,
        contenido: contenidoHTML,
        botonTexto: 'Acceder a la Plataforma',
        botonUrl: 'https://servidor.leanglobal.cl/lg-transmac-dev/'
      });

      try {
        await messageModel.enviarYRegistrarCorreo({
          para: updatedUser.email,
          asunto: 'Actualización de clave FES - Transmac SST',
          cuerpo: cuerpoMensaje,
          esHtml: true
        });
      } catch (mailError) {
        console.error('Error al enviar correo de cambio de FES:', mailError.message);
      }

      return { id_user: updatedUser.id_user };
    } catch (err) {
      console.error('Error en UpdPassFes:', err);
      throw err;
    }
  }

  async updUsuarioDatos({
    id_user,
    email,
    rut,
    name_frst,
    name_sec,
    apellido_pat,
    apellido_mat,
    movil,
    activo,
    json_data,
    id_empresa
  }) {
    const sql = `
      UPDATE tsec_users
      SET
        rut           = COALESCE($2, rut),
        email         = COALESCE($3, email),
        name_frst     = COALESCE($4, name_frst),
        name_sec      = COALESCE($5, name_sec),
        apellido_pat  = COALESCE($6, apellido_pat),
        apellido_mat  = COALESCE($7, apellido_mat),
        movil         = COALESCE($8, movil),
        activo        = COALESCE($9, activo),
        json_data     = COALESCE($10, json_data),
        id_empresa    = COALESCE($11, id_empresa),
        fecha_actualizacion = NOW()
      WHERE id_user = $1
      RETURNING id_user;
    `;

    try {
      const { rows } = await this.pool.query(sql, [
        id_user,
        rut,
        email,
        name_frst,
        name_sec,
        apellido_pat,
        apellido_mat,
        movil,
        activo,
        json_data,
        id_empresa
      ]);

      if (rows.length === 0) {
        throw new Error('Usuario no encontrado');
      }

      return rows[0].id_user;
    } catch (err) {
      console.error('Error en updUsuarioDatos:', err);
      throw new Error('Error al actualizar datos de usuario');
    }
  }

  async updUsuarioRoles(id_user, rolesIds) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM tsec_user_roles WHERE id_user = $1', [id_user]);
      if (Array.isArray(rolesIds) && rolesIds.length > 0) {
        for (const id_rol of rolesIds) {
          await client.query(
            'INSERT INTO tsec_user_roles (id_user, id_rol) VALUES ($1, $2)',
            [id_user, id_rol]
          );
        }
      }
      await client.query('COMMIT');
      return { id_user, roles: rolesIds };
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error en updUsuarioRoles:', err);
      throw new Error('Error al actualizar roles del usuario');
    } finally {
      client.release();
    }
  }

  async updUsuarioEquipos(id_user, teams, id_usuario_modificacion) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      const targetTeamIds = teams.map(t => {
        if (typeof t === 'object' && t !== null) {
          return Number(t.id_equipo_proyecto || t.id_equipo || t.id);
        }
        return Number(t);
      }).filter(Boolean);

      // Deactivate previous active memberships
      await client.query(
        `UPDATE tpry_equipo_miembro 
         SET activo = false, fecha_salida = CURRENT_DATE, fecha_actualizacion = NOW(), id_usuario_modificacion = $2 
         WHERE id_user = $1 AND activo = true`,
        [id_user, id_usuario_modificacion || null]
      );

      // Add or reactivate target memberships
      for (const teamId of targetTeamIds) {
        const check = await client.query(
          'SELECT id_equipo_miembro FROM tpry_equipo_miembro WHERE id_user = $1 AND id_equipo_proyecto = $2 LIMIT 1',
          [id_user, teamId]
        );

        if (check.rows.length > 0) {
          await client.query(
            `UPDATE tpry_equipo_miembro 
             SET activo = true, fecha_salida = null, fecha_actualizacion = NOW(), id_usuario_modificacion = $3 
             WHERE id_user = $1 AND id_equipo_proyecto = $2`,
            [id_user, teamId, id_usuario_modificacion || null]
          );
        } else {
          await client.query(
            `INSERT INTO tpry_equipo_miembro (id_equipo_proyecto, id_user, activo, fecha_ingreso, fecha_creacion, id_usuario_creacion) 
             VALUES ($1, $2, true, CURRENT_DATE, NOW(), $3)`,
            [teamId, id_user, id_usuario_modificacion || null]
          );
        }
      }

      await client.query('COMMIT');
      return { id_user, teams: targetTeamIds };
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error en updUsuarioEquipos:', err);
      throw new Error('Error al actualizar pertenencia a proyectos del usuario');
    } finally {
      client.release();
    }
  }

  async getMailRut(rut) {
    try {
      const rutNorm = String(rut).trim().toUpperCase();
      const sql = 'SELECT email FROM tsec_users WHERE UPPER(rut) = $1 LIMIT 1';
      const respuesta = await this.pool.query(sql, [rutNorm]);
      return respuesta.rows[0] || null;
    } catch (err) {
      console.error("Error en getMailRut:", err);
      throw new Error("Error al obtener email por rut");
    }
  }
}

module.exports = Usuario;


