const client = require('./dbConfig');

async function dbQuery(request, query, withwhere = true) {
  try {
    let sql = query;

    if (withwhere) {
      const where = generarWhere(request);
      console.log("🟡 WHERE generado:", where);
      sql = "SELECT vw$123.* FROM (" + sql + ") vw$123 " + where;
    }

    if (request.limit && request.offset) {
      sql += ` OFFSET ${request.offset} LIMIT ${request.limit}`;
    }

    console.log("🟢 SQL final XXXXXX:", sql);

    const result = await client.query(sql); // <-- línea 17
    return result.rows;
  } catch (err) {
    console.error("❌ Error en dbQuery:", err);
    throw new Error(err.message);
  }
}

function generarWhere(request) {
  let where = "";
  const filters = [];

  if (request && typeof request === "object") {
    for (const key of Object.keys(request)) {
      if (["limit", "offset"].includes(key)) continue;

      let val = request[key];

      // Filtrar undefined/null reales
      if (val === undefined || val === null) continue;

      // Convertir a string
      const valString = String(val).trim();

      // Filtrar valores vacíos o inválidos
      if (
        valString === "" ||
        valString.toLowerCase() === "null" ||
        valString.toLowerCase() === "undefined"
      ) {
        continue;
      }

      const cleanKey = key.startsWith('_') ? key.substring(1) : key;
      filters.push(`${cleanKey}='${valString}'`);
    }

    if (filters.length > 0) {
      where = " WHERE " + filters.join(" AND ");
    }
  }

  return where;
}

module.exports = { dbQuery };
