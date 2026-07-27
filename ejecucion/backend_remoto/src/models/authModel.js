
const db = require('../config/dbConfig');
const bcrypt = require('bcryptjs');

class AuthModel {
  async login(username, password) {
    try {
      const sql = 'SELECT * FROM tsec_users WHERE LOWER(codi_user) = LOWER($1)';
      const result = await db.query(sql, [username]);
      if (result.rows.length === 0) {
        throw new Error('Usuario no encontrado');
      }
      const user = result.rows[0];
      const pass = user.password_hash || user.password;
      const isMatch = await bcrypt.compare(password, pass);
      if (!isMatch) {
        throw new Error('Contraseña incorrecta');
      }
      return user;
    } catch (err) {
      throw new Error(err.message);
    }
  }

  async getUserByEmail(email) {
    const sql = 'SELECT * FROM tsec_users WHERE LOWER(codi_user) = LOWER($1) OR LOWER(email) = LOWER($1)';
    const result = await db.query(sql, [email]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }
}
module.exports = new AuthModel();

