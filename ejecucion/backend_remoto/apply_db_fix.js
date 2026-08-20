require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function runFix() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('🔄 Iniciando parche de BD...');
    
    // 1. Agregar columnas a tpry_proyecto forzando el esquema sch_leangsp
    console.log('📦 Verificando columnas en sch_leangsp.tpry_proyecto...');
    await client.query(`ALTER TABLE sch_leangsp.tpry_proyecto ADD COLUMN IF NOT EXISTS token_visita VARCHAR(255) UNIQUE;`);
    await client.query(`ALTER TABLE sch_leangsp.tpry_proyecto ADD COLUMN IF NOT EXISTS estado_solicitud_visita VARCHAR(50) DEFAULT 'SIN_SOLICITAR';`);
    console.log('✅ Columnas de visita a terreno agregadas a sch_leangsp.tpry_proyecto.');

    // 2. Insertar Categorías y Subcategorías para id_empresa = 9
    console.log('📦 Insertando Categorías en sch_leangsp...');
    const idEmpresa = 9;
    
    // Check if OTROS already exists
    const checkOtros = await client.query(`SELECT id_categoria FROM sch_leangsp.tequ_categoria WHERE nombre_categoria = 'OTROS' AND id_empresa = $1`, [idEmpresa]);
    let idCatOtros;
    if (checkOtros.rowCount === 0) {
        const resCatOtros = await client.query(`
          INSERT INTO sch_leangsp.tequ_categoria (nombre_categoria, id_empresa)
          VALUES ('OTROS', $1)
          RETURNING id_categoria
        `, [idEmpresa]);
        idCatOtros = resCatOtros.rows[0].id_categoria;
        
        await client.query(`
          INSERT INTO sch_leangsp.tequ_subcategoria (nombre_subcategoria, id_categoria)
          VALUES ('OTROS', $1)
        `, [idCatOtros]);
    } else {
        idCatOtros = checkOtros.rows[0].id_categoria;
        console.log('Categoría OTROS ya existía.');
    }

    // Check if PERSONAL CERTIFICADO already exists
    const checkPers = await client.query(`SELECT id_categoria FROM sch_leangsp.tequ_categoria WHERE nombre_categoria = 'PERSONAL CERTIFICADO' AND id_empresa = $1`, [idEmpresa]);
    let idCatPers;
    if (checkPers.rowCount === 0) {
        const resCatPers = await client.query(`
          INSERT INTO sch_leangsp.tequ_categoria (nombre_categoria, id_empresa)
          VALUES ('PERSONAL CERTIFICADO', $1)
          RETURNING id_categoria
        `, [idEmpresa]);
        idCatPers = resCatPers.rows[0].id_categoria;

        const subcats = ['RIGGER', 'OPERADOR', 'PREVENCIONISTA', 'OTROS'];
        for (const sub of subcats) {
          await client.query(`
            INSERT INTO sch_leangsp.tequ_subcategoria (nombre_subcategoria, id_categoria)
            VALUES ($1, $2)
          `, [sub, idCatPers]);
        }
    } else {
        console.log('Categoría PERSONAL CERTIFICADO ya existía.');
    }

    console.log('✅ Categorías y Subcategorías aseguradas con éxito.');

    // 3. Actualizar Template 80 en tsrv_templates y encuestas tsrv_survey
    console.log('📦 Actualizando Template 80...');
    const tmplRes = await client.query('SELECT body_seed FROM tsrv_templates WHERE id_template = 80');
    if (tmplRes.rowCount > 0) {
      let seed = tmplRes.rows[0].body_seed;
      if (typeof seed === 'string') seed = JSON.parse(seed);

      (seed.segmentos || []).forEach(seg => {
        if (seg.label && seg.label.toUpperCase().includes('DATOS GENERALES')) {
          let hasComentario = false;
          (seg.attributes || []).forEach(attr => {
            const attrLabel = (attr.label || '').toUpperCase();
            if (attrLabel.includes('COMENTARIO') || attrLabel.includes('INSTRUCCIONES')) {
              attr.label = 'COMENTARIOS DEL COORDINADOR';
              attr.type = 'textField';
              attr.roles = ['SYSTEM'];
              attr.nullable = true;
              hasComentario = true;
            }
          });

          if (!hasComentario) {
            seg.attributes.push({
              label: 'COMENTARIOS DEL COORDINADOR',
              type: 'textField',
              nullable: true,
              roles: ['SYSTEM']
            });
          }
        }
      });

      await client.query('UPDATE tsrv_templates SET body_seed = $1 WHERE id_template = 80', [JSON.stringify(seed)]);
      console.log('✅ Template 80 actualizado en tsrv_templates con COMENTARIOS DEL COORDINADOR (SYSTEM textField).');
    }

    const srvRes = await client.query('SELECT id_survey, body_exec FROM tsrv_survey WHERE id_template = 80');
    for (const srv of srvRes.rows) {
      let bodyExec = srv.body_exec;
      if (typeof bodyExec === 'string') bodyExec = JSON.parse(bodyExec);

      (bodyExec.segmentos || []).forEach(seg => {
        if (seg.label && seg.label.toUpperCase().includes('DATOS GENERALES')) {
          let hasComentario = false;
          (seg.attributes || []).forEach(attr => {
            const attrLabel = (attr.label || '').toUpperCase();
            if (attrLabel.includes('COMENTARIO') || attrLabel.includes('INSTRUCCIONES')) {
              attr.label = 'COMENTARIOS DEL COORDINADOR';
              attr.type = 'textField';
              attr.roles = ['SYSTEM'];
              hasComentario = true;
            }
          });

          if (!hasComentario) {
            seg.attributes.push({
              label: 'COMENTARIOS DEL COORDINADOR',
              type: 'textField',
              nullable: true,
              roles: ['SYSTEM'],
              default: 'No especificado'
            });
          }
        }
      });

      await client.query('UPDATE tsrv_survey SET body_exec = $1 WHERE id_survey = $2', [JSON.stringify(bodyExec), srv.id_survey]);
      console.log(`✅ Survey #${srv.id_survey} actualizado a solo lectura SYSTEM.`);
    }

    await client.query('COMMIT');
    console.log('🎉 Parche completado correctamente.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error en migración:', err);
  } finally {
    client.release();
    pool.end();
  }
}

runFix();
