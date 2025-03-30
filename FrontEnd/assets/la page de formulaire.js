
//Récupération des éléments du formulaire de connexion
const formulaireDeConnexion = document.querySelector("form")
const inputEmail = document.getElementById("email")
const inputMdp = document.getElementById("motDePasse")

formulaireDeConnexion.addEventListener("submit", (event) => {
    event.preventDefault(); // empêche le rechargement automatique

    const email = inputEmail.value;
    const password = inputMdp.value;

    fetch("http://localhost:5678/api/users/login", {//objet de configuration:
        method: "POST", // *method post pour saisir l'identifiant et le mdp
        headers: { "Content-Type": "application/json" },//*format de la charge utile pour que le serveur l'interprète correctement
        body: JSON.stringify({ email, password })//*charge utile, des données, que le serveur utilise pour "poster"
    })
        .then(response => response.json())
        .then(data => {
            if (data.token) {
                localStorage.setItem("token", data.token);
                sessionStorage.setItem("justLoggedIn", "true"); //marqueur temporaire
                window.location.href = "../index.html" // on va vers la page d’accueil
            } else {
                alert("Identifiants incorrects !")
            }
        })
        .catch(err => console.error(err))
})







