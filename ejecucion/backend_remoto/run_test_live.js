const notificacionService = require('./src/services/notificacionService');

async function run() {
  console.log('🚀 Iniciando despacho unificado desde run_test_live.js...');
  const res = await notificacionService.despacharNotificacion({
    evento: 'EVT-07_TEST_DEPLOY',
    canales: ['WHATSAPP', 'EMAIL'],
    destinatario: {
      nombre: 'Sergio Gajardo',
      telefono: '+56936483259',
      email: 'sgajardo@leanglobal.cl'
    },
    deepLink: {
      tipoApp: 'WEB',
      ruta: 'crm',
      params: { id_proyecto: 94, subtab: 'liquidacion', paso: 'its' }
    },
    emailData: {
      asunto: '[GSP] Verificación Live: Sistema de Notificaciones Omnicanal v1.0.50',
      titulo: 'V°B° de ITS Requerido — OT GSP-2609-370-005',
      subtitulo: 'Hola Sergio, este es un despacho real de verificación del sistema omnicanal.',
      contenido: '<p>Se ha completado la liquidación de la OT <strong>GSP-2609-370-005</strong> (Obra <em>Los poetas</em> - Besalco). Pulsa el botón para acceder directamente al ITS en el CRM.</p>',
      botonTexto: 'REVISAR Y VISAR ITS'
    },
    wspData: {
      mensaje: '🏗️ *Grúas San Pablo — Verificación Omnicanal v1.0.50*\n\n¡Hola *Sergio*! El sistema de notificaciones unificado con deep linking ha sido desplegado exitosamente en DEV.\n\n📄 *OT:* GSP-2609-370-005\n🏢 *Cliente:* BESALCO CONSTRUCCIONES S.A.\n📍 *Obra:* Los poetas\n\n📲 *Accede directamente al ITS con tu sesión preservada:*'
    }
  });

  console.log('✅ RESULTADO DEL DESPACHO:', JSON.stringify(res, null, 2));
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Error en despacho de prueba:', err);
  process.exit(1);
});
