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

//*Afficher la modale au clic *//
const btnMode = document.querySelector("#portfolio .mode");
const overlay = document.getElementById("overlay");
const closeBtn = document.querySelector(".close");

btnMode.addEventListener("click", () => {
  overlay.classList.remove("hidden");
  overlay.classList.add("overlay");
  afficherGalerieDansModale(projets);
});

closeBtn.addEventListener("click", () => {
  overlay.classList.add("hidden");
  overlay.classList.remove("overlay");
});

// Fermer la modale en cliquant en dehors
overlay.addEventListener("click", (event) => {
  if (event.target === overlay) {
    overlay.classList.add("hidden");
    overlay.classList.remove("overlay");
  }
});

function afficherGalerieDansModale(projets) {
  const container = document.querySelector(".modal-gallery");
  container.innerHTML = ""; // vider l'ancienne galerie

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
  for (let i = 0; i < projets.length; i++) {
    const projet = projets[i];
    const modalElement = document.createElement("div");
    const modalImage = document.createElement("img");
    modalImage.src = projet.imageUrl;
    modalImage.alt = projet.title;
    const deleteBtn = document.createElement("div");
    const deleteBtnIcon = document.createElement("i");
    deleteBtnIcon.classList.add("fa-regular", "fa-trash-can");
    deleteBtn.classList.add("btn-delete");
    deleteBtn.appendChild(deleteBtnIcon);
    modalElement.appendChild(modalImage);
    modalElement.appendChild(deleteBtn);

    // Ici, on ajoute l'événement de suppression
    deleteBtn.addEventListener("click", () => {
      supprimerImage(projet.id);
    });
    container.appendChild(modalElement);
  };



  function supprimerImage(id) {
    // 1. Envoyer une requête DELETE à l’API pour supprimer l’image avec cet id
    fetch(`http://localhost:5678/api/works/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`, // le token d'admin
      }
    })

      // 2. Si la suppression a fonctionné...
      .then(response => {
        if (response.ok) {
          // 3. On enlève ce projet du tableau "projets"
          projets = projets.filter(projet => projet.id !== id);

          // 4. On met à jour la galerie principale sur la page
          genererLaPage(projets);

          // 5. Et on recharge la galerie dans la modale
          afficherGalerieDansModale(projets);
        }
      })

      // 6. Si erreur, on l'affiche dans la console
      .catch(err => console.error("Erreur suppression :", err));
  }
}
