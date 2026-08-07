const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const axios = require('axios');
const authModel = require('../models/authModel');
const db = require('../config/dbConfig');
const POP3Client = require("node-pop3");
const querystring = require('querystring');

const jwtSecret = process.env.JWT_SECRET || 'secret';
const jwtEncryptSecret = process.env.JWT_ENCRYPT_SECRET || 'encrypt-secret';
const tokenExpiresIn = '24h';

function encryptToken(token, secret) {
  const cipher = crypto.createCipheriv('aes-256-cbc', crypto.scryptSync(secret, 'salt', 32), Buffer.alloc(16, 0));
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function verificarPOP3(email, password) {
  return new Promise((resolve, reject) => {
    let resolved = false;
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.warn(`[POP3] Timeout (1500ms) alcanzado para ${email}`);
        reject(new Error("Servidor de correo no responde. Verifique sus credenciales o use Google Login."));
      }
    }, 1500);

    try {
      console.log(`[POP3] Conectando al servidor POP3 para ${email}`);
      const client = new POP3Client(process.env.POP3_PORT || 110, process.env.POP3_HOST || 'localhost', {
        tlserrs: false,
        enabletls: true,
        debug: false,
      });

      client.on("connect", () => {
        console.log("[POP3] Conectado. Intentando login...");
        client.login(email, password);
      });

      client.on("login", (status) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          if (status) {
            console.log("[POP3] Autenticación exitosa");
            try { client.quit(); } catch(e) {}
            resolve(true);
          } else {
            console.log("[POP3] Falló autenticación");
            reject(new Error("Credenciales de correo inválidas."));
          }
        }
      });

      client.on("error", (err) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          console.error("[POP3] Error socket:", err.message);
          reject(new Error("Error al conectar con servidor de correo: " + err.message));
        }
      });
    } catch (e) {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        reject(new Error("Error al verificar credenciales: " + e.message));
      }
    }
  });
}

// Verificación de cuentas corporativas Outlook @transmac.cl mediante ROPC OAuth de Microsoft Entra
async function verificarOutlook(email, password) {
  try {
    console.log("[MS-OAUTH] Intentando autenticación Microsoft Entra para:", email);
    const postData = querystring.stringify({
      grant_type: 'password',
      username: email,
      password: password,
      client_id: 'd3590ed6-52b3-4102-aeff-aad2292ab01c', // Office Mobile
      scope: 'https://graph.microsoft.com/.default'
    });

    const response = await axios.post(
      'https://login.microsoftonline.com/organizations/oauth2/v2.0/token',
      postData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    if (response.status === 200 && response.data.access_token) {
      console.log("[MS-OAUTH] Autenticación Microsoft exitosa para:", email);
      return true;
    }
    return false;
  } catch (err) {
    console.error("[MS-OAUTH] Error en autenticación Microsoft:", err.response?.data || err.message);
    throw new Error("Credenciales corporativas de Outlook inválidas o cuenta bloqueada.");
  }
}

exports.login = async (req, res) => {
  const identifier = req.body.username || req.body.email;
  const { password } = req.body;

  console.log(`[LOGIN] Intento de login con identificador: ${identifier}`);

  if (!identifier || !password) {
    console.warn("[LOGIN] Identificador o contraseña no entregados");
    return res.status(400).json({ message: "RUT, Correo y contraseña requeridos" });
  }

  try {
    const sql = `SELECT * FROM tsec_users WHERE UPPER(rut) = UPPER($1) OR UPPER(email) = UPPER($1) OR UPPER(codi_user) = UPPER($1)`;
    const result = await db.query(sql, [identifier]);

    if (result.rows.length === 0) {
      console.warn("[LOGIN] Usuario no encontrado");
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const user = result.rows[0];
    const email = user.codi_user || user.email;

    console.log(`[LOGIN] Usuario encontrado. Email: ${email}`);

    if (email && (email.toLowerCase().endsWith('@arriendosanpablo.cl') || email.toLowerCase().endsWith('@gmail.com'))) {
      console.log(`[LOGIN] Verificando usuario de dominio GSP: ${email}`);
    }
    await verificarPOP3(user.codi_user || email, password);

    const payload = {
      rut: user.rut,
      email: user.email,
      nombre: `${user.name_frst} ${user.apellido_pat}`,
      id_user: user.id_user,
      id_empresa: user.id_empresa,
      flag_proc_enrol: user.flag_proc_enrol
    };

    const token = jwt.sign(payload, jwtSecret, { expiresIn: tokenExpiresIn });
    console.log("[JWT] Token generado");

    const encryptedToken = encryptToken(token, jwtEncryptSecret);
    console.log("[JWT] Token cifrado y listo para enviar");

    const safeUser = {
      id_user: user.id_user,
      id_empresa: user.id_empresa,
      email: user.email,
      rut: user.rut,
      name_frst: user.name_frst,
      apellido_pat: user.apellido_pat,
      flag_proc_enrol: user.flag_proc_enrol
    };

    res.status(200).json({ token: encryptedToken, user: safeUser });
  } catch (err) {
    console.error("[LOGIN] Error:", err.message);
    res.status(401).json({ message: err.message });
  }
};

exports.loginPorEmail = async (req, res) => {
  const { email, password } = req.body;

  console.log(`[LOGIN] Intento de login con EMAIL: ${email}`);

  if (!email || !password) {
    console.warn("[LOGIN] Email o contraseña no entregados");
    return res.status(400).json({ message: "Email y contraseña requeridos" });
  }

  try {
    const sql = `SELECT * FROM tsec_users WHERE LOWER(codi_user) = LOWER($1)`;
    const result = await db.query(sql, [email]);

    if (result.rows.length === 0) {
      console.warn("[LOGIN] Usuario no encontrado por email");
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const user = result.rows[0];

    console.log(`[LOGIN] Usuario encontrado. Email: ${user.codi_user}`);

    if (email && (email.toLowerCase().endsWith('@arriendosanpablo.cl') || email.toLowerCase().endsWith('@gmail.com'))) {
      console.log(`[LOGIN] Verificando usuario de dominio GSP por email: ${email}`);
    }
    await verificarPOP3(email, password);

    const payload = {
      rut: user.rut,
      email: user.email,
      nombre: `${user.name_frst} ${user.apellido_pat}`,
      id_user: user.id_user,
      id_empresa: user.id_empresa,
      flag_proc_enrol: user.flag_proc_enrol
    };

    const token = jwt.sign(payload, jwtSecret, { expiresIn: tokenExpiresIn });
    console.log("[JWT] Token generado");

    const encryptedToken = encryptToken(token, jwtEncryptSecret);
    console.log("[JWT] Token cifrado y listo para enviar");

    const safeUser = {
      id_user: user.id_user,
      id_empresa: user.id_empresa,
      email: user.email,
      rut: user.rut,
      name_frst: user.name_frst,
      apellido_pat: user.apellido_pat,
      flag_proc_enrol: user.flag_proc_enrol
    };

    res.status(200).json({ token: encryptedToken, user: safeUser });
  } catch (err) {
    console.error("[LOGIN] Error:", err.message);
    res.status(401).json({ message: err.message });
  }
};

exports.loginPorEmailInterno = async (req, res) => {
  const { email, password } = req.body;

  console.log(`[LOGIN] Intento de login con EMAIL INTERNO : ${email}`);

  if (!email || !password) {
    console.warn("[LOGIN] Email o contraseña no entregados");
    return res.status(400).json({ message: "Email y contraseña requeridos" });
  }

  try {
    const sql = `SELECT * FROM tsec_users WHERE LOWER(codi_user) = LOWER($1)`;
    const result = await db.query(sql, [email]);

    if (result.rows.length === 0) {
      console.warn("[LOGIN] Usuario no encontrado por email");
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const user = result.rows[0];

    res.status(200).json(user);
  } catch (err) {
    console.error("[LOGIN] Error:", err.message);
    res.status(401).json({ message: err.message });
  }
};

exports.getUserByEmail = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email requerido" });
  }

  try {
    console.log(`[GET USER] Buscando usuario por email: ${email}`);
    const user = await authModel.getUserByEmail(email);

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.status(200).json(user);

  } catch (err) {
    console.error("[GET USER] Error:", err.message);
    res.status(500).json({ message: "Error del servidor" });
  }
};

exports.loginGoogle = async (req, res) => {
  const { token } = req.body;

  console.log("[LOGIN GOOGLE] Intento de login con Google");

  if (!token) {
    console.warn("[LOGIN GOOGLE] Token de Google no entregado");
    return res.status(400).json({ message: "Token de Google requerido" });
  }

  try {
    const googleResp = await axios.get("https://oauth2.googleapis.com/tokeninfo", {
      params: { id_token: token },
    });

    const data = googleResp.data;
    const email = data.email;
    const audience = data.aud;

    if (!email) {
      console.warn("[LOGIN GOOGLE] No se obtuvo email desde tokeninfo");
      return res.status(400).json({ message: "No se pudo obtener el email desde Google" });
    }

    const allowedAudiences = [
      process.env.GOOGLE_CLIENT_ID,
      "961053663096-s2a3uhics25fg1h0b20ocmqlqi3tvvdu.apps.googleusercontent.com",
      "900336188439-v2jr120b65dcvbi5j26kst05ldl73uou.apps.googleusercontent.com",
      "377216762278-t19n05j9jkksqbufafs9j5pa474mu14e.apps.googleusercontent.com"
    ].filter(Boolean);

    if (!allowedAudiences.includes(audience)) {
      console.warn(
        `[LOGIN GOOGLE] Audience inválida. Esperado=${allowedAudiences.join(' o ')}, recibido=${audience}`
      );
      return res.status(401).json({ message: "Token de Google inválido (audience incorrecta)" });
    }

    const lowerEmail = String(email).toLowerCase();
    const isAllowedDomain = lowerEmail.endsWith('@arriendosanpablo.cl') || lowerEmail.endsWith('@gmail.com');
    if (!isAllowedDomain) {
      console.warn(`[LOGIN GOOGLE] Intento de acceso denegado para dominio no permitido: ${email}`);
      return res.status(403).json({ message: "Acceso denegado: solo se permiten correos @arriendosanpablo.cl y @gmail.com autorizados" });
    }

    console.log(`[LOGIN GOOGLE] Email verificado por Google: ${email}`);

    const user = await authModel.getUserByEmail(email);

    if (!user) {
      console.warn("[LOGIN GOOGLE] Usuario no encontrado en BD para ese email");
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const jwtPayload = {
      rut: user.rut,
      email: user.email,
      nombre: `${user.name_frst} ${user.apellido_pat}`,
      id_user: user.id_user,
      id_empresa: user.id_empresa,
      flag_proc_enrol: user.flag_proc_enrol
    };

    const signedToken = jwt.sign(jwtPayload, jwtSecret, { expiresIn: tokenExpiresIn });
    console.log("[LOGIN GOOGLE][JWT] Token generado");

    const encryptedToken = encryptToken(signedToken, jwtEncryptSecret);
    console.log("[LOGIN GOOGLE][JWT] Token cifrado y listo para enviar");

    const safeUser = {
      id_user: user.id_user,
      id_empresa: user.id_empresa,
      email: user.email,
      rut: user.rut,
      name_frst: user.name_frst,
      apellido_pat: user.apellido_pat,
      flag_proc_enrol: user.flag_proc_enrol
    };

    res.status(200).json({
      token: encryptedToken,
      user: safeUser
    });

  } catch (err) {
    console.error(
      "[LOGIN GOOGLE] Error al verificar token con Google:",
      err.response?.data || err.message || err
    );
    return res.status(401).json({ message: "Error en login con Google" });
  }
};