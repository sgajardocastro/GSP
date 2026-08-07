import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function migrateFiles() {
  try {
    await ssh.connect({
      host: 'servidor.leanglobal.cl',
      port: 1295,
      username: 'root',
      password: 'lgbl2025.'
    });

    console.log('🔌 Conectado vía SSH...');

    const script = `
const pool = require('./src/config/postgresPool');
const fs = require('fs');
const path = require('path');

async function migrate() {
  try {
    const targetFolder = '/u05/LeanDocs/GSP/Equipos';
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    const { rows } = await pool.query("SELECT id_doc, name_doc_interno, path_doc FROM tfmg_file WHERE path_doc = 'GSP/Equipos'");
    console.log(\`📦 Encontrados \${rows.length} registros con path_doc = 'GSP/Equipos'\`);

    for (const r of rows) {
      const oldPath = path.join('/home/nodeadmin/proyectos/lean-services-gsp', r.path_doc, r.name_doc_interno);
      const newPath = path.join(targetFolder, r.name_doc_interno);

      if (fs.existsSync(oldPath)) {
        fs.copyFileSync(oldPath, newPath);
        console.log(\`✅ Copiado \${r.name_doc_interno} -> \${targetFolder}\`);
      } else {
        console.log(\`⚠️ No existe físico en ruta antigua: \${oldPath}\`);
      }

      await pool.query("UPDATE tfmg_file SET path_doc = $1 WHERE id_doc = $2", [targetFolder, r.id_doc]);
    }
    console.log('🎉 Migración y saneamiento en BD completado.');
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
migrate();
    `;

    await ssh.execCommand(`cat << 'EOF' > /home/nodeadmin/proyectos/lean-services-gsp/migrate_temp.js\n${script}\nEOF`);
    const res = await ssh.execCommand('cd /home/nodeadmin/proyectos/lean-services-gsp && node migrate_temp.js');
    console.log(res.stdout || res.stderr);
    await ssh.execCommand('rm -f /home/nodeadmin/proyectos/lean-services-gsp/migrate_temp.js');
  } catch (err) {
    console.error('Error SSH:', err);
  } finally {
    ssh.dispose();
  }
}

migrateFiles();
