const { Client } = require('pg');

const client = new Client({
  user: 'usr_leangsp',
  password: 'usr_gsp_123',
  host: 'servidor.leanglobal.cl',
  database: 'postgres',
  port: 5432,
});

async function findProject() {
  try {
    await client.connect();
    
    // Buscar en el JSON
    const res = await client.query(`SELECT id_proyecto, json_field FROM tpry_proyecto WHERE json_field::text LIKE '%GSP-2608-4851-030%'`);
    
    if (res.rows.length > 0) {
      console.log('ENCONTRADO id_proyecto:', res.rows[0].id_proyecto);
      
      const id = res.rows[0].id_proyecto;
      let j = res.rows[0].json_field;
      if (typeof j === 'string') j = JSON.parse(j);
      
      if (j && j.ejecucion_v1) {
        j.ejecucion_v1.subtab_activa = 'validacion';
        delete j.ejecucion_v1.asignacion_confirmada;
        delete j.ejecucion_v1.preparacion_salida;
        delete j.ejecucion_v1.subtab_actual_view;
        delete j.ejecucion_v1.subtab_maxima;
        delete j.ejecucion_v1.decision;
        delete j.ejecucion_v1.estado_requerimiento;
      } else {
        if (!j) j = {};
        j.ejecucion_v1 = { subtab_activa: 'validacion' };
      }
      
      await client.query(`UPDATE tpry_proyecto SET id_proyecto_estado = 3, json_field = $1 WHERE id_proyecto = $2`, [j, id]);
      console.log('✅ Proyecto arreglado exitosamente en la BD remota para el ID:', id);
    } else {
      console.log('NO ENCONTRADO NINGUNO CON ESE TEXTO EN EL JSON');
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

findProject();
