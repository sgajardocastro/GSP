const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });

    try {
        await client.connect();
        console.log('Connected to the database.');

        const sqlFilePath = path.join(__dirname, '20260804_create_tpry_rel_persona_equipo.sql');
        const sqlQuery = fs.readFileSync(sqlFilePath, { encoding: 'utf8' });

        await client.query(sqlQuery);
        console.log('Migration executed successfully.');
    } catch (err) {
        console.error('Error executing migration:', err);
    } finally {
        await client.end();
        console.log('Database connection closed.');
    }
}

runMigration();
