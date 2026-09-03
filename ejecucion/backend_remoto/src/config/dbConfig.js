
const { Client } = require("pg");
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

console.log("DB_USER from env:", process.env.DB_USER);

const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

client
  .connect()
  .then(() => {
    const schema = process.env.DB_SCHEMA || 'sch_leangsp_prod';
    console.log("Conectado a PostgreSQL con usuario: " + process.env.DB_USER + " Schema: " + schema);
    return client.query(`SET search_path TO ${schema}, public`);
  })
  .catch((err) => {
    console.error("Error de conexión o consulta", err.stack);
  });

module.exports = client;
    
