import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function run() {
  try {
    await ssh.connect({
      host: 'servidor.leanglobal.cl',
      port: 1295,
      username: 'root',
      password: 'lgbl2025.'
    });

    const remoteDir = '/home/nodeadmin/proyectos/lean-services-gsp';
    const fs = await import('fs');
    const sql = fs.readFileSync('../bd/fix_fn_chk_cierre_ot.sql', 'utf8');
    
    // Write apply script
    const script = `
      const pool = require('./src/config/postgresPool');
      async function run() {
        try {
          await pool.query(\`${sql.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`);
          console.log('✅ Trigger fn_chk_cierre_ot corregido exitosamente.');
        } catch(e) {
          console.error('Error aplicando trigger fix:', e);
        } finally {
          await pool.end();
        }
      }
      run();
    `;
    await ssh.execCommand(`cat << 'EOF' > ${remoteDir}/apply_trigger_fix.js\n${script}\nEOF`);
    const res = await ssh.execCommand('node apply_trigger_fix.js', { cwd: remoteDir });
    console.log(res.stdout);
    if (res.stderr) console.error('STDERR:', res.stderr);
    await ssh.execCommand(`rm -f ${remoteDir}/apply_trigger_fix.js`);
  } catch (err) {
    console.error('SSH Error:', err);
  } finally {
    ssh.dispose();
  }
}

run();
