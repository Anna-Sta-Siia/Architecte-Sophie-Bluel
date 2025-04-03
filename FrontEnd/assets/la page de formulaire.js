
// Récupération des éléments
const formulaireDeConnexion = document.querySelector("form");
const inputEmail = document.getElementById("email");
const inputMdp = document.getElementById("motDePasse");


// Dès qu'on arrive sur la page de connexion
window.addEventListener("pageshow", () => {
  
    // Et on vide les champs du formulaire
    document.getElementById("email").value = "";
    document.getElementById("motDePasse").value = "";
  });


// Lors de la soumission du formulaire
formulaireDeConnexion.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = inputEmail.value;
    const password = inputMdp.value;

    fetch("http://localhost:5678/api/users/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error("Erreur HTTP : " + response.status);
            }
            return response.json();
        })
        .then(data => {
            if (data.token) {
                sessionStorage.setItem("token", data.token);
                window.location.href = "../index.html";
            } else {
                alert("Identifiants incorrects !");
            }
        })
        .catch(err => {
            console.error(err);
            alert("Erreur lors de la connexion. Vérifie l’URL ou si le serveur est bien lancé.");
        });
});
