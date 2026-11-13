const notificacionService = require('../src/services/notificacionService');

async function testNotif() {
  console.log('--- Probando despacho de notificación omnicanal (Email + WhatsApp) ---');
  const res = await notificacionService.despacharNotificacion({
    evento: 'TEST_VERIFICACION_WSP',
    canales: ['EMAIL', 'WHATSAPP'],
    destinatario: {
      nombre: 'Sergio Gajardo',
      email: 'sgajardoc@gmail.com',
      telefono: '56936483259'
    },
    deepLink: {
      tipoApp: 'WEB',
      ruta: 'torre',
      params: { id_proyecto: 103, subtab: 'pendientes_edp' }
    },
    emailData: {
      asunto: '[GSP] Verificación de Notificación WhatsApp & Email',
      titulo: 'Verificación Omnicanal Exitosa',
      subtitulo: 'Sistema de Notificaciones Grúas San Pablo',
      contenido: '<p>Este mensaje confirma que el microservicio de WhatsApp y el servidor SMTP están operando de forma 100% coordinada con fallback resiliente.</p>',
      botonTexto: 'VER TORRE DE CONTROL'
    },
    wspData: {
      mensaje: '🔔 *Grúas San Pablo — Verificación de Notificaciones*\n\n¡Hola Sergio Gajardo! Tu servicio de notificaciones WhatsApp ha sido verificado con éxito y se encuentra 100% operativo con fallback HTTPS resiliente.'
    }
  });

  console.log('Resultado despacho:', JSON.stringify(res, null, 2));
}

testNotif().catch(console.error);
