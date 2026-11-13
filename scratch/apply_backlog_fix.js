const fs = require('fs');
const filePath = 'ejecucion/backend_remoto/src/controllers/backlogController.js';
let content = fs.readFileSync(filePath, 'utf8');

// 1. In ensureTables, ensure column exists
const targetEnsure = `    CREATE TABLE IF NOT EXISTS \${schema}.tcfg_backlog (
      id SERIAL PRIMARY KEY,
      codigo_req VARCHAR(50) UNIQUE,
      nombre_requerimiento VARCHAR(255) NOT NULL,
      descripcion TEXT,
      prioridad VARCHAR(20) DEFAULT 'Media',
      fecha_registro DATE DEFAULT CURRENT_DATE,
      fecha_implementacion DATE,
      solicitado_por VARCHAR(150),
      estado VARCHAR(30) DEFAULT 'Pendiente',
      creado_por VARCHAR(150),
      creado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`;

const replaceEnsure = `    CREATE TABLE IF NOT EXISTS \${schema}.tcfg_backlog (
      id SERIAL PRIMARY KEY,
      codigo_req VARCHAR(50) UNIQUE,
      nombre_requerimiento VARCHAR(255) NOT NULL,
      descripcion TEXT,
      prioridad VARCHAR(20) DEFAULT 'Media',
      fecha_registro DATE DEFAULT CURRENT_DATE,
      fecha_implementacion DATE,
      solicitado_por VARCHAR(150),
      estado VARCHAR(30) DEFAULT 'Pendiente',
      creado_por VARCHAR(150),
      adjuntos JSONB DEFAULT '[]'::jsonb,
      creado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE \${schema}.tcfg_backlog ADD COLUMN IF NOT EXISTS adjuntos JSONB DEFAULT '[]'::jsonb;`;

if (!content.includes(targetEnsure)) {
  console.error('Target 1 (ensureTables) not found!');
  process.exit(1);
}
content = content.replace(targetEnsure, replaceEnsure);

// 2. In crearRequerimiento
const targetCrear = `      const {
        nombre_requerimiento,
        descripcion,
        prioridad = 'Media',
        fecha_registro,
        fecha_implementacion,
        solicitado_por,
        estado = 'Pendiente',
        creado_por = 'Sergio Gajardo'
      } = req.body;`;

const replaceCrear = `      const {
        nombre_requerimiento,
        descripcion,
        prioridad = 'Media',
        fecha_registro,
        fecha_implementacion,
        solicitado_por,
        estado = 'Pendiente',
        creado_por = 'Sergio Gajardo',
        adjuntos = []
      } = req.body;`;

if (!content.includes(targetCrear)) {
  console.error('Target 2 (crear destructuring) not found!');
  process.exit(1);
}
content = content.replace(targetCrear, replaceCrear);

const targetInsert = `      const insertRes = await db.query(\`
        INSERT INTO \${schema}.tcfg_backlog 
          (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_registro, fecha_implementacion, solicitado_por, estado, creado_por)
        VALUES 
          ($1, $2, $3, $4, COALESCE($5, CURRENT_DATE), $6, $7, $8, $9)
        RETURNING *
      \`, [codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_registro || null, fecha_implementacion || null, solicitado_por, estado, creado_por]);`;

const replaceInsert = `      const insertRes = await db.query(\`
        INSERT INTO \${schema}.tcfg_backlog 
          (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_registro, fecha_implementacion, solicitado_por, estado, creado_por, adjuntos)
        VALUES 
          ($1, $2, $3, $4, COALESCE($5, CURRENT_DATE), $6, $7, $8, $9, $10::jsonb)
        RETURNING *
      \`, [codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_registro || null, fecha_implementacion || null, solicitado_por, estado, creado_por, JSON.stringify(adjuntos || [])]);`;

if (!content.includes(targetInsert)) {
  console.error('Target 3 (insert query) not found!');
  process.exit(1);
}
content = content.replace(targetInsert, replaceInsert);

// 3. In actualizarRequerimiento
const targetAct = `      const {
        nombre_requerimiento,
        descripcion,
        prioridad,
        fecha_registro,
        fecha_implementacion,
        solicitado_por,
        estado
      } = req.body;`;

const replaceAct = `      const {
        nombre_requerimiento,
        descripcion,
        prioridad,
        fecha_registro,
        fecha_implementacion,
        solicitado_por,
        estado,
        adjuntos
      } = req.body;`;

if (!content.includes(targetAct)) {
  console.error('Target 4 (actualizar destructuring) not found!');
  process.exit(1);
}
content = content.replace(targetAct, replaceAct);

const targetUpd = `      const updateRes = await db.query(\`
        UPDATE \${schema}.tcfg_backlog
        SET 
          nombre_requerimiento = COALESCE($1, nombre_requerimiento),
          descripcion = COALESCE($2, descripcion),
          prioridad = COALESCE($3, prioridad),
          fecha_registro = COALESCE($4, fecha_registro),
          fecha_implementacion = $5,
          solicitado_por = COALESCE($6, solicitado_por),
          estado = COALESCE($7, estado),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $8
        RETURNING *
      \`, [nombre_requerimiento, descripcion, prioridad, fecha_registro, fecha_implementacion, solicitado_por, estado, id]);`;

const replaceUpd = `      const updateRes = await db.query(\`
        UPDATE \${schema}.tcfg_backlog
        SET 
          nombre_requerimiento = COALESCE($1, nombre_requerimiento),
          descripcion = COALESCE($2, descripcion),
          prioridad = COALESCE($3, prioridad),
          fecha_registro = COALESCE($4, fecha_registro),
          fecha_implementacion = $5,
          solicitado_por = COALESCE($6, solicitado_por),
          estado = COALESCE($7, estado),
          adjuntos = CASE WHEN $8::text IS NOT NULL THEN $8::jsonb ELSE adjuntos END,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $9
        RETURNING *
      \`, [nombre_requerimiento, descripcion, prioridad, fecha_registro, fecha_implementacion, solicitado_por, estado, adjuntos !== undefined ? JSON.stringify(adjuntos) : null, id]);`;

if (!content.includes(targetUpd)) {
  console.error('Target 5 (update query) not found!');
  process.exit(1);
}
content = content.replace(targetUpd, replaceUpd);

fs.writeFileSync(filePath, content, 'utf8');
console.log('SUCCESS: backlogController.js updated cleanly!');
