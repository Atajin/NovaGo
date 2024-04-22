document.addEventListener("DOMContentLoaded", function () {
    let nombre_voyages = 0;
    let nombre_billets = 0;
    let nombre_argent = 0;
    let lettreCodes = {}; // Tableau pour stocker les lettres pour chaque ID de voyage

    let voyagesTotal = document.getElementById('nombre_voyages');
    let billetsTotal = document.getElementById('nombre_billets');
    let montantTotal = document.getElementById('nombre_argents');
    voyagesTotal.textContent = nombre_voyages;
    billetsTotal.textContent = nombre_billets;
    montantTotal.textContent = nombre_argent + "$";

    voyagesData.forEach(voyage => {
        lettreCodes[voyage.ID_VOYAGE] = 'E'; // Initialisation de la lettre pour chaque ID de voyage
        const addBtns = document.querySelectorAll("#add_btn_" + voyage.ID_VOYAGE);

        addBtns.forEach(function (btn) {
            btn.addEventListener("click", function () {
                let parentDiv = document.querySelector(".conteneur-panier");

                let voyagePrix = document.getElementById('prix_' + voyage.ID_VOYAGE);
                let nouveauPrix = parseInt(voyagePrix.textContent);

                let existingElement = document.querySelector(".conteneur-panier #element_" + voyage.ID_VOYAGE + "_prix" + nouveauPrix);

                if (!existingElement) {
                    let voyageCode = "Code " + voyage.ID_VOYAGE + "." + lettreCodes[voyage.ID_VOYAGE]; // Utilisation de la lettre correspondante pour cet ID de voyage

                    nombre_voyages++;
                    voyagesTotal.textContent = nombre_voyages;

                    nombre_billets += 1;
                    billetsTotal.textContent = nombre_billets;

                    nombre_argent += nouveauPrix;
                    montantTotal.textContent = nombre_argent + "$";

                    let newElement = document.createElement("div");
                    newElement.id = "element_" + voyage.ID_VOYAGE + "_prix" + nouveauPrix;
                    newElement.classList.add("rounded", "px-2", "mt-1", "custom-bg-rvt");
                    newElement.style.height = "50px";

                    let row1 = document.createElement("div");
                    row1.classList.add("row");
                    let col1 = document.createElement("div");
                    col1.classList.add("col");
                    let codeP = document.createElement("p");
                    codeP.classList.add("custom-font-rvt", "m-0", "voyage-code" + voyage.ID_VOYAGE);
                    codeP.textContent = voyageCode;
                    col1.appendChild(codeP);

                    let col2 = document.createElement("div");
                    col2.classList.add("col");
                    col2.style.textAlign = "right";
                    let deleteBtn = document.createElement("button");
                    deleteBtn.classList.add("m-0", "p-0", "delete-btn" + voyage.ID_VOYAGE + "_prix" + nouveauPrix);
                    deleteBtn.style.border = "none";
                    deleteBtn.style.background = "none";
                    deleteBtn.style.color = "white";
                    deleteBtn.style.cssText = `
border: none;
background: none;
color: white;
padding: 0;
margin: 0;
`;
                    deleteBtn.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-lg custom-btn-x" viewBox="0 0 16 16" style="border-radius: 100%;">
<path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" />
</svg>
`;
                    col2.appendChild(deleteBtn);

                    row1.appendChild(col1);
                    row1.appendChild(col2);

                    let row2 = document.createElement("div");
                    row2.classList.add("row");
                    let col3 = document.createElement("div");
                    col3.classList.add("col");
                    let compteurContainer = document.createElement("div");
                    compteurContainer.classList.add("compteur-container");
                    let plusBtn = document.createElement("button");
                    plusBtn.classList.add("text-white", "custom-font-rvt", "plusBtn" + voyage.ID_VOYAGE + "_prix" + nouveauPrix);
                    plusBtn.style.border = "none";
                    plusBtn.style.background = "none";
                    plusBtn.textContent = "+";
                    let input = document.createElement("input");
                    input.classList.add("rounded", "compteurInput" + voyage.ID_VOYAGE + "_prix" + nouveauPrix);
                    input.setAttribute("type", "text");
                    input.setAttribute("value", "1");
                    input.setAttribute("readonly", "true");
                    input.style.width = "23px";
                    input.style.height = "20px";
                    input.style.border = "none";
                    input.style.textAlign = "center";
                    input.style.fontSize = "small";
                    let moinsBtn = document.createElement("button");
                    moinsBtn.classList.add("text-white", "custom-font-rvt", "moinsBtn" + voyage.ID_VOYAGE + "_prix" + nouveauPrix);
                    moinsBtn.style.border = "none";
                    moinsBtn.style.background = "none";
                    moinsBtn.textContent = "-";
                    compteurContainer.appendChild(plusBtn);
                    compteurContainer.appendChild(input);
                    compteurContainer.appendChild(moinsBtn);
                    col3.appendChild(compteurContainer);

                    let col4 = document.createElement("div");
                    col4.classList.add("col");
                    col4.style.textAlign = "right";
                    let prixP = document.createElement("p");
                    prixP.classList.add("custom-font-rvt", "m-0", "voyage-prix");
                    prixP.textContent = voyagePrix.textContent;
                    prixP.setAttribute("id", "prix_voyage_" + voyage.ID_VOYAGE + "_prix" + nouveauPrix);
                    col4.appendChild(prixP);

                    row2.appendChild(col3);
                    row2.appendChild(col4);

                    newElement.appendChild(row1);
                    newElement.appendChild(row2);

                    parentDiv.appendChild(newElement);
                    DeleteVoyagesPanier(voyage.ID_VOYAGE, nouveauPrix);
                    AjouterCompteur(voyage.ID_VOYAGE, nouveauPrix);
                    RetirerCompteur(voyage.ID_VOYAGE, nouveauPrix);

                    // Augmenter la lettre pour le prochain prix
                    lettreCodes[voyage.ID_VOYAGE] = String.fromCharCode(lettreCodes[voyage.ID_VOYAGE].charCodeAt(0) - 4);
                } else {
                    let input = existingElement.querySelector(".compteurInput" + voyage.ID_VOYAGE + "_prix" + nouveauPrix);
                    let valeur = parseInt(input.value);
                    input.value = valeur + 1;

                    nombre_billets++;
                    billetsTotal.textContent = nombre_billets;

                    nombre_argent += nouveauPrix;
                    montantTotal.textContent = nombre_argent + "$";
                }
            });
        });
    });

    function DeleteVoyagesPanier(id, prix) {
        const deleteBtns = document.querySelectorAll(".delete-btn" + id + "_prix" + prix);

        deleteBtns.forEach(function (btn) {
            btn.addEventListener("click", function () {
                let nbreBilletsVoyage = parseInt(btn.closest('.rounded').querySelector('.compteurInput' + id + "_prix" + prix).value);
                let prixVoyage = parseInt(document.getElementById("prix_voyage_" + id + "_prix" + prix).textContent);
                nombre_argent -= prixVoyage * nbreBilletsVoyage;
                montantTotal.textContent = nombre_argent + "$";
                nombre_voyages--;
                voyagesTotal.textContent = nombre_voyages;
                nombre_billets -= nbreBilletsVoyage;
                billetsTotal.textContent = nombre_billets;
                btn.closest('.rounded').remove();

                // Si tous les conteneurs pour cet ID de voyage ont été supprimés, réinitialiser la lettre à "A"
                if (!document.querySelector(".conteneur-panier #element_" + id)) {
                    lettreCodes[id] = 'E';
                }
            });
        });
    }

    function AjouterCompteur(id, prix) {
        const plusBtns = document.querySelectorAll(".plusBtn" + id + "_prix" + prix);
        plusBtns.forEach(function (btn) {
            btn.addEventListener("click", function () {
                let input = this.closest(".row").querySelector(".compteurInput" + id + "_prix" + prix);
                let valeur = parseInt(input.value);
                input.value = valeur + 1;
                nombre_billets++;
                billetsTotal.textContent = nombre_billets;
                nombre_argent += parseInt(document.getElementById("prix_voyage_" + id + "_prix" + prix).textContent);
                montantTotal.textContent = nombre_argent + "$";
            });
        });
    }

    function RetirerCompteur(id, prix) {
        const moinsBtns = document.querySelectorAll(".moinsBtn" + id + "_prix" + prix);
        moinsBtns.forEach(function (btn) {
            btn.addEventListener("click", function () {
                let input = this.closest(".row").querySelector(".compteurInput" + id + "_prix" + prix);
                let valeur = parseInt(input.value);
                if (valeur > 1) {
                    input.value = valeur - 1;
                    nombre_billets--;
                    billetsTotal.textContent = nombre_billets;
                    nombre_argent -= parseInt(document.getElementById("prix_voyage_" + id + "_prix" + prix).textContent);
                    montantTotal.textContent = nombre_argent + "$";
                }
            });
        });
    }
});
