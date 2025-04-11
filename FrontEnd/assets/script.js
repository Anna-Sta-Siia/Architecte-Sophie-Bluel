const gallery = document.querySelector(".gallery"); // On récupère la balise parent pour les works
let projets = []; // Tableau global pour stocker les projets

// Création du conteneur pour les boutons
const divButons = document.createElement("div");

//  Vérification la mode d'acces
const cle = sessionStorage.getItem("token");
const elementsModeAdmin = document.querySelectorAll(".mode");


if (cle !== null) {
  // Mode admin 
  elementsModeAdmin.forEach(element => {
    element.classList.remove("normal")//pas admin
    divButons.classList.add("hidden")
  });

}

// Récupération des works depuis l'API
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
    //figure.dataset.category = projets[i].category.name; // On ajoute l'attribut data-category
    figure.appendChild(workImage);
    figure.appendChild(workTitle);
    gallery.appendChild(figure);
  }
}
// Récupération des catégories depuis works et création des boutons
fetch("http://localhost:5678/api/works")
  .then(response => response.json())
  .then(works => {
    divButons.classList.add("container-boutons");

    const boutonTous = document.createElement("button");
    boutonTous.innerText = "Tous";
    boutonTous.classList.add("boutonsdesfiltres");

    boutonTous.addEventListener("click", () => {
      genererLaPage(projets);
      removeActiveClass();
      boutonTous.classList.add("active");
    });
    divButons.appendChild(boutonTous);

    // --- On combine Set et tableau pour garder les objets complets ---
    const idSet = new Set();
    const listeDesCategories = [];

    works.forEach(work => {
      const id = work.category.id;
      const name = work.category.name;

      if (!idSet.has(id)) {
        idSet.add(id);
        listeDesCategories.push({ id, name });
      }
    });

    // --- Tri du tableau par ID ---
    listeDesCategories.sort((a, b) => a.id - b.id);

    // --- Création des boutons triés ---
    listeDesCategories.forEach(category => {
      const bouton = document.createElement("button");
      bouton.innerText = category.name;
      bouton.classList.add("boutonsdesfiltres");

      bouton.addEventListener("click", () => {
        const projetsFiltres = projets.filter(projet => projet.category.id === category.id);
        genererLaPage(projetsFiltres);
        removeActiveClass();
        bouton.classList.add("active");
      });

      divButons.appendChild(bouton);
    });

    gallery.before(divButons);

    function removeActiveClass() {
      document.querySelectorAll(".boutonsdesfiltres")
              .forEach(btn => btn.classList.remove("active"));
    }
  })
  .catch(error => {
    console.error("Erreur lors de la récupération des travaux(categories):", error);
  });

//*Afficher la modale au clic *//
const btnMode = document.querySelector("#portfolio .mode");
const overlay = document.getElementById("overlay");
const closeBtn = document.querySelector(".close");

btnMode.addEventListener("click", () => {
  overlay.classList.remove("hidden");
  overlay.classList.add("overlay");
  formulaireAjout.classList.add("hidden"); // revient toujours à la vue 1
  document.querySelector(".modal").classList.remove("hidden");
  afficherGalerieDansModale(projets);
});

closeBtn.addEventListener("click", () => {
  overlay.classList.add("hidden");
  overlay.classList.remove("overlay");
  resetFormulaireAjout(); //on vide le formulaire
});

// Fermer la modale en cliquant en dehors
overlay.addEventListener("click", (event) => {
  if (event.target === overlay) {
    overlay.classList.add("hidden");
    overlay.classList.remove("overlay");
    resetFormulaireAjout(); //on vide le formulaire
  }
});

async function afficherGalerieDansModale(projets) {
  const container = document.querySelector(".modal-gallery");
  container.innerHTML = ""; // vider l'ancienne galerie

  // Récupération des travaux/works depuis l'API
  await fetch("http://localhost:5678/api/works")
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

    // On ajoute l'événement de suppression
    deleteBtn.addEventListener("click", () => {
      supprimerImage(projet.id);
    });
    container.appendChild(modalElement);
  };

  const retourBtn = document.querySelector(".fa-arrow-left");

  retourBtn.addEventListener("click", () => {
    formulaireAjout.classList.add("hidden");
    document.querySelector(".modal").classList.remove("hidden");

    resetFormulaireAjout(); //on vide le formulaire
  });


  function supprimerImage(id) {
    // 1. Envoyer une requête DELETE à l’API pour supprimer l’image avec cet id
    fetch(`http://localhost:5678/api/works/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("token")}`, // le token d'admin
      }
    })

      // 2. Si la suppression a fonctionné
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
// On passe à la deuxième vue

const ajouterPhotoBtn = document.getElementById("btn-ajouter-photo");
const formulaireAjout = document.querySelector(".modal-ajout");
const galerieModale = document.querySelector(".modal-gallery");


ajouterPhotoBtn.addEventListener("click", () => {
  galerieModale.parentElement.classList.add("hidden");
  formulaireAjout.classList.remove("hidden");
  checkForm(); // Lancer la vérification dès le début
  chargerCategories(); //on charge les catégories de l'API
});

function chargerCategories() {
  fetch("http://localhost:5678/api/categories")
    .then(response => response.json())
    .then(categories => {
      const select = document.getElementById("categorie");
      //On vide le <select> avant d'ajouter de nouvelles options
      select.innerHTML = "<option value='' label=' '></option>";
      categories.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat.id;
        option.textContent = cat.name;
        select.appendChild(option);
      });
    });
}
const photoInput = document.getElementById("photo");
const titreInput = document.getElementById("titre");
const categorieSelect = document.getElementById("categorie");
const validerBtn = document.getElementById("valider");

const imageChoisie = document.querySelector(".imagechoisi");
const previewIcone = document.querySelector(".preview");
const elementsACacher = document.querySelector(".elements_a_cacher");

// 1. Vérifie la photo au changement
photoInput.addEventListener("change", () => {
  const file = photoInput.files[0];// 1 photo choisie
  const validTypes = ["image/jpeg", "image/png"];//la liste des formats acceptés

  if (!file) {//si rien est choici
    return;
  }

  if (!validTypes.includes(file.type)) {//si le format n'est pas correct
    return;
  }

  if (file.size > 4 * 1024 * 1024) {//si le fichier est trop lourd
    return;
  }

  // Tout est bon, on affiche l’image
  const reader = new FileReader();// File Reader c'est un outil de JS
  reader.onload = function (event) {//ici on dit, qu'une fois le fichier est lu(unload), on lance la focntion
    imageChoisie.src = event.target.result;
    imageChoisie.alt = file.name;

    imageChoisie.classList.remove("hidden");
    previewIcone.classList.add("hidden");
    elementsACacher.classList.add("hidden");

    checkForm(); // on vérifie si tout est prêt
  };
  reader.readAsDataURL(file);
});

// 2. Vérifie le titre à chaque changement
titreInput.addEventListener("input", () => {
  if (titreInput.value.trim() !== "") {
    checkForm();
  }
});

// 3. Vérifie la catégorie à chaque changement
categorieSelect.addEventListener("change", () => {
  if (categorieSelect.value !== "") {
    checkForm();
  }

});

// 4. Active le bouton uniquement si tout est OK
function checkForm() {
  const file = photoInput.files[0];
  const titre = titreInput.value.trim();
  const categorie = categorieSelect.value;

  const validTypes = ["image/jpeg", "image/png"];
  const isValid = file &&
    validTypes.includes(file.type) &&
    file.size <= 4 * 1024 * 1024 &&
    titre !== "" &&
    categorie !== "";

  validerBtn.disabled = !isValid;
  validerBtn.style.backgroundColor = isValid ? "#1D6154" : "#A7A7A7";//opérateur ternaire
}

//Ajouter une photo

const formAjout = document.getElementById("form-ajout-photo");

formAjout.addEventListener("submit", (event) => {
  event.preventDefault(); // Empêche le rechargement de la page

  const formData = new FormData();//création d'un objet Formadata pour envoyer la photo + le texte à l'API
  formData.append("image", photoInput.files[0]);
  formData.append("title", titreInput.value);
  formData.append("category", categorieSelect.value); //


  fetch("http://localhost:5678/api/works", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sessionStorage.getItem("token")}`
    },
    body: formData
  })
    .then(response => {
      if (!response.ok) {
        throw new Error("Erreur lors de l'ajout");
      }
      return response.json();
    })
    .then(nouveauProjet => {
      // 1. Ajouter à la liste existante
      projets.push(nouveauProjet); //on ajoute le nouveau projet renvoyé par l’API dans notre tableau projets

      // 2. Mettre à jour la galerie principale et la modale
      genererLaPage(projets);
      afficherGalerieDansModale(projets);

      //  3. Réinitialiser et fermer le formulaire
      resetFormulaireAjout()
      formulaireAjout.classList.add("hidden");
      overlay.classList.add("hidden");
      overlay.classList.remove("overlay");
    })
    .catch(err => {
      console.error(err);
      alert("Une erreur est survenue lors de l'ajout.");
    });
});
function resetFormulaireAjout() {
  formAjout.reset();
  validerBtn.disabled = true;
  validerBtn.style.backgroundColor = "#A7A7A7";

  imageChoisie.src = "";
  imageChoisie.alt = "";
  imageChoisie.classList.add("hidden");
  previewIcone.classList.remove("hidden");
  elementsACacher.classList.remove("hidden");
}

