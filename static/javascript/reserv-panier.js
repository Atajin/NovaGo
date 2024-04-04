document.addEventListener("DOMContentLoaded", function () {
    let nombre_voyages = 0;
    let nombre_billets = 0;
    let nombre_argent = 0;
    let prixVoyages = [];

    let voyagesTotal = document.getElementById('nombre_voyages');
    let billetsTotal = document.getElementById('nombre_billets');
    let montantTotal = document.getElementById('nombre_argents');
    voyagesTotal.textContent = nombre_voyages;
    billetsTotal.textContent = nombre_billets;
    montantTotal.textContent = nombre_argent + "$"

    voyagesData.forEach(voyage => {
        let nbre_panier = 0
        const addBtn = document.getElementById("add_btn_" + voyage.ID_VOYAGE);
        addBtn.addEventListener("click", function () {
            let parentDiv = document.querySelector(".conteneur-panier");
            let voyageCode = "Code " + voyage.ID_VOYAGE;
            let voyagePrix = document.getElementById('prix_' + voyage.ID_VOYAGE);
            nbre_panier++;
            nombre_voyages++;
            voyagesTotal.textContent = nombre_voyages;

            nombre_billets += 1;
            billetsTotal.textContent = nombre_billets;

            prixVoyages[nbre_panier] = parseInt(voyagePrix.textContent);

            // Ajout du prix du voyage au montant total
            nombre_argent += prixVoyages[nbre_panier];
            montantTotal.textContent = nombre_argent + "$";

            let newElement = document.createElement("div");
            newElement.classList.add("rounded", "px-2", "mt-1", "custom-bg-rvt");
            newElement.style.height = "50px";

            let row1 = document.createElement("div");
            row1.classList.add("row");
            let col1 = document.createElement("div");
            col1.classList.add("col");
            let codeP = document.createElement("p");
            codeP.classList.add("custom-font-rvt", "m-0", "voyage-code");
            codeP.textContent = voyageCode; // Contenu de l'élément "voyage-code"
            col1.appendChild(codeP);

            let col2 = document.createElement("div");
            col2.classList.add("col");

            // Ajout du style pour aligner le contenu à droite
            col2.style.textAlign = "right";
            // Création du bouton supprimer
            let deleteBtn = document.createElement("button");
            deleteBtn.classList.add("m-0", "p-0", "delete-btn" + voyage.ID_VOYAGE + nbre_panier);
            deleteBtn.style.border = "none";
            deleteBtn.style.background = "none";
            deleteBtn.style.color = "white";

            // Création et ajout du style CSS en ligne pour le bouton supprimer
            deleteBtn.style.cssText = `
border: none;
background: none;
color: white;
padding: 0;
margin: 0;
`;

            // Ajout du contenu SVG pour le bouton supprimer
            deleteBtn.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-lg custom-btn-x" viewBox="0 0 16 16" style="border-radius: 100%;">
<path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" />
</svg>
`;

            col2.appendChild(deleteBtn);


            row1.appendChild(col1);
            row1.appendChild(col2);

            // Création de la deuxième ligne avec les colonnes "col-sm-7" et "col"
            let row2 = document.createElement("div");
            row2.classList.add("row");
            let col3 = document.createElement("div");
            col3.classList.add("col-sm-7");
            let compteurContainer = document.createElement("div");
            compteurContainer.classList.add("compteur-container");
            let plusBtn = document.createElement("button");
            plusBtn.classList.add("text-white", "custom-font-rvt", "plusBtn" + voyage.ID_VOYAGE + nbre_panier);
            plusBtn.style.border = "none";
            plusBtn.style.background = "none";
            plusBtn.textContent = "+";
            let input = document.createElement("input");
            input.classList.add("rounded", "compteurInput" + voyage.ID_VOYAGE + nbre_panier);
            input.setAttribute("type", "text");
            input.setAttribute("value", "1");
            input.setAttribute("readonly", "true");
            input.style.width = "23px";
            input.style.height = "20px";
            input.style.border = "none";
            input.style.textAlign = "center";
            input.style.fontSize = "small";
            let moinsBtn = document.createElement("button");
            moinsBtn.classList.add("text-white", "custom-font-rvt", "moinsBtn" + voyage.ID_VOYAGE + nbre_panier);
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
            prixP.setAttribute("id", "prix_voyage_" + voyage.ID_VOYAGE + "_" + nbre_panier); // Contenu de l'élément "voyage-prix"
            col4.appendChild(prixP);

            row2.appendChild(col3);
            row2.appendChild(col4);

            // Ajout des lignes à l'élément créé
            newElement.appendChild(row1);
            newElement.appendChild(row2);

            parentDiv.appendChild(newElement);
            DeleteVoyagesPanier(voyage.ID_VOYAGE, nbre_panier);
            AjouterCompteur(voyage.ID_VOYAGE, nbre_panier);
            RetirerCompteur(voyage.ID_VOYAGE, nbre_panier);
        });
    });

    function DeleteVoyagesPanier(id, nbre_panier) {
        const deleteBtns = document.querySelectorAll(".delete-btn" + id + nbre_panier);
    
        deleteBtns.forEach(function (btn) {
            btn.addEventListener("click", function () {
                let nbreBilletsVoyage = parseInt(btn.closest('.rounded').querySelector('.compteurInput' + id + nbre_panier).value);
                
                // Récupérer le prix du voyage depuis l'élément correspondant dans le DOM
                let prixVoyage = parseInt(document.getElementById("prix_voyage_" + id + "_" + nbre_panier).textContent);
                
                // Décrémenter le montant total en fonction du nombre de billets pour ce voyage
                nombre_argent -= prixVoyage * nbreBilletsVoyage;
                montantTotal.textContent = nombre_argent + "$";
    
                // Décrémenter le nombre de voyages
                nombre_voyages--;
                voyagesTotal.textContent = nombre_voyages;
    
                // Décrémenter le nombre de billets
                nombre_billets -= nbreBilletsVoyage;
                billetsTotal.textContent = nombre_billets;
    
                // Supprimer l'élément du DOM
                btn.closest('.rounded').remove();
            });
        });
    }    

    // Gestionnaire d'événement pour le bouton "plus"
    function AjouterCompteur(id, nbre_panier) {
        const plusBtns = document.querySelectorAll(".plusBtn" + id + nbre_panier);
        plusBtns.forEach(function (btn) {
            btn.addEventListener("click", function () {
                let input = this.closest(".row").querySelector(".compteurInput" + id + nbre_panier);
                let valeur = parseInt(input.value);
                input.value = valeur + 1;
                nombre_billets += 1;
                billetsTotal.textContent = nombre_billets;

                nombre_argent += parseInt(document.getElementById("prix_voyage_" + id + "_" + nbre_panier).textContent);
                montantTotal.textContent = nombre_argent + "$";
            });
        });
    }

    // Gestionnaire d'événement pour le bouton "moins"
    function RetirerCompteur(id, nbre_panier) {
        const moinsBtns = document.querySelectorAll(".moinsBtn" + id + nbre_panier);

        moinsBtns.forEach(function (btn) {
            btn.addEventListener("click", function () {
                let input = this.closest(".row").querySelector(".compteurInput" + id + nbre_panier);
                let valeur = parseInt(input.value);
                if (valeur > 1) {
                    input.value = valeur - 1;
                    nombre_billets -= 1;
                    billetsTotal.textContent = nombre_billets;

                    nombre_argent -= parseInt(document.getElementById("prix_voyage_" + id + "_" + nbre_panier).textContent);
                    montantTotal.textContent = nombre_argent + "$";
                }
            });
        });
    }
});