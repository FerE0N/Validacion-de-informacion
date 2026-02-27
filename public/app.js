const form = document.getElementById("formRegistro");
const statusEl = document.getElementById("status");
const btnEnviar = document.getElementById("btnEnviar");

let captchaA = 0, captchaB = 0;

function setStatus(msg) {
  statusEl.textContent = msg;
}

function genCaptcha() {
  captchaA = Math.floor(Math.random() * 9) + 1;
  captchaB = Math.floor(Math.random() * 9) + 1;
  document.getElementById("captchaPregunta").textContent = `${captchaA} + ${captchaB} = ?`;
  document.getElementById("captcha").value = "";
}
genCaptcha();

function showFieldError(name, msg) {
  const el = document.querySelector(`[data-error-for="${name}"]`);
  if (el) el.textContent = msg || "";
}

function clearAllErrors() {
  document.querySelectorAll(".error").forEach(e => (e.textContent = ""));
}

// Traducción básica de mensajes HTML5
function messageFromValidity(input) {
  if (input.validity.valueMissing) return "Este campo es obligatorio.";
  if (input.validity.typeMismatch && input.type === "email") return "Escribe un correo válido (ej. nombre@dominio.com).";
  if (input.validity.patternMismatch) return "Formato inválido. Revisa el ejemplo o requisitos.";
  if (input.validity.tooShort) return `Debe tener al menos ${input.minLength} caracteres.`;
  if (input.validity.tooLong) return `Debe tener máximo ${input.maxLength} caracteres.`;
  return "Valor inválido.";
}

const passwordInput = document.getElementById("password");
const passwordReqs = {
  length: /.{8,}/,
  lower: /[a-z]/,
  upper: /[A-Z]/,
  number: /\d/,
  special: /[^A-Za-z0-9]/
};

passwordInput.addEventListener("input", (e) => {
  const val = e.target.value;
  for (const [key, regex] of Object.entries(passwordReqs)) {
    const el = document.querySelector(`[data-req="${key}"]`);
    if (el) {
      if (regex.test(val)) {
        el.classList.add("valid");
      } else {
        el.classList.remove("valid");
      }
    }
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearAllErrors();
  setStatus("");

  // 1) Validación HTML (requeridos, pattern, email)
  const inputs = Array.from(form.querySelectorAll("input"));
  let ok = true;

  for (const input of inputs) {
    // saltamos honeypot (no es requerido)
    if (input.name === "website") continue;

    if (!input.checkValidity()) {
      ok = false;
      showFieldError(input.name, messageFromValidity(input));
    }
  }

  // 2) Confirmación de contraseña (coherencia)
  const p1 = document.getElementById("password").value;
  const p2 = document.getElementById("password2").value;
  if (p1 && p2 && p1 !== p2) {
    ok = false;
    showFieldError("password2", "Las contraseñas no coinciden.");
  }

  // 3) Verificación humano (challenge-response)
  const captcha = document.getElementById("captcha").value.trim();
  if (Number(captcha) !== captchaA + captchaB) {
    ok = false;
    showFieldError("captcha", "Respuesta incorrecta. Intenta otra vez.");
    genCaptcha();
  }

  if (!ok) {
    setStatus("Corrige los campos marcados e intenta de nuevo.");
    return;
  }

  // 4) Enviar al BackEnd
  const payload = {
    nombre: document.getElementById("nombre").value.trim(),
    email: document.getElementById("email").value.trim(),
    telefono: document.getElementById("telefono").value.trim(),
    password: p1,
    password2: p2,
    terminos: document.getElementById("terminos").checked,
    website: document.getElementById("website").value.trim(), // honeypot
    captcha: Number(captcha),
    captchaExpected: captchaA + captchaB // en un sistema real, NO se manda así; se firma en servidor
  };

  btnEnviar.disabled = true;
  setStatus("Enviando...");

  try {
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      // errores por campo desde el servidor
      if (data?.errors) {
        for (const [field, msg] of Object.entries(data.errors)) {
          showFieldError(field, msg);
        }
      }
      setStatus(data?.message || "Error al registrar.");
    } else {
      setStatus("✅ Registro exitoso. (Demo)");
      form.reset();
      genCaptcha();
    }
  } catch {
    setStatus("Error de red. Revisa el servidor.");
  } finally {
    btnEnviar.disabled = false;
  }
});

// --- PANEL DE PRUEBAS (Demostración Caso 4) ---
const testBtns = document.querySelectorAll('.btn-test');

const defaultUser = {
  nombre: "Ana Pérez",
  email: "ana@dominio.com",
  telefono: "4421234567",
  password: "Password123!",
  password2: "Password123!",
  terminos: true
};

function fillForm(data) {
  document.getElementById("nombre").value = data.nombre !== undefined ? data.nombre : defaultUser.nombre;
  document.getElementById("email").value = data.email !== undefined ? data.email : defaultUser.email;
  document.getElementById("telefono").value = data.telefono !== undefined ? data.telefono : defaultUser.telefono;
  document.getElementById("password").value = data.password !== undefined ? data.password : defaultUser.password;
  document.getElementById("password2").value = data.password2 !== undefined ? data.password2 : defaultUser.password2;
  document.getElementById("terminos").checked = data.terminos !== undefined ? data.terminos : defaultUser.terminos;
  
  // Limpiar honeypot por defecto para los tests normales
  document.getElementById("website").value = data.website || "";

  // Setear captcha manualmente si se pasa
  if(data.captcha !== undefined) {
    document.getElementById("captcha").value = data.captcha;
  } else {
    document.getElementById("captcha").value = captchaA + captchaB;
  }
  
  // Triggermear el evento input en la password para que se actualice el checklist UI
  passwordInput.dispatchEvent(new Event('input'));
  clearAllErrors();
  setStatus("Test cargado. Haz clic en 'Crear cuenta' o se enviará automáticamente...");
}

testBtns.forEach(btn => {
  btn.addEventListener('click', async () => {
    // Resetear clases activas
    testBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const testId = btn.getAttribute('data-test');
    
    switch(testId) {
      // --- A) FRONTEND ---
      case 'A1': 
        // Campos vacíos
        fillForm({ nombre: "", email: "", telefono: "", password: "", password2: "", terminos: false, captcha: "" });
        break;
      case 'A2':
        // Email sin @
        fillForm({ email: "anadominio.com" });
        break;
      case 'A3':
        // Teléfono < 10 dígitos
        fillForm({ telefono: "442123456" });
        break;
      case 'A4':
        // Pass débil (sin símbolo ni mayúscula p.ej)
        fillForm({ password: "password123", password2: "password123" });
        break;
      case 'A5':
        // Pass diferente
        fillForm({ password: "Password123!", password2: "OtraPass123!" });
        break;
      case 'A6':
        // Captcha incorrecto Front
        fillForm({ captcha: "999" });
        break;

      // --- B) BACKEND ---
      case 'B_OK':
        // Usuario válido por defecto
        fillForm({});
        break;
      case 'B1':
        // Usamos el usuario por defecto (el servidor validará contra DB)
        // Se asume que previamente se hizo B_OK
        fillForm({});
        break;
      case 'B2':
        // Mismo teléfono (diferente email para provocar específicamente el error de teléfono)
        fillForm({ email: "otro@correo.com" });
        break;
      case 'B3':
        // Alterar el Request: Enviar por Fetch un payload inválido (nombre corto, email mal) saltándose HTML5
        setStatus("Realizando llamada fetch maliciosa (saltando validación FrontEnd)...");
        try {
          const res = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nombre: "A", // < 3
              email: "mal-email", // Sin formato correo
              telefono: "12", // Corto
              password: "123", // Debil
              password2: "456", // != password
              terminos: false,
              captcha: captchaA + captchaB,
              captchaExpected: captchaA + captchaB
            })
          });
          const data = await res.json();
          if(!res.ok && data.errors) {
            clearAllErrors();
            for (const [field, msg] of Object.entries(data.errors)) {
              showFieldError(field, msg);
            }
            setStatus("🚀 Validación de Backend atrapó el request alterado exitosamente.");
          }
        } catch(e) {}
        return; // Retornamos para no hacer submit manual
      case 'B4':
        // Llenar Honeypot
        fillForm({ website: "http://bot-spam.com" });
        break;
      case 'B5':
        // Mal Captcha por Request (Alterando el captcha Expected en B3 ya es lo mismo, pero para este caso el bot envía un captcha manipulado directamente)
        setStatus("Realizando llamada fetch con Captcha manipulado por bot...");
        try {
          const res = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...defaultUser, 
              captcha: 0, 
              captchaExpected: -1 // Valores inconsistentes
            })
          });
          const data = await res.json();
          if(!res.ok && data.errors) {
            clearAllErrors();
            for (const [field, msg] of Object.entries(data.errors)) {
              showFieldError(field, msg);
            }
            setStatus("🚀 Validación de Backend atrapó el Captcha manipulado exitosamente.");
          }
        } catch(e) {}
        return;
    }

    // Para casos FrontEnd e intentos de Honeypot, simulamos clic en el botón submit auto
    if(!['B3', 'B5'].includes(testId)) {
      setTimeout(() => btnEnviar.click(), 500); 
    }
  });
});

// --- TOGGLE TEST PANEL ---
const testPanel = document.getElementById("testPanel");
const btnToggleTest = document.getElementById("btnToggleTest");
const btnCloseTest = document.getElementById("btnCloseTest");

if (btnToggleTest && testPanel && btnCloseTest) {
  btnToggleTest.addEventListener("click", () => {
    testPanel.classList.toggle("open");
  });
  
  btnCloseTest.addEventListener("click", () => {
    testPanel.classList.remove("open");
  });
}