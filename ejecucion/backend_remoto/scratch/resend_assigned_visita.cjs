const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({ host: '138.255.103.18', username: 'root', password: 'lgbl2025.', port: 1295 });

  console.log('--- REENVIANDO NOTIFICACIÓN DE VISITA ASIGNADA PARA PROYECTO 1 ---');
  
  const scriptContent = `
    const notificacionService = require('./src/services/notificacionService');
    const pool = require('./src/config/postgresPool');

    async function reenviar() {
      const uRes = await pool.query("SELECT id_user, name_frst, apellido_pat, email, email_alternativo, movil as fono FROM tsec_users WHERE id_user = 1");
      const tecnico = uRes.rows[0];
      const tecnicoNombre = (tecnico.name_frst || '') + ' ' + (tecnico.apellido_pat || '');
      
      let resolvedEmail = tecnico.email.trim();
      if (tecnico.email_alternativo && tecnico.email_alternativo.includes('@')) {
        resolvedEmail = resolvedEmail + ', ' + tecnico.email_alternativo;
      }

      console.log('Destinatario:', resolvedEmail, 'Fono:', tecnico.fono);

      const res = await notificacionService.despacharNotificacion({
        evento: 'VISITA_TECNICA_ASIGNADA',
        canales: tecnico.fono ? ['EMAIL', 'WHATSAPP'] : ['EMAIL'],
        destinatario: {
          nombre: tecnicoNombre,
          email: resolvedEmail,
          telefono: tecnico.fono
        },
        deepLink: {
          tipoApp: 'PWA',
          ruta: 'surveys'
        },
        emailData: {
          asunto: '🛠️ Visita Técnica Asignada - GSP-2610-4851-001 (TEst prod)',
          titulo: 'Visita Técnica Asignada',
          subtitulo: 'Se te ha asignado la inspección técnica para el proyecto "TEst prod".',
          contenido: '<div style="background: #14171f; padding: 20px; border-radius: 12px; color: #fff;">' +
                     '<div><b>Cliente:</b> LeanGlobal Spa</div>' +
                     '<div><b>Proyecto:</b> TEst prod</div>' +
                     '<div><b>Ubicación:</b> Los baleares Norte, Chillan</div>' +
                     '<div><b>Especialista Asignado:</b> ' + tecnicoNombre + '</div>' +
                     '</div>',
          botonTexto: 'ABRIR EN PWA'
        },
        wspData: {
          mensaje: '🛠️ *Grúas San Pablo — Visita Técnica Asignada*\\n\\n¡Hola ' + tecnicoNombre + '! Se te ha asignado una inspección técnica en terreno para *TEst prod*.\\n\\n📲 *Abre la PWA para iniciar la inspección:*'
        }
      });

      console.log('Resultado despacho:', res);
      process.exit(0);
    }

    reenviar();
  `;

  await ssh.execCommand(`cat << 'EOF' > /home/nodeadmin/proyectos/lean-services-gsp-prod/scratch_resend.js\n${scriptContent}\nEOF`);
  const out = await ssh.execCommand('su - nodeadmin -c "cd /home/nodeadmin/proyectos/lean-services-gsp-prod && node scratch_resend.js"');
  console.log('OUTPUT:', out.stdout);
  console.log('STDERR:', out.stderr);

  ssh.dispose();
}

run();
