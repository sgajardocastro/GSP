require('dotenv').config();

const config = {
    env: process.env.NODE_ENV || 'dev',
    port: process.env.PORT || 3000,
    dbUser: process.env.DB_USER,
    dbPassword: process.env.DB_PASSWORD,
    dbHost: process.env.DB_HOST,
    dbName: process.env.DB_NAME,
    dbPort: process.env.DB_PORT,
    dbSchema: process.env.DB_SCHEMA || 'sch_leangsp',
    storageRoot: process.env.STORAGE_PATH || '/u05/LeanDocs/GSP/dev',
}

module.exports = { config };
