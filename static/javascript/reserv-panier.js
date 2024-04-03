document.addEventListener("DOMContentLoaded", function () {
    let nombreDeVoyagesDansPanier = 0;
    const addBtn = document.querySelector(".add-btn");

    addBtn.addEventListener("click", function () {
        let parentDiv = document.querySelector(".conteneur-panier");
        let voyageCode = document.querySelector(".voyage-code");
        let voyagePrix = document.querySelector(".voyage-prix");
        nombreDeVoyagesDansPanier++;

        // Création d'un nouvel élément avec la classe "rounded px-2 mt-1 custom-bg-rvt"
        let newElement = document.createElement("div");
        newElement.classList.add("rounded", "px-2", "mt-1", "custom-bg-rvt");
        newElement.style.height = "50px";

        // Création de la première ligne avec les colonnes "col" et "col-auto"
        let row1 = document.createElement("div");
        row1.classList.add("row");
        let col1 = document.createElement("div");
        col1.classList.add("col");
        let codeP = document.createElement("p");
        codeP.classList.add("custom-font-rvt", "m-0", "voyage-code");
        codeP.textContent = voyageCode.textContent; // Contenu de l'élément "voyage-code"
        col1.appendChild(codeP);

        let col2 = document.createElement("div");
        col2.classList.add("col");

        // Ajout du style pour aligner le contenu à droite
        col2.style.textAlign = "right";
        // Création du bouton supprimer
        let deleteBtn = document.createElement("button");
        deleteBtn.classList.add("m-0", "p-0", "delete-btn");
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
        plusBtn.classList.add("text-white", "custom-font-rvt", "plusBtn");
        plusBtn.style.border = "none";
        plusBtn.style.background = "none";
        plusBtn.textContent = "+";
        let input = document.createElement("input");
        input.classList.add("rounded", "compteurInput");
        input.setAttribute("type", "text");
        input.setAttribute("value", "1");
        input.style.width = "23px";
        input.style.height = "20px";
        input.style.border = "none";
        input.style.textAlign = "center";
        input.style.fontSize = "small";
        let moinsBtn = document.createElement("button");
        moinsBtn.classList.add("text-white", "custom-font-rvt", "moinsBtn");
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
        prixP.textContent = voyagePrix.textContent; // Contenu de l'élément "voyage-prix"
        col4.appendChild(prixP);

        row2.appendChild(col3);
        row2.appendChild(col4);

        // Ajout des lignes à l'élément créé
        newElement.appendChild(row1);
        newElement.appendChild(row2);

        parentDiv.appendChild(newElement);
        DeleteVoyagesPanier();
        AjouterCompteur();
        RetirerCompteur();
    });
});

function DeleteVoyagesPanier() {
    const deleteBtns = document.querySelectorAll(".delete-btn");

    deleteBtns.forEach(function (btn) {
        btn.addEventListener("click", function () {
            btn.closest('.rounded').remove();
        });
    });
}

// Gestionnaire d'événement pour le bouton "plus"
function AjouterCompteur() {
    const plusBtns = document.querySelectorAll(".plusBtn");
    plusBtns.forEach(function (btn) {
        btn.addEventListener("click", function () {
            let input = this.closest(".row").querySelector(".compteurInput");
            let valeur = parseInt(input.value);
            input.value = valeur + 1;
        });
    });
}

// Gestionnaire d'événement pour le bouton "moins"
function RetirerCompteur() {
    const moinsBtns = document.querySelectorAll(".moinsBtn");

    moinsBtns.forEach(function (btn) {
        btn.addEventListener("click", function () {
            let input = this.closest(".row").querySelector(".compteurInput");
            let valeur = parseInt(input.value);
            if (valeur > 1) {
                input.value = valeur - 1;
            }
        });
    });
}