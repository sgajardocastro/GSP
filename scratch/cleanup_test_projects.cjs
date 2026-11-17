const path = require('path');
const { Pool } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/pg'));

const pool = new Pool({
  connectionString: 'postgres://usr_leangsp:usr_gsp_123@servidor.leanglobal.cl:5432/postgres',
  options: '-c search_path=sch_leangsp,public'
});

async function main() {
  const client = await pool.connect();
  try {
    const sel = await client.query(`
      SELECT id_proyecto, codi_proyecto, nombre_proyecto
      FROM tpry_proyecto
      WHERE id_proyecto >= 152 AND nombre_proyecto LIKE '%QA-REQ1173%'
      ORDER BY id_proyecto;
    `);

    const ids = sel.rows.map(r => r.id_proyecto);
    console.log(`Encontrados ${ids.length} proyectos de prueba para eliminar:`, ids);

    if (ids.length === 0) {
      console.log('No hay proyectos de prueba que eliminar.');
      return;
    }

    // Seguridad estricta: asegurar que 47, 150 y 151 NUNCA estén en la lista
    if (ids.includes(47) || ids.includes(150) || ids.includes(151)) {
      throw new Error('ALERTA DE SEGURIDAD: Se detectó un ID de producción o no-QA en la lista de borrado!');
    }

    await client.query('BEGIN');

    // 1. Eliminar ITS y sus detalles
    await client.query(`
      DELETE FROM tits_jornada_detalle WHERE id_its IN (
        SELECT id_its FROM tits_informe_termino WHERE id_proyecto = ANY($1::int[])
      )
    `, [ids]);
    await client.query(`
      DELETE FROM tits_costo_operacional WHERE id_its IN (
        SELECT id_its FROM tits_informe_termino WHERE id_proyecto = ANY($1::int[])
      )
    `, [ids]);
    await client.query(`DELETE FROM tits_informe_termino WHERE id_proyecto = ANY($1::int[])`, [ids]);

    // 2. Eliminar reportes y EDP
    await client.query(`DELETE FROM tedp_reporte_avance WHERE id_proyecto = ANY($1::int[])`, [ids]);
    await client.query(`DELETE FROM tedp_costos_servicio WHERE id_proyecto = ANY($1::int[])`, [ids]);
    await client.query(`DELETE FROM tedp_estado_pago WHERE id_proyecto = ANY($1::int[])`, [ids]);

    // 3. Eliminar actas, desplazamientos, asignaciones y líneas de servicio
    await client.query(`DELETE FROM tope_acta_plataforma WHERE id_proyecto = ANY($1::int[])`, [ids]);
    await client.query(`DELETE FROM tequ_log_desplazamiento WHERE id_proyecto = ANY($1::int[])`, [ids]);
    await client.query(`DELETE FROM tpry_rel_equipo WHERE id_proyecto = ANY($1::int[])`, [ids]);
    await client.query(`DELETE FROM tpry_rel_persona WHERE id_proyecto = ANY($1::int[])`, [ids]);
    await client.query(`DELETE FROM tpry_acreditacion WHERE id_proyecto = ANY($1::int[])`, [ids]);
    await client.query(`DELETE FROM tpry_linea_servicio WHERE id_proyecto = ANY($1::int[])`, [ids]);

    // 4. Finalmente eliminar proyectos
    const delPry = await client.query(`
      DELETE FROM tpry_proyecto WHERE id_proyecto = ANY($1::int[]) RETURNING id_proyecto, codi_proyecto
    `, [ids]);

    await client.query('COMMIT');
    console.log(`✅ Se eliminaron exitosamente ${delPry.rowCount} proyectos de prueba:`, delPry.rows);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error durante la eliminación:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
