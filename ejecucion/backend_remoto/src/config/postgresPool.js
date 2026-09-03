const { Pool } = require("pg");
const { config } = require("./config");

const USER = encodeURIComponent(config.dbUser);
const PASSWORD = encodeURIComponent(config.dbPassword);
const URI = "postgres://" + USER + ":" + PASSWORD + "@" + config.dbHost + ":" + config.dbPort + "/" + config.dbName;

console.log("URI: ", URI);
console.log("DB Schema activo: ", config.dbSchema);

const pool = new Pool({ connectionString: URI });

pool.on("connect", (client) => {
  const schema = config.dbSchema || 'sch_leangsp';
  client.query(`SET search_path TO ${schema}, public`, (err) => {
    if (err) console.error("Error seteando search_path:", err);
  });
});

pool.on("error", (err) => {
  console.error("Error en la conexión del pool:", err);
});

module.exports = pool;
