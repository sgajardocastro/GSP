import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Pool } = require('../backend_remoto/node_modules/pg');

const pool = new Pool({ connectionString: 'postgres://usr_leangsp:usr_gsp_123@servidor.leanglobal.cl:5432/postgres' });
const res = await pool.query("SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_schema='sch_leangsp' AND table_name='tedp_estado_pago_detalle'");
console.log('Columnas tedp_estado_pago_detalle:', res.rows);
await pool.end();
