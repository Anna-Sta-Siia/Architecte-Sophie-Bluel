const API_BASE = window.API_URL || 'http://localhost:5678';
// Récupération des éléments
const formulaireDeConnexion = document.querySelector("form");
const inputEmail = document.getElementById("email");
const inputMdp = document.getElementById("motDePasse");
const messageDErreur = document.createElement("p");
messageDErreur.classList.add("message-erreur");
messageDErreur.classList.add("hidden")
const boutonDeSubmit = document.querySelector(".seconnecter");
boutonDeSubmit.before(messageDErreur);

// Réinitialisation du formulaire à l’arrivée
window.addEventListener("pageshow", () => {
    inputEmail.value = "";
    inputMdp.value = "";
});

// Lors de la soumission du formulaire
formulaireDeConnexion.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = inputEmail.value;
    const password = inputMdp.value;

    try {
        // 🟢 On attend que window.API_URL soit défini (config.js l’ajoute en async)
        while (!window.API_URL) {
            await new Promise(r => setTimeout(r, 20));
        }

        const response = await fetch(`${window.API_URL}/api/users/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            messageDErreur.textContent = "Le mot de passe est incorrect. Veuillez réessayer.";
            return;
        }

        const data = await response.json();
        if (data.token) {
            messageDErreur.textContent = ""; // tout est bon
            sessionStorage.setItem("token", data.token);
            window.location.href = "../index.html"; 
        }
    } catch (err) {
        console.error(err);
        messageDErreur.textContent = "Erreur de connexion. Vérifie l’URL ou le serveur.";
    }
});

// Dès que l’utilisateur modifie le mot de passe → on efface l'erreur
inputMdp.addEventListener("input", () => {
    messageDErreur.textContent = "";
});
