// ===== Config API (local vs Render) =====
const API_BASE = window.location.hostname.includes('github.io')
  ? 'https://architecte-sophie-bluel.onrender.com'   // ton Render
  : 'http://localhost:5678';                          // dev local

// ===== Références & états =====
const gallery = document.querySelector(".gallery");
let projets = []; // tous les works en mémoire
const divButons = document.createElement("div");

// Mode admin : masque les filtres
const token = sessionStorage.getItem("token");
const elementsModeAdmin = document.querySelectorAll(".mode");
if (token) {
  elementsModeAdmin.forEach(el => el.classList.remove("normal"));
  divButons.classList.add("hidden");
}

// ===== Helpers =====
function removeActiveClass() {
  document.querySelectorAll(".boutonsdesfiltres")
    .forEach(btn => btn.classList.remove("active"));
}

function fallbackIfBroken(imgEl) {
  imgEl.addEventListener("error", () => {
    imgEl.src = "assets/icons/image-placeholder.png";
    imgEl.alt = "Image manquante";
  });
}

// ===== Rendu de la galerie =====
function genererLaPage(liste) {
  gallery.innerHTML = "";
  for (const w of liste) {
    const figure = document.createElement("figure");
    const img = document.createElement("img");
    img.src = w.imageUrl;
    img.alt = w.title || "";
    fallbackIfBroken(img);

    const caption = document.createElement("figcaption");
    caption.innerText = w.title || "";

    figure.appendChild(img);
    figure.appendChild(caption);
    gallery.appendChild(figure);
  }
}

// ===== Boutons de catégories (extraits des works) =====
function construireBoutonsDepuisWorks(works) {
  // conteneur
  divButons.classList.add("container-boutons");
  divButons.innerHTML = "";

  // bouton Tous
  const boutonTous = document.createElement("button");
  boutonTous.innerText = "Tous";
  boutonTous.classList.add("boutonsdesfiltres", "active");
  boutonTous.addEventListener("click", () => {
    genererLaPage(projets);
    removeActiveClass();
    boutonTous.classList.add("active");
  });
  divButons.appendChild(boutonTous);

  // collecte catégories SANS planter si category est manquante
  const idSet = new Set();
  const listeDesCategories = [];
  for (const w of works) {
    // on supporte soit w.category {id,name}, soit w.categoryId (au cas où)
    const id = (w.category && w.category.id) || w.categoryId;
    const name = (w.category && w.category.name) || null;
    if (!id || !name) continue; // on ignore les entrées incomplètes
    if (!idSet.has(id)) {
      idSet.add(id);
      listeDesCategories.push({ id, name });
    }
  }

  // si aucune catégorie valide → on ne montre que "Tous"
  if (!listeDesCategories.length) {
    gallery.before(divButons);
    return;
  }

  // tri
  listeDesCategories.sort((a, b) => a.id - b.id);

  // création des boutons
  for (const cat of listeDesCategories) {
    const btn = document.createElement("button");
    btn.innerText = cat.name;
    btn.classList.add("boutonsdesfiltres");
    btn.addEventListener("click", () => {
      const filtres = projets.filter(p =>
        (p.category && p.category.id === cat.id) || p.categoryId === cat.id
      );
      genererLaPage(filtres);
      removeActiveClass();
      btn.classList.add("active");
    });
    divButons.appendChild(btn);
  }

  gallery.before(divButons);
}

// ===== Chargement initial =====
fetch(`${API_BASE}/api/works`)
  .then(r => r.json())
  .then(data => {
    projets = data;
    genererLaPage(projets);
    construireBoutonsDepuisWorks(projets);
  })
  .catch(err => console.error("Erreur works:", err));

/* ===================== Modale / Admin ===================== */
const btnMode = document.querySelector("#portfolio .mode");
const overlay = document.getElementById("overlay");
const closeBtn = document.querySelector(".close");

const ajouterPhotoBtn = document.getElementById("btn-ajouter-photo");
const formulaireAjout = document.querySelector(".modal-ajout");
const galerieModale = document.querySelector(".modal-gallery");
const formAjout = document.getElementById("form-ajout-photo");

const photoInput = document.getElementById("photo");
const titreInput = document.getElementById("titre");
const categorieSelect = document.getElementById("categorie");
const validerBtn = document.getElementById("valider");
const imageChoisie = document.querySelector(".imagechoisi");
const previewIcone = document.querySelector(".preview");
const elementsACacher = document.querySelector(".elements_a_cacher");

// ouvrir/fermer
btnMode?.addEventListener("click", () => {
  overlay.classList.remove("hidden");
  overlay.classList.add("overlay");
  formulaireAjout.classList.add("hidden");
  document.querySelector(".modal").classList.remove("hidden");
  afficherGalerieDansModale(projets);
});

closeBtn?.addEventListener("click", () => {
  overlay.classList.add("hidden");
  overlay.classList.remove("overlay");
  resetFormulaireAjout();
});

overlay?.addEventListener("click", (e) => {
  if (e.target === overlay) {
    overlay.classList.add("hidden");
    overlay.classList.remove("overlay");
    resetFormulaireAjout();
  }
});

async function afficherGalerieDansModale(projetsCourants) {
  const container = document.querySelector(".modal-gallery");
  container.innerHTML = "";

  // recharge les works (ça évite de montrer des choses obsolètes)
  try {
    const res = await fetch(`${API_BASE}/api/works`);
    projets = await res.json();
    genererLaPage(projets);
  } catch (e) {
    console.error("Erreur lors du rechargement works:", e);
  }

  for (const projet of projets) {
    const wrap = document.createElement("div");
    const img = document.createElement("img");
    img.src = projet.imageUrl;
    img.alt = projet.title || "";
    fallbackIfBroken(img);

    const del = document.createElement("div");
    del.classList.add("btn-delete");
    const i = document.createElement("i");
    i.classList.add("fa-regular", "fa-trash-can");
    del.appendChild(i);

    del.addEventListener("click", () => supprimerImage(projet.id));

    wrap.appendChild(img);
    wrap.appendChild(del);
    container.appendChild(wrap);
  }

  document.querySelector(".fa-arrow-left")?.addEventListener("click", () => {
    formulaireAjout.classList.add("hidden");
    document.querySelector(".modal").classList.remove("hidden");
    resetFormulaireAjout();
  });
}

function supprimerImage(id) {
  fetch(`${API_BASE}/api/works/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
  })
    .then(r => {
      if (!r.ok) throw new Error("Delete failed");
      projets = projets.filter(p => p.id !== id);
      genererLaPage(projets);
      construireBoutonsDepuisWorks(projets);
      afficherGalerieDansModale(projets);
    })
    .catch(err => console.error("Erreur suppression :", err));
}

// passage vue ajout
ajouterPhotoBtn?.addEventListener("click", () => {
  galerieModale.parentElement.classList.add("hidden");
  formulaireAjout.classList.remove("hidden");
  checkForm();
  chargerCategories();
});

function chargerCategories() {
  fetch(`${API_BASE}/api/categories`)
    .then(r => r.json())
    .then(categories => {
      const select = document.getElementById("categorie");
      select.innerHTML = "<option value='' label=' '></option>";
      categories.forEach(cat => {
        const opt = document.createElement("option");
        opt.value = cat.id;
        opt.textContent = cat.name;
        select.appendChild(opt);
      });
    })
    .catch(e => console.error("Erreur categories:", e));
}

// Prévisualisation & validation formulaire
photoInput?.addEventListener("change", () => {
  const file = photoInput.files?.[0];
  const valid = ["image/jpeg", "image/png"];
  if (!file || !valid.includes(file.type) || file.size > 4 * 1024 * 1024) return;

  const reader = new FileReader();
  reader.onload = e => {
    imageChoisie.src = e.target.result;
    imageChoisie.alt = file.name;
    imageChoisie.classList.remove("hidden");
    previewIcone.classList.add("hidden");
    elementsACacher.classList.add("hidden");
    checkForm();
  };
  reader.readAsDataURL(file);
});

titreInput?.addEventListener("input", checkForm);
categorieSelect?.addEventListener("change", checkForm);

function checkForm() {
  const file = photoInput.files?.[0];
  const titre = titreInput.value.trim();
  const cat = categorieSelect.value;
  const valid = ["image/jpeg", "image/png"];
  const ok = file && valid.includes(file.type) && file.size <= 4 * 1024 * 1024 && titre && cat;
  validerBtn.disabled = !ok;
  validerBtn.style.backgroundColor = ok ? "#1D6154" : "#A7A7A7";
}

formAjout?.addEventListener("submit", (e) => {
  e.preventDefault();
  const fd = new FormData();
  fd.append("image", photoInput.files[0]);
  fd.append("title", titreInput.value);
  fd.append("category", categorieSelect.value);

  fetch(`${API_BASE}/api/works`, {
    method: "POST",
    headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
    body: fd
  })
    .then(r => {
      if (!r.ok) throw new Error("Erreur ajout");
      return r.json();
    })
    .then(nouveau => {
      projets.push(nouveau);
      genererLaPage(projets);
      construireBoutonsDepuisWorks(projets);
      afficherGalerieDansModale(projets);
      resetFormulaireAjout();
      overlay.classList.add("hidden");
      overlay.classList.remove("overlay");
    })
    .catch(err => {
      console.error(err);
      alert("Une erreur est survenue lors de l'ajout.");
    });
});

function resetFormulaireAjout() {
  formAjout?.reset();
  validerBtn.disabled = true;
  validerBtn.style.backgroundColor = "#A7A7A7";
  imageChoisie.src = "";
  imageChoisie.alt = "";
  imageChoisie.classList.add("hidden");
  previewIcone.classList.remove("hidden");
  elementsACacher.classList.remove("hidden");
}
