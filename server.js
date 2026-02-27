import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import sqlite3 from "sqlite3";

const app = express();
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inicializar SQLite
const dbPath = path.join(__dirname, "database.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("Error al abrir DB:", err);
  else {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT,
        email TEXT UNIQUE,
        telefono TEXT UNIQUE
      )
    `);
  }
});

// Servir el frontend
app.use(express.static(path.join(__dirname, "public")));

// Regex servidor (no confiar en el cliente)
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRe = /^\d{10}$/;
const passRe = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

async function validateRegister(body) {
  const errors = {};

  // 1) Obligatorios
  if (!body.nombre || body.nombre.trim().length < 3)
    errors.nombre = "Nombre obligatorio (mínimo 3 caracteres).";
  if (!body.email) errors.email = "Correo obligatorio.";
  if (!body.telefono) errors.telefono = "Teléfono obligatorio.";
  if (!body.password) errors.password = "Contraseña obligatoria.";
  if (!body.password2) errors.password2 = "Confirma tu contraseña.";
  if (body.terminos !== true)
    errors.terminos = "Debes aceptar términos y condiciones.";

  // 2) Formato
  if (body.email && !emailRe.test(body.email))
    errors.email = "Formato de correo inválido.";
  if (body.telefono && !phoneRe.test(body.telefono))
    errors.telefono = "Teléfono inválido (10 dígitos).";
  if (body.password && !passRe.test(body.password)) {
    errors.password = "Contraseña débil (8+, mayús, minús, número y símbolo).";
  }

  // 3) Coherencia
  if (body.password && body.password2 && body.password !== body.password2) {
    errors.password2 = "Las contraseñas no coinciden.";
  }

  // 4) Datos únicos (Validación contra SQLite)
  if (body.email) {
    const existingEmail = await new Promise((resolve) =>
      db.get("SELECT id FROM users WHERE email = ?", [body.email], (err, row) =>
        resolve(row),
      ),
    );
    if (existingEmail) {
      errors.email = "Este correo ya está registrado en la base de datos.";
      console.warn(
        `[LOG B1] Rechazado: Correo duplicado detectado (${body.email})`,
      );
    }
  }

  if (body.telefono) {
    const existingPhone = await new Promise((resolve) =>
      db.get(
        "SELECT id FROM users WHERE telefono = ?",
        [body.telefono],
        (err, row) => resolve(row),
      ),
    );
    if (existingPhone) {
      errors.telefono = "Este teléfono ya está registrado en la base de datos.";
      console.warn(
        `[LOG B2] Rechazado: Teléfono duplicado detectado (${body.telefono})`,
      );
    }
  }

  // 5) Verificación humano (demo)
  // 5.1 Honeypot: si viene lleno, asumimos bot
  if (body.website && body.website.trim().length > 0) {
    errors.website = "Actividad sospechosa detectada (Bot).";
    console.warn(
      `[LOG B4] Rechazado: Honeypot activado por bot (Valor llenado: ${body.website})`,
    );
  }

  // 5.2 Desafío-respuesta (demo simplificado)
  if (
    typeof body.captcha !== "number" ||
    typeof body.captchaExpected !== "number" ||
    body.captcha !== body.captchaExpected
  ) {
    errors.captcha = "Verificación humana fallida.";
    console.warn(
      `[LOG B5] Rechazado: Captcha alterado desde el Request (Enviado: ${body.captcha}, Esperado: ${body.captchaExpected})`,
    );
  }

  return errors;
}

app.post("/api/register", async (req, res) => {
  const body = req.body ?? {};
  // Normalizar
  body.email = (body.email || "").trim().toLowerCase();
  body.telefono = (body.telefono || "").trim();

  const errors = await validateRegister(body);
  if (Object.keys(errors).length > 0) {
    // Si hay errores basicos (obligatorios o de formato que debieron atraparse en UI) mostramos log B3
    const hasBasicErrors =
      errors.nombre ||
      (errors.email &&
        errors.email !==
          "Este correo ya está registrado en la base de datos.") ||
      errors.password ||
      errors.password2 ||
      errors.terminos;

    if (hasBasicErrors) {
      console.warn(
        `[LOG B3] Rechazado: Request alterado brincando el front-end (Errores: ${Object.keys(errors).join(", ")})`,
      );
    }

    return res.status(400).json({
      message: "Validación fallida. Revisa los campos.",
      errors,
    });
  }

  // Crear usuario en base de datos SQLite
  db.run(
    "INSERT INTO users (nombre, email, telefono) VALUES (?, ?, ?)",
    [body.nombre.trim(), body.email, body.telefono],
    function (err) {
      if (err) {
        console.error("Error al insertar usuario:", err);
        return res
          .status(500)
          .json({ message: "Error interno del servidor", errors: {} });
      }
      console.log(
        `[LOG OK] Usuario insertado en BD exitosamente (Email: ${body.email})`,
      );
      return res
        .status(201)
        .json({ message: "Usuario insertado en BD SQLite exitosamente." });
    },
  );
});

app.listen(3000, () => {
  console.log("Servidor listo en http://localhost:3000");
});
