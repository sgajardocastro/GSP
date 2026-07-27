const { Pool } = require("pg");
const { config } = require("./config");

const USER = encodeURIComponent(config.dbUser);
const PASSWORD = encodeURIComponent(config.dbPassword);
const URI = "postgres://" + USER + ":" + PASSWORD + "@" + config.dbHost + ":" + config.dbPort + "/" + config.dbName;

console.log("URI: ", URI)

const pool = new Pool({ connectionString: URI });

pool.on("error", (err) => {
  console.error("Error en la conexión del pool:", err);
});

module.exports = pool;
