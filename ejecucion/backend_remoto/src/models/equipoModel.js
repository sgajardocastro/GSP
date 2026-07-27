const pool = require("../config/postgresPool");

class equipoModel {
  constructor () {
    this.pool = pool;
    this.pool.on("error", (err) => console.error("PG error", err));
  }

  /**
   * Actualiza integrantes de un equipo en tpry_equipo_miembro
   * payload:
   * {
   *   id_equipo_proyecto: number,
   *   ids_usuarios: number[],
   *   id_usuario_modificacion?: number
   * }
   */
  async updEquipos (payload) {
    const {
        id_equipo_proyecto,
        nombre_equipo,
        descripcion_equipo,
        ids_usuarios,
        id_usuario_modificacion
    } = payload;

    const idUsuarioMod = id_usuario_modificacion ?? null;
    const client = await this.pool.connect();

    try {
        await client.query("BEGIN");

        // 0) Actualizar datos básicos del equipo
        if (nombre_equipo) {
            await client.query(
                `UPDATE tpry_equipo_proyecto 
                 SET nombre_equipo = $1, 
                     descripcion_equipo = $2
                 WHERE id_equipo_proyecto = $3`,
                [nombre_equipo, descripcion_equipo, id_equipo_proyecto]
            );
        }

        // 1) Traer TODOS los miembros del equipo (activos e inactivos)
        const { rows } = await client.query(
        `
            SELECT
            id_equipo_miembro,
            id_user,
            activo
            FROM tpry_equipo_miembro
            WHERE id_equipo_proyecto = $1
        `,
        [id_equipo_proyecto]
        );

        const miembros = rows || [];

        // Mapear por usuario
        // { id_user: { activo: bool, id_equipo_miembro: int } }  (si hay varios históricos, nos quedamos con el último)
        const porUsuario = new Map();
        for (const m of miembros) {
        porUsuario.set(Number(m.id_user), {
            id_equipo_miembro: m.id_equipo_miembro,
            activo: m.activo === true || m.activo === 't' || m.activo === 1
        });
        }

        const setNuevos = new Set((ids_usuarios || []).map(Number));

        // 2) Desactivar los que hoy están activos y ya NO vienen en el set final
        const miembrosADesactivar = miembros
        .filter(m => {
            const idUser = Number(m.id_user);
            const esActivo = m.activo === true || m.activo === 't' || m.activo === 1;
            return esActivo && !setNuevos.has(idUser);
        })
        .map(m => m.id_equipo_miembro);

        if (miembrosADesactivar.length > 0) {
        await client.query(
            `
            UPDATE tpry_equipo_miembro
            SET
                activo                 = false,
                fecha_salida           = CURRENT_DATE,
                fecha_actualizacion    = CURRENT_TIMESTAMP,
                id_usuario_modificacion = $2
            WHERE id_equipo_miembro = ANY($1::int[])
            `,
            [miembrosADesactivar, idUsuarioMod]
        );
        }

        // 3) Para cada usuario que debe quedar ACTIVO:
        //    - Si no existe registro: INSERT
        //    - Si existe y está inactivo: REACTIVAR (UPDATE)
        for (const id_user of setNuevos) {
        const info = porUsuario.get(id_user);

        if (!info) {
            // No existe ningún registro histórico → INSERT
            await client.query(
            `
                INSERT INTO tpry_equipo_miembro (
                id_equipo_proyecto,
                id_user,
                fecha_ingreso,
                fecha_salida,
                activo,
                fecha_creacion,
                fecha_actualizacion,
                id_usuario_creacion,
                id_usuario_modificacion
                )
                VALUES (
                $1, $2,
                CURRENT_DATE,
                NULL,
                true,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP,
                $3,
                $3
                )
            `,
            [id_equipo_proyecto, id_user, idUsuarioMod]
            );
        } else if (!info.activo) {
            // Ya tiene registro pero inactivo → REACTIVAR
            await client.query(
            `
                UPDATE tpry_equipo_miembro
                SET
                activo                 = true,
                fecha_salida           = NULL,
                fecha_actualizacion    = CURRENT_TIMESTAMP,
                id_usuario_modificacion = $2
                WHERE id_equipo_miembro = $1
            `,
            [info.id_equipo_miembro, idUsuarioMod]
            );
            // (opcional) podrías decidir si quieres actualizar fecha_ingreso a CURRENT_DATE
            // según tu regla de negocio de "re-ingreso"
        }
        // Si info.activo === true y está en el set final → no hacemos nada, ya está OK
        }

        await client.query("COMMIT");

        return {
        id_equipo_proyecto,
        ids_usuarios
        };
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
    }


  /**
   * Desactiva (no borra) un miembro del equipo
   * params: { id_equipo_proyecto, id_user, id_usuario_modificacion? }
   */
  async delEquiposMiembro ({ id_equipo_proyecto, id_user, id_usuario_modificacion }) {
    const client = await this.pool.connect();
    try {
      const idUsuarioMod = id_usuario_modificacion ?? null;

      const result = await client.query(
        `
          UPDATE tpry_equipo_miembro
          SET
            activo                 = false,
            fecha_salida           = COALESCE(fecha_salida, CURRENT_DATE),
            fecha_actualizacion    = CURRENT_TIMESTAMP,
            id_usuario_modificacion = $3
          WHERE id_equipo_proyecto = $1
            AND id_user            = $2
            AND activo             = true
          RETURNING *
        `,
        [id_equipo_proyecto, id_user, idUsuarioMod]
      );

      return {
        rowCount: result.rowCount,
        rows: result.rows
      };
    } finally {
      client.release();
    }
  }

  /**
   * Obtiene todos los equipos de todos los proyectos
   */
  async getEquipos () {
    const query = `
      SELECT 
        ep.*,
        p.nombre_proyecto
      FROM tpry_equipo_proyecto ep
      JOIN tpry_proyecto p ON ep.id_proyecto = p.id_proyecto
      ORDER BY ep.id_equipo_proyecto DESC;
    `;
    try {
      const { rows } = await this.pool.query(query);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener equipos: ${error.message}`);
    }
  }
}

module.exports = equipoModel;
