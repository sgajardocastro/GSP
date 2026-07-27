const pool = require("../config/postgresPool");

class notfqueueModel {
    constructor(){
    this.pool = pool;
    this.pool.on('error', (err) => console.error(err));
  }

  /**
   * Inserta una fila en tntf_notfqueue
   * Params:
   *  - id_user_target (number | null)
   *  - id_template (number)  O  template_code (string) + version (number)
   *  - json_data (object | string JSON)
   *  - channels (array<string> | CSV | object flags)
   */
  async insertNotfqueue(params) {
    const {
        id_user_target,
        id_template,
        json_data,
        channels,
        estado 
      } = params || {};

    const sql = `
      INSERT INTO tntf_notfqueue
        ( id_user_target, 
          id_template,
          json_data,
          channels,
          estado,
          attempts,
          last_error,
          created_at,
          processed_at)
      VALUES
        ($1, $2, $3::jsonb, $4::jsonb, $5, 0, null, now(), null)
      RETURNING id_notification
    `;
    const vals = [id_user_target, id_template, JSON.stringify(json_data), JSON.stringify(channels), estado];
    const { rows } = await this.pool.query(sql, vals);
    return rows[0];
  }

  async updNotfqueueEstado(data) {
    const {id_notifcation, estado} = data;

    const query = `
      UPDATE tntf_notfqueue
      SET 
        estado = $2
      WHERE id_notification = $1
      RETURNING *;
    `;

    console.log('updNotfqueueEstado:==>', data);

    const values = [id_notifcation, estado];

    try {
      const result = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error al actualizar Notificación: ${error.message}`);
    }
  }

}

module.exports = notfqueueModel;
