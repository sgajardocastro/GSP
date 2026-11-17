const path = require('path');
const { Pool } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/pg'));
const pool = new Pool({
  host: '138.255.103.18',
  port: 5432,
  user: 'postgres',
  password: process.env.DB_PASSWORD || 'LocalRoot2026..',
  database: 'sch_leangsp'
});

async function main() {
  const pRes = await pool.query("SELECT id_proyecto, codi_proyecto, id_proyecto_estado, nombre_proyecto FROM tpry_proyecto WHERE codi_proyecto LIKE '%00049%' OR codi_proyecto LIKE '%049%' OR id_proyecto = 49 ORDER BY id_proyecto DESC LIMIT 5");
  console.log("PROYECTOS ENCONTRADOS:", pRes.rows);
  
  if (pRes.rows.length > 0) {
    const id = pRes.rows[0].id_proyecto;
    console.log(`Verificando asignaciones de equipos para id_proyecto = ${id}:`);
    const eqRes = await pool.query("SELECT re.id_rel_equipo, re.id_equipo, re.rol_equipo, e.patente, e.modelo, e.tipo FROM tpry_rel_equipo re JOIN tequ_equipo e ON re.id_equipo = e.id_equipo WHERE re.id_proyecto = $1", [id]);
    console.log("EQUIPOS ASIGNADOS:", eqRes.rows);

    const perRes = await pool.query("SELECT rp.id_rel_persona, rp.id_user, rp.rol_asignado, u.name_frst, u.apellido_pat, u.rut_user FROM tpry_rel_persona rp JOIN tsec_users u ON rp.id_user = u.id_user WHERE rp.id_proyecto = $1", [id]);
    console.log("PERSONAS ASIGNADAS:", perRes.rows);
  }
  await pool.end();
}

main().catch(console.error);
