import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://usr_leangsp:usr_gsp_123@servidor.leanglobal.cl:5432/postgres"
});

pool.on('connect', (client) => {
  client.query('SET search_path TO sch_leangsp, public;');
});

export default pool;
