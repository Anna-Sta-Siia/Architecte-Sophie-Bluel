
//Récupération des éléments du formulaire de connexion
const formulairedeconnexion = document.querySelector("form")
const inputemail = document.getElementById("email")
const inputmdp = document.getElementById("motDePasse")

formulairedeconnexion.addEventListener("submit", (event) => {
    event.preventDefault(); // empêche le rechargement automatique

    const email = inputemail.value;
    const password = inputmdp.value;

    fetch("http://localhost:5678/api/users/login", {//objet de configuration:
        method: "POST", // *method post pour saisir l'identifiant et le mdp
        headers: { "Content-Type": "application/json" },//*format de la charge utile pour que le serveur l'interprète correctement
        body: JSON.stringify({ email, password })//*charge utile, des données, que le serveur utilise pour "poster"
    })
        .then(response => response.json())
        .then(data => {
            if (data.token) {
                localStorage.setItem("token", data.token);
                sessionStorage.setItem("justLoggedIn", "true"); // 🆕 marqueur temporaire
                window.location.href = "../index.html" // on va vers la page d’accueil
            } else {
                alert("Identifiants incorrects !")
            }
        })
        .catch(err => console.error(err))
})







