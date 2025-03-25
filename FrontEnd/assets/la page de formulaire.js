//Création et le placement de la section parent
const formcontaineur=document.createElement("section")
formcontaineur.classList.add("formcontaineur")
const footer=document.querySelector("footer")
footer.before(formcontaineur)
//Création et le placement du titre h2
const login=document.createElement("h2")
login.innerText="Log in"
formcontaineur.appendChild(login)
//Création et le placement du formulaire de connection
const formulairedeconnexion=document.createElement("form")
formulairedeconnexion.setAttribute("action","#")
formulairedeconnexion.setAttribute("method","post")
formcontaineur.appendChild(formulairedeconnexion)
//Création et le placement du label et input(email)
const labelemail=document.createElement("label")
labelemail.setAttribute("for","email")
labelemail.innerText="E-mail"
const inputemail=document.createElement("input")
inputemail.setAttribute("name","email")
inputemail.setAttribute("id","email")
inputemail.setAttribute("value","")
inputemail.setAttribute("type","text")
formulairedeconnexion.appendChild(labelemail)
formulairedeconnexion.appendChild(inputemail)
//Création et le placement du label et input(mdp)
const labelmdp=document.createElement("label")
labelmdp.setAttribute("for","motdepasse")
labelmdp.innerText="Mot de passe"
const inputmdp=document.createElement("input")
inputmdp.setAttribute("name","motdepasse")
inputmdp.setAttribute("id","motdepasse")
inputmdp.setAttribute("value","")
inputmdp.setAttribute("type","text")
formulairedeconnexion.appendChild(labelmdp)
formulairedeconnexion.appendChild(inputmdp)
//Création du buton pour se connecter
const inputseconnecter=document.createElement("input")
inputseconnecter.value="Se connecter"
inputseconnecter.setAttribute("type","submit")
inputseconnecter.classList.add("seconnecter")
formulairedeconnexion.appendChild(inputseconnecter)
const mdpoublie=document.createElement("a")
mdpoublie.setAttribute("href","#")
mdpoublie.innerText="Mot de passe oublié"
formulairedeconnexion.appendChild(mdpoublie)
mdpoublie.addEventListener("mouseover", () => {
    mdpoublie.classList.add("surligne")
  })
mdpoublie.addEventListener("mouseout", () => {
    mdpoublie.classList.remove("surligne")
  })