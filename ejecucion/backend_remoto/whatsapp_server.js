import crypto from 'crypto';
globalThis.crypto = crypto.webcrypto;

import express from 'express';
import cors from 'cors';
import qrcode from 'qrcode';
import pino from 'pino';
import NodeCache from 'node-cache';
import makeWASocketPkg from '@whiskeysockets/baileys';

const { default: makeWASocket, useMultiFileAuthState, makeCacheableSignalKeyStore, DisconnectReason, fetchLatestBaileysVersion, generateMessageIDV2 } = makeWASocketPkg;

const app = express();
const PORT = process.env.PORT || 3085;

app.use(cors());
app.use(express.json());

const msgRetryCounterCache = new NodeCache();
const messageCache = new NodeCache({ stdTTL: 3600 });
const sentMessagesCache = new Map();

function rememberSentMessage(id, message) {
  if (!id || !message) return;
  sentMessagesCache.set(id, message);
  messageCache.set(id, message);
  if (sentMessagesCache.size > 500) {
    const oldestKey = sentMessagesCache.keys().next().value;
    sentMessagesCache.delete(oldestKey);
  }
}

let sock = null;
let currentQr = null;
let currentQrDataUrl = null;
let connectionStatus = 'connecting';
let connectedUser = null;
let lastError = null;

const logger = pino({ level: 'warn' });

async function connectToWhatsApp() {
  try {
    if (sock) {
      try { sock.ev.removeAllListeners(); } catch (e) {}
      try { sock.ws?.close(); } catch (e) {}
    }
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      logger,
      printQRInTerminal: false,
      auth: {
        creds: state.creds,
        keys: typeof makeCacheableSignalKeyStore === 'function'
          ? makeCacheableSignalKeyStore(state.keys, logger)
          : state.keys
      },
      msgRetryCounterCache,
      syncFullHistory: false,
      markOnlineOnConnect: false,
      shouldSyncHistoryMessage: () => false,
      getMessage: async (key) => {
        if (key?.id && sentMessagesCache.has(key.id)) {
          return sentMessagesCache.get(key.id);
        }
        if (key?.id && messageCache.has(key.id)) {
          return messageCache.get(key.id);
        }
        return undefined;
      },
      browser: ['GSP Operaciones', 'Chrome', '1.0.0']
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', ({ messages }) => {
      if (!Array.isArray(messages)) return;
      for (const m of messages) {
        if (m?.key?.id && m?.message) {
          rememberSentMessage(m.key.id, m.message);
        }
      }
    });

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        currentQr = qr;
        try {
          currentQrDataUrl = await qrcode.toDataURL(qr, { width: 320, margin: 2 });
          connectionStatus = 'waiting_qr';
          console.log('[WhatsApp] Nuevo QR generado, listo para escanear.');
        } catch (e) {
          console.error('[WhatsApp] Error generando DataURL de QR:', e);
        }
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        console.log(`[WhatsApp] Conexión cerrada (status: ${statusCode}). Reconectar: ${shouldReconnect}`);
        connectionStatus = 'disconnected';
        currentQr = null;
        currentQrDataUrl = null;
        lastError = lastDisconnect?.error?.message || 'Desconectado';

        if (shouldReconnect) {
          setTimeout(connectToWhatsApp, 5000);
        } else {
          console.log('[WhatsApp] Sesión cerrada permanentemente (loggedOut). Requiere nuevo QR.');
        }
      } else if (connection === 'open') {
        connectionStatus = 'connected';
        currentQr = null;
        currentQrDataUrl = null;
        lastError = null;
        connectedUser = sock.user;
        const phone = sock.user?.id?.split(':')[0] || 'Desconocido';
        console.log(`[WhatsApp] ✅ ¡Conexión establecida exitosamente con el teléfono: +${phone}!`);
      }
    });

  } catch (err) {
    console.error('[WhatsApp] Error al inicializar socket:', err);
    connectionStatus = 'error';
    lastError = err.message;
    setTimeout(connectToWhatsApp, 8000);
  }
}

// Iniciar Baileys
connectToWhatsApp();

// --- VISTA WEB INTERACTIVA PARA ESCANEAR EL QR ---
app.get('/', (req, res) => {
  const isConnected = connectionStatus === 'connected';
  const phone = connectedUser?.id ? connectedUser.id.split(':')[0] : '';
  const userName = connectedUser?.name || 'Operaciones GSP';

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vincular WhatsApp — Grúas San Pablo</title>
  <script src="https://cdn.tailwindcss.com"></script>
  ${!isConnected ? '<meta http-equiv="refresh" content="6">' : ''}
</head>
<body class="bg-[#070b14] text-slate-100 min-h-screen flex items-center justify-center p-4 font-sans">
  <div class="max-w-md w-full bg-[#0e1628] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
    
    <!-- Encabezado -->
    <div>
      <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-2xl mb-3">
        💬
      </div>
      <h1 class="text-xl font-black tracking-wide text-white uppercase font-mono">GSP WhatsApp Service</h1>
      <p class="text-xs text-slate-400 mt-1">Conexión de Notificaciones para Operadores</p>
    </div>

    <!-- Estado: CONECTADO -->
    ${isConnected ? `
      <div class="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 space-y-3">
        <div class="text-3xl">🎉</div>
        <h2 class="text-lg font-black text-emerald-400 uppercase">¡WhatsApp Conectado!</h2>
        <p class="text-xs text-slate-300">El número vinculado está activo y listo para emitir links de Report Diario.</p>
        <div class="bg-black/40 rounded-xl p-3 text-sm font-mono font-bold text-white border border-white/5">
          📱 +${phone} <span class="text-xs text-slate-400 font-normal">(${userName})</span>
        </div>
        <div class="text-[11px] text-emerald-300 font-semibold flex items-center justify-center gap-1">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Servicio en línea en PM2
        </div>
      </div>
    ` : `
      <!-- Estado: ESPERANDO ESCANEO DE QR -->
      <div class="space-y-4">
        ${currentQrDataUrl ? `
          <div class="bg-white p-4 rounded-2xl inline-block shadow-xl border-4 border-amber-500/40">
            <img src="${currentQrDataUrl}" alt="Código QR WhatsApp" class="w-64 h-64 mx-auto block" />
          </div>
          <div class="text-left bg-black/40 border border-white/5 rounded-2xl p-4 space-y-2 text-xs text-slate-300">
            <p class="font-bold text-amber-400 flex items-center gap-1.5">
              <span>📲</span> Pasos para vincular:
            </p>
            <ol class="list-decimal pl-5 space-y-1 text-slate-300">
              <li>Abre <strong>WhatsApp</strong> en tu celular.</li>
              <li>Ve a <strong>Ajustes / Configuración ➔ Dispositivos vinculados</strong>.</li>
              <li>Toca <strong>Vincular un dispositivo</strong> y apunta tu cámara a este QR.</li>
            </ol>
          </div>
          <p class="text-[11px] text-slate-500 font-mono">Esta pantalla se actualiza automáticamente...</p>
        ` : `
          <div class="p-12 space-y-3">
            <div class="inline-block animate-spin text-3xl">⏳</div>
            <p class="text-sm font-bold text-slate-300">Generando código QR seguro...</p>
            <p class="text-xs text-slate-500">Conectando con servidores de WhatsApp...</p>
          </div>
        `}
      </div>
    `}

    <!-- Footer -->
    <div class="border-t border-white/5 pt-4 text-[10px] text-slate-500 font-mono">
      Grúas San Pablo SpA • Microservicio v1.0
    </div>

  </div>
</body>
</html>
  `;

  res.send(html);
});

// Endpoint JSON de estado
app.get('/status', (req, res) => {
  res.json({
    status: connectionStatus,
    connected: connectionStatus === 'connected',
    user: connectedUser,
    phone: connectedUser?.id ? connectedUser.id.split(':')[0] : null,
    hasQr: !!currentQr,
    lastError
  });
});

// Endpoint para enviar mensaje
app.post('/enviar', async (req, res) => {
  try {
    const { numero, mensaje } = req.body;

    if (!numero || !mensaje) {
      return res.status(400).json({ ok: false, error: 'Falta numero o mensaje' });
    }

    if (connectionStatus !== 'connected' || !sock) {
      if (lastError && (lastError.includes('Stream Errored') || lastError.includes('Connection Terminated'))) {
        console.log('[WhatsApp] Socket caído y con error previo, intentando reconexión antes de responder...');
        connectToWhatsApp();
        await new Promise(r => setTimeout(r, 4000));
      }
      if (connectionStatus !== 'connected' || !sock) {
        return res.status(503).json({ ok: false, error: 'WhatsApp no está conectado todavía' });
      }
    }

    // Normalizar teléfono chileno
    let cleanNumber = String(numero).replace(/\D/g, '');
    if (cleanNumber.length === 9 && cleanNumber.startsWith('9')) {
      cleanNumber = '56' + cleanNumber;
    } else if (cleanNumber.startsWith('569') && cleanNumber.length === 11) {
      // Formato perfecto
    }

    const jid = `${cleanNumber}@s.whatsapp.net`;
    const msgId = typeof generateMessageIDV2 === 'function' ? generateMessageIDV2(sock.user?.id) : undefined;
    if (msgId) {
      rememberSentMessage(msgId, { extendedTextMessage: { text: mensaje } });
    }

    try {
      await sock.assertSessions([jid], false);
    } catch (sessErr) {
      console.warn('[WhatsApp] Aviso en assertSessions previo:', sessErr.message);
    }

    let sent;
    try {
      sent = await sock.sendMessage(jid, { text: mensaje }, msgId ? { messageId: msgId } : undefined);
    } catch (sendErr) {
      console.warn(`[WhatsApp] Error en primer intento a ${jid} (${sendErr.message}). Recreando sesión limpia y reintentando...`);
      try {
        await sock.assertSessions([jid], true);
      } catch (forceErr) {
        console.warn('[WhatsApp] Aviso forzando recreación de sesión:', forceErr.message);
      }
      const retryMsgId = typeof generateMessageIDV2 === 'function' ? generateMessageIDV2(sock.user?.id) : undefined;
      if (retryMsgId) {
        rememberSentMessage(retryMsgId, { extendedTextMessage: { text: mensaje } });
      }
      sent = await sock.sendMessage(jid, { text: mensaje }, retryMsgId ? { messageId: retryMsgId } : undefined);
    }

    if (sent?.key?.id && sent?.message) {
      rememberSentMessage(sent.key.id, sent.message);
    }

    console.log(`[WhatsApp] Mensaje enviado exitosamente a ${cleanNumber} (ID: ${sent?.key?.id})`);
    res.json({ ok: true, id: sent?.key?.id, to: cleanNumber });

  } catch (err) {
    console.error('[WhatsApp] Error enviando mensaje:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Endpoint para forzar reconexión limpia
app.post('/reiniciar', async (req, res) => {
  try {
    console.log('[WhatsApp] Reinicio forzado de conexión solicitado...');
    connectToWhatsApp();
    res.json({ ok: true, message: 'Reconexión iniciada' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[GSP WhatsApp Service] Escuchando en puerto ${PORT}`);
});
