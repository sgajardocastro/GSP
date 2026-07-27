// controllers/servicioController.js
const fs = require('fs');
const path = require('path');
const { dbQuery } = require('../config/dbQuery');

const { cargarServicios } = require('../config/serviciosLoader')

/**
 * Construye SQL reemplazando placeholders definidos en el JSON
 * y agregando WHERE dinámico con los queryParams extra.
 */
function parseSQL(base, servicio, queryParams = {}) {
  console.log('queryParams', queryParams);

  let sql = String(base)
    .replaceAll('$fecha_desde', queryParams.fecha_desde || '2000-01-01')
    .replaceAll('$fecha_hasta', queryParams.fecha_hasta || '2050-12-31')
    .replaceAll('$flag', queryParams.flag || '0');

  // Campos simples: filtro y teratrib
  ['filtro', 'secatrib', 'teratrib'].forEach((key) => {
    const val = queryParams[key];
    const campo = servicio[key]; // <-- proteger
    const clause = val && campo
      ? `and ${campo} = ${isNaN(val) ? `'${val}'` : val}`
      : '';
    sql = sql.replaceAll(`$${key}`, clause);
  });

  // Campos de lista: secatrib e in
  ['in'].forEach((key) => {
    const val = queryParams[key];
    const campo = servicio[key]; // <-- proteger
    let clause = '';
    if (val && campo) {
      const limpio = String(val).replace(/^\(|\)$/g, '');
      const items = limpio
        .split(',')
        .map(v => v.trim())
        .map(v => isNaN(v) ? `'${v}'` : v)
        .join(',');
      clause = `and ${campo} IN (${items})`;
    }
    sql = sql.replaceAll(`$${key}`, clause);
  });

  // Agregar WHERE dinámico para cualquier otro filtro
  sql = agregarFiltrosExtras(sql, queryParams);

  return sql;
}
/*function parseSQL(base, servicio, queryParams = {}) {
  console.log('queryParams', queryParams);

  let sql = String(base)
    // Fechas y flag
    .replaceAll('$fecha_desde', queryParams.fecha_desde || '2000-01-01')
    .replaceAll('$fecha_hasta', queryParams.fecha_hasta || '2050-12-31')
    .replaceAll('$flag', queryParams.flag || '0');

  // Campos simples: filtro y teratrib
  ['filtro', 'teratrib'].forEach((key) => {
    const val = queryParams[key];
    const clause = val
      ? `and ${servicio[key]} = ${isNaN(val) ? `'${val}'` : val}`
      : '';
    sql = sql.replaceAll(`$${key}`, clause);
  });

  // Campos de lista: secatrib e in
  ['secatrib', 'in'].forEach((key) => {
    const val = queryParams[key];
    let clause = '';
    if (val) {
      const limpio = String(val).replace(/^\(|\)$/g, '');
      const items = limpio
        .split(',')
        .map(v => v.trim())
        .map(v => isNaN(v) ? `'${v}'` : v)
        .join(',');
      clause = `and ${servicio[key]} IN (${items})`;
    }
    sql = sql.replaceAll(`$${key}`, clause);
  });

  // Agregar WHERE dinámico para cualquier otro filtro
  sql = agregarFiltrosExtras(sql, queryParams);

  return sql;
}*/

/**
 * Agrega condiciones dinámicas (como id_survey=...) al WHERE del SQL
 */
function agregarFiltrosExtras(sql, queryParams = {}) {
  // Excluir estos porque ya se usaron en replaces anteriores
  const exclude = ['fecha_desde', 'fecha_hasta', 'flag', 'filtro', 'teratrib', 'secatrib', 'in', 'limit', 'offset'];

  const filtrosExtras = Object.keys(queryParams)
    .filter(key => !exclude.includes(key) && queryParams[key] !== undefined && queryParams[key] !== null && queryParams[key] !== '')
    .map(key => `${key} = ${isNaN(queryParams[key]) ? `'${queryParams[key]}'` : queryParams[key]}`);

  if (filtrosExtras.length === 0) {
    return sql;
  }

  const extrasClause = filtrosExtras.join(' AND ');

  // Detectar si ya hay WHERE
  if (/ where /i.test(sql)) {
    return sql.replace(/where/i, match => `${match} ${extrasClause} AND`);
  } else {
    return sql + ` WHERE ${extrasClause}`;
  }
}

const servicioGeneral = async (req, res) => {
  console.log('Entró a servicioGeneral');
  
  const servicios = cargarServicios()
  const servicio = servicios.find(s => s.uri === req.path)

  if (!servicio) return res.send('NO DEFINIDO');

  console.log("servicio.tipo", servicio.tipo )

  if (servicio.tipo !== 'indicador') {
    try {
      console.log('Ejecutando consulta REQQUERY', req.query);
      const resultado = await dbQuery(req.query, servicio.query, servicio.where);
      console.log('Consulta terminada');
      return res.send(resultado);
    } catch (err) {
      console.dir("AT Error", err);
      return res.status(500).send(err.message);
    }
  }

  try {
    console.log('Entró a servicioGeneral TRY!!!!!!!!!!!!!!!!!!!!!!');
    const sqlIndicador = parseSQL(servicio.indicador, servicio, req.query);
    const sqlDatos = parseSQL(servicio.datos, servicio, req.query);
    //const sqlCumplimiento = parseSQL(servicio.cumplimiento || 'SELECT 0 AS valor', servicio, req.query);
    //const sqlIndicador2 = parseSQL(servicio.indicador2 || 'SELECT 0 AS valor', servicio, req.query);

    const indicador = await dbQuery({}, sqlIndicador, false);
    //const indicador2 = await dbQuery({}, sqlIndicador2, false);
    //const cumplimiento = await dbQuery({}, sqlCumplimiento, false);
    const datos = await dbQuery({}, sqlDatos, false);

    return res.json({
      indicador: indicador[0]?.valor || 0,     // <-- asegúrate de que tu SQL use AS valor
      //cumplimiento: cumplimiento[0]?.valor || 0,
      datos: datos,                            // <-- array de objetos
      //indicador2: indicador2[0]?.valor || 0
    });
  } catch (err) {
    console.error("AT Error", err);
    return res.status(500).send(err.message);
  }
  /*
  try {
    const sqlIndicador = parseSQL(servicio.indicador, servicio, req.query);
    const sqlDatos = parseSQL(servicio.datos, servicio, req.query);
    const sqlCumplimiento = parseSQL(servicio.cumplimiento || 'SELECT 0 AS valor', servicio, req.query);
    const sqlIndicador2 = parseSQL(servicio.indicador2 || 'SELECT 0 AS valor', servicio, req.query);

    const indicador = await dbQuery({}, sqlIndicador, false);
    const indicador2 = await dbQuery({}, sqlIndicador2, false);
    const cumplimiento = await dbQuery({}, sqlCumplimiento, false);
    const datos = await dbQuery({}, sqlDatos, false);

    return res.send({
      indicador: indicador[0]?.VALOR || 0,
      indicador2: indicador2[0]?.VALOR || 0,
      cumplimiento: cumplimiento[0]?.VALOR || 0,
      datos
    });
  } catch (err) {
    console.dir("AT Error", err);
    return res.status(500).send(err.message);
  }*/
};

const servicioDobleNivel = async (req, res) => {
  try {
    console.log('Entró a servicioDobleNivel');
    console.log('ReqQuery:', req.query);

    const serviciosPath = path.join(__dirname, '../config/servicios.json');
    const servicios = JSON.parse(fs.readFileSync(serviciosPath, 'utf-8'));

    const servicio = servicios.find(s => s.uri === req.path);

    if (!servicio) {
      return res.status(404).send('NO DEFINIDO');
    }

    const baseSQL = servicio.query || servicio.datos;
    if (!baseSQL) {
      return res.status(500).send('Servicio sin definición de SQL');
    }

    const finalSQL = parseSQL(baseSQL, servicio, req.query);
    console.log('SQL final a ejecutar:\n', finalSQL);

    const resultado = await dbQuery({}, finalSQL, servicio.where);

    return res.json(resultado);

  } catch (err) {
    console.error('AT Error en servicioDobleNivel:', err);
    return res.status(500).send(err.message);
  }
};

module.exports = {
  servicioGeneral,
  servicioDobleNivel
};
