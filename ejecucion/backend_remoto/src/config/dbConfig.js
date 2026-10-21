const { Pool } = require("pg");
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

console.log("DB_USER from env:", process.env.DB_USER);

const schema = process.env.DB_SCHEMA || 'sch_leangsp';

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

pool.on('connect', (client) => {
  client.query(`SET search_path TO ${schema}, sch_leangsp, sch_leangsp_prod, public`).catch(err => {
    console.error("Error configurando search_path en cliente del pool:", err.message);
  });
});

pool.on('error', (err) => {
  console.error("Aviso: Error en conexión ociosa del pool PostgreSQL (recuperado):", err.message);
});

console.log("Pool de PostgreSQL inicializado con usuario: " + process.env.DB_USER + " Schema: " + schema);

module.exports = pool;
