/* ================== script.js (version MAJ) ================== */

// Détecte automatiquement l’URL de l’API (local ↔ Render)
const API_BASE =
  (location.hostname === "localhost" || location.hostname === "127.0.0.1")
    ? "http://localhost:5678"
    : "https://architecte-sophie-bluel.onrender.com"; // ← remplace si ton URL Render est différente

const gallery = document.querySelector(".gallery");
let projets = [];                          // source de vérité
const divButons = document.createElement("div");

// Mode admin ?
const cle = sessionStorage.getItem("token");
const elementsModeAdmin = document.querySelectorAll(".mode");
if (cle !== null) {
  elementsModeAdmin.forEach(el => el.classList.remove("normal"));
  // Si tu veux garder les filtres même en admin, commente la ligne suivante :
  divButons.classList.add("hidden");
}

/* ================== INIT ================== */
init().catch(e => console.error("Init error:", e));

async function init() {
  await fetchWorks();
  genererLaPage(projets);
  buildCategoryButtonsFromWorks(projets);
}

/* ================== DATA ================== */
async function fetchWorks() {
  const res = await fetch(`${API_BASE}/api/works`);
  if (!res.ok) throw new Error(`GET /works -> ${res.status}`);
  projets = await res.json();
}

/* ================== GALERIE ================== */
function genererLaPage(liste) {
  gallery.innerHTML = "";
  for (const p of liste) {
    const figure = document.createElement("figure");
    const img = document.createElement("img");
    img.src = p.imageUrl;
    img.alt = p.title;

    const caption = document.createElement("figcaption");
    caption.innerText = p.title;

    figure.append(img, caption);
    gallery.appendChild(figure);
  }
}

/* ================== FILTRES (catégories depuis les works) ================== */
function buildCategoryButtonsFromWorks(works) {
  if (cle !== null) return; // masque en mode admin (enlève si tu veux les montrer)

  divButons.innerHTML = "";
  divButons.classList.add("container-boutons");

  // Bouton "Tous"
  const btnTous = document.createElement("button");
  btnTous.innerText = "Tous";
  btnTous.classList.add("boutonsdesfiltres", "active");
  btnTous.addEventListener("click", () => {
    genererLaPage(projets);
    setActive(btnTous);
  });
  divButons.appendChild(btnTous);

  // Dédoublonnage depuis les works (sécurisé)
  const map = new Map(); // id -> name
  for (const w of works) {
    const c = w.category;
    if (!c || !c.id) continue;
    if (!map.has(c.id)) map.set(c.id, c.name);
  }

  // Trie + rendu
  [...map.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.id - b.id)
    .forEach(cat => {
      const btn = document.createElement("button");
      btn.innerText = cat.name;
      btn.classList.add("boutonsdesfiltres");
      btn.addEventListener("click", () => {
        const filtres = projets.filter(p => p.category && p.category.id === cat.id);
        genererLaPage(filtres);
        setActive(btn);
      });
      divButons.appendChild(btn);
    });

  if (!divButons.parentElement) gallery.before(divButons);

  function setActive(button) {
    document.querySelectorAll(".boutonsdesfiltres")
      .forEach(b => b.classList.remove("active"));
    button.classList.add("active");
  }
}

/* ================== MODALE ================== */
const btnMode = document.querySelector("#portfolio .mode");
const overlay = document.getElementById("overlay");
const closeBtn = document.querySelector(".close");

btnMode?.addEventListener("click", () => {
  overlay.classList.remove("hidden");
  overlay.classList.add("overlay");
  formulaireAjout.classList.add("hidden"); // revient toujours à la vue 1
  document.querySelector(".modal").classList.remove("hidden");
  afficherGalerieDansModale(projets);
});

closeBtn?.addEventListener("click", () => {
  overlay.classList.add("hidden");
  overlay.classList.remove("overlay");
  resetFormulaireAjout();
});

overlay?.addEventListener("click", (event) => {
  if (event.target === overlay) {
    overlay.classList.add("hidden");
    overlay.classList.remove("overlay");
    resetFormulaireAjout();
  }
});

function afficherGalerieDansModale(liste) {
  const container = document.querySelector(".modal-gallery");
  container.innerHTML = "";

  for (const projet of liste) {
    const wrap = document.createElement("div");

    const img = document.createElement("img");
    img.src = projet.imageUrl;
    img.alt = projet.title;

    const del = document.createElement("div");
    const ico = document.createElement("i");
    ico.classList.add("fa-regular", "fa-trash-can");
    del.classList.add("btn-delete");
    del.appendChild(ico);

    del.addEventListener("click", () => supprimerImage(projet.id));

    wrap.append(img, del);
    container.appendChild(wrap);
  }

  const retourBtn = document.querySelector(".fa-arrow-left");
  if (retourBtn) {
    retourBtn.onclick = () => {
      formulaireAjout.classList.add("hidden");
      document.querySelector(".modal").classList.remove("hidden");
      resetFormulaireAjout();
    };
  }
}

function supprimerImage(id) {
  fetch(`${API_BASE}/api/works/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
  })
    .then(r => {
      if (!r.ok) throw new Error(`DELETE /works/${id} -> ${r.status}`);
      // MAJ état + UI
      projets = projets.filter(p => p.id !== id);
      genererLaPage(projets);
      buildCategoryButtonsFromWorks(projets);
      afficherGalerieDansModale(projets);
    })
    .catch(err => console.error("Erreur suppression :", err));
}

/* ================== VUE 2 : AJOUT ================== */
const ajouterPhotoBtn = document.getElementById("btn-ajouter-photo");
const formulaireAjout = document.querySelector(".modal-ajout");
const galerieModale = document.querySelector(".modal-gallery");

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
    .catch(e => console.error("Erreur /categories :", e));
}

const photoInput = document.getElementById("photo");
const titreInput = document.getElementById("titre");
const categorieSelect = document.getElementById("categorie");
const validerBtn = document.getElementById("valider");

const imageChoisie = document.querySelector(".imagechoisi");
const previewIcone = document.querySelector(".preview");
const elementsACacher = document.querySelector(".elements_a_cacher");

// Vérif IMAGE
photoInput?.addEventListener("change", () => {
  const file = photoInput.files[0];
  const valid = ["image/jpeg", "image/png"];
  if (!file || !valid.includes(file.type) || file.size > 4 * 1024 * 1024) return;

  const reader = new FileReader();
  reader.onload = (e) => {
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
  const file = photoInput.files[0];
  const titre = (titreInput.value || "").trim();
  const categorie = categorieSelect.value;
  const valid = ["image/jpeg", "image/png"];

  const ok = file && valid.includes(file.type) &&
             file.size <= 4 * 1024 * 1024 &&
             titre !== "" && categorie !== "";

  validerBtn.disabled = !ok;
  validerBtn.style.backgroundColor = ok ? "#1D6154" : "#A7A7A7";
}

// Ajout
const formAjout = document.getElementById("form-ajout-photo");
formAjout?.addEventListener("submit", (event) => {
  event.preventDefault();

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
      if (!r.ok) throw new Error("Erreur lors de l'ajout");
      return r.json();
    })
    .then(nouveau => {
      projets.push(nouveau);
      genererLaPage(projets);
      buildCategoryButtonsFromWorks(projets);
      afficherGalerieDansModale(projets);
      resetFormulaireAjout();
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
