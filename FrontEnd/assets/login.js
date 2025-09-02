const API_BASE = window.API_URL || 'http://localhost:5678';

// --- Identifiants DEMO ---
const DEMO_EMAIL = "demo@site.com";
const DEMO_PASS  = "123456";

const form        = document.getElementById("loginForm");
const inputEmail  = document.getElementById("email");
const inputMdp    = document.getElementById("motDePasse");
const msg         = document.getElementById("msg");

// Préremplissage (option : readOnly pour empêcher toute modif)
window.addEventListener("pageshow", () => {
  inputEmail.value = DEMO_EMAIL;
  inputMdp.value   = DEMO_PASS;
  // inputEmail.readOnly = true;   // décommente si tu veux bloquer
  // inputMdp.readOnly   = true;
  msg.textContent = "";
  msg.classList.add("hidden");
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = inputEmail.value.trim();
  const password = inputMdp.value;

  try {
    // 1) Si identifiants démo → pas d'appel réseau
    if (email === DEMO_EMAIL && password === DEMO_PASS) {
      sessionStorage.setItem("token", "DEMO_TOKEN");
      sessionStorage.setItem("role", "demo");
      // (option) date d'expiration courte
      sessionStorage.setItem("demo_expires_at", String(Date.now() + 60 * 60 * 1000));
      window.location.href = "/index.html";
      return;
    }

    // 2) Sinon → vraie connexion API
    while (!window.API_URL) await new Promise(r => setTimeout(r, 20));

    const resp = await fetch(`${window.API_URL}/api/users/login`, {
      method : "POST",
      headers: { "Content-Type": "application/json" },
      body   : JSON.stringify({ email, password })
    });

    if (!resp.ok) {
      msg.textContent = "Identifiants invalides.";
      msg.classList.remove("hidden");
      return;
    }

    const data = await resp.json();
    if (data?.token) {
      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("role", "admin");  // <- toi
      window.location.href = "/index.html";
    } else {
      msg.textContent = "Réponse inattendue du serveur.";
      msg.classList.remove("hidden");
    }
  } catch (err) {
    console.error(err);
    msg.textContent = "Erreur de connexion. Vérifie l’URL ou le serveur.";
    msg.classList.remove("hidden");
  }
});
