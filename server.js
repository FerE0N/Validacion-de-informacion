
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir el frontend
app.use(express.static(path.join(__dirname, "public")));

// "Base de datos" en memoria (demo)
const users = new Map(); // key: email, value: user
const phones = new Set(); // para validar teléfono único

// Regex servidor (no confiar en el cliente)
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRe = /^\d{10}$/;
const passRe = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

function validateRegister(body) {
  const errors = {};

  // 1) Obligatorios
  if (!body.nombre || body.nombre.trim().length < 3) errors.nombre = "Nombre obligatorio (mínimo 3 caracteres).";
  if (!body.email) errors.email = "Correo obligatorio.";
  if (!body.telefono) errors.telefono = "Teléfono obligatorio.";
  if (!body.password) errors.password = "Contraseña obligatoria.";
  if (!body.password2) errors.password2 = "Confirma tu contraseña.";
  if (body.terminos !== true) errors.terminos = "Debes aceptar términos y condiciones.";

  // 2) Formato
  if (body.email && !emailRe.test(body.email)) errors.email = "Formato de correo inválido.";
  if (body.telefono && !phoneRe.test(body.telefono)) errors.telefono = "Teléfono inválido (10 dígitos).";
  if (body.password && !passRe.test(body.password)) {
    errors.password = "Contraseña débil (8+, mayús, minús, número y símbolo).";
  }

  // 3) Coherencia
  if (body.password && body.password2 && body.password !== body.password2) {
    errors.password2 = "Las contraseñas no coinciden.";
  }

  // 4) Datos únicos
  if (body.email && users.has(body.email.toLowerCase())) errors.email = "Este correo ya está registrado.";
  if (body.telefono && phones.has(body.telefono)) errors.telefono = "Este teléfono ya está registrado.";

  // 5) Verificación humano (demo)
  // 5.1 Honeypot: si viene lleno, asumimos bot
  if (body.website && body.website.trim().length > 0) {
    errors.website = "Actividad sospechosa detectada.";
  }

  // 5.2 Desafío-respuesta (demo simplificado)
  // En producción: el servidor debe generar y verificar sin confiar en el cliente.
  if (typeof body.captcha !== "number" || typeof body.captchaExpected !== "number" || body.captcha !== body.captchaExpected) {
    errors.captcha = "Verificación humana fallida.";
  }

  return errors;
}

app.post("/api/register", (req, res) => {
  const body = req.body ?? {};
  // Normalizar
  body.email = (body.email || "").trim().toLowerCase();
  body.telefono = (body.telefono || "").trim();

  const errors = validateRegister(body);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      message: "Validación fallida. Revisa los campos.",
      errors
    });
  }

  // "Crear" usuario (demo: NO guardes contraseñas en texto plano en sistemas reales)
  users.set(body.email, {
    nombre: body.nombre.trim(),
    email: body.email,
    telefono: body.telefono
  });
  phones.add(body.telefono);

  return res.status(201).json({ message: "Usuario registrado (demo)." });
});

app.listen(3000, () => {
  console.log("Servidor listo en http://localhost:3000");
});