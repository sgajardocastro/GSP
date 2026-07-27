module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'clave_super_secreta_firma',
  jwtEncryptSecret: process.env.JWT_ENCRYPT_SECRET || 'clave_super_secreta_cifrado',
  tokenExpiresIn: '1h', // puedes ajustar la duración según necesites
};