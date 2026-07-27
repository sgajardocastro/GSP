const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { NodeSSH } = require('node-ssh');
const { v4: uuidv4 } = require('uuid');

const connectionString = 'postgresql://usr_leangsp:usr_gsp_123@servidor.leanglobal.cl:5432/postgres';
const trabajadoresDir = 'D:\\SGajardo\\Google Drive\\Antigravity\\Grúas San Pablo\\Propuesta Gestión Operación Grúas\\Documentos ejemplo\\trabajadores';

function parseNombre(folderName) {
  const parts = folderName.trim().split(/\s+/);
  let name_frst = '';
  let name_sec = '';
  let apellido_pat = '';
  let apellido_mat = '';

  if (parts.length === 2) {
    name_frst = parts[0];
    apellido_pat = parts[1];
  } else if (parts.length === 3) {
    name_frst = parts[0];
    apellido_pat = parts[1];
    apellido_mat = parts[2];
  } else if (parts.length >= 4) {
    name_frst = parts[0];
    name_sec = parts[1];
    apellido_pat = parts[2];
    apellido_mat = parts.slice(3).join(' ');
  }

  return { name_frst, name_sec, apellido_pat, apellido_mat };
}

function generarRutDummy(index) {
  const base = 99000000 + index;
  let M = 0, S = 1;
  let T = base;
  for (; T; T = Math.floor(T / 10)) {
    S = (S + T % 10 * (9 - M++ % 6)) % 11;
  }
  const dv = S ? String(S - 1) : 'K';
  return `${base}${dv}`;
}

const MAPEO_TIPOS_DOC = [
  { nombre: 'Cédula de Identidad', obligatorio: true, dias: 30 },
  { nombre: 'Licencia de Conducir', obligatorio: true, dias: 30 },
  { nombre: 'Certificación de Competencias', obligatorio: true, dias: 30 },
  { nombre: 'Credencial de Operador/Rigger', obligatorio: true, dias: 30 },
  { nombre: 'Examen Ocupacional', obligatorio: true, dias: 30 },
  { nombre: 'Obligación de Informar (ODI) / PTS', obligatorio: true, dias: 30 },
  { nombre: 'Entrega de EPP', obligatorio: false, dias: 30 },
  { nombre: 'Contrato de Trabajo', obligatorio: false, dias: 30 },
  { nombre: 'Ficha de Ingreso', obligatorio: false, dias: 30 },
  { nombre: 'Inducción Interna GSP', obligatorio: false, dias: 30 }
];

function obtenerTipoCertificado(filename) {
  const name = filename.toLowerCase();
  if (name.includes('cedula') || name.includes('identidad') || name.includes('c.i.')) return 'Cédula de Identidad';
  if (name.includes('licencia') || name.includes('conducir') || name.includes('clase')) return 'Licencia de Conducir';
  if (name.includes('certificacion') || name.includes('competencia') || name.includes('cert.') || name.includes('izaje')) return 'Certificación de Competencias';
  if (name.includes('credencial') || name.includes('rigger') || name.includes('operador')) return 'Credencial de Operador/Rigger';
  if (name.includes('examen') || name.includes('ocup') || name.includes('ex.') || name.includes('salud') || name.includes('médico') || name.includes('medico')) return 'Examen Ocupacional';
  if (name.includes('odi') || name.includes('derecho') || name.includes('pts') || name.includes('informar')) return 'Obligación de Informar (ODI) / PTS';
  if (name.includes('epp') || name.includes('entrega')) return 'Entrega de EPP';
  if (name.includes('contrato') || name.includes('anexo')) return 'Contrato de Trabajo';
  if (name.includes('ficha') || name.includes('ingreso')) return 'Ficha de Ingreso';
  if (name.includes('induccion') || name.includes('interna') || name.includes('gsp')) return 'Inducción Interna GSP';
  return 'Otro Documento';
}

function extraerFechaVencimiento(filename) {
  const match = filename.match(/(\d{2})[-_.\s](\d{2})[-_.\s](\d{4})/);
  if (match) {
    const dia = match[1];
    const mes = match[2];
    const anio = match[3];
    return `${anio}-${mes}-${dia}`;
  }
  return null;
}

async function run() {
  const client = new Client({ connectionString });
  const ssh = new NodeSSH();

  try {
    console.log('🔌 Conectando a base de datos PostgreSQL...');
    await client.connect();
    await client.query('SET search_path TO sch_leangsp, public');
    console.log('✅ Conexión establecida.');

    console.log('🔌 Conectando por SSH al servidor Centos para subida de archivos...');
    await ssh.connect({
      host: 'servidor.leanglobal.cl',
      port: 1295,
      username: 'root',
      password: 'lgbl2025.'
    });
    console.log('✅ Conexión SSH establecida.');

    console.log('🏗️ Creando directorio remoto de documentos si no existe...');
    await ssh.execCommand('mkdir -p /u05/LeanDocs/personal');
    await ssh.execCommand('chown -R nodeadmin:nodeadmin /u05/LeanDocs/personal');

    console.log('🏗️ 1. Verificando/Creando tablas de personal...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS tsec_tipos_certificado_persona (
          id_tipo_certificado_persona SERIAL PRIMARY KEY,
          nombre_tipo character varying(150) NOT NULL UNIQUE,
          descripcion text,
          obligatorio boolean DEFAULT true,
          dias_alerta_vencimiento integer DEFAULT 30,
          estado character varying(10) DEFAULT 'Activo',
          created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS tsec_certificados_persona (
          id_certificado_persona SERIAL PRIMARY KEY,
          id_user integer NOT NULL REFERENCES tsec_users(id_user) ON DELETE CASCADE,
          id_tipo_certificado_persona integer NOT NULL REFERENCES tsec_tipos_certificado_persona(id_tipo_certificado_persona),
          entidad_emisora character varying(150) DEFAULT 'GSP',
          numero_registro character varying(100),
          fecha_emision date,
          fecha_vencimiento date,
          id_doc integer REFERENCES tfmg_file(id_doc),
          estado_validacion character varying(20) DEFAULT 'APROBADO',
          observaciones text,
          created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
          updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Estructura de BD verificada.');

    console.log('📦 2. Insertando catálogo de tipos de certificado...');
    const tiposMap = {};
    for (const t of MAPEO_TIPOS_DOC) {
      const res = await client.query(`
        INSERT INTO tsec_tipos_certificado_persona (nombre_tipo, obligatorio, dias_alerta_vencimiento, estado)
        VALUES ($1, $2, $3, 'Activo')
        ON CONFLICT (nombre_tipo) 
        DO UPDATE SET obligatorio = $2, dias_alerta_vencimiento = $3
        RETURNING id_tipo_certificado_persona, nombre_tipo
      `, [t.nombre, t.obligatorio, t.dias]);
      tiposMap[t.nombre] = res.rows[0].id_tipo_certificado_persona;
    }
    
    const resFallback = await client.query(`
      INSERT INTO tsec_tipos_certificado_persona (nombre_tipo, obligatorio, dias_alerta_vencimiento, estado)
      VALUES ('Otro Documento', false, 30, 'Activo')
      ON CONFLICT (nombre_tipo) DO UPDATE SET obligatorio = false
      RETURNING id_tipo_certificado_persona
    `);
    tiposMap['Otro Documento'] = resFallback.rows[0].id_tipo_certificado_persona;
    console.log('✅ Catálogo de certificados maestro inicializado.');

    console.log(`📁 3. Escaneando carpeta local de trabajadores: ${trabajadoresDir}`);
    if (!fs.existsSync(trabajadoresDir)) {
      throw new Error(`No existe la ruta: ${trabajadoresDir}`);
    }

    const folders = fs.readdirSync(trabajadoresDir);
    let countUsers = 0;
    let countCerts = 0;

    for (const folderName of folders) {
      const folderPath = path.join(trabajadoresDir, folderName);
      if (!fs.statSync(folderPath).isDirectory()) continue;

      countUsers++;
      const parsed = parseNombre(folderName);
      const rutDummy = generarRutDummy(countUsers);
      const emailDummy = `${parsed.name_frst.toLowerCase()}.${parsed.apellido_pat.toLowerCase()}@arriendosanpablo.cl`
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      console.log(`\n👤 [${countUsers}/32] Procesando: ${folderName}`);
      console.log(`   RUT: ${rutDummy} | Email: ${emailDummy}`);

      const checkUser = await client.query(`
        SELECT id_user FROM tsec_users 
        WHERE name_frst = $1 AND apellido_pat = $2
      `, [parsed.name_frst, parsed.apellido_pat]);

      let id_user;
      if (checkUser.rows.length > 0) {
        id_user = checkUser.rows[0].id_user;
        await client.query(`
          UPDATE tsec_users 
          SET rut = $2, email = $3, name_sec = $4, apellido_mat = $5, activo = true, id_empresa = 9
          WHERE id_user = $1
        `, [id_user, rutDummy, emailDummy, parsed.name_sec, parsed.apellido_mat]);
      } else {
        const insUser = await client.query(`
          INSERT INTO tsec_users (rut, email, name_frst, name_sec, apellido_pat, apellido_mat, codi_user, activo, id_empresa, flag_proc_enrol)
          VALUES ($1, $2, $3, $4, $5, $6, $2, true, 9, false)
          RETURNING id_user
        `, [rutDummy, emailDummy, parsed.name_frst, parsed.name_sec, parsed.apellido_pat, parsed.apellido_mat]);
        id_user = insUser.rows[0].id_user;
      }

      await client.query('DELETE FROM tsec_user_roles WHERE id_user = $1', [id_user]);
      await client.query('INSERT INTO tsec_user_roles (id_user, id_rol) VALUES ($1, 3)', [id_user]);

      const files = fs.readdirSync(folderPath);
      await client.query('DELETE FROM tsec_certificados_persona WHERE id_user = $1', [id_user]);

      for (const filename of files) {
        const filePath = path.join(folderPath, filename);
        if (fs.statSync(filePath).isDirectory()) continue;

        const tipoNombre = obtenerTipoCertificado(filename);
        const idTipoCert = tiposMap[tipoNombre];
        const fechaVence = extraerFechaVencimiento(filename);

        const internalFilename = `${uuidv4()}${path.extname(filename)}`;
        const remotePath = path.posix.join('/u05/LeanDocs/personal', internalFilename);

        console.log(`   ⬆️ Subiendo archivo real: ${filename} -> ${internalFilename}`);
        await ssh.putFile(filePath, remotePath);

        const insFile = await client.query(`
          INSERT INTO tfmg_file (tipo_doc, mimetype, name_doc_orig, name_doc_interno, path_doc, id_user, estado)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id_doc
        `, ['CERTIFICADO_PERSONA', 'application/pdf', filename, internalFilename, '/u05/LeanDocs/personal', id_user, 'ACTIVO']);

        const idDoc = insFile.rows[0].id_doc;

        await client.query(`
          INSERT INTO tsec_certificados_persona (id_user, id_tipo_certificado_persona, fecha_vencimiento, id_doc, observaciones)
          VALUES ($1, $2, $3, $4, $5)
        `, [id_user, idTipoCert, fechaVence, idDoc, `Carga inicial masiva - Archivo: ${filename}`]);

        countCerts++;
      }
      console.log(`   📄 ${files.length} documentos subidos y asociados.`);
    }

    console.log('🔑 Ajustando permisos remotos del repositorio de archivos...');
    await ssh.execCommand('chown -R nodeadmin:nodeadmin /u05/LeanDocs/personal');
    await ssh.execCommand('chmod -R 775 /u05/LeanDocs/personal');

    console.log(`\n🎉 PROCESO COMPLETADO CON ÉXITO.`);
    console.log(`👥 Total trabajadores importados/sincronizados: ${countUsers}`);
    console.log(`📄 Total certificados y vigencias cargados: ${countCerts}`);

  } catch (err) {
    console.error('\n❌ ERROR DURANTE LA IMPORTACIÓN:', err.message || err);
  } finally {
    ssh.dispose();
    await client.end();
    console.log('🔌 Conexiones cerradas.');
  }
}

run();
