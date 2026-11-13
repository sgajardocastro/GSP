const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const cmd = `cd /home/nodeadmin/proyectos/lean-services-gsp && node -e '
    require("dotenv").config();
    const jwt = require("jsonwebtoken");
    const crypto = require("crypto");

    const jwtSecret = process.env.JWT_SECRET || "secret";
    const jwtEncryptSecret = process.env.JWT_ENCRYPT_SECRET || "encrypt-secret";

    function encryptToken(token, secret) {
      const cipher = crypto.createCipheriv("aes-256-cbc", crypto.scryptSync(secret, "salt", 32), Buffer.alloc(16, 0));
      let encrypted = cipher.update(token, "utf8", "hex");
      encrypted += cipher.final("hex");
      return encrypted;
    }

    const payload = {
      rut: "1-9",
      email: "leangsp@leanglobal.cl",
      nombre: "Lean GSP Admin",
      id_user: 1,
      id_empresa: 1,
      flag_proc_enrol: false,
      roles: ["ADMIN", "OPERACIONES", "CRM", "TALLER", "MANTENEDOR"]
    };

    const token = jwt.sign(payload, jwtSecret, { expiresIn: "7d" });
    const encryptedToken = encryptToken(token, jwtEncryptSecret);
    console.log("ENCRYPTED_TOKEN:" + encryptedToken);
  '`;

  const res = await ssh.execCommand(cmd);
  console.log('STDOUT:', res.stdout.trim());
  if (res.stderr) console.error('STDERR:', res.stderr.trim());
  ssh.dispose();
}

run();
