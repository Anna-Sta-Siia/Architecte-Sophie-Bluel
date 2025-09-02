/**************************************************************
 * script.js — version “démo + admin” complète
 * - Démo : modifications locales (sessionStorage) visibles
 *   jusqu’à la fermeture de l’onglet (ou retour arrière),
 *   et conservées EXACTEMENT pour UN reload après logout
 *   afin de montrer les changements en mode public.
 * - Admin : appels API réels.
 **************************************************************/

// ====== Config / rôles ======
const API_BASE = window.API_URL || 'http://localhost:5678';
const isDemo  = () => sessionStorage.getItem("role") === "demo";
const isAdmin = () => sessionStorage.getItem("role") === "admin";

// ====== Overlay démo (persistance locale dans l’onglet) ======
const DEMO_ADDS_KEY    = "demo_adds";
const DEMO_DELETES_KEY = "demo_deletes";
const DEMO_KEEP_ONCE   = "demo_keep_overlay_once"; // garder overlay 1 reload après logout

function getOverlay() {
  let adds = [], deletes = [];
  try { adds    = JSON.parse(sessionStorage.getItem(DEMO_ADDS_KEY)    || "[]"); } catch {}
  try { deletes = JSON.parse(sessionStorage.getItem(DEMO_DELETES_KEY) || "[]"); } catch {}
  return { adds, deletes };
}
function saveOverlay({adds, deletes}) {
  sessionStorage.setItem(DEMO_ADDS_KEY, JSON.stringify(adds || []));
  sessionStorage.setItem(DEMO_DELETES_KEY, JSON.stringify(deletes || []));
}
function clearOverlay() {
  sessionStorage.removeItem(DEMO_ADDS_KEY);
  sessionStorage.removeItem(DEMO_DELETES_KEY);
}
function applyOverlayTo(baseWorks) {
  const { adds, deletes } = getOverlay();
  const removed = new Set(deletes);
  const kept = baseWorks.filter(w => !removed.has(w.id));
  const additions = adds.map(a => ({
    id: a.id,
    title: a.title,
    imageUrl: a.imageDataUrl,                 // on affiche la dataURL
    category: a.category ? { ...a.category } : null,
  }));
  return [...kept, ...additions];
}

// ====== Références DOM ======
const gallery         = document.querySelector(".gallery");
const divButons       = document.createElement("div");
const loginButton     = document.querySelector(".loginButton");

const authBar         = document.getElementById("authBar");    // bandeau noir haut
const authBarText     = authBar?.querySelector("span");
const editToggle      = document.getElementById("editToggle"); // puce “modifier”

// Modale
const overlayEl       = document.getElementById("overlay");
const closeBtn        = document.querySelector(".close");
const ajouterPhotoBtn = document.getElementById("btn-ajouter-photo");
const formulaireAjout = document.querySelector(".modal-ajout");
const galerieModale   = document.querySelector(".modal-gallery");
const formAjout       = document.getElementById("form-ajout-photo");

// Inputs ajout
const photoInput      = document.getElementById("photo");
const titreInput      = document.getElementById("titre");
const categorieSelect = document.getElementById("categorie");
const validerBtn      = document.getElementById("valider");
const imageChoisie    = document.querySelector(".imagechoisi");
const previewIcone    = document.querySelector(".preview");
const elementsACacher = document.querySelector(".elements_a_cacher");

// ====== État ======
let projets = [];         // works actuellement affichés (base + overlay démo)
let baseWorks = [];       // works venant du back (sans overlay)

// ====== UI auth / affichage toolbar ======
function applyAuthUI() {
  const token  = sessionStorage.getItem("token");
  const logged = !!token;

  if (logged) {
    authBar?.classList.remove("normal");
    editToggle?.classList.remove("normal");
    loginButton?.classList.add("hidden");
    divButons.classList.add("hidden");

    if (isDemo()) {
      authBarText && (authBarText.textContent = "Mode démo — Me déconnecter");
      editToggle?.querySelector("span")?.replaceChildren(document.createTextNode("modifier (démo)"));
    } else if (isAdmin()) {
      authBarText && (authBarText.textContent = "Mode édition — Me déconnecter");
      editToggle?.querySelector("span")?.replaceChildren(document.createTextNode("modifier"));
    } else {
      authBarText && (authBarText.textContent = "Connecté — Me déconnecter");
      editToggle?.querySelector("span")?.replaceChildren(document.createTextNode("modifier"));
    }
  } else {
    authBar?.classList.add("normal");
    editToggle?.classList.add("normal");
    loginButton?.classList.remove("hidden");
    divButons.classList.remove("hidden");
  }
}
applyAuthUI();

// ====== Logout (bandeau noir) ======
authBar?.addEventListener("click", () => {
  // On conserve l’overlay pour UN reload, pour montrer les modifs en public
  sessionStorage.setItem(DEMO_KEEP_ONCE, "1");

  sessionStorage.removeItem("token");
  sessionStorage.removeItem("role");
  sessionStorage.removeItem("demo_expires_at");

  overlayEl?.classList.add("hidden");
  overlayEl?.classList.remove("overlay");

  applyAuthUI();
  location.replace(new URL("./index.html", location.href));
});

// Effacement overlay à la sortie de page, sauf juste après un logout
window.addEventListener("pagehide", () => {
  if (sessionStorage.getItem(DEMO_KEEP_ONCE) === "1") {
    sessionStorage.removeItem(DEMO_KEEP_ONCE);
    return; // on garde overlay pour un reload
  }
  clearOverlay();
});

// ====== Helpers UI ======
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

// ====== Rendu Galerie ======
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

// ====== Filtres par catégories (depuis les works réellement présents) ======
function construireBoutonsDepuisWorks(works) {
  const getCatName = (w) =>
    (w.category && w.category.name) ||
    (typeof w.category === 'string' ? w.category : null);

  divButons.classList.add("container-boutons");
  divButons.innerHTML = "";

  const btnTous = document.createElement("button");
  btnTous.innerText = "Tous";
  btnTous.classList.add("boutonsdesfiltres", "active");
  btnTous.addEventListener("click", () => {
    genererLaPage(projets);
    removeActiveClass();
    btnTous.classList.add("active");
  });
  divButons.appendChild(btnTous);

  const noms = [...new Set(works.map(getCatName).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "fr", { sensitivity: "base" })
  );

  for (const nom of noms) {
    const btn = document.createElement("button");
    btn.innerText = nom;
    btn.classList.add("boutonsdesfiltres");
    btn.addEventListener("click", () => {
      const filtres = projets.filter(p => getCatName(p) === nom);
      genererLaPage(filtres);
      removeActiveClass();
      btn.classList.add("active");
    });
    divButons.appendChild(btn);
  }
  gallery.before(divButons);
}

// ====== Chargement initial des works ======
function refreshFromBase() {
  fetch(`${API_BASE}/api/works`)
    .then(r => r.json())
    .then(data => {
      baseWorks = Array.isArray(data) ? data : [];
      projets = applyOverlayTo(baseWorks);
      genererLaPage(projets);
      construireBoutonsDepuisWorks(projets);
    })
    .catch(err => console.error("Erreur works:", err));
}
refreshFromBase();

/* ===================== Modale ===================== */
// Ouvrir
editToggle?.addEventListener("click", () => {
  overlayEl.classList.remove("hidden");
  overlayEl.classList.add("overlay");
  formulaireAjout.classList.add("hidden");
  document.querySelector(".modal").classList.remove("hidden");
  afficherGalerieDansModale();
});

// Fermer
closeBtn?.addEventListener("click", () => {
  overlayEl.classList.add("hidden");
  overlayEl.classList.remove("overlay");
  resetFormulaireAjout();
});
overlayEl?.addEventListener("click", (e) => {
  if (e.target === overlayEl) {
    overlayEl.classList.add("hidden");
    overlayEl.classList.remove("overlay");
    resetFormulaireAjout();
  }
});

// Remplir la galerie dans la modale (à partir de l’état courant “projets”)
function afficherGalerieDansModale() {
  const container = galerieModale;
  container.innerHTML = "";
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
}

// Suppression
function supprimerImage(id) {
  if (isDemo()) {
    const ov = getOverlay();
    // si l’id est un “temp id” négatif (ajout local), on l’enlève des adds
    if (id < 0) {
      ov.adds = ov.adds.filter(a => a.id !== id);
    } else {
      // sinon on marque l’id comme supprimé
      if (!ov.deletes.includes(id)) ov.deletes.push(id);
    }
    saveOverlay(ov);
    projets = applyOverlayTo(baseWorks);
    genererLaPage(projets);
    afficherGalerieDansModale();
    construireBoutonsDepuisWorks(projets);
    return;
  }

  // ADMIN : vraie suppression serveur
  fetch(`${API_BASE}/api/works/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
  })
    .then(r => {
      if (!r.ok) throw new Error("Delete failed");
      return refreshFromBase();
    })
    .then(() => afficherGalerieDansModale())
    .catch(err => console.error("Erreur suppression :", err));
}

// Passage à la vue ajout
ajouterPhotoBtn?.addEventListener("click", () => {
  galerieModale.parentElement.classList.add("hidden");
  formulaireAjout.classList.remove("hidden");
  checkForm();
  chargerCategories();
});

// Charger catégories (admin & démo → listes réelles)
function chargerCategories() {
  fetch(`${API_BASE}/api/categories`)
    .then(r => r.json())
    .then(categories => {
      categorieSelect.innerHTML = "<option value='' label=' '></option>";
      categories.forEach(cat => {
        const opt = document.createElement("option");
        opt.value = cat.id;
        opt.textContent = cat.name;
        categorieSelect.appendChild(opt);
      });
    })
    .catch(e => console.error("Erreur categories:", e));
}

// Prévisualisation & validation
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
  const titre = (titreInput.value || "").trim();
  const cat   = categorieSelect.value;
  const valid = ["image/jpeg", "image/png"];
  const ok = file && valid.includes(file.type) && file.size <= 4 * 1024 * 1024 && titre && cat;
  validerBtn.disabled = !ok;
  validerBtn.style.backgroundColor = ok ? "#1D6154" : "#A7A7A7";
}

// Ajout
formAjout?.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (isDemo()) {
    const file = photoInput.files?.[0];
    if (!file) return;

    // dataURL pour afficher localement
    const dataURL = await new Promise(res => {
      const r = new FileReader();
      r.onload = ev => res(ev.target.result);
      r.readAsDataURL(file);
    });

    // mini objet catégorie (id + name) pour filtres
    const catId = parseInt(categorieSelect.value, 10);
    const catName = categorieSelect.selectedOptions[0]?.textContent || "";
    const tempId = -Date.now(); // ID local négatif pour différencier

    const ov = getOverlay();
    ov.adds.push({
      id: tempId,
      title: (titreInput.value || "").trim(),
      imageDataUrl: dataURL,
      category: catId ? { id: catId, name: catName } : null
    });
    saveOverlay(ov);

    projets = applyOverlayTo(baseWorks);
    genererLaPage(projets);
    construireBoutonsDepuisWorks(projets);
    afficherGalerieDansModale();
    resetFormulaireAjout();
    overlayEl.classList.add("hidden");
    overlayEl.classList.remove("overlay");
    return;
  }

  // ADMIN : upload réel
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
    .then(() => {
      resetFormulaireAjout();
      overlayEl.classList.add("hidden");
      overlayEl.classList.remove("overlay");
      refreshFromBase();
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
  if (imageChoisie) {
    imageChoisie.src = "";
    imageChoisie.alt = "";
    imageChoisie.classList.add("hidden");
  }
  previewIcone?.classList.remove("hidden");
  elementsACacher?.classList.remove("hidden");
}
