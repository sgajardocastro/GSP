const { Client } = require('pg');

const client = new Client({
  user: 'usr_leangsp',
  password: 'usr_gsp_123',
  host: 'servidor.leanglobal.cl',
  database: 'postgres',
  port: 5432,
});

async function fixGSP2608() {
  try {
    await client.connect();
    
    // 1. Obtener el proyecto actual
    const res = await client.query(`SELECT json_field FROM tpry_proyecto WHERE id_proyecto = $1`, [2608]);
    if (res.rows.length === 0) {
      console.log('Proyecto no encontrado');
      return;
    }
    
    let json_field = res.rows[0].json_field;
    if (typeof json_field === 'string') {
      json_field = JSON.parse(json_field);
    }
    
    // 2. Limpiar ejecución
    if (json_field && json_field.ejecucion_v1) {
      json_field.ejecucion_v1.subtab_activa = 'validacion';
      delete json_field.ejecucion_v1.asignacion_confirmada;
      delete json_field.ejecucion_v1.preparacion_salida;
      delete json_field.ejecucion_v1.subtab_actual_view;
      delete json_field.ejecucion_v1.subtab_maxima;
      delete json_field.ejecucion_v1.decision;
      delete json_field.ejecucion_v1.estado_requerimiento;
    } else {
      if (!json_field) json_field = {};
      json_field.ejecucion_v1 = {
        subtab_activa: 'validacion'
      };
    }
    
    // 3. Hacer UPDATE
    await client.query(`UPDATE tpry_proyecto SET id_proyecto_estado = 3, json_field = $1 WHERE id_proyecto = $2`, [json_field, 2608]);
    
    console.log('✅ Proyecto 2608 arreglado exitosamente en la BD remota!');
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

fixGSP2608();
