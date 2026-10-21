const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const jwtSecret = process.env.JWT_SECRET || 'secret';
const jwtEncryptSecret = process.env.JWT_ENCRYPT_SECRET || 'encrypt-secret';

function decryptToken(encryptedToken, secret) {
  try {
    const decipher = crypto.createDecipheriv('aes-256-cbc', crypto.scryptSync(secret, 'salt', 32), Buffer.alloc(16, 0));
    let decrypted = decipher.update(encryptedToken, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    return null;
  }
}

const pool = require('../config/postgresPool');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(403).json({ message: 'No se proveyó un token (Authorization Header faltante).' });
  }

  const tokenParts = authHeader.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
    return res.status(403).json({ message: 'Formato de token inválido. Use: Bearer <token>' });
  }

  const encryptedToken = tokenParts[1];
  const decryptedToken = decryptToken(encryptedToken, jwtEncryptSecret);

  if (!decryptedToken) {
    return res.status(401).json({ message: 'Fallo al desencriptar el token.' });
  }

  jwt.verify(decryptedToken, jwtSecret, async (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Token expirado o inválido.', error: err.message });
    }
    // Inyecta el usuario decodificado (con su id_empresa) en el request
    req.user = decoded;

    // Asegurar que req.user.roles esté siempre disponible (fallback dinámico)
    if (!req.user.roles && req.user.id_user) {
      try {
        const { rows } = await pool.query(
          `SELECT r.name_rol 
           FROM tsec_user_roles ur 
           JOIN tsec_roles r ON ur.id_rol = r.id_rol 
           WHERE ur.id_user = $1 AND (r.activo IS NULL OR r.activo = true)`,
          [req.user.id_user]
        );
        req.user.roles = rows.map(r => r.name_rol);
      } catch (e) {
        req.user.roles = [];
      }
    }

    next();
  });
};

module.exports = {
  verifyToken,
  decryptToken
};
