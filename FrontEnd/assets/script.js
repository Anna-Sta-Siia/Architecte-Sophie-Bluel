const gallery = document.querySelector(".gallery"); // On récupère la balise parent pour les works
let projets = []; // Tableau global pour stocker les projets

//  Vérification la mode d'acces
const cle = localStorage.getItem("token");
const justLoggedIn = sessionStorage.getItem("justLoggedIn");
const elementsModeAdmin = document.querySelectorAll(".mode")


if (cle !== null && justLoggedIn === "true") {
  // Mode admin (vraie connexion)
  elementsModeAdmin.forEach(element => {
    element.classList.remove("normal")
  });

  // On peut ensuite supprimer le marqueur pour éviter qu'il reste
  sessionStorage.removeItem("justLoggedIn");
}

// Récupération des travaux/works depuis l'API
fetch("http://localhost:5678/api/works")
  .then(response => response.json())
  .then(data => {
    projets = data; // On stocke les projets dans la variable globale
    genererLaPage(projets); // On affiche tous les projets au chargement
  })
  .catch(error => {
    console.error("Erreur lors de la récupération des travaux :", error);
  });

// Fonction pour générer la galerie 
function genererLaPage(projets) {
  gallery.innerHTML = ""; // On vide la galerie avant de la remplir
  for (let i = 0; i < projets.length; i++) {
    const figure = document.createElement("figure");
    const workImage = document.createElement("img");
    workImage.src = projets[i].imageUrl;
    workImage.alt = projets[i].title;
    const workTitle = document.createElement("figcaption");
    workTitle.innerText = projets[i].title;
    figure.dataset.category = projets[i].category.name; // On ajoute l'attribut data-category
    figure.appendChild(workImage);
    figure.appendChild(workTitle);
    gallery.appendChild(figure);
  }
}

//Récupération des catégories et création des boutons
fetch("http://localhost:5678/api/categories")
  .then(response => response.json())
  .then(categories => {
    // Création du conteneur pour les boutons
    const divButons = document.createElement("div");
    divButons.classList.add("container-boutons");

    // On crée un bouton "Tous"
    const boutonTous = document.createElement("button");
    boutonTous.innerText = "Tous";
    boutonTous.classList.add("boutonsdesfiltres");

    // Event listener bouton "Tous"
    boutonTous.addEventListener("click", () => {
      genererLaPage(projets);
      removeActiveClass();
      boutonTous.classList.add("active");
    });
    divButons.appendChild(boutonTous);

    // Création des boutons pour chaque catégorie
    categories.forEach(category => {
      const bouton = document.createElement("button");
      bouton.innerText = category.name;
      bouton.classList.add("boutonsdesfiltres");


      // Event listener pour filtrer au clic
      bouton.addEventListener("click", () => {
        console.log("Bouton cliqué :", category.name);
        const projetsFiltres = projets.filter(projet => projet.category.id === category.id);
        genererLaPage(projetsFiltres);
        // Enlève la classe active de tous les boutons
        removeActiveClass();

        // Ajoute la classe active au bouton cliqué
        bouton.classList.add("active");
      });
      divButons.appendChild(bouton);
    });
    // On place le div contenant tous les boutons avant la galerie
    gallery.before(divButons);

    function removeActiveClass() {
      const tousLesBoutons = document.querySelectorAll(".boutonsdesfiltres");
      tousLesBoutons.forEach(btn => btn.classList.remove("active"));
    }

  })
  .catch(error => {
    console.error("Erreur lors de la récupération des catégories :", error);
  });



