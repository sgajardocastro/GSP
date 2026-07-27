// config/serviciosLoader.js
const path = require('path')

const serviciosPath = path.join(__dirname, 'servicios.js')

function cargarServicios() {
  // eliminar cache para que Node recargue el archivo en cada request
  delete require.cache[require.resolve(serviciosPath)]
  return require(serviciosPath)
}

module.exports = { cargarServicios }